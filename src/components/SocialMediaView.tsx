import React, { useState } from 'react';
import {
  ArrowUpRight,
  Check,
  Copy,
  Globe,
  MessageCircle,
  Share2,
  Users,
  BookOpen,
  Image as ImageIcon,
  GraduationCap
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { SaturnIcon } from './SaturnIcon';

interface SocialPlatform {
  id: string;
  name: string;
  handle: string;
  category: 'topluluk' | 'sosyal' | 'erisim';
  categoryLabel: string;
  url: string;
  description: string;
  highlights: string[];
  ctaText: string;
  accentColor: string;
  hoverBorder: string;
  glowStyle: string;
  iconBg: string;
  featured?: boolean;
  renderIcon: () => React.ReactNode;
}

export const SocialMediaView: React.FC = () => {
  const { siteBranding, setView, showToast, seriesList } = useApp();
  const [selectedTab, setSelectedTab] = useState<'all' | 'topluluk' | 'sosyal' | 'erisim'>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const totalChapters = seriesList.reduce((acc, s) => acc + (s.chapters?.length || 0), 0);

  const platforms: SocialPlatform[] = [
    {
      id: 'discord',
      name: 'Discord Topluluğu',
      handle: 'discord.gg/53p43EW3jk',
      category: 'topluluk',
      categoryLabel: 'Resmi Topluluk Sunucusu',
      url: 'https://discord.gg/53p43EW3jk',
      description:
        'Yeni bölümler yayınlandığında ilk haberdar ol, diğer manhwa ve webtoon okuyucularıyla teorileri tartış, çekilişlere ve çeviri ekibi sohbetlerine katıl.',
      highlights: ['Anlık Bölüm Rolleri', 'Okuyucu Sohbet Odaları', 'Ekip & Çevirmen İletişimi'],
      ctaText: 'Sunucuya Katıl',
      accentColor: 'text-indigo-300',
      hoverBorder: 'hover:border-indigo-400/60',
      glowStyle: 'from-indigo-600/20 via-purple-600/10 to-transparent',
      iconBg: 'bg-indigo-500/15 text-indigo-300 border-indigo-400/30',
      featured: true,
      renderIcon: () => (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7">
          <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z" />
        </svg>
      )
    },
    {
      id: 'instagram',
      name: 'Instagram',
      handle: '@mikrokosmos.fb',
      category: 'sosyal',
      categoryLabel: 'Görsel & Seri Tanıtımları',
      url: 'https://www.instagram.com/mikrokosmos.fb?igsh=MTVnd3Y2NzQzbnc0Mw==',
      description:
        'Yeni seri duyuruları, karakter kesitleri, manhwa öneri postları ve hikaye anketleri için resmi Instagram sayfamızı takip edin.',
      highlights: ['Yeni Seri Tanıtımları', 'Özel Kesitler', 'Hikaye Duyuruları'],
      ctaText: "Instagram'da Takip Et",
      accentColor: 'text-pink-300',
      hoverBorder: 'hover:border-pink-400/60',
      glowStyle: 'from-pink-600/20 via-rose-500/10 to-transparent',
      iconBg: 'bg-pink-500/15 text-pink-300 border-pink-400/30',
      renderIcon: () => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
          <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
          <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
          <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
        </svg>
      )
    },
    {
      id: 'whatsapp',
      name: 'WhatsApp Kanalı',
      handle: 'Resmi Bildirim Kanalı',
      category: 'erisim',
      categoryLabel: 'Anlık Bildirim & Duyuru',
      url: 'https://whatsapp.com/channel/0029Vb7tIun8fewqhUTTUH13',
      description:
        'Numaranız gizli kalarak tek tıkla WhatsApp kanalımıza abone olun; yeni bölümler ve adres güncellemeleri anında telefonunuza gelsin.',
      highlights: ['Gizli Numara Güvenliği', 'Hızlı Bölüm Linkleri', 'Alan Adı Duyuruları'],
      ctaText: 'Kanala Abone Ol',
      accentColor: 'text-emerald-300',
      hoverBorder: 'hover:border-emerald-400/60',
      glowStyle: 'from-emerald-600/20 via-teal-500/10 to-transparent',
      iconBg: 'bg-emerald-500/15 text-emerald-300 border-emerald-400/30',
      renderIcon: () => (
        <MessageCircle className="w-6 h-6" />
      )
    },
    {
      id: 'tiktok',
      name: 'TikTok',
      handle: '@mikrokosmosfansub',
      category: 'sosyal',
      categoryLabel: 'Kısa Video & Editler',
      url: 'https://www.tiktok.com/@mikrokosmosfansub?_r=1&_t=ZS-96bHCpcZhCO',
      description:
        'Çevirdiğimiz serilerden etkileyici sahne editleri, okuma önerileri ve eğlenceli fansub kamera arkası videoları.',
      highlights: ['Manhwa Editleri', 'Seri Önerileri', 'Kısa İçerikler'],
      ctaText: "TikTok'ta Göz At",
      accentColor: 'text-purple-300',
      hoverBorder: 'hover:border-purple-400/60',
      glowStyle: 'from-purple-600/20 via-fuchsia-500/10 to-transparent',
      iconBg: 'bg-purple-500/15 text-purple-300 border-purple-400/30',
      renderIcon: () => (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
          <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
        </svg>
      )
    },
    {
      id: 'backup-site',
      name: 'Yedek Erişim Portalı',
      handle: 'mikrokosmosfblink.blogspot.com',
      category: 'erisim',
      categoryLabel: 'Alternatif Giriş Adresi',
      url: 'https://mikrokosmosfblink.blogspot.com/?m=0',
      description:
        'Olası erişim engelleri veya alan adı değişikliklerinde güncel site bağlantımıza her zaman ulaşabileceğiniz resmi yedek bilgi sayfamız.',
      highlights: ['Kesintisiz Erişim', 'Güncel Domain Bilgilendirmesi', 'Yer İmlerine Ekleyin'],
      ctaText: 'Yedek Siteyi Aç',
      accentColor: 'text-sky-300',
      hoverBorder: 'hover:border-sky-400/60',
      glowStyle: 'from-sky-600/20 via-blue-500/10 to-transparent',
      iconBg: 'bg-sky-500/15 text-sky-300 border-sky-400/30',
      renderIcon: () => (
        <Globe className="w-6 h-6" />
      )
    }
  ];

  const handleCopyLink = (platform: SocialPlatform, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard?.writeText(platform.url);
    setCopiedId(platform.id);
    showToast({
      title: 'Bağlantı Kopyalandı',
      message: `${platform.name} adresi panoya kopyalandı.`,
      type: 'success'
    });
    setTimeout(() => {
      setCopiedId(prev => (prev === platform.id ? null : prev));
    }, 2200);
  };

  const handleSharePage = () => {
    const shareUrl = window.location.href;
    navigator.clipboard?.writeText(shareUrl);
    showToast({
      title: 'Sayfa Bağlantısı Kopyalandı',
      message: 'Sosyal medya merkezimizin bağlantısını arkadaşlarınızla paylaşabilirsiniz.',
      type: 'info'
    });
  };

  const featuredPlatform = platforms.find(p => p.featured) || platforms[0];
  const secondaryPlatforms = platforms.filter(p => {
    if (selectedTab === 'all') return !p.featured;
    return p.category === selectedTab;
  });

  const showFeaturedBanner = selectedTab === 'all' || selectedTab === featuredPlatform.category;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-8 sm:space-y-10">
      {/* EDITORIAL HEADER & FILTER BAR */}
      <header className="relative rounded-3xl bg-[#0d071b] border border-purple-500/25 p-6 sm:p-10 overflow-hidden shadow-2xl">
        <div
          className="absolute -top-32 -right-24 w-96 h-96 rounded-full bg-purple-600/15 blur-3xl pointer-events-none"
          aria-hidden="true"
        />
        <div
          className="absolute -bottom-32 -left-24 w-80 h-80 rounded-full bg-pink-600/10 blur-3xl pointer-events-none"
          aria-hidden="true"
        />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="flex items-center gap-2.5 text-xs font-semibold text-purple-300/90 tracking-wide">
              <SaturnIcon size={20} />
              <span>{siteBranding.siteTitle || 'Mikrokosmos'} Fansub</span>
              <span aria-hidden="true" className="text-gray-600">·</span>
              <span className="text-pink-300/90">{siteBranding.siteSlogan || 'Shine, Dream, Smile'}</span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight leading-tight">
              Galaksimizin Resmi Sosyal Medya Ağları
            </h1>

            <p className="text-sm sm:text-base text-gray-300/90 leading-relaxed">
              Yeni bölümlerden anında haberdar olmak, okuma etkinliklerine katılmak ve güncel alan adı duyurularını kaçırmamak için resmi kanallarımızı takip edin.
            </p>

            {/* Unboxed Clean Typographic Metadata */}
            <div className="pt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-400 font-medium tabular-nums">
              <span>5 Resmi Kanal</span>
              <span aria-hidden="true">·</span>
              <span>{seriesList.length} Aktif Seri</span>
              <span aria-hidden="true">·</span>
              <span>{totalChapters}+ Türkçe Bölüm</span>
              <span aria-hidden="true">·</span>
              <span>Kesintisiz Güncel Bağlantılar</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={handleSharePage}
              className="px-4 py-2.5 rounded-xl bg-gray-900/90 hover:bg-gray-800 text-gray-200 hover:text-white border border-gray-800 text-xs sm:text-sm font-bold flex items-center gap-2 transition cursor-pointer"
            >
              <Share2 size={15} className="text-purple-400" />
              <span>Bu Sayfayı Paylaş</span>
            </button>
          </div>
        </div>

        {/* Interactive Segmented Filter Controls */}
        <div className="relative z-10 mt-7 pt-6 border-t border-white/10 flex flex-wrap items-center justify-between gap-4">
          <div className="inline-flex flex-wrap items-center gap-1 p-1 rounded-xl bg-gray-950/90 border border-gray-800/90">
            {[
              { id: 'all', label: 'Tüm Kanallar (5)' },
              { id: 'topluluk', label: 'Topluluk & Sohbet' },
              { id: 'sosyal', label: 'Sosyal & Video' },
              { id: 'erisim', label: 'Bildirim & Yedek Site' }
            ].map(tab => {
              const active = selectedTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setSelectedTab(tab.id as any)}
                  className={`px-3.5 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                    active
                      ? 'bg-purple-600 text-white shadow-sm'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          <p className="text-xs text-gray-400">
            İstediğiniz platformun bağlantısını tek tıkla kopyalayabilir veya doğrudan açabilirsiniz.
          </p>
        </div>
      </header>

      {/* FOCAL ANCHOR: FEATURED DISCORD COMMUNITY SPOTLIGHT */}
      {showFeaturedBanner && selectedTab === 'all' && (
        <section className="relative rounded-3xl bg-gradient-to-br from-[#161032] via-[#110a24] to-[#0b0616] border border-indigo-400/35 p-6 sm:p-8 shadow-2xl overflow-hidden group">
          <div
            className="absolute -right-16 -top-16 w-72 h-72 rounded-full bg-indigo-500/15 blur-3xl pointer-events-none group-hover:bg-indigo-500/25 transition-colors duration-500"
            aria-hidden="true"
          />

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            <div className="lg:col-span-8 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-indigo-500/20 border border-indigo-400/40 flex items-center justify-center text-indigo-300 shadow-lg shrink-0">
                  {featuredPlatform.renderIcon()}
                </div>
                <div>
                  <div className="flex items-center gap-2 text-xs text-indigo-300 font-semibold">
                    <span>Ana Topluluk Merkezi</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono">{featuredPlatform.handle}</span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                    {featuredPlatform.name}
                  </h2>
                </div>
              </div>

              <p className="text-sm sm:text-base text-gray-200/90 leading-relaxed max-w-2xl">
                {featuredPlatform.description}
              </p>

              {/* Unboxed Feature Metadata */}
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-indigo-200/80 font-medium">
                {featuredPlatform.highlights.map((item, idx) => (
                  <React.Fragment key={item}>
                    {idx > 0 && <span aria-hidden="true" className="text-indigo-400/50">·</span>}
                    <span>{item}</span>
                  </React.Fragment>
                ))}
              </div>
            </div>

            <div className="lg:col-span-4 flex flex-col sm:flex-row lg:flex-col gap-3 justify-end">
              <a
                href={featuredPlatform.url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3.5 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-sm shadow-lg shadow-indigo-950/60 flex items-center justify-center gap-2 transition active:scale-[0.99]"
              >
                <span>Discord Sunucusuna Katıl</span>
                <ArrowUpRight size={17} />
              </a>

              <button
                type="button"
                onClick={e => handleCopyLink(featuredPlatform, e)}
                className="w-full py-2.5 px-4 rounded-xl bg-gray-950/80 hover:bg-gray-900 text-gray-300 hover:text-white border border-white/10 text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer"
              >
                {copiedId === featuredPlatform.id ? (
                  <>
                    <Check size={14} className="text-emerald-400" />
                    <span className="text-emerald-300">Davet Linki Kopyalandı</span>
                  </>
                ) : (
                  <>
                    <Copy size={14} />
                    <span>Davet Linkini Kopyala</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </section>
      )}

      {/* ARCHITECTURAL BENTO GRID OF PLATFORMS */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {secondaryPlatforms.map(platform => {
          const isCopied = copiedId === platform.id;
          return (
            <div
              key={platform.id}
              className={`group relative rounded-2xl bg-[#0e081c] border border-white/10 ${platform.hoverBorder} p-6 flex flex-col justify-between gap-6 transition-all duration-300 hover:-translate-y-0.5 shadow-xl overflow-hidden`}
            >
              <div
                className={`absolute inset-0 bg-gradient-to-br ${platform.glowStyle} opacity-70 group-hover:opacity-100 transition-opacity pointer-events-none`}
                aria-hidden="true"
              />

              <div className="relative z-10 space-y-4">
                {/* Top Row: Icon + Unboxed Metadata + Copy Link Button */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div
                      className={`w-12 h-12 rounded-xl border flex items-center justify-center shrink-0 ${platform.iconBg}`}
                    >
                      {platform.renderIcon()}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <span className={platform.accentColor}>{platform.categoryLabel}</span>
                      </div>
                      <h3 className="text-lg font-black text-white truncate mt-0.5">
                        {platform.name}
                      </h3>
                      <p className="text-xs font-mono text-gray-400 truncate">
                        {platform.handle}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={e => handleCopyLink(platform, e)}
                    title="Bağlantıyı Kopyala"
                    className="p-2.5 rounded-xl bg-gray-950/80 hover:bg-gray-900 text-gray-400 hover:text-white border border-white/10 transition shrink-0 cursor-pointer"
                  >
                    {isCopied ? (
                      <Check size={15} className="text-emerald-400" />
                    ) : (
                      <Copy size={15} />
                    )}
                  </button>
                </div>

                {/* Description */}
                <p className="text-xs sm:text-sm text-gray-300/90 leading-relaxed">
                  {platform.description}
                </p>

                {/* Clean Unboxed Highlights */}
                <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-gray-400">
                  {platform.highlights.map((h, i) => (
                    <React.Fragment key={h}>
                      {i > 0 && <span aria-hidden="true" className="text-gray-600">·</span>}
                      <span>{h}</span>
                    </React.Fragment>
                  ))}
                </div>
              </div>

              {/* Action Footer */}
              <div className="relative z-10 pt-4 border-t border-white/10 flex items-center justify-between gap-3">
                <span className="text-xs text-gray-400 truncate">
                  Resmi Mikrokosmos Bağlantısı
                </span>

                <a
                  href={platform.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-purple-600 text-white text-xs font-extrabold flex items-center gap-1.5 transition shrink-0"
                >
                  <span>{platform.ctaText}</span>
                  <ArrowUpRight size={14} />
                </a>
              </div>
            </div>
          );
        })}
      </section>

      {/* COMMUNITY & SITE SHORTCUTS FOOTER SECTION */}
      <section className="rounded-2xl bg-[#0c0718] border border-purple-500/20 p-6 sm:p-8 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        <div className="space-y-1.5 max-w-xl">
          <h3 className="text-base sm:text-lg font-black text-white">
            Mikrokosmos Çeviri & Edit Ekibine Katılmak İster misiniz?
          </h3>
          <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">
            Çevirmen, dizgici (typesetter), temizleyici (cleaner) veya redaktör olarak aramıza katılabilir ya da ücretsiz editörlük derslerimizle sıfırdan öğrenebilirsiniz.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
          <button
            type="button"
            onClick={() => setView({ type: 'join-team' })}
            className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-extrabold flex items-center gap-2 transition cursor-pointer"
          >
            <Users size={15} />
            <span>Ekip Başvurusu Yap</span>
          </button>

          <button
            type="button"
            onClick={() => setView({ type: 'lessons' })}
            className="px-4 py-2.5 rounded-xl bg-gray-900 hover:bg-gray-800 text-gray-200 hover:text-white border border-gray-800 text-xs font-bold flex items-center gap-2 transition cursor-pointer"
          >
            <GraduationCap size={15} className="text-emerald-400" />
            <span>Editörlük Dersleri</span>
          </button>

          <button
            type="button"
            onClick={() => setView({ type: 'wallpapers' })}
            className="px-4 py-2.5 rounded-xl bg-gray-900 hover:bg-gray-800 text-gray-200 hover:text-white border border-gray-800 text-xs font-bold flex items-center gap-2 transition cursor-pointer"
          >
            <ImageIcon size={15} className="text-pink-400" />
            <span>Duvar Kağıtları</span>
          </button>

          <button
            type="button"
            onClick={() => setView({ type: 'series-list' })}
            className="px-4 py-2.5 rounded-xl bg-gray-900 hover:bg-gray-800 text-gray-200 hover:text-white border border-gray-800 text-xs font-bold flex items-center gap-2 transition cursor-pointer"
          >
            <BookOpen size={15} className="text-purple-400" />
            <span>Tüm Seriler</span>
          </button>
        </div>
      </section>
    </div>
  );
};
