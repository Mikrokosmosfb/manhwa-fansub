import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
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
  Coins,
  LogOut,
  SlidersHorizontal
} from 'lucide-react';

import { Series, isSeries18Plus, isAuthorizedAdmin } from '../types';
import { SaturnIcon } from './SaturnIcon';

export const Header: React.FC = () => {
  const { theme, toggleTheme, setView, seriesList, isAdminLoggedIn, user, logout, openAuthModal, openShop, showNsfw, toggleNsfw } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [profileInitialTab, setProfileInitialTab] = useState<'profile' | 'badges' | 'shop' | 'library'>('profile');
  const searchRef = useRef<HTMLDivElement>(null);
  const profileDropdownRef = useRef<HTMLDivElement>(null);

  const handleOpenProfile = (tab: 'profile' | 'badges' | 'shop' | 'library' = 'profile') => {
    if (tab === 'shop') {
      setView({ type: 'shop' });
      setIsProfileDropdownOpen(false);
      return;
    }
    if (tab === 'library') {
      setView({ type: 'library' });
      setIsProfileDropdownOpen(false);
      return;
    }
    setView({ type: 'profile', initialTab: tab });
    setIsProfileDropdownOpen(false);
  };

  const searchableSeries = showNsfw ? seriesList : seriesList.filter(s => !isSeries18Plus(s));

  const filteredResults: Series[] = searchQuery.trim()
    ? searchableSeries.filter(
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
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(e.target as Node)) {
        setIsProfileDropdownOpen(false);
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
            {/* Mobile menu hamburger button - Clear, styled button with unmistakable Menu icon and label/feedback */}
            <button
              onClick={() => {
                setIsMobileMenuOpen(!isMobileMenuOpen);
                setIsSearchOpen(false);
              }}
              className="px-2.5 py-1.5 rounded-xl text-purple-100 hover:text-white bg-purple-950/90 hover:bg-purple-900 border border-purple-500/40 transition-all flex items-center gap-1.5 md:hidden shadow-md active:scale-95 flex-shrink-0"
              aria-label="Menü"
              title="Menüyü Aç"
            >
              {isMobileMenuOpen ? (
                <>
                  <X size={18} className="text-purple-300" />
                  <span className="text-xs font-bold">Kapat</span>
                </>
              ) : (
                <>
                  <Menu size={18} className="text-purple-300" />
                  <span className="text-xs font-bold tracking-wide">Menü</span>
                </>
              )}
            </button>

            {/* Logo - ALWAYS FULL & UNTRUNCATED WITH ORIGINAL SATURN LOGO */}
            <button
              onClick={() => setView({ type: 'home' })}
              className="flex items-center gap-2 sm:gap-2.5 text-left group flex-shrink-0"
              title="Ana Sayfa"
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


            {/* +18 / NSFW Quick Toggle Button */}
            <button
              onClick={() => toggleNsfw()}
              className={`px-2 py-1 rounded-lg text-[11px] font-black transition-all flex items-center gap-1 border shrink-0 active:scale-95 ${
                showNsfw
                  ? 'bg-rose-600 text-white border-rose-400 shadow-sm shadow-rose-950/80'
                  : 'bg-purple-950/80 text-purple-300 border-purple-700/50 hover:bg-purple-900 hover:text-white'
              }`}
              title={showNsfw ? '+18 İçerikler Açık (Kapatmak için tıkla)' : '+18 İçerikler Gizli (Açmak için tıkla)'}
              aria-label="18+ İçerik Filtresi"
            >
              <span>18+</span>
              <span className={`w-1.5 h-1.5 rounded-full ${showNsfw ? 'bg-white animate-pulse' : 'bg-gray-500'}`} />
            </button>

            {/* User Profile / Auth Button (Desktop Only - Mobile uses Bottom Nav) */}
            <div className="hidden md:block">
              {user ? (
                <div className="relative" ref={profileDropdownRef}>
                  <button
                    onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                    className="flex items-center gap-1.5 bg-gradient-to-r from-amber-500/20 via-purple-900/40 to-amber-500/20 hover:bg-purple-900/60 p-1 pr-2.5 rounded-full text-xs font-bold shadow-md transition transform hover:scale-105 border border-amber-500/40"
                    title={`${user.name} - Profil Menüsü`}
                  >
                    {user.avatar ? (
                      <img
                        src={user.avatar}
                        alt={user.name}
                        className="w-7 h-7 rounded-full object-cover border border-amber-400 shadow-sm"
                      />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-gradient-to-r from-amber-500 to-yellow-500 flex items-center justify-center text-black font-extrabold shadow-sm">
                        <User size={15} />
                      </div>
                    )}
                    <span className="text-[11px] font-extrabold text-amber-300 font-mono">
                      {isAuthorizedAdmin(user.email) ? '∞' : (user.coins ?? 250)} CP
                    </span>
                  </button>

                  {isProfileDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-gray-950 border border-purple-500/40 rounded-2xl shadow-2xl p-2 z-50 backdrop-blur-xl animate-fadeIn space-y-1">
                      <div className="px-3 py-2 border-b border-purple-900/60 mb-1 flex items-center gap-2.5">
                        {user.avatar ? (
                          <img
                            src={user.avatar}
                            alt={user.name}
                            className="w-8 h-8 rounded-full object-cover border border-purple-400/80 shadow-md"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-purple-800/80 border border-purple-400/80 flex items-center justify-center text-purple-200 font-bold">
                            <User size={16} />
                          </div>
                        )}
                        <div className="overflow-hidden">
                          <p className="text-xs font-extrabold text-white truncate">{user.name}</p>
                          <p className="text-[10px] text-purple-300 truncate">{user.email}</p>
                        </div>
                      </div>

                      {/* Management Panel - EXCLUSIVELY for Authorized Admin Accounts */}
                      {isAuthorizedAdmin(user.email) && (
                        <button
                          onClick={() => {
                            setView({ type: 'management' });
                            setIsProfileDropdownOpen(false);
                          }}
                          className="w-full text-left px-3 py-2 rounded-xl text-xs font-black text-amber-300 bg-gradient-to-r from-amber-950/80 via-purple-950 to-amber-950/80 border border-amber-500/50 hover:bg-amber-900/90 flex items-center justify-between transition shadow-md group"
                        >
                          <span className="flex items-center gap-2">
                            <Crown size={15} className="text-amber-400 group-hover:scale-110 transition" />
                            <span>Yönetim Paneli</span>
                          </span>
                          <span className="text-[9px] bg-amber-500/30 text-amber-200 px-1.5 py-0.5 rounded font-extrabold uppercase">Süper Admin</span>
                        </button>
                      )}

                      <button
                        onClick={() => handleOpenProfile('profile')}
                        className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-gray-200 hover:bg-purple-900/50 hover:text-white flex items-center gap-2 transition"
                      >
                        <User size={15} className="text-purple-400" />
                        <span>Profilim & Ayarlar</span>
                      </button>

                      <button
                        onClick={() => {
                          setView({ type: 'library' });
                          setIsProfileDropdownOpen(false);
                        }}
                        className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-gray-200 hover:bg-purple-900/50 hover:text-white flex items-center gap-2 transition"
                      >
                        <Bookmark size={15} className="text-purple-400 fill-purple-400/20" />
                        <span>Kütüphanem</span>
                      </button>

                      <button
                        onClick={() => handleOpenProfile('shop')}
                        className="w-full text-left px-3 py-2 rounded-xl text-xs font-extrabold text-amber-300 hover:bg-purple-900/50 flex items-center justify-between transition"
                      >
                        <span className="flex items-center gap-2">
                          <ShoppingBag size={15} className="text-amber-400" />
                          <span>Mağaza & Temalar</span>
                        </span>
                        <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded font-mono font-black">CP</span>
                      </button>

                      <button
                        onClick={() => handleOpenProfile('badges')}
                        className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-gray-200 hover:bg-purple-900/50 hover:text-white flex items-center gap-2 transition"
                      >
                        <Award size={15} className="text-amber-400" />
                        <span>Başarımlarım</span>
                      </button>

                      <button
                        onClick={() => toggleNsfw()}
                        className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold hover:bg-purple-900/50 flex items-center justify-between transition"
                      >
                        <span className="flex items-center gap-2 text-gray-200">
                          <span>🔞</span>
                          <span>+18 İçerik Filtresi</span>
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 rounded font-black ${
                          showNsfw ? 'bg-rose-900/80 text-rose-300 border border-rose-600/50' : 'bg-gray-800 text-gray-400'
                        }`}>
                          {showNsfw ? 'Açık' : 'Gizli'}
                        </span>
                      </button>

                      <div className="border-t border-purple-900/60 pt-1 mt-1">
                        <button
                          onClick={() => {
                            logout();
                            setIsProfileDropdownOpen(false);
                          }}
                          className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-red-400 hover:bg-red-950/50 hover:text-red-300 flex items-center gap-2 transition"
                        >
                          <LogOut size={15} />
                          <span>Çıkış Yap</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
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
      </div>

      {/* Expandable Search Overlay / Bar (All Devices) */}
      {isSearchOpen && (
        <div className="bg-purple-950/95 backdrop-blur-md border-t border-purple-800/80 p-3 sm:p-4 shadow-2xl relative z-50" ref={searchRef}>
          <div className="max-w-3xl mx-auto relative flex items-center gap-2">
            <div className="relative flex-1 flex items-center">
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

            <button
              onClick={() => {
                setView({ type: 'advanced-search' });
                setIsSearchOpen(false);
              }}
              className="bg-purple-800 hover:bg-purple-700 text-white text-xs font-bold px-3.5 py-2.5 sm:py-3 rounded-2xl flex items-center gap-1.5 whitespace-nowrap shadow transition active:scale-95"
              title="Gelişmiş Arama Filtrelerini Aç"
            >
              <SlidersHorizontal size={15} />
              <span className="hidden sm:inline">Gelişmiş Arama</span>
            </button>
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

      {/* Mobile Nav Drawer */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-gray-950 border-t border-purple-800/80 px-4 pt-3 pb-5 space-y-1.5 shadow-2xl">
          
          {/* Mobile Profile Card with Library & Shop Sub-Links */}
          <div className="bg-purple-950/80 border border-purple-700/60 rounded-2xl p-2.5 space-y-1 mb-2 shadow-lg">
            <div className="text-[10px] font-black uppercase text-purple-300 tracking-wider px-2 py-1 flex items-center justify-between border-b border-purple-800/60 mb-1">
              <span>👤 Profil & Mağaza Menüm</span>
              <span className="text-amber-400 font-mono font-extrabold">
                {user ? (user.email?.toLowerCase() === 'aseleliyeva77@gmail.com' ? '∞ CP' : `${user.coins ?? 250} CP`) : 'Misafir'}
              </span>
            </div>

            <button
              onClick={() => {
                handleOpenProfile('profile');
                setIsMobileMenuOpen(false);
              }}
              className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-white hover:bg-purple-900/60 flex items-center gap-2"
            >
              <User size={16} className="text-purple-300" /> Profilim & Ayarlar
            </button>

            <button
              onClick={() => {
                setView({ type: 'library' });
                setIsMobileMenuOpen(false);
              }}
              className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-white hover:bg-purple-900/60 flex items-center gap-2"
            >
              <Bookmark size={16} className="text-purple-300 fill-purple-300/30" /> Kütüphanem
            </button>

            <button
              onClick={() => {
                handleOpenProfile('shop');
                setIsMobileMenuOpen(false);
              }}
              className="w-full text-left px-3 py-2 rounded-xl text-xs font-black text-amber-300 bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border border-amber-500/40 flex items-center justify-between"
            >
              <span className="flex items-center gap-2">
                <ShoppingBag size={16} className="text-amber-400" /> Mağaza & Temalar
              </span>
              <span className="text-[10px] bg-amber-500 text-black px-2 py-0.5 rounded font-bold">CP</span>
            </button>

            <button
              onClick={() => {
                handleOpenProfile('badges');
                setIsMobileMenuOpen(false);
              }}
              className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-purple-200 hover:bg-purple-900/60 flex items-center gap-2"
            >
              <Award size={16} className="text-amber-400" /> Başarımlar & İstatistikler
            </button>
          </div>

          {/* Mobile NSFW Toggle */}
          <div className="mb-2">
            <button
              onClick={() => {
                toggleNsfw();
              }}
              className={`w-full text-left p-2.5 rounded-xl text-xs font-black border flex items-center justify-between shadow transition ${
                showNsfw
                  ? 'bg-rose-950/80 border-rose-500/60 text-rose-300'
                  : 'bg-purple-900/40 border-purple-700/40 text-purple-200'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <span>🔞</span>
                <span>18+ Filtresi (Yetişkin İçerikler)</span>
              </span>
              <span className={`text-[10px] px-2 py-0.5 rounded font-black ${
                showNsfw ? 'bg-rose-600 text-white' : 'bg-gray-800 text-gray-400'
              }`}>
                {showNsfw ? 'Açık' : 'Gizli'}
              </span>
            </button>
          </div>

          <button
            onClick={() => { setView({ type: 'home' }); setIsMobileMenuOpen(false); }}
            className="w-full text-left px-3.5 py-2 rounded-xl text-sm font-bold text-purple-100 hover:bg-purple-900/50 flex items-center gap-2"
          >
            <Home size={16} className="text-purple-400" /> Ana Sayfa
          </button>

          <button
            onClick={() => { setView({ type: 'advanced-search' }); setIsMobileMenuOpen(false); }}
            className="w-full text-left px-3.5 py-2 rounded-xl text-sm font-extrabold text-purple-200 hover:bg-purple-900/50 flex items-center gap-2"
          >
            <SlidersHorizontal size={16} className="text-purple-400" /> Gelişmiş Arama Engine
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

          {/* Management Panel - ONLY for Authorized Super Admins */}
          {isAuthorizedAdmin(user?.email) && (
            <button
              onClick={() => { setView({ type: 'management' }); setIsMobileMenuOpen(false); }}
              className="w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-black text-amber-300 bg-amber-950/80 border border-amber-500/40 flex items-center justify-between shadow-lg"
            >
              <span className="flex items-center gap-2">
                <Crown size={17} className="text-amber-400" />
                <span>Yönetim Paneli</span>
              </span>
              <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded font-extrabold">Süper Admin</span>
            </button>
          )}
        </div>
      )}
    </header>
  );
};
