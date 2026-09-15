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

export function cleanNoticeText(text?: string | null): string {
  if (!text) return '';
  return text
    .replace(/^(📢\s*)?(Çevirmen Notu|Editör Notu|Admin Notu|Seri Notu|Bölüm Notu|Bölüm Duyurusu|Duyuru|Not)\s*:\s*/i, '')
    .trim();
}



