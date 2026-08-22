import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { SeriesCard } from './SeriesCard';
import { SeriesType, SeriesStatus, isSeries18Plus } from '../types';
import {
  SlidersHorizontal,
  Search,
  X,
  Filter,
  Check,
  RotateCcw,
  BookOpen,
  Star,
  Layers,
  Calendar,
  Sparkles,
  ShieldAlert
} from 'lucide-react';

type GenreFilterState = 'include' | 'exclude' | 'neutral';

export const AdvancedSearchView: React.FC = () => {
  const { seriesList, setView, showNsfw } = useApp();

  // Search parameters
  const [query, setQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [minRating, setMinRating] = useState<number>(0);
  const [minChapters, setMinChapters] = useState<number>(0);
  const [adultFilter, setAdultFilter] = useState<'all' | 'safe' | '18+'>('all');
  const [sortBy, setSortBy] = useState<'updated' | 'rating' | 'chapters' | 'title-asc' | 'title-desc'>('updated');

  // Map of genre -> 'include' | 'exclude' | 'neutral'
  const [genreFilters, setGenreFilters] = useState<Record<string, GenreFilterState>>({});

  // Extract all unique genres from current series list
  const allGenres = useMemo(() => {
    const set = new Set<string>();
    seriesList.forEach(s => {
      if (s.genres && Array.isArray(s.genres)) {
        s.genres.forEach(g => set.add(g.trim()));
      }
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'tr'));
  }, [seriesList]);

  // Toggle genre state: neutral -> include -> exclude -> neutral
  const handleToggleGenre = (genre: string) => {
    setGenreFilters(prev => {
      const current = prev[genre] || 'neutral';
      let next: GenreFilterState = 'neutral';
      if (current === 'neutral') next = 'include';
      else if (current === 'include') next = 'exclude';
      else next = 'neutral';

      const copy = { ...prev };
      if (next === 'neutral') {
        delete copy[genre];
      } else {
        copy[genre] = next;
      }
      return copy;
    });
  };

  const handleResetAll = () => {
    setQuery('');
    setSelectedType('all');
    setSelectedStatus('all');
    setMinRating(0);
    setMinChapters(0);
    setAdultFilter('all');
    setSortBy('updated');
    setGenreFilters({});
  };

  // Included & Excluded lists
  const includedGenres = useMemo(() => {
    return Object.keys(genreFilters).filter(g => genreFilters[g] === 'include');
  }, [genreFilters]);

  const excludedGenres = useMemo(() => {
    return Object.keys(genreFilters).filter(g => genreFilters[g] === 'exclude');
  }, [genreFilters]);

  // Filter series based on criteria
  const filteredSeries = useMemo(() => {
    return seriesList.filter(s => {
      // Query search (title, author, artist, translator)
      if (query.trim()) {
        const q = query.toLowerCase().trim();
        const titleMatch = s.title.toLowerCase().includes(q);
        const authorMatch = s.author?.toLowerCase().includes(q);
        const artistMatch = s.artist?.toLowerCase().includes(q);
        const translatorMatch = s.translator?.toLowerCase().includes(q);
        if (!titleMatch && !authorMatch && !artistMatch && !translatorMatch) {
          return false;
        }
      }

      // Series type
      if (selectedType !== 'all' && s.type !== selectedType) {
        return false;
      }

      // Status
      if (selectedStatus !== 'all' && s.status !== selectedStatus) {
        return false;
      }

      // Rating
      if (minRating > 0 && s.rating < minRating) {
        return false;
      }

      // Chapters count
      const chapterCount = s.chapters ? s.chapters.length : 0;
      if (minChapters > 0 && chapterCount < minChapters) {
        return false;
      }

      // Global NSFW preference check
      if (!showNsfw && isSeries18Plus(s)) {
        return false;
      }

      // Adult / 18+ Filter
      if (adultFilter === 'safe' && isSeries18Plus(s)) {
        return false;
      }
      if (adultFilter === '18+' && !isSeries18Plus(s)) {
        return false;
      }

      // Included genres check (MUST contain all included genres)
      if (includedGenres.length > 0) {
        const hasAllIncluded = includedGenres.every(g =>
          s.genres?.some(sg => sg.toLowerCase().trim() === g.toLowerCase().trim())
        );
        if (!hasAllIncluded) return false;
      }

      // Excluded genres check (MUST NOT contain any excluded genre)
      if (excludedGenres.length > 0) {
        const hasExcluded = excludedGenres.some(g =>
          s.genres?.some(sg => sg.toLowerCase().trim() === g.toLowerCase().trim())
        );
        if (hasExcluded) return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'rating') {
        return b.rating - a.rating;
      }
      if (sortBy === 'chapters') {
        return (b.chapters?.length || 0) - (a.chapters?.length || 0);
      }
      if (sortBy === 'title-asc') {
        return a.title.localeCompare(b.title, 'tr');
      }
      if (sortBy === 'title-desc') {
        return b.title.localeCompare(a.title, 'tr');
      }
      // 'updated' default
      return (b.chapters?.[0]?.createdAt || 0) - (a.chapters?.[0]?.createdAt || 0);
    });
  }, [
    seriesList,
    showNsfw,
    query,
    selectedType,
    selectedStatus,
    minRating,
    minChapters,
    adultFilter,
    includedGenres,
    excludedGenres,
    sortBy
  ]);

  const activeFilterCount =
    (query ? 1 : 0) +
    (selectedType !== 'all' ? 1 : 0) +
    (selectedStatus !== 'all' ? 1 : 0) +
    (minRating > 0 ? 1 : 0) +
    (minChapters > 0 ? 1 : 0) +
    (adultFilter !== 'all' ? 1 : 0) +
    Object.keys(genreFilters).length;

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 py-6 px-3 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Title */}
        <div className="header-preserve-white bg-gradient-to-r from-purple-800 via-indigo-800 to-purple-900 border border-purple-400/40 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden text-white">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 bg-white/20 border border-white/30 text-white text-xs font-bold px-3 py-1 rounded-full mb-2 shadow-sm">
                <SlidersHorizontal size={14} />
                Gelişmiş Arama & Filtreleme
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3 drop-shadow">
                Detaylı Seri Arama Engine
              </h1>
              <p className="text-xs sm:text-sm text-purple-100 mt-1 max-w-2xl leading-relaxed">
                Tür dahil etme/hariç tutma, bölüm sayısı, puan ve tür kategorilerine göre aradığınız seriyi anında bulun.
              </p>
            </div>

            {activeFilterCount > 0 && (
              <button
                onClick={handleResetAll}
                className="self-start md:self-center flex items-center gap-2 bg-rose-600 hover:bg-rose-500 text-white border border-rose-300 px-4 py-2.5 rounded-2xl text-xs font-bold transition shadow-lg active:scale-95"
              >
                <RotateCcw size={15} />
                Filtreleri Sıfırla ({activeFilterCount})
              </button>
            )}
          </div>
        </div>

        {/* Filter Controls Matrix */}
        <div className="bg-gray-900/90 border border-purple-500/20 rounded-3xl p-4 sm:p-6 shadow-xl space-y-6">
          
          {/* Main Keyword Search Input */}
          <div>
            <label className="block text-xs font-extrabold text-purple-300 uppercase tracking-wider mb-2">
              Anahtar Kelime veya Seri Adı
            </label>
            <div className="relative flex items-center">
              <Search size={18} className="absolute left-3.5 text-purple-400 pointer-events-none" />
              <input
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Seri adı, yazar, çizer veya çevirmen adı yazın..."
                className="w-full bg-gray-950 border border-purple-500/40 text-white placeholder-gray-500 text-xs sm:text-sm rounded-2xl pl-10 pr-10 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 transition shadow-inner"
              />
              {query && (
                <button
                  onClick={() => setQuery('')}
                  className="absolute right-3 text-gray-400 hover:text-white p-1"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </div>

          {/* Type & Status Selectors */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Type */}
            <div>
              <label className="block text-xs font-extrabold text-purple-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <BookOpen size={14} /> Seri Türü
              </label>
              <select
                value={selectedType}
                onChange={e => setSelectedType(e.target.value)}
                className="w-full bg-gray-950 border border-purple-500/30 text-xs sm:text-sm font-semibold text-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="all">Tümü (Tüm Türler)</option>
                <option value="Manhwa">Manhwa (Güney Kore)</option>
                <option value="Web Novel">Web Novel (Işık Roman)</option>
                <option value="Manga">Manga (Japonya)</option>
                <option value="Webtoon">Webtoon</option>
                <option value="Manhua">Manhua (Çin)</option>
                <option value="One Shot">One Shot (Tek Bölüm)</option>
              </select>
            </div>

            {/* Status */}
            <div>
              <label className="block text-xs font-extrabold text-purple-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Layers size={14} /> Yayın Durumu
              </label>
              <select
                value={selectedStatus}
                onChange={e => setSelectedStatus(e.target.value)}
                className="w-full bg-gray-950 border border-purple-500/30 text-xs sm:text-sm font-semibold text-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="all">Tümü (Tüm Durumlar)</option>
                <option value="Devam Ediyor">Devam Ediyor</option>
                <option value="Güncel">Güncel</option>
                <option value="Tamamlandı">Tamamlandı</option>
                <option value="Yakında">Yakında</option>
                <option value="Bıraktıldı">Bıraktıldı</option>
              </select>
            </div>

            {/* Min Rating */}
            <div>
              <label className="block text-xs font-extrabold text-purple-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Star size={14} className="text-amber-400" /> Minimum Puan
              </label>
              <select
                value={minRating}
                onChange={e => setMinRating(Number(e.target.value))}
                className="w-full bg-gray-950 border border-purple-500/30 text-xs sm:text-sm font-semibold text-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value={0}>Fark Etmez (Tüm Puanlar)</option>
                <option value={7}>7.0 + Yıldız</option>
                <option value={8}>8.0 + Yıldız</option>
                <option value={9}>9.0 + Yıldız</option>
                <option value={9.5}>9.5 + Süper Puan</option>
              </select>
            </div>

            {/* Min Chapters */}
            <div>
              <label className="block text-xs font-extrabold text-purple-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Sparkles size={14} /> Min. Bölüm Sayısı
              </label>
              <select
                value={minChapters}
                onChange={e => setMinChapters(Number(e.target.value))}
                className="w-full bg-gray-950 border border-purple-500/30 text-xs sm:text-sm font-semibold text-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value={0}>Fark Etmez (0+ Bölüm)</option>
                <option value={5}>En az 5 Bölüm</option>
                <option value={10}>En az 10 Bölüm</option>
                <option value={20}>En az 20 Bölüm</option>
                <option value={50}>En az 50 Bölüm</option>
                <option value={100}>En az 100 Bölüm</option>
              </select>
            </div>

          </div>

          {/* Adult Filter & Sorting Options */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 pt-2 border-t border-gray-800">
            {/* Adult Content Filter */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-extrabold text-purple-300 uppercase tracking-wider flex items-center gap-1">
                <ShieldAlert size={14} className="text-rose-400" /> +18 Filtresi:
              </span>
              <div className="flex items-center gap-1 bg-gray-950 p-1 rounded-xl border border-gray-800">
                <button
                  onClick={() => setAdultFilter('all')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                    adultFilter === 'all'
                      ? 'bg-purple-600 text-white'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Tümü
                </button>
                <button
                  onClick={() => setAdultFilter('safe')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                    adultFilter === 'safe'
                      ? 'bg-emerald-600 text-white'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Sadece Genel
                </button>
                <button
                  onClick={() => setAdultFilter('18+')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                    adultFilter === '18+'
                      ? 'bg-rose-600 text-white'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Sadece +18
                </button>
              </div>
            </div>

            {/* Sorting */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-extrabold text-purple-300 uppercase tracking-wider">
                Sıralama:
              </span>
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as any)}
                className="bg-gray-950 border border-purple-500/30 text-xs font-bold text-purple-200 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="updated">Son Güncellenenler</option>
                <option value="rating">En Yüksek Puanlılar</option>
                <option value="chapters">En Çok Bölümlüler</option>
                <option value="title-asc">İsim (A'dan Z'ye)</option>
                <option value="title-desc">İsim (Z'den A'ya)</option>
              </select>
            </div>
          </div>

          {/* Genre Matrix Section */}
          <div className="pt-3 border-t border-gray-800 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <label className="text-xs font-extrabold text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
                <Filter size={14} /> Tür Filtreleme Matrixi (Tıklayarak Seçin)
              </label>
              
              <div className="flex items-center gap-3 text-[11px] font-semibold text-gray-400">
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  İçeren (+1 tık)
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                  Hariç Tutulan (+2 tık)
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-gray-700" />
                  Nötr
                </span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {allGenres.map(genre => {
                const state = genreFilters[genre] || 'neutral';
                let btnStyle = 'bg-gray-950 text-gray-400 border-gray-800 hover:border-purple-500/50';
                let icon = null;

                if (state === 'include') {
                  btnStyle = 'bg-emerald-950 text-emerald-200 border-emerald-500 font-extrabold ring-1 ring-emerald-500/50 shadow-md';
                  icon = <Check size={13} className="text-emerald-400" />;
                } else if (state === 'exclude') {
                  btnStyle = 'bg-rose-950 text-rose-200 border-rose-500 font-extrabold ring-1 ring-rose-500/50 shadow-md line-through';
                  icon = <X size={13} className="text-rose-400" />;
                }

                return (
                  <button
                    key={genre}
                    onClick={() => handleToggleGenre(genre)}
                    className={`px-3 py-1.5 rounded-xl border text-xs flex items-center gap-1.5 transition active:scale-95 ${btnStyle}`}
                  >
                    {icon}
                    <span>{genre}</span>
                  </button>
                );
              })}
            </div>

            {Object.keys(genreFilters).length > 0 && (
              <div className="flex items-center gap-2 pt-1 text-xs text-gray-400">
                <span>Aktif Tür Seçimleri:</span>
                {includedGenres.map(g => (
                  <span key={g} className="bg-emerald-950 text-emerald-300 border border-emerald-800 px-2 py-0.5 rounded-md font-bold text-[11px]">
                    +{g}
                  </span>
                ))}
                {excludedGenres.map(g => (
                  <span key={g} className="bg-rose-950 text-rose-300 border border-rose-800 px-2 py-0.5 rounded-md font-bold text-[11px]">
                    -{g}
                  </span>
                ))}
                <button
                  onClick={() => setGenreFilters({})}
                  className="text-purple-400 hover:underline text-[11px] font-bold ml-auto"
                >
                  Türleri Temizle
                </button>
              </div>
            )}
          </div>

        </div>

        {/* Results Bar */}
        <div className="bg-purple-950/80 border border-purple-500/30 rounded-2xl p-4 flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-purple-200">
            <Sparkles size={16} className="text-amber-400" />
            <span>Arama Kriterlerinize Uygun <strong className="text-white font-black text-base mx-1">{filteredSeries.length}</strong> Seri Bulundu</span>
          </div>

          <span className="text-xs text-purple-300/70 hidden sm:inline font-semibold">
            Anında Canlı Filtreleme
          </span>
        </div>

        {/* Series Results Grid */}
        {filteredSeries.length === 0 ? (
          <div className="bg-gray-900/60 border border-purple-500/20 rounded-3xl p-12 text-center text-gray-400 space-y-4">
            <SlidersHorizontal size={48} className="mx-auto text-purple-400/50" />
            <h3 className="text-lg font-extrabold text-white">Aradığınız Kriterlerde Seri Bulunamadı</h3>
            <p className="text-xs sm:text-sm text-gray-400 max-w-md mx-auto">
              Lütfen uyguladığınız filtreleri gevşetmeyi veya seçili türleri temizlemeyi deneyin.
            </p>
            <button
              onClick={handleResetAll}
              className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-extrabold px-5 py-2.5 rounded-2xl shadow-lg transition active:scale-95"
            >
              <RotateCcw size={15} />
              Tüm Filtreleri Temizle
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
            {filteredSeries.map(series => (
              <SeriesCard key={series.id} series={series} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
