import React from 'react';
import { useApp } from '../context/AppContext';
import { Megaphone, AlertTriangle, Info, CheckCircle, Flame } from 'lucide-react';

export const AnnouncementAlert: React.FC = () => {
  const { announcement } = useApp();

  if (!announcement || !announcement.active) return null;

  const getIcon = () => {
    switch (announcement.type) {
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-amber-400" />;
      case 'danger':
        return <Flame className="w-5 h-5 text-red-400" />;
      case 'info':
        return <Info className="w-5 h-5 text-blue-400" />;
      default:
        return <Megaphone className="w-5 h-5 text-teal-300" />;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 my-4">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-teal-50 via-purple-50 to-indigo-50 dark:from-teal-950 dark:via-purple-950 dark:to-indigo-950 border border-teal-300 dark:border-teal-500/30 p-4 sm:p-5 shadow-md flex items-center gap-4 transition-colors">
        
        {/* Glow effect */}
        <div className="absolute -right-10 -bottom-10 w-32 h-32 bg-teal-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="p-3 bg-teal-100 dark:bg-teal-500/20 border border-teal-300 dark:border-teal-400/30 rounded-xl flex-shrink-0 text-teal-700 dark:text-teal-300 shadow-sm">
          {getIcon()}
        </div>

        <div className="flex-1 min-w-0">
          <span className="text-[11px] font-extrabold uppercase tracking-widest text-teal-700 dark:text-teal-400 block mb-0.5">
            {announcement.title}
          </span>
          <p className="text-xs sm:text-sm text-slate-800 dark:text-gray-200 leading-relaxed font-medium">
            {announcement.text}
          </p>
        </div>
      </div>
    </div>
  );
};
