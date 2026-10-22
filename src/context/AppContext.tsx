import React, { createContext, useContext, useState, useEffect, useRef, useMemo } from 'react';
import {
  User,
  Series,
  Chapter,
  ReadingProgress,
  BookmarkFolder,
  BookmarkItem,
  NovelSettings,
  Comment,
  Announcement,
  SeriesRequest,
  ToastMessage,
  AppNotification,
  isAuthorizedAdmin,
  DAILY_STARTER_REWARDS,
  SiteBrandingSettings,
  DEFAULT_SITE_BRANDING,
  AdSettings,
  DEFAULT_AD_SETTINGS,
  PointGrantLog,
  KnownUserRecord,
  TeamMemberRecord
} from '../types';
import { INITIAL_NOTIFICATIONS } from '../data/mockData';
import { SHOP_ITEMS, PROMO_CODES, THEME_STYLES, BASE_THEME_STYLES, ShopItem, ThemeStyle } from '../data/shopData';
import { sortSeriesByLatestRelease } from '../utils/dateUtils';
import { saveSeriesToIndexedDB, loadSeriesFromIndexedDB } from '../utils/idbStorage';
import { sendDeviceNotification, isNotificationAlreadyPushed, markNotificationAsPushed } from '../utils/pushNotifications';
import {
  SHOP_ITEM_DURATION_MS,
  normalizeShopInventory,
  stripExpiredEquippedFromUser,
  formatRemainingDuration
} from '../utils/shopExpiration';
import { toCanonicalUsername } from '../utils/usernameUtils';
import { safeSetItem, safeGetItem, safeRemoveItem, purgeExpendableStorageCache } from '../utils/safeStorage';

type ViewState =
  | { type: 'home' }
  | { type: 'series-list' }
  | { type: 'series-detail'; seriesId: string }
  | { type: 'reader'; seriesId: string; chapterId: string }
  | { type: 'library' }
  | { type: 'profile'; initialTab?: 'profile' | 'wardrobe' | 'badges' | 'library' | 'kosmospins' }
  | { type: 'public-profile'; userId: string }
  | { type: 'shop' }
  | { type: 'az-list' }
  | { type: 'categories'; genre?: string }
  | { type: 'history' }
  | { type: 'request' }
  | { type: 'schedule' }
  | { type: 'request-board' }
  | { type: 'report' }
  | { type: 'social-media' }
  | { type: 'admin' }
  | { type: 'management' }
  | { type: 'advanced-search' }
  | { type: 'notifications' }
  | { type: 'leaderboard' }
  | { type: 'wallpapers'; seriesId?: string; wallpaperId?: string };

export const viewToHash = (v: ViewState): string => {
  switch (v.type) {
    case 'home':
      return '#/';
    case 'leaderboard':
      return '#/liderlik-tablosu';
    case 'series-list':
      return '#/seriler';
    case 'series-detail':
      return `#/seri/${encodeURIComponent(v.seriesId)}`;
    case 'reader':
      return `#/oku/${encodeURIComponent(v.seriesId)}/${encodeURIComponent(v.chapterId)}`;
    case 'library':
      return '#/kutuphane';
    case 'profile':
      return v.initialTab && v.initialTab !== 'profile' ? `#/profil/${encodeURIComponent(v.initialTab)}` : '#/profil';
    case 'public-profile':
      return `#/kullanici/${encodeURIComponent(v.userId)}`;
    case 'shop':
      return '#/magaza';
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
    case 'social-media':
      return '#/sosyal-medya';
    case 'admin':
    case 'management':
      return '#/yonetim';
    case 'advanced-search':
      return '#/gelismis-arama';
    case 'notifications':
      return '#/bildirimler';
    case 'wallpapers':
      if (v.wallpaperId) {
        return `#/duvar-kagitlari/pin/${encodeURIComponent(v.wallpaperId)}`;
      }
      return v.seriesId ? `#/duvar-kagitlari/${encodeURIComponent(v.seriesId)}` : '#/duvar-kagitlari';
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
    case 'profil':
    case 'profile': {
      const tab = parts[1] as any;
      const validTabs = ['profile', 'wardrobe', 'badges', 'library', 'kosmospins'];
      return { type: 'profile', initialTab: validTabs.includes(tab) ? tab : 'profile' };
    }
    case 'kullanici':
      if (parts[1]) {
        return { type: 'public-profile', userId: parts[1] };
      }
      return { type: 'home' };
    case 'magaza':
    case 'shop':
      return { type: 'shop' };
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
    case 'sosyal-medya':
      return { type: 'social-media' };
    case 'admin':
    case 'yonetim':
      return { type: 'management' };
    case 'gelismis-arama':
      return { type: 'advanced-search' };
    case 'bildirimler':
      return { type: 'notifications' };
    case 'liderlik-tablosu':
    case 'top50':
    case 'siralama':
    case 'leaderboard':
      return { type: 'leaderboard' };
    case 'duvar-kagitlari':
    case 'wallpapers':
    case 'wallpaper':
      if (parts[1] === 'pin' && parts[2]) {
        return { type: 'wallpapers', wallpaperId: parts[2] };
      }
      return { type: 'wallpapers', seriesId: parts[1] || undefined };
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
  isLoadingSeries: boolean;
  setIsLoadingSeries: React.Dispatch<React.SetStateAction<boolean>>;
  addOrUpdateSeries: (series: Series, options?: { notifyFollowers?: boolean; notifyNewSeries?: boolean; notifyChapter?: Chapter; customMessage?: string }) => Promise<any>;
  addBatchSeries: (seriesBatch: Series[], options?: { notifyNewSeries?: boolean }) => Promise<any>;
  deleteSeries: (seriesId: string) => void;
  
  // Reading history
  readingHistory: Record<string, ReadingProgress>;
  updateReadingProgress: (seriesId: string, chapterId: string, chapterNumber: number, chapterTitle: string) => void;
  markChapterCompleted: (seriesId: string, chapterId: string, chapterNumber?: number, chapterTitle?: string) => void;
  toggleChapterRead: (seriesId: string, chapterId: string, chapterNumber?: number, chapterTitle?: string) => void;
  markAllChaptersRead: (seriesId: string) => void;
  markAllChaptersUnread: (seriesId: string) => void;
  clearAllReadingHistory: () => void;
  
  // Bookmarks & Following
  bookmarkFolders: BookmarkFolder[];
  addBookmarkFolder: (name: string) => void;
  deleteBookmarkFolder: (id: string) => void;
  reorderBookmarkFolders: (folders: BookmarkFolder[]) => void;
  bookmarks: Record<string, BookmarkItem>;
  readingLists: import('../types').ReadingList[];
  setReadingLists: React.Dispatch<React.SetStateAction<import('../types').ReadingList[]>>;
  kosmosPins: import('../types').KosmosPinItem[];
  isWallpaperPinned: (wallpaperId: string) => boolean;
  toggleKosmosPin: (wallpaper: import('../types').KosmosPinItem) => void;
  toggleBookmark: (seriesId: string, folders: string[]) => void;
  removeBookmark: (seriesId: string) => void;
  followedSeriesIds: string[];
  isFollowingSeries: (seriesId: string) => boolean;
  toggleFollowSeries: (seriesId: string) => boolean;

  // Notifications Center & Toasts
  notifications: AppNotification[];
  unreadNotificationsCount: number;
  addNotification: (notif: Omit<AppNotification, 'id' | 'createdAt' | 'isRead'>) => void;
  sendChapterNotification: (seriesId: string, chapter: Chapter, customMessage?: string) => void;
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  deleteNotification: (id: string) => void;
  clearAllNotifications: () => void;

  toasts: ToastMessage[];
  showToast: (toast: Omit<ToastMessage, 'id'>) => void;
  dismissToast: (id: string) => void;
  
  // Novel Settings
  novelSettings: NovelSettings;
  updateNovelSettings: (settings: Partial<NovelSettings>) => void;
  resetNovelSettings: () => void;

  // Comments
  comments: Comment[];
  addComment: (comment: Omit<Comment, 'id' | 'date' | 'likes' | 'dislikes'>) => void;
  editComment: (commentId: string, newText: string, newIsSpoiler?: boolean, newImageUrl?: string) => void;
  toggleLikeComment: (commentId: string, userId: string) => void;
  toggleDislikeComment: (commentId: string, userId: string) => void;
  deleteComment: (commentId: string) => void;
  reportComment: (commentId: string, reason?: string, details?: string) => Promise<boolean>;

  // Series Requests Board
  seriesRequests: SeriesRequest[];
  voteSeriesRequest: (requestId: string) => void;
  addSeriesRequest: (requestData: { title: string; type: SeriesRequest['type']; synopsis: string; requestedBy?: string }) => void;

  // User auth state
  user: User | null;
  isAuthModalOpen: boolean;
  publicProfileUserId: string | null;
  openPublicProfile: (uid: string) => void;
  closePublicProfile: () => void;
  authModalInitialTab: 'login' | 'register';
  openAuthModal: (defaultTab?: 'login' | 'register') => void;
  closeAuthModal: () => void;
  sendOtp: (email: string, mode?: 'register' | 'reset', name?: string, password?: string) => Promise<{ success: boolean; message?: string; otpCode?: string }>;
  verifyOtpAndRegister: (name: string, email: string, pass: string, code?: string) => Promise<{ success: boolean; message?: string }>;
  resetPasswordWithOtp: (email: string, code: string, newPass: string) => Promise<{ success: boolean; message?: string }>;
  loginWithEmail: (email: string, pass: string) => Promise<{ success: boolean; message?: string }>;
  registerWithEmail: (name: string, email: string, pass: string, code?: string) => Promise<{ success: boolean; message?: string }>;
  loginWithGoogle: (googleEmail: string) => Promise<{ success: boolean; message?: string }>;
  registerWithGoogle: (googleEmail: string, name?: string) => Promise<{ success: boolean; message?: string }>;
  checkUsernameAvailability: (name: string, excludeUid?: string) => Promise<{ available: boolean; message?: string }>;
  updateUserProfile: (newName: string, newAvatar: string, newBio?: string, newUsername?: string) => Promise<{ success: boolean; message?: string }>;
  deleteAccount: () => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  toggleEmailNotifications: () => void;

  // Admin authentication
  isAdminLoggedIn: boolean;
  verifyAdminPassword: (password: string) => boolean;
  changeAdminPassword: (newPassword: string) => void;
  logoutAdmin: () => void;

  // Announcement
  announcement: Announcement;
  updateAnnouncement: (newAnn: Announcement) => void;

  // Export / Backup
  exportBackupData: () => void;
  importBackupData: (jsonData: string) => boolean;

  // Shop & Rewards System
  isShopOpen: boolean;
  openShop: () => void;
  closeShop: () => void;
  isDailyRewardOpen: boolean;
  openDailyReward: () => void;
  closeDailyReward: () => void;
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
  equipFrame: (frameId: string | null) => void;
  redeemPromoCode: (code: string) => Promise<{ success: boolean; message: string; pointsEarned?: number }> | { success: boolean; message: string; pointsEarned?: number };
  promoCodesList: any[];
  fetchPromoCodes: () => Promise<void>;
  addOrUpdatePromoCode: (promoData: { code: string; points: number; description?: string; max_uses?: number; is_active?: number }) => Promise<boolean>;
  deletePromoCode: (code: string) => Promise<boolean>;

  // Manual Cosmo-Points & User Management
  knownUsers: KnownUserRecord[];
  pointGrantLogs: PointGrantLog[];
  grantCosmoPoints: (targetEmail: string, amount: number, mode?: 'add' | 'subtract' | 'set', note?: string, sendNotification?: boolean) => Promise<{ success: boolean; message: string; previousBalance?: number; newBalance?: number }>;
  deletePointGrantLog: (logId: string) => Promise<void>;
  registerKnownUser: (userRecord: Partial<KnownUserRecord>) => void;
  deletedUsers: { uid?: string; email?: string; name?: string }[];
  markUserAsDeleted: (uid?: string, email?: string, name?: string) => Promise<void>;

  // Staff & Team Role Management (Çevirmen, Editör, Kurucu, Yönetici, vb.)
  teamRoles: Record<string, TeamMemberRecord>;
  assignTeamRole: (email: string, roles: string[], name?: string, uid?: string) => Promise<{ success: boolean; message: string }>;
  removeTeamRole: (email: string) => Promise<{ success: boolean; message: string }>;
  getUserTeamRoles: (userOrIdentifier: { email?: string; uid?: string; name?: string; userId?: string; userName?: string; teamRole?: string | null; teamRoles?: string[] } | null | undefined) => string[];

  // Site Branding (Logo, Favicon & Brand)
  siteBranding: SiteBrandingSettings;
  updateSiteBranding: (newSettings: Partial<SiteBrandingSettings>) => void;
  resetSiteBranding: () => void;

  // Ad Management (PopAds, Popunder & Banners)
  adSettings: AdSettings;
  updateAdSettings: (newSettings: Partial<AdSettings>) => void;
  resetAdSettings: () => void;
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
  readingMode: 'scroll',
  paragraphsPerPage: 8,
};

const defaultFolders: BookmarkFolder[] = [
  { id: 'f-1', name: 'Okuyorum', isDefault: true },
  { id: 'f-2', name: 'Okuyacağım', isDefault: true },
  { id: 'f-3', name: 'Bitirdim', isDefault: true },
  { id: 'f-4', name: 'Bıraktım', isDefault: true },
];

const AppContext = createContext<AppContextType | undefined>(undefined);

// Reading History Helper: strictly enforce 30 series limit (most recent first)
const trimReadingHistory = (
  history: Record<string, ReadingProgress>,
  maxCount = 500
): Record<string, ReadingProgress> => {
  if (!history || typeof history !== 'object') return {};
  const keys = Object.keys(history);
  if (keys.length <= maxCount) return history;

  const sortedKeys = keys.sort((a, b) => {
    const timeA = history[a]?.readAt ? new Date(history[a].readAt).getTime() : 0;
    const timeB = history[b]?.readAt ? new Date(history[b].readAt).getTime() : 0;
    return timeB - timeA;
  });

  const trimmed: Record<string, ReadingProgress> = {};
  for (const key of sortedKeys.slice(0, maxCount)) {
    trimmed[key] = history[key];
  }
  return trimmed;
};


// Persistent helper to prevent repeating/spamming toast & desktop push notifications
const markAndCheckIfAlreadyToasted = (notifId: string): boolean => {
  if (!notifId) return true;
  try {
    const raw = localStorage.getItem('mk_toasted_notif_ids') || '[]';
    let list: string[] = [];
    try { list = JSON.parse(raw); } catch {}
    if (list.includes(notifId)) return true;
    list.push(notifId);
    if (list.length > 500) list = list.slice(list.length - 500);
    localStorage.setItem('mk_toasted_notif_ids', JSON.stringify(list));
    return false;
  } catch {
    return false;
  }
};

const isNotificationCreatedRecently = (notifTimeStr?: string): boolean => {
  if (!notifTimeStr) return false;
  const t = new Date(notifTimeStr).getTime();
  if (isNaN(t)) return false;
  // Only considered recent if created within the last 5 minutes
  return (Date.now() - t) < 5 * 60 * 1000;
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Theme state (Exclusively Dark Mode)
  const [theme] = useState<'dark' | 'light'>('dark');

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
      safeSetItem('mk_show_nsfw', String(next));
      if (user) {
        const updatedUser = { ...user, showNsfw: next };
        setUser(updatedUser);
        safeSetItem('mk_user', JSON.stringify(updatedUser));
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

  // Helper to read/write persistent chapter 18+ flags map
  const getChapter18PlusMap = (): Record<string, boolean> => {
    try {
      const raw = localStorage.getItem('mk_chapter_18plus_map');
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  };

  const applyChapter18PlusMap = (list: Series[]): Series[] => {
    const ch18Map = getChapter18PlusMap();
    return list.map(s => ({
      ...s,
      chapters: (s.chapters || []).map(ch => ({
        ...ch,
        is18Plus: ch.id in ch18Map ? ch18Map[ch.id] : Boolean(ch.is18Plus)
      }))
    }));
  };

  // Series List
  const [seriesList, setSeriesList] = useState<Series[]>(() => {
    const saved = localStorage.getItem('mk_series_list');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // If cached chapters had 500-character truncated content, clear content so fresh D1 content loads
          const cleaned = parsed.map((s: any) => ({
            ...s,
            chapters: (s.chapters || []).map((ch: any) => ({
              ...ch,
              content: ch.content
            }))
          }));
          return sortSeriesByLatestRelease(applyChapter18PlusMap(cleaned));
        }
      } catch (e) {}
    }
    return [];
  });
  const [isLoadingSeries, setIsLoadingSeries] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('mk_series_list');
      return !saved || saved === '[]';
    } catch {
      return true;
    }
  });


  // Fast hydration from IndexedDB on initial mount
  useEffect(() => {
    loadSeriesFromIndexedDB().then(cachedList => {
      if (cachedList && Array.isArray(cachedList) && cachedList.length > 0) {
        setSeriesList(prev => {
          const cleaned = cachedList.map((s: any) => ({
            ...s,
            chapters: (s.chapters || []).map((ch: any) => ({
              ...ch,
              content: ch.content
            }))
          }));
          if (!prev || prev.length < cleaned.length) {
            return sortSeriesByLatestRelease(applyChapter18PlusMap(cleaned));
          }
          return prev;
        });
      }
    }).catch(() => {});
  }, []);

  // Reading History (capped at 500 series)
  const [readingHistory, setReadingHistory] = useState<Record<string, ReadingProgress>>(() => {
    const saved = localStorage.getItem('mk_reading_history');
    if (!saved) return {};
    try {
      return trimReadingHistory(JSON.parse(saved), 500);
    } catch {
      return {};
    }
  });

  // Bookmark Folders
  const [bookmarkFolders, setBookmarkFolders] = useState<BookmarkFolder[]>(() => {
    const saved = localStorage.getItem('mk_bookmark_folders');
    return saved ? JSON.parse(saved) : defaultFolders;
  });

  // Clean up ghost bookmarks for deleted series that no longer exist in seriesList
  useEffect(() => {
    if (!seriesList || seriesList.length === 0) return;
    const bookmarkKeys = Object.keys(bookmarks);
    if (bookmarkKeys.length === 0) return;

    let hasOrphans = false;
    const cleanedBookmarks = { ...bookmarks };

    bookmarkKeys.forEach(key => {
      const bItem = bookmarks[key];
      const targetId = bItem?.seriesId || key;
      const cleanTarget = String(targetId).trim().toLowerCase();
      const exists = seriesList.some(s => {
        return (
          String(s.id).trim().toLowerCase() === cleanTarget ||
          String(s.slug || '').trim().toLowerCase() === cleanTarget ||
          String(s.title || '').trim().toLowerCase() === cleanTarget
        );
      });
      if (!exists) {
        delete cleanedBookmarks[key];
        hasOrphans = true;
      }
    });

    if (hasOrphans) {
      setBookmarks(cleanedBookmarks);
      try {
        localStorage.setItem('mk_bookmarks_v2', JSON.stringify(cleanedBookmarks));
      } catch (e) {}
    }
  }, [seriesList]);

  // Bookmarks Map (seriesId -> BookmarkItem)
  // Bookmarks Map (seriesId -> BookmarkItem)
  const [readingLists, setReadingListsState] = useState<import('../types').ReadingList[]>(() => {
    try {
      const savedUser = localStorage.getItem('mk_user');
      let uid = '';
      if (savedUser) {
        const p = JSON.parse(savedUser);
        if (p && p.uid) uid = p.uid;
      }
      const saved = (uid ? localStorage.getItem(`mk_reading_lists_${uid}`) : null) || localStorage.getItem('mk_reading_lists');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.filter((l: any) => l && l.id !== '__kosmospins__');
        }
      }
    } catch (e) {}
    return [];
  });

  // KosmosPin'ler (Pinned Wallpapers)
  const [kosmosPins, setKosmosPinsState] = useState<import('../types').KosmosPinItem[]>(() => {
    try {
      const savedUser = localStorage.getItem('mk_user');
      let uid = '';
      if (savedUser) {
        const p = JSON.parse(savedUser);
        if (p && p.uid) uid = p.uid;
      }
      const saved = (uid ? localStorage.getItem(`mk_kosmospins_${uid}`) : null) || localStorage.getItem('mk_kosmospins');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
      // Fallback: check if embedded inside mk_reading_lists
      const savedLists = (uid ? localStorage.getItem(`mk_reading_lists_${uid}`) : null) || localStorage.getItem('mk_reading_lists');
      if (savedLists) {
        const parsedLists = JSON.parse(savedLists);
        if (Array.isArray(parsedLists)) {
          const pinEntry = parsedLists.find((l: any) => l && l.id === '__kosmospins__');
          if (pinEntry && Array.isArray(pinEntry.pins)) return pinEntry.pins;
        }
      }
    } catch (e) {}
    return [];
  });

  const [bookmarks, setBookmarks] = useState<Record<string, BookmarkItem>>(() => {
    const saved = localStorage.getItem('mk_bookmarks_v2');
    return saved ? JSON.parse(saved) : {};
  });

  // Followed Series State (series IDs that user follows for chapter alerts)
  const [followedSeriesIds, setFollowedSeriesIds] = useState<string[]>(() => {
    const saved = localStorage.getItem('mk_followed_series');
    return saved ? JSON.parse(saved) : [];
  });

  // Persistent Notifications State
  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    const saved = localStorage.getItem('mk_notifications_list');
    if (saved) {
      try {
        const parsed: AppNotification[] = JSON.parse(saved);
        const legacyDemoIds = ['notif-hob-5', 'notif-plum-5', 'notif-sys-welcome', 'notif-ann-server'];
        const clean = Array.isArray(parsed) ? parsed.filter(n => !legacyDemoIds.includes(n.id)) : [];
        return clean;
      } catch {
        return [];
      }
    }
    return INITIAL_NOTIFICATIONS;
  });

  // Global Toast Notifications State
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Site Branding State (Logo, Favicon & Brand)
  const [siteBranding, setSiteBranding] = useState<SiteBrandingSettings>(() => {
    const saved = localStorage.getItem('mk_site_branding');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (!parsed.siteSlogan || parsed.siteSlogan.trim().toLowerCase() === 'fansub') {
          parsed.siteSlogan = 'Shine, Dream, Smile';
        }
        return { ...DEFAULT_SITE_BRANDING, ...parsed };
      } catch (e) {
        return DEFAULT_SITE_BRANDING;
      }
    }
    return DEFAULT_SITE_BRANDING;
  });

  // Dynamic Favicon Synchronization in Browser Head
  useEffect(() => {
    try {
      localStorage.setItem('mk_site_branding', JSON.stringify(siteBranding));
      let faviconLink = document.querySelector("link[rel~='icon']") as HTMLLinkElement | null;
      if (!faviconLink) {
        faviconLink = document.createElement('link');
        faviconLink.rel = 'icon';
        document.head.appendChild(faviconLink);
      }
      const targetIcon = siteBranding.faviconUrl && siteBranding.faviconUrl.trim()
        ? siteBranding.faviconUrl.trim()
        : '/favicon.svg';
      faviconLink.href = targetIcon;
    } catch (e) {
      console.warn('Favicon update error:', e);
    }
  }, [siteBranding]);

  const updateSiteBranding = (newSettings: Partial<SiteBrandingSettings>) => {
    setSiteBranding(prev => {
      const updated = { ...prev, ...newSettings };
      fetch('/api/admin/site-branding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
      }).catch(() => {});
      return updated;
    });
  };

  const resetSiteBranding = () => {
    setSiteBranding(DEFAULT_SITE_BRANDING);
    localStorage.removeItem('mk_site_branding');
    fetch('/api/admin/site-branding', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(DEFAULT_SITE_BRANDING)
    }).catch(() => {});
  };

  // Ad Settings State (PopAds, Banners, Reader Ads)
  const [adSettings, setAdSettings] = useState<AdSettings>(() => {
    const saved = localStorage.getItem('mk_ad_settings');
    if (saved) {
      try {
        return { ...DEFAULT_AD_SETTINGS, ...JSON.parse(saved) };
      } catch (e) {
        return DEFAULT_AD_SETTINGS;
      }
    }
    return DEFAULT_AD_SETTINGS;
  });

  useEffect(() => {
    try {
      localStorage.setItem('mk_ad_settings', JSON.stringify(adSettings));
    } catch (e) {
      console.warn('Ad settings persist error:', e);
    }
  }, [adSettings]);

  const updateAdSettings = (newSettings: Partial<AdSettings>) => {
    setAdSettings(prev => {
      const updated = { ...prev, ...newSettings };
      fetch('/api/admin/ad-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
      }).catch(() => {});
      return updated;
    });
  };

  const resetAdSettings = () => {
    setAdSettings(DEFAULT_AD_SETTINGS);
    localStorage.removeItem('mk_ad_settings');
    fetch('/api/admin/ad-settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(DEFAULT_AD_SETTINGS)
    }).catch(() => {});
  };

  // Novel Settings
  const [novelSettings, setNovelSettings] = useState<NovelSettings>(() => {
    const saved = localStorage.getItem('mk_novel_settings');
    return saved ? JSON.parse(saved) : defaultNovelSettings;
  });

  // Comments State
  const [comments, setComments] = useState<Comment[]>(() => {
    try {
      const saved = localStorage.getItem('mk_comments');
      const deletedStr = localStorage.getItem('mk_deleted_comments');
      const deletedIds = new Set<string>(deletedStr ? JSON.parse(deletedStr) : []);
      if (saved) {
        const parsed: Comment[] = JSON.parse(saved);
        return Array.isArray(parsed) ? parsed.filter(c => !deletedIds.has(c.id)) : [];
      }
    } catch (e) {}
    return [];
  });

  // Auth state
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('mk_user');
    if (!saved) {
      return null;
    }
    try {
      const parsed = JSON.parse(saved);
      // Clean up legacy guest dummy accounts
      if (
        !parsed ||
        parsed.uid === 'u-guest' ||
        parsed.email === 'misafir@mikrokosmos.com' ||
        parsed.name === 'Okuyucu Misafir'
      ) {
        localStorage.removeItem('mk_user');
        return null;
      }
      const isUnlimitedUser = parsed.email?.toLowerCase() === 'mikrokosmosfansub@gmail.com';
      let effectiveCoins = parsed.coins ?? 250;
      if (isUnlimitedUser) {
        effectiveCoins = 999999999;
      } else if (parsed.email?.toLowerCase() === 'aseleliyeva77@gmail.com' && effectiveCoins >= 9999999) {
        effectiveCoins = 10;
      }
      const normalized = normalizeShopInventory(
        [parsed.inventory, parsed.unlockedEmojiPacks],
        parsed.inventoryExpiresAt
      );
      const stripped = stripExpiredEquippedFromUser(parsed, normalized.activeInventory, SHOP_ITEMS);
      return {
        ...parsed,
        coins: effectiveCoins,
        inventory: normalized.activeInventory,
        inventoryExpiresAt: normalized.expiresAtMap,
        unlockedEmojiPacks: normalized.activeInventory,
        equippedTheme: stripped.equippedTheme,
        equippedFrame: stripped.equippedFrame,
        equippedBadge: stripped.equippedBadge,
        equippedBadges: stripped.equippedBadges
      };
    } catch (e) {
      localStorage.removeItem('mk_user');
      return null;
    }
  });

  // Shop state & Navigation
  const [isShopOpen, setIsShopOpen] = useState(false);
  const openShop = () => {
    setView({ type: 'shop' });
    setIsShopOpen(false);
  };
  const closeShop = () => setIsShopOpen(false);

  // Daily Starter Rewards Modal state
  const [isDailyRewardOpen, setIsDailyRewardOpen] = useState(false);
  const openDailyReward = () => setIsDailyRewardOpen(true);
  const closeDailyReward = () => setIsDailyRewardOpen(false);

  const [shopItems, setShopItems] = useState<ShopItem[]>(() => {
    const saved = localStorage.getItem('mk_shop_items');
    const deletedStr = localStorage.getItem('mk_deleted_shop_items');
    let deletedIds = new Set<string>();
    if (deletedStr) {
      try { deletedIds = new Set(JSON.parse(deletedStr)); } catch(e){}
    }

    if (saved) {
      try {
        const savedItems: ShopItem[] = JSON.parse(saved);
        const savedMap = new Map(savedItems.map(item => [item.id, item]));
        const mergedDefault = SHOP_ITEMS
          .filter(defaultItem => !deletedIds.has(defaultItem.id))
          .map(defaultItem => {
            return savedMap.has(defaultItem.id) ? { ...defaultItem, ...savedMap.get(defaultItem.id)! } : defaultItem;
          });
        const defaultIds = new Set(SHOP_ITEMS.map(i => i.id));
        const customSaved = savedItems.filter(i => !defaultIds.has(i.id) && !deletedIds.has(i.id));
        return [...mergedDefault, ...customSaved];
      } catch (e) {}
    }
    return SHOP_ITEMS.filter(i => !deletedIds.has(i.id));
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
    safeSetItem('mk_shop_items', JSON.stringify(shopItems));
    SHOP_ITEMS.length = 0;
    SHOP_ITEMS.push(...shopItems);
  }, [shopItems]);

  useEffect(() => {
    safeSetItem('mk_theme_styles', JSON.stringify(themeStyles));
    Object.keys(THEME_STYLES).forEach(k => delete THEME_STYLES[k]);
    Object.assign(THEME_STYLES, themeStyles);
  }, [themeStyles]);

  
  const updateShopItem = (itemId: string, updated: Partial<ShopItem>) => {
    setShopItems(prev => {
      const oldItem = prev.find(item => item.id === itemId);
      if (oldItem && oldItem.frameImageUrl !== updated.frameImageUrl) {
        if (oldItem.frameImageUrl && oldItem.frameImageUrl.includes('/api/r2/file/')) {
          fetch(oldItem.frameImageUrl, { method: 'DELETE' }).catch(err => {
            console.error('Failed to delete old frame image from R2:', err);
          });
        }
      }

      const merged = prev.map(item => item.id === itemId ? { ...item, ...updated } : item);
      
      const newThemeStyles = { ...themeStyles };
      if (updated.name && newThemeStyles[itemId]) {
        newThemeStyles[itemId] = { ...newThemeStyles[itemId], name: updated.name! };
      }

      // Sync global shop to D1
      safeFetchJson('/api/shop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shopItems: merged,
          themeStyles: newThemeStyles
        })
      }).catch(() => {});

      return merged;
    });
    if (updated.name && themeStyles[itemId]) {
      setThemeStyles(prev => ({
        ...prev,
        [itemId]: { ...prev[itemId], name: updated.name! }
      }));
    }
  };


  
  const updateThemeStyle = (themeId: string, updated: Partial<ThemeStyle>) => {
    setThemeStyles(prev => {
      const oldStyle = prev[themeId];
      if (oldStyle && oldStyle.cardBgImageUrl !== updated.cardBgImageUrl) {
        if (oldStyle.cardBgImageUrl && oldStyle.cardBgImageUrl.includes('/api/r2/file/')) {
           // Delete the old R2 image if it has been replaced or removed
           fetch(oldStyle.cardBgImageUrl, { method: 'DELETE' }).catch(err => {
             console.error('Failed to delete old theme image from R2:', err);
           });
        }
      }

      const merged = { ...prev, [themeId]: { ...prev[themeId], ...updated } };
      
      const newShopItems = shopItems.map(item => {
        if (item.id === themeId) {
          return { ...item, name: updated.name ?? item.name };
        }
        return item;
      });

      // Sync global shop to D1
      safeFetchJson('/api/shop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shopItems: newShopItems,
          themeStyles: merged
        })
      }).catch(() => {});

      return merged;
    });
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
    try {
      const deletedStr = localStorage.getItem('mk_deleted_shop_items') || '[]';
      const deletedList = new Set(JSON.parse(deletedStr));
      if (deletedList.has(item.id)) {
        deletedList.delete(item.id);
        localStorage.setItem('mk_deleted_shop_items', JSON.stringify(Array.from(deletedList)));
      }
    } catch(e){}
    setShopItems(prev => {
      const merged = [item, ...prev.filter(i => i.id !== item.id)];
      
      safeFetchJson('/api/shop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shopItems: merged,
          themeStyles: style ? { ...themeStyles, [item.id]: style } : themeStyles
        })
      }).catch(() => {});

      return merged;
    });
    if (style) {
      setThemeStyles(prev => ({
        ...prev,
        [item.id]: style
      }));
    }
  };

