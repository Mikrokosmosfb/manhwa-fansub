import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Dices, Tags, MessageSquare, Sparkles, BookOpen, Star, ChevronRight, Users, Layers, Award } from 'lucide-react';
import { Series } from '../types';
import { getOptimizedImageUrl } from '../utils/imageUtils';
import { RandomSeriesWidgetSkeleton } from './SkeletonLoader';

export const RandomSeriesWidget: React.FC = () => {
  const { seriesList, setView, isLoadingSeries } = useApp();
  const [randomSeries, setRandomSeries] = useState<Series | null>(() => {
    if (!seriesList || seriesList.length === 0) return null;
    return seriesList[Math.floor(Math.random() * seriesList.length)];
  });
  const [isSpinning, setIsSpinning] = useState(false);

  useEffect(() => {
    if (!randomSeries && seriesList && seriesList.length > 0) {
      setRandomSeries(seriesList[Math.floor(Math.random() * seriesList.length)]);
    }
  }, [seriesList, randomSeries]);

  const handlePickRandom = () => {
    if (!seriesList || seriesList.length === 0) return;
    setIsSpinning(true);
    setTimeout(() => {
      let next = seriesList[Math.floor(Math.random() * seriesList.length)];
      if (seriesList.length > 1 && randomSeries && next.id === randomSeries.id) {
        next = seriesList.find(s => s.id !== randomSeries.id) || next;
      }
      setRandomSeries(next);
      setIsSpinning(false);
    }, 350);
  };

  if (isLoadingSeries || !randomSeries) {
    return <RandomSeriesWidgetSkeleton />;
  }

  return (
    <div className="relative bg-gray-900/90 border border-purple-500/30 rounded-2xl sm:rounded-3xl p-4 shadow-xl space-y-3.5 overflow-hidden group">
      {/* Ambient background blur using series cover */}
      <div
        className="absolute inset-0 bg-cover bg-center opacity-15 blur-xl pointer-events-none transition-all duration-700 group-hover:opacity-25 group-hover:scale-110"
        style={{ backgroundImage: `url(${randomSeries.coverImage})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-gray-900/70 via-gray-900/90 to-gray-950 pointer-events-none" />

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between border-b border-gray-800/80 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/30 shadow-inner">
            <Dices size={16} className={isSpinning ? 'animate-spin text-purple-400' : 'text-purple-300'} />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-white leading-tight">Ne Okusam?</h3>
            <p className="text-[10px] text-gray-400 font-medium">Kararsızlar için şanslı seri önerisi</p>
          </div>
        </div>
        <button
          onClick={handlePickRandom}
          disabled={isSpinning}
          className="text-xs font-bold text-purple-200 hover:text-white bg-purple-900/50 hover:bg-purple-800/80 border border-purple-500/40 px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 active:scale-95 cursor-pointer shadow-md hover:shadow-purple-500/20"
          title="Farklı bir şanslı seri çevir"
        >
          <Dices size={14} className={isSpinning ? 'animate-spin text-purple-300' : ''} />
          <span>Karıştır</span>
        </button>
      </div>

      {/* Main Content Card with transition */}
      <div className={`relative z-10 transition-all duration-300 ${isSpinning ? 'scale-95 opacity-40 blur-xs' : 'scale-100 opacity-100'}`}>
        <div className="bg-gray-950/80 rounded-2xl p-3 border border-purple-500/25 shadow-lg backdrop-blur-md flex gap-3.5 items-stretch group/card hover:border-purple-500/50 transition duration-300">
          
          {/* Cover Poster Image */}
          <div
            onClick={() => setView({ type: 'series-detail', seriesId: randomSeries.id })}
            className="relative w-20 sm:w-22 aspect-[3/4] rounded-xl overflow-hidden flex-shrink-0 cursor-pointer border border-purple-500/30 shadow-md group-hover/card:shadow-purple-500/30 transition duration-300"
          >
            <img
              src={getOptimizedImageUrl(randomSeries.coverImage, { width: 100, height: 133, quality: 65 })}
              alt={randomSeries.title}
              width="80"
              height="107"
              loading="lazy"
              decoding="async"
              className="w-full h-full object-cover group-hover/card:scale-110 transition duration-500"
            />
            {/* Rating badge on image */}
            <div className="absolute top-1 right-1 bg-black/80 backdrop-blur-md px-1.5 py-0.5 rounded-md text-[10px] font-black text-amber-400 flex items-center gap-0.5 border border-amber-400/30 shadow">
              <Star size={10} className="fill-amber-400 text-amber-400" />
              {randomSeries.rating}
            </div>
          </div>

          {/* Details */}
          <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5 space-y-1">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-purple-900/90 text-purple-200 border border-purple-400/30 shadow-xs">
                  {randomSeries.type}
                </span>
                {randomSeries.genres && randomSeries.genres[0] && (
                  <span className="text-[10px] font-semibold text-gray-400 truncate">
                    • {randomSeries.genres.slice(0, 2).join(', ')}
                  </span>
                )}
              </div>

              <h4
                onClick={() => setView({ type: 'series-detail', seriesId: randomSeries.id })}
                className="text-sm font-black text-white line-clamp-2 hover:text-purple-300 cursor-pointer transition leading-snug"
              >
                {randomSeries.title}
              </h4>

              <div className="text-[11px] text-gray-400 font-medium flex items-center gap-2">
                <span className="flex items-center gap-1 text-gray-300 font-bold">
                  <BookOpen size={11} className="text-purple-400" />
                  {randomSeries.chapters.length} Bölüm
                </span>
                {randomSeries.status && (
                  <span className="text-[10px] text-purple-300 bg-purple-950/80 px-1.5 py-0.5 rounded border border-purple-800/40">
                    {randomSeries.status}
                  </span>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-1 flex items-center gap-1.5">
              <button
                onClick={() => setView({ type: 'series-detail', seriesId: randomSeries.id })}
                className="flex-1 py-1.5 px-3 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold text-xs shadow-md shadow-purple-900/30 hover:shadow-purple-500/30 transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
              >
                <Sparkles size={13} className="text-amber-300 animate-pulse" />
                <span>Hemen Oku</span>
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export const QuickCategoriesWidget: React.FC = () => {
  const { seriesList, setView } = useApp();

  // Extract all actual genres and custom badges from the series in database with counts
  const genreCounts = React.useMemo(() => {
    const counts: Record<string, number> = {};
    if (!seriesList) return [];

    seriesList.forEach(s => {
      // Add series genres
      (s.genres || []).forEach(g => {
        if (g && g.trim()) {
          const trimmed = g.trim();
          counts[trimmed] = (counts[trimmed] || 0) + 1;
        }
      });
      // Add custom badges / extra tags
      (s.customBadges || []).forEach(b => {
        if (b && b.trim()) {
          const trimmed = b.trim();
          counts[trimmed] = (counts[trimmed] || 0) + 1;
        }
      });
    });

    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1]) // highest frequency first
      .map(([name, count]) => ({ name, count }));
  }, [seriesList]);

  // Color palette cycle for dynamic tags
  const COLOR_PALETTES = [
    'from-amber-600/30 to-orange-600/30 border-orange-500/40 text-orange-200 hover:border-orange-400',
    'from-pink-600/30 to-rose-600/30 border-pink-500/40 text-pink-200 hover:border-pink-400',
    'from-purple-600/30 to-indigo-600/30 border-purple-500/40 text-purple-200 hover:border-purple-400',
    'from-blue-600/30 to-cyan-600/30 border-blue-500/40 text-blue-200 hover:border-blue-400',
    'from-emerald-600/30 to-teal-600/30 border-teal-500/40 text-teal-200 hover:border-teal-400',
    'from-fuchsia-600/30 to-purple-600/30 border-fuchsia-500/40 text-fuchsia-200 hover:border-fuchsia-400',
    'from-violet-600/30 to-indigo-600/30 border-violet-500/40 text-violet-200 hover:border-violet-400',
    'from-yellow-600/30 to-amber-600/30 border-yellow-500/40 text-yellow-200 hover:border-yellow-400',
    'from-rose-600/30 to-pink-600/30 border-rose-500/40 text-rose-200 hover:border-rose-400',
    'from-teal-600/30 to-emerald-600/30 border-teal-500/40 text-teal-200 hover:border-teal-400',
  ];

  return (
    <div className="bg-gray-900/90 border border-purple-500/20 rounded-2xl sm:rounded-3xl p-4 shadow-xl space-y-3">
      <div className="flex items-center justify-between border-b border-gray-800 pb-2.5">
        <h3 className="text-sm sm:text-base font-extrabold text-white flex items-center gap-2">
          <Tags className="text-purple-400" size={18} />
          Popüler Türler & Etiketler
        </h3>
        <button
          onClick={() => setView({ type: 'categories' })}
          className="text-[11px] font-bold text-purple-300 hover:text-white flex items-center gap-0.5 transition cursor-pointer"
        >
          Tüm Türler <ChevronRight size={13} />
        </button>
      </div>

      <div className="flex flex-wrap gap-1.5 pt-1">
        {genreCounts.length === 0 ? (
          <p className="text-xs text-gray-500 py-1">Tür verisi bulunamadı.</p>
        ) : (
          genreCounts.slice(0, 12).map((g, idx) => {
            const color = COLOR_PALETTES[idx % COLOR_PALETTES.length];
            return (
              <button
                key={g.name}
                onClick={() => setView({ type: 'categories', genre: g.name })}
                className={`text-xs font-bold px-2.5 py-1 rounded-xl bg-gradient-to-r ${color} border shadow-sm hover:scale-105 active:scale-95 transition cursor-pointer flex items-center gap-1.5`}
              >
                <span>{g.name}</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/40 text-gray-300 font-black">
                  {g.count}
                </span>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};

export const RecentCommentsWidget: React.FC = () => {
  const { seriesList, comments, setView } = useApp();

  // Get the latest 4 real comments from site state
  const recentComments = [...(comments || [])].reverse().slice(0, 4);

  return (
    <div className="bg-gray-900/90 border border-purple-500/20 rounded-2xl sm:rounded-3xl p-4 shadow-xl space-y-3">
      <div className="flex items-center justify-between border-b border-gray-800 pb-2.5">
        <h3 className="text-sm sm:text-base font-extrabold text-white flex items-center gap-2">
          <MessageSquare className="text-purple-400" size={18} />
          Son Okuyucu Yorumları
        </h3>
      </div>

      <div className="space-y-2.5 pt-1">
        {recentComments.length === 0 ? (
          <div className="text-center py-4 px-2 text-gray-400 space-y-1">
            <MessageSquare size={24} className="mx-auto text-gray-600 mb-1" />
            <p className="text-xs font-medium">Henüz yorum yapılmadı.</p>
            <p className="text-[10px] text-gray-500">Bölümlere ilk yorumu yapan sen ol!</p>
          </div>
        ) : (
          recentComments.map(c => {
            const matchedSeries = seriesList.find(s => s.id === c.seriesId);
            const matchedChapter = matchedSeries?.chapters.find(ch => ch.id === c.chapterId);
            const chapterLabel = matchedChapter
              ? `Bölüm ${matchedChapter.number}`
              : c.chapterId
              ? 'Bölüm Yorumu'
              : 'Genel Yorum';

            const handleClick = () => {
              if (matchedSeries && c.chapterId && matchedChapter) {
                setView({ type: 'reader', seriesId: matchedSeries.id, chapterId: c.chapterId });
              } else if (matchedSeries) {
                setView({ type: 'series-detail', seriesId: matchedSeries.id });
              }
            };

            return (
              <div
                key={c.id}
                onClick={handleClick}
                className="p-2.5 rounded-2xl bg-gray-950/70 hover:bg-purple-950/40 border border-gray-800/80 hover:border-purple-500/30 cursor-pointer transition space-y-1.5 group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <img
                      src={getOptimizedImageUrl(c.userAvatar || 'https://api.dicebear.com/7.x/bottts/svg?seed=Reader', { width: 36, height: 36, quality: 65 })}
                      alt={c.userName}
                      width="20"
                      height="20"
                      loading="lazy"
                      decoding="async"
                      className="w-5 h-5 rounded-full object-cover border border-purple-400/40 flex-shrink-0"
                    />
                    <span className="text-xs font-bold text-purple-300 group-hover:text-purple-200 truncate">
                      {c.userName}
                    </span>
                  </div>
                  <span className="text-[10px] text-gray-500 flex-shrink-0 ml-2">{c.date}</span>
                </div>
                <p className="text-xs text-gray-300 line-clamp-2 italic font-normal pl-1">
                  "{c.text}"
                </p>
                <div className="text-[10px] font-semibold text-gray-400 flex items-center justify-between pt-0.5 border-t border-gray-800/40">
                  <span className="truncate text-purple-400/90 font-bold">
                    {matchedSeries ? matchedSeries.title : 'Seri'}
                  </span>
                  <span className="text-gray-500 flex-shrink-0 ml-1">{chapterLabel}</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export const SiteStatsWidget: React.FC = () => {
  const { seriesList, comments, seriesRequests } = useApp();

  const totalChapters = seriesList.reduce((acc, s) => acc + s.chapters.length, 0);
  const totalComments = comments ? comments.length : 0;
  const totalRequests = seriesRequests ? seriesRequests.length : 0;

  return (
    <div className="bg-gray-900/90 border border-purple-500/20 rounded-2xl sm:rounded-3xl p-4 shadow-xl space-y-3">
      <div className="flex items-center justify-between border-b border-gray-800 pb-2.5">
        <h3 className="text-sm sm:text-base font-extrabold text-white flex items-center gap-2">
          <Award className="text-amber-400" size={18} />
          Site İstatistikleri
        </h3>
      </div>

      <div className="grid grid-cols-2 gap-2 pt-1">
        <div className="bg-gray-950/80 p-3 rounded-2xl border border-purple-500/20 text-center space-y-0.5">
          <div className="text-purple-400 font-extrabold text-lg">{seriesList.length}</div>
          <div className="text-[10px] text-gray-400 font-semibold flex items-center justify-center gap-1">
            <Layers size={11} /> Toplam Seri
          </div>
        </div>

        <div className="bg-gray-950/80 p-3 rounded-2xl border border-purple-500/20 text-center space-y-0.5">
          <div className="text-teal-400 font-extrabold text-lg">{totalChapters}</div>
          <div className="text-[10px] text-gray-400 font-semibold flex items-center justify-center gap-1">
            <BookOpen size={11} /> Toplam Bölüm
          </div>
        </div>

        <div className="bg-gray-950/80 p-3 rounded-2xl border border-purple-500/20 text-center space-y-0.5">
          <div className="text-amber-400 font-extrabold text-lg">{totalComments}</div>
          <div className="text-[10px] text-gray-400 font-semibold flex items-center justify-center gap-1">
            <MessageSquare size={11} /> Yorum Sayısı
          </div>
        </div>

        <div className="bg-gray-950/80 p-3 rounded-2xl border border-purple-500/20 text-center space-y-0.5">
          <div className="text-pink-400 font-extrabold text-lg">{totalRequests}</div>
          <div className="text-[10px] text-gray-400 font-semibold flex items-center justify-center gap-1">
            <Sparkles size={11} /> Seri İstekleri
          </div>
        </div>
      </div>
    </div>
  );
};
