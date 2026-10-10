import { Chapter } from '../types';

export function isPrologueChapter(ch: Chapter): boolean {
  if (ch.number === 0) return true;
  const title = (ch.title || '').toLowerCase();
  return (
    title.includes('prologue') ||
    title.includes('tanıtım') ||
    title.includes('tanitim') ||
    title.includes('önsöz') ||
    title.includes('onsoz') ||
    title.includes('giriş') ||
    title.includes('giris') ||
    title.includes('teaser')
  );
}

export function isExtraChapter(ch: Chapter): boolean {
  if (isPrologueChapter(ch)) return false;
  if (ch.specialTag === 'Ekstra' || ch.specialTag === 'Yan Bölüm' || ch.specialTag === 'Özel') return true;
  const anyCh = ch as unknown as Record<string, unknown>;
  if (anyCh.isExtra || anyCh.isSpecial) return true;
  const title = (ch.title || '').toLowerCase();
  return (
    title.includes('extra') ||
    title.includes('ekstra') ||
    title.includes('özel') ||
    title.includes('ozel') ||
    title.includes('special') ||
    title.includes('yan bölüm') ||
    title.includes('yan bolum') ||
    title.includes('side story') ||
    title.includes('epilogue') ||
    title.includes('sonsöz') ||
    title.includes('son söz') ||
    title.includes('afterword') ||
    title.includes('duyuru') ||
    title.includes('spoyler') ||
    title.includes('ova')
  );
}

export function sortChapters(chapters: Chapter[], order: 'asc' | 'desc' = 'asc'): Chapter[] {
  if (!chapters || !Array.isArray(chapters)) return [];

  const prologueChapters: Chapter[] = [];
  const mainChapters: Chapter[] = [];
  const extraChapters: Chapter[] = [];

  for (const ch of chapters) {
    if (isPrologueChapter(ch)) {
      prologueChapters.push(ch);
    } else if (isExtraChapter(ch)) {
      extraChapters.push(ch);
    } else {
      mainChapters.push(ch);
    }
  }

  const sortFn = (a: Chapter, b: Chapter) => {
    if (a.number !== b.number) {
      return order === 'desc' ? b.number - a.number : a.number - b.number;
    }
    return order === 'desc'
      ? b.title.localeCompare(a.title, 'tr', { numeric: true })
      : a.title.localeCompare(b.title, 'tr', { numeric: true });
  };

  prologueChapters.sort(sortFn);
  mainChapters.sort(sortFn);
  extraChapters.sort(sortFn);

  // Kronolojik akış mantığı:
  // ASC (1 -> Son): [Tanıtım / Prologue] -> [Bölüm 1, Bölüm 2...] -> [Ekstra / Yan Hikayeler 1, 2...]
  // DESC (Son -> 1): [Ekstra / Yan Hikayeler 11, 10...] -> [Bölüm 3, Bölüm 2, Bölüm 1] -> [Tanıtım / Prologue]
  if (order === 'desc') {
    return [...extraChapters, ...mainChapters, ...prologueChapters];
  }

  return [...prologueChapters, ...mainChapters, ...extraChapters];
}

export function formatChapterDate(ch?: Partial<Chapter> | null): string {
  if (!ch) return '';
  if (ch.publishedDate && typeof ch.publishedDate === 'string') {
    return ch.publishedDate;
  }
  const created: unknown = ch.createdAt;
  if (typeof created === 'number') {
    try {
      return new Date(created).toISOString().slice(0, 10);
    } catch {
      return '';
    }
  }
  if (typeof created === 'string') {
    return created.slice(0, 10);
  }
  return '';
}

export interface ParsedMangaAlert {
  type: 'warning' | 'info' | 'note';
  label: string;
  message: string;
}

export function cleanNoticeText(text?: string | null): string {
  if (!text) return '';
  const cleaned = text
    .replace(/^(📢\s*)?(Çevirmen Notu|Editör Notu|Admin Notu|Seri Notu|Bölüm Notu|Bölüm Duyurusu|Duyuru|Not)\s*:\s*/i, '')
    .replace(/Blogger Etiketleri\s*:.*$/gim, '')
    .trim();
  if (/^blogger etiketleri\s*:/i.test(cleaned)) {
    return '';
  }
  return cleaned;
}

