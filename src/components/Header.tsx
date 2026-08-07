import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  Sun,
  Moon,
  Search,
  Bookmark,
  Menu,
  X,
  BookOpen,
  PlusCircle,
  Clock,
  Sparkles,
  Award,
  User,
  Lock,
  ShieldCheck,
  Home,
  Calendar,
  Lightbulb,
  Tag,
  Baseline,
  Crown,
  Star,
  ShoppingBag,
  Coins
} from 'lucide-react';

import { Series } from '../types';
import { UserProfileModal } from './UserProfileModal';
import { SaturnIcon } from './SaturnIcon';

export const Header: React.FC = () => {
  const { theme, toggleTheme, setView, seriesList, isAdminLoggedIn, user, openAuthModal, openShop } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [profileInitialTab, setProfileInitialTab] = useState<'profile' | 'badges' | 'shop'>('profile');
  const searchRef = useRef<HTMLDivElement>(null);

  const handleOpenProfile = (tab: 'profile' | 'badges' | 'shop' = 'profile') => {
    setProfileInitialTab(tab);
    setIsProfileModalOpen(true);
  };

  const filteredResults: Series[] = searchQuery.trim()
    ? seriesList.filter(
        s =>
          s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.genres.some(g => g.toLowerCase().includes(searchQuery.toLowerCase())) ||
          s.type.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="header-preserve-white bg-gradient-to-r from-purple-900 via-purple-950 to-indigo-950 text-white shadow-xl sticky top-0 z-50 border-b border-purple-500/20">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-2">
          
          {/* Left section: Mobile menu toggle & Full Logo */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Mobile menu hamburger button */}
            <button
              onClick={() => {
                setIsMobileMenuOpen(!isMobileMenuOpen);
                setIsSearchOpen(false);
              }}
              className="p-1.5 rounded-xl text-purple-200 hover:text-white hover:bg-purple-800/50 transition md:hidden"
              aria-label="Menü"
            >
              {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>

            {/* Logo - ALWAYS FULL & UNTRUNCATED */}
            <button
              onClick={() => setView({ type: 'home' })}
              className="flex items-center gap-2.5 text-left group flex-shrink-0"
            >
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-purple-600 via-indigo-600 to-purple-800 border border-purple-400/50 flex items-center justify-center shadow-lg shadow-purple-950/50 group-hover:scale-105 group-hover:border-amber-400/60 transition duration-300 flex-shrink-0">
                <SaturnIcon size={22} className="text-amber-300 group-hover:rotate-12 transition-transform duration-300" />
              </div>
              <div className="flex flex-col flex-shrink-0">
                <span className="font-black text-lg sm:text-xl lg:text-2xl tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-purple-100 to-amber-200 whitespace-nowrap leading-none drop-shadow-sm">
                  Mikrokosmos
                </span>
                <span className="text-[9px] sm:text-[10px] uppercase tracking-[0.25em] text-purple-300 font-extrabold whitespace-nowrap mt-1 leading-none">
                  FANSUB
                </span>
              </div>
            </button>
          </div>

          {/* Desktop Central Nav Links */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2 text-xs lg:text-sm font-semibold">
            <button
              onClick={() => setView({ type: 'home' })}
              className="px-2.5 py-1.5 rounded-lg hover:bg-purple-800/50 transition text-purple-100 hover:text-white"
            >
              Ana Sayfa
            </button>
            <button
              onClick={() => setView({ type: 'schedule' })}
              className="px-2.5 py-1.5 rounded-lg hover:bg-purple-800/50 transition text-amber-300 hover:text-amber-200 flex items-center gap-1 font-bold"
            >
              Takvim
            </button>
            <button
              onClick={() => setView({ type: 'request-board' })}
              className="px-2.5 py-1.5 rounded-lg hover:bg-purple-800/50 transition text-fuchsia-300 hover:text-fuchsia-200 flex items-center gap-1 font-bold"
            >
              İstek Panosu
            </button>
            <button
              onClick={() => setView({ type: 'series-list' })}
              className="px-2.5 py-1.5 rounded-lg hover:bg-purple-800/50 transition text-purple-100 hover:text-white"
            >
              Seriler
            </button>
            <button
              onClick={() => setView({ type: 'categories' })}
              className="px-2.5 py-1.5 rounded-lg hover:bg-purple-800/50 transition text-purple-100 hover:text-white"
            >
              Kategoriler
            </button>
            <button
              onClick={() => setView({ type: 'history' })}
              className="px-2.5 py-1.5 rounded-lg hover:bg-purple-800/50 transition text-purple-100 hover:text-white flex items-center gap-1"
            >
              <Clock size={14} />
              Geçmiş
            </button>

            {/* Shop Nav Button */}
            <button
              onClick={() => handleOpenProfile('shop')}
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black font-extrabold text-xs flex items-center gap-1.5 shadow-lg shadow-amber-500/20 transition active:scale-95 ml-1"
            >
              <ShoppingBag size={14} className="stroke-[2.5]" />
              <span>Mağaza</span>
            </button>
          </nav>

          {/* Right Action Icons & Search */}
          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
            
            {/* Search Icon Button (Desktop, Tablet & Mobile) */}
            <button
              onClick={() => {
                setIsSearchOpen(!isSearchOpen);
                setIsMobileMenuOpen(false);
              }}
              className={`p-2 rounded-full transition flex items-center justify-center ${
                isSearchOpen
                  ? 'bg-purple-700 text-white shadow-lg ring-2 ring-purple-400'
                  : 'text-purple-200 hover:text-white hover:bg-purple-800/50'
              }`}
              title="Arama Yap"
              aria-label="Arama"
            >
              <Search size={18} />
            </button>

            {/* Kütüphane Button */}
            <button
              onClick={() => setView({ type: 'library' })}
              className="flex items-center gap-1.5 bg-purple-800/90 hover:bg-purple-700 px-2.5 py-1.5 rounded-full text-xs font-bold shadow transition border border-purple-500/30"
              title="Kütüphane"
            >
              <Bookmark size={14} className="fill-current text-purple-200" />
              <span className="hidden sm:inline">Kütüphane</span>
            </button>

            {/* Dark / Light Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full hover:bg-purple-800/50 text-purple-200 hover:text-amber-300 transition"
              title={theme === 'dark' ? 'Açık Mod' : 'Karanlık Mod'}
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            {/* Admin Icon */}
            <button
              onClick={() => setView({ type: 'admin' })}
              className={`p-2 rounded-full transition border shadow flex items-center justify-center ${
                isAdminLoggedIn
                  ? 'bg-amber-950/80 text-amber-300 border-amber-500/50 hover:bg-amber-900/90'
                  : 'bg-purple-900/60 text-purple-200 border-purple-500/30 hover:bg-purple-800/80 hover:text-white'
              }`}
              title={isAdminLoggedIn ? 'Yönetici Paneli (Açık)' : 'Yönetici Girişi (Korumalı)'}
              aria-label="Yönetim Paneli"
            >
              {isAdminLoggedIn ? (
                <ShieldCheck size={18} className="text-amber-400" />
              ) : (
                <Lock size={18} className="text-purple-300" />
              )}
            </button>

            {/* User Profile / Auth Button */}
            {user ? (
              <button
                onClick={() => handleOpenProfile('profile')}
                className="flex items-center gap-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black px-2.5 py-1.5 rounded-full text-xs font-black shadow transition transform hover:scale-105"
                title={`${user.name} - Profilim & Rozetlerim`}
              >
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-4 h-4 rounded-full border border-black/30"
                />
                <span className="hidden sm:inline max-w-[80px] truncate">{user.name}</span>
              </button>
            ) : (
              <button
                onClick={() => openAuthModal('login')}
                className="flex items-center gap-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-lg shadow-purple-950/50 transition transform hover:scale-105 border border-purple-400/40"
                title="Giriş Yap veya Ücretsiz Üye Ol"
              >
                <User size={14} />
                <span>Giriş Yap</span>
              </button>
            )}

          </div>
        </div>
      </div>

      {/* Expandable Search Overlay / Bar (All Devices) */}
      {isSearchOpen && (
        <div className="bg-purple-950/95 backdrop-blur-md border-t border-purple-800/80 p-3 sm:p-4 shadow-2xl relative z-50" ref={searchRef}>
          <div className="max-w-3xl mx-auto relative flex items-center">
            <Search size={18} className="absolute left-3.5 text-purple-300 pointer-events-none" />
            <input
              type="text"
              placeholder="Aramak istediğiniz seri, tür veya yazarı yazın..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              autoFocus
              className="w-full bg-gray-900 border border-purple-500/50 text-white placeholder-purple-300/60 text-xs sm:text-sm rounded-2xl pl-10 pr-10 py-2.5 sm:py-3 focus:outline-none focus:ring-2 focus:ring-purple-400 shadow-inner"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 text-purple-400 hover:text-white p-1"
                aria-label="Temizle"
              >
                <X size={18} />
              </button>
            )}
          </div>

          {/* Live Search Results Container */}
          {searchQuery.trim() && (
            <div className="max-w-3xl mx-auto mt-2.5 bg-gray-900/95 border border-purple-500/30 rounded-2xl overflow-hidden shadow-2xl max-h-96 overflow-y-auto divide-y divide-gray-800">
              <div className="px-3.5 py-2 text-[11px] font-extrabold text-purple-300 bg-purple-950/90 uppercase tracking-wider flex justify-between items-center">
                <span>Arama Sonuçları ({filteredResults.length})</span>
                <span className="text-[10px] text-gray-400 font-normal">Dışarıya Tıklayarak Kapatabilirsiniz</span>
              </div>
              {filteredResults.length === 0 ? (
                <div className="p-6 text-center text-xs sm:text-sm text-gray-400">
                  Aradığınız kriterlere uygun seri bulunamadı.
                </div>
              ) : (
                filteredResults.map(s => (
                  <button
                    key={s.id}
                    onClick={() => {
                      setView({ type: 'series-detail', seriesId: s.id });
                      setIsSearchOpen(false);
                      setSearchQuery('');
                    }}
                    className="w-full text-left p-2.5 sm:p-3 flex items-center gap-3.5 hover:bg-purple-900/40 transition group"
                  >
                    <img
                      src={s.coverImage}
                      alt={s.title}
                      className="w-10 h-14 sm:w-12 sm:h-16 object-cover rounded-xl flex-shrink-0 border border-purple-500/30 shadow"
                    />
                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs sm:text-sm font-bold text-gray-100 truncate group-hover:text-purple-300 transition">
                        {s.title}
                      </h4>
                      <div className="flex flex-wrap items-center gap-2 mt-1 text-[11px] text-gray-400">
                        <span className="bg-purple-950 text-purple-300 px-2 py-0.5 rounded-md border border-purple-800 font-extrabold text-[10px]">
                          {s.type}
                        </span>
                        <span className="text-amber-400 font-bold flex items-center gap-1">
                          <Star size={12} className="fill-current text-amber-400" />
                          {s.rating}
                        </span>
                        <span className="text-gray-500">•</span>
                        <span className="text-gray-400 truncate max-w-[200px] sm:max-w-[300px]">
                          {s.genres.join(', ')}
                        </span>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      )}

      {/* User Profile Modal */}
      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        initialTab={profileInitialTab}
      />

      {/* Mobile Nav Drawer */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-gray-950 border-t border-purple-800/80 px-4 pt-3 pb-5 space-y-1.5 shadow-2xl">
          <button
            onClick={() => {
              handleOpenProfile('profile');
              setIsMobileMenuOpen(false);
            }}
            className="w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-extrabold text-amber-300 bg-purple-950/80 border border-purple-700/60 flex items-center gap-2 mb-2 shadow"
          >
            <Award size={18} className="text-amber-400" />
            Profilim & Rozetlerim
          </button>

          {/* Mobile Shop Button */}
          <button
            onClick={() => {
              handleOpenProfile('shop');
              setIsMobileMenuOpen(false);
            }}
            className="w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-black text-black bg-gradient-to-r from-amber-400 to-yellow-500 shadow-lg flex items-center justify-between mb-2 transition active:scale-95"
          >
            <span className="flex items-center gap-2">
              <ShoppingBag size={18} className="stroke-[2.5]" />
              Mikrokosmos Mağazası
            </span>
            <span className="text-xs bg-black/20 px-2 py-0.5 rounded font-mono font-bold">{user?.email?.toLowerCase() === 'aseleliyeva77@gmail.com' ? '∞ CP' : `${user?.coins ?? 250} CP`}</span>
          </button>

          {/* Mobile Theme Toggle Button */}
          <button
            onClick={() => {
              toggleTheme();
            }}
            className="w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-extrabold text-purple-200 bg-purple-900/40 border border-purple-700/40 flex items-center justify-between mb-2 shadow"
          >
            <span className="flex items-center gap-2">
              {theme === 'dark' ? <Sun size={18} className="text-amber-300" /> : <Moon size={18} className="text-indigo-300" />}
              {theme === 'dark' ? 'Açık Mod\'a Geç' : 'Karanlık Mod\'a Geç'}
            </span>
            <span className="text-xs text-purple-300 font-medium">({theme === 'dark' ? 'Karanlık' : 'Açık'})</span>
          </button>

          <button
            onClick={() => { setView({ type: 'home' }); setIsMobileMenuOpen(false); }}
            className="w-full text-left px-3.5 py-2 rounded-xl text-sm font-bold text-purple-100 hover:bg-purple-900/50 flex items-center gap-2"
          >
            <Home size={16} className="text-purple-400" /> Ana Sayfa
          </button>

          <button
            onClick={() => { setView({ type: 'schedule' }); setIsMobileMenuOpen(false); }}
            className="w-full text-left px-3.5 py-2 rounded-xl text-sm font-extrabold text-amber-300 hover:bg-purple-900/50 flex items-center gap-2"
          >
            <Calendar size={16} className="text-amber-400" /> Bölüm Yayın Takvimi
          </button>

          <button
            onClick={() => { setView({ type: 'request-board' }); setIsMobileMenuOpen(false); }}
            className="w-full text-left px-3.5 py-2 rounded-xl text-sm font-extrabold text-fuchsia-300 hover:bg-purple-900/50 flex items-center gap-2"
          >
            <Lightbulb size={16} className="text-fuchsia-400" /> Seri İstek Panosu
          </button>

          <button
            onClick={() => { setView({ type: 'series-list' }); setIsMobileMenuOpen(false); }}
            className="w-full text-left px-3.5 py-2 rounded-xl text-sm font-bold text-purple-100 hover:bg-purple-900/50 flex items-center gap-2"
          >
            <BookOpen size={16} className="text-purple-400" /> Tüm Seriler
          </button>

          <button
            onClick={() => { setView({ type: 'categories' }); setIsMobileMenuOpen(false); }}
            className="w-full text-left px-3.5 py-2 rounded-xl text-sm font-bold text-purple-100 hover:bg-purple-900/50 flex items-center gap-2"
          >
            <Tag size={16} className="text-purple-400" /> Kategoriler & Türler
          </button>

          <button
            onClick={() => { setView({ type: 'library' }); setIsMobileMenuOpen(false); }}
            className="w-full text-left px-3.5 py-2 rounded-xl text-sm font-bold text-purple-100 hover:bg-purple-900/50 flex items-center gap-2"
          >
            <Bookmark size={16} className="text-purple-400" /> Kütüphanem
          </button>

          <button
            onClick={() => { setView({ type: 'az-list' }); setIsMobileMenuOpen(false); }}
            className="w-full text-left px-3.5 py-2 rounded-xl text-sm font-bold text-purple-100 hover:bg-purple-900/50 flex items-center gap-2"
          >
            <Baseline size={16} className="text-purple-400" /> A-Z Liste
          </button>

          <button
            onClick={() => { setView({ type: 'history' }); setIsMobileMenuOpen(false); }}
            className="w-full text-left px-3.5 py-2 rounded-xl text-sm font-bold text-purple-100 hover:bg-purple-900/50 flex items-center gap-2"
          >
            <Clock size={16} className="text-purple-400" /> Okuma Geçmişi
          </button>

          <button
            onClick={() => { setView({ type: 'admin' }); setIsMobileMenuOpen(false); }}
            className={`w-full text-left px-3.5 py-2 rounded-xl text-sm font-bold flex items-center gap-2 ${
              isAdminLoggedIn
                ? 'text-amber-300 bg-amber-950/60 border border-amber-500/30'
                : 'text-purple-200 hover:bg-purple-900/50'
            }`}
          >
            {isAdminLoggedIn ? (
              <>
                <Crown size={16} className="text-amber-400" /> Yönetim Paneli (Açık)
              </>
            ) : (
              <>
                <Lock size={16} className="text-purple-400" /> Yönetici Paneli (Korumalı)
              </>
            )}
          </button>
        </div>
      )}
    </header>
  );
};
