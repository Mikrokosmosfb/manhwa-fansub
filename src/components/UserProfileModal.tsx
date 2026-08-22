import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { ReadingProgress } from '../types';
import { LibraryView } from './LibraryView';
import { ShopContent } from './ShopModal';
import {
  Award,
  BookOpen,
  MessageSquare,
  Bookmark,
  X,
  CheckCircle2,
  Lock,
  ShieldCheck,
  ShieldAlert,
  Star,
  Moon,
  Sprout,
  Trophy,
  Feather,
  Palette,
  MessageCircle,
  LogOut,
  Trash2,
  Edit3,
  User as UserIcon,
  RefreshCw,
  AlertTriangle,
  Save,
  Sparkles,
  Check,
  Upload,
  CloudUpload,
  Coins,
  ShoppingBag,
  Zap,
  Crown,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'profile' | 'badges' | 'shop' | 'library';
}

export interface AchievementBadge {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  category: 'reading' | 'community' | 'collector' | 'special';
  isUnlocked: boolean;
  progressText: string;
}

const PRESET_AVATAR_SEEDS = [
  'Aykut', 'Zeynep', 'Mikro', 'Solo', 'Mage', 'Shadow',
  'Astral', 'Luna', 'Viper', 'Kitsune', 'Phoenix', 'Nova'
];

