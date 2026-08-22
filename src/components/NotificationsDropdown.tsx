import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { AppNotification } from '../types';
import {
  Bell,
  CheckCheck,
  Trash2,
  BookOpen,
  ExternalLink,
  Megaphone,
  Sparkles,
  Info,
  Layers,
  X,
  Clock
} from 'lucide-react';

interface NotificationsDropdownProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationsDropdown: React.FC<NotificationsDropdownProps> = ({ isOpen, onClose }) => {
  const {
    notifications,
    unreadNotificationsCount,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    deleteNotification,
    clearAllNotifications,
    setView
  } = useApp();

  const [activeTab, setActiveTab] = useState<'all' | 'chapters' | 'system' | 'unread'>('all');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Filter notifications according to active tab
  const filteredNotifications = notifications.filter(n => {
    if (activeTab === 'unread') return !n.isRead;
    if (activeTab === 'chapters') return n.type === 'chapter';
    if (activeTab === 'system') return n.type !== 'chapter';
    return true;
  });

  const formatTime = (isoString?: string) => {
    if (!isoString) return 'Az önce';
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHours = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMin < 1) return 'Az önce';
    if (diffMin < 60) return `${diffMin} dk önce`;
    if (diffHours < 24) return `${diffHours} sa önce`;
    if (diffDays === 1) return 'Dün';
    if (diffDays < 7) return `${diffDays} gün önce`;
    return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
  };

  const handleNotificationClick = (notif: AppNotification) => {
    markNotificationAsRead(notif.id);
    if (notif.seriesId && notif.chapterId) {
      setView({ type: 'reader', seriesId: notif.seriesId, chapterId: notif.chapterId });
      onClose();
    } else if (notif.seriesId) {
      setView({ type: 'series-detail', seriesId: notif.seriesId });
      onClose();
    }
  };

  return (
    <div
      ref={dropdownRef}
      className="absolute right-0 top-full mt-2 w-[340px] sm:w-[420px] max-w-[92vw] bg-gray-950/95 border border-purple-500/40 rounded-2xl shadow-2xl backdrop-blur-xl z-50 overflow-hidden flex flex-col text-gray-100 animate-fadeIn"
      style={{ maxHeight: 'calc(100vh - 85px)' }}
    >
      {/* Header */}
      <div className="p-3.5 sm:p-4 bg-gradient-to-r from-purple-950 via-gray-900 to-indigo-950 border-b border-purple-900/60 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-purple-600/30 border border-purple-400/50 flex items-center justify-center text-purple-300">
            <Bell size={16} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-sm sm:text-base text-white">Bildirimler</h3>
              {unreadNotificationsCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-purple-600 text-white shadow-sm shadow-purple-900">
                  {unreadNotificationsCount} yeni
                </span>
              )}
            </div>
            <p className="text-[10px] text-purple-300">Seri güncellemeleri ve duyurular</p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {unreadNotificationsCount > 0 && (
            <button
              onClick={() => markAllNotificationsAsRead()}
              className="p-1.5 rounded-lg text-purple-300 hover:text-white hover:bg-purple-900/60 transition text-xs flex items-center gap-1 font-semibold"
              title="Tümünü Okundu Say"
            >
              <CheckCheck size={16} />
              <span className="hidden sm:inline text-[11px]">Tümünü Oku</span>
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition"
            title="Kapat"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between px-3 py-2 bg-gray-900/90 border-b border-purple-900/30 text-xs font-bold gap-1 overflow-x-auto scrollbar-none flex-shrink-0">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-2.5 py-1 rounded-lg transition text-[11px] whitespace-nowrap ${
              activeTab === 'all'
                ? 'bg-purple-600 text-white font-black'
                : 'text-gray-400 hover:text-white hover:bg-purple-950/60'
            }`}
          >
            Tümü ({notifications.length})
          </button>
          <button
            onClick={() => setActiveTab('chapters')}
            className={`px-2.5 py-1 rounded-lg transition text-[11px] whitespace-nowrap ${
              activeTab === 'chapters'
                ? 'bg-purple-600 text-white font-black'
                : 'text-gray-400 hover:text-white hover:bg-purple-950/60'
            }`}
          >
            Bölümler ({notifications.filter(n => n.type === 'chapter').length})
          </button>
          <button
            onClick={() => setActiveTab('system')}
            className={`px-2.5 py-1 rounded-lg transition text-[11px] whitespace-nowrap ${
              activeTab === 'system'
                ? 'bg-purple-600 text-white font-black'
                : 'text-gray-400 hover:text-white hover:bg-purple-950/60'
            }`}
          >
            Duyurular
          </button>
          {unreadNotificationsCount > 0 && (
            <button
              onClick={() => setActiveTab('unread')}
              className={`px-2.5 py-1 rounded-lg transition text-[11px] whitespace-nowrap flex items-center gap-1 ${
                activeTab === 'unread'
                  ? 'bg-amber-600 text-white font-black'
                  : 'text-amber-400 hover:text-amber-300 hover:bg-amber-950/60'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
              Okunmamış ({unreadNotificationsCount})
            </button>
          )}
        </div>

        {notifications.length > 0 && (
          <button
            onClick={() => {
              if (confirm('Tüm bildirimler silinsin mi?')) {
                clearAllNotifications();
              }
            }}
            className="p-1 text-gray-400 hover:text-red-400 rounded transition flex-shrink-0"
            title="Tümünü Temizle"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>

      {/* Notifications List */}
      <div className="overflow-y-auto max-h-[380px] divide-y divide-purple-900/20 p-1 space-y-1">
        {filteredNotifications.length === 0 ? (
          <div className="py-12 px-4 text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-purple-950/80 border border-purple-500/30 flex items-center justify-center mx-auto text-purple-400">
              <Layers size={22} />
            </div>
            <p className="text-xs font-bold text-gray-300">
              {activeTab === 'unread' ? 'Okunmamış bildirim bulunmuyor' : 'Henüz bildirim bulunmuyor'}
            </p>
            <p className="text-[10px] text-gray-500 max-w-[240px] mx-auto">
              Takip ettiğiniz serilere yeni bölüm yüklendiğinde ve duyurular paylaşıldığında burada listelenecektir.
            </p>
          </div>
        ) : (
          filteredNotifications.map(notif => (
            <div
              key={notif.id}
              onClick={() => handleNotificationClick(notif)}
              className={`p-2.5 sm:p-3 rounded-xl transition cursor-pointer flex items-start gap-2.5 sm:gap-3 group relative ${
                notif.isRead
                  ? 'bg-gray-950/60 hover:bg-purple-950/40 text-gray-300'
                  : 'bg-purple-950/50 hover:bg-purple-900/50 border border-purple-500/30 text-white shadow-sm'
              }`}
            >
              {/* Unread indicator badge */}
              {!notif.isRead && (
                <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-purple-400 ring-2 ring-purple-300/40 animate-pulse" />
              )}

              {/* Cover or Icon thumbnail */}
              {notif.type === 'chapter' && notif.coverImage ? (
                <div className="relative w-11 h-15 rounded-lg overflow-hidden flex-shrink-0 border border-purple-500/30 shadow-md">
                  <img
                    src={notif.coverImage}
                    alt={notif.seriesTitle || 'Seri'}
                    className="w-full h-full object-cover group-hover:scale-105 transition"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end justify-center p-0.5">
                    <span className="text-[8px] font-black text-amber-300">BÖLÜM</span>
                  </div>
                </div>
              ) : (
                <div className="w-10 h-10 rounded-xl bg-purple-900/80 border border-purple-500/40 flex items-center justify-center text-purple-200 flex-shrink-0 mt-0.5">
                  {notif.type === 'announcement' ? (
                    <Megaphone size={18} className="text-amber-400" />
                  ) : notif.type === 'reward' ? (
                    <Sparkles size={18} className="text-yellow-400" />
                  ) : (
                    <Info size={18} className="text-purple-300" />
                  )}
                </div>
              )}

              {/* Content */}
              <div className="flex-1 min-w-0 pr-4">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h4 className="font-extrabold text-xs text-purple-100 group-hover:text-purple-300 truncate max-w-[220px]">
                    {notif.title}
                  </h4>
                  {notif.chapterNumber !== undefined && (
                    <span className="px-1.5 py-0.2 rounded bg-purple-800 text-purple-200 text-[9px] font-mono font-black">
                      #{notif.chapterNumber}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-gray-300 line-clamp-2 mt-0.5 leading-snug">
                  {notif.message}
                </p>

                <div className="flex items-center justify-between mt-2 pt-1 border-t border-purple-900/30 text-[10px] text-gray-400">
                  <span className="flex items-center gap-1 text-[10px] text-purple-300">
                    <Clock size={11} />
                    {formatTime(notif.createdAt)}
                  </span>

                  <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
                    {notif.seriesId && notif.chapterId && (
                      <button
                        onClick={() => {
                          markNotificationAsRead(notif.id);
                          setView({ type: 'reader', seriesId: notif.seriesId!, chapterId: notif.chapterId! });
                          onClose();
                        }}
                        className="px-2 py-0.5 rounded-lg bg-purple-700 hover:bg-purple-600 text-white font-bold text-[10px] flex items-center gap-1 shadow transition active:scale-95"
                      >
                        <BookOpen size={10} />
                        <span>Oku</span>
                      </button>
                    )}

                    {notif.seriesId && (
                      <button
                        onClick={() => {
                          markNotificationAsRead(notif.id);
                          setView({ type: 'series-detail', seriesId: notif.seriesId! });
                          onClose();
                        }}
                        className="p-1 rounded-md text-gray-400 hover:text-purple-300 hover:bg-purple-950 transition"
                        title="Seri Sayfasına Git"
                      >
                        <ExternalLink size={12} />
                      </button>
                    )}

                    <button
                      onClick={() => deleteNotification(notif.id)}
                      className="p-1 rounded-md text-gray-500 hover:text-red-400 hover:bg-red-950/40 transition"
                      title="Bildirimi Sil"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="p-2.5 bg-gray-950 border-t border-purple-900/50 flex items-center justify-between text-xs flex-shrink-0">
        <button
          onClick={() => {
            setView({ type: 'notifications' });
            onClose();
          }}
          className="w-full text-center py-1.5 text-[11px] font-bold text-purple-300 hover:text-white hover:bg-purple-900/40 rounded-xl transition"
        >
          Tüm Bildirimleri Görüntüle →
        </button>
      </div>
    </div>
  );
};
