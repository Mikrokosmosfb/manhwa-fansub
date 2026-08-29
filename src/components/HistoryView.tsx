import React from 'react';
import { useApp } from '../context/AppContext';
import { ReadingProgress } from '../types';
import { Clock, BookOpen, Trash2, ArrowRight } from 'lucide-react';
import { getOptimizedImageUrl } from '../utils/imageUtils';

export const HistoryView: React.FC = () => {
  const { readingHistory, seriesList, setView } = useApp();

  const historyEntries = (Object.values(readingHistory) as ReadingProgress[]).map(progress => {
    const series = seriesList.find(s => s.id === progress.seriesId);
    return {
      progress,
      series
    };
  }).filter(item => item.series !== undefined);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-3">
            <Clock className="text-purple-400" size={32} />
            Okuma Geçmişi
          </h1>
          <p className="text-xs sm:text-sm text-gray-400 mt-1">
            En son okuduğunuz seriler ve kaldığınız bölümler.
          </p>
        </div>
      </div>

      {historyEntries.length === 0 ? (
        <div className="bg-gray-900/60 border border-purple-500/20 rounded-3xl p-12 text-center text-gray-400">
          <Clock size={40} className="mx-auto mb-3 text-purple-400/50" />
          <p className="text-base font-semibold">Henüz okuma geçmişiniz bulunmuyor.</p>
          <p className="text-xs text-gray-500 mt-1">
            Bir bölüm okumaya başladığınızda otomatik olarak buraya kaydedilecektir.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {historyEntries.map(({ progress, series }) => {
            if (!series) return null;
            return (
              <div
                key={series.id}
                className="bg-gray-900/90 border border-purple-500/20 rounded-2xl p-4 flex items-center justify-between gap-4 shadow hover:border-purple-500/40 transition"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={getOptimizedImageUrl(series.coverImage, { width: 100, height: 133, quality: 75 })}
                    alt={series.title}
                    width="48"
                    height="64"
                    loading="lazy"
                    decoding="async"
                    className="w-12 h-16 object-cover rounded-xl border border-purple-500/30 flex-shrink-0"
                  />
                  <div className="min-w-0">
                    <h3
                      onClick={() => setView({ type: 'series-detail', seriesId: series.id })}
                      className="font-bold text-sm text-white hover:text-purple-300 cursor-pointer truncate"
                    >
                      {series.title}
                    </h3>
                    <div className="text-xs text-purple-300 font-medium mt-1 flex items-center gap-1.5">
                      <BookOpen size={14} className="text-purple-400" />
                      <span>Kaldığın Bölüm: {progress.lastChapterTitle}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() =>
                    setView({
                      type: 'reader',
                      seriesId: series.id,
                      chapterId: progress.lastChapterId
                    })
                  }
                  className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow flex items-center gap-1.5 flex-shrink-0 transition"
                >
                  <span>Devam Et</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
