import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { isAuthorizedAdmin, AUTHORIZED_ADMIN_EMAILS } from '../types';
import { AdminModal } from './AdminModal';
import {
  ShieldCheck,
  Crown,
  Lock,
  ArrowLeft,
  Database,
  BookOpen,
  Layers,
  MessageSquare,
  Sparkles,
  Download,
  Key,
  Users,
  HardDrive,
  RefreshCw,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  Menu,
  X,
  PlusCircle,
  FolderOpen,
  Zap,
  Globe,
  ShoppingBag,
  Server,
  BarChart3,
  LogOut,
  ChevronRight,
  Shield,
  FileCode,
  FileArchive,
  Search,
  Megaphone,
  Bell,
  Palette,
  Smile,
  Coins
} from 'lucide-react';
import { downloadCloudflareD1Sql } from '../utils/cloudflareD1Export';
import { downloadProjectZip } from '../utils/exportZip';
import { AdminNotificationsManager } from './AdminNotificationsManager';
import { AdminBrandingManager } from './AdminBrandingManager';
import { AdminEmojiManager } from './AdminEmojiManager';
import { AdminPointsManager } from './AdminPointsManager';

export type ManagementNavTab =
  | 'manage-series'
  | 'add-series'
  | 'add-chapter'
  | 'points-management'
  | 'branding-settings'
  | 'emoji-management'
  | 'announcements-notifications'
  | 'blogger-import'
  | 'cloudflare-d1'
  | 'shop-management'
  | 'authorized-accounts'
  | 'backup-export'
  | 'system-overview';

