export interface Env {
  BUCKET?: any;
  R2?: any;
  FANSUB_BUCKET?: any;
  MY_BUCKET?: any;
  STORAGE?: any;
  KV?: any;
  FANSUB_KV?: any;
  KV_STORAGE?: any;
  DB?: any;
  mikrokosmos_db?: any;
  D1?: any;
  COMMENTS_DB?: any;
  COMMENTS_D1?: any;
  DB_COMMENTS?: any;
  USERS_DB?: any;
  USERS_D1?: any;
  DB_USERS?: any;
  ASSETS?: any;
  // Cloudflare Email Routing Binding (send_email)
  EMAIL?: any;
  SEB?: any;
  GMAIL_USER?: string;
  GMAIL_APP_PASSWORD?: string;
  RESEND_API_KEY?: string;
  SENDGRID_API_KEY?: string;
  MAIL_FROM?: string;
}

function getR2(env: Env) {
  return env.BUCKET || env.R2 || env.FANSUB_BUCKET || env.MY_BUCKET || env.STORAGE;
}

function getKV(env: Env) {
  return env.KV || env.FANSUB_KV || env.KV_STORAGE;
}

function getDB(env: Env) {
  return env.DB || env.mikrokosmos_db || env.D1;
}

function getCommentsDB(env: Env) {
  return env.COMMENTS_DB || env.COMMENTS_D1 || env.DB_COMMENTS || getDB(env);
}

function getUsersDB(env: Env) {
  return env.USERS_DB || env.USERS_D1 || env.DB_USERS || getDB(env);
}

// Helper memory store for Rate Limiting, OTP Verification & Realtime Analytics
const MEMORY_RATE_LIMIT = new Map<string, { count: number; resetAt: number }>();
const ACTIVE_SESSIONS = new Map<string, number>();
const OTP_STORE = new Map<string, { code: string; expiresAt: number; name?: string; password?: string }>();
let d1SchemaInitPromise: Promise<void> | null = null;
let cachedSeriesResponseJson: string | null = null;
let cachedSeriesExpiresAt = 0;
let cachedCommentsResponseJson: string | null = null;
let cachedCommentsExpiresAt = 0;
let cachedWallpapersResponseJson: string | null = null;
let cachedWallpapersExpiresAt = 0;

let latestNotificationSignal = {
  timestamp: Date.now(),
  latestId: 'init-' + Date.now(),
  count: 1
};

function triggerNotificationSignal(id?: string) {
  latestNotificationSignal = {
    timestamp: Date.now(),
    latestId: id || 'notif-' + Date.now(),
    count: (latestNotificationSignal.count || 0) + 1
  };
  cachedSeriesResponseJson = null;
  cachedSeriesExpiresAt = 0;
}

// Disposable / Fake Email domains blocklist
const DISPOSABLE_EMAIL_DOMAINS = new Set([
  'tempmail.com', '10minutemail.com', 'mailinator.com', 'guerrillamail.com',
  'sharklasers.com', 'yopmail.com', 'trashmail.com', 'trashmail.net',
  'getnada.com', 'dispostable.com', 'fakeinbox.com', 'crazymailing.com',
  'burnermail.io', 'mohmal.com', 'emailondeck.com', 'temp-mail.org',
  'throwawaymail.com', 'maildrop.cc', 'inboxkitten.com', 'generator.email',
  'mytemp.email', 'fakemailgenerator.com', 'tempr.email', 'disposablemail.com',
  'tempmailo.com', 'tempail.com', 'nada.ltd', 'fakemail.net', 'fakemail.com',
  'guerrillamail.info', 'guerrillamail.biz', 'guerrillamail.de', 'guerrillamail.net',
  'guerrillamail.org', 'guerrillamailblock.com', 'pokemail.net', 'spam4.me',
  'trashmail.org', 'trashmail.me', 'trashmail.ws', 'yopmail.fr', 'yopmail.net',
  'cool.fr.nf', 'jetable.fr.nf', 'nospam.ze.tc', 'nomail.xl.cx', 'mega.zik.dj',
  'speed.1s.fr', 'courriel.fr.nf', 'moncourrier.fr.nf', 'monemail.fr.nf',
  'monmail.fr.nf', '10minutemail.net', '10minutemail.org', 'minuteinbox.com',
  'disposable.com', 'throwawayemail.com', 'tempinbox.com', 'crazymail.com'
]);

function isDisposableEmail(email: string): boolean {
  const domain = email.toLowerCase().split('@')[1]?.trim();
  if (!domain) return true;
  return DISPOSABLE_EMAIL_DOMAINS.has(domain);
}

function isValidEmailFormat(email: string): boolean {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email.trim());
}

const EMOJI_REGEX_WORKER = /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2702}-\u{27B0}\u{24C2}-\u{1F251}\u{1F900}-\u{1F9FF}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{FE00}-\u{FE0F}\u{200D}]/gu;

function toCanonicalUsername(raw: string | undefined | null): string {
  if (!raw) return '';
  let str = String(raw).trim();
  if (str.startsWith('@')) str = str.substring(1);
  str = str.replace(EMOJI_REGEX_WORKER, '');
  return str.trim().toLowerCase();
}

async function hashPassword(password: string): Promise<string> {
  const enc = new TextEncoder();
  const salt = "mk_fansub_salt_2026_";
  const data = enc.encode(salt + password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function checkRateLimit(kv: any, key: string, maxLimit = 6, windowSeconds = 60): Promise<{ allowed: boolean; retryAfter?: number }> {
  const now = Date.now();
  if (kv) {
    try {
      const recordStr = await kv.get(`ratelimit:${key}`);
      let record = recordStr ? JSON.parse(recordStr) : { count: 0, resetAt: now + windowSeconds * 1000 };
      if (now > record.resetAt) {
        record = { count: 1, resetAt: now + windowSeconds * 1000 };
      } else {
        record.count += 1;
      }
      await kv.put(`ratelimit:${key}`, JSON.stringify(record), { expirationTtl: windowSeconds });
      if (record.count > maxLimit) {
        return { allowed: false, retryAfter: Math.ceil((record.resetAt - now) / 1000) };
      }
      return { allowed: true };
    } catch (e) {}
  }

  const existing = MEMORY_RATE_LIMIT.get(key);
  if (!existing || now > existing.resetAt) {
    MEMORY_RATE_LIMIT.set(key, { count: 1, resetAt: now + windowSeconds * 1000 });
    return { allowed: true };
  }
  existing.count += 1;
  if (existing.count > maxLimit) {
    return { allowed: false, retryAfter: Math.ceil((existing.resetAt - now) / 1000) };
  }
  return { allowed: true };
}

const ADMIN_EMAILS = new Set(['mikrokosmosfansub@gmail.com', 'aseleliyeva77@gmail.com']);

async function sendGmailSmtpDirect(
  gmailUser: string,
  gmailAppPass: string,
  toEmail: string,
  subject: string,
  htmlContent: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // @ts-ignore
    const { connect } = await import('cloudflare:sockets');
    if (!connect) {
      return { success: false, error: 'cloudflare:sockets not available' };
    }

    const socket = connect(
      { hostname: 'smtp.gmail.com', port: 465 },
      { secureTransport: 'on', allowHalfOpen: false }
    );

    const writer = socket.writable.getWriter();
    const reader = socket.readable.getReader();
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    let buffer = '';

    const readResponse = async (timeoutMs = 5000): Promise<string> => {
      const startTime = Date.now();
      while (Date.now() - startTime < timeoutMs) {
        const lines = buffer.split('\r\n');
        if (lines.length >= 2) {
          const lastLine = lines[lines.length - 2];
          // Check if response ends with standard SMTP 3-digit code followed by space (e.g. 250 OK)
          if (/^\d{3}\s/.test(lastLine)) {
            const result = buffer;
            buffer = lines[lines.length - 1] || '';
            return result;
          }
        }
        const readPromise = reader.read();
        const timeoutPromise = new Promise<{ done: true; value: undefined }>(res => setTimeout(() => res({ done: true, value: undefined }), 3000));
        const res = await Promise.race([readPromise, timeoutPromise]);
        if (res.done && !res.value) break;
        if (res.value) {
          buffer += decoder.decode(res.value, { stream: true });
        }
      }
      return buffer;
    };

    const sendCmd = async (cmd: string): Promise<string> => {
      await writer.write(encoder.encode(cmd + '\r\n'));
      return await readResponse();
    };

    // 1. Read initial banner (220 smtp.gmail.com ESMTP ...)
    await readResponse();

    // 2. EHLO
    await sendCmd('EHLO localhost');

    // 3. AUTH LOGIN
    await sendCmd('AUTH LOGIN');

    // 4. Send base64 username
    await sendCmd(btoa(gmailUser));

    // 5. Send base64 pass (without spaces)
    const cleanPass = gmailAppPass.replace(/\s+/g, '');
    const authRes = await sendCmd(btoa(cleanPass));
    if (!authRes.includes('235')) {
      return { success: false, error: 'Gmail auth failed: ' + authRes };
    }

    // 6. MAIL FROM
    await sendCmd(`MAIL FROM:<${gmailUser}>`);

    // 7. RCPT TO
    const rcptRes = await sendCmd(`RCPT TO:<${toEmail}>`);
    if (!rcptRes.includes('250')) {
      return { success: false, error: 'Gmail rcpt failed: ' + rcptRes };
    }

    // 8. DATA
    await sendCmd('DATA');

    // 9. Send MIME Data
    const encodedSubject = `=?UTF-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`;
    const mimeMsg = [
      `From: "Mikrokosmos Fansub" <${gmailUser}>`,
      `To: <${toEmail}>`,
      `Subject: ${encodedSubject}`,
      `MIME-Version: 1.0`,
      `Content-Type: text/html; charset=UTF-8`,
      `Content-Transfer-Encoding: 8bit`,
      ``,
      htmlContent,
      `.`
    ].join('\r\n');

    const dataRes = await sendCmd(mimeMsg);
    await sendCmd('QUIT');

    try {
      writer.releaseLock();
      reader.releaseLock();
      socket.close();
    } catch (e) {}

    return { success: dataRes.includes('250'), error: dataRes };
  } catch (err: any) {
    return { success: false, error: err?.message || String(err) };
  }
}

async function sendOtpEmailWithCloudflare(
  env: Env,
  toEmail: string,
  otpCode: string,
  mode: 'register' | 'reset' = 'register',
  userName?: string
): Promise<{ sent: boolean; provider: string; error?: string }> {
  const gmailUser = env.GMAIL_USER || 'mikrokosmosfansub@gmail.com';
  const gmailPass = env.GMAIL_APP_PASSWORD || 'gxrq mqep wuee tywy';
  const fromEmail = env.MAIL_FROM || gmailUser;

  const subject = mode === 'register' 
    ? `✨ Mikrokosmos Fansub - Doğrulama Kodunuz: ${otpCode}`
    : `🔒 Mikrokosmos Fansub - Şifre Sıfırlama Kodunuz: ${otpCode}`;

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin:0;padding:0;background-color:#090614;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#ffffff;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#090614;padding:30px 10px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width:520px;background:linear-gradient(180deg, #1b0e34 0%, #0d0722 100%);border:1px solid #7c3aed40;border-radius:24px;overflow:hidden;box-shadow:0 20px 40px rgba(0,0,0,0.8);" cellspacing="0" cellpadding="0">
          <tr>
            <td style="padding:32px 28px;text-align:center;">
              <div style="display:inline-block;padding:8px 16px;background:rgba(124, 58, 237, 0.2);border:1px solid rgba(167, 139, 250, 0.3);border-radius:999px;font-size:12px;font-weight:bold;color:#d8b4fe;margin-bottom:16px;">
                ✨ MIKROKOSMOS FANSUB
              </div>
              <h1 style="margin:0 0 10px;font-size:24px;font-weight:900;color:#ffffff;letter-spacing:-0.5px;">
                ${mode === 'register' ? 'Güvenlik Doğrulaması' : 'Şifre Sıfırlama Talebi'}
              </h1>
              <p style="margin:0 0 24px;font-size:14px;line-height:1.6;color:#c4b5fd;">
                Merhaba${userName ? ' <strong>' + userName + '</strong>' : ''},<br>
                ${mode === 'register' ? 'Mikrokosmos Fansub üyeliğinizi tamamlamak için' : 'Hesabınızın şifresini yenilemek için'} aşağıdaki 6 haneli güvenlik kodunu kullanın:
              </p>

              <!-- OTP CODE BOX -->
              <div style="background:#000000;border:2px dashed #a855f7;border-radius:18px;padding:20px;margin:24px 0;text-align:center;">
                <span style="font-family:monospace,Consolas,Courier;font-size:36px;font-weight:900;letter-spacing:10px;color:#fbbf24;display:inline-block;">
                  ${otpCode}
                </span>
              </div>

              <p style="margin:0 0 20px;font-size:12px;color:#a78bfa;">
                ⏱️ Bu kod <strong>3 dakika</strong> boyunca geçerlidir.
              </p>
              
              <div style="border-top:1px solid rgba(124, 58, 237, 0.2);padding-top:20px;margin-top:20px;">
                <p style="margin:0;font-size:11px;line-height:1.5;color:#8b5cf6;">
                  Eğer bu işlemi siz başlatmadıysanız lütfen bu e-postayı dikkate almayınız.<br>
                  © 2026 Mikrokosmos Fansub. Tüm hakları saklıdır.
                </p>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  // 1. BREVO / SENDINBLUE REST API (Most reliable free transactional HTTP API)
  const brevoApiKey = (env as any).BREVO_API_KEY || (env as any).SENDINBLUE_API_KEY;
  if (brevoApiKey) {
    try {
      const res = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'api-key': brevoApiKey,
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          sender: { name: 'Mikrokosmos Fansub', email: fromEmail },
          to: [{ email: toEmail }],
          subject: subject,
          htmlContent: htmlContent
        })
      });
      if (res.ok) {
        return { sent: true, provider: 'brevo_api' };
      }
    } catch (e: any) {
      console.warn('Brevo API attempt failed:', e);
    }
  }

  // 2. RESEND API
  if (env.RESEND_API_KEY) {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${env.RESEND_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: `Mikrokosmos Fansub <${fromEmail}>`,
          to: [toEmail],
          subject: subject,
          html: htmlContent
        })
      });
      if (res.ok) {
        return { sent: true, provider: 'resend_api' };
      }
    } catch (e) {
      console.warn('Resend API fallback failed:', e);
    }
  }

  // 3. GMAIL SMTP DIRECT DELIVERY (mikrokosmosfansub@gmail.com)
  if (gmailUser && gmailPass) {
    try {
      const gmailResult = await sendGmailSmtpDirect(gmailUser, gmailPass, toEmail, subject, htmlContent);
      if (gmailResult.success) {
        return { sent: true, provider: 'gmail_smtp' };
      }
      console.warn('Direct Gmail SMTP attempt failed:', gmailResult.error);
    } catch (e: any) {
      console.warn('Direct Gmail SMTP attempt failed, falling back:', e);
    }
  }

  // 4. CLOUDFLARE EMAIL ROUTING (send_email binding fallback)
  const emailBinding = env.EMAIL || env.SEB;
  if (emailBinding && typeof emailBinding.send === 'function') {
    try {
      const rawEmail = [
        `From: "Mikrokosmos Fansub" <${fromEmail}>`,
        `To: <${toEmail}>`,
        `Subject: ${subject}`,
        `MIME-Version: 1.0`,
        `Content-Type: text/html; charset=UTF-8`,
        ``,
        htmlContent
      ].join('\r\n');

      await emailBinding.send({
        from: fromEmail,
        to: toEmail,
        raw: rawEmail
      });
      return { sent: true, provider: 'cloudflare_email_routing' };
    } catch (e: any) {
      console.warn('Cloudflare Email Binding fallback failed:', e);
    }
  }

  return { sent: false, provider: 'none', error: 'Could not deliver email via SMTP or REST APIs' };
}

async function sendAdminNotificationEmail(
  env: Env,
  subject: string,
  htmlContent: string
): Promise<{ sent: boolean; provider: string; error?: string }> {
  const targetAdminEmail = 'mikrokosmosfansub@gmail.com';
  const gmailUser = env.GMAIL_USER || 'mikrokosmosfansub@gmail.com';
  const gmailPass = env.GMAIL_APP_PASSWORD || 'gxrq mqep wuee tywy';
  const fromEmail = env.MAIL_FROM || gmailUser;

  // 1. PRIMARY: GMAIL SMTP DIRECT DELIVERY (mikrokosmosfansub@gmail.com)
  if (gmailUser && gmailPass) {
    try {
      const gmailResult = await sendGmailSmtpDirect(gmailUser, gmailPass, targetAdminEmail, subject, htmlContent);
      if (gmailResult.success) {
        return { sent: true, provider: 'gmail_smtp' };
      }
    } catch (e: any) {
      console.warn('Admin report Gmail SMTP attempt failed, falling back:', e);
    }
  }

  // 2. CLOUDFLARE EMAIL ROUTING FALLBACK
  const emailBinding = env.EMAIL || env.SEB;
  if (emailBinding && typeof emailBinding.send === 'function') {
    try {
      const rawEmail = [
        `From: "Mikrokosmos Fansub Bildirim" <${fromEmail}>`,
        `To: <${targetAdminEmail}>`,
        `Subject: ${subject}`,
        `MIME-Version: 1.0`,
        `Content-Type: text/html; charset=UTF-8`,
        ``,
        htmlContent
      ].join('\r\n');

      await emailBinding.send({
        from: fromEmail,
        to: targetAdminEmail,
        raw: rawEmail
      });
      return { sent: true, provider: 'cloudflare_email_routing' };
    } catch (e: any) {
      console.warn('Cloudflare Email Binding fallback failed:', e);
    }
  }

  // 3. RESEND API FALLBACK
  if (env.RESEND_API_KEY) {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${env.RESEND_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: `Mikrokosmos Fansub <${fromEmail}>`,
          to: [targetAdminEmail],
          subject,
          html: htmlContent
        })
      });
      if (res.ok) {
        return { sent: true, provider: 'resend_api' };
      }
    } catch (e) {}
  }

  return { sent: false, provider: 'none', error: 'No email provider succeeded' };
}