export function extractMangaAlerts(raw?: string | null): ParsedMangaAlert[] {
  if (!raw || !raw.trim()) return [];

  const alerts: ParsedMangaAlert[] = [];
  const seenMessages = new Set<string>();

  const pushUnique = (alert: ParsedMangaAlert) => {
    const norm = alert.message.toLowerCase().replace(/\s+/g, ' ').trim();
    if (!norm || norm.length < 3 || /^blogger etiketleri/i.test(norm)) return;
    if (seenMessages.has(norm)) return;
    seenMessages.add(norm);
    alerts.push(alert);
  };

  let remainingText = raw;

  // 1. Parse HTML <div class="manga-alert m-warning / m-info"> blocks if present
  if (typeof DOMParser !== 'undefined' && /<[a-z][\s\S]*>/i.test(raw)) {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(raw, 'text/html');
      const alertEls = Array.from(
        doc.querySelectorAll('.manga-alert, .m-warning, .m-info, .m-danger, .chapter-alert, .alert-box')
      );

      for (const el of alertEls) {
        if (
          el.parentElement &&
          el.parentElement.closest('.manga-alert, .m-warning, .m-info, .m-danger, .chapter-alert, .alert-box')
        ) {
          continue;
        }
        const cls = (el.className || '').toLowerCase();
        const labelEl = el.querySelector('.m-label, .alert-label, strong, b');
        const rawLabel = labelEl?.textContent?.trim() || '';

        const clone = el.cloneNode(true) as HTMLElement;
        clone.querySelectorAll('.m-label, .alert-label, .m-icon-wrapper, i, svg').forEach(n => n.remove());
        const msg = (clone.textContent || '').replace(/\s+/g, ' ').trim();

        if (msg) {
          let type: ParsedMangaAlert['type'] = 'note';
          const upperLabel = rawLabel.toLocaleUpperCase('tr-TR');
          if (
            cls.includes('warning') ||
            cls.includes('danger') ||
            upperLabel.includes('UYARI') ||
            upperLabel.includes('DİKKAT') ||
            upperLabel.includes('18+') ||
            upperLabel.includes('SANSÜR')
          ) {
            type = 'warning';
          } else if (
            cls.includes('info') ||
            upperLabel.includes('BİLGİ') ||
            upperLabel.includes('DUYURU') ||
            upperLabel.includes('GÜNCEL')
          ) {
            type = 'info';
          }

          const finalLabel =
            rawLabel ||
            (type === 'warning' ? 'İÇERİK UYARISI' : type === 'info' ? 'BİLGİLENDİRME' : 'NOT');

          pushUnique({ type, label: finalLabel, message: msg });
        }
        el.remove();
      }

      doc.querySelectorAll('img, iframe, script, style').forEach(n => n.remove());
      remainingText = doc.body.innerText || doc.body.textContent || '';
    } catch {
      // Fallback to plain text parsing below
    }
  }

  // 2. Clean Blogger Etiketleri and standalone URLs from remaining text
  remainingText = remainingText
    .replace(/Blogger Etiketleri\s*:.*$/gim, '')
    .replace(/https?:\/\/\S+/gi, '')
    .trim();

  if (!remainingText) return alerts;

  // Normalize known Turkish alert headings so multi-block plain text splits cleanly
  const normalized = remainingText.replace(
    /(?:^|\n|(?<=[.!?])\s+)\s*(İÇERİK UYARISI|YETİŞKİN İÇERİK UYARISI|ÖNEMLİ BİLGİLENDİRME|BİLGİLENDİRME|ÇEVİRMEN NOTU|EDİTÖR NOTU|BÖLÜM NOTU|BÖLÜM DUYURUSU)\s*:?\s*/gi,
    '\n@@ALERT_SPLIT@@$1:\n'
  );

  const chunks = normalized
    .split('@@ALERT_SPLIT@@')
    .map(c => c.trim())
    .filter(Boolean);

  for (const chunk of chunks) {
    const headerMatch = chunk.match(
      /^(📢\s*)?(İÇERİK UYARISI|YETİŞKİN İÇERİK UYARISI|ÖNEMLİ BİLGİLENDİRME|BİLGİLENDİRME|ÇEVİRMEN NOTU|EDİTÖR NOTU|BÖLÜM NOTU|BÖLÜM DUYURUSU|SERİ NOTU|DUYURU|UYARI|DİKKAT|Not)\s*:\s*([\s\S]*)$/i
    );

    if (headerMatch) {
      const rawHeader = headerMatch[2].trim().toLocaleUpperCase('tr-TR');
      const body = headerMatch[3].replace(/\s+/g, ' ').trim();
      if (!body) continue;

      let type: ParsedMangaAlert['type'] = 'note';
      if (
        rawHeader.includes('UYARI') ||
        rawHeader.includes('DİKKAT') ||
        /sansürsüz|cinsel içerik|şiddet|\+18|18\+/i.test(body)
      ) {
        type = 'warning';
      } else if (rawHeader.includes('BİLGİ') || rawHeader.includes('DUYURU')) {
        type = 'info';
      }

      pushUnique({
        type,
        label: rawHeader === 'NOT' ? 'NOT' : rawHeader,
        message: body
      });
    } else {
      const cleaned = cleanNoticeText(chunk).replace(/\s+/g, ' ').trim();
      if (!cleaned) continue;

      let type: ParsedMangaAlert['type'] = 'note';
      let label = 'NOT';
      if (/sansürsüz|cinsel içerik|şiddet|olumsuz örnek/i.test(cleaned)) {
        type = 'warning';
        label = 'İÇERİK UYARISI';
      } else if (/güncel bir seridir|yeni bölümleri her ayın|yayınlanabilir/i.test(cleaned)) {
        type = 'info';
        label = 'BİLGİLENDİRME';
      }

      pushUnique({ type, label, message: cleaned });
    }
  }

  return alerts;
}

