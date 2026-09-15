import React
, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { ReadingProgress } from '../types';
import { ThemeBackgroundEffects } from './ThemeBackgroundEffects';
import { THEME_STYLES, SHOP_ITEMS } from '../data/shopData';
import { UserAvatar } from './UserAvatar';
import { 
  Award, 
  BookOpen, 
  Star, 
  Palette, 
  Coins, 
  Bookmark, 
  Medal, 
  ShoppingBag, 
  Quote, 
  Calendar, 
  Sparkles,
  ArrowRight,
  Sprout,
  Flame,
  Trophy,
  Moon,
  Feather,
  MessageSquare,
  MessageCircle,
  CheckCircle2
} from 'lucide-react';
import { ProfileReadingLists } from './ProfileReadingLists';

const formatDim = (v?: string | number | null) => { if (!v && v !== 0) return undefined; const trim = String(v).trim(); return (trim && !isNaN(Number(trim))) ? `${trim}px` : trim; };


const safeFetchJson = async (url: string) => {
  try {
    const r = await fetch(url);
    return await r.json();
  } catch (e) {
    return { success: false };
  }
};

const formatJoinDate = (dateStr?: string) => {
  if (!dateStr) return null;
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    return new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }).format(date);
  } catch {
    return dateStr;
  }
};

