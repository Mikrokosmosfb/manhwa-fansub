/**
 * Utility functions for parsing image URLs, HTML embed tags (<img src="...">, <iframe src="...">),
 * Markdown (![alt](url)), BBCode ([img]url[/img]), and raw URLs from chapter inputs.
 */

export function extractImageUrls(input: string | string[] | undefined | null): string[] {
  if (!input) return [];

  const rawText = Array.isArray(input) ? input.join('\n') : input;
  if (typeof rawText !== 'string' || !rawText.trim()) return [];

  const extracted: string[] = [];

  const addUrl = (urlStr: string) => {
    if (!urlStr) return;
    let clean = urlStr.trim();
    // Remove wrapping quotes or brackets if any
    clean = clean.replace(/^["']+|["']+$|^<|>$/g, '');
    // Replace HTML entity &amp;
    clean = clean.replace(/&amp;/g, '&');
    if (clean && !extracted.includes(clean)) {
      extracted.push(clean);
    }
  };

  // 1. Match HTML <img ... src="..." /> or src='...'
  const imgTagRegex = /<img\b[^>]*?\bsrc=["']?([^"'\s>]+)["']?[^>]*>/gi;
  let match: RegExpExecArray | null;
  while ((match = imgTagRegex.exec(rawText)) !== null) {
    if (match[1]) addUrl(match[1]);
  }

  // 2. Match HTML <iframe ... src="..." />
  const iframeTagRegex = /<iframe\b[^>]*?\bsrc=["']?([^"'\s>]+)["']?[^>]*>/gi;
  while ((match = iframeTagRegex.exec(rawText)) !== null) {
    if (match[1]) addUrl(match[1]);
  }

  // 3. Match BBCode [img]...[/img]
  const bbcodeRegex = /\[img\](.*?)\[\/img\]/gi;
  while ((match = bbcodeRegex.exec(rawText)) !== null) {
    if (match[1]) addUrl(match[1]);
  }

  // 4. Match Markdown ![...](...)
  const markdownRegex = /!\[.*?\]\((.*?)\)/gi;
  while ((match = markdownRegex.exec(rawText)) !== null) {
    if (match[1]) addUrl(match[1]);
  }

  // If specific HTML, BBCode, or Markdown image tags were extracted, return them
  if (extracted.length > 0) {
    return extracted;
  }

  // 5. Fallback: Parse line-by-line or space/comma separated URLs
  const lines = rawText.split(/[\n\r]+/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Check if line contains src="..."
    const srcMatch = trimmed.match(/src=["']?([^"'\s>]+)["']?/i);
    if (srcMatch && srcMatch[1]) {
      addUrl(srcMatch[1]);
      continue;
    }

    // Extract all http://, https://, or data:image URLs in the line
    const urlMatches = trimmed.match(/(https?:\/\/[^\s"'<>]+|data:image\/[^\s"'<>]+)/gi);
    if (urlMatches && urlMatches.length > 0) {
      urlMatches.forEach(u => addUrl(u));
      continue;
    }

    // Direct path or data URI
    if (
      trimmed.startsWith('http://') ||
      trimmed.startsWith('https://') ||
      trimmed.startsWith('/') ||
      trimmed.startsWith('data:')
    ) {
      addUrl(trimmed);
    }
  }

  return extracted;
}

/**
 * Checks if a given text string contains HTML tags
 */
export function isHtmlContent(text: string | undefined | null): boolean {
  if (!text) return false;
  return /<[a-z][\s\S]*>/i.test(text);
}

/**
 * Checks if a URL is an iframe embed URL (e.g. Google Drive preview, YouTube, player)
 */
export function isIframeUrl(url: string): boolean {
  if (!url) return false;
  const lower = url.toLowerCase();
  return (
    lower.includes('drive.google.com/file') ||
    lower.includes('/preview') ||
    lower.includes('/embed/') ||
    lower.includes('youtube.com/embed') ||
    lower.includes('vidoza') ||
    lower.includes('ok.ru/videoembed') ||
    lower.includes('iframe')
  );
}
