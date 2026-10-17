import { findSeriesByQuery, findChapterInSeries } from '../utils/seriesFinder';
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { NovelSettings, isChapter18Plus } from '../types';
import { extractImageUrls, isHtmlContent, isIframeUrl } from '../utils/imageParser';
import {
  Settings,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  List,
  ArrowLeft,
  Play,
  Pause,
  Maximize,
  RotateCcw,
  CheckCheck,
  Clock,
  Type,
  MessageSquare,
  Megaphone,
  Sparkles,
  Lock,
  User,
  Search,
  ArrowUpDown,
  Calendar,
  Layers,
  ChevronDown,
  CheckCircle2,
  MessageCircle,
  X,
  Eye,
  EyeOff,
  Quote,
  Feather,
  Globe
} from 'lucide-react';
import { CommentsSection } from './CommentsSection';
import { ChapterSpecialBadge } from './ChapterSpecialBadge';
import { AdBannerBlock } from './AdScriptRunner';
import { MangaAlertStack } from './MangaAlertBox';
import { sortChapters, formatChapterDate, getChapterAlerts } from '../utils/chapterUtils';

interface NovelReaderProps {
  seriesId: string;
  chapterId: string;
}

export const NovelReader: React.FC<NovelReaderProps> = ({ seriesId, chapterId }) => {
  const {
    seriesList,
    setView,
    updateReadingProgress,
    markChapterCompleted,
    readingHistory,
    novelSettings,
    updateNovelSettings,
    resetNovelSettings,
    user,
    openAuthModal,
    loginWithGoogle,
    adSettings,
    comments,
    setSeriesList,
    isLoadingSeries
  } = useApp();

  const series = seriesList.find(s => s.id === seriesId);

  const sortedChapters = useMemo(() => {
    return sortChapters(series?.chapters || [], 'asc');
  }, [series?.chapters]);

  const chapterIndex = sortedChapters.findIndex(c => c.id === chapterId);
  const currentChapter = sortedChapters[chapterIndex];

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [dropdownSearch, setDropdownSearch] = useState('');
  const [dropdownOrder, setDropdownOrder] = useState<'asc' | 'desc'>('asc');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const currentChapterItemRef = useRef<HTMLButtonElement>(null);
  const [isAutoScrolling, setIsAutoScrolling] = useState(false);
  const [currentBookPage, setCurrentBookPage] = useState(0);
  useEffect(() => {
    setCurrentBookPage(0);
  }, [chapterId]);

  const novelContentRef = useRef<HTMLDivElement>(null);
  const autoScrollRef = useRef<NodeJS.Timeout | null>(null);

  // Paragraph Comments State (Webnovel / Wattpad style inline comments)
  const [showParagraphComments, setShowParagraphComments] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('mk_novel_para_comments');
      return saved !== null ? saved === 'true' : true;
    } catch {
      return true;
    }
  });
  const [activeParagraph, setActiveParagraph] = useState<{
    key: string;
    text: string;
    index: number;
  } | null>(null);
  const [highlightedParaKey, setHighlightedParaKey] = useState<string | null>(null);

  const toggleParagraphCommentsVisibility = () => {
    setShowParagraphComments(prev => {
      const next = !prev;
      try {
        localStorage.setItem('mk_novel_para_comments', String(next));
      } catch {}
      if (!next) setActiveParagraph(null);
      return next;
    });
  };

  const [isHydratingContent, setIsHydratingContent] = useState(false);

  // Close active paragraph drawer when changing chapter
  useEffect(() => {
    setActiveParagraph(null);
    setHighlightedParaKey(null);
  }, [seriesId, chapterId]);

  // If localStorage had a lightweight catalog without chapter.content, immediately hydrate from /api/series?seriesId=...
  useEffect(() => {
    if (currentChapter && (!currentChapter.content || !currentChapter.content.trim())) {
      let cancelled = false;
      setIsHydratingContent(true);
      fetch(`/api/series?seriesId=${encodeURIComponent(seriesId)}`, { cache: 'no-store' })
        .then(r => r.json())
        .then(data => {
          if (cancelled) return;
          if (data && data.success && Array.isArray(data.chapters) && data.chapters.length > 0) {
            setSeriesList(prev =>
              prev.map(s => (s.id === seriesId ? { ...s, chapters: data.chapters } : s))
            );
            setIsHydratingContent(false);
            return;
          }
          if (data && data.success && Array.isArray(data.data) && data.data.length > 0) {
            setSeriesList(data.data);
            setIsHydratingContent(false);
            return;
          }
          // Fallback to full /api/series
          return fetch('/api/series', { cache: 'no-store' })
            .then(r2 => r2.json())
            .then(fullData => {
              if (cancelled) return;
              if (fullData && fullData.success && Array.isArray(fullData.data) && fullData.data.length > 0) {
                setSeriesList(fullData.data);
              }
            });
        })
        .catch(() => {})
        .finally(() => {
          if (!cancelled) setIsHydratingContent(false);
        });
      return () => {
        cancelled = true;
      };
    }
  }, [seriesId, chapterId, currentChapter?.id, currentChapter?.content]);

  // Close dropdown on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsDropdownOpen(false);
    };
    if (isDropdownOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isDropdownOpen]);

  // Scroll current chapter into view when opening dropdown
  useEffect(() => {
    if (isDropdownOpen && currentChapterItemRef.current) {
      setTimeout(() => {
        currentChapterItemRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' });
      }, 50);
    }
  }, [isDropdownOpen]);

  // Filter and order chapters for dropdown
  const dropdownFilteredChapters = useMemo(() => {
    let list = [...sortedChapters];
    if (dropdownOrder === 'desc') {
      list.reverse();
    }
    if (dropdownSearch.trim()) {
      const q = dropdownSearch.toLowerCase().trim();
      list = list.filter(c => 
        (c.title || '').toLowerCase().includes(q) || 
        String(c.number || '').includes(q) ||
        (c.specialTag || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [sortedChapters, dropdownOrder, dropdownSearch]);

  // Decode Blogger / HTML entities (including double-escaped &amp;nbsp; and numeric entities)
  const decodeNovelEntities = (str: string): string => {
    if (!str) return '';
    let out = str;
    // Two passes to handle double-encoded entities from Blogger XML (e.g., &amp;nbsp;)
    for (let pass = 0; pass < 2; pass++) {
      out = out
        .replace(/&nbsp;|&#160;|&#xa0;/gi, ' ')
        .replace(/&quot;|&#34;/gi, '"')
        .replace(/&#39;|&#039;|&apos;/gi, "'")
        .replace(/&lsquo;|&#8216;/gi, '‘')
        .replace(/&rsquo;|&#8217;/gi, '’')
        .replace(/&ldquo;|&#8220;/gi, '“')
        .replace(/&rdquo;|&#8221;/gi, '”')
        .replace(/&ndash;|&#8211;/gi, '–')
        .replace(/&mdash;|&#8212;/gi, '—')
        .replace(/&hellip;|&#8230;/gi, '…')
        .replace(/&laquo;|&#171;/gi, '«')
        .replace(/&raquo;|&#187;/gi, '»')
        .replace(/&bull;|&#8226;/gi, '•')
        .replace(/&lt;|&#60;/gi, '<')
        .replace(/&gt;|&#62;/gi, '>')
        .replace(/&#(\d+);/g, (_, dec) => {
          const code = Number(dec);
          if (code === 160) return ' ';
          return Number.isFinite(code) ? String.fromCodePoint(code) : _;
        })
        .replace(/&#x([0-9a-f]+);/gi, (_, hex) => {
          const code = parseInt(hex, 16);
          if (code === 160) return ' ';
          return Number.isFinite(code) ? String.fromCodePoint(code) : _;
        })
        .replace(/&amp;|&#38;/gi, '&');
    }
    return out.replace(/\u00A0/g, ' ');
  };

  // Word count & estimated reading time calculation
  const wordCount = currentChapter?.content
    ? decodeNovelEntities(currentChapter.content).trim().split(/\s+/).filter(Boolean).length
    : 0;
  const estimatedMinutes = Math.max(1, Math.round(wordCount / 200));

  // Deterministic content hash (FNV-1a) + Blogger/Novel Chapter Profile Card extraction
  const { parsedParagraphs, chapterProfileCard, remainingChapterImages } = useMemo(() => {
    // Safely use chapter content, or fallback to any HTML/text payload stored in images
    let rawContent = currentChapter?.content || '';
    if (!rawContent.trim() && Array.isArray(currentChapter?.images) && currentChapter.images.length > 0) {
      const htmlPayload = currentChapter.images.find(
        img => typeof img === 'string' && (img.includes('<p>') || img.includes('<div>') || img.includes('<br') || img.length > 300)
      );
      if (htmlPayload) {
        rawContent = htmlPayload;
      }
    }
    const raw = rawContent.replace(/mikrokosmosdeposu/g, 'mediadepo');
    const allChapterImgs = extractImageUrls(currentChapter?.images);

    const computeHash = (text: string, occurrence: number): string => {
      const normalized = text
        .toLowerCase()
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 160);
      let h = 0x811c9dc5;
      for (let i = 0; i < normalized.length; i++) {
        h ^= normalized.charCodeAt(i);
        h = Math.imul(h, 0x01000193);
      }
      const base = (h >>> 0).toString(36);
      return occurrence > 0 ? `${base}_${occurrence}` : base;
    };

    const occurrenceMap = new Map<string, number>();
    const makeItem = (plainText: string, htmlContent?: string, isMediaOnly = false) => {
      const cleanText = decodeNovelEntities(plainText).replace(/\s+/g, ' ').trim();
      const normKey = cleanText.toLowerCase().slice(0, 160);
      const occ = occurrenceMap.get(normKey) || 0;
      occurrenceMap.set(normKey, occ + 1);
      const key = cleanText ? computeHash(cleanText, occ) : `media_${occurrenceMap.size}`;
      const cleanedHtml = htmlContent
        ? htmlContent
            .replace(/(&amp;)+nbsp;|&nbsp;|&#160;|&#xa0;/gi, ' ')
            .replace(/\u00A0/g, ' ')
            .trim()
        : undefined;
      return {
        key,
        text: cleanText,
        html: cleanedHtml,
        isMediaOnly
      };
    };

    let extractedProfileImg = '';
    let detectedSeriesTitle = '';
    const detectedBadges: { label: string; value: string }[] = [];

    const normalizeLabel = (lbl: string): string => {
      const lower = lbl.toLowerCase().trim();
      if (lower === 'seri' || lower === 'roman' || lower === 'kitap') return 'Seri';
      if (lower === 'çevirmen' || lower === 'cevirmen' || lower === 'çeviren') return 'Çevirmen';
      if (lower === 'çeviri' || lower === 'ceviri' || lower === 'dil' || lower === 'kaynak dil') return 'Çeviri';
      if (lower === 'editör' || lower === 'editor') return 'Editör';
      if (lower === 'redaktör' || lower === 'redaktor') return 'Redaktör';
      if (lower === 'kontrol') return 'Kontrol';
      return lbl.trim();
    };

    const addMetadataField = (rawLabel: string, rawValue: string) => {
      const normLabel = normalizeLabel(rawLabel);
      const cleanVal = decodeNovelEntities(rawValue).replace(/\s+/g, ' ').trim();
      if (!cleanVal) return;
      if (normLabel === 'Seri') {
        if (!detectedSeriesTitle) detectedSeriesTitle = cleanVal;
      } else {
        if (!detectedBadges.some(b => b.label.toLowerCase() === normLabel.toLowerCase())) {
          detectedBadges.push({ label: normLabel, value: cleanVal });
        }
      }
    };

    const parseMetadataTextChunk = (chunkText: string) => {
      const decoded = decodeNovelEntities(chunkText).replace(/\s+/g, ' ').trim();
      if (!decoded) return;
      const labelRegex = /(?:^|\s)(Seri|Roman|Kitap|Çevirmen|Cevirmen|Çeviren|Çeviri|Kaynak Dil|Editör|Editor|Redaktör|Redaktor|Kontrol)\s*:/gi;
      let matches = [];
      let match;
      while ((match = labelRegex.exec(decoded)) !== null) {
        const label = match[1];
        const labelIndex = match.index + match[0].indexOf(label);
        matches.push({ label, index: labelIndex, length: label.length + 1 });
      }
      for (let i = 0; i < matches.length; i++) {
        const current = matches[i];
        const next = matches[i+1];
        const start = current.index + current.length;
        const end = next ? next.index : decoded.length;
        const val = decoded.slice(start, end).trim();
        if (val) {
          addMetadataField(current.label, val);
        }
      }
    };

    let candidateParagraphs: { key: string; text: string; html?: string; isMediaOnly: boolean }[] = [];

    if (raw.trim()) {
      if (isHtmlContent(raw)) {
        try {
          const normalizedHtml = raw
            .replace(/(&amp;)+nbsp;/gi, '&nbsp;')
            .replace(/(<br\s*\/?>\s*){2,}/gi, '</p><p>');
          const parser = new DOMParser();
          const doc = parser.parseFromString(normalizedHtml, 'text/html');

          // 1. Extract <div class="profile"> blocks safely (without deleting chapter text if nested inside .profile)
          doc.querySelectorAll('.profile, .profile-card').forEach(profileEl => {
            const imgEl = profileEl.querySelector('img');
            if (imgEl && imgEl.getAttribute('src') && !extractedProfileImg) {
              extractedProfileImg = imgEl.getAttribute('src') || '';
            }
            const totalProfileText = (profileEl.textContent || '').replace(/\s+/g, ' ').trim();
            if (totalProfileText.length <= 320) {
              parseMetadataTextChunk(totalProfileText);
              profileEl.remove();
            } else {
              // The novel chapter body was accidentally placed inside .profile in Blogger
              profileEl.querySelectorAll('.profile-picture').forEach(el => el.remove());
              profileEl.querySelectorAll('.profile-details').forEach(detEl => {
                const detTxt = (detEl.textContent || '').replace(/\s+/g, ' ').trim();
                if (detTxt.length <= 260) {
                  parseMetadataTextChunk(detTxt);
                  detEl.remove();
                }
              });
              profileEl.classList.remove('profile', 'profile-card');
            }
          });

          const results: { key: string; text: string; html?: string; isMediaOnly: boolean }[] = [];

          const extractNodes = (parent: Element | Document['body']) => {
            const children = Array.from(parent.childNodes);
            for (const node of children) {
              if (node.nodeType === Node.TEXT_NODE) {
                const txt = decodeNovelEntities(node.textContent || '').replace(/\s+/g, ' ').trim();
                if (txt) {
                  results.push(makeItem(txt));
                }
              } else if (node.nodeType === Node.ELEMENT_NODE) {
                const el = node as HTMLElement;
                const tag = el.tagName.toLowerCase();
                if (tag === 'style' || tag === 'script' || tag === 'baslik') continue;
                if (
                  el.classList?.contains('manga-alert') ||
                  el.classList?.contains('profile') ||
                  el.style?.display === 'none'
                ) {
                  continue;
                }
                const hasBlockChildren = Array.from(el.children).some(c =>
                  ['P', 'DIV', 'BLOCKQUOTE', 'UL', 'OL', 'LI', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'HR'].includes(
                    c.tagName
                  )
                );
                if (hasBlockChildren && (tag === 'div' || tag === 'section' || tag === 'article')) {
                  extractNodes(el);
                } else {
                  const txt = decodeNovelEntities(el.textContent || '').replace(/\s+/g, ' ').trim();
                  const hasMedia = Boolean(el.querySelector('img, iframe, hr')) || tag === 'img' || tag === 'hr';
                  if (txt) {
                    results.push(makeItem(txt, el.innerHTML));
                  } else if (hasMedia) {
                    results.push(makeItem('', el.outerHTML, true));
                  }
                }
              }
            }
          };

          extractNodes(doc.body);
          candidateParagraphs = results;
        } catch {}
      }

      if (candidateParagraphs.length === 0) {
        candidateParagraphs = raw
          .split(/\n+/)
          .map(p => decodeNovelEntities(p).replace(/\s+/g, ' ').trim())
          .filter(Boolean)
          .map(p => makeItem(p));
      }
    }

        // All rules removed - showing all content without skipping
    const finalParagraphs = candidateParagraphs;

    // 3. Build the Chapter Profile Card
    // If this chapter doesn't explicitly contain Seri/Çevirmen/Çeviri lines, inherit from previous chapters of THIS same series
    const hasExplicitChapterMeta = Boolean(
      extractedProfileImg || detectedSeriesTitle || detectedBadges.length > 0
    );

    let inheritedImg = '';
    if (!hasExplicitChapterMeta && series?.chapters && series.chapters.length > 0) {
      for (const otherCh of series.chapters) {
        if (otherCh.id === currentChapter?.id || !otherCh.content) continue;
        const sample = decodeNovelEntities(
          otherCh.content
            .slice(0, 900)
            .replace(/<[^>]+>/g, '\n')
        );
    const labelHeadRegex = /^(Seri|Roman|Kitap|Çevirmen|Cevirmen|Çeviren|Çeviri|Ceviri|Kaynak Dil|Editör|Editor|Redaktör|Redaktor|Kontrol)\s*:\s*(.*)$/i;
        const lines = sample
          .split(/\n+/)
          .map(l => l.replace(/\s+/g, ' ').trim())
          .filter(Boolean)
          .slice(0, 12);

        let idx = 0;
        while (idx < lines.length) {
          const line = lines[idx];
          const m = line.match(labelHeadRegex);
          if (!m) break;
          const rLabel = m[1];
          let rVal = m[2].trim();
          idx++;
          if (!rVal && idx < lines.length && !labelHeadRegex.test(lines[idx])) {
            rVal = lines[idx].trim();
            idx++;
          }
          if (
            rVal &&
            idx < lines.length &&
            ((rVal.endsWith('-') && lines[idx].length <= 15 && !labelHeadRegex.test(lines[idx])) ||
              /^-?\s*(CN|EN|KR|JP|TR|ENG|KOR|CHN)$/i.test(lines[idx]))
          ) {
            const suf = lines[idx].replace(/^-\s*/, '');
            rVal = rVal.endsWith('-') ? `${rVal} ${suf}` : `${rVal} - ${suf}`;
            idx++;
          }
          if (rVal) {
            addMetadataField(rLabel, rVal);
          }
        }

        if (detectedBadges.length > 0) {
          const otherImgs = extractImageUrls(otherCh.images);
          if (otherImgs.length > 0) {
            inheritedImg = otherImgs[0];
          }
          break;
        }
      }
    }

    if (
      detectedBadges.length === 0 &&
      series?.translator &&
      series.translator.trim() &&
      series.translator !== 'Blogger' &&
      series.translator !== 'Mikrokosmos Fansub'
    ) {
      detectedBadges.push({ label: 'Çevirmen', value: series.translator.trim() });
    }

    let usedFirstChapterImg = false;

    if (
      extractedProfileImg &&
      allChapterImgs.length > 0 &&
      allChapterImgs[0] === extractedProfileImg
    ) {
      usedFirstChapterImg = true;
    } else if (hasExplicitChapterMeta && allChapterImgs.length === 1) {
      // Single image at top of a Blogger-imported novel chapter is the legacy profile avatar
      usedFirstChapterImg = true;
    }

    // Always prefer the full high-res vertical series cover on the card so the artwork is never cut off
    const cardImageUrl = series?.coverImage || extractedProfileImg || inheritedImg || allChapterImgs[0] || '';

    const profileCard =
      hasExplicitChapterMeta || detectedBadges.length > 0
        ? {
            imageUrl: cardImageUrl || series?.coverImage || '',
            seriesTitle: detectedSeriesTitle || series?.title || '',
            badges: detectedBadges
          }
        : null;

    const remainingImgs = usedFirstChapterImg ? allChapterImgs.slice(1) : allChapterImgs;

    let cleanedParagraphs = finalParagraphs;
    if (profileCard) {
      let startIndex = 0;
      const metaLabels = ['seri', 'roman', 'kitap', 'çevirmen', 'cevirmen', 'çeviren', 'çeviri', 'kaynak dil', 'editör', 'editor', 'redaktör', 'redaktor', 'kontrol'];
      const langCodes = ['kr', 'cn', 'en', 'jp', 'tr', 'korece', 'çince', 'ingilizce', 'japonca'];

      for (let i = 0; i < Math.min(finalParagraphs.length, 10); i++) {
        const p = finalParagraphs[i];
        if (p.isMediaOnly) {
          startIndex = i + 1;
          continue;
        }
        const textTrim = p.text.trim();
        const lower = textTrim.toLowerCase();
        
        const isMetadataLabel = metaLabels.some(l => lower === l || lower.startsWith(l + ':'));
        const isMetadataValue = textTrim.length < 35 && (
          langCodes.includes(lower) || 
          lower.endsWith('-') || 
          (!/[.!?]/.test(textTrim) && !/^["'“‘(«]/.test(textTrim))
        );
        const isRealSentence = /[.!?]/.test(textTrim) || /^["'“‘(«]/.test(textTrim) || textTrim.length > 50;

        if (isRealSentence) {
          break;
        }
        if (isMetadataLabel || isMetadataValue) {
          startIndex = i + 1;
        } else {
          break;
        }
      }
      cleanedParagraphs = finalParagraphs.slice(startIndex);
    }

    return {
      parsedParagraphs: cleanedParagraphs,
      chapterProfileCard: profileCard,
      remainingChapterImages: remainingImgs
    };
  }, [currentChapter?.id, currentChapter?.content, currentChapter?.images, series?.title, series?.coverImage, series?.translator, series?.chapters]);

  // Single-pass comment count map per paragraph for this chapter (zero network overhead)
  const paragraphCommentCounts = useMemo(() => {
    const map: Record<string, number> = {};
    if (!currentChapter) return map;
    const prefix = `${currentChapter.id}__p__`;
    for (const c of comments) {
      if (c.seriesId === seriesId && c.chapterId && c.chapterId.startsWith(prefix)) {
        const pKey = c.chapterId.slice(prefix.length);
        map[pKey] = (map[pKey] || 0) + 1;
      }
    }
    return map;
  }, [comments, seriesId, currentChapter?.id]);

  const totalParagraphCommentsInChapter = useMemo(() => {
    return (Object.values(paragraphCommentCounts) as number[]).reduce((sum: number, n: number) => sum + n, 0);
  }, [paragraphCommentCounts]);

  const paragraphLookup = useMemo(() => {
    const map: Record<string, { text: string; index: number }> = {};
    parsedParagraphs.forEach((p, idx) => {
      if (!p.isMediaOnly && p.text) {
        map[p.key] = { text: p.text, index: idx + 1 };
      }
    });
    return map;
  }, [parsedParagraphs]);

  const handleJumpToParagraph = (paraKey: string) => {
    setShowParagraphComments(true);
    setHighlightedParaKey(paraKey);
    const el = document.querySelector(`[data-para-key="${paraKey}"]`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    setTimeout(() => {
      setHighlightedParaKey(prev => (prev === paraKey ? null : prev));
    }, 5000);
  };

  // Auto-open and scroll to paragraph if navigated from Recent Comments
  useEffect(() => {
    if (parsedParagraphs.length === 0) return;
    try {
      const targetParaKey = sessionStorage.getItem('mk_open_para_key');
      if (!targetParaKey) return;
      sessionStorage.removeItem('mk_open_para_key');
      const foundIdx = parsedParagraphs.findIndex(p => p.key === targetParaKey);
      if (foundIdx !== -1) {
        const found = parsedParagraphs[foundIdx];
        setShowParagraphComments(true);
        setActiveParagraph({ key: found.key, text: found.text, index: foundIdx + 1 });
        setTimeout(() => {
          const el = document.querySelector(`[data-para-key="${found.key}"]`);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 120);
      }
    } catch {}
  }, [parsedParagraphs, seriesId, chapterId]);

  const prevChapter = chapterIndex > 0 ? sortedChapters[chapterIndex - 1] : null;
  const nextChapter =
    chapterIndex >= 0 && chapterIndex < sortedChapters.length - 1 ? sortedChapters[chapterIndex + 1] : null;

  const handleGoToNextChapter = () => {
    if (nextChapter && series && currentChapter) {
      markChapterCompleted(series.id, currentChapter.id, currentChapter.number, currentChapter.title);
      setView({ type: 'reader', seriesId: series.id, chapterId: nextChapter.id });
    }
  };

  // BOOK MODE (SAYFA SAYFA KİTAP OKUMA) LOGIC & HELPERS
  const isBookMode = novelSettings.readingMode === 'book';
  const paragraphsPerPage = novelSettings.paragraphsPerPage || 8;
  const totalBookPages = Math.max(1, Math.ceil(parsedParagraphs.length / paragraphsPerPage));
  const activeBookPage = Math.min(Math.max(0, currentBookPage), totalBookPages - 1);
  const displayedParagraphs = isBookMode
    ? parsedParagraphs.slice(activeBookPage * paragraphsPerPage, (activeBookPage + 1) * paragraphsPerPage)
    : parsedParagraphs;

  const goToPage = (page: number) => {
    const target = Math.max(0, Math.min(page, totalBookPages - 1));
    setCurrentBookPage(target);
    if (target >= totalBookPages - 1 && series && currentChapter) {
      markChapterCompleted(series.id, currentChapter.id, currentChapter.number, currentChapter.title);
    }
    if (novelContentRef.current) {
      const yOffset = -70;
      const y = novelContentRef.current.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const goToNextPage = () => {
    if (activeBookPage < totalBookPages - 1) {
      goToPage(activeBookPage + 1);
    } else if (nextChapter) {
      handleGoToNextChapter();
    }
  };

  const goToPrevPage = () => {
    if (activeBookPage > 0) {
      goToPage(activeBookPage - 1);
    } else if (prevChapter) {
      setView({ type: 'reader', seriesId: series.id, chapterId: prevChapter.id });
    }
  };

  // Keyboard navigation for Book Mode (ArrowLeft, ArrowRight, PageUp, PageDown)
  useEffect(() => {
    if (!isBookMode) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const tag = activeEl?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || (activeEl as HTMLElement)?.isContentEditable) return;

      if (e.key === 'ArrowRight' || e.key === 'PageDown') {
        goToNextPage();
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        goToPrevPage();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isBookMode, activeBookPage, totalBookPages, nextChapter, prevChapter]);

  // Touch swipe support for Book Mode on mobile
  const touchStartXRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);

  const handleBookTouchStart = (e: React.TouchEvent) => {
    if (!isBookMode) return;
    touchStartXRef.current = e.changedTouches[0].clientX;
    touchStartYRef.current = e.changedTouches[0].clientY;
  };

  const handleBookTouchEnd = (e: React.TouchEvent) => {
    if (!isBookMode || touchStartXRef.current === null || touchStartYRef.current === null) return;
    const diffX = e.changedTouches[0].clientX - touchStartXRef.current;
    const diffY = e.changedTouches[0].clientY - touchStartYRef.current;
    touchStartXRef.current = null;
    touchStartYRef.current = null;

    if (Math.abs(diffX) > 45 && Math.abs(diffX) > Math.abs(diffY) * 1.3) {
      if (diffX < 0) {
        goToNextPage();
      } else {
        goToPrevPage();
      }
    }
  };

  // Handle auto scroll
  useEffect(() => {
    if (isAutoScrolling) {
      const scrollStep = novelSettings.scrollSpeed * 1.5;
      autoScrollRef.current = setInterval(() => {
        window.scrollBy({ top: scrollStep, behavior: 'smooth' });
      }, 30);
    } else {
      if (autoScrollRef.current) clearInterval(autoScrollRef.current);
    }

    return () => {
      if (autoScrollRef.current) clearInterval(autoScrollRef.current);
    };
  }, [isAutoScrolling, novelSettings.scrollSpeed]);

  // Scroll listener to detect when user reaches bottom of chapter (100% read)
  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const winScroll = window.scrollY || document.documentElement.scrollTop;
          const height =
            document.documentElement.scrollHeight - document.documentElement.clientHeight;
          if (height > 0) {
            const scrolled = (winScroll / height) * 100;
            if (scrolled >= 90 && series && currentChapter) {
              markChapterCompleted(series.id, currentChapter.id, currentChapter.number, currentChapter.title);
            }
          }
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [series, currentChapter]);

  // Record last opened position on mount
  useEffect(() => {
    if (series && currentChapter) {
      updateReadingProgress(series.id, currentChapter.id, currentChapter.number, currentChapter.title);
      window.scrollTo(0, 0);
    }
  }, [seriesId, chapterId]);

    if (!series || !currentChapter) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gray-950">
        <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Member Protection Gate
  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-gray-950 text-slate-900 dark:text-white flex flex-col items-center justify-center p-4 sm:p-6 animate-fade-in">
        <div className="max-w-md w-full bg-white dark:bg-gray-900 border border-purple-200 dark:border-purple-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl text-center relative overflow-hidden backdrop-blur-xl">
          <div className="absolute -top-16 -left-16 w-40 h-40 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-16 -right-16 w-40 h-40 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="w-16 h-16 rounded-2xl bg-purple-100 dark:bg-purple-900/80 border border-purple-300 dark:border-purple-400/40 flex items-center justify-center mx-auto mb-5 shadow-lg text-amber-600 dark:text-amber-300">
            <Lock size={32} />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-500/10 border border-amber-300 dark:border-amber-500/30 text-amber-800 dark:text-amber-300 text-xs font-bold mb-3">
            <Sparkles size={14} />
            <span>Üyelere Özel İçerik</span>
          </div>

          <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2">
            Bölümü Okumak İçin Üye Olun
          </h2>

          <p className="text-xs sm:text-sm text-slate-600 dark:text-purple-200/80 mb-6 leading-relaxed">
            <strong className="text-slate-900 dark:text-white font-semibold">{series.title}</strong> romanının <strong className="text-amber-700 dark:text-amber-300 font-semibold">{currentChapter.title || `Bölüm ${currentChapter.number}`}</strong> içeriğini okuyabilmek için Mikrokosmos Fansub hesabınıza giriş yapmalı veya ücretsiz üye olmalısınız.
          </p>

          <div className="space-y-3 mb-6">
            <button
              onClick={() => openAuthModal('login')}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-500 hover:to-indigo-500 text-white font-black py-3 px-4 rounded-2xl shadow-xl transition duration-200 transform hover:scale-[1.02]"
            >
              <User size={18} />
              <span>Giriş Yap / Ücretsiz Kayıt Ol</span>
            </button>

            <button
              onClick={loginWithGoogle}
              className="w-full flex items-center justify-center gap-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-white dark:hover:bg-gray-100 text-slate-900 dark:text-gray-900 font-bold py-3 px-4 rounded-2xl border border-slate-300 dark:border-transparent shadow-sm transition duration-200"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.15C3.26 21.3 7.31 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.24c-.25-.72-.38-1.49-.38-2.24s.13-1.52.38-2.24V6.61H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.39l3.99-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.61l3.99 3.15c.95-2.85 3.6-4.96 6.72-4.96z"
                />
              </svg>
              <span className="text-xs sm:text-sm">Google ile Tek Tıkla Giriş Yap</span>
            </button>
          </div>

          <button
            onClick={() => setView({ type: 'series-detail', seriesId })}
            className="text-xs text-purple-700 dark:text-purple-300 hover:underline underline-offset-4 transition"
          >
            ← Seri Sayfasına Geri Dön
          </button>
        </div>
      </div>
    );
  }

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const getWidthClass = () => {
    switch (novelSettings.widthMode) {
      case 'dar':
        return 'max-w-xl';
      case 'genis':
        return 'max-w-full';
      default:
        return 'max-w-3xl';
    }
  };

  return (
    <div
      className="min-h-screen pb-20 transition-colors duration-300"
      style={{
        backgroundColor: novelSettings.bgColor,
        color: novelSettings.textColor
      }}
    >
      {/* Top Header Bar */}
      <div className="bg-white/95 dark:bg-gray-900/95 border-b border-purple-200 dark:border-purple-500/20 sticky top-0 z-30 backdrop-blur-md px-2.5 sm:px-4 py-2 shadow-md dark:shadow-lg">
        <div className="max-w-3xl mx-auto flex items-center gap-1.5 sm:gap-2.5">
          
          {/* Back button */}
          <button
            type="button"
            onClick={() => setView({ type: 'series-detail', seriesId: series.id })}
            className="h-9 sm:h-10 px-2.5 sm:px-3.5 rounded-xl flex items-center justify-center gap-1.5 text-xs sm:text-sm font-bold text-purple-700 dark:text-purple-200 hover:text-purple-900 dark:hover:text-white transition bg-purple-50 dark:bg-purple-950/70 hover:bg-purple-100 dark:hover:bg-purple-900/80 border border-purple-200 dark:border-purple-500/30 shrink-0 cursor-pointer"
            title={series.title}
          >
            <ArrowLeft size={15} className="shrink-0" />
            <span className="hidden md:inline max-w-[140px] lg:max-w-[180px] truncate">{series.title}</span>
            <span className="md:hidden">Seri</span>
          </button>

          {/* Chapter Selector Dropdown Trigger */}
          <div className="relative flex-1 min-w-0" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="w-full h-9 sm:h-10 bg-slate-100 dark:bg-gray-950/90 border border-purple-300 dark:border-purple-500/40 hover:border-purple-500 text-slate-900 dark:text-gray-100 text-xs sm:text-sm font-bold px-2.5 sm:px-3.5 rounded-xl flex items-center justify-between gap-1.5 transition shadow-inner group cursor-pointer"
            >
              <div className="flex items-center gap-1.5 min-w-0 flex-1">
                <Layers size={14} className="text-purple-500 dark:text-purple-400 shrink-0" />
                {isChapter18Plus(currentChapter) && (
                  <span
                    className="inline-flex items-center justify-center px-1.5 py-0.5 rounded-md bg-gradient-to-r from-red-600 to-rose-600 text-white text-[10px] font-black tracking-wider border border-red-400/50 shadow-sm shadow-red-900/40 shrink-0"
                    title="18+ Yetişkin İçerikli Bölüm (Smut)"
                  >
                    18+
                  </span>
                )}
                <span className="truncate">{currentChapter.title}</span>
                {currentChapter.specialTag && (
                  <span className="hidden xs:inline-flex shrink-0">
                    <ChapterSpecialBadge tag={currentChapter.specialTag} size="xs" />
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1 text-purple-600 dark:text-purple-400 shrink-0">
                <span className="text-[10px] bg-purple-500/15 text-purple-700 dark:text-purple-300 px-1.5 py-0.5 rounded-md font-mono font-bold">
                  {chapterIndex + 1}/{sortedChapters.length}
                </span>
                <ChevronDown size={14} className={`transition-transform duration-200 shrink-0 ${isDropdownOpen ? 'rotate-180 text-purple-600 dark:text-purple-300' : ''}`} />
              </div>
            </button>
          </div>

          {/* Settings & Nav */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={toggleParagraphCommentsVisibility}
              className={`h-9 px-2 sm:h-10 sm:px-2.5 rounded-xl border flex items-center justify-center gap-1 transition cursor-pointer ${
                showParagraphComments
                  ? 'bg-purple-600/20 dark:bg-purple-900/70 border-purple-400/50 text-purple-800 dark:text-purple-100'
                  : 'bg-slate-100 dark:bg-gray-900/60 border-slate-300 dark:border-gray-800 text-slate-400 dark:text-gray-500'
              }`}
              title={
                showParagraphComments
                  ? 'Paragraf Yorum Balonları Açık (Gizlemek için tıkla)'
                  : 'Paragraf Yorum Balonları Gizli (Açmak için tıkla)'
              }
            >
              <MessageCircle size={15} className={showParagraphComments ? 'text-purple-600 dark:text-amber-300' : ''} />
              {totalParagraphCommentsInChapter > 0 && (
                <span className="text-[10px] font-extrabold font-mono">
                  {totalParagraphCommentsInChapter}
                </span>
              )}
            </button>



            <button
              type="button"
              onClick={() => setIsSettingsOpen(!isSettingsOpen)}
              className={`h-9 w-9 sm:h-10 sm:w-10 rounded-xl border flex items-center justify-center transition cursor-pointer ${
                isSettingsOpen
                  ? 'bg-purple-600 border-purple-400 text-white'
                  : 'bg-purple-50 dark:bg-purple-950/60 border-purple-200 dark:border-purple-500/30 text-purple-700 dark:text-purple-200 hover:text-purple-950 dark:hover:text-white'
              }`}
              title="Okuma Ayarları"
            >
              <Settings size={17} />
            </button>

            <button
              type="button"
              disabled={!prevChapter}
              onClick={() => {
                if (prevChapter) {
                  setView({ type: 'reader', seriesId: series.id, chapterId: prevChapter.id });
                }
              }}
              className={`h-9 w-9 sm:h-10 sm:w-10 rounded-xl flex items-center justify-center transition shadow-sm ${
                prevChapter
                  ? 'bg-purple-600 hover:bg-purple-700 dark:bg-purple-800 dark:hover:bg-purple-700 text-white cursor-pointer'
                  : 'bg-slate-200/70 dark:bg-gray-800/50 text-slate-400 dark:text-gray-600 cursor-not-allowed'
              }`}
              title="Önceki Bölüm"
            >
              <ChevronLeft size={16} />
            </button>

            <button
              type="button"
              disabled={!nextChapter}
              onClick={() => {
                if (nextChapter) {
                  setView({ type: 'reader', seriesId: series.id, chapterId: nextChapter.id });
                }
              }}
              className={`h-9 w-9 sm:h-10 sm:w-10 rounded-xl flex items-center justify-center transition shadow-sm ${
                nextChapter
                  ? 'bg-purple-600 hover:bg-purple-700 dark:bg-purple-800 dark:hover:bg-purple-700 text-white cursor-pointer'
                  : 'bg-slate-200/70 dark:bg-gray-800/50 text-slate-400 dark:text-gray-600 cursor-not-allowed'
              }`}
              title="Sonraki Bölüm"
            >
              <ChevronRight size={16} />
            </button>
          </div>

        </div>
      </div>

      {/* Chapter List Drawer / Modal (accessible from both top and bottom buttons) */}
      {isDropdownOpen && (
        <>
          {/* Backdrop so tapping/clicking outside easily closes the drawer */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50"
            onClick={() => setIsDropdownOpen(false)}
          />

          <div className="chapter-select-dropdown fixed left-3 right-3 top-14 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 sm:top-20 sm:w-[460px] bg-white dark:bg-gray-900 border border-purple-300 dark:border-purple-500/50 rounded-2xl shadow-2xl overflow-hidden z-50 divide-y divide-slate-100 dark:divide-gray-800 backdrop-blur-xl animate-in fade-in slide-in-from-top-2 duration-150">
            
            {/* Dropdown Header: Title, Sort Order & Search */}
            <div className="p-3.5 bg-slate-50 dark:bg-gray-950/95 border-b border-purple-200 dark:border-purple-500/20 space-y-2.5 text-left">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <span className="flex items-center gap-1.5 text-xs sm:text-sm font-extrabold text-purple-700 dark:text-purple-300">
                    <Layers size={15} className="shrink-0" />
                    <span>Bölüm Listesi ({sortedChapters.length})</span>
                  </span>
                  <p className="text-[11px] text-slate-500 dark:text-gray-400 truncate mt-0.5">
                    {series.title}
                  </p>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => setDropdownOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                    className="flex items-center gap-1 text-[11px] font-bold text-purple-700 dark:text-purple-300 hover:text-purple-950 dark:hover:text-white bg-purple-100 dark:bg-purple-950/80 hover:bg-purple-200 dark:hover:bg-purple-900 border border-purple-300 dark:border-purple-500/40 px-2.5 py-1.5 rounded-xl transition cursor-pointer"
                  >
                    <ArrowUpDown size={12} />
                    <span>{dropdownOrder === 'asc' ? '1 → Son' : 'Son → 1'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsDropdownOpen(false)}
                    className="px-2.5 py-1.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-bold transition cursor-pointer"
                    title="Kapat"
                  >
                    ✕
                  </button>
                </div>
              </div>

              <div className="relative">
                <Search size={14} className="absolute left-3 top-2.5 text-slate-400 dark:text-gray-400" />
                <input
                  type="text"
                  placeholder="Bölüm numarası veya başlık ara..."
                  value={dropdownSearch}
                  onChange={(e) => setDropdownSearch(e.target.value)}
                  className="w-full bg-white dark:bg-gray-900 border border-purple-300 dark:border-purple-500/30 focus:border-purple-500 rounded-xl pl-9 pr-3 py-2 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 outline-none transition"
                />
              </div>
            </div>

            {/* Dropdown Chapter List */}
            <div className="max-h-[60vh] sm:max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-gray-800/70 custom-scrollbar">
              {dropdownFilteredChapters.length === 0 ? (
                <div className="p-6 text-center text-xs sm:text-sm text-slate-500 dark:text-gray-400">
                  Eşleşen bölüm bulunamadı.
                </div>
              ) : (
                dropdownFilteredChapters.map(ch => {
                  const isCurrent = ch.id === currentChapter.id;
                  const isRead = Boolean(readingHistory[series.id]?.readChapterIds?.includes(ch.id));

                  return (
                    <button
                      key={ch.id}
                      ref={isCurrent ? currentChapterItemRef : null}
                      onClick={() => {
                        setView({ type: 'reader', seriesId: series.id, chapterId: ch.id });
                        setIsDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3.5 py-3 text-xs sm:text-sm flex items-center justify-between gap-3 transition group cursor-pointer ${
                        isCurrent
                          ? 'bg-purple-100 dark:bg-purple-900/90 text-purple-900 dark:text-white font-bold border-l-4 border-purple-600 dark:border-purple-400 shadow-inner'
                          : 'hover:bg-purple-50 dark:hover:bg-purple-950/50 text-slate-700 dark:text-gray-200'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
                          isCurrent ? 'bg-purple-600 dark:bg-amber-400 animate-pulse' : isRead ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-gray-600'
                        }`} />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            {isChapter18Plus(ch) && (
                              <span
                                className="inline-flex items-center justify-center px-1.5 py-0.5 rounded-md bg-gradient-to-r from-red-600 to-rose-600 text-white text-[10px] font-black tracking-wider border border-red-400/50 shadow-sm shadow-red-900/40 shrink-0"
                                title="18+ Yetişkin İçerikli Bölüm (Smut)"
                              >
                                18+
                              </span>
                            )}
                            <span className="truncate font-semibold">{ch.title}</span>
                            {ch.specialTag && (
                              <ChapterSpecialBadge tag={ch.specialTag} size="xs" />
                            )}
                          </div>
                          {formatChapterDate(ch) && (
                            <span className="block text-[10px] text-slate-400 dark:text-gray-400 mt-0.5">
                              {formatChapterDate(ch)}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {isCurrent ? (
                          <span className="text-[10px] bg-purple-600 text-white px-2 py-0.5 rounded-full font-bold">
                            Okunuyor
                          </span>
                        ) : isRead ? (
                          <span className="flex items-center gap-1 text-[10px] text-emerald-500 dark:text-emerald-400 font-semibold">
                            <CheckCircle2 size={14} />
                            <span className="hidden xs:inline">Okundu</span>
                          </span>
                        ) : null}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}

      {/* Customizable Reading Settings Panel (Compact & Mobile-First) */}
      {isSettingsOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50"
            onClick={() => setIsSettingsOpen(false)}
          />
          <div className="fixed left-2.5 right-2.5 top-14 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 sm:top-16 sm:w-[620px] z-50 max-h-[calc(100dvh-5.5rem)] overflow-y-auto custom-scrollbar bg-white dark:bg-purple-950/98 border border-purple-300 dark:border-purple-500/50 rounded-2xl p-3 sm:p-4 shadow-2xl text-slate-900 dark:text-white space-y-2.5 sm:space-y-3.5 backdrop-blur-xl animate-in fade-in slide-in-from-top-2 duration-150">
            
            <div className="flex items-center justify-between border-b border-purple-200 dark:border-purple-800 pb-2 gap-2">
              <h3 className="font-extrabold text-[11px] sm:text-xs uppercase tracking-wider text-purple-700 dark:text-purple-200 flex items-center gap-1.5 truncate">
                <Settings size={14} className="shrink-0" />
                <span className="truncate">Roman Okuma Ayarları</span>
              </h3>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={resetNovelSettings}
                  className="text-[11px] text-rose-700 dark:text-red-200 font-bold px-2 py-1 rounded-lg bg-rose-50 dark:bg-red-900/50 border border-rose-200 dark:border-red-700 flex items-center gap-1 transition cursor-pointer"
                >
                  <RotateCcw size={11} />
                  <span>Varsayılan</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsSettingsOpen(false)}
                  className="text-[11px] text-purple-700 dark:text-purple-200 hover:text-purple-900 dark:hover:text-white font-bold px-2.5 py-1 rounded-lg bg-purple-100 dark:bg-purple-900/70 border border-purple-300 dark:border-purple-700 cursor-pointer"
                >
                  Kapat ✕
                </button>
              </div>
            </div>

            {/* Okuma Modu (Dikey Kaydırma vs Sayfa Sayfa Kitap Modu) */}
            <div>
              <label className="text-[10px] sm:text-[11px] uppercase font-bold text-slate-600 dark:text-purple-300 block mb-1">
                Okuma Modu
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => updateNovelSettings({ readingMode: 'scroll' })}
                  className={`py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 border transition cursor-pointer ${
                    !isBookMode
                      ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white border-purple-400 shadow-md font-extrabold ring-1 ring-purple-400/40'
                      : 'bg-slate-100 dark:bg-purple-900/40 border-purple-200 dark:border-purple-700/50 text-slate-700 dark:text-purple-200 hover:bg-purple-50 dark:hover:bg-purple-800/60'
                  }`}
                >
                  <List size={15} />
                  <span>Dikey Kaydırma</span>
                </button>

              </div>
            </div>

            {/* Presets (Gündüz, Sepya, Gece) */}
            <div>
              <label className="text-[10px] sm:text-[11px] uppercase font-bold text-slate-600 dark:text-purple-300 block mb-1">
                Hazır Modlar
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={() =>
                    updateNovelSettings({ bgColor: '#ffffff', textColor: '#0f172a' })
                  }
                  className="py-1.5 rounded-xl font-bold text-[11px] bg-white text-slate-900 border border-slate-300 shadow transition cursor-pointer"
                >
                  Gündüz
                </button>
                <button
                  type="button"
                  onClick={() =>
                    updateNovelSettings({ bgColor: '#F2EFE9', textColor: '#3d0807' })
                  }
                  className="py-1.5 rounded-xl font-bold text-[11px] bg-[#F2EFE9] text-[#3d0807] border border-amber-300 shadow transition cursor-pointer"
                >
                  Sepya
                </button>
                <button
                  type="button"
                  onClick={() =>
                    updateNovelSettings({ bgColor: '#1e1e1e', textColor: '#dddddd' })
                  }
                  className="py-1.5 rounded-xl font-bold text-[11px] bg-[#1e1e1e] text-[#dddddd] border border-gray-700 shadow transition cursor-pointer"
                >
                  Gece
                </button>
              </div>
            </div>

            {/* Dropdown Options Grid (2x2 on mobile, 4 cols on sm) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">

              {/* Font Family */}
              <div>
                <label className="block text-slate-700 dark:text-purple-300 font-bold mb-1 text-[10px] sm:text-[11px]">Yazı Tipi</label>
                <select
                  value={novelSettings.fontFamily}
                  onChange={e => updateNovelSettings({ fontFamily: e.target.value })}
                  className="w-full bg-slate-100 dark:bg-purple-900 border border-purple-200 dark:border-purple-700 text-slate-900 dark:text-white rounded-lg p-1.5 font-medium"
                >
                  <option value="Open Sans">Open Sans</option>
                  <option value="Montserrat">Montserrat</option>
                  <option value="Arial">Arial</option>
                  <option value="Times New Roman">Times New Roman</option>
                  <option value="Courier New">Courier New</option>
                </select>
              </div>

              {/* Line Height */}
              <div>
                <label className="block text-slate-700 dark:text-purple-300 font-bold mb-1 text-[10px] sm:text-[11px]">Satır Aralığı</label>
                <select
                  value={novelSettings.lineHeight}
                  onChange={e => updateNovelSettings({ lineHeight: e.target.value })}
                  className="w-full bg-slate-100 dark:bg-purple-900 border border-purple-200 dark:border-purple-700 text-slate-900 dark:text-white rounded-lg p-1.5 font-medium"
                >
                  <option value="120%">120%</option>
                  <option value="140%">140%</option>
                  <option value="160%">160%</option>
                  <option value="180%">180%</option>
                </select>
              </div>

              {/* Text Align */}
              <div>
                <label className="block text-slate-700 dark:text-purple-300 font-bold mb-1 text-[10px] sm:text-[11px]">Hizalama</label>
                <select
                  value={novelSettings.textAlign}
                  onChange={e =>
                    updateNovelSettings({
                      textAlign: e.target.value as NovelSettings['textAlign']
                    })
                  }
                  className="w-full bg-slate-100 dark:bg-purple-900 border border-purple-200 dark:border-purple-700 text-slate-900 dark:text-white rounded-lg p-1.5 font-medium"
                >
                  <option value="left">Sola Yasla</option>
                  <option value="center">Ortala</option>
                  <option value="justify">İki Yana</option>
                </select>
              </div>

              {/* Column Width */}
              <div>
                <label className="block text-slate-700 dark:text-purple-300 font-bold mb-1 text-[10px] sm:text-[11px]">Genişlik</label>
                <select
                  value={novelSettings.widthMode}
                  onChange={e =>
                    updateNovelSettings({
                      widthMode: e.target.value as NovelSettings['widthMode']
                    })
                  }
                  className="w-full bg-slate-100 dark:bg-purple-900 border border-purple-200 dark:border-purple-700 text-slate-900 dark:text-white rounded-lg p-1.5 font-medium"
                >
                  <option value="dar">Dar</option>
                  <option value="orta">Standart</option>
                  <option value="genis">Geniş</option>
                </select>
              </div>

            </div>

            {/* Font Size & Speed Row (2 cols side by side on mobile too) */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-purple-200 dark:border-purple-800/80">
              
              {/* Font Size Selector */}
              <div>
                <label className="block text-slate-700 dark:text-purple-300 font-bold text-[10px] sm:text-[11px] mb-1 truncate">
                  Yazı Boyutu ({novelSettings.fontSize}px)
                </label>
                <div className="flex items-center gap-1 bg-slate-100 dark:bg-purple-900/60 p-1 rounded-xl border border-purple-200 dark:border-purple-700/50">
                  <button
                    type="button"
                    onClick={() =>
                      updateNovelSettings({
                        fontSize: Math.max(12, novelSettings.fontSize - 2)
                      })
                    }
                    className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-bold py-1 rounded-lg text-[11px] transition shadow-sm"
                  >
                    A-
                  </button>
                  <span className="font-extrabold px-1.5 text-xs text-slate-900 dark:text-white">{novelSettings.fontSize}px</span>
                  <button
                    type="button"
                    onClick={() =>
                      updateNovelSettings({
                        fontSize: Math.min(32, novelSettings.fontSize + 2)
                      })
                    }
                    className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-bold py-1 rounded-lg text-[11px] transition shadow-sm"
                  >
                    A+
                  </button>
                </div>
              </div>

              {/* Scroll Speed or Book Page Paragraphs Selector */}
              {isBookMode ? (
                <div>
                  <label className="block text-slate-700 dark:text-purple-300 font-bold text-[10px] sm:text-[11px] mb-1 truncate">
                    Sayfa Başı Paragraf ({paragraphsPerPage})
                  </label>
                  <div className="flex gap-1 bg-slate-100 dark:bg-purple-900/60 p-1 rounded-xl border border-purple-200 dark:border-purple-700/50">
                    {[5, 8, 12, 16].map(count => (
                      <button
                        key={count}
                        type="button"
                        onClick={() => updateNovelSettings({ paragraphsPerPage: count })}
                        className={`flex-1 py-1 rounded-lg font-bold text-[11px] transition ${
                          paragraphsPerPage === count
                            ? 'bg-purple-600 text-white shadow-sm'
                            : 'bg-slate-200 dark:bg-purple-800/50 text-slate-800 dark:text-purple-200 hover:bg-purple-100 dark:hover:bg-purple-700'
                        }`}
                      >
                        {count}p
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-slate-700 dark:text-purple-300 font-bold text-[10px] sm:text-[11px] mb-1 truncate">
                    Kaydırma Hızı ({novelSettings.scrollSpeed}x)
                  </label>
                  <div className="flex gap-1 bg-slate-100 dark:bg-purple-900/60 p-1 rounded-xl border border-purple-200 dark:border-purple-700/50">
                    {[1, 2, 3].map(speed => (
                      <button
                        key={speed}
                        type="button"
                        onClick={() => updateNovelSettings({ scrollSpeed: speed })}
                        className={`flex-1 py-1 rounded-lg font-bold text-[11px] transition ${
                          novelSettings.scrollSpeed === speed
                            ? 'bg-purple-600 text-white shadow-sm'
                            : 'bg-slate-200 dark:bg-purple-800/50 text-slate-800 dark:text-purple-200 hover:bg-purple-100 dark:hover:bg-purple-700'
                        }`}
                      >
                        {speed}x
                      </button>
                    ))}
                  </div>
                </div>
              )}

            </div>

            {/* Action Buttons Row */}
            <div className="grid grid-cols-3 gap-1.5 pt-2 border-t border-purple-200 dark:border-purple-800">
              <button
                type="button"
                onClick={() => setIsAutoScrolling(!isAutoScrolling)}
                className={`py-1.5 px-2 rounded-xl font-bold text-[11px] flex items-center justify-center gap-1 shadow transition ${
                  isAutoScrolling ? 'bg-amber-600 text-black' : 'bg-purple-600 hover:bg-purple-700 text-white'
                }`}
              >
                {isAutoScrolling ? <Pause size={13} /> : <Play size={13} />}
                <span className="truncate">{isAutoScrolling ? 'Durdur' : 'Oto Kaydır'}</span>
              </button>

              <button
                type="button"
                onClick={() => updateNovelSettings({ isBold: !novelSettings.isBold })}
                className={`py-1.5 px-2 rounded-xl font-bold text-[11px] flex items-center justify-center gap-1 border transition ${
                  novelSettings.isBold
                    ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                    : 'bg-slate-100 dark:bg-purple-900/60 border-purple-200 dark:border-purple-700 text-slate-800 dark:text-white hover:bg-purple-50 dark:hover:bg-purple-800'
                }`}
              >
                <Type size={13} />
                <span className="truncate">{novelSettings.isBold ? 'Kalın ✓' : 'Kalın Yazı'}</span>
              </button>

              <button
                type="button"
                onClick={toggleFullscreen}
                className="py-1.5 px-2 rounded-xl font-bold text-[11px] bg-slate-100 dark:bg-purple-900/60 border border-purple-200 dark:border-purple-700 text-slate-800 dark:text-white hover:bg-purple-50 dark:hover:bg-purple-800 flex items-center justify-center gap-1 transition"
              >
                <Maximize size={13} />
                <span className="truncate">Tam Ekran</span>
              </button>
            </div>

            {/* Paragraph Comments Visibility Toggle inside Settings */}
            <div className="pt-2 border-t border-purple-200 dark:border-purple-800 flex items-center justify-between gap-2">
              <div className="min-w-0">
                <span className="text-[11px] font-bold text-slate-800 dark:text-purple-100 flex items-center gap-1.5">
                  <MessageCircle size={13} className="text-purple-500 dark:text-amber-300 shrink-0" />
                  <span>Satır İçi (Paragraf) Yorum Balonları</span>
                </span>
                <p className="text-[10px] text-slate-500 dark:text-purple-300/70 truncate">
                  Her paragrafın yanındaki yorum sayısını ve baloncuğunu göster veya gizle.
                </p>
              </div>
              <button
                type="button"
                onClick={toggleParagraphCommentsVisibility}
                className={`px-3 py-1.5 rounded-xl font-bold text-[11px] flex items-center gap-1 shrink-0 transition cursor-pointer ${
                  showParagraphComments
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-slate-200 dark:bg-gray-800 text-slate-700 dark:text-gray-300'
                }`}
              >
                {showParagraphComments ? <Eye size={12} /> : <EyeOff size={12} />}
                <span>{showParagraphComments ? 'Gösteriliyor' : 'Gizli'}</span>
              </button>
            </div>

          </div>
        </>
      )}

      {/* Floating Stop Auto Scroll button */}
      {isAutoScrolling && (
        <button
          onClick={() => setIsAutoScrolling(false)}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-red-600 hover:bg-red-500 text-white font-extrabold px-6 py-2.5 rounded-full shadow-2xl border-2 border-white/20 flex items-center gap-2 text-sm animate-pulse"
        >
          <Pause size={18} />
          Kaydırmayı Durdur
        </button>
      )}

  {/* Novel Reading Container */}
      <div
        ref={novelContentRef}
        onTouchStart={handleBookTouchStart}
        onTouchEnd={handleBookTouchEnd}
        className={`mx-auto px-4 py-8 ${getWidthClass()}`}
      >
        
        {/* Title Header */}
        <div className="text-center mb-8 border-b border-purple-200 dark:border-purple-500/20 pb-6">
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="bg-purple-100 dark:bg-purple-950/80 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-700/50 px-2.5 py-0.5 rounded-lg font-bold text-[11px]">
              {series.type}
            </span>
            {formatChapterDate(currentChapter) && (
              <span className="text-xs opacity-75 flex items-center gap-1">
                <Calendar size={12} className="text-purple-600 dark:text-purple-400" />
                {formatChapterDate(currentChapter)}
              </span>
            )}
          </div>

          <button
            onClick={() => setView({ type: 'series-detail', seriesId: series.id })}
            className="text-2xl sm:text-3xl font-extrabold mb-2 hover:text-purple-600 dark:hover:text-purple-400 transition"
          >
            {series.title}
          </button>

          <div className="flex items-center justify-center gap-2 flex-wrap">
            <h2 className="text-lg font-bold text-purple-700 dark:text-purple-400">
              {currentChapter.title}
            </h2>
            {currentChapter.specialTag && (
              <ChapterSpecialBadge tag={currentChapter.specialTag} size="sm" />
            )}
          </div>

          <div className="mt-3 flex items-center justify-center gap-4 text-xs opacity-80">
            <span className="flex items-center gap-1">
              <Clock size={14} className="text-purple-600 dark:text-purple-400" />
              Tahmini okuma: ~{estimatedMinutes} dk
            </span>
            <span className="font-mono">{wordCount.toLocaleString()} Kelime</span>
          </div>
          <div className="mt-3">
            <MangaAlertStack alerts={getChapterAlerts(currentChapter, series.notice, false, series.synopsis, series.title)} />
          </div>
        </div>

        {/* Chapter / Translator Profile Card (Blogger <div class="profile"> & Automatic Novel Credits) */}
        {chapterProfileCard && (!isBookMode || activeBookPage === 0) && (
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#180b2e] via-[#110722] to-[#210d3a] text-white p-4 sm:p-5 shadow-[0_14px_38px_rgba(88,28,135,0.38)] border border-purple-500/35 max-w-xl mx-auto my-6 flex items-center gap-4 sm:gap-5 text-left select-none">
            {/* Ambient Blurred Cover Glow */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              <img
                src={chapterProfileCard.imageUrl}
                alt=""
                aria-hidden="true"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover blur-2xl scale-125 opacity-25"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-[#120724]/90 via-[#150929]/85 to-purple-950/75" />
            </div>

            {/* Left Full Book-Cover Artwork (3:4 Portrait Ratio — Never Cropped) */}
            <div className="relative z-10 w-20 h-28 sm:w-24 sm:h-32 rounded-xl overflow-hidden flex-shrink-0 ring-2 ring-purple-400/45 shadow-[0_8px_24px_rgba(0,0,0,0.7)] bg-purple-950">
              <img
                src={chapterProfileCard.imageUrl}
                alt={chapterProfileCard.seriesTitle}
                referrerPolicy="no-referrer"
                onError={e => {
                  if (series.coverImage && (e.target as HTMLImageElement).src !== series.coverImage) {
                    (e.target as HTMLImageElement).src = series.coverImage;
                  }
                }}
                className="w-full h-full object-cover object-top"
              />
            </div>

            {/* Right Metadata Details */}
            <div className="relative z-10 flex-1 min-w-0 space-y-2">
              <div>
                <div className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-purple-300/90 mb-0.5">
                  <Sparkles size={11} className="text-amber-300" />
                  <span>BÖLÜM ÇEVİRİ KÜNYESİ</span>
                </div>
                <div className="text-sm sm:text-base font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-purple-100 to-fuchsia-200 leading-snug break-words">
                  {chapterProfileCard.seriesTitle}
                </div>
              </div>

              {chapterProfileCard.badges.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 pt-0.5">
                  {chapterProfileCard.badges.map((b, bIdx) => {
                    const isLang = /çeviri|dil/i.test(b.label);
                    return (
                      <div
                        key={bIdx}
                        className="inline-flex items-center gap-1.5 bg-purple-950/80 border border-purple-400/30 px-3 py-1.5 rounded-xl shadow-inner backdrop-blur-xs"
                      >
                        {isLang ? (
                          <Globe size={12} className="text-fuchsia-300 shrink-0" />
                        ) : (
                          <Feather size={12} className="text-amber-300 shrink-0" />
                        )}
                        <span className="text-[11px] font-bold text-purple-300/90">
                          {b.label}:
                        </span>
                        <span className="text-xs sm:text-[13px] font-extrabold text-amber-200">
                          {b.value}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Optional Chapter Images inside Novel */}
        {remainingChapterImages.length > 0 && (
          <div className="flex flex-col items-center space-y-4 my-6">
            {remainingChapterImages.map((imgUrl, idx) => (
              isIframeUrl(imgUrl) ? (
                <iframe
                  key={idx}
                  src={imgUrl}
                  title={`Görsel Embed ${idx + 1}`}
                  className="w-full max-w-2xl h-[500px] rounded-xl shadow-lg border border-purple-500/20"
                  allowFullScreen
                />
              ) : (
                <img
                  key={idx}
                  src={imgUrl}
                  alt={`Görsel ${idx + 1}`}
                  referrerPolicy="no-referrer"
                  loading="lazy"
                  className="wt-img w-full max-w-2xl rounded-xl shadow-lg border border-purple-500/20"
                />
              )
            ))}
          </div>
        )}

        {/* Book Mode Header Bar */}
        {isBookMode && totalBookPages > 1 && (
          <div className="mb-6 p-3 bg-gradient-to-r from-purple-950/70 via-gray-900/90 to-purple-950/70 border border-purple-500/35 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 select-none shadow-lg">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-purple-600/30 border border-purple-400/40 flex items-center justify-center text-purple-200 shrink-0">
                <BookOpen size={16} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-white">Kitap Sayfası:</span>
                  <span className="text-xs font-extrabold text-purple-300 font-mono bg-purple-900/60 px-2 py-0.5 rounded-lg border border-purple-500/30">
                    {activeBookPage + 1} / {totalBookPages}
                  </span>
                  <span className="text-[11px] text-gray-400 font-medium">
                    (%{Math.round(((activeBookPage + 1) / totalBookPages) * 100)})
                  </span>
                </div>
                <div className="w-36 sm:w-48 h-1.5 bg-gray-800 rounded-full overflow-hidden mt-1.5 border border-purple-500/20">
                  <div
                    className="h-full bg-gradient-to-r from-purple-500 to-indigo-400 transition-all duration-300"
                    style={{ width: `${Math.round(((activeBookPage + 1) / totalBookPages) * 100)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Quick Page Jump Selector */}
            <div className="flex items-center gap-2 text-xs">
              <span className="text-purple-300 text-[11px] font-bold">Sayfaya Git:</span>
              <select
                value={activeBookPage}
                onChange={e => goToPage(Number(e.target.value))}
                className="bg-purple-900/90 border border-purple-400/40 text-white rounded-xl px-2.5 py-1 text-xs font-extrabold focus:outline-none focus:border-purple-300 cursor-pointer shadow-sm"
              >
                {Array.from({ length: totalBookPages }, (_, i) => (
                  <option key={i} value={i}>
                    Sayfa {i + 1} / {totalBookPages}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Text Content Area with Webnovel-Style Inline Paragraph Comments */}
        <div
          className="prose max-w-none space-y-5 leading-relaxed transition-all"
          style={{
            fontFamily: novelSettings.fontFamily,
            fontSize: `${novelSettings.fontSize}px`,
            lineHeight: novelSettings.lineHeight,
            textAlign: novelSettings.textAlign,
            padding: novelSettings.padding,
            fontWeight: novelSettings.isBold ? 'bold' : 'normal'
          }}
        >
          {parsedParagraphs.length > 0 ? (
            displayedParagraphs.map((para, idx) => {
              if (para.isMediaOnly && para.html) {
                return (
                  <div
                    key={`${para.key}-${idx}`}
                    className="my-4"
                    dangerouslySetInnerHTML={{ __html: para.html }}
                  />
                );
              }

              const commentCount = paragraphCommentCounts[para.key] || 0;
              const isSelected = activeParagraph?.key === para.key;
              const isHighlighted = highlightedParaKey === para.key;

              return (
                <div
                  key={`${para.key}-${idx}`}
                  data-para-key={para.key}
                  onClick={() => {
                    if (showParagraphComments && activeParagraph) {
                      setActiveParagraph({ key: para.key, text: para.text, index: idx + 1 });
                    }
                  }}
                  className={`group relative rounded-xl transition-all duration-300 ${
                    isSelected || isHighlighted
                      ? 'bg-indigo-500/15 dark:bg-purple-500/20 ring-2 ring-amber-400/70 dark:ring-purple-400/70 px-3 py-2 -mx-3 shadow-md'
                      : 'hover:bg-black/[0.03] dark:hover:bg-white/[0.02] px-1 -mx-1'
                  }`}
                >
                  <p className="inline leading-relaxed">
                    {para.html ? (
                      <span dangerouslySetInnerHTML={{ __html: para.html }} />
                    ) : (
                      para.text
                    )}
                  </p>

                  {showParagraphComments && (
                    <button
                      type="button"
                      onClick={e => {
                        e.stopPropagation();
                        setActiveParagraph(prev =>
                          prev?.key === para.key
                            ? null
                            : { key: para.key, text: para.text, index: idx + 1 }
                        );
                      }}
                      className={`inline-flex items-center gap-1 ml-2 px-2 py-0.5 rounded-full text-[11px] font-extrabold align-middle select-none transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-purple-600 text-white shadow-md scale-105 ring-2 ring-purple-300/60'
                          : commentCount > 0
                          ? 'bg-slate-500/20 dark:bg-purple-500/25 hover:bg-purple-600 hover:text-white text-slate-700 dark:text-purple-200 border border-slate-400/30 dark:border-purple-400/30'
                          : 'bg-slate-500/10 dark:bg-white/10 hover:bg-purple-600 hover:text-white text-slate-500 dark:text-gray-400 opacity-35 sm:opacity-0 group-hover:opacity-100 focus:opacity-100'
                      }`}
                      title={
                        commentCount > 0
                          ? `Bu paragraftaki ${commentCount} yorumu gör / yorum yaz`
                          : 'Bu paragrafa ilk yorumu yaz'
                      }
                    >
                      <MessageCircle
                        size={11}
                        className={commentCount > 0 || isSelected ? 'fill-current' : ''}
                      />
                      <span>{commentCount > 0 ? commentCount : '+'}</span>
                    </button>
                  )}
                </div>
              );
            })
          ) : isHydratingContent ? (
            <div className="text-center py-12 space-y-3">
              <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-sm font-semibold opacity-75">
                Bölüm metni yükleniyor...
              </p>
            </div>
          ) : (
            <p className="text-center italic opacity-60">
              Bu bölümde henüz metin içerik bulunmuyor.
            </p>
          )}
        </div>

        {/* Book Mode Turn Page Controls */}
        {isBookMode && (
          <div className="my-8 p-3.5 sm:p-5 bg-gradient-to-r from-purple-950/80 via-gray-900/95 to-purple-950/80 border border-purple-500/40 rounded-3xl shadow-2xl space-y-3.5 select-none">
            <div className="flex items-center justify-between gap-2.5">
              {/* Previous Page Button */}
              <button
                type="button"
                disabled={activeBookPage === 0 && !prevChapter}
                onClick={goToPrevPage}
                className={`flex-1 py-3.5 px-3 rounded-2xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition-all active:scale-95 shadow-md ${
                  activeBookPage > 0
                    ? 'bg-purple-900/80 hover:bg-purple-800 text-white border border-purple-400/40 cursor-pointer'
                    : prevChapter
                    ? 'bg-purple-950/80 hover:bg-purple-900 text-purple-200 border border-purple-500/30 cursor-pointer'
                    : 'bg-gray-800/40 text-gray-500 border border-gray-700/30 cursor-not-allowed opacity-40'
                }`}
              >
                <ChevronLeft size={19} className="shrink-0" />
                <span>{activeBookPage > 0 ? 'Önceki Sayfa' : 'Önceki Bölüm'}</span>
              </button>

              {/* Page Number Indicator */}
              <div className="flex flex-col items-center justify-center px-3 sm:px-5 shrink-0 bg-gray-950/60 py-2 rounded-2xl border border-purple-500/20">
                <span className="text-xs sm:text-base font-black text-purple-200 font-mono tracking-wider">
                  {activeBookPage + 1} <span className="text-purple-400 font-normal">/</span> {totalBookPages}
                </span>
                <span className="text-[10px] text-purple-300/70 font-semibold mt-0.5">
                  %{Math.round(((activeBookPage + 1) / totalBookPages) * 100)} Okundu
                </span>
              </div>

              {/* Next Page Button */}
              <button
                type="button"
                disabled={activeBookPage >= totalBookPages - 1 && !nextChapter}
                onClick={goToNextPage}
                className={`flex-1 py-3.5 px-3 rounded-2xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg ${
                  activeBookPage < totalBookPages - 1
                    ? 'bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:from-purple-500 hover:to-indigo-500 text-white border border-purple-300/50 cursor-pointer ring-2 ring-purple-400/20'
                    : nextChapter
                    ? 'bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:from-emerald-500 hover:to-teal-500 text-white border border-emerald-300/50 cursor-pointer shadow-emerald-900/50 animate-pulse'
                    : 'bg-gray-800/40 text-gray-500 border border-gray-700/30 cursor-not-allowed opacity-40'
                }`}
              >
                <span>
                  {activeBookPage < totalBookPages - 1
                    ? 'Sonraki Sayfa'
                    : nextChapter
                    ? 'Sonraki Bölüme Geç'
                    : 'Bölüm Sonu'}
                </span>
                <ChevronRight size={19} className="shrink-0" />
              </button>
            </div>

            {/* Practical Hints */}
            <div className="flex items-center justify-center gap-3 text-[11px] text-purple-300/80 pt-1 border-t border-purple-500/20 text-center font-medium">
              <span className="hidden sm:inline">💡 Klavyedeki yön tuşları (← / →) ile sayfaları çevirebilirsiniz.</span>
              <span className="sm:hidden">💡 Ekranı sağa/sola kaydırarak (swipe) sayfaları çevirebilirsiniz.</span>
            </div>
          </div>
        )}

        {/* Reader Ad (If enabled in Admin) */}
        {adSettings?.readerAdEnabled && (
          <AdBannerBlock
            placementName="reader-novel"
            enabled={adSettings.readerAdEnabled}
            code={adSettings.readerAdCode}
            className="my-6"
          />
        )}

        {/* Bottom Navigation */}
        <div className="bg-white/5 dark:bg-gray-900/90 border border-purple-500/30 p-2.5 sm:p-3.5 rounded-2xl grid grid-cols-3 items-center gap-2 sm:gap-3 mt-10 shadow-md">
          {/* Left: Previous Chapter */}
          {prevChapter ? (
            <button
              type="button"
              onClick={() =>
                setView({ type: 'reader', seriesId: series.id, chapterId: prevChapter.id })
              }
              className="h-11 sm:h-12 w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold px-2.5 sm:px-4 rounded-xl text-xs sm:text-sm flex items-center justify-center gap-1 sm:gap-1.5 shadow-lg transition cursor-pointer whitespace-nowrap"
            >
              <ChevronLeft size={17} className="shrink-0" />
              <span className="sm:hidden">Önceki</span>
              <span className="hidden sm:inline">Önceki Bölüm</span>
            </button>
          ) : (
            <div className="h-11 sm:h-12 w-full text-[11px] sm:text-xs opacity-60 font-medium px-2 bg-purple-950/20 rounded-xl border border-purple-500/20 flex items-center justify-center whitespace-nowrap">
              <span className="sm:hidden">İlk Bölüm</span>
              <span className="hidden sm:inline">İlk Bölümdesiniz</span>
            </div>
          )}

          {/* Center: Chapter List Drawer Trigger */}
          <button
            type="button"
            onClick={() => setIsDropdownOpen(true)}
            className="h-11 sm:h-12 w-full bg-gray-900 hover:bg-purple-950/80 border border-purple-500/40 text-white font-bold px-2 sm:px-4 rounded-xl text-xs sm:text-sm flex items-center justify-center gap-1.5 sm:gap-2 shadow-lg transition cursor-pointer whitespace-nowrap"
            title="Bölüm Listesini Aç"
          >
            <Layers size={15} className="text-purple-400 shrink-0" />
            <span className="sm:hidden">Bölümler</span>
            <span className="hidden sm:inline">Bölüm Listesi</span>
            <span className="text-[10px] bg-purple-500/25 text-purple-200 px-1.5 py-0.5 rounded-md font-mono font-bold shrink-0">
              {chapterIndex + 1}/{sortedChapters.length}
            </span>
          </button>

          {/* Right: Next Chapter */}
          {nextChapter ? (
            <button
              type="button"
              onClick={handleGoToNextChapter}
              className="h-11 sm:h-12 w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold px-2.5 sm:px-4 rounded-xl text-xs sm:text-sm flex items-center justify-center gap-1 sm:gap-1.5 shadow-lg transition cursor-pointer whitespace-nowrap"
            >
              <span className="sm:hidden">Sonraki</span>
              <span className="hidden sm:inline">Sonraki Bölüm</span>
              <ChevronRight size={17} className="shrink-0" />
            </button>
          ) : (
            <div className="h-11 sm:h-12 w-full text-[11px] sm:text-xs opacity-60 font-medium px-2 bg-purple-950/20 rounded-xl border border-purple-500/20 flex items-center justify-center whitespace-nowrap">
              <span className="sm:hidden">Son Bölüm</span>
              <span className="hidden sm:inline">Son Bölümdesiniz</span>
            </div>
          )}
        </div>

        {/* Comments Section */}
        <div className="mt-12">
          <CommentsSection
            seriesId={series.id}
            chapterId={currentChapter.id}
            paragraphLookup={paragraphLookup}
            onJumpToParagraph={handleJumpToParagraph}
          />
        </div>

      </div>

      {/* Large Screen Floating Book Flip Controls */}
      {isBookMode && (
        <>
          <button
            type="button"
            onClick={goToPrevPage}
            disabled={activeBookPage === 0 && !prevChapter}
            className={`fixed left-3 top-1/2 -translate-y-1/2 z-40 hidden xl:flex w-12 h-24 rounded-2xl bg-gray-950/80 hover:bg-purple-900/90 border border-purple-500/40 hover:border-purple-300 text-purple-200 hover:text-white items-center justify-center backdrop-blur-md transition-all duration-200 shadow-2xl group ${
              activeBookPage === 0 && !prevChapter ? 'opacity-20 pointer-events-none' : 'cursor-pointer hover:scale-105'
            }`}
            title={activeBookPage > 0 ? 'Önceki Sayfa (Sol Ok)' : 'Önceki Bölüm'}
          >
            <ChevronLeft size={24} className="group-hover:-translate-x-1 transition-transform" />
          </button>
          <button
            type="button"
            onClick={goToNextPage}
            disabled={activeBookPage >= totalBookPages - 1 && !nextChapter}
            className={`fixed right-3 top-1/2 -translate-y-1/2 z-40 hidden xl:flex w-12 h-24 rounded-2xl bg-gray-950/80 hover:bg-purple-900/90 border border-purple-500/40 hover:border-purple-300 text-purple-200 hover:text-white items-center justify-center backdrop-blur-md transition-all duration-200 shadow-2xl group ${
              activeBookPage >= totalBookPages - 1 && !nextChapter ? 'opacity-20 pointer-events-none' : 'cursor-pointer hover:scale-105'
            }`}
            title={activeBookPage < totalBookPages - 1 ? 'Sonraki Sayfa (Sağ Ok)' : 'Sonraki Bölüm'}
          >
            <ChevronRight size={24} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </>
      )}

      {/* WEBNOVEL-STYLE PARAGRAPH COMMENTS DRAWER (Desktop Right Sidebar / Mobile Bottom Sheet) */}
      {activeParagraph && (
        <>
          {/* Subtle Backdrop on Mobile */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs z-[65] md:bg-black/25"
            onClick={() => setActiveParagraph(null)}
          />

          <aside
            className="fixed z-[70] inset-x-0 bottom-0 max-h-[85dvh] rounded-t-3xl md:inset-y-0 md:right-0 md:left-auto md:w-[430px] lg:w-[470px] md:max-h-none md:rounded-none bg-gray-950/98 border-t md:border-t-0 md:border-l border-purple-500/40 shadow-2xl flex flex-col text-white animate-fadeIn"
            onClick={e => e.stopPropagation()}
          >
            {/* Mobile Drag Handle */}
            <div className="md:hidden w-12 h-1.5 bg-gray-700 rounded-full mx-auto mt-2.5 mb-1 shrink-0" />

            {/* Drawer Header */}
            <div className="px-4 py-3.5 border-b border-gray-800/90 flex items-center justify-between gap-3 bg-gray-900/70 shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-purple-600/20 border border-purple-500/40 flex items-center justify-center text-purple-300 shrink-0">
                  <MessageCircle size={16} />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm sm:text-base font-black text-white truncate">
                      Paragraf Yorumları
                    </h3>
                    <span className="text-xs font-extrabold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-200 border border-purple-500/30 font-mono">
                      {paragraphCommentCounts[activeParagraph.key] || 0}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-400 truncate">
                    {activeParagraph.index}. Paragraf • Seçili cümle hakkındaki tepkiler
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveParagraph(null)}
                className="p-2 rounded-xl bg-gray-800/80 hover:bg-gray-700 text-gray-300 hover:text-white transition cursor-pointer shrink-0"
                title="Kapat"
              >
                <X size={18} />
              </button>
            </div>

            {/* Quoted Paragraph Preview Box */}
            <div className="px-4 py-3 bg-purple-950/25 border-b border-purple-500/20 shrink-0">
              <div className="flex items-start gap-2 border-l-2 border-purple-400 pl-3 py-0.5">
                <Quote size={14} className="text-purple-400 shrink-0 mt-0.5 opacity-80" />
                <p className="text-xs text-purple-100/90 italic line-clamp-3 leading-relaxed">
                  {activeParagraph.text}
                </p>
              </div>
            </div>

            {/* Scrollable Paragraph Comments Body (Full Cosmetics, Emojis, Replies, Likes) */}
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
              <CommentsSection
                key={`${currentChapter.id}__p__${activeParagraph.key}`}
                seriesId={series.id}
                chapterId={`${currentChapter.id}__p__${activeParagraph.key}`}
                isParagraphMode={true}
              />
            </div>
          </aside>
        </>
      )}

    </div>
  );
};
