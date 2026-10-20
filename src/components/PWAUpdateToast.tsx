import React, { useState, useEffect } from 'react';
import { RefreshCw, Sparkles, X } from 'lucide-react';
import { subscribePWAUpdate, forceUpdateAndClearCache } from '../utils/pwaUpdater';

export const PWAUpdateToast: React.FC = () => {
  const [hasUpdate, setHasUpdate] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribePWAUpdate((updateStatus) => {
      setHasUpdate(updateStatus);
      if (updateStatus) {
        setDismissed(false);
      }
    });
    return () => unsubscribe();
  }, []);

  if (!hasUpdate || dismissed) return null;

  const handleUpdate = async () => {
    setIsUpdating(true);
    await forceUpdateAndClearCache();
  };

  return (
    <div className="fixed top-4 right-4 z-[9999] max-w-sm w-[calc(100%-2rem)] sm:w-auto animate-bounce-short">
      <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-950 via-slate-900 to-indigo-950 border border-purple-400/60 shadow-2xl shadow-purple-950/90 text-white flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-purple-600/30 border border-purple-400/40 flex items-center justify-center text-amber-300 shrink-0">
          <Sparkles className="w-5 h-5 animate-pulse" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
            Yeni Güncelleme Mevcut!
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
          </h4>
          <p className="text-[11px] text-purple-200/80 mt-0.5 truncate">
            En güncel özellikleri yüklemek için dokunun.
          </p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={handleUpdate}
            disabled={isUpdating}
            className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white text-xs font-bold flex items-center gap-1 shadow-md transition disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw size={12} className={isUpdating ? "animate-spin" : ""} />
            <span>{isUpdating ? "..." : "Yenile"}</span>
          </button>
          <button
            onClick={() => setDismissed(true)}
            title="Kapat"
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition"
          >
            <X size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};
