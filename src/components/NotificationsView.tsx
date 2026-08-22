import React, { useState } from 'react';
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
  Search,
  CheckCircle,
  Clock,
  ArrowLeft,
  Filter,
  Bookmark
} from 'lucide-react';

export const NotificationsView: React.FC = () => {
  const {
    notifications,
    unreadNotificationsCount,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    deleteNotification,
    clearAllNotifications,
    followedSeriesIds,
    bookmarks,
    setView
  } = useApp();

  const [activeTab, setActiveTab] = useState<'all' | 'followed' | 'chapters' | 'system' | 'unread'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const isSeriesFollowed = (seriesId?: string) => {
    if (!seriesId) return false;
    return followedSeriesIds.includes(seriesId) || !!bookmarks[seriesId];
  };

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
    if (diffMin < 60) return `${diffMin} dakika önce`;
    if (diffHours < 24) return `${diffHours} saat önce`;
    if (diffDays === 1) return 'Dün';
    if (diffDays < 7) return `${diffDays} gün önce`;
    return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const filteredNotifications = notifications.filter(n => {
    // Tab filter
    if (activeTab === 'unread') {
      if (n.isRead) return false;
      if (n.type === 'chapter' && n.seriesId) {
        return isSeriesFollowed(n.seriesId);
      }
      return true;
    }
    if (activeTab === 'followed') {
      return n.type === 'chapter' && isSeriesFollowed(n.seriesId);
    }
    if (activeTab === 'chapters' && n.type !== 'chapter') return false;
    if (activeTab === 'system' && n.type === 'chapter') return false;

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const titleMatch = n.title?.toLowerCase().includes(q);
      const msgMatch = n.message?.toLowerCase().includes(q);
      const seriesMatch = n.seriesTitle?.toLowerCase().includes(q);
      if (!titleMatch && !msgMatch && !seriesMatch) return false;
    }

    return true;
  });

  const totalFollowedNotifications = notifications.filter(n => n.type === 'chapter' && isSeriesFollowed(n.seriesId)).length;
  const totalChapterNotifications = notifications.filter(n => n.type === 'chapter').length;
  const totalSystemNotifications = notifications.filter(n => n.type !== 'chapter').length;

  return (
    <div className="max-w-5xl mx-auto px-3 sm:px-6 py-6 space-y-6">
      {/* Top Breadcrumb / Return */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setView({ type: 'home' })}
          className="flex items-center gap-2 text-xs sm:text-sm font-bold text-purple-300 hover:text-white transition"
        >
          <ArrowLeft size={16} />
          <span>Ana Sayfaya Dön</span>
        </button>

        <div className="flex items-center gap-2">
          {unreadNotificationsCount > 0 && (
            <button
              onClick={() => markAllNotificationsAsRead()}
              className="bg-purple-950/80 hover:bg-purple-900 border border-purple-500/40 text-purple-200 hover:text-white px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-sm"
            >
              <CheckCheck size={15} />
              <span>Tümünü Okundu Say</span>
            </button>
          )}

          {notifications.length > 0 && (
            <button
              onClick={() => {
                if (confirm('Tüm bildirimler kalıcı olarak silinsin mi?')) {
                  clearAllNotifications();
                }
              }}
              className="bg-red-950/60 hover:bg-red-900/80 border border-red-500/30 text-red-300 hover:text-white px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-sm"
            >
              <Trash2 size={15} />
              <span>Temizle</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Header Banner */}
      <div className="bg-gradient-to-r from-purple-950 via-gray-900 to-indigo-950 border border-purple-500/30 rounded-3xl p-5 sm:p-7 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-12 -mt-12 w-48 h-48 bg-purple-600/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-purple-600/20 border border-purple-400/40 flex items-center justify-center text-purple-300 shadow-inner">
              <Bell size={26} className="animate-pulse" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
                Bildirim Merkezi
                {unreadNotificationsCount > 0 && (
                  <span className="text-xs bg-purple-600 text-white font-bold px-2 py-0.5 rounded-full shadow">
                    {unreadNotificationsCount} yeni
                  </span>
                )}
              </h1>
              <p className="text-xs sm:text-sm text-purple-200/80 mt-0.5">
                Kütüphanenizdeki serilerin yeni bölümleri ve duyurular tek bir yerde
              </p>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="flex items-center gap-2 text-center text-xs font-bold">
            <div className="bg-gray-950/80 border border-purple-500/30 px-3.5 py-2 rounded-2xl">
              <span className="block text-lg font-extrabold text-white">{notifications.length}</span>
              <span className="text-[10px] text-purple-300">Toplam</span>
            </div>
            <div className="bg-gray-950/80 border border-purple-500/30 px-3.5 py-2 rounded-2xl">
              <span className="block text-lg font-extrabold text-purple-400">{followedSeriesIds.length}</span>
              <span className="text-[10px] text-purple-300">Takip Edilen</span>
            </div>
            <div className="bg-gray-950/80 border border-purple-500/30 px-3.5 py-2 rounded-2xl">
              <span className="block text-lg font-extrabold text-amber-400">{unreadNotificationsCount}</span>
              <span className="text-[10px] text-amber-300">Okunmamış</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-gray-900/90 border border-purple-500/20 p-3 rounded-2xl">
        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1 md:pb-0">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'all'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-gray-400 hover:text-white hover:bg-purple-950/60'
            }`}
          >
            <Layers size={14} />
            <span>Tüm Bildirimler ({notifications.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('followed')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'followed'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-purple-300 hover:text-white hover:bg-purple-950/60'
            }`}
          >
            <Sparkles size={14} className="text-amber-300" />
            <span>Takip Ettiklerim ({totalFollowedNotifications})</span>
          </button>
          <button
            onClick={() => setActiveTab('chapters')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'chapters'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-gray-400 hover:text-white hover:bg-purple-950/60'
            }`}
          >
            <BookOpen size={14} />
            <span>Bölüm Güncellemeleri ({totalChapterNotifications})</span>
          </button>
          <button
            onClick={() => setActiveTab('system')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'system'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-gray-400 hover:text-white hover:bg-purple-950/60'
            }`}
          >
            <Megaphone size={14} />
            <span>Duyurular & Sistem ({totalSystemNotifications})</span>
          </button>
          {unreadNotificationsCount > 0 && (
            <button
              onClick={() => setActiveTab('unread')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'unread'
                  ? 'bg-amber-600 text-white shadow-md font-black'
                  : 'text-amber-400 hover:text-amber-300 hover:bg-amber-950/60'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <span>Okunmamış ({unreadNotificationsCount})</span>
            </button>
          )}
        </div>

        {/* Search Input */}
        <div className="relative min-w-[220px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Bildirimlerde ara..."
            className="w-full pl-9 pr-3 py-1.5 bg-gray-950/80 border border-purple-500/30 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-purple-400 transition"
          />
        </div>
      </div>

      {/* Notifications Grid / List */}
      <div className="space-y-3">
        {filteredNotifications.length === 0 ? (
          <div className="bg-gray-900/60 border border-purple-500/20 rounded-3xl p-12 text-center space-y-3">
            <div className="w-16 h-16 rounded-3xl bg-purple-950/80 border border-purple-500/40 flex items-center justify-center mx-auto text-purple-400 shadow-lg">
              <Bell size={28} />
            </div>
            <h3 className="text-base font-extrabold text-white">
              {searchQuery
                ? 'Aramanızla eşleşen bildirim bulunamadı'
                : activeTab === 'followed'
                ? 'Takip ettiğiniz serilere ait bildirim henüz yok'
                : 'Bildirim Kutunuz Temiz'}
            </h3>
            <p className="text-xs text-gray-400 max-w-md mx-auto">
              {searchQuery
                ? `"${searchQuery}" terimi ile ilgili bildirim bulunamadı.`
                : activeTab === 'followed'
                ? 'Kütüphanenizden veya serilerin detay sayfalarından serileri takip edebilirsiniz.'
                : 'Takip ettiğiniz serilere yeni bölümler yüklendiğinde ve duyurular yapıldığında anında burada görüntülenecektir.'}
            </p>
            <div className="pt-2">
              <button
                onClick={() => setView({ type: 'series-list' })}
                className="bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs px-4 py-2 rounded-xl transition shadow"
              >
                Serileri Keşfet ve Takip Et
              </button>
            </div>
          </div>
        ) : (
          filteredNotifications.map(notif => {
            const isFollowed = isSeriesFollowed(notif.seriesId);
            return (
            <div
              key={notif.id}
              className={`p-4 sm:p-5 rounded-2xl sm:rounded-3xl border transition-all flex flex-col sm:flex-row items-start gap-4 group relative ${
                notif.isRead
                  ? 'bg-gray-900/80 border-purple-500/20 hover:border-purple-500/40 text-gray-300'
                  : 'bg-purple-950/60 border-purple-500/50 hover:border-purple-400 text-white shadow-lg shadow-purple-950/50'
              }`}
            >
              {/* Unread Indicator */}
              {!notif.isRead && (
                <div className="absolute top-3.5 right-3.5 flex items-center gap-1.5 text-[10px] font-black text-purple-300 bg-purple-900/80 px-2 py-0.5 rounded-full border border-purple-400/40">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
                  <span>Yeni</span>
                </div>
              )}

              {/* Cover or Category Icon */}
              {notif.type === 'chapter' && notif.coverImage ? (
                <div
                  onClick={() => {
                    markNotificationAsRead(notif.id);
                    if (notif.seriesId) setView({ type: 'series-detail', seriesId: notif.seriesId });
                  }}
                  className="w-16 h-22 sm:w-20 sm:h-28 rounded-xl overflow-hidden flex-shrink-0 border border-purple-500/30 cursor-pointer shadow-md group-hover:scale-102 transition"
                >
                  <img
                    src={notif.coverImage}
                    alt={notif.seriesTitle || 'Seri'}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-purple-900/80 border border-purple-500/40 flex items-center justify-center text-purple-200 flex-shrink-0">
                  {notif.type === 'announcement' ? (
                    <Megaphone size={22} className="text-amber-400" />
                  ) : notif.type === 'reward' ? (
                    <Sparkles size={22} className="text-yellow-400" />
                  ) : (
                    <Info size={22} className="text-purple-300" />
                  )}
                </div>
              )}

              {/* Information Body */}
              <div className="flex-1 min-w-0 pr-6 sm:pr-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm sm:text-base font-extrabold text-white group-hover:text-purple-200 transition">
                    {notif.title}
                  </h3>
                  {notif.chapterNumber !== undefined && (
                    <span className="px-2 py-0.5 rounded-md bg-purple-800/90 text-purple-200 text-xs font-mono font-black border border-purple-600/50">
                      Bölüm {notif.chapterNumber}
                    </span>
                  )}
                  {isFollowed && notif.type === 'chapter' && (
                    <span className="px-2 py-0.5 rounded-full bg-purple-900/90 text-amber-300 border border-purple-500/50 text-[10px] font-extrabold flex items-center gap-1">
                      <Sparkles size={11} /> Takip Ediliyor
                    </span>
                  )}
                </div>

                <p className="text-xs sm:text-sm text-gray-300 mt-1 leading-relaxed">
                  {notif.message}
                </p>

                {/* Meta details & Action Bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 mt-3 pt-3 border-t border-purple-900/40 text-xs">
                  <span className="flex items-center gap-1.5 text-purple-300 text-xs font-medium">
                    <Clock size={13} />
                    {formatTime(notif.createdAt)}
                  </span>

                  <div className="flex items-center gap-2">
                    {notif.seriesId && notif.chapterId && (
                      <button
                        onClick={() => {
                          markNotificationAsRead(notif.id);
                          setView({ type: 'reader', seriesId: notif.seriesId!, chapterId: notif.chapterId! });
                        }}
                        className="bg-purple-600 hover:bg-purple-500 text-white font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 shadow transition active:scale-95"
                      >
                        <BookOpen size={14} />
                        <span>Bölümü Oku</span>
                      </button>
                    )}

                    {notif.seriesId && (
                      <button
                        onClick={() => {
                          markNotificationAsRead(notif.id);
                          setView({ type: 'series-detail', seriesId: notif.seriesId! });
                        }}
                        className="bg-gray-950/80 hover:bg-purple-950 text-purple-200 border border-purple-500/30 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition"
                      >
                        <ExternalLink size={13} />
                        <span>Seriye Git</span>
                      </button>
                    )}

                    {!notif.isRead && (
                      <button
                        onClick={() => markNotificationAsRead(notif.id)}
                        className="p-1.5 text-gray-400 hover:text-purple-300 hover:bg-purple-950 rounded-lg transition"
                        title="Okundu İşaretle"
                      >
                        <CheckCircle size={15} />
                      </button>
                    )}

                    <button
                      onClick={() => deleteNotification(notif.id)}
                      className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-950/40 rounded-lg transition"
                      title="Sil"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        }))}
      </div>
    </div>
  );
};
