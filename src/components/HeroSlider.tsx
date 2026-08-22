import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { ChevronLeft, ChevronRight, Star, BookOpen, Flame } from 'lucide-react';
import { Series, isSeries18Plus } from '../types';

export const HeroSlider: React.FC = () => {
  const { seriesList, setView, showNsfw } = useApp();
  const visibleSeriesList = showNsfw ? seriesList : seriesList.filter(s => !isSeries18Plus(s));
  const featuredSeries = visibleSeriesList.filter(s => s.isHot || s.rating >= 9.5).slice(0, 5);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (featuredSeries.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % featuredSeries.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [featuredSeries.length]);

  if (featuredSeries.length === 0) return null;

  const current: Series = featuredSeries[currentIndex];

  const renderStars = (rating: number) => {
    // scale from 10 to 5
    const score5 = rating / 2;
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      if (score5 >= i) {
        stars.push(<Star key={i} size={14} className="fill-amber-400 text-amber-400" />);
      } else if (score5 >= i - 0.5) {
        stars.push(<Star key={i} size={14} className="fill-amber-400 text-amber-400 opacity-60" />);
      } else {
        stars.push(<Star key={i} size={14} className="text-gray-500" />);
      }
    }
    return stars;
  };

  const handlePrev = () => {
    setCurrentIndex(prev => (prev - 1 + featuredSeries.length) % featuredSeries.length);
  };

  const handleNext = () => {
    setCurrentIndex(prev => (prev + 1) % featuredSeries.length);
  };

  const firstChapter = current.chapters[0];

  const bgImage = current.bannerImage || current.heroImage || current.coverImage;

  return (
    <div className="hero-slider-preserve-dark w-full relative overflow-hidden bg-gray-950 border-b border-purple-500/20 shadow-xl group flex items-center">
      
      {/* Blurred Background Layer using original series cover/banner artwork */}
      <div
        className="absolute inset-0 bg-cover bg-center filter blur-xl brightness-75 scale-110 transition-all duration-700 pointer-events-none opacity-90"
        style={{ backgroundImage: `url(${bgImage})` }}
      />

      {/* Subtle Dark Vignette & Gradient Overlay for readability */}
      <div className="hero-gradient-overlay absolute inset-0 bg-gradient-to-r from-gray-950/90 via-gray-950/70 to-black/50 z-10 pointer-events-none backdrop-brightness-90" />

      {/* Content Container - Symmetrical vertical padding */}
      <div className="relative z-20 max-w-7xl mx-auto w-full px-3 sm:px-10 md:px-16 py-6 sm:py-8 md:py-10 flex flex-row items-center gap-3 sm:gap-6 md:gap-10">
        
        {/* Cover Image & Badges */}
        <div className="relative flex-shrink-0 w-28 sm:w-44 md:w-52 group-hover:scale-105 transition-transform duration-300">
          <img
            src={current.coverImage}
            alt={current.title}
            className="w-full aspect-[2/3] object-cover rounded-xl sm:rounded-2xl shadow-xl border border-purple-500/40"
          />
          
          {/* Age Rating Badge */}
          {current.ageRating && current.ageRating !== 'Genel' && (
            <span className="absolute top-1 left-1 sm:top-2 sm:left-2 bg-red-700 text-white font-extrabold text-[9px] sm:text-[11px] px-1.5 py-0.5 rounded shadow-md border border-red-500">
              {current.ageRating}
            </span>
          )}

          {/* Hot badge */}
          {current.isHot && (
            <span className="absolute top-1 right-1 sm:top-2 sm:right-2 bg-amber-500 text-black font-extrabold text-[9px] sm:text-[10px] uppercase px-1.5 py-0.5 rounded shadow-md flex items-center gap-0.5 sm:gap-1">
              <Flame size={10} className="fill-current text-black sm:w-3 sm:h-3" />
              Sıcak
            </span>
          )}

          {/* 5-Star Rating Pill Under Cover */}
          <div className="flex items-center justify-center gap-1.5 mt-1.5 sm:mt-2.5 bg-black/90 px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full border border-neutral-800/80 shadow-md w-fit mx-auto">
            <div className="flex items-center gap-0.5">
              {[1, 2, 3, 4, 5].map((starIndex) => {
                const scoreOutOf5 = (current.rating || 0) / 2;
                const isFilled = scoreOutOf5 >= starIndex;
                const isHalf = !isFilled && scoreOutOf5 >= starIndex - 0.5;

                return (
                  <Star
                    key={starIndex}
                    size={11}
                    className={`transition-colors sm:w-3.5 sm:h-3.5 ${
                      isFilled
                        ? 'fill-amber-400 text-amber-400'
                        : isHalf
                        ? 'fill-amber-500/70 text-amber-500/70'
                        : 'fill-amber-950/60 text-amber-900/60'
                    }`}
                  />
                );
              })}
            </div>
            <span className="text-[11px] sm:text-xs font-black text-amber-400 ml-0.5 tracking-tight">
              {current.rating}
            </span>
          </div>
        </div>

        {/* Details */}
        <div className="flex-1 min-w-0 flex flex-col justify-center text-left">
          
          {/* Tags / Badges */}
          <div className="flex flex-wrap items-center justify-start gap-1 sm:gap-2 mb-1">
            <span className="bg-purple-600 text-white border border-purple-400/40 text-[9px] sm:text-xs font-bold px-2 sm:px-3 py-0.5 rounded-full uppercase tracking-wider shadow">
              {current.type}
            </span>
            <span className="bg-indigo-600 text-white border border-indigo-400/40 text-[9px] sm:text-xs font-bold px-2 sm:px-3 py-0.5 rounded-full shadow">
              {current.status}
            </span>
            <span className="text-[10px] sm:text-xs text-purple-200 font-semibold drop-shadow">
              {current.chapters.length} Bölüm
            </span>
          </div>

          {/* Title */}
          <h2
            onClick={() => setView({ type: 'series-detail', seriesId: current.id })}
            className="text-sm sm:text-2xl md:text-3xl lg:text-4xl font-extrabold text-white hover:text-purple-300 cursor-pointer transition line-clamp-2 leading-snug drop-shadow-md"
          >
            {current.title}
          </h2>

          {/* Genres */}
          <div className="flex flex-wrap justify-start gap-1 sm:gap-1.5 my-1 sm:my-2.5">
            {current.genres.slice(0, 4).map(g => (
              <span
                key={g}
                className="bg-black/60 backdrop-blur-sm text-gray-200 border border-gray-600/60 text-[9px] sm:text-[11px] px-1.5 sm:px-2.5 py-0.5 rounded-md font-medium"
              >
                {g}
              </span>
            ))}
          </div>

          {/* Synopsis */}
          <p className="text-[10px] sm:text-sm text-gray-300 line-clamp-2 sm:line-clamp-3 leading-relaxed mb-2 sm:mb-4 max-w-2xl drop-shadow">
            {current.synopsis}
          </p>

          {/* Read Buttons */}
          <div className="mt-auto flex items-center justify-start gap-2 sm:gap-3">
            <button
              onClick={() => setView({ type: 'series-detail', seriesId: current.id })}
              className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs sm:text-sm px-3.5 sm:px-7 py-1.5 sm:py-2.5 rounded-full shadow-lg hover:shadow-purple-500/30 hover:scale-105 active:scale-95 transition-all flex items-center gap-1 sm:gap-2 border border-purple-400/30"
            >
              <BookOpen size={13} className="sm:w-4 sm:h-4" />
              Oku
            </button>

            {firstChapter && (
              <button
                onClick={() =>
                  setView({
                    type: 'reader',
                    seriesId: current.id,
                    chapterId: firstChapter.id
                  })
                }
                className="bg-black/50 hover:bg-black/70 text-purple-200 hover:text-white font-semibold text-xs px-3 sm:px-5 py-1.5 sm:py-2.5 rounded-full border border-white/20 backdrop-blur-sm transition"
              >
                İlk Bölüm
              </button>
            )}
          </div>

        </div>
      </div>

      {/* Navigation Arrows */}
      <button
        onClick={handlePrev}
        className="absolute left-1 sm:left-4 md:left-6 top-1/2 -translate-y-1/2 z-30 p-1 sm:p-2.5 rounded-full bg-black/60 hover:bg-purple-600 text-white border border-white/10 backdrop-blur-md transition hover:scale-110 shadow-xl opacity-80 sm:opacity-100"
        aria-label="Önceki"
      >
        <ChevronLeft size={16} className="sm:w-5 sm:h-5" />
      </button>

      <button
        onClick={handleNext}
        className="absolute right-1 sm:right-4 md:right-6 top-1/2 -translate-y-1/2 z-30 p-1 sm:p-2.5 rounded-full bg-black/60 hover:bg-purple-600 text-white border border-white/10 backdrop-blur-md transition hover:scale-110 shadow-xl opacity-80 sm:opacity-100"
        aria-label="Sonraki"
      >
        <ChevronRight size={16} className="sm:w-5 sm:h-5" />
      </button>

      {/* Dots Indicators */}
      <div className="absolute bottom-1.5 sm:bottom-3 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1.5">
        {featuredSeries.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentIndex(idx)}
            className={`h-1.5 sm:h-2 rounded-full transition-all duration-300 ${
              idx === currentIndex ? 'w-5 sm:w-6 bg-purple-400' : 'w-1.5 sm:w-2 bg-gray-600 hover:bg-gray-400'
            }`}
            aria-label={`Slayt ${idx + 1}`}
          />
        ))}
      </div>

    </div>
  );
};
