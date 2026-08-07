import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { NovelSettings } from '../types';
import { extractImageUrls, isHtmlContent, isIframeUrl } from '../utils/imageParser';
import {
  Settings,
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
  User
} from 'lucide-react';
import { CommentsSection } from './CommentsSection';
import { ChapterSpecialBadge } from './ChapterSpecialBadge';

interface NovelReaderProps {
  seriesId: string;
  chapterId: string;
}

export const NovelReader: React.FC<NovelReaderProps> = ({ seriesId, chapterId }) => {
  const {
    seriesList,
    setView,
    updateReadingProgress,
    readingHistory,
    novelSettings,
    updateNovelSettings,
    resetNovelSettings,
    user,
    openAuthModal,
    loginWithGoogle
  } = useApp();

  const series = seriesList.find(s => s.id === seriesId);
  const chapterIndex = series?.chapters.findIndex(c => c.id === chapterId) ?? -1;
  const currentChapter = series?.chapters[chapterIndex];

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isAutoScrolling, setIsAutoScrolling] = useState(false);
  const autoScrollRef = useRef<NodeJS.Timeout | null>(null);

  // Word count & estimated reading time calculation
  const wordCount = currentChapter?.content
    ? currentChapter.content.trim().split(/\s+/).length
    : 0;
  const estimatedMinutes = Math.max(1, Math.round(wordCount / 200));

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

  // Save progress on mount
  useEffect(() => {
    if (series && currentChapter) {
      updateReadingProgress(series.id, currentChapter.id, currentChapter.number, currentChapter.title);
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
            <strong className="text-white font-semibold">{series.title}</strong> romanının <strong className="text-amber-300 font-semibold">{currentChapter.title || `Bölüm ${currentChapter.number}`}</strong> içeriğini okuyabilmek için Mikrokosmos Fansub hesabınıza giriş yapmalı veya ücretsiz üye olmalısınız.
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

  const prevChapter = chapterIndex > 0 ? series.chapters[chapterIndex - 1] : null;
  const nextChapter =
    chapterIndex < series.chapters.length - 1 ? series.chapters[chapterIndex + 1] : null;

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
      <div className="bg-gray-900/90 border-b border-purple-500/20 sticky top-0 z-40 backdrop-blur-md px-4 py-3 shadow-lg text-white">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-2">
          
          {/* Back button */}
          <button
            onClick={() => setView({ type: 'series-detail', seriesId: series.id })}
            className="flex items-center gap-1 text-xs sm:text-sm font-semibold text-purple-300 hover:text-white transition bg-purple-950/60 hover:bg-purple-900 border border-purple-500/30 px-3 py-1.5 rounded-xl"
          >
            <ArrowLeft size={16} />
            <span className="hidden sm:inline">{series.title}</span>
            <span className="sm:hidden">Seri</span>
          </button>

          {/* Chapter Selector Dropdown */}
          <div className="relative flex-1 max-w-xs text-center">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="w-full bg-gray-950 border border-purple-500/40 text-gray-100 text-xs sm:text-sm font-bold px-3 py-2 rounded-xl flex items-center justify-between gap-2 hover:border-purple-400 transition"
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

          {/* Settings & Nav */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setIsSettingsOpen(!isSettingsOpen)}
              className={`p-2 rounded-xl border transition ${
                isSettingsOpen
                  ? 'bg-purple-600 border-purple-400 text-white'
                  : 'bg-purple-950/60 border-purple-500/30 text-purple-200 hover:text-white'
              }`}
              title="Okuma Ayarları"
            >
              <Settings size={18} />
            </button>

            {prevChapter && (
              <button
                onClick={() =>
                  setView({ type: 'reader', seriesId: series.id, chapterId: prevChapter.id })
                }
                className="bg-purple-800 hover:bg-purple-700 text-white p-2 rounded-xl text-xs font-semibold flex items-center gap-1 transition"
                title="Önceki Bölüm"
              >
                <ChevronLeft size={16} />
              </button>
            )}

            {nextChapter && (
              <button
                onClick={() =>
                  setView({ type: 'reader', seriesId: series.id, chapterId: nextChapter.id })
                }
                className="bg-purple-800 hover:bg-purple-700 text-white p-2 rounded-xl text-xs font-semibold flex items-center gap-1 transition"
                title="Sonraki Bölüm"
              >
                <ChevronRight size={16} />
              </button>
            )}
          </div>

        </div>
      </div>

      {/* Customizable Reading Settings Panel */}
      {isSettingsOpen && (
        <div className="max-w-4xl mx-auto px-4 mt-3">
          <div className="bg-purple-950/95 border-2 border-purple-500/50 rounded-2xl p-5 shadow-2xl text-white space-y-4">
            
            <div className="flex items-center justify-between border-b border-purple-800 pb-2">
              <h3 className="font-extrabold text-sm uppercase tracking-wider text-purple-200 flex items-center gap-2">
                <Settings size={16} />
                Roman Okuma Ayarları
              </h3>
              <button
                onClick={() => setIsSettingsOpen(false)}
                className="text-xs text-purple-300 hover:text-white"
              >
                Kapat
              </button>
            </div>

            {/* Presets (Gündüz, Sepya, Gece) */}
            <div>
              <label className="text-[11px] uppercase font-bold text-purple-300 block mb-1.5">
                Hazır Modlar
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() =>
                    updateNovelSettings({ bgColor: '#ffffff', textColor: '#000000' })
                  }
                  className="py-2 rounded-xl font-bold text-xs bg-white text-gray-900 border border-gray-300 shadow hover:scale-102 transition"
                >
                  Gündüz
                </button>
                <button
                  type="button"
                  onClick={() =>
                    updateNovelSettings({ bgColor: '#F2EFE9', textColor: '#3d0807' })
                  }
                  className="py-2 rounded-xl font-bold text-xs bg-[#F2EFE9] text-[#3d0807] border border-amber-300 shadow hover:scale-102 transition"
                >
                  Sepya
                </button>
                <button
                  type="button"
                  onClick={() =>
                    updateNovelSettings({ bgColor: '#1e1e1e', textColor: '#dddddd' })
                  }
                  className="py-2 rounded-xl font-bold text-xs bg-[#1e1e1e] text-[#dddddd] border border-gray-700 shadow hover:scale-102 transition"
                >
                  Gece
                </button>
              </div>
            </div>

            {/* Dropdown Options Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              
              {/* Font Family */}
              <div>
                <label className="block text-purple-300 font-bold mb-1">Yazı Tipi</label>
                <select
                  value={novelSettings.fontFamily}
                  onChange={e => updateNovelSettings({ fontFamily: e.target.value })}
                  className="w-full bg-purple-900 border border-purple-700 text-white rounded-lg p-2 font-medium"
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
                <label className="block text-purple-300 font-bold mb-1">Satır Aralığı</label>
                <select
                  value={novelSettings.lineHeight}
                  onChange={e => updateNovelSettings({ lineHeight: e.target.value })}
                  className="w-full bg-purple-900 border border-purple-700 text-white rounded-lg p-2 font-medium"
                >
                  <option value="120%">120%</option>
                  <option value="140%">140%</option>
                  <option value="160%">160%</option>
                  <option value="180%">180%</option>
                </select>
              </div>

              {/* Text Align */}
              <div>
                <label className="block text-purple-300 font-bold mb-1">Yazı Hizalama</label>
                <select
                  value={novelSettings.textAlign}
                  onChange={e =>
                    updateNovelSettings({
                      textAlign: e.target.value as NovelSettings['textAlign']
                    })
                  }
                  className="w-full bg-purple-900 border border-purple-700 text-white rounded-lg p-2 font-medium"
                >
                  <option value="left">Sola Yasla</option>
                  <option value="center">Ortala</option>
                  <option value="justify">İki Yana Yasla</option>
                </select>
              </div>

              {/* Column Width */}
              <div>
                <label className="block text-purple-300 font-bold mb-1">Okuma Genişliği</label>
                <select
                  value={novelSettings.widthMode}
                  onChange={e =>
                    updateNovelSettings({
                      widthMode: e.target.value as NovelSettings['widthMode']
                    })
                  }
                  className="w-full bg-purple-900 border border-purple-700 text-white rounded-lg p-2 font-medium"
                >
                  <option value="dar">Dar (Odaklı)</option>
                  <option value="orta">Orta (Standart)</option>
                  <option value="genis">Geniş (Serbest)</option>
                </select>
              </div>

            </div>

            {/* Font Size & Speed Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-purple-800/80">
              
              {/* Font Size Selector */}
              <div>
                <label className="block text-purple-300 font-bold text-xs mb-1">
                  Yazı Boyutu ({novelSettings.fontSize}px)
                </label>
                <div className="flex items-center gap-2 bg-purple-900/60 p-1.5 rounded-xl border border-purple-700/50">
                  <button
                    type="button"
                    onClick={() =>
                      updateNovelSettings({
                        fontSize: Math.max(12, novelSettings.fontSize - 2)
                      })
                    }
                    className="flex-1 bg-purple-800 hover:bg-purple-700 text-white font-bold py-1 rounded-lg text-xs"
                  >
                    A-
                  </button>
                  <span className="font-extrabold px-3 text-sm">{novelSettings.fontSize}px</span>
                  <button
                    type="button"
                    onClick={() =>
                      updateNovelSettings({
                        fontSize: Math.min(32, novelSettings.fontSize + 2)
                      })
                    }
                    className="flex-1 bg-purple-800 hover:bg-purple-700 text-white font-bold py-1 rounded-lg text-xs"
                  >
                    A+
                  </button>
                </div>
              </div>

              {/* Scroll Speed Selector */}
              <div>
                <label className="block text-purple-300 font-bold text-xs mb-1">
                  Kaydırma Hızı ({novelSettings.scrollSpeed}x)
                </label>
                <div className="flex gap-1 bg-purple-900/60 p-1.5 rounded-xl border border-purple-700/50">
                  {[1, 2, 3].map(speed => (
                    <button
                      key={speed}
                      type="button"
                      onClick={() => updateNovelSettings({ scrollSpeed: speed })}
                      className={`flex-1 py-1 rounded-lg font-bold text-xs transition ${
                        novelSettings.scrollSpeed === speed
                          ? 'bg-purple-500 text-white'
                          : 'bg-purple-800/50 text-purple-200 hover:bg-purple-700'
                      }`}
                    >
                      {speed}x
                    </button>
                  ))}
                </div>
              </div>

            </div>

            {/* Action Buttons Row */}
            <div className="flex flex-wrap gap-2 pt-2 border-t border-purple-800">
              <button
                type="button"
                onClick={() => setIsAutoScrolling(!isAutoScrolling)}
                className={`flex-1 py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow transition ${
                  isAutoScrolling ? 'bg-amber-600 text-black' : 'bg-purple-600 hover:bg-purple-500 text-white'
                }`}
              >
                {isAutoScrolling ? <Pause size={14} /> : <Play size={14} />}
                {isAutoScrolling ? 'Kaydırmayı Durdur' : 'Otomatik Kaydır'}
              </button>

              <button
                type="button"
                onClick={() => updateNovelSettings({ isBold: !novelSettings.isBold })}
                className={`py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 border ${
                  novelSettings.isBold
                    ? 'bg-white text-purple-950 border-white'
                    : 'bg-purple-900/60 border-purple-700 text-white hover:bg-purple-800'
                }`}
              >
                <Type size={14} />
                {novelSettings.isBold ? 'Kalın Yazı (Açık)' : 'Kalın Yazı'}
              </button>

              <button
                type="button"
                onClick={toggleFullscreen}
                className="py-2 px-3 rounded-xl font-bold text-xs bg-purple-900/60 border border-purple-700 text-white hover:bg-purple-800 flex items-center justify-center gap-1"
              >
                <Maximize size={14} />
                Tam Ekran
              </button>

              <button
                type="button"
                onClick={resetNovelSettings}
                className="py-2 px-3 rounded-xl font-bold text-xs bg-red-900/40 hover:bg-red-900/70 border border-red-700 text-red-200 flex items-center justify-center gap-1"
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
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-red-600 hover:bg-red-500 text-white font-extrabold px-6 py-2.5 rounded-full shadow-2xl border-2 border-white/20 flex items-center gap-2 text-sm animate-pulse"
        >
          <Pause size={18} />
          Kaydırmayı Durdur
        </button>
      )}

      {/* Novel Reading Container */}
      <div className={`mx-auto px-4 py-8 ${getWidthClass()}`}>
        
        {/* Title Header */}
        <div className="text-center mb-8 border-b border-purple-500/20 pb-6">
          <h1 className="text-2xl sm:text-3xl font-extrabold mb-2">
            {series.title}
          </h1>
          <h2 className="text-lg font-bold opacity-80">
            {currentChapter.title}
          </h2>
          <div className="mt-3 flex items-center justify-center gap-4 text-xs opacity-70">
            <span className="flex items-center gap-1">
              <Clock size={14} />
              Tahmini okuma: ~{estimatedMinutes} dk
            </span>
            <span>{wordCount} Kelime</span>
          </div>

          {/* Chapter Specific Notice / Warning */}
          {currentChapter.notice && (
            <div className="mt-4 bg-amber-950/80 border border-amber-600/60 text-amber-200 text-xs rounded-xl p-3 text-left font-medium flex items-start gap-2 shadow">
              <MessageSquare size={16} className="text-amber-400 mt-0.5 flex-shrink-0" />
              <div>
                <strong className="block font-bold text-amber-300">Bölüm Duyurusu:</strong>
                <p>{currentChapter.notice}</p>
              </div>
            </div>
          )}

          {/* Series Notice if no chapter notice */}
          {!currentChapter.notice && series.notice && (
            <div className="mt-4 bg-purple-950/70 border border-purple-500/40 text-purple-200 text-xs rounded-xl p-2.5 text-left font-medium flex items-center gap-2">
              <Megaphone size={16} className="text-purple-400 flex-shrink-0" />
              <p><strong>Çevirmen Notu:</strong> {series.notice}</p>
            </div>
          )}
        </div>

        {/* Optional Chapter Images inside Novel */}
        {currentChapter.images && currentChapter.images.length > 0 && (
          <div className="flex flex-col items-center space-y-4 my-6">
            {extractImageUrls(currentChapter.images).map((imgUrl, idx) => (
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
                  className="w-full max-w-2xl rounded-xl shadow-lg border border-purple-500/20"
                />
              )
            ))}
          </div>
        )}

        {/* Text Content Area (HTML or Plaintext) */}
        <div
          className="prose max-w-none space-y-6 leading-relaxed transition-all"
          style={{
            fontFamily: novelSettings.fontFamily,
            fontSize: `${novelSettings.fontSize}px`,
            lineHeight: novelSettings.lineHeight,
            textAlign: novelSettings.textAlign,
            padding: novelSettings.padding,
            fontWeight: novelSettings.isBold ? 'bold' : 'normal'
          }}
        >
          {currentChapter.content ? (
            isHtmlContent(currentChapter.content) ? (
              <div
                className="chapter-html-content space-y-4"
                dangerouslySetInnerHTML={{ __html: currentChapter.content }}
              />
            ) : (
              currentChapter.content.split('\n\n').map((paragraph, idx) => (
                <p key={idx} className="mb-4">
                  {paragraph}
                </p>
              ))
            )
          ) : (
            <p className="text-center italic opacity-60">
              Bu bölümde henüz metin içerik bulunmuyor.
            </p>
          )}
        </div>

        {/* Bottom Navigation */}
        <div className="border-t border-purple-500/20 pt-6 mt-12 flex items-center justify-between gap-4">
          {prevChapter ? (
            <button
              onClick={() =>
                setView({ type: 'reader', seriesId: series.id, chapterId: prevChapter.id })
              }
              className="bg-purple-800 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-xl text-xs sm:text-sm flex items-center gap-2 shadow-lg transition"
            >
              <ChevronLeft size={18} />
              Önceki Bölüm
            </button>
          ) : (
            <div />
          )}

          {nextChapter ? (
            <button
              onClick={() =>
                setView({ type: 'reader', seriesId: series.id, chapterId: nextChapter.id })
              }
              className="bg-purple-800 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-xl text-xs sm:text-sm flex items-center gap-2 shadow-lg transition"
            >
              Sonraki Bölüm
              <ChevronRight size={18} />
            </button>
          ) : (
            <div />
          )}
        </div>

        {/* Comments Section */}
        <div className="mt-12">
          <CommentsSection seriesId={series.id} chapterId={currentChapter.id} />
        </div>

      </div>

    </div>
  );
};
