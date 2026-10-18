import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { GENRE_LIST } from '../data/mockData';
import { SeriesCard } from './SeriesCard';
import { Tags, RotateCcw, ShieldAlert, Sparkles, Search, X, Filter } from 'lucide-react';
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

    // Search Query (title, genre, custom badges)
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
            Çoklu kategori, özel etiket, tür ve yayın durumu seçerek serileri anında listeleyin.
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
            <span>18+ / Yetişkin İçerikler: {showNsfw ? 'AÇIK (Görünüyor)' : 'KAPALI (Gizli)'}</span>
          </button>
        </div>
      </div>

      {/* Filter Control Box */}
      <div className="p-4 sm:p-6 rounded-3xl bg-gray-900/90 border border-purple-500/30 shadow-xl space-y-4">
        {/* Search bar inside Filter Box */}
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Seri adı, kategori veya etiket ara..."
            className="w-full bg-gray-950 border border-purple-500/30 rounded-xl pl-10 pr-9 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-purple-400 font-bold"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white cursor-pointer"
            >
              <X size={15} />
            </button>
          )}
        </div>

        {/* Dropdown Filters Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* 1. Format / Tür Dropdown */}
          <div className="space-y-1">
            <label className="text-[11px] font-black text-purple-300 uppercase tracking-wider block">
              Format / Tür
            </label>
            <div className="relative">
              <select
                value=""
                onChange={e => {
                  const val = e.target.value;
                  if (!val) return;
                  if (val === 'Tümü') setSelectedTypes([]);
                  else setSelectedTypes(prev => prev.includes(val) ? prev.filter(x => x !== val) : [...prev, val]);
                }}
                className="w-full bg-gray-950 border border-purple-500/40 text-white font-extrabold text-xs rounded-xl px-3 py-2.5 appearance-none focus:outline-none focus:border-purple-400 cursor-pointer pr-8"
              >
                <option value="" disabled>
                  {selectedTypes.length === 0 ? '➕ Format Seçin (Çoklu)' : `Formatlar (${selectedTypes.length} Seçili)`}
                </option>
                <option value="Tümü" className="bg-gray-950 text-white font-bold">
                  🔄 Formatları Sıfırla
                </option>
                {['Manhwa', 'Web Novel', 'Webtoon', 'Manga', 'Manhua'].map(t => (
                  <option key={t} value={t} className="bg-gray-950 text-white font-bold">
                    {selectedTypes.includes(t) ? `✓ ${t}` : t}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-purple-400 font-bold text-xs">▼</div>
            </div>
          </div>

          {/* 2. Yayın Durumu Dropdown */}
          <div className="space-y-1">
            <label className="text-[11px] font-black text-purple-300 uppercase tracking-wider block">
              Yayın Durumu
            </label>
            <div className="relative">
              <select
                value={selectedStatus}
                onChange={e => setSelectedStatus(e.target.value)}
                className="w-full bg-gray-950 border border-purple-500/40 text-white font-extrabold text-xs rounded-xl px-3 py-2.5 appearance-none focus:outline-none focus:border-purple-400 cursor-pointer pr-8"
              >
                {['Tümü', 'Devam Ediyor', 'Tamamlandı', 'Güncel', 'Yakında'].map(st => (
                  <option key={st} value={st} className="bg-gray-950 text-white font-bold">
                    {st === 'Tümü' ? 'Tüm Durumlar' : st}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-purple-400 font-bold text-xs">▼</div>
            </div>
          </div>

          {/* 3. Özel Etiketler Dropdown */}
          {allCustomBadges.length > 0 && (
            <div className="space-y-1">
              <label className="text-[11px] font-black text-amber-300 uppercase tracking-wider block flex items-center gap-1">
                <Sparkles size={12} className="text-amber-400" />
                Özel Etiketler ({allCustomBadges.length})
              </label>
              <div className="relative">
                <select
                  value=""
                  onChange={e => {
                    const val = e.target.value;
                    if (!val) return;
                    if (val === 'Tümü') setSelectedBadges([]);
                    else setSelectedBadges(prev => prev.includes(val) ? prev.filter(x => x !== val) : [...prev, val]);
                  }}
                  className="w-full bg-gray-950 border border-amber-500/40 text-amber-300 font-extrabold text-xs rounded-xl px-3 py-2.5 appearance-none focus:outline-none focus:border-amber-400 cursor-pointer pr-8"
                >
                  <option value="" disabled>
                    {selectedBadges.length === 0 ? '✨ Etiket Seçin (Çoklu)' : `Etiketler (${selectedBadges.length} Seçili)`}
                  </option>
                  <option value="Tümü" className="bg-gray-950 text-white font-bold">
                    🔄 Etiketleri Sıfırla
                  </option>
                  {allCustomBadges.map(badge => {
                    const count = visibleSeriesList.filter(s => matchTag(s, badge)).length;
                    const isSelected = selectedBadges.includes(badge);
                    return (
                      <option key={badge} value={badge} className="bg-gray-950 text-white font-bold">
                        {isSelected ? `✓ ${badge}` : badge} {count > 0 ? `(${count})` : ''}
                      </option>
                    );
                  })}
                </select>
                <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-amber-400 font-bold text-xs">▼</div>
              </div>
            </div>
          )}

          {/* 4. Konu Türleri & Kategoriler Dropdown */}
          <div className="space-y-1">
            <label className="text-[11px] font-black text-purple-300 uppercase tracking-wider block flex items-center gap-1">
              <Tags size={12} className="text-purple-400" />
              Kategoriler ({allCategoryGenres.length})
            </label>
            <div className="relative">
              <select
                value=""
                onChange={e => {
                  const val = e.target.value;
                  if (!val) return;
                  if (val === 'Tümü') setSelectedGenres([]);
                  else setSelectedGenres(prev => prev.includes(val) ? prev.filter(x => x !== val) : [...prev, val]);
                }}
                className="w-full bg-gray-950 border border-purple-500/40 text-purple-200 font-extrabold text-xs rounded-xl px-3 py-2.5 appearance-none focus:outline-none focus:border-purple-400 cursor-pointer pr-8"
              >
                <option value="" disabled>
                  {selectedGenres.length === 0 ? '🏷️ Kategori Seçin (Çoklu)' : `Kategoriler (${selectedGenres.length} Seçili)`}
                </option>
                <option value="Tümü" className="bg-gray-950 text-white font-bold">
                  🔄 Kategorileri Sıfırla
                </option>
                {allCategoryGenres.map(g => {
                  const count = visibleSeriesList.filter(s => matchTag(s, g)).length;
                  const isSelected = selectedGenres.includes(g);
                  return (
                    <option key={g} value={g} className="bg-gray-950 text-white font-bold">
                      {isSelected ? `✓ ${g}` : g} {count > 0 ? `(${count})` : ''}
                    </option>
                  );
                })}
              </select>
              <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-purple-400 font-bold text-xs">▼</div>
            </div>
          </div>
        </div>

        {/* Active Filter Badges Bar */}
        {hasActiveFilters && (
          <div className="pt-3 border-t border-gray-800/80 space-y-2">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="text-gray-400 font-black text-[11px] flex items-center gap-1">
                <Filter size={12} className="text-purple-400" /> Aktif Filtreler:
              </span>

              {selectedTypes.map(t => (
                <span key={t} className="bg-purple-950/90 text-purple-200 border border-purple-500/50 px-2.5 py-1 rounded-xl font-extrabold flex items-center gap-1.5 shadow-sm">
                  Format: {t}
                  <X size={13} className="cursor-pointer hover:text-white" onClick={() => setSelectedTypes(prev => prev.filter(x => x !== t))} />
                </span>
              ))}

              {selectedStatus !== 'Tümü' && (
                <span className="bg-indigo-950/90 text-indigo-200 border border-indigo-500/50 px-2.5 py-1 rounded-xl font-extrabold flex items-center gap-1.5 shadow-sm">
                  Durum: {selectedStatus}
                  <X size={13} className="cursor-pointer hover:text-white" onClick={() => setSelectedStatus('Tümü')} />
                </span>
              )}

              {selectedBadges.map(b => (
                <span key={b} className="bg-amber-950/90 text-amber-200 border border-amber-500/50 px-2.5 py-1 rounded-xl font-extrabold flex items-center gap-1.5 shadow-sm">
                  Etiket: {b}
                  <X size={13} className="cursor-pointer hover:text-white" onClick={() => setSelectedBadges(prev => prev.filter(x => x !== b))} />
                </span>
              ))}

              {selectedGenres.map(g => (
                <span key={g} className="bg-purple-950/90 text-purple-200 border border-purple-500/50 px-2.5 py-1 rounded-xl font-extrabold flex items-center gap-1.5 shadow-sm">
                  Kategori: {g}
                  <X size={13} className="cursor-pointer hover:text-white" onClick={() => setSelectedGenres(prev => prev.filter(x => x !== g))} />
                </span>
              ))}

              {searchQuery && (
                <span className="bg-cyan-950/90 text-cyan-200 border border-cyan-500/50 px-2.5 py-1 rounded-xl font-extrabold flex items-center gap-1.5 shadow-sm">
                  Arama: {searchQuery}
                  <X size={13} className="cursor-pointer hover:text-white" onClick={() => setSearchQuery('')} />
                </span>
              )}

              <button
                onClick={resetFilters}
                className="text-xs font-bold text-rose-400 hover:text-rose-300 bg-rose-950/40 border border-rose-800/40 px-2.5 py-1 rounded-xl transition flex items-center gap-1 cursor-pointer ml-auto"
              >
                <RotateCcw size={12} />
                <span>Tüm Filtreleri Temizle</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between border-b border-gray-800 pb-3">
        <h2 className="text-sm font-bold text-gray-300 flex items-center gap-2">
          <span>Sonuçlar ({filteredSeries.length} Seri)</span>
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
            className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl shadow transition"
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