export const UserProfileModal: React.FC<UserProfileModalProps> = ({ isOpen, onClose, initialTab = 'profile' }) => {
  const {
    user,
    showNsfw,
    toggleNsfw,
    readingHistory,
    comments,
    bookmarks,
    seriesList,
    loginWithGoogle,
    logout,
    updateUserProfile,
    deleteAccount,
    openAuthModal,
    openShop,
    setView
  } = useApp();

  const [activeTab, setActiveTab] = useState<'profile' | 'badges' | 'shop' | 'library'>(initialTab);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  // Edit state
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState('');
  const [avatarStyle, setAvatarStyle] = useState<'bottts' | 'adventurer' | 'lorelei' | 'avataaars'>('bottts');
  const [customAvatarUrl, setCustomAvatarUrl] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isR2Uploading, setIsR2Uploading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);

  const handleR2FileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      setStatusMessage({ type: 'error', text: 'Resim boyutu çok büyük (Maksimum 8MB olmalıdır).' });
      return;
    }

    setIsR2Uploading(true);
    setStatusMessage(null);

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result as string;
        const res = await fetch('/api/upload/r2', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: base64, filename: file.name })
        });
        const data = await res.json();
        setIsR2Uploading(false);

        if (data.success && data.url) {
          setAvatar(data.url);
          setCustomAvatarUrl(data.url);
          setStatusMessage({
            type: 'success',
            text: `🚀 Resminiz başarıyla yüklendi ve profiliniz güncellendi!`
          });
        } else {
          setStatusMessage({ type: 'error', text: data.message || 'Profil resmi yüklemesi başarısız.' });
        }
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      setIsR2Uploading(false);
      setStatusMessage({ type: 'error', text: 'Dosya okunamadı: ' + err.message });
    }
  };

  // Delete modal state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmationInput, setDeleteConfirmationInput] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setAvatar(user.avatar || '');
    }
  }, [user]);

  if (!isOpen) return null;

  // Calculate stats
  let totalReadChaptersCount = 0;
  let novelReadCount = 0;
  let manhwaReadCount = 0;

  (Object.values(readingHistory) as ReadingProgress[]).forEach(item => {
    const count = item.readChapterIds && item.readChapterIds.length > 0
      ? item.readChapterIds.length
      : (item.lastChapterId ? 1 : 0);
    totalReadChaptersCount += count;

    const matchingSeries = seriesList.find(s => s.id === item.seriesId);
    if (matchingSeries) {
      if (matchingSeries.type === 'Web Novel') {
        novelReadCount += count;
      } else {
        manhwaReadCount += count;
      }
    }
  });
  const userCommentsCount = user ? comments.filter(c => c.userId === user.uid).length : 0;
  const bookmarkedSeriesCount = Object.keys(bookmarks).length;

  // Calculate Badges
  const badges: AchievementBadge[] = [
    {
      id: 'b-1',
      title: 'İlk Adım',
      description: 'İlk bölümünü oku ve serüvene başla.',
      icon: <Sprout size={20} className="text-emerald-400" />,
      category: 'reading',
      isUnlocked: totalReadChaptersCount >= 1,
      progressText: `${Math.min(totalReadChaptersCount, 1)} / 1 Bölüm`
    },
    {
      id: 'b-2',
      title: 'Kitap Kurdu',
      description: '10 Bölüm okuma başarısını tamamla.',
      icon: <BookOpen size={20} className="text-purple-400" />,
      category: 'reading',
      isUnlocked: totalReadChaptersCount >= 10,
      progressText: `${Math.min(totalReadChaptersCount, 10)} / 10 Bölüm`
    },
    {
      id: 'b-3',
      title: '100 Bölüm Okuyan',
      description: 'Topluluğun gururu! Tam 100 bölüm oku.',
      icon: <Trophy size={20} className="text-amber-400" />,
      category: 'reading',
      isUnlocked: totalReadChaptersCount >= 100,
      progressText: `${Math.min(totalReadChaptersCount, 100)} / 100 Bölüm`
    },
    {
      id: 'b-4',
      title: 'Gece Kuşu Okuyucu',
      description: 'Gece vakti okuma yap veya aktif ol.',
      icon: <Moon size={20} className="text-indigo-400" />,
      category: 'special',
      isUnlocked: totalReadChaptersCount >= 5,
      progressText: totalReadChaptersCount >= 5 ? 'Tamamlandı' : '5 Bölüm Okunmalı'
    },
    {
      id: 'b-5',
      title: 'Novel Tutkunu',
      description: 'Web Novel serilerinden en az 3 bölüm oku.',
      icon: <Feather size={20} className="text-fuchsia-400" />,
      category: 'reading',
      isUnlocked: novelReadCount >= 3,
      progressText: `${Math.min(novelReadCount, 3)} / 3 Novel Bölümü`
    },
    {
      id: 'b-6',
      title: 'Manhwa Sevdalısı',
      description: 'Çizgi Roman / Webtoon serilerinden en az 5 bölüm oku.',
      icon: <Palette size={20} className="text-cyan-400" />,
      category: 'reading',
      isUnlocked: manhwaReadCount >= 5,
      progressText: `${Math.min(manhwaReadCount, 5)} / 5 Manhwa Bölümü`
    },
    {
      id: 'b-7',
      title: 'Sosyal Eleştirmen',
      description: 'Serilere ve bölümlere yorum yap, düşüncelerini paylaş.',
      icon: <MessageSquare size={20} className="text-purple-400" />,
      category: 'community',
      isUnlocked: userCommentsCount >= 1,
      progressText: `${Math.min(userCommentsCount, 1)} / 1 Yorum`
    },
    {
      id: 'b-8',
      title: 'Yorum Üstadı',
      description: 'Topluluğa en az 5 değerli yorum katkısında bulun.',
      icon: <MessageCircle size={20} className="text-indigo-400" />,
      category: 'community',
      isUnlocked: userCommentsCount >= 5,
      progressText: `${Math.min(userCommentsCount, 5)} / 5 Yorum`
    },
    {
      id: 'b-9',
      title: 'Koleksiyoner',
      description: 'Kütüphanene en az 3 seriyi kaydet.',
      icon: <Bookmark size={20} className="text-amber-400" />,
      category: 'collector',
      isUnlocked: bookmarkedSeriesCount >= 3,
      progressText: `${Math.min(bookmarkedSeriesCount, 3)} / 3 Seri`
    }
  ];

  const unlockedCount = badges.filter(b => b.isUnlocked).length;

  const handleSelectPresetAvatar = (seed: string) => {
    const url = `https://api.dicebear.com/7.x/${avatarStyle}/svg?seed=${encodeURIComponent(seed)}`;
    setAvatar(url);
  };

  const handleRandomizeAvatar = () => {
    const randomSeed = Math.random().toString(36).substring(2, 9);
    const url = `https://api.dicebear.com/7.x/${avatarStyle}/svg?seed=${randomSeed}`;
    setAvatar(url);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setStatusMessage({ type: 'error', text: 'Lütfen geçerli bir kullanıcı adı girin.' });
      return;
    }

    setIsUpdating(true);
    setStatusMessage(null);

    const finalAvatar = customAvatarUrl.trim() || avatar || user?.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(name.trim())}`;

    const res = await updateUserProfile(name.trim(), finalAvatar);

    setIsUpdating(false);
    if (res.success) {
      setStatusMessage({ type: 'success', text: res.message || 'Profil bilgileriniz başarıyla güncellendi!' });
    } else {
      setStatusMessage({ type: 'error', text: res.message || 'Kullanıcı adı güncellenemedi.' });
    }
  };

  const handleDeleteAccountConfirm = async () => {
    if (deleteConfirmationInput.trim().toUpperCase() !== 'SİL') {
      alert('Lütfen onaylamak için büyük harflerle "SİL" yazın.');
      return;
    }

    setIsDeleting(true);
    const res = await deleteAccount();
    setIsDeleting(false);

    if (res.success) {
      alert(res.message || 'Hesabınız başarıyla silindi.');
      setShowDeleteConfirm(false);
      onClose();
    } else {
      alert(res.message || 'Hesap silinirken bir hata oluştu.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-6 animate-fadeIn space-y-6">
      
      {/* Top Profile Header Banner */}
      <div className="relative p-6 sm:p-8 bg-gradient-to-r from-purple-950/90 via-gray-900 to-indigo-950/90 border border-purple-800/40 rounded-3xl shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="relative group shrink-0">
            <img
              src={avatar || user?.avatar || 'https://api.dicebear.com/7.x/bottts/svg?seed=Guest'}
              alt={user?.name || 'Kullanıcı'}
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 border-purple-400 shadow-xl bg-gray-900"
            />
            <span className="absolute -bottom-1.5 -right-1.5 bg-gradient-to-r from-amber-500 to-yellow-400 text-black text-[10px] font-black px-2 py-0.5 rounded-lg flex items-center gap-0.5 shadow-md border border-amber-300">
              <Star size={10} className="fill-current" />
              LVL {Math.floor(totalReadChaptersCount / 5) + 1}
            </span>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg sm:text-2xl font-black text-white flex items-center gap-1.5">
                {user ? user.name : 'Misafir Okuyucu'}
              </h2>
              {user && <ShieldCheck size={20} className="text-emerald-400 shrink-0" />}
            </div>

            <p className="text-xs sm:text-sm text-purple-300/90 font-medium">
              {user ? user.email : 'Giriş yaparak tüm cihazlarınızda okumaya devam edin.'}
            </p>

            {user && (
              <div className="flex items-center gap-2 pt-1 flex-wrap">
                <span className="bg-purple-900/60 border border-purple-700/50 text-purple-200 text-[10px] sm:text-xs font-bold px-2.5 py-0.5 rounded-lg flex items-center gap-1">
                  <UserIcon size={12} className="text-amber-400" />
                  {user.provider === 'google' ? 'Google' : 'E-posta'}
                </span>

                <button
                  type="button"
                  onClick={() => {
                    openShop();
                    onClose();
                  }}
                  className="bg-amber-950/80 hover:bg-amber-900/90 border border-amber-500/50 text-amber-300 hover:text-white text-[10px] sm:text-xs font-black px-3 py-0.5 rounded-lg flex items-center gap-1 cursor-pointer transition shadow"
                  title="Mağazayı Aç & Bakiye Yükle"
                >
                  <Coins size={12} className="text-amber-400" />
                  <span>{user.email?.toLowerCase() === 'aseleliyeva77@gmail.com' ? 'Sınırsız CP' : `${user.coins ?? 250} Cosmo-Puan`}</span>
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          {/* Quick Access Buttons */}
          <button
            onClick={() => {
              setView({ type: 'library' });
            }}
            className="px-3.5 py-2 bg-purple-900/60 hover:bg-purple-800/80 border border-purple-500/40 text-purple-200 text-xs font-bold rounded-xl flex items-center gap-1.5 transition"
            title="Kütüphanem Sayfası"
          >
            <Bookmark size={14} className="text-purple-300" />
            <span>Kütüphanem</span>
          </button>

          <button
            onClick={() => {
              setView({ type: 'shop' });
            }}
            className="px-3.5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-extrabold text-xs rounded-xl flex items-center gap-1.5 transition shadow-md shrink-0 active:scale-95"
            title="Mağaza Sayfasına Git"
          >
            <ShoppingBag size={14} className="text-black" />
            <span>Mağaza</span>
          </button>

          <button
            onClick={onClose}
            className="px-3.5 py-2 rounded-xl bg-gray-900/80 hover:bg-gray-800 text-gray-300 hover:text-white transition border border-gray-800 text-xs font-bold flex items-center gap-1.5"
            title="Ana Sayfaya Dön"
          >
            <X size={15} />
            <span>Ana Sayfa</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs Bar */}
      <div className="flex bg-gray-900/90 border border-purple-500/20 p-1.5 rounded-2xl gap-2 overflow-x-auto no-scrollbar shadow-lg">
        <button
          onClick={() => setActiveTab('profile')}
          className={`px-5 py-2.5 text-xs font-extrabold rounded-xl transition flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'profile'
              ? 'bg-purple-600 text-white shadow-md'
              : 'text-gray-400 hover:text-gray-200 hover:bg-purple-950/40'
          }`}
        >
          <UserIcon size={14} /> Profil & Düzenle
        </button>
        <button
          onClick={() => setActiveTab('badges')}
          className={`px-5 py-2.5 text-xs font-extrabold rounded-xl transition flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'badges'
              ? 'bg-purple-600 text-white shadow-md'
              : 'text-gray-400 hover:text-gray-200 hover:bg-purple-950/40'
          }`}
        >
          <Award size={14} className="text-amber-400" /> Başarımlar & İstatistikler ({unlockedCount}/{badges.length})
        </button>
        <button
          onClick={() => setActiveTab('shop')}
          className={`px-5 py-2.5 text-xs font-extrabold rounded-xl transition flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'shop'
              ? 'bg-amber-600 text-black font-extrabold shadow-md'
              : 'text-gray-400 hover:text-gray-200 hover:bg-purple-950/40'
          }`}
        >
          <ShoppingBag size={14} className="text-amber-400" /> Mağaza & Temalar
        </button>
        <button
          onClick={() => setActiveTab('library')}
          className={`px-5 py-2.5 text-xs font-extrabold rounded-xl transition flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'library'
              ? 'bg-purple-600 text-white shadow-md'
              : 'text-gray-400 hover:text-gray-200 hover:bg-purple-950/40'
          }`}
        >
          <Bookmark size={14} className="text-purple-300" /> Kütüphanem
        </button>
      </div>

      {/* Main Content Body */}
      <div className="bg-gray-900/80 border border-purple-500/20 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">

          {/* TAB 1: PROFILE & EDIT & ACCOUNT ACTIONS */}
          {activeTab === 'profile' && (
            <div className="space-y-5">

              {/* Unauthenticated Prompt Banner */}
              {!user ? (
                <div className="bg-gradient-to-r from-amber-950/60 via-purple-950 to-gray-900 border border-amber-500/30 rounded-2xl p-5 text-center space-y-3 shadow-lg">
                  <div className="w-12 h-12 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto border border-amber-500/40">
                    <Lock size={24} />
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-sm">Giriş Yapılmadı</h3>
                    <p className="text-xs text-gray-300 mt-1 max-w-md mx-auto">
                      Profilinizi özelleştirmek, benzersiz kullanıcı adı almak, yorum yapmak ve okuma geçmişinizi senkronize etmek için hemen giriş yapın.
                    </p>
                  </div>
                  <div className="flex items-center justify-center gap-3 pt-2">
                    <button
                      onClick={() => {
                        onClose();
                        openAuthModal('login');
                      }}
                      className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-lg transition"
                    >
                      Giriş Yap / Üye Ol
                    </button>
                    <button
                      onClick={loginWithGoogle}
                      className="bg-white hover:bg-gray-100 text-gray-900 font-extrabold text-xs px-4 py-2.5 rounded-xl shadow transition flex items-center gap-2"
                    >
                      Google ile Giriş Yap
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {/* EDIT PROFILE FORM (COLLAPSIBLE) */}
                  <div className="bg-gray-900/80 border border-purple-500/20 rounded-2xl shadow-lg overflow-hidden transition-all">
                    <button
                      type="button"
                      onClick={() => setIsEditProfileOpen(!isEditProfileOpen)}
                      className="w-full p-4 sm:p-5 flex items-center justify-between text-left hover:bg-purple-900/20 transition cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5">
                        <Sparkles size={16} className="text-amber-400" />
                        <h3 className="text-sm font-extrabold text-white">
                          Profil Bilgilerini Düzenle
                        </h3>
                        <span className="text-[11px] text-purple-300/80 hidden sm:inline">
                          (Kullanıcı adı & avatar değiştirme)
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300 bg-purple-950/80 px-2.5 py-1 rounded-lg border border-purple-700/50">
                        <span>{isEditProfileOpen ? 'Kapat' : 'Düzenle'}</span>
                        {isEditProfileOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </div>
                    </button>

                    {isEditProfileOpen && (
                      <form onSubmit={handleSaveProfile} className="p-4 sm:p-5 pt-2 border-t border-purple-900/40 space-y-5 animate-fadeIn">
                        {statusMessage && (
                          <div className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                            statusMessage.type === 'success'
                              ? 'bg-emerald-950/80 border border-emerald-500/40 text-emerald-300'
                              : 'bg-red-950/80 border border-red-500/40 text-red-300'
                          }`}>
                            {statusMessage.type === 'success' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
                            <span>{statusMessage.text}</span>
                          </div>
                        )}

                        {/* USERNAME INPUT & SAVE */}
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-purple-200 block">
                            Kullanıcı Adı
                          </label>
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={name}
                              onChange={(e) => setName(e.target.value)}
                              placeholder="Kullanıcı adınızı yazın..."
                              required
                              className="flex-1 bg-gray-950 border border-purple-800/60 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-purple-400 transition"
                            />
                            <button
                              type="submit"
                              disabled={isUpdating}
                              className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-extrabold text-xs px-4 py-2 sm:py-2.5 rounded-xl shadow-md transition flex items-center gap-1.5 shrink-0 disabled:opacity-50"
                            >
                              {isUpdating ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
                              <span>{isUpdating ? '...' : 'Kaydet'}</span>
                            </button>
                          </div>
                          <p className="text-[10px] text-gray-400">
                            * Benzersiz kullanıcı adınız yorumlarınızda ve topluluk alanında görünür.
                          </p>
                        </div>

                        {/* AVATAR SELECTION SECTION */}
                        <div className="pt-2 border-t border-purple-900/40 space-y-3">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-bold text-purple-200 block">
                              Profil Resmi (Avatar)
                            </label>
                            <div className="flex items-center gap-1">
                              {(['bottts', 'adventurer', 'lorelei', 'avataaars'] as const).map((style) => (
                                <button
                                  key={style}
                                  type="button"
                                  onClick={() => setAvatarStyle(style)}
                                  className={`text-[10px] px-2 py-0.5 rounded-lg border font-bold capitalize transition ${
                                    avatarStyle === style
                                      ? 'bg-purple-700 border-purple-400 text-white'
                                      : 'bg-gray-950 border-gray-800 text-gray-400 hover:text-gray-200'
                                  }`}
                                >
                                  {style}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Avatar Presets Grid */}
                          <div className="grid grid-cols-6 gap-2 bg-gray-950 p-2.5 rounded-xl border border-purple-900/30">
                            {PRESET_AVATAR_SEEDS.map((seed) => {
                              const presetUrl = `https://api.dicebear.com/7.x/${avatarStyle}/svg?seed=${encodeURIComponent(seed)}`;
                              const isSelected = avatar === presetUrl;
                              return (
                                <button
                                  key={seed}
                                  type="button"
                                  onClick={() => handleSelectPresetAvatar(seed)}
                                  className={`p-1 rounded-xl border transition relative flex items-center justify-center bg-gray-900 hover:bg-purple-900/30 ${
                                    isSelected ? 'border-amber-400 ring-2 ring-amber-400/50 bg-purple-950' : 'border-gray-800'
                                  }`}
                                  title={`Preset: ${seed}`}
                                >
                                  <img src={presetUrl} alt={seed} className="w-8 h-8 rounded-lg object-cover" />
                                  {isSelected && (
                                    <span className="absolute -top-1 -right-1 bg-amber-500 text-black rounded-full p-0.5">
                                      <Check size={9} />
                                    </span>
                                  )}
                                </button>
                              );
                            })}
                          </div>

                          {/* FILE UPLOADER & RANDOM */}
                          <div className="flex items-center justify-between gap-2 bg-gray-950 p-3 rounded-xl border border-purple-900/30">
                            <div className="space-y-0.5">
                              <span className="text-xs font-bold text-white block">Cihazından Resim Yükle</span>
                              <span className="text-[10px] text-gray-400 block">Maksimum 8MB (JPG / PNG / WEBP)</span>
                            </div>

                            <div className="flex items-center gap-2">
                              <label className="bg-purple-900/70 hover:bg-purple-800 border border-purple-500/40 text-white font-bold text-xs px-3.5 py-1.5 rounded-xl cursor-pointer transition flex items-center gap-1.5 shadow">
                                {isR2Uploading ? (
                                  <RefreshCw size={13} className="animate-spin text-amber-400" />
                                ) : (
                                  <Upload size={13} className="text-amber-400" />
                                )}
                                <span>{isR2Uploading ? 'Yükleniyor...' : 'Fotoğraf Seç'}</span>
                                <input
                                  type="file"
                                  accept="image/png, image/jpeg, image/webp"
                                  onChange={handleR2FileUpload}
                                  disabled={isR2Uploading}
                                  className="hidden"
                                />
                              </label>

                              <button
                                type="button"
                                onClick={handleRandomizeAvatar}
                                className="bg-gray-900 hover:bg-gray-800 border border-gray-700 text-purple-200 text-xs font-bold p-1.5 rounded-xl transition"
                                title="Rastgele Hazır Avatar"
                              >
                                <RefreshCw size={14} />
                              </button>
                            </div>
                          </div>
                        </div>
                      </form>
                    )}
                  </div>

                  {/* PREFERENCES & CONTENT FILTERS */}
                  <div className="bg-gray-900/80 border border-purple-500/20 p-4 rounded-2xl space-y-3">
                    <h3 className="text-xs font-extrabold text-purple-200 uppercase tracking-wider block">
                      Arayüz & İçerik Tercihleri
                    </h3>

                    <div className="flex items-center justify-between p-3 bg-gray-950 rounded-xl border border-purple-900/30 gap-3">
                      <div className="space-y-0.5">
                        <span className="text-xs font-bold text-white flex items-center gap-1.5">
                          <span>🔞</span>
                          <span>+18 / NSFW İçerik Filtresi</span>
                        </span>
                        <p className="text-[10px] text-gray-400">
                          {showNsfw ? '+18 seriler arama ve listelerde açık.' : '+18 seriler varsayılan gizli.'}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => toggleNsfw()}
                        className={`px-3 py-1.5 rounded-xl text-xs font-black border transition shadow ${
                          showNsfw
                            ? 'bg-rose-950 border-rose-500/80 text-rose-300'
                            : 'bg-gray-900 border-gray-700 text-gray-400'
                        }`}
                      >
                        {showNsfw ? '18+ Açık' : '18+ Gizli'}
                      </button>
                    </div>
                  </div>

                  {/* ACCOUNT MANAGEMENT & ACTIONS */}
                  <div className="bg-gray-900/80 border border-purple-500/20 p-4 rounded-2xl space-y-3">
                    <h3 className="text-xs font-extrabold text-purple-200 uppercase tracking-wider block">
                      Hesap & Oturum
                    </h3>

                    <div className="flex items-center justify-between p-3 bg-gray-950 rounded-xl border border-purple-900/30 gap-3 flex-wrap">
                      <div>
                        <span className="text-[10px] text-gray-400 block">Kayıtlı E-posta</span>
                        <span className="text-xs text-white font-mono">{user.email}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            logout();
                            onClose();
                          }}
                          className="bg-purple-950 hover:bg-purple-900 border border-purple-600/50 text-purple-200 hover:text-white text-xs font-bold px-3.5 py-1.5 rounded-xl transition flex items-center gap-1.5 shadow"
                        >
                          <LogOut size={13} />
                          <span>Çıkış Yap</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setShowDeleteConfirm(true)}
                          className="bg-red-950/60 hover:bg-red-900/80 border border-red-700/50 text-red-300 text-xs font-bold px-3 py-1.5 rounded-xl transition flex items-center gap-1"
                          title="Hesabı Sil"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* TAB 2: BADGES & STATS */}
          {activeTab === 'badges' && (
            <div className="space-y-6">
              {/* Quick Stats Grid */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-gray-900/90 border border-purple-500/20 p-3 sm:p-4 rounded-2xl text-center">
                  <span className="text-[10px] sm:text-xs text-purple-300 uppercase font-bold block">Okunan Bölüm</span>
                  <span className="text-xl sm:text-2xl font-black text-white mt-1 block">{totalReadChaptersCount}</span>
                </div>
                <div className="bg-gray-900/90 border border-purple-500/20 p-3 sm:p-4 rounded-2xl text-center">
                  <span className="text-[10px] sm:text-xs text-purple-300 uppercase font-bold block">Yorumlarım</span>
                  <span className="text-xl sm:text-2xl font-black text-white mt-1 block">{userCommentsCount}</span>
                </div>
                <div className="bg-gray-900/90 border border-purple-500/20 p-3 sm:p-4 rounded-2xl text-center">
                  <span className="text-[10px] sm:text-xs text-purple-300 uppercase font-bold block">Kütüphanem</span>
                  <span className="text-xl sm:text-2xl font-black text-white mt-1 block">{bookmarkedSeriesCount}</span>
                </div>
              </div>

              {/* Badges List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                    <Award size={18} className="text-amber-400" /> Okuma Başarımları & Üye Rozetleri
                  </h3>
                  <span className="text-xs text-purple-300 font-semibold">
                    %{Math.round((unlockedCount / badges.length) * 100)} Tamamlandı
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {badges.map(b => (
                    <div
                      key={b.id}
                      className={`p-3.5 rounded-2xl border transition flex items-start gap-3 ${
                        b.isUnlocked
                          ? 'bg-purple-950/60 border-purple-500/40 shadow-lg'
                          : 'bg-gray-950/60 border-gray-800 opacity-60'
                      }`}
                    >
                      <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-xl flex-shrink-0 shadow-inner ${
                        b.isUnlocked ? 'bg-purple-900/80 border border-purple-400/30' : 'bg-gray-900 border border-gray-800'
                      }`}>
                        {b.icon}
                      </div>

                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center justify-between gap-1">
                          <h4 className={`text-xs font-bold truncate ${b.isUnlocked ? 'text-purple-200' : 'text-gray-400'}`}>
                            {b.title}
                          </h4>
                          {b.isUnlocked ? (
                            <span className="text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800/60 font-extrabold px-1.5 py-0.5 rounded flex items-center gap-0.5">
                              <CheckCircle2 size={10} /> Kazanıldı
                            </span>
                          ) : (
                            <span className="text-[10px] text-gray-500 flex items-center gap-0.5 font-medium">
                              <Lock size={10} /> Kilitli
                            </span>
                          )}
                        </div>

                        <p className="text-[11px] text-gray-400 leading-tight">
                          {b.description}
                        </p>

                        <div className="pt-1">
                          <span className="text-[9px] font-bold text-amber-400/90 block">
                            İlerleme: {b.progressText}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: SHOP & THEMES */}
          {activeTab === 'shop' && (
            <div className="pt-1">
              <ShopContent />
            </div>
          )}

          {/* TAB 4: LIBRARY */}
          {activeTab === 'library' && (
            <div className="pt-1">
              <LibraryView onCloseModal={onClose} />
            </div>
          )}

        </div>

      {/* DELETE ACCOUNT CONFIRMATION DIALOG */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fadeIn">
          <div className="bg-gray-950 border border-red-600/60 w-full max-w-md rounded-3xl p-6 space-y-5 shadow-2xl">
            <div className="flex items-center gap-3 text-red-400 border-b border-red-900/40 pb-3">
              <div className="p-2 bg-red-950 rounded-2xl border border-red-600/40">
                <AlertTriangle size={24} />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-white">Hesabı Kalıcı Olarak Sil?</h3>
                <p className="text-xs text-red-300">Bu işlem kesinlikle geri alınamaz!</p>
              </div>
            </div>

            <div className="space-y-2.5 text-xs text-gray-300 leading-relaxed">
              <p>
                <strong className="text-white">DİKKAT:</strong> Hesabınızı sildiğiniz takdirde Mikrokosmos Fansubda bulunan tüm profil kayıtlarınız ve e-posta bilgileriniz kalıcı olarak silinecektir.
              </p>
              <p className="text-gray-400 italic">
                (Sitede yapmış olduğunuz yorumlar ise silinmeyecek, kalacaktır.)
              </p>
              <p className="pt-1 text-purple-200 font-medium">
                Onaylamak için lütfen aşağıdaki kutuya büyük harflerle <strong className="text-red-400 bg-black px-1.5 py-0.5 rounded border border-red-800">SİL</strong> yazın:
              </p>
            </div>

            <input
              type="text"
              value={deleteConfirmationInput}
              onChange={(e) => setDeleteConfirmationInput(e.target.value)}
              placeholder='Lütfen SİL yazın...'
              className="w-full bg-gray-900 border border-red-800/80 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-red-400 font-mono tracking-wider"
            />

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeleteConfirmationInput('');
                }}
                className="bg-gray-900 hover:bg-gray-800 text-gray-300 font-bold text-xs px-4 py-2.5 rounded-xl transition border border-gray-800"
              >
                Vazgeç
              </button>

              <button
                type="button"
                disabled={isDeleting || deleteConfirmationInput.trim().toUpperCase() !== 'SİL'}
                onClick={handleDeleteAccountConfirm}
                className="bg-red-600 hover:bg-red-500 disabled:opacity-40 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl shadow-lg transition flex items-center gap-1.5"
              >
                {isDeleting ? <RefreshCw size={14} className="animate-spin" /> : <Trash2 size={14} />}
                {isDeleting ? 'Siliniyor...' : 'Evet, Hesabımı Kalıcı Sil'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
