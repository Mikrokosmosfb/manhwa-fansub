import React, { useState, useEffect } from 'react';
import { ExternalLink, X, Compass, Smartphone, Copy, Check } from 'lucide-react';

/**
 * Detects whether the current user is visiting from Instagram or Meta's in-app webview
 */
export function isInstagramOrInAppBrowser(): boolean {
  if (typeof window === 'undefined' || !navigator) return false;
  const ua = navigator.userAgent || navigator.vendor || (window as any).opera || '';
  // Checks Instagram, Facebook, Messenger and other webviews
  return /Instagram|FBAN|FBAV|FB_IAB/i.test(ua);
}

export const InstagramBrowserAlert: React.FC = () => {
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    try {
      // Check if user is in Instagram WebView and hasn't dismissed it in this session
      const dismissed = sessionStorage.getItem('mk_dismiss_insta_alert');
      if (!dismissed && isInstagramOrInAppBrowser()) {
        setIsVisible(true);
      }
    } catch {
      // Safe fallback
    }
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    try {
      sessionStorage.setItem('mk_dismiss_insta_alert', 'true');
    } catch {}
  };

  const handleOpenExternal = () => {
    const currentUrl = window.location.href;
    const isAndroid = /Android/i.test(navigator.userAgent);

    if (isAndroid) {
      // Try Android Intent to launch Chrome or system default browser
      try {
        const noProtocolUrl = currentUrl.replace(/^https?:\/\//i, '');
        const intentUrl = `intent://${noProtocolUrl}#Intent;scheme=https;action=android.intent.action.VIEW;end`;
        window.location.href = intentUrl;
        return;
      } catch {}
    }

    // Fallback: Copy link so user can paste into Chrome/Safari
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(currentUrl).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 3000);
      }).catch(() => {});
    }
  };

  if (!isVisible) return null;

  return (
    <aside 
      aria-label="Instagram Tarayıcı Bildirimi"
      className="relative z-50 bg-gradient-to-r from-purple-950 via-indigo-950 to-purple-900 border-b border-purple-500/40 text-white shadow-xl animate-fadeIn transition-all duration-300"
    >
      <div className="max-w-7xl mx-auto px-3 py-2.5 sm:py-3 flex flex-col sm:flex-row items-center justify-between gap-2.5 sm:gap-4 text-xs sm:text-sm">
        
        {/* Left Side: Icon & Explanation */}
        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <div className="p-1.5 bg-gradient-to-tr from-amber-500 to-rose-500 rounded-xl text-white shadow-md flex-shrink-0 animate-pulse">
            <Smartphone size={17} />
          </div>
          <div className="flex-1 leading-snug">
            <span className="font-extrabold text-amber-300 block sm:inline mr-1">
              📱 Instagram Dahili Tarayıcısındasınız:
            </span>
            <span className="text-purple-100 text-[11.5px] sm:text-xs">
              Bölüm resimlerinin eksiksiz açılması için sağ üstteki <strong className="text-white bg-purple-900/80 px-1 py-0.5 rounded border border-purple-400/50">üç noktaya (⋮)</strong> basıp <strong className="text-amber-300 font-bold">"Tarayıcıda Aç" (Chrome / Safari)</strong> seçeneğini seçiniz.
            </span>
          </div>
        </div>

        {/* Right Side: Quick Action & Close Buttons */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-shrink-0">
          <button
            type="button"
            onClick={handleOpenExternal}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-[11px] sm:text-xs shadow-md transition-all active:scale-95 cursor-pointer border border-purple-400/50"
            title="Dahili tarayıcıdan çıkıp Chrome veya Safari'ye geç"
          >
            {copied ? (
              <>
                <Check size={13} className="text-emerald-300" />
                <span>Link Kopyalandı!</span>
              </>
            ) : (
              <>
                <ExternalLink size={13} />
                <span>Tarayıcıda Aç</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Uyarıyı Kapat"
            className="p-1.5 rounded-xl text-purple-300 hover:text-white hover:bg-purple-800/50 transition cursor-pointer flex-shrink-0"
            title="Kapat"
          >
            <X size={15} />
          </button>
        </div>

      </div>
    </aside>
  );
};
