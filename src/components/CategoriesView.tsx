import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { GENRE_LIST } from '../data/mockData';
import { SeriesCard } from './SeriesCard';
import { Tags, RotateCcw, ShieldAlert, Sparkles, Search, X } from 'lucide-react';
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

  const [selectedType, setSelectedType] = useState<string>('Tümü');
  const [selectedStatus, setSelectedStatus] = useState<string>('Tümü');
  const [selectedGenre, setSelectedGenre] = useState<string>(() => {
    if (!initialGenre) return 'Tümü';
    return isInitialBadge ? 'Tümü' : initialGenre;
  });
  const [selectedBadge, setSelectedBadge] = useState<string>(() => {
    if (!initialGenre) return 'Tümü';
    return isInitialBadge ? initialGenre : 'Tümü';
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
    if (selectedType !== 'Tümü' && s.type !== selectedType) return false;
    if (selectedStatus !== 'Tümü' && s.status !== selectedStatus) return false;

    // Search Query (title, genre, custom badges)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchTitle = s.title.toLowerCase().includes(q);
      const matchBadge = (s.customBadges || []).some(b => b.toLowerCase().includes(q));
      const matchGenre = (s.genres || []).some(g => g.toLowerCase().includes(q));
      if (!matchTitle && !matchBadge && !matchGenre) return false;
    }

    // Genre Filter
    if (selectedGenre !== 'Tümü' && !matchTag(s, selectedGenre)) return false;

    // Custom Extra Tag / Badge Filter
    if (selectedBadge !== 'Tümü' && !matchTag(s, selectedBadge)) return false;

    return true;
  });

  const resetFilters = () => {
    setSelectedType('Tümü');
    setSelectedStatus('Tümü');
    setSelectedGenre('Tümü');
    setSelectedBadge('Tümü');
    setSearchQuery('');
  };

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
            Konu türlerine, elle eklenen özel etiketlere, yayın durumuna ve formata göre kolayca filtreleyin.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => toggleNsfw()}
            className={`text-xs font-black px-3 py-2 rounded-xl border flex items-center gap-1.5 transition shadow-md cursor-pointer ${
              showNsfw
                ? 'bg-rose-950/90 border-rose-500/70 text-rose-300 hover:bg-rose-900'
                : 'bg-purple-950/80 border-purple-500/30 text-purple-300 hover:bg-purple-900'
            }`}
            title={showNsfw ? '+18 İçerikler Açık (Kapatmak için tıkla)' : '+18 İçerikler Gizli (Açmak için tıkla)'}
          >
            <span>🔞</span>
            <span>{showNsfw ? '+18 İçerikler Açık' : '+18 İçerikler Gizli'}</span>
          </button>

          <button
            onClick={resetFilters}
            className="bg-purple-950/80 hover:bg-purple-900 border border-purple-500/30 text-purple-300 hover:text-white text-xs font-semibold px-3 py-2 rounded-xl flex items-center gap-1.5 transition cursor-pointer"
          >
            <RotateCcw size={14} />
            Filtreleri Sıfırla
          </button>
        </div>
      </div>

      {/* Filter Control Box */}
      <div className="bg-gray-900/90 border border-purple-500/20 rounded-3xl p-5 shadow-xl space-y-5">
        {/* Search bar inside Filter Box */}
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-purple-400" />
          <input
            type="text"
            placeholder="Seri adı, kategori veya özel etiket ara..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-gray-950 border border-purple-500/30 text-white placeholder-gray-500 text-xs sm:text-sm rounded-xl pl-9 pr-9 py-2.5 focus:outline-none focus:border-purple-400 transition"
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
                value={selectedType}
                onChange={e => setSelectedType(e.target.value)}
                className="w-full bg-gray-950 border border-purple-500/40 text-white font-extrabold text-xs rounded-xl px-3 py-2.5 appearance-none focus:outline-none focus:border-purple-400 cursor-pointer pr-8"
              >
                {['Tümü', 'Manhwa', 'Web Novel', 'Webtoon', 'Manga', 'Manhua'].map(t => (
                  <option key={t} value={t} className="bg-gray-950 text-white font-bold">
                    {t === 'Tümü' ? 'Tüm Formatlar' : t}
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
                  value={selectedBadge}
                  onChange={e => setSelectedBadge(e.target.value)}
                  className="w-full bg-gray-950 border border-amber-500/40 text-amber-300 font-extrabold text-xs rounded-xl px-3 py-2.5 appearance-none focus:outline-none focus:border-amber-400 cursor-pointer pr-8"
                >
                  <option value="Tümü" className="bg-gray-950 text-white font-bold">
                    ✨ Tüm Özel Etiketler ({allCustomBadges.length})
                  </option>
                  {allCustomBadges.map(badge => {
                    const count = visibleSeriesList.filter(s => matchTag(s, badge)).length;
                    return (
                      <option key={badge} value={badge} className="bg-gray-950 text-white font-bold">
                        {badge} {count > 0 ? `(${count} Seri)` : ''}
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
                value={selectedGenre}
                onChange={e => setSelectedGenre(e.target.value)}
                className="w-full bg-gray-950 border border-purple-500/40 text-purple-200 font-extrabold text-xs rounded-xl px-3 py-2.5 appearance-none focus:outline-none focus:border-purple-400 cursor-pointer pr-8"
              >
                <option value="Tümü" className="bg-gray-950 text-white font-bold">
                  🏷️ Tüm Kategoriler ({allCategoryGenres.length})
                </option>
                {allCategoryGenres.map(g => {
                  const count = visibleSeriesList.filter(s => matchTag(s, g)).length;
                  return (
                    <option key={g} value={g} className="bg-gray-950 text-white font-bold">
                      {g} {count > 0 ? `(${count} Seri)` : ''}
                    </option>
                  );
                })}
              </select>
              <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-purple-400 font-bold text-xs">▼</div>
            </div>
          </div>
        </div>

        {/* Active Filters Bar / Reset Button */}
        {(selectedType !== 'Tümü' || selectedStatus !== 'Tümü' || selectedBadge !== 'Tümü' || selectedGenre !== 'Tümü' || searchQuery) && (
          <div className="pt-2 border-t border-gray-800/80 flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              <span className="text-gray-400 font-bold">Aktif Filtreler:</span>
              {selectedType !== 'Tümü' && (
                <span className="bg-purple-950 text-purple-300 border border-purple-500/40 px-2 py-0.5 rounded-lg font-bold flex items-center gap-1">
                  Format: {selectedType}
                  <X size={12} className="cursor-pointer hover:text-white" onClick={() => setSelectedType('Tümü')} />
                </span>
              )}
              {selectedStatus !== 'Tümü' && (
                <span className="bg-indigo-950 text-indigo-300 border border-indigo-500/40 px-2 py-0.5 rounded-lg font-bold flex items-center gap-1">
                  Durum: {selectedStatus}
                  <X size={12} className="cursor-pointer hover:text-white" onClick={() => setSelectedStatus('Tümü')} />
                </span>
              )}
              {selectedBadge !== 'Tümü' && (
                <span className="bg-amber-950 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-lg font-bold flex items-center gap-1">
                  Etiket: {selectedBadge}
                  <X size={12} className="cursor-pointer hover:text-white" onClick={() => setSelectedBadge('Tümü')} />
                </span>
              )}
              {selectedGenre !== 'Tümü' && (
                <span className="bg-purple-950 text-purple-300 border border-purple-500/40 px-2 py-0.5 rounded-lg font-bold flex items-center gap-1">
                  Kategori: {selectedGenre}
                  <X size={12} className="cursor-pointer hover:text-white" onClick={() => setSelectedGenre('Tümü')} />
                </span>
              )}
              {searchQuery && (
                <span className="bg-cyan-950 text-cyan-300 border border-cyan-500/40 px-2 py-0.5 rounded-lg font-bold flex items-center gap-1">
                  Arama: {searchQuery}
                  <X size={12} className="cursor-pointer hover:text-white" onClick={() => setSearchQuery('')} />
                </span>
              )}
            </div>
            <button
              onClick={() => {
                setSelectedType('Tümü');
                setSelectedStatus('Tümü');
                setSelectedBadge('Tümü');
                setSelectedGenre('Tümü');
                setSearchQuery('');
              }}
              className="text-xs font-bold text-rose-400 hover:text-rose-300 bg-rose-950/40 border border-rose-800/40 px-2.5 py-1 rounded-xl transition flex items-center gap-1 cursor-pointer ml-auto"
            >
              <RotateCcw size={12} />
              <span>Tüm Filtreleri Temizle</span>
            </button>
          </div>
        )}
      </div>

      {/* Results Header */}
      <div className="text-sm text-gray-400 font-medium flex items-center justify-between">
        <span>Bulunan Seriler: <strong className="text-white">{filteredSeries.length}</strong></span>
        {(selectedGenre !== 'Tümü' || selectedBadge !== 'Tümü' || selectedType !== 'Tümü' || selectedStatus !== 'Tümü' || searchQuery) && (
          <span className="text-xs text-purple-300">
            Aktif Filtreler: {[
              selectedType !== 'Tümü' && `Format: ${selectedType}`,
              selectedStatus !== 'Tümü' && `Durum: ${selectedStatus}`,
              selectedGenre !== 'Tümü' && `Tür: ${selectedGenre}`,
              selectedBadge !== 'Tümü' && `Etiket: ${selectedBadge}`,
              searchQuery && `Arama: "${searchQuery}"`
            ].filter(Boolean).join(' • ')}
          </span>
        )}
      </div>

      {/* Grid Results */}
      {filteredSeries.length === 0 ? (
        <div className="bg-gray-900/60 border border-purple-500/20 rounded-3xl p-12 text-center text-gray-400 space-y-3">
          <p className="text-base font-semibold text-gray-300">Seçtiğiniz filtrelere uygun seri bulunamadı.</p>
          <p className="text-xs text-gray-500">Filtreleri sıfırlayarak veya arama teriminizi değiştirerek tekrar deneyebilirsiniz.</p>
          <button
            onClick={resetFilters}
            className="mt-2 bg-purple-700 hover:bg-purple-600 text-white text-xs font-bold px-4 py-2 rounded-xl transition cursor-pointer"
          >
            Tüm Serileri Göster
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filteredSeries.map(s => (
            <SeriesCard key={s.id} series={s} />
          ))}
        </div>
      )}
    </div>
  );
};
