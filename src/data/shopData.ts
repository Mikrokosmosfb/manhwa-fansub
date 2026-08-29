export type ShopCategory = 'theme' | 'emoji_pack' | 'badge' | 'frame';
export type ItemRarity = 'Yaygın' | 'Nadir' | 'Destansı' | 'Efsanevi';

export interface ChibiEmoji {
  code: string;
  label: string;
  imageUrl: string;
  symbol?: string;
}

export interface ShopItem {
  id: string;
  name: string;
  category: ShopCategory;
  price: number;
  description: string;
  icon: string;
  rarity: ItemRarity;
  themeType?: 'aura' | 'photo'; // Subcategory for themes: Aura effects vs Photo Backgrounds
  badgeText?: string;
  badgeStyle?: string;
  frameStyle?: string; // CSS border, ring, glow or animation for avatar frame
  frameImageUrl?: string; // Transparent PNG / WebP frame overlay image URL
  frameScale?: number; // Custom scale percentage (e.g., 100 - 180, default 135)
  frameOffsetY?: number; // Vertical offset percentage (-20 to +20)
  frameOffsetX?: number; // Horizontal offset percentage (-20 to +20)
  frameHideBorder?: boolean; // Hide inner avatar ring when PNG frame is active
  emojis?: ChibiEmoji[];
}

export interface ThemeDecoration {
  id: string;
  imageUrl: string;
  top?: string;
  right?: string;
  bottom?: string;
  left?: string;
  width?: string;
  rotation?: string;
  zIndex?: number;
}

export interface ThemeStyle {
  id: string;
  name: string;
  cardClass: string; // Tailwind border & glow classes for comment card
  avatarBorderClass: string;
  nameClass: string;
  badgeBgClass: string;
  glowColor: string;
  accentText: string;
  themeType?: 'aura' | 'photo';
  // Custom Artwork & Chibi Mascots
  cornerMascotUrl?: string; // Image URL of chibi peeking out from card corner
  cornerMascotPosition?: 'top-right' | 'bottom-right' | 'top-left' | 'bottom-left';
  avatarCompanionUrl?: string; // Image URL of chibi mascot next to avatar
  cardBgImageUrl?: string;
  effectOverlay?:
    | 'saturn'
    | 'shooting_star'
    | 'nebula'
    | 'supernova'
    | 'divine_wings'
    | 'stardust'
    | 'dragon_fire'
    | 'frost_crystal'
    | 'void_portal'
    | 'lightning_plasma'
    | 'sakura_bloom'
    | 'golden_crown'
    | 'emerald_poison'
    | 'moon_stars'
    | 'night_lotus'
    | 'moon_furin'
    | 'purple_moon_butterfly'
    | 'night_lanterns'
    | 'sakura_cascade'
    | 'crimson_moon_romance'
    | 'purple_crystal_sakura'
    | 'gothic_hanging_lanterns'
    | 'gothic_silver_filigree';
  decorations?: ThemeDecoration[];
  profileDecorations?: ThemeDecoration[];
}

