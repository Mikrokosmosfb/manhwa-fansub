import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Users, Send, CheckCircle2 } from 'lucide-react';

export const JoinTeamModal: React.FC = () => {
  const { setView } = useApp();
  const [name, setName] = useState('');
  const [discordTag, setDiscordTag] = useState('');
  const [role, setRole] = useState('Çevirmen (İngilizce -> Türkçe)');
  const [experience, setExperience] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !discordTag.trim()) return;
    setSubmitted(true);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="bg-gray-900/95 border border-purple-500/20 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
        
        <div className="flex items-center gap-3 border-b border-gray-800 pb-4">
          <Users size={28} className="text-purple-400" />
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-white">
              Ekibe Başvuru Formu
            </h1>
            <p className="text-xs text-gray-400 mt-0.5">
              Mikrokosmos Fansub bünyesinde Çevirmen, Editör veya Type denemelerine katılın!
            </p>
          </div>
        </div>

        {submitted ? (
          <div className="bg-purple-950/60 border border-purple-500/40 rounded-2xl p-6 text-center space-y-3">
            <CheckCircle2 size={40} className="text-purple-400 mx-auto" />
            <h3 className="text-lg font-bold text-white">Başvurunuz Alındı!</h3>
            <p className="text-xs text-purple-200">
              En kısa sürede Discord üzerinden sizinle iletişime geçeceğiz.
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
              <label className="block text-purple-300 font-bold mb-1">Adınız / Nickname *</label>
              <input
                type="text"
                required
                placeholder="Örn: Mehmet / Shadow"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full bg-gray-950 border border-purple-500/30 text-white rounded-xl p-3 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-purple-300 font-bold mb-1">Discord Kullanıcı Adınız *</label>
              <input
                type="text"
                required
                placeholder="Örn: mehmet#1234 veya mehmet_user"
                value={discordTag}
                onChange={e => setDiscordTag(e.target.value)}
                className="w-full bg-gray-950 border border-purple-500/30 text-white rounded-xl p-3 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-purple-300 font-bold mb-1">Başvurulan Pozisyon</label>
              <select
                value={role}
                onChange={e => setRole(e.target.value)}
                className="w-full bg-gray-950 border border-purple-500/30 text-white rounded-xl p-3 focus:outline-none"
              >
                <option value="Çevirmen (İngilizce -> Türkçe)">Çevirmen (İngilizce -&gt; Türkçe)</option>
                <option value="Çevirmen (Korece / Çince)">Çevirmen (Korece / Çince)</option>
                <option value="Editör (Clean & Redaksiyon)">Editör (Clean &amp; Redaksiyon)</option>
                <option value="Typer (Balonlama & Yazı)">Typer (Balonlama &amp; Yazı)</option>
                <option value="Novel Çevirmeni">Web Novel Çevirmeni</option>
              </select>
            </div>

            <div>
              <label className="block text-purple-300 font-bold mb-1">Tecrübe &amp; Hakkınızda</label>
              <textarea
                rows={4}
                placeholder="Daha önce başka bir grupta çalıştınız mı? Kendinizi kısaca tanıtın..."
                value={experience}
                onChange={e => setExperience(e.target.value)}
                className="w-full bg-gray-950 border border-purple-500/30 text-white text-xs rounded-xl p-3 focus:outline-none resize-none"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold py-3 rounded-xl shadow-lg transition flex items-center justify-center gap-2 text-sm"
            >
              <Send size={16} />
              Başvuruyu Gönder
            </button>
          </form>
        )}

      </div>
    </div>
  );
};
