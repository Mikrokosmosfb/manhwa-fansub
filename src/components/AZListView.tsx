import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ArrowDownAZ, Star, Bookmark } from 'lucide-react';
import { isSeries18Plus } from '../types';
import { DiagonalStatusRibbon } from './DiagonalStatusRibbon';
import { getOptimizedImageUrl } from '../utils/imageUtils';

const ALPHABET = [
  'Tümü',
  'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M',
  'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', '0-9'
];

export const AZListView: React.FC = () => {
  const { seriesList, setView, bookmarks, showNsfw } = useApp();
  const [selectedLetter, setSelectedLetter] = useState<string>('Tümü');

  const visibleSeriesList = showNsfw ? seriesList : seriesList.filter(s => !isSeries18Plus(s));

  const filtered = visibleSeriesList.filter(s => {
    if (selectedLetter === 'Tümü') return true;
    const firstChar = s.title.charAt(0).toUpperCase();
    if (selectedLetter === '0-9') {
      return !isNaN(parseInt(firstChar, 10));
    }
    return firstChar === selectedLetter;
  });

  const sorted = [...filtered].sort((a, b) => a.title.localeCompare(b.title));

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      
      {/* Title */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-3">
          <ArrowDownAZ className="text-purple-400" size={32} />
          A-Z Seri Listesi
        </h1>
        <p className="text-xs sm:text-sm text-gray-400 mt-1">
          Alfabetik sıraya göre tüm Manhwa ve Web Novel serileri.
        </p>
      </div>

      {/* Alphabet Selector Buttons */}
      <div className="bg-gray-900/90 border border-purple-500/20 rounded-2xl p-4 mb-8 shadow-md">
        <div className="flex flex-wrap gap-1.5 justify-center sm:justify-start">
          {ALPHABET.map(letter => {
            const isActive = selectedLetter === letter;
            return (
              <button
                key={letter}
                onClick={() => setSelectedLetter(letter)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                  isActive
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'bg-gray-950 text-gray-300 hover:bg-purple-950/60 border border-gray-800'
                }`}
              >
                {letter}
              </button>
            );
          })}
        </div>
      </div>

      {/* Series Grid */}
      {sorted.length === 0 ? (
        <div className="bg-gray-900/60 border border-purple-500/20 rounded-3xl p-12 text-center text-gray-400">
          Bu harf ile başlayan seri bulunmuyor.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {sorted.map(s => (
            <div
              key={s.id}
              onClick={() => setView({ type: 'series-detail', seriesId: s.id })}
              className="bg-gray-900/90 border border-purple-500/20 hover:border-purple-500/40 rounded-2xl p-3 flex gap-3 cursor-pointer group shadow hover:shadow-purple-500/10 transition"
            >
              <div className="relative w-24 sm:w-28 aspect-[2/3] overflow-hidden rounded-xl flex-shrink-0 border border-purple-500/20 self-start">
                <DiagonalStatusRibbon status={s.status} size="sm" />
                <img
                  src={getOptimizedImageUrl(s.coverImage, { width: 120, height: 180, quality: 75 })}
                  alt={s.title}
                  width="112"
                  height="168"
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                />
              </div>
              <div className="min-w-0 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-gray-100 group-hover:text-purple-300 line-clamp-2 leading-snug">
                    {s.title}
                  </h3>
                  <div className="flex items-center gap-2 mt-1.5 text-[11px] text-gray-400">
                    <span className="bg-purple-950 text-purple-300 px-2 py-0.5 rounded border border-purple-800">
                      {s.type}
                    </span>
                    <span className="text-amber-400 font-bold flex items-center gap-0.5">
                      <Star size={12} className="fill-current" />
                      {s.rating}
                    </span>
                  </div>
                </div>

                <div className="text-[10px] text-gray-400 flex items-center justify-between pt-1 border-t border-gray-800">
                  <span>{s.chapters.length} Bölüm</span>
                  <span>{s.status}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
};
