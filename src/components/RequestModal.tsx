import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Send, CheckCircle2, BookmarkPlus } from 'lucide-react';

export const RequestModal: React.FC = () => {
  const { setView } = useApp();
  const [seriesName, setSeriesName] = useState('');
  const [format, setFormat] = useState('Manhwa');
  const [note, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!seriesName.trim()) return;
    setSubmitted(true);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="bg-gray-900/95 border border-purple-500/20 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
        
        <div className="flex items-center gap-3 border-b border-gray-800 pb-4">
          <BookmarkPlus size={28} className="text-purple-400" />
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-white">
              Seri İstek Paneli
            </h1>
            <p className="text-xs text-gray-400 mt-0.5">
              Çevrilmesini veya yayınlanmasını istediğiniz Manhwa / Web Novel serisini bize iletin.
            </p>
          </div>
        </div>

        {submitted ? (
          <div className="bg-purple-950/60 border border-purple-500/40 rounded-2xl p-6 text-center space-y-3">
            <CheckCircle2 size={40} className="text-purple-400 mx-auto" />
            <h3 className="text-lg font-bold text-white">İsteğiniz Başarıyla İletildi!</h3>
            <p className="text-xs text-purple-200">
              Fansub çeviri ekibimiz isteğinizi inceleyecek ve uygun görülen seriler takvime eklenecektir.
            </p>
            <button
              onClick={() => setView({ type: 'home' })}
              className="mt-2 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs px-6 py-2 rounded-xl"
            >
              Ana Sayfaya Dön
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs sm:text-sm">
            <div>
              <label className="block text-purple-300 font-bold mb-1">İstenen Seri Adı *</label>
              <input
                type="text"
                required
                placeholder="Örn: Solo Leveling: Ragnarok"
                value={seriesName}
                onChange={e => setSeriesName(e.target.value)}
                className="w-full bg-gray-950 border border-purple-500/30 text-white rounded-xl p-3 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-purple-300 font-bold mb-1">Format Türü</label>
              <select
                value={format}
                onChange={e => setFormat(e.target.value)}
                className="w-full bg-gray-950 border border-purple-500/30 text-white rounded-xl p-3 focus:outline-none"
              >
                <option value="Manhwa">Manhwa</option>
                <option value="Web Novel">Web Novel</option>
                <option value="Webtoon">Webtoon</option>
                <option value="Manga">Manga</option>
                <option value="Manhua">Manhua</option>
              </select>
            </div>

            <div>
              <label className="block text-purple-300 font-bold mb-1">Ek Notlar / Neden Çevrilmeli?</label>
              <textarea
                rows={4}
                placeholder="Serinin konusu veya ilginizi çeken yönleri..."
                value={note}
                onChange={e => setMessage(e.target.value)}
                className="w-full bg-gray-950 border border-purple-500/30 text-white text-xs rounded-xl p-3 focus:outline-none resize-none"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold py-3 rounded-xl shadow-lg transition flex items-center justify-center gap-2 text-sm"
            >
              <Send size={16} />
              İsteği Gönder
            </button>
          </form>
        )}

      </div>
    </div>
  );
};
