import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  SHOP_ITEMS,
  THEME_STYLES,
  COIN_PACKAGES,
  ShopCategory,
  ShopItem,
  CoinPackage
} from '../data/shopData';
import { isAuthorizedAdmin } from '../types';
import { ThemeBackgroundEffects } from './ThemeBackgroundEffects';
import { ChibiThemeCreator } from './ChibiThemeCreator';
import { DailyRewardModal } from './DailyRewardModal';
import { UserAvatar } from './UserAvatar';
import { normalizeShopInventory, formatRemainingDuration } from '../utils/shopExpiration';
import { openLemonSqueezyCheckout, loadLemonSqueezyScript, onLemonPaymentSuccess, triggerPurchaseConfetti } from '../utils/lemonSqueezy';
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
  ChevronLeft,
  ChevronRight,
  Settings,
  CalendarDays,
  AlertOctagon,
  ThumbsUp,
  ThumbsDown,
  CornerDownRight,
  Copy,
  Coffee,
  Heart,
  Send
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

  const categoryScrollRef = React.useRef<HTMLDivElement>(null);

  const handleCategoryScroll = (direction: 'left' | 'right') => {
    if (categoryScrollRef.current) {
      const amount = direction === 'left' ? -260 : 260;
      categoryScrollRef.current.scrollBy({ left: amount, behavior: 'smooth' });
    }
  };

  const handleCategoryWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (categoryScrollRef.current && e.deltaY !== 0) {
      categoryScrollRef.current.scrollLeft += e.deltaY;
    }
  };

  // DonationAlerts & Payment Store link settings & Order Verification
  const [showLemonGuide, setShowLemonGuide] = useState(false);
  const [showLemonSettings, setShowLemonSettings] = useState(false);
  const [verifyTab, setVerifyTab] = useState<'notification' | 'promo'>('notification');
  const [selectedNotifyPkgId, setSelectedNotifyPkgId] = useState<string>('cp_starter');
  const [donorReferenceInput, setDonorReferenceInput] = useState('');
  const [promoCodeInput, setPromoCodeInput] = useState('');
  const [isSubmittingNotification, setIsSubmittingNotification] = useState(false);
  const [isRedeemingPromo, setIsRedeemingPromo] = useState(false);
  const [isCheckingAutoDonation, setIsCheckingAutoDonation] = useState(false);
  const [modalDonorName, setModalDonorName] = useState('');
  const [selectedGuidePkg, setSelectedGuidePkg] = useState<CoinPackage | null>(null);
  const [copiedUname, setCopiedUname] = useState(false);
  const [celebrationPurchase, setCelebrationPurchase] = useState<{
    pkgName: string;
    coinsEarned: number;
    priceUSD: number;
    orderId?: string | number;
  } | null>(null);

  // Helper to get fallback default DonationAlerts URLs for all packages
  const getDefaultPackageUrls = (): Record<string, string> => {
    const defaults: Record<string, string> = {
      cp_starter: 'https://www.donationalerts.com/r/rafiga',
      cp_pro: 'https://www.donationalerts.com/r/rafiga',
      cp_giga: 'https://www.donationalerts.com/r/rafiga',
      cp_vip: 'https://www.donationalerts.com/r/rafiga'
    };
    COIN_PACKAGES.forEach(pkg => {
      if (pkg.lemonCheckoutUrl) {
        defaults[pkg.id] = pkg.lemonCheckoutUrl;
      }
    });
    return defaults;
  };

  // Per-package URLs (hydrated from defaults, localStorage & server API)
  const [packageUrls, setPackageUrls] = useState<Record<string, string>>(() => {
    const defaultUrls = getDefaultPackageUrls();
    try {
      const saved = localStorage.getItem('ls_package_urls');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
          // If stored URLs are old lemonsqueezy placeholders, override with new DonationAlerts defaults
          const sanitized: Record<string, string> = { ...defaultUrls };
          for (const key of Object.keys(parsed)) {
            if (parsed[key] && !parsed[key].includes('lemonsqueezy.com')) {
              sanitized[key] = parsed[key];
            } else {
              sanitized[key] = defaultUrls[key] || 'https://www.donationalerts.com/r/rafiga';
            }
          }
          return sanitized;
        }
      }
    } catch (e) {}
    return defaultUrls;
  });
  const [inputPackageUrls, setInputPackageUrls] = useState<Record<string, string>>(packageUrls || {});
  const lastAwardedTimestampRef = React.useRef<number>(0);
  const awardedOrderIdsRef = React.useRef<Set<string>>(new Set());

  // Global synchronization: Fetch globally configured coin package URLs from server & sync admin local storage to server
  useEffect(() => {
    fetch('/api/coin-packages')
      .then(res => res.json())
      .then(data => {
        if (data?.success && data?.packageUrls && Object.keys(data.packageUrls).length > 0) {
          setPackageUrls(prev => {
            const cleanServerUrls: Record<string, string> = {};
            for (const k of Object.keys(data.packageUrls || {})) {
              if (data.packageUrls[k] && !data.packageUrls[k].includes('lemonsqueezy.com')) {
                cleanServerUrls[k] = data.packageUrls[k];
              }
            }
            const merged = { ...getDefaultPackageUrls(), ...prev, ...cleanServerUrls };
            try {
              localStorage.setItem('ls_package_urls', JSON.stringify(merged));
            } catch (e) {}
            return merged;
          });
          setInputPackageUrls(prev => ({ ...prev, ...data.packageUrls }));
        } else {
          // If server doesn't have custom links yet, and current user is authorized admin with saved links, sync them to server
          const localSaved = localStorage.getItem('ls_package_urls');
          if (localSaved && isAuthorizedAdmin(user?.email)) {
            try {
              const parsed = JSON.parse(localSaved);
              if (parsed && Object.keys(parsed).length > 0) {
                fetch('/api/admin/coin-packages', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(parsed)
                }).catch(() => {});
              }
            } catch (e) {}
          }
        }
      })
      .catch(() => {});
  }, [user?.email]);

  // Auto load Lemon Squeezy overlay & subscribe to real-time success event (with strict single-credit protection)
  useEffect(() => {
    loadLemonSqueezyScript();
    const unsubscribe = onLemonPaymentSuccess((eventData) => {
      console.log('🍋 Lemon Squeezy Payment Confirmed in Shop:', eventData);

      const rawOrderId = eventData?.data?.id ||
        eventData?.order?.id ||
        eventData?.order_id ||
        eventData?.data?.attributes?.order_number ||
        eventData?.attributes?.order_number;
      const orderId = rawOrderId ? String(rawOrderId).trim() : '';

      const now = Date.now();
      // Block duplicate order ID
      if (orderId && awardedOrderIdsRef.current.has(orderId)) {
        console.log('🍋 Order already credited, skipping duplicate:', orderId);
        return;
      }

      // Block rapid duplicate calls within 5 seconds
      if (now - lastAwardedTimestampRef.current < 5000) {
        console.log('🍋 Skipping duplicate payment event within 5s window');
        return;
      }

      lastAwardedTimestampRef.current = now;
      if (orderId) {
        awardedOrderIdsRef.current.add(orderId);
      }

      let targetPkgId = eventData?.custom?.package_id || eventData?.custom_data?.package_id;
      if (!targetPkgId) {
        try {
          const saved = sessionStorage.getItem('mk_lemon_pending_package');
          if (saved) {
            const parsed = JSON.parse(saved);
            targetPkgId = parsed?.packageId;
            sessionStorage.removeItem('mk_lemon_pending_package');
          }
        } catch (e) {}
      }

      // Match the exact package
      const pkg = COIN_PACKAGES.find(p => p.id === targetPkgId) || COIN_PACKAGES.find(p => p.id === 'cp_pro') || COIN_PACKAGES[1];
      const added = pkg.coins + pkg.bonusCoins;

      // Award coins exactly ONCE to balance
      earnPoints(added, `Lemon Squeezy Ödemesi (${pkg.name})`);

      // Trigger Celebration Modal
      setCelebrationPurchase({
        pkgName: pkg.name,
        coinsEarned: added,
        priceUSD: pkg.priceUSD,
        orderId: orderId || ('LS-' + Date.now().toString().slice(-6))
      });

      setStatusMessage({
        type: 'success',
        text: `🎉 TEBRİKLER! Lemon Squeezy ödemeniz onaylandı. +${added.toLocaleString('tr-TR')} Cosmo-Puan hesabınıza başarıyla tanımlandı!`
      });
    });
    return () => unsubscribe();
  }, [earnPoints]);


  const userCoins = (user?.email?.toLowerCase() === 'mikrokosmosfansub@gmail.com') ? 999999999 : (user?.coins ?? 10);
  const normalizedInventory = normalizeShopInventory(
    [user?.inventory, user?.unlockedEmojiPacks],
    user?.inventoryExpiresAt
  );
  const userInventory = normalizedInventory.activeInventory;
  const expiresAtMap = normalizedInventory.expiresAtMap;
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
  const ownedFilteredItems = filteredItems.filter(item => userInventory.includes(item.id));
  const unownedFilteredItems = filteredItems.filter(item => !userInventory.includes(item.id));

  const handleBuy = (item: ShopItem) => {
    const res = buyShopItem(item.id);
    if (res.success) {
      setStatusMessage({ type: 'success', text: res.message });
    } else {
      setStatusMessage({ type: 'error', text: res.message });
    }
  };

    // Kullanıcı butona bastığında doğrudan ödeme yerine önce açıklama & yönerge modalını açar
  const handleBuyCoinPackage = (pkg: CoinPackage) => {
    if (!user) {
      openAuthModal('login');
      setStatusMessage({ type: 'error', text: 'Cosmo-Puan yüklemek için lütfen önce giriş yapın.' });
      return;
    }
    setSelectedGuidePkg(pkg);
    setModalDonorName(user.name || (user as any).displayName || user.email?.split('@')[0] || '');
  };

  // Açıklama modalının altındaki butona basıldığında DonationAlerts sayfasına yönlendirir
  const handleProceedToDonationAlerts = (pkg: CoinPackage) => {
    let rawUrl = (packageUrls || {})[pkg.id]?.trim() || pkg.lemonCheckoutUrl?.trim() || getDefaultPackageUrls()[pkg.id]?.trim() || "https://www.donationalerts.com/r/rafiga";
    if (rawUrl.includes("lemonsqueezy.com")) {
      rawUrl = "https://www.donationalerts.com/r/rafiga";
    }
    const targetCheckoutUrl = rawUrl;
    window.open(targetCheckoutUrl, '_blank');
    setSelectedGuidePkg(null);
    setStatusMessage({
      type: 'info',
      text: `💳 "${pkg.name}" ($${pkg.priceUSD}) için DonationAlerts ödeme sayfası açıldı. Ödemenizi tamamladıktan sonra dekont/işlem numaranızı aşağıdaki alana girerek puanlarınızı aktarabilirsiniz.`
    });
  };

    // 1. DonationAlerts Ödeme Bildirimi Gönderme (Yönetici Kontrolüne Gider)
  const handleSubmitPaymentNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      openAuthModal('login');
      setStatusMessage({ type: 'error', text: 'Ödeme bildirimi gönderebilmek için lütfen önce giriş yapın.' });
      return;
    }
    if (!donorReferenceInput.trim()) {
      setStatusMessage({ type: 'error', text: 'Lütfen DonationAlerts üzerinde yazdığınız İsim veya Dekont No bilgisini girin.' });
      return;
    }

    const targetPkg = COIN_PACKAGES.find(p => p.id === selectedNotifyPkgId) || COIN_PACKAGES[0];
    const totalCp = targetPkg.coins + targetPkg.bonusCoins;

    setIsSubmittingNotification(true);
    try {
      const res = await fetch('/api/payment-notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_email: user.email,
          user_name: user.name || (user as any).displayName || '',
          package_id: targetPkg.id,
          package_name: targetPkg.name,
          amount_cp: totalCp,
          price_text: `$${targetPkg.priceUSD} USD / ${targetPkg.priceTRY} ₺ / ${targetPkg.priceAZN} ₼`,
          reference_code: donorReferenceInput.trim()
        })
      });
      const data = await res.json().catch(() => ({}));
      setIsSubmittingNotification(false);

      if (data && data.success) {
        setStatusMessage({
          type: 'success',
          text: `✅ Ödeme bildiriminiz başarıyla iletildi! Yöneticimiz DonationAlerts üzerinden teyit ettikten sonra "${targetPkg.name}" karşılığı olan +${totalCp.toLocaleString('tr-TR')} CP hesabınıza eklenecektir.`
        });
        setDonorReferenceInput('');
      } else {
        setStatusMessage({
          type: 'error',
          text: data.error || 'Bildirim gönderilirken bir hata oluştu. Lütfen tekrar deneyin.'
        });
      }
    } catch (err) {
      setIsSubmittingNotification(false);
      setStatusMessage({
        type: 'error',
        text: 'Bağlantı hatası oluştu. Lütfen internetinizi kontrol edin.'
      });
    }
  };

  // ⚡ DonationAlerts API Üzerinden Ödemeyi Otomatik Kontrol Et & Anında Yükle
  const handleAutoCheckDonation = async (targetPkg?: CoinPackage | null) => {
    if (!user) {
      openAuthModal('login');
      setStatusMessage({ type: 'error', text: 'Ödemeyi kontrol edebilmek için lütfen önce giriş yapın.' });
      return;
    }

    setIsCheckingAutoDonation(true);
    try {
      const res = await fetch('/api/donationalerts/claim-points', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_email: user.email,
          user_name: user.name || (user as any).displayName || '',
          donor_name: modalDonorName.trim() || user.name || (user as any).displayName || ''
        })
      });
      const data = await res.json().catch(() => ({}));
      setIsCheckingAutoDonation(false);

      if (data && data.success && data.claimed) {
        // EXACT POINTS AWARDED ACCORDING TO REAL MONEY PAID!
        earnPoints(data.cpGranted, `DonationAlerts Otomatik: ${data.packageName} (#${data.donationId})`);
        triggerPurchaseConfetti();
        setSelectedGuidePkg(null);
        setCelebrationPurchase({
          pkgName: data.packageName,
          coinsEarned: data.cpGranted,
          priceUSD: Number(data.paidAmount) || targetPkg?.priceUSD || 0,
          orderId: data.donationId
        });
        setStatusMessage({
          type: 'success',
          text: `🎉 TEBRİKLER! DonationAlerts üzerinden ${data.paidAmount} ${data.paidCurrency} tutarındaki ödemeniz onaylandı ve hesabınıza +${data.cpGranted.toLocaleString('tr-TR')} CP tanımlandı!`
        });
      } else {
        setStatusMessage({
          type: 'info',
          text: data.message || 'DonationAlerts üzerinde henüz yeni bir ödeme bulunamadı. Lütfen ödemenizi tamamladıktan sonra 1-2 dakika içinde tekrar butona basınız.'
        });
      }
    } catch (e: any) {
      setIsCheckingAutoDonation(false);
      setStatusMessage({
        type: 'error',
        text: 'DonationAlerts sorgulanırken bir bağlantı hatası oluştu.'
      });
    }
  };

  // 2. Resmi Promosyon / Hediye Kodu Kullanımı
  const handleRedeemPromo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoCodeInput.trim()) return;
    if (!user) {
      openAuthModal('login');
      setStatusMessage({ type: 'error', text: 'Kupon kodu kullanmak için lütfen önce giriş yapın.' });
      return;
    }
    setIsRedeemingPromo(true);
    try {
      const res = await redeemPromoCode(promoCodeInput.trim());
      setIsRedeemingPromo(false);
      if (res.success) {
        triggerPurchaseConfetti();
        setStatusMessage({ type: 'success', text: res.message });
        setPromoCodeInput('');
      } else {
        setStatusMessage({ type: 'error', text: res.message || 'Geçersiz veya süresi dolmuş kod!' });
      }
    } catch {
      setIsRedeemingPromo(false);
      setStatusMessage({ type: 'error', text: 'İşlem sırasında bir hata oluştu.' });
    }
  };

  const handleSaveLemonUrl = (e: React.FormEvent) => {
    e.preventDefault();
    setPackageUrls(inputPackageUrls);
    try {
      localStorage.setItem('ls_package_urls', JSON.stringify(inputPackageUrls));
    } catch (e) {}

    // Synchronize to backend database so ALL users and ALL devices have the updated package links
    fetch('/api/admin/coin-packages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(inputPackageUrls)
    })
      .then(res => res.json())
      .then(data => {
        console.log('⚡ Paket bağlantıları sunucuya başarıyla kaydedildi:', data);
      })
      .catch(err => {
        console.error('Failed to sync coin package urls to server:', err);
      });

    setStatusMessage({
      type: 'success',
      text: '✅ Paket Bağlantıları Başarıyla Kaydedildi! Sunucuya yüklendi ve artık tüm kullanıcılar ve cihazlar için aktiftir.'
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

  const handleRedeemCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoInput.trim()) return;
    try {
      const res = await redeemPromoCode(promoInput);
      if (res.success) {
        triggerPurchaseConfetti();
        setStatusMessage({ type: 'success', text: res.message });
        setPromoInput('');
      } else {
        setStatusMessage({ type: 'error', text: res.message });
      }
    } catch {
      setStatusMessage({ type: 'error', text: 'İşlem sırasında bir hata oluştu.' });
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

      {/* CATEGORY TABS (CLEAN HORIZONTAL SCROLL WITHOUT WEIRD WRAPPING) */}
      <div className="relative flex items-center group/cat-scroll bg-gray-950/80 border border-purple-900/40 p-1.5 rounded-2xl shadow-inner">
        <button
          type="button"
          onClick={() => handleCategoryScroll('left')}
          className="flex shrink-0 p-2 rounded-xl bg-gray-900/90 border border-amber-500/30 hover:bg-amber-500 hover:text-black text-amber-300 transition shadow-md z-10 mr-1.5 cursor-pointer"
          title="Sola Kaydır"
        >
          <ChevronLeft size={16} />
        </button>

        <div
          ref={categoryScrollRef}
          onWheel={handleCategoryWheel}
          className="flex items-center gap-2 py-1 overflow-x-auto no-scrollbar scroll-smooth flex-1 flex-nowrap"
        >
          <button
            onClick={() => setActiveCategory('buy_coins')}
            className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 whitespace-nowrap shrink-0 transition-all cursor-pointer shadow-md ${
              activeCategory === 'buy_coins'
                ? 'bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-black shadow-amber-500/20 scale-[1.02]'
                : 'bg-amber-950/60 text-amber-300 border border-amber-500/40 hover:bg-amber-900/80 hover:text-white'
            }`}
          >
            <CreditCard size={15} className="stroke-[2.5]" />
            <span>Cosmo-Puan Yükle</span>
          </button>

          <button
            onClick={() => setActiveCategory('theme_photo')}
            className={`px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 whitespace-nowrap transition cursor-pointer ${
              activeCategory === 'theme_photo'
                ? 'bg-gradient-to-r from-rose-500 via-amber-400 to-rose-500 text-black shadow-md shadow-rose-500/30 ring-1 ring-amber-300'
                : 'bg-gray-900 text-rose-300 hover:text-white hover:bg-gray-800'
            }`}
          >
            🖼️ Görsel Fonlu Temalar ({itemsList.filter(i => i.category === 'theme' && i.themeType === 'photo').length})
          </button>

          <button
            onClick={() => setActiveCategory('theme_aura')}
            className={`px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 whitespace-nowrap transition cursor-pointer ${
              activeCategory === 'theme_aura'
                ? 'bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-black shadow-md shadow-amber-500/20 ring-1 ring-amber-300'
                : 'bg-gray-900 text-amber-300 hover:text-white hover:bg-gray-800'
            }`}
          >
            <Palette size={14} /> ✨ Aura Temaları ({itemsList.filter(i => i.category === 'theme' && i.themeType !== 'photo').length})
          </button>

          <button
            onClick={() => setActiveCategory('frame')}
            className={`px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 whitespace-nowrap transition cursor-pointer ${
              activeCategory === 'frame'
                ? 'bg-gradient-to-r from-cyan-500 via-blue-400 to-indigo-500 text-black shadow-md shadow-cyan-500/20 ring-1 ring-cyan-300'
                : 'bg-gray-900 text-cyan-300 hover:text-white hover:bg-gray-800'
            }`}
          >
            <Sparkles size={14} /> 🖼️ Profil Çerçeveleri ({itemsList.filter(i => i.category === 'frame').length})
          </button>

          <button
            onClick={() => setActiveCategory('badge')}
            className={`px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 whitespace-nowrap transition cursor-pointer ${
              activeCategory === 'badge'
                ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20'
                : 'bg-gray-900 text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
          >
            <Crown size={14} /> ⭐ VIP Unvanlar ({itemsList.filter(i => i.category === 'badge').length})
          </button>

          <button
            onClick={() => setActiveCategory('emoji_pack')}
            className={`px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 whitespace-nowrap transition cursor-pointer ${
              activeCategory === 'emoji_pack'
                ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20'
                : 'bg-gray-900 text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
          >
            <Smile size={14} /> 🎨 Chibi Çıkartmaları ({itemsList.filter(i => i.category === 'emoji_pack').length})
          </button>

          <button
            onClick={() => setActiveCategory('all')}
            className={`px-3 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 whitespace-nowrap transition cursor-pointer ${
              activeCategory === 'all'
                ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20'
                : 'bg-gray-900 text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
          >
            <ShoppingBag size={14} /> Tüm Ürünler ({itemsList.length})
          </button>
        </div>

        <button
          type="button"
          onClick={() => handleCategoryScroll('right')}
          className="flex shrink-0 p-2 rounded-xl bg-gray-900/90 border border-amber-500/30 hover:bg-amber-500 hover:text-black text-amber-300 transition shadow-md z-10 ml-1.5 cursor-pointer"
          title="Sağa Kaydır"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* PRODUCT / COIN PACKAGES VIEW */}
      {activeCategory === 'buy_coins' ? (
        <div className="space-y-4">
          {/* Lemon Squeezy Admin Banner & Settings (Visible ONLY to aseleliyeva77@gmail.com and mikrokosmosfansub@gmail.com) */}
          {isAuthorizedAdmin(user?.email) && (
            <>


              {/* Multi-Provider Payment Settings Panel */}
              {showLemonSettings && (
                <form onSubmit={handleSaveLemonUrl} className="bg-gray-900/90 border border-amber-500/40 p-4 rounded-2xl space-y-3 animate-fadeIn">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black text-amber-300 flex items-center gap-2">
                      <Settings size={14} /> Paket Ödeme Linkleri (DonationAlerts / Shopier / Ko-fi)
                    </h4>
                    <span className="text-[10px] text-gray-400">Varsayılan: https://www.donationalerts.com/r/rafiga</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                    {COIN_PACKAGES.map(pkg => (
                      <div key={pkg.id} className="space-y-1 bg-black/40 p-2.5 rounded-xl border border-gray-800">
                        <label className="text-[11px] font-extrabold text-white flex items-center justify-between">
                          <span>{pkg.iconEmoji} {pkg.name}</span>
                          <span className="text-amber-400">${pkg.priceUSD} USD (~{pkg.priceTRY} ₺)</span>
                        </label>
                        <input
                          type="url"
                          placeholder="https://www.donationalerts.com/r/rafiga"
                          value={(inputPackageUrls || {})[pkg.id] || ''}
                          onChange={e => setInputPackageUrls({ ...(inputPackageUrls || {}), [pkg.id]: e.target.value })}
                          className="w-full px-2.5 py-1.5 bg-gray-950 border border-gray-700 rounded-lg text-white text-[11px] placeholder:text-gray-600 focus:outline-none focus:border-amber-400 font-mono"
                        />
                      </div>
                    ))}
                  </div>

                  <div className="bg-amber-950/30 border border-amber-500/30 p-2.5 rounded-xl space-y-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-black text-amber-300">💡 DonationAlerts & Global USD Ödeme</span>
                      <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">Aktif & Hazır</span>
                    </div>
                    <p className="text-[10px] text-gray-300 leading-relaxed">
                      DonationAlerts linkiniz (<strong>https://www.donationalerts.com/r/rafiga</strong>) tüm paketler için varsayılan olarak tanımlanmıştır. Kullanıcılar kartlarıyla doğrudan USD bağışı/ödemesi yapabilir, telif veya fansub kısıtlaması yaşamazlar. Dilerseniz her paket için özel bir link de yazabilirsiniz.
                    </p>
                  </div>

                  <div className="flex justify-end pt-1">
                    <button
                      type="submit"
                      className="px-5 py-2 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-black font-black text-xs rounded-xl transition cursor-pointer shadow-md"
                    >
                      Tüm Paket Linklerini Kaydet
                    </button>
                  </div>
                </form>
              )}

              {/* Payment Platforms Guide Accordion */}
              {showLemonGuide && (
                <div className="bg-gray-950/95 border border-purple-500/40 p-4 sm:p-5 rounded-2xl space-y-3 text-xs leading-relaxed animate-fadeIn">
                  <div className="flex items-center justify-between border-b border-gray-800 pb-2">
                    <h4 className="text-sm font-black text-white flex items-center gap-2">
                      <Globe size={16} className="text-amber-400" /> Fansub Ödeme Alternatifleri & Kurulum Rehberi
                    </h4>
                    <button onClick={() => setShowLemonGuide(false)} className="text-gray-400 hover:text-white text-xs font-bold cursor-pointer">Kapat ✕</button>
                  </div>

                  <div className="bg-emerald-950/40 border border-emerald-500/30 p-3 rounded-xl space-y-1 text-[11px] text-emerald-200">
                    <strong className="text-emerald-300 flex items-center gap-1.5">
                      ⭐ Neden DonationAlerts En İyi Çözüm?
                    </strong>
                    <p className="text-gray-300">
                      Lemon Squeezy veya Stripe gibi kuruluşlar telifli webtoon/manga içeriğini görünce scanlation sitelerini reddeder. <strong>DonationAlerts</strong> ise fan ve yayıncı toplulukları için tasarlandığından fansub sitelerine hiçbir kısıtlama uygulamaz. Azerbaycan, Türkiye ve dünya genelindeki tüm kredi/banka kartlarından <strong>Dolar ($ USD)</strong> ile ödeme kabul etmenizi sağlar.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
                    <div className="bg-gray-900/80 p-3 rounded-xl border border-amber-500/30 space-y-1">
                      <h5 className="font-extrabold text-amber-300 flex items-center gap-1.5">
                        <Zap size={14} className="text-amber-400" /> 1. DonationAlerts (Aktif Sistem ⭐)
                      </h5>
                      <p className="text-gray-300 text-[11px] leading-relaxed">
                        • Kullanıcı tıkladığında kullanıcı adı panoya kopyalanır ve <strong>donationalerts.com/r/rafiga</strong> sayfası açılır.<br/>
                        • Kullanıcı kartıyla $ USD tutarını öder.<br/>
                        • Bildirim anında size gelir, kullanıcı fiş kodunu girerek puanını anında tanımlar.
                      </p>
                    </div>

                    <div className="bg-gray-900/80 p-3 rounded-xl border border-purple-500/30 space-y-1">
                      <h5 className="font-extrabold text-purple-300 flex items-center gap-1.5">
                        <ShoppingBag size={14} className="text-purple-400" /> 2. Shopier (Türkiye Alternatifi)
                      </h5>
                      <p className="text-gray-300 text-[11px] leading-relaxed">
                        • <strong className="text-white">shopier.com</strong> üzerinden 5 dakikada bireysel hesap açılabilir.<br/>
                        • Ürün adı olarak <em>"Mikrokosmos Cosmo-Puan Destek Paketi"</em> şeklinde genel dijital ürün oluşturulur.<br/>
                        • Shopier ürün linklerini yukarıdaki Ayarlar ⚙️ kısmından ekleyebilirsiniz.
                      </p>
                    </div>

                    <div className="bg-gray-900/80 p-3 rounded-xl border border-cyan-500/30 space-y-1">
                      <h5 className="font-extrabold text-cyan-300 flex items-center gap-1.5">
                        <Coins size={14} className="text-cyan-400" /> 3. Havale / FAST / Papara
                      </h5>
                      <p className="text-gray-300 text-[11px] leading-relaxed">
                        • Sıfır komisyon. Kullanıcılar doğrudan IBAN veya Papara hesabınıza kullanıcı adlarını yazarak gönderir.<br/>
                        • Siz de Yönetici Paneli &gt; Puan Yönetimi ekranından tek tıkla kullanıcının hesabına puanı eklersiniz.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </>
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
                  <div className="text-center">
                    <span className="font-black text-amber-300 text-lg">${pkg.priceUSD} USD</span>
                    <div className="text-[11px] text-gray-300 font-semibold mt-0.5 flex items-center justify-center gap-1.5 flex-wrap">
                      <span className="text-amber-400 font-bold">{pkg.priceTRY} ₺ TL</span>
                      <span className="text-gray-500">•</span>
                      <span className="text-cyan-400 font-bold">{pkg.priceAZN} ₼ AZN</span>
                    </div>
                  </div>

                  {(() => {
                    const pkgUrl = (packageUrls || {})[pkg.id]?.trim() || '';
                    const isShopier = pkgUrl.includes('shopier.com');
                    const isKofi = pkgUrl.includes('ko-fi.com');
                    const isKreosus = pkgUrl.includes('kreosus.com');
                    const isLemon = pkgUrl.includes('lemonsqueezy.com');
                    const isDonationAlerts = pkgUrl.includes('donationalerts.com') || (!isShopier && !isKofi && !isKreosus && !isLemon);

                    const btnIcon = isDonationAlerts ? '⚡' : isShopier ? '🛍️' : isKofi ? '☕' : isKreosus ? '💜' : isLemon ? '🍋' : '💳';
                    const btnText = isDonationAlerts
                      ? `Satın Al ($${pkg.priceUSD} USD)`
                      : isShopier
                      ? `Shopier (${pkg.priceTRY ? `${pkg.priceTRY} ₺` : `$${pkg.priceUSD}`})`
                      : isKofi
                      ? `Ko-fi ($${pkg.priceUSD})`
                      : isKreosus
                      ? `Kreosus (${pkg.priceTRY ? `${pkg.priceTRY} ₺` : `$${pkg.priceUSD}`})`
                      : `Satın Al ($${pkg.priceUSD} USD)`;

                    return (
                      <button
                        onClick={() => handleBuyCoinPackage(pkg)}
                        className={`w-full py-2.5 px-3 rounded-xl font-black text-xs transition-all shadow-md flex items-center justify-center gap-2 active:scale-95 cursor-pointer ${
                          pkg.popular || pkg.bestValue
                            ? 'bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:to-yellow-300 text-black border border-amber-300'
                            : 'bg-purple-950/80 hover:bg-purple-900 border border-purple-500/40 text-purple-200'
                        }`}
                      >
                        <span>{btnIcon}</span>
                        <span>{btnText}</span>
                      </button>
                    );
                  })()}
                </div>
              </div>
            ))}
          </div>



          {/* GÜVENLİ ÖDEME BİLDİRİMİ VE KUPON ALANI */}
          <div className="bg-gray-900/90 border border-purple-500/40 p-4 sm:p-5 rounded-2xl space-y-4 shadow-xl">
            {/* Sekme Butonları */}
            <div className="flex items-center gap-2 border-b border-gray-800 pb-3 flex-wrap">
              <button
                type="button"
                onClick={() => setVerifyTab('notification')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  verifyTab === 'notification'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 shadow-sm'
                    : 'bg-gray-800 text-gray-400 hover:text-white'
                }`}
              >
                <CheckCircle2 size={14} className={verifyTab === 'notification' ? 'text-amber-400' : 'text-gray-400'} />
                <span>Manuel Ödeme Bildirimi (Otomatik Yüklenmediyse)</span>
              </button>
              <button
                type="button"
                onClick={() => setVerifyTab('promo')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  verifyTab === 'promo'
                    ? 'bg-purple-600/30 text-purple-200 border border-purple-500/50 shadow-sm'
                    : 'bg-gray-800 text-gray-400 hover:text-white'
                }`}
              >
                <Sparkles size={14} className={verifyTab === 'promo' ? 'text-purple-300' : 'text-gray-400'} />
                <span>Promosyon / Hediye Kodu</span>
              </button>
            </div>

            {verifyTab === 'notification' ? (
              /* ÖDEME BİLDİRİMİ FORMU */
              <form onSubmit={handleSubmitPaymentNotification} className="space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-1">
                  <span className="text-xs font-black text-amber-300">
                    💳 DonationAlerts Bağış / Ödeme Bildirimi
                  </span>
                  <span className="text-[10px] text-gray-400">
                    Otomatik kontrolde puanınız anında gelmediyse buradan bildirim iletin, yöneticimiz kontrol edip yükleyecektir.
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-purple-300 font-bold mb-1">
                      Satın Aldığınız Paket:
                    </label>
                    <select
                      value={selectedNotifyPkgId}
                      onChange={e => setSelectedNotifyPkgId(e.target.value)}
                      className="w-full bg-gray-950 border border-purple-500/40 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-amber-400 cursor-pointer"
                    >
                      {COIN_PACKAGES.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.iconEmoji} {p.name} (+{(p.coins + p.bonusCoins).toLocaleString('tr-TR')} CP • ${p.priceUSD} USD • {p.priceTRY} ₺ • {p.priceAZN} ₼)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] text-purple-300 font-bold mb-1">
                      DonationAlerts'te Yazdığınız İsim / Dekont No:
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Örn: Sitedeki adınız veya işlem numarası"
                      value={donorReferenceInput}
                      onChange={e => setDonorReferenceInput(e.target.value)}
                      className="w-full bg-gray-950 border border-purple-500/40 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-amber-400 placeholder:text-gray-500"
                    />
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-1">
                  <span className="text-[10px] text-gray-400 leading-tight">
                    💡 Yönetici DonationAlerts panelinden ödemenizi teyit ettikten sonra puanınız anında hesabınıza yüklenecektir.
                  </span>
                  <button
                    type="submit"
                    disabled={isSubmittingNotification || !donorReferenceInput.trim()}
                    className="w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:to-yellow-300 text-black font-black text-xs rounded-xl transition shadow-md flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer shrink-0"
                  >
                    {isSubmittingNotification ? (
                      <>
                        <RotateCw size={14} className="animate-spin" />
                        <span>İletiliyor...</span>
                      </>
                    ) : (
                      <>
                        <Send size={14} />
                        <span>Ödeme Bildirimini Gönder</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            ) : (
              /* PROMOSYON KODU KULLANIM FORMU */
              <form onSubmit={handleRedeemPromo} className="space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-1">
                  <span className="text-xs font-black text-purple-300">
                    🎁 Hediye / Promosyon Kodu Kullan
                  </span>
                  <span className="text-[10px] text-gray-400">
                    Yöneticiden veya etkinlikten aldığınız geçerli kupon kodunu giriniz.
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-2">
                  <input
                    type="text"
                    placeholder="Promosyon Kodu (örn: HOSGELDIN)"
                    value={promoCodeInput}
                    onChange={e => setPromoCodeInput(e.target.value)}
                    className="w-full sm:flex-1 px-3.5 py-2.5 bg-gray-950 border border-purple-500/40 rounded-xl text-white text-xs placeholder:text-gray-500 focus:outline-none focus:border-purple-400 uppercase font-mono tracking-wider"
                  />
                  <button
                    type="submit"
                    disabled={isRedeemingPromo || !promoCodeInput.trim()}
                    className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold text-xs rounded-xl transition shadow-md flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer shrink-0"
                  >
                    {isRedeemingPromo ? (
                      <>
                        <RotateCw size={14} className="animate-spin" />
                        <span>Kontrol Ediliyor...</span>
                      </>
                    ) : (
                      <>
                        <Zap size={14} />
                        <span>Kodu Kullan</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      ) : (() => {
        const renderShopItemCard = (item: ShopItem) => {
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
                      <h3 className="text-sm font-extrabold text-white flex items-center gap-2 flex-wrap">
                        <span>{item.name}</span>
                        {isOwned && (
                          <span className="text-[10px] bg-emerald-950 border border-emerald-500/50 text-emerald-400 font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                            <span>⏳ {formatRemainingDuration(expiresAtMap[item.id])}</span>
                          </span>
                        )}
                      </h3>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className={`text-[10px] px-2 py-0.5 rounded-md ${getRarityBadge(item.rarity)}`}>
                          {item.rarity}
                        </span>
                        <span className="text-[10px] text-amber-300/80 font-semibold bg-amber-950/50 border border-amber-500/20 px-2 py-0.5 rounded-md">
                          1 Aylık Süre
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Price Badge */}
                  {!isOwned && (
                    <div className="flex flex-col items-end gap-0.5 shrink-0">
                      <div className="flex items-center gap-1 bg-amber-950/80 border border-amber-500/50 px-2.5 py-1 rounded-xl text-xs font-black text-amber-300">
                        <Coins size={14} className="text-amber-400" />
                        <span>{item.price} CP</span>
                      </div>
                      <span className="text-[9px] text-amber-300/75 font-bold">30 Günlük</span>
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
                      <Check size={14} /> Kullanıma Hazır ({formatRemainingDuration(expiresAtMap[item.id])})
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
                        <Coins size={14} /> Satın Al ({item.price} CP • 1 Ay)
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
        };

        return (
          <div className="space-y-6">
            {ownedFilteredItems.length > 0 && (
              <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-950/30 via-gray-900/90 to-gray-950 border border-emerald-500/40 space-y-3.5 shadow-lg">
                <div className="flex items-center justify-between border-b border-emerald-500/20 pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-black text-emerald-300 flex items-center gap-1.5">
                      <Check size={16} className="text-emerald-400 stroke-[3]" />
                      {activeCategory === 'emoji_pack' ? 'Satın Alınan Chibi Paketleriniz' : 'Satın Aldıklarınız'}
                    </span>
                    <span className="text-[10px] font-extrabold bg-emerald-950/90 text-emerald-300 border border-emerald-500/30 px-2.5 py-0.5 rounded-full">
                      {ownedFilteredItems.length} Ürün Açık
                    </span>
                  </div>
                  <span className="text-[11px] text-emerald-400/90 font-bold">
                    Kullanıma Hazır ✨
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {ownedFilteredItems.map(item => renderShopItemCard(item))}
                </div>
              </div>
            )}

            {unownedFilteredItems.length > 0 && (
              <div className="space-y-3">
                {ownedFilteredItems.length > 0 && (
                  <div className="flex items-center justify-between px-1">
                    <span className="text-xs font-extrabold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                      <ShoppingBag size={14} className="text-amber-400" />
                      {activeCategory === 'emoji_pack' ? `Mağazadaki Diğer Chibi Paketleri (${unownedFilteredItems.length})` : `Mağazadaki Diğer Ürünler (${unownedFilteredItems.length})`}
                    </span>
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {unownedFilteredItems.map(item => renderShopItemCard(item))}
                </div>
              </div>
            )}
          </div>
        );
      })()}

      {/* ÖDEME ÖNCESİ AÇIKLAMA REHBERİ MODALI - %100 MOBİL VE MASAÜSTÜ UYUMLU */}
      {selectedGuidePkg && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-lg max-h-[92dvh] sm:max-h-[88vh] flex flex-col bg-gradient-to-b from-gray-900 via-gray-950 to-purple-950 border-t-2 sm:border-2 border-amber-400 rounded-t-3xl sm:rounded-3xl shadow-[0_0_60px_rgba(245,158,11,0.3)] animate-scaleUp overflow-hidden">
            
            {/* 1. SABİT BAŞLIK (HEADER) - Asla Kaybolmaz */}
            <div className="p-4 sm:p-5 border-b border-gray-800/80 bg-gray-950/80 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-amber-500/20 border border-amber-400/50 flex items-center justify-center text-xl sm:text-2xl shrink-0">
                  {selectedGuidePkg.iconEmoji}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 bg-amber-950/80 border border-amber-500/40 px-2 py-0.5 rounded-full">
                      Ödeme & Puan Yükleme
                    </span>
                    <span className="text-[10px] text-emerald-400 font-extrabold">
                      +{(selectedGuidePkg.coins + selectedGuidePkg.bonusCoins).toLocaleString('tr-TR')} CP
                    </span>
                  </div>
                  <h3 className="text-base sm:text-lg font-black text-white mt-0.5 truncate">
                    {selectedGuidePkg.name}
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedGuidePkg(null)}
                className="p-2 text-gray-400 hover:text-white bg-gray-900/90 hover:bg-gray-800 rounded-full border border-gray-700 transition cursor-pointer shrink-0"
                title="Kapat"
              >
                <X size={18} />
              </button>
            </div>

            {/* 2. KAYDIRILABİLİR İÇERİK (SCROLLABLE BODY) */}
            <div className="overflow-y-auto overscroll-contain flex-1 p-4 sm:p-6 space-y-3.5">
              
              {/* Fiyat Şeridi - Dolar, TL, Manat */}
              <div className="bg-black/60 border border-amber-500/30 rounded-2xl p-3 space-y-1.5">
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-purple-950/50 border border-purple-500/30 p-1.5 sm:p-2 rounded-xl">
                    <span className="text-[9px] sm:text-[10px] text-gray-400 block font-bold">Dolar ($)</span>
                    <span className="text-sm sm:text-base font-black text-amber-300">${selectedGuidePkg.priceUSD} USD</span>
                  </div>
                  <div className="bg-purple-950/50 border border-purple-500/30 p-1.5 sm:p-2 rounded-xl">
                    <span className="text-[9px] sm:text-[10px] text-gray-400 block font-bold">Türk Lirası (₺)</span>
                    <span className="text-sm sm:text-base font-black text-amber-400">{selectedGuidePkg.priceTRY} ₺ TL</span>
                  </div>
                  <div className="bg-purple-950/50 border border-purple-500/30 p-1.5 sm:p-2 rounded-xl">
                    <span className="text-[9px] sm:text-[10px] text-gray-400 block font-bold">Manat (₼)</span>
                    <span className="text-sm sm:text-base font-black text-cyan-400">{selectedGuidePkg.priceAZN} ₼ AZN</span>
                  </div>
                </div>
              </div>

              {/* Kullanıcı Adı & DonationAlerts'te Yazılan İsim */}
              <div className="space-y-2.5 bg-purple-950/40 border border-purple-500/40 rounded-2xl p-3.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="overflow-hidden">
                    <span className="text-[10px] text-purple-300 block font-semibold">Sitedeki Kullanıcı Adınız:</span>
                    <span className="text-sm font-black text-white truncate block">
                      {user?.name || (user as any)?.displayName || user?.email?.split('@')[0]}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      const uname = user?.name || (user as any)?.displayName || user?.email?.split('@')[0] || '';
                      try {
                        await navigator.clipboard.writeText(uname);
                        setCopiedUname(true);
                        setTimeout(() => setCopiedUname(false), 2500);
                      } catch (e) {}
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition shrink-0 cursor-pointer ${
                      copiedUname
                        ? 'bg-emerald-600 text-white'
                        : 'bg-purple-900/80 hover:bg-purple-800 text-purple-200 border border-purple-400/40'
                    }`}
                  >
                    {copiedUname ? (
                      <>
                        <Check size={14} />
                        <span>Kopyalandı!</span>
                      </>
                    ) : (
                      <>
                        <Copy size={14} />
                        <span>Kullanıcı Adını Kopyala</span>
                      </>
                    )}
                  </button>
                </div>

                {/* DonationAlerts'te Yazılan Gönderen İsmi */}
                <div className="pt-2 border-t border-purple-500/20">
                  <label className="text-[11px] text-amber-300 font-extrabold flex items-center justify-between mb-1">
                    <span>DonationAlerts'te Yazdığınız İsim:</span>
                    <span className="text-[10px] text-gray-400 font-normal">Farklı bir şey yazdıysanız değiştirin</span>
                  </label>
                  <input
                    type="text"
                    value={modalDonorName}
                    onChange={e => setModalDonorName(e.target.value)}
                    placeholder="Örn: Sitedeki adınız veya DonationAlerts'te yazdığınız isim"
                    className="w-full bg-gray-950 border border-amber-500/40 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-amber-400 font-bold placeholder:text-gray-500"
                  />
                </div>
              </div>

              {/* Nasıl Ödenir Adımları (Kompakt ve Okunaklı) */}
              <div className="space-y-2 text-xs bg-gray-900/90 p-3.5 rounded-2xl border border-amber-500/30">
                <div className="font-extrabold text-amber-300 text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <Zap size={14} className="text-amber-400" /> DonationAlerts'te Neler Yapacaksınız?
                </div>
                <ul className="space-y-2 text-gray-200 text-[11px] sm:text-xs leading-relaxed">
                  <li className="flex items-start gap-2 bg-purple-950/30 p-2 rounded-xl border border-purple-500/20">
                    <span className="w-4 h-4 rounded-full bg-amber-500/20 text-amber-300 font-black flex items-center justify-center shrink-0 text-[10px] mt-0.5">1</span>
                    <span>Aşağıdaki <strong className="text-amber-300">"1. Ödeme Sayfasına Git"</strong> butonuna basarak DonationAlerts'i açın.</span>
                  </li>
                  <li className="flex items-start gap-2 bg-purple-950/30 p-2 rounded-xl border border-purple-500/20">
                    <span className="w-4 h-4 rounded-full bg-amber-500/20 text-amber-300 font-black flex items-center justify-center shrink-0 text-[10px] mt-0.5">2</span>
                    <span>DonationAlerts'te <strong className="text-white underline">"Anonim olarak gönder ✏️"</strong> yerine kopyaladığınız <strong className="text-amber-300">Kullanıcı Adınızı</strong> yazın.</span>
                  </li>
                  <li className="flex items-start gap-2 bg-purple-950/30 p-2 rounded-xl border border-purple-500/20">
                    <span className="w-4 h-4 rounded-full bg-amber-500/20 text-amber-300 font-black flex items-center justify-center shrink-0 text-[10px] mt-0.5">3</span>
                    <span>Tutar alanına paket fiyatını girip (<strong className="text-amber-300">${selectedGuidePkg.priceUSD} USD</strong> / <strong className="text-amber-400">{selectedGuidePkg.priceTRY} ₺</strong> / <strong className="text-cyan-300">{selectedGuidePkg.priceAZN} ₼</strong>) kartınızla ödeyin.</span>
                  </li>
                  <li className="flex items-start gap-2 bg-purple-950/30 p-2 rounded-xl border border-purple-500/20">
                    <span className="w-4 h-4 rounded-full bg-amber-500/20 text-amber-300 font-black flex items-center justify-center shrink-0 text-[10px] mt-0.5">4</span>
                    <span>Ödemeyi bitirince geri dönüp aşağıdaki <strong className="text-emerald-400">"2. Puanımı Yükle"</strong> butonuna basın.</span>
                  </li>
                </ul>
              </div>

            </div>

            {/* 3. SABİT ALT BUTONLAR (FOOTER) - Ekrana Yapışık, Asla Kesilmez */}
            <div className="p-3.5 sm:p-5 border-t border-gray-800/90 bg-gray-950/95 flex flex-col sm:flex-row gap-2 shrink-0">
              <button
                type="button"
                onClick={() => handleProceedToDonationAlerts(selectedGuidePkg)}
                className="flex-1 py-3 px-4 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:to-yellow-300 text-black font-black text-xs sm:text-sm rounded-xl shadow-lg transition active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
              >
                <ExternalLink size={15} />
                <span>1. Ödeme Sayfasına Git</span>
              </button>
              
              <button
                type="button"
                disabled={isCheckingAutoDonation}
                onClick={() => handleAutoCheckDonation(selectedGuidePkg)}
                className="flex-1 py-3 px-4 bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-600 hover:from-emerald-500 hover:to-teal-400 text-white font-black text-xs sm:text-sm rounded-xl shadow-lg transition active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 shrink-0"
              >
                {isCheckingAutoDonation ? (
                  <>
                    <RotateCw size={15} className="animate-spin" />
                    <span>Kontrol Ediliyor...</span>
                  </>
                ) : (
                  <>
                    <Zap size={15} className="text-yellow-300" />
                    <span>2. Puanımı Yükle 🚀</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setSelectedGuidePkg(null)}
                className="py-2.5 px-3 bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white font-bold text-xs rounded-xl border border-gray-700 transition cursor-pointer shrink-0"
              >
                Kapat
              </button>
            </div>

          </div>
        </div>
      )}

      {/* CELEBRATION MODAL ON PAYMENT SUCCESS */}
      {celebrationPurchase && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-md max-h-[90vh] overflow-y-auto bg-gradient-to-b from-gray-900 via-gray-950 to-purple-950/90 border-2 border-amber-400 rounded-3xl p-6 sm:p-8 text-center shadow-[0_0_60px_rgba(245,158,11,0.3)] animate-scaleUp">
            <button
              type="button"
              onClick={() => setCelebrationPurchase(null)}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white bg-gray-900/80 hover:bg-gray-800 rounded-full border border-gray-700 transition"
              title="Kapat"
            >
              <X size={18} />
            </button>

            <div className="w-20 h-20 mx-auto rounded-3xl bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center text-amber-400 shadow-xl shadow-amber-950 mb-4 animate-bounce">
              <Sparkles size={40} className="text-amber-300" />
            </div>

            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-950/60 border border-emerald-500/40 px-3 py-1 rounded-full">
              DonationAlerts Ödemesi Onaylandı
            </span>

            <h3 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400 mt-3">
              🎉 TEBRİKLER!
            </h3>
            <p className="text-xs text-gray-300 mt-1">
              Ödemeniz başarıyla tamamlandı ve bakiyeniz anında güncellendi.
            </p>

            <div className="my-5 p-4 bg-amber-950/40 border border-amber-500/40 rounded-2xl space-y-1">
              <span className="text-[11px] text-amber-300/80 uppercase font-bold block">
                Hesabınıza Yüklenen Miktar
              </span>
              <div className="text-3xl font-black text-amber-300 flex items-center justify-center gap-2">
                <Coins size={30} className="text-amber-400" />
                <span>+{celebrationPurchase.coinsEarned.toLocaleString('tr-TR')} CP</span>
              </div>
              <p className="text-xs text-amber-200/90 font-bold mt-1">
                {celebrationPurchase.pkgName} (${celebrationPurchase.priceUSD} USD)
              </p>
            </div>

            <p className="text-xs text-emerald-400 font-semibold mb-6 flex items-center justify-center gap-1.5">
              <CheckCircle2 size={16} /> Cosmo-Puanlar anında hesabınıza tanımlandı!
            </p>

            <button
              type="button"
              onClick={() => setCelebrationPurchase(null)}
              className="w-full py-3.5 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:to-yellow-300 text-black font-black text-sm rounded-2xl shadow-lg shadow-amber-500/30 transition transform hover:scale-[1.02] active:scale-95 cursor-pointer"
            >
              Harika, Kullanmaya Başla! ✨
            </button>
          </div>
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
              {(user?.email?.toLowerCase() === 'mikrokosmosfansub@gmail.com') ? 'Sınırsız CP' : `${(user?.coins ?? 10).toLocaleString('tr-TR')} CP`}
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

