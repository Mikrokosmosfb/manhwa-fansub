import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ScheduleDay, SeriesType } from '../types';
import { Calendar, Clock, Sparkles, ChevronRight, BookOpen, Star, Filter, Megaphone } from 'lucide-react';

const WEEKLY_SCHEDULE: ScheduleDay[] = [
  {
    day: 'Pazartesi',
    dayShort: 'Pzt',
    items: [
      { seriesId: 's-plum', time: '18:00', chapterNote: 'Bölüm 5 (Çıktı!)' },
      { seriesId: 's-lotm', time: '20:30', chapterNote: 'Bölüm 2' }
    ]
  },
  {
    day: 'Salı',
    dayShort: 'Sal',
    items: [
      { seriesId: 's-blessing', time: '17:00', chapterNote: 'Bölüm 6' },
      { seriesId: 's-shadowslave', time: '21:00', chapterNote: 'Bölüm 2' }
    ]
  },
  {
    day: 'Çarşamba',
    dayShort: 'Çar',
    items: [
      { seriesId: 's-nightsong', time: '19:00', chapterNote: 'Bölüm 39' },
      { seriesId: 's-1', time: '20:00', chapterNote: 'Bölüm 178' }
    ]
  },
  {
    day: 'Perşembe',
    dayShort: 'Per',
    items: [
      { seriesId: 's-plum', time: '18:00', chapterNote: 'Bölüm 6' },
      { seriesId: 's-2', time: '21:30', chapterNote: 'Bölüm 125' }
    ]
  },
  {
    day: 'Cuma',
    dayShort: 'Cum',
    items: [
      { seriesId: 's-blessing', time: '17:30', chapterNote: 'Bölüm 7' },
      { seriesId: 's-3', time: '19:30', chapterNote: 'Bölüm 46' },
      { seriesId: 's-lotm', time: '22:00', chapterNote: 'Bölüm 3' }
    ]
  },
  {
    day: 'Cumartesi',
    dayShort: 'Cmt',
    items: [
      { seriesId: 's-nightsong', time: '18:30', chapterNote: 'Bölüm 40' },
      { seriesId: 's-shadowslave', time: '21:00', chapterNote: 'Bölüm 3' }
    ]
  },
  {
    day: 'Pazar',
    dayShort: 'Paz',
    items: [
      { seriesId: 's-1', time: '16:00', chapterNote: 'Bölüm 179' },
      { seriesId: 's-2', time: '19:00', chapterNote: 'Bölüm 126' },
      { seriesId: 's-plum', time: '21:00', chapterNote: 'Özel Bölüm' }
    ]
  }
];

export const ScheduleView: React.FC = () => {
  const { seriesList, setView } = useApp();

  // Find current day name in Turkish
  const turkishDays = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
  const todayName = turkishDays[new Date().getDay()];

  const [selectedDay, setSelectedDay] = useState<string>(todayName);
  const [filterType, setFilterType] = useState<string>('Hepsi');

  const activeScheduleDay = WEEKLY_SCHEDULE.find(s => s.day === selectedDay) || WEEKLY_SCHEDULE[0];

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
              Hangi serinin hangi gün saat kaçta yayınlanacağını görün. Takvime sadık kalarak her gün taze bölümler sunuyoruz!
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
          {WEEKLY_SCHEDULE.map(sched => {
            const isToday = sched.day === todayName;
            const isSelected = sched.day === selectedDay;

            return (
              <button
                key={sched.day}
                onClick={() => setSelectedDay(sched.day)}
                className={`flex-1 min-w-[90px] sm:min-w-[110px] py-2.5 sm:py-3 px-3 rounded-2xl font-extrabold text-xs sm:text-sm transition-all flex flex-col items-center gap-1 border relative ${
                  isSelected
                    ? 'bg-purple-600 border-purple-400 text-white shadow-lg shadow-purple-900/50 scale-105 z-10'
                    : isToday
                    ? 'bg-purple-950/80 border-purple-500/60 text-purple-200 hover:bg-purple-900/60'
                    : 'bg-gray-950/70 border-gray-800 text-gray-300 hover:bg-purple-950/40 hover:text-white'
                }`}
              >
                <span>{sched.day}</span>
                {isToday && (
                  <span className={`text-[9px] px-2 py-0.2 rounded-full font-black uppercase tracking-wider ${
                    isSelected ? 'bg-white text-purple-900' : 'bg-amber-400 text-black'
                  }`}>
                    Bugün
                  </span>
                )}
                <span className="text-[10px] opacity-75 font-normal">
                  {sched.items.length} Seri
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Filter by Type */}
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-extrabold text-white flex items-center gap-2">
          <Clock className="text-purple-400" size={20} />
          <span>{selectedDay} Programı</span>
          <span className="text-xs font-semibold text-purple-300 bg-purple-950 px-2.5 py-0.5 rounded-full border border-purple-800">
            {activeScheduleDay.items.length} Bölüm Yolda
          </span>
        </h2>

        <div className="flex items-center gap-1 bg-gray-900/90 border border-purple-500/20 p-1 rounded-2xl text-xs">
          <Filter size={14} className="text-purple-400 ml-2" />
          {['Hepsi', 'Manhwa', 'Web Novel'].map(t => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`px-3 py-1 rounded-xl font-bold transition ${
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
        {(() => {
          // Find all series configured for selectedDay in seriesList
          const dynamicSeries = seriesList.filter(s => s.releaseDay === selectedDay);
          
          // Also get static items configured for selectedDay
          const staticItems = activeScheduleDay.items;

          // Merge unique series
          const allSeriesForDay: { series: typeof seriesList[0]; time: string; note?: string }[] = [];

          // Add dynamic ones first
          dynamicSeries.forEach(s => {
            allSeriesForDay.push({
              series: s,
              time: s.releaseTime || '18:00',
              note: s.notice ? `${s.notice.slice(0, 20)}...` : undefined
            });
          });

          // Add static ones if not already included
          staticItems.forEach(it => {
            const found = seriesList.find(s => s.id === it.seriesId);
            if (found && !allSeriesForDay.some(x => x.series.id === found.id)) {
              allSeriesForDay.push({
                series: found,
                time: it.time,
                note: it.chapterNote
              });
            }
          });

          if (allSeriesForDay.length === 0) {
            return (
              <div className="col-span-full bg-gray-900/60 border border-purple-500/20 rounded-3xl p-8 text-center text-gray-400">
                <Calendar size={32} className="mx-auto mb-2 text-purple-400 opacity-60" />
                <p className="font-bold text-sm text-gray-200">{selectedDay} günü için henüz planlanmış seri bulunmuyor.</p>
                <p className="text-xs text-gray-500 mt-1">Yönetim panelinden serilerinize yayın günü atayabilirsiniz.</p>
              </div>
            );
          }

          return allSeriesForDay.map(({ series, time, note }, idx) => {
            if (filterType !== 'Hepsi' && series.type !== filterType) {
              return null;
            }

            const latestChapter = series.chapters[series.chapters.length - 1] || series.chapters[0];

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
                        {time}
                      </span>
                      <span className="text-xs font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 rounded-lg truncate max-w-[150px]">
                        {note || `Bölüm ${latestChapter?.number || 1}`}
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
                      className="flex items-center gap-1 text-xs font-bold text-purple-300 hover:text-white bg-purple-900/60 hover:bg-purple-600 px-3 py-1 rounded-xl transition"
                    >
                      <span>Seriye Git</span>
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>

              </div>
            );
          });
        })()}
      </div>

    </div>
  );
};
