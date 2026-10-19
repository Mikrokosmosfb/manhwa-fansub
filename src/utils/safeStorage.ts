/**
 * Safe LocalStorage Utility
 * Prevents "QuotaExceededError: The quota has been exceeded." crashes,
 * particularly in iOS Safari, Instagram/TikTok in-app browsers, and Private Browsing.
 */

const EXPENDABLE_CACHE_KEYS = [
  'mk_series_list',
  'mk_wallpapers_v1',
  'mk_comments',
  'mikro_requests_cache',
  'mk_reactions_map',
  'mk_toasted_notif_ids',
  'mk_deleted_wallpapers_v1',
  'mk_bookmark_folders'
];

/**
 * Proactively purges heavy dispensable cache items to free up browser storage.
 */
export function purgeExpendableStorageCache(): boolean {
  if (typeof window === 'undefined' || !window.localStorage) return false;
  let freedAny = false;
  try {
    for (const key of EXPENDABLE_CACHE_KEYS) {
      if (localStorage.getItem(key) !== null) {
        localStorage.removeItem(key);
        freedAny = true;
      }
    }
  } catch (e) {
    console.warn('[safeStorage] Error during cache purge:', e);
  }
  return freedAny;
}

/**
 * Sanitizes existing localStorage on app startup so users who previously
 * accumulated oversized series/chapter content are immediately cured.
 */
export function sanitizeStorageOnBoot(): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    const rawSeries = localStorage.getItem('mk_series_list');
    if (rawSeries && rawSeries.length > 300000) {
      // Over ~300KB indicates novel contents or heavy images are stored
      try {
        const parsed = JSON.parse(rawSeries);
        if (Array.isArray(parsed)) {
          const stripped = parsed.map(s => ({
            ...s,
            chapters: (s.chapters || []).map((ch: any) => ({
              id: ch.id,
              number: ch.number,
              title: ch.title,
              publishedDate: ch.publishedDate,
              specialTag: ch.specialTag,
              is18Plus: ch.is18Plus,
              createdAt: ch.createdAt
            }))
          }));
          localStorage.setItem('mk_series_list', JSON.stringify(stripped));
        }
      } catch {
        localStorage.removeItem('mk_series_list');
      }
    }
  } catch (err: any) {
    if (err?.name === 'QuotaExceededError' || String(err).includes('quota')) {
      purgeExpendableStorageCache();
    }
  }
}

/**
 * Safe wrapper around localStorage.setItem that NEVER throws unhandled exceptions.
 * If quota is exceeded, automatically purges expendable caches and retries once.
 */
export function safeSetItem(key: string, value: string): boolean {
  if (typeof window === 'undefined' || !window.localStorage) return false;
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (err: any) {
    const isQuota =
      err?.name === 'QuotaExceededError' ||
      err?.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
      err?.code === 22 ||
      err?.code === 1014 ||
      String(err?.message || err).toLowerCase().includes('quota');

    if (isQuota) {
      console.warn(`[safeStorage] Quota exceeded while setting "${key}". Purging expendable caches...`);
      purgeExpendableStorageCache();
      try {
        localStorage.setItem(key, value);
        return true;
      } catch (retryErr) {
        console.warn(`[safeStorage] Retry failed for "${key}". Skipping write.`);
        return false;
      }
    }
    console.warn(`[safeStorage] Failed to set "${key}":`, err);
    return false;
  }
}

/**
 * Safe wrapper around localStorage.getItem
 */
export function safeGetItem(key: string): string | null {
  if (typeof window === 'undefined' || !window.localStorage) return null;
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

/**
 * Safe wrapper around localStorage.removeItem
 */
export function safeRemoveItem(key: string): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    localStorage.removeItem(key);
  } catch {}
}

// Run boot sanitizer immediately when module is loaded
sanitizeStorageOnBoot();
