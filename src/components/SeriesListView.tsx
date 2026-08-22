import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { SeriesCard } from './SeriesCard';
import { HorizontalReleaseCard } from './HorizontalReleaseCard';
import { Library, Search, ArrowUpDown, LayoutGrid, List, Sparkles, Star, BookOpen, Filter, X, RefreshCw } from 'lucide-react';
import { Series, isSeries18Plus } from '../types';

export const SeriesListView: React.FC = () => {
  const { seriesList, setView, showNsfw } = useApp();
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState<string>('Tümü');
  const [selectedGenre, setSelectedGenre] = useState<string>('Tümü');
  const [selectedStatus, setSelectedStatus] = useState<string>('Tümü');
  const [sortBy, setSortBy] = useState<'newest' | 'rating' | 'title' | 'chapters' | 'updated'>('newest');
  const [layoutMode, setLayoutMode] = useState<'grid' | 'list'>('grid');

  const visibleSeriesList = showNsfw ? seriesList : seriesList.filter(s => !isSeries18Plus(s));

  // Extract all unique genres with counts
  const genreCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    visibleSeriesList.forEach(s => {
      (s.genres || []).forEach(g => {
        if (g && g.trim()) {
          const trimmed = g.trim();
          counts[trimmed] = (counts[trimmed] || 0) + 1;
        }
      });
      (s.customBadges || []).forEach(b => {
        if (b && b.trim()) {
          const trimmed = b.trim();
          counts[trimmed] = (counts[trimmed] || 0) + 1;
        }
      });
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ name, count }));
  }, [visibleSeriesList]);

  // Overall stats
  const catalogStats = useMemo(() => {
    const totalChapters = visibleSeriesList.reduce((acc, s) => acc + s.chapters.length, 0);
    const avgRating = visibleSeriesList.length > 0
      ? (visibleSeriesList.reduce((acc, s) => acc + s.rating, 0) / visibleSeriesList.length).toFixed(1)
      : '0.0';
    return { totalChapters, avgRating };
  }, [visibleSeriesList]);

  // Filter
  const filtered = visibleSeriesList.filter(s => {
    if (selectedType !== 'Tümü' && s.type !== selectedType) return false;
    if (selectedStatus !== 'Tümü' && s.status !== selectedStatus) return false;
    if (selectedGenre !== 'Tümü') {
      const hasGenre = (s.genres || []).some(g => g.toLowerCase() === selectedGenre.toLowerCase());
      const hasBadge = (s.customBadges || []).some(b => b.toLowerCase() === selectedGenre.toLowerCase());
      if (!hasGenre && !hasBadge) return false;
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      const titleMatch = s.title.toLowerCase().includes(q);
      const genreMatch = s.genres.some(g => g.toLowerCase().includes(q));
      const badgeMatch = s.customBadges?.some(b => b.toLowerCase().includes(q));
      if (!titleMatch && !genreMatch && !badgeMatch) return false;
    }
    return true;
  });

  // Sort
  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'rating') return b.rating - a.rating;
    if (sortBy === 'title') return a.title.localeCompare(b.title);
    if (sortBy === 'chapters') return b.chapters.length - a.chapters.length;
    if (sortBy === 'updated') {
      const aLast = a.chapters[a.chapters.length - 1]?.publishedDate || '00.00';
      const bLast = b.chapters[b.chapters.length - 1]?.publishedDate || '00.00';
      return bLast.localeCompare(aLast);
    }
    // default newest
    return b.id.localeCompare(a.id);
  });

  const hasActiveFilters = search || selectedType !== 'Tümü' || selectedGenre !== 'Tümü' || selectedStatus !== 'Tümü';

  const resetAllFilters = () => {
    setSearch('');
    setSelectedType('Tümü');
    setSelectedGenre('Tümü');
    setSelectedStatus('Tümü');
    setSortBy('newest');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      
      {/* Title Header & Stats Banner */}
      <div className="bg-gradient-to-r from-purple-950/80 via-gray-900 to-indigo-950/80 border border-purple-500/30 rounded-3xl p-5 sm:p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute -right-10 -top-10 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-bold mb-2">
              <Sparkles size={13} className="text-amber-300 animate-pulse" />
              <span>Geniş Arşiv & Zengin Liste</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-3">
              <Library className="text-purple-400" size={32} />
              Tüm Seriler Kataloğu
            </h1>
            <p className="text-xs sm:text-sm text-gray-300 mt-1 max-w-2xl">
              Sitemizde yayınlanan tüm Manhwa, Webtoon ve Web Novel serilerini inceleyin, türe göre filtreleyin ve hemen okumaya başlayın.
            </p>
          </div>

          {/* Catalog Stats Dashboard */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3">
            <div className="bg-gray-950/80 border border-purple-500/30 px-3.5 py-2.5 rounded-2xl text-center shadow">
              <span className="text-[10px] text-gray-400 font-bold uppercase block">Toplam Seri</span>
              <span className="text-lg font-black text-white">{visibleSeriesList.length}</span>
            </div>
            <div className="bg-gray-950/80 border border-purple-500/30 px-3.5 py-2.5 rounded-2xl text-center shadow">
              <span className="text-[10px] text-gray-400 font-bold uppercase block">Toplam Bölüm</span>
              <span className="text-lg font-black text-purple-300">{catalogStats.totalChapters}</span>
            </div>
            <div className="bg-gray-950/80 border border-purple-500/30 px-3.5 py-2.5 rounded-2xl text-center shadow col-span-2 sm:col-span-1">
              <span className="text-[10px] text-gray-400 font-bold uppercase block">Ort. Puan</span>
              <span className="text-lg font-black text-amber-400 flex items-center justify-center gap-1">
                <Star size={14} className="fill-amber-400" />
                {catalogStats.avgRating}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Control Bar: Search, Type, Status, Sort & Layout Switch */}
      <div className="bg-gray-900/90 border border-purple-500/20 rounded-3xl p-4 sm:p-5 shadow-xl space-y-4">
        
        {/* Row 1: Search & Type Tabs */}
        <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
          
          {/* Search box */}
          <div className="relative w-full lg:w-80">
            <input
              type="text"
              placeholder="Seri adı veya etiket ara..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-gray-950 border border-purple-500/30 text-white placeholder-gray-500 text-xs rounded-xl pl-9 pr-8 py-2.5 focus:outline-none focus:ring-2 focus:ring-purple-400"
            />
            <Search size={15} className="absolute left-3 top-3 text-purple-400 pointer-events-none" />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-2.5 text-gray-400 hover:text-white"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Type Filter Tabs */}
          <div className="flex items-center gap-1.5 bg-gray-950 p-1 rounded-2xl border border-gray-800 w-full sm:w-auto overflow-x-auto no-scrollbar">
            {['Tümü', 'Manhwa', 'Web Novel', 'Webtoon', 'Manga'].map(t => (
              <button
                key={t}
                onClick={() => setSelectedType(t)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                  selectedType === t
                    ? 'bg-purple-600 text-white shadow shadow-purple-900/40'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Status Select */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs font-bold text-gray-400 hidden sm:inline">Durum:</span>
            <select
              value={selectedStatus}
              onChange={e => setSelectedStatus(e.target.value)}
              className="w-full sm:w-auto bg-gray-950 border border-purple-500/30 text-xs text-purple-200 font-bold rounded-xl px-3 py-2 focus:outline-none cursor-pointer"
            >
              <option value="Tümü">Tüm Durumlar</option>
              <option value="Devam Ediyor">Devam Ediyor</option>
              <option value="Güncel">Güncel</option>
              <option value="Tamamlandı">Tamamlandı</option>
              <option value="Düzensiz">Düzensiz</option>
            </select>
          </div>

          {/* Sort & Layout Controls */}
          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
            
            {/* Sort Select */}
            <div className="flex items-center gap-1.5">
              <ArrowUpDown size={15} className="text-purple-400" />
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as any)}
                className="bg-gray-950 border border-purple-500/30 text-xs text-purple-200 font-bold rounded-xl px-3 py-2 focus:outline-none cursor-pointer"
              >
                <option value="newest">En Yeni Eklenenler</option>
                <option value="rating">En Yüksek Puanlılar</option>
                <option value="chapters">En Çok Bölümlüler</option>
                <option value="updated">Son Güncellenenler</option>
                <option value="title">A-Z Alfabetik</option>
              </select>
            </div>

            {/* Layout Toggle */}
            <div className="flex items-center gap-1 bg-gray-950 p-1 rounded-xl border border-gray-800">
              <button
                onClick={() => setLayoutMode('grid')}
                className={`p-1.5 rounded-lg transition cursor-pointer ${
                  layoutMode === 'grid' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'
                }`}
                title="Izgara Görünümü"
              >
                <LayoutGrid size={16} />
              </button>
              <button
                onClick={() => setLayoutMode('list')}
                className={`p-1.5 rounded-lg transition cursor-pointer ${
                  layoutMode === 'list' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'
                }`}
                title="Liste Görünümü"
              >
                <List size={16} />
              </button>
            </div>

          </div>

        </div>

        {/* Row 2: Genre Quick Filter Chips */}
        {genreCounts.length > 0 && (
          <div className="pt-2 border-t border-gray-800/80">
            <div className="flex items-center gap-2 mb-2">
              <Filter size={13} className="text-purple-400" />
              <span className="text-xs font-extrabold text-gray-300">Tür & Etiket Filtresi:</span>
            </div>
            <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto no-scrollbar">
              <button
                onClick={() => setSelectedGenre('Tümü')}
                className={`text-xs font-bold px-2.5 py-1 rounded-xl border transition cursor-pointer ${
                  selectedGenre === 'Tümü'
                    ? 'bg-purple-600 border-purple-400 text-white shadow'
                    : 'bg-gray-950 border-gray-800 text-gray-400 hover:text-white hover:border-purple-500/40'
                }`}
              >
                Tüm Türler ({visibleSeriesList.length})
              </button>
              {genreCounts.map(g => (
                <button
                  key={g.name}
                  onClick={() => setSelectedGenre(selectedGenre === g.name ? 'Tümü' : g.name)}
                  className={`text-xs font-bold px-2.5 py-1 rounded-xl border transition cursor-pointer flex items-center gap-1.5 ${
                    selectedGenre === g.name
                      ? 'bg-purple-600 border-purple-400 text-white shadow'
                      : 'bg-gray-950 border-gray-800/80 text-purple-200/90 hover:text-white hover:border-purple-500/40'
                  }`}
                >
                  <span>{g.name}</span>
                  <span className="text-[10px] opacity-70 bg-black/40 px-1.5 py-0.2 rounded-full">
                    {g.count}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* Results Sub-header & Active Filters Reset */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-gray-400 bg-gray-950/60 p-3 rounded-2xl border border-gray-800">
        <div className="flex items-center gap-2">
          <span>Bulunan Seri Sayısı: <strong className="text-white font-bold">{sorted.length}</strong></span>
          {hasActiveFilters && (
            <span className="text-purple-300 bg-purple-950 px-2 py-0.5 rounded-full border border-purple-800 text-[11px] font-semibold">
              Filtrelenmiş Sonuçlar
            </span>
          )}
        </div>

        {hasActiveFilters && (
          <button
            onClick={resetAllFilters}
            className="flex items-center gap-1.5 text-xs font-bold text-rose-300 hover:text-white bg-rose-950/60 hover:bg-rose-900 border border-rose-800/60 px-3 py-1 rounded-xl transition cursor-pointer"
          >
            <RefreshCw size={12} />
            <span>Filtreleri Sıfırla</span>
          </button>
        )}
      </div>

      {/* Content Rendering */}
      {sorted.length === 0 ? (
        <div className="bg-gray-900/60 border border-purple-500/20 rounded-3xl p-12 text-center space-y-3">
          <Library size={40} className="mx-auto text-purple-400/50" />
          <p className="font-bold text-base text-gray-200">Arama kriterlerinize uygun seri bulunamadı.</p>
          <p className="text-xs text-gray-400">Lütfen filtreleri sıfırlayarak farklı bir terim ile aramayı deneyin.</p>
          <button
            onClick={resetAllFilters}
            className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md transition cursor-pointer"
          >
            Tüm Filtreleri Temizle
          </button>
        </div>
      ) : layoutMode === 'grid' ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {sorted.map(s => (
            <SeriesCard key={s.id} series={s} showExtraTags={true} />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {sorted.map((s, idx) => (
            <HorizontalReleaseCard key={s.id} series={s} maxChapters={1} showSynopsis={true} showGenres={true} index={idx} />
          ))}
        </div>
      )}

    </div>
  );
};
