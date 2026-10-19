import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { SeriesType, isSeries18Plus, Series, isAuthorizedAdmin } from '../types';
import { Calendar, CalendarDays, Clock, ChevronRight, Star, Megaphone, Search, X } from 'lucide-react';
import { DiagonalStatusRibbon } from './DiagonalStatusRibbon';
import { doesSeriesReleaseOnDay, isMonthlyDateSeries } from '../utils/chapterUtils';
import { getOptimizedImageUrl, handleImageError } from '../utils/imageUtils';

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
  const { seriesList, setView, showNsfw, isAdminLoggedIn, user } = useApp();
  const isUserAdmin = isAdminLoggedIn || isAuthorizedAdmin(user?.email);
  const base = isUserAdmin ? seriesList : seriesList.filter(s => !s.isDraft);
  const visibleSeriesList = showNsfw ? base : base.filter(s => !isSeries18Plus(s));

  // Current Turkish day name
  const turkishDays = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
  const todayName = turkishDays[new Date().getDay()];

  // Tab State: 'weekly' or 'monthly'
  const [activeTab, setActiveTab] = useState<'weekly' | 'monthly'>('weekly');
  const [selectedDay, setSelectedDay] = useState<string>(todayName);
  const [filterType, setFilterType] = useState<string>('Hepsi');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Weekly Series Filter
  const getSeriesForDay = (dayName: string) => {
    return visibleSeriesList.filter(s => doesSeriesReleaseOnDay(s, dayName));
  };

  const totalWeeklySeriesCount = useMemo(() => {
    return visibleSeriesList.filter(s => s.releaseDay && !isMonthlyDateSeries(s.releaseDay)).length;
  }, [visibleSeriesList]);

  // Monthly Date-based Series (e.g. 9, 19, 29 or numeric dates)
  const allMonthlySeries = useMemo(() => {
    return visibleSeriesList.filter(s => isMonthlyDateSeries(s.releaseDay));
  }, [visibleSeriesList]);

  // Filtered Weekly Series
  const selectedDaySeries = useMemo(() => {
    return getSeriesForDay(selectedDay).filter(s => {
      const matchType = filterType === 'Hepsi' ? true : s.type === filterType;
      const matchSearch = searchQuery
        ? s.title.toLowerCase().includes(searchQuery.toLowerCase().trim())
        : true;
      return matchType && matchSearch;
    });
  }, [visibleSeriesList, selectedDay, filterType, searchQuery]);

  // Filtered Monthly Series
  const filteredMonthlySeries = useMemo(() => {
    return allMonthlySeries.filter(s => {
      const matchType = filterType === 'Hepsi' ? true : s.type === filterType;
      const matchSearch = searchQuery
        ? s.title.toLowerCase().includes(searchQuery.toLowerCase().trim())
        : true;
      return matchType && matchSearch;
    });
  }, [allMonthlySeries, filterType, searchQuery]);

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
            <div className="inline-flex items-center gap-2 bg-purple-950/80 border border-purple-500/40 text-purple-200 text-xs font-bold px-3 py-1 rounded-full mb-3 shadow-inner">
              <Calendar size={14} className="text-purple-400" />
              <span>Yayın Takvimi & Güncellemeler</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Bölüm Yayın Takvimi
            </h1>
            <p className="text-purple-200/80 text-xs sm:text-sm mt-1 max-w-xl">
              Hangi serinin hangi gün yayınlandığını kolayca takip edin. Haftalık ve aylık takvimler arasında geçiş yapabilirsiniz.
            </p>
          </div>
          <div className="flex items-center gap-2 self-start md:self-auto">
            <span className="text-xs text-purple-300 font-semibold bg-black/40 px-3.5 py-2 rounded-2xl border border-purple-500/20 shadow-sm">
              Bugün: <strong className="text-amber-300">{todayName}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Main Mode Switcher: Haftalık Takvim vs Aylık Takvim */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* Switcher Tabs */}
        <div className="bg-gray-900/95 border border-purple-500/30 p-1.5 rounded-2xl flex items-center gap-1.5 shadow-xl max-w-md w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setActiveTab('weekly')}
            className={`flex-1 sm:flex-initial px-5 py-2.5 rounded-xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition cursor-pointer select-none ${
              activeTab === 'weekly'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-900/40 ring-1 ring-purple-400/50'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Calendar size={16} />
            <span>Haftalık Takvim</span>
            <span className="text-[10px] bg-purple-950/90 text-purple-200 border border-purple-500/40 px-2 py-0.5 rounded-md font-mono">
              {totalWeeklySeriesCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('monthly')}
            className={`flex-1 sm:flex-initial px-5 py-2.5 rounded-xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition cursor-pointer select-none ${
              activeTab === 'monthly'
                ? 'bg-gradient-to-r from-amber-600 via-orange-600 to-amber-600 text-white shadow-lg shadow-amber-900/40 ring-1 ring-amber-400/50'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <CalendarDays size={16} />
            <span>Aylık Takvim</span>
            <span className="text-[10px] bg-amber-950/90 text-amber-200 border border-amber-500/40 px-2 py-0.5 rounded-md font-mono">
              {allMonthlySeries.length}
            </span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative flex-1 max-w-md w-full">
          <Search size={15} className="absolute left-3.5 top-3 text-purple-400/70" />
          <input
            type="text"
            placeholder="Takvimde seri ara..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-gray-900/90 border border-purple-500/30 focus:border-purple-400 text-white placeholder-gray-500 text-xs sm:text-sm rounded-2xl pl-10 pr-9 py-2.5 focus:outline-none transition shadow-inner"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-3 text-gray-500 hover:text-white transition cursor-pointer"
              title="Aramayı Temizle"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* HAFTALIK TAKVİM GÖRÜNÜMÜ */}
      {activeTab === 'weekly' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Days Tabs (Pazartesi -> Pazar) */}
          <div className="bg-gray-900/90 border border-purple-500/25 rounded-3xl p-3 sm:p-4 shadow-xl">
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
              {DAYS_OF_WEEK.map(d => {
                const isToday = d.day === todayName;
                const isSelected = d.day === selectedDay;
                const dayCount = getSeriesForDay(d.day).length;

                return (
                  <button
                    key={d.day}
                    onClick={() => setSelectedDay(d.day)}
                    className={`flex-1 min-w-[90px] sm:min-w-[110px] py-2.5 sm:py-3 px-3 rounded-2xl font-extrabold text-xs sm:text-sm transition-all flex flex-col items-center gap-1 border relative cursor-pointer select-none ${
                      isSelected
                        ? 'bg-purple-600 border-purple-400 text-white shadow-lg shadow-purple-900/50 scale-105 z-10 ring-1 ring-purple-300/40'
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
                    <span className="text-[10px] opacity-75 font-normal font-mono">
                      {dayCount} Seri
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Subheader: Selected Day Info & Type Filter */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                <Clock className="text-purple-400 flex-shrink-0" size={18} />
                <span>{selectedDay} Programı</span>
              </h2>
              <span className="text-[11px] sm:text-xs font-bold text-purple-300 bg-purple-950/90 px-2.5 py-0.5 rounded-full border border-purple-800/80 whitespace-nowrap">
                {selectedDaySeries.length} Seri
              </span>
              {searchQuery && (
                <span className="text-xs text-amber-300 bg-amber-950/70 border border-amber-500/40 px-2.5 py-0.5 rounded-full">
                  "{searchQuery}" araması filtrelendi
                </span>
              )}
            </div>

            {/* Type Filters */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
              {['Hepsi', 'Manhwa', 'Web Novel', 'Manga', 'Manhua', 'Webtoon'].map(t => (
                <button
                  key={t}
                  onClick={() => setFilterType(t)}
                  className={`px-3 py-1.5 rounded-xl font-bold text-xs whitespace-nowrap transition cursor-pointer border ${
                    filterType === t
                      ? 'bg-purple-600 border-purple-400 text-white shadow'
                      : 'bg-gray-900/80 border-gray-800 text-gray-400 hover:text-gray-200'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Weekly Schedule Items Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {selectedDaySeries.length === 0 ? (
              <div className="col-span-full bg-gray-900/60 border border-purple-500/20 rounded-3xl p-8 text-center text-gray-400">
                <Calendar size={32} className="mx-auto mb-2 text-purple-400 opacity-60" />
                <p className="font-bold text-sm text-gray-200">
                  {searchQuery
                    ? `"${searchQuery}" aramasına uygun ${selectedDay} günü serisi bulunamadı.`
                    : `${selectedDay} günü için henüz planlanmış seri bulunmuyor.`}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Yönetim panelinden serilerinize yayın günü atayabilirsiniz.
                </p>
              </div>
            ) : (
              selectedDaySeries.map((series, idx) => {
                const latestChapter = series.chapters[series.chapters.length - 1] || series.chapters[0];
                const releaseTime = series.releaseTime?.trim();

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
                        src={getOptimizedImageUrl(series.coverImage, { width: 120, height: 160, quality: 75 })}
                        alt={series.title}
                        loading="lazy"
                        decoding="async"
                        referrerPolicy="no-referrer"
                        onError={(e) => handleImageError(e, series.coverImage, series.title)}
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
                          {releaseTime ? (
                            <span className="inline-flex items-center gap-1 text-xs font-black bg-purple-950 text-purple-300 border border-purple-700/60 px-2.5 py-0.5 rounded-lg shadow-sm">
                              <Clock size={12} className="text-purple-400" />
                              {releaseTime}
                            </span>
                          ) : <span />}
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
      )}

      {/* AYLIK TAKVİM GÖRÜNÜMÜ */}
      {activeTab === 'monthly' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Monthly Info & Subheader */}
          <div className="bg-gradient-to-r from-amber-950/40 via-gray-900/90 to-amber-950/40 border border-amber-500/30 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-amber-500/20">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-500/15 border border-amber-500/40 rounded-2xl text-amber-400 shadow-sm shrink-0">
                  <CalendarDays size={22} />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-black text-white">
                    Aylık & Tarih Bazlı Yayınlanan Seriler
                  </h2>
                  <p className="text-xs text-amber-200/80">
                    Ayın belirli günlerinde (Örn: Ayın 9, 19, 29'u veya 1'i ve 15'i) gelen özel takvimli seriler
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto">
                <span className="text-xs font-black bg-amber-950 text-amber-300 border border-amber-500/40 px-3 py-1 rounded-xl shadow-sm">
                  {filteredMonthlySeries.length} Seri
                </span>
              </div>
            </div>

            {/* Type Filters for Monthly */}
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
                {['Hepsi', 'Manhwa', 'Web Novel', 'Manga', 'Manhua', 'Webtoon'].map(t => (
                  <button
                    key={t}
                    onClick={() => setFilterType(t)}
                    className={`px-3 py-1.5 rounded-xl font-bold text-xs whitespace-nowrap transition cursor-pointer border ${
                      filterType === t
                        ? 'bg-amber-600 border-amber-400 text-white shadow'
                        : 'bg-gray-900/80 border-gray-800 text-gray-400 hover:text-gray-200'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>

              {searchQuery && (
                <span className="text-xs text-amber-300 bg-amber-950/70 border border-amber-500/40 px-2.5 py-0.5 rounded-full">
                  "{searchQuery}" araması filtrelendi
                </span>
              )}
            </div>
          </div>

          {/* Monthly Series Grid */}
          {filteredMonthlySeries.length === 0 ? (
            <div className="bg-gray-950/60 border border-purple-500/15 rounded-3xl p-8 text-center text-gray-400 space-y-2">
              <CalendarDays size={32} className="mx-auto text-amber-400 opacity-60" />
              <p className="font-bold text-sm text-gray-200">
                {searchQuery
                  ? `"${searchQuery}" aramasına uygun aylık takvim serisi bulunamadı.`
                  : 'Aylık veya tarih bazlı planlanmış seri bulunmuyor.'}
              </p>
              <p className="text-xs text-gray-500 max-w-md mx-auto">
                Yönetim panelinden serilerin yayın günü alanına <strong className="text-amber-300">9, 19, 29</strong> gibi tarihler yazarak bu takvimde listelenmesini sağlayabilirsiniz.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredMonthlySeries.map(series => {
                const latestChapter = series.chapters && series.chapters.length > 0 
                  ? [...series.chapters].sort((a, b) => b.number - a.number)[0] 
                  : null;
                
                return (
                  <div
                    key={series.id}
                    className="bg-gray-900/90 border border-purple-500/25 hover:border-amber-500/50 rounded-3xl p-4 flex items-center gap-4 hover:shadow-amber-950/30 transition-all duration-300 shadow-xl group"
                  >
                    <div 
                      onClick={() => setView({ type: 'series-detail', seriesId: series.id })}
                      className="relative w-20 h-28 rounded-2xl overflow-hidden flex-shrink-0 border border-purple-500/30 shadow-md bg-gray-950 cursor-pointer"
                    >
                      <img
                        src={getOptimizedImageUrl(series.coverImage, { width: 100, height: 140, quality: 75 })}
                        onError={(e) => handleImageError(e, series.coverImage, series.title)}
                        alt={series.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      />
                      <DiagonalStatusRibbon status={series.status} size="sm" />
                      {series.is18Plus && (
                        <span className="absolute top-1 right-1 bg-rose-600 text-white font-black text-[9px] px-1 py-0.2 rounded shadow">
                          18+
                        </span>
                      )}
                    </div>

                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-[10px] px-2 py-0.5 rounded-md font-extrabold ${getTypeBadgeClass(series.type)}`}>
                          {series.type}
                        </span>
                        <span className="text-[10px] bg-amber-950 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-md font-extrabold flex items-center gap-1 shadow-sm">
                          <Calendar size={10} />
                          Ayın {series.releaseDay}'u
                        </span>
                      </div>

                      <h3 
                        onClick={() => setView({ type: 'series-detail', seriesId: series.id })}
                        className="font-extrabold text-sm sm:text-base text-white truncate group-hover:text-amber-300 cursor-pointer transition"
                      >
                        {series.title}
                      </h3>

                      {latestChapter ? (
                        <span className="inline-block text-[11px] bg-purple-950/80 text-purple-200 border border-purple-500/40 px-2.5 py-0.5 rounded-lg font-bold">
                          Bölüm {latestChapter.number}
                        </span>
                      ) : (
                        <span className="text-[11px] text-gray-500">Henüz bölüm yok</span>
                      )}

                      <div className="pt-1">
                        <button
                          onClick={() => setView({ type: 'series-detail', seriesId: series.id })}
                          className="inline-flex items-center gap-1 text-xs font-bold text-amber-300 hover:text-white bg-amber-950/60 hover:bg-amber-600 px-3 py-1 rounded-xl transition cursor-pointer border border-amber-500/30"
                        >
                          <span>Seriye Git</span>
                          <ChevronRight size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

    </div>
  );
};
