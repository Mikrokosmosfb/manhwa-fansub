import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Star, 
  Flame, 
  BookOpen, 
  Clock, 
  Play, 
  Eye, 
  Sparkles, 
  Layers, 
  Zap,
  Bookmark
} from 'lucide-react';
import { isSeries18Plus } from '../types';
import { getSeriesLatestActivityTime } from '../utils/dateUtils';
import { getOptimizedImageUrl } from '../utils/imageUtils';

export const HeroSlider: React.FC = () => {
  const { seriesList, setView, showNsfw } = useApp();

  const visibleSeriesList = showNsfw ? seriesList : seriesList.filter(s => !isSeries18Plus(s));
  // En son güncellenen 7 seriyi göster
  const featuredSeries = [...visibleSeriesList]
    .sort((a, b) => getSeriesLatestActivityTime(b) - getSeriesLatestActivityTime(a))
    .slice(0, 7);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [direction, setDirection] = useState<1 | -1>(1);
  const isFirstMount = useRef(true);
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  useEffect(() => {
    isFirstMount.current = false;
  }, []);

  // Auto-play timer
  useEffect(() => {
    if (featuredSeries.length <= 1 || isPaused) return;
    const timer = setInterval(() => {
      setDirection(1);
      setCurrentIndex(prev => (prev + 1) % featuredSeries.length);
    }, 6500);
    return () => clearInterval(timer);
  }, [featuredSeries.length, isPaused, currentIndex]);

  if (featuredSeries.length === 0) {
    return (
      <section 
        aria-label="Öne Çıkan Seriler" 
        className="relative w-full bg-neutral-950 overflow-hidden border-b border-purple-500/20 min-h-[420px] sm:min-h-[440px] md:min-h-[460px] flex items-center justify-center"
      >
        <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12 py-6 sm:py-8 flex flex-col md:flex-row items-center justify-between gap-6 md:gap-10 animate-pulse">
          {/* Mobile Cover Poster Skeleton */}
          <div className="md:hidden w-32 aspect-[2/3] bg-purple-950/60 rounded-2xl border border-purple-800/40 shrink-0" />
          
          <div className="flex-1 w-full space-y-3 sm:space-y-4 text-center md:text-left flex flex-col items-center md:items-start">
            <div className="h-6 bg-purple-950/60 rounded-lg w-48 border border-purple-800/30" />
            <div className="h-8 sm:h-12 bg-purple-900/40 rounded-xl w-3/4 max-w-md border border-purple-700/20" />
            <div className="h-4 bg-purple-950/40 rounded w-full max-w-lg hidden sm:block" />
            <div className="h-4 bg-purple-950/30 rounded w-4/5 max-w-md hidden sm:block" />
            <div className="flex gap-3 pt-2">
              <div className="h-10 sm:h-11 bg-purple-600/40 rounded-xl w-32 sm:w-36" />
              <div className="h-10 sm:h-11 bg-neutral-900/60 rounded-xl w-28 sm:w-32 border border-purple-500/20" />
            </div>
          </div>
          {/* Desktop Cover Poster Skeleton */}
          <div className="hidden md:block w-56 lg:w-72 aspect-[2/3] bg-purple-950/50 rounded-2xl border border-purple-800/40 shrink-0" />
        </div>
      </section>
    );
  }

  const current = featuredSeries[currentIndex] || featuredSeries[0];
  const sortedChapters = [...(current.chapters || [])].sort((a, b) => (b.chapterNumber || 0) - (a.chapterNumber || 0));
  const firstChapter = sortedChapters[sortedChapters.length - 1];
  const latestChapter = sortedChapters[0];

  const handlePrev = () => {
    setDirection(-1);
    setCurrentIndex(prev => (prev - 1 + featuredSeries.length) % featuredSeries.length);
  };

  const handleNext = () => {
    setDirection(1);
    setCurrentIndex(prev => (prev + 1) % featuredSeries.length);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    const diff = touchStartX.current - touchEndX.current;
    if (diff > 45) handleNext();
    else if (diff < -45) handlePrev();
    touchStartX.current = null;
    touchEndX.current = null;
  };

  return (
    <section 
      aria-label="Öne Çıkan Seriler" 
      className="relative w-full bg-neutral-950 overflow-hidden select-none border-b border-purple-500/20 min-h-[420px] sm:min-h-[440px] md:min-h-[460px]"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Dynamic Background Atmosphere (Tek Arka Plan Görseli) */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`bg-${current.id}`}
          initial={isFirstMount.current ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="absolute inset-0 pointer-events-none overflow-hidden"
        >
          {/* Tek Arka Plan Görseli */}
          <img
            src={getOptimizedImageUrl(current.bannerImage || current.heroImage || current.coverImage, { width: 720, quality: 65 })}
            srcSet={`
              ${getOptimizedImageUrl(current.bannerImage || current.heroImage || current.coverImage, { width: 420, quality: 60 })} 420w,
              ${getOptimizedImageUrl(current.bannerImage || current.heroImage || current.coverImage, { width: 720, quality: 65 })} 720w,
              ${getOptimizedImageUrl(current.bannerImage || current.heroImage || current.coverImage, { width: 1200, quality: 70 })} 1200w
            `}
            sizes="(max-width: 640px) 420px, (max-width: 1024px) 720px, 1200px"
            alt=""
            width="1200"
            height="420"
            fetchPriority="high"
            decoding="async"
            className="absolute inset-0 w-full h-full object-cover object-center filter brightness-[0.42] contrast-105"
          />

          {/* Okunabilirlik ve estetik degrade geçişleri */}
          <div className="absolute inset-0 bg-gradient-to-r from-neutral-950/95 via-neutral-950/75 to-neutral-950/40" />
          <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-transparent to-neutral-950/70" />
          <div className="absolute inset-0 bg-[radial-gradient(#a855f7_1px,transparent_1px)] [background-size:24px_24px] opacity-15" />
        </motion.div>
      </AnimatePresence>

      {/* Main Interactive Slider Showcase */}
      <div className="relative z-10 w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12 pt-4 sm:pt-6 pb-3 sm:pb-5 flex flex-col justify-between">
        
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div 
            key={current.id}
            custom={direction}
            initial={isFirstMount.current ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="flex-1 flex flex-col md:flex-row items-center md:items-center justify-between gap-6 md:gap-10 lg:gap-14 my-auto py-2"
          >
            
            {/* =========================================================================
                MOBİL GÖRÜNÜM: ÜSTTE ORTALANMIŞ KAPAK RESMİ
                ========================================================================= */}
            <div className="md:hidden flex flex-col items-center w-full">
              <div 
                onClick={() => setView({ type: 'series-detail', seriesId: current.id })}
                className="relative group/mob cursor-pointer w-32 sm:w-40 aspect-[2/3] rounded-2xl overflow-hidden shadow-[0_15px_40px_rgba(0,0,0,0.9)] ring-2 ring-purple-500/40 hover:ring-purple-400 transition-all duration-300 transform active:scale-95 bg-gray-950"
              >
                <img 
                  src={getOptimizedImageUrl(current.coverImage, { width: 180, height: 270, quality: 70 })} 
                  alt={current.title}
                  width="160"
                  height="240"
                  className="w-full h-full object-cover"
                  loading="eager"
                  fetchPriority="high"
                  decoding="async"
                />

                {/* Shimmer Light */}
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent opacity-0 group-hover/mob:opacity-100 transition-opacity duration-300 pointer-events-none" />

                {/* Format Badge */}
                <div className="absolute top-2 left-2">
                  <span className="bg-purple-600/95 text-white font-black text-[10px] px-2 py-0.5 rounded-md shadow uppercase tracking-wider border border-purple-400/40 flex items-center gap-1">
                    <Layers size={10} />
                    {current.type || 'Manhwa'}
                  </span>
                </div>

                {/* Trend Hot Badge */}
                {current.isHot && (
                  <div className="absolute top-2 right-2 bg-gradient-to-r from-amber-500 to-red-500 text-white font-black text-[10px] px-2 py-0.5 rounded-md shadow flex items-center gap-1 uppercase tracking-tight animate-pulse border border-amber-300/40">
                    <Flame size={10} className="fill-current text-white" />
                    HOT
                  </div>
                )}
              </div>
            </div>

            {/* =========================================================================
                SOL / MERKEZ KOLON (Detaylar, Başlık, Özet, Butonlar)
                ========================================================================= */}
            <div className="flex-1 min-w-0 w-full flex flex-col justify-center text-center md:text-left">
              
              {/* Badges (Mobile & Desktop) */}
              <div className="flex items-center justify-center md:justify-start gap-2 sm:gap-2.5 flex-wrap mb-2.5 sm:mb-3">
                {/* Glowing Gold Rating Pill */}
                <div className="bg-gradient-to-r from-amber-500/20 via-yellow-500/15 to-amber-500/20 border border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.25)] text-amber-300 px-3 py-1 rounded-lg flex items-center gap-1.5 backdrop-blur-md">
                  <div className="flex items-center gap-0.5">
                    <Star size={13} className="fill-amber-400 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.8)]" />
                  </div>
                  <span className="font-black text-xs sm:text-sm text-white tracking-tight">{current.rating ? Number(current.rating).toFixed(1) : '9.5'}</span>
                  <span className="text-[10px] text-amber-400/70 font-semibold">/10</span>
                </div>

                <span className="bg-purple-600 text-white text-[11px] sm:text-xs font-black uppercase tracking-wider px-2.5 sm:px-3 py-1 rounded-lg shadow-sm flex items-center gap-1">
                  <Sparkles size={13} />
                  {current.type || 'Manhwa'}
                </span>
                <span className="bg-neutral-900/90 text-purple-300 border border-purple-500/30 text-[11px] sm:text-xs font-bold px-2.5 sm:px-3 py-1 rounded-lg flex items-center gap-1.5 backdrop-blur-md">
                  <Clock size={13} className="text-purple-400" />
                  {current.status}
                </span>
                <span className="text-[11px] sm:text-xs text-neutral-300 font-semibold bg-neutral-900/80 border border-white/10 px-2.5 py-1 rounded-lg flex items-center gap-1.5">
                  <Bookmark size={12} className="text-purple-400" />
                  {current.chapters?.length || 0} Bölüm Yüklendi
                </span>
                {current.ageRating && current.ageRating !== 'Genel' && (
                  <span className="bg-red-600/90 text-white text-[11px] sm:text-xs font-black px-2.5 py-0.5 rounded-md border border-red-400/30">
                    {current.ageRating}
                  </span>
                )}
              </div>

              {/* Title */}
              <h1 
                onClick={() => setView({ type: 'series-detail', seriesId: current.id })}
                className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-black text-white hover:text-purple-400 cursor-pointer transition-colors duration-200 line-clamp-2 leading-[1.18] drop-shadow-xl mb-2.5 sm:mb-3.5"
              >
                {current.title}
              </h1>

              {/* Genres */}
              <div className="flex flex-wrap justify-center md:justify-start gap-1.5 sm:gap-2 mb-3 sm:mb-4">
                {current.genres?.map(g => (
                  <span 
                    key={g} 
                    className="text-[11px] sm:text-xs font-semibold text-neutral-300 bg-neutral-900/90 hover:bg-neutral-800 border border-neutral-700/60 px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-lg transition hover:text-white hover:border-purple-500/50 cursor-pointer"
                  >
                    {g}
                  </span>
                ))}
              </div>

              {/* Synopsis */}
              <p className="text-xs sm:text-sm md:text-base text-neutral-200/90 line-clamp-3 leading-relaxed mb-4 sm:mb-6 font-normal max-w-2xl mx-auto md:mx-0 drop-shadow-sm">
                {current.synopsis || 'Bu serinin detaylı açıklaması henüz girilmemiştir. Hemen okumaya başlayabilirsiniz!'}
              </p>

              {/* Action Buttons */}
              <div className="flex items-center justify-center md:justify-start gap-2 sm:gap-3 flex-wrap">
                {/* Primary Detail Button */}
                <button
                  onClick={() => setView({ type: 'series-detail', seriesId: current.id })}
                  className="group relative flex-1 sm:flex-none flex items-center justify-center gap-1.5 sm:gap-2 bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-xs sm:text-sm px-6 sm:px-9 py-2.5 sm:py-3.5 rounded-xl shadow-[0_0_20px_rgba(147,51,234,0.35)] hover:scale-[1.02] active:scale-95 transition-all overflow-hidden"
                >
                  <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out pointer-events-none" />
                  <BookOpen size={16} className="sm:w-4 sm:h-4" />
                  <span>Seri Detayı</span>
                </button>

                {/* First Chapter Button */}
                {firstChapter && (
                  <button
                    onClick={() => setView({ type: 'reader', seriesId: current.id, chapterId: firstChapter.id })}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 sm:gap-2 bg-neutral-900/90 hover:bg-neutral-800 text-purple-200 hover:text-white font-bold text-xs sm:text-sm px-5 sm:px-7 py-2.5 sm:py-3.5 rounded-xl border border-white/15 hover:border-purple-500/50 backdrop-blur-md transition-all hover:scale-[1.02] active:scale-95 shadow-md"
                  >
                    <Play size={14} className="fill-current text-purple-400 sm:w-4 sm:h-4" />
                    <span>İlk Bölüm</span>
                  </button>
                )}
              </div>

            </div>

            {/* =========================================================================
                SAĞ KOLON (Masaüstü: Büyük 3D Kapak Resmi & Simetri Sağlayıcı Panel)
                ========================================================================= */}
            <div className="hidden md:flex flex-col items-center justify-center shrink-0">
              <div 
                onClick={() => setView({ type: 'series-detail', seriesId: current.id })}
                className="relative group/cover cursor-pointer w-48 sm:w-56 md:w-60 lg:w-72 aspect-[2/3] rounded-2xl overflow-hidden shadow-[0_25px_60px_rgba(0,0,0,0.95)] ring-2 ring-white/15 hover:ring-purple-500/80 transition-all duration-500 transform hover:scale-[1.03] hover:-translate-y-2 bg-gray-950"
              >
                <img 
                  src={getOptimizedImageUrl(current.coverImage, { width: 360, quality: 75 })} 
                  alt={current.title}
                  width="288"
                  height="432"
                  className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover/cover:scale-105"
                  loading="eager"
                  fetchPriority="high"
                  decoding="async"
                />

                {/* Shimmer / Gloss Light Sweep */}
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent opacity-0 group-hover/cover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                {/* Manga Type Badge Top Left */}
                <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                  <span className="bg-purple-600/95 backdrop-blur-md text-white font-black text-xs px-3 py-1 rounded-lg shadow-lg uppercase tracking-wider border border-purple-400/40 flex items-center gap-1.5">
                    <Layers size={13} />
                    {current.type || 'Manhwa'}
                  </span>
                </div>

                {/* Trend Hot Badge Top Right */}
                {current.isHot && (
                  <div className="absolute top-3 right-3 bg-gradient-to-r from-amber-500 to-red-500 text-white font-black text-xs px-3 py-1 rounded-lg shadow-lg flex items-center gap-1 uppercase tracking-tight animate-pulse border border-amber-300/40">
                    <Flame size={13} className="fill-current text-white" />
                    HOT
                  </div>
                )}
              </div>
            </div>

          </motion.div>
        </AnimatePresence>

        {/* Bottom Thumbnail Bar & Navigation */}
        <div className="mt-3 sm:mt-4 pt-2.5 sm:pt-3 border-t border-white/10 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 w-full">
            {featuredSeries.map((s, idx) => {
              const isSelected = idx === currentIndex;
              return (
                <button
                  key={s.id}
                  onClick={() => {
                    setDirection(idx > currentIndex ? 1 : -1);
                    setCurrentIndex(idx);
                  }}
                  className={`shrink-0 flex items-center gap-2 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl border transition-all duration-300 text-left ${
                    isSelected
                      ? 'bg-purple-600/30 border-purple-400 text-white shadow-[0_0_15px_rgba(147,51,234,0.3)] ring-1 ring-purple-400/50 scale-[1.02]'
                      : 'bg-neutral-900/80 hover:bg-neutral-800/90 border-neutral-800 text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  <img 
                    src={getOptimizedImageUrl(s.coverImage, { width: 80, height: 110, quality: 65 })} 
                    alt="" 
                    width="24"
                    height="32"
                    loading="lazy"
                    decoding="async"
                    className="w-5 sm:w-6 h-7 sm:h-8 object-cover rounded shrink-0 border border-white/10"
                  />
                  <div className="max-w-[100px] sm:max-w-[150px] truncate">
                    <p className={`text-[11px] sm:text-xs font-bold truncate ${isSelected ? 'text-purple-200 font-extrabold' : 'text-neutral-300'}`}>
                      {s.title}
                    </p>
                    <p className="text-[9px] sm:text-[10px] text-neutral-500 truncate flex items-center gap-1.5">
                      <span>{s.type || 'Manga'}</span>
                      <span>•</span>
                      <span className="text-amber-400 font-bold flex items-center gap-0.5">
                        <Star size={9} className="fill-amber-400 text-amber-400" />
                        {s.rating ? Number(s.rating).toFixed(1) : '9.0'}
                      </span>
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Desktop Navigation Buttons */}
          <div className="hidden md:flex items-center gap-2 shrink-0">
            <button
              onClick={handlePrev}
              className="w-9 h-9 rounded-xl bg-neutral-900/90 hover:bg-purple-600 text-white border border-white/10 flex items-center justify-center transition hover:scale-105 shadow-md active:scale-90"
              aria-label="Önceki Seri"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={handleNext}
              className="w-9 h-9 rounded-xl bg-neutral-900/90 hover:bg-purple-600 text-white border border-white/10 flex items-center justify-center transition hover:scale-105 shadow-md active:scale-90"
              aria-label="Sonraki Seri"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

      </div>

      {/* Floating Side Arrows for Mobile Quick Nav */}
      <button
        onClick={handlePrev}
        className="md:hidden absolute left-1.5 top-1/3 -translate-y-1/2 z-20 w-7 h-7 rounded-full bg-neutral-950/80 text-white border border-white/20 flex items-center justify-center shadow-lg active:scale-90"
        aria-label="Önceki Seri"
      >
        <ChevronLeft size={14} />
      </button>
      <button
        onClick={handleNext}
        className="md:hidden absolute right-1.5 top-1/3 -translate-y-1/2 z-20 w-7 h-7 rounded-full bg-neutral-950/80 text-white border border-white/20 flex items-center justify-center shadow-lg active:scale-90"
        aria-label="Sonraki Seri"
      >
        <ChevronRight size={14} />
      </button>

    </section>
  );
};

