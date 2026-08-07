import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { SeriesCard } from './SeriesCard';
import { HorizontalReleaseCard } from './HorizontalReleaseCard';
import { Library, Search, ArrowUpDown, LayoutGrid, List, Sparkles, Star, BookOpen } from 'lucide-react';
import { Series } from '../types';

export const SeriesListView: React.FC = () => {
  const { seriesList, setView } = useApp();
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState<string>('Tümü');
  const [sortBy, setSortBy] = useState<'newest' | 'rating' | 'title' | 'chapters'>('newest');
  const [layoutMode, setLayoutMode] = useState<'grid' | 'list'>('grid');

  // Filter
  const filtered = seriesList.filter(s => {
    if (selectedType !== 'Tümü' && s.type !== selectedType) return false;
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
    // default newest
    return b.id.localeCompare(a.id);
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-800 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-3">
            <Library className="text-purple-400" size={32} />
            Tüm Seriler Kataloğu
          </h1>
          <p className="text-xs sm:text-sm text-gray-400 mt-1">
            Sitemizde yayınlanan tüm Manhwa, Webtoon ve Web Novel serilerinin eksiksiz listesi.
          </p>
        </div>

        {/* Total stats badge */}
        <div className="flex items-center gap-3">
          <div className="bg-purple-950/80 border border-purple-500/30 px-4 py-2 rounded-2xl text-xs text-purple-200 shadow">
            Toplam <strong className="text-white text-sm font-black">{seriesList.length}</strong> Seri Bulunuyor
          </div>
        </div>
      </div>

      {/* Control Bar: Search, Type, Sort & Layout Switch */}
      <div className="bg-gray-900/90 border border-purple-500/20 rounded-3xl p-4 shadow-xl space-y-4">
        
        <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
          
          {/* Search box */}
          <div className="relative w-full lg:w-72">
            <input
              type="text"
              placeholder="Seri adı veya etiket ara..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-gray-950 border border-purple-500/30 text-white placeholder-gray-500 text-xs rounded-xl pl-9 pr-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-purple-400"
            />
            <Search size={15} className="absolute left-3 top-3 text-purple-400 pointer-events-none" />
          </div>

          {/* Type Filter Tabs */}
          <div className="flex items-center gap-1.5 bg-gray-950 p-1 rounded-2xl border border-gray-800 w-full sm:w-auto overflow-x-auto no-scrollbar">
            {['Tümü', 'Manhwa', 'Web Novel', 'Webtoon', 'Manga'].map(t => (
              <button
                key={t}
                onClick={() => setSelectedType(t)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                  selectedType === t
                    ? 'bg-purple-600 text-white shadow'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Sort & Layout Controls */}
          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
            
            {/* Sort Select */}
            <div className="flex items-center gap-2">
              <ArrowUpDown size={15} className="text-purple-400" />
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as any)}
                className="bg-gray-950 border border-purple-500/30 text-xs text-purple-200 font-bold rounded-xl px-3 py-2 focus:outline-none"
              >
                <option value="newest">En Yeni Eklenenler</option>
                <option value="rating">En Yüksek Puanlılar</option>
                <option value="chapters">En Çok Bölümlüler</option>
                <option value="title">A-Z Alfabetik</option>
              </select>
            </div>

            {/* Layout Toggle */}
            <div className="flex items-center gap-1 bg-gray-950 p-1 rounded-xl border border-gray-800">
              <button
                onClick={() => setLayoutMode('grid')}
                className={`p-1.5 rounded-lg transition ${
                  layoutMode === 'grid' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'
                }`}
                title="Izgara Görünümü"
              >
                <LayoutGrid size={16} />
              </button>
              <button
                onClick={() => setLayoutMode('list')}
                className={`p-1.5 rounded-lg transition ${
                  layoutMode === 'list' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'
                }`}
                title="Liste Görünümü"
              >
                <List size={16} />
              </button>
            </div>

          </div>

        </div>

      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between text-xs text-gray-400">
        <span>Listelenen Seri Sayısı: <strong className="text-white font-bold">{sorted.length}</strong></span>
      </div>

      {/* Content Rendering */}
      {sorted.length === 0 ? (
        <div className="bg-gray-900/60 border border-purple-500/20 rounded-3xl p-12 text-center text-gray-400">
          Arama kriterlerinize uygun seri bulunamadı.
        </div>
      ) : layoutMode === 'grid' ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {sorted.map(s => (
            <SeriesCard key={s.id} series={s} />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {sorted.map(s => (
            <HorizontalReleaseCard key={s.id} series={s} />
          ))}
        </div>
      )}

    </div>
  );
};