export const BASE_THEME_STYLES: Record<string, ThemeStyle> = {

  theme_abyss: {
    id: 'theme_abyss',
    name: 'Okyanus Uçurumu & Derin Su Aura',
    cardClass: 'bg-gradient-to-r from-teal-950/90 via-cyan-950/90 to-slate-950 border-2 border-teal-400/90 shadow-[0_0_30px_rgba(20,184,166,0.4)]',
    avatarBorderClass: 'ring-2 ring-teal-400 ring-offset-2 ring-offset-black animate-pulse',
    nameClass: 'text-teal-300 font-black tracking-wider drop-shadow-[0_0_12px_rgba(20,184,166,0.9)]',
    badgeBgClass: 'bg-gradient-to-r from-teal-400 via-cyan-500 to-teal-600 text-black font-black uppercase tracking-wider',
    glowColor: '#14b8a6',
    accentText: 'text-teal-400',
    effectOverlay: 'stardust'
  },
  theme_blood_moon: {
    id: 'theme_blood_moon',
    name: 'Kanlı Ay & Kırmızı Pus Aura',
    cardClass: 'bg-gradient-to-r from-red-950/90 via-rose-950/90 to-black border-2 border-red-500/90 shadow-[0_0_30px_rgba(239,68,68,0.5)]',
    avatarBorderClass: 'ring-2 ring-red-500 ring-offset-2 ring-offset-black animate-pulse',
    nameClass: 'text-red-400 font-black tracking-wider drop-shadow-[0_0_12px_rgba(239,68,68,0.9)]',
    badgeBgClass: 'bg-gradient-to-r from-red-500 via-rose-600 to-red-800 text-white font-black uppercase tracking-wider',
    glowColor: '#ef4444',
    accentText: 'text-red-500',
    effectOverlay: 'void_portal'
  },
  theme_golden_glitch: {
    id: 'theme_golden_glitch',
    name: 'Altın Siber & Glitch Aura',
    cardClass: 'bg-gradient-to-r from-yellow-950/90 via-neutral-900 to-zinc-950 border-2 border-yellow-500/90 shadow-[0_0_30px_rgba(234,179,8,0.4)]',
    avatarBorderClass: 'ring-2 ring-yellow-500 ring-offset-2 ring-offset-black',
    nameClass: 'text-yellow-400 font-black tracking-wider drop-shadow-[0_0_12px_rgba(234,179,8,0.9)]',
    badgeBgClass: 'bg-gradient-to-r from-yellow-500 via-amber-600 to-yellow-700 text-black font-black uppercase tracking-wider',
    glowColor: '#eab308',
    accentText: 'text-yellow-500',
    effectOverlay: 'lightning_plasma'
  },
  theme_phantom: {
    id: 'theme_phantom',
    name: 'Hayalet & Mistik Sis Aura',
    cardClass: 'bg-gradient-to-r from-gray-900/90 via-slate-800/90 to-black border-2 border-slate-300/80 shadow-[0_0_30px_rgba(203,213,225,0.3)]',
    avatarBorderClass: 'ring-2 ring-slate-300 ring-offset-2 ring-offset-black animate-pulse',
    nameClass: 'text-slate-200 font-black tracking-wider drop-shadow-[0_0_10px_rgba(203,213,225,0.7)]',
    badgeBgClass: 'bg-gradient-to-r from-slate-300 via-gray-400 to-slate-500 text-black font-black uppercase tracking-wider',
    glowColor: '#cbd5e1',
    accentText: 'text-slate-300',
    effectOverlay: 'nebula'
  },

  theme_saturn: {
    id: 'theme_saturn',
    name: 'Satürn Halkaları & Kozmik Gezegen Aura',
    cardClass: 'bg-gradient-to-r from-amber-950/90 via-indigo-950/90 to-slate-950 border-2 border-amber-400/90 shadow-[0_0_30px_rgba(251,191,36,0.4)]',
    avatarBorderClass: 'ring-2 ring-amber-400 ring-offset-2 ring-offset-black animate-pulse',
    nameClass: 'text-amber-300 font-black tracking-wider drop-shadow-[0_0_12px_rgba(251,191,36,0.9)]',
    badgeBgClass: 'bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-600 text-black font-black uppercase tracking-wider',
    glowColor: '#fbbf24',
    accentText: 'text-amber-400',
    effectOverlay: 'saturn'
  },
  theme_shooting_star: {
    id: 'theme_shooting_star',
    name: 'Kayan Yıldızlar & Meteor Yağmuru Aura',
    cardClass: 'bg-gradient-to-r from-blue-950/90 via-purple-950/90 to-slate-950 border-2 border-cyan-300/80 shadow-[0_0_28px_rgba(34,211,238,0.4)]',
    avatarBorderClass: 'ring-2 ring-cyan-300 ring-offset-2 ring-offset-black animate-pulse',
    nameClass: 'text-cyan-200 font-black tracking-widest drop-shadow-[0_0_10px_rgba(34,211,238,0.9)]',
    badgeBgClass: 'bg-gradient-to-r from-cyan-400 via-sky-500 to-indigo-600 text-black font-black uppercase',
    glowColor: '#22d3ee',
    accentText: 'text-cyan-300',
    effectOverlay: 'shooting_star'
  },
  theme_nebula: {
    id: 'theme_nebula',
    name: 'Nebula Galaksi & Yıldız Kümesi Aura',
    cardClass: 'bg-gradient-to-r from-purple-950/90 via-fuchsia-950/90 to-slate-950 border-2 border-fuchsia-400/80 shadow-[0_0_28px_rgba(232,121,249,0.4)]',
    avatarBorderClass: 'ring-2 ring-fuchsia-400 ring-offset-2 ring-offset-black',
    nameClass: 'text-fuchsia-300 font-black drop-shadow-[0_0_10px_rgba(232,121,249,0.8)]',
    badgeBgClass: 'bg-gradient-to-r from-fuchsia-500 via-purple-600 to-indigo-600 text-white font-black',
    glowColor: '#e879f9',
    accentText: 'text-fuchsia-400',
    effectOverlay: 'nebula'
  },
  theme_supernova: {
    id: 'theme_supernova',
    name: 'Süpernova Patlaması & Güneş Fırtınası Aura',
    cardClass: 'bg-gradient-to-r from-red-950/90 via-orange-950/90 to-yellow-950/80 border-2 border-orange-400/90 shadow-[0_0_30px_rgba(251,146,60,0.45)]',
    avatarBorderClass: 'ring-2 ring-orange-400 ring-offset-2 ring-offset-black animate-pulse',
    nameClass: 'text-amber-200 font-black drop-shadow-[0_0_12px_rgba(251,146,60,0.9)]',
    badgeBgClass: 'bg-gradient-to-r from-amber-500 via-orange-500 to-red-600 text-black font-black uppercase',
    glowColor: '#fb923c',
    accentText: 'text-orange-400',
    effectOverlay: 'supernova'
  },
  theme_divine: {
    id: 'theme_divine',
    name: 'İlahi Yükseliş & Kutsal Altın Aura',
    cardClass: 'bg-gradient-to-r from-amber-950/90 via-yellow-900/80 to-slate-950 border-2 border-yellow-300/90 shadow-[0_0_35px_rgba(253,224,71,0.5)]',
    avatarBorderClass: 'ring-2 ring-yellow-300 ring-offset-2 ring-offset-black animate-pulse',
    nameClass: 'text-yellow-200 font-black tracking-wider drop-shadow-[0_0_12px_rgba(253,224,71,0.9)]',
    badgeBgClass: 'bg-gradient-to-r from-yellow-300 via-amber-400 to-yellow-500 text-black font-black uppercase tracking-wider',
    glowColor: '#fde047',
    accentText: 'text-yellow-300',
    effectOverlay: 'divine_wings'
  },
  theme_dragon: {
    id: 'theme_dragon',
    name: 'Alevli Ejder Kor Aurası',
    cardClass: 'bg-gradient-to-r from-amber-950/90 via-orange-950/80 to-gray-900 border-2 border-amber-400/80 shadow-[0_0_22px_rgba(245,158,11,0.35)]',
    avatarBorderClass: 'ring-2 ring-amber-400 ring-offset-2 ring-offset-black',
    nameClass: 'text-amber-300 font-black drop-shadow-[0_0_8px_rgba(245,158,11,0.6)]',
    badgeBgClass: 'bg-gradient-to-r from-amber-500 to-yellow-600 text-black font-black',
    glowColor: '#f59e0b',
    accentText: 'text-amber-400',
    effectOverlay: 'dragon_fire'
  },
  theme_cybercat: {
    id: 'theme_cybercat',
    name: 'Siber Neon & Mor Elektrik Aura',
    cardClass: 'bg-gradient-to-r from-purple-950/90 via-fuchsia-950/80 to-slate-950 border-2 border-fuchsia-400/80 shadow-[0_0_22px_rgba(232,121,249,0.35)]',
    avatarBorderClass: 'ring-2 ring-fuchsia-400 ring-offset-2 ring-offset-black',
    nameClass: 'text-fuchsia-300 font-extrabold drop-shadow-[0_0_8px_rgba(232,121,249,0.6)]',
    badgeBgClass: 'bg-gradient-to-r from-fuchsia-500 to-purple-600 text-white font-black',
    glowColor: '#e879f9',
    accentText: 'text-fuchsia-400',
    effectOverlay: 'lightning_plasma'
  },
  theme_void: {
    id: 'theme_void',
    name: 'Karanlık Boyut & Karadelik Portalı',
    cardClass: 'bg-gradient-to-r from-purple-950/90 via-indigo-950/80 to-slate-950 border-2 border-purple-500/80 shadow-[0_0_25px_rgba(168,85,247,0.4)]',
    avatarBorderClass: 'ring-2 ring-purple-500 ring-offset-2 ring-offset-black',
    nameClass: 'text-purple-300 font-black drop-shadow-[0_0_10px_rgba(168,85,247,0.7)]',
    badgeBgClass: 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-black',
    glowColor: '#a855f7',
    accentText: 'text-purple-400',
    effectOverlay: 'void_portal'
  },
  theme_stardust: {
    id: 'theme_stardust',
    name: 'Peri Işıltısı & Yıldız Tozu Aura',
    cardClass: 'bg-gradient-to-r from-purple-950/80 via-pink-950/80 to-slate-900 border-2 border-pink-300/80 shadow-[0_0_25px_rgba(244,114,182,0.35)]',
    avatarBorderClass: 'ring-2 ring-pink-300 ring-offset-2 ring-offset-black',
    nameClass: 'text-pink-200 font-extrabold drop-shadow-[0_0_10px_rgba(244,114,182,0.8)]',
    badgeBgClass: 'bg-gradient-to-r from-pink-400 to-purple-500 text-black font-black',
    glowColor: '#f472b6',
    accentText: 'text-pink-300',
    effectOverlay: 'stardust'
  },
  theme_midnight_moon: {
    id: 'theme_midnight_moon',
    name: 'Gece Yarısı Hilal Ay & Yıldızlar Aura',
    cardClass: 'bg-gradient-to-r from-slate-950 via-indigo-950/90 to-blue-950 border-2 border-indigo-400/80 shadow-[0_0_25px_rgba(129,140,248,0.35)]',
    avatarBorderClass: 'ring-2 ring-indigo-400 ring-offset-2 ring-offset-black',
    nameClass: 'text-indigo-200 font-black drop-shadow-[0_0_10px_rgba(129,140,248,0.8)]',
    badgeBgClass: 'bg-gradient-to-r from-indigo-500 to-sky-600 text-white font-black',
    glowColor: '#818cf8',
    accentText: 'text-indigo-300',
    effectOverlay: 'moon_stars'
  },
  theme_plasma: {
    id: 'theme_plasma',
    name: 'Plazma Şimşek & Fırtına Aura',
    cardClass: 'bg-gradient-to-r from-cyan-950/90 via-purple-950/90 to-slate-950 border-2 border-cyan-400/90 shadow-[0_0_25px_rgba(34,211,238,0.4)]',
    avatarBorderClass: 'ring-2 ring-cyan-400 ring-offset-2 ring-offset-black animate-pulse',
    nameClass: 'text-cyan-300 font-black tracking-wider drop-shadow-[0_0_10px_rgba(34,211,238,0.8)]',
    badgeBgClass: 'bg-gradient-to-r from-cyan-500 to-blue-600 text-black font-black uppercase',
    glowColor: '#22d3ee',
    accentText: 'text-cyan-400',
    effectOverlay: 'lightning_plasma'
  },
  theme_cyberpunk: {
    id: 'theme_cyberpunk',
    name: 'Siber Punk Neon & Siyan Elektrik',
    cardClass: 'bg-gradient-to-r from-cyan-950/90 via-purple-950/80 to-gray-900 border-2 border-cyan-400/80 shadow-[0_0_20px_rgba(34,211,238,0.3)]',
    avatarBorderClass: 'ring-2 ring-cyan-400 ring-offset-2 ring-offset-black animate-pulse',
    nameClass: 'text-cyan-300 font-black tracking-wider drop-shadow-[0_0_10px_rgba(34,211,238,0.7)]',
    badgeBgClass: 'bg-gradient-to-r from-cyan-500 to-blue-600 text-black font-black uppercase tracking-wider',
    glowColor: '#06b6d4',
    accentText: 'text-cyan-400',
    effectOverlay: 'lightning_plasma'
  },
  theme_inferno: {
    id: 'theme_inferno',
    name: 'Cehennem Alevi & Ejder Ateşi',
    cardClass: 'bg-gradient-to-r from-red-950/90 via-orange-950/80 to-gray-900 border-2 border-red-500/80 shadow-[0_0_22px_rgba(239,68,68,0.35)]',
    avatarBorderClass: 'ring-2 ring-red-500 ring-offset-2 ring-offset-black',
    nameClass: 'text-red-400 font-black drop-shadow-[0_0_10px_rgba(239,68,68,0.6)]',
    badgeBgClass: 'bg-gradient-to-r from-red-600 to-orange-600 text-white font-extrabold',
    glowColor: '#ef4444',
    accentText: 'text-red-400',
    effectOverlay: 'dragon_fire'
  },
  theme_emerald: {
    id: 'theme_emerald',
    name: 'Zümrüt Yeşili & Ejder Zehri Aura',
    cardClass: 'bg-gradient-to-r from-emerald-950/90 via-teal-950/80 to-slate-950 border-2 border-emerald-400/80 shadow-[0_0_22px_rgba(52,211,153,0.35)]',
    avatarBorderClass: 'ring-2 ring-emerald-400 ring-offset-2 ring-offset-black',
    nameClass: 'text-emerald-300 font-black drop-shadow-[0_0_8px_rgba(52,211,153,0.6)]',
    badgeBgClass: 'bg-gradient-to-r from-emerald-500 to-teal-600 text-black font-extrabold',
    glowColor: '#34d399',
    accentText: 'text-emerald-400',
    effectOverlay: 'emerald_poison'
  },
  theme_mana: {
    id: 'theme_mana',
    name: 'Mana Akışı & Rünik Büyü Aura',
    cardClass: 'bg-gradient-to-r from-blue-950/90 via-sky-950/80 to-slate-900 border-2 border-sky-400/80 shadow-[0_0_20px_rgba(56,189,248,0.3)]',
    avatarBorderClass: 'ring-2 ring-sky-400 ring-offset-2 ring-offset-black',
    nameClass: 'text-sky-300 font-extrabold drop-shadow-[0_0_8px_rgba(56,189,248,0.5)]',
    badgeBgClass: 'bg-gradient-to-r from-sky-500 to-blue-600 text-black font-extrabold',
    glowColor: '#38bdf8',
    accentText: 'text-sky-400'
  },
  theme_sakura: {
    id: 'theme_sakura',
    name: 'Sakura Bahçesi & Pembe Esinti Aura',
    cardClass: 'bg-gradient-to-r from-pink-950/90 via-rose-950/80 to-gray-900 border-2 border-pink-400/80 shadow-[0_0_20px_rgba(244,114,182,0.25)]',
    avatarBorderClass: 'ring-2 ring-pink-400 ring-offset-2 ring-offset-black',
    nameClass: 'text-pink-300 font-extrabold drop-shadow-[0_0_8px_rgba(244,114,182,0.5)]',
    badgeBgClass: 'bg-gradient-to-r from-pink-500 to-rose-500 text-white font-extrabold',
    glowColor: '#ec4899',
    accentText: 'text-pink-400',
    effectOverlay: 'sakura_bloom'
  },
  theme_night_lotus: {
    id: 'theme_night_lotus',
    name: 'Kutsal Gece Nilüferi & Ethereal Mavi Fon',
    cardClass: 'border-2 border-cyan-400/90 shadow-[0_0_30px_rgba(34,211,238,0.4)]',
    avatarBorderClass: 'ring-2 ring-cyan-300 ring-offset-2 ring-offset-black animate-pulse',
    nameClass: 'text-cyan-200 font-black tracking-wider drop-shadow-[0_0_12px_rgba(34,211,238,0.9)]',
    badgeBgClass: 'bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-600 text-black font-black uppercase tracking-wider',
    glowColor: '#22d3ee',
    accentText: 'text-cyan-300',
    cardBgImageUrl: '/src/assets/images/night_lotus_photo_1786110956916.jpg',
    effectOverlay: 'night_lotus',
    themeType: 'photo'
  },
  theme_moon_furin: {
    id: 'theme_moon_furin',
    name: 'Dolunay & Sakura Cam Rüzgar Çanı Fonu',
    cardClass: 'border-2 border-rose-300/80 shadow-[0_0_25px_rgba(253,164,175,0.35)]',
    avatarBorderClass: 'ring-2 ring-rose-200 ring-offset-2 ring-offset-black',
    nameClass: 'text-rose-100 font-black tracking-wider drop-shadow-[0_0_10px_rgba(253,164,175,0.8)]',
    badgeBgClass: 'bg-gradient-to-r from-rose-300 via-pink-400 to-neutral-700 text-black font-black uppercase tracking-wider',
    glowColor: '#fda4af',
    accentText: 'text-rose-300',
    cardBgImageUrl: '/src/assets/images/sakura_moon_photo_1786110969635.jpg',
    effectOverlay: 'moon_furin',
    themeType: 'photo'
  },
  theme_purple_moon_butterfly: {
    id: 'theme_purple_moon_butterfly',
    name: 'Eflatun Dolunay & Mistik Kelebek Fonu',
    cardClass: 'border-2 border-fuchsia-400/90 shadow-[0_0_28px_rgba(232,121,249,0.4)]',
    avatarBorderClass: 'ring-2 ring-fuchsia-300 ring-offset-2 ring-offset-black animate-pulse',
    nameClass: 'text-fuchsia-200 font-black tracking-wider drop-shadow-[0_0_12px_rgba(232,121,249,0.9)]',
    badgeBgClass: 'bg-gradient-to-r from-fuchsia-400 via-purple-500 to-indigo-600 text-black font-black uppercase tracking-wider',
    glowColor: '#e879f9',
    accentText: 'text-fuchsia-300',
    cardBgImageUrl: '/src/assets/images/night_lotus_photo_1786110956916.jpg',
    effectOverlay: 'purple_moon_butterfly',
    themeType: 'photo'
  },
  theme_night_lanterns: {
    id: 'theme_night_lanterns',
    name: 'Gece Bahçesi & Saray Feneri Fonu',
    cardClass: 'border-2 border-amber-300/80 shadow-[0_0_25px_rgba(252,211,77,0.35)]',
    avatarBorderClass: 'ring-2 ring-amber-300 ring-offset-2 ring-offset-black',
    nameClass: 'text-amber-100 font-black tracking-wider drop-shadow-[0_0_10px_rgba(252,211,77,0.8)]',
    badgeBgClass: 'bg-gradient-to-r from-amber-300 via-rose-400 to-zinc-800 text-black font-black uppercase tracking-wider',
    glowColor: '#fcd34d',
    accentText: 'text-amber-300',
    cardBgImageUrl: '/src/assets/images/lantern_garden_photo_1786110983781.jpg',
    effectOverlay: 'night_lanterns',
    themeType: 'photo'
  },
  theme_sakura_cascade: {
    id: 'theme_sakura_cascade',
    name: 'Gece Yarısı Pembe Sakura Yağmuru Fonu',
    cardClass: 'border-2 border-pink-400/90 shadow-[0_0_28px_rgba(244,114,182,0.4)]',
    avatarBorderClass: 'ring-2 ring-pink-300 ring-offset-2 ring-offset-black animate-pulse',
    nameClass: 'text-pink-200 font-black tracking-wider drop-shadow-[0_0_12px_rgba(244,114,182,0.9)]',
    badgeBgClass: 'bg-gradient-to-r from-pink-400 via-rose-500 to-blue-700 text-black font-black uppercase tracking-wider',
    glowColor: '#f472b6',
    accentText: 'text-pink-300',
    cardBgImageUrl: '/src/assets/images/sakura_moon_photo_1786110969635.jpg',
    effectOverlay: 'sakura_cascade',
    themeType: 'photo'
  },
  theme_crimson_moon_romance: {
    id: 'theme_crimson_moon_romance',
    name: 'Kızıl Dolunay & Geyik Boynuzlu Aşk Fonu',
    cardClass: 'border-2 border-red-500/90 shadow-[0_0_35px_rgba(239,68,68,0.5)]',
    avatarBorderClass: 'ring-2 ring-red-400 ring-offset-2 ring-offset-black animate-pulse',
    nameClass: 'text-red-200 font-black tracking-wider drop-shadow-[0_0_12px_rgba(239,68,68,0.9)]',
    badgeBgClass: 'bg-gradient-to-r from-red-500 via-rose-600 to-amber-600 text-white font-black uppercase tracking-wider',
    glowColor: '#ef4444',
    accentText: 'text-red-300',
    cardBgImageUrl: '/src/assets/images/crimson_moon_romance_1786110942949.jpg',
    effectOverlay: 'crimson_moon_romance',
    themeType: 'photo'
  },
  theme_purple_crystal_sakura: {
    id: 'theme_purple_crystal_sakura',
    name: 'Mistik Mor Kristal Sakura & Pırlanta Çiçek Fonu',
    cardClass: 'border-2 border-purple-400/90 shadow-[0_0_35px_rgba(192,132,252,0.5)]',
    avatarBorderClass: 'ring-2 ring-purple-300 ring-offset-2 ring-offset-black animate-pulse',
    nameClass: 'text-purple-200 font-black tracking-wider drop-shadow-[0_0_12px_rgba(192,132,252,0.95)]',
    badgeBgClass: 'bg-gradient-to-r from-purple-400 via-fuchsia-400 to-indigo-500 text-black font-black uppercase tracking-wider',
    glowColor: '#c084fc',
    accentText: 'text-purple-300',
    cardBgImageUrl: '/purple_crystal_sakura.svg',
    effectOverlay: 'purple_crystal_sakura',
    themeType: 'photo'
  },
  theme_gothic_hanging_lanterns: {
    id: 'theme_gothic_hanging_lanterns',
    name: 'Gotik Gece Fenerleri & Mistik Şamdan Fonu',
    cardClass: 'border-2 border-purple-500/90 shadow-[0_0_35px_rgba(168,85,247,0.55)]',
    avatarBorderClass: 'ring-2 ring-purple-400 ring-offset-2 ring-offset-black animate-pulse',
    nameClass: 'text-purple-200 font-black tracking-wider drop-shadow-[0_0_12px_rgba(216,180,254,0.95)]',
    badgeBgClass: 'bg-gradient-to-r from-purple-500 via-fuchsia-400 to-indigo-600 text-black font-black uppercase tracking-wider',
    glowColor: '#a855f7',
    accentText: 'text-purple-300',
    cardBgImageUrl: '/gothic_hanging_lanterns.svg',
    effectOverlay: 'gothic_hanging_lanterns',
    themeType: 'photo'
  },
  theme_gothic_silver_filigree: {
    id: 'theme_gothic_silver_filigree',
    name: 'Gotik Gümüş Sarmaşık & Kelebek Fonu',
    cardClass: 'border-2 border-slate-300/80 shadow-[0_0_35px_rgba(255,255,255,0.45)]',
    avatarBorderClass: 'ring-2 ring-slate-100 ring-offset-2 ring-offset-[#080c18] animate-pulse',
    nameClass: 'text-slate-100 font-black tracking-wider drop-shadow-[0_0_14px_rgba(255,255,255,0.95)]',
    badgeBgClass: 'bg-gradient-to-r from-slate-200 via-white to-indigo-200 text-slate-950 font-black uppercase tracking-wider',
    glowColor: '#cbd5e1',
    accentText: 'text-slate-200',
    cardBgImageUrl: '/gothic_silver_filigree_vines.svg',
    effectOverlay: 'gothic_silver_filigree',
    themeType: 'photo'
  }
};

