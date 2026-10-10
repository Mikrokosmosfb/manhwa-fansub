import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useApp } from '../context/AppContext';
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
  Eye
} from 'lucide-react';
import { CommentsSection } from './CommentsSection';

import { ChapterSpecialBadge } from './ChapterSpecialBadge';
import { AdBannerBlock } from './AdScriptRunner';
import { sortChapters, formatChapterDate, cleanNoticeText } from '../utils/chapterUtils';
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
    adSettings
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
  const autoScrollRef = useRef<NodeJS.Timeout | null>(null);

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
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center text-white">
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
      <div className="reader-toolbar bg-white/95 dark:bg-gray-900/95 border-b border-purple-200 dark:border-purple-500/20 sticky top-0 z-40 backdrop-blur-md px-2.5 sm:px-4 py-2 shadow-md dark:shadow-lg">
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

          {/* Reader Mode Selector Switcher (Webtoon vs Manga) */}
          <div className="h-9 sm:h-10 flex items-center bg-slate-100 dark:bg-gray-950 p-1 rounded-xl border border-purple-200 dark:border-purple-500/30 shrink-0">
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

          {/* Settings & Prev / Next Header Buttons */}
          <div className="flex items-center gap-1 shrink-0">
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

      {/* Customizable Manhwa Reading Settings Panel */}
      {isSettingsOpen && (
        <div className="max-w-3xl mx-auto px-2.5 sm:px-4 mt-3">
          <div className="bg-gray-900/95 border border-purple-500/40 rounded-2xl p-4 sm:p-5 shadow-2xl text-white space-y-4 backdrop-blur-xl animate-in fade-in slide-in-from-top-2 duration-150">
            
            <div className="flex items-center justify-between border-b border-purple-500/20 pb-2.5">
              <h3 className="font-extrabold text-xs sm:text-sm uppercase tracking-wider text-purple-300 flex items-center gap-2">
                <Settings size={16} className="text-purple-400" />
                Manhwa / Webtoon Okuma Ayarları
              </h3>
              <button
                type="button"
                onClick={() => setIsSettingsOpen(false)}
                className="text-xs text-purple-300 hover:text-white font-bold px-2.5 py-1 rounded-lg bg-purple-950/60 border border-purple-500/30 transition cursor-pointer"
              >
                Kapat ✕
              </button>
            </div>

            {/* Reading Mode & Background Theme */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Reading Mode */}
              <div>
                <label className="text-[11px] uppercase font-bold text-purple-300 block mb-1.5">
                  Okuma Modu
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => toggleReaderMode('webtoon')}
                    className={`py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 border transition cursor-pointer ${
                      readerMode === 'webtoon'
                        ? 'bg-purple-600 text-white border-purple-400 shadow-md'
                        : 'bg-gray-950 text-gray-300 border-purple-500/25 hover:border-purple-500/50'
                    }`}
                  >
                    <Rows size={14} />
                    Webtoon (Dikey)
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleReaderMode('manga')}
                    className={`py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 border transition cursor-pointer ${
                      readerMode === 'manga'
                        ? 'bg-purple-600 text-white border-purple-400 shadow-md'
                        : 'bg-gray-950 text-gray-300 border-purple-500/25 hover:border-purple-500/50'
                    }`}
                  >
                    <Columns size={14} />
                    Manga (Sayfalı)
                  </button>
                </div>
              </div>

              {/* Background Theme */}
              <div>
                <label className="text-[11px] uppercase font-bold text-purple-300 block mb-1.5">
                  Arka Plan Rengi
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {[
                    { id: 'uzay', label: 'Uzay', bg: 'bg-[#030712]' },
                    { id: 'oled', label: 'Saf Siyah', bg: 'bg-black' },
                    { id: 'gri', label: 'Koyu Gri', bg: 'bg-zinc-900' },
                    { id: 'sepya', label: 'Gece Sepya', bg: 'bg-stone-900' }
                  ].map(theme => (
                    <button
                      key={theme.id}
                      type="button"
                      onClick={() => updateManhwaSettings({ bgTheme: theme.id as ManhwaSettings['bgTheme'] })}
                      className={`py-2 px-1.5 rounded-xl font-bold text-[11px] border transition cursor-pointer ${theme.bg} ${
                        manhwaSettings.bgTheme === theme.id
                          ? 'border-purple-400 text-white ring-2 ring-purple-500/40'
                          : 'border-gray-700 text-gray-400 hover:text-white'
                      }`}
                    >
                      {theme.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Image Width, Page Gap, Image Quality */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-2 border-t border-purple-500/20">
              {/* Image Width Preset */}
              <div>
                <label className="block text-purple-300 font-bold mb-1">Sayfa Genişliği</label>
                <select
                  value={manhwaSettings.widthMode}
                  onChange={e =>
                    updateManhwaSettings({
                      widthMode: e.target.value as ManhwaSettings['widthMode'],
                      zoomPercent: 100
                    })
                  }
                  className="w-full bg-gray-950 border border-purple-500/30 text-white rounded-xl p-2 font-semibold outline-none focus:border-purple-400"
                >
                  <option value="dar">Dar (Odaklı - 600px)</option>
                  <option value="standart">Standart (768px)</option>
                  <option value="genis">Geniş (1024px)</option>
                  <option value="tam">Tam Ekran Genişliği (%100)</option>
                </select>
              </div>

              {/* Page Gap (Webtoon mode) */}
              <div>
                <label className="block text-purple-300 font-bold mb-1">Sayfalar Arası Boşluk</label>
                <select
                  value={manhwaSettings.pageGap}
                  onChange={e => updateManhwaSettings({ pageGap: Number(e.target.value) })}
                  className="w-full bg-gray-950 border border-purple-500/30 text-white rounded-xl p-2 font-semibold outline-none focus:border-purple-400"
                >
                  <option value={0}>Kesintisiz (0px - Önerilen)</option>
                  <option value={4}>İnce Çizgi (4px)</option>
                  <option value={12}>Normal Boşluk (12px)</option>
                  <option value={24}>Geniş Boşluk (24px)</option>
                </select>
              </div>

              {/* Image Quality */}
              <div>
                <label className="block text-purple-300 font-bold mb-1">Görsel Kalitesi</label>
                <select
                  value={manhwaSettings.imageQuality}
                  onChange={e =>
                    updateManhwaSettings({
                      imageQuality: e.target.value as ManhwaSettings['imageQuality']
                    })
                  }
                  className="w-full bg-gray-950 border border-purple-500/30 text-white rounded-xl p-2 font-semibold outline-none focus:border-purple-400"
                >
                  <option value="yuksek">Yüksek Kalite (HD)</option>
                  <option value="dengeli">Dengeli (Hızlı Yükleme)</option>
                  <option value="tasarruf">Veri Tasarrufu (Düşük Kota)</option>
                </select>
              </div>
            </div>

            {/* Zoom Scale, Brightness / Eye Comfort & Auto-Scroll Speed */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-purple-500/20">
              {/* Custom Zoom Scale */}
              <div>
                <label className="block text-purple-300 font-bold text-xs mb-1">
                  Görsel Yakınlaştırma (%{manhwaSettings.zoomPercent})
                </label>
                <div className="flex items-center gap-1.5 bg-gray-950 p-1.5 rounded-xl border border-purple-500/30">
                  <button
                    type="button"
                    onClick={() =>
                      updateManhwaSettings({
                        zoomPercent: Math.max(50, manhwaSettings.zoomPercent - 10)
                      })
                    }
                    className="flex-1 bg-purple-600 hover:bg-purple-500 text-white font-bold py-1.5 rounded-lg text-xs flex items-center justify-center gap-1 transition cursor-pointer"
                  >
                    <ZoomOut size={13} /> -
                  </button>
                  <span className="font-extrabold px-2 text-xs text-white min-w-[46px] text-center">
                    %{manhwaSettings.zoomPercent}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      updateManhwaSettings({
                        zoomPercent: Math.min(150, manhwaSettings.zoomPercent + 10)
                      })
                    }
                    className="flex-1 bg-purple-600 hover:bg-purple-500 text-white font-bold py-1.5 rounded-lg text-xs flex items-center justify-center gap-1 transition cursor-pointer"
                  >
                    <ZoomIn size={13} /> +
                  </button>
                </div>
              </div>

              {/* Brightness / Eye Comfort Filter */}
              <div>
                <label className="block text-purple-300 font-bold text-xs mb-1 flex items-center gap-1">
                  <Sun size={12} className="text-amber-400" />
                  Görsel Parlaklığı (%{manhwaSettings.brightness})
                </label>
                <div className="flex gap-1 bg-gray-950 p-1.5 rounded-xl border border-purple-500/30">
                  {[100, 85, 70, 55].map(val => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => updateManhwaSettings({ brightness: val })}
                      className={`flex-1 py-1.5 rounded-lg font-bold text-[11px] transition cursor-pointer ${
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
              <div>
                <label className="block text-purple-300 font-bold text-xs mb-1">
                  Otomatik Kaydırma Hızı ({manhwaSettings.scrollSpeed}x)
                </label>
                <div className="flex gap-1 bg-gray-950 p-1.5 rounded-xl border border-purple-500/30">
                  {[1, 2, 3, 4].map(speed => (
                    <button
                      key={speed}
                      type="button"
                      onClick={() => updateManhwaSettings({ scrollSpeed: speed })}
                      className={`flex-1 py-1.5 rounded-lg font-bold text-xs transition cursor-pointer ${
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

            {/* Action & Toggle Buttons Row */}
            <div className="flex flex-wrap gap-2 pt-2 border-t border-purple-500/20">
              {readerMode === 'webtoon' && (
                <button
                  type="button"
                  onClick={() => setIsAutoScrolling(!isAutoScrolling)}
                  className={`flex-1 min-w-[140px] py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow transition cursor-pointer ${
                    isAutoScrolling
                      ? 'bg-amber-500 text-gray-950'
                      : 'bg-purple-600 hover:bg-purple-500 text-white'
                  }`}
                >
                  {isAutoScrolling ? <Pause size={14} /> : <Play size={14} />}
                  {isAutoScrolling ? 'Kaydırmayı Durdur' : 'Otomatik Kaydır'}
                </button>
              )}

              {readerMode === 'webtoon' && (
                <button
                  type="button"
                  onClick={() => updateManhwaSettings({ tapToScroll: !manhwaSettings.tapToScroll })}
                  className={`py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 border transition cursor-pointer ${
                    manhwaSettings.tapToScroll
                      ? 'bg-purple-600 text-white border-purple-400 shadow-sm'
                      : 'bg-gray-950 border-purple-500/30 text-gray-300 hover:text-white'
                  }`}
                  title="Webtoon modunda görsele tıkladığınızda aşağı doğru kaydırır"
                >
                  <MousePointerClick size={14} />
                  {manhwaSettings.tapToScroll ? 'Tıkla Kaydır (Açık)' : 'Tıkla Kaydır'}
                </button>
              )}

              <button
                type="button"
                onClick={() => updateManhwaSettings({ showProgressBar: !manhwaSettings.showProgressBar })}
                className={`py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 border transition cursor-pointer ${
                  manhwaSettings.showProgressBar
                    ? 'bg-purple-600 text-white border-purple-400 shadow-sm'
                    : 'bg-gray-950 border-purple-500/30 text-gray-300 hover:text-white'
                }`}
              >
                <Eye size={14} />
                {manhwaSettings.showProgressBar ? 'İlerleme Çubuğu (Açık)' : 'İlerleme Çubuğu'}
              </button>

              <button
                type="button"
                onClick={toggleFullscreen}
                className="py-2 px-3 rounded-xl font-bold text-xs bg-gray-950 border border-purple-500/30 text-gray-200 hover:text-white hover:border-purple-400 flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <Maximize size={14} />
                Tam Ekran
              </button>

              <button
                type="button"
                onClick={resetManhwaSettings}
                className="py-2 px-3 rounded-xl font-bold text-xs bg-red-950/50 hover:bg-red-900/70 border border-red-500/40 text-red-200 flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <RotateCcw size={14} />
                Varsayılan
              </button>
            </div>

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

          {/* Chapter Specific Notice / Warning */}
          {cleanNoticeText(currentChapter.notice) && (
            <div className="mt-4 bg-amber-50 dark:bg-amber-950/70 border border-amber-200 dark:border-amber-500/40 text-amber-900 dark:text-amber-200 text-xs rounded-2xl p-3.5 text-left font-medium flex items-start gap-2.5 shadow-sm">
              <div className="p-1.5 bg-amber-100 dark:bg-amber-900/60 rounded-xl text-amber-700 dark:text-amber-300 flex-shrink-0 mt-0.5">
                <MessageSquare size={16} />
              </div>
              <div className="flex-1">
                <strong className="block font-bold text-amber-900 dark:text-amber-300 text-xs mb-0.5">Not:</strong>
                <p className="leading-relaxed text-amber-800 dark:text-amber-100/90">{cleanNoticeText(currentChapter.notice)}</p>
              </div>
            </div>
          )}

          {/* Series Notice if no chapter notice */}
          {!cleanNoticeText(currentChapter.notice) && cleanNoticeText(series.notice) && (
            <div className="mt-4 bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-500/30 text-purple-900 dark:text-purple-200 text-xs rounded-2xl p-3 text-left font-medium flex items-center gap-2.5">
              <div className="p-1.5 bg-purple-100 dark:bg-purple-900/60 rounded-xl text-purple-700 dark:text-purple-300 flex-shrink-0">
                <Megaphone size={16} />
              </div>
              <p className="leading-relaxed flex-1"><strong className="text-purple-800 dark:text-purple-300">Not:</strong> {cleanNoticeText(series.notice)}</p>
            </div>
          )}
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
            onClick={() => setView({ type: 'report' })}
            className="bg-red-600 hover:bg-red-500 text-white font-extrabold px-3.5 py-1.5 rounded-xl transition text-[11px] uppercase tracking-wider shadow-md hover:shadow-red-900/50 flex-shrink-0"
          >
            Hemen Bildir
          </button>
        </div>

      </div>

      {/* Comic Images - Webtoon vs Manga Mode Rendering (Dynamic Width & Settings) */}
      <div
        className="mx-auto px-0 sm:px-2 transition-all duration-200"
        style={{
          maxWidth: getContainerMaxWidth(),
          width: `${manhwaSettings.zoomPercent}%`,
          filter: manhwaSettings.brightness < 100 ? `brightness(${manhwaSettings.brightness}%)` : undefined
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
                {chapterImageUrls.map((imgUrl, idx) => (
                  isIframeUrl(imgUrl) ? (
                    <iframe
                      key={idx}
                      src={imgUrl}
                      title={`${currentChapter.title} - Embed ${idx + 1}`}
                      className="w-full h-[600px] my-4 rounded-xl shadow-xl bg-gray-900 border border-gray-800"
                      allowFullScreen
                    />
                  ) : (
                    <img
                      key={idx}
                      src={getOptimizedImageUrl(imgUrl, getImageOptimizationConfig())}
                      alt={`${currentChapter.title} - Sayfa ${idx + 1}`}
                      className="w-full block border-none rounded-none shadow-none bg-gray-900 select-none"
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
                  )
                ))}
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
                      className="w-full rounded-2xl shadow-2xl object-contain bg-white dark:bg-gray-900 border border-purple-200 dark:border-purple-500/20"
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
          <CommentsSection seriesId={series.id} chapterId={currentChapter.id} />
        </div>

      </div>

    </div>
  );
};