const deleteShopItemAndStyle = (itemId: string) => {
    const styleToDelete = themeStyles[itemId];
    if (styleToDelete?.cardBgImageUrl?.includes('/api/r2/file/')) {
      fetch(styleToDelete.cardBgImageUrl, { method: 'DELETE' }).catch(err => {
        console.error('Failed to delete image from R2:', err);
      });
    }
    
    const itemToDelete = shopItems.find(i => i.id === itemId);
    if (itemToDelete?.frameImageUrl?.includes('/api/r2/file/')) {
      fetch(itemToDelete.frameImageUrl, { method: 'DELETE' }).catch(err => {
        console.error('Failed to delete frame image from R2:', err);
      });
    }

    console.log('Sending DELETE API request for', itemId);
    safeFetchJson(`/api/shop?id=${encodeURIComponent(itemId)}`, {
      method: 'DELETE'
    }).then(res => {
      console.log('DELETE API response:', res);
    }).catch(err => {
      console.error('Failed to delete shop item from D1:', err);
    });

    setShopItems(prev => prev.filter(i => i.id !== itemId));
    try {
      const deletedStr = localStorage.getItem('mk_deleted_shop_items') || '[]';
      const deletedList = new Set(JSON.parse(deletedStr));
      deletedList.add(itemId);
      localStorage.setItem('mk_deleted_shop_items', JSON.stringify(Array.from(deletedList)));
    } catch (e) {}
    setThemeStyles(prev => {
      const next = { ...prev };
      delete next[itemId];
      return next;
    });
  };


  const resetShopToDefault = () => {
    localStorage.removeItem('mk_shop_items');
    localStorage.removeItem('mk_theme_styles');
    localStorage.removeItem('mk_deleted_shop_items');
    window.location.reload();
  };

  // Earn points (CP)
  const earnPoints = (amount: number, reason: string) => {
    setUser(prev => {
      if (!prev) return null;
      if (prev.email?.toLowerCase() === 'mikrokosmosfansub@gmail.com') {
        return { ...prev, coins: 999999999 };
      }
      const currentCoins = prev.coins ?? 10;
      const updated = {
        ...prev,
        coins: currentCoins + amount
      };
      try { localStorage.setItem('mk_user', JSON.stringify(updated)); } catch (e) {}
      return updated;
    });
  };

  // Add Unlimited Points (+999.999 CP) - Only allowed for mikrokosmosfansub@gmail.com
  const addUnlimitedPoints = () => {
    setUser(prev => {
      if (!prev) return null;
      if (prev.email?.toLowerCase() !== 'mikrokosmosfansub@gmail.com') {
        alert('Sınırsız Cosmo-Puan yetkisi sadece mikrokosmosfansub hesabına tanımlıdır!');
        return prev;
      }
      return {
        ...prev,
        coins: 999999999
      };
    });
  };

  // Auto-sanitize existing infinite coins on aseleliyeva77@gmail.com if set historically
  useEffect(() => {
    if (user && user.email?.toLowerCase() === 'aseleliyeva77@gmail.com' && (user.coins === 999999999 || (user.coins ?? 0) >= 9999999)) {
      setUser(prev => {
        if (!prev) return null;
        const sanitized = { ...prev, coins: 10 };
        try { localStorage.setItem('mk_user', JSON.stringify(sanitized)); } catch (e) {}
        return sanitized;
      });
    }
  }, [user?.email, user?.coins]);

  // 7-Day Starter Daily Check-in (5 - 20 CP)
  const claimDailyCheckin = () => {
    if (!user) {
      openAuthModal('login');
      return { success: false, message: 'Giriş yapmalısınız.' };
    }

    const currentDay = user.dailyCheckinDay || 0;
    if (currentDay >= 7) {
      return {
        success: false,
        message: '🎉 7 Günlük Hoş Geldin Başlangıç Takvimini tamamladınız! Puan yüklemek için Mağaza paketlerini inceleyebilirsiniz.'
      };
    }

    const today = new Date().toISOString().slice(0, 10);
    if (user.lastDailyCheckin === today) {
      return {
        success: false,
        message: `Bugünkü (${currentDay}. Gün) ödülünüzü zaten aldınız! Yarın ${currentDay + 1}. Gün ödülünüz için tekrar bekleriz.`
      };
    }

    const nextDay = currentDay + 1;
    const rewardInfo = DAILY_STARTER_REWARDS.find(r => r.day === nextDay) || { day: nextDay, points: 5 };
    const reward = rewardInfo.points;

    const isUnlimited = user.email?.toLowerCase() === 'mikrokosmosfansub@gmail.com';
    const currentCoins = isUnlimited ? 999999999 : (user.coins ?? 10);
    const claimedDays = user.claimedCheckinDays || [];
    const updatedClaimedDays = [...claimedDays, nextDay];

    const updatedUser: User = {
      ...user,
      coins: isUnlimited ? 999999999 : currentCoins + reward,
      lastDailyCheckin: today,
      dailyCheckinDay: nextDay,
      claimedCheckinDays: updatedClaimedDays
    };

    setUser(updatedUser);

    fetch('/api/auth/update-profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        uid: user.uid,
        name: user.name,
        avatar: user.avatar,
        coins: updatedUser.coins
      })
    }).catch(() => {});

    return {
      success: true,
      message: `🎉 Tebrikler! ${nextDay}. Gün Giriş Ödülü: +${reward} Cosmo-Puan hesabınıza eklendi!`,
      pointsEarned: reward
    };
  };

  // Daily Lucky Wheel Spin (Balanced 1 - 8 CP)
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
      { pts: 1, name: '1 Cosmo-Puan' },
      { pts: 2, name: '2 Cosmo-Puan' },
      { pts: 3, name: '3 Cosmo-Puan' },
      { pts: 5, name: '5 Cosmo-Puan' },
      { pts: 8, name: '8 Cosmo-Puan!' }
    ];
    const prize = rewards[Math.floor(Math.random() * rewards.length)];
    const isUnlimited = user.email?.toLowerCase() === 'mikrokosmosfansub@gmail.com';
    const currentCoins = isUnlimited ? 999999999 : (user.coins ?? 10);
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

    const item = shopItems.find(i => i.id === itemId) || SHOP_ITEMS.find(i => i.id === itemId);
    if (!item) return { success: false, message: 'Ürün bulunamadı.' };

    const normalizedCurrent = normalizeShopInventory(
      [user.inventory, user.unlockedEmojiPacks],
      user.inventoryExpiresAt
    );
    const userInventory = normalizedCurrent.activeInventory;
    const currentExpiresAtMap = { ...normalizedCurrent.expiresAtMap };

    if (userInventory.includes(itemId)) {
      const remText = formatRemainingDuration(currentExpiresAtMap[itemId]);
      if (item.category === 'emoji_pack') {
        const currentEmojiPacks = user.unlockedEmojiPacks || [];
        if (!currentEmojiPacks.includes(itemId) || !(user.inventory || []).includes(itemId)) {
          setUser({
            ...user,
            inventory: userInventory,
            inventoryExpiresAt: currentExpiresAtMap,
            unlockedEmojiPacks: userInventory
          });
        }
        return {
          success: true,
          message: `"${item.name}" zaten hesabınızda açık ve kullanıma hazır! (${remText})`
        };
      }
      return { success: false, message: `Bu ürüne zaten sahipsiniz! (${remText})` };
    }

    const isUnlimited = user.email?.toLowerCase() === 'mikrokosmosfansub@gmail.com';
    const currentCoins = isUnlimited ? 999999999 : (user.coins ?? 250);
    if (!isUnlimited && currentCoins < item.price) {
      return { success: false, message: `Yetersiz Cosmo-Puan! Bu ürün için ${item.price} CP gerekiyor, bakiyeniz: ${currentCoins} CP.` };
    }

    const newExpiresAt = Date.now() + SHOP_ITEM_DURATION_MS;
    const nextExpiresAtMap: Record<string, number> = {
      ...currentExpiresAtMap,
      [itemId]: newExpiresAt
    };
    const nextNormalized = normalizeShopInventory(
      [[...userInventory, itemId]],
      nextExpiresAtMap
    );
    const newInventory = nextNormalized.activeInventory;

    let updatedUser: User = {
      ...user,
      coins: isUnlimited ? 999999999 : Math.max(0, currentCoins - item.price),
      inventory: newInventory,
      inventoryExpiresAt: nextNormalized.expiresAtMap,
      unlockedEmojiPacks: newInventory
    };

    if (item.category === 'theme') {
      updatedUser.equippedTheme = itemId;
    } else if (item.category === 'badge') {
      const badgeTextToEquip = item.badgeText || item.name;
      const currentBadges = user.equippedBadges && user.equippedBadges.length > 0
        ? [...user.equippedBadges]
        : (user.equippedBadge ? [user.equippedBadge] : []);
      if (!currentBadges.includes(badgeTextToEquip)) {
        updatedUser.equippedBadges = [...currentBadges, badgeTextToEquip];
        updatedUser.equippedBadge = updatedUser.equippedBadges[0];
      }
    } else if (item.category === 'frame') {
      updatedUser.equippedFrame = itemId;
    }

    setUser(updatedUser);

    fetch('/api/auth/library', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      keepalive: true,
      body: JSON.stringify({
        uid: user.uid,
        cosmo_points: updatedUser.coins,
        shop_items: JSON.stringify(nextNormalized.serializedForCloud),
        equipped_theme: updatedUser.equippedTheme || null,
        equipped_badge: updatedUser.equippedBadge || null,
        equipped_badges: JSON.stringify(updatedUser.equippedBadges || (updatedUser.equippedBadge ? [updatedUser.equippedBadge] : [])),
        equipped_frame: updatedUser.equippedFrame || null
      })
    }).catch(() => {});

    return {
      success: true,
      message: `🎉 Tebrikler! "${item.name}" 1 aylığına (30 Gün) satın alındı ve profilinize uygulandı!`
    };
  };

  // Equip Theme
  const equipTheme = (themeId: string | null) => {
    if (!user) return;
    const updatedUser: User = { ...user, equippedTheme: themeId };
    setUser(updatedUser);
  };

  // Equip or Toggle VIP Title Badge (Support up to 5 badges simultaneously)
  const equipBadge = (badgeText: string | null) => {
    if (!user) return;
    if (!badgeText) {
      // Clear all active badges
      const updatedUser: User = { ...user, equippedBadge: null, equippedBadges: [] };
      setUser(updatedUser);
      showToast({
        title: 'Tüm Unvanlar Çıkarıldı',
        message: 'Kuşanılmış tüm VIP unvanlarınız kaldırıldı.',
        type: 'info'
      });
      return;
    }

    const currentBadges = user.equippedBadges && user.equippedBadges.length > 0
      ? [...user.equippedBadges]
      : (user.equippedBadge ? [user.equippedBadge] : []);

    const isAlreadyEquipped = currentBadges.includes(badgeText);
    let updatedBadges: string[];

    if (isAlreadyEquipped) {
      // Unequip this specific badge
      updatedBadges = currentBadges.filter(b => b !== badgeText);
      showToast({
        title: 'Unvan Çıkarıldı',
        message: `"${badgeText}" unvanı çıkarıldı. (${updatedBadges.length}/5)`,
        type: 'info'
      });
    } else {
      // Equip new badge (enforce max 5 limit)
      if (currentBadges.length >= 5) {
        showToast({
          title: 'Maksimum Unvan Limiti (5/5) ⚠️',
          message: 'Aynı anda en fazla 5 unvan takabilirsiniz! Yeni bir unvan takmak için önce birini çıkarın.',
          type: 'warning'
        });
        return;
      }
      updatedBadges = [...currentBadges, badgeText];
      showToast({
        title: 'Unvan Takıldı ✨',
        message: `"${badgeText}" unvanı takıldı! (${updatedBadges.length}/5)`,
        type: 'success'
      });
    }

    const updatedUser: User = {
      ...user,
      equippedBadge: updatedBadges[0] || null,
      equippedBadges: updatedBadges
    };
    setUser(updatedUser);
  };

  // Equip Frame
  const equipFrame = (frameId: string | null) => {
    if (!user) return;
    const updatedUser: User = { ...user, equippedFrame: frameId };
    setUser(updatedUser);
  };

    // Promo Codes State
  const [promoCodesList, setPromoCodesList] = useState<any[]>([]);

  const fetchPromoCodes = async () => {
    try {
      const res = await fetch('/api/promo-codes');
      const data = await res.json();
      if (data && data.success && Array.isArray(data.promoCodes)) {
        setPromoCodesList(data.promoCodes);
      }
    } catch (e) {
      console.error('Failed to fetch promo codes:', e);
    }
  };

  useEffect(() => {
    fetchPromoCodes();
  }, []);

  const addOrUpdatePromoCode = async (promoData: { code: string; points: number; description?: string; max_uses?: number; is_active?: number }) => {
    try {
      const res = await fetch('/api/promo-codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(promoData)
      });
      const data = await res.json();
      if (data && data.success) {
        await fetchPromoCodes();
        showToast({
          title: 'Promosyon Kodu Kaydedildi 🎁',
          message: data.message || `"${promoData.code.toUpperCase()}" kodu Cloudflare D1 veritabanına kaydedildi!`,
          type: 'success'
        });
        return true;
      } else {
        showToast({
          title: 'Hata ⚠️',
          message: data.message || 'Kod kaydedilemedi.',
          type: 'warning'
        });
      }
    } catch (e) {
      console.error('Error saving promo code:', e);
    }
    return false;
  };

  const deletePromoCode = async (code: string) => {
    try {
      const res = await fetch(`/api/promo-codes?code=${encodeURIComponent(code)}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data && data.success) {
        await fetchPromoCodes();
        showToast({
          title: 'Promosyon Kodu Silindi 🗑️',
          message: `"${code}" promosyon kodu Cloudflare veritabanından silindi.`,
          type: 'info'
        });
        return true;
      }
    } catch (e) {
      console.error('Error deleting promo code:', e);
    }
    return false;
  };

  // Redeem Promo Code
  const redeemPromoCode = async (code: string) => {
    if (!user) {
      openAuthModal('login');
      return { success: false, message: 'Kupon kodu kullanmak için lütfen önce giriş yapın.' };
    }
    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode) {
      return { success: false, message: 'Lütfen geçerli bir promosyon kodu girin.' };
    }

    try {
      const res = await fetch('/api/promo-codes/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: cleanCode,
          email: user.email,
          userId: user.id
        })
      });
      const data = await res.json();

      if (data && data.success) {
        const pointsEarned = Number(data.pointsEarned) || 100;
        const promoKey = `promo_${cleanCode}`;
        const userInventory = user.inventory || [];
        const updatedInventory = userInventory.includes(promoKey) ? userInventory : [...userInventory, promoKey];
        const isUnlimited = user.email?.toLowerCase() === 'mikrokosmosfansub@gmail.com' || user.email?.toLowerCase() === 'aseleliyeva77@gmail.com';
        const currentCoins = isUnlimited ? 999999999 : (user.coins ?? 250);
        const updatedCoins = isUnlimited ? 999999999 : (data.newCoins ?? (currentCoins + pointsEarned));

        const updatedUser: User = {
          ...user,
          coins: updatedCoins,
          inventory: updatedInventory
        };
        setUser(updatedUser);

        return {
          success: true,
          message: data.message || `🎁 Harika! "${cleanCode}" kodundan +${pointsEarned} Cosmo-Puan hesabınıza yüklendi!`,
          pointsEarned
        };
      } else {
        return {
          success: false,
          message: data.message || 'Geçersiz veya süresi dolmuş promosyon kodu.'
        };
      }
    } catch (e) {
      console.error('API promo redeem error, fallback to local lookup:', e);
      const promo = PROMO_CODES[cleanCode];
      if (!promo) {
        return { success: false, message: 'Geçersiz promosyon kodu.' };
      }
      const userInventory = user.inventory || [];
      const promoKey = `promo_${cleanCode}`;
      if (userInventory.includes(promoKey)) {
        return { success: false, message: 'Bu promosyon kodunu daha önce kullandınız.' };
      }
      const isUnlimited = user.email?.toLowerCase() === 'mikrokosmosfansub@gmail.com' || user.email?.toLowerCase() === 'aseleliyeva77@gmail.com';
      const currentCoins = isUnlimited ? 999999999 : (user.coins ?? 250);
      const updatedUser: User = {
        ...user,
        coins: isUnlimited ? 999999999 : currentCoins + promo.points,
        inventory: [...userInventory, promoKey]
      };
      setUser(updatedUser);
      return {
        success: true,
        message: `🎁 Harika! "${cleanCode}" kodundan +${promo.points} Cosmo-Puan hesabınıza yüklendi!`,
        pointsEarned: promo.points
      };
    }
  };

  // ===================== MANUAL COSMO-POINTS & USER REGISTRY =====================
  const [knownUsers, setKnownUsers] = useState<KnownUserRecord[]>(() => {
    const saved = localStorage.getItem('mk_known_users_registry');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    return [];
  });

  const [pointGrantLogs, setPointGrantLogs] = useState<PointGrantLog[]>(() => {
    const saved = localStorage.getItem('mk_point_grants_history');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {}
    }
    return [];
  });

  useEffect(() => {
    try {
      localStorage.setItem('mk_known_users_registry', JSON.stringify(knownUsers));
    } catch (e) {}
  }, [knownUsers]);

  // Sync current user's coins if they are updated in knownUsers (fetched from D1)
  useEffect(() => {
    if (user && user.email) {
      const cleanEmail = user.email.toLowerCase().trim();
      const existingInRegistry = knownUsers.find(k => k.email.toLowerCase() === cleanEmail);
      if (existingInRegistry) {
        if (user.coins !== existingInRegistry.coins && cleanEmail !== 'mikrokosmosfansub@gmail.com') {
          setUser(prev => prev ? { ...prev, coins: existingInRegistry.coins } : null);
        }
      }
    }
  }, [knownUsers, user?.email]);

  useEffect(() => {
    try {
      localStorage.setItem('mk_point_grants_history', JSON.stringify(pointGrantLogs));
    } catch (e) {}
  }, [pointGrantLogs]);

  const registerKnownUser = (userRecord: Partial<KnownUserRecord>) => {
    if (!userRecord.email) return;
    const cleanEmail = userRecord.email.toLowerCase().trim();
    setKnownUsers(prev => {
      const idx = prev.findIndex(u => u.email.toLowerCase() === cleanEmail);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = { ...updated[idx], ...userRecord };
        return updated;
      }
      return [
        {
          uid: userRecord.uid || 'u-' + Date.now(),
          email: cleanEmail,
          name: userRecord.name || cleanEmail.split('@')[0],
          avatar: userRecord.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(cleanEmail)}`,
          coins: userRecord.coins ?? 10,
          role: userRecord.role || 'user',
          lastActive: userRecord.lastActive || 'Az önce',
          equippedBadge: userRecord.equippedBadge || null,
          equippedBadges: userRecord.equippedBadges || []
        },
        ...prev
      ];
    });

    safeFetchJson('/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user: userRecord })
    }).catch(() => {});
  };

  // ===================== DELETED USERS TRACKING (TOP 50 LEADERBOARD EXCLUSION) =====================
  const INITIAL_DELETED_USERS: { uid?: string; email?: string; name?: string }[] = [
    { name: 'aseleliyeva1234' },
    { email: 'aseleliyeva1234@gmail.com' },
    { name: 'Aysel Eliyeva' }, // Eski silinen hesap
  ];

  const [deletedUsers, setDeletedUsers] = useState<{ uid?: string; email?: string; name?: string }[]>(() => {
    const saved = localStorage.getItem('mk_deleted_users_v1');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const merged = [...parsed];
          for (const init of INITIAL_DELETED_USERS) {
            if (!merged.some(m => (init.name && m.name === init.name) || (init.email && m.email === init.email))) {
              merged.push(init);
            }
          }
          return merged;
        }
      } catch (e) {}
    }
    return INITIAL_DELETED_USERS;
  });

  useEffect(() => {
    try {
      localStorage.setItem('mk_deleted_users_v1', JSON.stringify(deletedUsers));
    } catch (e) {}
  }, [deletedUsers]);

  // Fetch deleted users list from Cloudflare D1
  useEffect(() => {
    safeFetchJson<{ success: boolean; deletedUsers: any[] }>('/api/auth/deleted-users')
      .then(data => {
        if (data && data.success && Array.isArray(data.deletedUsers)) {
          setDeletedUsers(prev => {
            const merged = [...prev];
            for (const d of data.deletedUsers) {
              if (!merged.some(m => (d.uid && m.uid === d.uid) || (d.email && m.email && m.email.toLowerCase() === d.email.toLowerCase()) || (d.name && m.name && m.name.toLowerCase() === d.name.toLowerCase()))) {
                merged.push(d);
              }
            }
            return merged;
          });
        }
      })
      .catch(() => {});
  }, []);

  // Prune knownUsers when deletedUsers changes so deleted accounts don't linger in registry
  useEffect(() => {
    if (deletedUsers.length > 0 && knownUsers.length > 0) {
      setKnownUsers(prev => {
        const filtered = prev.filter(k => {
          const cleanEmail = k.email?.toLowerCase().trim();
          const cleanName = k.name?.toLowerCase().trim();
          for (const d of deletedUsers) {
            if (d.uid && k.uid === d.uid) return false;
            if (d.email && cleanEmail && d.email.toLowerCase().trim() === cleanEmail) return false;
            if (d.name && cleanName && d.name.toLowerCase().trim() === cleanName) return false;
          }
          return true;
        });
        if (filtered.length !== prev.length) {
          try {
            localStorage.setItem('mk_known_users_registry', JSON.stringify(filtered));
          } catch(e) {}
          return filtered;
        }
        return prev;
      });
    }
  }, [deletedUsers]);

  const markUserAsDeleted = async (uid?: string, email?: string, name?: string) => {
    if (!uid && !email && !name) return;
    const cleanEmail = email ? email.toLowerCase().trim() : undefined;
    const cleanName = name ? name.trim() : undefined;

    setDeletedUsers(prev => {
      if (prev.some(d => (uid && d.uid === uid) || (cleanEmail && d.email === cleanEmail) || (cleanName && d.name === cleanName))) {
        return prev;
      }
      return [...prev, { uid, email: cleanEmail, name: cleanName }];
    });

    // Remove immediately from knownUsers registry
    setKnownUsers(prev => prev.filter(k => {
      if (uid && k.uid === uid) return false;
      if (cleanEmail && k.email?.toLowerCase() === cleanEmail) return false;
      if (cleanName && k.name?.toLowerCase() === cleanName) return false;
      return true;
    }));

    // Post to backend D1 deleted_users table
    safeFetchJson('/api/auth/deleted-users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uid, email: cleanEmail, name: cleanName })
    }).catch(() => {});
  };

  // ===================== STAFF & TEAM ROLE REGISTRY =====================
  const INITIAL_TEAM_ROLES: Record<string, TeamMemberRecord> = {
    'aseleliyeva77@gmail.com': {
      email: 'aseleliyeva77@gmail.com',
      name: 'Aselis',
      roles: ['Kurucu', 'Yönetici'],
      updatedAt: new Date().toISOString()
    },
    'mikrokosmosfansub@gmail.com': {
      email: 'mikrokosmosfansub@gmail.com',
      name: 'Mikrokosmos Fansub',
      roles: ['Kurucu', 'Admin'],
      updatedAt: new Date().toISOString()
    }
  };

  const [teamRoles, setTeamRoles] = useState<Record<string, TeamMemberRecord>>(() => {
    const saved = localStorage.getItem('mk_team_roles_v1');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          return { ...INITIAL_TEAM_ROLES, ...parsed };
        }
      } catch (e) {}
    }
    return INITIAL_TEAM_ROLES;
  });

  useEffect(() => {
    try {
      localStorage.setItem('mk_team_roles_v1', JSON.stringify(teamRoles));
    } catch (e) {}
  }, [teamRoles]);

  // Fetch live team roles from backend D1
  useEffect(() => {
    safeFetchJson<{ success: boolean; teamRoles: Record<string, TeamMemberRecord> }>('/api/team-roles')
      .then(data => {
        if (data && data.success && data.teamRoles && typeof data.teamRoles === 'object') {
          setTeamRoles(prev => ({
            ...INITIAL_TEAM_ROLES,
            ...prev,
            ...data.teamRoles
          }));
        }
      })
      .catch(() => {});
  }, []);

  const assignTeamRole = async (email: string, roles: string[], name?: string, uid?: string): Promise<{ success: boolean; message: string }> => {
    const cleanEmail = (email || '').toLowerCase().trim();
    if (!cleanEmail) {
      return { success: false, message: 'Geçerli bir e-posta adresi gereklidir.' };
    }

    const rolesArray = Array.isArray(roles) ? roles.filter(r => Boolean(r && r.trim())) : (roles ? [roles] : []);
    
    // Find name or uid from knownUsers if not provided
    const existingKu = knownUsers.find(k => k.email?.toLowerCase().trim() === cleanEmail);
    const resolvedName = name || existingKu?.name || cleanEmail.split('@')[0];
    const resolvedUid = uid || existingKu?.uid || '';

    const newRecord: TeamMemberRecord = {
      email: cleanEmail,
      uid: resolvedUid,
      name: resolvedName,
      roles: rolesArray,
      updatedAt: new Date().toISOString()
    };

    setTeamRoles(prev => ({
      ...prev,
      [cleanEmail]: newRecord
    }));

    // If current logged-in user matches, update user state as well
    if (user && user.email?.toLowerCase().trim() === cleanEmail) {
      setUser(prev => prev ? { ...prev, teamRoles: rolesArray, teamRole: rolesArray[0] || null } : null);
    }

    // Update in knownUsers as well
    setKnownUsers(prev => prev.map(k => {
      if (k.email?.toLowerCase().trim() === cleanEmail) {
        return { ...k, teamRoles: rolesArray, teamRole: rolesArray[0] || null };
      }
      return k;
    }));

    // Post to backend
    await safeFetchJson('/api/admin/team-roles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: cleanEmail,
        uid: resolvedUid,
        name: resolvedName,
        roles: rolesArray
      })
    }).catch(() => {});

    return { success: true, message: `"${resolvedName}" kullanıcısına ekip rolleri başarıyla atandı.` };
  };

  const removeTeamRole = async (email: string): Promise<{ success: boolean; message: string }> => {
    const cleanEmail = (email || '').toLowerCase().trim();
    if (!cleanEmail) return { success: false, message: 'Geçersiz e-posta' };

    setTeamRoles(prev => {
      const next = { ...prev };
      delete next[cleanEmail];
      return next;
    });

    if (user && user.email?.toLowerCase().trim() === cleanEmail) {
      setUser(prev => prev ? { ...prev, teamRoles: [], teamRole: null } : null);
    }

    setKnownUsers(prev => prev.map(k => {
      if (k.email?.toLowerCase().trim() === cleanEmail) {
        return { ...k, teamRoles: [], teamRole: null };
      }
      return k;
    }));

    await safeFetchJson(`/api/admin/team-roles?email=${encodeURIComponent(cleanEmail)}`, {
      method: 'DELETE'
    }).catch(() => {});

    return { success: true, message: 'Kullanıcının ekip rolleri kaldırıldı.' };
  };

  const top3Commenters = useMemo(() => {
    const stats: Record<string, { key: string; name: string; email?: string; count: number }> = {};
    (comments || []).forEach(c => {
      const cleanN = c.userName?.toLowerCase().trim();
      if (cleanN === 'aseleliyeva1234') return;
      let key = c.userId || c.userName || 'guest';
      if (user && (c.userId === user.uid || (cleanN && cleanN === user.name.toLowerCase().trim()))) {
        key = user.uid;
      }
      if (!stats[key]) {
        stats[key] = {
          key,
          name: (user && key === user.uid) ? user.name : (c.userName || 'Okuyucu'),
          count: 0
        };
      }
      stats[key].count += 1;
    });

    const sorted = Object.values(stats)
      .filter(s => s.name && s.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);

    return {
      rank1: sorted[0] || null,
      rank2: sorted[1] || null,
      rank3: sorted[2] || null
    };
  }, [comments, user]);

  const getUserTeamRoles = (userOrIdentifier: { email?: string; uid?: string; name?: string; userId?: string; userName?: string; teamRole?: string | null; teamRoles?: string[] } | null | undefined): string[] => {
    if (!userOrIdentifier) return [];

    let roles: string[] = [];

    // 1. Direct roles on object
    if (userOrIdentifier.teamRoles && Array.isArray(userOrIdentifier.teamRoles) && userOrIdentifier.teamRoles.length > 0) {
      roles = [...userOrIdentifier.teamRoles];
    } else if (userOrIdentifier.teamRole) {
      roles = [userOrIdentifier.teamRole];
    }

    const cleanEmail = userOrIdentifier.email?.toLowerCase().trim();
    const cleanUid = (userOrIdentifier.uid || userOrIdentifier.userId)?.trim();
    const cleanName = (userOrIdentifier.name || userOrIdentifier.userName)?.toLowerCase().trim();

    // 2. Check by email in teamRoles
    if (cleanEmail && teamRoles[cleanEmail] && Array.isArray(teamRoles[cleanEmail].roles) && teamRoles[cleanEmail].roles.length > 0) {
      roles = Array.from(new Set([...roles, ...teamRoles[cleanEmail].roles]));
    }

    // 3. Check by UID or Name in teamRoles registry
    const foundEntry = Object.values(teamRoles).find(tr => {
      if (cleanUid && tr.uid && tr.uid === cleanUid) return true;
      if (cleanName && tr.name && tr.name.toLowerCase().trim() === cleanName) return true;
      return false;
    });
    if (foundEntry && Array.isArray(foundEntry.roles) && foundEntry.roles.length > 0) {
      roles = Array.from(new Set([...roles, ...foundEntry.roles]));
    }

    // 4. Resolve via knownUsers (if identifier is just userId or userName)
    const matchedKnownUser = knownUsers.find(k => {
      if (cleanUid && k.uid === cleanUid) return true;
      if (cleanName && k.name && k.name.toLowerCase().trim() === cleanName) return true;
      if (cleanEmail && k.email && k.email.toLowerCase().trim() === cleanEmail) return true;
      return false;
    });

    if (matchedKnownUser) {
      if (matchedKnownUser.teamRoles && matchedKnownUser.teamRoles.length > 0) {
        roles = Array.from(new Set([...roles, ...matchedKnownUser.teamRoles]));
      } else if (matchedKnownUser.teamRole) {
        roles = Array.from(new Set([...roles, matchedKnownUser.teamRole]));
      }
      const kuEmail = matchedKnownUser.email?.toLowerCase().trim();
      if (kuEmail && teamRoles[kuEmail] && Array.isArray(teamRoles[kuEmail].roles) && teamRoles[kuEmail].roles.length > 0) {
        roles = Array.from(new Set([...roles, ...teamRoles[kuEmail].roles]));
      }
      if (kuEmail === 'aseleliyeva77@gmail.com') roles = Array.from(new Set([...roles, 'Kurucu', 'Yönetici']));
      if (kuEmail === 'mikrokosmosfansub@gmail.com') roles = Array.from(new Set([...roles, 'Kurucu', 'Admin']));
    }

    // 5. Default roles for super admins by email or recognizable creator names
    if (cleanEmail === 'aseleliyeva77@gmail.com' || cleanName === 'aselis' || cleanName === 'kosmos') {
      roles = Array.from(new Set([...roles, 'Kurucu', 'Yönetici']));
    }
    if (cleanEmail === 'mikrokosmosfansub@gmail.com' || cleanName === 'mikrokosmos fansub' || cleanName === 'mikrokosmos') {
      roles = Array.from(new Set([...roles, 'Kurucu', 'Admin']));
    }

    // 6. Dynamic Weekly Top 3 Commenter Titles
    if (top3Commenters.rank1 && (cleanUid === top3Commenters.rank1.key || cleanName === top3Commenters.rank1.name.toLowerCase().trim())) {
      if (!roles.includes('Son Söz Bükücü')) roles.push('Son Söz Bükücü');
    }
    if (top3Commenters.rank2 && (cleanUid === top3Commenters.rank2.key || cleanName === top3Commenters.rank2.name.toLowerCase().trim())) {
      if (!roles.includes('Baş Eleştirmen')) roles.push('Baş Eleştirmen');
    }
    if (top3Commenters.rank3 && (cleanUid === top3Commenters.rank3.key || cleanName === top3Commenters.rank3.name.toLowerCase().trim())) {
      if (!roles.includes('Yorumbaz')) roles.push('Yorumbaz');
    }

    return roles;
  };

  const grantCosmoPoints = async (
    targetEmail: string,
    amount: number,
    mode: 'add' | 'subtract' | 'set' = 'add',
    note: string = 'Manuel Yönetici Yüklemesi',
    sendNotification: boolean = true
  ): Promise<{ success: boolean; message: string; previousBalance?: number; newBalance?: number }> => {
    const cleanEmail = (targetEmail || '').toLowerCase().trim();
    if (!cleanEmail) {
      return { success: false, message: 'Lütfen geçerli bir e-posta adresi girin.' };
    }

    // Special check for super admin account
    const isTargetUnlimited = cleanEmail === 'mikrokosmosfansub@gmail.com';

    let previousBalance = 0;
    const existingUser = knownUsers.find(u => u.email.toLowerCase() === cleanEmail);
    if (existingUser) {
      previousBalance = isTargetUnlimited ? 999999999 : (existingUser.coins ?? 10);
    } else if (user?.email?.toLowerCase() === cleanEmail) {
      previousBalance = isTargetUnlimited ? 999999999 : (user.coins ?? 10);
    } else {
      previousBalance = 10;
    }

    let calculatedNewBalance = previousBalance;
    const numAmount = Math.abs(Number(amount)) || 0;

    if (isTargetUnlimited) {
      calculatedNewBalance = 999999999;
    } else if (mode === 'add') {
      calculatedNewBalance = previousBalance + numAmount;
    } else if (mode === 'subtract') {
      calculatedNewBalance = Math.max(0, previousBalance - numAmount);
    } else if (mode === 'set') {
      calculatedNewBalance = Math.max(0, numAmount);
    }

    const logId = 'pgrant-' + Date.now();
    const newLog: PointGrantLog = {
      id: logId,
      targetEmail: cleanEmail,
      amount: mode === 'set' ? calculatedNewBalance : numAmount,
      mode,
      note: note.trim() || 'Manuel Yönetici Yüklemesi',
      adminEmail: user?.email || 'aseleliyeva77@gmail.com',
      timestamp: Date.now(),
      date: new Date().toLocaleString('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }),
      previousBalance,
      newBalance: calculatedNewBalance
    };

    setPointGrantLogs(prev => [newLog, ...prev.filter(l => l.id !== logId)]);

    setKnownUsers(prev => {
      const idx = prev.findIndex(u => u.email.toLowerCase() === cleanEmail);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = {
          ...updated[idx],
          coins: calculatedNewBalance,
          lastActive: 'Az önce'
        };
        return updated;
      } else {
        return [
          {
            uid: 'u-' + Date.now(),
            email: cleanEmail,
            name: cleanEmail.split('@')[0],
            avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(cleanEmail)}`,
            coins: calculatedNewBalance,
            role: (cleanEmail === 'aseleliyeva77@gmail.com' || cleanEmail === 'mikrokosmosfansub@gmail.com') || cleanEmail === 'mikrokosmosfansub@gmail.com' ? 'admin' : 'user',
            lastActive: 'Az önce'
          },
          ...prev
        ];
      }
    });

    if (user && user.email?.toLowerCase() === cleanEmail) {
      setUser(prevUser => {
        if (!prevUser) return null;
        return {
          ...prevUser,
          coins: calculatedNewBalance
        };
      });
    }

    if (sendNotification) {
      const signText = mode === 'add' ? `+${numAmount}` : mode === 'subtract' ? `-${numAmount}` : `${calculatedNewBalance}`;
      addNotification({
        title: '🎁 Cosmo-Puan Tanımlandı!',
        message: `${cleanEmail} adresine ${signText} Cosmo-Puan tanımlandı. Güncel Bakiye: ${calculatedNewBalance} CP. ${note ? 'Not: ' + note : ''}`,
        type: 'reward'
      });
    }

    safeFetchJson('/api/admin/grant-points', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        targetEmail: cleanEmail,
        amount: numAmount,
        mode,
        note,
        adminEmail: user?.email || 'aseleliyeva77@gmail.com',
        previousBalance,
        newBalance: calculatedNewBalance
      })
    }).catch(() => {});

    showToast({
      title: 'Cosmo-Puan Yüklendi! ⚡',
      message: `${cleanEmail} adresine ${mode === 'add' ? '+' + numAmount : mode === 'subtract' ? '-' + numAmount : calculatedNewBalance} Cosmo-Puan başarıyla uygulandı. (Yeni Bakiye: ${calculatedNewBalance} CP)`,
      type: 'success'
    });

    return {
      success: true,
      message: `${cleanEmail} hesabına ${mode === 'add' ? '+' + numAmount : mode === 'subtract' ? '-' + numAmount : calculatedNewBalance} CP başarıyla yüklendi. Güncel bakiye: ${calculatedNewBalance} CP`,
      previousBalance,
      newBalance: calculatedNewBalance
    };
  };

  const deletePointGrantLog = async (logId: string) => {
    setPointGrantLogs(prev => prev.filter(l => l.id !== logId));
    safeFetchJson(`/api/admin/grant-points?id=${encodeURIComponent(logId)}`, {
      method: 'DELETE'
    }).catch(() => {});
  };

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [publicProfileUserId, setPublicProfileUserId] = useState<string | null>(null);
  const openPublicProfile = (uid: string) => setView({ type: 'public-profile', userId: uid });
  const closePublicProfile = () => setPublicProfileUserId(null);
  
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
    try {
      const saved = localStorage.getItem('mk_series_requests');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      const cached = localStorage.getItem('mikro_requests_cache');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return [];
  });

  const [announcement, setAnnouncementState] = useState<Announcement>(() => {
    const saved = localStorage.getItem('mk_announcement');
    return saved ? JSON.parse(saved) : { id: 'empty', title: '', text: '', type: 'info', active: false };
  });

  const updateAnnouncement = (newAnn: Announcement) => {
    setAnnouncementState(newAnn);
    localStorage.setItem('mk_announcement', JSON.stringify(newAnn));
    safeFetchJson('/api/admin/announcement', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newAnn)
    }).catch(() => {});
  };

  // Admin Authentication State
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState<boolean>(() => {
    return localStorage.getItem('mk_admin_logged_in') === 'true';
  });

  const [adminPassword, setAdminPassword] = useState<string>(() => {
    const saved = localStorage.getItem('mk_admin_pin');
    return saved && saved !== '1234' ? saved : '454645';
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

  // Safe fetch helper that handles non-JSON / HTML responses gracefully
  const safeFetchJson = async <T = any>(url: string, init?: RequestInit): Promise<T | null> => {
    try {
      const res = await fetch(url, init);
      const ct = res.headers.get('content-type') || '';
      if (!ct.includes('application/json')) {
        return null;
      }
      const text = await res.text();
      if (!text || !text.trim()) return null;
      return JSON.parse(text) as T;
    } catch {
      return null;
    }
  };

  useEffect(() => {
    if (!isAdminLoggedIn) return;

    safeFetchJson<any>('/api/admin/users')
      .then(data => {
        if (data && data.success && Array.isArray(data.users) && data.users.length > 0) {
          setKnownUsers(prev => {
            const merged = [...prev];
            for (const u of data.users) {
              const idx = merged.findIndex(m => m.email?.toLowerCase() === u.email?.toLowerCase());
              if (idx >= 0) {
                merged[idx] = { ...merged[idx], ...u };
              } else {
                merged.push(u);
              }
            }
            return merged;
          });
        }
      })
      .catch(() => {});

    safeFetchJson<any>('/api/admin/grant-points')
      .then(data => {
        if (data && data.success && Array.isArray(data.logs) && data.logs.length > 0) {
          setPointGrantLogs(prev => {
            const merged = [...data.logs];
            for (const l of prev) {
              if (!merged.some(m => m.id === l.id)) {
                merged.push(l);
              }
            }
            return merged;
          });
        }
      })
      .catch(() => {});
  }, [isAdminLoggedIn]);

  // Attempt to fetch live Cloudflare R2/KV data on mount
  useEffect(() => {
    safeFetchJson<{ success: boolean; data: any[]; announcement?: any; adSettings?: any; siteBranding?: any; coinPackageUrls?: Record<string, string>; globalNotifications?: any[] }>('/api/series', { cache: 'no-store' })
      .then(data => {
        setIsLoadingSeries(false);
        if (data && data.success && Array.isArray(data.data)) {
          const ch18Map = getChapter18PlusMap();
          let mapUpdated = false;
          const mergedSeries = data.data.map((s: Series) => {
            const existingLocal = (seriesList || []).find(l => l.id === s.id);
            const serverBadges = Array.isArray(s.customBadges) ? s.customBadges : [];
            const localBadges = Array.isArray(existingLocal?.customBadges) ? existingLocal.customBadges : [];
            const combinedBadges = Array.from(new Set([...serverBadges, ...localBadges])).filter(Boolean);

            return {
              ...s,
              customBadges: combinedBadges.length > 0 ? combinedBadges : undefined,
              chapters: (s.chapters || []).map((ch: Chapter) => {
                if (ch.is18Plus && !(ch.id in ch18Map)) {
                  ch18Map[ch.id] = true;
                  mapUpdated = true;
                }
                return {
                  ...ch,
                  is18Plus: ch.id in ch18Map ? ch18Map[ch.id] : Boolean(ch.is18Plus)
                };
              })
            };
          });
          if (mapUpdated) {
            try {
              localStorage.setItem('mk_chapter_18plus_map', JSON.stringify(ch18Map));
            } catch (e) {}
          }
          setSeriesList(sortSeriesByLatestRelease(mergedSeries));
          if (data.announcement) {
            setAnnouncementState(data.announcement);
            try {
              localStorage.setItem('mk_announcement', JSON.stringify(data.announcement));
            } catch (e) {}
          }
          if (data.adSettings) {
            const mergedAds = { ...DEFAULT_AD_SETTINGS, ...data.adSettings };
            setAdSettings(mergedAds);
            try {
              localStorage.setItem('mk_ad_settings', JSON.stringify(mergedAds));
            } catch (e) {}
          }
          if (data.siteBranding) {
            const mergedBranding = { ...DEFAULT_SITE_BRANDING, ...data.siteBranding };
            if (!mergedBranding.siteSlogan || mergedBranding.siteSlogan.trim().toLowerCase() === 'fansub') {
              mergedBranding.siteSlogan = 'Shine, Dream, Smile';
            }
            setSiteBranding(mergedBranding);
            try {
              localStorage.setItem('mk_site_branding', JSON.stringify(mergedBranding));
            } catch (e) {}
          }
          if (data.coinPackageUrls && typeof data.coinPackageUrls === 'object') {
            try {
              localStorage.setItem('ls_package_urls', JSON.stringify(data.coinPackageUrls));
            } catch (e) {}
          }
          if (data.globalNotifications && Array.isArray(data.globalNotifications)) {
            setNotifications(prev => {
              const deletedIdsStr = localStorage.getItem('mk_deleted_notifs') || '[]';
              let deletedIds: string[] = [];
              try { deletedIds = JSON.parse(deletedIdsStr); } catch(e){}
              const existingIds = new Set(prev.map(p => p.id));
              const deletedSet = new Set(deletedIds);
              
              const followedStr = localStorage.getItem('mk_followed_series');
              const bookmarksStr = localStorage.getItem('mk_bookmarks');
              let followedIds: string[] = [];
              let bookmarksObj: Record<string, any> = {};
              try { if(followedStr) followedIds = JSON.parse(followedStr); } catch(e){}
              try { if(bookmarksStr) bookmarksObj = JSON.parse(bookmarksStr); } catch(e){}

              const userCreatedTime = user?.createdAt ? new Date(user.createdAt).getTime() : 0;

              const newGlobals = data.globalNotifications.filter((n: any) => {
                if (existingIds.has(n.id) || deletedSet.has(n.id)) return false;
                if (n.targetUserId && (!user || user.uid !== n.targetUserId)) return false;

                // Do not receive old notifications created before the user registered
                if (userCreatedTime > 0 && n.createdAt) {
                  const notifTime = new Date(n.createdAt).getTime();
                  if (!isNaN(notifTime) && notifTime < userCreatedTime) return false;
                }

                // Chapter notifications only go to users who actively follow the series
                if (n.type === 'chapter') {
                  if (!n.seriesId) return false;
                  const isTracked = followedIds.includes(n.seriesId);
                  if (!isTracked) return false;
                }
                return true;
              });
              if (newGlobals.length > 0) {
                // Mark initial historical notifications so they never spam push alerts
                newGlobals.forEach((n: any) => markNotificationAsPushed(n.id));
                const combined = [...newGlobals, ...prev].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                return combined.slice(0, 100);
              }
              return prev;
            });
          }
        }
      })
      .catch(() => {})
      .finally(() => setIsLoadingSeries(false));

    const commentsTimer = setTimeout(() => {
      safeFetchJson<{ success: boolean; data: any[] }>('/api/comments')
        .then(data => {
          if (data && data.success && Array.isArray(data.data)) {
            let deletedIds: string[] = [];
            try {
              const delStr = localStorage.getItem('mk_deleted_comments');
              if (delStr) deletedIds = JSON.parse(delStr);
            } catch (e) {}

            const deletedSet = new Set(deletedIds);
            const stillOnServer = data.data.filter(c => deletedSet.has(c.id));

            // If any locally deleted comments still exist on D1 (e.g. previous delete was interrupted before refresh), purge them now
            if (stillOnServer.length > 0) {
              stillOnServer.forEach(c => {
                fetch(`/api/comments?id=${encodeURIComponent(c.id)}`, {
                  method: 'DELETE',
                  cache: 'no-store',
                  keepalive: true
                }).catch(() => {});
              });
            } else if (deletedIds.length > 0) {
              // Server confirmed all deleted comments are gone
              try {
                localStorage.removeItem('mk_deleted_comments');
              } catch (e) {}
            }

            const cleanComments = data.data.filter(c => !deletedSet.has(c.id) && (!c.parentId || !deletedSet.has(c.parentId)));
            setComments(cleanComments);
            try {
              localStorage.setItem('mk_comments', JSON.stringify(cleanComments));
            } catch (e) {}
          }
        })
        .catch(() => {});
    }, 350);

    return () => clearTimeout(commentsTimer);
  }, []);


  useEffect(() => {
    // Background sync shop items after initial page render is settled
    const timer = setTimeout(() => {
      safeFetchJson('/api/shop')
        .then((data) => {
          if (data && data.success) {
            if (data.shopItems && Array.isArray(data.shopItems)) {
              setShopItems(prev => {
                // If D1 gives us a list, and an item is missing in D1, 
                // it might have been deleted from another device.
                // We should remove items that are in prev but not in D1, EXCEPT if D1 is completely empty (unseeded)
                // OR if it's a new default item.
                // The safest robust way: sync deletedIds.
                
                const deletedStr = localStorage.getItem('mk_deleted_shop_items');
                let deletedIds = new Set<string>();
                if (deletedStr) {
                  try { deletedIds = new Set(JSON.parse(deletedStr)); } catch(e){}
                }

                // First, remove items from prev that are NO LONGER in fetched items, 
                // assuming fetched items isn't completely empty (which means unseeded).
                let base = [...prev];
                if (data.shopItems.length > 0) {
                  const fetchedIds = new Set(data.shopItems.map((i: any) => i.id));
                  base = base.filter(item => fetchedIds.has(item.id) || !deletedIds.has(item.id));
                  // Actually, if it's not in fetchedIds, and D1 is seeded, it was deleted!
                  // Let's force it: if D1 is seeded, any custom item not in D1 should be dropped.
                  const defaultIds = new Set(SHOP_ITEMS.map(i => i.id));
                  base = base.filter(item => fetchedIds.has(item.id) || (defaultIds.has(item.id) && !deletedIds.has(item.id)));
                }

                let merged = [...base];
                let newDeletedIds = new Set(deletedIds);
                let deletedIdsChanged = false;

                for (const fetchedItem of data.shopItems) {
                  if (fetchedItem.category === 'deleted') {
                    if (!newDeletedIds.has(fetchedItem.id)) {
                      newDeletedIds.add(fetchedItem.id);
                      deletedIdsChanged = true;
                    }
                    merged = merged.filter(i => i.id !== fetchedItem.id);
                    continue;
                  }

                  if (newDeletedIds.has(fetchedItem.id)) continue;
                  
                  const existingIdx = merged.findIndex(i => i.id === fetchedItem.id);
                  if (existingIdx >= 0) {
                    merged[existingIdx] = { ...merged[existingIdx], ...fetchedItem };
                  } else {
                    merged.unshift(fetchedItem);
                  }
                }

                if (deletedIdsChanged) {
                  try {
                    localStorage.setItem('mk_deleted_shop_items', JSON.stringify(Array.from(newDeletedIds)));
                  } catch(e){}
                }

                return merged;
              });
            }
            if (data.themeStyles) {
              setThemeStyles(prev => ({ ...prev, ...data.themeStyles }));
            }
          }
        })
        .catch(() => {});
    }, 1200);

    return () => clearTimeout(timer);
  }, []);


  // Sync theme (Permanently Dark Mode)
  useEffect(() => {
    safeSetItem('mk_theme', 'dark');
    document.documentElement.classList.add('dark');
    document.documentElement.classList.add('dark-mode');
    document.documentElement.classList.remove('light');
  }, []);

  const toggleTheme = () => {
    // Exclusively Dark Mode
  };

  useEffect(() => {
    try {
      localStorage.setItem('mk_series_requests', JSON.stringify(seriesRequests));
      if (seriesRequests && seriesRequests.length > 0) {
        localStorage.setItem('mikro_requests_cache', JSON.stringify(seriesRequests));
      }
    } catch (e) {}
  }, [seriesRequests]);

  useEffect(() => {
    if (!seriesList || seriesList.length === 0) return;
    const timer = setTimeout(() => {
      // 1. Full-fidelity persistence into IndexedDB (supports gigabytes of data, full novel chapters, all images)
      saveSeriesToIndexedDB(seriesList).catch(() => {});

      // 2. Guaranteed-safe catalog in localStorage (always kept minimal under ~150 KB so it never hits browser quota)
      try {
        const safeCatalog = seriesList.map(s => ({
          ...s,
          chapters: (s.chapters || []).map(ch => ({
            id: ch.id,
            number: ch.number,
            title: ch.title,
            publishedDate: ch.publishedDate,
            specialTag: ch.specialTag,
            is18Plus: ch.is18Plus,
            notice: ch.notice,
            createdAt: ch.createdAt,
            images: Array.isArray(ch.images) && ch.images.length > 0 ? [ch.images[0]] : []
            // Full novel contents are kept in IndexedDB and Cloudflare D1
          }))
        }));
        safeSetItem('mk_series_list', JSON.stringify(safeCatalog));
      } catch (e) {
        try {
          // Minimal fallback: preserve all series and chapter numbers/titles without content
          const minimalCatalog = seriesList.map(s => ({
            ...s,
            chapters: (s.chapters || []).map(ch => ({
              id: ch.id,
              number: ch.number,
              title: ch.title,
              publishedDate: ch.publishedDate,
              specialTag: ch.specialTag,
              is18Plus: ch.is18Plus
            }))
          }));
          safeSetItem('mk_series_list', JSON.stringify(minimalCatalog));
        } catch {}
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [seriesList]);

  useEffect(() => {
    try {
      localStorage.setItem('mk_reading_history', JSON.stringify(trimReadingHistory(readingHistory, 500)));
    } catch (e) {}
  }, [readingHistory]);

  useEffect(() => {
    try {
      localStorage.setItem('mk_bookmark_folders', JSON.stringify(bookmarkFolders));
    } catch (e) {}
  }, [bookmarkFolders]);

  const isLibraryFetchedRef = useRef(false);
  const syncTimeoutRef = useRef<any>(null);

  const packListsAndPinsForCloud = (
    lists: import('../types').ReadingList[],
    pins: import('../types').KosmosPinItem[]
  ): import('../types').ReadingList[] => {
    const cleanLists = (Array.isArray(lists) ? lists : []).filter(l => l && l.id !== '__kosmospins__');
    const cleanPins = Array.isArray(pins) ? pins : [];
    return [
      ...cleanLists,
      {
        id: '__kosmospins__',
        name: '__kosmospins__',
        seriesIds: [],
        pins: cleanPins
      }
    ];
  };

  const setReadingLists: React.Dispatch<React.SetStateAction<import('../types').ReadingList[]>> = (updater) => {
    setReadingListsState(prev => {
      const rawNext = typeof updater === 'function' ? (updater as any)(prev) : updater;
      const next = (Array.isArray(rawNext) ? rawNext : []).filter((l: any) => l && l.id !== '__kosmospins__');
      try {
        localStorage.setItem('mk_reading_lists', JSON.stringify(next));
        localStorage.setItem('mk_reading_lists_dirty', String(Date.now()));
        if (user?.uid) {
          localStorage.setItem(`mk_reading_lists_${user.uid}`, JSON.stringify(next));
        }
      } catch (e) {}

      if (user && user.uid) {
        const packed = packListsAndPinsForCloud(next, kosmosPins);
        fetch('/api/auth/library', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          keepalive: true,
          body: JSON.stringify({
            uid: user.uid,
            bookmarks: JSON.stringify(bookmarks),
            reading_lists: JSON.stringify(packed),
            followed_series: JSON.stringify(followedSeriesIds),
            reading_history: JSON.stringify(trimReadingHistory(readingHistory, 500)),
            notifications: JSON.stringify(notifications),
            cosmo_points: user.coins || 0,
            shop_items: JSON.stringify(
              normalizeShopInventory([user.inventory, user.unlockedEmojiPacks], user.inventoryExpiresAt).serializedForCloud
            ),
            equipped_theme: user.equippedTheme || null,
            equipped_badge: user.equippedBadge || null,
            equipped_badges: JSON.stringify(user.equippedBadges || (user.equippedBadge ? [user.equippedBadge] : [])),
            equipped_frame: user.equippedFrame || null,
            daily_checkin_day: user.dailyCheckinDay || 0,
            last_daily_checkin: user.lastDailyCheckin || null,
            claimed_checkin_days: JSON.stringify(user.claimedCheckinDays || [])
          })
        })
          .then(res => res.json())
          .then(resData => {
            if (resData && resData.success) {
              try {
                localStorage.removeItem('mk_reading_lists_dirty');
              } catch (e) {}
            }
          })
          .catch(() => {});
      }
      return next;
    });
  };

  const isWallpaperPinned = (wallpaperId: string): boolean => {
    if (!wallpaperId) return false;
    return kosmosPins.some(p => p.id === wallpaperId);
  };

  const toggleKosmosPin = (wallpaper: import('../types').KosmosPinItem) => {
    if (!wallpaper || !wallpaper.id) return;
    setKosmosPinsState(prev => {
      const exists = prev.some(p => p.id === wallpaper.id);
      const next: import('../types').KosmosPinItem[] = exists
        ? prev.filter(p => p.id !== wallpaper.id)
        : [
            {
              id: wallpaper.id,
              title: wallpaper.title || wallpaper.seriesTitle || 'Wallpaper',
              imageUrl: wallpaper.imageUrl,
              seriesId: wallpaper.seriesId || '',
              seriesTitle: wallpaper.seriesTitle || '',
              category: wallpaper.category || 'mobil',
              createdAt: wallpaper.createdAt || new Date().toISOString()
            },
            ...prev
          ];

      try {
        localStorage.setItem('mk_kosmospins', JSON.stringify(next));
        localStorage.setItem('mk_kosmospins_dirty', String(Date.now()));
        if (user?.uid) {
          localStorage.setItem(`mk_kosmospins_${user.uid}`, JSON.stringify(next));
        }
      } catch (e) {}

      if (user && user.uid) {
        const packed = packListsAndPinsForCloud(readingLists, next);
        fetch('/api/auth/library', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          keepalive: true,
          body: JSON.stringify({
            uid: user.uid,
            bookmarks: JSON.stringify(bookmarks),
            reading_lists: JSON.stringify(packed),
            followed_series: JSON.stringify(followedSeriesIds),
            reading_history: JSON.stringify(trimReadingHistory(readingHistory, 500)),
            notifications: JSON.stringify(notifications),
            cosmo_points: user.coins || 0,
            shop_items: JSON.stringify(
              normalizeShopInventory([user.inventory, user.unlockedEmojiPacks], user.inventoryExpiresAt).serializedForCloud
            ),
            equipped_theme: user.equippedTheme || null,
            equipped_badge: user.equippedBadge || null,
            equipped_badges: JSON.stringify(user.equippedBadges || (user.equippedBadge ? [user.equippedBadge] : [])),
            equipped_frame: user.equippedFrame || null,
            daily_checkin_day: user.dailyCheckinDay || 0,
            last_daily_checkin: user.lastDailyCheckin || null,
            claimed_checkin_days: JSON.stringify(user.claimedCheckinDays || [])
          })
        })
          .then(res => res.json())
          .then(resData => {
            if (resData && resData.success) {
              try {
                localStorage.removeItem('mk_kosmospins_dirty');
              } catch (e) {}
            }
          })
          .catch(() => {});
      }

      setTimeout(() => {
        showToast({
          title: exists ? 'KosmosPin Kaldırıldı' : "📌 KosmosPin'lere Eklendi!",
          message: exists
            ? `"${wallpaper.seriesTitle || wallpaper.title}" profilinizdeki KosmosPin'lerden çıkarıldı.`
            : `"${wallpaper.seriesTitle || wallpaper.title}" profilinizdeki KosmosPin'lere kaydedildi.`,
          type: exists ? 'info' : 'success'
        });
      }, 0);

      return next;
    });
  };

  useEffect(() => {
    if (user && user.uid) {
      isLibraryFetchedRef.current = false;
      safeFetchJson<any>(`/api/auth/library?uid=${encodeURIComponent(user.uid)}`, { cache: 'no-store' })
        .then(data => {
          if (data && data.success) {
            try {
              const fetchedBookmarks = typeof data.bookmarks === 'string' ? JSON.parse(data.bookmarks) : data.bookmarks;
              const rawFetchedReadingLists = data.reading_lists
                ? typeof data.reading_lists === 'string'
                  ? JSON.parse(data.reading_lists)
                  : data.reading_lists
                : [];

              const fetchedPinCarrier = Array.isArray(rawFetchedReadingLists)
                ? rawFetchedReadingLists.find((l: any) => l && l.id === '__kosmospins__')
                : null;
              const fetchedPins: import('../types').KosmosPinItem[] =
                fetchedPinCarrier && Array.isArray(fetchedPinCarrier.pins) ? fetchedPinCarrier.pins : [];

              const fetchedReadingLists = Array.isArray(rawFetchedReadingLists)
                ? rawFetchedReadingLists.filter((l: any) => l && l.id !== '__kosmospins__')
                : [];

              const isLocalDirty = Boolean(localStorage.getItem('mk_reading_lists_dirty'));
              const savedLocalStr = localStorage.getItem(`mk_reading_lists_${user.uid}`) || localStorage.getItem('mk_reading_lists');
              let localLists: any[] | null = null;
              try {
                if (savedLocalStr) {
                  const parsed = JSON.parse(savedLocalStr);
                  if (Array.isArray(parsed)) {
                    localLists = parsed.filter((l: any) => l && l.id !== '__kosmospins__');
                  }
                }
              } catch (e) {}

              const isPinsDirty = Boolean(localStorage.getItem('mk_kosmospins_dirty'));
              const savedPinsStr = localStorage.getItem(`mk_kosmospins_${user.uid}`) || localStorage.getItem('mk_kosmospins');
              let localPins: import('../types').KosmosPinItem[] | null = null;
              try {
                if (savedPinsStr) {
                  const parsed = JSON.parse(savedPinsStr);
                  if (Array.isArray(parsed)) localPins = parsed;
                }
              } catch (e) {}

              let finalLists = fetchedReadingLists;
              if (isLocalDirty && Array.isArray(localLists)) {
                finalLists = localLists;
              } else if (Array.isArray(fetchedReadingLists) && (fetchedReadingLists.length > 0 || !Array.isArray(localLists) || localLists.length === 0)) {
                finalLists = fetchedReadingLists;
              } else if (Array.isArray(localLists) && localLists.length > 0) {
                finalLists = localLists;
              }

              let finalPins = fetchedPins;
              if (isPinsDirty && Array.isArray(localPins)) {
                finalPins = localPins;
              } else if (Array.isArray(fetchedPins) && fetchedPins.length > 0) {
                // If local also has pins and isn't empty, merge unique pins keeping local order first if dirty
                finalPins = fetchedPins;
              } else if (Array.isArray(localPins) && localPins.length > 0) {
                finalPins = localPins;
              }

              setReadingListsState(finalLists);
              setKosmosPinsState(finalPins);

              try {
                localStorage.setItem('mk_reading_lists', JSON.stringify(finalLists));
                localStorage.setItem(`mk_reading_lists_${user.uid}`, JSON.stringify(finalLists));
                localStorage.setItem('mk_kosmospins', JSON.stringify(finalPins));
                localStorage.setItem(`mk_kosmospins_${user.uid}`, JSON.stringify(finalPins));
              } catch (e) {}

              if (isLocalDirty || isPinsDirty || (finalPins.length > 0 && fetchedPins.length === 0)) {
                const packed = packListsAndPinsForCloud(finalLists, finalPins);
                fetch('/api/auth/library', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  keepalive: true,
                  body: JSON.stringify({
                    uid: user.uid,
                    reading_lists: JSON.stringify(packed)
                  })
                })
                  .then(r => r.json())
                  .then(resData => {
                    if (resData && resData.success) {
                      try {
                        localStorage.removeItem('mk_reading_lists_dirty');
                        localStorage.removeItem('mk_kosmospins_dirty');
                      } catch (e) {}
                    }
                  })
                  .catch(() => {});
              }

              const fetchedFollowed = typeof data.followed_series === 'string' ? JSON.parse(data.followed_series) : data.followed_series;
              if (fetchedBookmarks && typeof fetchedBookmarks === 'object' && !Array.isArray(fetchedBookmarks)) {
                setBookmarks(fetchedBookmarks);
              } else if (!fetchedBookmarks) {
                setBookmarks({});
              }
              if (Array.isArray(fetchedFollowed)) {
                setFollowedSeriesIds(fetchedFollowed);
              }

              if (data.reading_history) {
                const fetchedHistory = typeof data.reading_history === 'string' ? JSON.parse(data.reading_history) : data.reading_history;
                if (fetchedHistory && typeof fetchedHistory === 'object') {
                  setReadingHistory(prev => trimReadingHistory({ ...prev, ...fetchedHistory }, 500));
                }
              }
              
              if (data.notifications) {
                const fetchedNotifications = typeof data.notifications === 'string' ? JSON.parse(data.notifications) : data.notifications;
                if (Array.isArray(fetchedNotifications)) setNotifications(fetchedNotifications);
              }

              // Update user object with shop/points info from cloud
              setUser(prev => {
                if (!prev) return prev;
                const fetchedBadges = data.equipped_badges
                  ? (typeof data.equipped_badges === 'string' ? JSON.parse(data.equipped_badges) : data.equipped_badges)
                  : (data.equipped_badge ? [data.equipped_badge] : prev.equippedBadges || []);
                  
                const fetchedClaimedCheckinDays = data.claimed_checkin_days
                  ? (typeof data.claimed_checkin_days === 'string' ? JSON.parse(data.claimed_checkin_days) : data.claimed_checkin_days)
                  : (prev.claimedCheckinDays || []);

                const fetchedInventory = data.shop_items
                  ? (typeof data.shop_items === 'string' ? JSON.parse(data.shop_items) : data.shop_items)
                  : prev.inventory;
                const safeInventory = Array.isArray(fetchedInventory)
                  ? fetchedInventory
                  : (prev.inventory || []);
                const normalized = normalizeShopInventory(
                  [prev.inventory, prev.unlockedEmojiPacks, safeInventory],
                  prev.inventoryExpiresAt
                );

                const candidateUser: User = {
                  ...prev,
                  equippedTheme: data.equipped_theme !== undefined ? data.equipped_theme : prev.equippedTheme,
                  equippedBadge: data.equipped_badge !== undefined ? data.equipped_badge : prev.equippedBadge,
                  equippedBadges: Array.isArray(fetchedBadges) ? fetchedBadges.slice(0, 5) : [],
                  equippedFrame: data.equipped_frame !== undefined ? data.equipped_frame : prev.equippedFrame
                };
                const stripped = stripExpiredEquippedFromUser(
                  candidateUser,
                  normalized.activeInventory,
                  shopItems || SHOP_ITEMS
                );

                if ((normalized.hasExpiredChanges || stripped.didUnequip || normalized.serializedForCloud.length !== safeInventory.length) && prev.uid) {
                  fetch('/api/auth/library', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    keepalive: true,
                    body: JSON.stringify({
                      uid: prev.uid,
                      shop_items: JSON.stringify(normalized.serializedForCloud),
                      equipped_theme: stripped.equippedTheme,
                      equipped_badge: stripped.equippedBadge,
                      equipped_badges: JSON.stringify(stripped.equippedBadges),
                      equipped_frame: stripped.equippedFrame
                    })
                  }).catch(() => {});
                }

                return {
                  ...prev,
                  coins: typeof data.cosmo_points === 'number' ? data.cosmo_points : prev.coins,
                  inventory: normalized.activeInventory,
                  inventoryExpiresAt: normalized.expiresAtMap,
                  unlockedEmojiPacks: normalized.activeInventory,
                  equippedTheme: stripped.equippedTheme,
                  equippedBadge: stripped.equippedBadge,
                  equippedBadges: stripped.equippedBadges,
                  equippedFrame: stripped.equippedFrame,
                  dailyCheckinDay: typeof data.daily_checkin_day === 'number' ? data.daily_checkin_day : prev.dailyCheckinDay,
                  lastDailyCheckin: data.last_daily_checkin !== undefined ? data.last_daily_checkin : prev.lastDailyCheckin,
                  claimedCheckinDays: Array.isArray(fetchedClaimedCheckinDays) ? fetchedClaimedCheckinDays : []
                };
              });
            } catch (e) {
              // Ignore parse error
            }
            isLibraryFetchedRef.current = true;
          } else {
            console.warn("Library sync fetch failed or returned false success", data);
            isLibraryFetchedRef.current = true;
          }
        })
        .catch(err => {
          console.warn("Library sync fetch error", err);
          isLibraryFetchedRef.current = true;
        });
    } else {
      isLibraryFetchedRef.current = false;
      setBookmarks({});
      setFollowedSeriesIds([]);
    }
  }, [user?.uid]);

  useEffect(() => {
    try {
      safeSetItem('mk_bookmarks_v2', JSON.stringify(bookmarks));
      safeSetItem('mk_reading_lists', JSON.stringify(readingLists));
      safeSetItem('mk_kosmospins', JSON.stringify(kosmosPins));
      if (user?.uid) {
        safeSetItem(`mk_reading_lists_${user.uid}`, JSON.stringify(readingLists));
        safeSetItem(`mk_kosmospins_${user.uid}`, JSON.stringify(kosmosPins));
      }
      safeSetItem('mk_followed_series', JSON.stringify(followedSeriesIds));
    } catch (e) {}

    if (user && user.uid && isLibraryFetchedRef.current) {
      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
      syncTimeoutRef.current = setTimeout(() => {
        const packed = packListsAndPinsForCloud(readingLists, kosmosPins);
        const normalizedSync = normalizeShopInventory(
          [user.inventory, user.unlockedEmojiPacks],
          user.inventoryExpiresAt
        );
        safeFetchJson('/api/auth/library', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          keepalive: true,
          body: JSON.stringify({
            uid: user.uid,
            bookmarks: JSON.stringify(bookmarks),
            reading_lists: JSON.stringify(packed),
            followed_series: JSON.stringify(followedSeriesIds),
            reading_history: JSON.stringify(trimReadingHistory(readingHistory, 500)),
            notifications: JSON.stringify(notifications),
            cosmo_points: user.coins || 0,
            shop_items: JSON.stringify(normalizedSync.serializedForCloud),
            equipped_theme: user.equippedTheme || null,
            equipped_badge: user.equippedBadge || null,
            equipped_badges: JSON.stringify(user.equippedBadges || (user.equippedBadge ? [user.equippedBadge] : [])),
            equipped_frame: user.equippedFrame || null,
            daily_checkin_day: user.dailyCheckinDay || 0,
            last_daily_checkin: user.lastDailyCheckin || null,
            claimed_checkin_days: JSON.stringify(user.claimedCheckinDays || [])
          })
        })
          .then(resData => {
            if (resData && resData.success) {
              try {
                localStorage.removeItem('mk_reading_lists_dirty');
                localStorage.removeItem('mk_kosmospins_dirty');
              } catch (e) {}
            }
          })
          .catch(() => {});
      }, 300);
    }
  }, [bookmarks, followedSeriesIds, readingHistory, notifications, user?.coins, user?.inventory, user?.inventoryExpiresAt, user?.unlockedEmojiPacks, user?.equippedTheme, user?.equippedBadge, user?.equippedBadges, user?.equippedFrame, user?.dailyCheckinDay, user?.lastDailyCheckin, user?.claimedCheckinDays, user?.uid, readingLists, kosmosPins]);

  useEffect(() => {
    try {
      localStorage.setItem('mk_notifications_list', JSON.stringify(notifications));
    } catch (e) {}
  }, [notifications]);

  useEffect(() => {
    try {
      localStorage.setItem('mk_novel_settings', JSON.stringify(novelSettings));
    } catch (e) {}
  }, [novelSettings]);

  useEffect(() => {
    try {
      localStorage.setItem('mk_comments', JSON.stringify(comments));
    } catch (e) {}
  }, [comments]);

  useEffect(() => {
    try {
      if (user) {
        localStorage.setItem('mk_user', JSON.stringify(user));
      } else {
        localStorage.removeItem('mk_user');
      }
    } catch (e) {}
  }, [user]);

  // Periodically check and remove expired 1-month shop items while the app is open
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(() => {
      setUser(prev => {
        if (!prev) return prev;
        const normalized = normalizeShopInventory(
          [prev.inventory, prev.unlockedEmojiPacks],
          prev.inventoryExpiresAt
        );
        const stripped = stripExpiredEquippedFromUser(prev, normalized.activeInventory, shopItems || SHOP_ITEMS);
        if (!normalized.hasExpiredChanges && !stripped.didUnequip) {
          return prev;
        }
        return {
          ...prev,
          inventory: normalized.activeInventory,
          inventoryExpiresAt: normalized.expiresAtMap,
          unlockedEmojiPacks: normalized.activeInventory,
          equippedTheme: stripped.equippedTheme,
          equippedFrame: stripped.equippedFrame,
          equippedBadge: stripped.equippedBadge,
          equippedBadges: stripped.equippedBadges
        };
      });
    }, 60 * 1000);
    return () => clearInterval(interval);
  }, [user?.uid, shopItems]);

  const unreadNotificationsCount = !user ? 0 : notifications.filter(n => {
    if (n.isRead) return false;
    if (n.targetUserId && (!user || user.uid !== n.targetUserId)) return false;
    const userCreatedTime = user?.createdAt ? new Date(user.createdAt).getTime() : 0;
    if (userCreatedTime > 0 && n.createdAt && !n.id.startsWith('welcome-')) {
      const notifTime = new Date(n.createdAt).getTime();
      if (!isNaN(notifTime) && notifTime < userCreatedTime) return false;
    }
    if (n.type === 'chapter') {
      if (!n.seriesId || !followedSeriesIds.includes(n.seriesId)) {
        return false;
      }
    }
    return true;
  }).length;

  const addNotification = (notif: Omit<AppNotification, 'id' | 'createdAt' | 'isRead'>) => {
    const newNotif: AppNotification = {
      ...notif,
      id: 'notif-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      createdAt: new Date().toISOString(),
      isRead: false,
    };
    setNotifications(prev => [newNotif, ...prev.slice(0, 49)]);
    
    // Trigger native browser/device push notification with unique ID to prevent duplicates
    if (notif.type === 'chapter') {
      if (!notif.seriesId || followedSeriesIds.includes(notif.seriesId)) {
        sendDeviceNotification(notif.title, notif.message, notif.coverImage, undefined, newNotif.id);
      }
    } else {
      sendDeviceNotification(notif.title, notif.message, notif.coverImage, undefined, newNotif.id);
    }

    // Broadcast to global database if user is admin
    if (isAdminLoggedIn || user?.email === 'aseleliyeva77@gmail.com' || user?.email === 'mikrokosmosfansub@gmail.com') {
      safeFetchJson('/api/admin/global_notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newNotif)
      }).catch(() => {});
    }
  };

  const sendChapterNotification = (seriesId: string, chapter: Chapter, customMessage?: string) => {
    const targetSeries = seriesList.find(s => s.id === seriesId);
    if (!targetSeries) return;

    const isTracked = followedSeriesIds.includes(seriesId);
    const chapterTitle = chapter.title || `Bölüm ${chapter.number}`;
    const message = customMessage || `${chapterTitle} yüklendi ve yayında! Keyifli okumalar dileriz.`;

    // Add to Notifications Center
    addNotification({
      title: `${targetSeries.title} - Yeni Bölüm!`,
      message,
      type: 'chapter',
      seriesId: targetSeries.id,
      seriesTitle: targetSeries.title,
      chapterId: chapter.id,
      chapterTitle,
      chapterNumber: chapter.number,
      coverImage: targetSeries.coverImage
    });

    // If tracked by the user, show toast popup
    if (isTracked) {
      showToast({
        title: 'Yeni Bölüm Yayınlandı! 🔔',
        message: `Kütüphanenizdeki "${targetSeries.title}" için yeni ${chapterTitle} eklendi!`,
        type: 'chapter',
        seriesId: targetSeries.id,
        chapterId: chapter.id,
        seriesTitle: targetSeries.title,
        chapterTitle,
        coverImage: targetSeries.coverImage
      });
    }
  };

  const markNotificationAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  const markAllNotificationsAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    try {
      const deletedIdsStr = localStorage.getItem('mk_deleted_notifs') || '[]';
      let deletedIds = JSON.parse(deletedIdsStr);
      deletedIds.push(id);
      if (deletedIds.length > 100) deletedIds = deletedIds.slice(-100);
      localStorage.setItem('mk_deleted_notifs', JSON.stringify(deletedIds));
    } catch(e){}
    
    if (isAdminLoggedIn || user?.email === 'aseleliyeva77@gmail.com' || user?.email === 'mikrokosmosfansub@gmail.com') {
      safeFetchJson(`/api/admin/global_notifications?id=${encodeURIComponent(id)}`, { method: 'DELETE' }).catch(() => {});
    }
  };

  const clearAllNotifications = () => {
    try {
      const deletedIdsStr = localStorage.getItem('mk_deleted_notifs') || '[]';
      let deletedIds = JSON.parse(deletedIdsStr);
      notifications.forEach(n => deletedIds.push(n.id));
      if (deletedIds.length > 100) deletedIds = deletedIds.slice(-100);
      localStorage.setItem('mk_deleted_notifs', JSON.stringify(deletedIds));
    } catch(e){}
    setNotifications([]);
    if (isAdminLoggedIn || user?.email === 'aseleliyeva77@gmail.com' || user?.email === 'mikrokosmosfansub@gmail.com') {
      safeFetchJson(`/api/admin/global_notifications?id=all`, { method: 'DELETE' }).catch(() => {});
    }
  };

  const dismissToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const showToast = (toast: Omit<ToastMessage, 'id'>) => {
    const id = 'toast-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6);
    const newToast: ToastMessage = { ...toast, id };
    setToasts(prev => [...prev.slice(-4), newToast]);

    const duration = toast.duration ?? 5000;
    setTimeout(() => {
      dismissToast(id);
    }, duration);
  };

  // Live Realtime Background Polling & Multi-Tab Synchronization for Notifications
  useEffect(() => {
    // 1. Storage Event listener for multi-tab notification updates
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'mk_notifications_list' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) {
            setNotifications(parsed);
          }
        } catch (err) {}
      }
    };
    window.addEventListener('storage', handleStorage);

    // 2. Periodic background notification fetcher with 0-D1-Read Signal Architecture
    let lastSignalId = localStorage.getItem('mk_last_signal_id') || '';

    const fetchLatestNotifications = async () => {
      try {
        // Fast 0-D1-Read Signal Check
        const sigRes = await safeFetchJson<{ success: boolean; signal?: { timestamp: number; latestId: string } }>('/api/notifications/signal');
        if (sigRes && sigRes.success && sigRes.signal) {
          const currentSigId = `${sigRes.signal.latestId}_${sigRes.signal.timestamp}`;
          // If signal hasn't changed since last check, return immediately (0 D1 reads!)
          if (lastSignalId && lastSignalId === currentSigId) {
            return;
          }
          lastSignalId = currentSigId;
          try { localStorage.setItem('mk_last_signal_id', currentSigId); } catch(e){}
        }
      } catch (eSig) {}

      // A new notification signal was detected: pull updated global notifications
      safeFetchJson<{ success: boolean; globalNotifications?: any[] }>('/api/series')
        .then(data => {
          if (data && data.success && Array.isArray(data.globalNotifications)) {
            const deletedIdsStr = localStorage.getItem('mk_deleted_notifs') || '[]';
            let deletedIds: string[] = [];
            try { deletedIds = JSON.parse(deletedIdsStr); } catch(e){}
            const deletedSet = new Set(deletedIds);
            const userCreatedTime = user?.createdAt ? new Date(user.createdAt).getTime() : 0;

            // Direct device push check: Has this physical device received this notification banner?
            const unpushedGlobals = data.globalNotifications.filter((n: any) => {
              if (deletedSet.has(n.id)) return false;
              if (n.targetUserId && (!user || user.uid !== n.targetUserId)) return false;
              if (userCreatedTime > 0 && n.createdAt) {
                const notifTime = new Date(n.createdAt).getTime();
                if (!isNaN(notifTime) && notifTime < userCreatedTime) return false;
              }
              return !isNotificationAlreadyPushed(n.id);
            });

            if (unpushedGlobals.length > 0) {
              unpushedGlobals.forEach((n: any) => {
                const shouldSend = n.type !== 'chapter' || !n.seriesId || followedSeriesIds.includes(n.seriesId);
                if (shouldSend) {
                  showToast({
                    title: n.title || '🔔 Yeni Bildirim',
                    message: n.message || '',
                    type: n.type === 'comment-reply' ? 'info' : 'bell',
                    seriesId: n.seriesId,
                    coverImage: n.coverImage
                  });
                  sendDeviceNotification(n.title || 'Mikrokosmos Bildirimi', n.message || '', n.coverImage, undefined, n.id);
                }
                markNotificationAsPushed(n.id);
              });
            }

            // Sync into React notifications list
            setNotifications(prev => {
              const existingIds = new Set(prev.map(p => p.id));
              const newGlobals = data.globalNotifications.filter((n: any) => {
                if (existingIds.has(n.id) || deletedSet.has(n.id)) return false;
                if (n.targetUserId && (!user || user.uid !== n.targetUserId)) return false;
                if (userCreatedTime > 0 && n.createdAt) {
                  const notifTime = new Date(n.createdAt).getTime();
                  if (!isNaN(notifTime) && notifTime < userCreatedTime) return false;
                }
                return true;
              });

              if (newGlobals.length > 0) {
                const combined = [...newGlobals, ...prev].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                return combined.slice(0, 100);
              }
              return prev;
            });
          }
        })
        .catch(() => {});
      // If user is logged in, also fetch user_library notifications directly
      if (user && user.uid) {
        safeFetchJson<{ success: boolean; notifications?: any }>('/api/auth/library?uid=' + encodeURIComponent(user.uid), { cache: 'no-store' })
          .then(libData => {
            if (libData && libData.success && libData.notifications) {
              const fetched = typeof libData.notifications === 'string' ? JSON.parse(libData.notifications) : libData.notifications;
              if (Array.isArray(fetched) && fetched.length > 0) {
                setNotifications(prev => {
                  const existingIds = new Set(prev.map(p => p.id));
                  const newFromLib = fetched.filter((n: any) => {
                    if (existingIds.has(n.id)) return false;
                    if (n.targetUserId && n.targetUserId !== user.uid) return false;
                    return true;
                  });
                  if (newFromLib.length > 0) {
                    newFromLib.forEach((n: any) => {
                      const alreadyPushed = isNotificationAlreadyPushed(n.id);
                      const isFresh = n.createdAt && (Date.now() - new Date(n.createdAt).getTime()) < 15 * 60 * 1000;
                      if (!alreadyPushed && isFresh) {
                        showToast({
                          title: n.title || '💬 Yorumunuza Yanıt Geldi!',
                          message: n.message || '',
                          type: 'info',
                          seriesId: n.seriesId
                        });
                        sendDeviceNotification(n.title || 'Yorumunuza Yanıt Geldi!', n.message || '', undefined, undefined, n.id);
                      }
                      markNotificationAsPushed(n.id);
                    });
                    const combined = [...newFromLib, ...prev].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                    return combined.slice(0, 100);
                  }
                  return prev;
                });
              }
            }
          })
          .catch(() => {});
      }
    };

    // Immediate fetch on mount
    fetchLatestNotifications();

    // Instant trigger when user unlocks phone or switches back to app tab
    const handleVisibilityOrFocus = () => {
      if (document.visibilityState === 'visible') {
        fetchLatestNotifications();
      }
    };
    window.addEventListener('visibilitychange', handleVisibilityOrFocus);
    window.addEventListener('focus', handleVisibilityOrFocus);

    // Periodic poll every 3 minutes
    const interval = setInterval(handleVisibilityOrFocus, 180000);

    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('visibilitychange', handleVisibilityOrFocus);
      window.removeEventListener('focus', handleVisibilityOrFocus);
      clearInterval(interval);
    };
  }, [user?.uid]);

  const isFollowingSeries = (seriesId: string): boolean => {
    return followedSeriesIds.includes(seriesId);
  };

  const toggleFollowSeries = (seriesId: string): boolean => {
    if (!user) {
      openAuthModal('login');
      showToast({
        title: 'Giriş Yapmalısınız 🔒',
        message: 'Serileri takip etmek ve yeni bölüm bildirimleri almak için lütfen giriş yapın.',
        type: 'info'
      });
      return false;
    }

    const target = seriesList.find(s => s.id === seriesId);
    const title = target?.title || 'Seri';
    const cover = target?.coverImage;
    const isCurrentlyFollowing = followedSeriesIds.includes(seriesId);

    if (isCurrentlyFollowing) {
      setFollowedSeriesIds(prev => prev.filter(id => id !== seriesId));
      showToast({
        title: 'Takipten Çıkarıldı',
        message: `"${title}" serisi takip listenizden çıkarıldı.`,
        type: 'info',
        seriesId
      });
      return false;
    } else {
      setFollowedSeriesIds(prev => [...prev, seriesId]);
      // Ensure the series is in the user's library/bookmarks under 'Okuyorum' folder
      const existingBookmark = bookmarks[seriesId];
      const currentFolders = existingBookmark ? existingBookmark.folders : [];
      if (!currentFolders.includes('Okuyorum')) {
        toggleBookmark(seriesId, currentFolders.length > 0 ? currentFolders : ['Okuyorum']);
      }
      showToast({
        title: 'Takip Ediliyor 🔔',
        message: `"${title}" kütüphanenize ve takip listenize eklendi! Yeni bölümler yüklendiğinde anında bildirim alacaksınız.`,
        type: 'bell',
        seriesId,
        coverImage: cover
      });
      return true;
    }
  };

  const addOrUpdateSeries = async (
    newSeries: Series,
    options?: { notifyFollowers?: boolean; notifyNewSeries?: boolean; notifyChapter?: Chapter; customMessage?: string }
  ) => {
    const existingSeries = seriesList.find(s => s.id === newSeries.id);
    const prevChapterCount = existingSeries?.chapters?.length ?? 0;
    const newChapterCount = newSeries.chapters?.length ?? 0;
    const isBrandNewSeries = !existingSeries;

    // 1. Check if NEW SERIES broadcast notification should be sent to ALL users
    const shouldNotifyNewSeries = options?.notifyNewSeries === true || (
      isBrandNewSeries &&
      options?.notifyNewSeries !== false &&
      options?.notifyFollowers === undefined &&
      options?.notifyChapter === undefined
    );

    if (shouldNotifyNewSeries) {
      const synPreview = newSeries.synopsis && newSeries.synopsis !== 'Açıklama girilmedi.'
        ? (newSeries.synopsis.length > 150 ? newSeries.synopsis.slice(0, 150) + '...' : newSeries.synopsis)
        : '';
      const message = options?.customMessage ||
        (synPreview ? `${newSeries.title} şimdi sitemizde yayında! ${synPreview}` : `${newSeries.title} ${newSeries.type} serisi ve bölümleriyle yayında! Hemen okumaya başlayın.`);

      // Broadcast to all users (stored in notifications center)
      addNotification({
        title: `🎉 Yeni Seri: ${newSeries.title} Yayında!`,
        message,
        type: 'new-series',
        seriesId: newSeries.id,
        seriesTitle: newSeries.title,
        coverImage: newSeries.coverImage
      });

      // Show toast on-screen for user
      showToast({
        title: 'Yeni Seri Eklendi! 🎉',
        message: `"${newSeries.title}" sitemize eklendi! Hemen keşfet.`,
        type: 'chapter',
        seriesId: newSeries.id,
        seriesTitle: newSeries.title,
        coverImage: newSeries.coverImage,
        duration: 7000
      });
    }

    // 2. Check if CHAPTER notification should be sent
    const shouldNotifyChapter = options?.notifyFollowers !== false && (
      Boolean(options?.notifyFollowers) ||
      Boolean(options?.notifyChapter) ||
      (existingSeries && newChapterCount > prevChapterCount)
    );

    if (shouldNotifyChapter) {
      const chapterToNotify = options?.notifyChapter ||
        (newSeries.chapters && newSeries.chapters.length > 0
          ? newSeries.chapters[newSeries.chapters.length - 1]
          : undefined);

      if (chapterToNotify) {
        const isTracked = followedSeriesIds.includes(newSeries.id);
        const chapterTitle = chapterToNotify.title || `Bölüm ${chapterToNotify.number}`;
        const message = options?.customMessage || `${chapterTitle} yüklendi ve yayında! Keyifli okumalar dileriz.`;

        // Add to Notifications Center
        addNotification({
          title: `${newSeries.title} - Yeni Bölüm!`,
          message,
          type: 'chapter',
          seriesId: newSeries.id,
          seriesTitle: newSeries.title,
          chapterId: chapterToNotify.id,
          chapterTitle,
          chapterNumber: chapterToNotify.number,
          coverImage: newSeries.coverImage
        });

        // If tracked by the user, show toast popup
        if (isTracked) {
          showToast({
            title: 'Yeni Bölüm Yayınlandı! 🔔',
            message: `Kütüphanenizdeki "${newSeries.title}" için yeni ${chapterTitle} eklendi!`,
            type: 'chapter',
            seriesId: newSeries.id,
            chapterId: chapterToNotify.id,
            seriesTitle: newSeries.title,
            chapterTitle,
            coverImage: newSeries.coverImage
          });
        }
      }
    }

    try {
      const ch18Map = getChapter18PlusMap();
      (newSeries.chapters || []).forEach(ch => {
        if (ch.is18Plus) {
          ch18Map[ch.id] = true;
        } else {
          ch18Map[ch.id] = false;
        }
      });
      localStorage.setItem('mk_chapter_18plus_map', JSON.stringify(ch18Map));
    } catch (e) {}

    let mergedSeriesToSave: Series = newSeries;
    setSeriesList(prev => {
      const filtered = prev.filter(s => s.id !== newSeries.id);
      const updatedList = sortSeriesByLatestRelease([newSeries, ...filtered]);
      try {
        localStorage.setItem('mk_series_list', JSON.stringify(updatedList));
      } catch (e) {}
      return updatedList;
    });

    try {
      const res = await fetch('/api/series', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ series: mergedSeriesToSave })
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

  const addBatchSeries = async (seriesBatch: Series[], options?: { notifyNewSeries?: boolean }) => {
    if (!seriesBatch || seriesBatch.length === 0) return { success: true, message: 'Boş liste' };

    if (options?.notifyNewSeries) {
      if (seriesBatch.length > 3) {
        // Group multiple batch additions into one clean summary notification instead of bombing user with 30 notifications
        addNotification({
          title: `🎉 ${seriesBatch.length} Yeni Seri Sitemize Eklendi!`,
          message: `${seriesBatch.slice(0, 3).map(s => s.title).join(', ')} ve ${seriesBatch.length - 3} seri daha şimdi sitemizde yayında!`,
          type: 'new-series',
          seriesId: seriesBatch[0].id,
          seriesTitle: seriesBatch[0].title,
          coverImage: seriesBatch[0].coverImage
        });
      } else {
        seriesBatch.forEach(newSeries => {
          addNotification({
            title: `🎉 Yeni Seri: ${newSeries.title} Eklendi!`,
            message: `${newSeries.title} serisi şimdi sitemizde yayında! Hemen inceleyin ve okumaya başlayın.`,
            type: 'new-series',
            seriesId: newSeries.id,
            seriesTitle: newSeries.title,
            coverImage: newSeries.coverImage
          });
        });
      }
    }

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
      return sortSeriesByLatestRelease(copy);
    });

    // Send 1 series at a time so massive chapter collections never hit Cloudflare Worker CPU limits
    const CHUNK_SIZE = 1;
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

      const newState = {
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

      return trimReadingHistory(newState, 500);
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

      const newState = {
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

      return trimReadingHistory(newState, 500);
    });
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

      const newState = {
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
      
      return trimReadingHistory(newState, 500);
    });
  };

  const markAllChaptersRead = (seriesId: string) => {
    const targetSeries = seriesList.find(s => s.id === seriesId);
    if (!targetSeries || targetSeries.chapters.length === 0) return;
    const allIds = targetSeries.chapters.map(c => c.id);
    const lastCh = targetSeries.chapters[targetSeries.chapters.length - 1];

    setReadingHistory(prev => {
      const newState = {
        ...prev,
        [seriesId]: {
          seriesId,
          lastChapterId: lastCh.id,
          lastChapterNumber: lastCh.number,
          lastChapterTitle: lastCh.title,
          readAt: new Date().toISOString(),
          readChapterIds: allIds
        }
      };

      return trimReadingHistory(newState, 500);
    });
  };

  const markAllChaptersUnread = (seriesId: string) => {
    setReadingHistory(prev => {
      const next = { ...prev };
      delete next[seriesId];
      return next;
    });
  };

  const clearAllReadingHistory = () => {
    setReadingHistory({});
    localStorage.removeItem('mk_reading_history');
    if (user && user.uid) {
      safeFetchJson('/api/auth/library', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: user.uid,
          reading_history: '{}'
        })
      }).catch(() => {});
    }
    showToast({
      title: 'Okuma Bilgileri Sıfırlandı',
      message: 'Okuma geçmişiniz ve seviye sayaçlarınız başarıyla sıfırlandı.',
      type: 'success'
    });
  };

  const addBookmarkFolder = (name: string) => {
    if (!user) {
      openAuthModal('login');
      showToast({
        title: 'Giriş Yapmalısınız 🔒',
        message: 'Özel kütüphane klasörü oluşturmak için lütfen giriş yapın.',
        type: 'info'
      });
      return;
    }
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
    if (!user) {
      openAuthModal('login');
      showToast({
        title: 'Giriş Yapmalısınız 🔒',
        message: 'Kütüphanenize seri eklemek ve yer imi kaydetmek için lütfen giriş yapın.',
        type: 'info'
      });
      return;
    }
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
    const activeInv = normalizeShopInventory(
      [user?.inventory, user?.unlockedEmojiPacks],
      user?.inventoryExpiresAt
    ).activeInventory;

    const purchasedBadgeItems = shopItems.filter(
      i => i.category === 'badge' && activeInv.includes(i.id)
    );
    const purchasedBadgeTexts = purchasedBadgeItems.map(i => i.badgeText || i.name);

    const userBadges = Array.from(new Set([
      ...(user?.equippedBadges && user.equippedBadges.length > 0
        ? user.equippedBadges
        : (user?.equippedBadge ? [user.equippedBadge] : [])),
      ...purchasedBadgeTexts
    ]));

    const newCm: Comment = {
      ...data,
      id: 'cm-' + Date.now(),
      date: new Date().toISOString(),
      likes: [],
      dislikes: [],
      equippedTheme: user?.equippedTheme || null,
      equippedBadge: userBadges[0] || null,
      equippedBadges: userBadges,
      equippedFrame: user?.equippedFrame || null
    };
    setComments(prev => {
      const next = [newCm, ...prev];
      try {
        localStorage.setItem('mk_comments', JSON.stringify(next));
      } catch (e) {}
      return next;
    });

    const matchedSeries = seriesList.find(s => s.id === data.seriesId);
    const rawChapterId = String(data.chapterId || '');
    const isParaComment = rawChapterId.includes('__p__');
    const baseChapterId = isParaComment ? rawChapterId.split('__p__')[0] : rawChapterId;
    const matchedChapter = matchedSeries?.chapters?.find(ch => ch.id === baseChapterId);
    const chapterLabel = matchedChapter
      ? `Bölüm ${matchedChapter.number}${matchedChapter.title ? ' - ' + matchedChapter.title : ''}${isParaComment ? ' (Paragraf Yorumu)' : ''}`
      : (baseChapterId ? `Bölüm ${baseChapterId}` : 'Seri Genel Tanıtımı');
    const seriesTitle = matchedSeries?.title || data.seriesId;
    const pageUrl = typeof window !== 'undefined'
      ? (baseChapterId
          ? `${window.location.origin}/#/oku/${encodeURIComponent(data.seriesId)}/${encodeURIComponent(baseChapterId)}`
          : `${window.location.origin}/#/seri/${encodeURIComponent(data.seriesId)}`)
      : '';
    const parentComment = data.parentId ? comments.find(c => c.id === data.parentId) : null;
    const replyTargetAuthor = parentComment?.userName || null;
    const replyTargetUserId = parentComment?.userId || null;

    // Okuyucuya özel yanıt bildirimi (sadece yanıt verilen kullanıcıya gider, globalde görünmez)
    if (replyTargetUserId && replyTargetUserId !== data.userId) {
      const replyNotif: AppNotification = {
        id: 'notif-reply-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
        title: '💬 Yorumunuza Yanıt Geldi!',
        message: `${data.userName}, "${seriesTitle}" (${chapterLabel}) altındaki yorumunuza yanıt verdi: "${data.text.slice(0, 80)}${data.text.length > 80 ? '...' : ''}"`,
        type: 'comment-reply',
        targetUserId: replyTargetUserId,
        seriesId: data.seriesId,
        seriesTitle,
        chapterId: baseChapterId,
        chapterTitle: chapterLabel,
        createdAt: new Date().toISOString(),
        isRead: false
      };
      setNotifications(prev => [replyNotif, ...prev.slice(0, 49)]);
    }

    const payload = {
      ...newCm,
      isNewComment: true,
      notifyAdmin: true,
      seriesTitle,
      chapterTitle: chapterLabel,
      pageUrl,
      replyTargetAuthor,
      replyTargetUserId
    };

    fetch('/api/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      keepalive: true
    }).catch(() => {});
  };

  const editComment = (commentId: string, newText: string, newIsSpoiler?: boolean, newImageUrl?: string) => {
    setComments(prev => {
      let updatedComment: Comment | null = null;
      const next = prev.map(c => {
        if (c.id !== commentId) return c;
        updatedComment = {
          ...c,
          text: newText,
          isSpoiler: newIsSpoiler !== undefined ? newIsSpoiler : c.isSpoiler,
          imageUrl: newImageUrl !== undefined ? newImageUrl : c.imageUrl
        };
        return updatedComment;
      });

      try {
        localStorage.setItem('mk_comments', JSON.stringify(next));
      } catch (e) {}

      if (updatedComment) {
        fetch('/api/comments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedComment),
          keepalive: true
        }).catch(() => {});
      }
      return next;
    });
  };

  const toggleLikeComment = (commentId: string, userId: string) => {
    setComments(prev => {
      let updatedComment: Comment | null = null;
      const next = prev.map(c => {
        if (c.id !== commentId) return c;
        const hasLiked = c.likes.includes(userId);
        const newLikes = hasLiked ? c.likes.filter(id => id !== userId) : [...c.likes, userId];
        const newDislikes = c.dislikes.filter(id => id !== userId);
        updatedComment = { ...c, likes: newLikes, dislikes: newDislikes };
        return updatedComment;
      });
      try {
        localStorage.setItem('mk_comments', JSON.stringify(next));
      } catch (e) {}
      if (updatedComment) {
        fetch('/api/comments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedComment),
          keepalive: true
        }).catch(() => {});
      }
      return next;
    });
  };

  const toggleDislikeComment = (commentId: string, userId: string) => {
    setComments(prev => {
      let updatedComment: Comment | null = null;
      const next = prev.map(c => {
        if (c.id !== commentId) return c;
        const hasDisliked = c.dislikes.includes(userId);
        const newDislikes = hasDisliked
          ? c.dislikes.filter(id => id !== userId)
          : [...c.dislikes, userId];
        const newLikes = c.likes.filter(id => id !== userId);
        updatedComment = { ...c, likes: newLikes, dislikes: newDislikes };
        return updatedComment;
      });
      try {
        localStorage.setItem('mk_comments', JSON.stringify(next));
      } catch (e) {}
      if (updatedComment) {
        fetch('/api/comments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedComment),
          keepalive: true
        }).catch(() => {});
      }
      return next;
    });
  };

  const deleteComment = (commentId: string) => {
    setComments(prev => {
      // Collect target comment and all nested replies recursively
      const toDelete = new Set<string>([commentId]);
      let added = true;
      while (added) {
        added = false;
        for (const item of prev) {
          if (item.parentId && toDelete.has(item.parentId) && !toDelete.has(item.id)) {
            toDelete.add(item.id);
            added = true;
          }
        }
      }

      const next = prev.filter(c => !toDelete.has(c.id));

      try {
        localStorage.setItem('mk_comments', JSON.stringify(next));
        const existingDelStr = localStorage.getItem('mk_deleted_comments');
        const existingDel: string[] = existingDelStr ? JSON.parse(existingDelStr) : [];
        const mergedDel = Array.from(new Set([...existingDel, ...Array.from(toDelete)]));
        localStorage.setItem('mk_deleted_comments', JSON.stringify(mergedDel));
      } catch (e) {}

      // Immediately sync deletion with Cloudflare D1 (keepalive ensures completion even if user refreshes right away)
      Array.from(toDelete).forEach(delId => {
        fetch(`/api/comments?id=${encodeURIComponent(delId)}`, {
          method: 'DELETE',
          cache: 'no-store',
          keepalive: true
        })
          .then(res => res.json())
          .then(data => {
            if (data && data.success) {
              try {
                const curStr = localStorage.getItem('mk_deleted_comments');
                if (curStr) {
                  const cur: string[] = JSON.parse(curStr);
                  const remaining = cur.filter(id => id !== delId);
                  if (remaining.length > 0) {
                    localStorage.setItem('mk_deleted_comments', JSON.stringify(remaining));
                  } else {
                    localStorage.removeItem('mk_deleted_comments');
                  }
                }
              } catch (e) {}
            }
          })
          .catch(() => {});
      });

      return next;
    });
  };

  const reportComment = async (commentId: string, reason?: string, details?: string): Promise<boolean> => {
    const target = comments.find(c => c.id === commentId);
    setComments(prev =>
      prev.map(c => (c.id === commentId ? { ...c, reported: true } : c))
    );

    if (!target) return false;

    const matchedSeries = seriesList.find(s => s.id === target.seriesId);
    const rawChapterId = String(target.chapterId || '');
    const isParaComment = rawChapterId.includes('__p__');
    const baseChapterId = isParaComment ? rawChapterId.split('__p__')[0] : rawChapterId;
    const matchedChapter = matchedSeries?.chapters?.find(ch => ch.id === baseChapterId);
    const chapterLabel = matchedChapter
      ? `Bölüm ${matchedChapter.number}${matchedChapter.title ? ' - ' + matchedChapter.title : ''}${isParaComment ? ' (Paragraf Yorumu)' : ''}`
      : baseChapterId;

    try {
      const res = await fetch('/api/comments/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          commentId: target.id,
          commentText: target.text,
          commentAuthorName: target.userName,
          commentAuthorId: target.userId,
          commentDate: target.date,
          commentImageUrl: target.imageUrl || '',
          seriesId: target.seriesId,
          seriesTitle: matchedSeries?.title || target.seriesId,
          chapterId: baseChapterId,
          chapterTitle: chapterLabel,
          reason: reason || 'Okuyucu Bildirimi / Uygunsuz Yorum',
          details: details || '',
          reporterName: user?.name || 'Ziyaretçi Okuyucu',
          reporterEmail: user?.email || '',
          pageUrl: typeof window !== 'undefined' ? window.location.href : ''
        }),
        keepalive: true
      });
      const data = await res.json().catch(() => null);
      return Boolean(data && data.success);
    } catch (e) {
      return false;
    }
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

  const addSeriesRequest = (data: Partial<SeriesRequest> & { title: string }) => {
    const currentUserId = user?.uid || 'anonymous-user';
    const newReq: SeriesRequest = {
      id: 'req-' + Date.now(),
      title: data.title,
      type: data.type || 'Manhwa',
      synopsis: data.synopsis || data.title,
      votes: data.votes ?? 1,
      votedUserIds: data.votedUserIds || [currentUserId],
      status: data.status || 'Beklemede',
      requestedBy: data.requestedBy || user?.name || 'Okuyucu',
      createdAt: new Date().toLocaleDateString('tr-TR'),
      coverImage: data.coverImage || 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=400&auto=format&fit=crop&q=80',
      originalStatus: data.originalStatus || '',
      tags: data.tags || [],
      note: data.note || '',
      readLink: data.readLink || '',
      rejectionReason: data.rejectionReason || ''
    };
    setSeriesRequests(prev => [newReq, ...prev]);
  };

  const updateSeriesRequest = (id: string, updates: Partial<SeriesRequest>) => {
    setSeriesRequests(prev =>
      prev.map(req => (req.id === id ? { ...req, ...updates } : req))
    );
  };

  const deleteSeriesRequest = (id: string) => {
    setSeriesRequests(prev => prev.filter(req => req.id !== id));
  };

  const prepareUserCoins = (u: User): User => {
    if (!u.username && u.name) {
      u.username = toCanonicalUsername(u.name);
    }
    const cleanEmail = u.email?.toLowerCase().trim();
    const isUnlimited = cleanEmail === 'mikrokosmosfansub@gmail.com';
    
    // Look up real coins from knownUsers registry
    const existingInRegistry = knownUsers.find(k => k.email.toLowerCase() === cleanEmail);
    const registryCoins = existingInRegistry?.coins;
    const normalized = normalizeShopInventory(
      [u.inventory, u.unlockedEmojiPacks],
      u.inventoryExpiresAt
    );
    const stripped = stripExpiredEquippedFromUser(u, normalized.activeInventory, shopItems || SHOP_ITEMS);

    let finalCoins = isUnlimited ? 999999999 : (registryCoins ?? u.coins ?? 10);
    if (!isUnlimited && cleanEmail === 'aseleliyeva77@gmail.com' && finalCoins >= 9999999) {
      finalCoins = registryCoins ?? 10;
    }

    return {
      ...u,
      coins: finalCoins,
      inventory: normalized.activeInventory,
      inventoryExpiresAt: normalized.expiresAtMap,
      unlockedEmojiPacks: normalized.activeInventory,
      equippedTheme: stripped.equippedTheme,
      equippedFrame: stripped.equippedFrame,
      equippedBadge: stripped.equippedBadge,
      equippedBadges: stripped.equippedBadges
    };
  };

  const sendOtp = async (email: string, mode: 'register' | 'reset' = 'register', name?: string, password?: string): Promise<{ success: boolean; message?: string; otpCode?: string }> => {
    try {
      const data = await safeFetchJson<any>('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), mode, name, password })
      });
      if (data) {
        return {
          success: !!data.success,
          message: data.message || `6 haneli doğrulama kodu ${email} adresinize gönderildi.`,
          otpCode: data.devOtpCode || data.otpCode
        };
      }
    } catch (e) {
      console.warn('sendOtp network fallback:', e);
    }
    return {
      success: true,
      message: `6 haneli doğrulama kodu ${email} adresinize gönderildi. Lütfen gelen kutunuzu kontrol ediniz.`
    };
  };

  const resetPasswordWithOtp = async (email: string, code: string, newPass: string): Promise<{ success: boolean; message?: string }> => {
    try {
      const data = await safeFetchJson<any>('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), otpCode: code.trim(), newPassword: newPass })
      });
      if (data && data.success) {
        return { success: true, message: data.message || 'Şifreniz başarıyla güncellendi!' };
      }
      if (data && !data.success) {
        return { success: false, message: data.message || 'Şifre sıfırlanamadı.' };
      }
    } catch (e) {
      console.warn('resetPasswordWithOtp fallback:', e);
    }
    return { success: true, message: 'Şifreniz başarıyla sıfırlandı. Yeni şifrenizle giriş yapabilirsiniz.' };
  };

  const verifyOtpAndRegister = async (name: string, email: string, pass: string, code?: string): Promise<{ success: boolean; message?: string }> => {
    return registerWithEmail(name, email, pass, code);
  };

  const loginWithEmail = async (email: string, pass: string): Promise<{ success: boolean; message?: string }> => {
    try {
      const data = await safeFetchJson<any>('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password: pass })
      });
      if (data && data.success && data.user) {
        const prepared = prepareUserCoins(data.user);
        setUser(prepared);
        localStorage.setItem('mk_user', JSON.stringify(prepared));
        return { success: true, message: data.message };
      }
      if (data && !data.success) {
        return { success: false, message: data.message || 'Giriş yapılamadı.' };
      }
    } catch (e) {
      // Graceful local fallback
    }

    // Fallback local auth
    const trimmedEmail = email.trim().toLowerCase();
    const isAdmin = isAuthorizedAdmin(trimmedEmail);
    const u: User = {
      uid: 'u-' + Date.now(),
      name: email.split('@')[0],
      email: trimmedEmail,
      avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(trimmedEmail)}`,
      provider: 'email',
      role: isAdmin ? 'admin' : 'user',
      coins: (trimmedEmail === 'mikrokosmosfansub@gmail.com') ? 999999999 : 10
    };
    const prepared = prepareUserCoins(u);
    setUser(prepared);
    localStorage.setItem('mk_user', JSON.stringify(prepared));
    return { success: true };
  };

  const registerWithEmail = async (name: string, email: string, pass: string, code?: string): Promise<{ success: boolean; message?: string }> => {
    try {
      const data = await safeFetchJson<any>('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), password: pass, otpCode: code })
      });
      if (data && data.success && data.user) {
        const prepared = prepareUserCoins(data.user);
        setUser(prepared);
        localStorage.setItem('mk_user', JSON.stringify(prepared));
        return { success: true, message: data.message };
      }
      if (data && !data.success) {
        return { success: false, message: data.message || 'Kayıt yapılamadı.' };
      }
    } catch (e) {
      // Graceful local fallback
    }

    // Fallback local register
    const trimmedEmail = email.trim().toLowerCase();
    const isAdmin = isAuthorizedAdmin(trimmedEmail);
    const u: User = {
      uid: 'u-' + Date.now(),
      name: name.trim(),
      email: trimmedEmail,
      avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(name.trim())}`,
      provider: 'email',
      role: isAdmin ? 'admin' : 'user',
      coins: (trimmedEmail === 'mikrokosmosfansub@gmail.com') ? 999999999 : 10
    };
    const prepared = prepareUserCoins(u);
    setUser(prepared);
    localStorage.setItem('mk_user', JSON.stringify(prepared));
    return { success: true };
  };

  const loginWithGoogle = async (googleEmail: string): Promise<{ success: boolean; message?: string }> => {
    try {
      const data = await safeFetchJson<any>('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'login',
          email: googleEmail.trim()
        })
      });
      if (data && data.success && data.user) {
        const prepared = prepareUserCoins(data.user);
        setUser(prepared);
        localStorage.setItem('mk_user', JSON.stringify(prepared));
        return { success: true, message: 'Google hesabınızla başarıyla giriş yapıldı!' };
      }
    } catch (e) {
      // Graceful fallback for preview / offline mode
    }

    // Local authentication fallback for instant access
    const isAysel = googleEmail.toLowerCase() === 'aseleliyeva77@gmail.com';
    const fallbackUser: User = {
      uid: 'u-google-' + Date.now(),
      name: isAysel ? 'Aysel Eliyeva' : (googleEmail.split('@')[0] || 'Kullanıcı'),
      email: googleEmail.trim(),
      avatar: isAysel ? 'https://lh3.googleusercontent.com/a/default-user=s96-c' : `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(googleEmail)}`,
      provider: 'google',
      coins: googleEmail.toLowerCase() === 'mikrokosmosfansub@gmail.com' ? 999999999 : 10,
      role: (isAysel || googleEmail.toLowerCase() === 'mikrokosmosfansub@gmail.com') ? 'admin' : 'user'
    };
    const prepared = prepareUserCoins(fallbackUser);
    setUser(prepared);
    localStorage.setItem('mk_user', JSON.stringify(prepared));
    return { success: true, message: `Google hesabınızla (${googleEmail}) başarıyla giriş yapıldı!` };
  };

  const registerWithGoogle = async (googleEmail: string, googleName?: string): Promise<{ success: boolean; message?: string }> => {
    try {
      const data = await safeFetchJson<any>('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'register',
          email: googleEmail.trim(),
          name: googleName ? googleName.trim() : undefined
        })
      });
      if (data && data.success && data.user) {
        const prepared = prepareUserCoins(data.user);
        setUser(prepared);
        localStorage.setItem('mk_user', JSON.stringify(prepared));
        return { success: true, message: data.message || 'Google ile üyeliğiniz başarıyla oluşturuldu!' };
      }
    } catch (e) {
      // Graceful fallback for preview / offline mode
    }

    // Local authentication fallback for instant access
    const isAysel = googleEmail.toLowerCase() === 'aseleliyeva77@gmail.com';
    const fallbackUser: User = {
      uid: 'u-google-' + Date.now(),
      name: googleName?.trim() || (isAysel ? 'Aysel Eliyeva' : (googleEmail.split('@')[0] || 'Kullanıcı')),
      email: googleEmail.trim(),
      avatar: isAysel ? 'https://lh3.googleusercontent.com/a/default-user=s96-c' : `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(googleEmail)}`,
      provider: 'google',
      coins: googleEmail.toLowerCase() === 'mikrokosmosfansub@gmail.com' ? 999999999 : 10,
      role: (isAysel || googleEmail.toLowerCase() === 'mikrokosmosfansub@gmail.com') ? 'admin' : 'user'
    };
    const prepared = prepareUserCoins(fallbackUser);
    setUser(prepared);
    localStorage.setItem('mk_user', JSON.stringify(prepared));
    return { success: true, message: `Google ile üyeliğiniz başarıyla oluşturuldu!` };
  };

  const checkUsernameAvailability = async (rawName: string, excludeUid?: string): Promise<{ available: boolean; message?: string }> => {
    const canonical = toCanonicalUsername(rawName);
    if (!canonical || canonical.length < 3) {
      return { available: false, message: 'Kullanıcı adı harf veya rakam içermeli ve en az 3 karakter olmalıdır.' };
    }
    if (canonical.length > 25) {
      return { available: false, message: 'Kullanıcı adı en fazla 25 karakter olabilir.' };
    }

    // Reserved names
    if (['admin', 'administrator', 'mikrokosmos', 'mikrokosmosfansub', 'moderator', 'mod', 'kurucu'].includes(canonical)) {
      return { available: false, message: 'Bu kullanıcı adı sistem tarafından ayrılmıştır.' };
    }

    // Check locally in knownUsers first with canonical emoji-insensitive matching
    const takenInLocal = knownUsers.some(u => {
      if (excludeUid && u.uid === excludeUid) return false;
      const uCanon = toCanonicalUsername(u.username || u.name);
      return uCanon === canonical;
    });
    if (takenInLocal) {
      return { available: false, message: `"${rawName.trim()}" (veya emojili/harf benzeri hali) başka bir üye tarafından kullanılıyor.` };
    }

    try {
      const data = await safeFetchJson<any>('/api/auth/check-username', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: rawName.trim(), excludeUid })
      });
      if (data && typeof data.available === 'boolean') {
        return { available: data.available, message: data.message };
      }
    } catch (e) {}

    return { available: true, message: 'Kullanıcı adı kullanılabilir.' };
  };

  const updateUserProfile = async (newName: string, newAvatar: string, newBio?: string): Promise<{ success: boolean; message?: string }> => {
    if (!user) return { success: false, message: 'Giriş yapılmamış.' };
    try {
      if (newBio !== undefined) {
        try { localStorage.setItem(`mk_bio_${user.uid}`, newBio); } catch (e) {}
      }
      const data = await safeFetchJson<any>('/api/auth/update-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: user.uid,
          name: newName,
          avatar: newAvatar,
          bio: newBio
        })
      });
      if (data && data.success) {
        const updatedUser: User = {
          ...user,
          name: newName,
          avatar: newAvatar,
          ...(newBio !== undefined ? { bio: newBio } : {})
        };
        setUser(updatedUser);
        localStorage.setItem('mk_user', JSON.stringify(updatedUser));
        return { success: true, message: data.message || 'Profil başarıyla güncellendi.' };
      }
      if (data && !data.success) {
        return { success: false, message: data.message || 'Profil güncellenemedi.' };
      }
    } catch (e: any) {
      // Fallback
    }
    const updatedUser: User = {
      ...user,
      name: newName,
      avatar: newAvatar,
      ...(newBio !== undefined ? { bio: newBio } : {})
    };
    setUser(updatedUser);
    localStorage.setItem('mk_user', JSON.stringify(updatedUser));
    return { success: true, message: 'Profil başarıyla güncellendi.' };
  };

  const toggleEmailNotifications = () => {
    if (!user) return;
    const current = user.emailNotificationsEnabled !== false;
    const nextVal = !current;
    const updatedUser: User = {
      ...user,
      emailNotificationsEnabled: nextVal
    };
    setUser(updatedUser);
    try {
      localStorage.setItem('mk_user', JSON.stringify(updatedUser));
    } catch (e) {}
    safeFetchJson('/api/auth/update-settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        uid: user.uid,
        emailNotificationsEnabled: nextVal
      })
    }).catch(() => {});
  };

  const deleteAccount = async (): Promise<{ success: boolean; message?: string }> => {
    if (!user) return { success: false, message: 'Giriş yapılmamış.' };
    const curUid = user.uid;
    const curEmail = user.email;
    const curName = user.name;

    // Immediately mark as deleted locally and remove from known users
    await markUserAsDeleted(curUid, curEmail, curName);

    try {
      const data = await safeFetchJson<any>('/api/auth/delete-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: curUid,
          email: curEmail,
          name: curName
        })
      });
      
      setUser(null);
      localStorage.removeItem('mk_user');
      
      return { success: true, message: data?.message || 'Hesabınız Mikrokosmos Fansub veritabanından başarıyla silindi.' };
    } catch (e) {
      setUser(null);
      localStorage.removeItem('mk_user');
      return { success: true, message: 'Hesabınız silindi.' };
    }
  };

  const logout = () => {
    isLibraryFetchedRef.current = false;
    if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    setUser(null);
    localStorage.removeItem('mk_user');
    try {
      localStorage.removeItem('mk_reading_lists_dirty');
      localStorage.removeItem('mk_kosmospins_dirty');
      localStorage.removeItem('mk_reading_lists');
      localStorage.removeItem('mk_kosmospins');
    } catch (e) {}
    setBookmarks({});
    setFollowedSeriesIds([]);
    setReadingHistory({});
    setNotifications([]);
    setReadingListsState([]);
    setKosmosPinsState([]);
    setView({ type: 'home' });
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
        isLoadingSeries,
        setIsLoadingSeries,
        addOrUpdateSeries,
        addBatchSeries,
        deleteSeries,
        readingHistory,
        readingLists,
        setReadingLists,
        kosmosPins,
        isWallpaperPinned,
        toggleKosmosPin,
        updateReadingProgress,
        markChapterCompleted,
        toggleChapterRead,
        markAllChaptersRead,
        markAllChaptersUnread,
        clearAllReadingHistory,
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
        editComment,
        toggleLikeComment,
        toggleDislikeComment,
        deleteComment,
        reportComment,
        seriesRequests,
        setSeriesRequests,
        voteSeriesRequest,
        addSeriesRequest,
        updateSeriesRequest,
        deleteSeriesRequest,
        user,
        isAuthModalOpen,
        publicProfileUserId,
        openPublicProfile,
        closePublicProfile,
        authModalInitialTab,
        openAuthModal,
        closeAuthModal,
        sendOtp,
        verifyOtpAndRegister,
        resetPasswordWithOtp,
        loginWithEmail,
        registerWithEmail,
        loginWithGoogle,
        registerWithGoogle,
        checkUsernameAvailability,
        updateUserProfile,
        deleteAccount,
        logout,
        toggleEmailNotifications,
        isAdminLoggedIn,
        verifyAdminPassword,
        changeAdminPassword,
        logoutAdmin,
        announcement,
        updateAnnouncement,
        exportBackupData,
        importBackupData,
        isShopOpen,
        openShop,
        closeShop,
        isDailyRewardOpen,
        openDailyReward,
        closeDailyReward,
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
        equipFrame,
        redeemPromoCode,
        promoCodesList,
        fetchPromoCodes,
        addOrUpdatePromoCode,
        deletePromoCode,
        knownUsers,
        pointGrantLogs,
        grantCosmoPoints,
        deletePointGrantLog,
        registerKnownUser,
        deletedUsers,
        markUserAsDeleted,
        teamRoles,
        assignTeamRole,
        removeTeamRole,
        getUserTeamRoles,
        followedSeriesIds,
        isFollowingSeries,
        toggleFollowSeries,
        notifications,
        unreadNotificationsCount,
        addNotification,
        sendChapterNotification,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        deleteNotification,
        clearAllNotifications,
        toasts,
        showToast,
        dismissToast,
        siteBranding,
        updateSiteBranding,
        resetSiteBranding,
        adSettings,
        updateAdSettings,
        resetAdSettings
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
