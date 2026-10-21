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

  // Handle protocol-relative URLs (e.g. //i.imgur.com/...)
  if (clean.startsWith('//')) {
    clean = 'https:' + clean;
  }

  // Eski mikrokosmosdeposu adresini otomatik olarak yeni mediadepo adresine yönlendirir:
  if (clean.includes('mikrokosmosdeposu')) {
    clean = clean.replace(/mikrokosmosdeposu/g, 'mediadepo');
  }

  // Normalize Blogger / GoogleUserContent thumbnail sizes (/s320/, /s640/, /s1600/, etc.) to /s0/ (original full resolution) so original quality is preserved without downscaling or lossy compression
  if (
    clean.includes('blogger.googleusercontent.com') ||
    clean.includes('bp.blogspot.com') ||
    clean.includes('googleusercontent.com')
  ) {
    if (!clean.includes('/d/')) {
      clean = clean
        .replace(/\/(s|w)\d{1,5}(-h\d{1,5})?(-rw(-l\d+)?)?\//g, '/s0/')
        .replace(/=(s|w)\d{1,5}(-h\d{1,5})?(-rw(-l\d+)?)?$/g, '=s0');
    }
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

  // 4. Pinterest Pin URL to Pinterest embed URL
  const pinMatch = clean.match(/^https?:\/\/(?:[a-z]{2,3}\.)?pinterest\.(?:com|co\.uk|de|fr|ca|jp|kr|ru)\/pin\/(?:[^/?#]*--)?(\d{8,25})\/?/i);
  if (pinMatch && pinMatch[1]) {
    return `https://assets.pinterest.com/ext/embed.html?id=${pinMatch[1]}`;
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
 * Checks if a URL is an iframe embed URL (e.g. YouTube, Pinterest embed, player embed, video embed)
 */
export function isIframeUrl(url: string): boolean {
  if (!url) return false;
  const lower = url.toLowerCase();
  
  // Note: Google Drive links are normalized to direct lh3.googleusercontent.com/d/... images
  return (
    lower.includes('assets.pinterest.com/ext/embed.html') ||
    lower.includes('youtube.com/embed') ||
    lower.includes('youtube-nocookie.com/embed') ||
    lower.includes('player.vimeo.com') ||
    lower.includes('dailymotion.com/embed') ||
    lower.includes('ok.ru/videoembed') ||
    lower.includes('vidoza') ||
    lower.includes('mega.nz/embed') ||
    (lower.includes('/embed') && !lower.includes('googleusercontent.com'))
  );
}

interface MediaMatch {
  index: number;
  url: string;
}

/**
 * Extracts and normalizes all image and embed URLs from raw text, HTML snippets,
 * BBCode, Markdown, or string arrays in strict top-to-bottom document position order.
 */
export function extractImageUrls(input: string | string[] | undefined | null): string[] {
  if (!input) return [];

  const stringList = Array.isArray(input) ? input : [input];
  const extracted: string[] = [];

  const addUrl = (urlStr: string) => {
    if (!urlStr) return;
    const normalized = normalizeImageUrl(urlStr);
    if (!normalized) return;
    // Filter out 1x1 transparent tracking pixels
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

  for (const item of stringList) {
    if (typeof item !== 'string' || !item.trim()) continue;

    const matches: MediaMatch[] = [];

    const collectMatches = (regex: RegExp, groupIndex: number = 1) => {
      regex.lastIndex = 0;
      let m: RegExpExecArray | null;
      while ((m = regex.exec(item)) !== null) {
        if (m[groupIndex]) {
          matches.push({ index: m.index, url: m[groupIndex] });
        }
      }
    };

    // 1. Match HTML <img ...> with src, data-src, data-original, data-url, data-lazy-src, data-lazy
    collectMatches(/<img\b[^>]*?\b(?:src|data-src|data-original|data-url|data-lazy-src|data-lazy)=["']?([^"'\s>]+)["']?[^>]*>/gi, 1);

    // 2. Match HTML <iframe ... src="..." />
    collectMatches(/<iframe\b[^>]*?\bsrc=["']?([^"'\s>]+)["']?[^>]*>/gi, 1);

    // 3. Match HTML <embed ... src="..." /> and <source ... src="..." />
    collectMatches(/<(?:embed|source|video)\b[^>]*?\bsrc=["']?([^"'\s>]+)["']?[^>]*>/gi, 1);

    // 4. Match HTML <object ... data="..." />
    collectMatches(/<object\b[^>]*?\bdata=["']?([^"'\s>]+)["']?[^>]*>/gi, 1);

    // 5. Match HTML <a ... href="image/drive/pinterest link">
    collectMatches(/<a\b[^>]*?\bhref=["']?([^"'\s>]+\.(?:jpg|jpeg|png|webp|gif|bmp|svg)(?:\?[^"'\s>]*)?|https?:\/\/(?:drive|docs)\.google\.com\/[^"'\s>]+|https?:\/\/(?:[a-z]{2,3}\.)?pinterest\.[^"'\s>]+\/pin\/[^"'\s>]+)["']?[^>]*>/gi, 1);

    // 6. Match BBCode [img]...[/img]
    collectMatches(/\[img\](.*?)\[\/img\]/gi, 1);

    // 7. Match Markdown ![...](...) and [link](image)
    collectMatches(/!\s*\[.*?\]\((.*?)\)/gi, 1);

    // 8. Match CSS url(...)
    collectMatches(/url\(["']?([^"')]+)["']?\)/gi, 1);

    // 9. Direct raw URLs
    collectMatches(/(https?:\/\/[^\s"'<>\])]+|data:image\/[^\s"'<>\])]+|\/api\/[^\s"'<>\])]+)/gi, 1);

    // Sort all matches strictly by character position in the document (top to bottom)
    matches.sort((a, b) => a.index - b.index);

    // Add in exact position order
    for (const matchObj of matches) {
      addUrl(matchObj.url);
    }
  }

  return extracted;
}
