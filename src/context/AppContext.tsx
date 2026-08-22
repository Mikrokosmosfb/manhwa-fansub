import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  User,
  Series,
  ReadingProgress,
  BookmarkFolder,
  BookmarkItem,
  NovelSettings,
  Comment,
  Announcement,
  SeriesRequest
} from '../types';
import { INITIAL_SERIES, INITIAL_ANNOUNCEMENT } from '../data/mockData';
import { SHOP_ITEMS, PROMO_CODES, THEME_STYLES, BASE_THEME_STYLES, ShopItem, ThemeStyle } from '../data/shopData';

type ViewState =
  | { type: 'home' }
  | { type: 'series-list' }
  | { type: 'series-detail'; seriesId: string }
  | { type: 'reader'; seriesId: string; chapterId: string }
  | { type: 'library' }
  | { type: 'az-list' }
  | { type: 'categories'; genre?: string }
  | { type: 'history' }
  | { type: 'request' }
  | { type: 'schedule' }
  | { type: 'request-board' }
  | { type: 'report' }
  | { type: 'join-team' }
  | { type: 'admin' }
  | { type: 'advanced-search' };

export const viewToHash = (v: ViewState): string => {
  switch (v.type) {
    case 'home':
      return '#/';
    case 'series-list':
      return '#/seriler';
    case 'series-detail':
      return `#/seri/${encodeURIComponent(v.seriesId)}`;
    case 'reader':
      return `#/oku/${encodeURIComponent(v.seriesId)}/${encodeURIComponent(v.chapterId)}`;
    case 'library':
      return '#/kutuphane';
    case 'az-list':
      return '#/a-z';
    case 'categories':
      return v.genre ? `#/kategoriler/${encodeURIComponent(v.genre)}` : '#/kategoriler';
    case 'history':
      return '#/gecmis';
    case 'request':
      return '#/istek-yap';
    case 'schedule':
      return '#/takvim';
    case 'request-board':
      return '#/istekler';
    case 'report':
      return '#/bildir';
    case 'join-team':
      return '#/ekibe-katil';
    case 'admin':
      return '#/admin';
    case 'advanced-search':
      return '#/gelismis-arama';
    default:
      return '#/';
  }
};

