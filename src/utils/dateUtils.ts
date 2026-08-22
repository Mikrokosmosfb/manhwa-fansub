import { Chapter } from '../types';

/**
 * Checks if a chapter was published within the specified number of hours (default 24 hours).
 */
export const checkIsChapterNew = (ch: Chapter, maxHours: number = 24): boolean => {
  if (!ch) return false;

  // 1. If exact createdAt timestamp is present
  if (ch.createdAt) {
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
  const dateStr = ch.publishedDate.toLowerCase();
  if (dateStr.includes('dakika') || dateStr.includes('az önce') || dateStr.includes('bugün')) {
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
