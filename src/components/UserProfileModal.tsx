import React
, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { ReadingProgress, isAuthorizedAdmin, DAILY_STARTER_REWARDS } from '../types';
import { ProfileReadingLists } from './ProfileReadingLists';
import { ThemeBackgroundEffects } from './ThemeBackgroundEffects';
import { SeriesCard } from './SeriesCard';
import { THEME_STYLES, ThemeStyle } from '../data/shopData';
import { DailyRewardModal } from './DailyRewardModal';
import { UserAvatar } from './UserAvatar';
import {

  Award,
  BookOpen,
  MessageSquare,
  Bookmark,
  X,
  Lock,
  ShieldCheck,
  Star,
  Moon,
  Sprout,
  Trophy,
  Feather,
  Palette,
  MessageCircle,
  LogOut,
  Trash2,
  User as UserIcon,
  RefreshCw,
  Sparkles,
  Check,
  Upload,
  Coins,
  ShoppingBag,
  Zap,
  Crown,
  Flame,
  Shield,
  Eye,
  EyeOff,
  Quote,
  Settings,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Heart,
  CalendarDays,
  Gift,
  HelpCircle,
  Info
} from 'lucide-react';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'profile' | 'wardrobe' | 'badges' | 'library';
}

export interface AchievementBadge {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  category: 'reading' | 'community' | 'collector' | 'special';
  isUnlocked: boolean;
  progressText: string;
  rewardCoins: number;
}

const PRESET_AVATAR_SEEDS = [
  'Aykut', 'Zeynep', 'Mikro', 'Solo', 'Mage', 'Shadow',
  'Astral', 'Luna', 'Viper', 'Kitsune', 'Phoenix', 'Nova'
];


