import React
, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  SHOP_ITEMS,
  THEME_STYLES,
  COIN_PACKAGES,
  ShopCategory,
  ShopItem,
  CoinPackage
} from '../data/shopData';
import { ThemeBackgroundEffects } from './ThemeBackgroundEffects';
import { ChibiThemeCreator } from './ChibiThemeCreator';
import { DailyRewardModal } from './DailyRewardModal';
import { UserAvatar } from './UserAvatar';
import {

  X,
  Sparkles,
  ShoppingBag,
  Gift,
  Coins,
  Check,
  Zap,
  Lock,
  Crown,
  Smile,
  Palette,
  KeyRound,
  RotateCw,
  Paintbrush,
  CreditCard,
  Globe,
  HelpCircle,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Settings,
  CalendarDays,
  AlertOctagon,
  ThumbsUp,
  ThumbsDown,
  CornerDownRight
} from 'lucide-react';


const formatDim = (v?: string | number | null) => { if (!v && v !== 0) return undefined; const trim = String(v).trim(); return (trim && !isNaN(Number(trim))) ? `${trim}px` : trim; };
export const ShopContent: React.FC = () => {
  const {
    user,
    buyShopItem,
    claimDailyCheckin,
    spinDailyWheel,
    redeemPromoCode,
    equipTheme,
    equipBadge,
    equipFrame,
    earnPoints,
    openAuthModal,
    shopItems: appShopItems,
    themeStyles: appThemeStyles
  } = useApp();

  const itemsList = appShopItems || SHOP_ITEMS;
  const stylesMap = appThemeStyles || THEME_STYLES;

  const [activeCategory, setActiveCategory] = useState<'buy_coins' | 'theme_photo' | 'theme_aura' | 'frame' | 'badge' | 'emoji_pack' | 'all'>('buy_coins');
  const [promoInput, setPromoInput] = useState('');
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [showDailyCalendar, setShowDailyCalendar] = useState(false);

  // Lemon Squeezy Store link settings
  const [showLemonGuide, setShowLemonGuide] = useState(false);
  const [showLemonSettings, setShowLemonSettings] = useState(false);
  const [lemonStoreUrl, setLemonStoreUrl] = useState(() => {
    return localStorage.getItem('ls_store_checkout_url') || '';
  });
  const [inputUrl, setInputUrl] = useState(lemonStoreUrl);

  const userCoins = (user?.email?.toLowerCase() === 'aseleliyeva77@gmail.com' || user?.email?.toLowerCase() === 'mikrokosmosfansub@gmail.com') ? 999999999 : (user?.coins ?? 10);
  const userInventory = user?.inventory || [];
  const equippedTheme = user?.equippedTheme || null;
  const equippedBadges: string[] = user?.equippedBadges && user.equippedBadges.length > 0
    ? user.equippedBadges
    : (user?.equippedBadge ? [user.equippedBadge] : []);
  const equippedFrame = user?.equippedFrame || null;

  if (!user) {
    return (
      <div className="max-w-3xl mx-auto py-8 text-center space-y-6 animate-fadeIn">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-xl shadow-amber-950/60">
          <ShoppingBag size={32} />
        </div>

        <div className="space-y-2 max-w-md mx-auto">
          <h2 className="text-xl sm:text-2xl font-black text-white">Mağazaya Erişmek İçin Giriş Yapın</h2>
          <p className="text-xs sm:text-sm text-amber-200/80 leading-relaxed">
            Cosmo-Puan mağazası, günlük çark çevirme, yorum temaları, Chibi emojiler ve özel unvan rozetleri kayıtlı üyelere özeldir.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg mx-auto text-left pt-2">
          <div className="p-3.5 rounded-2xl bg-black/40 border border-amber-500/20 space-y-1">
            <div className="text-amber-300 font-extrabold text-xs flex items-center gap-1.5">
              <Gift size={15} /> Günlük Giriş & Şans Çarkı
            </div>
            <p className="text-[11px] text-gray-400">Her gün ücretsiz çark çevirin ve ekstra CP kazanın.</p>
          </div>
          <div className="p-3.5 rounded-2xl bg-black/40 border border-amber-500/20 space-y-1">
            <div className="text-purple-300 font-extrabold text-xs flex items-center gap-1.5">
              <Palette size={15} /> Özel Temalar & VIP Rozetler
            </div>
            <p className="text-[11px] text-gray-400">Profilinizi ve yorumlarınızı parlak efektlerle donatın.</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            onClick={() => openAuthModal('login')}
            className="w-full sm:w-auto px-7 py-2.5 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black font-black rounded-xl text-xs sm:text-sm shadow-xl transition active:scale-95"
          >
            Giriş Yap
          </button>
          <button
            onClick={() => openAuthModal('register')}
            className="w-full sm:w-auto px-7 py-2.5 bg-gray-900 hover:bg-gray-800 text-amber-200 hover:text-white font-bold rounded-xl text-xs sm:text-sm border border-amber-500/30 transition active:scale-95"
          >
            Ücretsiz Kayıt Ol
          </button>
        </div>
      </div>
    );
  }

  const filteredItems = itemsList.filter(item => {
    if (activeCategory === 'all') return true;
    if (activeCategory === 'theme_photo') return item.category === 'theme' && item.themeType === 'photo';
    if (activeCategory === 'theme_aura') return item.category === 'theme' && item.themeType !== 'photo';
    return item.category === activeCategory;
  });

  const handleBuy = (item: ShopItem) => {
    const res = buyShopItem(item.id);
    if (res.success) {
      setStatusMessage({ type: 'success', text: res.message });
    } else {
      setStatusMessage({ type: 'error', text: res.message });
    }
  };

  const handleBuyCoinPackage = (pkg: CoinPackage) => {
    if (!user) {
      openAuthModal('login');
      setStatusMessage({ type: 'error', text: 'Cosmo-Puan yüklemek için lütfen önce giriş yapın.' });
      return;
    }

    const totalAdded = pkg.coins + pkg.bonusCoins;

    if (lemonStoreUrl.trim()) {
      window.open(lemonStoreUrl, '_blank');
      earnPoints(totalAdded, `Lemon Squeezy (${pkg.name})`);
      setStatusMessage({
        type: 'success',
        text: `🚀 Lemon Squeezy ödeme sayfası yeni sekmede açıldı! +${totalAdded.toLocaleString('tr-TR')} Cosmo-Puan bakiyenize tanımlandı.`
      });
    } else {
      earnPoints(totalAdded, `Lemon Squeezy Ödemesi (${pkg.name})`);
      setStatusMessage({
        type: 'success',
        text: `🎉 Lemon Squeezy $${pkg.priceUSD} tutarındaki global ödemeniz onaylandı! +${totalAdded.toLocaleString('tr-TR')} Cosmo-Puan hesabınıza eklendi.`
      });
    }
  };

  const handleSaveLemonUrl = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('ls_store_checkout_url', inputUrl.trim());
    setLemonStoreUrl(inputUrl.trim());
    setStatusMessage({
      type: 'success',
      text: inputUrl.trim()
        ? '✅ Lemon Squeezy Mağaza Checkout Bağlantınız Başarıyla Kaydedildi!'
        : 'ℹ️ Lemon Squeezy Bağlantısı Temizlendi (Demo Moda Geçildi).'
    });
    setShowLemonSettings(false);
  };

  const handleClaimDaily = () => {
    const res = claimDailyCheckin();
    if (res.success) {
      setStatusMessage({ type: 'success', text: res.message });
    } else {
      setStatusMessage({ type: 'error', text: res.message });
    }
  };

  const handleSpinWheel = () => {
    if (isSpinning) return;
    setIsSpinning(true);
    setTimeout(() => {
      setIsSpinning(false);
      const res = spinDailyWheel();
      if (res.success) {
        setStatusMessage({ type: 'success', text: res.message });
      } else {
        setStatusMessage({ type: 'error', text: res.message });
      }
    }, 1200);
  };

  const handleRedeemCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoInput.trim()) return;
    const res = redeemPromoCode(promoInput);
    if (res.success) {
      setStatusMessage({ type: 'success', text: res.message });
      setPromoInput('');
    } else {
      setStatusMessage({ type: 'error', text: res.message });
    }
  };

  const getRarityBadge = (rarity: ShopItem['rarity']) => {
    switch (rarity) {
      case 'Efsanevi':
        return 'bg-gradient-to-r from-amber-500 to-yellow-600 text-black font-black border border-amber-300';
      case 'Destansı':
        return 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-extrabold border border-purple-400';
      case 'Nadir':
        return 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-bold border border-cyan-400';
      default:
        return 'bg-gray-800 text-gray-300 border border-gray-600';
    }
  };

  return (
    <div className="space-y-4">
      {/* STATUS / TOAST MESSAGE */}
      {statusMessage && (
        <div
          className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center justify-between border ${
            statusMessage.type === 'success'
              ? 'bg-emerald-950/90 border-emerald-500/40 text-emerald-200'
              : 'bg-rose-950/90 border-rose-500/40 text-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            <Sparkles size={16} className={statusMessage.type === 'success' ? 'text-emerald-400' : 'text-rose-400'} />
            <span>{statusMessage.text}</span>
          </div>
          <button
            onClick={() => setStatusMessage(null)}
            className="text-xs underline opacity-80 hover:opacity-100"
          >
            Tamam
          </button>
        </div>
      )}

      {/* QUICK EARN & PROMO BANNER */}
      <div className="bg-gray-900/90 border border-gray-800 p-3 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Daily 7-Day Reward & Spin Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setShowDailyCalendar(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-600 hover:from-emerald-500 hover:to-teal-400 text-white font-extrabold rounded-xl border border-emerald-400 shadow-md transition active:scale-95 text-xs cursor-pointer"
          >
            <CalendarDays size={14} className="stroke-[2.5]" />
            <span>📅 7 Günlük Giriş Takvimi (5-20 CP)</span>
          </button>

          <button
            type="button"
            onClick={handleSpinWheel}
            disabled={isSpinning}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold rounded-xl border border-purple-400 shadow-md transition active:scale-95 disabled:opacity-50 text-xs cursor-pointer"
          >
            <RotateCw size={14} className={isSpinning ? 'animate-spin' : ''} />
            <span>{isSpinning ? 'Çark Dönüyor...' : 'Şans Çarkı'}</span>
          </button>
        </div>

        {/* Promo Code Form */}
        <form onSubmit={handleRedeemCode} className="flex items-center gap-1.5 flex-1 sm:flex-initial">
          <div className="relative flex-1 sm:flex-initial">
            <KeyRound size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-amber-400" />
            <input
              type="text"
              placeholder="Kod (ör: MIKROKOSMOS2026)"
              value={promoInput}
              onChange={e => setPromoInput(e.target.value)}
              className="w-full sm:w-48 pl-8 pr-2 py-1 bg-gray-950 border border-amber-500/40 rounded-xl text-white text-xs placeholder:text-gray-500 focus:outline-none focus:border-amber-400 uppercase font-mono"
            />
          </div>
          <button
            type="submit"
            className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-black font-extrabold rounded-xl text-xs transition shrink-0 cursor-pointer"
          >
            Kullan
          </button>
        </form>
      </div>

      {/* 7-DAY REWARD CALENDAR MODAL */}
      <DailyRewardModal
        isOpen={showDailyCalendar}
        onClose={() => setShowDailyCalendar(false)}
      />

      {/* CATEGORY TABS */}
      <div className="flex items-center gap-2 py-1 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveCategory('buy_coins')}
          className={`px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 whitespace-nowrap transition ${
            activeCategory === 'buy_coins'
              ? 'bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 text-black shadow-lg shadow-amber-500/30 ring-2 ring-amber-300 animate-pulse'
              : 'bg-amber-950/80 text-amber-300 border border-amber-500/40 hover:bg-amber-900/90'
          }`}
        >
          <CreditCard size={15} /> 💳 Cosmo-Puan Yükle (Lemon Squeezy)
        </button>

        <button
          onClick={() => setActiveCategory('theme_photo')}
          className={`px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 whitespace-nowrap transition ${
            activeCategory === 'theme_photo'
              ? 'bg-gradient-to-r from-rose-500 via-amber-400 to-rose-500 text-black shadow-md shadow-rose-500/30 ring-1 ring-amber-300'
              : 'bg-gray-900 text-rose-300 hover:text-white hover:bg-gray-800'
          }`}
        >
          🖼️ Görsel Fonlu Temalar ({itemsList.filter(i => i.category === 'theme' && i.themeType === 'photo').length})
        </button>

        <button
          onClick={() => setActiveCategory('theme_aura')}
          className={`px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 whitespace-nowrap transition ${
            activeCategory === 'theme_aura'
              ? 'bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-black shadow-md shadow-amber-500/20 ring-1 ring-amber-300'
              : 'bg-gray-900 text-amber-300 hover:text-white hover:bg-gray-800'
          }`}
        >
          <Palette size={14} /> ✨ Aura Temaları ({itemsList.filter(i => i.category === 'theme' && i.themeType !== 'photo').length})
        </button>

        <button
          onClick={() => setActiveCategory('frame')}
          className={`px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 whitespace-nowrap transition ${
            activeCategory === 'frame'
              ? 'bg-gradient-to-r from-cyan-500 via-blue-400 to-indigo-500 text-black shadow-md shadow-cyan-500/20 ring-1 ring-cyan-300'
              : 'bg-gray-900 text-cyan-300 hover:text-white hover:bg-gray-800'
          }`}
        >
          <Sparkles size={14} /> 🖼️ Profil Çerçeveleri ({itemsList.filter(i => i.category === 'frame').length})
        </button>

        <button
          onClick={() => setActiveCategory('badge')}
          className={`px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 whitespace-nowrap transition ${
            activeCategory === 'badge'
              ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20'
              : 'bg-gray-900 text-gray-400 hover:text-white hover:bg-gray-800'
          }`}
        >
          <Crown size={14} /> ⭐ VIP Unvanlar ({itemsList.filter(i => i.category === 'badge').length})
        </button>

        <button
          onClick={() => setActiveCategory('emoji_pack')}
          className={`px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 whitespace-nowrap transition ${
            activeCategory === 'emoji_pack'
              ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20'
              : 'bg-gray-900 text-gray-400 hover:text-white hover:bg-gray-800'
          }`}
        >
          <Smile size={14} /> 🎨 Chibi Çıkartmaları ({itemsList.filter(i => i.category === 'emoji_pack').length})
        </button>

        <button
          onClick={() => setActiveCategory('all')}
          className={`px-3 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 whitespace-nowrap transition ${
            activeCategory === 'all'
              ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20'
              : 'bg-gray-900 text-gray-400 hover:text-white hover:bg-gray-800'
          }`}
        >
          <ShoppingBag size={14} /> Tüm Ürünler ({itemsList.length})
        </button>
      </div>

      {/* PRODUCT / COIN PACKAGES VIEW */}
      {activeCategory === 'buy_coins' ? (
        <div className="space-y-4">
          {/* Lemon Squeezy Hero Header Banner */}
          <div className="bg-gradient-to-r from-yellow-950/90 via-amber-950/80 to-purple-950/90 border border-amber-500/50 p-4 rounded-2xl shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xl">🍋</span>
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  Lemon Squeezy Global Bakiye Yükleme Altyapısı
                </h3>
                <span className="bg-emerald-950 border border-emerald-500/50 text-emerald-300 font-black text-[10px] px-2 py-0.5 rounded-full uppercase">
                  Global Aktif
                </span>
              </div>
              <p className="text-xs text-amber-200/90 leading-relaxed max-w-xl">
                Dünyanın her yerinden (Azerbaycan dahil) <strong className="text-white">Visa, MasterCard, Apple Pay, Google Pay</strong> ile anında ve güvenle Cosmo-Puan satın alabilirsiniz.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0 flex-wrap">
              <button
                type="button"
                onClick={() => setShowLemonGuide(!showLemonGuide)}
                className="px-3 py-1.5 bg-amber-900/60 hover:bg-amber-800/80 border border-amber-500/50 text-amber-200 text-xs font-bold rounded-xl flex items-center gap-1.5 transition"
              >
                <HelpCircle size={14} className="text-amber-400" />
                <span>Lemon Squeezy Nedir & Kurulum Rehberi</span>
                {showLemonGuide ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>

              <button
                type="button"
                onClick={() => setShowLemonSettings(!showLemonSettings)}
                className="p-2 bg-gray-900 hover:bg-gray-800 border border-gray-700 text-gray-300 hover:text-white rounded-xl transition"
                title="Lemon Squeezy Mağaza Linkini Ayarla"
              >
                <Settings size={15} />
              </button>
            </div>
          </div>

          {/* Lemon Squeezy Settings Panel */}
          {showLemonSettings && (
            <form onSubmit={handleSaveLemonUrl} className="bg-gray-900/90 border border-amber-500/40 p-4 rounded-2xl space-y-2 animate-fadeIn">
              <h4 className="text-xs font-black text-amber-300 flex items-center gap-2">
                <Settings size={14} /> Lemon Squeezy Mağaza Checkout Bağlantınız (Yönetici)
              </h4>
              <p className="text-[11px] text-gray-400">
                Lemon Squeezy paneli üzerinden aldığınız Checkout veya Mağaza URL bağlantınızı yapıştırın. Boş bırakırsanız demo simülasyon çalışır.
              </p>
              <div className="flex items-center gap-2">
                <input
                  type="url"
                  placeholder="https://mikrokosmos.lemonsqueezy.com/buy/..."
                  value={inputUrl}
                  onChange={e => setInputUrl(e.target.value)}
                  className="flex-1 px-3 py-1.5 bg-gray-950 border border-gray-700 rounded-xl text-white text-xs placeholder:text-gray-600 focus:outline-none focus:border-amber-400"
                />
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs rounded-xl transition"
                >
                  Kaydet
                </button>
              </div>
            </form>
          )}

          {/* Lemon Squeezy Guide Accordion */}
          {showLemonGuide && (
            <div className="bg-gray-950/95 border border-purple-500/40 p-4 sm:p-5 rounded-2xl space-y-3 text-xs leading-relaxed animate-fadeIn">
              <div className="flex items-center justify-between border-b border-gray-800 pb-2">
                <h4 className="text-sm font-black text-white flex items-center gap-2">
                  <Globe size={16} className="text-amber-400" /> Azerbaycanlı Yayıncılar İçin Lemon Squeezy Rehberi
                </h4>
                <button onClick={() => setShowLemonGuide(false)} className="text-gray-400 hover:text-white text-xs font-bold">Kapat ✕</button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                <div className="bg-gray-900/80 p-3 rounded-xl border border-gray-800 space-y-1">
                  <h5 className="font-extrabold text-amber-300 flex items-center gap-1.5">
                    <ShieldCheck size={14} className="text-emerald-400" /> 1. Merchant of Record (MoR) Nedir?
                  </h5>
                  <p className="text-gray-300 text-[11px]">
                    Lemon Squeezy, müşterilerinizden ödemeyi kendisi tahsil eder. Dünyadaki tüm vergi (KDV/VAT), fatura ve yasal süreçleri üstlenir. Bu sayede şirket açmadan doğrudan global ödeme alabilirsiniz.
                  </p>
                </div>

                <div className="bg-gray-900/80 p-3 rounded-xl border border-gray-800 space-y-1">
                  <h5 className="font-extrabold text-amber-300 flex items-center gap-1.5">
                    <CreditCard size={14} className="text-cyan-400" /> 2. Hangi Ödeme Yöntemleri Desteklenir?
                  </h5>
                  <p className="text-gray-300 text-[11px]">
                    Visa, MasterCard, American Express, Apple Pay, Google Pay ve PayPal. Türkiye, Avrupa, Amerika ve Azerbaycan dahil tüm dünyadan ödeme kabul edilir.
                  </p>
                </div>

                <div className="bg-gray-900/80 p-3 rounded-xl border border-gray-800 space-y-1">
                  <h5 className="font-extrabold text-amber-300 flex items-center gap-1.5">
                    <CheckCircle2 size={14} className="text-purple-400" /> 3. Paranızı Azerbaycan'a Nasıl Çekersiniz?
                  </h5>
                  <p className="text-gray-300 text-[11px]">
                    Lemon Squeezy panelinde "Payouts" bölümüne Azerbaycan Banka hesabınızı (IBAN / SWIFT) veya Wise USD banka bilgilerinizi ekleyebilirsiniz. Ödemeler haftalık/aylık hesabınıza aktarılır.
                  </p>
                </div>

                <div className="bg-gray-900/80 p-3 rounded-xl border border-gray-800 space-y-1">
                  <h5 className="font-extrabold text-amber-300 flex items-center gap-1.5">
                    <ArrowRight size={14} className="text-amber-400" /> 4. Nasıl Kayıt Olunur?
                  </h5>
                  <p className="text-gray-300 text-[11px]">
                    <a href="https://www.lemonsqueezy.com" target="_blank" rel="noopener noreferrer" className="text-amber-400 font-bold underline">lemonsqueezy.com</a> adresine gidip ücretsiz mağaza açın. "Products" kısmına Cosmo-Puan paketlerinizi ekleyip bağlantıyı sitemize yapıştırın.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* COIN PACKAGES GRID */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {COIN_PACKAGES.map(pkg => (
              <div
                key={pkg.id}
                className={`relative bg-gray-900/90 border rounded-2xl p-4 flex flex-col justify-between gap-3 transition-all hover:scale-[1.02] shadow-lg ${
                  pkg.popular
                    ? 'border-amber-400 shadow-amber-500/20 ring-1 ring-amber-400/50 bg-gradient-to-b from-amber-950/40 via-gray-900 to-gray-950'
                    : pkg.bestValue
                    ? 'border-purple-400 shadow-purple-500/20 ring-1 ring-purple-400/50 bg-gradient-to-b from-purple-950/40 via-gray-900 to-gray-950'
                    : 'border-gray-800 hover:border-gray-700'
                }`}
              >
                {/* Badge Label */}
                {pkg.badge && (
                  <span className={`absolute -top-2.5 left-1/2 -translate-x-1/2 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-md ${
                    pkg.popular
                      ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-black border border-amber-300'
                      : pkg.bestValue
                      ? 'bg-gradient-to-r from-purple-600 to-indigo-500 text-white border border-purple-300'
                      : 'bg-gray-800 text-amber-300 border border-gray-700'
                  }`}>
                    {pkg.badge}
                  </span>
                )}

                <div className="text-center pt-2 space-y-1.5">
                  <span className="text-4xl block my-1">{pkg.iconEmoji}</span>
                  <h4 className="text-sm font-extrabold text-white">{pkg.name}</h4>
                  <div className="flex items-center justify-center gap-1.5 text-amber-400 font-black text-xl">
                    <Coins size={20} />
                    <span>{(pkg.coins + pkg.bonusCoins).toLocaleString('tr-TR')} CP</span>
                  </div>

                  <p className="text-[11px] text-gray-400">
                    {pkg.coins.toLocaleString('tr-TR')} Temel + <strong className="text-emerald-400">+{pkg.bonusCoins.toLocaleString('tr-TR')} Bonus CP</strong>
                  </p>
                </div>

                <div className="pt-2 border-t border-gray-800/80 space-y-2">
                  <div className="text-center font-black text-white text-base">
                    ${pkg.priceUSD.toFixed(2)} USD
                  </div>

                  <button
                    onClick={() => handleBuyCoinPackage(pkg)}
                    className={`w-full py-2 px-3 rounded-xl font-black text-xs transition-all shadow-md flex items-center justify-center gap-2 active:scale-95 ${
                      pkg.popular || pkg.bestValue
                        ? 'bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:to-yellow-300 text-black border border-amber-300'
                        : 'bg-purple-950/80 hover:bg-purple-900 border border-purple-500/40 text-purple-200'
                    }`}
                  >
                    <span>🍋</span>
                    <span>Yükle (${pkg.priceUSD.toFixed(2)})</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* PRODUCT GRID */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredItems.map(item => {
          const isOwned = userInventory.includes(item.id);
          const badgeText = item.badgeText || item.name;
          const isEquipped =
            (item.category === 'theme' && equippedTheme === item.id) ||
            (item.category === 'badge' && equippedBadges.includes(badgeText)) ||
            (item.category === 'frame' && equippedFrame === item.id);

          const themeStyle = item.category === 'theme' ? stylesMap[item.id] : null;

          return (
            <div
              key={item.id}
              className={`relative p-4 rounded-2xl border transition-all flex flex-col justify-between gap-3 ${
                isEquipped
                  ? 'bg-gradient-to-br from-amber-950/60 via-purple-950/40 to-gray-900 border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                  : isOwned
                  ? 'bg-gray-900/90 border-emerald-500/40'
                  : 'bg-gray-900/60 border-purple-500/20 hover:border-purple-500/40 hover:bg-gray-900/90'
              }`}
            >
              {/* Top Bar: Icon, Title & Rarity Badge */}
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2.5">
                    {item.icon?.startsWith('http') || item.icon?.startsWith('/') ? (
                      <div className="p-1.5 bg-gray-800/80 rounded-xl border border-gray-700/50 shadow-inner">
                        <img src={item.icon} alt={item.name} className="w-8 h-8 object-cover rounded-md" />
                      </div>
                    ) : (
                      <span className="text-2xl p-2 bg-gray-800/80 rounded-xl border border-gray-700/50 shadow-inner">
                        {item.icon}
                      </span>
                    )}
                    <div>
                      <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                        {item.name}
                        {isOwned && (
                          <span className="text-[10px] bg-emerald-950 border border-emerald-500/50 text-emerald-400 font-bold px-1.5 py-0.2 rounded">
                            Satın Alındı
                          </span>
                        )}
                      </h3>
                      <span className={`text-[10px] px-2 py-0.5 rounded-md ${getRarityBadge(item.rarity)}`}>
                        {item.rarity}
                      </span>
                    </div>
                  </div>

                  {/* Price Badge */}
                  {!isOwned && (
                    <div className="flex items-center gap-1 bg-amber-950/80 border border-amber-500/50 px-2.5 py-1 rounded-xl text-xs font-black text-amber-300">
                      <Coins size={14} className="text-amber-400" />
                      <span>{item.price} CP</span>
                    </div>
                  )}
                </div>

                <p className="text-xs text-gray-300 leading-relaxed mb-3">
                  {item.description}
                </p>

                {/* LIVE PREVIEW SECTION */}
                {/* Theme Preview */}
                {item.category === 'theme' && themeStyle && (
                  <div className="mt-2 p-3 rounded-xl border border-gray-800 bg-gray-950/90 space-y-1.5 relative overflow-hidden">
                    <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider flex items-center justify-between mb-2">
                      <span>Canlı Yorum Kartı Önizlemesi</span>
                      <span className="text-amber-400 font-extrabold">Görünüm Örneği</span>
                    </div>

                    <div
                      style={
                        themeStyle.cardBgImageUrl
                          ? {
                              backgroundImage: `url(${themeStyle.cardBgImageUrl})`,
                              backgroundSize: 'cover',
                              backgroundPosition: 'center'
                            }
                          : undefined
                      }
                      className={`relative p-4 sm:p-5 flex flex-col gap-3 transition-colors rounded-2xl ${
                        themeStyle.cardBgImageUrl
                          ? 'bg-transparent overflow-hidden'
                          : 'bg-gray-900/90 border border-purple-500/20'
                      } ${themeStyle.cardClass || ''}`}
                    >
                      {/* ANIMATED BACKGROUND EFFECT PREVIEW */}
                      <ThemeBackgroundEffects effectOverlay={themeStyle.effectOverlay} />

                      {/* Theme Decorations (Chibis/PNGs) */}
                      {themeStyle?.decorations?.map((dec, idx) => (
                        <img
                          key={dec.id || idx}
                          src={dec.imageUrl}
                          className="absolute pointer-events-none drop-shadow-lg"
                          style={{
                            top: formatDim(dec.top),
                            bottom: formatDim(dec.bottom),
                            left: formatDim(dec.left),
                            right: formatDim(dec.right),
                            width: formatDim(dec.width),
                            transform: dec.rotation ? `rotate(${dec.rotation})` : undefined,
                            zIndex: dec.zIndex !== undefined ? dec.zIndex : 20
                          }}
                          alt=""
                        />
                      ))}

                      {/* Symmetrical User Info Header */}
                      <div className="relative z-10 flex items-center justify-between gap-2.5">
                        <div className="flex items-center min-w-0 gap-2 sm:gap-3">
                          {/* Avatar Container in foreground */}
                          <div className="relative z-20 shrink-0">
                            <UserAvatar
                              avatar={user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'}
                              name={user?.name || 'Okuyucu'}
                              frameId={equippedFrame}
                              themeBorderClass={themeStyle?.avatarBorderClass}
                              size="md"
                            />
                          </div>

                          {/* Name and Date Container */}
                          <div
                            className={`min-w-0 ${
                              themeStyle?.cardBgImageUrl
                                ? 'bg-black/75 px-3 py-1 rounded-xl border border-white/10 shadow-sm z-10 inline-flex items-center'
                                : 'pl-1'
                            }`}
                          >
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`font-bold text-xs sm:text-sm tracking-wide truncate ${
                                themeStyle ? themeStyle.nameClass : 'text-gray-100'
                              }`}>
                                {user?.name || 'Okuyucu'}
                              </span>
                              <span className="text-[10px] text-gray-400 shrink-0">Az önce</span>
                            </div>
                          </div>
                        </div>

                        {/* Right Action buttons (Report / Delete) */}
                        <div className={`flex items-center gap-1 shrink-0 ${
                          themeStyle?.cardBgImageUrl
                            ? 'bg-black/70 p-1 rounded-xl border border-white/10 shadow-sm'
                            : ''
                        }`}>
                          <button type="button" className="text-gray-400 hover:text-amber-400 p-1.5 rounded-lg hover:bg-white/10 transition">
                            <AlertOctagon size={15} />
                          </button>
                        </div>
                      </div>

                      {/* VIP Titles / Badges */}
                      {equippedBadges.length > 0 && (
                        <div className="relative z-10 flex items-center gap-1.5 flex-wrap pt-0.5">
                          {equippedBadges.map((badgeText, idx) => {
                            const badgeItem = itemsList.find(
                              i => i.category === 'badge' && (i.badgeText === badgeText || i.name === badgeText)
                            );
                            const badgeClass = badgeItem?.badgeStyle || (themeStyle ? themeStyle.badgeBgClass : 'bg-gradient-to-r from-amber-400 to-yellow-500 text-black');
                            return (
                              <span
                                key={idx}
                                className={`text-[9px] sm:text-[10px] px-2 py-0.5 rounded-md font-bold tracking-tight shadow-sm border border-white/10 flex items-center gap-1 whitespace-nowrap leading-tight transition-transform hover:scale-105 ${badgeClass}`}
                              >
                                <span>{badgeText}</span>
                              </span>
                            );
                          })}
                        </div>
                      )}

                      {/* Comment Text */}
                      <div className={`relative z-10 ${
                        themeStyle?.cardBgImageUrl
                          ? 'bg-black/75 p-3 rounded-xl border border-white/10 shadow-md'
                          : ''
                      }`}>
                        <div className="text-xs sm:text-sm text-gray-200 leading-relaxed whitespace-pre-wrap break-words break-all [overflow-wrap:anywhere]">
                          bu seriyi okudum çok güzeldi
                        </div>
                      </div>

                      {/* Action Bar (Likes / Dislikes / Reply) - Clean Symmetrical Footer */}
                      <div className={`relative z-10 flex items-center justify-between ${
                        themeStyle?.cardBgImageUrl
                          ? 'pt-1'
                          : 'border-t border-white/10 pt-2.5'
                      } text-xs`}>
                        <div className={`flex items-center gap-3.5 ${
                          themeStyle?.cardBgImageUrl
                            ? 'bg-black/70 px-3 py-1.5 rounded-xl border border-white/10 shadow-sm'
                            : ''
                        }`}>
                          <button type="button" className="flex items-center gap-1.5 font-semibold px-2 py-1 rounded-lg text-gray-400 hover:text-purple-300 transition">
                            <ThumbsUp size={14} />
                            <span>0</span>
                          </button>
                          <button type="button" className="flex items-center gap-1.5 font-semibold px-2 py-1 rounded-lg text-gray-400 hover:text-red-300 transition">
                            <ThumbsDown size={14} />
                            <span>0</span>
                          </button>
                          <button type="button" className="flex items-center gap-1.5 text-gray-400 hover:text-purple-300 font-semibold px-2 py-1 rounded-lg hover:bg-white/5 transition">
                            <CornerDownRight size={14} />
                            <span>Yanıtla</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Chibi Anime Stickers Pack Preview */}
                {item.category === 'emoji_pack' && item.emojis && (
                  <div className="mt-2 p-3 bg-gray-950/90 border border-purple-500/20 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-amber-300 font-black uppercase tracking-wider flex items-center gap-1.5">
                        <Sparkles size={12} className="text-amber-400" />
                        Paket İçeriği ({item.emojis.length} Şeffaf Anime Çıkartması):
                      </span>
                      <span className="text-[9px] text-purple-300 font-mono bg-purple-950/60 px-2 py-0.5 rounded border border-purple-500/30">
                        {item.rarity || 'Yaygın'}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-48 overflow-y-auto pr-1">
                      {item.emojis.map((em, idx) => (
                        <div
                          key={idx}
                          className="p-2 bg-gray-900/90 border border-purple-500/20 hover:border-purple-500/50 rounded-xl flex flex-col items-center justify-center text-center gap-1 shadow-sm group"
                          title={`${em.label} (${em.code})`}
                        >
                          <div className="w-12 h-12 rounded-lg bg-[radial-gradient(#374151_1px,transparent_1px)] [background-size:6px_6px] bg-gray-950 flex items-center justify-center p-0.5 border border-gray-800/80">
                            {em.imageUrl ? (
                              <img
                                src={em.imageUrl}
                                alt={em.label}
                                className="max-w-full max-h-full object-contain drop-shadow group-hover:scale-110 transition-transform"
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              <span className="text-sm font-bold text-amber-300">{em.symbol}</span>
                            )}
                          </div>
                          <span className="text-[10px] font-bold text-gray-200 truncate w-full">{em.label}</span>
                          <span className="text-[9px] text-purple-300 font-mono truncate w-full opacity-80">{em.code}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Profile Frame Preview */}
                {item.category === 'frame' && (
                  <div className="mt-2 p-3 rounded-xl border border-gray-800 bg-gray-950/90 space-y-2 relative overflow-hidden">
                    <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider flex items-center justify-between">
                      <span>Canlı Avatar Çerçevesi Önizlemesi</span>
                      <span className="text-cyan-400 font-extrabold">Profil & Yorum Uyumu</span>
                    </div>

                    <div className="flex items-center gap-3 p-3 bg-slate-900/80 rounded-xl border border-cyan-500/20">
                      <UserAvatar
                        avatar={user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'}
                        name={user?.name || 'Okuyucu'}
                        frameId={item.id}
                        customFrameStyle={item.frameStyle}
                        customFrameImageUrl={item.frameImageUrl}
                        customFrameScale={item.frameScale}
                        customFrameOffsetY={item.frameOffsetY}
                        customFrameHideBorder={item.frameHideBorder}
                        size="lg"
                      />
                      <div className="space-y-0.5 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-black text-white">{user?.name || 'Okuyucu'}</span>
                          <span className="text-[9px] bg-cyan-950 border border-cyan-500/40 text-cyan-300 font-bold px-1.5 py-0.2 rounded">
                            Çerçeve Takılı
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-400">
                          {item.frameImageUrl ? 'Transparan Görsel Katmanlı Çerçeve' : 'Özel Işıltılı CSS Efekti'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* VIP Title / Badge Preview */}
                {item.category === 'badge' && item.badgeText && (
                  <div className="mt-2 p-3 bg-gray-950/90 border border-gray-800 rounded-xl space-y-1.5">
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">
                      Yorumlarda Görünecek Etiketiniz:
                    </span>
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-black shadow-sm ${item.badgeStyle}`}>
                        {item.badgeText}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* BOTTOM ACTION BUTTONS */}
              <div className="pt-2 border-t border-gray-800/80 flex items-center justify-end gap-2">
                {isOwned ? (
                  item.category === 'theme' ? (
                    isEquipped ? (
                      <button
                        onClick={() => equipTheme(null)}
                        className="px-4 py-1.5 bg-gray-800 hover:bg-gray-700 text-amber-300 border border-amber-400/50 rounded-xl text-xs font-extrabold transition flex items-center gap-1.5"
                      >
                        <Check size={14} className="text-amber-400" /> Kuşanıldı (Çıkar)
                      </button>
                    ) : (
                      <button
                        onClick={() => equipTheme(item.id)}
                        className="px-4 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-extrabold shadow transition flex items-center gap-1.5"
                      >
                        <Zap size={14} /> Temayı Kuşan
                      </button>
                    )
                  ) : item.category === 'frame' ? (
                    isEquipped ? (
                      <button
                        onClick={() => equipFrame(null)}
                        className="px-4 py-1.5 bg-gray-800 hover:bg-gray-700 text-cyan-300 border border-cyan-400/50 rounded-xl text-xs font-extrabold transition flex items-center gap-1.5"
                      >
                        <Check size={14} className="text-cyan-400" /> Çerçeve Kuşanıldı (Çıkar)
                      </button>
                    ) : (
                      <button
                        onClick={() => equipFrame(item.id)}
                        className="px-4 py-1.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl text-xs font-extrabold shadow transition flex items-center gap-1.5"
                      >
                        <Zap size={14} /> Çerçeveyi Kuşan
                      </button>
                    )
                  ) : item.category === 'badge' ? (
                    isEquipped ? (
                      <button
                        onClick={() => equipBadge(badgeText)}
                        className="px-4 py-1.5 bg-gray-800 hover:bg-gray-700 text-amber-300 border border-amber-400/50 rounded-xl text-xs font-extrabold transition flex items-center gap-1.5 cursor-pointer"
                      >
                        <Check size={14} className="text-amber-400" /> Takılı (Çıkar)
                      </button>
                    ) : (
                      <button
                        onClick={() => equipBadge(badgeText)}
                        className="px-4 py-1.5 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black rounded-xl text-xs font-extrabold shadow transition flex items-center gap-1.5 cursor-pointer"
                      >
                        <Zap size={14} /> Unvanı Tak ({equippedBadges.length}/5)
                      </button>
                    )
                  ) : (
                    <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                      <Check size={14} /> Kullanıma Hazır
                    </span>
                  )
                ) : (
                  <button
                    onClick={() => handleBuy(item)}
                    disabled={userCoins < item.price}
                    className={`px-4 py-1.5 rounded-xl text-xs font-black shadow-lg transition flex items-center gap-1.5 ${
                      userCoins >= item.price
                        ? 'bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:to-yellow-300 text-black border border-amber-300 active:scale-95'
                        : 'bg-gray-800 text-gray-500 border border-gray-700 cursor-not-allowed'
                    }`}
                  >
                    {userCoins >= item.price ? (
                      <>
                        <Coins size={14} /> Satın Al ({item.price} CP)
                      </>
                    ) : (
                      <>
                        <Lock size={14} /> Yetersiz Bakiye ({item.price} CP)
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
      )}
    </div>
  );
};

export const ShopModal: React.FC = () => {
  const { isShopOpen, closeShop } = useApp();

  if (!isShopOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-4xl bg-gray-950 border border-amber-500/40 rounded-3xl shadow-[0_0_60px_rgba(245,158,11,0.2)] flex flex-col max-h-[92vh] overflow-hidden">
        {/* MODAL HEADER */}
        <div className="relative px-5 py-4 bg-gradient-to-r from-amber-950/80 via-purple-950/80 to-gray-950 border-b border-amber-500/30 flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-300 flex items-center justify-center text-black font-black shadow-lg shadow-amber-500/20">
              <ShoppingBag size={20} className="stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black text-white tracking-wide">
                  Mikrokosmos Mağazası
                </h2>
              </div>
              <p className="text-xs text-amber-200/80">
                Yorumlarınızı özelleştirin, Chibi emojileri açın ve VIP unvanlar kazanın!
              </p>
            </div>
          </div>

          <button
            onClick={closeShop}
            className="p-2 text-gray-400 hover:text-white bg-gray-900/80 hover:bg-gray-800 rounded-full border border-gray-700 transition"
            title="Kapat"
          >
            <X size={18} />
          </button>
        </div>

        {/* MAIN BODY */}
        <div className="flex-1 overflow-y-auto p-2 sm:p-4">
          <ShopContent />
        </div>
      </div>
    </div>
  );
};

export const ShopView: React.FC = () => {
  const { user } = useApp();
  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6 animate-fadeIn">
      {/* HEADER BANNER */}
      <div className="bg-gradient-to-r from-amber-950/80 via-purple-950/80 to-gray-950 border border-amber-500/30 rounded-3xl p-5 sm:p-6 shadow-xl flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-300 flex items-center justify-center text-black font-black shadow-lg shadow-amber-500/20 shrink-0">
            <ShoppingBag size={24} className="stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-wide">
                Mikrokosmos Mağazası
              </h1>
              <span className="text-[10px] bg-amber-500/20 border border-amber-400/50 text-amber-300 font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                Mağaza & Temalar
              </span>
            </div>
            <p className="text-xs sm:text-sm text-amber-200/80 mt-0.5">
              Yorumlarınızı özelleştirin, Chibi emojileri açın, özel görsel temalar ve VIP unvanlar kazanın!
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-gray-950/80 border border-amber-500/40 px-4 py-2 rounded-2xl">
          <Coins className="text-amber-400" size={18} />
          <div className="text-right">
            <span className="text-[10px] text-amber-300/80 uppercase font-bold block leading-none">Bakiyeniz</span>
            <span className="text-sm font-black text-amber-300 font-mono">
              {(user?.email?.toLowerCase() === 'aseleliyeva77@gmail.com' || user?.email?.toLowerCase() === 'mikrokosmosfansub@gmail.com') ? 'Sınırsız CP' : `${(user?.coins ?? 10).toLocaleString('tr-TR')} CP`}
            </span>
          </div>
        </div>
      </div>

      {/* SHOP CONTENT */}
      <div className="mt-2">
        <ShopContent />
      </div>
    </div>
  );
};

