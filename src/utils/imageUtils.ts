/**
 * Image optimization utility
 * Safely handles image URL optimization for supported CDNs (Unsplash, Discord, Cloudinary, Imgur).
 * Ensures original URLs from Blogger/Google/external hosts are never corrupted or proxied through failing services.
 */

export interface ImageOptimizationOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'webp' | 'avif' | 'jpg' | 'auto';
}

export function getOptimizedImageUrl(
  url: string | undefined | null,
  optionsOrWidth: ImageOptimizationOptions | number = 300,
  fallbackQuality: number = 72
): string {
  if (!url || typeof url !== 'string') return '';

  const trimmed = url.trim();
  if (!trimmed) return '';

  // Return data URIs, SVGs, or blob URLs as-is
  if (trimmed.startsWith('data:') || trimmed.startsWith('blob:') || trimmed.includes('.svg')) {
    return trimmed;
  }

  const width = typeof optionsOrWidth === 'number' ? optionsOrWidth : optionsOrWidth.width || 300;
  const height = typeof optionsOrWidth === 'object' ? optionsOrWidth.height : undefined;
  // User specifically requested heavy compression (< 100kb), so we force lower quality
  const requestedQuality = typeof optionsOrWidth === 'object' && optionsOrWidth.quality !== undefined 
    ? optionsOrWidth.quality 
    : fallbackQuality;
  const quality = Math.min(requestedQuality, 50); // Cap quality at 50 for max compression
  const format = (typeof optionsOrWidth === 'object' && optionsOrWidth.format) || 'webp';

  // 1. Optimize Unsplash URLs
  if (trimmed.includes('images.unsplash.com')) {
    try {
      const parsed = new URL(trimmed);
      parsed.searchParams.set('w', width.toString());
      if (height) {
        parsed.searchParams.set('h', height.toString());
      }
      parsed.searchParams.set('auto', 'format');
      parsed.searchParams.set('fit', 'crop');
      parsed.searchParams.set('q', quality.toString());
      if (format !== 'auto') {
        parsed.searchParams.set('fm', format);
      }
      return parsed.toString();
    } catch {
      let res = trimmed
        .replace(/w=\d+/, `w=${width}`)
        .replace(/q=\d+/, `q=${quality}`);
      if (!res.includes('fm=')) {
        res += `&fm=${format}`;
      }
      return res;
    }
  }

  // 2. Safely handle Google UserContent, Google Drive & Blogger CDNs
  if (
    trimmed.includes('blogger.googleusercontent.com') ||
    trimmed.includes('googleusercontent.com') ||
    trimmed.includes('bp.blogspot.com')
  ) {
    // Direct Google Drive image endpoint: return unmodified
    if (trimmed.includes('googleusercontent.com/d/')) {
      return trimmed;
    }

    // For large/reader widths, ensure original/s1600 resolution but still compress
    if (width >= 600) {
      const largeParam = `w${width}-rw-l${quality}`;
      if (/\/(s|w)\d{2,4}(?:-[a-z0-9]+)?\//.test(trimmed)) {
        return trimmed.replace(/\/(s|w)\d{2,4}(?:-[a-z0-9]+)?\//, `/${largeParam}/`);
      }
      if (/=(s|w)\d{2,4}/.test(trimmed)) {
        return trimmed.replace(/=(s|w)\d{2,4}[^&]*/, `=${largeParam}`);
      }
      return trimmed;
    } else {
      // Thumbnail sizes for cards/covers
      const sizeParam = `w${width}-rw-l${quality}`; // rw = webp, l = quality
      if (/\/(s|w)\d{2,4}(?:-[a-z0-9]+)?\//.test(trimmed)) {
        return trimmed.replace(/\/(s|w)\d{2,4}(?:-[a-z0-9]+)?\//, `/${sizeParam}/`);
      }
      if (/=(s|w)\d{2,4}/.test(trimmed)) {
        return trimmed.replace(/=(s|w)\d{2,4}[^&]*/, `=${sizeParam}`);
      }
      return trimmed;
    }
  }

  // 3. Optimize Discord CDN attachments/avatars
  if (trimmed.includes('cdn.discordapp.com') || trimmed.includes('media.discordapp.net')) {
    try {
      const parsed = new URL(trimmed);
      parsed.searchParams.set('width', width.toString());
      if (height) parsed.searchParams.set('height', height.toString());
      parsed.searchParams.set('format', 'webp');
      parsed.searchParams.set('quality', quality.toString());
      return parsed.toString();
    } catch {
      return trimmed;
    }
  }

  // 4. Optimize Cloudinary URLs
  if (trimmed.includes('res.cloudinary.com')) {
    const transform = `c_fill,w_${width}${height ? `,h_${height}` : ''},q_${quality},f_webp`;
    if (trimmed.includes('/image/upload/')) {
      return trimmed.replace('/image/upload/', `/image/upload/${transform}/`);
    }
    return trimmed;
  }

  // 5. Optimize Imgur URLs
  if (trimmed.includes('i.imgur.com')) {
    const suffix = width <= 160 ? 'm' : width <= 320 ? 'l' : 'h';
    return trimmed.replace(/([a-zA-Z0-9]+)(\.(png|jpg|jpeg|gif))$/i, `$1${suffix}.webp`);
  }

  // 6. Optimize WordPress / Jetpack CDN (wp.com / i0.wp.com)
  if (trimmed.includes('.wp.com') || trimmed.includes('wordpress.com')) {
    try {
      const parsed = new URL(trimmed);
      parsed.searchParams.set('w', width.toString());
      parsed.searchParams.set('strip', 'all');
      parsed.searchParams.set('quality', quality.toString());
      return parsed.toString();
    } catch {
      return trimmed;
    }
  }

  // 7. DiceBear Avatars
  if (trimmed.includes('api.dicebear.com')) {
    try {
      const parsed = new URL(trimmed);
      parsed.searchParams.set('size', Math.min(width, 128).toString());
      return parsed.toString();
    } catch {
      return trimmed;
    }
  }

  // 8. Return original unmodified URL for all other external sources to ensure 100% reliable loading
  return trimmed;
}

