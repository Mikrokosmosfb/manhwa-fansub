import { Chapter, Series } from '../types';

/**
 * Parses various date formats (ISO, YYYY-MM-DD, relative Turkish strings like "2 saat önce", "1 gün önce", "az önce")
 * into a comparable epoch millisecond timestamp.
 */
export const parseCustomDateToTimestamp = (dateStr?: string | null, fallbackTs?: number): number => {
  if (!dateStr || typeof dateStr !== 'string') return fallbackTs || 0;
  const trimmed = dateStr.trim().toLowerCase();
  if (!trimmed) return fallbackTs || 0;

  // 1. Direct ISO / Standard Date parse
  const parsed = Date.parse(dateStr);
  if (!isNaN(parsed) && parsed > 0) {
    return parsed;
  }

  const now = Date.now();

  // 2. Immediate / Just Now
  if (
    trimmed.includes('az önce') ||
    trimmed.includes('şimdi') ||
    trimmed.includes('simdi') ||
    trimmed.includes('yeni') ||
    trimmed === 'bugün' ||
    trimmed === 'bugun'
  ) {
    return now;
  }

  // 3. Dün (Yesterday)
  if (trimmed === 'dün' || trimmed === 'dun') {
    return now - 24 * 60 * 60 * 1000;
  }

  // 4. Relative Minutes: "5 dakika önce", "10 dk önce"
  const minMatch = trimmed.match(/(\d+)\s*(?:dakika|dk|min)/);
  if (minMatch) {
    return now - parseInt(minMatch[1], 10) * 60 * 1000;
  }

  // 5. Relative Hours: "2 saat önce", "3s önce"
  const hrMatch = trimmed.match(/(\d+)\s*(?:saat|s\b|hr|hour)/);
  if (hrMatch) {
    return now - parseInt(hrMatch[1], 10) * 60 * 60 * 1000;
  }

  // 6. Relative Days: "1 gün önce", "4 gün önce"
  const dayMatch = trimmed.match(/(\d+)\s*(?:g[üu]n|g\b|day)/);
  if (dayMatch) {
    return now - parseInt(dayMatch[1], 10) * 24 * 60 * 60 * 1000;
  }

  // 7. Relative Weeks: "1 hafta önce", "2 hafta önce"
  const weekMatch = trimmed.match(/(\d+)\s*(?:hafta|week)/);
  if (weekMatch) {
    return now - parseInt(weekMatch[1], 10) * 7 * 24 * 60 * 60 * 1000;
  }

  // 8. Relative Months: "1 ay önce", "2 ay önce"
  const monthMatch = trimmed.match(/(\d+)\s*(?:ay|month)/);
  if (monthMatch) {
    return now - parseInt(monthMatch[1], 10) * 30 * 24 * 60 * 60 * 1000;
  }

  // 9. DD.MM or DD.MM.YYYY (e.g. "21.07" or "21.07.2026")
  const dotDateMatch = trimmed.match(/^(\d{1,2})\.(\d{1,2})(?:\.(\d{4}))?$/);
  if (dotDateMatch) {
    const day = parseInt(dotDateMatch[1], 10);
    const month = parseInt(dotDateMatch[2], 10) - 1;
    const year = dotDateMatch[3] ? parseInt(dotDateMatch[3], 10) : new Date().getFullYear();
    const d = new Date(year, month, day);
    if (!isNaN(d.getTime())) return d.getTime();
  }

  return fallbackTs || 0;
};

/**
 * Calculates the latest activity timestamp of a series:
 * looks through all chapters (createdAt & publishedDate) and series updatedAt.
 */
export const getSeriesLatestActivityTime = (series: Series): number => {
  if (!series) return 0;
  let maxTime = 0;

  // 1. Inspect all chapters for the newest release date / timestamp
  if (series.chapters && Array.isArray(series.chapters) && series.chapters.length > 0) {
    for (const ch of series.chapters) {
      if (typeof ch.createdAt === 'number' && ch.createdAt > 0) {
        maxTime = Math.max(maxTime, ch.createdAt);
      }
      if (ch.publishedDate) {
        const parsed = parseCustomDateToTimestamp(ch.publishedDate, ch.createdAt);
        maxTime = Math.max(maxTime, parsed);
      }
    }
  }

  // 2. Inspect series updatedAt
  if (series.updatedAt) {
    const parsedUpdated = parseCustomDateToTimestamp(series.updatedAt);
    maxTime = Math.max(maxTime, parsedUpdated);
  }

  // 3. Fallback: Check if series ID contains timestamp (e.g., "s-1724490000000" or "s-blogger-1724490000000")
  if (maxTime === 0 && series.id) {
    const match = series.id.match(/\d{10,}/);
    if (match) {
      const ts = parseInt(match[0], 10);
      if (!isNaN(ts) && ts > 1000000000000) {
        maxTime = ts;
      }
    }
  }

  return maxTime;
};

/**
 * Sorts series list strictly from newest release/chapter to oldest (descending order).
 * Whenever a series gets a new chapter or update, it will automatically come to the very first position.
 */
export const sortSeriesByLatestRelease = (seriesArray: Series[]): Series[] => {
  if (!seriesArray || !Array.isArray(seriesArray)) return [];

  return [...seriesArray].sort((a, b) => {
    const timeA = getSeriesLatestActivityTime(a);
    const timeB = getSeriesLatestActivityTime(b);

    if (timeB !== timeA) {
      return timeB - timeA; // Newest first (descending)
    }

    // Secondary sort: rating descending
    if ((b.rating || 0) !== (a.rating || 0)) {
      return (b.rating || 0) - (a.rating || 0);
    }

    // Tertiary sort: title alphabetical
    return a.title.localeCompare(b.title, 'tr');
  });
};

/**
 * Checks if a chapter was published within the specified number of hours (default 24 hours).
 */
export const checkIsChapterNew = (ch: Chapter, maxHours: number = 24): boolean => {
  if (!ch) return false;

  // 1. If exact createdAt timestamp is present
  if (ch.createdAt && typeof ch.createdAt === 'number') {
    const diffHours = (Date.now() - ch.createdAt) / (1000 * 60 * 60);
    return diffHours >= 0 && diffHours <= maxHours;
  }

  // 2. If publishedDate is standard YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(ch.publishedDate)) {
    const pubTime = new Date(ch.publishedDate).getTime();
    const nowTime = Date.now();
    const diffHours = (nowTime - pubTime) / (1000 * 60 * 60);
    return diffHours >= 0 && diffHours <= maxHours + 12; // Allow same date margin
  }

  // 3. If publishedDate contains relative Turkish time strings
  const dateStr = (ch.publishedDate || '').toLowerCase();
  if (
    dateStr.includes('dakika') ||
    dateStr.includes('az önce') ||
    dateStr.includes('şimdi') ||
    dateStr.includes('bugün')
  ) {
    return true;
  }

  if (dateStr.includes('saat')) {
    const match = dateStr.match(/(\d+)\s*saat/);
    if (match) {
      const hours = parseInt(match[1], 10);
      return hours <= maxHours;
    }
    return true;
  }

  if (dateStr.includes('1 gün önce')) {
    return maxHours >= 24;
  }

  // 4. Fallback to explicit boolean flag
  return !!ch.isNew;
};

