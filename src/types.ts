export const AUTHORIZED_ADMIN_EMAILS = [
  'mikrokosmosfansub@gmail.com',
  'aseleliyeva77@gmail.com'
];

export const isAuthorizedAdmin = (email?: string | null): boolean => {
  if (!email) return false;
  return AUTHORIZED_ADMIN_EMAILS.includes(email.toLowerCase().trim());
};

export interface User {
  uid: string;
  name: string;
  email: string;
  avatar: string;
  role?: 'admin' | 'user';
  provider?: 'email' | 'google';
  createdAt?: string;
  coins?: number; // Cosmo-Puan balance
  inventory?: string[]; // Item IDs purchased e.g. ['theme_gold', 'chibi_solo']
  equippedTheme?: string | null; // Equipped comment card theme e.g. 'theme_gold'
  equippedBadge?: string | null; // Equipped VIP title badge e.g. 'S-Rank Avcı'
  unlockedEmojiPacks?: string[]; // Unlocked chibi emoji pack IDs e.g. ['chibi_solo']
  lastDailyCheckin?: string; // Date string "YYYY-MM-DD"
  lastDailySpin?: string; // Date string "YYYY-MM-DD"
  showNsfw?: boolean; // Adult (+18) content filter preference
}

export const isSeries18Plus = (s?: Series | null): boolean => {
  if (!s) return false;
  if (s.is18Plus) return true;
  if (s.ageRating === '18+' || s.ageRating === '21+') return true;
  if (s.genres && Array.isArray(s.genres)) {
    if (s.genres.some(g => ['18+', 'nsfw', 'adult', 'hentai', 'ecchi'].includes(g.toLowerCase().trim()))) {
      return true;
    }
  }
  if (s.customBadges && Array.isArray(s.customBadges)) {
    if (s.customBadges.some(b => ['18+', 'nsfw', 'adult'].includes(b.toLowerCase().trim()))) {
      return true;
    }
  }
  return false;
};

export type SeriesType = 'Manhwa' | 'Web Novel' | 'Manga' | 'Webtoon' | 'Manhua' | 'One Shot';
export type SeriesStatus = 'Devam Ediyor' | 'Tamamlandı' | 'Güncel' | 'Yakında' | 'Bıraktıldı';

export interface Chapter {
  id: string;
  number: number;
  title: string;
  publishedDate: string; // e.g. "2026-07-20" or "2 saat önce"
  createdAt?: number; // Epoch timestamp for exact time-based 12/24 hour "YENİ" tag calculations
  isNew?: boolean;
  specialTag?: 'Sezon Finali' | 'Final' | 'Ekstra' | 'Yan Bölüm' | 'Özel' | string;
  content?: string; // HTML or Markdown text for Web Novels
  images?: string[]; // Image URLs for Manhwa/Webtoons
  notice?: string; // Chapter specific admin notice / translator note
}

export interface Series {
  id: string;
  title: string;
  slug: string;
  coverImage: string;
  heroImage?: string;
  bannerImage?: string;
  type: SeriesType;
  status: SeriesStatus;
  rating: number; // e.g. 9.4
  ageRating?: '18+' | '21+' | 'Genel';
  is18Plus?: boolean; // 18+ adult content tag managed by admin
  isHot?: boolean;
  isNew?: boolean;
  isGuncel?: boolean; // "GÜNCEL" badge for up-to-date ongoing series
  isColored?: boolean;
  synopsis: string;
  author: string;
  artist?: string;
  releaseYear?: number | string;
  customBadges?: string[];
  translator?: string;
  genres: string[];
  chapters: Chapter[];
  updatedAt: string;
  releaseDay?: 'Pazartesi' | 'Salı' | 'Çarşamba' | 'Perşembe' | 'Cuma' | 'Cumartesi' | 'Pazar' | 'Düzensiz';
  releaseTime?: string; // e.g. "18:00"
  notice?: string; // Series specific admin announcement/note
}

export interface BookmarkFolder {
  id: string;
  name: string;
  isDefault?: boolean;
}

export interface BookmarkItem {
  seriesId: string;
  folders: string[]; // Folder names or IDs
  addedAt: string;
}

export interface ReadingProgress {
  seriesId: string;
  lastChapterId: string;
  lastChapterNumber: number;
  lastChapterTitle: string;
  readAt: string;
  scrollPosition?: number;
  readChapterIds?: string[]; // List of all chapter IDs read by the user for this series
}

export interface NovelSettings {
  bgColor: string;
  textColor: string;
  fontSize: number; // in px
  fontFamily: string;
  lineHeight: string; // e.g. "160%"
  textAlign: 'left' | 'center' | 'justify';
  padding: string; // e.g. "20px"
  widthMode: 'dar' | 'orta' | 'genis'; // dar = 600px, orta = 800px, genis = 100%
  isBold: boolean;
  scrollSpeed: number; // 1, 2, 3
}

export interface Comment {
  id: string;
  seriesId: string;
  chapterId?: string; // Optional: specific to a chapter
  userId: string;
  userName: string;
  userAvatar: string;
  text: string;
  imageUrl?: string;
  date: string;
  likes: string[]; // User IDs who liked
  dislikes: string[]; // User IDs who disliked
  parentId?: string | null;
  isSpoiler?: boolean;
  reported?: boolean;
  equippedTheme?: string | null; // Equipped comment card theme style e.g. 'theme_gold'
  equippedBadge?: string | null; // Equipped VIP title badge e.g. 'S-Rank Avcı'
}

export interface Announcement {
  id: string;
  title: string;
  text: string;
  type: 'announcement' | 'warning' | 'info' | 'maintenance' | 'danger';
  active: boolean;
}

export interface SeriesRequest {
  id: string;
  title: string;
  type: SeriesType;
  synopsis: string;
  votes: number;
  votedUserIds: string[];
  status: 'İncelemede' | 'Çevriliyor' | 'Takvime Eklendi' | 'Reddedildi';
  requestedBy: string;
  createdAt: string;
  coverImage?: string;
}

export interface ScheduleItem {
  seriesId: string;
  time: string;
  chapterNote?: string;
}

export interface ScheduleDay {
  day: 'Pazartesi' | 'Salı' | 'Çarşamba' | 'Perşembe' | 'Cuma' | 'Cumartesi' | 'Pazar';
  dayShort: 'Pzt' | 'Sal' | 'Çar' | 'Per' | 'Cum' | 'Cmt' | 'Paz';
  items: ScheduleItem[];
}

export interface ToastMessage {
  id: string;
  title: string;
  message: string;
  type?: 'success' | 'bell' | 'info' | 'warning' | 'chapter';
  seriesId?: string;
  chapterId?: string;
  seriesTitle?: string;
  chapterTitle?: string;
  coverImage?: string;
  duration?: number;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'chapter' | 'announcement' | 'system' | 'reward';
  seriesId?: string;
  seriesTitle?: string;
  chapterId?: string;
  chapterTitle?: string;
  chapterNumber?: number;
  coverImage?: string;
  createdAt: string; // ISO date or formatted
  isRead: boolean;
}
