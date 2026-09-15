import React, { useRef } from 'react';
import { useApp } from '../context/AppContext';
import { Series, isSeries18Plus } from '../types';
import { Triangle, Star } from 'lucide-react';
import { DiagonalStatusRibbon } from './DiagonalStatusRibbon';
import { getOptimizedImageUrl } from '../utils/imageUtils';
import { WeeklyPopularSliderSkeleton } from './SkeletonLoader';

export const WeeklyPopularSlider: React.FC = () => {
  const { seriesList, setView, isLoadingSeries } = useApp();
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const amount = direction === 'left' ? -320 : 320;
      scrollRef.current.scrollBy({ left: amount, behavior: 'smooth' });
    }
  };

  // Filter or sort popular series for "Bu Haftanın Sevilenleri"
  const popularSeries = seriesList.filter(s => s.rating >= 8.0 || s.isHot || s.isNew).slice(0, 15);

  const getFlag = (s: Series) => {
    if (s.type === 'Manhua') return '🇨🇳';
    if (s.type === 'Manga') return '🇯🇵';
    return '🇰🇷'; // Default for Manhwa & Web Novel
  };

  const getGenreBadge = (s: Series) => {
    const isBL = s.genres.some(g => g.toLowerCase().includes('bl') || g.toLowerCase().includes('yaoi'));
    if (isBL) return '♂️ BL';
    if (s.type === 'Web Novel') return '📖 NOVEL';
    return `⚡ ${s.type.toUpperCase()}`;
  };

  return (
    <section className="w-full my-6">
      {/* Header Bar */}
      <div className="bg-gradient-to-r from-purple-800 via-indigo-700 to-blue-600 rounded-t-2xl px-3 sm:px-4 py-2.5 flex items-center justify-between border-t border-x border-purple-500/40 shadow-lg">
        {/* Title Badge */}
        <div className="bg-gray-950/90 border border-purple-500/30 text-white font-extrabold text-xs sm:text-sm px-3.5 py-1.5 rounded-xl flex items-center gap-2 shadow-md">
          <span className="text-amber-400 animate-pulse text-base">🔥</span>
          <span>Bu Haftanın Sevilenleri</span>
        </div>

        {/* Scroll Control Arrows */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => scroll('left')}
            className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center bg-blue-600/80 hover:bg-blue-500 text-white rounded-lg border border-white/20 transition active:scale-95 shadow-md cursor-pointer"
            title="Sola Kaydır"
          >
            <Triangle size={12} className="-rotate-90 fill-white text-white" />
          </button>
          <button
            onClick={() => scroll('right')}
            className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center bg-blue-600/80 hover:bg-blue-500 text-white rounded-lg border border-white/20 transition active:scale-95 shadow-md cursor-pointer"
            title="Sağa Kaydır"
          >
            <Triangle size={12} className="rotate-90 fill-white text-white" />
          </button>
        </div>
      </div>

      {/* Slider Body Container */}
      <div className="bg-gray-950/95 border-x border-b border-purple-500/30 rounded-b-2xl p-3 sm:p-4 shadow-2xl overflow-hidden min-h-[268px] sm:min-h-[298px] flex items-center">
        {isLoadingSeries || popularSeries.length === 0 ? (
          <WeeklyPopularSliderSkeleton />
        ) : (
          <div
            ref={scrollRef}
            className="w-full flex gap-3 sm:gap-4 overflow-x-auto no-scrollbar scroll-smooth snap-x py-1"
          >
            {popularSeries.map(s => {
            const is18 = isSeries18Plus(s);
            const flag = getFlag(s);
            const genreBadge = getGenreBadge(s);
            const isCompleted = s.status === 'Tamamlandı';

            return (
              <div
                key={s.id}
                onClick={() => setView({ type: 'series-detail', seriesId: s.id })}
                className="w-32 sm:w-40 flex-shrink-0 snap-start group cursor-pointer"
              >
                {/* Cover Image Wrapper */}
                <div className="relative aspect-[2/3] rounded-2xl overflow-hidden border-2 border-purple-500/50 group-hover:border-purple-400 group-hover:shadow-purple-500/30 group-hover:shadow-xl transition-all duration-300 bg-gray-900">
                  {/* Top-Left Diagonal Status Ribbon */}
                  <DiagonalStatusRibbon status={s.status} size="sm" />

                  <img
                    src={getOptimizedImageUrl(s.coverImage, { width: 140, height: 210, quality: 68 })}
                    alt={s.title}
                    width="128"
                    height="192"
                    decoding="async"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />

                  {/* Top-Right Flag Badge */}
                  <div className="absolute top-1.5 right-1.5 bg-white/90 dark:bg-gray-950/90 rounded px-1 py-0.5 border border-black/20 shadow text-xs flex items-center justify-center">
                    {flag}
                  </div>

                  {/* Bottom-Left Yellow Genre Badge */}
                  <div className="absolute bottom-2 left-2 bg-yellow-400 text-black font-extrabold text-[10px] px-1.5 py-0.5 rounded flex items-center gap-0.5 shadow-md">
                    {genreBadge}
                  </div>

                  {/* Bottom-Right 18+ Badge */}
                  {is18 && (
                    <div className="absolute bottom-2 right-2 bg-red-600 text-white font-black text-[10px] w-5 h-5 rounded-full flex items-center justify-center border border-red-300 shadow-md">
                      18+
                    </div>
                  )}
                </div>

                {/* Title Below Image */}
                <h4 className="text-xs sm:text-sm font-bold text-gray-100 group-hover:text-purple-300 line-clamp-2 mt-2 leading-snug transition min-h-[2.2rem]">
                  {s.title}
                </h4>

                {/* Star Rating & Numeric Rating */}
                <div className="flex items-center gap-1 mt-1">
                  <div className="flex items-center text-amber-400">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={11} className="fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <span className="text-[11px] font-bold text-gray-400 ml-1">
                    {s.rating.toFixed(s.rating % 1 === 0 ? 1 : 2)}
                  </span>
                </div>
              </div>
            );
          })}
          </div>
        )}
      </div>
    </section>
  );
};
