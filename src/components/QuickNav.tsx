import React from 'react';
import { useApp } from '../context/AppContext';
import {
  MessageSquare,
  Clock,
  Tags,
  ArrowDownAZ,
  Bug,
  Calendar,
  ThumbsUp,
  SlidersHorizontal,
  Share2,
  Trophy,
  Image as ImageIcon
} from 'lucide-react';

export const QuickNav: React.FC = () => {
  const { view, seriesList, setView } = useApp();

  const handleOpenReport = () => {
    try {
      if (view.type === 'series' || view.type === 'reader') {
        const s = seriesList.find(item => item.id === view.seriesId);
        const ch =
          view.type === 'reader'
            ? s?.chapters.find(c => c.id === view.chapterId)
            : undefined;
        sessionStorage.setItem(
          'mk_report_prefill',
          JSON.stringify({
            seriesId: s?.id || view.seriesId,
            seriesTitle: s?.title || '',
            chapterId: ch?.id || '',
            chapterTitle: ch ? ch.title || `Bölüm ${ch.number}` : '',
            pageUrl: typeof window !== 'undefined' ? window.location.href : ''
          })
        );
      }
    } catch {}
    setView({ type: 'report' });
  };

  const links = [
    {
      title: 'Top 50 Liderlik',
      icon: <Trophy className="w-3.5 h-3.5 text-amber-400 animate-pulse" />,
      onClick: () => setView({ type: 'leaderboard' }),
      highlight: true
    },
    {
      title: 'İstek Panosu',
      icon: <ThumbsUp className="w-3.5 h-3.5 text-fuchsia-300" />,
      onClick: () => setView({ type: 'request-board' })
    },
    {
      title: 'Yayın Takvimi',
      icon: <Calendar className="w-3.5 h-3.5 text-amber-300" />,
      onClick: () => setView({ type: 'schedule' })
    },
    {
      title: 'Geçmiş',
      icon: <Clock className="w-3.5 h-3.5 text-purple-300" />,
      onClick: () => setView({ type: 'history' })
    },
    {
      title: 'Discord',
      icon: <MessageSquare className="w-3.5 h-3.5 text-indigo-300" />,
      onClick: () => window.open('https://discord.gg/5d6sseKRfs', '_blank')
    },
    {
      title: 'Wallpaper',
      icon: <ImageIcon className="w-3.5 h-3.5 text-pink-300" />,
      onClick: () => setView({ type: 'wallpapers' })
    },
    {
      title: 'Kategoriler',
      icon: <Tags className="w-3.5 h-3.5 text-purple-300" />,
      onClick: () => setView({ type: 'categories' })
    },
    {
      title: 'Gelişmiş Arama',
      icon: <SlidersHorizontal className="w-3.5 h-3.5 text-purple-300" />,
      onClick: () => setView({ type: 'advanced-search' })
    },
    {
      title: 'A-Z Liste',
      icon: <ArrowDownAZ className="w-3.5 h-3.5 text-purple-300" />,
      onClick: () => setView({ type: 'az-list' })
    },
    {
      title: 'Sosyal Medya',
      icon: <Share2 className="w-3.5 h-3.5 text-pink-300" />,
      onClick: () => setView({ type: 'social-media' })
    },
    {
      title: 'Sorun Bildir',
      icon: <Bug className="w-3.5 h-3.5 text-rose-300" />,
      onClick: handleOpenReport
    }
  ];

  return (
    <div className="w-full bg-purple-950/80 border-b border-purple-800/40 py-2 overflow-x-auto no-scrollbar shadow-inner">
      <div className="max-w-7xl mx-auto px-3 flex items-center justify-start md:justify-center gap-1.5 sm:gap-2 whitespace-nowrap min-w-max">
        {links.map((link, idx) => (
          <button
            key={idx}
            onClick={link.onClick}
            className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full transition-all duration-150 active:scale-95 ${
              (link as any).highlight
                ? 'bg-gradient-to-r from-amber-500/30 to-orange-500/30 text-amber-300 font-bold border border-amber-400/50 shadow-sm'
                : 'bg-purple-900/40 hover:bg-purple-800/70 text-purple-100 hover:text-white border border-purple-700/30'
            }`}
          >
            {link.icon}
            <span>{link.title}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
