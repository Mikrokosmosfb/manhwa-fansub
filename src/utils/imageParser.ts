/**
 * Utility functions for parsing image URLs, HTML embed tags (<img src="...">, <iframe src="...">, <embed src="...">),
 * Markdown (![alt](url)), BBCode ([img]url[/img]), Google Drive links, and raw URLs from chapter inputs.
 */

/**
 * Normalizes an image or embed URL:
 * - Converts Google Drive view/preview/open/uc links to direct CDN images (lh3.googleusercontent.com/d/FILE_ID)
 * - Converts Dropbox dl=0 to direct raw stream
 * - Converts Imgur page URLs to direct image URLs
 * - Decodes HTML entities and trims whitespace
 */
export function normalizeImageUrl(url: string): string {
  if (!url) return '';
  let clean = url.trim();

  // Remove surrounding quotes or angle brackets
  clean = clean.replace(/^["']+|["']+$|^<|>$/g, '');
  // Decode HTML entities
  clean = clean
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');

  // Skip data URIs / blobs
  if (clean.startsWith('data:') || clean.startsWith('blob:')) {
    return clean;
  }

  // 1. Google Drive direct image conversion
  // Matches:
  // https://drive.google.com/file/d/FILE_ID/preview
  // https://drive.google.com/file/d/FILE_ID/view?usp=sharing
  // https://drive.google.com/open?id=FILE_ID
  // https://drive.google.com/uc?id=FILE_ID
  // https://drive.google.com/uc?export=view&id=FILE_ID
  // https://docs.google.com/file/d/FILE_ID/...
  const driveMatch = clean.match(/(?:drive|docs)\.google\.com\/(?:file\/d\/|open\?id=|uc\?(?:export=view&)?id=)([a-zA-Z0-9_-]{20,})/i);
  if (driveMatch && driveMatch[1]) {
    const fileId = driveMatch[1];
    return `https://lh3.googleusercontent.com/d/${fileId}`;
  }

  // 2. Dropbox direct image link
  if (clean.includes('dropbox.com/s/')) {
    if (clean.includes('?dl=0') || clean.includes('?dl=1')) {
      return clean.replace(/\?dl=[01]/, '?raw=1');
    }
    if (!clean.includes('?raw=1')) {
      return clean + (clean.includes('?') ? '&raw=1' : '?raw=1');
    }
  }

  // 3. Imgur page to direct image
  if (/^https?:\/\/imgur\.com\/([a-zA-Z0-9]{5,8})$/i.test(clean)) {
    const match = clean.match(/^https?:\/\/imgur\.com\/([a-zA-Z0-9]{5,8})$/i);
    if (match && match[1]) {
      return `https://i.imgur.com/${match[1]}.jpg`;
    }
  }

  return clean;
}

/**
 * Checks if a given text string contains HTML tags
 */
export function isHtmlContent(text: string | undefined | null): boolean {
  if (!text) return false;
  return /<[a-z][\s\S]*>/i.test(text);
}

/**
 * Checks if a URL is an iframe embed URL (e.g. YouTube, player embed, video embed)
 */
export function isIframeUrl(url: string): boolean {
  if (!url) return false;
  const lower = url.toLowerCase();
  
  // Note: Google Drive links are normalized to direct lh3.googleusercontent.com/d/... images
  return (
    lower.includes('youtube.com/embed') ||
    lower.includes('youtube-nocookie.com/embed') ||
    lower.includes('player.vimeo.com') ||
    lower.includes('dailymotion.com/embed') ||
    lower.includes('ok.ru/videoembed') ||
    lower.includes('vidoza') ||
    lower.includes('mega.nz/embed') ||
    (lower.includes('/embed/') && !lower.includes('googleusercontent.com'))
  );
}

/**
 * Extracts and normalizes all image and embed URLs from raw text, HTML snippets,
 * BBCode, Markdown, or string arrays.
 */
export function extractImageUrls(input: string | string[] | undefined | null): string[] {
  if (!input) return [];

  const rawText = Array.isArray(input) ? input.join('\n') : input;
  if (typeof rawText !== 'string' || !rawText.trim()) return [];

  const extracted: string[] = [];

  const addUrl = (urlStr: string) => {
    if (!urlStr) return;
    const normalized = normalizeImageUrl(urlStr);
    if (!normalized) return;

    // Filter out 1x1 transparent tracking pixel GIFs commonly inserted by blogs
    if (
      normalized.startsWith('data:image/gif;base64,R0lGODlhAQAB') ||
      normalized.includes('blank.gif') ||
      normalized.includes('spacer.gif') ||
      normalized.includes('pixel.gif')
    ) {
      return;
    }

    if (!extracted.includes(normalized)) {
      extracted.push(normalized);
    }
  };

  // 1. Match HTML <img ...> with src, data-src, data-original, data-url, data-lazy-src, data-lazy
  const imgTagRegex = /<img\b[^>]*?\b(?:src|data-src|data-original|data-url|data-lazy-src|data-lazy)=["']?([^"'\s>]+)["']?[^>]*>/gi;
  let match: RegExpExecArray | null;
  while ((match = imgTagRegex.exec(rawText)) !== null) {
    if (match[1]) addUrl(match[1]);
  }

  // 2. Match HTML <iframe ... src="..." />
  const iframeTagRegex = /<iframe\b[^>]*?\bsrc=["']?([^"'\s>]+)["']?[^>]*>/gi;
  while ((match = iframeTagRegex.exec(rawText)) !== null) {
    if (match[1]) addUrl(match[1]);
  }

  // 3. Match HTML <embed ... src="..." />
  const embedTagRegex = /<embed\b[^>]*?\bsrc=["']?([^"'\s>]+)["']?[^>]*>/gi;
  while ((match = embedTagRegex.exec(rawText)) !== null) {
    if (match[1]) addUrl(match[1]);
  }

  // 4. Match HTML <object ... data="..." />
  const objectTagRegex = /<object\b[^>]*?\bdata=["']?([^"'\s>]+)["']?[^>]*>/gi;
  while ((match = objectTagRegex.exec(rawText)) !== null) {
    if (match[1]) addUrl(match[1]);
  }

  // 5. Match HTML <a ... href="image/drive link">
  const aTagRegex = /<a\b[^>]*?\bhref=["']?([^"'\s>]+\.(?:jpg|jpeg|png|webp|gif|bmp|svg)(?:\?[^"'\s>]*)?|https?:\/\/(?:drive|docs)\.google\.com\/[^"'\s>]+)["']?[^>]*>/gi;
  while ((match = aTagRegex.exec(rawText)) !== null) {
    if (match[1]) addUrl(match[1]);
  }

  // 6. Match BBCode [img]...[/img]
  const bbcodeRegex = /\[img\](.*?)\[\/img\]/gi;
  while ((match = bbcodeRegex.exec(rawText)) !== null) {
    if (match[1]) addUrl(match[1]);
  }

  // 7. Match Markdown ![...](...) and [link](image)
  const markdownImgRegex = /!\[.*?\]\((.*?)\)/gi;
  while ((match = markdownImgRegex.exec(rawText)) !== null) {
    if (match[1]) addUrl(match[1]);
  }

  // 8. Match CSS url(...)
  const cssUrlRegex = /url\(["']?([^"')]+)["']?\)/gi;
  while ((match = cssUrlRegex.exec(rawText)) !== null) {
    if (match[1]) addUrl(match[1]);
  }

  // 9. Always also parse line-by-line / text URLs in case of mixed content or raw URL lists
  const lines = rawText.split(/[\n\r]+/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Direct Google Drive, Blogger, Discord, or web URLs
    const urlMatches = trimmed.match(/(https?:\/\/[^\s"'<>]+|data:image\/[^\s"'<>]+)/gi);
    if (urlMatches && urlMatches.length > 0) {
      urlMatches.forEach(u => addUrl(u));
    }
  }

  return extracted;
}

