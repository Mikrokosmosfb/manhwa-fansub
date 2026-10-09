import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  DollarSign,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Code,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  BookOpen,
  LayoutTemplate,
  ShieldAlert,
  HelpCircle,
  Copy,
  Eye,
  Trash2
} from 'lucide-react';
import { AdSettings, DEFAULT_AD_SETTINGS } from '../types';

export const AdminAdManager: React.FC = () => {
  const { adSettings, updateAdSettings, resetAdSettings, showToast } = useApp();

  const [form, setForm] = useState<AdSettings>({
    popadsEnabled: adSettings.popadsEnabled || false,
    popadsCode: adSettings.popadsCode || '',
    readerAdEnabled: adSettings.readerAdEnabled || false,
    readerAdCode: adSettings.readerAdCode || '',
    topBannerEnabled: adSettings.topBannerEnabled || false,
    topBannerCode: adSettings.topBannerCode || '',
    bottomBannerEnabled: adSettings.bottomBannerEnabled || false,
    bottomBannerCode: adSettings.bottomBannerCode || '',
    customHeadScript: adSettings.customHeadScript || ''
  });

  useEffect(() => {
    setForm({
      popadsEnabled: adSettings.popadsEnabled || false,
      popadsCode: adSettings.popadsCode || '',
      readerAdEnabled: adSettings.readerAdEnabled || false,
      readerAdCode: adSettings.readerAdCode || '',
      topBannerEnabled: adSettings.topBannerEnabled || false,
      topBannerCode: adSettings.topBannerCode || '',
      bottomBannerEnabled: adSettings.bottomBannerEnabled || false,
      bottomBannerCode: adSettings.bottomBannerCode || '',
      customHeadScript: adSettings.customHeadScript || ''
    });
  }, [adSettings]);

  const [isSaved, setIsSaved] = useState(false);

  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    updateAdSettings({
      popadsEnabled: form.popadsEnabled,
      popadsCode: form.popadsCode.trim(),
      readerAdEnabled: form.readerAdEnabled,
      readerAdCode: form.readerAdCode.trim(),
      topBannerEnabled: form.topBannerEnabled,
      topBannerCode: form.topBannerCode.trim(),
      bottomBannerEnabled: form.bottomBannerEnabled,
      bottomBannerCode: form.bottomBannerCode.trim(),
      customHeadScript: form.customHeadScript.trim()
    });

    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);

    showToast({
      title: 'Reklam Ayarları Kaydedildi! 💰',
      message: 'Yapılan reklam entegrasyonu güncellendi ve anında yürürlüğe girdi.',
      type: 'success'
    });
  };

  const handleReset = () => {
    if (window.confirm('Tüm reklam kodlarını ve ayarlarını sıfırlamak istediğinize emin misiniz?')) {
      resetAdSettings();
      setForm(DEFAULT_AD_SETTINGS);
      showToast({
        title: 'Reklamlar Sıfırlandı',
        message: 'Tüm reklam kodları kaldırıldı ve pasif konuma getirildi.',
        type: 'info'
      });
    }
  };

  const handleTurnOffAll = () => {
    const updated = {
      ...form,
      popadsEnabled: false,
      readerAdEnabled: false,
      topBannerEnabled: false,
      bottomBannerEnabled: false
    };
    setForm(updated);
    updateAdSettings(updated);
    showToast({
      title: 'Tüm Reklamlar Durduruldu ⏸️',
      message: 'Sitedeki tüm reklam birimleri anında pasife alındı.',
      type: 'info'
    });
  };

  const activeCount = [
    form.popadsEnabled,
    form.readerAdEnabled,
    form.topBannerEnabled,
    form.bottomBannerEnabled
  ].filter(Boolean).length;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header Info */}
      <div className="bg-gradient-to-r from-emerald-950/40 via-purple-950/30 to-gray-900 border border-emerald-500/20 rounded-2xl p-6 backdrop-blur-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400">
              <DollarSign className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-white">Reklam & Gelir Yönetimi</h2>
                <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${
                  activeCount > 0
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    : 'bg-gray-800 text-gray-400 border-gray-700'
                }`}>
                  {activeCount > 0 ? `${activeCount} Aktif Birim` : 'Tümü Pasif'}
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-1 max-w-2xl leading-relaxed">
                PopAds, PopCash, Adsterra, Monetag gibi reklam ağlarından aldığınız kodları bu alana yapıştırıp tek tıkla açıp kapatabilirsiniz. Kodlara doğrudan dokunmadan tüm siteye anında uygulanır.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end md:self-auto">
            {activeCount > 0 && (
              <button
                type="button"
                onClick={handleTurnOffAll}
                className="px-3 py-2 bg-red-950/50 hover:bg-red-900/60 border border-red-500/30 rounded-xl text-xs font-bold text-red-300 transition flex items-center gap-1.5"
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                Hepsini Durdur
              </button>
            )}
            <button
              type="button"
              onClick={() => handleSave()}
              className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-extrabold shadow-lg shadow-emerald-900/30 transition flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              Kaydet
            </button>
          </div>
        </div>

        {/* Quick Tips Box */}
        <div className="mt-4 pt-4 border-t border-gray-800/80 flex flex-wrap items-center justify-between gap-3 text-xs text-gray-400">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>
              <strong>PopAds Tavsiyesi:</strong> PopAds panelinizde <em className="text-emerald-300">"Frequency Capping"</em> ayarını <strong>1 pop / 24 saat</strong> yapın. Böylece okuyucularınız günde sadece 1 kez reklama denk gelir ve siteden kaçmaz.
            </span>
          </div>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* ================= SECTION 1: POPADS / POPUNDER ================= */}
        <div className="bg-gray-900/80 border border-gray-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/10 border border-purple-500/30 rounded-lg text-purple-400">
                <ExternalLink className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  PopAds / Popunder Reklamları
                  <span className="text-[10px] bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded font-mono">
                    En Yüksek Kazanç
                  </span>
                </h3>
                <p className="text-xs text-gray-400">
                  Ziyaretçi sayfada herhangi bir yere tıkladığında arka planda yeni sekmede reklam açar.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setForm(prev => ({ ...prev, popadsEnabled: !prev.popadsEnabled }))}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold transition ${
                form.popadsEnabled
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-sm shadow-emerald-500/20'
                  : 'bg-gray-800 text-gray-400 border-gray-700'
              }`}
            >
              {form.popadsEnabled ? (
                <>
                  <ToggleRight className="w-4 h-4 text-emerald-400" />
                  <span>AKTİF</span>
                </>
              ) : (
                <>
                  <ToggleLeft className="w-4 h-4 text-gray-500" />
                  <span>KAPALI</span>
                </>
              )}
            </button>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-300 mb-1 flex items-center justify-between">
              <span>PopAds Script Kodu (HTML / Javascript):</span>
              <span className="text-[11px] text-gray-500 font-normal">
                PopAds, PopCash veya Adsterra'dan aldığınız &lt;script&gt; kodunu buraya yapıştırın
              </span>
            </label>
            <textarea
              rows={4}
              value={form.popadsCode}
              onChange={(e) => setForm(prev => ({ ...prev, popadsCode: e.target.value }))}
              placeholder={`<!-- PopAds.net Popunder Code -->\n<script type="text/javascript" data-cfasync="false">\n/* PopAds kodunuz buraya gelecektir */\n</script>`}
              className="w-full bg-gray-950 border border-gray-800 rounded-xl p-3 font-mono text-xs text-purple-200 focus:outline-none focus:border-purple-500 transition resize-y"
            />
          </div>
        </div>

        {/* ================= SECTION 2: READER AD (BÖLÜM OKUYUCU) ================= */}
        <div className="bg-gray-900/80 border border-gray-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-500/10 border border-indigo-500/30 rounded-lg text-indigo-400">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  Bölüm İçi & Okuyucu Reklamı
                  <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded font-mono">
                    Manhwa & Novel
                  </span>
                </h3>
                <p className="text-xs text-gray-400">
                  Bölüm sayfalarında okuyucunun en çok dikkatini çeken 'Sonraki Bölüm' butonlarının hemen üstünde yer alır.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setForm(prev => ({ ...prev, readerAdEnabled: !prev.readerAdEnabled }))}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold transition ${
                form.readerAdEnabled
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-sm shadow-emerald-500/20'
                  : 'bg-gray-800 text-gray-400 border-gray-700'
              }`}
            >
              {form.readerAdEnabled ? (
                <>
                  <ToggleRight className="w-4 h-4 text-emerald-400" />
                  <span>AKTİF</span>
                </>
              ) : (
                <>
                  <ToggleLeft className="w-4 h-4 text-gray-500" />
                  <span>KAPALI</span>
                </>
              )}
            </button>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-300 mb-1 flex items-center justify-between">
              <span>Okuyucu Banner Kodu (728x90, 300x250 vb.):</span>
              <span className="text-[11px] text-gray-500 font-normal">
                HTML, iframe veya script banner kodu
              </span>
            </label>
            <textarea
              rows={3}
              value={form.readerAdCode}
              onChange={(e) => setForm(prev => ({ ...prev, readerAdCode: e.target.value }))}
              placeholder={`<!-- 728x90 veya 300x250 Banner Kodu -->\n<script type="text/javascript">\n  atOptions = { ... };\n</script>`}
              className="w-full bg-gray-950 border border-gray-800 rounded-xl p-3 font-mono text-xs text-indigo-200 focus:outline-none focus:border-indigo-500 transition resize-y"
            />
          </div>
        </div>

        {/* ================= SECTION 3: TOP & BOTTOM BANNERS ================= */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Top Banner */}
          <div className="bg-gray-900/80 border border-gray-800 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <LayoutTemplate className="w-4 h-4 text-cyan-400" />
                <h4 className="text-sm font-bold text-white">Sayfa Üstü Banner</h4>
              </div>
              <button
                type="button"
                onClick={() => setForm(prev => ({ ...prev, topBannerEnabled: !prev.topBannerEnabled }))}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-bold transition ${
                  form.topBannerEnabled
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    : 'bg-gray-800 text-gray-400 border-gray-700'
                }`}
              >
                {form.topBannerEnabled ? 'Aktif' : 'Kapalı'}
              </button>
            </div>
            <p className="text-[11px] text-gray-400">
              Üst menünün (Header) hemen altında yer alan geniş banner alanı.
            </p>
            <textarea
              rows={3}
              value={form.topBannerCode}
              onChange={(e) => setForm(prev => ({ ...prev, topBannerCode: e.target.value }))}
              placeholder="<!-- Üst Banner Kodu -->"
              className="w-full bg-gray-950 border border-gray-800 rounded-xl p-2.5 font-mono text-xs text-cyan-200 focus:outline-none focus:border-cyan-500 transition"
            />
          </div>

          {/* Bottom Banner */}
          <div className="bg-gray-900/80 border border-gray-800 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <LayoutTemplate className="w-4 h-4 text-pink-400" />
                <h4 className="text-sm font-bold text-white">Sayfa Altı Banner</h4>
              </div>
              <button
                type="button"
                onClick={() => setForm(prev => ({ ...prev, bottomBannerEnabled: !prev.bottomBannerEnabled }))}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-bold transition ${
                  form.bottomBannerEnabled
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    : 'bg-gray-800 text-gray-400 border-gray-700'
                }`}
              >
                {form.bottomBannerEnabled ? 'Aktif' : 'Kapalı'}
              </button>
            </div>
            <p className="text-[11px] text-gray-400">
              Alt bilginin (Footer) hemen üstünde yer alan banner alanı.
            </p>
            <textarea
              rows={3}
              value={form.bottomBannerCode}
              onChange={(e) => setForm(prev => ({ ...prev, bottomBannerCode: e.target.value }))}
              placeholder="<!-- Alt Banner Kodu -->"
              className="w-full bg-gray-950 border border-gray-800 rounded-xl p-2.5 font-mono text-xs text-pink-200 focus:outline-none focus:border-pink-500 transition"
            />
          </div>
        </div>

        {/* ================= SECTION 4: CUSTOM HEAD SCRIPT / SAYAÇ ================= */}
        <div className="bg-gray-900/80 border border-gray-800 rounded-2xl p-5 space-y-3">
          <div className="flex items-center gap-2.5">
            <Code className="w-4 h-4 text-amber-400" />
            <h4 className="text-sm font-bold text-white">Özel Doğrulama & Head Scripti (Opsiyonel)</h4>
          </div>
          <p className="text-xs text-gray-400">
            Reklam ağlarının site sahipliği doğrulama meta etiketleri, Google Analytics veya Yandex Metrika sayaç kodları için kullanılabilir.
          </p>
          <textarea
            rows={2}
            value={form.customHeadScript}
            onChange={(e) => setForm(prev => ({ ...prev, customHeadScript: e.target.value }))}
            placeholder={`<meta name="ad-network-domain-verification" content="..." />`}
            className="w-full bg-gray-950 border border-gray-800 rounded-xl p-2.5 font-mono text-xs text-amber-200 focus:outline-none focus:border-amber-500 transition"
          />
        </div>

        {/* ================= ACTIONS BAR ================= */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-gray-800">
          <button
            type="button"
            onClick={handleReset}
            className="text-xs text-gray-500 hover:text-red-400 transition flex items-center gap-1"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Ayarları Varsayılana Sıfırla
          </button>

          <div className="flex items-center gap-3">
            {isSaved && (
              <span className="text-xs text-emerald-400 font-bold flex items-center gap-1 animate-pulse">
                <CheckCircle2 className="w-4 h-4" />
                Başarıyla Kaydedildi!
              </span>
            )}
            <button
              type="submit"
              className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-500 hover:to-teal-400 text-white rounded-xl text-sm font-black shadow-lg shadow-emerald-950 transition flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              Ayarları Kaydet & Uygula
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
