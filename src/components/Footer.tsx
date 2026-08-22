import React from 'react';
import { useApp } from '../context/AppContext';
import { Home } from 'lucide-react';

export const Footer: React.FC = () => {
  const { setView } = useApp();

  return (
    <footer className="bg-gray-950 border-t border-purple-500/20 text-gray-400 text-xs py-10 mt-16">
      <div className="max-w-7xl mx-auto px-4 space-y-6">
        
        {/* Top Footer Logo & Quick links */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 border-b border-gray-900 pb-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600/50 to-indigo-600/50 border border-purple-500/30 flex items-center justify-center text-amber-300">
              <Home size={18} />
            </div>
            <span className="font-extrabold text-base text-white">
              Mikrokosmos Fansub
            </span>
          </div>

          <div className="flex flex-wrap justify-center gap-4 text-xs font-medium">
            <button onClick={() => setView({ type: 'home' })} className="hover:text-purple-300">
              Ana Sayfa
            </button>
            <button onClick={() => setView({ type: 'series-list' })} className="hover:text-purple-300">
              Tüm Seriler
            </button>
            <button onClick={() => setView({ type: 'advanced-search' })} className="hover:text-purple-300">
              Gelişmiş Arama
            </button>
            <button onClick={() => setView({ type: 'categories' })} className="hover:text-purple-300">
              Kategoriler
            </button>
            <button onClick={() => setView({ type: 'az-list' })} className="hover:text-purple-300">
              A-Z Liste
            </button>
            <button onClick={() => setView({ type: 'join-team' })} className="hover:text-purple-300">
              Ekip Başvurusu
            </button>
            <button onClick={() => setView({ type: 'report' })} className="hover:text-purple-300">
              Sorun Bildir
            </button>
          </div>
        </div>

        {/* DMCA / Copyright Notice */}
        <div className="max-w-3xl mx-auto text-center space-y-2 leading-relaxed text-gray-500 text-[11px]">
          <p>
            Bu web sitesinde editlenen ve çevirilen tüm seriler sadece orijinal serilerin tanıtımı niteliğindedir. DMCA - Telif haklarını ihlal ettiğimizi düşündüğünüz seriler için lütfen bizimle iletişime geçiniz.
          </p>
          <p>
            Bu site sunucusunda herhangi bir telifli medya saklamaz. Tüm içerikler üçüncü taraf hizmetler üzerinden sağlanmaktadır.
          </p>
        </div>

        {/* Bottom copyright line */}
        <div className="text-center text-gray-500 pt-4 flex items-center justify-center gap-1 text-[11px]">
          <span>© {new Date().getFullYear()} Mikrokosmos Fansub. Tüm Hakları Saklıdır.</span>
        </div>

      </div>
    </footer>
  );
};
