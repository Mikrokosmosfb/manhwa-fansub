import React from 'react';
import { useApp } from '../context/AppContext';
import { Home, BookOpen, Bookmark, Bell, User } from 'lucide-react';

export const MobileBottomNav: React.FC = () => {
  const { view, setView, bookmarks, unreadNotificationsCount, user, openAuthModal } = useApp();

  const bookmarkedCount = Object.keys(bookmarks).length;

  const isActive = (type: string) => view.type === type;

  const handleOpenProfileTab = (tab: 'profile' | 'badges' | 'shop' | 'library') => {
    if (!user) {
      openAuthModal('login');
      return;
    }
    setView({ type: 'profile', initialTab: tab });
  };

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-gray-950/95 border-t border-purple-500/30 backdrop-blur-lg px-2 py-1.5 shadow-2xl flex items-center justify-around text-[10px]">
      {/* Ana Sayfa */}
      <button
        onClick={() => setView({ type: 'home' })}
        className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl transition ${
          isActive('home')
            ? 'text-purple-400 font-extrabold bg-purple-950/80 border border-purple-500/40'
            : 'text-gray-400 hover:text-white'
        }`}
      >
        <Home size={18} />
        <span>Ana Sayfa</span>
      </button>

      {/* Seriler */}
      <button
        onClick={() => setView({ type: 'series-list' })}
        className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl transition ${
          isActive('series-list') || isActive('categories')
            ? 'text-purple-400 font-extrabold bg-purple-950/80 border border-purple-500/40'
            : 'text-gray-400 hover:text-white'
        }`}
      >
        <BookOpen size={18} />
        <span>Seriler</span>
      </button>

      {/* Kütüphanem */}
      <button
        onClick={() => setView({ type: 'library' })}
        className={`relative flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl transition ${
          isActive('library')
            ? 'text-purple-400 font-extrabold bg-purple-950/80 border border-purple-500/40'
            : 'text-gray-400 hover:text-white'
        }`}
      >
        <div className="relative">
          <Bookmark size={18} />
          {bookmarkedCount > 0 && (
            <span className="absolute -top-1 -right-2 bg-purple-600 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center border border-gray-950">
              {bookmarkedCount}
            </span>
          )}
        </div>
        <span>Kütüphanem</span>
      </button>

      {/* Bildirimler (Sayfa olarak açılır) */}
      <button
        onClick={() => setView({ type: 'notifications' })}
        className={`relative flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl transition ${
          isActive('notifications')
            ? 'text-purple-400 font-extrabold bg-purple-950/80 border border-purple-500/40'
            : 'text-gray-400 hover:text-white'
        }`}
      >
        <div className="relative">
          <Bell size={18} />
          {unreadNotificationsCount > 0 && (
            <span className="absolute -top-1 -right-2 bg-gradient-to-r from-red-500 to-pink-500 text-white text-[9px] font-black min-w-[16px] h-4 px-1 rounded-full flex items-center justify-center border border-gray-950 shadow-sm animate-pulse">
              {unreadNotificationsCount > 99 ? '99+' : unreadNotificationsCount}
            </span>
          )}
        </div>
        <span>Bildirimler</span>
      </button>

      {/* Profil / Giriş Yap */}
      {user ? (
        <button
          onClick={() => handleOpenProfileTab('profile')}
          className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl transition ${
            isActive('profile')
              ? 'text-amber-300 font-extrabold bg-amber-950/80 border border-amber-500/40'
              : 'text-amber-300 hover:text-amber-200'
          }`}
        >
          <User size={18} className="text-amber-400" />
          <span>Profil</span>
        </button>
      ) : (
        <button
          onClick={() => openAuthModal('login')}
          className="flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl transition text-purple-300 hover:text-white"
        >
          <User size={18} className="text-purple-400" />
          <span>Giriş Yap</span>
        </button>
      )}
    </div>
  );
};
