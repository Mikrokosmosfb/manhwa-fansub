import React from 'react';
import { useApp } from '../context/AppContext';
import { GraduationCap, Sparkles } from 'lucide-react';

export const RecruitmentBanner: React.FC = () => {
  const { setView } = useApp();

  return (
    <div className="my-8 mx-auto max-w-3xl">
      <div className="bg-gradient-to-r from-purple-900/40 via-fuchsia-900/30 to-purple-900/40 border border-purple-500/30 rounded-2xl p-5 sm:p-6 text-center shadow-lg transition hover:shadow-purple-900/20 hover:border-purple-500/50">
        <h3 className="text-lg sm:text-xl font-black text-white flex items-center justify-center gap-2 mb-2">
          <Sparkles className="text-amber-400" size={20} />
          Ekibimize Katılmak İster misiniz?
          <Sparkles className="text-amber-400" size={20} />
        </h3>
        <p className="text-sm text-purple-200 mb-5">
          Çevirmen veya editör olarak yer almak, bölümleri herkesten önce görmek ve renkli dünyamıza katılmak için aramıza katılın! Edit yapmayı bilmiyorsanız dert etmeyin, özel hazırladığımız mobil uyumlu rehberimize göz atabilirsiniz.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => setView({ type: 'join-team' })}
            className="w-full sm:w-auto bg-purple-600 hover:bg-purple-500 text-white font-bold py-2.5 px-6 rounded-xl transition active:scale-95 shadow-lg text-sm"
          >
            Ekibe Başvur
          </button>
          <button
            onClick={() => setView({ type: 'lessons' })}
            className="w-full sm:w-auto bg-emerald-950/60 hover:bg-emerald-900 border border-emerald-500/40 text-emerald-300 font-bold py-2.5 px-6 rounded-xl flex items-center justify-center gap-2 transition active:scale-95 text-sm"
          >
            <GraduationCap size={18} />
            Editörlük Dersleri
          </button>
        </div>
      </div>
    </div>
  );
};
