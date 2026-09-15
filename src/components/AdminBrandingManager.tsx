import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ImageUploadField } from './ImageUploadField';
import { SaturnIcon } from './SaturnIcon';
import {
  Palette,
  Sparkles,
  Save,
  RotateCcw,
  CheckCircle2,
  Globe,
  Image as ImageIcon,
  Check,
  ExternalLink,
  Info,
  Layers,
  Sparkle
} from 'lucide-react';

export const AdminBrandingManager: React.FC = () => {
  const { siteBranding, updateSiteBranding, resetSiteBranding, showToast } = useApp();

  const [logoUrl, setLogoUrl] = useState<string>(siteBranding.logoUrl || '');
  const [faviconUrl, setFaviconUrl] = useState<string>(siteBranding.faviconUrl || '');
  const [siteTitle, setSiteTitle] = useState<string>(siteBranding.siteTitle || 'Mikrokosmos');
  const [siteSlogan, setSiteSlogan] = useState<string>(siteBranding.siteSlogan || 'FANSUB');
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateSiteBranding({
      logoUrl: logoUrl.trim(),
      faviconUrl: faviconUrl.trim(),
      siteTitle: siteTitle.trim() || 'Mikrokosmos',
      siteSlogan: siteSlogan.trim() || 'FANSUB'
    });

    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);

    showToast({
      title: 'Logo & İkon Güncellendi! ✨',
      message: 'Site logosu ve sekme ikonu (favicon) başarıyla uygulandı ve kaydedildi.',
      type: 'success'
    });
  };

  const handleResetToDefault = () => {
    if (window.confirm('Logo ve favicon ayarlarını varsayılan kozmik Satürn temasına sıfırlamak istediğinize emin misiniz?')) {
      resetSiteBranding();
      setLogoUrl('');
      setFaviconUrl('');
      setSiteTitle('Mikrokosmos');
      setSiteSlogan('FANSUB');

      showToast({
        title: 'Varsayılana Sıfırlandı 🔄',
        message: 'Logo ve favicon varsayılan Satürn neon tasarımına döndürüldü.',
        type: 'info'
      });
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-purple-950/80 via-purple-900/50 to-indigo-950/80 border border-purple-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3.5 bg-gradient-to-br from-pink-500 to-purple-600 rounded-2xl text-white shadow-lg shadow-purple-900/50">
              <Palette size={28} />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
                <span>Site Logosu & Sekme İkonu (Favicon)</span>
                <Sparkles size={20} className="text-pink-400 animate-pulse" />
              </h2>
              <p className="text-xs sm:text-sm text-purple-200/80 mt-0.5">
                Sitenin üst menü logosunu, alt bilgi logosunu ve tarayıcı sekmesindeki ikonu buradan resim yükleyerek değiştirebilirsiniz.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleResetToDefault}
              className="px-4 py-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-200 hover:text-white border border-gray-700 text-xs font-bold transition flex items-center gap-2 cursor-pointer active:scale-95"
              title="Varsayılan Satürn ikonuna geri döndür"
            >
              <RotateCcw size={14} />
              <span>Varsayılana Sıfırla</span>
            </button>
          </div>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* 1. SECTION: SITE LOGO (HEADER & FOOTER) */}
          <div className="bg-gray-900/90 border border-purple-500/30 rounded-3xl p-4 sm:p-6 lg:p-8 shadow-xl space-y-6 flex flex-col justify-between">
            <div className="space-y-5">
              <div className="flex items-center justify-between border-b border-gray-800 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-pink-950/60 border border-pink-500/40 rounded-xl text-pink-300">
                    <ImageIcon size={18} />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white">1. Ana Site Logosu</h3>
                    <p className="text-[11px] text-gray-400">Üst çubuk (Header) ve alt bilgide (Footer) görünen logo</p>
                  </div>
                </div>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full bg-pink-950/50 text-pink-300 border border-pink-500/30">
                  Şeffaf PNG / SVG
                </span>
              </div>

              {/* Upload Field */}
              <ImageUploadField
                label="Logo Görseli Yükle veya URL Girin"
                value={logoUrl}
                onChange={setLogoUrl}
                placeholder="Şeffaf arka planlı PNG/SVG/WEBP logo URL veya dosya yükleyin"
                aspectRatio="square"
                helpText="Şeffaf arka planlı (transparent PNG veya SVG) görseller en yüksek kalitede görünür."
              />

              {/* Logo Quick Reset Option */}
              {logoUrl && (
                <button
                  type="button"
                  onClick={() => setLogoUrl('')}
                  className="text-xs text-pink-400 hover:text-pink-300 flex items-center gap-1.5 transition cursor-pointer font-medium"
                >
                  <RotateCcw size={12} />
                  <span>Sadece Logoyu Varsayılan Satürn İkonuna Döndür</span>
                </button>
              )}
            </div>

            {/* LIVE PREVIEW BOX FOR HEADER LOGO */}
            <div className="mt-4 pt-4 border-t border-gray-800 space-y-2">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
                Canlı Başlık (Header) Görünümü Önizlemesi:
              </span>
              <div className="bg-gradient-to-r from-purple-900 via-purple-950 to-indigo-950 p-4 rounded-2xl border border-purple-500/30 flex items-center justify-between shadow-inner">
                <div className="flex items-center gap-2.5">
                  <div className="relative flex items-center justify-center">
                    {logoUrl && logoUrl.trim() ? (
                      <img
                        src={logoUrl.trim()}
                        alt="Önizleme Logo"
                        className="w-10 h-10 object-contain drop-shadow-[0_0_12px_rgba(236,72,153,0.6)] bg-transparent"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                          if (fallback) fallback.style.display = 'block';
                        }}
                      />
                    ) : (
                      <SaturnIcon size={38} className="drop-shadow-[0_0_12px_rgba(236,72,153,0.6)]" />
                    )}
                    {logoUrl && (
                      <div style={{ display: 'none' }}>
                        <SaturnIcon size={38} className="drop-shadow-[0_0_12px_rgba(236,72,153,0.6)]" />
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col">
                    <span className="font-black text-lg text-white leading-none">
                      {siteTitle || 'Mikrokosmos'}
                    </span>
                    <span className="text-[9px] uppercase tracking-[0.25em] text-pink-300 font-extrabold mt-1 leading-none">
                      {siteSlogan || 'FANSUB'}
                    </span>
                  </div>
                </div>

                <span className="text-[10px] font-bold text-purple-300 bg-purple-950/80 px-2.5 py-1 rounded-lg border border-purple-500/30">
                  Şeffaf & Çerçevesiz
                </span>
              </div>
            </div>
          </div>

          {/* 2. SECTION: BROWSER TAB ICON (FAVICON) */}
          <div className="bg-gray-900/90 border border-purple-500/30 rounded-3xl p-4 sm:p-6 lg:p-8 shadow-xl space-y-6 flex flex-col justify-between">
            <div className="space-y-5">
              <div className="flex items-center justify-between border-b border-gray-800 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-cyan-950/60 border border-cyan-500/40 rounded-xl text-cyan-300">
                    <Globe size={18} />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white">2. Tarayıcı Sekme İkonu (Favicon)</h3>
                    <p className="text-[11px] text-gray-400">Tarayıcının üst sekmesinde görünen küçük web sitesi ikonu</p>
                  </div>
                </div>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full bg-cyan-950/50 text-cyan-300 border border-cyan-500/30">
                  Sekme İkonu
                </span>
              </div>

              {/* Upload Field */}
              <ImageUploadField
                label="Sekme İkonu (Favicon) Yükle veya URL Girin"
                value={faviconUrl}
                onChange={setFaviconUrl}
                placeholder="Favicon için kare PNG, ICO veya SVG görsel yükleyin"
                aspectRatio="square"
                helpText="Önerilen boyut: 64x64 veya 128x128 piksel kare şeffaf PNG/SVG dosyası."
              />

              {/* Favicon Quick Reset Option */}
              {faviconUrl && (
                <button
                  type="button"
                  onClick={() => setFaviconUrl('')}
                  className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1.5 transition cursor-pointer font-medium"
                >
                  <RotateCcw size={12} />
                  <span>Sadece Favicon'u Varsayılan Satürn İkonuna Döndür</span>
                </button>
              )}
            </div>

            {/* LIVE PREVIEW BOX FOR BROWSER TAB (FAVICON) */}
            <div className="mt-4 pt-4 border-t border-gray-800 space-y-2">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
                Tarayıcı Sekmesi Simülasyonu (Ekranınızdaki Görünüm):
              </span>
              
              {/* Browser Window Mockup */}
              <div className="bg-gray-950 rounded-2xl border border-gray-800 p-3 space-y-2.5 shadow-inner">
                {/* Browser Tab Bar */}
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 px-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500/80 inline-block" />
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block" />
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block" />
                  </div>

                  {/* Simulated Tab */}
                  <div className="bg-gray-900 border border-purple-500/30 rounded-t-xl px-3 py-1.5 flex items-center gap-2 max-w-xs shadow-md">
                    <div className="w-4 h-4 flex items-center justify-center shrink-0">
                      {faviconUrl && faviconUrl.trim() ? (
                        <img
                          src={faviconUrl.trim()}
                          alt="Sekme İkonu"
                          className="w-4 h-4 object-contain"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                            if (fallback) fallback.style.display = 'block';
                          }}
                        />
                      ) : (
                        <SaturnIcon size={16} />
                      )}
                      {faviconUrl && (
                        <div style={{ display: 'none' }}>
                          <SaturnIcon size={16} />
                        </div>
                      )}
                    </div>
                    <span className="text-[11px] font-bold text-gray-200 truncate max-w-[160px]">
                      {siteTitle || 'Mikrokosmos Fansub'} - Türkçe Webtoon...
                    </span>
                    <span className="text-gray-500 text-[10px] ml-auto hover:text-white">✕</span>
                  </div>
                </div>

                <div className="bg-gray-900/60 rounded-xl px-3 py-1.5 flex items-center gap-2 text-[11px] text-gray-400 font-mono border border-gray-800/80">
                  <span className="text-emerald-400 text-xs">🔒</span>
                  <span className="text-gray-300 truncate">https://mikrokosmosfansub.com</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 3. SECTION: SITE TITLE & SLOGAN TEXT */}
        <div className="bg-gray-900/90 border border-purple-500/30 rounded-3xl p-4 sm:p-6 lg:p-8 shadow-xl space-y-5">
          <div className="flex items-center gap-2.5 border-b border-gray-800 pb-4">
            <div className="p-2 bg-amber-950/60 border border-amber-500/40 rounded-xl text-amber-300">
              <Sparkle size={18} />
            </div>
            <div>
              <h3 className="text-base font-black text-white">3. Site İsmi & Alt Başlık</h3>
              <p className="text-[11px] text-gray-400">Logonun yanında yer alan marka adı ve slogan</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-300 mb-1.5">
                Site Ana Başlığı:
              </label>
              <input
                type="text"
                value={siteTitle}
                onChange={(e) => setSiteTitle(e.target.value)}
                placeholder="Mikrokosmos"
                className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white font-bold focus:outline-none focus:border-purple-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-300 mb-1.5">
                Alt Slogan / Rozet:
              </label>
              <input
                type="text"
                value={siteSlogan}
                onChange={(e) => setSiteSlogan(e.target.value)}
                placeholder="FANSUB"
                className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white font-bold focus:outline-none focus:border-purple-500 transition"
              />
            </div>
          </div>
        </div>

        {/* SUBMIT BUTTON BAR */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="submit"
            className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-600 hover:from-pink-400 hover:to-indigo-500 text-white font-black text-sm shadow-xl shadow-purple-900/40 transition active:scale-95 flex items-center gap-2 cursor-pointer"
          >
            {isSaved ? (
              <>
                <CheckCircle2 size={18} className="text-emerald-300" />
                <span>Ayarlar Kaydedildi!</span>
              </>
            ) : (
              <>
                <Save size={18} />
                <span>Logoyu & İkonu Kaydet ve Uygula</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
