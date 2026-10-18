import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { GENRE_LIST } from '../data/mockData';
import { SeriesCard } from './SeriesCard';
import { Tags, RotateCcw, ShieldAlert, Sparkles, Search, X, Check, Filter, ChevronDown, Layers, Activity } from 'lucide-react';
import { isSeries18Plus, Series, isAuthorizedAdmin } from '../types';

interface CategoriesViewProps {
  initialGenre?: string;
}

export const CategoriesView: React.FC<CategoriesViewProps> = ({ initialGenre }) => {
  const { seriesList, showNsfw, toggleNsfw, isAdminLoggedIn, user } = useApp();
  const isUserAdmin = isAdminLoggedIn || isAuthorizedAdmin(user?.email);
  const baseSeries = isUserAdmin ? seriesList : seriesList.filter(s => !s.isDraft);
  const visibleSeriesList = showNsfw ? baseSeries : baseSeries.filter(s => !isSeries18Plus(s));

  // Collect all unique custom badges and manual tags across all visible series
  const allSeriesBadges = visibleSeriesList.flatMap(s => s.customBadges || []);
  const presetBadges = ['Renkli', 'Sansürsüz', 'Popüler', 'Sezon Finali', 'HD', '18+'];
  const allCustomBadges = Array.from(new Set([...presetBadges, ...allSeriesBadges]))
    .map(b => b.trim())
    .filter(Boolean);

  // Collect all unique genres across all visible series + predefined GENRE_LIST
  const allCategoryGenres = Array.from(
    new Set([
      ...GENRE_LIST,
      ...visibleSeriesList.flatMap(s => s.genres || [])
    ])
  )
    .map(g => g.trim())
    .filter(Boolean);

  // Check if initialGenre matches a custom badge
  const isInitialBadge = initialGenre && (
    allCustomBadges.some(b => b.toLowerCase().trim() === initialGenre.toLowerCase().trim())
  );

  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string>('Tümü');
  const [selectedGenres, setSelectedGenres] = useState<string[]>(() => {
    if (!initialGenre) return [];
    return isInitialBadge ? [] : [initialGenre];
  });
  const [selectedBadges, setSelectedBadges] = useState<string[]>(() => {
    if (!initialGenre) return [];
    return isInitialBadge ? [initialGenre] : [];
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(true);
  const [genreSearch, setGenreSearch] = useState('');

  // Helper to match either custom badges or genres
  const matchTag = (s: Series, target: string) => {
    if (target === 'Tümü') return true;
    const tLower = target.toLowerCase().trim();
    if (tLower === '18+' || tLower === '+18') {
      return (
        Boolean(s.is18Plus) ||
        (s.genres || []).some(g => g.toLowerCase().includes('18+')) ||
        (s.customBadges || []).some(b => b.toLowerCase().includes('18+'))
      );
    }
    const inBadges = (s.customBadges || []).some(b => b.toLowerCase().trim() === tLower);
    const inGenres = (s.genres || []).some(g => g.toLowerCase().trim() === tLower);
    return inBadges || inGenres;
  };

  const filteredSeries = visibleSeriesList.filter(s => {
    if (selectedTypes.length > 0 && !selectedTypes.includes(s.type)) return false;
    if (selectedStatus !== 'Tümü' && s.status !== selectedStatus) return false;

    // Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchTitle = s.title.toLowerCase().includes(q);
      const matchBadge = (s.customBadges || []).some(b => b.toLowerCase().includes(q));
      const matchGenre = (s.genres || []).some(g => g.toLowerCase().includes(q));
      if (!matchTitle && !matchBadge && !matchGenre) return false;
    }

    // Multiple Genre Filter (AND logic)
    if (selectedGenres.length > 0) {
      const hasAll = selectedGenres.every(g => matchTag(s, g));
      if (!hasAll) return false;
    }

    // Multiple Custom Extra Tag / Badge Filter (AND logic)
    if (selectedBadges.length > 0) {
      const hasAll = selectedBadges.every(b => matchTag(s, b));
      if (!hasAll) return false;
    }

    return true;
  });

  const resetFilters = () => {
    setSelectedTypes([]);
    setSelectedStatus('Tümü');
    setSelectedGenres([]);
    setSelectedBadges([]);
    setSearchQuery('');
    setGenreSearch('');
  };

  const hasActiveFilters =
    selectedTypes.length > 0 ||
    selectedStatus !== 'Tümü' ||
    selectedGenres.length > 0 ||
    selectedBadges.length > 0 ||
    Boolean(searchQuery);

  const totalTagCount = selectedGenres.length + selectedBadges.length;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6 animate-fadeIn">
      {/* Title & Top Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-3">
            <Tags className="text-purple-400" size={30} />
            Kategoriler & Özel Etiketler
          </h1>
          <p className="text-xs sm:text-sm text-gray-400 mt-1">
            İstediğiniz kategori ve etiketleri seçerek serileri anında süzün.
          </p>
        </div>

        {/* NSFW 18+ Toggle Button */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={toggleNsfw}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 border cursor-pointer shadow-md ${
              showNsfw
                ? 'bg-rose-900/80 border-rose-500/60 text-rose-200'
                : 'bg-gray-900 border-gray-800 text-gray-400 hover:text-gray-200'
            }`}
          >
            <ShieldAlert size={15} className={showNsfw ? 'text-rose-400' : 'text-gray-500'} />
            <span>18+ İçerikler: {showNsfw ? 'AÇIK' : 'KAPALI'}</span>
          </button>
        </div>
      </div>

      {/* Main Filter Control Box (Identical to SeriesListView style) */}
      <div className="p-4 sm:p-5 rounded-3xl bg-gray-900/90 border border-purple-500/20 shadow-xl space-y-4">
        
        {/* Row 1: Search, Format Pills & Status Pills */}
        <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
          
          {/* Main Search box */}
          <div className="relative w-full lg:w-80">
            <input
              type="text"
              placeholder="Seri adı veya etiket ara..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-gray-950 border border-purple-500/30 text-white placeholder-gray-500 text-xs rounded-xl pl-9 pr-8 py-2.5 focus:outline-none focus:ring-2 focus:ring-purple-400 font-bold"
            />
            <Search size={15} className="absolute left-3 top-3 text-purple-400 pointer-events-none" />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2.5 text-gray-400 hover:text-white cursor-pointer"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Type Filter Tabs (Format Pills) */}
          <div className="flex items-center gap-1.5 bg-gray-950 p-1 rounded-2xl border border-gray-800 w-full lg:w-auto overflow-x-auto no-scrollbar">
            <button
              type="button"
              onClick={() => setSelectedTypes([])}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                selectedTypes.length === 0
                  ? 'bg-purple-600 text-white shadow shadow-purple-900/40'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Tüm Formatlar
            </button>
            {['Manhwa', 'Web Novel', 'Webtoon', 'Manga', 'Manhua'].map(t => {
              const isSelected = selectedTypes.includes(t);
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => {
                    setSelectedTypes(prev =>
                      prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]
                    );
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer flex items-center gap-1 ${
                    isSelected
                      ? 'bg-purple-600 text-white shadow shadow-purple-900/40 font-black'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {isSelected && <Check size={12} className="stroke-[3]" />}
                  <span>{t}</span>
                </button>
              );
            })}
          </div>

          {/* Status Select / Pills */}
          <div className="flex items-center gap-1.5 bg-gray-950 p-1 rounded-2xl border border-gray-800 w-full lg:w-auto overflow-x-auto no-scrollbar">
            <span className="text-[11px] font-extrabold text-gray-500 px-2 hidden sm:inline">Durum:</span>
            {['Tümü', 'Devam Ediyor', 'Güncel', 'Tamamlandı', 'Yakında'].map(st => {
              const isSelected = selectedStatus === st;
              return (
                <button
                  key={st}
                  type="button"
                  onClick={() => setSelectedStatus(st)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-600 text-white shadow shadow-indigo-900/40 font-black'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {st}
                </button>
              );
            })}
          </div>

        </div>

        {/* Row 2: Custom Popover Filter Button (Exact copy of SeriesListView) */}
        <div className="pt-2.5 border-t border-gray-800/80 space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsFilterPanelOpen(!isFilterPanelOpen)}
                className={`px-4 py-2.5 rounded-2xl text-xs font-black transition flex items-center gap-2 border cursor-pointer shadow-lg active:scale-95 ${
                  totalTagCount > 0
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white border-purple-400 ring-2 ring-purple-400/30'
                    : 'bg-gray-950 text-purple-200 border-purple-500/40 hover:bg-purple-950/60'
                }`}
              >
                <Filter size={15} className="text-amber-400" />
                <span>
                  {totalTagCount === 0
                    ? '🎨 Tür & Etiket Filtresi Aç'
                    : `🎨 Tür Filtresi (${totalTagCount} Seçili)`}
                </span>
                <ChevronDown
                  size={16}
                  className={`transition-transform duration-300 ${isFilterPanelOpen ? 'rotate-180 text-amber-300' : ''}`}
                />
              </button>

              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="text-xs font-extrabold text-rose-400 hover:text-rose-300 bg-rose-950/50 border border-rose-800/50 px-3 py-2 rounded-xl transition flex items-center gap-1 cursor-pointer"
                >
                  <X size={14} />
                  <span>Tümünü Sıfırla</span>
                </button>
              )}
            </div>
          </div>

          {/* Custom Dropdown Expanded Panel (Exact copy of SeriesListView panel design) */}
          {isFilterPanelOpen && (
            <div className="p-4 bg-gray-950/95 border-2 border-purple-500/40 rounded-2xl shadow-2xl space-y-3 animate-fadeIn">
              
              {/* Top Search & Close Bar inside Box */}
              <div className="flex items-center justify-between gap-2 border-b border-gray-800 pb-2.5">
                <div className="relative flex-1">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Tür veya etiket ara..."
                    value={genreSearch}
                    onChange={e => setGenreSearch(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-purple-400 font-bold"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setIsFilterPanelOpen(false)}
                  className="p-1.5 bg-gray-900 hover:bg-gray-800 text-gray-400 hover:text-white rounded-xl border border-gray-700 transition cursor-pointer shrink-0"
                  title="Kapat"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Combined Custom Badges & Genres Grid Box */}
              <div className="space-y-3">
                
                {/* Özel Etiketler */}
                {allCustomBadges.length > 0 && (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-black text-amber-300 uppercase tracking-wider flex items-center gap-1">
                        <Sparkles size={12} className="text-amber-400" />
                        Özel Etiketler ({allCustomBadges.length})
                      </span>
                      {selectedBadges.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setSelectedBadges([])}
                          className="text-[10px] text-amber-400 hover:underline font-bold cursor-pointer"
                        >
                          Temizle
                        </button>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1">
                      {allCustomBadges
                        .filter(b => b.toLowerCase().includes(genreSearch.toLowerCase().trim()))
                        .map(badge => {
                          const is18 = badge === '18+' || badge === '+18';
                          const isSelected = selectedBadges.includes(badge);
                          const count = visibleSeriesList.filter(s => matchTag(s, badge)).length;
                          return (
                            <button
                              key={badge}
                              type="button"
                              onClick={() => {
                                setSelectedBadges(prev =>
                                  prev.includes(badge) ? prev.filter(x => x !== badge) : [...prev, badge]
                                );
                              }}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm ${
                                isSelected
                                  ? is18
                                    ? 'bg-rose-600 text-white font-black border border-rose-400 ring-2 ring-rose-400/40'
                                    : 'bg-gradient-to-r from-amber-500 to-yellow-400 text-black font-black border border-amber-300 ring-2 ring-amber-400/40'
                                  : is18
                                  ? 'bg-rose-950/60 text-rose-300 border border-rose-800/60 hover:bg-rose-900/60'
                                  : 'bg-gray-900 text-gray-200 hover:bg-purple-950/80 border border-purple-500/20'
                              }`}
                            >
                              {isSelected && <Check size={13} className="stroke-[3]" />}
                              <span>{badge}</span>
                              <span className={`text-[10px] px-1.5 py-0.2 rounded-md ${
                                isSelected ? 'bg-black/30 text-black font-black' : 'bg-black/50 text-purple-300'
                              }`}>
                                {count}
                              </span>
                            </button>
                          );
                        })}
                    </div>
                  </div>
                )}

                {/* Konu Türleri & Kategoriler */}
                <div className="space-y-1.5 pt-2 border-t border-gray-800">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-black text-purple-300 uppercase tracking-wider flex items-center gap-1">
                      <Tags size={12} className="text-purple-400" />
                      Konu Türleri & Kategoriler ({allCategoryGenres.length})
                    </span>
                    {selectedGenres.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setSelectedGenres([])}
                        className="text-[10px] text-purple-400 hover:underline font-bold cursor-pointer"
                      >
                        Temizle
                      </button>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1.5 max-h-56 overflow-y-auto pr-1">
                    {allCategoryGenres
                      .filter(g => g.toLowerCase().includes(genreSearch.toLowerCase().trim()))
                      .map(g => {
                        const isSelected = selectedGenres.includes(g);
                        const count = visibleSeriesList.filter(s => matchTag(s, g)).length;
                        return (
                          <button
                            key={g}
                            type="button"
                            onClick={() => {
                              setSelectedGenres(prev =>
                                prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g]
                              );
                            }}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm ${
                              isSelected
                                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-black border border-purple-400 ring-2 ring-purple-400/40'
                                : 'bg-gray-900 text-gray-200 hover:bg-purple-950/80 border border-purple-500/20'
                            }`}
                          >
                            {isSelected && <Check size={13} className="stroke-[3]" />}
                            <span>{g}</span>
                            <span className={`text-[10px] px-1.5 py-0.2 rounded-md ${
                              isSelected ? 'bg-white/20 text-white font-black' : 'bg-black/50 text-purple-300'
                            }`}>
                              {count}
                            </span>
                          </button>
                        );
                      })}
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* Active Filter Badges */}
          {hasActiveFilters && (
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[11px] font-bold text-gray-400">Aktif Filtreler:</span>

              {selectedTypes.map(t => (
                <span key={t} className="bg-purple-950/90 text-purple-200 border border-purple-500/50 px-2.5 py-1 rounded-xl text-xs font-extrabold flex items-center gap-1.5 shadow-sm">
                  Format: {t}
                  <X size={13} className="cursor-pointer hover:text-white" onClick={() => setSelectedTypes(prev => prev.filter(x => x !== t))} />
                </span>
              ))}

              {selectedStatus !== 'Tümü' && (
                <span key={selectedStatus} className="bg-indigo-950/90 text-indigo-200 border border-indigo-500/50 px-2.5 py-1 rounded-xl text-xs font-extrabold flex items-center gap-1.5 shadow-sm">
                  Durum: {selectedStatus}
                  <X size={13} className="cursor-pointer hover:text-white" onClick={() => setSelectedStatus('Tümü')} />
                </span>
              )}

              {selectedBadges.map(b => (
                <span key={b} className="bg-amber-950/90 text-amber-200 border border-amber-500/50 px-2.5 py-1 rounded-xl text-xs font-extrabold flex items-center gap-1.5 shadow-sm">
                  Etiket: {b}
                  <X size={13} className="cursor-pointer hover:text-white" onClick={() => setSelectedBadges(prev => prev.filter(x => x !== b))} />
                </span>
              ))}

              {selectedGenres.map(g => (
                <span key={g} className="bg-purple-950/90 text-purple-200 border border-purple-500/50 px-2.5 py-1 rounded-xl text-xs font-extrabold flex items-center gap-1.5 shadow-sm">
                  Kategori: {g}
                  <X size={13} className="cursor-pointer hover:text-white" onClick={() => setSelectedGenres(prev => prev.filter(x => x !== g))} />
                </span>
              ))}

              {searchQuery && (
                <span className="bg-cyan-950/90 text-cyan-200 border border-cyan-500/50 px-2.5 py-1 rounded-xl text-xs font-extrabold flex items-center gap-1.5 shadow-sm">
                  Arama: {searchQuery}
                  <X size={13} className="cursor-pointer hover:text-white" onClick={() => setSearchQuery('')} />
                </span>
              )}
            </div>
          )}
        </div>

      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between border-b border-gray-800 pb-3">
        <h2 className="text-sm font-bold text-gray-300 flex items-center gap-2">
          <span>Bulunan Seriler: <strong className="text-white font-black text-base">{filteredSeries.length}</strong></span>
        </h2>
      </div>

      {/* Grid Results */}
      {filteredSeries.length === 0 ? (
        <div className="text-center py-16 bg-gray-900/50 rounded-3xl border border-gray-800 p-8 space-y-4">
          <div className="w-16 h-16 mx-auto rounded-full bg-purple-950/60 border border-purple-500/30 flex items-center justify-center text-purple-400">
            <Search size={32} />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-white">Sonuç Bulunamadı</h3>
            <p className="text-xs text-gray-400 max-w-md mx-auto">
              Seçtiğiniz kombinasyona uygun seri bulunamadı. Filtreleri temizleyerek tekrar deneyebilirsiniz.
            </p>
          </div>
          <button
            onClick={resetFilters}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl shadow transition cursor-pointer"
          >
            Filtreleri Temizle
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {filteredSeries.map(series => (
            <SeriesCard key={series.id} series={series} />
          ))}
        </div>
      )}
    </div>
  );
};
