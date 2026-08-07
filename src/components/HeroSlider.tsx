import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { ChevronLeft, ChevronRight, Star, BookOpen, Flame } from 'lucide-react';
import { Series } from '../types';

export const HeroSlider: React.FC = () => {
  const { seriesList, setView } = useApp();
  const featuredSeries = seriesList.filter(s => s.isHot || s.rating >= 9.5).slice(0, 5);
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
    <div className="hero-slider-preserve-dark w-full relative overflow-hidden bg-gray-950 border-b border-purple-500/20 shadow-2xl group min-h-[380px] sm:min-h-[420px] md:min-h-[460px] flex items-center">
      
      {/* Blurred Background Layer using original series cover/banner artwork */}
      <div
        className="absolute inset-0 bg-cover bg-center filter blur-xl brightness-75 scale-110 transition-all duration-700 pointer-events-none opacity-90"
        style={{ backgroundImage: `url(${bgImage})` }}
      />

      {/* Subtle Dark Vignette & Gradient Overlay for readability */}
      <div className="hero-gradient-overlay absolute inset-0 bg-gradient-to-r from-gray-950/85 via-gray-950/60 to-black/40 z-10 pointer-events-none backdrop-brightness-90" />

      {/* Content Container */}
      <div className="relative z-20 max-w-7xl mx-auto w-full px-4 sm:px-12 md:px-16 py-6 sm:py-8 flex flex-row items-center gap-4 sm:gap-6 md:gap-10">
        
        {/* Cover Image & Badges */}
        <div className="relative flex-shrink-0 w-32 sm:w-44 md:w-52 group-hover:scale-105 transition-transform duration-300">
          <img
            src={current.coverImage}
            alt={current.title}
            className="w-full aspect-[2/3] object-cover rounded-xl sm:rounded-2xl shadow-2xl border-2 border-purple-500/50"
          />
          
          {/* Age Rating Badge */}
          {current.ageRating && current.ageRating !== 'Genel' && (
            <span className="absolute top-1.5 left-1.5 sm:top-2 sm:left-2 bg-red-700 text-white font-extrabold text-[10px] sm:text-[11px] px-1.5 py-0.5 rounded shadow-md border border-red-500">
              {current.ageRating}
            </span>
          )}

          {/* Hot badge */}
          {current.isHot && (
            <span className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 bg-amber-500 text-black font-extrabold text-[10px] uppercase px-1.5 py-0.5 rounded shadow-md flex items-center gap-0.5 sm:gap-1">
              <Flame size={11} className="fill-current text-black sm:w-3 sm:h-3" />
              Sıcak
            </span>
          )}

          {/* Star Rating */}
          <div className="flex items-center justify-center gap-1 mt-2 sm:mt-3 bg-black/70 backdrop-blur-md py-1 px-2.5 sm:px-3 rounded-full border border-white/10 w-fit mx-auto shadow-md">
            <div className="flex">{renderStars(current.rating)}</div>
            <span className="text-xs font-bold text-amber-300 ml-0.5">
              {current.rating}
            </span>
          </div>
        </div>

        {/* Details */}
        <div className="flex-1 min-w-0 flex flex-col justify-center text-left">
          
          {/* Tags / Badges */}
          <div className="flex flex-wrap items-center justify-start gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
            <span className="bg-purple-600/90 text-white border border-purple-400/40 text-[10px] sm:text-xs font-bold px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full uppercase tracking-wider shadow">
              {current.type}
            </span>
            <span className="bg-indigo-600/90 text-white border border-indigo-400/40 text-[10px] sm:text-xs font-bold px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full shadow">
              {current.status}
            </span>
            <span className="text-[11px] sm:text-xs text-purple-200 font-semibold drop-shadow">
              {current.chapters.length} Bölüm
            </span>
          </div>

          {/* Title */}
          <h2
            onClick={() => setView({ type: 'series-detail', seriesId: current.id })}
            className="text-lg sm:text-2xl md:text-3xl lg:text-4xl font-extrabold text-white hover:text-purple-300 cursor-pointer transition line-clamp-2 leading-snug drop-shadow-md"
          >
            {current.title}
          </h2>

          {/* Genres */}
          <div className="flex flex-wrap justify-start gap-1 sm:gap-1.5 my-2 sm:my-3">
            {current.genres.slice(0, 5).map(g => (
              <span
                key={g}
                className="bg-black/60 backdrop-blur-sm text-gray-200 border border-gray-600/60 text-[10px] sm:text-[11px] px-2 sm:px-2.5 py-0.5 rounded-md font-medium"
              >
                {g}
              </span>
            ))}
          </div>

          {/* Synopsis */}
          <p className="text-xs sm:text-sm text-gray-200 line-clamp-2 sm:line-clamp-3 leading-relaxed mb-3 sm:mb-5 max-w-2xl drop-shadow">
            {current.synopsis}
          </p>

          {/* Read Buttons */}
          <div className="mt-auto flex items-center justify-start gap-2.5 sm:gap-3">
            <button
              onClick={() => setView({ type: 'series-detail', seriesId: current.id })}
              className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs sm:text-sm px-5 sm:px-7 py-2 sm:py-3 rounded-full shadow-xl hover:shadow-purple-500/30 hover:scale-105 active:scale-95 transition-all flex items-center gap-1.5 sm:gap-2 border border-purple-400/30"
            >
              <BookOpen size={15} className="sm:w-4 sm:h-4" />
              Hemen Oku
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
                className="bg-black/40 hover:bg-black/60 text-purple-200 hover:text-white font-semibold text-xs px-3.5 sm:px-5 py-2 sm:py-3 rounded-full border border-white/20 backdrop-blur-sm transition"
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
        className="absolute left-1 sm:left-4 md:left-6 top-1/2 -translate-y-1/2 z-30 p-1.5 sm:p-3 rounded-full bg-black/60 hover:bg-purple-600 text-white border border-white/10 backdrop-blur-md transition hover:scale-110 shadow-xl"
        aria-label="Önceki"
      >
        <ChevronLeft size={16} className="sm:w-5 sm:h-5" />
      </button>

      <button
        onClick={handleNext}
        className="absolute right-1 sm:right-4 md:right-6 top-1/2 -translate-y-1/2 z-30 p-1.5 sm:p-3 rounded-full bg-black/60 hover:bg-purple-600 text-white border border-white/10 backdrop-blur-md transition hover:scale-110 shadow-xl"
        aria-label="Sonraki"
      >
        <ChevronRight size={16} className="sm:w-5 sm:h-5" />
      </button>

      {/* Dots Indicators */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1.5">
        {featuredSeries.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentIndex(idx)}
            className={`h-2 rounded-full transition-all duration-300 ${
              idx === currentIndex ? 'w-6 bg-purple-400' : 'w-2 bg-gray-600 hover:bg-gray-400'
            }`}
            aria-label={`Slayt ${idx + 1}`}
          />
        ))}
      </div>

    </div>
  );
};