export const PublicProfileView: React.FC<{ userId: string }> = ({ userId }) => {
  const { themeStyles, shopItems, setView, openShop, seriesList } = useApp();
  
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'library' | 'wardrobe' | 'badges'>('library');

  useEffect(() => {
    const cacheKey = `mk_profile_${userId}`;
    const cached = sessionStorage.getItem(cacheKey);
    const localBio = localStorage.getItem(`mk_bio_${userId}`) || '';

    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        setProfile({ ...parsed, bio: parsed.bio || localBio });
        setLoading(false);
      } catch (e) {}
    } else {
      setLoading(true);
    }

    safeFetchJson(`/api/public-profile?uid=${encodeURIComponent(userId)}`)
      .then(res => {
        if (res && res.success && res.profile) {
          const profileData = {
            ...res.profile,
            bio: res.profile.bio || res.profile.bioQuote || res.profile.motto || localBio
          };
          setProfile(profileData);
          sessionStorage.setItem(cacheKey, JSON.stringify(profileData));
        } else if (!cached) {
          // If no API response, check if it's the current active user
          const savedUser = localStorage.getItem('mk_user');
          if (savedUser) {
            try {
              const u = JSON.parse(savedUser);
              if (u.uid === userId || u.email === userId) {
                setProfile({ ...u, bio: u.bio || localBio });
              }
            } catch (e) {}
          }
        }
      })
      .catch(() => {
        if (!cached) {
          const savedUser = localStorage.getItem('mk_user');
          if (savedUser) {
            try {
              const u = JSON.parse(savedUser);
              if (u.uid === userId || u.email === userId) {
                setProfile({ ...u, bio: u.bio || localBio });
              }
            } catch (e) {}
          }
        }
      })
      .finally(() => {
        setLoading(false);
      });
  }, [userId]);

  if (loading) {
    return (
      <div className="w-full flex-1 flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="w-full flex-1 flex flex-col items-center justify-center min-h-[50vh] text-center space-y-4 px-4">
        <h2 className="text-2xl font-bold text-gray-300">Kullanıcı bulunamadı.</h2>
        <p className="text-sm text-gray-500">Bu profil gizli olabilir veya kullanıcı mevcut değil.</p>
        <button
          type="button"
          onClick={() => setView({ type: 'home' })}
          className="px-6 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-bold transition"
        >
          Ana Sayfaya Dön
        </button>
      </div>
    );
  }

  // Calculate statistics safely
  let totalReadChaptersCount = 0;
  const readingHistory = (profile.readingHistory && typeof profile.readingHistory === 'object')
    ? profile.readingHistory
    : {};
    
  try {
    (Object.values(readingHistory) as ReadingProgress[]).forEach(item => {
      if (!item) return;
      const count = item.readChapterIds && item.readChapterIds.length > 0
        ? item.readChapterIds.length
        : (item.lastChapterId ? 1 : 0);
      totalReadChaptersCount += count;
    });
  } catch (e) {
    console.error("Reading history parse error:", e);
  }

  // Calculate Level based on actual read chapters (50 chapters = +1 Level)
  const CHAPTERS_PER_LEVEL = 50;
  const level = Math.min(50, Math.floor(totalReadChaptersCount / CHAPTERS_PER_LEVEL) + 1);

  const activeThemeStyle = profile.equippedTheme
    ? (themeStyles?.[profile.equippedTheme] || THEME_STYLES?.[profile.equippedTheme] || null)
    : null;

  // Calculate novel & manhwa read counts
  let novelReadCount = 0;
  let manhwaReadCount = 0;
  try {
    (Object.values(readingHistory) as ReadingProgress[]).forEach(item => {
      if (!item) return;
      const count = item.readChapterIds && item.readChapterIds.length > 0
        ? item.readChapterIds.length
        : (item.lastChapterId ? 1 : 0);
      const matchingSeries = seriesList?.find(s => s.id === item.seriesId);
      if (matchingSeries) {
        if (matchingSeries.type === 'Web Novel') {
          novelReadCount += count;
        } else {
          manhwaReadCount += count;
        }
      }
    });
  } catch (e) {}

  const commentsCount = profile.commentsCount || 0;
  const bookmarkedSeriesCount = Object.keys(profile.bookmarks || profile.followedSeriesIds || {}).length;

  const achievementsList = [
    {
      id: 'ach-1',
      title: 'İlk Adım',
      description: 'İlk bölümünü oku ve serüvene başla.',
      current: Math.min(totalReadChaptersCount, 1),
      target: 1,
      unit: 'Bölüm',
      icon: <Sprout size={18} className="text-emerald-400" />,
      iconBg: 'bg-emerald-950/60 border-emerald-500/30'
    },
    {
      id: 'ach-2',
      title: 'Kitap Kurdu',
      description: '10 Bölüm okuma başarısını tamamla.',
      current: Math.min(totalReadChaptersCount, 10),
      target: 10,
      unit: 'Bölüm',
      icon: <BookOpen size={18} className="text-purple-400" />,
      iconBg: 'bg-purple-950/60 border-purple-500/30'
    },
    {
      id: 'ach-3',
      title: '50 Bölüm Muhafızı',
      description: '50 bölüm okuyarak derin bir okuyucu olduğunu kanıtla.',
      current: Math.min(totalReadChaptersCount, 50),
      target: 50,
      unit: 'Bölüm',
      icon: <Flame size={18} className="text-orange-400" />,
      iconBg: 'bg-orange-950/60 border-orange-500/30'
    },
    {
      id: 'ach-4',
      title: '100 Bölüm Efsanesi',
      description: 'Topluluğun gururu! Tam 100 bölüm oku.',
      current: Math.min(totalReadChaptersCount, 100),
      target: 100,
      unit: 'Bölüm',
      icon: <Trophy size={18} className="text-amber-400" />,
      iconBg: 'bg-amber-950/60 border-amber-500/30'
    },
    {
      id: 'ach-5',
      title: 'Gece Kuşu Okuyucu',
      description: 'Gece vakti okuma serüvenine katıl.',
      current: Math.min(totalReadChaptersCount, 5),
      target: 5,
      unit: 'Bölüm',
      icon: <Moon size={18} className="text-indigo-400" />,
      iconBg: 'bg-indigo-950/60 border-indigo-500/30'
    },
    {
      id: 'ach-6',
      title: 'Web Novel Tutkunu',
      description: 'Web Novel serilerinden en az 5 bölüm oku.',
      current: Math.min(novelReadCount, 5),
      target: 5,
      unit: 'Novel Bölümü',
      icon: <Feather size={18} className="text-fuchsia-400" />,
      iconBg: 'bg-fuchsia-950/60 border-fuchsia-500/30'
    },
    {
      id: 'ach-7',
      title: 'Manhwa Sevdalısı',
      description: 'Çizgi Roman serilerinden en az 10 bölüm oku.',
      current: Math.min(manhwaReadCount, 10),
      target: 10,
      unit: 'Manhwa Bölümü',
      icon: <Palette size={18} className="text-cyan-400" />,
      iconBg: 'bg-cyan-950/60 border-cyan-500/30'
    },
    {
      id: 'ach-8',
      title: 'Sosyal Eleştirmen',
      description: 'Serilere ve bölümlere düşüncelerini yaz.',
      current: Math.min(commentsCount, 1),
      target: 1,
      unit: 'Yorum',
      icon: <MessageSquare size={18} className="text-purple-400" />,
      iconBg: 'bg-purple-950/60 border-purple-500/30'
    },
    {
      id: 'ach-9',
      title: 'Yorum Üstadı',
      description: 'Topluluğa en az 5 değerli yorum katkısında bulun.',
      current: Math.min(commentsCount, 5),
      target: 5,
      unit: 'Yorum',
      icon: <MessageCircle size={18} className="text-indigo-400" />,
      iconBg: 'bg-indigo-950/60 border-indigo-500/30'
    },
    {
      id: 'ach-10',
      title: 'Büyük Koleksiyoner',
      description: 'Kütüphanene en az 5 seriyi kaydet.',
      current: Math.min(bookmarkedSeriesCount, 5),
      target: 5,
      unit: 'Seri',
      icon: <Bookmark size={18} className="text-amber-400" />,
      iconBg: 'bg-amber-950/60 border-amber-500/30'
    }
  ];

  const completedAchievementsCount = achievementsList.filter(a => a.current >= a.target).length;

  const allItems = (shopItems && Array.isArray(shopItems) && shopItems.length > 0) ? shopItems : SHOP_ITEMS;
  const userInventory: string[] = Array.isArray(profile.inventory) ? profile.inventory : (Array.isArray(profile.shopItems) ? profile.shopItems : []);
  
  const ownedFrames = allItems.filter(i => i.category === 'frame' && userInventory.includes(i.id));
  const ownedThemes = allItems.filter(i => i.category === 'theme' && userInventory.includes(i.id));
  const shopBadges = allItems.filter(i => i.category === 'badge' && userInventory.includes(i.id));

  // Determine which badges are equipped
  let equippedBadgeNames: string[] = [];
  if (Array.isArray(profile.equippedBadges) && profile.equippedBadges.length > 0) {
    equippedBadgeNames = profile.equippedBadges;
  } else if (profile.equippedBadge) {
    equippedBadgeNames = [profile.equippedBadge];
  }

  const joinDateFormatted = formatJoinDate(profile.createdAt);

  return (
    <div className="w-full animate-fadeIn flex flex-col pb-16">
      {/* 🌌 CINEMATIC FULL-WIDTH PROFILE HERO BANNER */}
      <div className="relative w-full overflow-hidden bg-slate-950 border-b border-purple-500/20 pt-32 sm:pt-48 pb-20 sm:pb-32 px-4 flex flex-col items-center justify-center text-center shadow-2xl">
        
        {/* 🎨 Theme Background Image */}
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

        {/* ✨ Theme Particle & Motion Effects */}
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

        {/* 🎬 Overlays */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-transparent pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/40 to-transparent pointer-events-none" />
        <div className="absolute inset-0 bg-radial from-black/30 via-transparent to-black/40 pointer-events-none" />

        {/* 👤 Center Profile Info */}
        <div className="relative z-10 w-full max-w-4xl mx-auto flex flex-col items-center text-center">
          <div className="relative">
            <UserAvatar
              avatar={profile.avatar || 'https://api.dicebear.com/7.x/bottts/svg?seed=Guest'}
              name={profile.name || 'Kullanıcı'}
              frameId={profile.equippedFrame}
              themeBorderClass={activeThemeStyle?.avatarBorderClass}
              size="xl"
              className="transition-transform duration-500 hover:scale-105 shadow-2xl"
            />
          </div>

          <h1 className={`mt-5 text-3xl sm:text-4xl font-black tracking-tight ${activeThemeStyle?.nameClass || 'text-white'}`}>
            {profile.name}
          </h1>

          {/* 💬 OKUR MOTTOSU */}
          {(profile.bio || profile.bioQuote || profile.motto) && (
            <div className="mt-3.5 max-w-xl mx-auto px-5 py-3 rounded-2xl bg-black/50 border border-purple-500/30 backdrop-blur-md shadow-xl text-center relative group">
              <div className="flex items-center justify-center gap-2.5">
                <Quote size={16} className="text-purple-400 shrink-0 opacity-80" />
                <p className="text-xs sm:text-sm text-gray-200 font-medium italic leading-relaxed">
                  "{profile.bio || profile.bioQuote || profile.motto}"
                </p>
              </div>
            </div>
          )}

          {/* 📅 Registration / Join Date */}
          {joinDateFormatted && (
            <div className="mt-2.5 flex items-center justify-center gap-1.5 text-[11px] text-gray-400 font-medium">
              <Calendar size={12} className="text-purple-400/80" />
              <span>Üyelik Tarihi: <strong className="text-gray-300">{joinDateFormatted}</strong></span>
            </div>
          )}

          {/* 🏆 EQUIPPED VIP TITLE BADGES */}
          {equippedBadgeNames.length > 0 && (
            <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 mt-4">
              {equippedBadgeNames.map((badgeText: string, idx: number) => {
                const bItem = allItems.find(i => i.category === 'badge' && i.name === badgeText);
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
          )}

          {/* 📊 STATS GRID */}
          <div className="grid grid-cols-3 gap-3 sm:gap-4 w-full max-w-lg mx-auto mt-6">
            <div className="bg-black/40 border border-white/10 backdrop-blur-md rounded-2xl p-3 sm:p-4 flex flex-col items-center justify-center shadow-lg transition hover:border-purple-500/30">
              <div className="flex items-center gap-1.5 text-base sm:text-lg font-black text-white">
                <Star size={18} className="text-purple-400" />
                <span>{level}.0</span>
              </div>
              <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider mt-1">Seviye</span>
            </div>
            
            <div className="bg-black/40 border border-white/10 backdrop-blur-md rounded-2xl p-3 sm:p-4 flex flex-col items-center justify-center shadow-lg transition hover:border-blue-500/30">
              <div className="flex items-center gap-1.5 text-base sm:text-lg font-black text-white">
                <BookOpen size={18} className="text-blue-400" />
                <span>{totalReadChaptersCount}</span>
              </div>
              <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider mt-1">Okunan</span>
            </div>

            <div className="bg-black/40 border border-white/10 backdrop-blur-md rounded-2xl p-3 sm:p-4 flex flex-col items-center justify-center shadow-lg transition hover:border-emerald-500/30">
              <div className="flex items-center gap-1.5 text-base sm:text-lg font-black text-emerald-400">
                <Coins size={18} />
                <span>{profile.coins ?? 0}</span>
              </div>
              <span className="text-[10px] text-emerald-400/70 uppercase font-bold tracking-wider mt-1">Cosmo</span>
            </div>
          </div>
        </div>
      </div>

      {/* 🧭 LOWER CONTENT CONTAINER (Tabs & Details) */}
      <div className="w-full max-w-6xl mx-auto px-3 sm:px-6 py-8 space-y-6">
        
        {/* Navigation Tabs */}
        <div className="flex bg-slate-900/90 border border-white/10 p-1.5 rounded-2xl gap-1.5 overflow-x-auto no-scrollbar shadow-lg backdrop-blur-sm">
          <button
            type="button"
            onClick={() => setActiveTab('library')}
            className={`flex-1 min-w-[110px] py-3 text-xs sm:text-sm font-bold rounded-xl transition flex items-center justify-center gap-2 whitespace-nowrap ${
              activeTab === 'library'
                ? 'bg-slate-800 text-white shadow-md border border-white/10'
                : 'text-gray-400 hover:text-gray-200 hover:bg-slate-800/50'
            }`}
          >
            <Bookmark size={15} /> Listeler
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('wardrobe')}
            className={`flex-1 min-w-[110px] py-3 text-xs sm:text-sm font-bold rounded-xl transition flex items-center justify-center gap-2 whitespace-nowrap ${
              activeTab === 'wardrobe'
                ? 'bg-slate-800 text-white shadow-md border border-white/10'
                : 'text-gray-400 hover:text-gray-200 hover:bg-slate-800/50'
            }`}
          >
            <Palette size={15} /> Gardırobu
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('badges')}
            className={`flex-1 min-w-[110px] py-3 text-xs sm:text-sm font-bold rounded-xl transition flex items-center justify-center gap-2 whitespace-nowrap ${
              activeTab === 'badges'
                ? 'bg-slate-800 text-white shadow-md border border-white/10'
                : 'text-gray-400 hover:text-gray-200 hover:bg-slate-800/50'
            }`}
          >
            <Award size={15} /> Başarımları
          </button>
        </div>

        {/* Tab Contents */}
        <div className="min-h-[300px]">
          {activeTab === 'library' && (
            <div className="bg-slate-900/40 border border-white/10 rounded-[24px] p-4 sm:p-6 shadow-xl backdrop-blur-sm">
              <ProfileReadingLists 
                isOwnProfile={false}
                userId={userId}
                initialLists={Array.isArray(profile.readingLists) ? profile.readingLists : []}
              />
            </div>
          )}

          {activeTab === 'wardrobe' && (
            <div className="bg-slate-900/40 border border-white/10 rounded-[24px] p-4 sm:p-8 shadow-xl backdrop-blur-sm space-y-8">
              
              {/* ✨ STORE PROMOTION HERO BANNER */}
              <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-purple-950/70 via-slate-900/90 to-indigo-950/70 border border-purple-500/30 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
                <div className="flex items-center gap-4 text-center sm:text-left">
                  <div className="w-12 h-12 rounded-2xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center shrink-0">
                    <Sparkles size={24} className="text-purple-300" />
                  </div>
                  <div>
                    <h4 className="text-base font-extrabold text-white">Sen de Profilini Eşsiz Kıl!</h4>
                    <p className="text-xs text-gray-300 mt-0.5">
                      Cosmo Mağazası'ndaki animasyonlu profil temalarını, özel çerçeveleri ve rozetleri keşfet.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => openShop()}
                  className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold text-xs sm:text-sm rounded-xl transition shadow-lg flex items-center justify-center gap-2 shrink-0 hover:scale-105"
                >
                  <ShoppingBag size={16} /> Cosmo Mağazası'na Git
                </button>
              </div>

              {/* Owned Themes */}
              <div>
                <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Palette size={20} className="text-purple-400" />
                    Kozmetik Temaları ({ownedThemes.length})
                  </h3>
                  <button
                    type="button"
                    onClick={() => openShop()}
                    className="text-xs font-bold text-purple-400 hover:text-purple-300 transition flex items-center gap-1"
                  >
                    Tüm Temaları Mağazada Gör <ArrowRight size={13} />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {ownedThemes.length > 0 ? ownedThemes.map(item => {
                    const isEquipped = profile.equippedTheme === item.id;
                    return (
                      <div
                        key={item.id}
                        className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                          isEquipped
                            ? 'bg-purple-950/60 border-amber-400 ring-1 ring-amber-400/40 shadow-lg'
                            : 'bg-slate-950 border-purple-900/30 hover:border-purple-500/30'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-12 h-12 rounded-xl bg-purple-900/40 border border-purple-500/30 flex items-center justify-center text-2xl shrink-0">
                            {item.name.charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-white text-sm truncate">{item.name}</h4>
                              {isEquipped && (
                                <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 text-[10px] font-bold rounded-md border border-amber-500/30 shrink-0">
                                  Kullanımda
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-purple-300/70 truncate">{item.description}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                          <button
                            type="button"
                            onClick={() => openShop()}
                            className="px-3 py-1.5 bg-purple-600/20 hover:bg-purple-600 text-purple-200 hover:text-white border border-purple-500/40 text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow-sm"
                            title="Bu temayı mağazada gör ve satın al"
                          >
                            <ShoppingBag size={12} /> Mağazada Gör
                          </button>
                        </div>
                      </div>
                    );
                  }) : (
                    <div className="col-span-full py-8 text-center bg-slate-950/60 border border-dashed border-white/10 rounded-2xl p-6">
                      <p className="text-sm text-gray-400 mb-3">Bu kullanıcı henüz özel bir tema açmamış.</p>
                      <button
                        type="button"
                        onClick={() => openShop()}
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl transition inline-flex items-center gap-1.5"
                      >
                        <ShoppingBag size={14} /> Mağazadaki Temalara Göz At
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Owned Frames */}
              <div>
                <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Award size={20} className="text-cyan-400" />
                    Profil Çerçeveleri ({ownedFrames.length})
                  </h3>
                  <button
                    type="button"
                    onClick={() => openShop()}
                    className="text-xs font-bold text-cyan-400 hover:text-cyan-300 transition flex items-center gap-1"
                  >
                    Tüm Çerçeveleri Mağazada Gör <ArrowRight size={13} />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {ownedFrames.length > 0 ? ownedFrames.map(item => {
                    const isEquipped = profile.equippedFrame === item.id;
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
                            avatar={profile.avatar}
                            name={profile.name}
                            frameId={item.id}
                            size="md"
                            showFrame={true}
                          />
                          <div className="min-w-0">
                            <h4 className="font-bold text-white text-sm truncate">{item.name}</h4>
                            {isEquipped && (
                              <span className="text-[10px] text-cyan-400 font-bold block mt-0.5">Seçili Çerçeve</span>
                            )}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => openShop()}
                          className="px-2.5 py-1 bg-cyan-600/20 hover:bg-cyan-600 text-cyan-300 hover:text-white border border-cyan-500/30 text-[11px] font-bold rounded-lg transition shrink-0 flex items-center gap-1"
                          title="Mağazada incele"
                        >
                          <ShoppingBag size={11} /> İncele
                        </button>
                      </div>
                    );
                  }) : (
                    <div className="col-span-full py-8 text-center bg-slate-950/60 border border-dashed border-white/10 rounded-2xl p-6">
                      <p className="text-sm text-gray-400 mb-3">Bu kullanıcı henüz özel bir çerçeve açmamış.</p>
                      <button
                        type="button"
                        onClick={() => openShop()}
                        className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-xl transition inline-flex items-center gap-1.5"
                      >
                        <ShoppingBag size={14} /> Mağazadaki Çerçevelere Göz At
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Owned Shop Badges / Titles */}
              <div>
                <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Medal size={20} className="text-indigo-400" />
                    Mağaza Unvanları ({shopBadges.length})
                  </h3>
                  <button
                    type="button"
                    onClick={() => openShop()}
                    className="text-xs font-bold text-indigo-400 hover:text-indigo-300 transition flex items-center gap-1"
                  >
                    Tüm Unvanları Mağazada Gör <ArrowRight size={13} />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {shopBadges.length > 0 ? shopBadges.map(item => {
                    const isEquipped = equippedBadgeNames.includes(item.name) || equippedBadgeNames.includes(item.badgeText || item.name);
                    return (
                      <div
                        key={item.id}
                        className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                          isEquipped
                            ? 'bg-indigo-950/60 border-indigo-400 ring-1 ring-indigo-400/40 shadow-lg'
                            : 'bg-slate-950 border-purple-900/30 hover:border-indigo-500/30'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-xl bg-indigo-900/40 border border-indigo-500/30 flex items-center justify-center shrink-0">
                            <span className="text-xs font-black text-indigo-300">{(item.badgeText || item.name).substring(0, 2)}</span>
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-bold text-white text-sm truncate">{item.name}</h4>
                            {isEquipped && (
                              <span className="text-[10px] text-indigo-300 font-bold block mt-0.5">Kullanımda</span>
                            )}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => openShop()}
                          className="px-2.5 py-1 bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/30 text-[11px] font-bold rounded-lg transition shrink-0 flex items-center gap-1"
                          title="Mağazada incele"
                        >
                          <ShoppingBag size={11} /> İncele
                        </button>
                      </div>
                    );
                  }) : (
                    <div className="col-span-full py-6 text-center bg-slate-950/60 border border-dashed border-white/10 rounded-2xl p-5">
                      <p className="text-xs text-gray-400">Bu kullanıcı henüz mağazadan özel unvan/rozet satın almamış.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'badges' && (
            <div className="bg-slate-900/40 border border-white/10 rounded-[24px] p-4 sm:p-8 shadow-xl backdrop-blur-sm space-y-6">
              <div className="flex items-center justify-between gap-4 flex-wrap pb-4 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
                    <Award size={22} className="text-amber-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Okuma & Topluluk Başarımları</h3>
                    <p className="text-xs text-gray-400">Kullanıcının kazandığı başarımlar ve görev ilerlemesi.</p>
                  </div>
                </div>
                <span className="text-xs font-bold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-3 py-1.5 rounded-xl">
                  {completedAchievementsCount} / {achievementsList.length} Tamamlandı
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {achievementsList.map((ach) => {
                  const isUnlocked = ach.current >= ach.target;
                  const percent = Math.min(100, Math.round((ach.current / ach.target) * 100));

                  return (
                    <div
                      key={ach.id}
                      className={`p-4 rounded-2xl border transition-all space-y-3 ${
                        isUnlocked
                          ? 'bg-slate-950 border-emerald-500/40 shadow-lg shadow-emerald-950/20'
                          : 'bg-slate-950/60 border-white/10 opacity-90'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${ach.iconBg}`}>
                            {ach.icon}
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-bold text-white text-sm truncate flex items-center gap-1.5">
                              <span>{ach.title}</span>
                              {isUnlocked && (
                                <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
                              )}
                            </h4>
                            <p className="text-[11px] text-gray-400 line-clamp-1">{ach.description}</p>
                          </div>
                        </div>

                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${
                          isUnlocked 
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' 
                            : 'bg-purple-500/10 text-purple-300 border-purple-500/20'
                        }`}>
                          {isUnlocked ? 'Tamamlandı' : `%${percent}`}
                        </span>
                      </div>

                      {/* Progress bar & details */}
                      <div className="space-y-1 pt-1">
                        <div className="flex items-center justify-between text-[11px] font-bold">
                          <span className={isUnlocked ? 'text-emerald-400' : 'text-gray-400'}>
                            {ach.current} / {ach.target} {ach.unit}
                          </span>
                          <span className={isUnlocked ? 'text-emerald-400' : 'text-gray-400'}>
                            %{percent}
                          </span>
                        </div>
                        <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-white/5">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              isUnlocked 
                                ? 'bg-gradient-to-r from-emerald-500 to-teal-400' 
                                : 'bg-gradient-to-r from-purple-600 via-indigo-500 to-purple-500'
                            }`}
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
