import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { AppNotification, Announcement } from '../types';
import { ImageUploadField } from './ImageUploadField';
import {
  Bell,
  Megaphone,
  Sparkles,
  Send,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Info,
  Layers,
  BookOpen,
  Image as ImageIcon,
  Check,
  Eye,
  Sliders,
  Flame,
  Radio,
  Clock,
  Shield,
  Gift,
  HelpCircle,
  ExternalLink,
  RotateCcw
} from 'lucide-react';

export const AdminNotificationsManager: React.FC = () => {
  const {
    notifications,
    addNotification,
    deleteNotification,
    clearAllNotifications,
    showToast,
    seriesList,
    announcement,
    updateAnnouncement
  } = useApp();

  // Tab mode within notifications manager: 'broadcast' | 'banner' | 'history'
  const [activeSubTab, setActiveSubTab] = useState<'broadcast' | 'banner' | 'history'>('broadcast');

  // Broadcast Form State
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState<AppNotification['type']>('announcement');
  const [selectedSeriesId, setSelectedSeriesId] = useState('');
  const [chapterTitle, setChapterTitle] = useState('');
  const [chapterNumber, setChapterNumber] = useState<string>('');
  const [customCoverImage, setCustomCoverImage] = useState('');
  const [alsoShowToast, setAlsoShowToast] = useState(true);
  const [alsoSetBanner, setAlsoSetBanner] = useState(false);
  const [successNotice, setSuccessNotice] = useState('');

  // Banner Settings State
  const [bannerTitle, setBannerTitle] = useState(announcement?.title || 'DUYURU');
  const [bannerText, setBannerText] = useState(announcement?.text || '');
  const [bannerType, setBannerType] = useState<Announcement['type']>(announcement?.type || 'announcement');
  const [bannerActive, setBannerActive] = useState<boolean>(announcement ? announcement.active : true);
  const [bannerSuccess, setBannerSuccess] = useState('');

  // Search in sent notifications
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');

  const selectedSeries = seriesList.find(s => s.id === selectedSeriesId);
  const activeCover = customCoverImage.trim() || (selectedSeries ? selectedSeries.coverImage : '');

  // Pre-fill quick templates
  const applyTemplate = (templateType: 'server' | 'event' | 'new_series' | 'discord', seriesIdParam?: string) => {
    if (templateType === 'server') {
      setTitle('⚡ Altyapı & Hız Güncellemesi');
      setMessage('Sunucu optimizasyonları ve okuyucu hızlandırma çalışmaları tamamlandı. Keyifli ve akıcı okumalar dileriz!');
      setType('system');
      setCustomCoverImage('');
      setSelectedSeriesId('');
    } else if (templateType === 'event') {
      setTitle('🎁 Hafta Sonu Cosmo-Puan Etkinliği!');
      setMessage('Tüm üyelerimize özel günlük çarkta x2 şans ve mağazada sürpriz temalar aktif edildi! Hemen profilinizden çarkı çevirin.');
      setType('reward');
      setCustomCoverImage('https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80');
      setSelectedSeriesId('');
    } else if (templateType === 'new_series') {
      const target = (seriesIdParam ? seriesList.find(s => s.id === seriesIdParam) : null) || seriesList[0];
      if (target) {
        setSelectedSeriesId(target.id);
        setTitle(`🎉 Yeni Seri: ${target.title} Yayında!`);
        const syn = target.synopsis && target.synopsis !== 'Açıklama girilmedi.' ? ` Konusu: ${target.synopsis.slice(0, 140)}...` : '';
        setMessage(`${target.title} (${target.type}) Türkçe çevirisi ve güncel bölümleriyle şimdi Mikrokosmos Fansub'da!${syn}`);
        setType('new-series');
        setCustomCoverImage(target.coverImage);
      }
    } else if (templateType === 'discord') {
      setTitle('💬 Discord Topluluğumuza Katılın!');
      setMessage('Bölüm sohbetleri, anlık spoiler tartışmaları ve özel fansub etkinlikleri için Discord sunucumuza davetlisiniz!');
      setType('announcement');
      setCustomCoverImage('https://images.unsplash.com/photo-1614680376593-902f749f7ffc?w=600&auto=format&fit=crop&q=80');
      setSelectedSeriesId('');
    }
  };

  const handleBroadcastSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !message.trim()) {
      alert('Lütfen bildirim başlığı ve mesajını doldurunuz.');
      return;
    }

    const payload: Omit<AppNotification, 'id' | 'createdAt' | 'isRead'> = {
      title: title.trim(),
      message: message.trim(),
      type,
      seriesId: selectedSeriesId || undefined,
      seriesTitle: selectedSeries?.title || undefined,
      chapterTitle: chapterTitle.trim() || undefined,
      chapterNumber: chapterNumber ? Number(chapterNumber) : undefined,
      coverImage: activeCover.trim() || undefined
    };

    // 1. Add to Notifications Center
    addNotification(payload);

    // 2. Optional immediate toast
    if (alsoShowToast) {
      showToast({
        title: title.trim(),
        message: message.trim(),
        type: type === 'chapter' ? 'chapter' : 'bell',
        coverImage: activeCover.trim() || undefined,
        seriesId: selectedSeriesId || undefined,
        duration: 6000
      });
    }

    // 3. Optional sync to site top announcement banner
    if (alsoSetBanner) {
      updateAnnouncement({
        id: 'ann-' + Date.now(),
        title: title.trim(),
        text: message.trim(),
        type: type === 'system' ? 'info' : 'announcement',
        active: true
      });
    }

    setSuccessNotice('Duyuru ve bildirim başarıyla yayınlandı! Tüm kullanıcılara anında iletildi.');
    setTimeout(() => setSuccessNotice(''), 4000);

    // Reset form
    setTitle('');
    setMessage('');
    setSelectedSeriesId('');
    setChapterTitle('');
    setChapterNumber('');
    setCustomCoverImage('');
  };

  const handleSaveBanner = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bannerTitle.trim() || !bannerText.trim()) {
      alert('Lütfen duyuru başlığı ve metnini giriniz.');
      return;
    }

    updateAnnouncement({
      id: announcement?.id || 'ann-' + Date.now(),
      title: bannerTitle.trim(),
      text: bannerText.trim(),
      type: bannerType,
      active: bannerActive
    });

    setBannerSuccess('Üst duyuru bandı ayarları başarıyla kaydedildi!');
    setTimeout(() => setBannerSuccess(''), 4000);
  };

  const filteredNotifications = notifications.filter(n => {
    const matchesSearch =
      n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (n.seriesTitle && n.seriesTitle.toLowerCase().includes(searchQuery.toLowerCase()));
    
    if (filterType === 'all') return matchesSearch;
    return matchesSearch && n.type === filterType;
  });

  return (
    <div className="space-y-6">
      
      {/* Header Strip */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 bg-gradient-to-r from-purple-950/80 via-gray-900 to-indigo-950/80 border border-purple-500/30 rounded-3xl shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-600 via-pink-600 to-indigo-600 p-0.5 shadow-lg shadow-purple-900/40 shrink-0">
            <div className="w-full h-full bg-gray-950 rounded-[14px] flex items-center justify-center">
              <Megaphone className="text-purple-400" size={24} />
            </div>
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
              Duyuru & Bildirim Merkezi
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40">
                Canlı Yayın
              </span>
            </h2>
            <p className="text-xs text-gray-400">
              Kullanıcılara genel bildirimler gönderin, bölüm alarmları duyurun ve üst bant duyurusunu yönetin.
            </p>
          </div>
        </div>

        {/* Sub-tab Navigation */}
        <div className="flex items-center bg-gray-950/80 p-1.5 rounded-2xl border border-gray-800 gap-1 self-start md:self-auto">
          <button
            type="button"
            onClick={() => setActiveSubTab('broadcast')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeSubTab === 'broadcast'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/60'
            }`}
          >
            <Send size={14} />
            <span>Bildirim Gönder</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('banner')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeSubTab === 'banner'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/60'
            }`}
          >
            <Radio size={14} />
            <span>Üst Duyuru Bandı</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('history')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeSubTab === 'history'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/60'
            }`}
          >
            <Clock size={14} />
            <span>Geçmiş ({notifications.length})</span>
          </button>
        </div>
      </div>

      {/* Success Alert */}
      {successNotice && (
        <div className="p-4 bg-emerald-950/90 border border-emerald-500/50 rounded-2xl flex items-center gap-3 text-emerald-200 text-xs font-bold shadow-lg animate-fadeIn">
          <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
          <span>{successNotice}</span>
        </div>
      )}

      {/* ======================= TAB 1: BİLDİRİM GÖNDER ======================= */}
      {activeSubTab === 'broadcast' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Form Left Side (7 cols) */}
          <form onSubmit={handleBroadcastSubmit} className="lg:col-span-7 bg-gray-950/70 border border-purple-500/20 rounded-3xl p-5 sm:p-7 space-y-5 shadow-xl">
            
            {/* Quick Preset Buttons */}
            <div>
              <label className="block text-xs font-bold text-gray-300 mb-2 flex items-center gap-1.5">
                <Sparkles size={14} className="text-amber-400" />
                Hızlı Bildirim Şablonları:
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => applyTemplate('server')}
                  className="px-2.5 py-1.5 rounded-xl bg-gray-900 hover:bg-purple-900/40 border border-gray-800 hover:border-purple-500/40 text-[11px] font-bold text-gray-300 hover:text-purple-200 transition flex items-center gap-1"
                >
                  ⚡ Sunucu & Hız
                </button>
                <button
                  type="button"
                  onClick={() => applyTemplate('event')}
                  className="px-2.5 py-1.5 rounded-xl bg-gray-900 hover:bg-amber-900/40 border border-gray-800 hover:border-amber-500/40 text-[11px] font-bold text-gray-300 hover:text-amber-200 transition flex items-center gap-1"
                >
                  🎁 Puan & Etkinlik
                </button>
                <button
                  type="button"
                  onClick={() => applyTemplate('new_series')}
                  className="px-2.5 py-1.5 rounded-xl bg-gray-900 hover:bg-indigo-900/40 border border-gray-800 hover:border-indigo-500/40 text-[11px] font-bold text-gray-300 hover:text-indigo-200 transition flex items-center gap-1"
                >
                  📖 Yeni Seri
                </button>
                <button
                  type="button"
                  onClick={() => applyTemplate('discord')}
                  className="px-2.5 py-1.5 rounded-xl bg-gray-900 hover:bg-blue-900/40 border border-gray-800 hover:border-blue-500/40 text-[11px] font-bold text-gray-300 hover:text-blue-200 transition flex items-center gap-1"
                >
                  💬 Discord Topluluğu
                </button>
              </div>
            </div>

            {/* Type Selector */}
            <div>
              <label className="block text-xs font-bold text-gray-300 mb-2">
                Bildirim Türü / Kategorisi:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                {[
                  { id: 'new-series', label: '🎉 Yeni Seri Yayında', desc: 'Yeni eklenen seriyi tüm kullanıcılara duyur' },
                  { id: 'chapter', label: '📖 Bölüm Yayını', desc: 'Yeni bölüm haberi' },
                  { id: 'announcement', label: '📢 Genel Duyuru', desc: 'Site duyurusu & haberler' },
                  { id: 'system', label: '⚙️ Sistem', desc: 'Güncelleme & bakım' },
                  { id: 'reward', label: '🎁 Ödül / Puan', desc: 'Hediye & etkinlik' }
                ].map(t => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => {
                      setType(t.id as any);
                      if (t.id === 'new-series' && selectedSeries) {
                        setTitle(`🎉 Yeni Seri: ${selectedSeries.title} Yayında!`);
                        const syn = selectedSeries.synopsis && selectedSeries.synopsis !== 'Açıklama girilmedi.' ? ` Konusu: ${selectedSeries.synopsis.slice(0, 140)}...` : '';
                        setMessage(`${selectedSeries.title} (${selectedSeries.type}) şimdi sitemizde yayında! Hemen okumaya başlayın.${syn}`);
                      }
                    }}
                    className={`p-2.5 rounded-2xl border text-left transition ${
                      type === t.id
                        ? 'bg-purple-950/90 border-purple-400 text-white shadow-lg ring-1 ring-purple-400/50'
                        : 'bg-gray-900/80 border-gray-800 text-gray-400 hover:border-gray-700 hover:text-gray-200'
                    }`}
                  >
                    <p className="text-xs font-extrabold">{t.label}</p>
                    <p className="text-[10px] text-gray-500 mt-0.5 line-clamp-1">{t.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Title Input */}
            <div>
              <label className="block text-xs font-bold text-gray-300 mb-1.5">
                Bildirim Başlığı <span className="text-red-400">*</span>:
              </label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Örn: Yeni Seri Eklendi: Solo Leveling Ragnarok! veya Bakım Tamamlandı"
                required
                className="w-full bg-gray-900 border border-gray-800 focus:border-purple-500 rounded-2xl px-4 py-3 text-xs text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition"
              />
            </div>

            {/* Message Input */}
            <div>
              <label className="block text-xs font-bold text-gray-300 mb-1.5">
                Bildirim Mesajı / İçerik <span className="text-red-400">*</span>:
              </label>
              <textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                rows={3}
                placeholder="Kullanıcılara gösterilecek detaylı açıklama metni..."
                required
                className="w-full bg-gray-900 border border-gray-800 focus:border-purple-500 rounded-2xl p-4 text-xs text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition leading-relaxed resize-y"
              />
            </div>

            {/* Optional Connected Series */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1.5">
                  İlgili Seri Seçimi (Opsiyonel):
                </label>
                <select
                  value={selectedSeriesId}
                  onChange={e => {
                    setSelectedSeriesId(e.target.value);
                    const s = seriesList.find(item => item.id === e.target.value);
                    if (s && !customCoverImage) {
                      setCustomCoverImage(s.coverImage);
                    }
                  }}
                  className="w-full bg-gray-900 border border-gray-800 focus:border-purple-500 rounded-2xl px-4 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition"
                >
                  <option value="">-- Seri Bağlama (Genel Bildirim) --</option>
                  {seriesList.map(s => (
                    <option key={s.id} value={s.id}>
                      [{s.type}] {s.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1.5">
                  Bölüm Başlığı / No (Opsiyonel):
                </label>
                <input
                  type="text"
                  value={chapterTitle}
                  onChange={e => setChapterTitle(e.target.value)}
                  placeholder="Örn: Bölüm 25 (Sezon Finali)"
                  className="w-full bg-gray-900 border border-gray-800 focus:border-purple-500 rounded-2xl px-4 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition"
                />
              </div>
            </div>

            {/* Custom Cover / Image URL or Device Upload */}
            <div>
              <ImageUploadField
                label="Özel Görsel / Bildirim Kapak Resmi (Opsiyonel)"
                value={customCoverImage}
                onChange={setCustomCoverImage}
                aspectRatio="cover"
                placeholder="https://... veya bilgisayarınızdan bildirim görseli seçin / sürükleyin"
                helpText="Bildirim kartında ve açılır bildirim kutusunda gösterilecek kapak görseli."
              />
            </div>

            {/* Checkbox Options */}
            <div className="p-4 bg-gray-900/60 border border-gray-800 rounded-2xl space-y-3">
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={alsoShowToast}
                  onChange={e => setAlsoShowToast(e.target.checked)}
                  className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 bg-gray-950 border-gray-700"
                />
                <div>
                  <p className="text-xs font-bold text-white">Anında Canlı Toast Bildirimi Olarak Göster</p>
                  <p className="text-[11px] text-gray-400">Tüm açık sekmelerde ekranda şık bir popup toast uyarısı belirir.</p>
                </div>
              </label>

              <label className="flex items-center gap-3 cursor-pointer select-none border-t border-gray-800/80 pt-3">
                <input
                  type="checkbox"
                  checked={alsoSetBanner}
                  onChange={e => setAlsoSetBanner(e.target.checked)}
                  className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 bg-gray-950 border-gray-700"
                />
                <div>
                  <p className="text-xs font-bold text-white">Site Üst Duyuru Bandına (Banner) da Yansıt</p>
                  <p className="text-[11px] text-gray-400">Sayfanın en tepesindeki duyuru bandını bu başlık ve mesajla senkronize eder.</p>
                </div>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold text-sm py-3.5 rounded-2xl shadow-xl shadow-purple-950/60 flex items-center justify-center gap-2 transition active:scale-[0.99] cursor-pointer"
            >
              <Send size={16} />
              <span>Bildirimi Tüm Kullanıcılara Yayınla</span>
            </button>
          </form>

          {/* Right Side (5 cols): Live Preview Card */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-gray-950/80 border border-purple-500/20 rounded-3xl p-5 sm:p-6 space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-gray-800 pb-3">
                <div className="flex items-center gap-2">
                  <Eye size={16} className="text-purple-400" />
                  <h3 className="text-xs font-black uppercase tracking-wider text-gray-300">
                    Canlı Önizleme (Kullanıcı Görünümü)
                  </h3>
                </div>
                <span className="text-[10px] font-bold text-purple-300 bg-purple-950/80 px-2 py-0.5 rounded-full border border-purple-500/30">
                  {type === 'chapter' ? 'Bölüm' : type === 'reward' ? 'Ödül' : type === 'system' ? 'Sistem' : 'Duyuru'}
                </span>
              </div>

              {/* Preview 1: Notification Card in Full Center */}
              <div>
                <p className="text-[11px] font-bold text-gray-400 mb-2">1. Bildirim Merkezi Görünümü:</p>
                <div className="bg-gray-900 border border-purple-500/30 rounded-2xl p-4 flex gap-3 shadow-md relative overflow-hidden">
                  <div className="w-1.5 h-1.5 rounded-full bg-purple-400 absolute top-4 right-4 animate-ping" />
                  
                  {activeCover ? (
                    <img
                      src={activeCover}
                      alt="Kapak"
                      referrerPolicy="no-referrer"
                      className="w-12 h-16 rounded-xl object-cover border border-purple-500/40 shrink-0 shadow"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-purple-900/60 border border-purple-500/30 flex items-center justify-center text-purple-300 shrink-0">
                      {type === 'reward' ? <Gift size={20} /> : type === 'system' ? <Info size={20} /> : <Megaphone size={20} />}
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap mb-1">
                      <h4 className="text-xs font-black text-white">
                        {title.trim() || 'Bildirim Başlığı Buraya Gelecek'}
                      </h4>
                      {chapterTitle && (
                        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-purple-900/80 text-purple-200 border border-purple-500/40">
                          {chapterTitle}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-gray-300 line-clamp-2 leading-relaxed mb-2">
                      {message.trim() || 'Kullanıcılara gidecek açıklama metni burada canlı olarak önizlenir.'}
                    </p>
                    <span className="text-[10px] text-gray-500 flex items-center gap-1">
                      <Clock size={10} />
                      Şimdi
                    </span>
                  </div>
                </div>
              </div>

              {/* Preview 2: Toast Notification Popup */}
              <div>
                <p className="text-[11px] font-bold text-gray-400 mb-2">2. Canlı Popup Toast Önizlemesi:</p>
                <div className="bg-gray-900/95 border-2 border-purple-500/50 rounded-2xl p-3.5 flex items-center gap-3 shadow-2xl backdrop-blur-md">
                  <div className="w-8 h-8 rounded-xl bg-purple-600 flex items-center justify-center text-white shrink-0 shadow">
                    <Bell size={16} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-white truncate">
                      {title.trim() || 'Yeni Bildirim'}
                    </p>
                    <p className="text-[11px] text-gray-300 truncate">
                      {message.trim() || 'Bildirim metni toast kutusunda görünür...'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-purple-950/40 border border-purple-500/20 rounded-2xl text-[11px] text-purple-300 leading-relaxed">
                💡 <strong>İpucu:</strong> Yayınlanan bildirimler hem ana sayfadaki zil menüsünde, hem de <code>/bildirimler</code> sayfasında tüm kullanıcılara kaydedilir.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================= TAB 2: ÜST DUYURU BANDI ======================= */}
      {activeSubTab === 'banner' && (
        <div className="bg-gray-950/70 border border-purple-500/20 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl max-w-4xl">
          <div className="flex items-center justify-between border-b border-gray-800 pb-4">
            <div>
              <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                <Radio className="text-amber-400" size={20} />
                Site Üst Duyuru Bandı (Announcement Banner)
              </h3>
              <p className="text-xs text-gray-400">
                Sitenin en üstünde yer alan sabit bilgilendirme bandını düzenleyin veya gizleyin.
              </p>
            </div>
            
            <label className="flex items-center gap-2 cursor-pointer bg-gray-900 px-3.5 py-2 rounded-2xl border border-gray-800 select-none">
              <input
                type="checkbox"
                checked={bannerActive}
                onChange={e => setBannerActive(e.target.checked)}
                className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 bg-gray-950 border-gray-700"
              />
              <span className="text-xs font-bold text-white">
                {bannerActive ? '🟢 Bant Aktif' : '🔴 Bant Gizli'}
              </span>
            </label>
          </div>

          {bannerSuccess && (
            <div className="p-4 bg-emerald-950/90 border border-emerald-500/50 rounded-2xl flex items-center gap-3 text-emerald-200 text-xs font-bold shadow animate-fadeIn">
              <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
              <span>{bannerSuccess}</span>
            </div>
          )}

          <form onSubmit={handleSaveBanner} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-gray-300 mb-1.5">
                  Bant Başlığı (Etiket):
                </label>
                <input
                  type="text"
                  value={bannerTitle}
                  onChange={e => setBannerTitle(e.target.value)}
                  placeholder="Örn: DUYURU, GÜNCELLEME, BAKIM"
                  className="w-full bg-gray-900 border border-gray-800 focus:border-purple-500 rounded-2xl px-4 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1.5">
                  Bant Teması:
                </label>
                <select
                  value={bannerType}
                  onChange={e => setBannerType(e.target.value as any)}
                  className="w-full bg-gray-900 border border-gray-800 focus:border-purple-500 rounded-2xl px-4 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                >
                  <option value="announcement">📢 Mor (Duyuru)</option>
                  <option value="info">ℹ️ Mavi (Bilgi)</option>
                  <option value="warning">⚠️ Sarı (Uyarı)</option>
                  <option value="maintenance">🛠️ Turuncu (Bakım)</option>
                  <option value="danger">🚨 Kırmızı (Önemli)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-300 mb-1.5">
                Duyuru Metni:
              </label>
              <textarea
                value={bannerText}
                onChange={e => setBannerText(e.target.value)}
                rows={2}
                placeholder="Sitenin tepesinde görünecek duyuru metni..."
                className="w-full bg-gray-900 border border-gray-800 focus:border-purple-500 rounded-2xl p-4 text-xs text-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 resize-none leading-relaxed"
              />
            </div>

            {/* Live Banner Preview */}
            <div className="p-4 bg-gray-900 border border-purple-500/20 rounded-2xl space-y-2">
              <p className="text-[11px] font-bold text-gray-400">Canlı Bant Önizlemesi:</p>
              {bannerActive ? (
                <div className="p-3 bg-gradient-to-r from-purple-900/80 via-pink-900/60 to-purple-900/80 border border-purple-500/40 rounded-xl flex items-center justify-between text-xs text-white shadow">
                  <div className="flex items-center gap-2 truncate">
                    <span className="font-extrabold bg-purple-500/30 px-2 py-0.5 rounded text-[10px] uppercase border border-purple-400/40">
                      {bannerTitle || 'DUYURU'}
                    </span>
                    <span className="truncate text-gray-200">{bannerText || 'Duyuru metni buraya gelir...'}</span>
                  </div>
                  <Megaphone size={14} className="text-purple-300 shrink-0 ml-2" />
                </div>
              ) : (
                <p className="text-xs text-gray-500 italic">Bant şu anda devre dışı (gizli).</p>
              )}
            </div>

            <button
              type="submit"
              className="bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs px-6 py-3 rounded-2xl shadow-lg transition flex items-center gap-2 cursor-pointer"
            >
              <Check size={16} />
              <span>Duyuru Bandını Güncelle ve Kaydet</span>
            </button>
          </form>
        </div>
      )}

      {/* ======================= TAB 3: BİLDİRİM GEÇMİŞİ & YÖNETİMİ ======================= */}
      {activeSubTab === 'history' && (
        <div className="bg-gray-950/70 border border-purple-500/20 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
          
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1 max-w-md">
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Bildirimlerde ara..."
                className="w-full bg-gray-900 border border-gray-800 focus:border-purple-500 rounded-2xl px-4 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none"
              />
              <select
                value={filterType}
                onChange={e => setFilterType(e.target.value)}
                className="bg-gray-900 border border-gray-800 focus:border-purple-500 rounded-2xl px-3 py-2.5 text-xs text-white focus:outline-none"
              >
                <option value="all">Tümü</option>
                <option value="new-series">Yeni Seriler</option>
                <option value="chapter">Bölümler</option>
                <option value="announcement">Duyurular</option>
                <option value="system">Sistem</option>
                <option value="reward">Ödüller</option>
              </select>
            </div>

            {notifications.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  if (window.confirm('Tüm bildirimleri temizlemek istediğinize emin misiniz?')) {
                    clearAllNotifications();
                  }
                }}
                className="px-4 py-2.5 bg-red-950/80 hover:bg-red-900 border border-red-500/40 text-red-300 hover:text-white rounded-2xl text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <Trash2 size={14} />
                <span>Tüm Bildirimleri Temizle</span>
              </button>
            )}
          </div>

          {/* List */}
          {filteredNotifications.length === 0 ? (
            <div className="py-12 text-center space-y-3 bg-gray-900/40 border border-gray-800 rounded-2xl">
              <Bell size={32} className="mx-auto text-gray-600" />
              <p className="text-sm font-bold text-gray-400">Henüz yayınlanmış bir bildirim bulunmuyor.</p>
              <p className="text-xs text-gray-500">"Bildirim Gönder" sekmesinden yeni duyuru yayınlayabilirsiniz.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredNotifications.map((notif) => (
                <div
                  key={notif.id}
                  className="p-4 bg-gray-900/90 hover:bg-gray-900 border border-gray-800 hover:border-purple-500/40 rounded-2xl flex items-center justify-between gap-4 transition"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    {notif.coverImage ? (
                      <img
                        src={notif.coverImage}
                        alt="Kapak"
                        referrerPolicy="no-referrer"
                        className="w-10 h-14 rounded-xl object-cover border border-purple-500/30 shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-xl bg-purple-900/50 border border-purple-500/30 flex items-center justify-center text-purple-300 shrink-0">
                        {notif.type === 'reward' ? <Gift size={18} /> : notif.type === 'system' ? <Info size={18} /> : <Megaphone size={18} />}
                      </div>
                    )}

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-purple-900/60 text-purple-300 border border-purple-500/30">
                          {notif.type}
                        </span>
                        <h4 className="text-xs font-black text-white truncate">{notif.title}</h4>
                        {notif.chapterTitle && (
                          <span className="text-[10px] font-bold text-gray-400">
                            • {notif.chapterTitle}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-gray-400 line-clamp-1 leading-relaxed">
                        {notif.message}
                      </p>
                      <span className="text-[10px] text-gray-500 block mt-1">
                        {new Date(notif.createdAt).toLocaleString('tr-TR')}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => deleteNotification(notif.id)}
                    className="p-2 rounded-xl bg-gray-800 hover:bg-red-900/80 text-gray-400 hover:text-red-200 border border-gray-700 hover:border-red-500/40 transition shrink-0 cursor-pointer"
                    title="Bu bildirimi sil"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  );
};
