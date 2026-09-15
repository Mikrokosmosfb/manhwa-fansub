import React, { useState } from 'react';
import { Download, Sparkles, CheckCircle, Heart } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  variant?: 'header' | 'floating' | 'menu';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ variant = 'header' }) => {
  const { isInstallable, isInstalled, install } = usePWAInstall();
  const [showThankYouToast, setShowThankYouToast] = useState(false);

  if (isInstalled) {
    return null;
  }

  const handleInstallClick = async () => {
    if (isInstallable) {
      const installed = await install();
      if (installed) {
        setShowThankYouToast(true);
        setTimeout(() => setShowThankYouToast(false), 5000);
      } else {
        // Even if prompt closed or dismissed, show appreciation
        setShowThankYouToast(true);
        setTimeout(() => setShowThankYouToast(false), 4000);
      }
    } else {
      // Direct instant response without modal popups
      setShowThankYouToast(true);
      setTimeout(() => setShowThankYouToast(false), 5000);
    }
  };

  const ThankYouToast = () => (
    <div className="fixed bottom-6 right-6 z-[999] flex items-center gap-3 px-5 py-3.5 rounded-2xl bg-gradient-to-r from-purple-900 via-purple-950 to-indigo-950 border border-purple-400/50 text-white shadow-2xl shadow-purple-950/80 animate-bounce-short">
      <div className="p-2 rounded-xl bg-pink-500/20 text-pink-400 border border-pink-500/30">
        <Heart className="w-5 h-5 fill-current text-pink-400 animate-pulse" />
      </div>
      <div className="text-xs">
        <p className="font-extrabold text-purple-100 flex items-center gap-1">
          Teşekkür Ederiz!
          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
        </p>
        <p className="text-purple-200/90 text-[11px] font-medium mt-0.5">
          Uygulamamızı yüklediğiniz için teşekkür ederiz, keyifli okumalar dileriz!
        </p>
      </div>
    </div>
  );

  if (variant === 'menu') {
    return (
      <>
        <button
          onClick={handleInstallClick}
          className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl bg-purple-950/40 border border-purple-500/30 text-purple-200 hover:text-white hover:bg-purple-900/50 hover:border-purple-400/50 transition-all text-xs font-medium group shadow-lg shadow-purple-950/50"
        >
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-gradient-to-tr from-purple-600 to-pink-500 text-white shadow-md">
              <Download className="w-4 h-4" />
            </div>
            <div className="text-left">
              <div className="font-semibold text-purple-100 flex items-center gap-1">
                Uygulamayı İndir
                <Sparkles className="w-3 h-3 text-amber-300 animate-pulse" />
              </div>
              <div className="text-[10px] text-purple-300/70">Ana ekrana ekle & reklamsız oku</div>
            </div>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-bold border border-purple-500/30">
            Yükle
          </span>
        </button>

        {showThankYouToast && <ThankYouToast />}
      </>
    );
  }

  return (
    <>
      <button
        onClick={handleInstallClick}
        title="Mikrokosmos Uygulamasını Yükle"
        className="relative group overflow-hidden flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gradient-to-r from-purple-800/90 via-purple-700/80 to-pink-700/80 hover:from-purple-700 hover:to-pink-600 border border-purple-400/40 text-white text-xs font-semibold shadow-md shadow-purple-950/60 hover:shadow-purple-600/40 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out pointer-events-none" />
        <Download className="w-3.5 h-3.5 text-amber-300 animate-bounce" />
        <span className="hidden sm:inline">Uygulamayı İndir</span>
        <span className="sm:hidden">Uygulama</span>
      </button>

      {showThankYouToast && <ThankYouToast />}
    </>
  );
};
