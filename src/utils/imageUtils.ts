import React from 'react';
import { normalizeImageUrl } from './imageParser';

/**
 * Image optimization & reliability utility
 * Safely normalizes and serves image URLs without corrupting Blogger, Google Drive, Imgur, or Discord links.
 */

export interface ImageOptimizationOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'webp' | 'avif' | 'jpg' | 'auto';
  original?: boolean;
}

const HTTPS_UPGRADE_HOSTS = [
  'bp.blogspot.com',
  'blogger.googleusercontent.com',
  'googleusercontent.com',
  'i.imgur.com',
  'imgur.com',
  'res.cloudinary.com',
  'images.unsplash.com',
  'cdn.discordapp.com',
  'media.discordapp.net',
  'wp.com',
  'postimages.org',
  'postimg.cc',
  'i.hizliresim.com'
];

/**
 * Returns a manhwa chapter image URL at 100% original, uncompressed quality.
 * Preserves the exact WebP file uploaded without downscaling or lossy recompression.
 */
export function getChapterImageUrl(
  url: string | undefined | null,
  qualityMode: 'orijinal' | 'yuksek' | 'dengeli' | 'tasarruf' = 'orijinal'
): string {
  if (!url || typeof url !== 'string') return '';
  let clean = url.trim();
  if (!clean) return '';

  // Return data URIs, SVGs, or blob URLs as-is
  if (clean.startsWith('data:') || clean.startsWith('blob:') || clean.includes('.svg')) {
    return clean;
  }

  // Extract src if an HTML <img ...> tag was passed
  if (clean.includes('<img') && /src=["']([^"']+)["']/i.test(clean)) {
    const match = clean.match(/src=["']([^"']+)["']/i);
    if (match && match[1]) {
      clean = match[1].trim();
    }
  }

  // Normalize Google Drive, Dropbox, Imgur, mikrokosmosdeposu -> mediadepo
  clean = normalizeImageUrl(clean);

  // Upgrade http:// to https://
  if (clean.startsWith('http://')) {
    try {
      const parsedHttp = new URL(clean);
      if (HTTPS_UPGRADE_HOSTS.some(host => parsedHttp.hostname === host || parsedHttp.hostname.endsWith(`.${host}`))) {
        clean = 'https://' + clean.slice('http://'.length);
      }
    } catch {}
  }

  // Google / Blogger CDN:
  // /s0/ and =s0 deliver the 100% original uncompressed uploaded file without downscaling or lossy compression
  if (
    clean.includes('blogger.googleusercontent.com') ||
    clean.includes('bp.blogspot.com') ||
    clean.includes('googleusercontent.com')
  ) {
    if (!clean.includes('/d/')) {
      if (qualityMode === 'tasarruf') {
        clean = clean
          .replace(/\/(s|w)\d{1,5}(-h\d{1,5})?(-rw(-l\d+)?)?\//g, '/s1200/')
          .replace(/=(s|w)\d{1,5}(-h\d{1,5})?(-rw(-l\d+)?)?$/g, '=s1200');
      } else {
        // Original 100% uncompressed quality (default for reader)
        clean = clean
          .replace(/\/(s|w)\d{1,5}(-h\d{1,5})?(-rw(-l\d+)?)?\//g, '/s0/')
          .replace(/=(s|w)\d{1,5}(-h\d{1,5})?(-rw(-l\d+)?)?$/g, '=s0');
      }
    }
  }

  // Unsplash or query-based CDNs: strip downscaling unless data saver is on
  if (clean.includes('images.unsplash.com')) {
    try {
      const parsed = new URL(clean);
      if (qualityMode === 'tasarruf') {
        parsed.searchParams.set('w', '1000');
        parsed.searchParams.set('q', '75');
      } else {
        parsed.searchParams.delete('w');
        parsed.searchParams.delete('h');
        parsed.searchParams.set('q', '100');
        parsed.searchParams.delete('fit');
      }
      return parsed.toString();
    } catch {}
  }

  return clean;
}

export function getOptimizedImageUrl(
  url: string | undefined | null,
  optionsOrWidth: ImageOptimizationOptions | number = 300,
  fallbackQuality: number = 75
): string | undefined {
  if (!url || typeof url !== 'string') return undefined;

  let trimmed = url.trim();
  if (!trimmed) return undefined;

  // Return data URIs, SVGs, or blob URLs as-is
  if (trimmed.startsWith('data:') || trimmed.startsWith('blob:') || trimmed.includes('.svg')) {
    return trimmed;
  }

  // Extract src if an HTML <img ...> tag was pasted into an image URL field
  if (trimmed.includes('<img') && /src=["']([^"']+)["']/i.test(trimmed)) {
    const match = trimmed.match(/src=["']([^"']+)["']/i);
    if (match && match[1]) {
      trimmed = match[1].trim();
    }
  }

  // Normalize Google Drive, Dropbox, Imgur page links, and HTML entities
  trimmed = normalizeImageUrl(trimmed);

  // Upgrade http:// to https:// on known CDNs to avoid browser Mixed Content blocking
  if (trimmed.startsWith('http://')) {
    try {
      const parsedHttp = new URL(trimmed);
      if (HTTPS_UPGRADE_HOSTS.some(host => parsedHttp.hostname === host || parsedHttp.hostname.endsWith(`.${host}`))) {
        trimmed = 'https://' + trimmed.slice('http://'.length);
      }
    } catch {
      // Ignore URL parse error
    }
  }

  const isOriginal = typeof optionsOrWidth === 'object' && optionsOrWidth.original;
  const width = typeof optionsOrWidth === 'number' ? optionsOrWidth : optionsOrWidth.width || 300;
  const height = typeof optionsOrWidth === 'object' ? optionsOrWidth.height : undefined;
  const requestedQuality =
    typeof optionsOrWidth === 'object' && optionsOrWidth.quality !== undefined
      ? optionsOrWidth.quality
      : fallbackQuality;
  const quality = Math.min(Math.max(requestedQuality, 10), 100);
  const format = (typeof optionsOrWidth === 'object' && optionsOrWidth.format) || 'webp';

  // 1. Optimize Unsplash URLs (officially supports w, h, q, fm, auto, fit)
  if (trimmed.includes('images.unsplash.com')) {
    try {
      const parsed = new URL(trimmed);
      if (!isOriginal) {
        parsed.searchParams.set('w', width.toString());
        if (height) {
          parsed.searchParams.set('h', height.toString());
        }
        parsed.searchParams.set('auto', 'format');
        parsed.searchParams.set('fit', 'crop');
      }
      parsed.searchParams.set('q', quality.toString());
      if (format !== 'auto' && !isOriginal) {
        parsed.searchParams.set('fm', format);
      }
      return parsed.toString();
    } catch {
      return trimmed;
    }
  }

  // 2. Google / Blogger CDN
  if (
    trimmed.includes('blogger.googleusercontent.com') ||
    trimmed.includes('googleusercontent.com') ||
    trimmed.includes('bp.blogspot.com')
  ) {
    if (!trimmed.includes('/d/')) {
      if (isOriginal || width >= 1600 || quality >= 90) {
        // Original full uncompressed resolution
        return trimmed
          .replace(/\/(s|w)\d{1,5}(-h\d{1,5})?(-rw(-l\d+)?)?\//g, '/s0/')
          .replace(/=(s|w)\d{1,5}(-h\d{1,5})?(-rw(-l\d+)?)?$/g, '=s0');
      }
      // Scaled thumbnail for small cards/avatars
      const targetSize = Math.min(width, 1600);
      return trimmed
        .replace(/\/(s|w)\d{1,5}(-h\d{1,5})?(-rw(-l\d+)?)?\//g, `/s${targetSize}/`)
        .replace(/=(s|w)\d{1,5}(-h\d{1,5})?(-rw(-l\d+)?)?$/g, `=s${targetSize}`);
    }
  }

  // 3. DiceBear Avatars
  if (trimmed.includes('api.dicebear.com')) {
    try {
      const parsed = new URL(trimmed);
      parsed.searchParams.set('size', Math.min(width, 128).toString());
      return parsed.toString();
    } catch {
      return trimmed;
    }
  }

  // 4. Return original unmodified URL for all other hosts (mediadepo, Imgur, Discord, R2, etc.)
  return trimmed;
}

/**
 * Generates a clean SVG data URI fallback cover when an external image URL is unreachable.
 */
export function createFallbackCoverDataUri(title?: string): string {
  const safeTitle = (title || 'Mikrokosmos Fansub')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .slice(0, 36);

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="450" viewBox="0 0 300 450">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#1e1035"/>
        <stop offset="50%" stop-color="#120824"/>
        <stop offset="100%" stop-color="#090414"/>
      </linearGradient>
    </defs>
    <rect width="300" height="450" fill="url(#bg)"/>
    <circle cx="150" cy="185" r="36" fill="none" stroke="#a855f7" stroke-width="2.5" opacity="0.45"/>
    <ellipse cx="150" cy="185" rx="68" ry="18" fill="none" stroke="#ec4899" stroke-width="2" opacity="0.45" transform="rotate(-20 150 185)"/>
    <text x="150" y="275" text-anchor="middle" fill="#e9d5ff" font-family="system-ui,sans-serif" font-weight="800" font-size="15">${safeTitle}</text>
    <text x="150" y="302" text-anchor="middle" fill="#a855f7" font-family="system-ui,sans-serif" font-weight="700" font-size="11" letter-spacing="2">MIKROKOSMOS</text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/**
 * Smart onError handler for <img> elements:
 * 1. Retries with normalized raw URL if different
 * 2. Retries Google Drive file IDs with drive.google.com/thumbnail endpoint
 * 3. Falls back to a clean cosmic SVG cover instead of browser broken-image icon
 */
export function handleImageError(
  e: React.SyntheticEvent<HTMLImageElement, Event>,
  rawUrl?: string | null,
  fallbackTitle?: string
): void {
  const target = e.currentTarget;
  const step = Number(target.dataset.fallbackStep || '0');

  if (step === 0 && rawUrl) {
    const cleanRaw = normalizeImageUrl(rawUrl.trim());
    if (cleanRaw && target.src !== cleanRaw) {
      target.dataset.fallbackStep = '1';
      target.src = cleanRaw;
      return;
    }
  }

  if (step <= 1 && rawUrl) {
    const driveIdMatch =
      rawUrl.match(/googleusercontent\.com\/d\/([a-zA-Z0-9_-]{20,})/i) ||
      rawUrl.match(/(?:drive|docs)\.google\.com\/(?:file\/d\/|open\?id=|uc\?(?:export=view&)?id=)([a-zA-Z0-9_-]{20,})/i);
    if (driveIdMatch && driveIdMatch[1]) {
      const thumbUrl = `https://drive.google.com/thumbnail?id=${driveIdMatch[1]}&sz=w1000`;
      if (target.src !== thumbUrl) {
        target.dataset.fallbackStep = '2';
        target.src = thumbUrl;
        return;
      }
    }
  }

  if (step < 3) {
    target.dataset.fallbackStep = '3';
    target.src = createFallbackCoverDataUri(fallbackTitle);
  }
}
