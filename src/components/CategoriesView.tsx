import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { GENRE_LIST } from '../data/mockData';
import { SeriesCard } from './SeriesCard';
import { Tags, RotateCcw, Sparkles, ShieldAlert } from 'lucide-react';

interface CategoriesViewProps {
  initialGenre?: string;
}

export const CategoriesView: React.FC<CategoriesViewProps> = ({ initialGenre }) => {
  const { seriesList } = useApp();

  const [selectedType, setSelectedType] = useState<string>('Tümü');
  const [selectedStatus, setSelectedStatus] = useState<string>('Tümü');
  const [selectedGenre, setSelectedGenre] = useState<string>(initialGenre || 'Tümü');
  const [selectedBadge, setSelectedBadge] = useState<string>('Tümü');

  // Collect all unique custom badges across all series
  const existingBadges = Array.from(
    new Set(seriesList.flatMap(s => s.customBadges || []))
  );

  // Preset extra tags list if not in series yet
  const presetBadges = ['Renkli', 'Sansürsüz', 'Popüler', 'Sezon Finali', 'HD', '18+'];
  const allCustomBadges = Array.from(new Set([...presetBadges, ...existingBadges]));

  const filteredSeries = seriesList.filter(s => {
    if (selectedType !== 'Tümü' && s.type !== selectedType) return false;
    if (selectedStatus !== 'Tümü' && s.status !== selectedStatus) return false;
    
    // Genre Filter
    if (selectedGenre !== 'Tümü' && !s.genres.includes(selectedGenre)) return false;

    // Custom Extra Tag / Badge Filter
    if (selectedBadge !== 'Tümü') {
      if (selectedBadge === '18+') {
        if (!s.is18Plus && !s.genres.includes('18+') && !s.customBadges?.includes('18+')) return false;
      } else {
        if (!s.customBadges?.includes(selectedBadge)) return false;
      }
    }

    return true;
  });

  const resetFilters = () => {
    setSelectedType('Tümü');
    setSelectedStatus('Tümü');
    setSelectedGenre('Tümü');
    setSelectedBadge('Tümü');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      
      {/* Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-3">
            <Tags className="text-purple-400" size={32} />
            Kategoriler & Özel Etiketler
          </h1>
          <p className="text-xs sm:text-sm text-gray-400 mt-1">
            Konu türlerine, özel rozetlere, yayın durumuna ve formata göre arama yapın.
          </p>
        </div>

        <button
          onClick={resetFilters}
          className="bg-purple-950/80 hover:bg-purple-900 border border-purple-500/30 text-purple-300 text-xs font-semibold px-3 py-2 rounded-xl flex items-center gap-1.5 transition"
        >
          <RotateCcw size={14} />
          Filtreleri Sıfırla
        </button>
      </div>

      {/* Filter Control Box */}
      <div className="bg-gray-900/90 border border-purple-500/20 rounded-3xl p-5 shadow-xl space-y-5">
        
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
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
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
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
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

        {/* Extra Custom Badges Section */}
        <div>
          <label className="text-xs font-bold text-fuchsia-300 uppercase tracking-wider flex items-center gap-1.5 mb-2">
            <Sparkles size={14} className="text-fuchsia-400" />
            Ek Özel Etiketler & Rozetler ({allCustomBadges.length})
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedBadge('Tümü')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                selectedBadge === 'Tümü'
                  ? 'bg-gradient-to-r from-fuchsia-600 to-purple-600 text-white shadow'
                  : 'bg-gray-950 text-gray-300 hover:bg-purple-950/60 border border-gray-800'
              }`}
            >
              Tüm Etiketler
            </button>
            {allCustomBadges.map(badge => {
              const is18 = badge === '18+';
              const isActive = selectedBadge === badge;
              return (
                <button
                  key={badge}
                  onClick={() => setSelectedBadge(badge)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 ${
                    isActive
                      ? is18 ? 'bg-rose-600 text-white shadow' : 'bg-gradient-to-r from-fuchsia-600 to-purple-600 text-white shadow'
                      : is18 ? 'bg-rose-950/60 text-rose-300 border border-rose-800/60' : 'bg-gray-950 text-purple-200 hover:bg-purple-950/60 border border-purple-500/30'
                  }`}
                >
                  {is18 ? (
                    <span className="flex items-center gap-1">
                      <ShieldAlert size={13} className="text-rose-400" /> 18+
                    </span>
                  ) : (
                    <span className="flex items-center gap-1">
                      <Sparkles size={12} className="text-purple-300" /> {badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Genres Grid */}
        <div>
          <label className="text-xs font-bold text-purple-300 uppercase tracking-wider block mb-2">
            Konu Türleri & Kategoriler ({GENRE_LIST.length})
          </label>
          <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto pr-1 no-scrollbar">
            <button
              onClick={() => setSelectedGenre('Tümü')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                selectedGenre === 'Tümü'
                  ? 'bg-teal-600 text-white'
                  : 'bg-gray-950 text-gray-300 hover:bg-purple-950/60 border border-gray-800'
              }`}
            >
              Tümü
            </button>
            {GENRE_LIST.map(g => (
              <button
                key={g}
                onClick={() => setSelectedGenre(g)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                  selectedGenre === g
                    ? 'bg-teal-600 text-white'
                    : 'bg-gray-950 text-gray-300 hover:bg-purple-950/60 border border-gray-800'
                }`}
              >
                {g}
              </button>
            ))}
          </div>
        </div>

      </div>

      {/* Results Header */}
      <div className="text-sm text-gray-400 font-medium flex items-center justify-between">
        <span>Bulunan Seriler: <strong className="text-white">{filteredSeries.length}</strong></span>
        {(selectedGenre !== 'Tümü' || selectedBadge !== 'Tümü' || selectedType !== 'Tümü' || selectedStatus !== 'Tümü') && (
          <span className="text-xs text-purple-300">
            Aktif Filtreler: {[selectedType, selectedStatus, selectedGenre !== 'Tümü' && `Tür: ${selectedGenre}`, selectedBadge !== 'Tümü' && `Etiket: ${selectedBadge}`].filter(Boolean).join(', ')}
          </span>
        )}
      </div>

      {/* Grid Results */}
      {filteredSeries.length === 0 ? (
        <div className="bg-gray-900/60 border border-purple-500/20 rounded-3xl p-12 text-center text-gray-400">
          Seçtiğiniz filtrelere uygun seri bulunamadı.
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