export const THEME_STYLES: Record<string, ThemeStyle> = { ...BASE_THEME_STYLES };

export const SHOP_ITEMS: ShopItem[] = [

  {
    id: 'theme_abyss',
    name: 'Okyanus Uçurumu & Derin Su Aura',
    category: 'theme',
    price: 180,
    description: 'Karanlık okyanus derinliklerinden gelen parlak deniz mavisi aura.',
    icon: '🌊',
    rarity: 'Destansı'
  },
  {
    id: 'theme_blood_moon',
    name: 'Kanlı Ay & Kırmızı Pus Aura',
    category: 'theme',
    price: 200,
    description: 'Kırmızı puslu gökyüzü ve kanlı ayın karanlık güçleri.',
    icon: '🩸',
    rarity: 'Efsanevi'
  },
  {
    id: 'theme_golden_glitch',
    name: 'Altın Siber & Glitch Aura',
    category: 'theme',
    price: 160,
    description: 'Altın renkli elektrik kıvılcımları ve siber uzay parıltıları.',
    icon: '💽',
    rarity: 'Destansı'
  },
  {
    id: 'theme_phantom',
    name: 'Hayalet & Mistik Sis Aura',
    category: 'theme',
    price: 120,
    description: 'Gümüş grisi hayalet aurası ve gizemli ruhani parıltılar.',
    icon: '👻',
    rarity: 'Nadir'
  },

  // --- 20 RESMİ AURA & RENK TEMASI (OFFICIAL ADMIN SHOP ITEMS) ---
  {
    id: 'theme_saturn',
    name: 'Satürn Halkaları & Kozmik Aura',
    category: 'theme',
    price: 230,
    description: 'Dönen Satürn gezegeni, altın gezegen halkaları ve derin kozmik uzay aurası!',
    icon: '🪐',
    rarity: 'Efsanevi'
  },
  {
    id: 'theme_divine',
    name: 'İlahi Yükseliş & Kutsal Altın Aura',
    category: 'theme',
    price: 250,
    description: 'Yorum kartınızı kaplayan kutsal melek ışıltısı ve altın ışık krallık aurası.',
    icon: '👼',
    rarity: 'Efsanevi'
  },
  {
    id: 'theme_supernova',
    name: 'Süpernova Patlaması & Güneş Fırtınası Aura',
    category: 'theme',
    price: 240,
    description: 'Aşırı sıcak güneş patlamaları ve alevli plazma koruyla parlayan extreme tema.',
    icon: '☀️',
    rarity: 'Efsanevi'
  },
  {
    id: 'theme_shooting_star',
    name: 'Kayan Yıldızlar & Meteor Yağmuru Aura',
    category: 'theme',
    price: 210,
    description: 'Yorum kartınızda süzülen meteorlar, kayan yıldız kuyrukları ve mavi stardust ışıltısı.',
    icon: '☄️',
    rarity: 'Efsanevi'
  },
  {
    id: 'theme_nebula',
    name: 'Nebula Galaksi & Yıldız Kümesi Aura',
    category: 'theme',
    price: 200,
    description: 'Mor ve fuşya renkli galaksi nebulası, parıldayan uzak yıldızlar ve kozmik enerji.',
    icon: '🌌',
    rarity: 'Efsanevi'
  },
  {
    id: 'theme_void',
    name: 'Karanlık Boyut & Karadelik Portalı',
    category: 'theme',
    price: 180,
    description: 'Galaksi ve mor uzay boşluğu karadelik portalı. Yorumlarınız gizemli boyutsal enerji saçsın.',
    icon: '🌀',
    rarity: 'Destansı'
  },
  {
    id: 'theme_plasma',
    name: 'Plazma Şimşek & Fırtına Aura',
    category: 'theme',
    price: 170,
    description: 'Yüksek voltajlı mor ve siyan elektrik arkları, fırtına şimşekleri ve dinamik aura.',
    icon: '⚡',
    rarity: 'Destansı'
  },
  {
    id: 'theme_stardust',
    name: 'Peri Işıltısı & Yıldız Tozu Aura',
    category: 'theme',
    price: 160,
    description: 'Büyülü mor ve pembe stardust kıvılcımları, perilerin ışıltılı tozu ve rüya aurası.',
    icon: '✨',
    rarity: 'Destansı'
  },
  {
    id: 'theme_midnight_moon',
    name: 'Gece Yarısı Hilal Ay & Yıldızlar Aura',
    category: 'theme',
    price: 160,
    description: 'Gece yarısı lacivert gökyüzü, parıldayan hilal ay ve takımyıldız ışıltısı.',
    icon: '🌙',
    rarity: 'Destansı'
  },
  {
    id: 'theme_dragon',
    name: 'Alevli Ejder Kor Aurası',
    category: 'theme',
    price: 150,
    description: 'Alev ve kırmızı kor parçacıkları saçan ejderha temalı aydınlatmalı yorum kartı.',
    icon: '🐉',
    rarity: 'Destansı'
  },
  {
    id: 'theme_cybercat',
    name: 'Siber Neon & Mor Elektrik Aura',
    category: 'theme',
    price: 130,
    description: 'Mor ve siyan neon elektrik ışımaları içeren yüksek teknolojili yorum kartı.',
    icon: '🐱',
    rarity: 'Nadir'
  },
  {
    id: 'theme_inferno',
    name: 'Cehennem Alevi & Ejder Ateşi',
    category: 'theme',
    price: 130,
    description: 'Ateş ve kıvılcım saçan kırmızı alevli ejderha yorum kartı.',
    icon: '🔥',
    rarity: 'Nadir'
  },
  {
    id: 'theme_emerald',
    name: 'Zümrüt Yeşili & Ejder Zehri Aura',
    category: 'theme',
    price: 120,
    description: 'Büyüleyici zümrüt yeşili zehir ateşi ve antik orman ejderhası aurası.',
    icon: '🐍',
    rarity: 'Nadir'
  },
  {
    id: 'theme_cyberpunk',
    name: 'Siber Punk Neon & Siyan Elektrik',
    category: 'theme',
    price: 110,
    description: 'Geleceğin neon siyan ve mor elektrik aura çerçevesi.',
    icon: '⚡',
    rarity: 'Nadir'
  },
  {
    id: 'theme_mana',
    name: 'Mana Akışı & Rünik Büyü Aura',
    category: 'theme',
    price: 90,
    description: 'Büyücülerin ve avcıların rünik gök mavisi mana parıltılı yorum çerçevesi.',
    icon: '🔮',
    rarity: 'Yaygın'
  },
  {
    id: 'theme_sakura',
    name: 'Sakura Bahçesi & Pembe Esinti Aura',
    category: 'theme',
    price: 80,
    description: 'Romantik ve tatlı sakura pembe yaprak parıltısı. Yorum kartınıza pembe esinti katar.',
    icon: '🌸',
    rarity: 'Yaygın'
  },
  {
    id: 'theme_purple_crystal_sakura',
    name: 'Mistik Mor Kristal Sakura & Pırlanta Çiçek Fonu',
    category: 'theme',
    themeType: 'photo',
    price: 240,
    description: 'Karanlık gece fonunda parıldayan mor kristal sakura çiçekleri, elmas taşlı starlight ışıltıları ve dökülen eflatun parıltılı yapraklar.',
    icon: '🔮',
    rarity: 'Efsanevi'
  },
  {
    id: 'theme_gothic_hanging_lanterns',
    name: 'Gotik Gece Fenerleri & Mistik Şamdan Fonu',
    category: 'theme',
    themeType: 'photo',
    price: 250,
    description: 'Karanlık gece göğünde zincirlerle sallanan gotik demir fenerler, camların içindeki mor alevler, parıldayan kristal uçlar ve mistik toz bulutu.',
    icon: '🏮',
    rarity: 'Efsanevi'
  },
  {
    id: 'theme_gothic_silver_filigree',
    name: 'Gotik Gümüş Sarmaşık & Kelebek Fonu',
    category: 'theme',
    themeType: 'photo',
    price: 260,
    description: 'Derin gece mavisi fonunda parıldayan gümüş kıvrımlı sarmaşıklar, profili saran ve öne çıkan botanik dallar, canlı gümüş kelebek ve parıltılı elmas yıldızlar.',
    icon: '🦋',
    rarity: 'Efsanevi'
  },
  {
    id: 'theme_crimson_moon_romance',
    name: 'Kızıl Dolunay & Geyik Boynuzlu Aşk Fonu',
    category: 'theme',
    themeType: 'photo',
    price: 230,
    description: 'Büyüleyici kızıl dolunay, dökülen kırmızı akçaağaç yaprakları, geyik boynuzlu ve siyah kanatlı fantastik aşıkların görsel arka plan fonu.',
    icon: '🍁',
    rarity: 'Efsanevi'
  },
  {
    id: 'theme_night_lotus',
    name: 'Kutsal Gece Nilüferi & Ethereal Mavi Fon',
    category: 'theme',
    themeType: 'photo',
    price: 210,
    description: 'Derin gece göğünde yüzen parıldayan mavi nilüfer çiçekleri, mistik su ışığı ve efsanevi mavi görsel fon.',
    icon: '🪷',
    rarity: 'Efsanevi'
  },
  {
    id: 'theme_moon_furin',
    name: 'Dolunay & Sakura Cam Rüzgar Çanı Fonu',
    category: 'theme',
    themeType: 'photo',
    price: 190,
    description: 'Gümüşi dolunay altında sallanan sakura nakışlı cam rüzgar çanı ve gece esintili görsel arka plan.',
    icon: '🎐',
    rarity: 'Efsanevi'
  },
  {
    id: 'theme_purple_moon_butterfly',
    name: 'Eflatun Dolunay & Mistik Kelebek Fonu',
    category: 'theme',
    themeType: 'photo',
    price: 200,
    description: 'Eflatun dolunayın büyüleyici ışığında süzülen parlak kelebekler ve mor çiçekli gece görsel arka planı.',
    icon: '🦋',
    rarity: 'Efsanevi'
  },
  {
    id: 'theme_night_lanterns',
    name: 'Gece Bahçesi & Saray Feneri Fonu',
    category: 'theme',
    themeType: 'photo',
    price: 200,
    description: 'Siyah gecede parıldayan el yapımı işlemeli saray fenerleri, pembe çiçekler ve sıcak fener görsel fonu.',
    icon: '🏮',
    rarity: 'Efsanevi'
  },
  {
    id: 'theme_sakura_cascade',
    name: 'Gece Yarısı Pembe Sakura Yağmuru Fonu',
    category: 'theme',
    themeType: 'photo',
    price: 190,
    description: 'Karanlık lacivert gece göğünden süzülen yoğun pembe sakura çiçeği yağmuru ve ışıltılı tozlu görsel arka plan.',
    icon: '🌸',
    rarity: 'Efsanevi'
  },

  // =========================================================================
  // ÖZEL LGBT+, YAOI, YURI, OMEGAVERSE & MİKROKOSMOS VIP ÜNVANLARI (BADGES)
  // =========================================================================
  {
    id: 'badge_premium_member',
    name: '✨ Premium Üye',
    category: 'badge',
    badgeText: '✨ Premium Üye',
    price: 350,
    description: 'Mikrokosmos\'un en seçkin ve ayrıcalıklı üyelerine özel parıltılı ultra-lüks VIP unvanı.',
    icon: '✨',
    rarity: 'Efsanevi',
    badgeStyle: 'bg-gradient-to-r from-amber-300 via-yellow-100 via-fuchsia-300 to-amber-300 text-purple-950 font-black border-2 border-yellow-300 shadow-[0_0_20px_rgba(250,204,21,0.95),0_0_8px_rgba(168,85,247,0.8)] animate-pulse'
  },
  {
    id: 'badge_mikrokosmos_vip',
    name: '🌌 Mikrokosmos VIP',
    category: 'badge',
    badgeText: '🌌 Mikrokosmos VIP',
    price: 250,
    description: 'Mikrokosmos evreninin en sadık ve köklü okuyucularına özel, galaktik parıltılı VIP unvanı.',
    icon: '🌌',
    rarity: 'Efsanevi',
    badgeStyle: 'bg-gradient-to-r from-purple-600 via-indigo-500 to-fuchsia-600 text-white font-black border border-purple-300 shadow-[0_0_12px_rgba(168,85,247,0.6)]'
  },
  {
    id: 'badge_enigma_ruler',
    name: '⚡ Enigma',
    category: 'badge',
    badgeText: '⚡ Enigma',
    price: 180,
    description: 'Omegaverse hiyerarşisinin en tepesinde yer alan, alfaları dahi dize getirebilen efsanevi üst tür.',
    icon: '⚡',
    rarity: 'Efsanevi',
    badgeStyle: 'bg-gradient-to-r from-slate-950 via-purple-900 to-amber-500 text-amber-200 font-black border border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.6)]'
  },
  {
    id: 'badge_yaoi_aristocrat',
    name: '👑 Yaoi Aristokratı',
    category: 'badge',
    badgeText: '👑 Yaoi Aristokratı',
    price: 140,
    description: 'Yaoi ve Boys Love (BL) serilerinin soylu ve vazgeçilmez okuyucularına özel altın taçlı asalet unvanı.',
    icon: '👑',
    rarity: 'Efsanevi',
    badgeStyle: 'bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 text-black font-black border border-yellow-200 shadow-[0_0_12px_rgba(251,191,36,0.6)]'
  },
  {
    id: 'badge_yuri_princess',
    name: '🌸 Yuri Prensesi',
    category: 'badge',
    badgeText: '🌸 Yuri Prensesi',
    price: 140,
    description: 'Girls Love (GL) ve Yuri dünyasının naif, saf ve büyüleyici aşklarını kalbinde taşıyan zarif unvan.',
    icon: '🌸',
    rarity: 'Efsanevi',
    badgeStyle: 'bg-gradient-to-r from-rose-500 via-pink-400 to-fuchsia-500 text-white font-black border border-pink-300 shadow-[0_0_12px_rgba(244,114,182,0.6)]'
  },
  {
    id: 'badge_stigma_bond',
    name: '🔮 Stigma',
    category: 'badge',
    badgeText: '🔮 Stigma',
    price: 135,
    description: 'Ruhu kutsal bir mühürle eşine ebediyen bağlanmış, kaderin derin bağına sahip seçkin unvan.',
    icon: '🔮',
    rarity: 'Destansı',
    badgeStyle: 'bg-gradient-to-r from-violet-950 via-purple-700 to-indigo-950 text-fuchsia-200 font-black border border-fuchsia-400 shadow-[0_0_12px_rgba(217,70,239,0.5)]'
  },
  {
    id: 'badge_black_flag',
    name: '🖤 Black Flag',
    category: 'badge',
    badgeText: '🖤 Black Flag',
    price: 130,
    description: 'Karanlık sokakların, mafya liderlerinin ve sınır tanımayan takıntılı semelerin tehlikeli unvanı.',
    icon: '🖤',
    rarity: 'Destansı',
    badgeStyle: 'bg-gradient-to-r from-black via-zinc-900 to-neutral-950 text-red-500 font-black border border-zinc-600 shadow-[0_0_12px_rgba(0,0,0,0.8)]'
  },
  {
    id: 'badge_red_flag',
    name: '🚩 Red Flag',
    category: 'badge',
    badgeText: '🚩 Red Flag',
    price: 125,
    description: 'Toksik, kıskanç ve manipülatif ama karşı konulamayacak kadar çekici ve karizmatik.',
    icon: '🚩',
    rarity: 'Destansı',
    badgeStyle: 'bg-gradient-to-r from-red-600 via-rose-600 to-red-800 text-white font-black border border-red-300 shadow-[0_0_14px_rgba(239,68,68,0.7)]'
  },
  {
    id: 'badge_green_flag',
    name: '🟢 Green Flag',
    category: 'badge',
    badgeText: '🟢 Green Flag',
    price: 125,
    description: 'Şefkatli, saygılı, el üstünde tutan, güven veren ve kalbi pamuk gibi olan rüya partner.',
    icon: '🟢',
    rarity: 'Destansı',
    badgeStyle: 'bg-gradient-to-r from-emerald-500 via-teal-400 to-green-600 text-slate-950 font-black border border-emerald-200 shadow-[0_0_14px_rgba(16,185,129,0.6)]'
  },
  {
    id: 'badge_vampire_duke',
    name: '🩸 Vampir Dükü',
    category: 'badge',
    badgeText: '🩸 Vampir Dükü',
    price: 125,
    description: 'Karanlık şatoların, tehlikeli boyun ısırıklarının ve ebedi tutkulu vampir aşklarının asil unvanı.',
    icon: '🩸',
    rarity: 'Destansı',
    badgeStyle: 'bg-gradient-to-r from-red-950 via-rose-900 to-red-950 text-rose-200 font-black border border-rose-500 shadow-[0_0_12px_rgba(225,29,72,0.5)]'
  },
  {
    id: 'badge_crimson_lily',
    name: '🥀 Kızıl Zambak',
    category: 'badge',
    badgeText: '🥀 Kızıl Zambak',
    price: 120,
    description: 'Yuri dünyasının asil leydileri, yasak bahçeler ve fısıltılı zarafetle birbirine bağlanan derin aşklar.',
    icon: '🥀',
    rarity: 'Destansı',
    badgeStyle: 'bg-gradient-to-r from-purple-900 via-rose-800 to-pink-900 text-pink-100 font-black border border-pink-400/60 shadow-[0_0_10px_rgba(244,114,182,0.4)]'
  },
  {
    id: 'badge_rainbow_guardian',
    name: '🏳️‍🌈 Gökkuşağı Muhafızı',
    category: 'badge',
    badgeText: '🏳️‍🌈 Gökkuşağı Muhafızı',
    price: 120,
    description: 'Aşkın tüm renklerini kucaklayan, LGBT+ dayanışmasının ve özgür ruhların sarsılmaz koruyucu unvanı.',
    icon: '🏳️‍🌈',
    rarity: 'Destansı',
    badgeStyle: 'bg-gradient-to-r from-rose-500 via-amber-400 via-emerald-500 via-sky-500 to-purple-600 text-white font-black border border-white/60 shadow-[0_0_12px_rgba(255,255,255,0.4)]'
  },
  {
    id: 'badge_protective_seme',
    name: '⚔️ Koruyucu Seme',
    category: 'badge',
    badgeText: '⚔️ Koruyucu Seme',
    price: 115,
    description: 'Sevdiğini her türlü tehlikeye karşı gövdesiyle savunan, sadık, güçlü ve tavizsiz alfa koruyucu.',
    icon: '⚔️',
    rarity: 'Destansı',
    badgeStyle: 'bg-gradient-to-r from-slate-800 via-indigo-900 to-slate-950 text-cyan-200 font-black border border-cyan-400/60 shadow-[0_0_10px_rgba(34,211,238,0.4)]'
  },
  {
    id: 'badge_protective_uke',
    name: '🛡️ Koruyucu Uke',
    category: 'badge',
    badgeText: '🛡️ Koruyucu Uke',
    price: 115,
    description: 'Kendi zekası ve cesaretiyle semesini koruyan, narin görünüşünün ardında çelik gibi irade taşıyan uke.',
    icon: '🛡️',
    rarity: 'Destansı',
    badgeStyle: 'bg-gradient-to-r from-teal-950 via-cyan-900 to-slate-950 text-teal-200 font-black border border-teal-400/60 shadow-[0_0_10px_rgba(45,212,191,0.4)]'
  },
  {
    id: 'badge_alpha_lord',
    name: '🐺 Alfa Lordu',
    category: 'badge',
    badgeText: '🐺 Alfa Lordu',
    price: 110,
    description: 'Omegaverse ve karanlık fantezi evrenlerinin karizmatik, koruyucu, güçlü ve lider ruhlu asil unvanı.',
    icon: '🐺',
    rarity: 'Destansı',
    badgeStyle: 'bg-gradient-to-r from-red-800 via-rose-700 to-zinc-950 text-red-100 font-black border border-red-500 shadow-[0_0_10px_rgba(225,29,72,0.6)]'
  },
  {
    id: 'badge_moonlight_omega',
    name: '🌙 Ay Işığı Omega',
    category: 'badge',
    badgeText: '🌙 Ay Işığı Omega',
    price: 110,
    description: 'Gecenin zarafetini, dolunayın mistik çekimini ve derin sadakatini temsil eden büyüleyici unvan.',
    icon: '🌙',
    rarity: 'Destansı',
    badgeStyle: 'bg-gradient-to-r from-indigo-900 via-purple-600 to-pink-400 text-white font-black border border-purple-300 shadow-[0_0_10px_rgba(192,132,252,0.5)]'
  },
  {
    id: 'badge_danmei_scholar',
    name: '🦋 Danmei Bilgesi',
    category: 'badge',
    badgeText: '🦋 Danmei Bilgesi',
    price: 100,
    description: 'Antik Çin BL (Danmei), bin yıllık reenkarnasyonlar ve xianxia efsanelerinin hikaye bilgesi.',
    icon: '🦋',
    rarity: 'Destansı',
    badgeStyle: 'bg-gradient-to-r from-cyan-600 via-teal-500 to-emerald-600 text-black font-black border border-cyan-200 shadow-[0_0_10px_rgba(34,211,238,0.5)]'
  },
  {
    id: 'badge_tsundere_uke',
    name: '💢 Tsundere Uke',
    category: 'badge',
    badgeText: '💢 Tsundere Uke',
    price: 95,
    description: 'Dışı sert ve huysuz görünse de içi sıcacık, utanınca yanakları al al olan sevimli baş belası.',
    icon: '💢',
    rarity: 'Nadir',
    badgeStyle: 'bg-gradient-to-r from-amber-500 via-orange-400 to-red-500 text-black font-black border border-orange-200 shadow-md'
  },
  {
    id: 'badge_smol_uke',
    name: '🍓 Smol Uke',
    category: 'badge',
    badgeText: '🍓 Smol Uke',
    price: 95,
    description: 'Yaoi dünyasının yanakları kızaran, tatlı, sevimli ve kalpleri eriten masum ukesi.',
    icon: '🍓',
    rarity: 'Nadir',
    badgeStyle: 'bg-gradient-to-r from-pink-400 via-rose-300 to-pink-500 text-rose-950 font-black border border-pink-200 shadow-md'
  },
  {
    id: 'badge_yandere_lover',
    name: '⛓️ Yandere',
    category: 'badge',
    badgeText: '⛓️ Yandere',
    price: 90,
    description: 'Aşkı için dünyayı yakmaya hazır, kıskanç, tutkulu ve sınır tanımayan karanlık webtoon aşığı.',
    icon: '⛓️',
    rarity: 'Nadir',
    badgeStyle: 'bg-gradient-to-r from-neutral-900 via-rose-950 to-red-950 text-red-400 font-black border border-red-700/80 shadow-[0_0_10px_rgba(185,28,28,0.5)]'
  },
  {
    id: 'badge_gothic_noble',
    name: '🍷 Gotik Soylu',
    category: 'badge',
    badgeText: '🍷 Gotik Soylu',
    price: 85,
    description: 'Karanlık şatolar, tehlikeli dükler ve entrika dolu tutkulu gotik webtoon okuyucusu.',
    icon: '🍷',
    rarity: 'Nadir',
    badgeStyle: 'bg-gradient-to-r from-purple-950 via-rose-950 to-zinc-950 text-rose-300 font-bold border border-rose-500/60 shadow-md'
  },

  // =========================================================================
  // ÖZEL PROFİL VE AVATAR ÇERÇEVELERİ (AVATAR FRAMES)
  // =========================================================================
  {
    id: 'frame_golden_crown',
    name: '👑 İmparatorluk Altın Tacı Çerçevesi',
    category: 'frame',
    price: 180,
    description: 'Altın işlemeli asalet tacı ve parlak altın zırh aurasıyla parıldayan efsanevi avatar çerçevesi.',
    icon: '👑',
    rarity: 'Efsanevi',
    frameStyle: 'ring-4 ring-yellow-400 ring-offset-2 ring-offset-black shadow-[0_0_20px_rgba(250,204,21,0.85)] animate-pulse'
  },
  {
    id: 'frame_neon_cyber',
    name: '⚡ Neon Siber Glitch Çerçevesi',
    category: 'frame',
    price: 150,
    description: 'Fütüristik neon mavi ve fuşya siber dalgalarla ışıldayan dinamik cyberpunk çerçevesi.',
    icon: '⚡',
    rarity: 'Efsanevi',
    frameStyle: 'ring-4 ring-cyan-400 ring-offset-2 ring-offset-black shadow-[0_0_20px_rgba(34,211,238,0.85),0_0_10px_rgba(236,72,153,0.8)]'
  },
  {
    id: 'frame_cosmic_galaxy',
    name: '🌌 Kozmik Galaksi Halka Çerçevesi',
    category: 'frame',
    price: 140,
    description: 'Mor nebula tozları ve dönen galaktik yıldız çemberiyle bezenmiş mistik kozmik çerçeve.',
    icon: '🌌',
    rarity: 'Destansı',
    frameStyle: 'ring-4 ring-purple-500 ring-offset-2 ring-offset-black shadow-[0_0_18px_rgba(168,85,247,0.8)]'
  },
  {
    id: 'frame_gothic_vampire',
    name: '🩸 Gotik Kan Dikeni & Vampir Gülü',
    category: 'frame',
    price: 130,
    description: 'Koyu yakut kırmızısı dikenler, karanlık gölge ve vampir dükü asaletine sahip çerçeve.',
    icon: '🩸',
    rarity: 'Destansı',
    frameStyle: 'ring-4 ring-red-600 ring-offset-2 ring-offset-black shadow-[0_0_18px_rgba(220,38,38,0.85)]'
  },
  {
    id: 'frame_sakura_bloom',
    name: '🌸 Uçuşan Sakura Çiçekleri Çerçevesi',
    category: 'frame',
    price: 125,
    description: 'Baharın zarafetini taşıyan narin pembe kiraz çiçekleri ve tatlı pastel ışıltı.',
    icon: '🌸',
    rarity: 'Destansı',
    frameStyle: 'ring-4 ring-pink-400 ring-offset-2 ring-offset-black shadow-[0_0_16px_rgba(244,114,182,0.8)]'
  },
  {
    id: 'frame_yandere_chains',
    name: '⛓️ Yandere Kırmızı Zincir Çerçevesi',
    category: 'frame',
    price: 120,
    description: 'Takıntılı karanlık aşkın simgesi olan kan kırmızısı zincirler ve tehlikeli aura.',
    icon: '⛓️',
    rarity: 'Destansı',
    frameStyle: 'ring-4 ring-red-700 ring-offset-2 ring-offset-black shadow-[0_0_16px_rgba(185,28,28,0.9)]'
  },
  {
    id: 'frame_green_flag_vine',
    name: '🌿 Green Flag Zümrüt Sarmaşık',
    category: 'frame',
    price: 110,
    description: 'Canlı doğa filizleri, zümrüt yeşili şifa enerjisi ve huzur veren partner çerçevesi.',
    icon: '🌿',
    rarity: 'Destansı',
    frameStyle: 'ring-4 ring-emerald-400 ring-offset-2 ring-offset-black shadow-[0_0_16px_rgba(16,185,129,0.8)]'
  },
  {
    id: 'frame_black_flag_shadow',
    name: '🖤 Black Flag Mafya Dumanı',
    category: 'frame',
    price: 115,
    description: 'Zifiri karanlık yeraltı dumanları ve kırmızı gölgeyle çevrili tehlikeli mafya çerçevesi.',
    icon: '🖤',
    rarity: 'Destansı',
    frameStyle: 'ring-4 ring-zinc-500 ring-offset-2 ring-offset-black shadow-[0_0_16px_rgba(0,0,0,0.95)]'
  },
  {
    id: 'frame_tsundere_fire',
    name: '💢 Tsundere Alevli Çerçeve',
    category: 'frame',
    price: 95,
    description: 'Kıvılcımlı amber-turuncu alevler ve utanınca parlayan kızıl enerji halkası.',
    icon: '💢',
    rarity: 'Nadir',
    frameStyle: 'ring-4 ring-orange-500 ring-offset-2 ring-offset-black shadow-[0_0_14px_rgba(249,115,22,0.8)]'
  },
  {
    id: 'frame_smol_angel',
    name: '🍓 Smol Pastel Melek Çerçevesi',
    category: 'frame',
    price: 90,
    description: 'Yumuşacık pastel pembe melek kanatları ve sevimli parıltılarla dolu tatlı çerçeve.',
    icon: '🍓',
    rarity: 'Nadir',
    frameStyle: 'ring-4 ring-rose-300 ring-offset-2 ring-offset-black shadow-[0_0_14px_rgba(253,164,175,0.8)]'
  },
  {
    id: 'frame_ice_crystal',
    name: '❄️ Donmuş Buzul Kristali',
    category: 'frame',
    price: 90,
    description: 'Kuzey rüzgarlarının dondurucu kristal maviliği ve parlayan kar taneleri çerçevesi.',
    icon: '❄️',
    rarity: 'Nadir',
    frameStyle: 'ring-4 ring-sky-300 ring-offset-2 ring-offset-black shadow-[0_0_14px_rgba(125,211,252,0.8)]'
  },
  {
    id: 'frame_royal_amethyst',
    name: '🔮 Mistik Ametist Rünü Çerçevesi',
    category: 'frame',
    price: 90,
    description: 'Kadim büyü rünleri ve derin ametist moru parıltılarla korunan mistik çerçeve.',
    icon: '🔮',
    rarity: 'Nadir',
    frameStyle: 'ring-4 ring-violet-500 ring-offset-2 ring-offset-black shadow-[0_0_14px_rgba(139,92,246,0.8)]'
  },

  // =========================================================================
  // GERÇEK ANİME & MANHWA CHIBI ÇIKARTMA PAKETLERİ (ŞEFFAF PNG / WEBP ÇİZİMLERİ)
  // =========================================================================
  {
    id: 'chibi_genshin_alpha',
    name: '👑 Neuvillette & Genshin Chibi Paketi',
    category: 'emoji_pack',
    price: 15,
    description: 'Yüksek kaliteli şeffaf Neuvillette, Furina ve Genshin chibi karakter çizimleri. Yorumlarda büyük anime çıkartması olarak parlar.',
    icon: '👑',
    rarity: 'Destansı',
    emojis: [
      {
        code: ':chibi_neuvillette_think:',
        label: 'Neuvillette Düşünceli',
        imageUrl: 'https://images.weserv.nl/?url=https://static.wikia.nocookie.net/gensin-impact/images/1/1c/Character_Neuvillette_Sticker_1.png&output=webp'
      },
      {
        code: ':chibi_neuvillette_tea:',
        label: 'Neuvillette Çay Keyfi',
        imageUrl: 'https://images.weserv.nl/?url=https://static.wikia.nocookie.net/gensin-impact/images/f/f9/Character_Neuvillette_Sticker_2.png&output=webp'
      },
      {
        code: ':chibi_furina_drama:',
        label: 'Furina Dramatik',
        imageUrl: 'https://images.weserv.nl/?url=https://static.wikia.nocookie.net/gensin-impact/images/3/36/Character_Furina_Sticker_1.png&output=webp'
      },
      {
        code: ':chibi_wriothesley_smirk:',
        label: 'Wriothesley Sırıtış',
        imageUrl: 'https://images.weserv.nl/?url=https://static.wikia.nocookie.net/gensin-impact/images/3/32/Character_Wriothesley_Sticker_1.png&output=webp'
      },
      {
        code: ':chibi_zhongli_tea:',
        label: 'Zhongli Sakin',
        imageUrl: 'https://images.weserv.nl/?url=https://static.wikia.nocookie.net/gensin-impact/images/0/07/Character_Zhongli_Sticker_1.png&output=webp'
      },
      {
        code: ':chibi_xiao_grump:',
        label: 'Xiao Huysuz',
        imageUrl: 'https://images.weserv.nl/?url=https://static.wikia.nocookie.net/gensin-impact/images/c/c2/Character_Xiao_Sticker_1.png&output=webp'
      }
    ]
  },
  {
    id: 'chibi_anime_reactions',
    name: '✨ Anime Chibi Tepki & Emotion Paketi',
    category: 'emoji_pack',
    price: 15,
    description: 'Ağlayan, kızaran, heyecanlanan ve kalp fırlatan sevimli anime & manhwa chibi karakter çıkartmaları.',
    icon: '✨',
    rarity: 'Yaygın',
    emojis: [
      {
        code: ':chibi_blush_shy:',
        label: 'Utangaç Kızarma',
        imageUrl: 'https://images.weserv.nl/?url=https://static.wikia.nocookie.net/gensin-impact/images/2/29/Character_Hu_Tao_Sticker_1.png&output=webp'
      },
      {
        code: ':chibi_sparkle_eyes:',
        label: 'Işıltılı Gözler',
        imageUrl: 'https://images.weserv.nl/?url=https://static.wikia.nocookie.net/gensin-impact/images/5/52/Character_Nahida_Sticker_1.png&output=webp'
      },
      {
        code: ':chibi_shock_cry:',
        label: 'Şok & Panik',
        imageUrl: 'https://images.weserv.nl/?url=https://static.wikia.nocookie.net/gensin-impact/images/e/e0/Character_Venti_Sticker_1.png&output=webp'
      },
      {
        code: ':chibi_heart_love:',
        label: 'Kalpli Aşk',
        imageUrl: 'https://images.weserv.nl/?url=https://static.wikia.nocookie.net/gensin-impact/images/c/ce/Character_Klee_Sticker_1.png&output=webp'
      },
      {
        code: ':chibi_cool_sunglasses:',
        label: 'Havalı Karizma',
        imageUrl: 'https://images.weserv.nl/?url=https://static.wikia.nocookie.net/gensin-impact/images/0/0a/Character_Alhaitham_Sticker_1.png&output=webp'
      },
      {
        code: ':chibi_smug_laugh:',
        label: 'Sinsi Gülüş',
        imageUrl: 'https://images.weserv.nl/?url=https://static.wikia.nocookie.net/gensin-impact/images/4/4b/Character_Yae_Miko_Sticker_1.png&output=webp'
      }
    ]
  },
  {
    id: 'chibi_manhwa_bl',
    name: '🍓 Webtoon & BL Chibi Çıkartmaları',
    category: 'emoji_pack',
    price: 20,
    description: 'Manhwa okurlarının en sevdiği alfa/seme ve uke chibi karakter çizimleri.',
    icon: '🍓',
    rarity: 'Nadir',
    emojis: [
      {
        code: ':chibi_bl_pout:',
        label: 'Tatlı Somurtma',
        imageUrl: 'https://images.weserv.nl/?url=https://static.wikia.nocookie.net/gensin-impact/images/3/3a/Character_Scaramouche_Sticker_1.png&output=webp'
      },
      {
        code: ':chibi_bl_happy:',
        label: 'Gülümseyen Prens',
        imageUrl: 'https://images.weserv.nl/?url=https://static.wikia.nocookie.net/gensin-impact/images/4/49/Character_Kazuha_Sticker_1.png&output=webp'
      },
      {
        code: ':chibi_bl_protect:',
        label: 'Koruyucu Karizma',
        imageUrl: 'https://images.weserv.nl/?url=https://static.wikia.nocookie.net/gensin-impact/images/7/7b/Character_Tartaglia_Sticker_1.png&output=webp'
      },
      {
        code: ':chibi_bl_cozy:',
        label: 'Huzurlu Sarılma',
        imageUrl: 'https://images.weserv.nl/?url=https://static.wikia.nocookie.net/gensin-impact/images/9/91/Character_Ayato_Sticker_1.png&output=webp'
      }
    ]
  }
];

