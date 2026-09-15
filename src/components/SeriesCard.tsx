import React from 'react';
import { useApp } from '../context/AppContext';
import { Series, isSeries18Plus } from '../types';
import { Star, Bell, Bookmark, Flame, Sparkles, RefreshCw } from 'lucide-react';
import { checkIsChapterNew } from '../utils/dateUtils';
import { ChapterSpecialBadge } from './ChapterSpecialBadge';
import { DiagonalStatusRibbon } from './DiagonalStatusRibbon';
import { getOptimizedImageUrl } from '../utils/imageUtils';

interface SeriesCardProps {
  series: Series;
  layout?: 'grid' | 'horizontal';
  showExtraTags?: boolean;
  maxChapters?: number;
}

export const SeriesCard: React.FC<SeriesCardProps> = ({
  series,
  layout = 'grid',
  showExtraTags = false,
  maxChapters = 1,
}) => {
  const { setView, bookmarks } = useApp();
  const isBookmarked = !!bookmarks[series.id];

  const recentChapters = series.chapters.slice(-maxChapters).reverse();

  const getTypeStyle = (type: Series['type']) => {
    switch (type) {
      case 'Manhwa':
        return 'bg-emerald-700 text-white';
      case 'Web Novel':
        return 'bg-purple-700 text-white';
      case 'Webtoon':
        return 'bg-amber-600 text-black font-extrabold';
      case 'Manga':
        return 'bg-rose-700 text-white';
      case 'Manhua':
        return 'bg-blue-600 text-white';
      default:
        return 'bg-indigo-700 text-white';
    }
  };

  if (layout === 'horizontal') {
    return (
      <div className="bg-gray-900/90 border border-purple-500/20 rounded-2xl p-3 flex gap-3 shadow-md hover:shadow-purple-500/10 hover:border-purple-500/40 transition group">
        <div
          onClick={() => setView({ type: 'series-detail', seriesId: series.id })}
          className="relative w-24 aspect-[2/3] flex-shrink-0 cursor-pointer overflow-hidden rounded-xl border border-purple-500/20 self-start"
        >
          {/* Top-Left Diagonal Status Ribbon */}
          <DiagonalStatusRibbon status={series.status} size="sm" />

          <img
            src={getOptimizedImageUrl(series.coverImage, { width: 100, height: 150, quality: 65 })}
            alt={series.title}
            width="96"
            height="144"
            decoding="async"
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <span className={`absolute bottom-1 right-1 text-[10px] font-bold px-1.5 py-0.5 rounded ${getTypeStyle(series.type)}`}>
            {series.type}
          </span>
        </div>

        <div className="flex-1 min-w-0 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-1 mb-1">
              <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wide">
                {series.status}
              </span>
              <div className="flex items-center gap-0.5 text-xs text-amber-400 font-bold">
                <Star size={12} className="fill-amber-400" />
                {series.rating}
              </div>
            </div>

            <h3
              onClick={() => setView({ type: 'series-detail', seriesId: series.id })}
              className="text-xs sm:text-sm font-bold text-gray-100 hover:text-purple-300 cursor-pointer transition line-clamp-2 leading-snug"
            >
              {series.title}
            </h3>
          </div>

          {/* Chapters Preview */}
          <div className="space-y-1 mt-2">
            {recentChapters.map(ch => (
              <button
                key={ch.id}
                onClick={() => setView({ type: 'reader', seriesId: series.id, chapterId: ch.id })}
                className="w-full flex items-center justify-between text-[11px] bg-purple-950/40 hover:bg-purple-900/60 border border-purple-800/40 px-2 py-1 rounded text-purple-200 transition"
              >
                <span className="truncate max-w-[130px] font-medium">{ch.title}</span>
                <span className="text-[10px] text-gray-400">{ch.publishedDate}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-900/90 border border-purple-500/20 hover:border-purple-500/40 rounded-2xl sm:rounded-3xl p-2.5 sm:p-3 shadow-xl hover:shadow-purple-900/20 transition-all duration-300 flex flex-col group space-y-2.5">
      
      {/* Framed Poster Image Section */}
      <div
        onClick={() => setView({ type: 'series-detail', seriesId: series.id })}
        className="relative aspect-[3/4] rounded-xl sm:rounded-2xl overflow-hidden cursor-pointer bg-gray-950 border border-purple-500/20 shadow-md group-hover:border-purple-500/40 transition-all duration-300"
      >
        {/* Top-Left Diagonal Status Ribbon */}
        <DiagonalStatusRibbon status={series.status} size="md" />

        <img
          src={getOptimizedImageUrl(series.coverImage, { width: 220, height: 293, quality: 68 })}
          alt={series.title}
          width="180"
          height="240"
          decoding="async"
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />

        {/* Type Badge */}
        <span className={`absolute bottom-2 right-2 text-[10px] font-extrabold px-2 py-0.5 rounded-md shadow-md backdrop-blur-sm ${getTypeStyle(series.type)}`}>
          {series.type}
        </span>

        {/* Top-Right Badges: Rating & Bookmark */}
        <div className="absolute top-2 right-2 flex items-center gap-1.5 z-10">
          <div className="bg-black/80 backdrop-blur-sm text-amber-300 font-extrabold text-[11px] px-2 py-0.5 rounded-full flex items-center gap-1 border border-white/10 shadow-md">
            <Star size={11} className="fill-amber-400 text-amber-400" />
            {series.rating}
          </div>
          {isBookmarked && (
            <div className="bg-purple-600 text-white p-1 rounded-full shadow-md">
              <Bookmark size={13} className="fill-current" />
            </div>
          )}
        </div>

        {/* Hot / New / Güncel / 18+ Badges */}
        <div className="absolute bottom-2 left-2 flex flex-col gap-1 items-start z-10">
          {isSeries18Plus(series) && (
            <div className="bg-rose-900/90 border border-rose-500/60 text-white text-[10px] font-black px-1.5 py-0.5 rounded shadow-md">
              18+
            </div>
          )}
          {series.isHot && (
            <div className="bg-red-600 text-white text-[10px] font-extrabold px-1.5 py-0.5 rounded flex items-center gap-0.5 shadow-md">
              <Flame size={12} className="fill-current" />
              SICAK
            </div>
          )}
          {series.isNew && !series.isHot && (
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-[10px] font-extrabold px-1.5 py-0.5 rounded flex items-center gap-0.5 shadow-md border border-purple-300/30">
              <Sparkles size={11} />
              YENİ
            </div>
          )}
          {(series.isGuncel || series.status === 'Güncel') && (
            <div className="bg-gradient-to-r from-cyan-600 via-sky-600 to-blue-600 text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded flex items-center gap-0.5 shadow-md border border-cyan-300/40">
              <RefreshCw size={9} className="animate-spin-slow" />
              GÜNCEL
            </div>
          )}
        </div>
      </div>

      {/* Details & Chapters */}
      <div className="flex-1 flex flex-col justify-between space-y-2 px-0.5 pt-0.5">
        <div>
          <h3
            onClick={() => setView({ type: 'series-detail', seriesId: series.id })}
            className="text-xs sm:text-sm font-bold text-gray-100 hover:text-purple-300 cursor-pointer transition line-clamp-2 leading-snug min-h-[2.4rem]"
          >
            {series.title}
          </h3>

          {/* Custom Badges / Extra Tags */}
          {showExtraTags && series.customBadges && series.customBadges.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {series.customBadges.map(badge => (
                <span
                  key={badge}
                  className="bg-purple-950/80 border border-purple-500/30 text-purple-300 text-[9px] font-bold px-1.5 py-0.5 rounded"
                >
                  {badge}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Chapters list */}
        <div className="space-y-1.5 pt-1 border-t border-gray-800/80">
          {recentChapters.length === 0 ? (
            <div className="text-[11px] text-gray-500 italic">Bölüm eklenmedi</div>
          ) : (
            recentChapters.map(ch => (
              <button
                key={ch.id}
                onClick={() => setView({ type: 'reader', seriesId: series.id, chapterId: ch.id })}
                className="w-full flex items-center justify-between text-[11px] bg-purple-950/40 hover:bg-purple-800/60 border border-purple-800/30 px-2 py-1 rounded-lg text-purple-200 transition group/btn"
              >
                <div className="flex items-center gap-1 min-w-0 flex-1">
                  <span className="font-semibold truncate text-gray-200 group-hover/btn:text-purple-200">
                    {ch.title}
                  </span>
                  {ch.specialTag && (
                    <ChapterSpecialBadge tag={ch.specialTag} size="xs" />
                  )}
                  {checkIsChapterNew(ch, 24) && (
                    <span className="text-[9px] bg-emerald-600 text-white px-1 rounded font-bold uppercase flex-shrink-0 animate-pulse">
                      YENİ
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-gray-400 flex-shrink-0 ml-1">
                  {ch.publishedDate}
                </span>
              </button>
            ))
          )}
        </div>
      </div>

    </div>
  );
};
