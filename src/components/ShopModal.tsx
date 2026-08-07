import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  SHOP_ITEMS,
  THEME_STYLES,
  ShopCategory,
  ShopItem
} from '../data/shopData';
import { ThemeBackgroundEffects } from './ThemeBackgroundEffects';
import { ChibiThemeCreator } from './ChibiThemeCreator';
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
  Paintbrush
} from 'lucide-react';

export const ShopContent: React.FC = () => {
  const {
    user,
    buyShopItem,
    claimDailyCheckin,
    spinDailyWheel,
    redeemPromoCode,
    equipTheme,
    equipBadge,
    addUnlimitedPoints,
    shopItems: appShopItems,
    themeStyles: appThemeStyles
  } = useApp();

  const itemsList = appShopItems || SHOP_ITEMS;
  const stylesMap = appThemeStyles || THEME_STYLES;

  const [activeCategory, setActiveCategory] = useState<'all' | 'theme_photo' | 'theme_aura' | 'badge' | 'emoji_pack'>('theme_photo');
  const [promoInput, setPromoInput] = useState('');
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);

  const userCoins = user?.email?.toLowerCase() === 'aseleliyeva77@gmail.com' ? 999999999 : (user?.coins ?? 250);
  const userInventory = user?.inventory || [];
  const equippedTheme = user?.equippedTheme || null;
  const equippedBadge = user?.equippedBadge || null;

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

      {/* BALANCE & UNLIMITED COINS BANNER */}
      <div className="bg-gradient-to-r from-amber-950/90 via-purple-950/90 to-gray-950 border border-amber-500/40 p-4 rounded-2xl shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-300 flex items-center justify-center text-black font-black shadow-lg shadow-amber-500/20">
            <Coins size={22} className="stroke-[2.5]" />
          </div>
          <div>
            <span className="text-[10px] text-amber-300 font-bold block uppercase tracking-wider">
              Cosmo-Puan Bakiyeniz
            </span>
            <h3 className="text-xl font-black text-white drop-shadow flex items-center gap-2">
              {userCoins.toLocaleString('tr-TR')} <span className="text-xs font-bold text-amber-400">CP</span>
            </h3>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            addUnlimitedPoints();
            setStatusMessage({ type: 'success', text: '🚀 Bakiyenize +999.999 CP Limitsiz Bakiye Eklendi!' });
          }}
          className="w-full sm:w-auto px-4 py-2 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:to-yellow-300 text-black font-black text-xs rounded-xl shadow-lg shadow-amber-500/20 border border-amber-300 transition active:scale-95 flex items-center justify-center gap-2 animate-pulse"
        >
          <Zap size={15} className="fill-black stroke-black" />
          <span>Limitsiz Bakiye Yükle (+999.999 CP)</span>
        </button>
      </div>

      {/* QUICK EARN & PROMO BANNER */}
      <div className="bg-gray-900/90 border border-gray-800 p-3 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Daily Reward & Spin Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleClaimDaily}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold rounded-xl border border-emerald-400 shadow-md transition active:scale-95 text-xs"
          >
            <Gift size={14} />
            <span>Günlük Ödül (+100 CP)</span>
          </button>

          <button
            onClick={handleSpinWheel}
            disabled={isSpinning}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold rounded-xl border border-purple-400 shadow-md transition active:scale-95 disabled:opacity-50 text-xs"
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
            className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-black font-extrabold rounded-xl text-xs transition shrink-0"
          >
            Kullan
          </button>
        </form>
      </div>

      {/* CATEGORY TABS */}
      <div className="flex items-center gap-2 py-1 overflow-x-auto no-scrollbar">
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
          <Smile size={14} /> 😊 Chibi Emojiler ({itemsList.filter(i => i.category === 'emoji_pack').length})
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

      {/* PRODUCT GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredItems.map(item => {
          const isOwned = userInventory.includes(item.id);
          const isEquipped =
            (item.category === 'theme' && equippedTheme === item.id) ||
            (item.category === 'badge' && equippedBadge === item.badgeText);

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
                    <span className="text-2xl p-2 bg-gray-800/80 rounded-xl border border-gray-700/50 shadow-inner">
                      {item.icon}
                    </span>
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
                    <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider flex items-center justify-between">
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
                      className={`relative p-3 rounded-xl overflow-hidden ${themeStyle.cardClass}`}
                    >
                      {/* ANIMATED BACKGROUND EFFECT PREVIEW */}
                      <ThemeBackgroundEffects effectOverlay={themeStyle.effectOverlay} />

                      <div className={`relative z-10 space-y-2`}>
                        <div className={`flex items-center gap-2 w-fit ${
                          themeStyle.cardBgImageUrl ? 'bg-black/60 backdrop-blur-md px-2.5 py-1.5 rounded-lg border border-white/10' : ''
                        }`}>
                          <div className="relative flex items-center">
                            <img
                              src={user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'}
                              alt="preview"
                              className={`w-6 h-6 rounded-full object-cover ${themeStyle.avatarBorderClass}`}
                            />
                          </div>

                          <span className={`text-xs ${themeStyle.nameClass}`}>
                            {user?.name || 'Okuyucu'}
                          </span>
                          {equippedBadge && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded font-extrabold bg-amber-400 text-black">
                              {equippedBadge}
                            </span>
                          )}
                        </div>
                        <p className={`text-[11px] text-gray-200 ${
                          themeStyle.cardBgImageUrl ? 'bg-black/60 backdrop-blur-md px-2.5 py-2 rounded-lg border border-white/10' : ''
                        }`}>
                          "Bu tema yorum kartımda efsane duruyor! 🔥✨"
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Emoji Pack Preview */}
                {item.category === 'emoji_pack' && item.emojis && (
                  <div className="mt-2 p-2.5 bg-gray-950/90 border border-gray-800 rounded-xl space-y-1.5">
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">
                      Paket İçi Emojiler ({item.emojis.length} Adet):
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {item.emojis.map((em, idx) => (
                        <span
                          key={idx}
                          className="text-xs px-2 py-1 bg-gray-900 border border-purple-500/30 rounded-lg text-purple-200 font-mono flex items-center gap-1"
                          title={em.label}
                        >
                          <span>{em.symbol}</span>
                          <span className="text-[10px] text-gray-400">{em.code}</span>
                        </span>
                      ))}
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
                  ) : item.category === 'badge' ? (
                    isEquipped ? (
                      <button
                        onClick={() => equipBadge(null)}
                        className="px-4 py-1.5 bg-gray-800 hover:bg-gray-700 text-amber-300 border border-amber-400/50 rounded-xl text-xs font-extrabold transition flex items-center gap-1.5"
                      >
                        <Check size={14} className="text-amber-400" /> Unvan Aktif (Çıkar)
                      </button>
                    ) : (
                      <button
                        onClick={() => equipBadge(item.badgeText || null)}
                        className="px-4 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-extrabold shadow transition flex items-center gap-1.5"
                      >
                        <Zap size={14} /> Unvanı Tak
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
    </div>
  );
};

export const ShopModal: React.FC = () => {
  const { isShopOpen, closeShop } = useApp();

  if (!isShopOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-4xl bg-gray-950 border border-amber-500/30 rounded-3xl shadow-[0_0_50px_rgba(245,158,11,0.15)] flex flex-col max-h-[92vh] overflow-hidden">
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
                <span className="text-[10px] bg-amber-500/20 border border-amber-400/50 text-amber-300 font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Profil Sekmeniz
                </span>
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
        <div className="flex-1 overflow-y-auto p-4 sm:p-5">
          <ShopContent />
        </div>
      </div>
    </div>
  );
};