export const hashToView = (hash: string): ViewState => {
  const cleanHash = (hash || '').replace(/^#\/?/, '');
  if (!cleanHash) return { type: 'home' };

  const parts = cleanHash.split('/').map(p => decodeURIComponent(p));
  const route = parts[0];

  switch (route) {
    case 'seriler':
      return { type: 'series-list' };
    case 'seri':
      if (parts[1]) return { type: 'series-detail', seriesId: parts[1] };
      return { type: 'series-list' };
    case 'oku':
      if (parts[1] && parts[2]) return { type: 'reader', seriesId: parts[1], chapterId: parts[2] };
      return { type: 'home' };
    case 'kutuphane':
      return { type: 'library' };
    case 'a-z':
      return { type: 'az-list' };
    case 'kategoriler':
      return { type: 'categories', genre: parts[1] || undefined };
    case 'gecmis':
      return { type: 'history' };
    case 'takvim':
      return { type: 'schedule' };
    case 'istekler':
      return { type: 'request-board' };
    case 'istek-yap':
      return { type: 'request' };
    case 'bildir':
      return { type: 'report' };
    case 'ekibe-katil':
      return { type: 'join-team' };
    case 'admin':
      return { type: 'admin' };
    case 'gelismis-arama':
      return { type: 'advanced-search' };
    default:
      return { type: 'home' };
  }
};

interface AppContextType {
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  showNsfw: boolean;
  toggleNsfw: (val?: boolean) => void;
  view: ViewState;
  setView: (view: ViewState) => void;
  seriesList: Series[];
  setSeriesList: React.Dispatch<React.SetStateAction<Series[]>>;
  addOrUpdateSeries: (series: Series) => Promise<any>;
  addBatchSeries: (seriesBatch: Series[]) => Promise<any>;
  deleteSeries: (seriesId: string) => void;
  
  // Reading history
  readingHistory: Record<string, ReadingProgress>;
  updateReadingProgress: (seriesId: string, chapterId: string, chapterNumber: number, chapterTitle: string) => void;
  markChapterCompleted: (seriesId: string, chapterId: string, chapterNumber?: number, chapterTitle?: string) => void;
  toggleChapterRead: (seriesId: string, chapterId: string, chapterNumber?: number, chapterTitle?: string) => void;
  markAllChaptersRead: (seriesId: string) => void;
  markAllChaptersUnread: (seriesId: string) => void;
  
  // Bookmarks
  bookmarkFolders: BookmarkFolder[];
  addBookmarkFolder: (name: string) => void;
  deleteBookmarkFolder: (id: string) => void;
  reorderBookmarkFolders: (folders: BookmarkFolder[]) => void;
  bookmarks: Record<string, BookmarkItem>;
  toggleBookmark: (seriesId: string, folders: string[]) => void;
  removeBookmark: (seriesId: string) => void;
  
  // Novel Settings
  novelSettings: NovelSettings;
  updateNovelSettings: (settings: Partial<NovelSettings>) => void;
  resetNovelSettings: () => void;

  // Comments
  comments: Comment[];
  addComment: (comment: Omit<Comment, 'id' | 'date' | 'likes' | 'dislikes'>) => void;
  toggleLikeComment: (commentId: string, userId: string) => void;
  toggleDislikeComment: (commentId: string, userId: string) => void;
  deleteComment: (commentId: string) => void;
  reportComment: (commentId: string) => void;

  // Series Requests Board
  seriesRequests: SeriesRequest[];
  voteSeriesRequest: (requestId: string) => void;
  addSeriesRequest: (requestData: { title: string; type: SeriesRequest['type']; synopsis: string; requestedBy?: string }) => void;

  // User auth state
  user: User | null;
  isAuthModalOpen: boolean;
  authModalInitialTab: 'login' | 'register';
  openAuthModal: (defaultTab?: 'login' | 'register') => void;
  closeAuthModal: () => void;
  loginWithEmail: (email: string, pass: string) => Promise<{ success: boolean; message?: string }>;
  registerWithEmail: (name: string, email: string, pass: string) => Promise<{ success: boolean; message?: string }>;
  loginWithGoogle: (googleEmail: string) => Promise<{ success: boolean; message?: string }>;
  registerWithGoogle: (googleEmail: string, name?: string) => Promise<{ success: boolean; message?: string }>;
  updateUserProfile: (newName: string, newAvatar: string) => Promise<{ success: boolean; message?: string }>;
  deleteAccount: () => Promise<{ success: boolean; message?: string }>;
  logout: () => void;

  // Admin authentication
  isAdminLoggedIn: boolean;
  verifyAdminPassword: (password: string) => boolean;
  changeAdminPassword: (newPassword: string) => void;
  logoutAdmin: () => void;

  // Announcement
  announcement: Announcement;

  // Export / Backup
  exportBackupData: () => void;
  importBackupData: (jsonData: string) => boolean;

  // Shop & Rewards System
  isShopOpen: boolean;
  openShop: () => void;
  closeShop: () => void;
  shopItems: ShopItem[];
  themeStyles: Record<string, ThemeStyle>;
  updateShopItem: (itemId: string, updated: Partial<ShopItem>) => void;
  updateThemeStyle: (themeId: string, updated: Partial<ThemeStyle>) => void;
  addShopItemAndStyle: (item: ShopItem, style?: ThemeStyle) => void;
  deleteShopItemAndStyle: (itemId: string) => void;
  resetShopToDefault: () => void;
  earnPoints: (amount: number, reason: string) => void;
  addUnlimitedPoints: () => void;
  claimDailyCheckin: () => { success: boolean; message: string; pointsEarned?: number };
  spinDailyWheel: () => { success: boolean; message: string; pointsEarned?: number; prizeName?: string };
  buyShopItem: (itemId: string) => { success: boolean; message: string };
  equipTheme: (themeId: string | null) => void;
  equipBadge: (badgeText: string | null) => void;
  redeemPromoCode: (code: string) => { success: boolean; message: string; pointsEarned?: number };
}

const defaultNovelSettings: NovelSettings = {
  bgColor: '#1e1e1e',
  textColor: '#dddddd',
  fontSize: 18,
  fontFamily: 'Open Sans',
  lineHeight: '160%',
  textAlign: 'left',
  padding: '20px',
  widthMode: 'orta',
  isBold: false,
  scrollSpeed: 1,
};

const defaultFolders: BookmarkFolder[] = [
  { id: 'f-1', name: 'Okuyorum', isDefault: true },
  { id: 'f-2', name: 'Okuyacağım', isDefault: true },
  { id: 'f-3', name: 'Bitirdim', isDefault: true },
  { id: 'f-4', name: 'Bıraktım', isDefault: true },
];

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Theme state
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('mk_theme') as 'dark' | 'light') || 'dark';
  });

  // NSFW (+18) Content Filter state (Default: false / hidden)
  const [showNsfw, setShowNsfw] = useState<boolean>(() => {
    const saved = localStorage.getItem('mk_show_nsfw');
    if (saved !== null) return saved === 'true';
    const savedUser = localStorage.getItem('mk_user');
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        if (typeof parsed.showNsfw === 'boolean') return parsed.showNsfw;
      } catch (e) {}
    }
    return false; // Default OFF (18+ content hidden)
  });

  const toggleNsfw = (val?: boolean) => {
    setShowNsfw(prev => {
      const next = typeof val === 'boolean' ? val : !prev;
      localStorage.setItem('mk_show_nsfw', String(next));
      if (user) {
        const updatedUser = { ...user, showNsfw: next };
        setUser(updatedUser);
        localStorage.setItem('mk_user', JSON.stringify(updatedUser));
      }
      return next;
    });
  };

  // Navigation View with Browser History & Hash Sync
  const [view, setViewInternal] = useState<ViewState>(() => hashToView(window.location.hash));

  const setView = (newView: ViewState, replace = false) => {
    setViewInternal(newView);
    const targetHash = viewToHash(newView);
    if (window.location.hash !== targetHash) {
      if (replace) {
        window.history.replaceState(null, '', targetHash);
      } else {
        window.history.pushState(null, '', targetHash);
      }
    }
    window.scrollTo(0, 0);
  };

  useEffect(() => {
    const handleLocationChange = () => {
      const parsedView = hashToView(window.location.hash);
      setViewInternal(parsedView);
      window.scrollTo(0, 0);
    };

    if (!window.location.hash) {
      window.history.replaceState(null, '', '#/');
    }

    window.addEventListener('popstate', handleLocationChange);
    window.addEventListener('hashchange', handleLocationChange);

    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('hashchange', handleLocationChange);
    };
  }, []);

  // Series List
  const [seriesList, setSeriesList] = useState<Series[]>(() => {
    const saved = localStorage.getItem('mk_series_list');
    return saved ? JSON.parse(saved) : INITIAL_SERIES;
  });

  // Reading History
  const [readingHistory, setReadingHistory] = useState<Record<string, ReadingProgress>>(() => {
    const saved = localStorage.getItem('mk_reading_history');
    return saved ? JSON.parse(saved) : {};
  });

  // Bookmark Folders
  const [bookmarkFolders, setBookmarkFolders] = useState<BookmarkFolder[]>(() => {
    const saved = localStorage.getItem('mk_bookmark_folders');
    return saved ? JSON.parse(saved) : defaultFolders;
  });

  // Bookmarks Map (seriesId -> BookmarkItem)
  const [bookmarks, setBookmarks] = useState<Record<string, BookmarkItem>>(() => {
    const saved = localStorage.getItem('mk_bookmarks');
    return saved ? JSON.parse(saved) : {};
  });

  // Novel Settings
  const [novelSettings, setNovelSettings] = useState<NovelSettings>(() => {
    const saved = localStorage.getItem('mk_novel_settings');
    return saved ? JSON.parse(saved) : defaultNovelSettings;
  });

  // Comments State
  const [comments, setComments] = useState<Comment[]>(() => {
    const saved = localStorage.getItem('mk_comments');
    if (saved) return JSON.parse(saved);
    return [
      {
        id: 'cm-1',
        seriesId: 's-1',
        chapterId: 'c-orv-1',
        userId: 'u-101',
        userName: 'Aykut_Reader',
        userAvatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Aykut',
        text: 'Efsanevi bir giriş bölümüydü! Kim Dokja tam bir strateji dehası.',
        date: '2 saat önce',
        likes: ['u-102', 'u-103'],
        dislikes: [],
        isSpoiler: false,
      },
      {
        id: 'cm-2',
        seriesId: 's-2',
        chapterId: 'c-tcf-1',
        userId: 'u-102',
        userName: 'Zeynep_Novel',
        userAvatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Zeynep',
        text: 'Cale yine tembel hayatı yaşayacağını sanıyor ama her şey ters gidecek haha!',
        date: '1 gün önce',
        likes: ['u-101'],
        dislikes: [],
        isSpoiler: false,
      }
    ];
  });

  // Auth state
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('mk_user');
    if (!saved) {
      return {
        uid: 'u-guest',
        name: 'Okuyucu Misafir',
        email: 'misafir@mikrokosmos.com',
        avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Guest',
        provider: 'google',
        coins: 250,
        inventory: [],
        unlockedEmojiPacks: []
      };
    }
    try {
      const parsed = JSON.parse(saved);
      const isUnlimitedUser = parsed.email?.toLowerCase() === 'aseleliyeva77@gmail.com';
      return {
        ...parsed,
        coins: isUnlimitedUser ? 999999999 : (parsed.coins ?? 250),
        inventory: parsed.inventory || [],
        unlockedEmojiPacks: parsed.unlockedEmojiPacks || []
      };
    } catch (e) {
      return null;
    }
  });

  // Shop state
  const [isShopOpen, setIsShopOpen] = useState(false);
  const openShop = () => setIsShopOpen(true);
  const closeShop = () => setIsShopOpen(false);

  const [shopItems, setShopItems] = useState<ShopItem[]>(() => {
    const saved = localStorage.getItem('mk_shop_items');
    if (saved) {
      try {
        const savedItems: ShopItem[] = JSON.parse(saved);
        const savedMap = new Map(savedItems.map(item => [item.id, item]));
        const mergedDefault = SHOP_ITEMS.map(defaultItem => {
          return savedMap.has(defaultItem.id) ? { ...defaultItem, ...savedMap.get(defaultItem.id)! } : defaultItem;
        });
        const defaultIds = new Set(SHOP_ITEMS.map(i => i.id));
        const customSaved = savedItems.filter(i => !defaultIds.has(i.id));
        return [...mergedDefault, ...customSaved];
      } catch (e) {}
    }
    return SHOP_ITEMS;
  });

  const [themeStyles, setThemeStyles] = useState<Record<string, ThemeStyle>>(() => {
    const saved = localStorage.getItem('mk_theme_styles');
    if (saved) {
      try {
        const savedStyles = JSON.parse(saved);
        return { ...THEME_STYLES, ...savedStyles };
      } catch (e) {}
    }
    return THEME_STYLES;
  });

  useEffect(() => {
    localStorage.setItem('mk_shop_items', JSON.stringify(shopItems));
    SHOP_ITEMS.length = 0;
    SHOP_ITEMS.push(...shopItems);
  }, [shopItems]);

  useEffect(() => {
    localStorage.setItem('mk_theme_styles', JSON.stringify(themeStyles));
    Object.keys(THEME_STYLES).forEach(k => delete THEME_STYLES[k]);
    Object.assign(THEME_STYLES, themeStyles);
  }, [themeStyles]);

  const updateShopItem = (itemId: string, updated: Partial<ShopItem>) => {
    setShopItems(prev => prev.map(item => item.id === itemId ? { ...item, ...updated } : item));
    if (updated.name && themeStyles[itemId]) {
      setThemeStyles(prev => ({
        ...prev,
        [itemId]: { ...prev[itemId], name: updated.name! }
      }));
    }
  };

  const updateThemeStyle = (themeId: string, updated: Partial<ThemeStyle>) => {
    setThemeStyles(prev => ({
      ...prev,
      [themeId]: { ...prev[themeId], ...updated }
    }));
    setShopItems(prev => prev.map(item => {
      if (item.id === themeId) {
        return {
          ...item,
          name: updated.name ?? item.name,
        };
      }
      return item;
    }));
  };

  const addShopItemAndStyle = (item: ShopItem, style?: ThemeStyle) => {
    setShopItems(prev => [item, ...prev.filter(i => i.id !== item.id)]);
    if (style) {
      setThemeStyles(prev => ({
        ...prev,
        [item.id]: style
      }));
    }
  };

  const deleteShopItemAndStyle = (itemId: string) => {
    setShopItems(prev => prev.filter(i => i.id !== itemId));
    setThemeStyles(prev => {
      const next = { ...prev };
      delete next[itemId];
      return next;
    });
  };

  const resetShopToDefault = () => {
    localStorage.removeItem('mk_shop_items');
    localStorage.removeItem('mk_theme_styles');
    window.location.reload();
  };

  // Earn points (CP)
  const earnPoints = (amount: number, reason: string) => {
    setUser(prev => {
      if (!prev) return null;
      if (prev.email?.toLowerCase() === 'aseleliyeva77@gmail.com') {
        return { ...prev, coins: 999999999 };
      }
      const currentCoins = prev.coins ?? 250;
      return {
        ...prev,
        coins: currentCoins + amount
      };
    });
  };

  // Add Unlimited Points (+999.999 CP) - Only allowed for aseleliyeva77@gmail.com
  const addUnlimitedPoints = () => {
    setUser(prev => {
      if (!prev) return null;
      if (prev.email?.toLowerCase() !== 'aseleliyeva77@gmail.com') {
        alert('Sınırsız Cosmo-Puan yetkisi sadece aseleliyeva77@gmail.com hesabına tanımlıdır!');
        return prev;
      }
      return {
        ...prev,
        coins: 999999999
      };
    });
  };

  // Daily Check-in (+100 CP)
  const claimDailyCheckin = () => {
    if (!user) {
      openAuthModal('login');
      return { success: false, message: 'Giriş yapmalısınız.' };
    }
    const today = new Date().toISOString().slice(0, 10);
    if (user.lastDailyCheckin === today) {
      return { success: false, message: 'Bugünkü günlük ödülünüzü zaten aldınız! Yarın tekrar gelin.' };
    }
    const isUnlimited = user.email?.toLowerCase() === 'aseleliyeva77@gmail.com';
    const currentCoins = isUnlimited ? 999999999 : (user.coins ?? 250);
    const reward = 100;
    const updatedUser: User = {
      ...user,
      coins: isUnlimited ? 999999999 : currentCoins + reward,
      lastDailyCheckin: today
    };
    setUser(updatedUser);
    return { success: true, message: '🎉 Harika! +100 Cosmo-Puan günlük giriş ödülü hesabınıza eklendi!', pointsEarned: reward };
  };

  // Daily Lucky Wheel Spin
  const spinDailyWheel = () => {
    if (!user) {
      openAuthModal('login');
      return { success: false, message: 'Giriş yapmalısınız.' };
    }
    const today = new Date().toISOString().slice(0, 10);
    if (user.lastDailySpin === today) {
      return { success: false, message: 'Bugün şans çarkını zaten çevirdiniz! Yarın tekrar deneyin.' };
    }
    const rewards = [
      { pts: 50, name: '50 Cosmo-Puan' },
      { pts: 100, name: '100 Cosmo-Puan' },
      { pts: 150, name: '150 Cosmo-Puan' },
      { pts: 200, name: '200 Cosmo-Puan' },
      { pts: 300, name: '300 Cosmo-Puan!' }
    ];
    const prize = rewards[Math.floor(Math.random() * rewards.length)];
    const isUnlimited = user.email?.toLowerCase() === 'aseleliyeva77@gmail.com';
    const currentCoins = isUnlimited ? 999999999 : (user.coins ?? 250);
    const updatedUser: User = {
      ...user,
      coins: isUnlimited ? 999999999 : currentCoins + prize.pts,
      lastDailySpin: today
    };
    setUser(updatedUser);
    return {
      success: true,
      message: `🎉 Tebrikler! Şans Çarkından "${prize.name}" kazandınız!`,
      pointsEarned: prize.pts,
      prizeName: prize.name
    };
  };

  // Buy Shop Item
  const buyShopItem = (itemId: string) => {
    if (!user) {
      openAuthModal('login');
      return { success: false, message: 'Lütfen önce giriş yapın.' };
    }

    const item = SHOP_ITEMS.find(i => i.id === itemId);
    if (!item) return { success: false, message: 'Ürün bulunamadı.' };

    const userInventory = user.inventory || [];
    if (userInventory.includes(itemId)) {
      return { success: false, message: 'Bu ürüne zaten sahipsiniz!' };
    }

    const isUnlimited = user.email?.toLowerCase() === 'aseleliyeva77@gmail.com';
    const currentCoins = isUnlimited ? 999999999 : (user.coins ?? 250);
    if (!isUnlimited && currentCoins < item.price) {
      return { success: false, message: `Yetersiz Cosmo-Puan! Bu ürün için ${item.price} CP gerekiyor, bakiyeniz: ${currentCoins} CP.` };
    }

    const newInventory = [...userInventory, itemId];
    let updatedUser: User = {
      ...user,
      coins: isUnlimited ? 999999999 : Math.max(0, currentCoins - item.price),
      inventory: newInventory
    };

    if (item.category === 'theme') {
      updatedUser.equippedTheme = itemId;
    } else if (item.category === 'badge' && item.badgeText) {
      updatedUser.equippedBadge = item.badgeText;
    } else if (item.category === 'emoji_pack') {
      const currentEmojiPacks = user.unlockedEmojiPacks || [];
      if (!currentEmojiPacks.includes(itemId)) {
        updatedUser.unlockedEmojiPacks = [...currentEmojiPacks, itemId];
      }
    }

    setUser(updatedUser);

    fetch('/api/auth/update-profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        uid: user.uid,
        name: user.name,
        avatar: user.avatar,
        coins: updatedUser.coins,
        equippedTheme: updatedUser.equippedTheme,
        equippedBadge: updatedUser.equippedBadge
      })
    }).catch(() => {});

    return {
      success: true,
      message: `🎉 Tebrikler! "${item.name}" başarıyla satın alındı ve profilinize uygulandı!`
    };
  };

  // Equip Theme
  const equipTheme = (themeId: string | null) => {
    if (!user) return;
    const updatedUser: User = { ...user, equippedTheme: themeId };
    setUser(updatedUser);
  };

  // Equip Badge
  const equipBadge = (badgeText: string | null) => {
    if (!user) return;
    const updatedUser: User = { ...user, equippedBadge: badgeText };
    setUser(updatedUser);
  };

  // Redeem Promo Code
  const redeemPromoCode = (code: string) => {
    if (!user) {
      openAuthModal('login');
      return { success: false, message: 'Giriş yapmalısınız.' };
    }
    const cleanCode = code.trim().toUpperCase();
    const promo = PROMO_CODES[cleanCode];
    if (!promo) {
      return { success: false, message: 'Geçersiz promosyon kodu.' };
    }

    const userInventory = user.inventory || [];
    const promoKey = `promo_${cleanCode}`;
    if (userInventory.includes(promoKey)) {
      return { success: false, message: 'Bu promosyon kodunu daha önce kullandınız.' };
    }

    const isUnlimited = user.email?.toLowerCase() === 'aseleliyeva77@gmail.com';
    const currentCoins = isUnlimited ? 999999999 : (user.coins ?? 250);
    const updatedUser: User = {
      ...user,
      coins: isUnlimited ? 999999999 : currentCoins + promo.points,
      inventory: [...userInventory, promoKey]
    };
    setUser(updatedUser);

    return {
      success: true,
      message: `🎁 Harika! "${cleanCode}" kodundan +${promo.points} Cosmo-Puan hesabınıza yüklendi! (${promo.description})`,
      pointsEarned: promo.points
    };
  };

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalInitialTab, setAuthModalInitialTab] = useState<'login' | 'register'>('login');

  const openAuthModal = (defaultTab: 'login' | 'register' = 'login') => {
    setAuthModalInitialTab(defaultTab);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
  };

  useEffect(() => {
    if (user) {
      localStorage.setItem('mk_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('mk_user');
    }
  }, [user]);

  // Series Requests State
  const [seriesRequests, setSeriesRequests] = useState<SeriesRequest[]>(() => {
    const saved = localStorage.getItem('mk_series_requests');
    if (saved) return JSON.parse(saved);
    return [
      {
        id: 'req-1',
        title: 'Pick Me Up! Infinite Gacha',
        type: 'Manhwa',
        synopsis: 'Mobil gacha oyununda en üst sıralardaki oyuncu Loki, oyunun içine bir seviye köle olarak çekilir. Hayatta kalmak için zindanı fethedecek!',
        votes: 142,
        votedUserIds: ['u-101'],
        status: 'Çevriliyor',
        requestedBy: 'Solo_Gamer',
        createdAt: '2 gün önce',
        coverImage: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=400&auto=format&fit=crop&q=80'
      },
      {
        id: 'req-2',
        title: 'The Great Mage Returns After 4000 Years',
        type: 'Manhwa',
        synopsis: 'En büyük büyücü Lucas Trowman, 4000 yıl sonra yeteneksiz bir akademilinin bedeninde uyanır.',
        votes: 98,
        votedUserIds: [],
        status: 'Takvime Eklendi',
        requestedBy: 'MageMaster',
        createdAt: '4 gün önce',
        coverImage: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=400&auto=format&fit=crop&q=80'
      },
      {
        id: 'req-3',
        title: 'S-Rank That I Raised',
        type: 'Web Novel',
        synopsis: 'Zayıf F-Seviye avcı Han Yoojin, küçük kardeşini kurtardıktan sonra geçmişe döner.',
        votes: 76,
        votedUserIds: [],
        status: 'İncelemede',
        requestedBy: 'K-NovelFan',
        createdAt: '1 hafta önce',
        coverImage: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400&auto=format&fit=crop&q=80'
      },
      {
        id: 'req-4',
        title: 'Trash of the Count\'s Family (Manhwa)',
        type: 'Manhwa',
        synopsis: 'Cale Henituse olarak uyanan gencin tembel ve huzurlu bir yaşam sürme çabası.',
        votes: 215,
        votedUserIds: [],
        status: 'Çevriliyor',
        requestedBy: 'CaleFan',
        createdAt: '2 hafta önce',
        coverImage: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=400&auto=format&fit=crop&q=80'
      }
    ];
  });

  const [announcement] = useState<Announcement>(INITIAL_ANNOUNCEMENT);

  // Admin Authentication State
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState<boolean>(() => {
    return localStorage.getItem('mk_admin_logged_in') === 'true';
  });

  const [adminPassword, setAdminPassword] = useState<string>(() => {
    const saved = localStorage.getItem('mk_admin_pin');
    return saved && saved !== '1234' ? saved : '45464';
  });

  const verifyAdminPassword = (password: string): boolean => {
    if (password.trim() === adminPassword) {
      setIsAdminLoggedIn(true);
      localStorage.setItem('mk_admin_logged_in', 'true');
      return true;
    }
    return false;
  };

  const changeAdminPassword = (newPassword: string) => {
    setAdminPassword(newPassword.trim());
    localStorage.setItem('mk_admin_pin', newPassword.trim());
  };

  const logoutAdmin = () => {
    setIsAdminLoggedIn(false);
    localStorage.removeItem('mk_admin_logged_in');
  };

  // Attempt to fetch live Cloudflare R2/KV data on mount
  useEffect(() => {
    fetch('/api/series')
      .then(res => res.json())
      .then(data => {
        if (data.success && Array.isArray(data.data) && data.data.length > 0) {
          setSeriesList(data.data);
        }
      })
      .catch(() => {});

    fetch('/api/comments')
      .then(res => res.json())
      .then(data => {
        if (data.success && Array.isArray(data.data) && data.data.length > 0) {
          setComments(data.data);
        }
      })
      .catch(() => {});
  }, []);

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem('mk_theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.add('dark-mode');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.remove('dark-mode');
      document.documentElement.classList.add('light');
    }
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('mk_series_requests', JSON.stringify(seriesRequests));
  }, [seriesRequests]);

  useEffect(() => {
    localStorage.setItem('mk_series_list', JSON.stringify(seriesList));
  }, [seriesList]);

  useEffect(() => {
    localStorage.setItem('mk_reading_history', JSON.stringify(readingHistory));
  }, [readingHistory]);

  useEffect(() => {
    localStorage.setItem('mk_bookmark_folders', JSON.stringify(bookmarkFolders));
  }, [bookmarkFolders]);

  useEffect(() => {
    localStorage.setItem('mk_bookmarks', JSON.stringify(bookmarks));
  }, [bookmarks]);

  useEffect(() => {
    localStorage.setItem('mk_novel_settings', JSON.stringify(novelSettings));
  }, [novelSettings]);

  useEffect(() => {
    localStorage.setItem('mk_comments', JSON.stringify(comments));
  }, [comments]);

  useEffect(() => {
    if (user) {
      localStorage.setItem('mk_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('mk_user');
    }
  }, [user]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  const addOrUpdateSeries = async (newSeries: Series) => {
    setSeriesList(prev => {
      const idx = prev.findIndex(s => s.id === newSeries.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = newSeries;
        return copy;
      }
      return [newSeries, ...prev];
    });

    try {
      const res = await fetch('/api/series', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ series: newSeries })
      });
      const text = await res.text();
      let data: any = {};
      try {
        data = JSON.parse(text);
      } catch (e) {
        return { success: false, error: `Sunucu geçersiz yanıt verdi (HTTP ${res.status})` };
      }
      if (!data.success && !data.error) {
        data.error = data.message || `Sunucu hatası (HTTP ${res.status})`;
      }
      return data;
    } catch (err: any) {
      return { success: false, error: err?.message || 'Ağ hatası' };
    }
  };

  const addBatchSeries = async (seriesBatch: Series[]) => {
    if (!seriesBatch || seriesBatch.length === 0) return { success: true, message: 'Boş liste' };

    setSeriesList(prev => {
      const copy = [...prev];
      seriesBatch.forEach(newSeries => {
        const idx = copy.findIndex(s => s.id === newSeries.id || (s.slug && s.slug === newSeries.slug));
        if (idx >= 0) {
          copy[idx] = newSeries;
        } else {
          copy.unshift(newSeries);
        }
      });
      return copy;
    });

    // Send series in small chunks to prevent exceeding Cloudflare Workers payload/timeout limits
    const CHUNK_SIZE = 2;
    let lastResult: any = { success: true };
    for (let i = 0; i < seriesBatch.length; i += CHUNK_SIZE) {
      const chunk = seriesBatch.slice(i, i + CHUNK_SIZE);
      try {
        const res = await fetch('/api/series', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ seriesList: chunk })
        });
        const text = await res.text();
        let data: any = {};
        try {
          data = JSON.parse(text);
        } catch (e) {
          data = { success: false, error: `Sunucu geçersiz yanıt verdi (HTTP ${res.status})` };
        }
        if (!data.success) {
          if (!data.error) data.error = data.message || `Sunucu hatası (HTTP ${res.status})`;
          lastResult = data;
        } else {
          lastResult = data;
        }
      } catch (err: any) {
        lastResult = { success: false, error: err?.message || 'Ağ hatası' };
      }
    }
    return lastResult;
  };

  const deleteSeries = (seriesId: string) => {
    setSeriesList(prev => prev.filter(s => s.id !== seriesId));

    // Automatic Delete from Cloudflare Storage API
    fetch(`/api/series?id=${encodeURIComponent(seriesId)}`, {
      method: 'DELETE'
    }).catch(() => {
      // Quiet failover
    });
  };

  const updateReadingProgress = (
    seriesId: string,
    chapterId: string,
    chapterNumber: number,
    chapterTitle: string
  ) => {
    setReadingHistory(prev => {
      const existing = prev[seriesId];
      const existingReadIds = existing?.readChapterIds || [];

      return {
        ...prev,
        [seriesId]: {
          seriesId,
          lastChapterId: chapterId,
          lastChapterNumber: chapterNumber,
          lastChapterTitle: chapterTitle,
          readAt: new Date().toISOString(),
          readChapterIds: existingReadIds
        }
      };
    });
  };

  const markChapterCompleted = (
    seriesId: string,
    chapterId: string,
    chapterNumber?: number,
    chapterTitle?: string
  ) => {
    setReadingHistory(prev => {
      const existing = prev[seriesId];
      const existingReadIds = existing?.readChapterIds || [];
      if (existingReadIds.includes(chapterId)) {
        return prev; // Already completed
      }

      const updatedReadIds = [...existingReadIds, chapterId];
      const targetSeries = seriesList.find(s => s.id === seriesId);
      const targetChapter = targetSeries?.chapters.find(c => c.id === chapterId);
      const num = chapterNumber ?? targetChapter?.number ?? existing?.lastChapterNumber ?? 1;
      const title = chapterTitle ?? targetChapter?.title ?? existing?.lastChapterTitle ?? `Bölüm ${num}`;

      return {
        ...prev,
        [seriesId]: {
          seriesId,
          lastChapterId: chapterId,
          lastChapterNumber: num,
          lastChapterTitle: title,
          readAt: new Date().toISOString(),
          readChapterIds: updatedReadIds
        }
      };
    });

    // Award +15 Cosmo-Puan for finishing 100% of chapter
    if (user) {
      earnPoints(15, 'Bölüm Okuma');
    }
  };

  const toggleChapterRead = (
    seriesId: string,
    chapterId: string,
    chapterNumber?: number,
    chapterTitle?: string
  ) => {
    setReadingHistory(prev => {
      const existing = prev[seriesId];
      const existingReadIds = existing?.readChapterIds || [];
      const isAlreadyRead = existingReadIds.includes(chapterId);
      
      let updatedReadIds: string[];
      if (isAlreadyRead) {
        updatedReadIds = existingReadIds.filter(id => id !== chapterId);
      } else {
        updatedReadIds = [...existingReadIds, chapterId];
      }

      const targetSeries = seriesList.find(s => s.id === seriesId);
      const targetChapter = targetSeries?.chapters.find(c => c.id === chapterId);
      const num = chapterNumber ?? targetChapter?.number ?? 1;
      const title = chapterTitle ?? targetChapter?.title ?? `Bölüm ${num}`;

      const lastId = isAlreadyRead
        ? (existing?.lastChapterId === chapterId ? (updatedReadIds[updatedReadIds.length - 1] || '') : (existing?.lastChapterId || ''))
        : chapterId;

      return {
        ...prev,
        [seriesId]: {
          seriesId,
          lastChapterId: lastId,
          lastChapterNumber: isAlreadyRead ? (existing?.lastChapterNumber || num) : num,
          lastChapterTitle: isAlreadyRead ? (existing?.lastChapterTitle || title) : title,
          readAt: new Date().toISOString(),
          readChapterIds: updatedReadIds
        }
      };
    });
  };

  const markAllChaptersRead = (seriesId: string) => {
    const targetSeries = seriesList.find(s => s.id === seriesId);
    if (!targetSeries || targetSeries.chapters.length === 0) return;
    const allIds = targetSeries.chapters.map(c => c.id);
    const lastCh = targetSeries.chapters[targetSeries.chapters.length - 1];

    setReadingHistory(prev => ({
      ...prev,
      [seriesId]: {
        seriesId,
        lastChapterId: lastCh.id,
        lastChapterNumber: lastCh.number,
        lastChapterTitle: lastCh.title,
        readAt: new Date().toISOString(),
        readChapterIds: allIds
      }
    }));
  };

  const markAllChaptersUnread = (seriesId: string) => {
    setReadingHistory(prev => {
      const next = { ...prev };
      delete next[seriesId];
      return next;
    });
  };

  const addBookmarkFolder = (name: string) => {
    if (!name.trim()) return;
    if (bookmarkFolders.some(f => f.name.toLowerCase() === name.trim().toLowerCase())) return;
    const newFolder: BookmarkFolder = {
      id: 'f-' + Date.now(),
      name: name.trim()
    };
    setBookmarkFolders(prev => [...prev, newFolder]);
  };

  const deleteBookmarkFolder = (id: string) => {
    const targetFolder = bookmarkFolders.find(f => f.id === id);
    if (!targetFolder || targetFolder.isDefault) return;
    setBookmarkFolders(prev => prev.filter(f => f.id !== id));
    // Remove folder reference from bookmarks
    setBookmarks(prev => {
      const copy = { ...prev };
      Object.keys(copy).forEach(sId => {
        copy[sId] = {
          ...copy[sId],
          folders: copy[sId].folders.filter(fName => fName !== targetFolder.name)
        };
      });
      return copy;
    });
  };

  const reorderBookmarkFolders = (folders: BookmarkFolder[]) => {
    setBookmarkFolders(folders);
  };

  const toggleBookmark = (seriesId: string, folders: string[]) => {
    if (folders.length === 0) {
      removeBookmark(seriesId);
      return;
    }
    setBookmarks(prev => ({
      ...prev,
      [seriesId]: {
        seriesId,
        folders,
        addedAt: new Date().toISOString()
      }
    }));
  };

  const removeBookmark = (seriesId: string) => {
    setBookmarks(prev => {
      const copy = { ...prev };
      delete copy[seriesId];
      return copy;
    });
  };

  const updateNovelSettings = (settings: Partial<NovelSettings>) => {
    setNovelSettings(prev => ({ ...prev, ...settings }));
  };

  const resetNovelSettings = () => {
    setNovelSettings(defaultNovelSettings);
  };

  const addComment = (data: Omit<Comment, 'id' | 'date' | 'likes' | 'dislikes'>) => {
    const newCm: Comment = {
      ...data,
      id: 'cm-' + Date.now(),
      date: 'Az önce',
      likes: [],
      dislikes: [],
      equippedTheme: user?.equippedTheme || null,
      equippedBadge: user?.equippedBadge || null
    };
    setComments(prev => [newCm, ...prev]);

    // Award +10 Cosmo-Puan for posting a comment
    if (user) {
      earnPoints(10, 'Yorum Yapma');
    }

    fetch('/api/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newCm)
    }).catch(() => {});
  };

  const toggleLikeComment = (commentId: string, userId: string) => {
    setComments(prev =>
      prev.map(c => {
        if (c.id !== commentId) return c;
        const hasLiked = c.likes.includes(userId);
        const newLikes = hasLiked ? c.likes.filter(id => id !== userId) : [...c.likes, userId];
        const newDislikes = c.dislikes.filter(id => id !== userId);
        return { ...c, likes: newLikes, dislikes: newDislikes };
      })
    );
  };

  const toggleDislikeComment = (commentId: string, userId: string) => {
    setComments(prev =>
      prev.map(c => {
        if (c.id !== commentId) return c;
        const hasDisliked = c.dislikes.includes(userId);
        const newDislikes = hasDisliked
          ? c.dislikes.filter(id => id !== userId)
          : [...c.dislikes, userId];
        const newLikes = c.likes.filter(id => id !== userId);
        return { ...c, likes: newLikes, dislikes: newDislikes };
      })
    );
  };

  const deleteComment = (commentId: string) => {
    setComments(prev => prev.filter(c => c.id !== commentId));

    fetch(`/api/comments?id=${encodeURIComponent(commentId)}`, {
      method: 'DELETE'
    }).catch(() => {});
  };

  const reportComment = (commentId: string) => {
    setComments(prev =>
      prev.map(c => (c.id === commentId ? { ...c, reported: true } : c))
    );
  };

  const voteSeriesRequest = (requestId: string) => {
    const currentUserId = user?.uid || 'anonymous-user';
    setSeriesRequests(prev =>
      prev.map(req => {
        if (req.id !== requestId) return req;
        const hasVoted = req.votedUserIds.includes(currentUserId);
        const newVotedUserIds = hasVoted
          ? req.votedUserIds.filter(id => id !== currentUserId)
          : [...req.votedUserIds, currentUserId];
        const newVotes = hasVoted ? req.votes - 1 : req.votes + 1;
        return {
          ...req,
          votes: newVotes,
          votedUserIds: newVotedUserIds
        };
      })
    );
  };

  const addSeriesRequest = (data: {
    title: string;
    type: SeriesRequest['type'];
    synopsis: string;
    requestedBy?: string;
  }) => {
    const currentUserId = user?.uid || 'anonymous-user';
    const newReq: SeriesRequest = {
      id: 'req-' + Date.now(),
      title: data.title,
      type: data.type,
      synopsis: data.synopsis,
      votes: 1,
      votedUserIds: [currentUserId],
      status: 'İncelemede',
      requestedBy: data.requestedBy || user?.name || 'Okuyucu',
      createdAt: 'Az önce',
      coverImage: 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=400&auto=format&fit=crop&q=80'
    };
    setSeriesRequests(prev => [newReq, ...prev]);
  };

  const prepareUserCoins = (u: User): User => {
    const isUnlimited = u.email?.toLowerCase() === 'aseleliyeva77@gmail.com';
    return {
      ...u,
      coins: isUnlimited ? 999999999 : (u.coins ?? 250)
    };
  };

  const loginWithEmail = async (email: string, pass: string): Promise<{ success: boolean; message?: string }> => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: pass })
      });
      const data = await res.json() as any;
      if (data.success && data.user) {
        setUser(prepareUserCoins(data.user));
        return { success: true };
      }
      return { success: false, message: data.message || 'Giriş yapılamadı.' };
    } catch (e) {
      // Fallback local auth
      const u: User = {
        uid: 'u-' + Date.now(),
        name: email.split('@')[0],
        email,
        avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(email)}`,
        provider: 'email',
        coins: email.toLowerCase() === 'aseleliyeva77@gmail.com' ? 999999999 : 250
      };
      setUser(u);
      return { success: true };
    }
  };

  const registerWithEmail = async (name: string, email: string, pass: string): Promise<{ success: boolean; message?: string }> => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password: pass })
      });
      const data = await res.json() as any;
      if (data.success && data.user) {
        setUser(prepareUserCoins(data.user));
        return { success: true };
      }
      return { success: false, message: data.message || 'Kayıt yapılamadı.' };
    } catch (e) {
      // Fallback local register
      const u: User = {
        uid: 'u-' + Date.now(),
        name,
        email,
        avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(name)}`,
        provider: 'email',
        coins: email.toLowerCase() === 'aseleliyeva77@gmail.com' ? 999999999 : 250
      };
      setUser(u);
      return { success: true };
    }
  };

  const loginWithGoogle = async (googleEmail: string): Promise<{ success: boolean; message?: string }> => {
    try {
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'login',
          email: googleEmail.trim()
        })
      });
      const data = await res.json() as any;
      if (data.success && data.user) {
        const prepared = prepareUserCoins(data.user);
        setUser(prepared);
        localStorage.setItem('mk_user', JSON.stringify(prepared));
        return { success: true, message: 'Google hesabınızla başarıyla giriş yapıldı!' };
      }
      return { success: false, message: data.message || 'Giriş yapılamadı.' };
    } catch (e) {
      return { success: false, message: 'Sunucuya bağlanırken bir hata oluştu.' };
    }
  };

  const registerWithGoogle = async (googleEmail: string, googleName?: string): Promise<{ success: boolean; message?: string }> => {
    try {
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'register',
          email: googleEmail.trim(),
          name: googleName ? googleName.trim() : undefined
        })
      });
      const data = await res.json() as any;
      if (data.success && data.user) {
        const prepared = prepareUserCoins(data.user);
        setUser(prepared);
        localStorage.setItem('mk_user', JSON.stringify(prepared));
        return { success: true, message: data.message || 'Google ile üyeliğiniz başarıyla oluşturuldu!' };
      }
      return { success: false, message: data.message || 'Kayıt yapılamadı.' };
    } catch (e) {
      return { success: false, message: 'Sunucuya bağlanırken bir hata oluştu.' };
    }
  };

  const updateUserProfile = async (newName: string, newAvatar: string): Promise<{ success: boolean; message?: string }> => {
    if (!user) return { success: false, message: 'Giriş yapılmamış.' };
    try {
      const res = await fetch('/api/auth/update-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: user.uid,
          name: newName,
          avatar: newAvatar
        })
      });
      const data = await res.json() as any;
      if (data.success) {
        const updatedUser: User = {
          ...user,
          name: newName,
          avatar: newAvatar
        };
        setUser(updatedUser);
        return { success: true, message: data.message };
      }
      return { success: false, message: data.message || 'Profil güncellenemedi.' };
    } catch (e: any) {
      const updatedUser: User = { ...user, name: newName, avatar: newAvatar };
      setUser(updatedUser);
      return { success: true, message: 'Profil yerel olarak güncellendi.' };
    }
  };

  const deleteAccount = async (): Promise<{ success: boolean; message?: string }> => {
    if (!user) return { success: false, message: 'Giriş yapılmamış.' };
    try {
      const res = await fetch('/api/auth/delete-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: user.uid,
          email: user.email
        })
      });
      const data = await res.json() as any;
      
      setUser(null);
      localStorage.removeItem('mk_user');
      
      return { success: true, message: data.message || 'Hesabınız Mikrokosmos Fansub veritabanından başarıyla silindi.' };
    } catch (e) {
      setUser(null);
      localStorage.removeItem('mk_user');
      return { success: true, message: 'Hesabınız silindi.' };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('mk_user');
  };

  const exportBackupData = () => {
    const data = {
      seriesList,
      bookmarks,
      bookmarkFolders,
      readingHistory,
      novelSettings
    };
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mikrokosmos_kutuphane_yedek_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importBackupData = (jsonData: string): boolean => {
    try {
      const parsed = JSON.parse(jsonData);
      if (parsed.bookmarks) setBookmarks(parsed.bookmarks);
      if (parsed.bookmarkFolders) setBookmarkFolders(parsed.bookmarkFolders);
      if (parsed.readingHistory) setReadingHistory(parsed.readingHistory);
      if (parsed.novelSettings) setNovelSettings(parsed.novelSettings);
      if (parsed.seriesList) setSeriesList(parsed.seriesList);
      return true;
    } catch (e) {
      console.error('Failed to import backup JSON', e);
      return false;
    }
  };

  return (
    <AppContext.Provider
      value={{
        theme,
        toggleTheme,
        showNsfw,
        toggleNsfw,
        view,
        setView,
        seriesList,
        setSeriesList,
        addOrUpdateSeries,
        addBatchSeries,
        deleteSeries,
        readingHistory,
        updateReadingProgress,
        markChapterCompleted,
        toggleChapterRead,
        markAllChaptersRead,
        markAllChaptersUnread,
        bookmarkFolders,
        addBookmarkFolder,
        deleteBookmarkFolder,
        reorderBookmarkFolders,
        bookmarks,
        toggleBookmark,
        removeBookmark,
        novelSettings,
        updateNovelSettings,
        resetNovelSettings,
        comments,
        addComment,
        toggleLikeComment,
        toggleDislikeComment,
        deleteComment,
        reportComment,
        seriesRequests,
        voteSeriesRequest,
        addSeriesRequest,
        user,
        isAuthModalOpen,
        authModalInitialTab,
        openAuthModal,
        closeAuthModal,
        loginWithEmail,
        registerWithEmail,
        loginWithGoogle,
        registerWithGoogle,
        updateUserProfile,
        deleteAccount,
        logout,
        isAdminLoggedIn,
        verifyAdminPassword,
        changeAdminPassword,
        logoutAdmin,
        announcement,
        exportBackupData,
        importBackupData,
        isShopOpen,
        openShop,
        closeShop,
        shopItems,
        themeStyles,
        updateShopItem,
        updateThemeStyle,
        addShopItemAndStyle,
        deleteShopItemAndStyle,
        resetShopToDefault,
        earnPoints,
        addUnlimitedPoints,
        claimDailyCheckin,
        spinDailyWheel,
        buyShopItem,
        equipTheme,
        equipBadge,
        redeemPromoCode
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
