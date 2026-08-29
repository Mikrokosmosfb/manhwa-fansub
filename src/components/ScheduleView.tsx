import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { SeriesType, isSeries18Plus } from '../types';
import { Calendar, Clock, ChevronRight, Star, Filter, Megaphone } from 'lucide-react';
import { DiagonalStatusRibbon } from './DiagonalStatusRibbon';

const DAYS_OF_WEEK = [
  { day: 'Pazartesi', dayShort: 'Pzt' },
  { day: 'Salı', dayShort: 'Sal' },
  { day: 'Çarşamba', dayShort: 'Çar' },
  { day: 'Perşembe', dayShort: 'Per' },
  { day: 'Cuma', dayShort: 'Cum' },
  { day: 'Cumartesi', dayShort: 'Cmt' },
  { day: 'Pazar', dayShort: 'Paz' }
];

export const ScheduleView: React.FC = () => {
  const { seriesList, setView, showNsfw } = useApp();
  const visibleSeriesList = showNsfw ? seriesList : seriesList.filter(s => !isSeries18Plus(s));

  // Find current day name in Turkish
  const turkishDays = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
  const todayName = turkishDays[new Date().getDay()];

  const [selectedDay, setSelectedDay] = useState<string>(todayName);
  const [filterType, setFilterType] = useState<string>('Hepsi');

  // Compute dynamic series for each day
  const getSeriesForDay = (dayName: string) => {
    return visibleSeriesList.filter(s => s.releaseDay === dayName);
  };

  const selectedDaySeries = getSeriesForDay(selectedDay).filter(s => {
    if (filterType === 'Hepsi') return true;
    return s.type === filterType;
  });

  const getTypeBadgeClass = (type: SeriesType) => {
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
    <div className="max-w-7xl mx-auto px-4 py-6 sm:py-8 space-y-6">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-purple-900/90 via-indigo-900/80 to-purple-950/90 border border-purple-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 bg-purple-950/80 border border-purple-500/40 text-purple-200 text-xs font-bold px-3 py-1 rounded-full mb-3">
              <Calendar size={14} className="text-purple-400" />
              <span>Haftalık Bölüm Takvimi</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Yayın Takvimi & Güncellemeler
            </h1>
            <p className="text-purple-200/80 text-xs sm:text-sm mt-1 max-w-xl">
              Hangi serinin hangi gün yayınlandığını görün. Sitedeki serilere göre dinamik güncellenir!
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-purple-300 font-semibold bg-black/40 px-3 py-2 rounded-2xl border border-purple-500/20">
              Bugün: <strong className="text-amber-300">{todayName}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Days Tabs (Pazartesi -> Pazar) */}
      <div className="bg-gray-900/90 border border-purple-500/20 rounded-3xl p-3 sm:p-4 shadow-xl">
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {DAYS_OF_WEEK.map(d => {
            const isToday = d.day === todayName;
            const isSelected = d.day === selectedDay;
            const dayCount = getSeriesForDay(d.day).length;

            return (
              <button
                key={d.day}
                onClick={() => setSelectedDay(d.day)}
                className={`flex-1 min-w-[90px] sm:min-w-[110px] py-2.5 sm:py-3 px-3 rounded-2xl font-extrabold text-xs sm:text-sm transition-all flex flex-col items-center gap-1 border relative cursor-pointer ${
                  isSelected
                    ? 'bg-purple-600 border-purple-400 text-white shadow-lg shadow-purple-900/50 scale-105 z-10'
                    : isToday
                    ? 'bg-purple-950/80 border-purple-500/60 text-purple-200 hover:bg-purple-900/60'
                    : 'bg-gray-950/70 border-gray-800 text-gray-300 hover:bg-purple-950/40 hover:text-white'
                }`}
              >
                <span>{d.day}</span>
                {isToday && (
                  <span className={`text-[9px] px-2 py-0.2 rounded-full font-black uppercase tracking-wider ${
                    isSelected ? 'bg-white text-purple-900' : 'bg-amber-400 text-black'
                  }`}>
                    Bugün
                  </span>
                )}
                <span className="text-[10px] opacity-75 font-normal">
                  {dayCount} Seri
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Filter by Type */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-base sm:text-lg font-extrabold text-white flex items-center gap-2">
            <Clock className="text-purple-400 flex-shrink-0" size={18} />
            <span>{selectedDay} Programı</span>
          </h2>
          <span className="text-[11px] sm:text-xs font-bold text-purple-300 bg-purple-950/90 px-2.5 py-0.5 rounded-full border border-purple-800/80 whitespace-nowrap">
            {selectedDaySeries.length} Seri Yayınlanıyor
          </span>
        </div>

        <div className="flex items-center gap-1 bg-gray-900/90 border border-purple-500/20 p-1 rounded-2xl text-xs overflow-x-auto no-scrollbar self-start sm:self-auto max-w-full">
          <Filter size={14} className="text-purple-400 ml-2 flex-shrink-0" />
          {['Hepsi', 'Manhwa', 'Web Novel'].map(t => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`px-3 py-1 rounded-xl font-bold transition whitespace-nowrap cursor-pointer ${
                filterType === t
                  ? 'bg-purple-600 text-white shadow'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Schedule Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {selectedDaySeries.length === 0 ? (
          <div className="col-span-full bg-gray-900/60 border border-purple-500/20 rounded-3xl p-8 text-center text-gray-400">
            <Calendar size={32} className="mx-auto mb-2 text-purple-400 opacity-60" />
            <p className="font-bold text-sm text-gray-200">{selectedDay} günü için henüz planlanmış seri bulunmuyor.</p>
            <p className="text-xs text-gray-500 mt-1">Yönetim panelinden serilerinize yayın günü atayabilirsiniz.</p>
          </div>
        ) : (
          selectedDaySeries.map((series, idx) => {
            const latestChapter = series.chapters[series.chapters.length - 1] || series.chapters[0];
            const releaseTime = series.releaseTime || '18:00';

            return (
              <div
                key={series.id + idx}
                className="bg-gray-900/90 border border-purple-500/20 hover:border-purple-500/50 rounded-3xl p-4 flex gap-4 shadow-xl transition-all duration-300 hover:shadow-purple-900/30 group relative overflow-hidden"
              >
                {/* Cover Image */}
                <div 
                  onClick={() => setView({ type: 'series-detail', seriesId: series.id })}
                  className="relative w-24 h-32 flex-shrink-0 rounded-2xl overflow-hidden cursor-pointer shadow-md bg-gray-950 border border-purple-500/20"
                >
                  <DiagonalStatusRibbon status={series.status} size="sm" />
                  <img
                    src={series.coverImage}
                    alt={series.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  />
                  {series.is18Plus && (
                    <span className="absolute top-1 right-1 bg-rose-600 text-white font-black text-[9px] px-1 py-0.2 rounded shadow">
                      18+
                    </span>
                  )}
                  <span className={`absolute bottom-2 left-2 text-[9px] font-extrabold px-1.5 py-0.5 rounded shadow ${getTypeBadgeClass(series.type)}`}>
                    {series.type}
                  </span>
                </div>

                {/* Info Column */}
                <div className="flex-1 min-w-0 flex flex-col justify-between">
                  <div>
                    {/* Top Bar: Release Time + Chapter Note */}
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="inline-flex items-center gap-1 text-xs font-black bg-purple-950 text-purple-300 border border-purple-700/60 px-2.5 py-0.5 rounded-lg shadow-sm">
                        <Clock size={12} className="text-purple-400" />
                        {releaseTime}
                      </span>
                      <span className="text-xs font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 rounded-lg truncate max-w-[150px]">
                        {`Bölüm ${latestChapter?.number || 1}`}
                      </span>
                    </div>

                    {/* Title */}
                    <h3
                      onClick={() => setView({ type: 'series-detail', seriesId: series.id })}
                      className="font-extrabold text-sm sm:text-base text-gray-100 group-hover:text-purple-300 cursor-pointer transition line-clamp-1"
                    >
                      {series.title}
                    </h3>

                    {series.notice ? (
                      <p className="text-xs text-amber-300 font-medium line-clamp-1 mt-1 flex items-center gap-1">
                        <Megaphone size={12} className="text-amber-400 flex-shrink-0" />
                        {series.notice}
                      </p>
                    ) : (
                      <p className="text-xs text-gray-400 line-clamp-2 mt-1">
                        {series.synopsis}
                      </p>
                    )}
                  </div>

                  {/* Bottom Actions */}
                  <div className="pt-2 border-t border-gray-800/80 flex items-center justify-between text-xs mt-2">
                    <div className="flex items-center gap-1 text-amber-400 font-bold">
                      <Star size={13} className="fill-current" />
                      <span>{series.rating}</span>
                    </div>

                    <button
                      onClick={() => setView({ type: 'series-detail', seriesId: series.id })}
                      className="flex items-center gap-1 text-xs font-bold text-purple-300 hover:text-white bg-purple-900/60 hover:bg-purple-600 px-3 py-1 rounded-xl transition cursor-pointer"
                    >
                      <span>Seriye Git</span>
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>

              </div>
            );
          })
        )}
      </div>

    </div>
  );
};

