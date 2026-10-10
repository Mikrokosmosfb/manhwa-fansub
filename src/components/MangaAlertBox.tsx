import React from 'react';
import { AlertTriangle, Info, MessageSquare } from 'lucide-react';
import { ParsedMangaAlert } from '../utils/chapterUtils';

interface MangaAlertStackProps {
  alerts: ParsedMangaAlert[];
  className?: string;
}

export const MangaAlertStack: React.FC<MangaAlertStackProps> = ({ alerts, className = 'mt-4 space-y-2.5' }) => {
  if (!alerts || alerts.length === 0) return null;

  return (
    <div className={className}>
      {alerts.map((alert, idx) => {
        if (alert.type === 'warning') {
          return (
            <div
              key={idx}
              className="manga-alert m-warning bg-gradient-to-r from-amber-950/90 via-orange-950/85 to-red-950/80 border border-amber-500/45 text-amber-100 rounded-2xl p-3.5 sm:p-4 text-left flex items-start gap-3 shadow-lg"
            >
              <div className="m-icon-wrapper w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400 flex-shrink-0 mt-0.5 shadow-inner">
                <AlertTriangle size={18} />
              </div>
              <div className="m-text flex-1 min-w-0">
                <span className="m-label block font-black text-[11px] sm:text-xs uppercase tracking-wider text-amber-300 mb-1">
                  {alert.label || 'İÇERİK UYARISI'}
                </span>
                <p className="text-xs sm:text-[13px] leading-relaxed text-amber-100/95 font-medium">
                  {alert.message}
                </p>
              </div>
            </div>
          );
        }

        if (alert.type === 'info') {
          return (
            <div
              key={idx}
              className="manga-alert m-info bg-gradient-to-r from-sky-950/90 via-indigo-950/85 to-purple-950/80 border border-sky-400/45 text-sky-100 rounded-2xl p-3.5 sm:p-4 text-left flex items-start gap-3 shadow-lg"
            >
              <div className="m-icon-wrapper w-9 h-9 rounded-xl bg-sky-500/20 border border-sky-400/40 flex items-center justify-center text-sky-300 flex-shrink-0 mt-0.5 shadow-inner">
                <Info size={18} />
              </div>
              <div className="m-text flex-1 min-w-0">
                <span className="m-label block font-black text-[11px] sm:text-xs uppercase tracking-wider text-sky-300 mb-1">
                  {alert.label || 'BİLGİLENDİRME'}
                </span>
                <p className="text-xs sm:text-[13px] leading-relaxed text-sky-100/95 font-medium">
                  {alert.message}
                </p>
              </div>
            </div>
          );
        }

        return (
          <div
            key={idx}
            className="manga-alert m-note bg-gradient-to-r from-purple-950/90 via-indigo-950/85 to-purple-950/80 border border-purple-400/40 text-purple-100 rounded-2xl p-3.5 sm:p-4 text-left flex items-start gap-3 shadow-lg"
          >
            <div className="m-icon-wrapper w-9 h-9 rounded-xl bg-purple-500/20 border border-purple-400/40 flex items-center justify-center text-purple-300 flex-shrink-0 mt-0.5 shadow-inner">
              <MessageSquare size={17} />
            </div>
            <div className="m-text flex-1 min-w-0">
              <span className="m-label block font-black text-[11px] sm:text-xs uppercase tracking-wider text-purple-300 mb-1">
                {alert.label || 'NOT'}
              </span>
              <p className="text-xs sm:text-[13px] leading-relaxed text-purple-100/95 font-medium">
                {alert.message}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
};