export const DEFAULT_CHIBI_EMOJI_PACKS = SHOP_ITEMS.filter(i => i.category === 'emoji_pack');

export const PROMO_CODES: Record<string, { points: number; description: string }> = {
  MIKROKOSMOS2026: { points: 500, description: 'Mikrokosmos Fansub 2026 Hoş Geldin Hediyesi' },
  HOSGELDIN: { points: 250, description: 'Yeni Üye Karşılama Bonusu' },
  MANHWA100: { points: 100, description: 'Seri Okuma Promosyon Bonusu' },
  PREMIUMOKUYUCU: { points: 300, description: 'Özel Mağaza Başlangıç Bonusu' },
  LIMITSIZ: { points: 1000000, description: '🚀 Sınırsız Bakiye Test Bonusu (+1.000.000 CP)' },
  SINIRSIZ: { points: 1000000, description: '🚀 Sınırsız Bakiye Test Bonusu (+1.000.000 CP)' }
};

export function registerCustomTheme(theme: ThemeStyle, price: number = 250): ShopItem {
  THEME_STYLES[theme.id] = theme;
  const newItem: ShopItem = {
    id: theme.id,
    name: theme.name,
    category: 'theme',
    price: price,
    description: 'Yönetici / Özel Tasarım Chibi Süsleme Teması!',
    icon: '🎨',
    rarity: 'Efsanevi'
  };
  const existingIdx = SHOP_ITEMS.findIndex(i => i.id === theme.id);
  if (existingIdx >= 0) {
    SHOP_ITEMS[existingIdx] = newItem;
  } else {
    SHOP_ITEMS.unshift(newItem);
  }
  return newItem;
}

