import React, { useState } from 'react';
import { Download, Sparkles, Heart, Monitor, Smartphone, ExternalLink, X, CheckCircle2, HelpCircle, ArrowRight, Laptop } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  variant?: 'header' | 'floating' | 'menu';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ variant = 'header' }) => {
  const { isInstallable, isInstalled, isIOS, isInIframe, install } = usePWAInstall();
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [showThankYouToast, setShowThankYouToast] = useState(false);

  if (isInstalled) {
    return null;
  }

  const handleInstallClick = async () => {
    if (isInstallable) {
      const result = await install();
      if (result === 'installed') {
        setShowThankYouToast(true);
        setTimeout(() => setShowThankYouToast(false), 5000);
      } else if (result === 'manual') {
        setShowGuideModal(true);
      }
    } else {
      // If prompt not available (in iframe, or desktop Chrome hasn't fired beforeinstallprompt yet)
      setShowGuideModal(true);
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
          Mikrokosmos uygulamasını cihazınıza eklediğiniz için teşekkür ederiz!
        </p>
      </div>
    </div>
  );

  return (
    <>
      {/* Trigger Buttons */}
      {variant === 'menu' ? (
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
              <div className="text-[10px] text-purple-300/70">Masaüstü veya Telefona Yükle</div>
            </div>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-bold border border-purple-500/30">
            Yükle
          </span>
        </button>
      ) : (
        <button
          onClick={handleInstallClick}
          title="Mikrokosmos Uygulamasını Bilgisayarınıza veya Telefonunuza İndirin"
          className="relative group overflow-hidden flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gradient-to-r from-purple-800/90 via-purple-700/80 to-pink-700/80 hover:from-purple-700 hover:to-pink-600 border border-purple-400/40 text-white text-xs font-semibold shadow-md shadow-purple-950/60 hover:shadow-purple-600/40 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out pointer-events-none" />
          <Download className="w-3.5 h-3.5 text-amber-300 animate-bounce" />
          <span className="hidden sm:inline">Uygulamayı İndir</span>
          <span className="sm:hidden">Uygulama</span>
        </button>
      )}

      {showThankYouToast && <ThankYouToast />}

      {/* Comprehensive Desktop & Mobile PWA Installation Guide Modal */}
      {showGuideModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-lg rounded-3xl bg-gradient-to-b from-gray-950 via-purple-950/90 to-gray-950 border border-purple-500/40 p-5 sm:p-7 text-white shadow-2xl shadow-purple-950/90 space-y-5 max-h-[90vh] overflow-y-auto">
            {/* Close Button */}
            <button
              onClick={() => setShowGuideModal(false)}
              className="absolute top-4 right-4 p-2 rounded-full bg-purple-900/40 hover:bg-purple-800/80 text-purple-200 hover:text-white border border-purple-500/30 transition"
            >
              <X size={18} />
            </button>

            {/* Header */}
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-gradient-to-tr from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-600/30">
                <Laptop className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-purple-100 to-pink-200">
                  Uygulamayı Bilgisayarınıza İndirin
                </h2>
                <p className="text-xs text-purple-200/80 font-medium mt-0.5">
                  Mikrokosmos PWA (Masaüstü & Mobil Programı)
                </p>
              </div>
            </div>

            {/* IFRAME Warning Notice */}
            {isInIframe && (
              <div className="rounded-2xl bg-amber-950/50 border border-amber-500/50 p-4 space-y-3">
                <div className="flex items-start gap-2.5">
                  <HelpCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                  <div className="text-xs text-amber-200 space-y-1">
                    <p className="font-bold text-amber-300">Önizleme Penceresindesiniz!</p>
                    <p>
                      Şu an önizleme penceresi içinde olduğunuz için tarayıcınız doğrudan otomatik indirme penceresini engelleyebilir.
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    window.open(window.location.href, '_blank');
                  }}
                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-black text-xs shadow-lg shadow-amber-500/30 transition-all flex items-center justify-center gap-2 active:scale-95"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Uygulamayı Yeni Sekmede Aç (Yükleme İzni İçin)</span>
                </button>
              </div>
            )}

            {/* Step-by-Step Desktop Guide (Chrome / Edge / Mac / Windows) */}
            <div className="space-y-3 bg-gray-900/80 border border-purple-500/20 p-4 rounded-2xl">
              <h3 className="text-xs font-black uppercase tracking-wider text-purple-300 flex items-center gap-2">
                <Monitor className="w-4 h-4 text-purple-400" />
                Masaüstü (Chrome / Edge / Windows / Mac) Yükleme Adımları:
              </h3>

              <div className="space-y-2.5 text-xs text-gray-200">
                <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-purple-950/50 border border-purple-500/20">
                  <span className="w-5 h-5 rounded-full bg-purple-600 text-white font-bold text-[11px] flex items-center justify-center flex-shrink-0 mt-0.5">
                    1
                  </span>
                  <div>
                    <strong className="text-white block font-bold">1. Adım (En Kolay Yöntem):</strong>
                    Chrome veya Microsoft Edge adres çubuğunuzun sağ tarafındaki <span className="inline-flex items-center gap-1 font-bold text-amber-300 bg-amber-500/20 px-1.5 py-0.5 rounded border border-amber-500/30"><Download className="w-3 h-3" /> İndir / Yükle (⊕)</span> simgesine tıklayın.
                  </div>
                </div>

                <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-purple-950/50 border border-purple-500/20">
                  <span className="w-5 h-5 rounded-full bg-purple-600 text-white font-bold text-[11px] flex items-center justify-center flex-shrink-0 mt-0.5">
                    2
                  </span>
                  <div>
                    <strong className="text-white block font-bold">2. Adım (Alternatif Menü):</strong>
                    Tarayıcınızın sağ üstündeki <strong>Üç Nokta (⋮)</strong> menüsüne tıklayın ➔ <strong>"Kaydet ve Paylaş"</strong> ➔ <strong>"Mikrokosmos Uygulamasını Yükle"</strong> seçeneğine tıklayın.
                  </div>
                </div>

                <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-purple-950/50 border border-purple-500/20">
                  <span className="w-5 h-5 rounded-full bg-purple-600 text-white font-bold text-[11px] flex items-center justify-center flex-shrink-0 mt-0.5">
                    3
                  </span>
                  <div>
                    <strong className="text-white block font-bold">3. Adım:</strong>
                    "Yükle" butonuna bastığınızda uygulama masaüstünüze ve başlat menünüze ayrı bir program olarak yüklenecektir!
                  </div>
                </div>
              </div>
            </div>

            {/* Mobile Guide */}
            <div className="space-y-2 bg-gray-900/60 border border-purple-500/20 p-3.5 rounded-2xl text-xs">
              <h3 className="font-bold text-pink-300 flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-pink-400" />
                Telefon & Tablet İçin:
              </h3>
              <p className="text-purple-200/80 leading-relaxed text-[11px]">
                • <strong>Android (Chrome):</strong> Menü (⋮) ➔ <em>"Uygulamayı Yükle"</em> veya <em>"Ana Ekrana Ekle"</em>.<br />
                • <strong>iPhone (Safari):</strong> Paylaş Btonu (↑) ➔ <em>"Ana Ekrana Ekle"</em>.
              </p>
            </div>

            {/* Bottom Action */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowGuideModal(false)}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition active:scale-95 shadow-md"
              >
                Anladım, Kapat
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
