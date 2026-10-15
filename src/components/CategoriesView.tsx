import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { GENRE_LIST } from '../data/mockData';
import { SeriesCard } from './SeriesCard';
import { Tags, RotateCcw, ShieldAlert, Sparkles, Search, X } from 'lucide-react';
import { isSeries18Plus, Series } from '../types';

interface CategoriesViewProps {
  initialGenre?: string;
}

export const CategoriesView: React.FC<CategoriesViewProps> = ({ initialGenre }) => {
  const { seriesList, showNsfw, toggleNsfw } = useApp();

  const visibleSeriesList = showNsfw ? seriesList : seriesList.filter(s => !isSeries18Plus(s));

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

        {/* Format / Type */}
        <div>
          <label className="text-xs font-bold text-purple-300 uppercase tracking-wider block mb-2">
            Format / Tür
          </label>
          <div className="flex flex-wrap gap-2">
            {['Tümü', 'Manhwa', 'Web Novel', 'Webtoon', 'Manga', 'Manhua'].map(t => (
              <button
                key={t}
                onClick={() => setSelectedType(t)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  selectedType === t
                    ? 'bg-purple-600 text-white shadow'
                    : 'bg-gray-950 text-gray-300 hover:bg-purple-950/60 border border-gray-800'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Status */}
        <div>
          <label className="text-xs font-bold text-purple-300 uppercase tracking-wider block mb-2">
            Yayın Durumu
          </label>
          <div className="flex flex-wrap gap-2">
            {['Tümü', 'Devam Ediyor', 'Tamamlandı', 'Güncel', 'Yakında'].map(st => (
              <button
                key={st}
                onClick={() => setSelectedStatus(st)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  selectedStatus === st
                    ? 'bg-indigo-600 text-white shadow'
                    : 'bg-gray-950 text-gray-300 hover:bg-purple-950/60 border border-gray-800'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {/* Extra Custom Badges Section (Manuel Eklenen Etiketler & Rozetler) */}
        {allCustomBadges.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles size={14} className="text-amber-400" />
                Özel Etiketler ({allCustomBadges.length})
              </label>
              <span className="text-[11px] text-gray-500 hidden sm:inline">
                Manuel eklenen rozetler ve özel tematik etiketler
              </span>
            </div>
            <div className="flex flex-wrap gap-2 max-h-44 overflow-y-auto pr-1">
              <button
                onClick={() => setSelectedBadge('Tümü')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  selectedBadge === 'Tümü'
                    ? 'bg-purple-600 text-white shadow'
                    : 'bg-gray-950 text-gray-300 hover:bg-purple-950/60 border border-gray-800'
                }`}
              >
                Tüm Etiketler
              </button>
              {allCustomBadges.map(badge => {
                const is18 = badge === '18+' || badge === '+18';
                const isActive = selectedBadge.toLowerCase().trim() === badge.toLowerCase().trim();
                const count = visibleSeriesList.filter(s => matchTag(s, badge)).length;

                return (
                  <button
                    key={badge}
                    onClick={() => setSelectedBadge(isActive ? 'Tümü' : badge)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm ${
                      isActive
                        ? is18
                          ? 'bg-rose-600 text-white shadow ring-2 ring-rose-400/50'
                          : 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow ring-2 ring-purple-400/50'
                        : is18
                        ? 'bg-rose-950/60 text-rose-300 border border-rose-800/60 hover:bg-rose-900/60'
                        : 'bg-gray-950 text-gray-300 hover:bg-purple-950/60 border border-purple-500/20'
                    }`}
                  >
                    {is18 ? (
                      <ShieldAlert size={13} className="text-rose-400" />
                    ) : (
                      <Sparkles size={12} className={isActive ? 'text-amber-300' : 'text-purple-400'} />
                    )}
                    <span>{badge}</span>
                    {count > 0 && (
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-md ${
                        isActive ? 'bg-white/20 text-white' : 'bg-purple-950/80 text-purple-300 border border-purple-500/30'
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

        {/* Genres Grid */}
        <div>
          <label className="text-xs font-bold text-purple-300 uppercase tracking-wider block mb-2">
            Konu Türleri & Kategoriler ({allCategoryGenres.length})
          </label>
          <div className="flex flex-wrap gap-1.5 max-h-52 overflow-y-auto pr-1">
            <button
              onClick={() => setSelectedGenre('Tümü')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                selectedGenre === 'Tümü'
                  ? 'bg-purple-600 text-white shadow'
                  : 'bg-gray-950 text-gray-300 hover:bg-purple-950/60 border border-gray-800'
              }`}
            >
              Tümü
            </button>
            {allCategoryGenres.map(g => {
              const isActive = selectedGenre.toLowerCase().trim() === g.toLowerCase().trim();
              const count = visibleSeriesList.filter(s => matchTag(s, g)).length;

              return (
                <button
                  key={g}
                  onClick={() => setSelectedGenre(isActive ? 'Tümü' : g)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    isActive
                      ? 'bg-purple-600 text-white shadow ring-2 ring-purple-400/40'
                      : 'bg-gray-950 text-gray-300 hover:bg-purple-950/60 border border-gray-800'
                  }`}
                >
                  <span>{g}</span>
                  {count > 0 && (
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-md ${
                      isActive ? 'bg-white/20 text-white' : 'bg-gray-900 text-gray-400 border border-gray-800'
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