export function loadCustomThemes() {}

export interface CoinPackage {
  id: string;
  name: string;
  coins: number;
  bonusCoins: number;
  priceUSD: number;
  popular?: boolean;
  bestValue?: boolean;
  lemonCheckoutUrl?: string;
  iconEmoji: string;
  badge?: string;
}

export const COIN_PACKAGES: CoinPackage[] = [
  {
    id: 'cp_starter',
    name: 'Başlangıç Paketi',
    coins: 250,
    bonusCoins: 50,
    priceUSD: 0.99,
    iconEmoji: '🥉',
    badge: 'Popüler Giriş'
  },
  {
    id: 'cp_pro',
    name: 'Bronz Okuyucu Paketi',
    coins: 1000,
    bonusCoins: 250,
    priceUSD: 2.99,
    popular: true,
    iconEmoji: '🥈',
    badge: 'En Çok Tercih Edilen'
  },
  {
    id: 'cp_giga',
    name: 'Gümüş Kozmik Paket',
    coins: 3000,
    bonusCoins: 1000,
    priceUSD: 7.99,
    iconEmoji: '🥇',
    badge: '+%33 Extra Bonus'
  },
  {
    id: 'cp_vip',
    name: 'Efsane Altın VIP Paketi',
    coins: 10000,
    bonusCoins: 4000,
    priceUSD: 19.99,
    bestValue: true,
    iconEmoji: '👑',
    badge: 'Maksimum Tasarruf'
  }
];

