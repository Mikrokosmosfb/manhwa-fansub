import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { ShopItem, ChibiEmoji, DEFAULT_CHIBI_EMOJI_PACKS, ItemRarity } from '../data/shopData';
import { ImageUploadField } from './ImageUploadField';
import {
  Smile,
  Plus,
  Trash2,
  Edit2,
  Sparkles,
  CheckCircle2,
  RefreshCw,
  Coins,
  Lock,
  Eye,
  ShoppingBag,
  Info,
  Image as ImageIcon,
  Save,
  X,
  Layers,
  Upload,
  Zap,
  Tag
} from 'lucide-react';

export const AdminEmojiManager: React.FC = () => {
  const {
    shopItems,
    addShopItemAndStyle,
    updateShopItem,
    deleteShopItemAndStyle,
    user
  } = useApp();

  const emojiPacks = shopItems.filter(item => item.category === 'emoji_pack');

  const [isCreatingPack, setIsCreatingPack] = useState(false);
  const [editingPackId, setEditingPackId] = useState<string | null>(null);

  // New / Edit Pack Form State
  const [packName, setPackName] = useState('');
  const [packIcon, setPackIcon] = useState('👑');
  const [packPrice, setPackPrice] = useState<number>(15);
  const [packRarity, setPackRarity] = useState<ItemRarity>('Destansı');
  const [packDesc, setPackDesc] = useState('');
  const [emojisList, setEmojisList] = useState<ChibiEmoji[]>([]);

  // Quick single emoji adder state within the form
  const [singleEmojiLabel, setSingleEmojiLabel] = useState('');
  const [singleEmojiCode, setSingleEmojiCode] = useState('');
  const [singleEmojiImageUrl, setSingleEmojiImageUrl] = useState('');

  // Status message
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Live Simulation / Test Box
  const [testComment, setTestComment] = useState('Mikrokosmos Fansub chibi çıkartmaları çok kaliteli! :chibi_neuvillette_think: :chibi_blush_shy: 💖');

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const resetForm = () => {
    setIsCreatingPack(false);
    setEditingPackId(null);
    setPackName('');
    setPackIcon('👑');
    setPackPrice(15);
    setPackRarity('Destansı');
    setPackDesc('');
    setEmojisList([]);
    setSingleEmojiLabel('');
    setSingleEmojiCode('');
    setSingleEmojiImageUrl('');
  };

  const handleStartEdit = (pack: ShopItem) => {
    setEditingPackId(pack.id);
    setIsCreatingPack(true);
    setPackName(pack.name);
    setPackIcon(pack.icon || '👑');
    setPackPrice(pack.price || 15);
    setPackRarity(pack.rarity || 'Destansı');
    setPackDesc(pack.description || '');
    setEmojisList(pack.emojis && pack.emojis.length > 0 ? [...pack.emojis] : []);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Multiple transparent PNG/WebP files upload handler
  const handleBulkFilesUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newItems: ChibiEmoji[] = [];

    Array.from(files).forEach((file: File) => {
      const fileName = file.name.replace(/\.[^/.]+$/, ''); // remove extension
      const cleanLabel = fileName.replace(/[_-]/g, ' ');
      const cleanCode = `:chibi_${fileName.toLowerCase().replace(/[^a-z0-9]/g, '_')}:`;

      const reader = new FileReader();
      reader.onload = (event) => {
        const base64Data = event.target?.result as string;
        if (base64Data) {
          setEmojisList(prev => [
            ...prev,
            {
              code: cleanCode,
              label: cleanLabel,
              imageUrl: base64Data
            }
          ]);
        }
      };
      reader.readAsDataURL(file);
    });

    setStatusMessage({ type: 'success', text: `${files.length} adet chibi çıkartması pakete yüklendi.` });
    setTimeout(() => setStatusMessage(null), 3000);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleAddSingleSticker = () => {
    if (!singleEmojiImageUrl.trim()) {
      setStatusMessage({ type: 'error', text: 'Lütfen şeffaf chibi görseli yükleyin veya resim linki girin.' });
      return;
    }

    let code = singleEmojiCode.trim();
    if (!code) {
      const slug = (singleEmojiLabel || 'sticker_' + Date.now()).toLowerCase().replace(/[^a-z0-9]/g, '_');
      code = `:chibi_${slug}:`;
    } else {
      if (!code.startsWith(':')) code = ':' + code;
      if (!code.endsWith(':')) code = code + ':';
    }

    const newEmoji: ChibiEmoji = {
      code,
      label: singleEmojiLabel.trim() || 'Chibi Çıkartma',
      imageUrl: singleEmojiImageUrl.trim()
    };

    setEmojisList(prev => [...prev, newEmoji]);
    setSingleEmojiLabel('');
    setSingleEmojiCode('');
    setSingleEmojiImageUrl('');
    setStatusMessage({ type: 'success', text: `"${newEmoji.label}" pakete eklendi.` });
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const handleRemoveEmojiFromPack = (index: number) => {
    setEmojisList(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleSavePack = (e: React.FormEvent) => {
    e.preventDefault();
    if (!packName.trim()) {
      setStatusMessage({ type: 'error', text: 'Lütfen bir paket adı girin.' });
      return;
    }

    if (emojisList.length === 0) {
      setStatusMessage({ type: 'error', text: 'Pakette en az 1 adet şeffaf chibi görseli bulunmalıdır.' });
      return;
    }

    const packId = editingPackId || ('chibi_pack_' + Date.now());

    const itemData: ShopItem = {
      id: packId,
      name: packName.trim(),
      category: 'emoji_pack',
      price: Math.max(1, Number(packPrice) || 15),
      description: packDesc.trim() || 'Yorumlarda kullanabileceğiniz yüksek kaliteli şeffaf anime chibi çıkartmaları.',
      icon: packIcon.trim() || '👑',
      rarity: packRarity,
      emojis: emojisList
    };

    if (editingPackId) {
      updateShopItem(editingPackId, itemData);
      setStatusMessage({ type: 'success', text: `"${itemData.name}" paketi başarıyla güncellendi!` });
    } else {
      addShopItemAndStyle(itemData);
      setStatusMessage({ type: 'success', text: `"${itemData.name}" paketi mağazaya ve yorum çekmecesine eklendi!` });
    }

    resetForm();
    setTimeout(() => setStatusMessage(null), 4000);
  };

  const handleDeletePack = (packId: string, name: string) => {
    if (confirm(`"${name}" chibi paketini silmek istediğinize emin misiniz?`)) {
      deleteShopItemAndStyle(packId);
      setStatusMessage({ type: 'success', text: `"${name}" paketi silindi.` });
      setTimeout(() => setStatusMessage(null), 3000);
    }
  };

  const handleRestoreDefaults = () => {
    if (confirm('Varsayılan şeffaf anime chibi paketlerini geri yüklemek ve eksik olanları eklemek istiyor musunuz?')) {
      DEFAULT_CHIBI_EMOJI_PACKS.forEach(defaultPack => {
        const exists = shopItems.some(i => i.id === defaultPack.id);
        if (!exists) {
          addShopItemAndStyle(defaultPack);
        }
      });
      setStatusMessage({ type: 'success', text: 'Varsayılan Chibi çıkartma paketleri yüklendi!' });
      setTimeout(() => setStatusMessage(null), 3000);
    }
  };

  // Helper to render inline emoji test preview
  const allAvailableEmojis = emojiPacks.flatMap(p => p.emojis || []);

  const renderSimulatedComment = (rawText: string) => {
    let parts: React.ReactNode[] = [rawText];

    allAvailableEmojis.forEach(em => {
      if (!em.imageUrl) return;
      const newParts: React.ReactNode[] = [];
      parts.forEach(part => {
        if (typeof part === 'string' && em.code && part.includes(em.code)) {
          const split = part.split(em.code);
          split.forEach((sub, sIdx) => {
            if (sub) newParts.push(sub);
            if (sIdx < split.length - 1) {
              newParts.push(
                <span
                  key={`${em.code}-${sIdx}`}
                  className="inline-flex items-center gap-1 mx-1 align-middle select-none group"
                  title={em.label}
                >
                  <img
                    src={em.imageUrl}
                    alt={em.label}
                    className="w-10 h-10 object-contain inline-block drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)] transform hover:scale-125 transition-transform"
                    referrerPolicy="no-referrer"
                  />
                </span>
              );
            }
          });
        } else {
          newParts.push(part);
        }
      });
      parts = newParts;
    });

    return parts;
  };

  return (
    <div className="space-y-8 animate-fadeIn text-gray-100">
      
      {/* HEADER BAR */}
      <div className="bg-gray-900/90 border border-purple-500/30 rounded-3xl p-4 sm:p-6 lg:p-8 shadow-2xl relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 via-purple-600 to-indigo-600 p-0.5 shadow-xl shadow-purple-950/80 flex items-center justify-center shrink-0">
            <div className="w-full h-full bg-gray-950 rounded-[14px] flex items-center justify-center">
              <Smile size={28} className="text-amber-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-black text-white">Chibi Çıkartma & Emoji Yönetim Merkezi</h2>
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-amber-500/20 border border-amber-500/40 text-amber-300">
                Şeffaf PNG / WebP
              </span>
            </div>
            <p className="text-xs sm:text-sm text-gray-400 mt-0.5">
              Yorumlarda kullanılacak gerçek şeffaf anime / manhwa Chibi karakter çizimlerini yükleyin, paketleyin ve mağaza CP fiyatlarını belirleyin.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          {!isCreatingPack && (
            <button
              onClick={() => {
                resetForm();
                setIsCreatingPack(true);
              }}
              className="w-full md:w-auto px-5 py-2.5 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black font-black text-xs rounded-xl shadow-lg transition flex items-center justify-center gap-2 cursor-pointer active:scale-95"
            >
              <Plus size={16} />
              Yeni Chibi Paketi Yükle
            </button>
          )}

          <button
            onClick={handleRestoreDefaults}
            className="px-4 py-2.5 bg-gray-800 hover:bg-gray-700 text-purple-300 border border-purple-500/30 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
            title="Eksik varsayılan chibi anime paketlerini geri yükler"
          >
            <RefreshCw size={14} />
            Varsayılanları Yükle
          </button>
        </div>
      </div>

      {/* STATUS NOTIFICATION */}
      {statusMessage && (
        <div
          className={`p-4 rounded-2xl border flex items-center gap-3 animate-fadeIn text-xs sm:text-sm font-bold shadow-lg ${
            statusMessage.type === 'success'
              ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300'
              : 'bg-red-950/80 border-red-500/50 text-red-300'
          }`}
        >
          {statusMessage.type === 'success' ? <CheckCircle2 size={18} /> : <Info size={18} />}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* CREATE / EDIT PACK FORM MODAL */}
      {isCreatingPack && (
        <div className="bg-gray-900 border-2 border-amber-500/40 rounded-3xl p-4 sm:p-6 lg:p-8 shadow-2xl space-y-6 animate-fadeIn relative">
          <div className="flex items-center justify-between border-b border-gray-800 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                {editingPackId ? <Edit2 size={18} /> : <Plus size={18} />}
              </div>
              <h3 className="text-lg font-black text-white">
                {editingPackId ? 'Chibi Paketini Düzenle' : 'Yeni Chibi Çıkartma Paketi Oluştur'}
              </h3>
            </div>

            <button
              onClick={resetForm}
              className="p-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleSavePack} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              {/* Pack Name */}
              <div className="space-y-1.5 md:col-span-2">
                <label className="block text-xs font-bold text-gray-300">
                  Paket Adı <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={packName}
                  onChange={e => setPackName(e.target.value)}
                  placeholder="Örn: 👑 Neuvillette & Genshin Chibi Paketi"
                  required
                  className="w-full bg-gray-950 border border-purple-500/30 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-400"
                />
              </div>

              {/* Icon Emoji */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-300">
                  Paket İkonu
                </label>
                <input
                  type="text"
                  value={packIcon}
                  onChange={e => setPackIcon(e.target.value)}
                  placeholder="Örn: 👑 veya 🍓"
                  className="w-full bg-gray-950 border border-purple-500/30 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-400"
                />
              </div>

              {/* Price in Cosmo-Puan */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-300 flex items-center justify-between">
                  <span>Cosmo-Puan Fiyatı (CP)</span>
                  <span className="text-emerald-400 font-extrabold text-[11px]">Düşük Fiyat: 15-25 CP</span>
                </label>
                <div className="relative">
                  <Coins size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-400 pointer-events-none" />
                  <input
                    type="number"
                    min={1}
                    value={packPrice}
                    onChange={e => setPackPrice(Number(e.target.value))}
                    className="w-full bg-gray-950 border border-purple-500/30 rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-amber-300 font-bold focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>
              </div>

              {/* Rarity */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-300">
                  Nadirlik Seviyesi
                </label>
                <select
                  value={packRarity}
                  onChange={e => setPackRarity(e.target.value as ItemRarity)}
                  className="w-full bg-gray-950 border border-purple-500/30 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-purple-400 cursor-pointer"
                >
                  <option value="Yaygın">Yaygın (Standart)</option>
                  <option value="Nadir">Nadir (Özel)</option>
                  <option value="Destansı">Destansı (Epik)</option>
                  <option value="Efsanevi">Efsanevi (VIP)</option>
                </select>
              </div>

              {/* Description */}
              <div className="space-y-1.5 md:col-span-3">
                <label className="block text-xs font-bold text-gray-300">
                  Paket Açıklaması
                </label>
                <input
                  type="text"
                  value={packDesc}
                  onChange={e => setPackDesc(e.target.value)}
                  placeholder="Yorumlarda kullanabileceğiniz yüksek çözünürlüklü anime chibi çizimleri..."
                  className="w-full bg-gray-950 border border-purple-500/30 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-400"
                />
              </div>
            </div>

            {/* CHIBI STICKERS BUILDER & UPLOADER */}
            <div className="p-5 bg-gray-950/90 border border-purple-500/30 rounded-2xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-800 pb-3">
                <div className="flex items-center gap-2">
                  <Sparkles size={16} className="text-amber-400" />
                  <h4 className="text-sm font-black text-white">Paket İçi Şeffaf Çıkartmalar ({emojisList.length} Adet)</h4>
                </div>

                {/* Bulk PNG / WebP File Uploader */}
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleBulkFilesUpload}
                    multiple
                    accept="image/png, image/webp, image/gif, image/jpeg"
                    className="hidden"
                    id="bulk-chibi-file-input"
                  />
                  <label
                    htmlFor="bulk-chibi-file-input"
                    className="px-3.5 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow cursor-pointer flex items-center gap-1.5 transition active:scale-95"
                  >
                    <Upload size={14} />
                    Toplu PNG/WebP Yükle
                  </label>
                </div>
              </div>

              {/* Existing Chibi Stickers in Pack */}
              {emojisList.length === 0 ? (
                <div className="py-8 text-center border-2 border-dashed border-gray-800 rounded-xl">
                  <ImageIcon size={32} className="mx-auto text-gray-600 mb-2" />
                  <p className="text-xs text-gray-400 font-bold">Bu pakete henüz şeffaf chibi görseli eklenmedi.</p>
                  <p className="text-[11px] text-gray-500 mt-0.5">Aşağıdan tek tek resim yükleyebilir veya yukarıdaki "Toplu PNG/WebP Yükle" butonunu kullanabilirsiniz.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 max-h-80 overflow-y-auto pr-1">
                  {emojisList.map((em, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-gray-900 border border-purple-500/30 rounded-xl flex flex-col items-center justify-between text-center gap-2 relative group hover:border-amber-500/50 transition shadow"
                    >
                      {/* Checkerboard transparent background wrapper */}
                      <div className="w-16 h-16 rounded-lg bg-[radial-gradient(#374151_1px,transparent_1px)] [background-size:8px_8px] bg-gray-950 flex items-center justify-center p-1 border border-gray-800 shadow-inner">
                        <img
                          src={em.imageUrl}
                          alt={em.label}
                          className="max-w-full max-h-full object-contain drop-shadow-md"
                          referrerPolicy="no-referrer"
                        />
                      </div>

                      <div className="w-full min-w-0">
                        <p className="text-xs font-black text-white truncate" title={em.label}>{em.label}</p>
                        <p className="text-[10px] text-purple-300 font-mono truncate" title={em.code}>{em.code}</p>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveEmojiFromPack(idx)}
                        className="absolute -top-1.5 -right-1.5 p-1 bg-red-950 border border-red-500/60 hover:bg-red-900 text-red-300 rounded-full transition cursor-pointer shadow opacity-80 group-hover:opacity-100"
                        title="Çıkartmayı Çıkar"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* SINGLE CHIBI IMAGE ADDER */}
              <div className="pt-4 border-t border-gray-800/80 space-y-3">
                <p className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                  <Plus size={14} /> Tekli Şeffaf Chibi Çıkartması Ekle:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-gray-400 mb-1">Çıkartma Adı / İfade</label>
                    <input
                      type="text"
                      value={singleEmojiLabel}
                      onChange={e => setSingleEmojiLabel(e.target.value)}
                      placeholder="Örn: Neuvillette Düşünceli"
                      className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-purple-400"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-gray-400 mb-1">Kodu (Örn: :chibi_neuvillette_think:)</label>
                    <input
                      type="text"
                      value={singleEmojiCode}
                      onChange={e => setSingleEmojiCode(e.target.value)}
                      placeholder=":chibi_neuvillette_think:"
                      className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3 py-2 text-xs text-purple-200 font-mono focus:outline-none focus:ring-1 focus:ring-purple-400"
                    />
                  </div>
                </div>

                {/* Transparent Image Upload Field */}
                <div>
                  <ImageUploadField
                    label="Şeffaf Chibi Çıkartma Görseli (PNG / WebP / GIF)"
                    value={singleEmojiImageUrl}
                    onChange={setSingleEmojiImageUrl}
                    placeholder="https://... veya doğrudan bilgisayarınızdan şeffaf chibi resmi yükleyin"
                    aspectRatio="square"
                    helpText="Arka planı şeffaf (transparent PNG) anime/chibi çizimleri en kaliteli sonucu verir."
                  />
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={handleAddSingleSticker}
                    className="px-4 py-2 bg-purple-900/80 hover:bg-purple-800 text-purple-200 border border-purple-500/40 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow"
                  >
                    <Plus size={14} /> Bu Çıkartmayı Pakete Ekle
                  </button>
                </div>
              </div>
            </div>

            {/* ACTION BUTTONS */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={resetForm}
                className="px-5 py-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-bold transition cursor-pointer"
              >
                İptal
              </button>
              <button
                type="submit"
                className="px-7 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black shadow-xl transition flex items-center gap-2 cursor-pointer active:scale-95"
              >
                <Save size={16} />
                {editingPackId ? 'Değişiklikleri Kaydet' : 'Paketi Mağazaya Yayınla'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* EXISTING CHIBI EMOJI PACKS LIST */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers size={18} className="text-amber-400" />
            <h3 className="text-base sm:text-lg font-black text-white">
              Mağazada Yayındaki Chibi Paketleri ({emojiPacks.length})
            </h3>
          </div>
          <span className="text-xs text-gray-400">
            Kullanıcılar mağazadan veya yorum çekmecesinden satın alabilir
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {emojiPacks.map(pack => (
            <div
              key={pack.id}
              className="bg-gray-900/90 border border-purple-500/20 hover:border-purple-500/50 rounded-2xl p-5 space-y-4 flex flex-col justify-between transition shadow-lg relative group"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-purple-950/80 border border-purple-500/40 flex items-center justify-center text-2xl shadow-inner shrink-0">
                      {pack.icon || '👑'}
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-white flex items-center gap-2">
                        {pack.name}
                      </h4>
                      <p className="text-[11px] text-gray-400 leading-tight mt-0.5">
                        {pack.description}
                      </p>
                    </div>
                  </div>

                  {/* Price Tag */}
                  <div className="flex items-center gap-1 bg-amber-950/80 border border-amber-500/50 px-2.5 py-1 rounded-xl text-xs font-black text-amber-300 shrink-0">
                    <Coins size={14} className="text-amber-400" />
                    <span>{pack.price} CP</span>
                  </div>
                </div>

                {/* Chibi Stickers Preview Inside This Pack */}
                <div className="mt-4 pt-3 border-t border-gray-800/80 space-y-2">
                  <div className="flex items-center justify-between text-[11px] text-gray-400">
                    <span className="font-bold">Paket İçeriği ({pack.emojis?.length || 0} Çıkartma):</span>
                    <span className="font-mono text-purple-300 text-[10px]">{pack.rarity}</span>
                  </div>

                  <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto pr-1">
                    {pack.emojis?.map((em, eIdx) => (
                      <div
                        key={eIdx}
                        className="p-1.5 bg-gray-950 border border-purple-500/30 rounded-xl flex items-center gap-2 shadow-sm"
                        title={em.label}
                      >
                        <div className="w-8 h-8 rounded bg-[radial-gradient(#374151_1px,transparent_1px)] [background-size:6px_6px] bg-gray-900 flex items-center justify-center p-0.5">
                          <img
                            src={em.imageUrl}
                            alt={em.label}
                            className="max-w-full max-h-full object-contain"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                        <span className="text-[10px] text-gray-300 font-mono pr-1">{em.code}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-gray-800 flex items-center justify-between">
                <span className="text-[10px] text-gray-500 font-mono">
                  ID: {pack.id}
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleStartEdit(pack)}
                    className="px-3 py-1.5 bg-purple-950/80 hover:bg-purple-900 text-purple-200 border border-purple-500/40 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Edit2 size={13} /> Düzenle
                  </button>

                  <button
                    onClick={() => handleDeletePack(pack.id, pack.name)}
                    className="p-1.5 bg-red-950/60 hover:bg-red-900/80 text-red-300 border border-red-500/40 rounded-xl transition cursor-pointer"
                    title="Paketi Sil"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* LIVE INTERACTIVE COMMENT TEST SIMULATOR */}
      <div className="bg-gray-900/90 border border-purple-500/30 rounded-3xl p-4 sm:p-6 lg:p-8 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Eye size={20} className="text-amber-400" />
            <h3 className="text-base sm:text-lg font-black text-white">Yorum Çıkartma Önizleme Simülatörü</h3>
          </div>
          <span className="text-xs text-purple-300 font-semibold">
            Yorumlarda chibi anime çıkartmalarının nasıl göründüğünü test edin
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-gray-400">Yorum Metni:</label>
            <textarea
              rows={3}
              value={testComment}
              onChange={e => setTestComment(e.target.value)}
              className="w-full bg-gray-950 border border-purple-500/30 rounded-2xl p-3 text-xs text-white font-mono focus:outline-none focus:ring-2 focus:ring-purple-400 resize-none shadow-inner"
            />
            <div className="flex flex-wrap gap-1.5 pt-1">
              {allAvailableEmojis.slice(0, 8).map((em, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setTestComment(prev => prev + ' ' + em.code)}
                  className="px-2 py-1 bg-gray-800 hover:bg-purple-900 text-[10px] font-mono rounded-lg text-purple-200 border border-purple-500/20 flex items-center gap-1.5 cursor-pointer"
                >
                  <img src={em.imageUrl} alt="" className="w-4 h-4 object-contain" referrerPolicy="no-referrer" />
                  <span>{em.code}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-gray-400">Yorum Alanındaki Canlı Görüntü:</label>
            <div className="min-h-[100px] p-4 bg-gray-950 border border-purple-500/40 rounded-2xl text-xs sm:text-sm text-gray-200 leading-relaxed shadow-inner flex items-center">
              <div>{renderSimulatedComment(testComment)}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
