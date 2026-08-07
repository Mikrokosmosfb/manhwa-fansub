import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { extractImageUrls, isIframeUrl } from '../utils/imageParser';
import {
  ChevronLeft,
  ChevronRight,
  List,
  AlertTriangle,
  ArrowLeft,
  CheckCheck,
  Columns,
  Rows,
  Sparkles,
  Maximize2,
  Scroll,
  BookOpen,
  MessageSquare,
  Megaphone,
  Lightbulb,
  Lock,
  User
} from 'lucide-react';
import { CommentsSection } from './CommentsSection';

import { ChapterSpecialBadge } from './ChapterSpecialBadge';

interface ManhwaReaderProps {
  seriesId: string;
  chapterId: string;
}

export const ManhwaReader: React.FC<ManhwaReaderProps> = ({ seriesId, chapterId }) => {
  const { seriesList, setView, updateReadingProgress, readingHistory, user, openAuthModal, loginWithGoogle } = useApp();
  const series = seriesList.find(s => s.id === seriesId);
  const chapterIndex = series?.chapters.findIndex(c => c.id === chapterId) ?? -1;
  const currentChapter = series?.chapters[chapterIndex];

  // Reading Mode: 'webtoon' (Vertical scroll) or 'manga' (Single page turn)
  const [readerMode, setReaderMode] = useState<'webtoon' | 'manga'>(() => {
    return (localStorage.getItem('mk_manhwa_reader_mode') as 'webtoon' | 'manga') || 'webtoon';
  });

  // Current page index for Manga (single page) mode (0-indexed)
  const [currentPage, setCurrentPage] = useState(0);

  const [scrollProgress, setScrollProgress] = useState(0);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Toggle reader mode
  const toggleReaderMode = (mode: 'webtoon' | 'manga') => {
    setReaderMode(mode);
    localStorage.setItem('mk_manhwa_reader_mode', mode);
  };

  const prevChapter = series && chapterIndex > 0 ? series.chapters[chapterIndex - 1] : null;
  const nextChapter =
    series && chapterIndex >= 0 && chapterIndex < series.chapters.length - 1
      ? series.chapters[chapterIndex + 1]
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
          // Go to next chapter
          setView({ type: 'reader', seriesId: series!.id, chapterId: nextChapter.id });
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
  }, [readerMode, currentPage, totalPages, nextChapter, series, setView]);

  // Update progress on scroll in Webtoon mode
  useEffect(() => {
    if (readerMode === 'manga') return;

    const handleScroll = () => {
      const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
      const height =
        document.documentElement.scrollHeight - document.documentElement.clientHeight;
      if (height > 0) {
        const scrolled = (winScroll / height) * 100;
        setScrollProgress(scrolled);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [readerMode]);

  // Reset page position when chapter changes
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

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 pb-20">
      
      {/* Top Reading Progress Bar */}
      <div
        className="fixed top-0 left-0 h-1.5 bg-gradient-to-r from-purple-500 via-indigo-500 to-teal-400 z-50 transition-all duration-150"
        style={{ width: `${effectiveProgress}%` }}
      />

      {/* Reader Navigation Header */}
      <div className="bg-gray-900/90 border-b border-purple-500/20 sticky top-0 z-40 backdrop-blur-md px-3 sm:px-4 py-2.5 shadow-lg">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-2">
          
          {/* Back to Series */}
          <button
            onClick={() => setView({ type: 'series-detail', seriesId: series.id })}
            className="flex items-center gap-1 text-xs sm:text-sm font-semibold text-purple-300 hover:text-white transition bg-purple-950/60 hover:bg-purple-900 border border-purple-500/30 px-2.5 py-1.5 rounded-xl flex-shrink-0"
          >
            <ArrowLeft size={16} />
            <span className="hidden md:inline">{series.title}</span>
            <span className="md:hidden">Seri</span>
          </button>

          {/* Chapter Selector Dropdown */}
          <div className="relative flex-1 max-w-xs text-center">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="w-full bg-gray-950 border border-purple-500/40 text-gray-100 text-xs sm:text-sm font-bold px-3 py-1.5 rounded-xl flex items-center justify-between gap-1.5 hover:border-purple-400 transition"
            >
              <span className="truncate">{currentChapter.title}</span>
              <List size={16} className="text-purple-400 flex-shrink-0" />
            </button>

            {isDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-gray-900 border border-purple-500/40 rounded-2xl shadow-2xl overflow-hidden z-50 max-h-72 overflow-y-auto divide-y divide-gray-800">
                {series.chapters.map(ch => {
                  const isCurrent = ch.id === currentChapter.id;
                  const isRead = readingHistory[series.id]?.lastChapterId === ch.id;

                  return (
                    <button
                      key={ch.id}
                      onClick={() => {
                        setView({ type: 'reader', seriesId: series.id, chapterId: ch.id });
                        setIsDropdownOpen(false);
                      }}
                      className={`w-full text-left p-3 text-xs sm:text-sm flex items-center justify-between transition ${
                        isCurrent
                          ? 'bg-purple-800 text-white font-bold'
                          : 'hover:bg-purple-900/40 text-gray-200'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 min-w-0 pr-2">
                        <span className="truncate">{ch.title}</span>
                        {ch.specialTag && (
                          <ChapterSpecialBadge tag={ch.specialTag} size="xs" />
                        )}
                      </div>
                      {isRead && (
                        <CheckCheck size={16} className="text-emerald-400 flex-shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Reader Mode Selector Switcher (Webtoon vs Manga) */}
          <div className="flex items-center bg-gray-950 p-1 rounded-xl border border-purple-500/30">
            <button
              onClick={() => toggleReaderMode('webtoon')}
              className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-bold transition ${
                readerMode === 'webtoon'
                  ? 'bg-purple-600 text-white shadow'
                  : 'text-gray-400 hover:text-white'
              }`}
              title="Webtoon Modu (Dikey Kaydırma)"
            >
              <Rows size={14} />
              <span className="hidden lg:inline">Webtoon</span>
            </button>
            <button
              onClick={() => toggleReaderMode('manga')}
              className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-bold transition ${
                readerMode === 'manga'
                  ? 'bg-purple-600 text-white shadow'
                  : 'text-gray-400 hover:text-white'
              }`}
              title="Manga Modu (Slayt / Sayfa Çevirme)"
            >
              <Columns size={14} />
              <span className="hidden lg:inline">Manga</span>
            </button>
          </div>

          {/* Prev / Next Header Buttons */}
          <div className="flex items-center gap-1 flex-shrink-0">
            {prevChapter ? (
              <button
                onClick={() =>
                  setView({ type: 'reader', seriesId: series.id, chapterId: prevChapter.id })
                }
                className="bg-purple-800 hover:bg-purple-700 text-white p-2 rounded-xl text-xs font-semibold flex items-center gap-1 transition"
                title="Önceki Bölüm"
              >
                <ChevronLeft size={16} />
              </button>
            ) : (
              <div className="w-8" />
            )}

            {nextChapter ? (
              <button
                onClick={() =>
                  setView({ type: 'reader', seriesId: series.id, chapterId: nextChapter.id })
                }
                className="bg-purple-800 hover:bg-purple-700 text-white p-2 rounded-xl text-xs font-semibold flex items-center gap-1 transition"
                title="Sonraki Bölüm"
              >
                <ChevronRight size={16} />
              </button>
            ) : (
              <div className="w-8" />
            )}
          </div>

        </div>
      </div>

      {/* Main Chapter Content Container */}
      <div className="max-w-3xl mx-auto px-2 sm:px-4 py-6 space-y-4">
        
        {/* Title Header */}
        <div className="text-center bg-gray-900/80 border border-purple-500/20 p-4 rounded-2xl">
          <div className="flex items-center justify-between text-xs text-purple-300 mb-1">
            <span className="font-semibold">{series.type}</span>
            <span className="bg-purple-950 px-2 py-0.5 rounded border border-purple-700/40 text-[10px] font-bold flex items-center gap-1">
              {readerMode === 'webtoon' ? (
                <>
                  <Scroll size={12} className="text-purple-300" /> Dikey Kaydırma (Webtoon)
                </>
              ) : (
                <>
                  <BookOpen size={12} className="text-purple-300" /> Sayfa Çevirme (Manga)
                </>
              )}
            </span>
          </div>

          <h1 className="text-lg sm:text-2xl font-extrabold text-white">
            {series.title}
          </h1>
          <p className="text-sm font-semibold text-purple-300 mt-1">
            {currentChapter.title}
          </p>

          {/* Chapter Specific Notice / Warning */}
          {currentChapter.notice && (
            <div className="mt-3 bg-amber-950/80 border border-amber-600/60 text-amber-200 text-xs rounded-xl p-3 text-left font-medium flex items-start gap-2 shadow">
              <MessageSquare size={16} className="text-amber-400 mt-0.5 flex-shrink-0" />
              <div>
                <strong className="block font-bold text-amber-300">Bölüm Duyurusu:</strong>
                <p>{currentChapter.notice}</p>
              </div>
            </div>
          )}

          {/* Series Notice if no chapter notice */}
          {!currentChapter.notice && series.notice && (
            <div className="mt-3 bg-purple-950/70 border border-purple-500/40 text-purple-200 text-xs rounded-xl p-2.5 text-left font-medium flex items-center gap-2">
              <Megaphone size={16} className="text-purple-400 flex-shrink-0" />
              <p><strong>Çevirmen Notu:</strong> {series.notice}</p>
            </div>
          )}
        </div>

        {/* Damage/Broken Image Report Button Banner */}
        <div className="bg-gradient-to-r from-purple-950 via-red-950 to-purple-950 border border-red-500/40 p-3 rounded-2xl text-center text-xs font-semibold text-white flex items-center justify-between gap-2 shadow">
          <span className="flex items-center gap-1.5 text-amber-300">
            <AlertTriangle size={16} className="text-red-400" />
            Hasarlı / Yüklenmemiş Görsel mi var?
          </span>
          <button
            onClick={() => setView({ type: 'report' })}
            className="bg-red-600 hover:bg-red-500 text-white font-extrabold px-3 py-1 rounded-lg transition text-[11px] uppercase tracking-wider"
          >
            Hemen Bildir
          </button>
        </div>

        {/* Comic Images - Webtoon vs Manga Mode Rendering */}
        {readerMode === 'webtoon' ? (
          /* Webtoon Mode: Continuous Vertical Scroll (Seamless / Kesintisiz) */
          <div className="flex flex-col items-center py-4">
            {chapterImageUrls.length > 0 ? (
              <div className="w-full max-w-3xl flex flex-col items-center">
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
                      src={imgUrl}
                      alt={`${currentChapter.title} - Sayfa ${idx + 1}`}
                      className="w-full block border-none rounded-none shadow-none bg-gray-900"
                      loading="lazy"
                      style={{ display: 'block', margin: 0, padding: 0 }}
                    />
                  )
                ))}
              </div>
            ) : (
              <div className="p-12 text-center text-gray-400 bg-gray-900 rounded-2xl border border-purple-500/20 w-full">
                Bu bölümde henüz görsel içerik bulunmuyor veya dönüştürülüyor.
              </div>
            )}
          </div>
        ) : (
          /* Manga Mode: Single Page Slider with Page Controls */
          <div className="space-y-4 py-4">
            {chapterImageUrls.length > 0 ? (
              <div className="flex flex-col items-center">
                
                {/* Page Navigation Toolbar */}
                <div className="w-full bg-gray-900/90 border border-purple-500/30 p-2.5 rounded-2xl flex items-center justify-between gap-3 mb-3 shadow-lg">
                  <button
                    disabled={currentPage === 0}
                    onClick={() => {
                      setCurrentPage(prev => Math.max(0, prev - 1));
                      window.scrollTo(0, 0);
                    }}
                    className="bg-purple-800 hover:bg-purple-700 disabled:opacity-30 disabled:hover:bg-purple-800 text-white font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1 transition"
                  >
                    <ChevronLeft size={16} />
                    Önceki Sayfa
                  </button>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-purple-200">
                      Sayfa <strong className="text-white text-sm">{currentPage + 1}</strong> / {totalPages}
                    </span>
                    <select
                      value={currentPage}
                      onChange={e => {
                        setCurrentPage(Number(e.target.value));
                        window.scrollTo(0, 0);
                      }}
                      className="bg-gray-950 border border-purple-500/30 text-xs text-white rounded-lg p-1 font-bold focus:outline-none"
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
                    className="bg-purple-800 hover:bg-purple-700 text-white font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1 transition"
                  >
                    {currentPage === totalPages - 1 ? 'Sonraki Bölüm' : 'Sonraki Sayfa'}
                    <ChevronRight size={16} />
                  </button>
                </div>

                {/* Single Page Image display */}
                <div className="relative group w-full max-w-2xl">
                  {isIframeUrl(chapterImageUrls[currentPage]) ? (
                    <iframe
                      src={chapterImageUrls[currentPage]}
                      title={`${currentChapter.title} - Sayfa ${currentPage + 1}`}
                      className="w-full h-[600px] rounded-2xl shadow-2xl bg-gray-900 border border-purple-500/20"
                      allowFullScreen
                    />
                  ) : (
                    <img
                      src={chapterImageUrls[currentPage]}
                      alt={`${currentChapter.title} - Sayfa ${currentPage + 1}`}
                      className="w-full rounded-2xl shadow-2xl object-contain bg-gray-900 border border-purple-500/20"
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

                <p className="text-[11px] text-gray-500 mt-2 text-center flex items-center justify-center gap-1">
                  <Lightbulb size={13} className="text-amber-400 inline" /> İpucu: Sayfalar arasında geçiş yapmak için klavyedeki Sol / Sağ ok tuşlarını kullanabilirsiniz.
                </p>

              </div>
            ) : (
              <div className="p-12 text-center text-gray-400 bg-gray-900 rounded-2xl border border-purple-500/20 w-full">
                Bu bölümde henüz görsel içerik bulunmuyor.
              </div>
            )}
          </div>
        )}

        {/* Bottom Chapter Navigation */}
        <div className="bg-gray-900/90 border border-purple-500/30 p-4 rounded-2xl flex items-center justify-between gap-4 my-6">
          {prevChapter ? (
            <button
              onClick={() =>
                setView({ type: 'reader', seriesId: series.id, chapterId: prevChapter.id })
              }
              className="flex-1 bg-purple-800 hover:bg-purple-700 text-white font-bold py-3 px-4 rounded-xl text-xs sm:text-sm flex items-center justify-center gap-1 transition shadow-lg"
            >
              <ChevronLeft size={18} />
              Önceki Bölüm
            </button>
          ) : (
            <div className="flex-1 text-xs text-gray-500 text-center font-medium">İlk Bölümdesiniz</div>
          )}

          {nextChapter ? (
            <button
              onClick={() =>
                setView({ type: 'reader', seriesId: series.id, chapterId: nextChapter.id })
              }
              className="flex-1 bg-purple-800 hover:bg-purple-700 text-white font-bold py-3 px-4 rounded-xl text-xs sm:text-sm flex items-center justify-center gap-1 transition shadow-lg"
            >
              Sonraki Bölüm
              <ChevronRight size={18} />
            </button>
          ) : (
            <div className="flex-1 text-xs text-gray-500 text-center font-medium">Son Bölümdesiniz</div>
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

