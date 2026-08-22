import React from 'react';
import { useApp } from '../context/AppContext';
import { Series } from '../types';
import { Sparkles, RefreshCw, Calendar, Star, ChevronRight } from 'lucide-react';
import { checkIsChapterNew } from '../utils/dateUtils';
import { ChapterSpecialBadge } from './ChapterSpecialBadge';
import { DiagonalStatusRibbon } from './DiagonalStatusRibbon';

interface HorizontalReleaseCardProps {
  series: Series;
  maxChapters?: number;
  showSynopsis?: boolean;
  showGenres?: boolean;
  compact?: boolean;
}

export const HorizontalReleaseCard: React.FC<HorizontalReleaseCardProps> = ({ 
  series, 
  maxChapters = 4,
  showSynopsis = false,
  showGenres = false,
  compact = false
}) => {
  const { setView } = useApp();

  // Take latest chapters based on maxChapters
  const recentChapters = [...series.chapters].reverse().slice(0, maxChapters);

  const getTypeBadgeClass = (type: Series['type']) => {
    switch (type) {
      case 'Manhwa':
        return 'bg-emerald-600 text-white';
      case 'Manhua':
        return 'bg-sky-600 text-white';
      case 'Webtoon':
        return 'bg-amber-600 text-black font-extrabold';
      case 'Manga':
        return 'bg-rose-600 text-white';
      case 'Web Novel':
        return 'bg-purple-600 text-white';
      default:
        return 'bg-teal-600 text-white';
    }
  };

  return (
    <div className="bg-gray-900/80 hover:bg-gray-900 border border-purple-500/15 hover:border-purple-500/40 rounded-2xl p-2.5 sm:p-3 flex gap-3 shadow-md hover:shadow-purple-900/20 transition-all duration-200 group">
      
      {/* Left: Cover Poster with Badges */}
      <div 
        onClick={() => setView({ type: 'series-detail', seriesId: series.id })}
        className="relative w-24 sm:w-28 md:w-32 aspect-[2/3] flex-shrink-0 rounded-xl sm:rounded-2xl overflow-hidden cursor-pointer shadow-md bg-gray-950 border border-purple-500/20 self-start"
      >
        {/* Top-Left Diagonal Status Ribbon */}
        <DiagonalStatusRibbon status={series.status} size="sm" />

        <img
          src={series.coverImage}
          alt={series.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />

        {/* Top Right Badges (Yeni / Sıcak / 18+) */}
        <div className="absolute top-1.5 right-1.5 flex flex-col items-end gap-1 z-10">
          {series.isHot && (
            <span className="bg-orange-600 text-white font-black text-[9px] px-1.5 py-0.5 rounded shadow">
              Sıcak
            </span>
          )}
          {!series.isHot && series.isNew && (
            <span className="bg-emerald-600 text-white font-black text-[9px] px-1.5 py-0.5 rounded shadow">
              Yeni
            </span>
          )}
          {(series.is18Plus || series.ageRating === '18+' || series.genres.includes('18+')) && (
            <span className="bg-rose-600 text-white font-black text-[9px] px-1.5 py-0.5 rounded shadow border border-rose-300/40">
              18+
            </span>
          )}
        </div>

        {/* Bottom Badge (Manhwa / Manhua / Webtoon) */}
        <span className={`absolute bottom-1.5 left-1.5 text-[9px] sm:text-[10px] font-extrabold px-1.5 sm:px-2 py-0.5 rounded shadow backdrop-blur-sm ${getTypeBadgeClass(series.type)}`}>
          {series.type}
        </span>
      </div>

      {/* Right Column: Title + Latest Chapters Bullet List */}
      <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
        <div>
          {/* Series Title */}
          <div className="flex items-center justify-between gap-2 mb-2">
            <h3
              onClick={() => setView({ type: 'series-detail', seriesId: series.id })}
              className="text-sm sm:text-base font-extrabold text-gray-100 group-hover:text-purple-300 cursor-pointer transition line-clamp-1 leading-snug"
              title={series.title}
            >
              {series.title}
            </h3>
          </div>

          {/* Series Synopsis / Özet (Sadece Seriler Kataloğunda aktif) */}
          {showSynopsis && series.synopsis && (
            <p className="text-xs text-gray-300/90 leading-relaxed line-clamp-2 sm:line-clamp-3 mb-2.5 font-normal bg-gray-950/40 p-2 sm:p-2.5 rounded-xl border border-gray-800/50">
              {series.synopsis}
            </p>
          )}

          {/* Genres / Türler (Sadece Seriler Kataloğunda aktif) */}
          {showGenres && series.genres && series.genres.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap mb-2.5">
              {series.genres.slice(0, 5).map(g => (
                <span key={g} className="text-[10px] text-purple-300/90 bg-purple-950/70 border border-purple-500/20 px-2 py-0.5 rounded-md font-medium">
                  {g}
                </span>
              ))}
            </div>
          )}

          {/* Chapters List (Bullet Point List matching screenshot) */}
          <div className="flex flex-col gap-1 sm:gap-1.5">
            {recentChapters.map((ch) => {
              const isChapterNew = checkIsChapterNew(ch, 24);

              return (
                <div
                  key={ch.id}
                  className="group/ch flex items-center justify-between py-0.5 cursor-pointer hover:bg-purple-950/30 px-1 rounded transition"
                  onClick={() => setView({ type: 'reader', seriesId: series.id, chapterId: ch.id })}
                >
                  {/* Left: Purple bullet + Special Badge + Chapter Title */}
                  <div className="flex items-center gap-1.5 min-w-0 flex-1 pr-2">
                    <span className="text-purple-400 font-black text-sm shrink-0 leading-none">•</span>

                    {/* Chapter Special Badge (2.Sezon, Final, Ekstra vb.) */}
                    {ch.specialTag && (
                      <ChapterSpecialBadge tag={ch.specialTag} size="xs" />
                    )}

                    <span className="font-bold text-xs sm:text-[13px] text-purple-300 group-hover/ch:text-purple-100 group-hover/ch:underline transition truncate">
                      {ch.title || `Bölüm ${ch.number}`}
                    </span>

                    {/* Parıltılı Mor "YENİ" Etiketi */}
                    {isChapterNew && (
                      <span className="bg-gradient-to-r from-purple-600 to-pink-600 text-white font-black text-[8px] px-1 py-0.2 rounded shrink-0">
                        YENİ
                      </span>
                    )}
                  </div>

                  {/* Right: Date String e.g. "1 gün önce" */}
                  <span className="text-[11px] sm:text-xs text-gray-400 group-hover/ch:text-gray-300 shrink-0 font-medium whitespace-nowrap ml-2">
                    {ch.publishedDate || 'Yeni'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Optional View All sub-info (only shown when not compact or in catalog) */}
        {!compact && (
          <div className="mt-2 pt-1 border-t border-gray-800/40 flex items-center justify-between text-xs text-gray-400">
            <button
              onClick={() => setView({ type: 'series-detail', seriesId: series.id })}
              className="text-[10px] font-bold text-purple-400 hover:text-purple-200 transition flex items-center gap-0.5"
            >
              Tüm Bölümler ({series.chapters.length}) →
            </button>
            <span className="text-[10px] text-amber-400 font-bold flex items-center gap-0.5">
              ★ {series.rating}
            </span>
          </div>
        )}
      </div>

    </div>
  );
};