export const ManagementPanel: React.FC = () => {
  const {
    user,
    seriesList,
    comments,
    bookmarks,
    readingHistory,
    shopItems,
    themeStyles,
    notifications,
    isAdminLoggedIn,
    verifyAdminPassword,
    logoutAdmin,
    exportBackupData,
    setView,
    openAuthModal
  } = useApp();

  const [activeNav, setActiveNav] = useState<ManagementNavTab>(() => {
    const saved = localStorage.getItem('management_active_nav');
    return (saved as ManagementNavTab) || 'manage-series';
  });

  React.useEffect(() => {
    localStorage.setItem('management_active_nav', activeNav);
  }, [activeNav]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [isZipping, setIsZipping] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const isSuperAdmin = isAuthorizedAdmin(user?.email);
  const isAccessAllowed = isSuperAdmin || isAdminLoggedIn;

  // Statistics
  const totalChapters = seriesList.reduce((acc, s) => acc + (s.chapters?.length || 0), 0);
  const totalNovels = seriesList.filter(s => s.type === 'Web Novel').length;
  const totalManhwas = seriesList.filter(s => s.type === 'Manhwa' || s.type === 'Webtoon' || s.type === 'Manga').length;

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (verifyAdminPassword(pinInput)) {
      setPinError('');
      setPinInput('');
    } else {
      setPinError('Hatalı PIN veya şifre girdiniz.');
    }
  };

  const handleZipDownload = async () => {
    setIsZipping(true);
    try {
      await downloadProjectZip();
    } catch (e) {
      console.error(e);
      alert('Kaynak kod ZIP oluşturulurken hata oluştu.');
    } finally {
      setIsZipping(false);
    }
  };

  const handleCopyMockDataCode = () => {
    const tsCode = `import { Series, Announcement } from '../types';\n\nexport const INITIAL_ANNOUNCEMENT: Announcement = {\n  id: 'ann-1',\n  title: 'Yeni Sezon Bölümleri Yüklendi!',\n  text: 'Tüm manhwa ve web novellerimiz haftalık güncellenmektedir. Keyifli okumalar dileriz!',\n  type: 'announcement',\n  active: true\n};\n\nexport const GENRE_LIST = [\n  'Aksiyon', 'Fantastik', 'Macera', 'Dram', 'Romantik', 'Komedisi', \n  'Reenkarnasyon', 'Sistem', 'İsekai', 'Büyü', 'Dövüş Sanatları', \n  'Gerilim', 'Gizem', 'Bilim Kurgu', 'Tarihi', 'Web Novel', 'Manhwa', '18+'\n];\n\nexport const INITIAL_SERIES: Series[] = ${JSON.stringify(seriesList, null, 2)};\n`;

    navigator.clipboard.writeText(tsCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 3000);
    alert('Güncellenmiş "mockData.ts" kodu panoya kopyalandı!');
  };

  // Unauthorized Screen
  if (!isAccessAllowed) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-6 animate-fadeIn">
        <div className="bg-gray-900 border-2 border-red-500/40 rounded-3xl p-8 sm:p-10 shadow-2xl space-y-6 relative overflow-hidden">
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-red-600/20 rounded-full blur-3xl pointer-events-none" />
          
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-red-600 to-rose-700 border border-red-400/50 flex items-center justify-center shadow-xl">
            <Lock size={32} className="text-white" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl sm:text-2xl font-black text-white">Yönetim Paneli</h2>
            <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">
              Bu alana erişim yetkiniz bulunmamaktadır. Lütfen yetkili hesabınızla giriş yapınız.
            </p>
          </div>

          {user ? (
            <div className="p-4 bg-gray-950/80 border border-gray-800 rounded-2xl text-left space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-400">Giriş Yapılan Hesap:</span>
                <span className="font-mono font-bold text-white">{user.email}</span>
              </div>
              <p className="text-[11px] text-amber-300 flex items-center gap-1">
                <AlertTriangle size={13} className="text-amber-400 shrink-0" />
                Bu hesabın yönetim paneline erişim yetkisi tanımlı değildir.
              </p>
            </div>
          ) : null}

          {/* Optional PIN fallback for direct manual admin unlock */}
          <form onSubmit={handlePinSubmit} className="pt-2 space-y-3 text-left">
            <label className="block text-xs font-bold text-gray-300">
              Alternatif PIN ile Doğrula:
            </label>
            <div className="flex gap-2">
              <input
                type="password"
                value={pinInput}
                onChange={e => setPinInput(e.target.value)}
                placeholder="Yönetici PIN kodu..."
                className="flex-1 bg-gray-950 border border-purple-500/40 text-white placeholder-gray-500 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-purple-400 transition"
              />
              <button
                type="submit"
                className="bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition shadow"
              >
                Onayla
              </button>
            </div>
            {pinError && <p className="text-xs text-red-400 font-medium">{pinError}</p>}
          </form>

          <div className="pt-4 flex flex-col sm:flex-row gap-3">
            {!user ? (
              <button
                onClick={() => openAuthModal('login')}
                className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold text-xs py-3 rounded-xl shadow-lg transition"
              >
                Yetkili Hesapla Giriş Yap
              </button>
            ) : null}
            <button
              onClick={() => setView({ type: 'home' })}
              className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-200 font-bold text-xs py-3 rounded-xl border border-gray-700 transition flex items-center justify-center gap-1.5"
            >
              <ArrowLeft size={14} />
              Ana Sayfaya Dön
            </button>
          </div>
        </div>
      </div>
    );
  }

  const navCategories = [
    {
      title: 'İÇERİK YÖNETİMİ',
      items: [
        {
          id: 'manage-series' as ManagementNavTab,
          label: 'Seriler & Bölümler',
          desc: 'Tüm seri listesi ve bölüm düzenleme',
          icon: BookOpen,
          badge: seriesList.length.toString(),
          badgeColor: 'bg-purple-900/60 text-purple-200 border-purple-500/30'
        },
        {
          id: 'add-series' as ManagementNavTab,
          label: 'Yeni Seri Ekle',
          desc: 'Kapak, tür ve detay tanımlama',
          icon: PlusCircle,
          badge: 'Yeni',
          badgeColor: 'bg-emerald-950 text-emerald-300 border-emerald-500/40'
        },
        {
          id: 'add-chapter' as ManagementNavTab,
          label: 'Yeni Bölüm Yayınla',
          desc: 'Tekli veya toplu bölüm yükleme',
          icon: Zap,
          badge: `${totalChapters} Bölüm`,
          badgeColor: 'bg-indigo-950 text-indigo-300 border-indigo-500/40'
        },
        {
          id: 'announcements-notifications' as ManagementNavTab,
          label: 'Duyuru & Bildirimler',
          desc: 'Genel bildirim gönder & üst bant duyurusu',
          icon: Megaphone,
          badge: `${notifications.length} Bildirim`,
          badgeColor: 'bg-pink-950 text-pink-300 border-pink-500/40'
        }
      ]
    },
    {
      title: 'GÖRÜNÜM & MARKA',
      items: [
        {
          id: 'branding-settings' as ManagementNavTab,
          label: 'Logo & Sekme İkonu',
          desc: 'Logo, Favicon ve site başlığı',
          icon: Palette,
          badge: 'Görünüm',
          badgeColor: 'bg-pink-950 text-pink-300 border-pink-500/40'
        },
        {
          id: 'emoji-management' as ManagementNavTab,
          label: 'Chibi Emoji Yönetimi',
          desc: 'Çıkartma yükleme & paket fiyatları',
          icon: Smile,
          badge: `${shopItems.filter(i => i.category === 'emoji_pack').length} Paket`,
          badgeColor: 'bg-purple-950 text-purple-300 border-purple-500/40'
        },
        {
          id: 'shop-management' as ManagementNavTab,
          label: 'Mağaza & Temalar',
          desc: 'Aura, Arka Plan ve CP fiyatları',
          icon: ShoppingBag,
          badge: `${shopItems.length} Öğe`,
          badgeColor: 'bg-amber-950 text-amber-300 border-amber-500/40'
        },
        {
          id: 'points-management' as ManagementNavTab,
          label: 'Manuel Cosmo-Puan Yükle',
          desc: 'İstediğin maile anında CP tanımla',
          icon: Coins,
          badge: 'CP Dağıt',
          badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40'
        }
      ]
    },
    {
      title: 'ENTEGRASYON & VERİ',
      items: [
        {
          id: 'blogger-import' as ManagementNavTab,
          label: 'Blogger Aktarımı',
          desc: 'Akıllı XML içe aktarma aracı',
          icon: Globe,
          badge: 'Akıllı',
          badgeColor: 'bg-orange-950 text-orange-300 border-orange-500/40'
        },
        {
          id: 'cloudflare-d1' as ManagementNavTab,
          label: 'Cloudflare D1 & R2',
          desc: 'Veritabanı denetimi & SQL aktarımı',
          icon: Database,
          badge: 'D1 Canlı',
          badgeColor: 'bg-cyan-950 text-cyan-300 border-cyan-500/40'
        }
      ]
    },
    {
      title: 'SİSTEM & GÜVENLİK',
      items: [
        {
          id: 'authorized-accounts' as ManagementNavTab,
          label: 'Yetkili Yöneticiler',
          desc: 'Süper admin izinleri ve hesaplar',
          icon: Users,
          badge: '2 Yetkili',
          badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40'
        },
        {
          id: 'backup-export' as ManagementNavTab,
          label: 'Yedekleme & SQL',
          desc: 'JSON, SQL ve Kod Arşivi',
          icon: HardDrive,
          badge: 'Yedek',
          badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
        },
        {
          id: 'system-overview' as ManagementNavTab,
          label: 'Sistem İstatistikleri',
          desc: 'Altyapı, metrikler ve veri katmanı',
          icon: BarChart3,
          badge: 'Metrik',
          badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
        }
      ]
    }
  ];

  const currentNavMeta = navCategories
    .flatMap(c => c.items)
    .find(item => item.id === activeNav) || navCategories[0].items[0];

  const handleSelectNav = (tabId: ManagementNavTab) => {
    setActiveNav(tabId);
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col">
      
      {/* Top Mobile Bar */}
      <div className="lg:hidden sticky top-0 z-40 bg-gray-900/95 backdrop-blur-md border-b border-purple-500/20 px-4 py-3 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 rounded-xl bg-gray-800 text-purple-300 hover:bg-gray-700 hover:text-white transition"
            aria-label="Menüyü Aç"
          >
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <div className="flex items-center gap-1.5">
            <Crown size={18} className="text-amber-400" />
            <span className="font-black text-sm text-white">Mikrokosmos Panel</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setView({ type: 'home' })}
            className="px-3 py-1.5 rounded-xl bg-purple-900/50 border border-purple-500/30 text-purple-200 text-xs font-bold flex items-center gap-1"
          >
            <ArrowLeft size={13} />
            <span>Site</span>
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row relative">
        
        {/* Mobile Backdrop */}
        {isMobileMenuOpen && (
          <div
            onClick={() => setIsMobileMenuOpen(false)}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 lg:hidden"
          />
        )}

        {/* ===================== SIDEBAR (YAN MENÜ) ===================== */}
        <aside
          className={`fixed lg:sticky top-0 left-0 z-50 h-screen w-72 sm:w-80 bg-gray-900/95 lg:bg-gray-900/80 border-r border-purple-500/20 flex flex-col justify-between transition-transform duration-300 ease-in-out backdrop-blur-xl shrink-0 overflow-y-auto no-scrollbar shadow-2xl ${
            isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          }`}
        >
          <div className="p-4 sm:p-5 space-y-6">
            
            {/* Sidebar Brand Header */}
            <div className="flex items-center justify-between pb-4 border-b border-gray-800">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-500 via-purple-600 to-indigo-600 p-0.5 shadow-lg shadow-purple-950/60 flex items-center justify-center shrink-0">
                  <div className="w-full h-full bg-gray-950 rounded-[14px] flex items-center justify-center">
                    <Crown size={20} className="text-amber-400 animate-pulse" />
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h2 className="font-black text-sm text-white tracking-tight">Mikrokosmos</h2>
                    <span className="bg-amber-500/20 text-amber-300 text-[9px] font-black px-1.5 py-0.2 rounded border border-amber-500/40">
                      PRO
                    </span>
                  </div>
                  <p className="text-[11px] text-purple-300/80 font-medium">Yönetim & Yayın Merkezi</p>
                </div>
              </div>

              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="lg:hidden p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800"
              >
                <X size={18} />
              </button>
            </div>

            {/* Active Admin Profile Card */}
            <div className="p-3 bg-gradient-to-br from-purple-950/60 via-gray-950 to-indigo-950/40 border border-purple-500/30 rounded-2xl space-y-2">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-600/30 border border-purple-400/40 flex items-center justify-center font-bold text-amber-300 text-xs shrink-0 shadow-inner">
                  {user?.name ? user.name.slice(0, 2).toUpperCase() : 'AD'}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <p className="text-xs font-black text-white truncate">
                      {user?.name || 'Süper Yönetici'}
                    </p>
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  </div>
                  <p className="text-[10px] text-gray-400 truncate font-mono">
                    {user?.email || 'admin@mikrokosmos.com'}
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between text-[10px] text-purple-200/90 pt-1 border-t border-purple-800/40">
                <span className="flex items-center gap-1 text-emerald-400 font-bold">
                  <ShieldCheck size={12} />
                  Tam Yetki Aktif
                </span>
                <span className="text-amber-300 font-bold">Süper Admin</span>
              </div>
            </div>

            {/* Navigation Groups */}
            <nav className="space-y-5">
              {navCategories.map((cat, cIdx) => (
                <div key={cIdx} className="space-y-1.5">
                  <p className="text-[10px] font-black uppercase tracking-wider text-purple-400/70 px-3">
                    {cat.title}
                  </p>
                  <div className="space-y-1">
                    {cat.items.map(item => {
                      const Icon = item.icon;
                      const isActive = activeNav === item.id;
                      return (
                        <button
                          key={item.id}
                          onClick={() => handleSelectNav(item.id)}
                          className={`w-full group flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-all duration-200 cursor-pointer ${
                            isActive
                              ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold shadow-lg shadow-purple-950/80 border border-purple-400/40'
                              : 'text-gray-300 hover:text-white hover:bg-purple-950/30'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <Icon
                              size={17}
                              className={`shrink-0 transition-colors ${
                                isActive ? 'text-white' : 'text-purple-400 group-hover:text-purple-300'
                              }`}
                            />
                            <div className="truncate">
                              <p className={`text-xs ${isActive ? 'font-black text-white' : 'font-semibold'}`}>
                                {item.label}
                              </p>
                            </div>
                          </div>

                          {item.badge && (
                            <span
                              className={`text-[10px] font-black px-2 py-0.5 rounded-full border shrink-0 transition ${
                                isActive
                                  ? 'bg-white/20 text-white border-white/30'
                                  : item.badgeColor
                              }`}
                            >
                              {item.badge}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </nav>

          </div>

          {/* Sidebar Footer Controls */}
          <div className="p-4 border-t border-gray-800/80 bg-gray-950/60 space-y-2 mt-4">
            <div className="flex items-center justify-between px-2 py-1 text-[11px] text-gray-400">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Cloudflare D1: <strong className="text-emerald-400">Canlı</strong>
              </span>
              <span className="font-mono text-[10px] text-purple-300">v2.5</span>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={() => setView({ type: 'home' })}
                className="w-full bg-gray-800 hover:bg-gray-700 text-gray-200 font-bold text-xs py-2 rounded-xl border border-gray-700 transition flex items-center justify-center gap-1.5 cursor-pointer"
                title="Ana Sayfaya Dön"
              >
                <ArrowLeft size={13} />
                Siteye Dön
              </button>

              <button
                onClick={logoutAdmin}
                className="w-full bg-red-950/40 hover:bg-red-900/60 text-red-300 font-bold text-xs py-2 rounded-xl border border-red-500/30 transition flex items-center justify-center gap-1.5 cursor-pointer"
                title="Yönetici Oturumunu Kapat"
              >
                <LogOut size={13} />
                Çıkış
              </button>
            </div>
          </div>
        </aside>

        {/* ===================== MAIN CONTENT AREA ===================== */}
        <main className="flex-1 min-w-0 p-3 sm:p-6 lg:p-8 space-y-6">
          
          {/* Top Bar Header & Breadcrumb */}
          <div className="bg-gray-900/90 border border-purple-500/20 rounded-3xl p-4 sm:p-5 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs text-purple-300 font-medium">
                <span>Yönetim Paneli</span>
                <ChevronRight size={13} className="text-gray-500" />
                <span className="text-gray-400">
                  {navCategories.find(c => c.items.some(i => i.id === activeNav))?.title || 'Menü'}
                </span>
                <ChevronRight size={13} className="text-gray-500" />
                <span className="text-white font-bold">{currentNavMeta.label}</span>
              </div>
              
              <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2.5">
                {React.createElement(currentNavMeta.icon, { size: 24, className: 'text-purple-400' })}
                <span>{currentNavMeta.label}</span>
              </h1>
            </div>

            {/* Quick Top Actions */}
            <div className="flex items-center gap-2 flex-wrap w-full md:w-auto">
              <button
                onClick={() => downloadCloudflareD1Sql(seriesList, comments, shopItems, themeStyles)}
                className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs flex items-center gap-1.5 shadow-lg shadow-amber-900/30 transition active:scale-95 cursor-pointer"
                title="Cloudflare D1 SQL Komutlarını İndir"
              >
                <Download size={14} className="text-black" />
                <span>D1 SQL İndir</span>
              </button>

              <button
                onClick={() => exportBackupData()}
                className="px-3.5 py-2 rounded-xl bg-purple-900/70 hover:bg-purple-800 border border-purple-500/40 text-purple-200 text-xs font-bold flex items-center gap-1.5 transition shadow cursor-pointer"
                title="Tüm Site Verisini JSON Olarak Yedekle"
              >
                <HardDrive size={14} className="text-purple-300" />
                <span>JSON Yedek</span>
              </button>

              <button
                onClick={() => setView({ type: 'home' })}
                className="px-3.5 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
              >
                <ArrowLeft size={14} />
                <span className="hidden sm:inline">Siteye Dön</span>
              </button>
            </div>
          </div>

          {/* KPI Summary Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
            <div className="bg-gray-900/80 border border-purple-500/20 rounded-2xl p-3.5 flex items-center gap-3 shadow-md">
              <div className="w-10 h-10 rounded-xl bg-purple-900/40 border border-purple-500/30 flex items-center justify-center text-purple-300 shrink-0">
                <BookOpen size={18} />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] text-gray-400 font-bold uppercase truncate">Toplam Seri</p>
                <p className="text-base sm:text-lg font-black text-white">{seriesList.length}</p>
              </div>
            </div>

            <div className="bg-gray-900/80 border border-purple-500/20 rounded-2xl p-3.5 flex items-center gap-3 shadow-md">
              <div className="w-10 h-10 rounded-xl bg-indigo-900/40 border border-indigo-500/30 flex items-center justify-center text-indigo-300 shrink-0">
                <Layers size={18} />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] text-gray-400 font-bold uppercase truncate">Toplam Bölüm</p>
                <p className="text-base sm:text-lg font-black text-white">{totalChapters}</p>
              </div>
            </div>

            <div className="bg-gray-900/80 border border-purple-500/20 rounded-2xl p-3.5 flex items-center gap-3 shadow-md">
              <div className="w-10 h-10 rounded-xl bg-pink-900/40 border border-pink-500/30 flex items-center justify-center text-pink-300 shrink-0">
                <MessageSquare size={18} />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] text-gray-400 font-bold uppercase truncate">Yorumlar</p>
                <p className="text-base sm:text-lg font-black text-white">{comments.length}</p>
              </div>
            </div>

            <div className="bg-gray-900/80 border border-purple-500/20 rounded-2xl p-3.5 flex items-center gap-3 shadow-md">
              <div className="w-10 h-10 rounded-xl bg-cyan-900/40 border border-cyan-500/30 flex items-center justify-center text-cyan-300 shrink-0">
                <BookOpen size={18} />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] text-gray-400 font-bold uppercase truncate">Manhwa</p>
                <p className="text-base sm:text-lg font-black text-white">{totalManhwas}</p>
              </div>
            </div>

            <div className="bg-gray-900/80 border border-purple-500/20 rounded-2xl p-3.5 flex items-center gap-3 shadow-md">
              <div className="w-10 h-10 rounded-xl bg-emerald-900/40 border border-emerald-500/30 flex items-center justify-center text-emerald-300 shrink-0">
                <Sparkles size={18} />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] text-gray-400 font-bold uppercase truncate">Web Novel</p>
                <p className="text-base sm:text-lg font-black text-white">{totalNovels}</p>
              </div>
            </div>

            <div className="bg-gray-900/80 border border-purple-500/20 rounded-2xl p-3.5 flex items-center gap-3 shadow-md">
              <div className="w-10 h-10 rounded-xl bg-amber-900/40 border border-amber-500/30 flex items-center justify-center text-amber-300 shrink-0">
                <Database size={18} />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] text-gray-400 font-bold uppercase truncate">Cloudflare D1</p>
                <p className="text-xs font-black text-emerald-400 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Aktif
                </p>
              </div>
            </div>
          </div>

          {/* ===================== VIEW CONTENT SWITCHER ===================== */}
          <div className="space-y-6 animate-fadeIn">
            
            {/* ANNOUNCEMENTS & NOTIFICATIONS BROADCAST TAB */}
            {activeNav === 'announcements-notifications' && (
              <AdminNotificationsManager />
            )}

            {/* BRANDING & LOGO / FAVICON SETTINGS TAB */}
            {activeNav === 'branding-settings' && (
              <AdminBrandingManager />
            )}

            {/* CHIBI EMOJI MANAGER TAB */}
            {activeNav === 'emoji-management' && (
              <AdminEmojiManager />
            )}

            {/* MANUAL COSMO-POINTS GRANTING TAB */}
            {activeNav === 'points-management' && (
              <AdminPointsManager />
            )}

            {/* Core Admin Engine for Series, Chapters, Blogger, Cloudflare D1 and Shop */}
            {(activeNav === 'manage-series' ||
              activeNav === 'add-series' ||
              activeNav === 'add-chapter' ||
              activeNav === 'blogger-import' ||
              activeNav === 'cloudflare-d1' ||
              activeNav === 'shop-management') && (
              <div className="sm:bg-gray-900/80 sm:border sm:border-purple-500/20 sm:rounded-3xl sm:p-6 lg:p-8 sm:shadow-xl mt-2">
                <AdminModal
                  activeTabOverride={activeNav as any}
                  onTabChange={(t) => setActiveNav(t as ManagementNavTab)}
                  hideHeader={true}
                  hideTabs={true}
                  hideActionBar={false}
                />
              </div>
            )}

            {/* AUTHORIZED ACCOUNTS TAB */}
            {activeNav === 'authorized-accounts' && (
              <div className="bg-gray-900/90 border border-purple-500/30 rounded-3xl p-4 sm:p-6 lg:p-8 shadow-xl space-y-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-purple-900/60 border border-purple-500/40 rounded-2xl text-purple-300">
                    <Users size={24} />
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-xl font-black text-white">Yetkilendirilmiş Süper Yönetici Hesapları</h2>
                    <p className="text-xs text-gray-400">Yönetim paneline sadece bu 2 e-posta adresiyle giriş yapıldığında profilde görünür ve tam yetki sağlar.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {AUTHORIZED_ADMIN_EMAILS.map((email, idx) => {
                    const isCurrent = user?.email?.toLowerCase() === email.toLowerCase();
                    return (
                      <div
                        key={email}
                        className={`p-5 rounded-2xl border transition ${
                          isCurrent
                            ? 'bg-purple-950/80 border-purple-400/80 shadow-lg shadow-purple-900/40'
                            : 'bg-gray-950/80 border-gray-800'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3 mb-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-purple-600 flex items-center justify-center text-black font-black text-sm">
                              {idx === 0 ? '👑' : '⭐'}
                            </div>
                            <div>
                              <p className="text-xs font-black text-white">{email}</p>
                              <p className="text-[10px] text-amber-300 font-bold">
                                {idx === 0 ? 'Kurucu / Ana Yönetici' : 'Süper Yönetici (Özel Yetkili)'}
                              </p>
                            </div>
                          </div>

                          {isCurrent && (
                            <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1">
                              <CheckCircle2 size={11} /> Aktif Oturum
                            </span>
                          )}
                        </div>

                        <ul className="text-[11px] text-gray-300 space-y-1.5 border-t border-gray-800/80 pt-3">
                          <li className="flex items-center gap-1.5">
                            <CheckCircle2 size={13} className="text-emerald-400 shrink-0" />
                            <span>Yönetim paneline şifresiz/doğrudan tam erişim</span>
                          </li>
                          <li className="flex items-center gap-1.5">
                            <CheckCircle2 size={13} className="text-emerald-400 shrink-0" />
                            <span>Sınırsız Cosmo-Puan & Mağaza yetkisi</span>
                          </li>
                          <li className="flex items-center gap-1.5">
                            <CheckCircle2 size={13} className="text-emerald-400 shrink-0" />
                            <span>Bölüm ekleme, silme, düzenleme & D1 yönetimi</span>
                          </li>
                        </ul>
                      </div>
                    );
                  })}
                </div>

                <div className="p-4 bg-purple-950/40 border border-purple-700/40 rounded-2xl space-y-2">
                  <h3 className="text-xs font-bold text-purple-200 flex items-center gap-2">
                    <ShieldCheck size={16} className="text-amber-400" />
                    Güvenlik & Gizlilik Koruması
                  </h3>
                  <p className="text-xs text-gray-300 leading-relaxed">
                    Yönetim Paneli bağlantısı sitedeki tüm ziyaretçiler ve normal üyeler için <strong>tamamen gizlenmiştir</strong> (Header, Menü veya Alt Kısımda yer almaz). Yalnızca yukarıdaki iki e-posta adresi profilini açtığında <strong>"👑 Yönetim Paneli"</strong> sekmesi görünür.
                  </p>
                </div>
              </div>
            )}

            {/* BACKUP & EXPORT TAB */}
            {activeNav === 'backup-export' && (
              <div className="bg-gray-900/90 border border-purple-500/30 rounded-3xl p-4 sm:p-6 lg:p-8 shadow-xl space-y-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-emerald-900/60 border border-emerald-500/40 rounded-2xl text-emerald-300">
                    <Download size={24} />
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-xl font-black text-white">Veri Yedekleme & SQL Dışa Aktarma</h2>
                    <p className="text-xs text-gray-400">Tüm serileri, bölümleri, yorumları ve mağaza temalarını tek tıkla indirin ve dışa aktarın.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gray-950/80 border border-purple-500/30 rounded-2xl p-5 space-y-4 flex flex-col justify-between">
                    <div className="space-y-2">
                      <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        <Database size={16} className="text-amber-400" />
                        Cloudflare D1 SQL Scripti (.sql)
                      </h3>
                      <p className="text-xs text-gray-400 leading-relaxed">
                        Cloudflare D1 panelinde "Execute SQL" ile anında tüm verileri ve tabloları otomatik oluşturacak tam hazır SQL dosyası.
                      </p>
                    </div>

                    <button
                      onClick={() => downloadCloudflareD1Sql(seriesList, comments, shopItems, themeStyles)}
                      className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-extrabold text-xs py-3 rounded-xl shadow-lg transition flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                    >
                      <Download size={16} />
                      Cloudflare D1 SQL İndir
                    </button>
                  </div>

                  <div className="bg-gray-950/80 border border-purple-500/30 rounded-2xl p-5 space-y-4 flex flex-col justify-between">
                    <div className="space-y-2">
                      <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        <HardDrive size={16} className="text-purple-400" />
                        Tam JSON Yedek Dosyası (.json)
                      </h3>
                      <p className="text-xs text-gray-400 leading-relaxed">
                        Tüm seriler, bölümler, kullanıcı geçmişi, yorumlar ve mağaza envanterini içeren taşınabilir yedek dosyası.
                      </p>
                    </div>

                    <button
                      onClick={() => exportBackupData()}
                      className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold text-xs py-3 rounded-xl shadow-lg transition flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                    >
                      <Download size={16} />
                      JSON Yedek İndir
                    </button>
                  </div>

                  <div className="bg-gray-950/80 border border-purple-500/30 rounded-2xl p-5 space-y-4 flex flex-col justify-between">
                    <div className="space-y-2">
                      <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        <FileArchive size={16} className="text-cyan-400" />
                        Kaynak Kod ZIP Arşivi (.zip)
                      </h3>
                      <p className="text-xs text-gray-400 leading-relaxed">
                        Projenin tüm kaynak kodlarını, bileşenlerini ve konfigürasyonlarını sıkıştırılmış ZIP formatında indirin.
                      </p>
                    </div>

                    <button
                      onClick={handleZipDownload}
                      disabled={isZipping}
                      className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-extrabold text-xs py-3 rounded-xl shadow-lg transition flex items-center justify-center gap-2 cursor-pointer active:scale-98 disabled:opacity-50"
                    >
                      <FileArchive size={16} />
                      {isZipping ? 'Arşivleniyor...' : 'Kaynak Kod ZIP İndir'}
                    </button>
                  </div>
                </div>

                <div className="bg-gray-950/80 border border-orange-500/30 rounded-2xl p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileCode size={18} className="text-orange-400" />
                      <h3 className="text-sm font-bold text-white">src/data/mockData.ts Kod Çıktısı</h3>
                    </div>
                    <button
                      onClick={handleCopyMockDataCode}
                      className="px-3 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold flex items-center gap-1.5 transition"
                    >
                      {copiedCode ? '✓ Kopyalandı' : 'Panoya Kopyala'}
                    </button>
                  </div>
                  <p className="text-xs text-gray-400">
                    Mevcut serilerinizi varsayılan mockData.ts dosyanıza yapıştırmak için hazır TypeScript kod bloğunu kopyalayabilirsiniz.
                  </p>
                </div>
              </div>
            )}

            {/* SYSTEM OVERVIEW & METRICS TAB */}
            {activeNav === 'system-overview' && (
              <div className="bg-gray-900/90 border border-purple-500/30 rounded-3xl p-4 sm:p-6 lg:p-8 shadow-xl space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-cyan-900/60 border border-cyan-500/40 rounded-2xl text-cyan-300">
                      <BarChart3 size={24} />
                    </div>
                    <div>
                      <h2 className="text-lg sm:text-xl font-black text-white">Sistem & Altyapı Durumu</h2>
                      <p className="text-xs text-gray-400">Cloudflare D1, R2 nesne deposu ve tarayıcı yerel veri katmanları</p>
                    </div>
                  </div>

                  <button
                    onClick={() => window.location.reload()}
                    className="px-3.5 py-2 rounded-xl bg-purple-900/50 hover:bg-purple-800 border border-purple-500/40 text-purple-200 text-xs font-bold flex items-center gap-1.5 transition"
                  >
                    <RefreshCw size={13} />
                    <span>Yenile</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gray-950/80 border border-gray-800 rounded-2xl p-5 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-300">Cloudflare D1 (SQL)</span>
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full font-bold">Bağlı</span>
                    </div>
                    <p className="text-2xl font-black text-white">{seriesList.length} Seri Kayıtlı</p>
                    <p className="text-[11px] text-gray-400">İlişkisel SQLite / D1 veritabanı aktif ve senkronize.</p>
                  </div>

                  <div className="bg-gray-950/80 border border-gray-800 rounded-2xl p-5 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-300">Cloudflare R2 (Depo)</span>
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full font-bold">Hazır</span>
                    </div>
                    <p className="text-2xl font-black text-white">Maks. 15MB/Dosya</p>
                    <p className="text-[11px] text-gray-400">Kapak ve çizim sayfaları doğrudan R2 nesne deposunda barındırılır.</p>
                  </div>

                  <div className="bg-gray-950/80 border border-gray-800 rounded-2xl p-5 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-300">Yerel Bellek / Cache</span>
                      <span className="text-[10px] bg-purple-500/20 text-purple-300 border border-purple-500/40 px-2 py-0.5 rounded-full font-bold">Senkron</span>
                    </div>
                    <p className="text-2xl font-black text-white">{totalChapters} Bölüm</p>
                    <p className="text-[11px] text-gray-400">Çevrimdışı ve anlık okuma hızlandırması için yerel önbellek.</p>
                  </div>
                </div>

                {/* Genre Breakdown */}
                <div className="bg-gray-950/80 border border-gray-800 rounded-2xl p-5 space-y-3">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider text-purple-300">Tür Dağılımı</h3>
                  <div className="flex flex-wrap gap-2">
                    {['Aksiyon', 'Fantastik', 'Macera', 'Dram', 'Romantik', 'Web Novel', 'Manhwa'].map(genre => {
                      const count = seriesList.filter(s => s.genres?.includes(genre) || s.type === genre).length;
                      return (
                        <div
                          key={genre}
                          className="bg-gray-900 border border-gray-800 px-3 py-1.5 rounded-xl flex items-center gap-2 text-xs"
                        >
                          <span className="text-gray-300 font-medium">{genre}</span>
                          <span className="bg-purple-900/60 text-purple-300 font-bold px-1.5 py-0.5 rounded text-[10px]">
                            {count}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

          </div>

        </main>
      </div>

    </div>
  );
};
