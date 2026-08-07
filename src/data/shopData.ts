export type ShopCategory = 'theme' | 'emoji_pack' | 'badge';
export type ItemRarity = 'Yaygın' | 'Nadir' | 'Destansı' | 'Efsanevi';

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
  emojis?: { code: string; label: string; symbol: string }[];
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
    | 'crimson_moon_romance';
}

export const BASE_THEME_STYLES: Record<string, ThemeStyle> = {
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
  }
};

export const THEME_STYLES: Record<string, ThemeStyle> = { ...BASE_THEME_STYLES };

export const SHOP_ITEMS: ShopItem[] = [
  // --- 20 RESMİ AURA & RENK TEMASI (OFFICIAL ADMIN SHOP ITEMS) ---
  {
    id: 'theme_saturn',
    name: 'Satürn Halkaları & Kozmik Aura',
    category: 'theme',
    price: 450,
    description: 'Dönen Satürn gezegeni, altın gezegen halkaları ve derin kozmik uzay aurası!',
    icon: '🪐',
    rarity: 'Efsanevi'
  },
  {
    id: 'theme_divine',
    name: 'İlahi Yükseliş & Kutsal Altın Aura',
    category: 'theme',
    price: 500,
    description: 'Yorum kartınızı kaplayan kutsal melek ışıltısı ve altın ışık krallık aurası.',
    icon: '👼',
    rarity: 'Efsanevi'
  },
  {
    id: 'theme_supernova',
    name: 'Süpernova Patlaması & Güneş Fırtınası Aura',
    category: 'theme',
    price: 480,
    description: 'Aşırı sıcak güneş patlamaları ve alevli plazma koruyla parlayan extreme tema.',
    icon: '☀️',
    rarity: 'Efsanevi'
  },
  {
    id: 'theme_shooting_star',
    name: 'Kayan Yıldızlar & Meteor Yağmuru Aura',
    category: 'theme',
    price: 420,
    description: 'Yorum kartınızda süzülen meteorlar, kayan yıldız kuyrukları ve mavi stardust ışıltısı.',
    icon: '☄️',
    rarity: 'Efsanevi'
  },
  {
    id: 'theme_nebula',
    name: 'Nebula Galaksi & Yıldız Kümesi Aura',
    category: 'theme',
    price: 400,
    description: 'Mor ve fuşya renkli galaksi nebulası, parıldayan uzak yıldızlar ve kozmik enerji.',
    icon: '🌌',
    rarity: 'Efsanevi'
  },
  {
    id: 'theme_void',
    name: 'Karanlık Boyut & Karadelik Portalı',
    category: 'theme',
    price: 350,
    description: 'Galaksi ve mor uzay boşluğu karadelik portalı. Yorumlarınız gizemli boyutsal enerji saçsın.',
    icon: '🌀',
    rarity: 'Destansı'
  },
  {
    id: 'theme_plasma',
    name: 'Plazma Şimşek & Fırtına Aura',
    category: 'theme',
    price: 340,
    description: 'Yüksek voltajlı mor ve siyan elektrik arkları, fırtına şimşekleri ve dinamik aura.',
    icon: '⚡',
    rarity: 'Destansı'
  },
  {
    id: 'theme_stardust',
    name: 'Peri Işıltısı & Yıldız Tozu Aura',
    category: 'theme',
    price: 320,
    description: 'Büyülü mor ve pembe stardust kıvılcımları, perilerin ışıltılı tozu ve rüya aurası.',
    icon: '✨',
    rarity: 'Destansı'
  },
  {
    id: 'theme_midnight_moon',
    name: 'Gece Yarısı Hilal Ay & Yıldızlar Aura',
    category: 'theme',
    price: 310,
    description: 'Gece yarısı lacivert gökyüzü, parıldayan hilal ay ve takımyıldız ışıltısı.',
    icon: '🌙',
    rarity: 'Destansı'
  },
  {
    id: 'theme_dragon',
    name: 'Alevli Ejder Kor Aurası',
    category: 'theme',
    price: 300,
    description: 'Alev ve kırmızı kor parçacıkları saçan ejderha temalı aydınlatmalı yorum kartı.',
    icon: '🐉',
    rarity: 'Destansı'
  },
  {
    id: 'theme_cybercat',
    name: 'Siber Neon & Mor Elektrik Aura',
    category: 'theme',
    price: 250,
    description: 'Mor ve siyan neon elektrik ışımaları içeren yüksek teknolojili yorum kartı.',
    icon: '🐱',
    rarity: 'Nadir'
  },
  {
    id: 'theme_inferno',
    name: 'Cehennem Alevi & Ejder Ateşi',
    category: 'theme',
    price: 250,
    description: 'Ateş ve kıvılcım saçan kırmızı alevli ejderha yorum kartı.',
    icon: '🔥',
    rarity: 'Nadir'
  },
  {
    id: 'theme_emerald',
    name: 'Zümrüt Yeşili & Ejder Zehri Aura',
    category: 'theme',
    price: 240,
    description: 'Büyüleyici zümrüt yeşili zehir ateşi ve antik orman ejderhası aurası.',
    icon: '🐍',
    rarity: 'Nadir'
  },
  {
    id: 'theme_cyberpunk',
    name: 'Siber Punk Neon & Siyan Elektrik',
    category: 'theme',
    price: 220,
    description: 'Geleceğin neon siyan ve mor elektrik aura çerçevesi.',
    icon: '⚡',
    rarity: 'Nadir'
  },
  {
    id: 'theme_mana',
    name: 'Mana Akışı & Rünik Büyü Aura',
    category: 'theme',
    price: 180,
    description: 'Büyücülerin ve avcıların rünik gök mavisi mana parıltılı yorum çerçevesi.',
    icon: '🔮',
    rarity: 'Yaygın'
  },
  {
    id: 'theme_sakura',
    name: 'Sakura Bahçesi & Pembe Esinti Aura',
    category: 'theme',
    price: 160,
    description: 'Romantik ve tatlı sakura pembe yaprak parıltısı. Yorum kartınıza pembe esinti katar.',
    icon: '🌸',
    rarity: 'Yaygın'
  },
  {
    id: 'theme_crimson_moon_romance',
    name: 'Kızıl Dolunay & Geyik Boynuzlu Aşk Fonu',
    category: 'theme',
    themeType: 'photo',
    price: 450,
    description: 'Büyüleyici kızıl dolunay, dökülen kırmızı akçaağaç yaprakları, geyik boynuzlu ve siyah kanatlı fantastik aşıkların görsel arka plan fonu.',
    icon: '🍁',
    rarity: 'Efsanevi'
  },
  {
    id: 'theme_night_lotus',
    name: 'Kutsal Gece Nilüferi & Ethereal Mavi Fon',
    category: 'theme',
    themeType: 'photo',
    price: 420,
    description: 'Derin gece göğünde yüzen parıldayan mavi nilüfer çiçekleri, mistik su ışığı ve efsanevi mavi görsel fon.',
    icon: '🪷',
    rarity: 'Efsanevi'
  },
  {
    id: 'theme_moon_furin',
    name: 'Dolunay & Sakura Cam Rüzgar Çanı Fonu',
    category: 'theme',
    themeType: 'photo',
    price: 380,
    description: 'Gümüşi dolunay altında sallanan sakura nakışlı cam rüzgar çanı ve gece esintili görsel arka plan.',
    icon: '🎐',
    rarity: 'Efsanevi'
  },
  {
    id: 'theme_purple_moon_butterfly',
    name: 'Eflatun Dolunay & Mistik Kelebek Fonu',
    category: 'theme',
    themeType: 'photo',
    price: 400,
    description: 'Eflatun dolunayın büyüleyici ışığında süzülen parlak kelebekler ve mor çiçekli gece görsel arka planı.',
    icon: '🦋',
    rarity: 'Efsanevi'
  },
  {
    id: 'theme_night_lanterns',
    name: 'Gece Bahçesi & Saray Feneri Fonu',
    category: 'theme',
    themeType: 'photo',
    price: 390,
    description: 'Siyah gecede parıldayan el yapımı işlemeli saray fenerleri, pembe çiçekler ve sıcak fener görsel fonu.',
    icon: '🏮',
    rarity: 'Efsanevi'
  },
  {
    id: 'theme_sakura_cascade',
    name: 'Gece Yarısı Pembe Sakura Yağmuru Fonu',
    category: 'theme',
    themeType: 'photo',
    price: 370,
    description: 'Karanlık lacivert gece göğünden süzülen yoğun pembe sakura çiçeği yağmuru ve ışıltılı tozlu görsel arka plan.',
    icon: '🌸',
    rarity: 'Efsanevi'
  }
];

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
