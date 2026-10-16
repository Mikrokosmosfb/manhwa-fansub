import { findSeriesByQuery, findChapterInSeries } from '../utils/seriesFinder';
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { isChapter18Plus } from '../types';
import { extractImageUrls, isIframeUrl } from '../utils/imageParser';
import {
  Settings,
  ChevronLeft,
  ChevronRight,
  List,
  AlertTriangle,
  ArrowLeft,
  Columns,
  Rows,
  Sparkles,
  Maximize,
  RotateCcw,
  Play,
  Pause,
  ZoomIn,
  ZoomOut,
  Sun,
  Scroll,
  BookOpen,
  MessageSquare,
  Megaphone,
  Lightbulb,
  Lock,
  User,
  Search,
  ArrowUpDown,
  Calendar,
  Layers,
  ChevronDown,
  CheckCircle2,
  MousePointerClick,
  Eye,
  EyeOff,
  MessageCircle,
  X
} from 'lucide-react';
import { CommentsSection } from './CommentsSection';

import { ChapterSpecialBadge } from './ChapterSpecialBadge';
import { AdBannerBlock } from './AdScriptRunner';
import { MangaAlertStack } from './MangaAlertBox';
import { sortChapters, formatChapterDate, getChapterAlerts } from '../utils/chapterUtils';
import { getOptimizedImageUrl } from '../utils/imageUtils';

interface ManhwaReaderProps {
  seriesId: string;
  chapterId: string;
}

interface ManhwaSettings {
  widthMode: 'dar' | 'standart' | 'genis' | 'tam';
  zoomPercent: number;
  bgTheme: 'uzay' | 'oled' | 'gri' | 'sepya';
  pageGap: number; // 0, 4, 12, 24 (px)
  brightness: number; // 55 to 100 (%)
  imageQuality: 'yuksek' | 'dengeli' | 'tasarruf';
  scrollSpeed: number; // 1, 2, 3, 4
  showProgressBar: boolean;
  tapToScroll: boolean;
}

const DEFAULT_MANHWA_SETTINGS: ManhwaSettings = {
  widthMode: 'standart',
  zoomPercent: 100,
  bgTheme: 'uzay',
  pageGap: 0,
  brightness: 100,
  imageQuality: 'yuksek',
  scrollSpeed: 2,
  showProgressBar: true,
  tapToScroll: false
};