export default {
  async fetch(request: Request, env: Env, ctx: any): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    const r2 = getR2(env);
    const kv = getKV(env);
    const db = getDB(env);
    const commentsDb = getCommentsDB(env);
    const usersDb = getUsersDB(env);

    const headers = {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers });
    }

    // 0. ROBOTS.TXT (STRICTLY DISALLOW CHAPTER READING PAGES FOR GOOGLE BOTS)
    if (path === '/robots.txt') {
      const robotsContent = `User-agent: *
Allow: /
Allow: /#/seriler
Allow: /#/kategoriler
Allow: /#/seri/
Allow: /#/a-z
Allow: /#/takvim
Allow: /#/kutuphane

# Disallow reading pages / chapters so Google and search bots don't crawl content chapters
Disallow: /#/oku/
Disallow: /oku/
Disallow: /reader/
Disallow: /chapter/
Disallow: /read/
Disallow: /api/
Disallow: /admin
Disallow: /#/admin

User-agent: Googlebot
Allow: /
Allow: /#/seriler
Allow: /#/kategoriler
Allow: /#/seri/
Allow: /#/a-z
Allow: /#/takvim
Allow: /#/kutuphane

# Strictly disallow Google bots from crawling reading chapters
Disallow: /#/oku/
Disallow: /oku/
Disallow: /reader/
Disallow: /chapter/
Disallow: /read/
Disallow: /api/
Disallow: /admin
Disallow: /#/admin

User-agent: Googlebot-Image
Allow: /
Disallow: /#/oku/
Disallow: /oku/
Disallow: /reader/

Sitemap: https://mikrokosmosfansub.com/sitemap.xml
`;
      return new Response(robotsContent, {
        headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'public, max-age=86400' }
      });
    }

    // 0.1 SITEMAP.XML (INCLUDES HOME & SERIES DETAILS, EXCLUDES CHAPTER READER PAGES)
    if (path === '/sitemap.xml') {
      let seriesList: any[] = [];
      if (false && r2) {
        try {
          const item = await r2.get('data/series.json');
          if (item) seriesList = await item.json();
        } catch (e) {}
      } else if (false && kv) {
        try {
          seriesList = (await kv.get('data/series.json', 'json')) || [];
        } catch (e) {}
      } else if (db) {
        try {
          const { results } = await db.prepare("SELECT id, updated_at FROM series").all();
          seriesList = results || [];
        } catch (e) {}
      }

      const today = new Date().toISOString().split('T')[0];
      let seriesXml = '';
      if (Array.isArray(seriesList) && seriesList.length > 0) {
        seriesXml = seriesList.map(s => `  <url>
    <loc>https://mikrokosmosfansub.com/#/seri/${encodeURIComponent(s.id)}</loc>
    <lastmod>${String(s.updatedAt || s.updated_at || today).slice(0, 10)}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>`).join('\n');
      } else {
        seriesXml = `  <url>
    <loc>https://mikrokosmosfansub.com/#/seri/s-plum</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://mikrokosmosfansub.com/#/seri/s-shadow</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://mikrokosmosfansub.com/#/seri/s-solov</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>`;
      }

      const sitemapContent = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://mikrokosmosfansub.com/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://mikrokosmosfansub.com/#/seriler</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://mikrokosmosfansub.com/#/kategoriler</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://mikrokosmosfansub.com/#/a-z</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>https://mikrokosmosfansub.com/#/takvim</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>https://mikrokosmosfansub.com/#/gelismis-arama</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>
${seriesXml}
</urlset>`;

      return new Response(sitemapContent, {
        headers: { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'public, max-age=3600' }
      });
    }

    if (path.startsWith('/api/')) {
      try {
      // 1. CLOUDFLARE R2 IMAGE UPLOAD & FILE SERVING
      if (path.startsWith('/api/upload/r2') && request.method === 'POST') {
        try {
          const body = await request.json() as any;
          const { image, filename } = body;
          if (!image) {
            return new Response(JSON.stringify({ success: false, message: 'Yüklenecek resim verisi (base64) bulunamadı.' }), { status: 400, headers });
          }

          const cleanFilename = (filename || 'avatar.png').replace(/[^a-zA-Z0-9.-]/g, '_');
          const r2Key = `avatars/${Date.now()}-${cleanFilename}`;

          if (r2) {
            try {
              const base64Data = image.includes('base64,') ? image.split('base64,')[1] : image;
              const binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
              const mimeMatch = image.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,/);
              let detectedContentType = mimeMatch ? mimeMatch[1] : '';
              if (!detectedContentType) {
                const lowerName = cleanFilename.toLowerCase();
                if (lowerName.endsWith('.webp')) detectedContentType = 'image/webp';
                else if (lowerName.endsWith('.gif')) detectedContentType = 'image/gif';
                else if (lowerName.endsWith('.webm')) detectedContentType = 'video/webm';
                else if (lowerName.endsWith('.mp4')) detectedContentType = 'video/mp4';
                else if (lowerName.endsWith('.jpg') || lowerName.endsWith('.jpeg')) detectedContentType = 'image/jpeg';
                else detectedContentType = 'image/png';
              }

              await r2.put(r2Key, binaryData, {
                httpMetadata: {
                  contentType: detectedContentType
                }
              });

              return new Response(JSON.stringify({
                success: true,
                message: 'Profil resminiz Cloudflare R2 bucket deposuna başarıyla yüklendi!',
                url: `/api/r2/file/${encodeURIComponent(r2Key)}`,
                r2Key,
                storage: 'Cloudflare R2 (S3 Object Storage)'
              }), { headers });
            } catch (r2Err: any) {
              console.error('R2 upload failed, falling back:', r2Err);
            }
          }

          // Fallback image url if R2 is not bound
          return new Response(JSON.stringify({
            success: true,
            message: 'Profil resminiz yüklendi.',
            url: image,
            storage: 'Cloudflare R2 Fallback (Base64)'
          }), { headers });
        } catch (e: any) {
          return new Response(JSON.stringify({ success: false, message: 'R2 Yükleme hatası: ' + e.message }), { status: 500, headers });
        }
      }

      if (path.startsWith('/api/r2/file/')) {
        const cleanPath = url.pathname.replace('/api/r2/file/', '');
        const fileKey = decodeURIComponent(cleanPath);

        if (request.method === 'GET') {
          if (r2 && fileKey) {
            try {
              const object = await r2.get(fileKey);
              if (object) {
                const fileHeaders = new Headers();
                object.writeHttpMetadata(fileHeaders);
                fileHeaders.set('etag', object.httpEtag);
                fileHeaders.set('Cache-Control', 'public, max-age=31536000, immutable');
                return new Response(object.body, { headers: fileHeaders });
              }
            } catch (e) {}
          }
          return new Response('File not found in Cloudflare R2 Storage', { status: 404 });
        }

        if (request.method === 'DELETE') {
          if (r2 && fileKey) {
            try {
              await r2.delete(fileKey);
              return new Response(JSON.stringify({ success: true, message: 'Dosya başarıyla silindi.' }), { headers });
            } catch (e: any) {
              return new Response(JSON.stringify({ success: false, message: 'Silme hatası: ' + e.message }), { status: 500, headers });
            }
          }
          return new Response(JSON.stringify({ success: false, message: 'Cloudflare R2 yapılandırılmamış.' }), { status: 500, headers });
        }
      }

      // 2. CLOUDFLARE WORKERS REALTIME ANALYTICS (ONLINE COUNTER)
      if (path.startsWith('/api/analytics/heartbeat') && request.method === 'POST') {
        try {
          const body = await request.json().catch(() => ({})) as any;
          const clientId = body.clientId || body.uid || 'anon-' + Math.random().toString(36).substring(2, 8);
          const now = Date.now();

          if (kv) {
            try {
              await kv.put(`online:${clientId}`, now.toString(), { expirationTtl: 65 });
            } catch (e) {}
          }
          ACTIVE_SESSIONS.set(clientId, now);

          // Clean expired sessions (> 60s)
          for (const [id, ts] of ACTIVE_SESSIONS.entries()) {
            if (now - ts > 60000) ACTIVE_SESSIONS.delete(id);
          }

          const onlineCount = Math.max(18, ACTIVE_SESSIONS.size + 14);
          return new Response(JSON.stringify({
            success: true,
            onlineCount,
            activeStorage: kv ? 'Cloudflare KV Analytics' : 'Cloudflare Workers Analytics'
          }), { headers });
        } catch (e) {
          return new Response(JSON.stringify({ success: true, onlineCount: 22 }), { headers });
        }
      }

      if (path.startsWith('/api/analytics/online') && request.method === 'GET') {
        const now = Date.now();
        for (const [id, ts] of ACTIVE_SESSIONS.entries()) {
          if (now - ts > 60000) ACTIVE_SESSIONS.delete(id);
        }
        const onlineCount = Math.max(18, ACTIVE_SESSIONS.size + 14);
        return new Response(JSON.stringify({ success: true, onlineCount }), { headers });
      }
      // Auto-initialize D1 SQLite tables once per isolate using a shared Promise + batching (only 3 subrequests total)
      if (!d1SchemaInitPromise) {
        d1SchemaInitPromise = (async () => {
          const initTasks: Promise<any>[] = [];

          if (db) {
            initTasks.push(
              db.batch([
                db.prepare(`
                  CREATE TABLE IF NOT EXISTS series (
                    id TEXT PRIMARY KEY,
                    slug TEXT,
                    title TEXT NOT NULL,
                    type TEXT NOT NULL,
                    cover_image TEXT NOT NULL,
                    banner_image TEXT,
                    synopsis TEXT,
                    genres_json TEXT,
                    custom_badges_json TEXT DEFAULT '[]',
                    rating REAL DEFAULT 5.0,
                    status TEXT DEFAULT 'Devam Ediyor',
                    author TEXT,
                    artist TEXT,
                    translator TEXT,
                    release_day TEXT,
                    release_time TEXT,
                    is_hot INTEGER DEFAULT 0,
                    is_new INTEGER DEFAULT 0,
                    is_guncel INTEGER DEFAULT 0,
                    is_18_plus INTEGER DEFAULT 0,
                    is_draft INTEGER DEFAULT 0,
                    release_year TEXT,
                    updated_at TEXT
                  );
                `),
                db.prepare(`
                  CREATE TABLE IF NOT EXISTS chapters (
                    id TEXT PRIMARY KEY,
                    series_id TEXT NOT NULL,
                    chapter_number REAL NOT NULL,
                    title TEXT,
                    published_date TEXT,
                    special_tag TEXT,
                    images_json TEXT,
                    content TEXT,
                    notice TEXT,
                    created_at INTEGER,
                    is_18_plus INTEGER DEFAULT 0
                  );
                `),
                db.prepare(`
                  CREATE TABLE IF NOT EXISTS point_grants (
                    id TEXT PRIMARY KEY,
                    target_email TEXT NOT NULL,
                    amount INTEGER NOT NULL,
                    mode TEXT NOT NULL,
                    note TEXT,
                    admin_email TEXT NOT NULL,
                    created_at TEXT NOT NULL,
                    previous_balance INTEGER DEFAULT 0,
                    new_balance INTEGER DEFAULT 0
                  );
                `),
                db.prepare(`
                  CREATE TABLE IF NOT EXISTS users (
                    uid TEXT PRIMARY KEY,
                    email TEXT UNIQUE NOT NULL,
                    password_hash TEXT,
                    name TEXT NOT NULL,
                    avatar TEXT,
                    provider TEXT DEFAULT 'email',
                    created_at TEXT,
                    last_login TEXT,
                    bio TEXT,
                    role TEXT DEFAULT 'user'
                  );
                `),
                db.prepare(`
                  CREATE TABLE IF NOT EXISTS deleted_users (
                    uid TEXT PRIMARY KEY,
                    email TEXT,
                    name TEXT,
                    deleted_at TEXT
                  );
                `),
                db.prepare(`
                  CREATE TABLE IF NOT EXISTS team_roles (
                    email TEXT PRIMARY KEY,
                    uid TEXT,
                    name TEXT,
                    roles_json TEXT NOT NULL,
                    updated_at TEXT
                  );
                `),
                db.prepare(`
                  CREATE TABLE IF NOT EXISTS user_library (
                    uid TEXT PRIMARY KEY,
                    name TEXT,
                    email TEXT,
                    followed_series TEXT,
                    bookmarks TEXT,
                    reading_history TEXT,
                    notifications TEXT,
                    cosmo_points INTEGER DEFAULT 0,
                    shop_items TEXT,
                    equipped_theme TEXT,
                    equipped_badge TEXT,
                    equipped_badges TEXT,
                    equipped_frame TEXT,
                    reading_lists TEXT,
                    daily_checkin_day INTEGER DEFAULT 0,
                    last_daily_checkin TEXT,
                    claimed_checkin_days TEXT DEFAULT '[]'
                  );
                `),
                db.prepare(`
                  CREATE TABLE IF NOT EXISTS wallpapers (
                    id TEXT PRIMARY KEY,
                    title TEXT,
                    image_url TEXT NOT NULL,
                    series_id TEXT,
                    series_title TEXT,
                    category TEXT DEFAULT 'genel',
                    tags_json TEXT DEFAULT '[]',
                    likes INTEGER DEFAULT 0,
                    downloads INTEGER DEFAULT 0,
                    uploaded_by TEXT,
                    created_at TEXT
                  );
                `),
              ]).catch((e: any) => console.error('Error initializing main DB tables:', e))
            );
            initTasks.push(
              db.prepare(`ALTER TABLE chapters ADD COLUMN is_18_plus INTEGER DEFAULT 0;`).run().catch(() => {})
            );
            initTasks.push(
              db.prepare(`ALTER TABLE series ADD COLUMN custom_badges_json TEXT DEFAULT '[]';`).run().catch(() => {})
            );
            initTasks.push(
              db.prepare(`ALTER TABLE series ADD COLUMN is_draft INTEGER DEFAULT 0;`).run().catch(() => {})
            );
            initTasks.push(
              db.prepare(`ALTER TABLE series ADD COLUMN release_year TEXT;`).run().catch(() => {})
            );
          }

          if (commentsDb) {
            initTasks.push(
              commentsDb.prepare(`
                CREATE TABLE IF NOT EXISTS comments (
                  id TEXT PRIMARY KEY,
                  series_id TEXT NOT NULL,
                  chapter_id TEXT,
                  user_id TEXT NOT NULL,
                  user_name TEXT NOT NULL,
                  user_avatar TEXT,
                  text TEXT NOT NULL,
                  image_url TEXT,
                  parent_id TEXT,
                  is_spoiler INTEGER DEFAULT 0,
                  likes_json TEXT,
                  dislikes_json TEXT,
                  created_at TEXT,
                  equipped_theme TEXT,
                  equipped_badge TEXT,
                  equipped_badges_json TEXT,
                  equipped_frame TEXT,
                  reading_lists TEXT
                );
              `).run().catch((e: any) => console.error('Error initializing Comments DB table:', e))
            );
          }

          if (usersDb) {
            initTasks.push(
              usersDb.batch([
                usersDb.prepare(`
                  CREATE TABLE IF NOT EXISTS point_grants (
                    id TEXT PRIMARY KEY,
                    target_email TEXT NOT NULL,
                    amount INTEGER NOT NULL,
                    mode TEXT NOT NULL,
                    note TEXT,
                    admin_email TEXT NOT NULL,
                    created_at TEXT NOT NULL,
                    previous_balance INTEGER DEFAULT 0,
                    new_balance INTEGER DEFAULT 0
                  );
                `),
                usersDb.prepare(`
                  CREATE TABLE IF NOT EXISTS users (
                    uid TEXT PRIMARY KEY,
                    email TEXT UNIQUE NOT NULL,
                    password_hash TEXT,
                    name TEXT NOT NULL,
                    avatar TEXT,
                    provider TEXT DEFAULT 'email',
                    created_at TEXT,
                    last_login TEXT,
                    bio TEXT,
                    role TEXT DEFAULT 'user'
                  );
                `),
                usersDb.prepare(`
                  CREATE TABLE IF NOT EXISTS deleted_users (
                    uid TEXT PRIMARY KEY,
                    email TEXT,
                    name TEXT,
                    deleted_at TEXT
                  );
                `),
                usersDb.prepare(`
                  CREATE TABLE IF NOT EXISTS team_roles (
                    email TEXT PRIMARY KEY,
                    uid TEXT,
                    name TEXT,
                    roles_json TEXT NOT NULL,
                    updated_at TEXT
                  );
                `),
                usersDb.prepare(`
                  CREATE TABLE IF NOT EXISTS email_verifications (
                    email TEXT PRIMARY KEY,
                    code TEXT NOT NULL,
                    name TEXT,
                    password_hash TEXT,
                    expires_at INTEGER NOT NULL,
                    created_at TEXT
                  );
                `),
                usersDb.prepare(`
                  CREATE TABLE IF NOT EXISTS global_notifications (
                    id TEXT PRIMARY KEY,
                    title TEXT,
                    message TEXT,
                    type TEXT,
                    series_id TEXT,
                    series_title TEXT,
                    chapter_title TEXT,
                    chapter_number REAL,
                    cover_image TEXT,
                    target_user_id TEXT,
                    created_at TEXT
                  );
                `),
                usersDb.prepare(`
                  CREATE TABLE IF NOT EXISTS site_settings (
                    key TEXT PRIMARY KEY,
                    value TEXT
                  );
                `),
                usersDb.prepare(`
                  CREATE TABLE IF NOT EXISTS promo_codes (
                    code TEXT PRIMARY KEY,
                    points INTEGER NOT NULL DEFAULT 100,
                    description TEXT,
                    max_uses INTEGER DEFAULT 0,
                    use_count INTEGER DEFAULT 0,
                    is_active INTEGER DEFAULT 1,
                    created_at TEXT
                  );
                `),
                usersDb.prepare(`
                  CREATE TABLE IF NOT EXISTS user_library (
                    uid TEXT PRIMARY KEY,
                    name TEXT,
                    email TEXT,
                    followed_series TEXT,
                    bookmarks TEXT,
                    reading_history TEXT,
                    notifications TEXT,
                    cosmo_points INTEGER DEFAULT 0,
                    shop_items TEXT,
                    equipped_theme TEXT,
                    equipped_badge TEXT,
                    equipped_badges TEXT,
                    equipped_frame TEXT,
                    reading_lists TEXT,
                    daily_checkin_day INTEGER DEFAULT 0,
                    last_daily_checkin TEXT,
                    claimed_checkin_days TEXT DEFAULT '[]'
                  );
                `),
                usersDb.prepare(`
                  CREATE TABLE IF NOT EXISTS shop_items (
                    id TEXT PRIMARY KEY,
                    name TEXT NOT NULL,
                    category TEXT NOT NULL,
                    theme_type TEXT,
                    price INTEGER NOT NULL,
                    description TEXT,
                    icon TEXT,
                    rarity TEXT,
                    badge_text TEXT,
                    badge_style TEXT,
                    frame_style TEXT,
                    frame_image_url TEXT,
                    frame_scale REAL,
                    frame_offset_y REAL,
                    frame_offset_x REAL,
                    frame_hide_border INTEGER DEFAULT 0,
                    emojis TEXT
                  );
                `),
                usersDb.prepare(`
                  CREATE TABLE IF NOT EXISTS theme_styles (
                    id TEXT PRIMARY KEY,
                    name TEXT NOT NULL,
                    card_class TEXT,
                    avatar_border_class TEXT,
                    name_class TEXT,
                    badge_bg_class TEXT,
                    glow_color TEXT,
                    accent_text TEXT,
                    card_bg_image_url TEXT,
                    effect_overlay TEXT,
                    theme_type TEXT,
                    corner_mascot_url TEXT,
                    corner_mascot_position TEXT,
                    avatar_companion_url TEXT,
                    decorations TEXT,
                    profile_decorations TEXT
                  );
                `),
              ]).catch((e: any) => console.error('Error initializing Users DB table:', e))
            );
          }

          await Promise.all(initTasks);
        })();
      }
      await d1SchemaInitPromise;

        if (path.startsWith('/api/public-profile') && request.method === 'GET') {
          const url = new URL(request.url);
          const uid = url.searchParams.get('uid');
          
          if (!uid) {
            return new Response(JSON.stringify({ success: false, message: 'UID required' }), { status: 400, headers });
          }
          
          const activeDb = usersDb || db;
          if (activeDb) {
            try {
              let userResults;
              try {
                const res = await activeDb.prepare("SELECT uid, name, avatar, created_at, bio FROM users WHERE uid = ?").bind(uid).all();
                userResults = res.results;
              } catch (selectErr) {
                const res = await activeDb.prepare("SELECT uid, name, avatar, created_at FROM users WHERE uid = ?").bind(uid).all();
                userResults = res.results;
              }
              if (!userResults || userResults.length === 0) {
                return new Response(JSON.stringify({ success: false, message: 'User not found' }), { status: 404, headers });
              }
              const user = userResults[0];
              
              const { results: libResults } = await activeDb.prepare("SELECT cosmo_points, equipped_theme, equipped_badge, equipped_badges, equipped_frame, reading_lists, reading_history, shop_items, followed_series, bookmarks FROM user_library WHERE uid = ?").bind(uid).all();
              const lib = libResults && libResults.length > 0 ? libResults[0] : {};
              
              return new Response(JSON.stringify({
                success: true,
                profile: {
                  uid: user.uid,
                  name: user.name,
                  avatar: user.avatar,
                  bio: user.bio || '',
                  createdAt: user.created_at,
                  coins: lib.cosmo_points || 0,
                  equippedTheme: lib.equipped_theme || null,
                  equippedBadge: lib.equipped_badge || null,
                  equippedBadges: lib.equipped_badges ? JSON.parse(lib.equipped_badges) : [],
                  equippedFrame: lib.equipped_frame || null,
                  inventory: lib.shop_items ? JSON.parse(lib.shop_items) : [],
                  readingLists: lib.reading_lists ? JSON.parse(lib.reading_lists) : [],
                  readingHistory: lib.reading_history ? JSON.parse(lib.reading_history) : {},
                  followedSeriesIds: lib.followed_series ? JSON.parse(lib.followed_series) : [],
                  bookmarks: lib.bookmarks ? JSON.parse(lib.bookmarks) : {},
                  }
              }), { headers });
            } catch (e: any) {
              return new Response(JSON.stringify({ success: false, message: e.message }), { status: 500, headers });
            }
          }
        }

                // D1 Database Stats API
        if (path === '/api/admin/d1_count' && request.method === 'GET') {
          if (db) {
            try {
              const [sCountRes, chCountRes] = await Promise.all([
                db.prepare("SELECT COUNT(*) as cnt FROM series").first(),
                db.prepare("SELECT COUNT(*) as cnt FROM chapters").first()
              ]);
              return new Response(JSON.stringify({
                success: true,
                seriesCount: (sCountRes as any)?.cnt || 0,
                chaptersCount: (chCountRes as any)?.cnt || 0
              }), { headers });
            } catch (e: any) {
              return new Response(JSON.stringify({ success: false, error: e.message }), { headers, status: 500 });
            }
          }
          return new Response(JSON.stringify({ success: false, message: 'D1 not bound' }), { headers });
        }

        // LIGHTWEIGHT NOTIFICATION SIGNAL API (0 D1 Reads!)
        if (path.startsWith('/api/notifications/signal')) {
          return new Response(JSON.stringify({
            success: true,
            signal: latestNotificationSignal
          }), {
            headers: {
              ...headers,
              'Cache-Control': 'public, max-age=10, s-maxage=20'
            }
          });
        }

        // SERIES API
        if (path.startsWith('/api/series')) {
          if (request.method === 'GET') {
            // Priority 1: Cloudflare R2 Bucket
            if (false && r2) {
              try {
                const item = await r2.get('data/series.json');
                const data = item ? await item.json() : [];
                return new Response(JSON.stringify({ success: true, storage: 'R2', data }), { headers });
              } catch (e: any) {
                return new Response(JSON.stringify({ success: false, storage: 'R2', error: e.message }), { headers });
              }
            }

            // Priority 2: Cloudflare KV
            if (false && kv) {
              try {
                const data = (await kv.get('data/series.json', 'json')) || [];
                return new Response(JSON.stringify({ success: true, storage: 'KV', data }), { headers });
              } catch (e: any) {
                return new Response(JSON.stringify({ success: false, storage: 'KV', error: e.message }), { headers });
              }
            }

            const targetSeriesId = url.searchParams.get('seriesId');
            const now = Date.now();

            // FAST PATH 1: Serve full series list from in-memory Worker cache (0 D1 row reads!)
            if (!targetSeriesId && cachedSeriesResponseJson && now < cachedSeriesExpiresAt) {
              return new Response(cachedSeriesResponseJson, {
                headers: {
                  ...headers,
                  'Cache-Control': 'public, max-age=120, s-maxage=300, stale-while-revalidate=600'
                }
              });
            }

            const hasTimestampBust = Boolean(url.searchParams.get('_t'));

            // FAST PATH 2: Serve single series/chapter query from in-memory Worker cache ONLY if chapters have images and no bust was requested
            if (targetSeriesId && cachedSeriesResponseJson && !hasTimestampBust) {
              try {
                const parsedCache = JSON.parse(cachedSeriesResponseJson);
                if (parsedCache && Array.isArray(parsedCache.data)) {
                  const matchedSeries = parsedCache.data.find(
                    (s: any) => s.id === targetSeriesId || s.slug === targetSeriesId
                  );
                  if (
                    matchedSeries &&
                    Array.isArray(matchedSeries.chapters) &&
                    matchedSeries.chapters.length > 0 &&
                    matchedSeries.chapters.some((c: any) => (Array.isArray(c.images) && c.images.length > 0) || c.content)
                  ) {
                    return new Response(
                      JSON.stringify({
                        success: true,
                        storage: 'Cache',
                        seriesId: targetSeriesId,
                        chapters: matchedSeries.chapters
                      }),
                      { headers: { ...headers, 'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0' } }
                    );
                  }
                }
              } catch (eCache) {}
            }

            // Priority: Cloudflare D1 SQL Database (with Fail-Safe Try/Catch)
            if (db) {
              try {
                if (targetSeriesId) {
                  const chRows = await db
                    .prepare(`
                      SELECT * FROM chapters 
                      WHERE series_id = ? 
                         OR series_id = (SELECT id FROM series WHERE slug = ? OR id = ?)
                         OR series_id = (SELECT slug FROM series WHERE id = ? OR slug = ?)
                      ORDER BY CAST(chapter_number AS REAL) ASC
                    `)
                    .bind(targetSeriesId, targetSeriesId, targetSeriesId, targetSeriesId, targetSeriesId)
                    .all();
                  const seriesChapters = ((chRows?.results || []) as any[]).map((ch: any) => {
                    let parsedImages: any[] = [];
                    if (ch.images_json) {
                      try {
                        parsedImages = typeof ch.images_json === 'string' ? JSON.parse(ch.images_json) : ch.images_json;
                      } catch {
                        parsedImages = String(ch.images_json).split(/[\n,]+/).map((s: string) => s.trim()).filter(Boolean);
                      }
                    }
                    return {
                      id: ch.id,
                      number: ch.chapter_number,
                      title: ch.title,
                      publishedDate: ch.published_date,
                      specialTag: ch.special_tag,
                      is18Plus: Boolean(ch.is_18_plus),
                      images: Array.isArray(parsedImages) ? parsedImages : [parsedImages].filter(Boolean),
                      content: ch.content,
                      notice: ch.notice,
                      createdAt: ch.created_at
                    };
                  });
                  return new Response(
                    JSON.stringify({
                      success: true,
                      storage: 'D1',
                      seriesId: targetSeriesId,
                      chapters: seriesChapters
                    }),
                    { headers: { ...headers, 'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0' } }
                  );
                }

                const activeDb = usersDb || db;
                const [seriesRes, chaptersRes, setResObj, notifResObj] = await Promise.all([
                  db.prepare("SELECT * FROM series").all(),
                  db.prepare("SELECT id, series_id, chapter_number, title, published_date, special_tag, images_json, is_18_plus, content, notice, created_at FROM chapters").all(),
                  activeDb.prepare("SELECT * FROM site_settings WHERE key IN ('announcement', 'ad_settings', 'site_branding', 'reactions', 'coin_package_urls')").all().catch(() => ({ results: [] })),
                  activeDb.prepare("SELECT * FROM global_notifications ORDER BY created_at DESC LIMIT 60").all().catch(() => ({ results: [] }))
                ]);

                const series = seriesRes?.results || [];
                const chapters = chaptersRes?.results || [];

                // Group chapters by series_id in O(N) using a Map
                const chaptersBySeries = new Map<string, any[]>();
                for (const ch of chapters as any[]) {
                  const sid = ch.series_id;
                  let list = chaptersBySeries.get(sid);
                  if (!list) {
                    list = [];
                    chaptersBySeries.set(sid, list);
                  }
                  list.push({
                    id: ch.id,
                    number: ch.chapter_number,
                    title: ch.title,
                    publishedDate: ch.published_date,
                    specialTag: ch.special_tag,
                    is18Plus: Boolean(ch.is_18_plus),
                    images: ch.images_json ? JSON.parse(ch.images_json) : [],
                    content: ch.content,
                    notice: ch.notice,
                    createdAt: ch.created_at
                  });
                }

                const fullSeries = (series as any[]).map((s: any) => ({
                  id: s.id,
                  slug: s.slug || s.id,
                  title: s.title,
                  type: s.type,
                  coverImage: s.cover_image,
                  bannerImage: s.banner_image,
                  synopsis: s.synopsis,
                  genres: s.genres_json ? JSON.parse(s.genres_json) : [],
                  customBadges: s.custom_badges_json ? (typeof s.custom_badges_json === 'string' ? JSON.parse(s.custom_badges_json) : s.custom_badges_json) : [],
                  rating: s.rating,
                  status: s.status,
                  author: s.author,
                  artist: s.artist,
                  translator: s.translator,
                  releaseDay: s.release_day,
                  releaseTime: s.release_time,
                  releaseYear: s.release_year || s.releaseYear || undefined,
                  isHot: Boolean(s.is_hot),
                  isNew: Boolean(s.is_new),
                  isGuncel: Boolean(s.is_guncel),
                  is18Plus: Boolean(s.is_18_plus),
                  isDraft: Boolean(s.is_draft),
                  updatedAt: s.updated_at,
                  chapters: (() => {
                    const byId = chaptersBySeries.get(s.id) || [];
                    const bySlug = (s.slug && s.slug !== s.id) ? (chaptersBySeries.get(s.slug) || []) : [];
                    if (bySlug.length === 0) return byId;
                    const merged = [...byId];
                    for (const ch of bySlug) {
                      if (!merged.some(m => m.id === ch.id || m.number === ch.number)) {
                        merged.push(ch);
                      }
                    }
                    return merged;
                  })()
                }));

                let announcement = null;
                let adSettings = null;
                let siteBranding = null;
                let reactions = null;
                let coinPackageUrls = null;
                let globalNotifications: any[] = [];
                try {
                  const setRes = setResObj?.results || [];
                  for (const row of setRes as any[]) {
                    if (row.key === 'announcement' && row.value) announcement = JSON.parse(row.value);
                    if (row.key === 'ad_settings' && row.value) adSettings = JSON.parse(row.value);
                    if (row.key === 'site_branding' && row.value) siteBranding = JSON.parse(row.value);
                    if (row.key === 'reactions' && row.value) reactions = JSON.parse(row.value);
                    if (row.key === 'coin_package_urls' && row.value) coinPackageUrls = JSON.parse(row.value);
                  }
                  const notifRes = notifResObj?.results || [];
                  globalNotifications = (notifRes as any[]).map((n: any) => ({
                    id: n.id, title: n.title, message: n.message, type: n.type,
                    seriesId: n.series_id, seriesTitle: n.series_title, chapterTitle: n.chapter_title,
                    chapterNumber: n.chapter_number, coverImage: n.cover_image,
                    targetUserId: n.target_user_id || undefined,
                    createdAt: n.created_at
                  }));
                } catch(e) {}

                const responseBody = JSON.stringify({
                  success: true,
                  storage: 'D1',
                  data: fullSeries,
                  announcement,
                  adSettings,
                  siteBranding,
                  reactions,
                  coinPackageUrls,
                  globalNotifications
                });
                cachedSeriesResponseJson = responseBody;
                cachedSeriesExpiresAt = Date.now() + 300000; // 5 mins cache

                // Sync KV in background as extra backup
                if (kv) {
                  kv.put('data/series_full_cache.json', responseBody).catch(() => {});
                }

                return new Response(responseBody, {
                  headers: {
                    ...headers,
                    'Cache-Control': 'public, max-age=120, s-maxage=300, stale-while-revalidate=600'
                  }
                });
              } catch (d1Err: any) {
                console.warn('D1 Query Error or Quota Blocked:', d1Err?.message);
              }
            }

            // FALLBACK PATH: If D1 is blocked by Cloudflare daily limit, serve from stale memory or KV/R2!
            if (cachedSeriesResponseJson) {
              return new Response(cachedSeriesResponseJson, {
                headers: {
                  ...headers,
                  'Cache-Control': 'public, max-age=60, s-maxage=180'
                }
              });
            }

            if (kv) {
              try {
                const kvCache = await kv.get('data/series_full_cache.json');
                if (kvCache) {
                  return new Response(kvCache, { headers });
                }
                const data = (await kv.get('data/series.json', 'json')) || [];
                return new Response(JSON.stringify({ success: true, storage: 'KV', data }), { headers });
              } catch (e: any) {}
            }

            if (r2) {
              try {
                const item = await r2.get('data/series.json');
                const data = item ? await item.json() : [];
                return new Response(JSON.stringify({ success: true, storage: 'R2', data }), { headers });
              } catch (e: any) {}
            }

            return new Response(JSON.stringify({
              success: false,
              message: 'Cloudflare D1 günlük okuma limiti doldu ve önbellek bulunamadı. Lütfen daha sonra tekrar deneyiniz.'
            }), { headers });
          }

          if (request.method === 'POST') {
            triggerNotificationSignal();
            const body: any = await request.json();
            const seriesListInput = Array.isArray(body.seriesList)
              ? body.seriesList
              : body.series
              ? [body.series]
              : [];

            if (seriesListInput.length === 0) {
              return new Response(JSON.stringify({ error: 'Series object or seriesList required' }), { status: 400, headers });
            }

            // Priority 1: Cloudflare R2 Bucket
            if (false && r2) {
              try {
                let existingList: any[] = [];
                const item = await r2.get('data/series.json');
                if (item) {
                  existingList = await item.json();
                }
                const seriesMap = new Map<string, any>();
                existingList.forEach((s: any) => seriesMap.set(s.id, s));
                seriesListInput.forEach((s: any) => seriesMap.set(s.id, s));
                const mergedList = Array.from(seriesMap.values());

                await r2.put('data/series.json', JSON.stringify(mergedList), {
                  httpMetadata: { contentType: 'application/json' }
                });

                return new Response(JSON.stringify({
                  success: true,
                  storage: 'R2',
                  count: seriesListInput.length,
                  total: mergedList.length,
                  message: 'Seriler Cloudflare R2 Depolamasına Başarıyla Kaydedildi!'
                }), { headers });
              } catch (e: any) {
                return new Response(JSON.stringify({ success: false, error: e.message }), { status: 500, headers });
              }
            }

            // Priority 2: Cloudflare KV
            if (false && kv) {
              try {
                let existingList: any[] = (await kv.get('data/series.json', 'json')) || [];
                const seriesMap = new Map<string, any>();
                existingList.forEach((s: any) => seriesMap.set(s.id, s));
                seriesListInput.forEach((s: any) => seriesMap.set(s.id, s));
                const mergedList = Array.from(seriesMap.values());

                await kv.put('data/series.json', JSON.stringify(mergedList));

                return new Response(JSON.stringify({
                  success: true,
                  storage: 'KV',
                  count: seriesListInput.length,
                  total: mergedList.length,
                  message: 'Seriler Cloudflare KV Depolamasına Başarıyla Kaydedildi!'
                }), { headers });
              } catch (e: any) {
                return new Response(JSON.stringify({ success: false, error: e.message }), { status: 500, headers });
              }
            }

            // Priority 3: Cloudflare D1 SQL Database
            if (db) {
              const statements: any[] = [];

              for (const s of seriesListInput) {
                statements.push(
                  db.prepare(`
                    INSERT OR REPLACE INTO series (
                      id, slug, title, type, cover_image, banner_image, synopsis, genres_json, custom_badges_json,
                      rating, status, author, artist, translator, release_day, release_time, release_year,
                      is_hot, is_new, is_guncel, is_18_plus, is_draft, updated_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                  `).bind(
                    s.id, s.slug || s.id, s.title, s.type, s.coverImage, s.bannerImage || '',
                    s.synopsis || '', JSON.stringify(s.genres || []), JSON.stringify(s.customBadges || []), s.rating || 5.0,
                    s.status || 'Devam Ediyor', s.author || '', s.artist || '', s.translator || '',
                    s.releaseDay || 'Pazartesi', s.releaseTime || '', s.releaseYear || '', s.isHot ? 1 : 0,
                    s.isNew ? 1 : 0, s.isGuncel ? 1 : 0, s.is18Plus ? 1 : 0, s.isDraft ? 1 : 0, s.updatedAt || new Date().toISOString()
                  )
                );

                if (Array.isArray(s.chapters)) {
                  for (const ch of s.chapters) {
                    statements.push(
                      db.prepare(`
                        INSERT INTO chapters (
                          id, series_id, chapter_number, title, published_date, special_tag,
                          images_json, content, notice, created_at, is_18_plus
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                        ON CONFLICT(id) DO UPDATE SET
                          series_id = excluded.series_id,
                          chapter_number = excluded.chapter_number,
                          title = excluded.title,
                          published_date = excluded.published_date,
                          special_tag = excluded.special_tag,
                          images_json = excluded.images_json,
                          content = excluded.content,
                          notice = excluded.notice,
                          created_at = excluded.created_at,
                          is_18_plus = excluded.is_18_plus
                      `).bind(
                        ch.id, s.id, ch.number, ch.title || '', ch.publishedDate || '',
                        ch.specialTag || '', JSON.stringify(ch.images || []), ch.content || '',
                        ch.notice || '', ch.createdAt || Date.now(), ch.is18Plus ? 1 : 0
                      )
                    );
                  }
                }
              }

              const BATCH_SIZE = 50;
              for (let i = 0; i < statements.length; i += BATCH_SIZE) {
                const chunk = statements.slice(i, i + BATCH_SIZE);
                try {
                  await db.batch(chunk);
                } catch (batchErr: any) {
                  // Fallback: schema check and execute individually so not a single chapter is lost
                  await db.prepare(`ALTER TABLE chapters ADD COLUMN is_18_plus INTEGER DEFAULT 0;`).run().catch(() => {});
                  await db.prepare(`ALTER TABLE series ADD COLUMN custom_badges_json TEXT DEFAULT '[]';`).run().catch(() => {});
                  await db.prepare(`ALTER TABLE series ADD COLUMN is_draft INTEGER DEFAULT 0;`).run().catch(() => {});
                  for (const stmt of chunk) {
                    try {
                      await stmt.run();
                    } catch (singleErr) {
                      // Skip malformed row safely
                    }
                  }
                }
              }

              cachedSeriesResponseJson = null;
              cachedSeriesExpiresAt = 0;

              return new Response(JSON.stringify({
                success: true,
                storage: 'D1',
                count: seriesListInput.length,
                message: 'Seriler Cloudflare D1 Veritabanına Kaydedildi'
              }), { headers });
            }

            return new Response(JSON.stringify({
              success: false,
              message: 'Cloudflare Binding missing in environment. Please attach an R2 Bucket, KV Namespace, or D1 Database in Cloudflare Dashboard.'
            }), { status: 500, headers });
          }

          if (request.method === 'DELETE') {
            const seriesId = url.searchParams.get('id') || url.searchParams.get('seriesId');
            const chapterId = url.searchParams.get('chapterId');
            if (db && chapterId) {
              await db.prepare("DELETE FROM chapters WHERE id = ?").bind(chapterId).run();
              cachedSeriesResponseJson = null;
              cachedSeriesExpiresAt = 0;
              return new Response(JSON.stringify({ success: true, storage: 'D1', message: 'Bölüm Cloudflare D1 veritabanından silindi' }), { headers });
            }

            if (false && r2) {
              if (seriesId) {
                const item = await r2.get('data/series.json');
                let existingList: any[] = item ? await item.json() : [];
                existingList = existingList.filter((s: any) => s.id !== seriesId);
                await r2.put('data/series.json', JSON.stringify(existingList), {
                  httpMetadata: { contentType: 'application/json' }
                });
              }
              return new Response(JSON.stringify({ success: true, storage: 'R2', message: 'Seri Cloudflare R2 deposundan silindi' }), { headers });
            }

            if (false && kv) {
              if (seriesId) {
                let existingList: any[] = (await kv.get('data/series.json', 'json')) || [];
                existingList = existingList.filter((s: any) => s.id !== seriesId);
                await kv.put('data/series.json', JSON.stringify(existingList));
              }
              return new Response(JSON.stringify({ success: true, storage: 'KV', message: 'Seri Cloudflare KV deposundan silindi' }), { headers });
            }

            if (db && seriesId) {
              await db.prepare("DELETE FROM chapters WHERE series_id = ?").bind(seriesId).run();
              await db.prepare("DELETE FROM series WHERE id = ?").bind(seriesId).run();
              cachedSeriesResponseJson = null;
              cachedSeriesExpiresAt = 0;
              return new Response(JSON.stringify({ success: true, storage: 'D1', message: 'Seri Cloudflare D1 deposundan silindi' }), { headers });
            }

            return new Response(JSON.stringify({ success: true }), { headers });
          }
        }

        // COMMENTS API
        if (path.startsWith('/api/comments')) {
          if (path === '/api/comments/report' && request.method === 'POST') {
            try {
              const payload: any = await request.json();
              const {
                commentId,
                commentText,
                commentAuthorName,
                commentAuthorId,
                commentDate,
                commentImageUrl,
                seriesId,
                seriesTitle,
                chapterId,
                chapterTitle,
                reason,
                details,
                reporterName,
                reporterEmail,
                pageUrl
              } = payload || {};

              const escapeHtml = (str: any) =>
                String(str ?? '')
                  .replace(/&/g, '&amp;')
                  .replace(/</g, '&lt;')
                  .replace(/>/g, '&gt;')
                  .replace(/"/g, '&quot;');

              const isIssueReport =
                payload?.reportCategory === 'issue' ||
                String(commentId || '').startsWith('GENEL-SORUN-');

              const subject = isIssueReport
                ? `🛠️ [Sorun Bildirimi] ${seriesTitle || seriesId || 'Genel Site Bildirimi'} - ${reason || 'Teknik Sorun'}`
                : `🚨 [Yorum Şikayeti] ${seriesTitle || seriesId || 'Mikrokosmos'} - ${commentAuthorName || 'Kullanıcı'}`;
              const directLink = pageUrl || (chapterId
                ? `https://mikrokosmosfansub.com/#/oku/${encodeURIComponent(seriesId || '')}/${encodeURIComponent(chapterId)}`
                : seriesId
                ? `https://mikrokosmosfansub.com/#/seri/${encodeURIComponent(seriesId || '')}`
                : `https://mikrokosmosfansub.com/`);

              const htmlContent = isIssueReport
                ? `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${escapeHtml(subject)}</title>
</head>
<body style="margin:0;padding:0;background-color:#090614;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#ffffff;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#090614;padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width:600px;background:linear-gradient(180deg, #1b0e34 0%, #0d0722 100%);border:1px solid #f59e0b60;border-radius:20px;overflow:hidden;box-shadow:0 16px 36px rgba(0,0,0,0.85);" cellspacing="0" cellpadding="0">
          <tr>
            <td style="padding:28px 24px;">
              <div style="display:inline-block;padding:6px 14px;background:rgba(245,158,11,0.2);border:1px solid rgba(245,158,11,0.45);border-radius:999px;font-size:12px;font-weight:bold;color:#fcd34d;margin-bottom:14px;">
                🛠️ TEKNİK / BÖLÜM SORUN BİLDİRİMİ
              </div>
              <h2 style="margin:0 0 8px;font-size:20px;font-weight:800;color:#ffffff;">
                Sitede Bir Sorun Rapor Edildi
              </h2>
              <p style="margin:0 0 20px;font-size:13px;color:#c4b5fd;">
                Bir okuyucu <strong>Sorun Bildir</strong> formu üzerinden <strong>mikrokosmosfansub@gmail.com</strong> adresine aşağıdaki hata/sorun raporunu iletti:
              </p>

              <!-- ISSUE DESCRIPTION BOX -->
              <div style="background:#120924;border-left:4px solid #f59e0b;border-radius:12px;padding:16px;margin-bottom:18px;">
                <div style="font-size:11px;color:#fbbf24;font-weight:bold;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:6px;">
                  📝 Bildirilen Sorun Açıklaması:
                </div>
                <div style="font-size:15px;line-height:1.6;color:#f3f4f6;white-space:pre-wrap;word-break:break-word;background:#090514;padding:12px;border-radius:8px;border:1px solid rgba(255,255,255,0.08);">
                  ${escapeHtml(details || commentText || '(Açıklama yok)')}
                </div>
              </div>

              <!-- DETAILS TABLE -->
              <table width="100%" cellspacing="0" cellpadding="8" style="background:#0d071b;border:1px solid rgba(168,85,247,0.25);border-radius:12px;font-size:13px;color:#e5e7eb;margin-bottom:20px;">
                <tr>
                  <td style="color:#a78bfa;font-weight:bold;width:150px;border-bottom:1px solid rgba(255,255,255,0.06);">Sorun Türü:</td>
                  <td style="color:#fcd34d;font-weight:bold;border-bottom:1px solid rgba(255,255,255,0.06);">${escapeHtml(reason || 'Belirtilmedi')}</td>
                </tr>
                <tr>
                  <td style="color:#a78bfa;font-weight:bold;border-bottom:1px solid rgba(255,255,255,0.06);">İlgili Seri:</td>
                  <td style="border-bottom:1px solid rgba(255,255,255,0.06);"><strong>${escapeHtml(seriesTitle || seriesId || 'Genel Site Bildirimi')}</strong></td>
                </tr>
                <tr>
                  <td style="color:#a78bfa;font-weight:bold;border-bottom:1px solid rgba(255,255,255,0.06);">Bölüm / Konum:</td>
                  <td style="border-bottom:1px solid rgba(255,255,255,0.06);">${escapeHtml(chapterTitle || 'Belirtilmedi')}</td>
                </tr>
                <tr>
                  <td style="color:#a78bfa;font-weight:bold;border-bottom:1px solid rgba(255,255,255,0.06);">Bildiren Okuyucu:</td>
                  <td style="border-bottom:1px solid rgba(255,255,255,0.06);">${escapeHtml(reporterName || commentAuthorName || 'Ziyaretçi / Misafir')} ${reporterEmail ? `(${escapeHtml(reporterEmail)})` : ''}</td>
                </tr>
                <tr>
                  <td style="color:#a78bfa;font-weight:bold;">Rapor ID & Tarih:</td>
                  <td style="font-family:monospace;font-size:12px;">${escapeHtml(commentId || '-')} • ${escapeHtml(commentDate || '-')}</td>
                </tr>
              </table>

              <div style="text-align:center;margin-top:18px;">
                <a href="${escapeHtml(directLink)}" style="display:inline-block;padding:12px 24px;background:linear-gradient(90deg,#9333ea,#db2777);color:#ffffff;text-decoration:none;font-weight:bold;font-size:13px;border-radius:12px;">
                  🔗 İlgili Sayfaya Git ve İncele
                </a>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`.trim()
                : `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${escapeHtml(subject)}</title>
</head>
<body style="margin:0;padding:0;background-color:#090614;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#ffffff;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#090614;padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width:600px;background:linear-gradient(180deg, #1b0e34 0%, #0d0722 100%);border:1px solid #ef444460;border-radius:20px;overflow:hidden;box-shadow:0 16px 36px rgba(0,0,0,0.85);" cellspacing="0" cellpadding="0">
          <tr>
            <td style="padding:28px 24px;">
              <div style="display:inline-block;padding:6px 14px;background:rgba(239,68,68,0.2);border:1px solid rgba(239,68,68,0.4);border-radius:999px;font-size:12px;font-weight:bold;color:#fca5a5;margin-bottom:14px;">
                🚨 YORUM ŞİKAYET BİLDİRİMİ
              </div>
              <h2 style="margin:0 0 8px;font-size:20px;font-weight:800;color:#ffffff;">
                Sitede Bir Yorum Rapor Edildi
              </h2>
              <p style="margin:0 0 20px;font-size:13px;color:#c4b5fd;">
                Aşağıdaki yorum bir okuyucu tarafından incelenmesi için <strong>mikrokosmosfansub@gmail.com</strong> adresine bildirildi:
              </p>

              <!-- REPORTED COMMENT BOX -->
              <div style="background:#120924;border-left:4px solid #ef4444;border-radius:12px;padding:16px;margin-bottom:18px;">
                <div style="font-size:11px;color:#f87171;font-weight:bold;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:6px;">
                  💬 Şikayet Edilen Yorum Metni:
                </div>
                <div style="font-size:15px;line-height:1.6;color:#f3f4f6;white-space:pre-wrap;word-break:break-word;background:#090514;padding:12px;border-radius:8px;border:1px solid rgba(255,255,255,0.08);">
                  ${escapeHtml(commentText || '(Metin yok)')}
                </div>
                ${commentImageUrl ? `<div style="margin-top:10px;font-size:12px;color:#93c5fd;">📎 Ekli Görsel: <a href="${escapeHtml(commentImageUrl)}" style="color:#60a5fa;">${escapeHtml(commentImageUrl)}</a></div>` : ''}
              </div>

              <!-- DETAILS TABLE -->
              <table width="100%" cellspacing="0" cellpadding="8" style="background:#0d071b;border:1px solid rgba(168,85,247,0.25);border-radius:12px;font-size:13px;color:#e5e7eb;margin-bottom:20px;">
                <tr>
                  <td style="color:#a78bfa;font-weight:bold;width:150px;border-bottom:1px solid rgba(255,255,255,0.06);">Şikayet Nedeni:</td>
                  <td style="color:#fca5a5;font-weight:bold;border-bottom:1px solid rgba(255,255,255,0.06);">${escapeHtml(reason || 'Belirtilmedi')}</td>
                </tr>
                ${details ? `
                <tr>
                  <td style="color:#a78bfa;font-weight:bold;border-bottom:1px solid rgba(255,255,255,0.06);">Ek Açıklama:</td>
                  <td style="color:#f3f4f6;border-bottom:1px solid rgba(255,255,255,0.06);">${escapeHtml(details)}</td>
                </tr>` : ''}
                <tr>
                  <td style="color:#a78bfa;font-weight:bold;border-bottom:1px solid rgba(255,255,255,0.06);">Yorum Sahibi:</td>
                  <td style="border-bottom:1px solid rgba(255,255,255,0.06);"><strong>${escapeHtml(commentAuthorName || 'Bilinmiyor')}</strong> <span style="color:#9ca3af;font-size:11px;">(ID: ${escapeHtml(commentAuthorId || '-')})</span></td>
                </tr>
                <tr>
                  <td style="color:#a78bfa;font-weight:bold;border-bottom:1px solid rgba(255,255,255,0.06);">Seri / Bölüm:</td>
                  <td style="border-bottom:1px solid rgba(255,255,255,0.06);">${escapeHtml(seriesTitle || seriesId || '-')} ${chapterTitle ? `— <strong>${escapeHtml(chapterTitle)}</strong>` : '(Seri Ana Sayfası)'}</td>
                </tr>
                <tr>
                  <td style="color:#a78bfa;font-weight:bold;border-bottom:1px solid rgba(255,255,255,0.06);">Yorum ID & Tarih:</td>
                  <td style="font-family:monospace;font-size:12px;border-bottom:1px solid rgba(255,255,255,0.06);">${escapeHtml(commentId || '-')} • ${escapeHtml(commentDate || '-')}</td>
                </tr>
                <tr>
                  <td style="color:#a78bfa;font-weight:bold;">Bildiren Okuyucu:</td>
                  <td>${escapeHtml(reporterName || 'Ziyaretçi / Misafir')} ${reporterEmail ? `(${escapeHtml(reporterEmail)})` : ''}</td>
                </tr>
              </table>

              <div style="text-align:center;margin-top:18px;">
                <a href="${escapeHtml(directLink)}" style="display:inline-block;padding:12px 24px;background:linear-gradient(90deg,#9333ea,#db2777);color:#ffffff;text-decoration:none;font-weight:bold;font-size:13px;border-radius:12px;">
                  🔗 İlgili Sayfaya Git ve Yorumu Gör
                </a>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`.trim();

              const emailRes = await sendAdminNotificationEmail(env, subject, htmlContent);
              return new Response(JSON.stringify({
                success: true,
                emailSent: emailRes.sent,
                provider: emailRes.provider,
                target: 'mikrokosmosfansub@gmail.com'
              }), { headers });
            } catch (err: any) {
              return new Response(JSON.stringify({
                success: false,
                error: err?.message || 'Report error'
              }), { status: 500, headers });
            }
          }

          if (request.method === 'GET') {
            const now = Date.now();
            if (cachedCommentsResponseJson && now < cachedCommentsExpiresAt) {
              return new Response(cachedCommentsResponseJson, {
                headers: {
                  ...headers,
                  'Cache-Control': 'public, max-age=60, s-maxage=120, stale-while-revalidate=300'
                }
              });
            }

            if (commentsDb) {
              try {
                const { results } = await commentsDb.prepare("SELECT * FROM comments ORDER BY created_at DESC LIMIT 1500").all();
                const mapped = (results || []).map((c: any) => ({
                  id: c.id,
                  seriesId: c.series_id,
                  chapterId: c.chapter_id,
                  userId: c.user_id,
                  userName: c.user_name,
                  userAvatar: c.user_avatar,
                  text: c.text,
                  imageUrl: c.image_url,
                  parentId: c.parent_id,
                  isSpoiler: Boolean(c.is_spoiler),
                  likes: c.likes_json ? JSON.parse(c.likes_json) : [],
                  dislikes: c.dislikes_json ? JSON.parse(c.dislikes_json) : [],
                  date: c.created_at,
                  equippedTheme: c.equipped_theme,
                  equippedBadge: c.equipped_badge,
                  equippedBadges: c.equipped_badges_json ? JSON.parse(c.equipped_badges_json) : [],
                  equippedFrame: c.equipped_frame
                }));
                const respStr = JSON.stringify({
                  success: true,
                  storage: (env.COMMENTS_DB || env.COMMENTS_D1 || env.DB_COMMENTS) ? 'D1 (Ayrı Yorumlar DB)' : 'D1',
                  data: mapped
                });
                cachedCommentsResponseJson = respStr;
                cachedCommentsExpiresAt = Date.now() + 120000; // 2 min in-memory cache

                return new Response(respStr, {
                  headers: {
                    ...headers,
                    'Cache-Control': 'public, max-age=60, s-maxage=120, stale-while-revalidate=300'
                  }
                });
              } catch (d1Err: any) {
                console.warn('Comments D1 query failed or quota exceeded:', d1Err?.message);
              }
            }

            if (cachedCommentsResponseJson) {
              return new Response(cachedCommentsResponseJson, { headers });
            }

            return new Response(JSON.stringify({ success: true, data: [] }), { headers });
          }

          if (request.method === 'POST') {
            const c: any = await request.json();

            // SEND INSTANT EMAIL NOTIFICATION TO mikrokosmosfansub@gmail.com FOR EVERY NEW COMMENT
            if (c.isNewComment || c.notifyAdmin) {
              try {
                const escapeHtml = (str: any) =>
                  String(str ?? '')
                    .replace(/&/g, '&amp;')
                    .replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;')
                    .replace(/"/g, '&quot;');

                const sTitle = c.seriesTitle || c.seriesId || 'Seri';
                const chTitle = c.chapterTitle || (c.chapterId ? `Bölüm ${c.chapterId}` : 'Seri Genel Tanıtımı');
                const authorName = c.userName || 'Okuyucu';
                const commentSubject = `💬 [Yeni Yorum] ${sTitle} (${chTitle}) - ${authorName}`;
                const directLink = c.pageUrl || (c.chapterId
                  ? `https://mikrokosmosfansub.com/#/oku/${encodeURIComponent(c.seriesId || '')}/${encodeURIComponent(c.chapterId || '')}`
                  : c.seriesId
                  ? `https://mikrokosmosfansub.com/#/seri/${encodeURIComponent(c.seriesId || '')}`
                  : `https://mikrokosmosfansub.com/`);

                const commentHtml = `<!DOCTYPE html><html><head>
  <meta charset="utf-8">
  <title>${escapeHtml(commentSubject)}</title>
</head><body style="margin:0;padding:0;background-color:#090614;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#ffffff;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#090614;padding:28px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width:600px;background:linear-gradient(180deg, #1b0e34 0%, #0d0722 100%);border:1px solid rgba(168,85,247,0.4);border-radius:24px;overflow:hidden;box-shadow:0 20px 48px rgba(0,0,0,0.85);" cellspacing="0" cellpadding="0">
          <tr>
            <td style="padding:32px 28px;">
              <div style="display:inline-block;padding:6px 14px;background:rgba(168,85,247,0.2);border:1px solid rgba(168,85,247,0.45);border-radius:999px;font-size:12px;font-weight:bold;color:#d8b4fe;margin-bottom:16px;">
                💬 MIKROKOSMOS FANSUB • YENİ OKUYUCU YORUMU
              </div>
              <h2 style="margin:0 0 8px;font-size:22px;font-weight:900;color:#ffffff;letter-spacing:-0.5px;">
                Sitenize Yeni Bir Yorum Geldi!
              </h2>
              <p style="margin:0 0 22px;font-size:13px;color:#c4b5fd;line-height:1.6;">
                Okuyucunuz <strong>${escapeHtml(authorName)}</strong> sitede yeni bir yorum paylaştı. Detaylar ve yorum metni aşağıdadır:
              </p>

              <!-- COMMENT TEXT BOX -->
              <div style="background:#130a24;border-left:4px solid #a855f7;border-radius:14px;padding:18px;margin-bottom:20px;box-shadow:inset 0 2px 4px rgba(0,0,0,0.4);">
                <div style="font-size:11px;color:#c084fc;font-weight:bold;text-transform:uppercase;letter-spacing:0.8px;margin-bottom:8px;">
                  💬 Yorum Metni:
                </div>
                <div style="font-size:15px;line-height:1.65;color:#f3f4f6;white-space:pre-wrap;word-break:break-word;background:#090514;padding:14px;border-radius:10px;border:1px solid rgba(255,255,255,0.08);">
                  ${escapeHtml(c.text || '(Metin yok)')}
                </div>
                ${c.imageUrl ? `
                  <div style="margin-top:12px;padding:10px;background:rgba(0,0,0,0.3);border-radius:8px;font-size:12px;color:#93c5fd;">
                    📎 <strong>Ekli Görsel:</strong> <a href="${escapeHtml(c.imageUrl)}" target="_blank" style="color:#60a5fa;text-decoration:underline;">Görseli İncele</a>
                  </div>
                ` : ''}
              </div>

              <!-- DETAILS TABLE -->
              <table width="100%" cellspacing="0" cellpadding="10" style="background:#0d071b;border:1px solid rgba(168,85,247,0.25);border-radius:14px;font-size:13px;color:#e5e7eb;margin-bottom:22px;">
                <tr>
                  <td style="color:#a78bfa;font-weight:bold;width:140px;border-bottom:1px solid rgba(255,255,255,0.06);">📖 Seri Adı:</td>
                  <td style="color:#ffffff;font-weight:bold;border-bottom:1px solid rgba(255,255,255,0.06);">${escapeHtml(sTitle)}</td>
                </tr>
                <tr>
                  <td style="color:#a78bfa;font-weight:bold;border-bottom:1px solid rgba(255,255,255,0.06);">📑 Bölüm:</td>
                  <td style="color:#fcd34d;font-weight:bold;border-bottom:1px solid rgba(255,255,255,0.06);">${escapeHtml(chTitle)}</td>
                </tr>
                <tr>
                  <td style="color:#a78bfa;font-weight:bold;border-bottom:1px solid rgba(255,255,255,0.06);">👤 Yazan Kişi:</td>
                  <td style="border-bottom:1px solid rgba(255,255,255,0.06);"><strong>${escapeHtml(authorName)}</strong> ${c.userHandle ? `<span style="color:#a78bfa;">(@${escapeHtml(c.userHandle)})</span>` : ''}</td>
                </tr>
                <tr>
                  <td style="color:#a78bfa;font-weight:bold;border-bottom:1px solid rgba(255,255,255,0.06);">⏰ Tarih & Saat:</td>
                  <td style="color:#9ca3af;border-bottom:1px solid rgba(255,255,255,0.06);">${new Date().toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul' })}</td>
                </tr>
                <tr>
                  <td style="color:#a78bfa;font-weight:bold;border-bottom:1px solid rgba(255,255,255,0.06);">🏷️ Tür / Durum:</td>
                  <td style="border-bottom:1px solid rgba(255,255,255,0.06);">${c.parentId ? ('↩️ ' + (c.replyTargetAuthor ? `${escapeHtml(c.replyTargetAuthor)} adlı okuyucuya yanıt` : 'Bir yoruma yanıt')) : '💬 Doğrudan Yorum'}${c.isSpoiler ? ' • <span style="color:#f87171;font-weight:bold;">⚠️ Spoiler</span>' : ''}</td>
                </tr>
              </table>

              <!-- DIRECT LINK BUTTON -->
              <div style="text-align:center;margin-bottom:22px;">
                <a href="${escapeHtml(directLink)}" style="display:inline-block;padding:14px 28px;background:linear-gradient(135deg, #9333ea 0%, #7c3aed 100%);color:#ffffff;text-decoration:none;font-weight:bold;font-size:14px;border-radius:12px;box-shadow:0 8px 20px rgba(124,58,237,0.4);border:1px solid rgba(216,180,254,0.3);">
                  🚀 Yorumun Olduğu Bölüme / Sayfaya Git
                </a>
              </div>

              <!-- FOOTER -->
              <div style="border-top:1px solid rgba(168,85,247,0.2);padding-top:16px;text-align:center;">
                <p style="margin:0;font-size:11px;color:#8b5cf6;">
                  Bu bildirim yöneticiniz için <strong>mikrokosmosfansub@gmail.com</strong> adresine otomatik iletilmiştir.<br>
                  © 2026 Mikrokosmos Fansub. Tüm hakları saklıdır.
                </p>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body></html>`.trim();

                const emailPromise = sendAdminNotificationEmail(env, commentSubject, commentHtml);
                if (ctx && typeof ctx.waitUntil === 'function') {
                  ctx.waitUntil(emailPromise);
                } else {
                  emailPromise.catch(() => {});
                }
              } catch (notifyErr) {
                console.warn('Comment admin notification failed:', notifyErr);
              }
            }

            // PERSIST & SEND TARGETED REPLY NOTIFICATION TO USER
            if (c.replyTargetUserId && c.replyTargetUserId !== c.userId) {
              try {
                const sTitle = c.seriesTitle || c.seriesId || 'Seri';
                const chTitle = c.chapterTitle || (c.chapterId ? `Bölüm ${c.chapterId}` : 'Seri Genel Tanıtımı');
                const authorName = c.userName || 'Okuyucu';
                const replyNotifId = 'notif-reply-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6);
                const replyTitle = '💬 Yorumunuza Yanıt Geldi!';
                const replyMsg = `${authorName}, "${sTitle}" (${chTitle}) altındaki yorumunuza yanıt verdi: "${(c.text || '').slice(0, 80)}${(c.text || '').length > 80 ? '...' : ''}"`;
                const createdAtIso = new Date().toISOString();
                const activeDb = usersDb || db || commentsDb;

                if (activeDb) {
                  // Ensure target_user_id column exists
                  try { await activeDb.prepare("ALTER TABLE global_notifications ADD COLUMN target_user_id TEXT").run(); } catch(eCol) {}

                  // 1. Insert into global_notifications
                  try {
                    await activeDb.prepare(`
                      INSERT INTO global_notifications (id, title, message, type, series_id, series_title, chapter_title, target_user_id, created_at)
                      VALUES (?, ?, ?, 'comment-reply', ?, ?, ?, ?, ?)
                    `).bind(replyNotifId, replyTitle, replyMsg, c.seriesId || null, sTitle, chTitle, c.replyTargetUserId, createdAtIso).run();
                  } catch(eG) {
                    console.warn('Reply global_notif failed:', eG);
                  }

                  // 2. Save into target user_library
                  try {
                    const libRecord: any = await activeDb.prepare("SELECT notifications FROM user_library WHERE uid = ?").bind(c.replyTargetUserId).first();
                    let userNotifs: any[] = [];
                    if (libRecord && libRecord.notifications) {
                      try { userNotifs = JSON.parse(libRecord.notifications); } catch (eParse) {}
                    }
                    userNotifs.unshift({
                      id: replyNotifId,
                      title: replyTitle,
                      message: replyMsg,
                      type: 'comment-reply',
                      targetUserId: c.replyTargetUserId,
                      seriesId: c.seriesId,
                      seriesTitle: sTitle,
                      chapterId: c.chapterId,
                      chapterTitle: chTitle,
                      createdAt: createdAtIso,
                      isRead: false
                    });
                    await activeDb.prepare("UPDATE user_library SET notifications = ? WHERE uid = ?").bind(JSON.stringify(userNotifs.slice(0, 40)), c.replyTargetUserId).run();
                  } catch(eL) {
                    console.warn('Reply user_library failed:', eL);
                  }

                  // 3. Send email to replied user if email exists
                  try {
                    const targetUserRow: any = await activeDb.prepare("SELECT email FROM users WHERE uid = ?").bind(c.replyTargetUserId).first();
                    if (targetUserRow && targetUserRow.email) {
                      const targetEmail = targetUserRow.email;
                      const directLink = c.pageUrl || (c.chapterId
                        ? `https://mikrokosmosfansub.com/#/oku/${encodeURIComponent(c.seriesId || '')}/${encodeURIComponent(c.chapterId || '')}`
                        : `https://mikrokosmosfansub.com/#/seri/${encodeURIComponent(c.seriesId || '')}`);

                      const emailPromise = sendGmailSmtpDirect(
                        env.GMAIL_USER || 'mikrokosmosfansub@gmail.com',
                        env.GMAIL_APP_PASSWORD || 'gxrq mqep wuee tywy',
                        targetEmail,
                        replySubject,
                        replyHtml
                      );
                      if (ctx && typeof ctx.waitUntil === 'function') {
                        ctx.waitUntil(emailPromise);
                      } else {
                        emailPromise.catch(() => {});
                      }
                    }
                  } catch(eE) {
                    console.warn('Reply email failed:', eE);
                  }
                }
              } catch(eMainReply) {
                console.warn('Target reply process error:', eMainReply);
              }
            }

            if (false && r2) {
              const item = await r2.get('data/comments.json');
              let existing: any[] = item ? await item.json() : [];
              existing = [c, ...existing.filter((x: any) => x.id !== c.id)];
              await r2.put('data/comments.json', JSON.stringify(existing), {
                httpMetadata: { contentType: 'application/json' }
              });
              return new Response(JSON.stringify({ success: true, storage: 'R2' }), { headers });
            }

            if (false && kv) {
              let existing: any[] = (await kv.get('data/comments.json', 'json')) || [];
              existing = [c, ...existing.filter((x: any) => x.id !== c.id)];
              await kv.put('data/comments.json', JSON.stringify(existing));
              return new Response(JSON.stringify({ success: true, storage: 'KV' }), { headers });
            }

            if (commentsDb) {
              await commentsDb.prepare(`
                INSERT OR REPLACE INTO comments (
                  id, series_id, chapter_id, user_id, user_name, user_avatar,
                  text, image_url, parent_id, is_spoiler, likes_json, dislikes_json, created_at,
                  equipped_theme, equipped_badge, equipped_badges_json, equipped_frame
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
              `).bind(
                c.id, c.seriesId, c.chapterId || '', c.userId, c.userName, c.userAvatar || '',
                c.text, c.imageUrl || '', c.parentId || '', c.isSpoiler ? 1 : 0,
                JSON.stringify(c.likes || []), JSON.stringify(c.dislikes || []), c.date || new Date().toISOString(),
                c.equippedTheme || null, c.equippedBadge || null, JSON.stringify(c.equippedBadges || []), c.equippedFrame || null
              ).run();
              return new Response(JSON.stringify({
                success: true,
                storage: (env.COMMENTS_DB || env.COMMENTS_D1 || env.DB_COMMENTS) ? 'D1 (Ayrı Yorumlar DB)' : 'D1'
              }), { headers });
            }

            return new Response(JSON.stringify({ success: true }), { headers });
          }

          if (request.method === 'DELETE') {
            const commentId = url.searchParams.get('id');

            if (false && r2 && commentId) {
              const item = await r2.get('data/comments.json');
              let existing: any[] = item ? await item.json() : [];
              existing = existing.filter((x: any) => x.id !== commentId);
              await r2.put('data/comments.json', JSON.stringify(existing), {
                httpMetadata: { contentType: 'application/json' }
              });
              return new Response(JSON.stringify({ success: true, storage: 'R2' }), { headers });
            }

            if (false && kv && commentId) {
              let existing: any[] = (await kv.get('data/comments.json', 'json')) || [];
              existing = existing.filter((x: any) => x.id !== commentId);
              await kv.put('data/comments.json', JSON.stringify(existing));
              return new Response(JSON.stringify({ success: true, storage: 'KV' }), { headers });
            }

            if (commentsDb && commentId) {
              try {
                await commentsDb.prepare(`
                  WITH RECURSIVE to_delete(id) AS (
                    SELECT ?
                    UNION ALL
                    SELECT c.id FROM comments c JOIN to_delete td ON c.parent_id = td.id
                  )
                  DELETE FROM comments WHERE id IN (SELECT id FROM to_delete)
                `).bind(commentId).run();
              } catch (e) {
                await commentsDb.prepare("DELETE FROM comments WHERE id = ? OR parent_id = ?").bind(commentId, commentId).run();
              }
              return new Response(JSON.stringify({
                success: true,
                storage: (env.COMMENTS_DB || env.COMMENTS_D1 || env.DB_COMMENTS) ? 'D1 (Ayrı Yorumlar DB)' : 'D1'
              }), { headers });
            }

            return new Response(JSON.stringify({ success: true }), { headers });
          }
        }

        // REACTIONS API (Series & Chapter Emoji Reactions)
        if (path.startsWith('/api/reactions')) {
          const activeDb = usersDb || db || commentsDb;
          if (request.method === 'GET') {
            if (activeDb) {
              try {
                const row: any = await activeDb.prepare("SELECT value FROM site_settings WHERE key = 'reactions'").first();
                const data = row && row.value ? JSON.parse(row.value) : {};
                return new Response(JSON.stringify({ success: true, data }), { headers });
              } catch (e) {}
            }
            return new Response(JSON.stringify({ success: true, data: {} }), { headers });
          }

          if (request.method === 'POST') {
            try {
              const body: any = await request.json();
              const { targetKey, targetCounts } = body || {};
              if (activeDb && targetKey && targetCounts) {
                let allReactions: Record<string, Record<string, number>> = {};
                try {
                  const row: any = await activeDb.prepare("SELECT value FROM site_settings WHERE key = 'reactions'").first();
                  if (row && row.value) allReactions = JSON.parse(row.value);
                } catch (e) {}

                allReactions[targetKey] = targetCounts;
                await activeDb
                  .prepare("INSERT OR REPLACE INTO site_settings (key, value) VALUES ('reactions', ?)")
                  .bind(JSON.stringify(allReactions))
                  .run();

                return new Response(JSON.stringify({ success: true, data: allReactions[targetKey] }), { headers });
              }
            } catch (e) {}
            return new Response(JSON.stringify({ success: true }), { headers });
          }
        }

        // SHOP & THEMES API
        if (path.startsWith('/api/shop')) {
          if (request.method === 'DELETE') {
            const urlObj = new URL(request.url);
            const itemId = urlObj.searchParams.get('id');
            if (itemId && usersDb) {
              try {
                // Instead of deleting, mark it as deleted so clients know it's gone globally
                // if it was a default item.
                const exists = await usersDb.prepare('SELECT id FROM shop_items WHERE id = ?').bind(itemId).first();
                if (exists) {
                  await usersDb.prepare('UPDATE shop_items SET category = ? WHERE id = ?').bind('deleted', itemId).run();
                } else {
                  // Just insert a tombstone so clients know to hide it
                  await usersDb.prepare('INSERT INTO shop_items (id, name, category, price) VALUES (?, ?, ?, ?)').bind(itemId, 'Deleted', 'deleted', 0).run();
                }
              } catch(e) {}
              
              try {
                await usersDb.prepare('DELETE FROM theme_styles WHERE id = ?').bind(itemId).run();
              } catch(e) {}
              
              return new Response(JSON.stringify({ success: true, message: 'Item deleted safely' }), { headers });
            }
            return new Response(JSON.stringify({ success: false, message: 'Invalid request' }), { status: 400, headers });
          }
          if (request.method === 'GET') {
            if (false && r2) {
              const item = await r2.get('data/shop.json');
              const data = item ? await item.json() : { shopItems: [], themeStyles: {} };
              return new Response(JSON.stringify({ success: true, storage: 'R2', ...data }), { headers });
            }
            if (false && kv) {
              const data = (await kv.get('data/shop.json', 'json')) || { shopItems: [], themeStyles: {} };
              return new Response(JSON.stringify({ success: true, storage: 'KV', ...data }), { headers });
            }
            if (usersDb) {
              const { results: items } = await usersDb.prepare("SELECT * FROM shop_items").all();
              const { results: styles } = await usersDb.prepare("SELECT * FROM theme_styles").all();

              const shopItems = (items || []).map((i: any) => ({
                id: i.id,
                name: i.name,
                category: i.category,
                themeType: i.theme_type,
                price: i.price,
                description: i.description,
                icon: i.icon,
                rarity: i.rarity,
                badgeText: i.badge_text,
                badgeStyle: i.badge_style,
                frameStyle: i.frame_style,
                frameImageUrl: i.frame_image_url,
                frameScale: i.frame_scale ? Number(i.frame_scale) : undefined,
                frameOffsetY: i.frame_offset_y !== null && i.frame_offset_y !== undefined ? Number(i.frame_offset_y) : undefined,
                frameOffsetX: i.frame_offset_x !== null && i.frame_offset_x !== undefined ? Number(i.frame_offset_x) : undefined,
                frameHideBorder: Boolean(i.frame_hide_border),
                emojis: i.emojis ? (typeof i.emojis === 'string' ? JSON.parse(i.emojis) : i.emojis) : undefined
              }));

              const themeStylesMap: Record<string, any> = {};
              (styles || []).forEach((s: any) => {
                themeStylesMap[s.id] = {
                  id: s.id,
                  name: s.name,
                  cardClass: s.card_class,
                  avatarBorderClass: s.avatar_border_class,
                  nameClass: s.name_class,
                  badgeBgClass: s.badge_bg_class,
                  glowColor: s.glow_color,
                  accentText: s.accent_text,
                  cardBgImageUrl: s.card_bg_image_url,
                  effectOverlay: s.effect_overlay,
                  themeType: s.theme_type,
                  cornerMascotUrl: s.corner_mascot_url,
                  cornerMascotPosition: s.corner_mascot_position,
                  avatarCompanionUrl: s.avatar_companion_url,
                  decorations: s.decorations ? JSON.parse(s.decorations) : undefined,
                  profileDecorations: s.profile_decorations ? JSON.parse(s.profile_decorations) : undefined
                };
              });

              return new Response(JSON.stringify({ success: true, storage: 'D1', shopItems, themeStyles: themeStylesMap }), { headers });
            }
            return new Response(JSON.stringify({ success: true, shopItems: [], themeStyles: {} }), { headers });
          }

          if (request.method === 'POST') {
            const body: any = await request.json();
            const shopItemsInput = body.shopItems || [];
            const themeStylesInput = body.themeStyles || {};

            if (false && r2) {
              await r2.put('data/shop.json', JSON.stringify({ shopItems: shopItemsInput, themeStyles: themeStylesInput }), {
                httpMetadata: { contentType: 'application/json' }
              });
              return new Response(JSON.stringify({ success: true, storage: 'R2', message: 'Mağaza ve temalar R2 deposuna kaydedildi' }), { headers });
            }

            if (false && kv) {
              await kv.put('data/shop.json', JSON.stringify({ shopItems: shopItemsInput, themeStyles: themeStylesInput }));
              return new Response(JSON.stringify({ success: true, storage: 'KV', message: 'Mağaza ve temalar KV deposuna kaydedildi' }), { headers });
            }

            if (usersDb) {
              const statements: any[] = [];
              for (const item of shopItemsInput) {
                statements.push(
                  usersDb.prepare(`
                    INSERT OR REPLACE INTO shop_items (
                      id, name, category, theme_type, price, description, icon, rarity, badge_text, badge_style, frame_style, frame_image_url, frame_scale, frame_offset_y, frame_offset_x, frame_hide_border, emojis
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                  `).bind(
                    item.id, item.name, item.category, item.themeType || '', item.price,
                    item.description || '', item.icon || '', item.rarity || '', item.badgeText || '',
                    item.badgeStyle || '', item.frameStyle || '', item.frameImageUrl || '',
                    item.frameScale || 135, item.frameOffsetY || 0, item.frameOffsetX || 0, item.frameHideBorder ? 1 : 0,
                    item.emojis ? JSON.stringify(item.emojis) : ''
                  )
                );
              }

              for (const ts of Object.values(themeStylesInput) as any[]) {
                statements.push(
                  usersDb.prepare(`
                    INSERT OR REPLACE INTO theme_styles (
                      id, name, card_class, avatar_border_class, name_class, badge_bg_class,
                      glow_color, accent_text, card_bg_image_url, effect_overlay, theme_type,
                      corner_mascot_url, corner_mascot_position, avatar_companion_url, decorations
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                  `).bind(
                    ts.id, ts.name, ts.cardClass || '', ts.avatarBorderClass || '', ts.nameClass || '',
                    ts.badgeBgClass || '', ts.glowColor || '', ts.accentText || '',
                    ts.cardBgImageUrl || '', ts.effectOverlay || '', ts.themeType || '',
                    ts.cornerMascotUrl || '', ts.cornerMascotPosition || '', ts.avatarCompanionUrl || '', ts.decorations ? JSON.stringify(ts.decorations) : '',
                    ts.profileDecorations ? JSON.stringify(ts.profileDecorations) : ''
                  )
                );
              }

              if (statements.length > 0) {
                const BATCH_SIZE = 50;
                for (let i = 0; i < statements.length; i += BATCH_SIZE) {
                  const chunk = statements.slice(i, i + BATCH_SIZE);
                  await usersDb.batch(chunk);
                }
              }

              return new Response(JSON.stringify({ success: true, storage: 'D1', message: 'Mağaza ve temalar D1 veritabanına kaydedildi' }), { headers });
            }

            return new Response(JSON.stringify({ success: true }), { headers });
          }
        }

        
        // ADMIN API
        // ADMIN GRANT POINTS
        if (path.startsWith('/api/admin/global_notifications')) {
          const activeDb = usersDb || db;
          if (request.method === 'POST') {
            const n = await request.json();
            if (activeDb) {
              await activeDb.prepare(`
                INSERT INTO global_notifications (id, title, message, type, series_id, series_title, chapter_title, chapter_number, cover_image, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
              `).bind(
                n.id, n.title, n.message, n.type, n.seriesId || null, n.seriesTitle || null, n.chapterTitle || null, n.chapterNumber || null, n.coverImage || null, n.createdAt || new Date().toISOString()
              ).run();
              triggerNotificationSignal(n.id);
              return new Response(JSON.stringify({ success: true }), { headers });
            }
          }
          if (request.method === 'DELETE') {
            const url = new URL(request.url);
            const id = url.searchParams.get('id');
            if (activeDb) {
              if (id === 'all') {
                await activeDb.prepare("DELETE FROM global_notifications").run();
              } else if (id) {
                await activeDb.prepare("DELETE FROM global_notifications WHERE id = ?").bind(id).run();
              }
              cachedSeriesResponseJson = null;
              cachedSeriesExpiresAt = 0;
              return new Response(JSON.stringify({ success: true }), { headers });
            }
          }
          return new Response(JSON.stringify({ success: false }), { headers });
        }

        if (path.startsWith('/api/admin/announcement')) {
          const activeDb = usersDb || db;
          if (request.method === 'POST') {
            const ann = await request.json();
            if (activeDb) {
              await activeDb.prepare(`INSERT OR REPLACE INTO site_settings (key, value) VALUES (?, ?)`).bind('announcement', JSON.stringify(ann)).run();
              cachedSeriesResponseJson = null;
              cachedSeriesExpiresAt = 0;
              return new Response(JSON.stringify({ success: true }), { headers });
            }
          }
          return new Response(JSON.stringify({ success: false }), { headers });
        }

        if (path.startsWith('/api/admin/ad-settings')) {
          const activeDb = usersDb || db;
          if (request.method === 'POST') {
            const ads = await request.json();
            if (activeDb) {
              await activeDb.prepare(`INSERT OR REPLACE INTO site_settings (key, value) VALUES (?, ?)`).bind('ad_settings', JSON.stringify(ads)).run();
              cachedSeriesResponseJson = null;
              cachedSeriesExpiresAt = 0;
              return new Response(JSON.stringify({ success: true }), { headers });
            }
          }
          return new Response(JSON.stringify({ success: false }), { headers });
        }

        if (path.startsWith('/api/admin/site-branding')) {
          const activeDb = usersDb || db;
          if (request.method === 'POST') {
            const branding = await request.json();
            if (activeDb) {
              await activeDb.prepare(`INSERT OR REPLACE INTO site_settings (key, value) VALUES (?, ?)`).bind('site_branding', JSON.stringify(branding)).run();
              cachedSeriesResponseJson = null;
              cachedSeriesExpiresAt = 0;
              return new Response(JSON.stringify({ success: true }), { headers });
            }
          }
          return new Response(JSON.stringify({ success: false }), { headers });
        }

        // PROMO CODES MANAGEMENT & REDEMPTION API (CLOUDFLARE D1)
        if (path.startsWith('/api/promo-codes') || path.startsWith('/api/admin/promo-codes')) {
          const activeDb = usersDb || db;

          // REDEEM PROMO CODE
          if ((path === '/api/promo-codes/redeem' || path === '/api/admin/promo-codes/redeem') && request.method === 'POST') {
            const body = await request.json().catch(() => ({}));
            const codeInput = body.code;
            const email = body.email;
            const userId = body.userId;

            if (!codeInput || typeof codeInput !== 'string') {
              return new Response(JSON.stringify({ success: false, message: 'Geçersiz promosyon kodu.' }), { headers });
            }

            const cleanCode = codeInput.trim().toUpperCase();
            if (!cleanCode) {
              return new Response(JSON.stringify({ success: false, message: 'Geçersiz promosyon kodu.' }), { headers });
            }

            // Fetch promo code details from D1 or site_settings
            let promo = null;

            if (activeDb) {
              try {
                const row = await activeDb.prepare("SELECT * FROM promo_codes WHERE UPPER(code) = ?").bind(cleanCode).first().catch(() => null);
                if (row) {
                  promo = {
                    code: row.code,
                    points: Number(row.points) || 100,
                    description: row.description || '',
                    max_uses: Number(row.max_uses) || 0,
                    use_count: Number(row.use_count) || 0,
                    is_active: row.is_active !== undefined ? Number(row.is_active) : 1
                  };
                }
              } catch (e) {}

              if (!promo) {
                try {
                  const sRow = await activeDb.prepare("SELECT value FROM site_settings WHERE key = 'promo_codes_dict'").first().catch(() => null);
                  if (sRow && sRow.value) {
                    const dict = JSON.parse(sRow.value);
                    if (dict[cleanCode]) {
                      promo = { code: cleanCode, ...dict[cleanCode] };
                    }
                  }
                } catch (e) {}
              }
            }

            // Fallback default codes if DB empty
            if (!promo) {
              const DEFAULT_CODES = {
                MANHWA100: { points: 100, description: 'Seri Okuma Promosyon Bonusu' },
                MIKROKOSMOS2026: { points: 250, description: '2026 Hoş Geldin Bonusu' },
                HOSGELDIN: { points: 150, description: 'Yeni Üyelik Hoş Geldin Bonusu' }
              };
              if (DEFAULT_CODES[cleanCode]) {
                promo = { code: cleanCode, ...DEFAULT_CODES[cleanCode], is_active: 1, max_uses: 0, use_count: 0 };
              }
            }

            if (!promo) {
              return new Response(JSON.stringify({ success: false, message: 'Geçersiz veya bulunamayan promosyon kodu.' }), { headers });
            }

            if (promo.is_active === 0) {
              return new Response(JSON.stringify({ success: false, message: 'Bu promosyon kodu pasif duruma getirilmiştir.' }), { headers });
            }

            if (promo.max_uses && promo.max_uses > 0 && (promo.use_count || 0) >= promo.max_uses) {
              return new Response(JSON.stringify({ success: false, message: 'Bu promosyon kodunun kullanım limiti dolmuştur.' }), { headers });
            }

            // Check target user in DB
            const cleanEmail = email ? String(email).trim().toLowerCase() : '';
            const promoKey = 'promo_' + cleanCode;
            let targetUserRow = null;

            if (activeDb) {
              if (cleanEmail) {
                targetUserRow = await activeDb.prepare("SELECT * FROM users WHERE LOWER(email) = ?").bind(cleanEmail).first().catch(() => null);
              } else if (userId) {
                targetUserRow = await activeDb.prepare("SELECT * FROM users WHERE id = ?").bind(userId).first().catch(() => null);
              }
            }

            if (targetUserRow) {
              let currentCoins = Number(targetUserRow.coins) || 0;
              let inventory = [];
              try {
                inventory = typeof targetUserRow.inventory === 'string' ? JSON.parse(targetUserRow.inventory) : (targetUserRow.inventory || []);
              } catch (e) {
                inventory = [];
              }

              if (inventory.includes(promoKey)) {
                return new Response(JSON.stringify({ success: false, message: 'Bu promosyon kodunu daha önce kullandınız.' }), { headers });
              }

              const isUnlimited = cleanEmail === 'mikrokosmosfansub@gmail.com' || cleanEmail === 'aseleliyeva77@gmail.com';
              const pointsEarned = Number(promo.points) || 100;
              const updatedCoins = isUnlimited ? 999999999 : (currentCoins + pointsEarned);
              const updatedInventory = [...inventory, promoKey];

              // Update user row in D1
              await activeDb.prepare("UPDATE users SET coins = ?, inventory = ? WHERE id = ?")
                .bind(updatedCoins, JSON.stringify(updatedInventory), targetUserRow.id)
                .run().catch(() => null);

              // Increment use_count in promo_codes table
              await activeDb.prepare("UPDATE promo_codes SET use_count = COALESCE(use_count, 0) + 1 WHERE UPPER(code) = ?")
                .bind(cleanCode)
                .run().catch(() => null);

              return new Response(JSON.stringify({
                success: true,
                message: `🎁 Harika! "${cleanCode}" kodundan +${pointsEarned} Cosmo-Puan hesabınıza yüklendi! (${promo.description || 'Promosyon Bonusu'})`,
                pointsEarned,
                newCoins: updatedCoins
              }), { headers });
            }

            // Fallback for client-only session user
            const pointsEarned = Number(promo.points) || 100;
            return new Response(JSON.stringify({
              success: true,
              message: `🎁 Harika! "${cleanCode}" kodundan +${pointsEarned} Cosmo-Puan hesabınıza yüklendi! (${promo.description || 'Promosyon Bonusu'})`,
              pointsEarned
            }), { headers });
          }

          // GET: List Promo Codes
          if (request.method === 'GET') {
            let list = [];
            let isInitialized = false;
            if (activeDb) {
              try {
                const initCheck = await activeDb.prepare("SELECT value FROM site_settings WHERE key = 'promo_codes_initialized'").first().catch(() => null);
                if (initCheck && initCheck.value === '1') {
                  isInitialized = true;
                }
                const rows = await activeDb.prepare("SELECT * FROM promo_codes ORDER BY created_at DESC").all().catch(() => null);
                if (rows && rows.results) {
                  list = rows.results;
                }
              } catch (e) {}

              if (list.length === 0 && !isInitialized) {
                try {
                  const sRow = await activeDb.prepare("SELECT value FROM site_settings WHERE key = 'promo_codes_dict'").first().catch(() => null);
                  if (sRow && sRow.value) {
                    const dict = JSON.parse(sRow.value);
                    list = Object.keys(dict).map(k => ({ code: k, ...dict[k] }));
                  }
                } catch (e) {}
              }
            }

            if (list.length === 0 && !isInitialized) {
              list = [
                { code: 'MANHWA100', points: 100, description: 'Seri Okuma Promosyon Bonusu', use_count: 0, max_uses: 0, is_active: 1 },
                { code: 'MIKROKOSMOS2026', points: 250, description: '2026 Hoş Geldin Bonusu', use_count: 0, max_uses: 0, is_active: 1 },
                { code: 'HOSGELDIN', points: 150, description: 'Yeni Üyelik Hoş Geldin Bonusu', use_count: 0, max_uses: 0, is_active: 1 }
              ];
              if (activeDb) {
                for (const item of list) {
                  await activeDb.prepare("INSERT OR IGNORE INTO promo_codes (code, points, description, max_uses, use_count, is_active, created_at) VALUES (?, ?, ?, ?, 0, 1, ?)").bind(item.code, item.points, item.description, 0, new Date().toISOString()).run().catch(() => {});
                }
                await activeDb.prepare("INSERT OR REPLACE INTO site_settings (key, value) VALUES ('promo_codes_initialized', '1')").run().catch(() => {});
              }
            }

            return new Response(JSON.stringify({ success: true, promoCodes: list }), { headers });
          }

          // POST: Add or Update Promo Code (Admin)
          if (request.method === 'POST') {
            const body = await request.json().catch(() => ({}));
            const { code, points, description, max_uses, is_active } = body;

            if (!code || typeof code !== 'string' || !code.trim()) {
              return new Response(JSON.stringify({ success: false, message: 'Geçerli bir promosyon kodu giriniz.' }), { headers });
            }

            const cleanCode = code.trim().toUpperCase();
            const pts = Math.max(1, Number(points) || 100);
            const desc = (description || 'Promosyon Kodu Ödülü').trim();
            const maxU = Math.max(0, Number(max_uses) || 0);
            const active = is_active !== undefined ? (is_active ? 1 : 0) : 1;
            const createdAt = new Date().toISOString();

            if (activeDb) {
              await activeDb.prepare(`
                INSERT INTO promo_codes (code, points, description, max_uses, use_count, is_active, created_at)
                VALUES (?, ?, ?, ?, 0, ?, ?)
                ON CONFLICT(code) DO UPDATE SET
                  points = excluded.points,
                  description = excluded.description,
                  max_uses = excluded.max_uses,
                  is_active = excluded.is_active
              `).bind(cleanCode, pts, desc, maxU, active, createdAt).run().catch(() => null);

              // Also sync to site_settings dictionary and mark initialized
              try {
                const sRow = await activeDb.prepare("SELECT value FROM site_settings WHERE key = 'promo_codes_dict'").first().catch(() => null);
                let dict = (sRow && sRow.value) ? JSON.parse(sRow.value) : {};
                dict[cleanCode] = { points: pts, description: desc, max_uses: maxU, is_active: active, created_at: createdAt };
                await activeDb.prepare("INSERT OR REPLACE INTO site_settings (key, value) VALUES (?, ?)").bind('promo_codes_dict', JSON.stringify(dict)).run().catch(() => null);
                await activeDb.prepare("INSERT OR REPLACE INTO site_settings (key, value) VALUES ('promo_codes_initialized', '1')").run().catch(() => {});
              } catch (e) {}
            }

            return new Response(JSON.stringify({
              success: true,
              message: `"${cleanCode}" promosyon kodu (+${pts} CP) Cloudflare D1 veritabanına başarıyla kaydedildi!`,
              code: cleanCode,
              points: pts
            }), { headers });
          }

          // DELETE: Delete Promo Code (Admin)
          if (request.method === 'DELETE') {
            const urlObj = new URL(request.url);
            const codeToDelete = urlObj.searchParams.get('code') || '';
            if (codeToDelete && activeDb) {
              const cleanCode = codeToDelete.trim().toUpperCase();
              await activeDb.prepare("DELETE FROM promo_codes WHERE UPPER(code) = ?").bind(cleanCode).run().catch(() => null);
              try {
                const sRow = await activeDb.prepare("SELECT value FROM site_settings WHERE key = 'promo_codes_dict'").first().catch(() => null);
                if (sRow && sRow.value) {
                  let dict = JSON.parse(sRow.value);
                  delete dict[cleanCode];
                  await activeDb.prepare("INSERT OR REPLACE INTO site_settings (key, value) VALUES (?, ?)").bind('promo_codes_dict', JSON.stringify(dict)).run().catch(() => null);
                }
                await activeDb.prepare("INSERT OR REPLACE INTO site_settings (key, value) VALUES ('promo_codes_initialized', '1')").run().catch(() => {});
              } catch (e) {}
            }

            return new Response(JSON.stringify({ success: true, message: 'Promosyon kodu silindi.' }), { headers });
          }
        }

        if (path.startsWith('/api/admin/coin-packages') || path.startsWith('/api/coin-packages')) {
          const activeDb = usersDb || db;
          if (request.method === 'POST') {
            const urls = await request.json();
            if (activeDb) {
              await activeDb.prepare(`INSERT OR REPLACE INTO site_settings (key, value) VALUES (?, ?)`).bind('coin_package_urls', JSON.stringify(urls)).run();
              cachedSeriesResponseJson = null;
              cachedSeriesExpiresAt = 0;
              return new Response(JSON.stringify({ success: true, packageUrls: urls }), { headers });
            }
          }
          if (request.method === 'GET') {
            if (activeDb) {
              const row: any = await activeDb.prepare("SELECT value FROM site_settings WHERE key = 'coin_package_urls'").first().catch(() => null);
              const packageUrls = row?.value ? JSON.parse(row.value) : null;
              return new Response(JSON.stringify({ success: true, packageUrls }), { headers });
            }
          }
          return new Response(JSON.stringify({ success: false }), { headers });
        }

        // DONATIONALERTS OAUTH & AUTOMATIC COIN CLAIM API
        const DA_CLIENT_ID = "22110";
        const DA_CLIENT_SECRET = "q1igpferTJX5fHvsidPvwXhn7Px2mZbAmF4TH1Rv";
        const DA_REDIRECT_URI = "https://mikrokosmos.fans/api/auth/donationalerts/callback";

        // 1. Connect / Authorize Redirect
        if (path === '/api/auth/donationalerts/connect') {
          const authUrl = `https://www.donationalerts.com/oauth/authorize?client_id=${DA_CLIENT_ID}&redirect_uri=${encodeURIComponent(DA_REDIRECT_URI)}&response_type=code&scope=oauth-donation-index%20oauth-user-show`;
          return Response.redirect(authUrl, 302);
        }

        // 2. OAuth Callback & Token Exchange
        if (path.startsWith('/api/auth/donationalerts/callback')) {
          const code = url.searchParams.get('code');
          if (!code) {
            return new Response("Yetkilendirme kodu bulunamadı.", { status: 400, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
          }

          const tokenParams = new URLSearchParams();
          tokenParams.append('grant_type', 'authorization_code');
          tokenParams.append('client_id', DA_CLIENT_ID);
          tokenParams.append('client_secret', DA_CLIENT_SECRET);
          tokenParams.append('redirect_uri', DA_REDIRECT_URI);
          tokenParams.append('code', code);

          try {
            const tokenRes = await fetch('https://www.donationalerts.com/oauth/token', {
              method: 'POST',
              headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
              body: tokenParams.toString()
            });

            const tokenData: any = await tokenRes.json().catch(() => ({}));
            if (tokenData && tokenData.access_token) {
              const activeDb = usersDb || db;
              if (activeDb) {
                const authRecord = {
                  access_token: tokenData.access_token,
                  refresh_token: tokenData.refresh_token,
                  expires_at: Date.now() + (tokenData.expires_in || 86400) * 1000,
                  updated_at: new Date().toISOString()
                };
                await activeDb.prepare("INSERT OR REPLACE INTO site_settings (key, value) VALUES ('donationalerts_auth', ?)").bind(JSON.stringify(authRecord)).run();
              }

              return new Response(`<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>DonationAlerts Başarıyla Bağlandı!</title>
  <style>
    body { background: #0b0716; color: #fff; font-family: system-ui, -apple-system, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px; box-sizing: border-box; }
    .card { background: #150f26; border: 2px solid #a855f7; border-radius: 28px; padding: 36px; max-width: 480px; text-align: center; box-shadow: 0 0 60px rgba(168,85,247,0.35); }
    .icon { font-size: 54px; margin-bottom: 16px; }
    h1 { color: #f59e0b; margin: 0 0 12px 0; font-size: 24px; font-weight: 900; }
    p { color: #cbd5e1; font-size: 14px; line-height: 1.6; margin: 0 0 24px 0; }
    .btn { display: inline-block; padding: 14px 28px; background: linear-gradient(135deg, #f59e0b, #eab308); color: #000; font-weight: 900; font-size: 14px; border-radius: 16px; text-decoration: none; box-shadow: 0 4px 20px rgba(245,158,11,0.4); }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">⚡🎉</div>
    <h1>DonationAlerts Başarıyla Bağlandı!</h1>
    <p>Mikrokosmos sistemi artık DonationAlerts hesabınızla tam otomatik olarak bağlandı. Kullanıcıların yaptığı ödemeler anında tespit edilecek ve kuruşu kuruşuna Cosmo-Puan tanımlanacaktır.</p>
    <a href="/#/magaza" class="btn">Sitemize Geri Dön 🚀</a>
  </div>
</body>
</html>`, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
            }
            return new Response(`Yetkilendirme hatası: ${JSON.stringify(tokenData)}`, { status: 400, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
          } catch (e: any) {
            return new Response(`Sunucu hatası: ${e.message}`, { status: 500, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
          }
        }

        // 3. DonationAlerts Connection Status
        if (path === '/api/donationalerts/status') {
          const activeDb = usersDb || db;
          let isConnected = false;
          if (activeDb) {
            const row: any = await activeDb.prepare("SELECT value FROM site_settings WHERE key = 'donationalerts_auth'").first().catch(() => null);
            if (row && row.value) {
              try {
                const parsed = JSON.parse(row.value);
                if (parsed && parsed.access_token) {
                  isConnected = true;
                }
              } catch (e) {}
            }
          }
          return new Response(JSON.stringify({
            success: true,
            connected: isConnected,
            connect_url: `https://www.donationalerts.com/oauth/authorize?client_id=${DA_CLIENT_ID}&redirect_uri=${encodeURIComponent(DA_REDIRECT_URI)}&response_type=code&scope=oauth-donation-index%20oauth-user-show`
          }), { headers });
        }

        // Reset Claimed Donation (for unblocking test donations)
        if (path.startsWith('/api/donationalerts/reset-claimed')) {
          const activeDb = usersDb || db;
          if (activeDb) {
            await activeDb.prepare("DELETE FROM donationalerts_claimed WHERE donation_id = '192716404'").run().catch(() => {});
            return new Response(JSON.stringify({ success: true, message: 'Test donation 192716404 unblocked for claim!' }), { headers });
          }
          return new Response(JSON.stringify({ success: false }), { headers });
        }

        // 4. Automatic Claim & Verification (Sıfır Hileli Gerçek Tutar Kontrolü)
        if (path === '/api/donationalerts/claim-points' && request.method === 'POST') {
          const activeDb = usersDb || db;
          if (!activeDb) {
            return new Response(JSON.stringify({ success: false, message: 'Veritabanı bağlantısı kurulamadı.' }), { headers });
          }

          // Ensure claimed donations table exists
          await activeDb.prepare(`
            CREATE TABLE IF NOT EXISTS donationalerts_claimed (
              donation_id TEXT PRIMARY KEY,
              user_email TEXT NOT NULL,
              user_name TEXT,
              amount REAL NOT NULL,
              currency TEXT NOT NULL,
              cp_granted INTEGER NOT NULL,
              created_at TEXT NOT NULL
            );
          `).run().catch(() => {});

          const body = await request.json().catch(() => ({}));
          const { user_email, user_name, donor_name } = body;
          const cleanEmail = (user_email || '').toLowerCase().trim();
          const cleanName = (user_name || '').toLowerCase().trim();
          const cleanDonor = (donor_name || '').toLowerCase().trim();

          if (!cleanEmail && !cleanName) {
            return new Response(JSON.stringify({ success: false, message: 'Kullanıcı bilgisi eksik.' }), { headers });
          }

          // Fetch stored token
          const authRow: any = await activeDb.prepare("SELECT value FROM site_settings WHERE key = 'donationalerts_auth'").first().catch(() => null);
          if (!authRow || !authRow.value) {
            return new Response(JSON.stringify({
              success: false,
              not_connected: true,
              message: 'DonationAlerts henüz yönetici tarafından bağlanmamış. Lütfen yönetici ile iletişime geçin.'
            }), { headers });
          }

          let authData: any = JSON.parse(authRow.value);
          let accessToken = authData.access_token;

          // Auto-refresh token if expired
          if (authData.expires_at && Date.now() > authData.expires_at - 60000 && authData.refresh_token) {
            try {
              const refreshParams = new URLSearchParams();
              refreshParams.append('grant_type', 'refresh_token');
              refreshParams.append('refresh_token', authData.refresh_token);
              refreshParams.append('client_id', DA_CLIENT_ID);
              refreshParams.append('client_secret', DA_CLIENT_SECRET);

              const refreshRes = await fetch('https://www.donationalerts.com/oauth/token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: refreshParams.toString()
              });
              const refreshed: any = await refreshRes.json().catch(() => ({}));
              if (refreshed && refreshed.access_token) {
                accessToken = refreshed.access_token;
                authData.access_token = refreshed.access_token;
                if (refreshed.refresh_token) authData.refresh_token = refreshed.refresh_token;
                authData.expires_at = Date.now() + (refreshed.expires_in || 86400) * 1000;
                await activeDb.prepare("UPDATE site_settings SET value = ? WHERE key = 'donationalerts_auth'").bind(JSON.stringify(authData)).run();
              }
            } catch (e) {}
          }

          // Fetch recent donations from DonationAlerts API v1
          try {
            const daRes = await fetch('https://www.donationalerts.com/api/v1/alerts/donations', {
              headers: { 'Authorization': `Bearer ${accessToken}` }
            });
            const daData: any = await daRes.json().catch(() => ({}));

            if (!daData || !Array.isArray(daData.data)) {
              return new Response(JSON.stringify({
                success: false,
                message: 'DonationAlerts API yanıt vermedi veya yetkilendirme yenilenmeli.'
              }), { headers });
            }

            // Get already claimed donation IDs
            const claimedRows: any = await activeDb.prepare("SELECT donation_id FROM donationalerts_claimed").all().catch(() => ({ results: [] }));
            const claimedSet = new Set((claimedRows?.results || []).map((r: any) => String(r.donation_id)));

            // Calculate exact CP from actual paid amount & currency (Airtight security!)
            const calcPackage = (amount: number, currency: string) => {
              const cur = (currency || 'USD').toUpperCase();
              let usd = amount;
              if (cur === 'TRY') usd = amount / 50;
              else if (cur === 'AZN') usd = amount / 1.7;
              else if (cur === 'RUB') usd = amount / 95;
              else if (cur === 'EUR') usd = amount * 1.05;

              // Check packages from highest to lowest
              if (usd >= 19.5) return { cp: 14000, name: 'Efsane Altın VIP Paketi ($20)' };
              if (usd >= 7.8) return { cp: 4000, name: 'Gümüş Kozmik Paket ($8)' };
              if (usd >= 2.8) return { cp: 1250, name: 'Bronz Okuyucu Paketi ($3)' };
              if (usd >= 0.95) return { cp: 300, name: 'Başlangıç Paketi ($1)' };
              return null; // Less than 1$
            };

            // Search for an unclaimed donation matching this user's username or email
            let matchedDonation: any = null;
            let matchedPkg: any = null;

            for (const d of daData.data) {
              const dId = String(d.id);
              if (claimedSet.has(dId)) continue; // Already claimed!

              const dUsername = (d.username || d.name || '').toLowerCase().trim();
              const dMessage = (d.message || '').toLowerCase().trim();

              const emailNamePart = cleanEmail.split('@')[0];
              const matchesUser =
                (cleanDonor && (dUsername === cleanDonor || dMessage.includes(cleanDonor) || dUsername.includes(cleanDonor))) ||
                (cleanName && (dUsername === cleanName || dMessage.includes(cleanName))) ||
                (cleanEmail && (dUsername === cleanEmail || dUsername === emailNamePart || dMessage.includes(cleanEmail) || dMessage.includes(emailNamePart)));

              if (matchesUser) {
                const pkg = calcPackage(Number(d.amount), String(d.currency));
                if (pkg) {
                  matchedDonation = d;
                  matchedPkg = pkg;
                  break; // Found the latest matching unclaimed donation!
                }
              }
            }

            if (!matchedDonation || !matchedPkg) {
              return new Response(JSON.stringify({
                success: false,
                claimed: false,
                message: 'Henüz bu kullanıcı adına ait doğrulanmamış yeni bir ödeme bulunamadı. Lütfen DonationAlerts üzerinde adınızı doğru yazdığınızdan ve ödemenin tamamlandığından emin olun.'
              }), { headers });
            }

            // SUCCESS! Record as claimed in database so it can NEVER be reused!
            const nowIso = new Date().toISOString();
            await activeDb.prepare(`
              INSERT INTO donationalerts_claimed (donation_id, user_email, user_name, amount, currency, cp_granted, created_at)
              VALUES (?, ?, ?, ?, ?, ?, ?)
            `).bind(
              String(matchedDonation.id),
              cleanEmail,
              cleanName,
              Number(matchedDonation.amount),
              String(matchedDonation.currency),
              matchedPkg.cp,
              nowIso
            ).run();

            // Record in point_grants log
            const grantId = `da-auto-${Date.now()}`;
            await activeDb.prepare(`
              INSERT INTO point_grants (id, target_email, amount, mode, note, admin_email, created_at)
              VALUES (?, ?, ?, 'add', ?, 'DonationAlerts Auto', ?)
            `).bind(
              grantId,
              cleanEmail,
              matchedPkg.cp,
              `DonationAlerts Otomatik Yükleme: ${matchedPkg.name} (${matchedDonation.amount} ${matchedDonation.currency} - ID: #${matchedDonation.id})`,
              nowIso
            ).run().catch(() => {});

            // Upsert user_library cosmo_points in Cloudflare D1 SQL
            try {
              const uRow: any = await activeDb.prepare("SELECT uid FROM users WHERE LOWER(email) = LOWER(?) LIMIT 1").bind(cleanEmail).first().catch(() => null);
              if (uRow && uRow.uid) {
                await activeDb.prepare(`
                  INSERT INTO user_library (uid, cosmo_points)
                  VALUES (?, ?)
                  ON CONFLICT(uid) DO UPDATE SET cosmo_points = COALESCE(user_library.cosmo_points, 0) + excluded.cosmo_points
                `).bind(uRow.uid, matchedPkg.cp).run();
              }
            } catch(e) {}

            // Read the updated balance
            const balRow: any = await activeDb.prepare(`
              SELECT cosmo_points FROM user_library WHERE uid = (SELECT uid FROM users WHERE LOWER(email) = LOWER(?) LIMIT 1)
            `).bind(cleanEmail).first().catch(() => null);
            const newBal = balRow && balRow.cosmo_points !== undefined && balRow.cosmo_points !== null ? Number(balRow.cosmo_points) : null;

            return new Response(JSON.stringify({
              success: true,
              claimed: true,
              cpGranted: matchedPkg.cp,
              newBalance: newBal,
              packageName: matchedPkg.name,
              paidAmount: matchedDonation.amount,
              paidCurrency: matchedDonation.currency,
              donationId: matchedDonation.id
            }), { headers });

          } catch (apiErr: any) {
            return new Response(JSON.stringify({
              success: false,
              message: `DonationAlerts sorgulanırken hata oluştu: ${apiErr.message}`
            }), { headers });
          }
        }

        // PAYMENT NOTIFICATIONS API (DonationAlerts Ödeme Bildirimleri)
        if (path.startsWith('/api/payment-notifications')) {
          const activeDb = usersDb || db;
          if (activeDb) {
            await activeDb.prepare(`
              CREATE TABLE IF NOT EXISTS payment_notifications (
                id TEXT PRIMARY KEY,
                user_email TEXT NOT NULL,
                user_name TEXT,
                package_id TEXT NOT NULL,
                package_name TEXT NOT NULL,
                amount_cp INTEGER NOT NULL,
                price_text TEXT,
                reference_code TEXT NOT NULL,
                status TEXT NOT NULL DEFAULT 'pending',
                admin_note TEXT,
                created_at TEXT NOT NULL,
                reviewed_at TEXT,
                reviewed_by TEXT
              );
            `).run().catch(() => {});

            if (request.method === 'POST') {
              const body = await request.json().catch(() => ({}));
              const { action } = body;

              // Action: review (approve / reject)
              if (action === 'review') {
                const { id, status, admin_email, admin_note } = body;
                if (!id || !status) {
                  return new Response(JSON.stringify({ success: false, error: 'Eksik parametre' }), { headers });
                }

                // Check if already approved (Prevent double approval!)
                const currentNotif: any = await activeDb.prepare("SELECT status FROM payment_notifications WHERE id = ?").bind(id).first().catch(() => null);
                if (currentNotif && currentNotif.status === 'approved' && status === 'approved') {
                  return new Response(JSON.stringify({ success: false, error: 'Bu bildirim zaten daha önce onaylanmış! Mükerrer puan yüklenemez.' }), { headers });
                }

                const now = new Date().toISOString();
                await activeDb.prepare(`
                  UPDATE payment_notifications 
                  SET status = ?, admin_note = ?, reviewed_at = ?, reviewed_by = ? 
                  WHERE id = ?
                `).bind(status, admin_note || '', now, admin_email || '', id).run();

                return new Response(JSON.stringify({ success: true, status }), { headers });
              }

              // Action: Submit new notification
              const { user_email, user_name, package_id, package_name, amount_cp, price_text, reference_code } = body;
              if (!user_email || !package_name || !reference_code) {
                return new Response(JSON.stringify({ success: false, error: 'Lütfen tüm alanları doldurun.' }), { headers });
              }

              const cleanRef = reference_code.trim().toLowerCase();
              const cleanUserEmail = user_email.toLowerCase().trim();

              // 1. Prevent duplicate pending notification from the same user
              const pendingCheck: any = await activeDb.prepare("SELECT id FROM payment_notifications WHERE user_email = ? AND status = 'pending' LIMIT 1").bind(cleanUserEmail).first().catch(() => null);
              if (pendingCheck && pendingCheck.id) {
                return new Response(JSON.stringify({ 
                  success: false, 
                  error: 'Zaten incelenmekte olan bekleyen bir ödeme bildiriminiz bulunmaktadır. Lütfen yöneticimiz onaylayana kadar bekleyiniz.' 
                }), { headers });
              }

              // 2. Prevent accidental spam within 3 minutes with exact same text
              const recentSpam: any = await activeDb.prepare("SELECT created_at FROM payment_notifications WHERE user_email = ? AND LOWER(reference_code) = ? ORDER BY created_at DESC LIMIT 1").bind(cleanUserEmail, cleanRef).first().catch(() => null);
              if (recentSpam && recentSpam.created_at) {
                const diffMs = Date.now() - new Date(recentSpam.created_at).getTime();
                if (diffMs < 3 * 60 * 1000) {
                  return new Response(JSON.stringify({ 
                    success: false, 
                    error: 'Aynı isim/dekont ile az önce bir bildirim gönderdiniz. Mükerrer olmaması için lütfen birkaç dakika bekleyin.' 
                  }), { headers });
                }
              }

              const newId = `pn-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
              const now = new Date().toISOString();
              await activeDb.prepare(`
                INSERT INTO payment_notifications (
                  id, user_email, user_name, package_id, package_name, amount_cp, price_text, reference_code, status, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)
              `).bind(
                newId,
                cleanUserEmail,
                user_name || '',
                package_id || '',
                package_name,
                Number(amount_cp) || 0,
                price_text || '',
                reference_code.trim(),
                now
              ).run();

              return new Response(JSON.stringify({ success: true, id: newId }), { headers });
            }

            if (request.method === 'GET') {
              const targetEmail = url.searchParams.get('email');
              let res;
              if (targetEmail) {
                res = await activeDb.prepare("SELECT * FROM payment_notifications WHERE user_email = ? ORDER BY created_at DESC LIMIT 50").bind(targetEmail.toLowerCase().trim()).all();
              } else {
                res = await activeDb.prepare("SELECT * FROM payment_notifications ORDER BY created_at DESC LIMIT 100").all();
              }
              return new Response(JSON.stringify({ success: true, notifications: res?.results || [] }), { headers });
            }
          }
          return new Response(JSON.stringify({ success: false }), { headers });
        }

        // WALLPAPERS API
        if (path.startsWith('/api/wallpapers')) {
          const activeDb = db || usersDb;
          if (activeDb) {
            await activeDb.prepare(`
              CREATE TABLE IF NOT EXISTS wallpapers (
                id TEXT PRIMARY KEY,
                title TEXT,
                image_url TEXT NOT NULL,
                series_id TEXT,
                series_title TEXT,
                category TEXT DEFAULT 'genel',
                tags_json TEXT DEFAULT '[]',
                likes INTEGER DEFAULT 0,
                downloads INTEGER DEFAULT 0,
                uploaded_by TEXT,
                created_at TEXT
              );
            `).run().catch(() => {});
          }

          if (request.method === 'GET') {
            const now = Date.now();
            if (cachedWallpapersResponseJson && now < cachedWallpapersExpiresAt) {
              return new Response(cachedWallpapersResponseJson, {
                headers: {
                  ...headers,
                  'Cache-Control': 'public, max-age=120, s-maxage=300, stale-while-revalidate=600'
                }
              });
            }

            if (activeDb) {
              try {
                const { results } = await activeDb.prepare("SELECT * FROM wallpapers ORDER BY created_at DESC LIMIT 2000").all();
                let list = (results || []).map((w: any) => ({
                  id: w.id,
                  title: w.title || '',
                  imageUrl: w.image_url,
                  seriesId: w.series_id || '',
                  seriesTitle: w.series_title || '',
                  category: w.category || 'genel',
                  tags: w.tags_json ? JSON.parse(w.tags_json) : [],
                  likes: Number(w.likes) || 0,
                  downloads: Number(w.downloads) || 0,
                  uploadedBy: w.uploaded_by || '',
                  createdAt: w.created_at || new Date().toISOString()
                }));
                if (list.length === 0) {
                  const backupRow: any = await activeDb
                    .prepare("SELECT value FROM site_settings WHERE key = 'wallpapers_backup'")
                    .first()
                    .catch(() => null);
                  if (backupRow && backupRow.value) {
                    const parsed = JSON.parse(backupRow.value);
                    if (Array.isArray(parsed)) list = parsed;
                  }
                }
                const respStr = JSON.stringify({ success: true, storage: 'D1', wallpapers: list });
                cachedWallpapersResponseJson = respStr;
                cachedWallpapersExpiresAt = Date.now() + 300000; // 5 min in-memory cache

                return new Response(respStr, {
                  headers: {
                    ...headers,
                    'Cache-Control': 'public, max-age=120, s-maxage=300, stale-while-revalidate=600'
                  }
                });
              } catch (e) {}
            }

            if (cachedWallpapersResponseJson) {
              return new Response(cachedWallpapersResponseJson, { headers });
            }
            if (r2) {
              try {
                const item = await r2.get('data/wallpapers.json');
                const wallpapers = item ? await item.json() : [];
                return new Response(JSON.stringify({ success: true, storage: 'R2', wallpapers }), { headers });
              } catch (e) {}
            }
            if (kv) {
              try {
                const wallpapers = (await kv.get('data/wallpapers.json', 'json')) || [];
                return new Response(JSON.stringify({ success: true, storage: 'KV', wallpapers }), { headers });
              } catch (e) {}
            }
            return new Response(JSON.stringify({ success: true, wallpapers: [] }), { headers });
          }

          if (request.method === 'POST') {
            cachedWallpapersResponseJson = null;
            cachedWallpapersExpiresAt = 0;
            const body: any = await request.json();
            const callerEmail = String(body.adminEmail || '').trim().toLowerCase();
            if (callerEmail && !ADMIN_EMAILS.has(callerEmail)) {
              return new Response(JSON.stringify({ success: false, message: 'Duvar kağıdı yükleme yetkisi yalnızca yöneticilere aittir.' }), { status: 403, headers });
            }
            const itemsInput = Array.isArray(body.wallpapers) ? body.wallpapers : body.wallpaper ? [body.wallpaper] : [];
            if (itemsInput.length === 0) {
              return new Response(JSON.stringify({ success: false, message: 'Eklenecek wallpaper bulunamadı.' }), { status: 400, headers });
            }

            if (activeDb) {
              try {
                const stmts = itemsInput.map((w: any) =>
                  activeDb.prepare(`
                    INSERT OR REPLACE INTO wallpapers (
                      id, title, image_url, series_id, series_title, category, tags_json, likes, downloads, uploaded_by, created_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                  `).bind(
                    w.id || ('wp-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6)),
                    w.title || '',
                    w.imageUrl,
                    w.seriesId || '',
                    w.seriesTitle || '',
                    w.category || 'genel',
                    JSON.stringify(w.tags || []),
                    Number(w.likes) || 0,
                    Number(w.downloads) || 0,
                    w.uploadedBy || '',
                    w.createdAt || new Date().toISOString()
                  )
                );
                const BATCH_SIZE = 40;
                for (let i = 0; i < stmts.length; i += BATCH_SIZE) {
                  await activeDb.batch(stmts.slice(i, i + BATCH_SIZE));
                }

                // Also update site_settings backup for extra durability
                try {
                  const backupRow: any = await activeDb
                    .prepare("SELECT value FROM site_settings WHERE key = 'wallpapers_backup'")
                    .first()
                    .catch(() => null);
                  const existing: any[] = backupRow && backupRow.value ? JSON.parse(backupRow.value) : [];
                  const map = new Map<string, any>();
                  existing.forEach(x => x && x.id && map.set(x.id, x));
                  itemsInput.forEach((x: any) => x && x.id && map.set(x.id, x));
                  const merged = Array.from(map.values()).slice(0, 500);
                  await activeDb
                    .prepare("INSERT OR REPLACE INTO site_settings (key, value) VALUES ('wallpapers_backup', ?)")
                    .bind(JSON.stringify(merged))
                    .run();
                } catch {}

                return new Response(JSON.stringify({ success: true, storage: 'D1', count: itemsInput.length }), { headers });
              } catch (e: any) {
                console.error('Error saving wallpapers to D1:', e);
              }
            }

            if (r2) {
              try {
                const item = await r2.get('data/wallpapers.json');
                let existing: any[] = item ? await item.json() : [];
                const map = new Map<string, any>();
                existing.forEach(x => map.set(x.id, x));
                itemsInput.forEach((x: any) => map.set(x.id, x));
                const merged = Array.from(map.values());
                await r2.put('data/wallpapers.json', JSON.stringify(merged), { httpMetadata: { contentType: 'application/json' } });
                return new Response(JSON.stringify({ success: true, storage: 'R2' }), { headers });
              } catch (e) {}
            }

            if (kv) {
              try {
                let existing: any[] = (await kv.get('data/wallpapers.json', 'json')) || [];
                const map = new Map<string, any>();
                existing.forEach(x => map.set(x.id, x));
                itemsInput.forEach((x: any) => map.set(x.id, x));
                const merged = Array.from(map.values());
                await kv.put('data/wallpapers.json', JSON.stringify(merged));
                return new Response(JSON.stringify({ success: true, storage: 'KV' }), { headers });
              } catch (e) {}
            }

            return new Response(JSON.stringify({ success: true }), { headers });
          }

          if (request.method === 'PUT' || request.method === 'PATCH') {
            const body: any = await request.json();
            const { id, action } = body;
            if (id && activeDb) {
              try {
                if (action === 'like') {
                  await activeDb.prepare("UPDATE wallpapers SET likes = COALESCE(likes, 0) + 1 WHERE id = ?").bind(id).run();
                } else if (action === 'unlike') {
                  await activeDb.prepare("UPDATE wallpapers SET likes = MAX(0, COALESCE(likes, 0) - 1) WHERE id = ?").bind(id).run();
                } else if (action === 'download') {
                  await activeDb.prepare("UPDATE wallpapers SET downloads = COALESCE(downloads, 0) + 1 WHERE id = ?").bind(id).run();
                }
              } catch (e) {}
            }
            return new Response(JSON.stringify({ success: true }), { headers });
          }

          if (request.method === 'DELETE') {
            const id = url.searchParams.get('id');
            const callerEmail = String(url.searchParams.get('adminEmail') || '').trim().toLowerCase();
            if (callerEmail && !ADMIN_EMAILS.has(callerEmail)) {
              return new Response(JSON.stringify({ success: false, message: 'Duvar kağıdı silme yetkisi yalnızca yöneticilere aittir.' }), { status: 403, headers });
            }
            if (id && activeDb) {
              try {
                await activeDb.prepare("DELETE FROM wallpapers WHERE id = ?").bind(id).run();
                const backupRow: any = await activeDb
                  .prepare("SELECT value FROM site_settings WHERE key = 'wallpapers_backup'")
                  .first()
                  .catch(() => null);
                if (backupRow && backupRow.value) {
                  const list = JSON.parse(backupRow.value);
                  if (Array.isArray(list)) {
                    await activeDb
                      .prepare("INSERT OR REPLACE INTO site_settings (key, value) VALUES ('wallpapers_backup', ?)")
                      .bind(JSON.stringify(list.filter((w: any) => w && w.id !== id)))
                      .run();
                  }
                }
              } catch (e) {}
            }
            if (id && r2) {
              try {
                const item = await r2.get('data/wallpapers.json');
                if (item) {
                  const list = await item.json();
                  await r2.put('data/wallpapers.json', JSON.stringify(list.filter((w: any) => w.id !== id)), { httpMetadata: { contentType: 'application/json' } });
                }
              } catch (e) {}
            }
            if (id && kv) {
              try {
                const list = (await kv.get('data/wallpapers.json', 'json')) || [];
                await kv.put('data/wallpapers.json', JSON.stringify(list.filter((w: any) => w.id !== id)));
              } catch (e) {}
            }
            return new Response(JSON.stringify({ success: true }), { headers });
          }
        }

          if (path.startsWith('/api/admin/grant-points')) {
            const activeDb = usersDb || db;
            if (request.method === 'GET') {
              if (activeDb) {
                try {
                  const { results } = await activeDb.prepare("SELECT * FROM point_grants ORDER BY created_at DESC LIMIT 200").all();
                  const logs = (results || []).map((r: any) => ({
                    id: r.id,
                    targetEmail: r.target_email,
                    amount: r.amount,
                    mode: r.mode,
                    note: r.note,
                    adminEmail: r.admin_email,
                    date: r.created_at,
                    timestamp: new Date(r.created_at).getTime() || Date.now(),
                    previousBalance: r.previous_balance,
                    newBalance: r.new_balance
                  }));
                  return new Response(JSON.stringify({ success: true, storage: 'D1', logs }), { headers });
                } catch (e) {}
              }
              return new Response(JSON.stringify({ success: true, logs: [] }), { headers });
            }

            if (request.method === 'POST') {
              const body: any = await request.json();
              const { targetEmail, amount, mode, note, adminEmail, previousBalance, newBalance } = body;
              if (!targetEmail) {
                return new Response(JSON.stringify({ success: false, message: 'Hedef e-posta adresi belirtilmelidir.' }), { status: 400, headers });
              }
              const cleanEmail = targetEmail.toLowerCase().trim();
              const logId = 'pgrant-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7);
              const dateStr = new Date().toLocaleString('tr-TR');
              const numAmount = Number(amount) || 0;
              const numNewBalance = Number(newBalance) || 0;
              const numPrevBalance = Number(previousBalance) || 0;

              if (activeDb) {
                try {
                  await activeDb.prepare(`
                    INSERT INTO point_grants (id, target_email, amount, mode, note, admin_email, created_at, previous_balance, new_balance)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                  `).bind(logId, cleanEmail, numAmount, mode || 'add', note || 'Manuel Yönetici Yüklemesi', adminEmail || 'admin', dateStr, numPrevBalance, numNewBalance).run();

                  const userRecord = await activeDb.prepare("SELECT * FROM users WHERE email = ?").bind(cleanEmail).first();
                  if (userRecord && userRecord.uid) {
                    const uid = userRecord.uid;
                    const libRecord = await activeDb.prepare("SELECT notifications, cosmo_points FROM user_library WHERE uid = ?").bind(uid).first();
                    let currentNotifs = [];
                    if (libRecord && libRecord.notifications) {
                      try { currentNotifs = JSON.parse(libRecord.notifications); } catch (e) {}
                    }
                    const signText = mode === 'add' ? `+${numAmount}` : mode === 'subtract' ? `-${numAmount}` : `${numNewBalance}`;
                    const sysNotif = {
                      id: 'n-' + Date.now(),
                      title: '🎁 Cosmo-Puan Tanımlandı!',
                      message: `Yönetici tarafından hesabınıza ${signText} Cosmo-Puan tanımlandı. Güncel Bakiye: ${numNewBalance} CP. ${note ? 'Not: ' + note : ''}`,
                      type: 'reward',
                      createdAt: Date.now(),
                      isRead: false
                    };
                    currentNotifs.unshift(sysNotif);

                    await activeDb.prepare(`
                      INSERT INTO user_library (uid, cosmo_points, notifications)
                      VALUES (?, ?, ?)
                      ON CONFLICT(uid) DO UPDATE SET
                      cosmo_points = ?,
                      notifications = ?
                    `).bind(uid, numNewBalance, JSON.stringify(currentNotifs.slice(0, 50)), numNewBalance, JSON.stringify(currentNotifs.slice(0, 50))).run();
                  } else {
                    const newUid = 'u-' + Date.now();
                    await activeDb.prepare(`
                      INSERT INTO users (uid, email, name, provider, created_at)
                      VALUES (?, ?, ?, 'email', ?)
                    `).bind(newUid, cleanEmail, cleanEmail.split('@')[0], dateStr).run();

                    const sysNotif = {
                      id: 'n-' + Date.now(),
                      title: '🎁 Cosmo-Puan Tanımlandı!',
                      message: `Hesabınıza ${numNewBalance} Cosmo-Puan tanımlandı. ${note ? 'Not: ' + note : ''}`,
                      type: 'reward',
                      createdAt: Date.now(),
                      isRead: false
                    };

                    await activeDb.prepare(`
                      INSERT INTO user_library (uid, cosmo_points, notifications)
                      VALUES (?, ?, ?)
                      ON CONFLICT(uid) DO UPDATE SET
                      cosmo_points = ?,
                      notifications = ?
                    `).bind(newUid, numNewBalance, JSON.stringify([sysNotif]), numNewBalance, JSON.stringify([sysNotif])).run();
                  }
                } catch (e) {
                  console.error('Error in grant-points worker:', e);
                }
              }

              const grantLog = {
                id: logId,
                targetEmail: cleanEmail,
                amount: numAmount,
                mode: mode || 'add',
                note: note || 'Manuel Yönetici Yüklemesi',
                adminEmail: adminEmail || 'admin',
                date: dateStr,
                timestamp: Date.now(),
                previousBalance: numPrevBalance,
                newBalance: numNewBalance
              };

              return new Response(JSON.stringify({
                success: true,
                message: `${targetEmail} hesabına ${numAmount} Cosmo-Puan başarıyla tanımlandı!`,
                log: grantLog,
                newBalance: numNewBalance
              }), { headers });
            }

            if (request.method === 'DELETE') {
              const url = new URL(request.url);
              const logId = url.searchParams.get('id');
              if (logId && activeDb) {
                await activeDb.prepare("DELETE FROM point_grants WHERE id = ?").bind(logId).run();
              }
              return new Response(JSON.stringify({ success: true }), { headers });
            }
          }

          // ===================== LEMON SQUEEZY WEBHOOK =====================
          if (path.startsWith('/api/webhooks/lemon-squeezy') || path.startsWith('/api/payments/lemon-webhook')) {
            if (request.method !== 'POST') {
              return new Response(JSON.stringify({ status: 'ok', message: 'Lemon Squeezy Webhook listener active' }), { headers });
            }

            try {
              const body = await request.json() as any;
              const eventName = body?.meta?.event_name || body?.event_name || 'order_created';
              const customData = body?.meta?.custom_data || {};
              const attributes = body?.data?.attributes || {};
              const orderId = body?.data?.id || attributes?.order_number || ('ord-' + Date.now());
              const userEmail = (customData?.user_email || attributes?.user_email || '').toLowerCase().trim();
              const userId = customData?.user_id;

              // Coins amount determination
              let coinsToAdd = 0;
              if (customData?.coins) {
                coinsToAdd = parseInt(customData.coins, 10) || 0;
              } else if (customData?.package_id) {
                if (customData.package_id === 'coins_starter') coinsToAdd = 250;
                else if (customData.package_id === 'coins_bronze') coinsToAdd = 1150;
                else if (customData.package_id === 'coins_silver') coinsToAdd = 3600;
                else if (customData.package_id === 'coins_gold') coinsToAdd = 13000;
              }

              // Fallback coin calculation from price (e.g. 299 cents -> $2.99 -> 1150 coins)
              if (!coinsToAdd) {
                const totalCents = attributes?.total || 0;
                if (totalCents >= 1900) coinsToAdd = 13000;
                else if (totalCents >= 600) coinsToAdd = 3600;
                else if (totalCents >= 250) coinsToAdd = 1150;
                else if (totalCents >= 90) coinsToAdd = 250;
                else coinsToAdd = 1150; // default for bronze if paid
              }

              const activeDb = usersDb || db;
              if (activeDb && (userEmail || userId) && coinsToAdd > 0) {
                // Find user
                let targetUser: any = null;
                if (userId) {
                  const res = await activeDb.prepare("SELECT uid, email, name FROM users WHERE uid = ?").bind(userId).first();
                  if (res) targetUser = res;
                }
                if (!targetUser && userEmail) {
                  const res = await activeDb.prepare("SELECT uid, email, name FROM users WHERE LOWER(email) = ?").bind(userEmail).first();
                  if (res) targetUser = res;
                }

                const targetUid = targetUser?.uid || userId || ('u-guest-' + Date.now());
                const finalEmail = targetUser?.email || userEmail;

                // Credit coins to user_library
                await activeDb.prepare(`
                  INSERT INTO user_library (uid, email, cosmo_points)
                  VALUES (?, ?, ?)
                  ON CONFLICT(uid) DO UPDATE SET
                    cosmo_points = COALESCE(user_library.cosmo_points, 0) + excluded.cosmo_points
                `).bind(targetUid, finalEmail, coinsToAdd).run().catch(() => {});

                // Record in point_grants log for admin visibility
                try {
                  await activeDb.prepare(`
                    INSERT INTO point_grants (id, target_email, amount, mode, note, admin_email, created_at)
                    VALUES (?, ?, ?, 'add', ?, 'Lemon Squeezy Webhook', ?)
                  `).bind(
                    'pg-lemon-' + orderId,
                    finalEmail,
                    coinsToAdd,
                    `Lemon Squeezy Siparişi #${orderId} (${attributes?.total_formatted || '$2.99'})`,
                    new Date().toISOString()
                  ).run();
                } catch(eLog) {}

                // Send notification to user library
                try {
                  const libRecord = await activeDb.prepare("SELECT notifications FROM user_library WHERE uid = ?").bind(targetUid).first();
                  let currentNotifs: any[] = [];
                  if (libRecord?.notifications) {
                    try { currentNotifs = JSON.parse(libRecord.notifications); } catch(eN) {}
                  }
                  currentNotifs.unshift({
                    id: 'notif-lemon-' + orderId,
                    title: '🍋 Cosmo-Puan Yüklendi!',
                    message: `Lemon Squeezy üzerinden satın aldığınız +${coinsToAdd.toLocaleString('tr-TR')} Cosmo-Puan hesabınıza tanımlandı. İyi okumalar!`,
                    type: 'system',
                    createdAt: Date.now(),
                    isRead: false
                  });
                  await activeDb.prepare("UPDATE user_library SET notifications = ? WHERE uid = ?").bind(JSON.stringify(currentNotifs.slice(0, 30)), targetUid).run();
                } catch(eNotif) {}

                return new Response(JSON.stringify({
                  success: true,
                  message: `Successfully credited ${coinsToAdd} coins to ${finalEmail}`,
                  orderId,
                  coins: coinsToAdd
                }), { headers });
              }

              return new Response(JSON.stringify({ success: true, message: 'Webhook received' }), { headers });
            } catch (err: any) {
              console.error('Error handling Lemon Squeezy webhook:', err);
              return new Response(JSON.stringify({ success: false, error: err?.message }), { status: 400, headers });
            }
          }

          // GET ALL USERS (For Admin & Status)
          if (path.startsWith('/api/admin/users') || path.startsWith('/api/auth/users')) {
            const activeDb = usersDb || db;
            if (activeDb) {
              try {
                const { results } = await activeDb.prepare(`
                  SELECT u.uid, u.email, u.name, u.avatar, u.provider, u.created_at, l.cosmo_points
                  FROM users u
                  LEFT JOIN user_library l ON u.uid = l.uid
                `).all();
                const usersList = (results || []).map((r: any) => ({
                  uid: r.uid,
                  email: r.email,
                  name: r.name,
                  avatar: r.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(r.email)}`,
                  coins: r.cosmo_points !== null && r.cosmo_points !== undefined ? r.cosmo_points : (r.email?.toLowerCase() === 'mikrokosmosfansub@gmail.com' ? 999999999 : 10),
                  role: (r.email?.toLowerCase() === 'aseleliyeva77@gmail.com' || r.email?.toLowerCase() === 'mikrokosmosfansub@gmail.com') || r.email?.toLowerCase() === 'mikrokosmosfansub@gmail.com' ? 'admin' : 'user',
                  created_at: r.created_at
                }));
                return new Response(JSON.stringify({ success: true, users: usersList }), { headers });
              } catch (e) {
                try {
                  const { results } = await activeDb.prepare("SELECT uid, email, name, avatar, provider, created_at FROM users").all();
                  const usersList = (results || []).map((r: any) => ({
                    uid: r.uid,
                    email: r.email,
                    name: r.name,
                    avatar: r.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(r.email)}`,
                    coins: (r.email?.toLowerCase() === 'mikrokosmosfansub@gmail.com') ? 999999999 : 10,
                    role: (r.email?.toLowerCase() === 'aseleliyeva77@gmail.com' || r.email?.toLowerCase() === 'mikrokosmosfansub@gmail.com') || r.email?.toLowerCase() === 'mikrokosmosfansub@gmail.com' ? 'admin' : 'user',
                    created_at: r.created_at
                  }));
                  return new Response(JSON.stringify({ success: true, users: usersList }), { headers });
                } catch (err) {}
              }
            }
          }

          // TEAM ROLES API (Assign, Update & Retrieve Staff Badges)
          if (path.startsWith('/api/team-roles') || path.startsWith('/api/admin/team-roles')) {
            const activeDb = usersDb || db;
            if (request.method === 'GET') {
              if (activeDb) {
                try {
                  await activeDb.prepare(`
                    CREATE TABLE IF NOT EXISTS team_roles (
                      email TEXT PRIMARY KEY,
                      uid TEXT,
                      name TEXT,
                      roles_json TEXT NOT NULL,
                      updated_at TEXT
                    );
                  `).run().catch(() => {});
                  const { results } = await activeDb.prepare("SELECT email, uid, name, roles_json, updated_at FROM team_roles").all();
                  const map: Record<string, any> = {};
                  (results || []).forEach((r: any) => {
                    const cleanEmail = (r.email || '').toLowerCase().trim();
                    let roles: string[] = [];
                    try {
                      roles = JSON.parse(r.roles_json);
                    } catch (e) {
                      if (r.roles_json) roles = [r.roles_json];
                    }
                    map[cleanEmail] = {
                      email: cleanEmail,
                      uid: r.uid,
                      name: r.name,
                      roles: Array.isArray(roles) ? roles : [],
                      updatedAt: r.updated_at
                    };
                  });
                  return new Response(JSON.stringify({ success: true, teamRoles: map }), { headers });
                } catch (e) {}
              }
              return new Response(JSON.stringify({ success: true, teamRoles: {} }), { headers });
            }

            if (request.method === 'POST') {
              const body = await request.json() as any;
              const { email, uid, name, roles } = body;
              const cleanEmail = (email || '').toLowerCase().trim();
              if (!cleanEmail) {
                return new Response(JSON.stringify({ success: false, message: 'Geçerli bir e-posta adresi gerekli.' }), { status: 400, headers });
              }
              if (activeDb) {
                try {
                  await activeDb.prepare(`
                    CREATE TABLE IF NOT EXISTS team_roles (
                      email TEXT PRIMARY KEY,
                      uid TEXT,
                      name TEXT,
                      roles_json TEXT NOT NULL,
                      updated_at TEXT
                    );
                  `).run().catch(() => {});
                  const rolesArray = Array.isArray(roles) ? roles : (roles ? [roles] : []);
                  await activeDb.prepare(`
                    INSERT OR REPLACE INTO team_roles (email, uid, name, roles_json, updated_at)
                    VALUES (?, ?, ?, ?, ?)
                  `).bind(cleanEmail, uid || '', name || '', JSON.stringify(rolesArray), new Date().toISOString()).run();
                  return new Response(JSON.stringify({ success: true, message: 'Ekip rolü başarıyla kaydedildi.' }), { headers });
                } catch (e: any) {
                  return new Response(JSON.stringify({ success: false, message: e?.message }), { status: 500, headers });
                }
              }
              return new Response(JSON.stringify({ success: false, message: 'Veritabanı hazır değil.' }), { status: 500, headers });
            }

            if (request.method === 'DELETE') {
              const url = new URL(request.url);
              const email = url.searchParams.get('email');
              const cleanEmail = (email || '').toLowerCase().trim();
              if (activeDb && cleanEmail) {
                try {
                  await activeDb.prepare("DELETE FROM team_roles WHERE email = ?").bind(cleanEmail).run();
                  return new Response(JSON.stringify({ success: true, message: 'Ekip rolü başarıyla silindi.' }), { headers });
                } catch (e: any) {
                  return new Response(JSON.stringify({ success: false, message: e?.message }), { status: 500, headers });
                }
              }
              return new Response(JSON.stringify({ success: false }), { headers });
            }
          }

        // AUTHENTICATION API
        if (path.startsWith('/api/auth')) {
          const userDb = usersDb || db || commentsDb;
          const ADMIN_EMAILS = new Set(['mikrokosmosfansub@gmail.com', 'aseleliyeva77@gmail.com']);

          // SEND OTP VERIFICATION CODE (REGISTER / RESET)
          if (path.startsWith('/api/auth/send-otp') && request.method === 'POST') {
            const body = await request.json() as any;
            const { email, mode, name, password } = body;

            if (!email || !email.trim()) {
              return new Response(JSON.stringify({ success: false, message: 'Lütfen geçerli bir e-posta adresi girin.' }), { status: 400, headers });
            }

            const cleanEmail = email.trim().toLowerCase();

            if (!isValidEmailFormat(cleanEmail)) {
              return new Response(JSON.stringify({
                success: false,
                message: 'Geçersiz e-posta formatı! Lütfen geçerli bir e-posta adresi girin (örn: ornek@gmail.com).'
              }), { headers });
            }

            if (isDisposableEmail(cleanEmail)) {
              return new Response(JSON.stringify({
                success: false,
                message: 'Geçici veya sahte (fake) e-posta adresleri kabul edilmemektedir. Lütfen gerçek bir e-posta adresi kullanın.'
              }), { headers });
            }

            const clientIp = request.headers.get('cf-connecting-ip') || 'anon-ip';
            const rateCheck = await checkRateLimit(kv, `otp:${cleanEmail || clientIp}`, 5, 60);
            if (!rateCheck.allowed) {
              return new Response(JSON.stringify({
                success: false,
                message: `⚡ Cloudflare Koruması: Çok fazla doğrulama isteği gönderildi. Lütfen ${rateCheck.retryAfter || 60} saniye sonra tekrar deneyin.`
              }), { status: 429, headers });
            }

            // Check if user already exists
            if (userDb) {
              try {
                const { results } = await userDb.prepare("SELECT uid, email FROM users WHERE email = ?").bind(cleanEmail).all();
                const userExists = results && results.length > 0;

                if (mode === 'register' && userExists) {
                  return new Response(JSON.stringify({
                    success: false,
                    message: `"${cleanEmail}" e-posta adresi sistemimizde zaten kayıtlı. Lütfen "Giriş Yap" sekmesini kullanarak giriş yapın.`
                  }), { headers });
                }

                if (mode === 'reset' && !userExists) {
                  return new Response(JSON.stringify({
                    success: false,
                    message: `"${cleanEmail}" adresine kayıtlı bir hesap bulunamadı.`
                  }), { headers });
                }

                if (mode === 'register' && name) {
                  const nameCheck = await userDb.prepare("SELECT uid FROM users WHERE LOWER(name) = LOWER(?)").bind(name.trim()).all();
                  if (nameCheck.results && nameCheck.results.length > 0) {
                    return new Response(JSON.stringify({
                      success: false,
                      message: `"${name.trim()}" kullanıcı adı başka bir üye tarafından kullanılıyor. Lütfen farklı bir isim seçin.`
                    }), { headers });
                  }
                }
              } catch (e: any) {
                console.error('Error checking user in send-otp:', e);
              }
            }

            // Generate 6-digit numeric OTP code
            const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
            const expiresAt = Date.now() + 3 * 60 * 1000; // 3 minutes valid

            // Store in-memory map
            OTP_STORE.set(cleanEmail, {
              code: otpCode,
              expiresAt,
              name: name?.trim(),
              password: password
            });

            // Store in D1 if table exists
            if (userDb) {
              try {
                let hashedPass = password ? await hashPassword(password) : null;
                await userDb.prepare(`
                  INSERT OR REPLACE INTO email_verifications (email, code, name, password_hash, expires_at, created_at)
                  VALUES (?, ?, ?, ?, ?, ?)
                `).bind(cleanEmail, otpCode, name?.trim() || null, hashedPass, expiresAt, new Date().toISOString()).run();
              } catch(e) {}
            }

            // Send actual email via Cloudflare Email Routing / Worker Email Binding
            const emailResult = await sendOtpEmailWithCloudflare(
              env,
              cleanEmail,
              otpCode,
              mode || 'register',
              name?.trim()
            );

            if (emailResult.sent) {
              return new Response(JSON.stringify({
                success: true,
                message: `6 haneli doğrulama kodu (${cleanEmail}) adresinize gönderildi. Lütfen gelen kutunuzu (ve gerekiyorsa spam/istenmeyen klasörünü) kontrol ediniz.`,
                emailDelivery: emailResult.provider,
                email: cleanEmail,
                expiresAt
              }), { headers });
            } else {
              return new Response(JSON.stringify({
                success: true,
                message: `⚠️ E-posta sunucusuna ulaşılamadı. Güvenlik kodunuz: ${otpCode}`,
                devOtpCode: otpCode,
                otpCode: otpCode,
                emailDelivery: 'onscreen_fallback',
                email: cleanEmail,
                expiresAt
              }), { headers });
            }
          }

          // REGISTER USER (WITH OPTIONAL OTP CODE & HASHED PASSWORD)
          if ((path.startsWith('/api/auth/register') || path.startsWith('/api/auth/verify-otp-and-register')) && request.method === 'POST') {
            const body = await request.json() as any;
            const { name, email, password, otpCode, code } = body;
            const finalCode = otpCode || code;

            if (!name || !email || !password) {
              return new Response(JSON.stringify({ success: false, message: 'Lütfen kullanıcı adı, e-posta ve şifrenizi eksiksiz doldurun.' }), { status: 400, headers });
            }

            const cleanEmail = email.trim().toLowerCase();
            const cleanName = name.trim();

            if (!isValidEmailFormat(cleanEmail)) {
              return new Response(JSON.stringify({ success: false, message: 'Geçersiz e-posta formatı!' }), { headers });
            }

            if (isDisposableEmail(cleanEmail)) {
              return new Response(JSON.stringify({ success: false, message: 'Geçici / sahte (fake) e-posta adresleriyle kayıt olunamaz. Lütfen gerçek bir e-posta adresi kullanın.' }), { headers });
            }

            if (password.length < 6) {
              return new Response(JSON.stringify({ success: false, message: 'Şifreniz en az 6 karakter uzunluğunda olmalıdır.' }), { headers });
            }

            const clientIp = request.headers.get('cf-connecting-ip') || 'anon-ip';
            const rateCheck = await checkRateLimit(kv, `register:${clientIp}`, 8, 60);
            if (!rateCheck.allowed) {
              return new Response(JSON.stringify({
                success: false,
                message: `⚡ Cloudflare Koruması: Çok fazla deneme yapıldı. Lütfen ${rateCheck.retryAfter || 60} saniye bekleyin.`
              }), { status: 429, headers });
            }

            const hashedPassword = await hashPassword(password);
            const isAdmin = ADMIN_EMAILS.has(cleanEmail);
            const startingCoins = (cleanEmail === 'mikrokosmosfansub@gmail.com') ? 999999999 : 10;
            const uid = 'u-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6);
            const avatar = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(cleanName)}`;
            const createdAt = new Date().toISOString();

            if (userDb) {
              try {
                // Check email existence
                const emailCheck = await userDb.prepare("SELECT uid FROM users WHERE email = ?").bind(cleanEmail).all();
                if (emailCheck.results && emailCheck.results.length > 0) {
                  return new Response(JSON.stringify({ success: false, message: `"${cleanEmail}" e-posta adresiyle zaten kayıtlı bir hesap var. Lütfen giriş yapın.` }), { headers });
                }

                // Check username uniqueness
                const nameCheck = await userDb.prepare("SELECT uid FROM users WHERE LOWER(name) = LOWER(?)").bind(cleanName).all();
                if (nameCheck.results && nameCheck.results.length > 0) {
                  return new Response(JSON.stringify({ success: false, message: `"${cleanName}" kullanıcı adı zaten başka bir üye tarafından kullanılıyor. Lütfen farklı bir isim seçin.` }), { headers });
                }

                await userDb.prepare(`
                  INSERT INTO users (uid, email, password_hash, name, avatar, provider, role, created_at, last_login)
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                `).bind(uid, cleanEmail, hashedPassword, cleanName, avatar, 'email', isAdmin ? 'admin' : 'user', createdAt, createdAt).run();

                // Initialize user library record for new user
                try {
                  const welcomeNotif = [{
                    id: 'welcome-' + Date.now(),
                    title: 'Mikrokosmos Fansub\'a Hoş Geldiniz! ✨',
                    message: 'Aramıza hoş geldiniz! Takip ettiğiniz serilerin yeni bölümleri yayınlandığında buradan bildirim alacaksınız.',
                    type: 'system',
                    createdAt: new Date().toISOString(),
                    isRead: false
                  }];

                  await userDb.prepare(`
                    INSERT INTO user_library (uid, name, email, cosmo_points, followed_series, bookmarks, reading_history, notifications, shop_items, reading_lists)
                    VALUES (?, ?, ?, ?, '[]', '{}', '{}', ?, '[]', '[]')
                  `).bind(uid, cleanName, cleanEmail, startingCoins, JSON.stringify(welcomeNotif)).run();
                } catch(eLib) {}

                // Clean up OTP
                OTP_STORE.delete(cleanEmail);
                try { await userDb.prepare("DELETE FROM email_verifications WHERE email = ?").bind(cleanEmail).run(); } catch(e) {}

                return new Response(JSON.stringify({
                  success: true,
                  message: 'Üyeliğiniz başarıyla oluşturuldu! Hoş geldiniz.',
                  user: {
                    uid,
                    name: cleanName,
                    email: cleanEmail,
                    avatar,
                    provider: 'email',
                    role: isAdmin ? 'admin' : 'user',
                    coins: startingCoins,
                    createdAt
                  }
                }), { headers });
              } catch (e: any) {
                console.error('Error in D1 user registration:', e);
              }
            }

            // Fallback user creation if DB offline
            return new Response(JSON.stringify({
              success: true,
              message: 'Üyeliğiniz oluşturuldu.',
              user: {
                uid,
                name: cleanName,
                email: cleanEmail,
                avatar,
                provider: 'email',
                role: isAdmin ? 'admin' : 'user',
                coins: startingCoins,
                createdAt
              }
            }), { headers });
          }

          // RESET PASSWORD WITH OTP
          if (path.startsWith('/api/auth/reset-password') && request.method === 'POST') {
            const body = await request.json() as any;
            const { email, code, otpCode, newPassword } = body;
            const finalCode = otpCode || code;

            if (!email || !finalCode || !newPassword) {
              return new Response(JSON.stringify({ success: false, message: 'Lütfen tüm alanları doldurun.' }), { status: 400, headers });
            }

            const cleanEmail = email.trim().toLowerCase();
            const cleanCode = String(finalCode).trim();

            if (newPassword.length < 6) {
              return new Response(JSON.stringify({ success: false, message: 'Yeni şifreniz en az 6 karakter olmalıdır.' }), { headers });
            }

            // Verify OTP
            const storedOtp = OTP_STORE.get(cleanEmail);
            let isValid = false;
            if (storedOtp && storedOtp.code === cleanCode && Date.now() < storedOtp.expiresAt) {
              isValid = true;
            } else if (userDb) {
              try {
                const dbOtp = await userDb.prepare("SELECT * FROM email_verifications WHERE email = ? AND code = ?").bind(cleanEmail, cleanCode).all();
                if (dbOtp.results && dbOtp.results.length > 0) {
                  const row: any = dbOtp.results[0];
                  if (row.expires_at > Date.now()) isValid = true;
                }
              } catch(e) {}
            }

            if (!isValid) {
              return new Response(JSON.stringify({ success: false, message: 'Girdiğiniz doğrulama kodu geçersiz veya süresi dolmuş.' }), { headers });
            }

            const hashedPassword = await hashPassword(newPassword);

            if (userDb) {
              try {
                await userDb.prepare("UPDATE users SET password_hash = ? WHERE email = ?").bind(hashedPassword, cleanEmail).run();
                OTP_STORE.delete(cleanEmail);
                try { await userDb.prepare("DELETE FROM email_verifications WHERE email = ?").bind(cleanEmail).run(); } catch(e) {}
                return new Response(JSON.stringify({ success: true, message: 'Şifreniz başarıyla sıfırlandı. Yeni şifrenizle giriş yapabilirsiniz.' }), { headers });
              } catch(e) {
                console.error('Error updating password:', e);
              }
            }

            return new Response(JSON.stringify({ success: true, message: 'Şifreniz başarıyla güncellendi.' }), { headers });
          }

          // CHECK USERNAME AVAILABILITY
          if (path.startsWith('/api/auth/check-username') && request.method === 'POST') {
            const body = await request.json() as any;
            const { name, excludeUid } = body;
            if (!name || typeof name !== 'string') {
              return new Response(JSON.stringify({ available: false, message: 'Geçersiz kullanıcı adı.' }), { headers });
            }
            const cleanName = name.trim();
            if (cleanName.length < 3) {
              return new Response(JSON.stringify({ available: false, message: 'Kullanıcı adı en az 3 karakter olmalıdır.' }), { headers });
            }
            if (cleanName.length > 25) {
              return new Response(JSON.stringify({ available: false, message: 'Kullanıcı adı en fazla 25 karakter olabilir.' }), { headers });
            }

            const canonical = toCanonicalUsername(cleanName);
            if (!canonical || canonical.length < 3) {
              return new Response(JSON.stringify({ available: false, message: 'Kullanıcı adı harf veya rakam içermeli ve en az 3 karakter olmalıdır.' }), { headers });
            }

            // Reserved admin names
            if (['admin', 'administrator', 'mikrokosmos', 'mikrokosmosfansub', 'moderator', 'mod', 'kurucu'].includes(canonical)) {
              return new Response(JSON.stringify({ available: false, message: 'Bu kullanıcı adı sistem tarafından ayrılmıştır.' }), { headers });
            }

            if (userDb) {
              try {
                // Fetch all usernames or check both exact and canonical equality
                const { results } = await userDb.prepare("SELECT uid, name FROM users").all();
                if (results && results.length > 0) {
                  const match = (results as any[]).find(u => {
                    if (excludeUid && u.uid === excludeUid) return false;
                    const uCanon = toCanonicalUsername(u.name);
                    return uCanon === canonical;
                  });
                  if (match) {
                    return new Response(JSON.stringify({
                      available: false,
                      message: `"${cleanName}" (veya benzeri bir isim) başka bir üye tarafından kullanılıyor. Lütfen farklı bir kullanıcı adı seçin.`
                    }), { headers });
                  }
                }
              } catch (e: any) {
                console.error('Error in check-username:', e);
              }
            }

            return new Response(JSON.stringify({ available: true, message: 'Kullanıcı adı kullanılabilir.' }), { headers });
          }

          // UPDATE USER PROFILE
          if (path.startsWith('/api/auth/update-profile') && request.method === 'POST') {
            const body = await request.json() as any;
            const { uid, name, avatar, bio } = body;

            if (!uid || !name) {
              return new Response(JSON.stringify({ success: false, message: 'Eksik üye bilgisi.' }), { status: 400, headers });
            }

            const cleanName = name.trim();
            const cleanAvatar = avatar ? avatar.trim() : `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(cleanName)}`;
            const cleanBio = bio !== undefined ? String(bio).trim() : undefined;

            if (userDb) {
              try {
                // Check if username is already taken by another user
                const { results } = await userDb.prepare("SELECT uid FROM users WHERE LOWER(name) = LOWER(?) AND uid != ?").bind(cleanName, uid).all();
                if (results && results.length > 0) {
                  return new Response(JSON.stringify({
                    success: false,
                    message: `"${cleanName}" kullanıcı adı başka bir üye tarafından kullanılıyor. Lütfen benzersiz bir isim seçin.`
                  }), { headers });
                }

                if (cleanBio !== undefined) {
                  try {
                    await userDb.prepare("UPDATE users SET name = ?, avatar = ?, bio = ? WHERE uid = ?").bind(cleanName, cleanAvatar, cleanBio, uid).run();
                  } catch (eBio) {
                    await userDb.prepare("UPDATE users SET name = ?, avatar = ? WHERE uid = ?").bind(cleanName, cleanAvatar, uid).run();
                  }
                } else {
                  await userDb.prepare("UPDATE users SET name = ?, avatar = ? WHERE uid = ?").bind(cleanName, cleanAvatar, uid).run();
                }

                // Also update user's comments in comments table if commentsDb exists
                if (commentsDb) {
                  try {
                    await commentsDb.prepare("UPDATE comments SET user_name = ?, user_avatar = ? WHERE user_id = ?").bind(cleanName, cleanAvatar, uid).run();
                  } catch (ce) {}
                }

                return new Response(JSON.stringify({
                  success: true,
                  message: 'Profil bilgileriniz başarıyla güncellendi.',
                  user: { uid, name: cleanName, avatar: cleanAvatar, bio: cleanBio }
                }), { headers });
              } catch (e: any) {
                console.error('Error updating profile in D1:', e);
              }
            }

            return new Response(JSON.stringify({
              success: true,
              message: 'Profil güncellendi.',
              user: { uid, name: cleanName, avatar: cleanAvatar, bio: cleanBio }
            }), { headers });
          }

          // DELETE USER ACCOUNT & ALL DATA
          if (path.startsWith('/api/auth/delete-account') && request.method === 'POST') {
            const body = await request.json() as any;
            const { uid, email, name } = body;

            if (!uid && !email) {
              return new Response(JSON.stringify({ success: false, message: 'Silinecek üye Kimliği (UID) bulunamadı.' }), { status: 400, headers });
            }

            if (userDb) {
              try {
                let userName = name || '';
                let userEmail = email || '';
                try {
                  const { results } = await userDb.prepare("SELECT uid, email, name FROM users WHERE uid = ? OR email = ?").bind(uid || '', email || '').all();
                  if (results && results.length > 0) {
                    const row: any = results[0];
                    if (row.name) userName = row.name;
                    if (row.email) userEmail = row.email;
                  }
                } catch (selErr) {}

                await userDb.prepare("DELETE FROM users WHERE uid = ? OR email = ?").bind(uid || '', email || '').run();
                await userDb.prepare("DELETE FROM user_library WHERE uid = ?").bind(uid || '').run();

                // Persist to deleted_users table
                await userDb.prepare(`
                  CREATE TABLE IF NOT EXISTS deleted_users (
                    uid TEXT PRIMARY KEY,
                    email TEXT,
                    name TEXT,
                    deleted_at TEXT
                  )
                `).run().catch(() => {});
                await userDb.prepare("INSERT OR REPLACE INTO deleted_users (uid, email, name, deleted_at) VALUES (?, ?, ?, ?)")
                  .bind(uid || `del-${Date.now()}`, userEmail, userName, new Date().toISOString()).run().catch(() => {});
              } catch (e) {
                console.error('Error deleting user from USERS_DB:', e);
              }
            }

            return new Response(JSON.stringify({
              success: true,
              message: 'Hesabınız Mikrokosmos Fansub veritabanından başarıyla silindi.'
            }), { headers });
          }

          // GET OR ADD DELETED USERS LIST (For Top 50 Leaderboard filtering & Admin tracking)
          if (path.startsWith('/api/auth/deleted-users')) {
            if (request.method === 'GET') {
              if (userDb) {
                try {
                  await userDb.prepare(`
                    CREATE TABLE IF NOT EXISTS deleted_users (
                      uid TEXT PRIMARY KEY,
                      email TEXT,
                      name TEXT,
                      deleted_at TEXT
                    )
                  `).run().catch(() => {});
                  const { results } = await userDb.prepare("SELECT uid, email, name, deleted_at FROM deleted_users").all();
                  return new Response(JSON.stringify({ success: true, deletedUsers: results || [] }), { headers });
                } catch (e) {}
              }
              return new Response(JSON.stringify({ success: true, deletedUsers: [] }), { headers });
            }

            if (request.method === 'POST') {
              const body = await request.json() as any;
              const { uid, email, name } = body;
              if (userDb && (uid || email || name)) {
                try {
                  await userDb.prepare(`
                    CREATE TABLE IF NOT EXISTS deleted_users (
                      uid TEXT PRIMARY KEY,
                      email TEXT,
                      name TEXT,
                      deleted_at TEXT
                    )
                  `).run().catch(() => {});
                  await userDb.prepare("INSERT OR REPLACE INTO deleted_users (uid, email, name, deleted_at) VALUES (?, ?, ?, ?)")
                    .bind(uid || `del-${Date.now()}`, email || '', name || '', new Date().toISOString()).run();
                  return new Response(JSON.stringify({ success: true, message: 'Kullanıcı silinenler listesine eklendi.' }), { headers });
                } catch (e) {}
              }
              return new Response(JSON.stringify({ success: false }), { headers });
            }
          }

          // LOGIN USER (SECURE PASSWORD CHECK WITH HASH VERIFICATION)
          if (path.startsWith('/api/auth/login') && request.method === 'POST') {
            const body = await request.json() as any;
            const { email, password } = body;

            if (!email || !password) {
              return new Response(JSON.stringify({ success: false, message: 'Lütfen e-posta ve şifrenizi girin.' }), { status: 400, headers });
            }

            const cleanEmail = email.trim().toLowerCase();

            const clientIp = request.headers.get('cf-connecting-ip') || 'anon-ip';
            const rateCheck = await checkRateLimit(kv, `login:${cleanEmail || clientIp}`, 6, 60);
            if (!rateCheck.allowed) {
              return new Response(JSON.stringify({
                success: false,
                message: `⚡ Cloudflare Güvenlik Koruması: Bu hesap için 1 dakika içinde çok fazla deneme yapıldı. Lütfen ${rateCheck.retryAfter || 60} saniye bekleyin.`
              }), { status: 429, headers });
            }

            if (userDb) {
              try {
                const { results } = await userDb.prepare("SELECT * FROM users WHERE email = ?").bind(cleanEmail).all();
                const isAdminAccount = ADMIN_EMAILS.has(cleanEmail);
                const isMasterPin = password.trim() === '454645' || password.trim() === '1234';

                if (!results || results.length === 0) {
                  // If it is an authorized admin account and PIN is provided, auto-provision the user record
                  if (isAdminAccount && isMasterPin) {
                    const uid = 'u-admin-' + (cleanEmail.startsWith('aseleliyeva') ? '1' : '0');
                    const name = cleanEmail === 'aseleliyeva77@gmail.com' ? 'Aseleliyeva' : 'Mikrokosmos';
                    const avatar = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(name)}`;
                    const createdAt = new Date().toISOString();
                    const coins = cleanEmail === 'mikrokosmosfansub@gmail.com' ? 999999999 : 10;
                    const hashedPass = await hashPassword(password);

                    try {
                      await userDb.prepare(`
                        INSERT OR REPLACE INTO users (uid, email, password_hash, name, avatar, provider, role, created_at, last_login)
                        VALUES (?, ?, ?, ?, ?, 'email', 'admin', ?, ?)
                      `).bind(uid, cleanEmail, hashedPass, name, avatar, createdAt, createdAt).run();

                      await userDb.prepare(`
                        INSERT OR IGNORE INTO user_library (uid, name, email, cosmo_points, followed_series, bookmarks, reading_history, notifications, shop_items, reading_lists)
                        VALUES (?, ?, ?, ?, '[]', '{}', '{}', '[]', '[]', '[]')
                      `).bind(uid, name, cleanEmail, coins).run();
                    } catch(eIns) {}

                    return new Response(JSON.stringify({
                      success: true,
                      message: 'Yönetici girişi başarılı!',
                      user: {
                        uid,
                        name,
                        email: cleanEmail,
                        avatar,
                        provider: 'email',
                        role: 'admin',
                        coins,
                        createdAt
                      }
                    }), { headers });
                  }

                  return new Response(JSON.stringify({ success: false, message: 'Bu e-posta adresiyle kayıtlı bir üye bulunamadı. Lütfen önce Kayıt Olun.' }), { headers });
                }

                const foundUser: any = results[0];
                const inputHashed = await hashPassword(password);

                // Verify either hashed password OR legacy plaintext match OR master admin PIN for authorized admins
                const isPasswordValid = (foundUser.password_hash === inputHashed) || 
                                        (foundUser.password_hash === password) ||
                                        (isAdminAccount && isMasterPin);

                if (!isPasswordValid) {
                  return new Response(JSON.stringify({ success: false, message: 'Girdiğiniz şifre hatalı. Lütfen tekrar deneyin.' }), { headers });
                }

                // If admin logged in with PIN or password, update to current hash
                if (foundUser.password_hash !== inputHashed && !isMasterPin) {
                  try {
                    await userDb.prepare("UPDATE users SET password_hash = ? WHERE uid = ?").bind(inputHashed, foundUser.uid).run();
                  } catch(e) {}
                }

                try {
                  await userDb.prepare("UPDATE users SET last_login = ? WHERE uid = ?").bind(new Date().toISOString(), foundUser.uid).run();
                } catch(e) {}

                // Fetch real Cosmo-points and library info
                let userCoins = (cleanEmail === 'mikrokosmosfansub@gmail.com') ? 999999999 : 10;
                let equippedTheme = null;
                let equippedBadge = null;
                let equippedBadges = [];
                let equippedFrame = null;
                let dailyCheckinDay = 0;
                let lastDailyCheckin = null;
                let claimedCheckinDays = [];
                let userInventory: string[] = [];
                try {
                  const libRes = await userDb.prepare("SELECT cosmo_points, shop_items, equipped_theme, equipped_badge, equipped_badges, equipped_frame, daily_checkin_day, last_daily_checkin, claimed_checkin_days FROM user_library WHERE uid = ?").bind(foundUser.uid).all();
                  if (libRes.results && libRes.results.length > 0) {
                    const row: any = libRes.results[0];
                    if (row.cosmo_points !== undefined && row.cosmo_points !== null) {
                      userCoins = (cleanEmail === 'mikrokosmosfansub@gmail.com') ? 999999999 : Number(row.cosmo_points);
                    }
                    equippedTheme = row.equipped_theme;
                    equippedBadge = row.equipped_badge;
                    equippedFrame = row.equipped_frame;
                    dailyCheckinDay = row.daily_checkin_day || 0;
                    lastDailyCheckin = row.last_daily_checkin || null;
                    try { equippedBadges = JSON.parse(row.equipped_badges || '[]'); } catch(e) {}
                    try { claimedCheckinDays = JSON.parse(row.claimed_checkin_days || '[]'); } catch(e) {}
                    try {
                      const parsedInv = JSON.parse(row.shop_items || '[]');
                      if (Array.isArray(parsedInv)) userInventory = parsedInv;
                    } catch(e) {}
                  }
                } catch(e) {}

                const isAdmin = ADMIN_EMAILS.has(cleanEmail) || foundUser.role === 'admin';

                return new Response(JSON.stringify({
                  success: true,
                  message: 'Giriş başarılı!',
                  user: {
                    uid: foundUser.uid,
                    name: foundUser.name,
                    username: foundUser.username || toCanonicalUsername(foundUser.name) || foundUser.email.split('@')[0],
                    email: foundUser.email,
                    avatar: foundUser.avatar,
                    bio: foundUser.bio,
                    provider: foundUser.provider || 'email',
                    role: isAdmin ? 'admin' : 'user',
                    coins: userCoins,
                    inventory: userInventory,
                    unlockedEmojiPacks: userInventory,
                    equippedTheme,
                    equippedBadge,
                    equippedBadges,
                    equippedFrame,
                    dailyCheckinDay,
                    lastDailyCheckin,
                    claimedCheckinDays,
                    createdAt: foundUser.created_at
                  }
                }), { headers });
              } catch (e: any) {
                console.error('Error in D1 user login:', e);
              }
            }

            // Fallback login for offline preview
            const isAdmin = ADMIN_EMAILS.has(cleanEmail);
            return new Response(JSON.stringify({
              success: true,
              message: 'Giriş yapıldı.',
              user: {
                uid: 'u-' + Date.now(),
                name: cleanEmail.split('@')[0],
                email: cleanEmail,
                avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(cleanEmail)}`,
                provider: 'email',
                role: isAdmin ? 'admin' : 'user',
                coins: (cleanEmail === 'mikrokosmosfansub@gmail.com') ? 999999999 : 10
              }
            }), { headers });
          }

          // GOOGLE LOGIN / REGISTER
          if (path.startsWith('/api/auth/google') && request.method === 'POST') {
            const body = await request.json() as any;
            const { email, name, avatar, action } = body;

            if (!email || !email.trim()) {
              return new Response(JSON.stringify({ success: false, message: 'Lütfen geçerli bir Google e-posta adresi girin.' }), { status: 400, headers });
            }

            const cleanEmail = email.trim().toLowerCase();
            const cleanName = (name || cleanEmail.split('@')[0]).trim();
            const userAvatar = avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(cleanName)}`;
            const isAdmin = ADMIN_EMAILS.has(cleanEmail);
            const isUnlimited = (cleanEmail === 'mikrokosmosfansub@gmail.com');

            if (userDb) {
              try {
                const { results } = await userDb.prepare("SELECT * FROM users WHERE email = ?").bind(cleanEmail).all();
                const existingUser: any = (results && results.length > 0) ? results[0] : null;

                // Strict Google Auth: Register vs Login
                if (action === 'register') {
                  if (existingUser) {
                    return new Response(JSON.stringify({
                      success: false,
                      message: `"${cleanEmail}" e-posta adresiyle zaten kayıtlı bir hesap var. Lütfen "Giriş Yap" sekmesini kullanın.`
                    }), { headers });
                  }

                  // Check username uniqueness
                  let finalName = cleanName;
                  const nameCheck = await userDb.prepare("SELECT uid FROM users WHERE LOWER(name) = LOWER(?)").bind(cleanName).all();
                  if (nameCheck.results && nameCheck.results.length > 0) {
                    finalName = `${cleanName}_${Math.floor(1000 + Math.random() * 9000)}`;
                  }

                  const uid = 'u-g-' + Date.now();
                  const createdAt = new Date().toISOString();
                  const coins = isUnlimited ? 999999999 : 10;

                  await userDb.prepare(`
                    INSERT INTO users (uid, email, password_hash, name, avatar, provider, role, created_at, last_login)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                  `).bind(uid, cleanEmail, 'GOOGLE_AUTH', finalName, userAvatar, 'google', isAdmin ? 'admin' : 'user', createdAt, createdAt).run();

                  try {
                    const welcomeNotif = [{
                      id: 'welcome-' + Date.now(),
                      title: 'Mikrokosmos Fansub\'a Hoş Geldiniz! ✨',
                      message: 'Google ile üyeliğiniz tamamlandı! Takip ettiğiniz serilerin yeni bölümleri yayınlandığında buradan bildirim alacaksınız.',
                      type: 'system',
                      createdAt: new Date().toISOString(),
                      isRead: false
                    }];

                    await userDb.prepare(`
                      INSERT INTO user_library (uid, name, email, cosmo_points, followed_series, bookmarks, reading_history, notifications, shop_items, reading_lists)
                      VALUES (?, ?, ?, ?, '[]', '{}', '{}', ?, '[]', '[]')
                    `).bind(uid, finalName, cleanEmail, coins, JSON.stringify(welcomeNotif)).run();
                  } catch(eLib) {}

                  return new Response(JSON.stringify({
                    success: true,
                    message: 'Google hesabınızla üyeliğiniz başarıyla oluşturuldu!',
                    user: { uid, name: finalName, email: cleanEmail, avatar: userAvatar, provider: 'google', role: isAdmin ? 'admin' : 'user', coins, createdAt }
                  }), { headers });
                }

                // Default / Login Action
                if (!existingUser) {
                  return new Response(JSON.stringify({
                    success: false,
                    message: `"${cleanEmail}" e-posta adresiyle kayıtlı bir hesap bulunamadı. Lütfen önce "Kayıt Ol" sekmesinden üye olun.`
                  }), { headers });
                }

                try {
                  await userDb.prepare("UPDATE users SET last_login = ? WHERE uid = ?").bind(new Date().toISOString(), existingUser.uid).run();
                } catch(e) {}

                let userCoins = isUnlimited ? 999999999 : 10;
                let userInventory: string[] = [];
                let equippedTheme = null;
                let equippedBadge = null;
                let equippedBadges: string[] = [];
                let equippedFrame = null;
                try {
                  const libRes = await userDb.prepare("SELECT cosmo_points, shop_items, equipped_theme, equipped_badge, equipped_badges, equipped_frame FROM user_library WHERE uid = ?").bind(existingUser.uid).all();
                  if (libRes.results && libRes.results.length > 0) {
                    const row: any = libRes.results[0];
                    userCoins = isUnlimited ? 999999999 : (Number(row.cosmo_points) || 10);
                    equippedTheme = row.equipped_theme || null;
                    equippedBadge = row.equipped_badge || null;
                    equippedFrame = row.equipped_frame || null;
                    try {
                      const parsedInv = JSON.parse(row.shop_items || '[]');
                      if (Array.isArray(parsedInv)) userInventory = parsedInv;
                    } catch(e) {}
                    try {
                      const parsedBadges = JSON.parse(row.equipped_badges || '[]');
                      if (Array.isArray(parsedBadges)) equippedBadges = parsedBadges;
                    } catch(e) {}
                  }
                } catch(e) {}

                return new Response(JSON.stringify({
                  success: true,
                  message: `Google hesabınızla (${existingUser.email}) başarıyla giriş yapıldı!`,
                  user: {
                    uid: existingUser.uid,
                    name: existingUser.name,
                    email: existingUser.email,
                    avatar: existingUser.avatar,
                    provider: existingUser.provider || 'google',
                    role: (isAdmin || existingUser.role === 'admin') ? 'admin' : 'user',
                    coins: userCoins,
                    inventory: userInventory,
                    unlockedEmojiPacks: userInventory,
                    equippedTheme,
                    equippedBadge,
                    equippedBadges,
                    equippedFrame,
                    createdAt: existingUser.created_at
                  }
                }), { headers });
              } catch (e: any) {
                console.error('Error in Google auth:', e);
              }
            }

            return new Response(JSON.stringify({
              success: false,
              message: 'Veritabanı bağlantısı kurulamadı veya kayıt bulunamadı.'
            }), { headers });
          }

          if (path.startsWith('/api/auth/library') && request.method === 'GET') {
            const uid = url.searchParams.get('uid');
            if (!uid) {
              return new Response(JSON.stringify({ success: false, message: 'UID required' }), { status: 400, headers });
            }
            if (userDb) {
              try {
                const { results } = await userDb.prepare("SELECT * FROM user_library WHERE uid = ?").bind(uid).all();
                if (results && results.length > 0) {
                  const row: any = results[0];
                  return new Response(JSON.stringify({
                    success: true,
                    followed_series: row.followed_series || '[]',
                    bookmarks: row.bookmarks || '{}',
                    reading_history: row.reading_history || '{}',
                    notifications: row.notifications || '[]',
                    cosmo_points: row.cosmo_points || 0,
                    shop_items: row.shop_items || '[]',
                    equipped_theme: row.equipped_theme || null,
                    equipped_badge: row.equipped_badge || null,
                    equipped_badges: row.equipped_badges || '[]',
                    equipped_frame: row.equipped_frame || '',
                    reading_lists: row.reading_lists || '[]',
                    daily_checkin_day: row.daily_checkin_day || 0,
                    last_daily_checkin: row.last_daily_checkin || null,
                    claimed_checkin_days: row.claimed_checkin_days || '[]'
                  }), { headers });
                }
                return new Response(JSON.stringify({ success: true, followed_series: '[]', bookmarks: '{}', reading_history: '{}', notifications: '[]', cosmo_points: 0, shop_items: '[]', equipped_theme: '', equipped_badge: '', equipped_badges: '[]', equipped_frame: '', reading_lists: '[]', daily_checkin_day: 0, last_daily_checkin: null, claimed_checkin_days: '[]' }), { headers });
              } catch (e: any) {
                return new Response(JSON.stringify({ success: false, message: e.message }), { status: 500, headers });
              }
            }
            
            return new Response(JSON.stringify({ 
              success: false, 
              message: 'Üyelik veritabanı bulunamadı.' 
            }), { status: 400, headers });
          }

          if (path.startsWith('/api/auth/library') && request.method === 'POST') {
            const body = await request.json() as any;
            const { uid, followed_series, bookmarks, reading_history, notifications, cosmo_points, shop_items, equipped_theme, equipped_badge, equipped_badges, equipped_frame, reading_lists, daily_checkin_day, last_daily_checkin, claimed_checkin_days } = body;
            if (!uid) {
              return new Response(JSON.stringify({ success: false, message: 'UID required' }), { status: 400, headers });
            }
            if (userDb) {
              const saveLibrary = async () => {
                const userRow = await userDb.prepare("SELECT name, email FROM users WHERE uid = ?").bind(uid).first().catch(() => null) as any;
                const existingLib = await userDb.prepare("SELECT * FROM user_library WHERE uid = ?").bind(uid).first().catch(() => null) as any;

                const finalFollowed = followed_series !== undefined ? followed_series : (existingLib?.followed_series || '[]');
                const finalBookmarks = bookmarks !== undefined ? bookmarks : (existingLib?.bookmarks || '{}');
                const finalHistory = reading_history !== undefined ? reading_history : (existingLib?.reading_history || '{}');
                const finalNotifs = notifications !== undefined ? notifications : (existingLib?.notifications || '[]');
                const finalPoints = cosmo_points !== undefined ? Number(cosmo_points) : (existingLib?.cosmo_points || 0);
                let finalShop = shop_items !== undefined ? shop_items : (existingLib?.shop_items || '[]');
                try {
                  const existingArr = JSON.parse(existingLib?.shop_items || '[]');
                  const incomingArr = shop_items !== undefined
                    ? (typeof shop_items === 'string' ? JSON.parse(shop_items) : shop_items)
                    : [];
                  if (Array.isArray(existingArr) || Array.isArray(incomingArr)) {
                    const nowMs = Date.now();
                    const durationMs = 30 * 24 * 60 * 60 * 1000;
                    const expMap: Record<string, number> = {};
                    const rawIds = new Set<string>();
                    for (const arr of [existingArr, incomingArr]) {
                      if (!Array.isArray(arr)) continue;
                      for (const entry of arr) {
                        if (typeof entry !== 'string' || !entry.trim()) continue;
                        const t = entry.trim();
                        if (t.startsWith('__exp__:')) {
                          const rest = t.slice(8);
                          const idx = rest.lastIndexOf(':');
                          if (idx > 0) {
                            const id = rest.slice(0, idx);
                            const ts = Number(rest.slice(idx + 1));
                            if (id && !isNaN(ts) && ts > 0) {
                              expMap[id] = Math.max(expMap[id] || 0, ts);
                            }
                          }
                        } else {
                          rawIds.add(t);
                        }
                      }
                    }
                    const activeSet = new Set<string>();
                    for (const id of rawIds) {
                      if (id.startsWith('promo_') || id.startsWith('ach_') || id.startsWith('b-')) {
                        activeSet.add(id);
                      } else if (expMap[id] === undefined) {
                        expMap[id] = nowMs + durationMs;
                      }
                    }
                    for (const [id, ts] of Object.entries(expMap)) {
                      if (ts > nowMs) activeSet.add(id);
                    }
                    const mergedShop = [
                      ...Array.from(activeSet),
                      ...Object.entries(expMap).map(([id, ts]) => `__exp__:${id}:${ts}`)
                    ];
                    finalShop = JSON.stringify(mergedShop);
                  }
                } catch (eShop) {}
                const finalTheme = equipped_theme !== undefined ? equipped_theme : (existingLib?.equipped_theme || null);
                const finalBadge = equipped_badge !== undefined ? equipped_badge : (existingLib?.equipped_badge || null);
                const finalBadges = equipped_badges !== undefined ? equipped_badges : (existingLib?.equipped_badges || '[]');
                const finalFrame = equipped_frame !== undefined ? equipped_frame : (existingLib?.equipped_frame || '');
                const finalReadingLists = reading_lists !== undefined ? reading_lists : (existingLib?.reading_lists || '[]');
                const finalCheckinDay = daily_checkin_day !== undefined ? Number(daily_checkin_day) : (existingLib?.daily_checkin_day || 0);
                const finalLastCheckin = last_daily_checkin !== undefined ? last_daily_checkin : (existingLib?.last_daily_checkin || null);
                const finalClaimedDays = claimed_checkin_days !== undefined ? claimed_checkin_days : (existingLib?.claimed_checkin_days || '[]');

                await userDb.prepare(`
                  INSERT INTO user_library (uid, name, email, followed_series, bookmarks, reading_history, notifications, cosmo_points, shop_items, equipped_theme, equipped_badge, equipped_badges, equipped_frame, reading_lists, daily_checkin_day, last_daily_checkin, claimed_checkin_days)
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                  ON CONFLICT(uid) DO UPDATE SET
                  name = excluded.name,
                  email = excluded.email,
                  followed_series = excluded.followed_series,
                  bookmarks = excluded.bookmarks,
                  reading_history = excluded.reading_history,
                  notifications = excluded.notifications,
                  cosmo_points = excluded.cosmo_points,
                  shop_items = excluded.shop_items,
                  equipped_theme = excluded.equipped_theme,
                  equipped_badge = excluded.equipped_badge,
                  equipped_badges = excluded.equipped_badges,
                  equipped_frame = excluded.equipped_frame,
                  reading_lists = excluded.reading_lists,
                  daily_checkin_day = excluded.daily_checkin_day,
                  last_daily_checkin = excluded.last_daily_checkin,
                  claimed_checkin_days = excluded.claimed_checkin_days
                `).bind(
                  uid,
                  userRow?.name ?? existingLib?.name ?? null,
                  userRow?.email ?? existingLib?.email ?? null,
                  finalFollowed,
                  finalBookmarks,
                  finalHistory,
                  finalNotifs,
                  finalPoints,
                  finalShop,
                  finalTheme,
                  finalBadge,
                  finalBadges,
                  finalFrame,
                  finalReadingLists,
                  finalCheckinDay,
                  finalLastCheckin,
                  finalClaimedDays
                ).run();
              };

              try {
                await saveLibrary();
                return new Response(JSON.stringify({ success: true }), { headers });
              } catch (e: any) {
                try {
                  await userDb.prepare(`ALTER TABLE user_library ADD COLUMN reading_lists TEXT DEFAULT '[]'`).run().catch(() => {});
                  await userDb.prepare(`ALTER TABLE user_library ADD COLUMN reading_history TEXT DEFAULT '{}'`).run().catch(() => {});
                  await userDb.prepare(`ALTER TABLE user_library ADD COLUMN daily_checkin_day INTEGER DEFAULT 0`).run().catch(() => {});
                  await userDb.prepare(`ALTER TABLE user_library ADD COLUMN last_daily_checkin TEXT`).run().catch(() => {});
                  await userDb.prepare(`ALTER TABLE user_library ADD COLUMN claimed_checkin_days TEXT DEFAULT '[]'`).run().catch(() => {});
                  await saveLibrary();
                  return new Response(JSON.stringify({ success: true }), { headers });
                } catch (retryErr: any) {
                  return new Response(JSON.stringify({ success: false, message: retryErr.message }), { status: 500, headers });
                }
              }
            }
            
            return new Response(JSON.stringify({ 
              success: false, 
              message: 'Üyelik veritabanı bulunamadı.' 
            }), { status: 400, headers });
          }

          
          // GET ALL USERS (Legacy)
          if (path.startsWith('/api/auth/users') && request.method === 'GET') {
            if (userDb) {
              try {
                const { results } = await userDb.prepare("SELECT uid, email, name, avatar, provider, created_at FROM users").all();
                return new Response(JSON.stringify({ success: true, users: results || [] }), { headers });
              } catch (e) {}
            }
            return new Response(JSON.stringify({ success: true, users: [] }), { headers });
          }
          
          return new Response(JSON.stringify({ 
            success: false, 
            message: 'Üyelik sistemi (USERS_DB) Cloudflare panelinden bağlanmamış veya API bulunamadı.' 
          }), { status: 400, headers });
        }

        // DIAGNOSTIC / STATUS API
        if (path.startsWith('/api/status') || path.startsWith('/api/d1-status')) {
          const isSeparateCommentsDb = Boolean(env.COMMENTS_DB || env.COMMENTS_D1 || env.DB_COMMENTS);
          const isSeparateUsersDb = Boolean(env.USERS_DB || env.USERS_D1 || env.DB_USERS);
          const activeStorage = r2
            ? 'R2 Bucket (S3/Nesne Depolama)'
            : kv
            ? 'KV Namespace'
            : db
            ? (isSeparateUsersDb ? 'D1 (Ana DB + Ayrı Yorumlar DB + Ayrı Üye/Giriş DB)' : isSeparateCommentsDb ? 'D1 (Ana DB + Ayrı Yorumlar DB)' : 'D1 SQL Veritabanı')
            : 'Bağlı Değil';

          let totalSeriesCount = 0;
          let totalCommentsCount = 0;
          let totalUsersCount = 0;

          if (false && r2) {
            const item = await r2.get('data/series.json');
            const list = item ? await item.json() : [];
            totalSeriesCount = list.length;
          } else if (false && kv) {
            const list = (await kv.get('data/series.json', 'json')) || [];
            totalSeriesCount = list.length;
          } else if (db) {
            try {
              const { results } = await db.prepare("SELECT COUNT(*) as count FROM series").all();
              totalSeriesCount = results?.[0]?.count || 0;
            } catch (e) {}
          }

          if (commentsDb) {
            try {
              const { results } = await commentsDb.prepare("SELECT COUNT(*) as count FROM comments").all();
              totalCommentsCount = results?.[0]?.count || 0;
            } catch (e) {}
          }

          if (usersDb) {
            try {
              const { results } = await usersDb.prepare("SELECT COUNT(*) as count FROM users").all();
              totalUsersCount = results?.[0]?.count || 0;
            } catch (e) {}
          }

          return new Response(JSON.stringify({
            connected: Boolean(r2 || kv || db || commentsDb || usersDb),
            activeStorage,
            r2Connected: Boolean(r2),
            kvConnected: Boolean(kv),
            d1Connected: Boolean(db),
            separateCommentsDbConnected: isSeparateCommentsDb,
            separateUsersDbConnected: isSeparateUsersDb,
            totalSeries: totalSeriesCount,
            totalComments: totalCommentsCount,
            totalUsers: totalUsersCount,
            message: isSeparateUsersDb
              ? 'Ayrı Üye Veritabanı (USERS_DB - mikrokosmos-users-db) aktif! Tüm üyelik ve giriş verileri bu özel veritabanında saklanıyor.'
              : (isSeparateCommentsDb
                ? 'Ayrı Yorum Veritabanı (COMMENTS_DB) aktif!'
                : (db
                  ? 'Cloudflare D1 SQL Veritabanı aktif.'
                  : 'Cloudflare Depolama bağlaması tanımlanmadı.'))
          }), { headers });
        }

        return new Response(JSON.stringify({ status: "Cloudflare Worker API Active" }), { headers });
      } catch (err: any) {
        return new Response(JSON.stringify({ error: err.message }), { status: 500, headers });
      }
    }

    if (env.ASSETS) {
      let assetRes = await env.ASSETS.fetch(request);
      if (assetRes.status === 404 && request.method === 'GET' && !path.includes('.')) {
        assetRes = await env.ASSETS.fetch(new Request(new URL('/index.html', request.url), request));
      }
      
      // Cache-Control Strategy for PWA & Fast Updates
      const resHeaders = new Headers(assetRes.headers);
      const isServiceWorker = path === '/sw.js' || path === '/registerSW.js' || path.includes('workbox-') || path.endsWith('sw.js');
      const isHtml = path === '/' || path.endsWith('.html') || !path.includes('.');
      const isStaticAsset = (path.startsWith('/assets/') || 
        /\.(js|css|woff2|woff|ttf|png|webp|svg|jpg|jpeg|gif|ico|webmanifest)$/i.test(path)) && !isServiceWorker;
      
      if (isServiceWorker) {
        // Critical: Service Worker scripts must NEVER be cached by browser or CDN
        resHeaders.set('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0');
        resHeaders.set('Pragma', 'no-cache');
        resHeaders.set('Expires', '0');
      } else if (isHtml) {
        // HTML entrypoint must check for latest build hashes and serve social share preview card
        resHeaders.set('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0');
        resHeaders.set('Pragma', 'no-cache');

        let htmlBody = await assetRes.text();

        // Check if custom site branding logo exists in D1 or memory
        let customLogo = 'https://mikrokosmos.fans/og-image.png';
        const activeDb = usersDb || db;
        if (activeDb) {
          try {
            const row = await activeDb.prepare("SELECT value FROM site_settings WHERE key = 'site_branding'").first();
            if (row && row.value) {
              const parsed = JSON.parse(row.value);
              if (parsed && parsed.logoUrl && parsed.logoUrl.trim()) {
                customLogo = parsed.logoUrl.trim();
              }
            }
          } catch {}
        }

        if (customLogo && customLogo !== 'https://mikrokosmos.fans/og-image.png') {
          htmlBody = htmlBody
            .replace(/https:\/\/mikrokosmos\.fans\/og-image\.png/g, customLogo);
        }

        return new Response(htmlBody, {
          status: assetRes.status,
          statusText: assetRes.statusText,
          headers: resHeaders
        });
      } else if (isStaticAsset) {
        // Hashed assets in /assets/ can be cached long-term
        resHeaders.set('Cache-Control', 'public, max-age=31536000, immutable');
      }
      
      return new Response(assetRes.body, {
        status: assetRes.status,
        statusText: assetRes.statusText,
        headers: resHeaders
      });
    }

    return new Response('Not Found', { status: 404 });
  },
  async scheduled(event: any, env: Env, ctx: any) {
    const usersDb = getUsersDB(env);
    if (!usersDb) return;

    try {
      // 5 months ago (approx 150 days)
      const fiveMonthsAgo = new Date(Date.now() - 150 * 24 * 60 * 60 * 1000).toISOString();
      
      // Select users to delete
      const { results: inactiveUsers } = await usersDb.prepare(`
        SELECT uid, email FROM users 
        WHERE last_login < ? OR (last_login IS NULL AND created_at < ?)
      `).bind(fiveMonthsAgo, fiveMonthsAgo).all();

      if (inactiveUsers && inactiveUsers.length > 0) {
        for (const user of inactiveUsers as any[]) {
          // Delete from users table
          await usersDb.prepare("DELETE FROM users WHERE uid = ?").bind(user.uid).run();
          // Delete from user_library table
          await usersDb.prepare("DELETE FROM user_library WHERE uid = ?").bind(user.uid).run();
          // Delete comments could also be done here if needed
        }
        console.log(`Deleted ${inactiveUsers.length} inactive users.`);
      }
    } catch (e) {
      console.error("Scheduled user cleanup failed:", e);
    }
  }
};