const formatDim = (v?: string | number | null) => { if (!v && v !== 0) return undefined; const trim = String(v).trim(); return (trim && !isNaN(Number(trim))) ? `${trim}px` : trim; };
export const UserProfileModal: React.FC<UserProfileModalProps> = ({ isOpen, onClose, initialTab = 'profile' }) => {

  const {
    user,
    showNsfw,
    toggleNsfw,
    readingHistory,
    comments,
    bookmarks,
    logout,
    updateUserProfile,
    deleteAccount,
    openAuthModal,
    openShop,
    themeStyles,
    shopItems,
    equipTheme,
    equipBadge,
    equipFrame,
    setView,
    earnPoints,
    followedSeriesIds,
    seriesList
  } = useApp();

  const bookmarkedSeriesIds = Object.keys(bookmarks || {});
  const followedSeries = seriesList ? seriesList.filter(s => 
    followedSeriesIds.some(id => String(id) === String(s.id)) || bookmarkedSeriesIds.includes(String(s.id))
  ) : [];

  const [activeTab, setActiveTab] = useState<'profile' | 'wardrobe' | 'badges' | 'library' | 'followed'>(initialTab);

  const handleTabChange = (tab: 'profile' | 'wardrobe' | 'badges' | 'library' | 'followed') => {
    setActiveTab(tab);
  };

  useEffect(() => {
    if (isOpen && initialTab) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  // Edit profile state
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState('');
  const [avatarStyle, setAvatarStyle] = useState<'bottts' | 'adventurer' | 'lorelei' | 'avataaars'>('bottts');
  const [customAvatarUrl, setCustomAvatarUrl] = useState('');
  const [bioQuote, setBioQuote] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isR2Uploading, setIsR2Uploading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [claimedRewards, setClaimedRewards] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(`mk_claimed_rewards_${user?.uid}`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Delete modal state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmationInput, setDeleteConfirmationInput] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  // Collapsible Accordion Sections State
  const [openEditProfile, setOpenEditProfile] = useState(true);
  const [openAccountSettings, setOpenAccountSettings] = useState(true);
  const [openVipBadges, setOpenVipBadges] = useState(true);
  const [openCardThemes, setOpenCardThemes] = useState(true);
  const [openProfileFrames, setOpenProfileFrames] = useState(true);
  const [showLevelInfoModal, setShowLevelInfoModal] = useState(false);
  const [showDailyModal, setShowDailyModal] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setAvatar(user.avatar || '');
      try {
        const savedBio = localStorage.getItem(`mk_bio_${user.uid}`);
        if (savedBio) setBioQuote(savedBio);
      } catch {}
    }
  }, [user]);

  if (!isOpen) return null;

  if (!user) {
    return (
      <div className="max-w-md mx-auto px-4 py-8 animate-fadeIn">
        <div className="relative overflow-hidden bg-slate-900/95 border border-purple-500/20 rounded-[32px] p-6 sm:p-8 shadow-2xl text-center space-y-6">
          <div className="w-20 h-20 mx-auto rounded-full bg-purple-950/80 border border-purple-500/30 flex items-center justify-center text-purple-300">
            <UserIcon size={36} />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl sm:text-2xl font-bold text-white">Profil Alanına Giriş Yapın</h2>
            <p className="text-xs sm:text-sm text-gray-400 max-w-md mx-auto">
              Kozmetik temalar, okuma başarımları, kütüphane takibi ve Cosmo-Puan mağazası için hesabınıza giriş yapın.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={() => openAuthModal('login')}
              className="w-full sm:w-auto px-6 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-sm transition"
            >
              Giriş Yap
            </button>
            <button
              onClick={() => openAuthModal('register')}
              className="w-full sm:w-auto px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-gray-200 font-bold rounded-xl text-sm transition"
            >
              Kayıt Ol
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Calculate statistics
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

  // Gamification Level calculations (Every 50 chapters = 1 level, max Level 50)
  const CHAPTERS_PER_LEVEL = 50;
  const userLevel = Math.min(50, Math.floor(totalReadChaptersCount / CHAPTERS_PER_LEVEL) + 1);
  const chaptersInCurrentLevel = totalReadChaptersCount % CHAPTERS_PER_LEVEL;
  const xpProgressPercent = (chaptersInCurrentLevel / CHAPTERS_PER_LEVEL) * 100;
  const chaptersRemainingForNextLevel = CHAPTERS_PER_LEVEL - chaptersInCurrentLevel;

  const getLevelTitle = (lvl: number) => {
    if (lvl >= 50) return 'Kozmik Hükümdar';
    if (lvl >= 40) return 'Efsanevi Yüce Okur';
    if (lvl >= 30) return 'S-Rank Efsane';
    if (lvl >= 20) return 'Kadim Büyücü';
    if (lvl >= 10) return 'Usta Okuyucu';
    if (lvl >= 5) return 'Kıdemli Okur';
    if (lvl >= 2) return 'Hevesli Okur';
    return 'Çaylak Okuyucu';
  };

  // Active Theme resolution
  const activeThemeId = user.equippedTheme || null;
  const activeThemeStyle: ThemeStyle | null = activeThemeId
    ? (themeStyles?.[activeThemeId] || THEME_STYLES[activeThemeId] || null)
    : null;

  // Active Equipped Badges resolution (Support up to 5 active badges)
  const activeBadges: string[] = user.equippedBadges && user.equippedBadges.length > 0
    ? user.equippedBadges
    : (user.equippedBadge ? [user.equippedBadge] : []);

  // User purchased themes and badges inventory
  const userInventory = user.inventory || [];
  const ownedThemeItems = shopItems.filter(
    item => item.category === 'theme' && userInventory.includes(item.id)
  );
  const ownedFrameItems = shopItems.filter(
    item => item.category === 'frame' && userInventory.includes(item.id)
  );

  // Badges list with balanced rewards (2 - 15 CP)
  const badges: AchievementBadge[] = [
    {
      id: 'b-1',
      title: 'İlk Adım',
      description: 'İlk bölümünü oku ve serüvene başla.',
      icon: <Sprout size={20} className="text-emerald-400" />,
      category: 'reading',
      isUnlocked: totalReadChaptersCount >= 1,
      progressText: `${Math.min(totalReadChaptersCount, 1)} / 1 Bölüm`,
      rewardCoins: 3
    },
    {
      id: 'b-2',
      title: 'Kitap Kurdu',
      description: '10 Bölüm okuma başarısını tamamla.',
      icon: <BookOpen size={20} className="text-purple-400" />,
      category: 'reading',
      isUnlocked: totalReadChaptersCount >= 10,
      progressText: `${Math.min(totalReadChaptersCount, 10)} / 10 Bölüm`,
      rewardCoins: 5
    },
    {
      id: 'b-3',
      title: '50 Bölüm Muhafızı',
      description: '50 bölüm okuyarak derin bir okuyucu olduğunu kanıtla.',
      icon: <Flame size={20} className="text-orange-400" />,
      category: 'reading',
      isUnlocked: totalReadChaptersCount >= 50,
      progressText: `${Math.min(totalReadChaptersCount, 50)} / 50 Bölüm`,
      rewardCoins: 10
    },
    {
      id: 'b-4',
      title: '100 Bölüm Efsanesi',
      description: 'Topluluğun gururu! Tam 100 bölüm oku.',
      icon: <Trophy size={20} className="text-amber-400" />,
      category: 'reading',
      isUnlocked: totalReadChaptersCount >= 100,
      progressText: `${Math.min(totalReadChaptersCount, 100)} / 100 Bölüm`,
      rewardCoins: 15
    },
    {
      id: 'b-5',
      title: 'Gece Kuşu Okuyucu',
      description: 'Gece vakti okuma serüvenine katıl.',
      icon: <Moon size={20} className="text-indigo-400" />,
      category: 'special',
      isUnlocked: totalReadChaptersCount >= 5,
      progressText: totalReadChaptersCount >= 5 ? 'Tamamlandı' : '5 Bölüm Okunmalı',
      rewardCoins: 4
    },
    {
      id: 'b-6',
      title: 'Web Novel Tutkunu',
      description: 'Web Novel serilerinden en az 5 bölüm oku.',
      icon: <Feather size={20} className="text-fuchsia-400" />,
      category: 'reading',
      isUnlocked: novelReadCount >= 5,
      progressText: `${Math.min(novelReadCount, 5)} / 5 Novel Bölümü`,
      rewardCoins: 5
    },
    {
      id: 'b-7',
      title: 'Manhwa Sevdalısı',
      description: 'Çizgi Roman serilerinden en az 10 bölüm oku.',
      icon: <Palette size={20} className="text-cyan-400" />,
      category: 'reading',
      isUnlocked: manhwaReadCount >= 10,
      progressText: `${Math.min(manhwaReadCount, 10)} / 10 Manhwa Bölümü`,
      rewardCoins: 5
    },
    {
      id: 'b-8',
      title: 'Sosyal Eleştirmen',
      description: 'Serilere ve bölümlere düşüncelerini yaz.',
      icon: <MessageSquare size={20} className="text-purple-400" />,
      category: 'community',
      isUnlocked: userCommentsCount >= 1,
      progressText: `${Math.min(userCommentsCount, 1)} / 1 Yorum`,
      rewardCoins: 2
    },
    {
      id: 'b-9',
      title: 'Yorum Üstadı',
      description: 'Topluluğa en az 5 değerli yorum katkısında bulun.',
      icon: <MessageCircle size={20} className="text-indigo-400" />,
      category: 'community',
      isUnlocked: userCommentsCount >= 5,
      progressText: `${Math.min(userCommentsCount, 5)} / 5 Yorum`,
      rewardCoins: 5
    },
    {
      id: 'b-10',
      title: 'Büyük Koleksiyoner',
      description: 'Kütüphanene en az 5 seriyi kaydet.',
      icon: <Bookmark size={20} className="text-amber-400" />,
      category: 'collector',
      isUnlocked: bookmarkedSeriesCount >= 5,
      progressText: `${Math.min(bookmarkedSeriesCount, 5)} / 5 Seri`,
      rewardCoins: 5
    }
  ];

  const unlockedCount = badges.filter(b => b.isUnlocked).length;

  const ownedBadgeItems = shopItems.filter(
    item => item.category === 'badge' && userInventory.includes(item.id)
  );

  const handleClaimReward = (badge: AchievementBadge) => {
    if (!badge.isUnlocked || claimedRewards.includes(badge.id)) return;
    const newClaimed = [...claimedRewards, badge.id];
    setClaimedRewards(newClaimed);
    try {
      localStorage.setItem(`mk_claimed_rewards_${user?.uid}`, JSON.stringify(newClaimed));
      earnPoints(badge.rewardCoins, `Başarım: ${badge.title}`);
      setStatusMessage({
        type: 'success',
        text: `Tebrikler! "${badge.title}" başarımı için +${badge.rewardCoins} Cosmo-Puan kazandınız!`
      });
    } catch {}
  };

  const handleSelectPresetAvatar = (seed: string) => {
    const url = `https://api.dicebear.com/7.x/${avatarStyle}/svg?seed=${encodeURIComponent(seed)}`;
    setAvatar(url);
    setCustomAvatarUrl('');
  };

  const handleRandomizeAvatar = () => {
    const randomSeed = Math.random().toString(36).substring(2, 9);
    const url = `https://api.dicebear.com/7.x/${avatarStyle}/svg?seed=${randomSeed}`;
    setAvatar(url);
    setCustomAvatarUrl('');
  };

  const compressAvatarFile = (file: File, maxDim = 128): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const minSide = Math.min(img.width, img.height);
          const sx = (img.width - minSide) / 2;
          const sy = (img.height - minSide) / 2;
          
          const targetDim = Math.min(maxDim, minSide);
          canvas.width = targetDim;
          canvas.height = targetDim;
          
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(ev.target?.result as string);
            return;
          }
          
          // Draw center-cropped square avatar for optimal dimensions & crisp quality
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, targetDim, targetDim);
          
          const webpData = canvas.toDataURL('image/webp', 0.75);
          if (webpData.startsWith('data:image/webp')) {
            resolve(webpData);
          } else {
            resolve(canvas.toDataURL('image/jpeg', 0.75));
          }
        };
        img.onerror = () => resolve(ev.target?.result as string);
        img.src = ev.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleR2FileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      setStatusMessage({ type: 'error', text: 'Resim boyutu 15MB altında olmalıdır.' });
      return;
    }

    setIsR2Uploading(true);
    setStatusMessage(null);

    try {
      // Auto-compress avatar to lightweight 128x128 WebP (~3-8 KB)
      const base64 = await compressAvatarFile(file, 128);
      const cleanName = file.name.replace(/\.[^/.]+$/, "") + '.webp';

      const res = await fetch('/api/upload/r2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64, filename: cleanName })
      });
      const data = await res.json();
      setIsR2Uploading(false);

      if (data.success && data.url) {
        setAvatar(data.url);
        setCustomAvatarUrl(data.url);
        setStatusMessage({
          type: 'success',
          text: `Resim başarıyla optimize edildi (~5 KB WebP) ve yüklendi! "Kaydet" butonuna basarak onaylayın.`
        });
      } else {
        setStatusMessage({ type: 'error', text: data.message || 'Resim yüklenemedi.' });
      }
    } catch (err: any) {
      setIsR2Uploading(false);
      setStatusMessage({ type: 'error', text: 'Hata: ' + err.message });
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setStatusMessage({ type: 'error', text: 'Kullanıcı adı boş bırakılamaz.' });
      return;
    }

    setIsUpdating(true);
    setStatusMessage(null);

    try {
      localStorage.setItem(`mk_bio_${user.uid}`, bioQuote.trim());
    } catch {}

    const finalAvatar = customAvatarUrl.trim() || avatar || user?.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(name.trim())}`;
    const res = await updateUserProfile(name.trim(), finalAvatar, bioQuote.trim());
    setIsUpdating(false);

    if (res.success) {
      setStatusMessage({ type: 'success', text: 'Profiliniz başarıyla güncellendi!' });
    } else {
      setStatusMessage({ type: 'error', text: res.message || 'Güncellenemedi.' });
    }
  };

  const handleDeleteAccountConfirm = async () => {
    if (deleteConfirmationInput.trim().toUpperCase() !== 'SİL') {
      alert('Onaylamak için lütfen "SİL" yazın.');
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
    <div className="w-full animate-fadeIn flex flex-col pb-16">
      {/* 🌌 CINEMATIC FULL-WIDTH PROFILE HERO BANNER */}
      <div className="relative w-full overflow-hidden bg-slate-950 border-b border-purple-500/20 pt-32 sm:pt-48 pb-20 sm:pb-32 px-4 flex flex-col items-center justify-center text-center shadow-2xl">
        
        {/* Admin Button (Floating Top Right) */}
        {isAuthorizedAdmin(user.email) && (
          <button
            type="button"
            onClick={() => setView({ type: 'management' })}
            className="absolute top-4 right-4 sm:top-6 sm:right-8 z-30 px-3.5 py-1.5 bg-rose-500/15 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 hover:text-white font-bold text-xs sm:text-sm rounded-xl flex items-center gap-2 transition-all shadow-xl backdrop-blur-md"
          >
            <ShieldCheck size={16} className="text-rose-400" />
            <span className="hidden sm:inline">Yönetim Paneli</span>
          </button>
        )}

        {/* 🎨 Theme Background Image (Full Span Cover - Clear & Bright) */}
        <div 
          className="absolute inset-0 pointer-events-none transition-all duration-700 bg-cover bg-center"
          style={{
            backgroundImage: activeThemeStyle?.cardBgImageUrl ? `url(${activeThemeStyle.cardBgImageUrl})` : undefined,
            opacity: activeThemeStyle?.cardBgImageUrl ? 0.75 : 1
          }}
        />
        
        {/* 🔮 Atmospheric Glow Gradient */}
        {!activeThemeStyle?.cardBgImageUrl && (
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: activeThemeStyle?.glowColor
                ? `radial-gradient(circle at 50% 30%, ${activeThemeStyle.glowColor}50 0%, transparent 70%)`
                : 'radial-gradient(circle at 50% 30%, #7c3aed40 0%, transparent 70%)'
            }}
          />
        )}

        {/* ✨ Theme Particle & Motion Effects (With foreground elements extending above card items) */}
        <div className="absolute inset-0 pointer-events-none z-0">
          <ThemeBackgroundEffects effectOverlay={activeThemeStyle?.effectOverlay} isHero={true} />
        </div>

        {/* ✨ Theme Profile Decorations (Chibis/PNGs) */}
        {activeThemeStyle?.profileDecorations?.map((dec, idx) => (
          <img
            key={dec.id || idx}
            src={dec.imageUrl}
            alt=""
            className="absolute pointer-events-none select-none drop-shadow-lg"
            style={{
              top: formatDim(dec.top),
              right: formatDim(dec.right),
              bottom: formatDim(dec.bottom),
              left: formatDim(dec.left),
              width: formatDim(dec.width),
              transform: dec.rotation ? `rotate(${dec.rotation})` : undefined,
              zIndex: dec.zIndex !== undefined ? dec.zIndex : 30,
            }}
          />
        ))}

        {/* 🎬 MÜKEMMEL SİNEMATİK GEÇİŞ (Light Soft Vignette & Smooth Bottom Fade) */}
        {/* Soft Top Tint */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-transparent pointer-events-none" />
        {/* Bottom Seamless Gradient Fade into Page */}
        <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/40 to-transparent pointer-events-none" />
        {/* Center Backing for Text Contrast */}
        <div className="absolute inset-0 bg-radial from-black/30 via-transparent to-black/40 pointer-events-none" />

        {/* 👤 Center Profile Info */}
        <div className="relative z-10 w-full max-w-4xl mx-auto flex flex-col items-center text-center">
          <div className="relative">
            <UserAvatar
              avatar={avatar || user?.avatar || 'https://api.dicebear.com/7.x/bottts/svg?seed=Guest'}
              name={user?.name || 'Kullanıcı'}
              frameId={user.equippedFrame}
              themeBorderClass={activeThemeStyle?.avatarBorderClass}
              size="xl"
              className="transition-transform duration-500 hover:scale-105 shadow-2xl"
            />
          </div>

          <div className="mt-5 space-y-1.5 w-full">
            <h2
              className={`text-2xl sm:text-3xl font-black tracking-tight ${
                activeThemeStyle ? activeThemeStyle.nameClass : 'text-white'
              }`}
            >
              {user.name}
            </h2>
            
            <p className="text-xs sm:text-sm text-gray-400 font-medium flex items-center justify-center gap-2">
              <span className="text-purple-300 font-bold">{getLevelTitle(userLevel)}</span>
              <span>•</span>
              <span className="font-mono bg-white/5 border border-white/10 px-2 py-0.5 rounded-md text-[11px] sm:text-xs text-gray-300">{user.email}</span>
            </p>

            {bioQuote && (
              <div className="mt-3.5 max-w-xl mx-auto p-3 sm:p-3.5 rounded-2xl bg-black/40 border border-white/10 backdrop-blur-md shadow-inner">
                <p className="text-xs sm:text-sm text-gray-200 italic font-medium">
                  "{bioQuote}"
                </p>
              </div>
            )}
          </div>

          {/* Badges Flow */}
          <div className="flex items-center justify-center gap-2 flex-wrap mt-5 max-w-2xl">
            {activeThemeStyle ? (
              <div className="inline-flex items-center gap-1.5 bg-purple-500/20 border border-purple-500/30 px-3 py-1 rounded-full text-xs font-bold text-purple-200 backdrop-blur-sm shadow-sm">
                <Palette size={13} className={activeThemeStyle.accentText || 'text-purple-400'} />
                <span>{activeThemeStyle.name}</span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-1.5 bg-slate-800/80 border border-gray-700/80 px-3 py-1 rounded-full text-xs font-bold text-gray-300 backdrop-blur-sm shadow-sm">
                <Palette size={13} className="text-gray-400" />
                <span>Klasik Tema</span>
              </div>
            )}

            {activeBadges.map((badgeText, idx) => {
              const bItem = shopItems.find(
                item => item.category === 'badge' && (item.badgeText === badgeText || item.name === badgeText)
              );
              return (
                <div
                  key={idx}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold shadow-sm backdrop-blur-sm ${
                    bItem?.badgeStyle
                      ? bItem.badgeStyle
                      : 'bg-indigo-500/20 border border-indigo-500/30 text-indigo-300'
                  }`}
                >
                  <span>{badgeText}</span>
                </div>
              );
            })}
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-3 sm:gap-4 w-full max-w-lg mx-auto mt-6">
            <button
              type="button"
              onClick={() => setShowLevelInfoModal(true)}
              className="bg-black/40 border border-purple-500/20 hover:border-purple-500/50 hover:bg-purple-950/30 backdrop-blur-md rounded-2xl p-3 sm:p-4 flex flex-col items-center justify-center shadow-lg transition-all active:scale-95 group cursor-pointer relative"
              title="Seviye Sistemi Detayları"
            >
              <div className="flex items-center gap-1.5 text-base sm:text-lg font-black text-white group-hover:text-purple-300 transition-colors">
                <Star size={18} className="text-purple-400 fill-purple-400/20 group-hover:scale-110 transition-transform" />
                <span>{userLevel}.0</span>
              </div>
              <span className="text-[10px] text-gray-400 group-hover:text-purple-300 uppercase font-bold tracking-wider mt-1 flex items-center gap-1">
                <span>Seviye</span>
                <HelpCircle size={10} className="text-purple-400" />
              </span>
            </button>

            <button
              type="button"
              onClick={() => setShowLevelInfoModal(true)}
              className="bg-black/40 border border-blue-500/20 hover:border-blue-500/50 hover:bg-blue-950/30 backdrop-blur-md rounded-2xl p-3 sm:p-4 flex flex-col items-center justify-center shadow-lg transition-all active:scale-95 group cursor-pointer relative"
              title="Okunan Bölüm İstatistikleri & Seviye"
            >
              <div className="flex items-center gap-1.5 text-base sm:text-lg font-black text-white group-hover:text-blue-300 transition-colors">
                <BookOpen size={18} className="text-blue-400 fill-blue-400/20 group-hover:scale-110 transition-transform" />
                <span>{totalReadChaptersCount}</span>
              </div>
              <span className="text-[10px] text-gray-400 group-hover:text-blue-300 uppercase font-bold tracking-wider mt-1 flex items-center gap-1">
                <span>Okunan</span>
                <Info size={10} className="text-blue-400" />
              </span>
            </button>
            <div className="bg-black/40 border border-white/10 backdrop-blur-md rounded-2xl p-3 sm:p-4 flex flex-col items-center justify-center shadow-lg transition hover:border-emerald-500/30">
              <div className="flex items-center gap-1.5 text-base sm:text-lg font-black text-emerald-400">
                <Coins size={18} />
                <span>{user.email?.toLowerCase() === 'aseleliyeva77@gmail.com' ? '∞' : (user.coins ?? 10)}</span>
              </div>
              <span className="text-[10px] text-emerald-400/70 uppercase font-bold tracking-wider mt-1">Cosmo</span>
            </div>
          </div>

          {/* Primary Action Buttons */}
          <div className="w-full max-w-md mx-auto mt-6 flex gap-2.5">
            <button
              type="button"
              onClick={() => setView({ type: 'shop' })}
              className="w-12 h-12 rounded-2xl flex items-center justify-center bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 transition-all text-purple-300 hover:text-white shrink-0 shadow-lg"
              title="Mağazaya Git"
            >
              <ShoppingBag size={20} />
            </button>
            <button
              type="button"
              onClick={() => handleTabChange('followed')}
              className="flex-1 h-12 bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white font-bold text-sm rounded-2xl shadow-xl transition-all flex items-center justify-center gap-2 active:scale-98"
            >
              <Bookmark size={18} />
              <span>Takip Edilen Seriler</span>
            </button>
          </div>
        </div>
      </div>

      {/* 🧭 LOWER CONTENT CONTAINER (Tabs & Details) */}
      <div className="w-full max-w-6xl mx-auto px-3 sm:px-6 py-8 space-y-6">
        {/* Navigation Tabs */}
        <div className="flex bg-slate-900/90 border border-white/10 p-1.5 rounded-2xl gap-1.5 overflow-x-auto no-scrollbar shadow-lg backdrop-blur-sm">
          <button
            type="button"
            onClick={() => handleTabChange('profile')}
            className={`flex-1 min-w-[110px] py-3 text-xs sm:text-sm font-bold rounded-xl transition flex items-center justify-center gap-2 whitespace-nowrap ${
              activeTab === 'profile'
                ? 'bg-slate-800 text-white shadow-md border border-white/10'
                : 'text-gray-400 hover:text-gray-200 hover:bg-slate-800/50'
            }`}
          >
            <Settings size={15} /> Ayarlar
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('wardrobe')}
            className={`flex-1 min-w-[110px] py-3 text-xs sm:text-sm font-bold rounded-xl transition flex items-center justify-center gap-2 whitespace-nowrap ${
              activeTab === 'wardrobe'
                ? 'bg-slate-800 text-white shadow-md border border-white/10'
                : 'text-gray-400 hover:text-gray-200 hover:bg-slate-800/50'
            }`}
          >
            <Palette size={15} /> Gardırop
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('badges')}
            className={`flex-1 min-w-[110px] py-3 text-xs sm:text-sm font-bold rounded-xl transition flex items-center justify-center gap-2 whitespace-nowrap ${
              activeTab === 'badges'
                ? 'bg-slate-800 text-white shadow-md border border-white/10'
                : 'text-gray-400 hover:text-gray-200 hover:bg-slate-800/50'
            }`}
          >
            <Award size={15} /> Başarımlar
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('library')}
            className={`flex-1 min-w-[110px] py-3 text-xs sm:text-sm font-bold rounded-xl transition flex items-center justify-center gap-2 whitespace-nowrap ${
              activeTab === 'library'
                ? 'bg-slate-800 text-white shadow-md border border-white/10'
                : 'text-gray-400 hover:text-gray-200 hover:bg-slate-800/50'
            }`}
          >
            <BookOpen size={15} /> Listeler
          </button>
        </div>

        {/* 🔮 TAB CONTENTS */}
        <div className="mt-2">
            {/* TAB 1: PROFILE EDIT & SETTINGS */}
            {activeTab === 'profile' && (
              <div className="space-y-6">
            
            {/* Status Message */}
            {statusMessage && (
              <div
                className={`p-3.5 rounded-2xl text-xs font-medium flex items-center gap-2 ${
                  statusMessage.type === 'success'
                    ? 'bg-emerald-950/80 border border-emerald-500/40 text-emerald-300'
                    : 'bg-rose-950/80 border border-rose-500/40 text-rose-300'
                }`}
              >
                <Check size={16} />
                <span>{statusMessage.text}</span>
              </div>
            )}

            {/* Profile Edit Form Card */}
            <form onSubmit={handleSaveProfile} className="bg-slate-900/90 border border-white/10 rounded-3xl p-5 sm:p-7 space-y-5 shadow-xl">
              
              <div
                onClick={() => setOpenEditProfile(!openEditProfile)}
                className="flex items-center justify-between cursor-pointer select-none group border-b border-purple-900/30 pb-3"
              >
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2 group-hover:text-purple-300 transition-colors">
                    <Settings size={18} className="text-purple-400" />
                    <span>Profil Bilgilerini Düzenle</span>
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Kullanıcı adınızı, okur mottounuzu ve avatarınızı özelleştirin.
                  </p>
                </div>
                <div className="w-8 h-8 rounded-xl bg-purple-950/60 border border-purple-500/30 flex items-center justify-center text-purple-300 group-hover:bg-purple-900/60 group-hover:border-purple-400 transition-all shrink-0 ml-3">
                  {openEditProfile ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </div>
              </div>

              {openEditProfile && (
                <div className="space-y-6 pt-1 animate-fadeIn">
                  {/* Username & Bio */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-300">Kullanıcı Adı</label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        maxLength={30}
                        placeholder="Kullanıcı adınız..."
                        className="w-full bg-slate-950 border border-purple-500/30 rounded-xl px-3.5 py-2.5 text-white text-sm focus:outline-none focus:border-purple-400 transition"
                        required
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-300">Okur Mottosu / Durum Alıntısı</label>
                      <input
                        type="text"
                        value={bioQuote}
                        onChange={(e) => setBioQuote(e.target.value)}
                        maxLength={80}
                        placeholder="Örn: Tek başıma seviye atlıyorum..."
                        className="w-full bg-slate-950 border border-purple-500/30 rounded-xl px-3.5 py-2.5 text-white text-sm focus:outline-none focus:border-purple-400 transition"
                      />
                    </div>
                  </div>

                  {/* Avatar Studio Section */}
                  <div className="space-y-3 pt-2">
                    <label className="text-xs font-bold text-gray-300 block">Avatar Seçimi & Özel Fotoğraf</label>
                    
                    {/* Style Selector */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {(['bottts', 'adventurer', 'lorelei', 'avataaars'] as const).map(style => (
                        <button
                          key={style}
                          type="button"
                          onClick={() => setAvatarStyle(style)}
                          className={`px-3 py-1 rounded-xl text-xs font-bold capitalize transition cursor-pointer ${
                            avatarStyle === style
                              ? 'bg-purple-600 text-white'
                              : 'bg-slate-950 border border-gray-800 text-gray-400 hover:text-white'
                          }`}
                        >
                          {style}
                        </button>
                      ))}
                      
                      <button
                        type="button"
                        onClick={handleRandomizeAvatar}
                        className="px-3 py-1 bg-slate-950 border border-purple-500/30 hover:border-purple-400 text-purple-300 text-xs font-bold rounded-xl transition flex items-center gap-1 cursor-pointer"
                      >
                        <RefreshCw size={12} /> Rastgele
                      </button>
                    </div>

                    {/* Preset Avatars Grid */}
                    <div className="grid grid-cols-6 sm:grid-cols-12 gap-2 pt-1">
                      {PRESET_AVATAR_SEEDS.map(seed => {
                        const presetUrl = `https://api.dicebear.com/7.x/${avatarStyle}/svg?seed=${encodeURIComponent(seed)}`;
                        const isSelected = avatar === presetUrl;
                        return (
                          <button
                            key={seed}
                            type="button"
                            onClick={() => handleSelectPresetAvatar(seed)}
                            className={`relative rounded-xl overflow-hidden p-1 border transition cursor-pointer ${
                              isSelected
                                ? 'border-purple-400 ring-2 ring-purple-400/50 bg-purple-950/60'
                                : 'border-gray-800 hover:border-purple-500/40 bg-slate-950'
                            }`}
                          >
                            <img src={presetUrl} alt={seed} className="w-full h-auto aspect-square rounded-lg object-cover" />
                          </button>
                        );
                      })}
                    </div>

                    {/* Upload Custom Avatar Button */}
                    <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center gap-3">
                      <label className="px-4 py-2 bg-slate-950 hover:bg-slate-800 border border-purple-500/30 text-purple-200 text-xs font-bold rounded-xl flex items-center gap-2 cursor-pointer transition">
                        <Upload size={14} className="text-purple-400" />
                        <span>{isR2Uploading ? 'Yükleniyor...' : 'Cihazdan Fotoğraf Yükle'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleR2FileUpload}
                          disabled={isR2Uploading}
                          className="hidden"
                        />
                      </label>
                      <span className="text-[11px] text-gray-500">JPG, PNG veya GIF (Maks. 8MB)</span>
                    </div>
                  </div>

                  {/* Save Button */}
                  <div className="pt-3 border-t border-purple-900/30 flex justify-end">
                    <button
                      type="submit"
                      disabled={isUpdating || isR2Uploading}
                      className="w-full sm:w-auto px-7 py-2.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-lg transition active:scale-95 cursor-pointer"
                    >
                      {isUpdating ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
                    </button>
                  </div>
                </div>
              )}

            </form>

            {/* Account Management (NSFW & Logout & Delete) */}
            <div className="bg-slate-900/90 border border-white/10 rounded-3xl p-5 sm:p-7 space-y-4 shadow-xl">
              <div
                onClick={() => setOpenAccountSettings(!openAccountSettings)}
                className="flex items-center justify-between cursor-pointer select-none group border-b border-purple-900/30 pb-3"
              >
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2 group-hover:text-purple-300 transition-colors">
                    <ShieldCheck size={18} className="text-purple-400" />
                    <span>Hesap Ayarları & Güvenlik</span>
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    İçerik filtreleri, oturum ve hesap güvenliği tercihleri.
                  </p>
                </div>
                <div className="w-8 h-8 rounded-xl bg-purple-950/60 border border-purple-500/30 flex items-center justify-center text-purple-300 group-hover:bg-purple-900/60 group-hover:border-purple-400 transition-all shrink-0 ml-3">
                  {openAccountSettings ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </div>
              </div>

              {openAccountSettings && (
                <div className="space-y-3 pt-1 animate-fadeIn">
                  {/* NSFW Toggle */}
                  <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-950 border border-purple-900/30">
                    <div className="space-y-0.5">
                      <span className="text-xs font-bold text-white block">+18 / Yetişkin İçerik Filtresi</span>
                      <span className="text-[11px] text-gray-400">Yetişkin kategorisindeki serileri gizleyin veya gösterin.</span>
                    </div>
                    <button
                      type="button"
                      onClick={toggleNsfw}
                      className={`px-4 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                        showNsfw
                          ? 'bg-rose-600 text-white'
                          : 'bg-slate-800 text-gray-300'
                      }`}
                    >
                      {showNsfw ? 'Açık (+18)' : 'Kapalı'}
                    </button>
                  </div>

                  {/* Logout Button */}
                  <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-950 border border-purple-900/30">
                    <div className="space-y-0.5">
                      <span className="text-xs font-bold text-white block">Oturumu Kapat</span>
                      <span className="text-[11px] text-gray-400">Bu cihazdaki oturumunuzu güvenle sonlandırın.</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        logout();
                        onClose();
                      }}
                      className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-gray-200 text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <LogOut size={13} />
                      <span>Çıkış Yap</span>
                    </button>
                  </div>

                  {/* Delete Account */}
                  <div className="flex items-center justify-between p-3.5 rounded-2xl bg-rose-950/20 border border-rose-500/20">
                    <div className="space-y-0.5">
                      <span className="text-xs font-bold text-rose-300 block">Hesabı Kalıcı Olarak Sil</span>
                      <span className="text-[11px] text-rose-200/60">Tüm okuma geçmişiniz ve kütüphaneniz silinir.</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowDeleteConfirm(true)}
                      className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <Trash2 size={13} />
                      <span>Hesabı Sil</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>
        )}

        {/* TAB 2: COSMETIC WARDROBE & EQUIPPED THEMES & VIP BADGES */}
        {activeTab === 'wardrobe' && (
          <div className="bg-slate-900/90 border border-white/10 rounded-3xl p-5 sm:p-7 space-y-6 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-purple-900/30 pb-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Palette size={18} className="text-purple-400" />
                  <span>Kozmetik Gardırobum & Unvanlarım</span>
                </h3>
                <p className="text-xs text-gray-400">
                  Donattığınız tema ve VIP unvan rozeti profil kartınızda ve bölüm yorumlarınızda sergilenir.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setView({ type: 'shop' });
                }}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs rounded-xl flex items-center gap-1.5 transition self-start sm:self-auto cursor-pointer"
              >
                <ShoppingBag size={14} />
                <span>Mağazaya Git</span>
              </button>
            </div>

            {/* SECTION 1: VIP TITLES (BADGES) */}
            <div className="space-y-3">
              <div
                onClick={() => setOpenVipBadges(!openVipBadges)}
                className="flex items-center justify-between gap-2 flex-wrap cursor-pointer select-none group p-2.5 -m-2.5 rounded-2xl hover:bg-slate-950/60 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-2 group-hover:text-amber-300 transition-colors">
                    <Sparkles size={14} /> Sahip Olunan VIP Unvanlar ({ownedBadgeItems.length})
                  </h4>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                    activeBadges.length >= 5
                      ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                      : 'bg-slate-900 border-white/10 text-gray-300'
                  }`}>
                    Kullanılan: <strong className="text-white">{activeBadges.length}</strong>/5
                  </span>
                  {activeBadges.length > 0 && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        equipBadge(null);
                      }}
                      className="text-[11px] text-gray-400 hover:text-red-400 underline transition cursor-pointer mr-1"
                    >
                      Tümünü Çıkar
                    </button>
                  )}
                  <div className="w-6 h-6 rounded-lg bg-amber-950/60 border border-amber-500/30 flex items-center justify-center text-amber-300 group-hover:bg-amber-900/60 transition shrink-0">
                    {openVipBadges ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </div>
                </div>
              </div>

              {openVipBadges && (
                <div className="animate-fadeIn">
                  {ownedBadgeItems.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      {ownedBadgeItems.map(item => {
                        const badgeText = item.badgeText || item.name;
                        const isEquipped = activeBadges.includes(badgeText);
                        return (
                          <div
                            key={item.id}
                            className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                              isEquipped
                                ? 'bg-amber-950/40 border-amber-400 ring-1 ring-amber-400/40 shadow-lg'
                                : 'bg-slate-950 border-purple-900/30 hover:border-purple-500/30'
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <span className={`px-2.5 py-1 rounded-xl text-xs font-black shrink-0 shadow-sm ${item.badgeStyle}`}>
                                {item.badgeText || item.name}
                              </span>
                              <div className="min-w-0">
                                <h5 className="text-xs font-bold text-white truncate">{item.name}</h5>
                                <p className="text-[11px] text-gray-400 leading-snug">{item.description}</p>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => equipBadge(badgeText)}
                              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer ${
                                isEquipped
                                  ? 'bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-400/40'
                                  : 'bg-amber-500 hover:bg-amber-400 text-black font-extrabold'
                              }`}
                            >
                              {isEquipped ? 'Çıkar' : 'Tak'}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="bg-slate-950/40 border border-dashed border-purple-500/20 rounded-2xl p-4 text-center">
                      <p className="text-xs text-gray-400">
                        Henüz bir VIP unvan rozetine sahip değilsiniz. Mağazadan dilediğiniz LGBT+, Yaoi veya Yuri unvanını edinebilirsiniz.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* SECTION 2: COMMENT THEMES */}
            <div className="space-y-3 pt-3 border-t border-purple-900/20">
              <div
                onClick={() => setOpenCardThemes(!openCardThemes)}
                className="flex items-center justify-between gap-2 cursor-pointer select-none group p-2.5 -m-2.5 rounded-2xl hover:bg-slate-950/60 transition-colors"
              >
                <h4 className="text-xs font-black uppercase tracking-wider text-purple-300 flex items-center gap-2 group-hover:text-purple-200 transition-colors">
                  <Palette size={14} /> Sahip Olunan Kart Temaları ({ownedThemeItems.length})
                </h4>
                <div className="w-6 h-6 rounded-lg bg-purple-950/60 border border-purple-500/30 flex items-center justify-center text-purple-300 group-hover:bg-purple-900/60 transition shrink-0">
                  {openCardThemes ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </div>
              </div>

              {openCardThemes && (
                <div className="animate-fadeIn">
                  {ownedThemeItems.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                      {ownedThemeItems.map(item => {
                        const isEquipped = user.equippedTheme === item.id;
                        return (
                          <div
                            key={item.id}
                            className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                              isEquipped
                                ? 'bg-purple-950/60 border-amber-400 ring-1 ring-amber-400/40 shadow-lg'
                                : 'bg-slate-950 border-purple-900/30 hover:border-purple-500/30'
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              {item.icon?.startsWith('http') || item.icon?.startsWith('/') ? (
                              <div className="w-12 h-12 rounded-xl bg-purple-900/40 border border-purple-500/30 flex items-center justify-center shrink-0 overflow-hidden p-1">
                                <img src={item.icon} alt={item.name} className="w-full h-full object-cover rounded-lg" />
                              </div>
                            ) : (
                              <div className="w-12 h-12 rounded-xl bg-purple-900/40 border border-purple-500/30 flex items-center justify-center text-2xl shrink-0">
                                {item.icon}
                              </div>
                            )}
                              <div className="min-w-0">
                                <h5 className="text-xs font-bold text-white truncate">{item.name}</h5>
                                <p className="text-[11px] text-gray-400 leading-snug">{item.description}</p>
                                <span className="text-[10px] text-purple-300 font-semibold mt-0.5 block">
                                  {item.themeType === 'photo' ? '🖼️ Özel Görsel' : '✨ Kozmik Aura'}
                                </span>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => equipTheme(isEquipped ? null : item.id)}
                              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer ${
                                isEquipped
                                  ? 'bg-slate-800 hover:bg-slate-700 text-gray-300'
                                  : 'bg-purple-600 hover:bg-purple-500 text-white'
                              }`}
                            >
                              {isEquipped ? 'Kaldır' : 'Donat'}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="bg-slate-950/60 border border-dashed border-purple-500/20 rounded-2xl p-6 text-center space-y-2">
                      <Palette size={28} className="text-purple-400 mx-auto" />
                      <div className="space-y-1">
                        <h5 className="text-xs font-bold text-white">Henüz Bir Temanız Yok</h5>
                        <p className="text-[11px] text-gray-400 max-w-sm mx-auto">
                          Mağazadan temalar edinerek profilinizi ve yorumlarınızı büyüleyici efektlerle süsleyebilirsiniz.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* SECTION 3: PROFILE FRAMES */}
            <div className="space-y-3 pt-3 border-t border-purple-900/20">
              <div
                onClick={() => setOpenProfileFrames(!openProfileFrames)}
                className="flex items-center justify-between gap-2 cursor-pointer select-none group p-2.5 -m-2.5 rounded-2xl hover:bg-slate-950/60 transition-colors"
              >
                <h4 className="text-xs font-black uppercase tracking-wider text-cyan-300 flex items-center gap-2 group-hover:text-cyan-200 transition-colors">
                  <Sparkles size={14} /> Sahip Olunan Profil Çerçeveleri ({ownedFrameItems.length})
                </h4>
                <div className="w-6 h-6 rounded-lg bg-cyan-950/60 border border-cyan-500/30 flex items-center justify-center text-cyan-300 group-hover:bg-cyan-900/60 transition shrink-0">
                  {openProfileFrames ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </div>
              </div>

              {openProfileFrames && (
                <div className="animate-fadeIn">
                  {ownedFrameItems.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                      {ownedFrameItems.map(item => {
                        const isEquipped = user.equippedFrame === item.id;
                        return (
                          <div
                            key={item.id}
                            className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                              isEquipped
                                ? 'bg-cyan-950/40 border-cyan-400 ring-1 ring-cyan-400/40 shadow-lg'
                                : 'bg-slate-950 border-purple-900/30 hover:border-cyan-500/30'
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <UserAvatar
                                avatar={avatar || user?.avatar}
                                name={user?.name}
                                frameId={item.id}
                                customFrameStyle={item.frameStyle}
                                customFrameImageUrl={item.frameImageUrl}
                                customFrameScale={item.frameScale}
                                customFrameOffsetY={item.frameOffsetY}
                                customFrameHideBorder={item.frameHideBorder}
                                size="md"
                              />
                              <div className="min-w-0">
                                <h5 className="text-xs font-bold text-white truncate">{item.name}</h5>
                                <p className="text-[11px] text-gray-400 leading-snug">{item.description}</p>
                                <span className="text-[10px] text-cyan-300 font-semibold mt-0.5 block">
                                  {item.frameImageUrl ? '🖼️ Özel Katman Görseli' : '✨ Işıltılı Efekt'}
                                </span>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => equipFrame(isEquipped ? null : item.id)}
                              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer ${
                                isEquipped
                                  ? 'bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-400/40'
                                  : 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-extrabold'
                              }`}
                            >
                              {isEquipped ? 'Çıkar' : 'Kuşan'}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="bg-slate-950/60 border border-dashed border-cyan-500/20 rounded-2xl p-6 text-center space-y-2">
                      <Sparkles size={28} className="text-cyan-400 mx-auto" />
                      <div className="space-y-1">
                        <h5 className="text-xs font-bold text-white">Henüz Bir Profil Çerçeveniz Yok</h5>
                        <p className="text-[11px] text-gray-400 max-w-sm mx-auto">
                          Mağazadan şık ve ışıltılı profil çerçeveleri edinerek avatarınızı özelleştirebilirsiniz.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: ACHIEVEMENTS & REWARDS */}
        {activeTab === 'badges' && (
          <div className="bg-slate-900/90 border border-white/10 rounded-3xl p-5 sm:p-7 space-y-4 shadow-xl">
            {/* 7-DAY STARTER REWARD PROMO CARD */}
            <div className="bg-gradient-to-r from-amber-950/80 via-purple-950/80 to-slate-950 border border-amber-500/40 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-300 flex items-center justify-center text-black font-black shrink-0 shadow-md">
                  <CalendarDays size={22} className="stroke-[2.5]" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-black text-white">7 Günlük Hoş Geldin Giriş Takvimi</h4>
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
                      5 - 20 CP / Gün
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-300 mt-0.5">
                    {user.dailyCheckinDay && user.dailyCheckinDay >= 7
                      ? '🎉 7 Günlük takvimi tamamladınız! Puan için Mağaza paketlerini inceleyebilirsiniz.'
                      : `İlerleme: ${user.dailyCheckinDay || 0} / 7 Gün tamamlandı. Her gün giriş yaparak puan kazanın!`}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowDailyModal(true)}
                className="px-4 py-2 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:to-yellow-300 text-black font-black text-xs rounded-xl shadow transition active:scale-95 flex items-center gap-1.5 shrink-0 cursor-pointer"
              >
                <Gift size={14} />
                <span>Takvimi Gör & Ödül Al</span>
              </button>
            </div>

            <div className="flex items-center justify-between border-b border-purple-900/30 pb-3 pt-2">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Award size={18} className="text-amber-400" />
                  <span>Okuma Başarımları & Cosmo-Puan Ödülleri</span>
                </h3>
                <p className="text-xs text-gray-400">
                  Bölüm okudukça görevleri tamamlayın ve ücretsiz Cosmo-Puan kazanın.
                </p>
              </div>
              <span className="text-xs font-bold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-3 py-1 rounded-xl">
                {unlockedCount} / {badges.length} Tamamlandı
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {badges.map(badge => {
                const isClaimed = claimedRewards.includes(badge.id);
                return (
                  <div
                    key={badge.id}
                    className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                      badge.isUnlocked
                        ? 'bg-slate-950 border-purple-500/40 shadow'
                        : 'bg-slate-950/40 border-gray-900 opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-purple-900/30 border border-purple-500/20 flex items-center justify-center shrink-0">
                        {badge.icon}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-xs font-bold text-white truncate">{badge.title}</h4>
                          {badge.isUnlocked && (
                            <span className="text-[10px] text-emerald-400 font-bold">✓</span>
                          )}
                        </div>
                        <p className="text-[11px] text-gray-400 leading-snug">{badge.description}</p>
                        <span className="text-[10px] text-purple-300 font-medium">{badge.progressText}</span>
                      </div>
                    </div>

                    <div className="shrink-0 text-right">
                      {badge.isUnlocked ? (
                        isClaimed ? (
                          <span className="text-[11px] text-gray-500 font-bold px-2 py-1 bg-slate-900 rounded-lg">
                            Alındı
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleClaimReward(badge)}
                            className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs rounded-xl transition cursor-pointer"
                          >
                            +{badge.rewardCoins} CP Al
                          </button>
                        )
                      ) : (
                        <span className="text-[10px] text-gray-500 font-mono">
                          +{badge.rewardCoins} CP
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 4: EMBEDDED LIBRARY VIEW */}
        
        {activeTab === 'followed' && (
          <div className="bg-slate-900/90 border border-white/10 rounded-3xl p-5 sm:p-7 shadow-xl">
            <div className="border-b border-white/10 pb-4 mb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Bookmark size={20} className="text-pink-400" />
                Takip Edilen Seriler
              </h3>
              <p className="text-xs text-gray-400 mt-1">
                Takip ettiğiniz serilere yeni bölümler eklendiğinde bildirim alırsınız.
              </p>
            </div>
            
            {followedSeries.length === 0 ? (
              <div className="text-center py-12">
                <Bookmark size={40} className="mx-auto text-gray-700 mb-3" />
                <p className="text-gray-400 font-semibold text-sm">Henüz hiçbir seriyi takip etmiyorsunuz.</p>
                <button
                  onClick={() => { setView({ type: 'series-list' }); onClose(); }}
                  className="mt-4 px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl transition shadow"
                >
                  Serileri Keşfet
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mt-2">
                {followedSeries.map(s => (
                  <SeriesCard key={s.id} series={s} maxChapters={1} />
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'library' && (
          <div className="bg-slate-900/90 border border-white/10 rounded-3xl p-5 sm:p-7 shadow-xl">
            <ProfileReadingLists isOwnProfile={true} userId={user?.uid || ''} initialLists={[]} />
          </div>
        )}

        </div>
      </div>

      {/* Delete Account Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-rose-500/30 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-rose-950/80 border border-rose-500/40 flex items-center justify-center text-rose-400 mx-auto">
              <Trash2 size={24} />
            </div>

            <div className="text-center space-y-1.5">
              <h3 className="text-base font-bold text-white">Hesabınızı Silmek İstediğinize Emin Misiniz?</h3>
              <p className="text-xs text-gray-400">
                Bu işlem geri alınamaz. Okuma geçmişiniz, favorileriniz ve Cosmo-Puanlarınız tamamen silinir.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-300 block">
                Onaylamak için büyük harflerle <strong className="text-rose-400">SİL</strong> yazın:
              </label>
              <input
                type="text"
                value={deleteConfirmationInput}
                onChange={(e) => setDeleteConfirmationInput(e.target.value)}
                placeholder="SİL"
                className="w-full bg-slate-950 border border-rose-500/30 rounded-xl px-3.5 py-2 text-white text-sm focus:outline-none focus:border-rose-400"
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-gray-200 text-xs font-bold rounded-xl transition"
              >
                Vazgeç
              </button>
              <button
                type="button"
                onClick={handleDeleteAccountConfirm}
                disabled={isDeleting}
                className="flex-1 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl transition"
              >
                {isDeleting ? 'Siliniyor...' : 'Hesabı Kalıcı Olarak Sil'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7-DAY STARTER REWARD MODAL */}
      <DailyRewardModal
        isOpen={showDailyModal}
        onClose={() => setShowDailyModal(false)}
      />

      {/* 🌟 SEVİYE & XP BİLGİLENDİRME MODALI */}
      {showLevelInfoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-lg bg-slate-950 border border-purple-500/30 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-5 overflow-hidden">
            {/* Background Glow */}
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-purple-600/30 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-indigo-600/30 rounded-full blur-3xl pointer-events-none" />

            {/* Header */}
            <div className="flex items-center justify-between border-b border-purple-500/20 pb-4 relative z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-950/80 border border-purple-500/40 flex items-center justify-center text-purple-300">
                  <Star size={22} className="fill-purple-400 text-purple-400" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-white">Okur Seviye Sistemi</h3>
                  <p className="text-xs text-purple-300 font-medium">Nasıl seviye atlanır ve unvan kazanılır?</p>
                </div>
              </div>
              <button
                onClick={() => setShowLevelInfoModal(false)}
                className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white flex items-center justify-center transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Current Status Card */}
            <div className="bg-purple-950/40 border border-purple-500/30 rounded-2xl p-4 space-y-3 relative z-10">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-black text-purple-300 tracking-wider">Mevcut Durumunuz</span>
                  <h4 className="text-lg font-black text-white flex items-center gap-2">
                    <span>Seviye {userLevel}.0</span>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-500/20 border border-purple-500/40 text-purple-200 font-bold">
                      {getLevelTitle(userLevel)}
                    </span>
                  </h4>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-gray-400 uppercase font-bold block">Toplam Okuma</span>
                  <span className="text-sm font-mono font-bold text-white">{totalReadChaptersCount} Bölüm</span>
                </div>
              </div>

              {/* XP Progress Bar */}
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-purple-300">Seviye {userLevel + 1} İlerlemesi</span>
                  <span className="text-gray-300">{chaptersInCurrentLevel} / {CHAPTERS_PER_LEVEL} Bölüm</span>
                </div>
                <div className="w-full h-2.5 bg-black/60 rounded-full overflow-hidden border border-white/10 p-0.5">
                  <div
                    className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(168,85,247,0.5)]"
                    style={{ width: `${Math.max(4, xpProgressPercent)}%` }}
                  />
                </div>
                <p className="text-[11px] text-gray-400 italic text-right">
                  {userLevel >= 50
                    ? '🎉 Maksimum seviyeye ulaştınız!'
                    : `Sonraki seviyeye geçmek için ${chaptersRemainingForNextLevel} bölüm daha okuyun.`}
                </p>
              </div>
            </div>

            {/* How It Works List */}
            <div className="space-y-2.5 relative z-10">
              <h5 className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles size={14} className="text-amber-400" />
                <span>Seviye Kuralları & Kademe Unvanları</span>
              </h5>

              <div className="space-y-2 text-xs">
                <div className="p-2.5 rounded-xl bg-black/30 border border-white/5 flex items-start gap-2.5 text-gray-300">
                  <BookOpen size={16} className="text-blue-400 shrink-0 mt-0.5" />
                  <span><strong>Her 50 Bölüm = +1 Seviye:</strong> Sitede okuduğunuz her web novel ve manhwa bölümü okuma sayacınıza eklenir ve seviyenizi yükseltir.</span>
                </div>

                <div className="p-2.5 rounded-xl bg-black/30 border border-white/5 flex items-start gap-2.5 text-gray-300">
                  <Crown size={16} className="text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white block mb-1">Kazanabileceğiniz Unvanlar:</strong>
                    <div className="grid grid-cols-2 gap-1.5 text-[11px] text-gray-300">
                      <div>• Seviye 1-4: <span className="text-purple-300 font-bold">Çaylak / Hevesli Okur</span></div>
                      <div>• Seviye 5-9: <span className="text-blue-300 font-bold">Kıdemli Okur</span></div>
                      <div>• Seviye 10-19: <span className="text-cyan-300 font-bold">Usta Okuyucu</span></div>
                      <div>• Seviye 20-29: <span className="text-emerald-300 font-bold">Kadim Büyücü</span></div>
                      <div>• Seviye 30-39: <span className="text-yellow-300 font-bold">S-Rank Efsane</span></div>
                      <div>• Seviye 40-49: <span className="text-rose-300 font-bold">Efsanevi Yüce Okur</span></div>
                      <div className="col-span-2">• Seviye 50: <span className="text-amber-400 font-black">👑 Kozmik Hükümdar</span></div>
                    </div>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-black/30 border border-white/5 flex items-start gap-2.5 text-gray-300">
                  <Award size={16} className="text-purple-400 shrink-0 mt-0.5" />
                  <span><strong>Başarımlar & Ödüller:</strong> Başarımlar sekmesindeki okuma görevlerini tamamlayarak hem unvanınızı güçlendirebilir hem de gardıropta harcamak üzere ücretsiz Cosmo-Puan kazanabilirsiniz.</span>
                </div>
              </div>
            </div>

            {/* Close Button */}
            <button
              type="button"
              onClick={() => setShowLevelInfoModal(false)}
              className="w-full py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg transition active:scale-98 cursor-pointer relative z-10"
            >
              Anladım
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
