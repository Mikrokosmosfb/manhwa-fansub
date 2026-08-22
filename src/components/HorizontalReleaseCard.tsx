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
}

export const HorizontalReleaseCard: React.FC<HorizontalReleaseCardProps> = ({ 
  series, 
  maxChapters = 4,
  showSynopsis = false,
  showGenres = false
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

  // Helper to format date compactly so chapter title has maximum space
  const formatDateCompact = (dateStr: string) => {
    if (!dateStr) return '';
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      const parts = dateStr.split('-');
      return `${parts[2]}.${parts[1]}`; // e.g. "21.07"
    }
    return dateStr.replace(' saat ', 's ').replace(' gün ', 'g ').replace(' önce', '');
  };

  return (
    <div className="bg-gray-900/90 border border-purple-500/20 hover:border-purple-500/40 rounded-2xl p-2.5 sm:p-4 flex gap-2.5 sm:gap-4 shadow-xl transition-all duration-300 hover:shadow-purple-900/20 group">
      
      {/* Left: Cover Poster with Badges */}
      <div 
        onClick={() => setView({ type: 'series-detail', seriesId: series.id })}
        className="relative w-20 xs:w-24 sm:w-28 md:w-30 lg:w-32 aspect-[2/3] flex-shrink-0 rounded-xl overflow-hidden cursor-pointer shadow-lg bg-gray-950 border border-purple-500/20 self-start sm:self-center"
      >
        {/* Top-Left Diagonal Status Ribbon */}
        <DiagonalStatusRibbon status={series.status} size="sm" />

        <img
          src={series.coverImage}
          alt={series.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />

        {/* Top Right Badges (Yeni / Sıcak / 18+) */}
        <div className="absolute top-1 right-1 sm:top-1.5 sm:right-1.5 flex flex-col items-end gap-1 z-10">
          {series.isNew && (
            <span className="bg-gradient-to-r from-purple-600 via-fuchsia-500 to-indigo-600 text-white font-black text-[8px] sm:text-[9px] px-1.5 py-0.5 rounded-full shadow-lg shadow-purple-900/80 border border-purple-300/40 flex items-center gap-0.5">
              <Sparkles size={8} className="text-purple-200 fill-purple-200" />
              YENİ
            </span>
          )}
          {!series.isNew && series.isHot && (
            <span className="bg-orange-600 text-white font-black text-[8px] sm:text-[9px] px-1.5 py-0.5 rounded-md shadow-md">
              SICAK
            </span>
          )}
          {(series.is18Plus || series.ageRating === '18+' || series.genres.includes('18+')) && (
            <span className="bg-rose-600 text-white font-black text-[8px] sm:text-[9px] px-1.5 py-0.5 rounded-md shadow-md border border-rose-300/40">
              18+
            </span>
          )}
        </div>

        {/* Bottom Badge (Manhwa / Manhua / Webtoon) */}
        <span className={`absolute bottom-1 left-1 sm:bottom-1.5 sm:left-1.5 text-[8px] sm:text-[10px] font-extrabold px-1.5 py-0.5 rounded-md shadow-md backdrop-blur-sm ${getTypeBadgeClass(series.type)}`}>
          {series.type}
        </span>
      </div>

      {/* Right Column: Title + Latest Chapters Bullet List */}
      <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
        <div>
          {/* Series Title + Release Day */}
          <div className="flex items-start justify-between gap-1.5 mb-1.5 sm:mb-2">
            <div className="min-w-0 flex-1">
              <h3
                onClick={() => setView({ type: 'series-detail', seriesId: series.id })}
                className="text-xs xs:text-sm sm:text-base font-extrabold text-gray-100 hover:text-purple-300 cursor-pointer transition line-clamp-1 leading-snug"
                title={series.title}
              >
                {series.title}
              </h3>
            </div>

            <div className="flex items-center gap-1 flex-shrink-0">
              {series.releaseYear && (
                <span className="text-[8px] sm:text-[9px] text-gray-400 font-semibold bg-gray-950 px-1 sm:px-1.5 py-0.5 rounded border border-gray-800">
                  {series.releaseYear}
                </span>
              )}

              {series.releaseDay && (
                <span className="text-[8px] sm:text-[10px] font-bold text-purple-300 bg-purple-950/80 border border-purple-700/60 px-1 sm:px-1.5 py-0.5 rounded-md flex items-center gap-0.5 sm:gap-1 whitespace-nowrap">
                  <Calendar size={9} className="text-purple-300 sm:w-2.5 sm:h-2.5" />
                  <span className="hidden xs:inline">{series.releaseDay}</span>
                  <span className="xs:hidden">{series.releaseDay.slice(0, 3)}</span>
                  {series.releaseTime ? ` ${series.releaseTime}` : ''}
                </span>
              )}
            </div>
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

          {/* Chapters List (Clean Vertical Stack, Compact) */}
          <div className="flex flex-col gap-1 sm:gap-1.5">
            {recentChapters.map((ch) => {
              const isChapterNew = checkIsChapterNew(ch, 24);

              return (
                <div
                  key={ch.id}
                  className="group/ch relative flex items-center justify-between px-1.5 py-0.5 sm:px-2.5 sm:py-1 rounded-lg bg-gray-950/40 hover:bg-purple-950/60 border border-gray-800/50 hover:border-purple-500/40 cursor-pointer transition-all duration-200"
                  onClick={() => setView({ type: 'reader', seriesId: series.id, chapterId: ch.id })}
                >
                  {/* Left: Indicator + Title + Special Tag + New Badge */}
                  <div className="flex items-center gap-1.5 min-w-0 flex-1 pr-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-400 group-hover/ch:bg-purple-300 group-hover/ch:scale-125 transition-transform flex-shrink-0" />
                    
                    <span className="font-semibold text-xs text-gray-200 group-hover/ch:text-purple-200 truncate">
                      {ch.title || `Bölüm ${ch.number}`}
                    </span>

                    {/* Chapter Special Badge (Sezon Finali, Final, Ekstra, Yan Bölüm, vb.) */}
                    {ch.specialTag && (
                      <ChapterSpecialBadge tag={ch.specialTag} size="xs" />
                    )}

                    {/* Parıltılı Mor "YENİ" Etiketi */}
                    {isChapterNew && (
                      <span className="bg-gradient-to-r from-purple-600 via-fuchsia-500 to-indigo-600 text-white font-black text-[8px] sm:text-[9px] px-1 sm:px-1.5 py-0.2 rounded shadow-sm border border-purple-300/40 animate-pulse flex items-center gap-0.5 flex-shrink-0">
                        <Sparkles size={8} className="text-purple-100 fill-purple-100" />
                        YENİ
                      </span>
                    )}
                  </div>

                  {/* Right: Date */}
                  <span className="text-[9px] sm:text-[10px] text-gray-400 group-hover/ch:text-gray-300 flex-shrink-0 font-medium bg-gray-900/60 border border-gray-800/40 px-1 sm:px-1.5 py-0.5 rounded whitespace-nowrap">
                    {formatDateCompact(ch.publishedDate)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* View All Button or Sub-info */}
        <div className="mt-2 pt-1 sm:mt-2.5 sm:pt-1.5 border-t border-gray-800/60 flex items-center justify-between text-xs text-gray-400">
          <button
            onClick={() => setView({ type: 'series-detail', seriesId: series.id })}
            className="text-[10px] sm:text-[11px] font-bold text-purple-400 hover:text-purple-200 transition flex items-center gap-0.5 sm:gap-1 group/btn"
          >
            <span>Tüm Bölümler ({series.chapters.length})</span>
            <span className="group-hover/btn:translate-x-0.5 transition-transform">→</span>
          </button>
          <span className="text-[9px] sm:text-[10px] text-gray-400 font-bold bg-gray-950 px-1.5 sm:px-2 py-0.5 rounded-md border border-gray-800 flex items-center gap-1">
            <Star size={10} className="fill-current text-amber-400" /> {series.rating}
          </span>
        </div>
      </div>

    </div>
  );
};
