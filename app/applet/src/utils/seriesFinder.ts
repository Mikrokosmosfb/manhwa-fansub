import { Series, Chapter } from '../types';
import { sortChapters } from './chapterUtils';

/**
 * Robustly finds a Series in seriesList matching any query (ID, Slug, Title, or URL fragment).
 */
export function findSeriesByQuery(seriesList: Series[] | undefined, query: string | undefined): Series | undefined {
  if (!seriesList || seriesList.length === 0 || !query) return undefined;
  const rawQuery = String(query).trim();
  if (!rawQuery) return undefined;

  const normalizedQuery = rawQuery.toLowerCase();
  const decodedQuery = decodeURIComponent(rawQuery).trim().toLowerCase();
  const slugifiedQuery = rawQuery.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

  // 1. Exact ID match (case-insensitive)
  let found = seriesList.find(s => s.id === rawQuery || s.id.toLowerCase() === normalizedQuery || s.id.toLowerCase() === decodedQuery);
  if (found) return found;

  // 2. Exact Slug match (case-insensitive)
  found = seriesList.find(s => s.slug && (s.slug === rawQuery || s.slug.toLowerCase() === normalizedQuery || s.slug.toLowerCase() === decodedQuery || s.slug.toLowerCase() === slugifiedQuery));
  if (found) return found;

  // 3. Exact Title match or Title Slug match
  found = seriesList.find(s => {
    const tLower = s.title.toLowerCase();
    const tSlug = tLower.replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    return tLower === normalizedQuery || tLower === decodedQuery || tSlug === normalizedQuery || tSlug === slugifiedQuery;
  });
  if (found) return found;

  // 4. ID or Slug contains query
  found = seriesList.find(s => 
    s.id.toLowerCase().includes(normalizedQuery) || 
    (s.slug && s.slug.toLowerCase().includes(normalizedQuery)) ||
    normalizedQuery.includes(s.id.toLowerCase())
  );
  if (found) return found;

  // 5. Title partial match
  found = seriesList.find(s => 
    s.title.toLowerCase().includes(decodedQuery) || 
    decodedQuery.includes(s.title.toLowerCase())
  );

  return found;
}

/**
 * Robustly finds a Chapter inside a Series matching any chapterQuery (ID, Chapter Number, or Title).
 * Returns { chapter, index, sortedChapters }
 */
export function findChapterInSeries(series: Series | undefined, chapterQuery: string | undefined): {
  chapter: Chapter | undefined;
  index: number;
  sortedChapters: Chapter[];
} {
  if (!series || !series.chapters || series.chapters.length === 0) {
    return { chapter: undefined, index: -1, sortedChapters: [] };
  }

  const sortedChapters = sortChapters(series.chapters, 'asc');
  if (!chapterQuery) {
    return { chapter: sortedChapters[0], index: 0, sortedChapters };
  }

  const rawQuery = String(chapterQuery).trim();
  const decodedQuery = decodeURIComponent(rawQuery).trim().toLowerCase();

  // 1. Direct Chapter ID match
  let idx = sortedChapters.findIndex(c => c.id === rawQuery || c.id.toLowerCase() === decodedQuery);
  if (idx !== -1) {
    return { chapter: sortedChapters[idx], index: idx, sortedChapters };
  }

  // 2. Number extracted from query (e.g. "1", "6.1", "bolum-1", "chapter-1", "bölüm 1")
  const numMatch = decodedQuery.match(/\d+(\.\d+)?/);
  if (numMatch) {
    const targetNum = parseFloat(numMatch[0]);
    if (!isNaN(targetNum)) {
      idx = sortedChapters.findIndex(c => c.number === targetNum);
      if (idx !== -1) {
        return { chapter: sortedChapters[idx], index: idx, sortedChapters };
      }
    }
  }

  // 3. Direct number parse
  const parsedFloat = parseFloat(decodedQuery);
  if (!isNaN(parsedFloat)) {
    idx = sortedChapters.findIndex(c => c.number === parsedFloat || String(c.number) === rawQuery);
    if (idx !== -1) {
      return { chapter: sortedChapters[idx], index: idx, sortedChapters };
    }
  }

  // 4. Chapter Title or Special Tag match
  idx = sortedChapters.findIndex(c => 
    (c.title && c.title.toLowerCase().includes(decodedQuery)) ||
    (c.specialTag && c.specialTag.toLowerCase().includes(decodedQuery)) ||
    c.id.includes(rawQuery) ||
    rawQuery.includes(c.id)
  );
  if (idx !== -1) {
    return { chapter: sortedChapters[idx], index: idx, sortedChapters };
  }

  // 5. Fallback: If series has chapters, default to first chapter so page NEVER breaks or shows empty screen
  return { chapter: sortedChapters[0], index: 0, sortedChapters };
}
