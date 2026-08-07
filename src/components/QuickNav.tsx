import React from 'react';
import { useApp } from '../context/AppContext';
import {
  MessageSquare,
  FileText,
  Clock,
  Tags,
  ListOrdered,
  ArrowDownAZ,
  Send,
  Bug,
  Calendar,
  ThumbsUp
} from 'lucide-react';

export const QuickNav: React.FC = () => {
  const { setView } = useApp();

  const links = [
    {
      title: 'Yayın Takvimi',
      icon: <Calendar className="w-3.5 h-3.5 text-amber-300" />,
      onClick: () => setView({ type: 'schedule' })
    },
    {
      title: 'İstek Panosu',
      icon: <ThumbsUp className="w-3.5 h-3.5 text-fuchsia-300" />,
      onClick: () => setView({ type: 'request-board' })
    },
    {
      title: 'Discord',
      icon: <MessageSquare className="w-3.5 h-3.5 text-indigo-300" />,
      onClick: () => window.open('https://discord.gg/5d6sseKRfs', '_blank')
    },
    {
      title: 'Başvuru',
      icon: <FileText className="w-3.5 h-3.5 text-purple-300" />,
      onClick: () => setView({ type: 'join-team' })
    },
    {
      title: 'Geçmiş',
      icon: <Clock className="w-3.5 h-3.5 text-purple-300" />,
      onClick: () => setView({ type: 'history' })
    },
    {
      title: 'Kategoriler',
      icon: <Tags className="w-3.5 h-3.5 text-purple-300" />,
      onClick: () => setView({ type: 'categories' })
    },
    {
      title: 'Tüm Seriler',
      icon: <ListOrdered className="w-3.5 h-3.5 text-purple-300" />,
      onClick: () => setView({ type: 'series-list' })
    },
    {
      title: 'A-Z Liste',
      icon: <ArrowDownAZ className="w-3.5 h-3.5 text-purple-300" />,
      onClick: () => setView({ type: 'az-list' })
    },
    {
      title: 'Sorun Bildir',
      icon: <Bug className="w-3.5 h-3.5 text-rose-300" />,
      onClick: () => setView({ type: 'report' })
    }
  ];

  return (
    <div className="w-full bg-purple-950/80 border-b border-purple-800/40 py-2 overflow-x-auto no-scrollbar shadow-inner">
      <div className="max-w-7xl mx-auto px-3 flex items-center justify-start md:justify-center gap-1.5 sm:gap-2 whitespace-nowrap min-w-max">
        {links.map((link, idx) => (
          <button
            key={idx}
            onClick={link.onClick}
            className="flex items-center gap-1.5 bg-purple-900/40 hover:bg-purple-800/70 text-purple-100 hover:text-white text-xs font-semibold px-3 py-1 rounded-full border border-purple-700/30 transition-all duration-150 active:scale-95"
          >
            {link.icon}
            <span>{link.title}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