export function getChapterAlerts(
  chapter?: Partial<Chapter> | null,
  seriesNotice?: string | null,
  isManhwa = true
): ParsedMangaAlert[] {
  if (!chapter) return extractMangaAlerts(seriesNotice);

  const combined: ParsedMangaAlert[] = [];
  const seen = new Set<string>();

  const addAll = (list: ParsedMangaAlert[]) => {
    for (const item of list) {
      const key = item.message.toLowerCase().replace(/\s+/g, ' ').trim();
      if (!seen.has(key)) {
        seen.add(key);
        combined.push(item);
      }
    }
  };

  if (chapter.notice) {
    addAll(extractMangaAlerts(chapter.notice));
  }

  // For Manhwa/Webtoon chapters, Blogger posts often store their .manga-alert text inside chapter.content
  if (isManhwa && chapter.content) {
    addAll(extractMangaAlerts(chapter.content));
  } else if (!isManhwa && chapter.content && /manga-alert|m-warning|m-info/i.test(chapter.content)) {
    // For Novel chapters, only extract explicit .manga-alert HTML blocks from content
    if (typeof DOMParser !== 'undefined') {
      try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(chapter.content, 'text/html');
        const alertNodes = Array.from(doc.querySelectorAll('.manga-alert, .m-warning, .m-info'));
        if (alertNodes.length > 0) {
          const wrapper = doc.createElement('div');
          alertNodes.forEach(n => wrapper.appendChild(n.cloneNode(true)));
          addAll(extractMangaAlerts(wrapper.innerHTML));
        }
      } catch {}
    }
  }

  if (combined.length === 0 && seriesNotice) {
    addAll(extractMangaAlerts(seriesNotice));
  }

  return combined;
}

export function getSeriesAlertsAndCleanSynopsis(
  synopsis?: string | null,
  seriesNotice?: string | null
): { cleanSynopsis: string; alerts: ParsedMangaAlert[] } {
  const alerts: ParsedMangaAlert[] = [];
  const seen = new Set<string>();

  const addAll = (list: ParsedMangaAlert[]) => {
    for (const item of list) {
      const key = item.message.toLowerCase().replace(/\s+/g, ' ').trim();
      if (!seen.has(key)) {
        seen.add(key);
        alerts.push(item);
      }
    }
  };

  if (seriesNotice) {
    addAll(extractMangaAlerts(seriesNotice));
  }

  let cleanSynopsis = (synopsis || '').trim();

  if (
    cleanSynopsis &&
    (/manga-alert|m-warning|m-info/i.test(cleanSynopsis) ||
      /\b(İÇERİK UYARISI|YETİŞKİN İÇERİK UYARISI|ÖNEMLİ BİLGİLENDİRME|BİLGİLENDİRME)\b/i.test(cleanSynopsis))
  ) {
    addAll(extractMangaAlerts(cleanSynopsis));

    // Remove HTML manga-alert blocks if present
    if (typeof DOMParser !== 'undefined' && /<[a-z][\s\S]*>/i.test(cleanSynopsis)) {
      try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(cleanSynopsis, 'text/html');
        doc.querySelectorAll('.manga-alert, .m-warning, .m-info, .m-danger').forEach(n => n.remove());
        cleanSynopsis = (doc.body.textContent || '').trim();
      } catch {}
    }

    // Remove plain-text alert blocks from synopsis if they match extracted alerts
    for (const alert of alerts) {
      const escapedLabel = alert.label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const labelRegex = new RegExp(`${escapedLabel}\\s*:?\\s*`, 'gi');
      cleanSynopsis = cleanSynopsis.replace(labelRegex, '');
      const snippet = alert.message.slice(0, 80).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      if (snippet.length > 15) {
        const msgRegex = new RegExp(`${snippet}[\\s\\S]*?(?=(?:İÇERİK UYARISI|BİLGİLENDİRME|$))`, 'gi');
        cleanSynopsis = cleanSynopsis.replace(msgRegex, '');
      }
    }
    cleanSynopsis = cleanSynopsis.replace(/^\s*\.\.\.\s*$/, '').trim();
  }

  return {
    cleanSynopsis,
    alerts
  };
}






