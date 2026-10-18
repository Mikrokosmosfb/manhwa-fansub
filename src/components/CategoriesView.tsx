import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { GENRE_LIST } from '../data/mockData';
import { SeriesCard } from './SeriesCard';
import { Tags, RotateCcw, ShieldAlert, Sparkles, Search, X, Check, Layers, Activity } from 'lucide-react';
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
  const [filterSearch, setFilterSearch] = useState('');

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
    setFilterSearch('');
  };

  const hasActiveFilters =
    selectedTypes.length > 0 ||
    selectedStatus !== 'Tümü' ||
    selectedGenres.length > 0 ||
    selectedBadges.length > 0 ||
    Boolean(searchQuery);

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
            Sıfır açılır menü! İstediğiniz kategori ve etiket butonlarına tıklayarak serileri anında süzün.
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

      {/* Main Filter Container - ABSOLUTELY NO SELECT DROPDOWNS */}
      <div className="p-4 sm:p-6 rounded-3xl bg-gray-900/90 border border-purple-500/20 shadow-2xl space-y-6">
        
        {/* Top Search Bar & Reset */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-b border-gray-800 pb-4">
          <div className="relative w-full sm:w-96">
            <input
              type="text"
              placeholder="Seri adı, kategori veya etiket ara..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-gray-950 border border-purple-500/30 text-white placeholder-gray-500 text-xs rounded-xl pl-9 pr-8 py-2.5 focus:outline-none focus:ring-2 focus:ring-purple-400 font-bold shadow-inner"
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

          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="w-full sm:w-auto px-4 py-2.5 bg-rose-950/80 hover:bg-rose-900 border border-rose-800/60 text-rose-300 hover:text-white rounded-2xl text-xs font-black transition flex items-center justify-center gap-2 cursor-pointer shadow-lg active:scale-95"
            >
              <RotateCcw size={14} />
              <span>Tüm Filtreleri Temizle</span>
            </button>
          )}
        </div>

        {/* Section 1: Format / Tür (Pill Buttons) */}
        <div className="space-y-2">
          <label className="text-xs font-black text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
            <Layers size={14} className="text-purple-400" />
            <span>Format / Yayın Türü</span>
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setSelectedTypes([])}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer shadow-sm ${
                selectedTypes.length === 0
                  ? 'bg-purple-600 text-white font-black shadow-purple-900/50'
                  : 'bg-gray-950 text-gray-400 hover:text-white hover:bg-purple-950/60 border border-gray-800'
              }`}
            >
              Tüm Formatlar
            </button>
            {['Manhwa', 'Web Novel', 'Webtoon', 'Manga', 'Manhua'].map(type => {
              const isSelected = selectedTypes.includes(type);
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => {
                    setSelectedTypes(prev =>
                      prev.includes(type) ? prev.filter(x => x !== type) : [...prev, type]
                    );
                  }}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm ${
                    isSelected
                      ? 'bg-purple-600 text-white font-black ring-2 ring-purple-400/40 shadow-purple-900/50'
                      : 'bg-gray-950 text-gray-300 hover:text-white hover:bg-purple-950/60 border border-purple-500/20'
                  }`}
                >
                  {isSelected && <Check size={13} className="stroke-[3]" />}
                  <span>{type}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Section 2: Yayın Durumu (Pill Buttons) */}
        <div className="space-y-2 pt-3 border-t border-gray-800/80">
          <label className="text-xs font-black text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
            <Activity size={14} className="text-indigo-400" />
            <span>Yayın Durumu</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {['Tümü', 'Devam Ediyor', 'Güncel', 'Tamamlandı', 'Yakında'].map(st => {
              const isSelected = selectedStatus === st;
              return (
                <button
                  key={st}
                  type="button"
                  onClick={() => setSelectedStatus(st)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer shadow-sm ${
                    isSelected
                      ? 'bg-indigo-600 text-white font-black ring-2 ring-indigo-400/40 shadow-indigo-900/50'
                      : 'bg-gray-950 text-gray-300 hover:text-white hover:bg-indigo-950/60 border border-indigo-500/20'
                  }`}
                >
                  {st}
                </button>
              );
            })}
          </div>
        </div>

        {/* Filter Search & Badges Box */}
        <div className="pt-3 border-t border-gray-800/80 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <label className="text-xs font-black text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles size={14} className="text-amber-400" />
              <span>Özel Etiketler ({allCustomBadges.length}) & Kategoriler ({allCategoryGenres.length})</span>
            </label>

            {/* In-box Quick Search Filter */}
            <div className="relative w-full sm:w-64">
              <input
                type="text"
                placeholder="Etiket veya kategori süz..."
                value={filterSearch}
                onChange={e => setFilterSearch(e.target.value)}
                className="w-full bg-gray-950 border border-gray-800 text-white placeholder-gray-500 text-xs rounded-xl pl-8 pr-7 py-1.5 focus:outline-none focus:border-amber-400 font-bold"
              />
              <Search size={13} className="absolute left-2.5 top-2.5 text-gray-400 pointer-events-none" />
              {filterSearch && (
                <button
                  onClick={() => setFilterSearch('')}
                  className="absolute right-2 top-2 text-gray-400 hover:text-white cursor-pointer"
                >
                  <X size={12} />
                </button>
              )}
            </div>
          </div>

          {/* Section 3: Özel Etiketler (FULLY OPEN BUTTON GRID) */}
          {allCustomBadges.length > 0 && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-gray-400">Özel Etiketler:</span>
                {selectedBadges.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setSelectedBadges([])}
                    className="text-[10px] text-amber-400 hover:underline font-bold cursor-pointer"
                  >
                    Etiketleri Temizle ({selectedBadges.length})
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto pr-1">
                {allCustomBadges
                  .filter(b => b.toLowerCase().includes(filterSearch.toLowerCase().trim()))
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
                              ? 'bg-rose-600 text-white font-black shadow ring-2 ring-rose-400/50'
                              : 'bg-gradient-to-r from-amber-500 to-yellow-400 text-black font-black border border-amber-300 shadow ring-2 ring-amber-400/50'
                            : is18
                            ? 'bg-rose-950/60 text-rose-300 border border-rose-800/60 hover:bg-rose-900/60'
                            : 'bg-gray-950 text-gray-300 hover:bg-amber-950/60 border border-amber-500/20'
                        }`}
                      >
                        {isSelected && <Check size={13} className="stroke-[3]" />}
                        <span>{badge}</span>
                        {count > 0 && (
                          <span className={`text-[10px] px-1.5 py-0.2 rounded-md ${
                            isSelected ? 'bg-black/30 text-black font-black' : 'bg-black/50 text-amber-300 font-bold'
                          }`}>
                            {count}
                          </span>
                        )}
                      </button>
                    );
                  })}
              </div>
            </div>
          )}

          {/* Section 4: Konu Türleri & Kategoriler (FULLY OPEN BUTTON GRID) */}
          <div className="space-y-1.5 pt-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-gray-400">Konu Türleri & Kategoriler:</span>
              {selectedGenres.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedGenres([])}
                  className="text-[10px] text-purple-400 hover:underline font-bold cursor-pointer"
                >
                  Kategorileri Temizle ({selectedGenres.length})
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5 max-h-64 overflow-y-auto pr-1">
              {allCategoryGenres
                .filter(g => g.toLowerCase().includes(filterSearch.toLowerCase().trim()))
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
                          ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-black shadow ring-2 ring-purple-400/50'
                          : 'bg-gray-950 text-gray-300 hover:bg-purple-950/60 border border-purple-500/20'
                      }`}
                    >
                      {isSelected && <Check size={13} className="stroke-[3]" />}
                      <span>{g}</span>
                      {count > 0 && (
                        <span className={`text-[10px] px-1.5 py-0.2 rounded-md ${
                          isSelected ? 'bg-white/20 text-white font-black' : 'bg-black/50 text-purple-300 font-bold'
                        }`}>
                          {count}
                        </span>
                      )}
                    </button>
                  );
                })}
            </div>
          </div>

        </div>

        {/* Active Selected Badges Bar */}
        {hasActiveFilters && (
          <div className="pt-3 border-t border-gray-800/80 flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-bold text-gray-400">Seçili Filtreler:</span>

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
