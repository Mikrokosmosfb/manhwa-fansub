import React
, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { registerCustomTheme, ThemeStyle } from '../data/shopData';
import { Upload, Sparkles, Check, Image as ImageIcon, CornerUpRight, User as UserIcon, Palette, Zap } from 'lucide-react';

const formatDim = (v?: string | number | null) => { if (!v && v !== 0) return undefined; const trim = String(v).trim(); return (trim && !isNaN(Number(trim))) ? `${trim}px` : trim; };


// Sample pre-hosted transparent chibi avatars for quick testing
const QUICK_CHIBI_PRESETS = [
  {
    name: 'Sevimli Ejderha',
    url: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=200&auto=format&fit=crop&q=80'
  },
  {
    name: 'Gölge Avcısı',
    url: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=200&auto=format&fit=crop&q=80'
  },
  {
    name: 'Kraliyet Kedisi',
    url: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=200&auto=format&fit=crop&q=80'
  }
];

export const ChibiThemeCreator: React.FC<{ onThemeCreated?: () => void }> = ({ onThemeCreated }) => {
  const { user, equipTheme, openAuthModal, addShopItemAndStyle } = useApp();

  const [themeName, setThemeName] = useState('');
  const [mascotType, setMascotType] = useState<'corner' | 'avatar'>('corner');
  const [imageUrl, setImageUrl] = useState('');
  const [cornerPos, setCornerPos] = useState<'top-right' | 'bottom-right' | 'top-left' | 'bottom-left'>('top-right');
  const [colorStyle, setColorStyle] = useState<'gold' | 'cyber' | 'sakura' | 'void' | 'inferno' | 'mana'>('cyber');
  const [price, setPrice] = useState(250);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // File Upload handler (converts file to Data URL)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Preset styles config
  const COLOR_PRESETS: Record<string, Omit<ThemeStyle, 'id' | 'name'>> = {
    gold: {
      cardClass: 'bg-gradient-to-r from-amber-950/90 via-yellow-950/80 to-gray-900 border-2 border-amber-400/80 shadow-[0_0_25px_rgba(251,191,36,0.3)]',
      avatarBorderClass: 'ring-2 ring-amber-400 ring-offset-2 ring-offset-black',
      nameClass: 'text-amber-300 font-black drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]',
      badgeBgClass: 'bg-gradient-to-r from-amber-500 to-yellow-600 text-black font-extrabold',
      glowColor: '#f59e0b',
      accentText: 'text-amber-400'
    },
    cyber: {
      cardClass: 'bg-gradient-to-r from-slate-950 via-purple-950/80 to-slate-950 border-2 border-cyan-400/80 shadow-[0_0_25px_rgba(34,211,238,0.35)]',
      avatarBorderClass: 'ring-2 ring-cyan-400 ring-offset-2 ring-offset-black animate-pulse',
      nameClass: 'text-cyan-300 font-black tracking-wider drop-shadow-[0_0_10px_rgba(34,211,238,0.8)]',
      badgeBgClass: 'bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 text-black font-black uppercase',
      glowColor: '#06b6d4',
      accentText: 'text-cyan-400'
    },
    sakura: {
      cardClass: 'bg-gradient-to-r from-pink-950/90 via-rose-950/80 to-purple-950/90 border-2 border-pink-400/80 shadow-[0_0_22px_rgba(244,114,182,0.3)]',
      avatarBorderClass: 'ring-2 ring-pink-400 ring-offset-2 ring-offset-black',
      nameClass: 'text-pink-300 font-extrabold drop-shadow-[0_0_8px_rgba(244,114,182,0.6)]',
      badgeBgClass: 'bg-gradient-to-r from-pink-500 to-rose-500 text-white font-black',
      glowColor: '#ec4899',
      accentText: 'text-pink-400'
    },
    void: {
      cardClass: 'bg-gradient-to-r from-purple-950/90 via-indigo-950/80 to-slate-950 border-2 border-purple-500/80 shadow-[0_0_25px_rgba(168,85,247,0.35)]',
      avatarBorderClass: 'ring-2 ring-purple-500 ring-offset-2 ring-offset-black',
      nameClass: 'text-purple-300 font-black drop-shadow-[0_0_10px_rgba(168,85,247,0.7)]',
      badgeBgClass: 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-black',
      glowColor: '#a855f7',
      accentText: 'text-purple-400'
    },
    inferno: {
      cardClass: 'bg-gradient-to-r from-red-950/90 via-orange-950/80 to-gray-900 border-2 border-red-500/80 shadow-[0_0_25px_rgba(239,68,68,0.35)]',
      avatarBorderClass: 'ring-2 ring-red-500 ring-offset-2 ring-offset-black',
      nameClass: 'text-red-400 font-black drop-shadow-[0_0_10px_rgba(239,68,68,0.7)]',
      badgeBgClass: 'bg-gradient-to-r from-red-600 to-orange-600 text-white font-extrabold',
      glowColor: '#ef4444',
      accentText: 'text-red-400'
    },
    mana: {
      cardClass: 'bg-gradient-to-r from-blue-950/90 via-sky-950/80 to-slate-900 border-2 border-sky-400/80 shadow-[0_0_22px_rgba(56,189,248,0.3)]',
      avatarBorderClass: 'ring-2 ring-sky-400 ring-offset-2 ring-offset-black',
      nameClass: 'text-sky-300 font-extrabold drop-shadow-[0_0_8px_rgba(56,189,248,0.6)]',
      badgeBgClass: 'bg-gradient-to-r from-sky-500 to-blue-600 text-black font-extrabold',
      glowColor: '#38bdf8',
      accentText: 'text-sky-400'
    }
  };

  const handleSaveTheme = () => {
    if (!user) {
      openAuthModal('login');
      return;
    }

    if (!themeName.trim()) {
      alert('Lütfen temanıza bir isim verin.');
      return;
    }

    if (!imageUrl) {
      alert('Lütfen bir Chibi resim dosyası yükleyin veya URL yapıştırın.');
      return;
    }

    const newId = `custom_theme_${Date.now()}`;
    const selectedPreset = COLOR_PRESETS[colorStyle];

    const newTheme: ThemeStyle = {
      id: newId,
      name: themeName.trim(),
      ...selectedPreset,
      ...(mascotType === 'corner'
        ? { cornerMascotUrl: imageUrl, cornerMascotPosition: cornerPos }
        : { avatarCompanionUrl: imageUrl })
    };

    // Register theme to shop & local storage
    registerCustomTheme(newTheme, price);
    if (addShopItemAndStyle) {
      addShopItemAndStyle(
        {
          id: newId,
          name: themeName.trim(),
          category: 'theme',
          themeType: 'photo',
          price: price,
          description: 'Özel Tasarım Chibi Süsleme Teması!',
          icon: '🎨',
          rarity: 'Efsanevi'
        },
        newTheme
      );
    }

    // Equip it for the user
    equipTheme(newId);

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);

    if (onThemeCreated) {
      onThemeCreated();
    }
  };

  const activePreset = COLOR_PRESETS[colorStyle];

  return (
    <div className="space-y-6 text-gray-200">
      {/* HEADER BANNER */}
      <div className="bg-gradient-to-r from-amber-950/70 via-purple-950/70 to-slate-900 border border-amber-500/40 rounded-2xl p-4 sm:p-5 flex items-center justify-between gap-4 shadow-lg">
        <div>
          <h3 className="text-base sm:text-lg font-black text-amber-300 flex items-center gap-2">
            <Sparkles size={20} className="text-amber-400" />
            Kendi Özel Chibi & Tema Tasarım Stüdyon
          </h3>
          <p className="text-xs text-amber-100/80 mt-1">
            Çizdiğin veya sevdiğin manhwa Chibi karakter resimlerini yükle! Satın alınca veya aktif edince yorum kutularında ve profilinde görünsün.
          </p>
        </div>
        <div className="hidden sm:block text-3xl">🎨</div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LEFT COLUMN: DESIGN FORM */}
        <div className="bg-gray-900/90 border border-purple-500/30 rounded-2xl p-4 sm:p-5 space-y-4 shadow-xl">
          <h4 className="text-sm font-extrabold text-purple-300 uppercase tracking-wider flex items-center gap-2">
            <Palette size={16} />
            1. Tema & Karakter Detayları
          </h4>

          {/* Theme Name */}
          <div>
            <label className="block text-xs font-bold text-gray-300 mb-1">
              Tema / Süsleme İsmi *
            </label>
            <input
              type="text"
              value={themeName}
              onChange={e => setThemeName(e.target.value)}
              placeholder="Örn: Solo Leveling Chibi Jinwoo"
              className="w-full bg-black/60 border border-gray-700 focus:border-amber-400 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none transition"
            />
          </div>

          {/* Mascot Type Selection */}
          <div>
            <label className="block text-xs font-bold text-gray-300 mb-1.5">
              Süsleme Türü (Yerleşim) *
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setMascotType('corner')}
                className={`p-2.5 rounded-xl border text-left transition flex flex-col gap-1 ${
                  mascotType === 'corner'
                    ? 'bg-amber-950/80 border-amber-400 text-amber-300 font-bold shadow-md'
                    : 'bg-black/40 border-gray-800 text-gray-400 hover:border-gray-700'
                }`}
              >
                <span className="text-xs font-black flex items-center gap-1.5">
                  <CornerUpRight size={14} />
                  Köşe Dikizleyen Chibi
                </span>
                <span className="text-[10px] opacity-80">
                  Yorum kartının köşesinden kafasını uzatır
                </span>
              </button>

              <button
                type="button"
                onClick={() => setMascotType('avatar')}
                className={`p-2.5 rounded-xl border text-left transition flex flex-col gap-1 ${
                  mascotType === 'avatar'
                    ? 'bg-amber-950/80 border-amber-400 text-amber-300 font-bold shadow-md'
                    : 'bg-black/40 border-gray-800 text-gray-400 hover:border-gray-700'
                }`}
              >
                <span className="text-xs font-black flex items-center gap-1.5">
                  <UserIcon size={14} />
                  Profil Yanı Yoldaşı
                </span>
                <span className="text-[10px] opacity-80">
                  Profil avatarının hemen yanında yaslanır
                </span>
              </button>
            </div>
          </div>

          {/* Image Upload Input */}
          <div>
            <label className="block text-xs font-bold text-gray-300 mb-1.5">
              Chibi Resim Tasarımın (PNG / SVG / Görsel) *
            </label>
            
            <div className="space-y-2">
              <label className="flex items-center justify-center gap-2 p-3 bg-purple-950/50 hover:bg-purple-900/60 border border-dashed border-purple-400/50 rounded-xl cursor-pointer transition text-xs text-purple-200 font-bold">
                <Upload size={16} className="text-amber-400" />
                <span>Cihazından PNG / Görsel Seç Yükle</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={imageUrl}
                  onChange={e => setImageUrl(e.target.value)}
                  placeholder="veya Görsel URL'si yapıştır (https://...)"
                  className="w-full bg-black/60 border border-gray-700 focus:border-amber-400 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none"
                />
              </div>

              {/* Presets */}
              <div className="flex items-center gap-1.5 flex-wrap pt-1">
                <span className="text-[10px] text-gray-400">Örnek Şeffaf Chibiler:</span>
                {QUICK_CHIBI_PRESETS.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setImageUrl(p.url)}
                    className="text-[10px] bg-gray-800 hover:bg-gray-700 border border-gray-600 px-2 py-0.5 rounded-lg text-amber-300"
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Corner Position Selector */}
          {mascotType === 'corner' && (
            <div>
              <label className="block text-xs font-bold text-gray-300 mb-1">
                Köşe Konumu
              </label>
              <select
                value={cornerPos}
                onChange={e => setCornerPos(e.target.value as any)}
                className="w-full bg-black/60 border border-gray-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
              >
                <option value="top-right">Sağ Üst Köşe (Önerilen)</option>
                <option value="bottom-right">Sağ Alt Köşe</option>
                <option value="top-left">Sol Üst Köşe</option>
                <option value="bottom-left">Sol Alt Köşe</option>
              </select>
            </div>
          )}

          {/* Color Aura Selection */}
          <div>
            <label className="block text-xs font-bold text-gray-300 mb-1.5">
              Aura & Renk Teması
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'cyber', name: 'Siber Siyan', color: 'bg-cyan-500' },
                { id: 'gold', name: 'Altın Işıltı', color: 'bg-amber-500' },
                { id: 'sakura', name: 'Sakura Pembe', color: 'bg-pink-500' },
                { id: 'void', name: 'Karanlık Mor', color: 'bg-purple-500' },
                { id: 'inferno', name: 'Alev Kırmızı', color: 'bg-red-500' },
                { id: 'mana', name: 'Mana Mavi', color: 'bg-sky-500' }
              ].map(c => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setColorStyle(c.id as any)}
                  className={`p-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition ${
                    colorStyle === c.id
                      ? 'bg-gray-800 border-amber-400 text-white shadow'
                      : 'bg-black/40 border-gray-800 text-gray-400 hover:border-gray-700'
                  }`}
                >
                  <span className={`w-3 h-3 rounded-full ${c.color}`} />
                  <span className="truncate">{c.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Price setting */}
          <div>
            <label className="block text-xs font-bold text-gray-300 mb-1">
              Mağaza Satış Fiyatı (Cosmo-Puan)
            </label>
            <input
              type="number"
              value={price}
              onChange={e => setPrice(Number(e.target.value))}
              className="w-full bg-black/60 border border-gray-700 rounded-xl px-3 py-1.5 text-xs text-amber-300 font-bold focus:outline-none"
            />
          </div>

          {/* Submit Action */}
          <button
            type="button"
            onClick={handleSaveTheme}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 hover:from-amber-400 hover:to-yellow-400 text-black font-black text-sm shadow-xl shadow-amber-500/20 transition active:scale-98 flex items-center justify-center gap-2 mt-2"
          >
            <Zap size={18} className="fill-black" />
            <span>Tasarımı Kaydet, Mağazaya Ekle & Kuşan</span>
          </button>

          {savedSuccess && (
            <div className="p-2.5 rounded-xl bg-emerald-950/80 border border-emerald-500/60 text-emerald-300 text-xs font-bold flex items-center gap-2 animate-fadeIn">
              <Check size={16} />
              Tasarımın başarıyla kaydedildi ve profilinde aktif edildi!
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: LIVE INTERACTIVE PREVIEW CARD */}
        <div className="space-y-4">
          <div className="bg-gray-900/90 border border-amber-500/30 rounded-2xl p-4 sm:p-5 shadow-xl space-y-3">
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <h4 className="text-xs font-extrabold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                <ImageIcon size={16} />
                2. Canlı Yorum Kartı Önizlemesi
              </h4>
              <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded font-mono font-bold">
                CANLI PREVIEW
              </span>
            </div>

            <p className="text-xs text-gray-400">
              Chibi tasarımının bir okuyucu yorumunda nasıl görüneceğini anlık olarak incele:
            </p>

            {/* MOCK COMMENT CARD WITH LIVE MASCOT */}
            <div
              className={`relative rounded-2xl p-4 space-y-3 transition-all duration-300 shadow-xl mt-4 ${activePreset.cardClass}`}
            >
              {/* CORNER MASCOT PREVIEW */}
              {mascotType === 'corner' && imageUrl && (
                <div
                  className={`absolute pointer-events-none z-20 transition-transform duration-300 ${
                    cornerPos === 'bottom-right'
                      ? '-bottom-4 -right-2'
                      : cornerPos === 'bottom-left'
                      ? '-bottom-4 -left-2'
                      : cornerPos === 'top-left'
                      ? '-top-4 -left-2'
                      : '-top-5 -right-3'
                  }`}
                >
                  <img
                    src={imageUrl}
                    alt="Corner Chibi Preview"
                    referrerPolicy="no-referrer"
                    className="w-16 h-16 sm:w-20 sm:h-20 object-contain drop-shadow-[0_6px_15px_rgba(0,0,0,0.95)] animate-bounce-slow"
                    onError={e => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                </div>
              )}

              {/* USER HEADER */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="relative flex items-center">
                    <img
                      src={user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'}
                      alt="User Avatar"
                      className={`w-9 h-9 rounded-full object-cover bg-purple-950 ${activePreset.avatarBorderClass}`}
                    />

                    {/* AVATAR COMPANION PREVIEW */}
                    {mascotType === 'avatar' && imageUrl && (
                      <img
                        src={imageUrl}
                        alt="Avatar Companion Chibi"
                        referrerPolicy="no-referrer"
                        className="w-10 h-10 object-contain absolute -top-3 -left-3 drop-shadow-[0_4px_10px_rgba(0,0,0,0.9)] pointer-events-none transform -rotate-12 transition duration-300 z-20"
                        onError={e => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`font-bold text-xs sm:text-sm ${activePreset.nameClass}`}>
                        {themeName || user?.displayName || 'Sung Jinwoo'}
                      </span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded font-black shadow-sm ${activePreset.badgeBgClass}`}
                      >
                        ⭐ S-Rank Avcı
                      </span>
                    </div>
                    <span className="text-[10px] text-gray-400">Şimdi paylaşıldı</span>
                  </div>
                </div>
              </div>

              {/* COMMENT TEXT */}
              <p className="text-xs sm:text-sm text-gray-200 leading-relaxed font-medium pt-1">
                "Kendi tasarladığım Chibi süslemesi tam buradaki yorum kutumun köşesinden bakıyor! Harika görünüyor 🔥✨"
              </p>
            </div>

            {/* ARTWORK GUIDELINES TIPS */}
            <div className="p-3 rounded-xl bg-purple-950/30 border border-purple-500/20 text-xs text-purple-200/90 space-y-1">
              <span className="font-extrabold text-amber-300 block">💡 İpucu:</span>
              <p>
                - Tasarladığın çizimlerin **şeffaf arka planlı (PNG)** olmasına özen gösterirsen yorum kutularına muhteşem bir şekilde bütünleşir.
              </p>
              <p>
                - Tasarımların anında hesabında ve mağazada listelenir, diğer okuyucular da bunu görebilir!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