export const ManhwaReader: React.FC<ManhwaReaderProps> = ({ seriesId, chapterId }) => {
  const {
    seriesList,
    setView,
    updateReadingProgress,
    markChapterCompleted,
    readingHistory,
    user,
    openAuthModal,
    loginWithGoogle,
    adSettings,
    comments,
    isLoadingSeries
  } = useApp();
  const series = seriesList.find(s => s.id === seriesId);

  const sortedChapters = useMemo(() => {
    return sortChapters(series?.chapters || [], 'asc');
  }, [series?.chapters]);

  const chapterIndex = sortedChapters.findIndex(c => c.id === chapterId);
  const currentChapter = sortedChapters[chapterIndex];

  // Reading Mode: 'webtoon' (Vertical scroll) or 'manga' (Single page turn)
  const [readerMode, setReaderMode] = useState<'webtoon' | 'manga'>(() => {
    return (localStorage.getItem('mk_manhwa_reader_mode') as 'webtoon' | 'manga') || 'webtoon';
  });

  // Manhwa-specific reading settings persisted in localStorage
  const [manhwaSettings, setManhwaSettings] = useState<ManhwaSettings>(() => {
    try {
      const saved = localStorage.getItem('mk_manhwa_settings');
      if (saved) {
        return { ...DEFAULT_MANHWA_SETTINGS, ...JSON.parse(saved) };
      }
    } catch {}
    return DEFAULT_MANHWA_SETTINGS;
  });

  const updateManhwaSettings = (partial: Partial<ManhwaSettings>) => {
    setManhwaSettings(prev => {
      const updated = { ...prev, ...partial };
      try {
        localStorage.setItem('mk_manhwa_settings', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const resetManhwaSettings = () => {
    setManhwaSettings(DEFAULT_MANHWA_SETTINGS);
    try {
      localStorage.setItem('mk_manhwa_settings', JSON.stringify(DEFAULT_MANHWA_SETTINGS));
    } catch {}
  };

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAutoScrolling, setIsAutoScrolling] = useState(false);
  const [isPrivacyBlurred, setIsPrivacyBlurred] = useState(false);
  const autoScrollRef = useRef<NodeJS.Timeout | null>(null);

  // Position-aware Manhwa Scene Comments State (Toggleable like Novel paragraph comments)
  const [showSceneComments, setShowSceneComments] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('mk_show_scene_comments');
      return saved ? saved !== 'false' : true;
    } catch {
      return true;
    }
  });
  const [activeScene, setActiveScene] = useState<{
    key: string;
    imgIdx: number;
    yPct: number;
  } | null>(null);
  const [highlightedScene, setHighlightedScene] = useState<{
    key: string;
    imgIdx: number;
    yPct: number;
  } | null>(null);

  const toggleSceneCommentsVisibility = () => {
    setShowSceneComments(prev => {
      const next = !prev;
      try {
        localStorage.setItem('mk_show_scene_comments', String(next));
      } catch {}
      if (!next) {
        setActiveScene(null);
      }
      return next;
    });
  };

  const togglePrivacyBlur = () => {
    setIsPrivacyBlurred(prev => {
      const next = !prev;
      if (next) {
        setIsAutoScrolling(false);
      }
      return next;
    });
  };

  // Current page index for Manga (single page) mode (0-indexed)
  const [currentPage, setCurrentPage] = useState(0);

  const [scrollProgress, setScrollProgress] = useState(0);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [dropdownSearch, setDropdownSearch] = useState('');
  const [dropdownOrder, setDropdownOrder] = useState<'asc' | 'desc'>('asc');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const currentChapterItemRef = useRef<HTMLButtonElement>(null);

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

  // Toggle reader mode
  const toggleReaderMode = (mode: 'webtoon' | 'manga') => {
    setReaderMode(mode);
    localStorage.setItem('mk_manhwa_reader_mode', mode);
  };

  const prevChapter = chapterIndex > 0 ? sortedChapters[chapterIndex - 1] : null;
  const nextChapter =
    chapterIndex >= 0 && chapterIndex < sortedChapters.length - 1
      ? sortedChapters[chapterIndex + 1]
      : null;

  // Dynamically extract clean image & iframe URLs from chapter.images OR chapter.content
  const chapterImageUrls = useMemo(() => {
    if (!currentChapter) return [];
    let urls = extractImageUrls(currentChapter.images);
    if (urls.length === 0 && currentChapter.content) {
      urls = extractImageUrls(currentChapter.content);
    }
    return urls;
  }, [currentChapter]);

  const totalPages = chapterImageUrls.length;

  // Reset active scene drawer when switching chapters
  useEffect(() => {
    setActiveScene(null);
    setHighlightedScene(null);
  }, [seriesId, chapterId]);

  // Map of sceneKey ("scene_<imgIdx>_<yPct>") -> comment count in this chapter
  const sceneCommentCounts = useMemo(() => {
    const map: Record<string, number> = {};
    if (!currentChapter) return map;
    const prefix = `${currentChapter.id}__p__`;
    for (const c of comments) {
      if (c.seriesId === seriesId && c.chapterId && c.chapterId.startsWith(prefix)) {
        const sKey = c.chapterId.slice(prefix.length);
        if (sKey.startsWith('scene_')) {
          map[sKey] = (map[sKey] || 0) + 1;
        }
      }
    }
    return map;
  }, [comments, seriesId, currentChapter?.id]);

  const totalSceneCommentsInChapter = useMemo(() => {
    return Object.values(sceneCommentCounts).reduce((sum, n) => sum + n, 0);
  }, [sceneCommentCounts]);

  // Group active scene pins per image index: imgIdx -> Array<{ key, yPct, count }>
  const scenePinsByImage = useMemo(() => {
    const byImg: Record<number, { key: string; yPct: number; count: number }[]> = {};
    for (const [sKey, count] of Object.entries(sceneCommentCounts)) {
      if (count <= 0) continue;
      const parts = sKey.split('_');
      const imgIdx = parseInt(parts[1] || '0', 10);
      const yPct = parseInt(parts[2] || '50', 10);
      if (!isNaN(imgIdx) && !isNaN(yPct)) {
        if (!byImg[imgIdx]) byImg[imgIdx] = [];
        byImg[imgIdx].push({ key: sKey, yPct, count });
      }
    }
    return byImg;
  }, [sceneCommentCounts]);

  // Open scene comment drawer for the exact slice currently visible in the center of the user's screen
  const handleCommentCurrentViewportScene = () => {
    if (readerMode === 'manga') {
      const key = `scene_${currentPage}_50`;
      setActiveScene({ key, imgIdx: currentPage, yPct: 50 });
      return;
    }

    const viewportFocusY = window.innerHeight * 0.45;
    const stripNodes = Array.from(document.querySelectorAll('[data-manhwa-img-idx]')) as HTMLElement[];
    if (stripNodes.length === 0) return;

    let bestNode = stripNodes[0];
    let minDistance = Infinity;

    for (const node of stripNodes) {
      const rect = node.getBoundingClientRect();
      if (rect.top <= viewportFocusY && rect.bottom >= viewportFocusY) {
        bestNode = node;
        minDistance = 0;
        break;
      }
      const dist = Math.min(Math.abs(rect.top - viewportFocusY), Math.abs(rect.bottom - viewportFocusY));
      if (dist < minDistance) {
        minDistance = dist;
        bestNode = node;
      }
    }

    const imgIdx = Math.max(0, parseInt(bestNode.getAttribute('data-manhwa-img-idx') || '0', 10) || 0);
    const rect = bestNode.getBoundingClientRect();
    const rawRatio = rect.height > 0 ? (viewportFocusY - rect.top) / rect.height : 0.5;
    const clampedPct = Math.min(95, Math.max(5, Math.round((rawRatio * 100) / 5) * 5));
    const key = `scene_${imgIdx}_${clampedPct}`;
    setActiveScene({ key, imgIdx, yPct: clampedPct });
  };

  // Smoothly scroll to the exact pixel height of a 16,000px strip when "Sahneye Git ↑" is clicked
  const handleJumpToScene = (sceneKey: string) => {
    if (!sceneKey.startsWith('scene_')) return;
    const parts = sceneKey.split('_');
    const imgIdx = Math.max(0, parseInt(parts[1] || '0', 10) || 0);
    const yPct = Math.min(95, Math.max(0, parseInt(parts[2] || '50', 10) || 0));

    setShowSceneComments(true);
    setHighlightedScene({ key: sceneKey, imgIdx, yPct });

    if (readerMode === 'manga') {
      setCurrentPage(imgIdx);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      const el = document.querySelector(`[data-manhwa-img-idx="${imgIdx}"]`) as HTMLElement | null;
      if (el) {
        const rect = el.getBoundingClientRect();
        const targetDocY = window.scrollY + rect.top + rect.height * (yPct / 100) - window.innerHeight * 0.35;
        window.scrollTo({ top: Math.max(0, targetDocY), behavior: 'smooth' });
      }
    }

    setTimeout(() => {
      setHighlightedScene(prev => (prev?.key === sceneKey ? null : prev));
    }, 5000);
  };

  // Auto-open and scroll to scene if navigated from Homepage Recent Comments
  useEffect(() => {
    if (chapterImageUrls.length === 0) return;
    try {
      const targetKey = sessionStorage.getItem('mk_open_para_key');
      if (!targetKey || !targetKey.startsWith('scene_')) return;
      sessionStorage.removeItem('mk_open_para_key');
      const parts = targetKey.split('_');
      const imgIdx = Math.max(0, parseInt(parts[1] || '0', 10) || 0);
      const yPct = Math.min(95, Math.max(0, parseInt(parts[2] || '50', 10) || 0));
      setShowSceneComments(true);
      setActiveScene({ key: targetKey, imgIdx, yPct });
      setTimeout(() => {
        handleJumpToScene(targetKey);
      }, 200);
    } catch {}
  }, [chapterImageUrls.length, seriesId, chapterId]);

  const handleGoToNextChapter = () => {
    if (nextChapter && series && currentChapter) {
      markChapterCompleted(series.id, currentChapter.id, currentChapter.number, currentChapter.title);
      setView({ type: 'reader', seriesId: series.id, chapterId: nextChapter.id });
    }
  };

  // Auto-scroll effect for Webtoon mode
  useEffect(() => {
    if (isAutoScrolling && readerMode === 'webtoon') {
      const scrollStep = manhwaSettings.scrollSpeed * 1.8;
      autoScrollRef.current = setInterval(() => {
        window.scrollBy({ top: scrollStep, behavior: 'smooth' });
      }, 30);
    } else {
      if (autoScrollRef.current) clearInterval(autoScrollRef.current);
    }

    return () => {
      if (autoScrollRef.current) clearInterval(autoScrollRef.current);
    };
  }, [isAutoScrolling, manhwaSettings.scrollSpeed, readerMode]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  // Keyboard navigation for Manga Mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      if (e.key === 'b' || e.key === 'B') {
        e.preventDefault();
        togglePrivacyBlur();
        return;
      }

      if (readerMode !== 'manga' || totalPages === 0) return;

      if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') {
        e.preventDefault();
        if (currentPage < totalPages - 1) {
          setCurrentPage(prev => prev + 1);
          window.scrollTo(0, 0);
        } else if (nextChapter) {
          // Go to next chapter (and mark current as completed)
          handleGoToNextChapter();
        }
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        if (currentPage > 0) {
          setCurrentPage(prev => prev - 1);
          window.scrollTo(0, 0);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [readerMode, currentPage, totalPages, nextChapter, series, currentChapter, setView]);

  // Update progress on scroll in Webtoon mode & mark as read when reaching near bottom
  useEffect(() => {
    if (readerMode === 'manga') return;

    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const winScroll = window.scrollY || document.documentElement.scrollTop;
          const height =
            document.documentElement.scrollHeight - document.documentElement.clientHeight;
          if (height > 0) {
            const scrolled = (winScroll / height) * 100;
            setScrollProgress(scrolled);
            // Only mark chapter 100% completed when user scrolls to bottom (>= 92%)
            if (scrolled >= 92 && series && currentChapter) {
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
  }, [readerMode, series, currentChapter]);

  // Mark as read in Manga Mode when reaching final page
  useEffect(() => {
    if (readerMode === 'manga' && totalPages > 0 && currentPage === totalPages - 1 && series && currentChapter) {
      markChapterCompleted(series.id, currentChapter.id, currentChapter.number, currentChapter.title);
    }
  }, [readerMode, currentPage, totalPages, series, currentChapter]);

  // Record last opened chapter on mount
  useEffect(() => {
    if (series && currentChapter) {
      updateReadingProgress(series.id, currentChapter.id, currentChapter.number, currentChapter.title);
      setCurrentPage(0);
      window.scrollTo(0, 0);
    }
  }, [seriesId, chapterId]);

    if (!series || !currentChapter) {
    if (!seriesList || seriesList.length === 0) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center text-white bg-gray-950 space-y-4">
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin shadow-lg shadow-purple-900/50" />
          <p className="text-sm font-bold text-purple-300 animate-pulse tracking-wider uppercase">
            Bölüm Yükleniyor...
          </p>
        </div>
      );
    }
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center text-white bg-gray-950">
        <h2 className="text-xl font-bold mb-4">Bölüm Bulunamadı</h2>
        <button
          onClick={() => setView({ type: 'home' })}
          className="bg-purple-600 px-6 py-2 rounded-full font-bold text-sm"
        >
          Ana Sayfa
        </button>
      </div>
    );
  }

  // Member Protection Gate
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center p-4 sm:p-6 animate-fade-in">
        <div className="max-w-md w-full bg-gradient-to-b from-purple-900/60 via-purple-950/80 to-gray-950 border border-purple-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl text-center relative overflow-hidden backdrop-blur-xl">
          <div className="absolute -top-16 -left-16 w-40 h-40 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-16 -right-16 w-40 h-40 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="w-16 h-16 rounded-2xl bg-purple-900/80 border border-purple-400/40 flex items-center justify-center mx-auto mb-5 shadow-lg text-amber-300">
            <Lock size={32} />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold mb-3">
            <Sparkles size={14} />
            <span>Üyelere Özel İçerik</span>
          </div>

          <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-purple-100 to-amber-200 mb-2">
            Bölümü Okumak İçin Üye Olun
          </h2>

          <p className="text-xs sm:text-sm text-purple-200/80 mb-6 leading-relaxed">
            <strong className="text-white font-semibold">{series.title}</strong> serisinin <strong className="text-amber-300 font-semibold">{currentChapter.title || `Bölüm ${currentChapter.number}`}</strong> içeriğini okuyabilmek için Mikrokosmos Fansub hesabınıza giriş yapmalı veya ücretsiz üye olmalısınız.
          </p>

          <div className="space-y-3 mb-6">
            <button
              onClick={() => openAuthModal('login')}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-500 hover:to-indigo-500 text-white font-black py-3 px-4 rounded-2xl shadow-xl shadow-purple-950/80 transition duration-200 transform hover:scale-[1.02]"
            >
              <User size={18} />
              <span>Giriş Yap / Ücretsiz Kayıt Ol</span>
            </button>

            <button
              onClick={loginWithGoogle}
              className="w-full flex items-center justify-center gap-2.5 bg-white hover:bg-gray-100 text-gray-900 font-bold py-3 px-4 rounded-2xl shadow-md transition duration-200"
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
            className="text-xs text-purple-300 hover:text-white underline underline-offset-4 transition"
          >
            ← Seri Sayfasına Geri Dön
          </button>
        </div>
      </div>
    );
  }
  const effectiveProgress =
    readerMode === 'manga' && totalPages > 0
      ? ((currentPage + 1) / totalPages) * 100
      : scrollProgress;

  const getBgStyle = () => {
    switch (manhwaSettings.bgTheme) {
      case 'oled':
        return '#000000';
      case 'gri':
        return '#18181b';
      case 'sepya':
        return '#1c1917';
      default:
        return '#030712';
    }
  };

  const getContainerMaxWidth = () => {
    switch (manhwaSettings.widthMode) {
      case 'dar':
        return '600px';
      case 'genis':
        return '1024px';
      case 'tam':
        return '100%';
      default:
        return '768px';
    }
  };

  const getImageOptimizationConfig = () => {
    switch (manhwaSettings.imageQuality) {
      case 'yuksek':
        return { width: 1600, quality: 92 };
      case 'tasarruf':
        return { width: 800, quality: 65 };
      default:
        return { width: 1200, quality: 82 };
    }
  };

  const handleWebtoonImageTap = () => {
    if (manhwaSettings.tapToScroll && readerMode === 'webtoon') {
      window.scrollBy({ top: window.innerHeight * 0.75, behavior: 'smooth' });
    }
  };

  return (
    <div
      className="min-h-screen text-gray-100 pb-20 transition-colors duration-300"
      style={{ backgroundColor: getBgStyle() }}
    >
      
      {/* Top Reading Progress Bar */}
      {manhwaSettings.showProgressBar && (
        <div
          className="fixed top-0 left-0 h-1.5 bg-gradient-to-r from-purple-500 via-indigo-500 to-teal-400 z-50 transition-all duration-150"
          style={{ width: `${effectiveProgress}%` }}
        />
      )}

      {/* Reader Navigation Header */}
      <div className="reader-toolbar bg-white/95 dark:bg-gray-900/95 border-b border-purple-200 dark:border-purple-500/20 sticky top-0 z-30 backdrop-blur-md px-2.5 sm:px-4 py-2 shadow-md dark:shadow-lg">
        <div className="max-w-3xl mx-auto flex items-center gap-1.5 sm:gap-2.5">
          
          {/* Back to Series */}
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
                <List size={14} className="text-purple-500 dark:text-purple-400 shrink-0" />
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

          {/* Reader Mode Selector Switcher (Webtoon vs Manga) - Mobilde yeri daraltmaması için gizlendi (Çark / Ayarlar içine taşındı), Masaüstünde görünür */}
          <div className="hidden md:flex h-9 sm:h-10 items-center bg-slate-100 dark:bg-gray-950 p-1 rounded-xl border border-purple-200 dark:border-purple-500/30 shrink-0">
            <button
              type="button"
              onClick={() => toggleReaderMode('webtoon')}
              className={`h-7 sm:h-8 flex items-center justify-center gap-1 px-2 sm:px-2.5 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                readerMode === 'webtoon'
                  ? 'bg-purple-600 text-white shadow'
                  : 'text-slate-600 dark:text-gray-400 hover:text-purple-900 dark:hover:text-white'
              }`}
              title="Webtoon Modu (Dikey Kaydırma)"
            >
              <Rows size={14} className="shrink-0" />
              <span className="hidden sm:inline">Webtoon</span>
            </button>
            <button
              type="button"
              onClick={() => toggleReaderMode('manga')}
              className={`h-7 sm:h-8 flex items-center justify-center gap-1 px-2 sm:px-2.5 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                readerMode === 'manga'
                  ? 'bg-purple-600 text-white shadow'
                  : 'text-slate-600 dark:text-gray-400 hover:text-purple-900 dark:hover:text-white'
              }`}
              title="Manga Modu (Slayt / Sayfa Çevirme)"
            >
              <Columns size={14} className="shrink-0" />
              <span className="hidden sm:inline">Manga</span>
            </button>
          </div>

          {/* Settings, Scene Comments Toggle, Privacy Blur (Desktop Only) & Prev / Next Header Buttons */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={toggleSceneCommentsVisibility}
              className={`h-9 px-2 sm:h-10 sm:px-2.5 rounded-xl border flex items-center justify-center gap-1 transition cursor-pointer ${
                showSceneComments
                  ? 'bg-purple-600/20 dark:bg-purple-900/70 border-purple-400/50 text-purple-800 dark:text-purple-100'
                  : 'bg-slate-100 dark:bg-gray-900/60 border-slate-300 dark:border-gray-800 text-slate-400 dark:text-gray-500'
              }`}
              title={
                showSceneComments
                  ? 'Sahne Yorum Balonları Açık (Gizlemek için tıkla)'
                  : 'Sahne Yorum Balonları Gizli (Açmak için tıkla)'
              }
            >
              <MessageCircle size={15} className={showSceneComments ? 'text-purple-600 dark:text-amber-300' : ''} />
              {totalSceneCommentsInChapter > 0 && (
                <span className="text-[10px] font-extrabold font-mono">
                  {totalSceneCommentsInChapter}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={togglePrivacyBlur}
              className={`hidden md:flex h-9 w-9 sm:h-10 sm:w-10 rounded-xl border items-center justify-center transition cursor-pointer ${
                isPrivacyBlurred
                  ? 'bg-rose-600 border-rose-400 text-white shadow-md shadow-rose-900/50 animate-pulse'
                  : 'bg-purple-50 dark:bg-purple-950/60 border-purple-200 dark:border-purple-500/30 text-purple-700 dark:text-purple-200 hover:text-purple-950 dark:hover:text-white'
              }`}
              title={
                isPrivacyBlurred
                  ? 'Bulanıklaştırmayı Kaldır (Kısayol: B)'
                  : 'Ekranı Anında Bulanıklaştır / Gizle (Kısayol: B)'
              }
            >
              {isPrivacyBlurred ? <Eye size={17} /> : <EyeOff size={17} />}
            </button>

            <button
              type="button"
              onClick={() => setIsSettingsOpen(!isSettingsOpen)}
              className={`h-9 w-9 sm:h-10 sm:w-10 rounded-xl border flex items-center justify-center transition cursor-pointer ${
                isSettingsOpen
                  ? 'bg-purple-600 border-purple-400 text-white shadow-md shadow-purple-900/50'
                  : 'bg-purple-50 dark:bg-purple-950/60 border-purple-200 dark:border-purple-500/30 text-purple-700 dark:text-purple-200 hover:text-purple-950 dark:hover:text-white'
              }`}
              title="Manhwa Okuma Ayarları"
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

      {/* Customizable Manhwa Reading Settings Panel (Compact & Mobile-First) */}
      {isSettingsOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50"
            onClick={() => setIsSettingsOpen(false)}
          />
          <div className="fixed left-2.5 right-2.5 top-14 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 sm:top-16 sm:w-[620px] z-50 max-h-[calc(100dvh-5.5rem)] overflow-y-auto custom-scrollbar bg-gray-900/98 border border-purple-500/40 rounded-2xl p-3 sm:p-4 shadow-2xl text-white space-y-2.5 sm:space-y-3.5 backdrop-blur-xl animate-in fade-in slide-in-from-top-2 duration-150">
            
            {/* Header with quick Reset & Close */}
            <div className="flex items-center justify-between border-b border-purple-500/20 pb-2 gap-2">
              <h3 className="font-extrabold text-[11px] sm:text-xs uppercase tracking-wider text-purple-300 flex items-center gap-1.5 truncate">
                <Settings size={14} className="text-purple-400 shrink-0" />
                <span className="truncate">Okuma Ayarları</span>
              </h3>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={resetManhwaSettings}
                  className="text-[11px] text-red-200 hover:text-white font-bold px-2 py-1 rounded-lg bg-red-950/60 hover:bg-red-900/80 border border-red-500/40 flex items-center gap-1 transition cursor-pointer"
                  title="Ayarları Varsayılana Sıfırla"
                >
                  <RotateCcw size={11} />
                  <span>Varsayılan</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsSettingsOpen(false)}
                  className="text-[11px] text-purple-200 hover:text-white font-bold px-2.5 py-1 rounded-lg bg-purple-950/70 hover:bg-purple-900 border border-purple-500/30 transition cursor-pointer"
                >
                  Kapat ✕
                </button>
              </div>
            </div>

            {/* Row 1: Reading Mode & Background Theme */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
              {/* Reading Mode */}
              <div className="bg-purple-950/30 p-2 sm:p-2.5 rounded-xl border border-purple-500/20">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[10px] sm:text-[11px] uppercase font-bold text-purple-300 flex items-center gap-1">
                    <span>Okuma Modu</span>
                  </label>
                  <span className="text-[10px] text-purple-400 font-semibold">
                    {readerMode === 'webtoon' ? 'Dikey Akış' : 'Sayfa Çevirme'}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => toggleReaderMode('webtoon')}
                    className={`py-2 px-2 rounded-xl font-bold text-[11px] flex items-center justify-center gap-1.5 border transition cursor-pointer ${
                      readerMode === 'webtoon'
                        ? 'bg-purple-600 text-white border-purple-400 shadow-md ring-1 ring-purple-400/40'
                        : 'bg-gray-950 text-gray-300 border-purple-500/25 hover:border-purple-500/50 hover:bg-gray-900'
                    }`}
                  >
                    <Rows size={14} className="shrink-0" />
                    <span>Webtoon</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleReaderMode('manga')}
                    className={`py-2 px-2 rounded-xl font-bold text-[11px] flex items-center justify-center gap-1.5 border transition cursor-pointer ${
                      readerMode === 'manga'
                        ? 'bg-purple-600 text-white border-purple-400 shadow-md ring-1 ring-purple-400/40'
                        : 'bg-gray-950 text-gray-300 border-purple-500/25 hover:border-purple-500/50 hover:bg-gray-900'
                    }`}
                  >
                    <Columns size={14} className="shrink-0" />
                    <span>Manga</span>
                  </button>
                </div>
              </div>

              {/* Background Theme */}
              <div className="bg-purple-950/30 p-2 sm:p-2.5 rounded-xl border border-purple-500/20">
                <label className="text-[10px] sm:text-[11px] uppercase font-bold text-purple-300 block mb-1.5">
                  Arka Plan Rengi
                </label>
                <div className="grid grid-cols-4 gap-1">
                  {[
                    { id: 'uzay', label: 'Uzay', bg: 'bg-[#030712]' },
                    { id: 'oled', label: 'Siyah', bg: 'bg-black' },
                    { id: 'gri', label: 'Gri', bg: 'bg-zinc-900' },
                    { id: 'sepya', label: 'Sepya', bg: 'bg-stone-900' }
                  ].map(theme => (
                    <button
                      key={theme.id}
                      type="button"
                      onClick={() => updateManhwaSettings({ bgTheme: theme.id as ManhwaSettings['bgTheme'] })}
                      className={`py-2 px-1 rounded-xl font-bold text-[10px] sm:text-[11px] border transition cursor-pointer ${theme.bg} ${
                        manhwaSettings.bgTheme === theme.id
                          ? 'border-purple-400 text-white ring-1 ring-purple-500/50'
                          : 'border-gray-700 text-gray-400 hover:text-white'
                      }`}
                    >
                      {theme.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Row 2: Image Width, Page Gap, Image Quality (3 columns on mobile & desktop) */}
            <div className="grid grid-cols-3 gap-1.5 sm:gap-2.5 text-[11px] pt-2 border-t border-purple-500/20">
              {/* Image Width Preset */}
              <div>
                <label className="block text-purple-300 font-bold mb-1 truncate text-[10px] sm:text-[11px]">Genişlik</label>
                <select
                  value={manhwaSettings.widthMode}
                  onChange={e =>
                    updateManhwaSettings({
                      widthMode: e.target.value as ManhwaSettings['widthMode'],
                      zoomPercent: 100
                    })
                  }
                  className="w-full bg-gray-950 border border-purple-500/30 text-white rounded-xl px-1.5 py-1.5 text-[11px] font-semibold outline-none focus:border-purple-400"
                >
                  <option value="dar">Dar (600px)</option>
                  <option value="standart">Standart</option>
                  <option value="genis">Geniş</option>
                  <option value="tam">Tam (%100)</option>
                </select>
              </div>

              {/* Page Gap (Webtoon mode) */}
              <div>
                <label className="block text-purple-300 font-bold mb-1 truncate text-[10px] sm:text-[11px]">Sayfa Boşluğu</label>
                <select
                  value={manhwaSettings.pageGap}
                  onChange={e => updateManhwaSettings({ pageGap: Number(e.target.value) })}
                  className="w-full bg-gray-950 border border-purple-500/30 text-white rounded-xl px-1.5 py-1.5 text-[11px] font-semibold outline-none focus:border-purple-400"
                >
                  <option value={0}>0px (Tam)</option>
                  <option value={4}>4px (İnce)</option>
                  <option value={12}>12px (Orta)</option>
                  <option value={24}>24px (Geniş)</option>
                </select>
              </div>

              {/* Image Quality */}
              <div>
                <label className="block text-purple-300 font-bold mb-1 truncate text-[10px] sm:text-[11px]">Görsel Kalite</label>
                <select
                  value={manhwaSettings.imageQuality}
                  onChange={e =>
                    updateManhwaSettings({
                      imageQuality: e.target.value as ManhwaSettings['imageQuality']
                    })
                  }
                  className="w-full bg-gray-950 border border-purple-500/30 text-white rounded-xl px-1.5 py-1.5 text-[11px] font-semibold outline-none focus:border-purple-400"
                >
                  <option value="yuksek">HD Kalite</option>
                  <option value="dengeli">Dengeli</option>
                  <option value="tasarruf">Tasarruf</option>
                </select>
              </div>
            </div>

            {/* Row 3: Zoom Scale, Brightness & Auto-Scroll Speed (2 cols on mobile, 3 on sm) */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-2.5 pt-2 border-t border-purple-500/20">
              {/* Custom Zoom Scale */}
              <div>
                <label className="block text-purple-300 font-bold text-[10px] sm:text-[11px] mb-1 truncate">
                  Yakınlaştır (%{manhwaSettings.zoomPercent})
                </label>
                <div className="flex items-center gap-1 bg-gray-950 p-1 rounded-xl border border-purple-500/30">
                  <button
                    type="button"
                    onClick={() =>
                      updateManhwaSettings({
                        zoomPercent: Math.max(50, manhwaSettings.zoomPercent - 10)
                      })
                    }
                    className="flex-1 bg-purple-600 hover:bg-purple-500 text-white font-bold py-1 rounded-lg text-[11px] flex items-center justify-center gap-0.5 transition cursor-pointer"
                  >
                    <ZoomOut size={12} /> -
                  </button>
                  <span className="font-extrabold px-1 text-[11px] text-white min-w-[36px] text-center">
                    %{manhwaSettings.zoomPercent}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      updateManhwaSettings({
                        zoomPercent: Math.min(150, manhwaSettings.zoomPercent + 10)
                      })
                    }
                    className="flex-1 bg-purple-600 hover:bg-purple-500 text-white font-bold py-1 rounded-lg text-[11px] flex items-center justify-center gap-0.5 transition cursor-pointer"
                  >
                    <ZoomIn size={12} /> +
                  </button>
                </div>
              </div>

              {/* Brightness / Eye Comfort Filter */}
              <div>
                <label className="block text-purple-300 font-bold text-[10px] sm:text-[11px] mb-1 flex items-center gap-1 truncate">
                  <Sun size={11} className="text-amber-400 shrink-0" />
                  <span className="truncate">Parlaklık (%{manhwaSettings.brightness})</span>
                </label>
                <div className="flex gap-1 bg-gray-950 p-1 rounded-xl border border-purple-500/30">
                  {[100, 85, 70, 55].map(val => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => updateManhwaSettings({ brightness: val })}
                      className={`flex-1 py-1 rounded-lg font-bold text-[10px] transition cursor-pointer ${
                        manhwaSettings.brightness === val
                          ? 'bg-purple-600 text-white shadow-sm'
                          : 'bg-gray-900 text-gray-300 hover:bg-purple-900/50'
                      }`}
                    >
                      %{val}
                    </button>
                  ))}
                </div>
              </div>

              {/* Scroll Speed Selector */}
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-purple-300 font-bold text-[10px] sm:text-[11px] mb-1 truncate">
                  Otomatik Kaydırma Hızı ({manhwaSettings.scrollSpeed}x)
                </label>
                <div className="flex gap-1 bg-gray-950 p-1 rounded-xl border border-purple-500/30">
                  {[1, 2, 3, 4].map(speed => (
                    <button
                      key={speed}
                      type="button"
                      onClick={() => updateManhwaSettings({ scrollSpeed: speed })}
                      className={`flex-1 py-1 rounded-lg font-bold text-[11px] transition cursor-pointer ${
                        manhwaSettings.scrollSpeed === speed
                          ? 'bg-purple-600 text-white shadow-sm'
                          : 'bg-gray-900 text-gray-300 hover:bg-purple-900/50'
                      }`}
                    >
                      {speed}x
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Row 4: Action & Toggle Buttons Row (Compact 2-col grid on mobile, flex row on sm) */}
            <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-1.5 pt-2 border-t border-purple-500/20">
              {readerMode === 'webtoon' && (
                <button
                  type="button"
                  onClick={() => setIsAutoScrolling(!isAutoScrolling)}
                  className={`py-1.5 px-2.5 rounded-xl font-bold text-[11px] flex items-center justify-center gap-1 shadow transition cursor-pointer sm:flex-1 ${
                    isAutoScrolling
                      ? 'bg-amber-500 text-gray-950'
                      : 'bg-purple-600 hover:bg-purple-500 text-white'
                  }`}
                >
                  {isAutoScrolling ? <Pause size={13} /> : <Play size={13} />}
                  <span className="truncate">{isAutoScrolling ? 'Durdur' : 'Oto Kaydır'}</span>
                </button>
              )}

              {readerMode === 'webtoon' && (
                <button
                  type="button"
                  onClick={() => updateManhwaSettings({ tapToScroll: !manhwaSettings.tapToScroll })}
                  className={`py-1.5 px-2.5 rounded-xl font-bold text-[11px] flex items-center justify-center gap-1 border transition cursor-pointer ${
                    manhwaSettings.tapToScroll
                      ? 'bg-purple-600 text-white border-purple-400 shadow-sm'
                      : 'bg-gray-950 border-purple-500/30 text-gray-300 hover:text-white'
                  }`}
                  title="Webtoon modunda görsele tıkladığınızda aşağı doğru kaydırır"
                >
                  <MousePointerClick size={13} />
                  <span className="truncate">{manhwaSettings.tapToScroll ? 'Tıkla Kaydır ✓' : 'Tıkla Kaydır'}</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => updateManhwaSettings({ showProgressBar: !manhwaSettings.showProgressBar })}
                className={`py-1.5 px-2.5 rounded-xl font-bold text-[11px] flex items-center justify-center gap-1 border transition cursor-pointer ${
                  manhwaSettings.showProgressBar
                    ? 'bg-purple-600 text-white border-purple-400 shadow-sm'
                    : 'bg-gray-950 border-purple-500/30 text-gray-300 hover:text-white'
                }`}
              >
                <Eye size={13} />
                <span className="truncate">{manhwaSettings.showProgressBar ? 'İlerleme Çubuğu ✓' : 'İlerleme Çubuğu'}</span>
              </button>

              <button
                type="button"
                onClick={toggleFullscreen}
                className="py-1.5 px-2.5 rounded-xl font-bold text-[11px] bg-gray-950 border border-purple-500/30 text-gray-200 hover:text-white hover:border-purple-400 flex items-center justify-center gap-1 transition cursor-pointer"
              >
                <Maximize size={13} />
                <span className="truncate">Tam Ekran</span>
              </button>

              <button
                type="button"
                onClick={toggleSceneCommentsVisibility}
                className={`py-1.5 px-2.5 rounded-xl font-bold text-[11px] flex items-center justify-center gap-1 border transition cursor-pointer ${
                  showSceneComments
                    ? 'bg-purple-600 text-white border-purple-400 shadow-sm'
                    : 'bg-gray-950 border-purple-500/30 text-gray-300 hover:text-white'
                }`}
              >
                <MessageCircle size={13} />
                <span className="truncate">
                  {showSceneComments ? 'Sahne Yorumları ✓' : 'Sahne Yorumları Gizli'}
                </span>
              </button>

              <button
                type="button"
                onClick={togglePrivacyBlur}
                className={`py-1.5 px-2.5 rounded-xl font-bold text-[11px] flex items-center justify-center gap-1 border transition cursor-pointer ${
                  isPrivacyBlurred
                    ? 'bg-rose-600 text-white border-rose-400 shadow-sm'
                    : 'bg-gray-950 border-purple-500/30 text-gray-200 hover:text-white'
                }`}
              >
                {isPrivacyBlurred ? <Eye size={13} /> : <EyeOff size={13} />}
                <span className="truncate">{isPrivacyBlurred ? 'Bulanıklığı Aç' : 'Anında Bulanıklaştır'}</span>
              </button>
            </div>

          </div>
        </>
      )}

      {/* Sol Alt Köşe Floating Stack: Üstte Sahneye Yorum, Altta Bulanıklaştırma (Gizlilik) Butonu (Sağdaki Yukarı/Aşağı Butonlarıyla Tam Paralel) */}
      <div className="fixed bottom-20 md:bottom-8 left-3.5 sm:left-6 z-[60] flex flex-col gap-2 pointer-events-none">
        {/* Üstte: Sahneye Yorum Butonu */}
        {showSceneComments && !isPrivacyBlurred && chapterImageUrls.length > 0 && (
          <button
            type="button"
            onClick={handleCommentCurrentViewportScene}
            className="pointer-events-auto bg-purple-900/90 hover:bg-purple-600 text-amber-300 hover:text-white p-2.5 sm:p-3 rounded-2xl border border-purple-400/50 shadow-2xl backdrop-blur-md transition-all duration-300 transform hover:scale-110 active:scale-95 flex items-center justify-center cursor-pointer group"
            title="Ekranda Görünen Sahneye Yorum Bırak / Yorumları Gör"
            aria-label="Bu Sahneye Yorum Bırak"
          >
            <MessageCircle size={20} className="group-hover:rotate-12 transition-transform" />
            <span className="sr-only">Sahneye Yorum Bırak</span>
          </button>
        )}

        {/* Altta: Bulanıklaştırma (Gizlilik) Butonu */}
        <button
          type="button"
          onClick={togglePrivacyBlur}
          className={`pointer-events-auto p-2.5 sm:p-3 rounded-2xl flex items-center justify-center shadow-2xl border backdrop-blur-md transition-all duration-300 transform hover:scale-110 active:scale-95 cursor-pointer ${
            isPrivacyBlurred
              ? 'bg-rose-600 hover:bg-rose-500 text-white border-rose-300/60 ring-4 ring-rose-500/30'
              : 'bg-purple-950/90 hover:bg-purple-700 text-purple-200 hover:text-white border-purple-500/40'
          }`}
          title={
            isPrivacyBlurred
              ? 'Gizlilik Bulanıklaştırmasını Kaldır (B)'
              : 'Ekranı Anında Bulanıklaştır (B)'
          }
          aria-label="Bulanıklaştır"
        >
          {isPrivacyBlurred ? <Eye size={20} /> : <EyeOff size={20} />}
          <span className="sr-only">Bulanıklaştır</span>
        </button>
      </div>

      {/* Privacy Blur Overlay Banner when Active */}
      {isPrivacyBlurred && (
        <div
          onClick={togglePrivacyBlur}
          className="fixed inset-x-0 top-14 bottom-0 z-40 bg-gray-950/65 backdrop-blur-2xl flex flex-col items-center justify-center p-6 text-center cursor-pointer select-none animate-fade-in"
        >
          <div className="max-w-xs w-full bg-gray-900/95 border border-purple-500/40 rounded-3xl p-6 shadow-2xl space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-purple-950/90 border border-purple-500/40 flex items-center justify-center mx-auto text-purple-300 shadow-lg">
              <EyeOff size={28} />
            </div>
            <h3 className="text-base font-black text-white">Gizlilik Modu Aktif</h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              Bölüm görselleri gizlendi. Okumaya devam etmek için ekrana dokunun veya <strong className="text-purple-300">B</strong> tuşuna basın.
            </p>
            <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs shadow-lg transition">
              <Eye size={14} />
              <span>Bulanıklığı Kaldır</span>
            </span>
          </div>
        </div>
      )}

      {/* Floating Stop Auto Scroll button */}
      {isAutoScrolling && (
        <button
          onClick={() => setIsAutoScrolling(false)}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-red-600 hover:bg-red-500 text-white font-extrabold px-6 py-2.5 rounded-full shadow-2xl border-2 border-white/20 flex items-center gap-2 text-sm animate-pulse cursor-pointer"
        >
          <Pause size={18} />
          Kaydırmayı Durdur
        </button>
      )}

      {/* Main Chapter Content Container */}
      <div className="max-w-3xl mx-auto px-2 sm:px-4 pt-6 pb-3 space-y-4">
        
        {/* Title Header Card */}
        <div className="bg-white dark:bg-gray-900/90 border border-purple-200 dark:border-purple-500/25 p-4 sm:p-5 rounded-3xl shadow-md dark:shadow-xl">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs pb-3 border-b border-slate-100 dark:border-purple-500/15 mb-3">
            <div className="flex items-center gap-2">
              <span className="bg-purple-100 dark:bg-purple-950/80 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-700/50 px-2.5 py-0.5 rounded-lg font-bold text-[11px]">
                {series.type}
              </span>
              {formatChapterDate(currentChapter) && (
                <span className="text-slate-500 dark:text-gray-400 text-[11px] flex items-center gap-1">
                  <Calendar size={12} className="text-purple-600 dark:text-purple-400" />
                  {formatChapterDate(currentChapter)}
                </span>
              )}
            </div>
            
            <span className="bg-purple-50 dark:bg-purple-900/40 text-purple-700 dark:text-purple-200 border border-purple-200 dark:border-purple-600/40 px-2.5 py-1 rounded-xl text-[11px] font-bold flex items-center gap-1.5 shadow-sm">
              {readerMode === 'webtoon' ? (
                <>
                  <Scroll size={13} className="text-purple-600 dark:text-purple-300" /> Dikey Kaydırma (Webtoon)
                </>
              ) : (
                <>
                  <BookOpen size={13} className="text-purple-600 dark:text-purple-300" /> Sayfa Çevirme (Manga)
                </>
              )}
            </span>
          </div>

          <div className="text-center space-y-1.5 py-1">
            <button
              onClick={() => setView({ type: 'series-detail', seriesId: series.id })}
              className="text-base sm:text-xl font-black text-slate-900 dark:text-white hover:text-purple-600 dark:hover:text-purple-300 transition line-clamp-1 inline-block"
            >
              {series.title}
            </button>
            <div className="flex items-center justify-center gap-2 flex-wrap">
              <h1 className="text-sm sm:text-base font-extrabold text-purple-700 dark:text-purple-300">
                {currentChapter.title}
              </h1>
              {currentChapter.specialTag && (
                <ChapterSpecialBadge tag={currentChapter.specialTag} size="sm" />
              )}
            </div>
          </div>

          {/* Chapter / Blogger Alerts & Notices (m-warning, m-info, note) */}
          <MangaAlertStack alerts={getChapterAlerts(currentChapter, series.notice, true, series.synopsis, series.title)} />
        </div>

        {/* Damage/Broken Image Report Button Banner */}
        <div className="bg-rose-50 dark:bg-purple-950/80 border border-rose-200 dark:border-red-500/35 p-3 rounded-2xl text-center text-xs font-semibold text-slate-800 dark:text-white flex items-center justify-between gap-2 shadow-sm dark:shadow-lg backdrop-blur-sm">
          <span className="flex items-center gap-2 text-rose-800 dark:text-rose-200">
            <span className="p-1 bg-rose-100 dark:bg-red-900/60 rounded-lg text-rose-600 dark:text-red-400">
              <AlertTriangle size={15} />
            </span>
            <span>Hasarlı veya yüklenmeyen görsel mi var?</span>
          </span>
          <button
            onClick={() => {
              try {
                sessionStorage.setItem(
                  'mk_report_prefill',
                  JSON.stringify({
                    seriesId: series.id,
                    seriesTitle: series.title,
                    chapterId: currentChapter.id,
                    chapterTitle: currentChapter.title || `Bölüm ${currentChapter.number}`,
                    pageUrl: typeof window !== 'undefined' ? window.location.href : ''
                  })
                );
              } catch {}
              setView({ type: 'report' });
            }}
            className="bg-red-600 hover:bg-red-500 text-white font-extrabold px-3.5 py-1.5 rounded-xl transition text-[11px] uppercase tracking-wider shadow-md hover:shadow-red-900/50 flex-shrink-0 cursor-pointer"
          >
            Hemen Bildir
          </button>
        </div>

      </div>

      {/* Comic Images - Webtoon vs Manga Mode Rendering (Dynamic Width & Settings) */}
      <div
        className={`mx-auto px-0 sm:px-2 transition-all duration-200 ${
          isPrivacyBlurred ? 'blur-3xl brightness-[0.2] select-none pointer-events-none' : ''
        }`}
        style={{
          maxWidth: getContainerMaxWidth(),
          width: `${manhwaSettings.zoomPercent}%`,
          filter:
            !isPrivacyBlurred && manhwaSettings.brightness < 100
              ? `brightness(${manhwaSettings.brightness}%)`
              : undefined
        }}
      >
        {readerMode === 'webtoon' ? (
          /* Webtoon Mode: Continuous Vertical Scroll */
          <div
            onClick={handleWebtoonImageTap}
            className={`flex flex-col items-center py-2 ${manhwaSettings.tapToScroll ? 'cursor-pointer' : ''}`}
            style={{ gap: `${manhwaSettings.pageGap}px` }}
          >
            {chapterImageUrls.length > 0 ? (
              <div
                className="w-full flex flex-col items-center"
                style={{ gap: `${manhwaSettings.pageGap}px` }}
              >
                {chapterImageUrls.map((imgUrl, idx) => {
                  const stripPins = scenePinsByImage[idx] || [];
                  const isHighlightedStrip = highlightedScene?.imgIdx === idx;
                  return isIframeUrl(imgUrl) ? (
                    <iframe
                      key={idx}
                      src={imgUrl}
                      title={`${currentChapter.title} - Embed ${idx + 1}`}
                      className="w-full h-[600px] my-4 rounded-xl shadow-xl bg-gray-900 border border-gray-800"
                      allowFullScreen
                    />
                  ) : (
                    <div
                      key={idx}
                      data-manhwa-img-idx={idx}
                      className="relative w-full group/strip"
                    >
                      <img
                        src={getOptimizedImageUrl(imgUrl, getImageOptimizationConfig())}
                        alt={`${currentChapter.title} - Sayfa ${idx + 1}`}
                        className="wt-img w-full block border-none rounded-none shadow-none bg-gray-900 select-none"
                        loading={idx < 2 ? 'eager' : 'lazy'}
                        decoding="async"
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          const target = e.currentTarget;
                          if (target.src !== imgUrl) {
                            target.src = imgUrl;
                          }
                        }}
                        style={{ display: 'block', margin: 0, padding: 0 }}
                      />

                      {/* Highlight band when jumping to a specific scene slice on a 16,000px strip */}
                      {isHighlightedStrip && highlightedScene && (
                        <div
                          style={{ top: `${highlightedScene.yPct}%` }}
                          className="absolute inset-x-0 -translate-y-1/2 h-36 sm:h-48 border-y-2 border-amber-400 bg-amber-400/15 pointer-events-none z-20 animate-pulse flex items-start justify-end p-2"
                        >
                          <span className="bg-black/85 text-amber-300 border border-amber-400/60 text-[10px] font-black px-2.5 py-1 rounded-full shadow-lg">
                            📸 Seçilen Sahne (%{highlightedScene.yPct})
                          </span>
                        </div>
                      )}

                      {/* Existing Scene Comment Pins along the vertical height of the strip */}
                      {showSceneComments &&
                        stripPins.map(pin => {
                          const isSelectedPin = activeScene?.key === pin.key;
                          return (
                            <button
                              key={pin.key}
                              type="button"
                              style={{ top: `${pin.yPct}%` }}
                              onClick={e => {
                                e.stopPropagation();
                                setActiveScene(prev =>
                                  prev?.key === pin.key
                                    ? null
                                    : { key: pin.key, imgIdx: idx, yPct: pin.yPct }
                                );
                              }}
                              className={`absolute right-2 sm:right-3 -translate-y-1/2 z-20 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-extrabold shadow-xl transition-all cursor-pointer select-none ${
                                isSelectedPin
                                  ? 'bg-amber-500 text-black ring-2 ring-white scale-110'
                                  : 'bg-purple-950/90 hover:bg-purple-600 text-amber-300 hover:text-white border border-purple-400/60 hover:scale-105'
                              }`}
                              title={`Bu sahnedeki ${pin.count} yorumu gör / yorum yaz`}
                            >
                              <MessageCircle size={13} className="fill-current" />
                              <span>{pin.count}</span>
                            </button>
                          );
                        })}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-12 text-center text-slate-500 dark:text-gray-400 bg-white dark:bg-gray-900 rounded-2xl border border-purple-200 dark:border-purple-500/20 w-full shadow-sm">
                Bu bölümde henüz görsel içerik bulunmuyor veya dönüştürülüyor.
              </div>
            )}
          </div>
        ) : (
          /* Manga Mode: Single Page Slider with Page Controls */
          <div className="space-y-4 py-4 px-2 sm:px-0">
            {chapterImageUrls.length > 0 ? (
              <div className="flex flex-col items-center">
                
                {/* Page Navigation Toolbar */}
                <div className="w-full bg-white dark:bg-gray-900/90 border border-purple-200 dark:border-purple-500/30 p-2.5 rounded-2xl flex items-center justify-between gap-3 mb-3 shadow-md">
                  <button
                    disabled={currentPage === 0}
                    onClick={() => {
                      setCurrentPage(prev => Math.max(0, prev - 1));
                      window.scrollTo(0, 0);
                    }}
                    className="bg-purple-600 hover:bg-purple-700 dark:bg-purple-800 dark:hover:bg-purple-700 disabled:opacity-30 disabled:hover:bg-purple-600 text-white font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1 transition shadow-sm"
                  >
                    <ChevronLeft size={16} />
                    Önceki Sayfa
                  </button>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-700 dark:text-purple-200">
                      Sayfa <strong className="text-purple-700 dark:text-white text-sm">{currentPage + 1}</strong> / {totalPages}
                    </span>
                    <select
                      value={currentPage}
                      onChange={e => {
                        setCurrentPage(Number(e.target.value));
                        window.scrollTo(0, 0);
                      }}
                      className="bg-slate-100 dark:bg-gray-950 border border-purple-200 dark:border-purple-500/30 text-xs text-slate-900 dark:text-white rounded-lg p-1 font-bold focus:outline-none"
                    >
                      {chapterImageUrls.map((_, i) => (
                        <option key={i} value={i}>
                          Sayfa {i + 1}
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    onClick={() => {
                      if (currentPage < totalPages - 1) {
                        setCurrentPage(prev => prev + 1);
                        window.scrollTo(0, 0);
                      } else if (nextChapter) {
                        setView({ type: 'reader', seriesId: series.id, chapterId: nextChapter.id });
                      }
                    }}
                    className="bg-purple-600 hover:bg-purple-700 dark:bg-purple-800 dark:hover:bg-purple-700 text-white font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1 transition shadow-sm"
                  >
                    {currentPage === totalPages - 1 ? 'Sonraki Bölüm' : 'Sonraki Sayfa'}
                    <ChevronRight size={16} />
                  </button>
                </div>

                {/* Single Page Image display */}
                <div className="relative group w-full">
                  {isIframeUrl(chapterImageUrls[currentPage]) ? (
                    <iframe
                      src={chapterImageUrls[currentPage]}
                      title={`${currentChapter.title} - Sayfa ${currentPage + 1}`}
                      className="w-full h-[600px] rounded-2xl shadow-2xl bg-white dark:bg-gray-900 border border-purple-200 dark:border-purple-500/20"
                      allowFullScreen
                    />
                  ) : (
                    <img
                      src={getOptimizedImageUrl(chapterImageUrls[currentPage], getImageOptimizationConfig())}
                      alt={`${currentChapter.title} - Sayfa ${currentPage + 1}`}
                      loading="lazy"
                      decoding="async"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        const target = e.currentTarget;
                        const rawUrl = chapterImageUrls[currentPage];
                        if (rawUrl && target.src !== rawUrl) {
                          target.src = rawUrl;
                        }
                      }}
                      className="wt-img w-full rounded-2xl shadow-2xl object-contain bg-white dark:bg-gray-900 border border-purple-200 dark:border-purple-500/20"
                    />
                  )}

                  {/* Left Half Click Zone for Prev Page */}
                  <div
                    onClick={() => {
                      if (currentPage > 0) {
                        setCurrentPage(prev => prev - 1);
                        window.scrollTo(0, 0);
                      }
                    }}
                    className="absolute left-0 top-0 bottom-0 w-1/3 cursor-pointer opacity-0 group-hover:opacity-100 bg-gradient-to-r from-black/40 to-transparent transition flex items-center justify-start pl-4"
                    title="Önceki Sayfa"
                  >
                    <div className="bg-purple-900/80 text-white p-2 rounded-full shadow">
                      <ChevronLeft size={24} />
                    </div>
                  </div>

                  {/* Right Half Click Zone for Next Page */}
                  <div
                    onClick={() => {
                      if (currentPage < totalPages - 1) {
                        setCurrentPage(prev => prev + 1);
                        window.scrollTo(0, 0);
                      } else if (nextChapter) {
                        setView({ type: 'reader', seriesId: series.id, chapterId: nextChapter.id });
                      }
                    }}
                    className="absolute right-0 top-0 bottom-0 w-1/3 cursor-pointer opacity-0 group-hover:opacity-100 bg-gradient-to-l from-black/40 to-transparent transition flex items-center justify-end pr-4"
                    title="Sonraki Sayfa"
                  >
                    <div className="bg-purple-900/80 text-white p-2 rounded-full shadow">
                      <ChevronRight size={24} />
                    </div>
                  </div>
                </div>

                <p className="text-[11px] text-slate-500 dark:text-gray-500 mt-2 text-center flex items-center justify-center gap-1">
                  <Lightbulb size={13} className="text-amber-500 dark:text-amber-400 inline" /> İpucu: Sayfalar arasında geçiş yapmak için klavyedeki Sol / Sağ ok tuşlarını kullanabilirsiniz.
                </p>

              </div>
            ) : (
              <div className="p-12 text-center text-slate-500 dark:text-gray-400 bg-white dark:bg-gray-900 rounded-2xl border border-purple-200 dark:border-purple-500/20 w-full shadow-sm">
                Bu bölümde henüz görsel içerik bulunmuyor.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom Container for Ads, Navigation & Comments */}
      <div className="max-w-3xl mx-auto px-2 sm:px-4 space-y-4">
        {/* Reader Ad (If enabled in Admin) */}
        {adSettings?.readerAdEnabled && (
          <AdBannerBlock
            placementName="reader-manhwa"
            enabled={adSettings.readerAdEnabled}
            code={adSettings.readerAdCode}
            className="my-4"
          />
        )}

        {/* Bottom Chapter Navigation */}
        <div className="bg-white dark:bg-gray-900/90 border border-purple-200 dark:border-purple-500/30 p-2.5 sm:p-3.5 rounded-2xl grid grid-cols-3 items-center gap-2 sm:gap-3 my-6 shadow-md">
          {/* Left: Previous Chapter */}
          {prevChapter ? (
            <button
              type="button"
              onClick={() =>
                setView({ type: 'reader', seriesId: series.id, chapterId: prevChapter.id })
              }
              className="h-11 sm:h-12 w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold px-2.5 sm:px-4 rounded-xl text-xs sm:text-sm flex items-center justify-center gap-1 sm:gap-1.5 transition shadow-md cursor-pointer whitespace-nowrap"
            >
              <ChevronLeft size={17} className="shrink-0" />
              <span className="sm:hidden">Önceki</span>
              <span className="hidden sm:inline">Önceki Bölüm</span>
            </button>
          ) : (
            <div className="h-11 sm:h-12 w-full text-[11px] sm:text-xs text-slate-400 dark:text-gray-500 font-medium px-2 rounded-xl bg-slate-100 dark:bg-gray-950/60 border border-slate-200 dark:border-gray-800 flex items-center justify-center whitespace-nowrap">
              <span className="sm:hidden">İlk Bölüm</span>
              <span className="hidden sm:inline">İlk Bölümdesiniz</span>
            </div>
          )}

          {/* Center: Chapter List Drawer Trigger */}
          <button
            type="button"
            onClick={() => setIsDropdownOpen(true)}
            className="h-11 sm:h-12 w-full bg-slate-100 dark:bg-gray-950 hover:bg-purple-50 dark:hover:bg-purple-950/70 border border-purple-300 dark:border-purple-500/40 text-slate-900 dark:text-white font-bold px-2 sm:px-4 rounded-xl text-xs sm:text-sm flex items-center justify-center gap-1.5 sm:gap-2 transition shadow-sm cursor-pointer whitespace-nowrap"
            title="Bölüm Listesini Aç"
          >
            <List size={15} className="text-purple-500 dark:text-purple-400 shrink-0" />
            <span className="sm:hidden">Bölümler</span>
            <span className="hidden sm:inline">Bölüm Listesi</span>
            <span className="text-[10px] bg-purple-500/20 text-purple-700 dark:text-purple-300 px-1.5 py-0.5 rounded-md font-mono font-bold shrink-0">
              {chapterIndex + 1}/{sortedChapters.length}
            </span>
          </button>

          {/* Right: Next Chapter */}
          {nextChapter ? (
            <button
              type="button"
              onClick={handleGoToNextChapter}
              className="h-11 sm:h-12 w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold px-2.5 sm:px-4 rounded-xl text-xs sm:text-sm flex items-center justify-center gap-1 sm:gap-1.5 transition shadow-md cursor-pointer whitespace-nowrap"
            >
              <span className="sm:hidden">Sonraki</span>
              <span className="hidden sm:inline">Sonraki Bölüm</span>
              <ChevronRight size={17} className="shrink-0" />
            </button>
          ) : (
            <div className="h-11 sm:h-12 w-full text-[11px] sm:text-xs text-slate-400 dark:text-gray-500 font-medium px-2 rounded-xl bg-slate-100 dark:bg-gray-950/60 border border-slate-200 dark:border-gray-800 flex items-center justify-center whitespace-nowrap">
              <span className="sm:hidden">Son Bölüm</span>
              <span className="hidden sm:inline">Son Bölümdesiniz</span>
            </div>
          )}
        </div>

        {/* Comments */}
        <div className="mt-8">
          <CommentsSection
            seriesId={series.id}
            chapterId={currentChapter.id}
            sceneImages={chapterImageUrls}
            onJumpToParagraph={handleJumpToScene}
          />
        </div>

      </div>

      {/* POSITION-AWARE MANHWA SCENE COMMENTS DRAWER (Desktop Right Sidebar / Mobile Bottom Sheet) */}
      {activeScene && (
        <>
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs z-[65] md:bg-black/25"
            onClick={() => setActiveScene(null)}
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
                <div className="w-8 h-8 rounded-xl bg-purple-600/20 border border-purple-500/40 flex items-center justify-center text-amber-300 shrink-0">
                  <MessageCircle size={16} />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm sm:text-base font-black text-white truncate">
                      Sahne Yorumları
                    </h3>
                    <span className="text-xs font-extrabold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-200 border border-purple-500/30 font-mono">
                      {sceneCommentCounts[activeScene.key] || 0}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-400 truncate">
                    {activeScene.imgIdx + 1}. Şerit • %{activeScene.yPct} Yüksekliği
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveScene(null)}
                className="p-2 rounded-xl bg-gray-800/80 hover:bg-gray-700 text-gray-300 hover:text-white transition cursor-pointer shrink-0"
                title="Kapat"
              >
                <X size={18} />
              </button>
            </div>

            {/* Cropped Scene Slice Preview + Vertical Position Fine-Tuning Controls */}
            <div className="px-4 py-3 bg-purple-950/30 border-b border-purple-500/20 space-y-2 shrink-0 flex flex-col items-center">
              {chapterImageUrls[activeScene.imgIdx] && !isIframeUrl(chapterImageUrls[activeScene.imgIdx]) && (
                <div className="relative w-64 h-64 sm:w-72 sm:h-72 aspect-square mx-auto rounded-3xl overflow-hidden border-2 border-purple-400/60 bg-black shadow-2xl">
                  <img
                    src={chapterImageUrls[activeScene.imgIdx]}
                    alt="Seçili Sahne Kesiti"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover transition-all duration-200 select-none"
                    style={{ objectPosition: `50% ${activeScene.yPct}%` }}
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/95 via-black/60 to-transparent px-3 py-2 flex items-center justify-between text-[11px]">
                    <span className="font-black text-amber-300 drop-shadow text-xs">
                      📸 %{activeScene.yPct}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          const nextY = Math.max(0, activeScene.yPct - 5);
                          setActiveScene({
                            key: `scene_${activeScene.imgIdx}_${nextY}`,
                            imgIdx: activeScene.imgIdx,
                            yPct: nextY
                          });
                        }}
                        className="px-2.5 py-1 rounded-xl bg-gray-900/90 hover:bg-purple-700 text-gray-200 font-bold text-[10px] border border-white/20 cursor-pointer shadow-sm transition active:scale-95"
                        title="Sahne kesitini biraz yukarı kaydır"
                      >
                        ▲ Yukarı
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const nextY = Math.min(95, activeScene.yPct + 5);
                          setActiveScene({
                            key: `scene_${activeScene.imgIdx}_${nextY}`,
                            imgIdx: activeScene.imgIdx,
                            yPct: nextY
                          });
                        }}
                        className="px-2.5 py-1 rounded-xl bg-gray-900/90 hover:bg-purple-700 text-gray-200 font-bold text-[10px] border border-white/20 cursor-pointer shadow-sm transition active:scale-95"
                        title="Sahne kesitini biraz aşağı kaydır"
                      >
                        ▼ Aşağı
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Scrollable Scene Comments Body (Full Chibis, Themes, Replies, Likes) */}
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
              <CommentsSection
                key={`${currentChapter.id}__p__${activeScene.key}`}
                seriesId={series.id}
                chapterId={`${currentChapter.id}__p__${activeScene.key}`}
                isParagraphMode={true}
              />
            </div>
          </aside>
        </>
      )}

    </div>
  );
};

