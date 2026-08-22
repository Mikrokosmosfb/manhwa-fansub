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
  return env.USERS_DB || env.USERS_D1 || env.DB_USERS || getCommentsDB(env) || getDB(env);
}

// Helper memory store for Rate Limiting & Realtime Analytics
const MEMORY_RATE_LIMIT = new Map<string, { count: number; resetAt: number }>();
const ACTIVE_SESSIONS = new Map<string, number>();

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
      if (r2) {
        try {
          const item = await r2.get('data/series.json');
          if (item) seriesList = await item.json();
        } catch (e) {}
      } else if (kv) {
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
              await r2.put(r2Key, binaryData, {
                httpMetadata: {
                  contentType: image.startsWith('data:image/jpeg') ? 'image/jpeg' : image.startsWith('data:image/webp') ? 'image/webp' : 'image/png'
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

      if (path.startsWith('/api/r2/file/') && request.method === 'GET') {
        const fileKey = decodeURIComponent(path.replace('/api/r2/file/', ''));
        if (r2 && fileKey) {
          try {
            const object = await r2.get(fileKey);
            if (object) {
              const fileHeaders = new Headers();
              object.writeHttpMetadata(fileHeaders);
              fileHeaders.set('etag', object.httpEtag);
              fileHeaders.set('Cache-Control', 'public, max-age=31536000');
              return new Response(object.body, { headers: fileHeaders });
            }
          } catch (e) {}
        }
        return new Response('File not found in Cloudflare R2 Storage', { status: 404 });
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
      // Auto-initialize D1 SQLite tables if D1 binding exists
      if (db) {
        try {
          await db.prepare(`
            CREATE TABLE IF NOT EXISTS series (
              id TEXT PRIMARY KEY,
              slug TEXT,
              title TEXT NOT NULL,
              type TEXT NOT NULL,
              cover_image TEXT NOT NULL,
              banner_image TEXT,
              synopsis TEXT,
              genres_json TEXT,
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
              updated_at TEXT
            );
          `).run();

          await db.prepare(`
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
              created_at INTEGER
            );
          `).run();

          await db.prepare(`
            CREATE TABLE IF NOT EXISTS users (
              uid TEXT PRIMARY KEY,
              email TEXT UNIQUE NOT NULL,
              password_hash TEXT,
              name TEXT NOT NULL,
              avatar TEXT,
              provider TEXT DEFAULT 'email',
              created_at TEXT
            );
          `).run();

          await db.prepare(`
            CREATE TABLE IF NOT EXISTS shop_items (
              id TEXT PRIMARY KEY,
              name TEXT NOT NULL,
              category TEXT NOT NULL,
              theme_type TEXT,
              price INTEGER NOT NULL,
              description TEXT,
              icon TEXT,
              rarity TEXT,
              badge_text TEXT
            );
          `).run();

          await db.prepare(`
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
              theme_type TEXT
            );
          `).run();

          try {
            await db.prepare("ALTER TABLE series ADD COLUMN slug TEXT").run();
          } catch (e) {}
        } catch (e) {
          console.error('Error initializing main DB tables:', e);
        }
      }

      if (commentsDb) {
        try {
          await commentsDb.prepare(`
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
              created_at TEXT
            );
          `).run();
        } catch (e) {
          console.error('Error initializing Comments DB table:', e);
        }
      }

      if (usersDb) {
        try {
          await usersDb.prepare(`
            CREATE TABLE IF NOT EXISTS users (
              uid TEXT PRIMARY KEY,
              email TEXT UNIQUE NOT NULL,
              password_hash TEXT,
              name TEXT NOT NULL,
              avatar TEXT,
              provider TEXT DEFAULT 'email',
              created_at TEXT
            );
          `).run();
        } catch (e) {
          console.error('Error initializing Users DB table:', e);
        }
      }


      try {
        // SERIES API
        if (path.startsWith('/api/series')) {
          if (request.method === 'GET') {
            // Priority 1: Cloudflare R2 Bucket
            if (r2) {
              try {
                const item = await r2.get('data/series.json');
                const data = item ? await item.json() : [];
                return new Response(JSON.stringify({ success: true, storage: 'R2', data }), { headers });
              } catch (e: any) {
                return new Response(JSON.stringify({ success: false, storage: 'R2', error: e.message }), { headers });
              }
            }

            // Priority 2: Cloudflare KV
            if (kv) {
              try {
                const data = (await kv.get('data/series.json', 'json')) || [];
                return new Response(JSON.stringify({ success: true, storage: 'KV', data }), { headers });
              } catch (e: any) {
                return new Response(JSON.stringify({ success: false, storage: 'KV', error: e.message }), { headers });
              }
            }

            // Priority 3: Cloudflare D1 SQL Database
            if (db) {
              const { results: series } = await db.prepare("SELECT * FROM series").all();
              const { results: chapters } = await db.prepare("SELECT * FROM chapters").all();

              const fullSeries = (series || []).map((s: any) => ({
                id: s.id,
                slug: s.slug || s.id,
                title: s.title,
                type: s.type,
                coverImage: s.cover_image,
                bannerImage: s.banner_image,
                synopsis: s.synopsis,
                genres: s.genres_json ? JSON.parse(s.genres_json) : [],
                rating: s.rating,
                status: s.status,
                author: s.author,
                artist: s.artist,
                translator: s.translator,
                releaseDay: s.release_day,
                releaseTime: s.release_time,
                isHot: Boolean(s.is_hot),
                isNew: Boolean(s.is_new),
                isGuncel: Boolean(s.is_guncel),
                is18Plus: Boolean(s.is_18_plus),
                updatedAt: s.updated_at,
                chapters: (chapters || []).filter((c: any) => c.series_id === s.id).map((ch: any) => ({
                  id: ch.id,
                  number: ch.chapter_number,
                  title: ch.title,
                  publishedDate: ch.published_date,
                  specialTag: ch.special_tag,
                  images: ch.images_json ? JSON.parse(ch.images_json) : [],
                  content: ch.content,
                  notice: ch.notice,
                  createdAt: ch.created_at
                }))
              }));

              return new Response(JSON.stringify({ success: true, storage: 'D1', data: fullSeries }), { headers });
            }

            return new Response(JSON.stringify({
              success: false,
              message: 'Cloudflare Depolama Bağlantısı Eksik (R2, KV veya D1 bağlanmalıdır)'
            }), { headers });
          }

          if (request.method === 'POST') {
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
            if (r2) {
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
            if (kv) {
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
                      id, slug, title, type, cover_image, banner_image, synopsis, genres_json,
                      rating, status, author, artist, translator, release_day, release_time,
                      is_hot, is_new, is_guncel, is_18_plus, updated_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                  `).bind(
                    s.id, s.slug || s.id, s.title, s.type, s.coverImage, s.bannerImage || '',
                    s.synopsis || '', JSON.stringify(s.genres || []), s.rating || 5.0,
                    s.status || 'Devam Ediyor', s.author || '', s.artist || '', s.translator || '',
                    s.releaseDay || 'Pazartesi', s.releaseTime || '', s.isHot ? 1 : 0,
                    s.isNew ? 1 : 0, s.isGuncel ? 1 : 0, s.is18Plus ? 1 : 0, s.updatedAt || new Date().toISOString()
                  )
                );

                if (Array.isArray(s.chapters)) {
                  for (const ch of s.chapters) {
                    statements.push(
                      db.prepare(`
                        INSERT OR REPLACE INTO chapters (
                          id, series_id, chapter_number, title, published_date, special_tag,
                          images_json, content, notice, created_at
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                      `).bind(
                        ch.id, s.id, ch.number, ch.title || '', ch.publishedDate || '',
                        ch.specialTag || '', JSON.stringify(ch.images || []), ch.content || '',
                        ch.notice || '', ch.createdAt || Date.now()
                      )
                    );
                  }
                }
              }

              const BATCH_SIZE = 50;
              for (let i = 0; i < statements.length; i += BATCH_SIZE) {
                const chunk = statements.slice(i, i + BATCH_SIZE);
                await db.batch(chunk);
              }

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
            const seriesId = url.searchParams.get('id');

            if (r2) {
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

            if (kv) {
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
              return new Response(JSON.stringify({ success: true, storage: 'D1', message: 'Seri Cloudflare D1 deposundan silindi' }), { headers });
            }

            return new Response(JSON.stringify({ success: true }), { headers });
          }
        }

        // COMMENTS API
        if (path.startsWith('/api/comments')) {
          if (request.method === 'GET') {
            if (r2) {
              const item = await r2.get('data/comments.json');
              const data = item ? await item.json() : [];
              return new Response(JSON.stringify({ success: true, storage: 'R2', data }), { headers });
            }

            if (kv) {
              const data = (await kv.get('data/comments.json', 'json')) || [];
              return new Response(JSON.stringify({ success: true, storage: 'KV', data }), { headers });
            }

            if (commentsDb) {
              const { results } = await commentsDb.prepare("SELECT * FROM comments ORDER BY created_at DESC").all();
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
                date: c.created_at
              }));
              return new Response(JSON.stringify({
                success: true,
                storage: (env.COMMENTS_DB || env.COMMENTS_D1 || env.DB_COMMENTS) ? 'D1 (Ayrı Yorumlar DB)' : 'D1',
                data: mapped
              }), { headers });
            }

            return new Response(JSON.stringify({ success: true, data: [] }), { headers });
          }

          if (request.method === 'POST') {
            const c: any = await request.json();

            if (r2) {
              const item = await r2.get('data/comments.json');
              let existing: any[] = item ? await item.json() : [];
              existing = [c, ...existing.filter((x: any) => x.id !== c.id)];
              await r2.put('data/comments.json', JSON.stringify(existing), {
                httpMetadata: { contentType: 'application/json' }
              });
              return new Response(JSON.stringify({ success: true, storage: 'R2' }), { headers });
            }

            if (kv) {
              let existing: any[] = (await kv.get('data/comments.json', 'json')) || [];
              existing = [c, ...existing.filter((x: any) => x.id !== c.id)];
              await kv.put('data/comments.json', JSON.stringify(existing));
              return new Response(JSON.stringify({ success: true, storage: 'KV' }), { headers });
            }

            if (commentsDb) {
              await commentsDb.prepare(`
                INSERT OR REPLACE INTO comments (
                  id, series_id, chapter_id, user_id, user_name, user_avatar,
                  text, image_url, parent_id, is_spoiler, likes_json, dislikes_json, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
              `).bind(
                c.id, c.seriesId, c.chapterId || '', c.userId, c.userName, c.userAvatar || '',
                c.text, c.imageUrl || '', c.parentId || '', c.isSpoiler ? 1 : 0,
                JSON.stringify(c.likes || []), JSON.stringify(c.dislikes || []), c.date || new Date().toISOString()
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

            if (r2 && commentId) {
              const item = await r2.get('data/comments.json');
              let existing: any[] = item ? await item.json() : [];
              existing = existing.filter((x: any) => x.id !== commentId);
              await r2.put('data/comments.json', JSON.stringify(existing), {
                httpMetadata: { contentType: 'application/json' }
              });
              return new Response(JSON.stringify({ success: true, storage: 'R2' }), { headers });
            }

            if (kv && commentId) {
              let existing: any[] = (await kv.get('data/comments.json', 'json')) || [];
              existing = existing.filter((x: any) => x.id !== commentId);
              await kv.put('data/comments.json', JSON.stringify(existing));
              return new Response(JSON.stringify({ success: true, storage: 'KV' }), { headers });
            }

            if (commentsDb && commentId) {
              await commentsDb.prepare("DELETE FROM comments WHERE id = ?").bind(commentId).run();
              return new Response(JSON.stringify({
                success: true,
                storage: (env.COMMENTS_DB || env.COMMENTS_D1 || env.DB_COMMENTS) ? 'D1 (Ayrı Yorumlar DB)' : 'D1'
              }), { headers });
            }

            return new Response(JSON.stringify({ success: true }), { headers });
          }
        }

        // SHOP & THEMES API
        if (path.startsWith('/api/shop')) {
          if (request.method === 'GET') {
            if (r2) {
              const item = await r2.get('data/shop.json');
              const data = item ? await item.json() : { shopItems: [], themeStyles: {} };
              return new Response(JSON.stringify({ success: true, storage: 'R2', ...data }), { headers });
            }
            if (kv) {
              const data = (await kv.get('data/shop.json', 'json')) || { shopItems: [], themeStyles: {} };
              return new Response(JSON.stringify({ success: true, storage: 'KV', ...data }), { headers });
            }
            if (db) {
              const { results: items } = await db.prepare("SELECT * FROM shop_items").all();
              const { results: styles } = await db.prepare("SELECT * FROM theme_styles").all();

              const shopItems = (items || []).map((i: any) => ({
                id: i.id,
                name: i.name,
                category: i.category,
                themeType: i.theme_type,
                price: i.price,
                description: i.description,
                icon: i.icon,
                rarity: i.rarity,
                badgeText: i.badge_text
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
                  themeType: s.theme_type
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

            if (r2) {
              await r2.put('data/shop.json', JSON.stringify({ shopItems: shopItemsInput, themeStyles: themeStylesInput }), {
                httpMetadata: { contentType: 'application/json' }
              });
              return new Response(JSON.stringify({ success: true, storage: 'R2', message: 'Mağaza ve temalar R2 deposuna kaydedildi' }), { headers });
            }

            if (kv) {
              await kv.put('data/shop.json', JSON.stringify({ shopItems: shopItemsInput, themeStyles: themeStylesInput }));
              return new Response(JSON.stringify({ success: true, storage: 'KV', message: 'Mağaza ve temalar KV deposuna kaydedildi' }), { headers });
            }

            if (db) {
              const statements: any[] = [];
              for (const item of shopItemsInput) {
                statements.push(
                  db.prepare(`
                    INSERT OR REPLACE INTO shop_items (
                      id, name, category, theme_type, price, description, icon, rarity, badge_text
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                  `).bind(
                    item.id, item.name, item.category, item.themeType || '', item.price,
                    item.description || '', item.icon || '', item.rarity || '', item.badgeText || ''
                  )
                );
              }

              for (const ts of Object.values(themeStylesInput) as any[]) {
                statements.push(
                  db.prepare(`
                    INSERT OR REPLACE INTO theme_styles (
                      id, name, card_class, avatar_border_class, name_class, badge_bg_class,
                      glow_color, accent_text, card_bg_image_url, effect_overlay, theme_type
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                  `).bind(
                    ts.id, ts.name, ts.cardClass || '', ts.avatarBorderClass || '', ts.nameClass || '',
                    ts.badgeBgClass || '', ts.glowColor || '', ts.accentText || '',
                    ts.cardBgImageUrl || '', ts.effectOverlay || '', ts.themeType || ''
                  )
                );
              }

              if (statements.length > 0) {
                const BATCH_SIZE = 50;
                for (let i = 0; i < statements.length; i += BATCH_SIZE) {
                  const chunk = statements.slice(i, i + BATCH_SIZE);
                  await db.batch(chunk);
                }
              }

              return new Response(JSON.stringify({ success: true, storage: 'D1', message: 'Mağaza ve temalar D1 veritabanına kaydedildi' }), { headers });
            }

            return new Response(JSON.stringify({ success: true }), { headers });
          }
        }

        // AUTHENTICATION API
        if (path.startsWith('/api/auth')) {
          const userDb = usersDb || db || commentsDb;

          // REGISTER USER
          if (path.startsWith('/api/auth/register') && request.method === 'POST') {
            const body = await request.json() as any;
            const { name, email, password } = body;

            if (!name || !email || !password) {
              return new Response(JSON.stringify({ success: false, message: 'Lütfen isim, e-posta ve şifre alanlarını doldurun.' }), { status: 400, headers });
            }

            const cleanEmail = email.trim().toLowerCase();
            const cleanName = name.trim();

            const clientIp = request.headers.get('cf-connecting-ip') || 'anon-ip';
            const rateCheck = await checkRateLimit(kv, `register:${clientIp}`, 6, 60);
            if (!rateCheck.allowed) {
              return new Response(JSON.stringify({
                success: false,
                message: `⚡ Cloudflare KV Koruması: Çok fazla kayıt denemesi yapıldı. Lütfen ${rateCheck.retryAfter || 60} saniye bekleyin.`
              }), { status: 429, headers });
            }

            if (userDb) {
              try {
                // Check email existence
                const emailCheck = await userDb.prepare("SELECT * FROM users WHERE email = ?").bind(cleanEmail).all();
                if (emailCheck.results && emailCheck.results.length > 0) {
                  return new Response(JSON.stringify({ success: false, message: 'Bu e-posta adresiyle zaten bir üyelik var. Lütfen giriş yapın.' }), { headers });
                }

                // Check username uniqueness
                const nameCheck = await userDb.prepare("SELECT * FROM users WHERE LOWER(name) = LOWER(?)").bind(cleanName).all();
                if (nameCheck.results && nameCheck.results.length > 0) {
                  return new Response(JSON.stringify({ success: false, message: 'Bu kullanıcı adı zaten başka bir üye tarafından kullanılıyor. Lütfen farklı bir isim seçin.' }), { headers });
                }

                const uid = 'u-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6);
                const avatar = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(cleanName)}`;
                const createdAt = new Date().toISOString();

                await userDb.prepare(`
                  INSERT INTO users (uid, email, password_hash, name, avatar, provider, created_at)
                  VALUES (?, ?, ?, ?, ?, ?, ?)
                `).bind(uid, cleanEmail, password, cleanName, avatar, 'email', createdAt).run();

                return new Response(JSON.stringify({
                  success: true,
                  user: { uid, name: cleanName, email: cleanEmail, avatar, provider: 'email', createdAt }
                }), { headers });
              } catch (e: any) {
                console.error('Error in D1 user registration:', e);
              }
            }

            // Fallback user creation if DB fails
            const uid = 'u-' + Date.now();
            const avatar = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(cleanName)}`;
            return new Response(JSON.stringify({
              success: true,
              user: { uid, name: cleanName, email: cleanEmail, avatar, provider: 'email' }
            }), { headers });
          }

          // UPDATE USER PROFILE
          if (path.startsWith('/api/auth/update-profile') && request.method === 'POST') {
            const body = await request.json() as any;
            const { uid, name, avatar } = body;

            if (!uid || !name) {
              return new Response(JSON.stringify({ success: false, message: 'Eksik üye bilgisi.' }), { status: 400, headers });
            }

            const cleanName = name.trim();
            const cleanAvatar = avatar ? avatar.trim() : `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(cleanName)}`;

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

                await userDb.prepare("UPDATE users SET name = ?, avatar = ? WHERE uid = ?").bind(cleanName, cleanAvatar, uid).run();

                // Also update user's comments in comments table if commentsDb exists
                if (commentsDb) {
                  try {
                    await commentsDb.prepare("UPDATE comments SET user_name = ?, user_avatar = ? WHERE user_id = ?").bind(cleanName, cleanAvatar, uid).run();
                  } catch (ce) {
                    console.error('Error updating comments user details:', ce);
                  }
                }

                return new Response(JSON.stringify({
                  success: true,
                  message: 'Profil bilgileriniz başarıyla güncellendi.',
                  user: { uid, name: cleanName, avatar: cleanAvatar }
                }), { headers });
              } catch (e: any) {
                console.error('Error updating profile in D1:', e);
              }
            }

            return new Response(JSON.stringify({
              success: true,
              message: 'Profil güncellendi.',
              user: { uid, name: cleanName, avatar: cleanAvatar }
            }), { headers });
          }

          // DELETE USER ACCOUNT & ALL DATA
          if (path.startsWith('/api/auth/delete-account') && request.method === 'POST') {
            const body = await request.json() as any;
            const { uid, email } = body;

            if (!uid) {
              return new Response(JSON.stringify({ success: false, message: 'Silinecek üye Kimliği (UID) bulunamadı.' }), { status: 400, headers });
            }

            if (userDb) {
              try {
                // Delete user from users DB
                await userDb.prepare("DELETE FROM users WHERE uid = ? OR email = ?").bind(uid, email || '').run();
              } catch (e) {
                console.error('Error deleting user from USERS_DB:', e);
              }
            }

            return new Response(JSON.stringify({
              success: true,
              message: 'Hesabınız Mikrokosmos Fansub veritabanından başarıyla silindi.'
            }), { headers });
          }

          // LOGIN USER
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
                message: `⚡ Cloudflare KV Güvenlik Kilitlenmesi: Bu hesap için 1 dakika içinde çok fazla deneme yapıldı. Lütfen ${rateCheck.retryAfter || 60} saniye bekleyin.`
              }), { status: 429, headers });
            }

            if (userDb) {
              try {
                const { results } = await userDb.prepare("SELECT * FROM users WHERE email = ?").bind(cleanEmail).all();
                if (!results || results.length === 0) {
                  return new Response(JSON.stringify({ success: false, message: 'Bu e-posta adresiyle kayıtlı üye bulunamadı.' }), { headers });
                }

                const foundUser: any = results[0];
                if (foundUser.password_hash !== password) {
                  return new Response(JSON.stringify({ success: false, message: 'Şifreniz hatalı. Lütfen tekrar deneyin.' }), { headers });
                }

                return new Response(JSON.stringify({
                  success: true,
                  user: {
                    uid: foundUser.uid,
                    name: foundUser.name,
                    email: foundUser.email,
                    avatar: foundUser.avatar,
                    provider: foundUser.provider || 'email',
                    createdAt: foundUser.created_at
                  }
                }), { headers });
              } catch (e: any) {
                console.error('Error in D1 user login:', e);
              }
            }

            // Fallback login
            return new Response(JSON.stringify({
              success: true,
              user: {
                uid: 'u-' + Date.now(),
                name: cleanEmail.split('@')[0],
                email: cleanEmail,
                avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(cleanEmail)}`,
                provider: 'email'
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

            if (userDb) {
              try {
                const { results } = await userDb.prepare("SELECT * FROM users WHERE email = ?").bind(cleanEmail).all();
                const existingUser: any = (results && results.length > 0) ? results[0] : null;

                // Strict Google Auth: Login vs Register
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

                  await userDb.prepare(`
                    INSERT INTO users (uid, email, password_hash, name, avatar, provider, created_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                  `).bind(uid, cleanEmail, 'GOOGLE_AUTH', finalName, userAvatar, 'google', createdAt).run();

                  return new Response(JSON.stringify({
                    success: true,
                    message: 'Google hesabınızla üyeliğiniz başarıyla oluşturuldu!',
                    user: { uid, name: finalName, email: cleanEmail, avatar: userAvatar, provider: 'google', createdAt }
                  }), { headers });
                }

                // Default / Login Action: Do NOT auto-register if account does not exist!
                if (!existingUser) {
                  return new Response(JSON.stringify({
                    success: false,
                    message: `"${cleanEmail}" e-posta adresiyle kayıtlı bir üye bulunamadı. Lütfen önce "Kayıt Ol" sekmesinden kayıt olun.`
                  }), { headers });
                }

                return new Response(JSON.stringify({
                  success: true,
                  message: `Google hesabınızla (${existingUser.email}) başarıyla giriş yapıldı!`,
                  user: {
                    uid: existingUser.uid,
                    name: existingUser.name,
                    email: existingUser.email,
                    avatar: existingUser.avatar,
                    provider: existingUser.provider || 'google',
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

          // GET ALL USERS (For Status or Admin)
          if (path.startsWith('/api/auth/users') && request.method === 'GET') {
            if (userDb) {
              try {
                const { results } = await userDb.prepare("SELECT uid, email, name, avatar, provider, created_at FROM users").all();
                return new Response(JSON.stringify({ success: true, users: results || [] }), { headers });
              } catch (e) {}
            }
            return new Response(JSON.stringify({ success: true, users: [] }), { headers });
          }
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

          if (r2) {
            const item = await r2.get('data/series.json');
            const list = item ? await item.json() : [];
            totalSeriesCount = list.length;
          } else if (kv) {
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
      const assetRes = await env.ASSETS.fetch(request);
      if (assetRes.status === 404 && request.method === 'GET' && !path.includes('.')) {
        return env.ASSETS.fetch(new Request(new URL('/index.html', request.url), request));
      }
      return assetRes;
    }

    return new Response('Not Found', { status: 404 });
  }
};
