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
  AlertTriangle
} from 'lucide-react';
import { downloadCloudflareD1Sql } from '../utils/cloudflareD1Export';

export const ManagementPanel: React.FC = () => {
  const {
    user,
    seriesList,
    comments,
    bookmarks,
    readingHistory,
    shopItems,
    themeStyles,
    isAdminLoggedIn,
    verifyAdminPassword,
    exportBackupData,
    setView,
    openAuthModal
  } = useApp();

  const [managementTab, setManagementTab] = useState<'admin-suite' | 'system-overview' | 'authorized-accounts' | 'backup-export'>('admin-suite');
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');

  const isSuperAdmin = isAuthorizedAdmin(user?.email);
  const isAccessAllowed = isSuperAdmin || isAdminLoggedIn;

  // Total statistics calculations
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
            <h2 className="text-xl sm:text-2xl font-black text-white">Yönetim Paneli - Gizli Alan</h2>
            <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
              Bu yönetim paneli genel kullanıma kapalıdır ve sadece yetkilendirilmiş kurucu hesaplar (<span className="text-purple-300 font-mono">mikrokosmosfansub@gmail.com</span> ve <span className="text-purple-300 font-mono">aseleliyeva77@gmail.com</span>) tarafından erişilebilir.
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

  // Authorized View
  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-6 animate-fadeIn space-y-6">
      
      {/* Super Admin Top Header Banner */}
      <div className="relative p-6 sm:p-8 bg-gradient-to-r from-purple-950 via-gray-900 to-indigo-950 border-2 border-purple-500/40 rounded-3xl shadow-2xl overflow-hidden flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        <div className="absolute top-0 right-0 w-80 h-80 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex items-center gap-4 relative z-10">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-amber-500 via-purple-600 to-indigo-600 border border-amber-400/60 flex items-center justify-center shadow-xl shrink-0">
            <Crown size={32} className="text-amber-200 animate-pulse" />
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
                Mikrokosmos Yönetim Paneli
              </h1>
              <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] sm:text-xs font-black px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                <ShieldCheck size={13} className="text-amber-400" />
                Süper Yönetici
              </span>
            </div>
            
            <p className="text-xs text-purple-200 font-medium">
              {user ? (
                <>Yetkili Oturum: <span className="text-amber-300 font-mono font-bold">{user.email}</span> ({user.name})</>
              ) : (
                <>PIN ile Güvenli Yönetici Erişimi Sağlandı</>
              )}
            </p>
          </div>
        </div>

        {/* Quick Top Actions */}
        <div className="flex items-center gap-2.5 flex-wrap relative z-10">
          <button
            onClick={() => downloadCloudflareD1Sql(seriesList, comments, shopItems, themeStyles)}
            className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs flex items-center gap-1.5 shadow-lg shadow-amber-900/40 transition active:scale-95 cursor-pointer"
            title="Cloudflare D1 Veritabanı SQL Dışa Aktar"
          >
            <Download size={14} className="text-black" />
            <span>D1 SQL İndir</span>
          </button>

          <button
            onClick={() => exportBackupData()}
            className="px-3.5 py-2 rounded-xl bg-purple-900/80 hover:bg-purple-800 border border-purple-500/40 text-purple-200 text-xs font-bold flex items-center gap-1.5 transition shadow cursor-pointer"
            title="Tüm Siteyi JSON Olarak Yedekle"
          >
            <HardDrive size={14} className="text-purple-300" />
            <span>JSON Yedek</span>
          </button>

          <button
            onClick={() => setView({ type: 'home' })}
            className="px-3.5 py-2 rounded-xl bg-gray-900/90 hover:bg-gray-800 text-gray-300 hover:text-white border border-gray-800 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
          >
            <ArrowLeft size={14} />
            <span>Siteye Dön</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
        <div className="bg-gray-900/90 border border-purple-500/30 rounded-2xl p-3.5 flex items-center gap-3 shadow-lg">
          <div className="w-10 h-10 rounded-xl bg-purple-900/50 border border-purple-500/40 flex items-center justify-center text-purple-300 shrink-0">
            <BookOpen size={18} />
          </div>
          <div>
            <p className="text-[10px] text-gray-400 font-bold uppercase">Toplam Seri</p>
            <p className="text-base sm:text-lg font-black text-white">{seriesList.length}</p>
          </div>
        </div>

        <div className="bg-gray-900/90 border border-purple-500/30 rounded-2xl p-3.5 flex items-center gap-3 shadow-lg">
          <div className="w-10 h-10 rounded-xl bg-indigo-900/50 border border-indigo-500/40 flex items-center justify-center text-indigo-300 shrink-0">
            <Layers size={18} />
          </div>
          <div>
            <p className="text-[10px] text-gray-400 font-bold uppercase">Toplam Bölüm</p>
            <p className="text-base sm:text-lg font-black text-white">{totalChapters}</p>
          </div>
        </div>

        <div className="bg-gray-900/90 border border-purple-500/30 rounded-2xl p-3.5 flex items-center gap-3 shadow-lg">
          <div className="w-10 h-10 rounded-xl bg-pink-900/50 border border-pink-500/40 flex items-center justify-center text-pink-300 shrink-0">
            <MessageSquare size={18} />
          </div>
          <div>
            <p className="text-[10px] text-gray-400 font-bold uppercase">Yorumlar</p>
            <p className="text-base sm:text-lg font-black text-white">{comments.length}</p>
          </div>
        </div>

        <div className="bg-gray-900/90 border border-purple-500/30 rounded-2xl p-3.5 flex items-center gap-3 shadow-lg">
          <div className="w-10 h-10 rounded-xl bg-cyan-900/50 border border-cyan-500/40 flex items-center justify-center text-cyan-300 shrink-0">
            <BookOpen size={18} />
          </div>
          <div>
            <p className="text-[10px] text-gray-400 font-bold uppercase">Manhwa / Çizgi</p>
            <p className="text-base sm:text-lg font-black text-white">{totalManhwas}</p>
          </div>
        </div>

        <div className="bg-gray-900/90 border border-purple-500/30 rounded-2xl p-3.5 flex items-center gap-3 shadow-lg">
          <div className="w-10 h-10 rounded-xl bg-emerald-900/50 border border-emerald-500/40 flex items-center justify-center text-emerald-300 shrink-0">
            <Sparkles size={18} />
          </div>
          <div>
            <p className="text-[10px] text-gray-400 font-bold uppercase">Web Novel</p>
            <p className="text-base sm:text-lg font-black text-white">{totalNovels}</p>
          </div>
        </div>

        <div className="bg-gray-900/90 border border-purple-500/30 rounded-2xl p-3.5 flex items-center gap-3 shadow-lg">
          <div className="w-10 h-10 rounded-xl bg-amber-900/50 border border-amber-500/40 flex items-center justify-center text-amber-300 shrink-0">
            <Database size={18} />
          </div>
          <div>
            <p className="text-[10px] text-gray-400 font-bold uppercase">D1 / R2 Depo</p>
            <p className="text-xs font-black text-emerald-400 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Aktif
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex bg-gray-900/90 border border-purple-500/30 p-1.5 rounded-2xl gap-2 overflow-x-auto no-scrollbar shadow-lg">
        <button
          onClick={() => setManagementTab('admin-suite')}
          className={`px-5 py-2.5 text-xs font-extrabold rounded-xl transition flex items-center gap-2 whitespace-nowrap ${
            managementTab === 'admin-suite'
              ? 'bg-purple-600 text-white shadow-md'
              : 'text-gray-400 hover:text-gray-200 hover:bg-purple-950/40'
          }`}
        >
          <Layers size={15} />
          <span>Admin Paneli (Seriler, Bölümler, D1, İçe Aktar)</span>
        </button>

        <button
          onClick={() => setManagementTab('authorized-accounts')}
          className={`px-5 py-2.5 text-xs font-extrabold rounded-xl transition flex items-center gap-2 whitespace-nowrap ${
            managementTab === 'authorized-accounts'
              ? 'bg-purple-600 text-white shadow-md'
              : 'text-gray-400 hover:text-gray-200 hover:bg-purple-950/40'
          }`}
        >
          <Users size={15} className="text-amber-400" />
          <span>Yetkili Hesaplar & Güvenlik</span>
        </button>

        <button
          onClick={() => setManagementTab('system-overview')}
          className={`px-5 py-2.5 text-xs font-extrabold rounded-xl transition flex items-center gap-2 whitespace-nowrap ${
            managementTab === 'system-overview'
              ? 'bg-purple-600 text-white shadow-md'
              : 'text-gray-400 hover:text-gray-200 hover:bg-purple-950/40'
          }`}
        >
          <Database size={15} className="text-cyan-400" />
          <span>Sistem & Veritabanı Durumu</span>
        </button>

        <button
          onClick={() => setManagementTab('backup-export')}
          className={`px-5 py-2.5 text-xs font-extrabold rounded-xl transition flex items-center gap-2 whitespace-nowrap ${
            managementTab === 'backup-export'
              ? 'bg-purple-600 text-white shadow-md'
              : 'text-gray-400 hover:text-gray-200 hover:bg-purple-950/40'
          }`}
        >
          <Download size={15} className="text-emerald-400" />
          <span>Yedekleme & SQL Aktarımı</span>
        </button>
      </div>

      {/* Tab Contents */}
      {managementTab === 'admin-suite' && (
        <div className="space-y-6">
          {/* Direct Embedded AdminModal Engine */}
          <AdminModal />
        </div>
      )}

      {managementTab === 'authorized-accounts' && (
        <div className="bg-gray-900/90 border border-purple-500/30 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
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
              Güvenlik & Gizlilik Notu
            </h3>
            <p className="text-xs text-gray-300 leading-relaxed">
              Yönetim Paneli bağlantısı ve butonları sitedeki tüm ziyaretçiler ve normal üyeler için <strong>tamamen gizlenmiştir</strong> (Header, Menü veya Alt Kısımda yer almaz). Yalnızca yukarıdaki iki e-posta adresi profilini açtığında <strong>"👑 Yönetim Paneli"</strong> sekmesi görünür.
            </p>
          </div>
        </div>
      )}

      {managementTab === 'system-overview' && (
        <div className="bg-gray-900/90 border border-purple-500/30 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-cyan-900/60 border border-cyan-500/40 rounded-2xl text-cyan-300">
                <Database size={24} />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-black text-white">Sistem & Altyapı Durumu</h2>
                <p className="text-xs text-gray-400">Cloudflare D1, R2 ve yerel tarayıcı veri katmanları</p>
              </div>
            </div>

            <button
              onClick={() => window.location.reload()}
              className="px-3 py-1.5 rounded-xl bg-purple-900/50 hover:bg-purple-800 border border-purple-500/40 text-purple-200 text-xs font-bold flex items-center gap-1.5 transition"
            >
              <RefreshCw size={13} />
              <span>Yenile</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-950/80 border border-gray-800 rounded-2xl p-5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-300">Cloudflare D1</span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full font-bold">Bağlı</span>
              </div>
              <p className="text-2xl font-black text-white">{seriesList.length} Seri</p>
              <p className="text-[11px] text-gray-400">İlişkisel SQL veritabanı aktif ve senkronize.</p>
            </div>

            <div className="bg-gray-950/80 border border-gray-800 rounded-2xl p-5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-300">Cloudflare R2</span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full font-bold">Hazır</span>
              </div>
              <p className="text-2xl font-black text-white">Maks. 8MB/Dosya</p>
              <p className="text-[11px] text-gray-400">Kapak ve çizim sayfaları doğrudan R2 nesne deposunda.</p>
            </div>

            <div className="bg-gray-950/80 border border-gray-800 rounded-2xl p-5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-300">Yerel Bellek / Cache</span>
                <span className="text-[10px] bg-purple-500/20 text-purple-300 border border-purple-500/40 px-2 py-0.5 rounded-full font-bold">Yerel Senkron</span>
              </div>
              <p className="text-2xl font-black text-white">{totalChapters} Bölüm</p>
              <p className="text-[11px] text-gray-400">Çevrimdışı ve anlık okuma hızlandırması.</p>
            </div>
          </div>
        </div>
      )}

      {managementTab === 'backup-export' && (
        <div className="bg-gray-900/90 border border-purple-500/30 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-900/60 border border-emerald-500/40 rounded-2xl text-emerald-300">
              <Download size={24} />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-white">Veri Yedekleme & SQL Dışa Aktarma</h2>
              <p className="text-xs text-gray-400">Tüm serileri, bölümleri, yorumları ve mağaza temalarını tek tıkla indirin.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-950/80 border border-purple-500/30 rounded-2xl p-5 space-y-4">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Database size={16} className="text-amber-400" />
                  Cloudflare D1 SQL Scripti (.sql)
                </h3>
                <p className="text-xs text-gray-400 mt-1">
                  Cloudflare D1 panelinde "Execute SQL" ile anında tüm verileri ve tabloları oluşturabileceğiniz tam hazır SQL komut dosyası.
                </p>
              </div>

              <button
                onClick={() => downloadCloudflareD1Sql(seriesList, comments, shopItems, themeStyles)}
                className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-extrabold text-xs py-3 rounded-xl shadow-lg transition flex items-center justify-center gap-2 cursor-pointer active:scale-98"
              >
                <Download size={16} />
                Cloudflare D1 SQL Dosyasını İndir (.sql)
              </button>
            </div>

            <div className="bg-gray-950/80 border border-purple-500/30 rounded-2xl p-5 space-y-4">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <HardDrive size={16} className="text-purple-400" />
                  Tam JSON Yedek Dosyası (.json)
                </h3>
                <p className="text-xs text-gray-400 mt-1">
                  Tüm seriler, bölümler, yorumlar ve kullanıcı verilerini içeren taşınabilir JSON yedeği.
                </p>
              </div>

              <button
                onClick={() => exportBackupData()}
                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold text-xs py-3 rounded-xl shadow-lg transition flex items-center justify-center gap-2 cursor-pointer active:scale-98"
              >
                <Download size={16} />
                JSON Yedek Dosyasını İndir (.json)
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
