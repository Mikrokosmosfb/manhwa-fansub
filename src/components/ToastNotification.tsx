import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../context/AppContext';
import { Bell, CheckCircle2, Info, AlertTriangle, Sparkles, X, BookOpen, ChevronRight } from 'lucide-react';

export const ToastNotification: React.FC = () => {
  const { toasts, dismissToast, setView } = useApp();

  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2.5 max-w-sm sm:max-w-md w-[calc(100vw-2.5rem)] pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => {
          const isChapter = toast.type === 'chapter';
          const isBell = toast.type === 'bell';
          const isSuccess = toast.type === 'success';
          const isWarning = toast.type === 'warning';

          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95, transition: { duration: 0.2 } }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className={`pointer-events-auto rounded-2xl p-3.5 sm:p-4 shadow-2xl border backdrop-blur-xl transition-all duration-300 flex items-start gap-3 relative overflow-hidden group ${
                isChapter
                  ? 'bg-gradient-to-r from-purple-950/95 via-gray-900/95 to-indigo-950/95 border-purple-500/50 shadow-purple-950/50'
                  : isBell
                  ? 'bg-gray-900/95 border-fuchsia-500/40 shadow-fuchsia-950/40'
                  : isSuccess
                  ? 'bg-gray-900/95 border-emerald-500/40 shadow-emerald-950/40'
                  : isWarning
                  ? 'bg-gray-900/95 border-amber-500/40 shadow-amber-950/40'
                  : 'bg-gray-900/95 border-blue-500/40 shadow-blue-950/40'
              }`}
            >
              {/* Optional Cover Thumbnail */}
              {toast.coverImage ? (
                <div className="w-12 h-16 rounded-lg overflow-hidden border border-purple-500/30 flex-shrink-0 relative shadow-md">
                  <img
                    src={toast.coverImage}
                    alt={toast.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                </div>
              ) : (
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-inner ${
                    isChapter
                      ? 'bg-purple-600/30 text-purple-300 border border-purple-500/40'
                      : isBell
                      ? 'bg-fuchsia-600/30 text-fuchsia-300 border border-fuchsia-500/40'
                      : isSuccess
                      ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/40'
                      : isWarning
                      ? 'bg-amber-600/30 text-amber-300 border border-amber-500/40'
                      : 'bg-blue-600/30 text-blue-300 border border-blue-500/40'
                  }`}
                >
                  {isChapter ? (
                    <Sparkles size={20} className="text-purple-300 animate-pulse" />
                  ) : isBell ? (
                    <Bell size={20} className="text-fuchsia-300 animate-bounce-slight" />
                  ) : isSuccess ? (
                    <CheckCircle2 size={20} className="text-emerald-300" />
                  ) : isWarning ? (
                    <AlertTriangle size={20} className="text-amber-300" />
                  ) : (
                    <Info size={20} className="text-blue-300" />
                  )}
                </div>
              )}

              {/* Message Content */}
              <div className="flex-1 min-w-0 pr-4">
                <div className="flex items-center gap-1.5 mb-0.5">
                  {isChapter && (
                    <span className="text-[10px] uppercase font-black tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/30 px-1.5 py-0.5 rounded">
                      YENİ BÖLÜM
                    </span>
                  )}
                  <h4 className="text-xs sm:text-sm font-bold text-white leading-tight truncate">
                    {toast.title}
                  </h4>
                </div>
                <p className="text-[11px] sm:text-xs text-gray-300 leading-relaxed line-clamp-2">
                  {toast.message}
                </p>

                {/* Action button if seriesId / chapterId present */}
                {toast.seriesId && (
                  <div className="mt-2 flex items-center gap-2">
                    {toast.chapterId ? (
                      <button
                        onClick={() => {
                          setView({
                            type: 'reader',
                            seriesId: toast.seriesId!,
                            chapterId: toast.chapterId!
                          });
                          dismissToast(toast.id);
                        }}
                        className="inline-flex items-center gap-1 text-[11px] font-extrabold bg-purple-600 hover:bg-purple-500 text-white px-2.5 py-1 rounded-lg shadow transition-all active:scale-95"
                      >
                        <BookOpen size={12} />
                        Bölümü Oku
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setView({
                            type: 'series-detail',
                            seriesId: toast.seriesId!
                          });
                          dismissToast(toast.id);
                        }}
                        className="inline-flex items-center gap-1 text-[11px] font-extrabold bg-purple-900/80 hover:bg-purple-800 text-purple-200 border border-purple-500/30 px-2.5 py-1 rounded-lg shadow transition-all active:scale-95"
                      >
                        Seriye Git
                        <ChevronRight size={12} />
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Close Button */}
              <button
                onClick={() => dismissToast(toast.id)}
                className="absolute top-2.5 right-2.5 p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                aria-label="Kapat"
              >
                <X size={14} />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};
