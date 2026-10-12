import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { SeriesRequest, SeriesType } from '../types';
import {
  Rocket,
  RotateCw,
  ShieldCheck,
  Info,
  Flame,
  Search,
  BookOpen,
  Send,
  Edit3,
  Bookmark,
  ThumbsUp,
  X,
  Upload,
  Sparkles,
  MessageCircle,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Ban,
  Tag,
  Trash2,
  Lock,
  ExternalLink
} from 'lucide-react';

const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxYG7XKo4Wq8_hAaZb-vMomSHq-ZdLAlQhQQ2x9SKbDnPK_0ou5bWXniRcTDHn-vYZX/exec";
const DISCORD_URL = "https://discord.gg/H4cAsuFSYz";
const DEFAULT_COVER = "https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?q=80&w=300&auto=format&fit=crop";
const IMGBB_API_KEY = "889bb65f39d53ff8809f0a9a97974b2a";

function getUserToken() {
  let token = localStorage.getItem("mikro_user_token");
  if (!token) {
    token = "usr_" + Date.now() + "_" + Math.random().toString(36).substring(2, 9);
    localStorage.setItem("mikro_user_token", token);
  }
  return token;
}

function cleanSingleUrl(url?: string) {
  if (!url) return "";
  let str = String(url).trim();
  if (str.toLowerCase().indexOf('http') === 0) {
    let nextHttp = str.indexOf('http', 4);
    if (nextHttp !== -1) str = str.substring(0, nextHttp).trim();
  }
  return str;
}

function isImageUrl(url?: string) {
  if (!url) return false;
  const str = String(url).trim().toLowerCase();
  return (str.includes('ibb.co/') || str.includes('imgur.com/') ||
          str.includes('googleusercontent.com/') || str.includes('share.google/') ||
          str.includes('drive.google.com/') || str.includes('photos.app.goo.gl/') ||
          str.includes('.jpg') || str.includes('.png') ||
          str.includes('.jpeg') || str.includes('.webp'));
}

function fixImageUrl(url?: string) {
  if (!url) return DEFAULT_COVER;
  let str = cleanSingleUrl(url);
  if (!str) return DEFAULT_COVER;
  let dm = str.match(/\/d\/([a-zA-Z0-9_-]+)/) || str.match(/[?&]id=([a-zA-Z0-9_-]+)/) || str.match(/share\.google\/([a-zA-Z0-9_-]+)/);
  if (dm && dm[1]) return 'https://lh3.googleusercontent.com/d/' + dm[1];
  if (str.includes('imgur.com/') && !str.includes('i.imgur.com') && !str.endsWith('.jpg') && !str.endsWith('.png')) {
    return 'https://i.imgur.com/' + str.split('/').pop()?.split('.')[0] + '.jpg';
  }
  return str;
}

async function apiCall(payloadObj: any) {
  try {
    const res = await fetch(SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payloadObj)
    });
    return await res.json();
  } catch (err) {
    return { success: false, message: "Sunucuya bağlanılamadı. İnternet bağlantınızı kontrol edin." };
  }
}

const normalizeRequestItem = (raw: any): SeriesRequest => {
  const row = raw.row !== undefined ? Number(raw.row) : undefined;
  const title = String(raw.seri || raw.title || raw.name || 'İsimsiz Seri').trim();
  const requestedBy = String(raw.kullanici || raw.requestedBy || raw.user || 'Okuyucu').trim();
  const type = String(raw.kat || raw.type || raw.category || 'Manhwa').trim();
  const rawDurum = String(raw.durum || raw.status || 'Beklemede').trim();
  const votes = typeof raw.oy === 'number' ? raw.oy : typeof raw.votes === 'number' ? raw.votes : 0;
  const createdAt = String(raw.tarih || raw.createdAt || raw.date || 'Az önce').trim();
  const rawResim = String(raw.resim || raw.coverImage || raw.cover || '').trim();
  const rawLink = String(raw.link || raw.note || '').trim();
  const readLink = String(raw.readLink || '').trim();

  let tagsArray: string[] = [];
  if (Array.isArray(raw.tags)) {
    tagsArray = raw.tags;
  } else if (raw.tur && typeof raw.tur === 'string' && raw.tur !== 'Genel') {
    tagsArray = raw.tur.split(',').map((t: string) => t.trim()).filter(Boolean);
  }

  let fixedCover = fixImageUrl(rawResim);
  if ((!rawResim || rawResim === DEFAULT_COVER) && isImageUrl(rawLink)) {
    fixedCover = fixImageUrl(rawLink);
  }

  return {
    id: raw.id || `req-row-${row || Date.now()}-${title}`,
    row,
    seri: title,
    title,
    kullanici: requestedBy,
    requestedBy,
    kat: type,
    type,
    durum: rawDurum,
    status: rawDurum,
    seriDurumu: String(raw.seriDurumu || raw.originalStatus || '').trim(),
    originalStatus: String(raw.seriDurumu || raw.originalStatus || '').trim(),
    resim: fixedCover,
    coverImage: fixedCover,
    link: rawLink,
    note: rawLink,
    readLink,
    tur: tagsArray.join(', '),
    tags: tagsArray,
    oy: votes,
    votes,
    tarih: createdAt,
    createdAt,
    votedUserIds: Array.isArray(raw.votedUserIds) ? raw.votedUserIds : []
  };
};

export const RequestBoardView: React.FC = () => {
  const { user, isAdminLoggedIn, showToast } = useApp();

  const [requestsList, setRequestsList] = useState<SeriesRequest[]>(() => {
    const cached = localStorage.getItem("mikro_requests_cache");
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map(normalizeRequestItem);
        }
      } catch (e) {}
    }
    return [];
  });

  const [isLoading, setIsLoading] = useState<boolean>(() => requestsList.length === 0);
  const [adminPass, setAdminPass] = useState<string>(() => localStorage.getItem("mikro_admin_pass") || "");

  // Filters
  const [currentCategoryFilter, setCurrentCategoryFilter] = useState<string>('all');
  const [currentStatusFilter, setCurrentStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals
  const [isNewModalOpen, setIsNewModalOpen] = useState<boolean>(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [editingRequest, setEditingRequest] = useState<SeriesRequest | null>(null);

  // New Request Form
  const [reqUser, setReqUser] = useState<string>(user?.name || '');
  const [reqTitle, setReqTitle] = useState<string>('');
  const [reqKat, setReqKat] = useState<string>('Manhwa');
  const [reqSeriDurum, setReqSeriDurum] = useState<string>('');
  const [reqImg, setReqImg] = useState<string>('');
  const [reqLink, setReqLink] = useState<string>('');
  const [reqTags, setReqTags] = useState<string[]>([]);
  const [uploadStatus, setUploadStatus] = useState<string>('');
  const [duplicateWarning, setDuplicateWarning] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Admin Edit Form
  const [editTitle, setEditTitle] = useState<string>('');
  const [editKat, setEditKat] = useState<string>('Manhwa');
  const [editDurum, setEditDurum] = useState<string>('Beklemede');
  const [editSeriDurum, setEditSeriDurum] = useState<string>('');
  const [editImg, setEditImg] = useState<string>('');
  const [editReadLink, setEditReadLink] = useState<string>('');
  const [editNote, setEditNote] = useState<string>('');
  const [editTags, setEditTags] = useState<string>('');
  const [editUploadStatus, setEditUploadStatus] = useState<string>('');

  const isAdminActive = Boolean(adminPass || isAdminLoggedIn || (user && (user.email === 'aseleliyeva77@gmail.com' || user.email === 'mikrokosmosfansub@gmail.com')));

  // Fetch live requests from Google Apps Script / Sheet
  const loadLiveSheetData = async (showRefreshToast = false) => {
    if (showRefreshToast) {
      showToast?.({ title: "🔄 Liste Yenileniyor...", message: "Google E-Tablo verileri çekiliyor.", type: "info" });
    }
    setIsLoading(true);

    const res = await apiCall({ action: "list" });
    setIsLoading(false);

    if (res && res.success && Array.isArray(res.data)) {
      const normalized = res.data.map(normalizeRequestItem);
      setRequestsList(normalized);
      try {
        localStorage.setItem("mikro_requests_cache", JSON.stringify(res.data));
      } catch (e) {}
      if (showRefreshToast) {
        showToast?.({ title: "✅ Liste Güncellendi", message: `Toplam ${normalized.length} istek yüklendi.`, type: "success" });
      }
    } else {
      if (showRefreshToast) {
        showToast?.({ title: "⚠️ Bağlantı Hatası", message: "Google E-Tablo verisi çekilemedi.", type: "warning" });
      }
    }
  };

  useEffect(() => {
    loadLiveSheetData(false);
  }, []);

  const toggleAdminAuth = () => {
    if (!adminPass && !isAdminLoggedIn) {
      const p = prompt('Yönetici Şifrenizi Girin:');
      if (p) {
        setAdminPass(p);
        localStorage.setItem('mikro_admin_pass', p);
        showToast?.({ title: '🔑 Yönetici Modu Aktif', message: 'Değişiklikleri kartların altından yapabilirsiniz.', type: 'success' });
      }
    } else {
      setAdminPass('');
      localStorage.removeItem('mikro_admin_pass');
      showToast?.({ title: 'Çıkış Yapıldı', message: 'Yönetici modundan çıkıldı.', type: 'info' });
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, isEdit = false) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      alert("Lütfen 10 MB'tan küçük bir fotoğraf seçin.");
      return;
    }

    const setStatus = isEdit ? setEditUploadStatus : setUploadStatus;
    setStatus("⚡ Fotoğraf Yükleniyor...");

    try {
      const reader = new FileReader();
      reader.onload = async (ev) => {
        const base64Data = String(ev.target?.result || '').split(',')[1];
        if (!base64Data) {
          setStatus("❌ Yükleme hatası");
          return;
        }

        try {
          const params = new URLSearchParams();
          params.append("key", IMGBB_API_KEY);
          params.append("image", base64Data);

          const res = await fetch("https://api.imgbb.com/1/upload", { method: "POST", body: params });
          const json = await res.json();

          if (json && json.data && json.data.url) {
            if (isEdit) setEditImg(json.data.url);
            else setReqImg(json.data.url);
            setStatus("✅ Yüklendi!");
          } else {
            const fullUrl = String(ev.target?.result || '');
            if (isEdit) setEditImg(fullUrl);
            else setReqImg(fullUrl);
            setStatus("✅ Yüklendi!");
          }
        } catch {
          const fullUrl = String(ev.target?.result || '');
          if (isEdit) setEditImg(fullUrl);
          else setReqImg(fullUrl);
          setStatus("✅ Yüklendi!");
        }
      };
      reader.readAsDataURL(file);
    } catch {
      setStatus("❌ Yükleme hatası");
    }
  };

  const handleTitleChange = (val: string) => {
    setReqTitle(val);
    if (!val || val.trim().length < 2) {
      setDuplicateWarning('');
      return;
    }
    const cleanInput = val.toLowerCase().trim();
    const exists = requestsList.find(x => String(x.title || x.seri || '').toLowerCase().trim() === cleanInput);
    if (exists) {
      setDuplicateWarning(`⚠️ "${exists.title || exists.seri}" zaten listede var! (Mevcut Oy: ${exists.votes || exists.oy || 0}). Tekrar eklemek yerine ona oy verebilirsiniz.`);
    } else {
      setDuplicateWarning('');
    }
  };

  const handleTagToggle = (tagVal: string) => {
    setReqTags(prev => prev.includes(tagVal) ? prev.filter(t => t !== tagVal) : [...prev, tagVal]);
  };

  const handleVote = async (req: SeriesRequest) => {
    if (!req.row && req.row !== 0) {
      showToast?.({ title: '⚠️ Oy Verilemedi', message: 'Seri satır numarası eksik.', type: 'warning' });
      return;
    }

    const token = getUserToken();
    const res = await apiCall({
      action: "vote",
      row: req.row,
      seri: req.title || req.seri,
      userToken: token
    });

    if (res && res.success) {
      const newVoteCount = typeof res.votes === 'number' ? res.votes : ((req.votes || 0) + 1);
      setRequestsList(prev => prev.map(r => r.row === req.row ? { ...r, votes: newVoteCount, oy: newVoteCount } : r));
      showToast?.({ title: '👍 Oyunuz Eklendi!', message: `"${req.title}" toplam ${newVoteCount} oya ulaştı.`, type: 'success' });
    } else {
      showToast?.({ title: '⚠️ ' + (res?.message || 'Oy verirken sorun oluştu'), type: 'warning' });
    }
  };

  const handleNewRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reqTitle.trim() || isSubmitting) return;

    setIsSubmitting(true);
    const tagsText = reqTags.length > 0 ? reqTags.join(", ") : "Genel";

    const res = await apiCall({
      action: "add",
      kullanici: reqUser.trim() || user?.name || 'Starlight',
      seri: reqTitle.trim(),
      kat: reqKat || 'Manhwa',
      seriDurumu: reqSeriDurum.trim(),
      resim: reqImg.trim(),
      link: reqLink.trim(),
      tur: tagsText
    });

    setIsSubmitting(false);

    if (res && res.success) {
      showToast?.({ title: '✨ İstek Eklendi!', message: `"${reqTitle.trim()}" isteğiniz Google E-Tabloya eklendi.`, type: 'success' });
      setIsNewModalOpen(false);
      setReqTitle('');
      setReqSeriDurum('');
      setReqImg('');
      setReqLink('');
      setReqTags([]);
      setDuplicateWarning('');
      await loadLiveSheetData(false);
    } else {
      alert("Hata: " + (res?.message || "İstek eklenemedi"));
    }
  };

  const openEditModal = (req: SeriesRequest) => {
    if (!isAdminActive) {
      alert('Admin girişi yapmalısınız!');
      return;
    }
    setEditingRequest(req);
    setEditTitle(req.title || req.seri || '');
    setEditKat(req.type || req.kat || 'Manhwa');
    setEditDurum(req.status || req.durum || 'Beklemede');
    setEditSeriDurum(req.originalStatus || req.seriDurumu || '');
    setEditImg(req.coverImage || req.resim || '');
    setEditReadLink(req.readLink || '');
    setEditNote(req.note || req.link || '');
    setEditTags(req.tags ? req.tags.join(', ') : (req.tur || 'Genel'));
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRequest || !adminPass) return alert("Admin şifresi gerekli!");

    const res = await apiCall({
      action: "edit",
      row: editingRequest.row,
      oldSeri: editingRequest.seri || editingRequest.title,
      seri: editTitle.trim(),
      kat: editKat,
      durum: editDurum,
      seriDurumu: editSeriDurum.trim(),
      resim: editImg.trim(),
      readLink: editReadLink.trim(),
      link: editNote.trim(),
      tur: editTags.trim() || "Genel",
      passcode: adminPass
    });

    if (res && res.success) {
      showToast?.({ title: '💾 Değişiklikler Kaydedildi', message: `"${editTitle.trim()}" bilgileri güncellendi.`, type: 'success' });
      setIsEditModalOpen(false);
      setEditingRequest(null);
      await loadLiveSheetData(false);
    } else {
      alert("Hata: " + (res?.message || "Düzenlenemedi"));
    }
  };

  const handleQuickStatusUpdate = async (req: SeriesRequest, newStatus: string, customNote = '') => {
    if (!adminPass) return alert("Admin girişi yapmalısınız!");

    const res = await apiCall({
      action: "update",
      row: req.row,
      seri: req.title || req.seri,
      durum: newStatus,
      link: customNote || req.note || req.link || '',
      passcode: adminPass
    });

    if (res && res.success) {
      showToast?.({ title: '✅ Durum Güncellendi', message: `"${req.title}" durumu "${newStatus}" yapıldı.`, type: 'success' });
      await loadLiveSheetData(false);
    } else {
      alert("Hata: " + (res?.message || "Güncellenemedi"));
    }
  };

  const handleReject = (req: SeriesRequest) => {
    if (!adminPass) return alert("Admin girişi yapmalısınız!");
    const reason = prompt("Reddetme nedenini yazın (İsteğe bağlı):", "Başka ekip çeviriyor");
    handleQuickStatusUpdate(req, 'Reddedildi', reason ? "Red Nedeni: " + reason : "");
  };

  const handleDelete = async (req: SeriesRequest) => {
    if (!adminPass) return alert("Admin girişi yapmalısınız!");
    if (!confirm(`"${req.title}" isteğini tamamen silmek istediğinize emin misiniz?`)) return;

    const res = await apiCall({
      action: "delete",
      row: req.row,
      seri: req.title || req.seri,
      passcode: adminPass
    });

    if (res && res.success) {
      showToast?.({ title: '🗑️ İstek Silindi', message: 'Liste Google E-Tablo ile eşitleniyor...', type: 'info' });
      await loadLiveSheetData(false);
    } else {
      alert("Hata: " + (res?.message || "Silinemedi"));
    }
  };

  const getStatusBadge = (rawStatus?: string) => {
    const st = String(rawStatus || 'Beklemede').toLowerCase();
    if (st.includes('incele')) {
      return { class: 'bg-purple-950/80 text-purple-300 border-purple-500/50', dataStatus: 'incelemede', text: 'İncelemede', icon: <Clock size={12} /> };
    }
    if (st.includes('kabul')) {
      return { class: 'bg-emerald-950/80 text-emerald-300 border-emerald-500/50', dataStatus: 'kabul', text: 'Kabul Edildi', icon: <CheckCircle2 size={12} /> };
    }
    if (st.includes('yapim') || st.includes('yapım')) {
      return { class: 'bg-cyan-950/80 text-cyan-300 border-cyan-500/50', dataStatus: 'yapim', text: 'Yapımda', icon: <Sparkles size={12} /> };
    }
    if (st.includes('yakin') || st.includes('yakın')) {
      return { class: 'bg-amber-950/80 text-amber-300 border-amber-500/50', dataStatus: 'yakin', text: 'Yakında', icon: <Clock size={12} /> };
    }
    if (st.includes('yayin') || st.includes('yayın')) {
      return { class: 'bg-fuchsia-950/80 text-fuchsia-300 border-fuchsia-500/50', dataStatus: 'yayin', text: 'Yayında!', icon: <BookOpen size={12} /> };
    }
    if (st.includes('red')) {
      return { class: 'bg-rose-950/80 text-rose-300 border-rose-500/50', dataStatus: 'red', text: 'Reddedildi', icon: <Ban size={12} /> };
    }
    return { class: 'bg-amber-950/60 text-amber-400 border-amber-500/40', dataStatus: 'beklemede', text: 'Beklemede', icon: <Clock size={12} /> };
  };

  // Filtered requests calculation
  const filteredRequests = useMemo(() => {
    return requestsList.filter(req => {
      const q = searchQuery.toLowerCase().trim();
      const matchQuery = !q ||
        (req.title && req.title.toLowerCase().includes(q)) ||
        (req.requestedBy && req.requestedBy.toLowerCase().includes(q)) ||
        (req.synopsis && req.synopsis.toLowerCase().includes(q));

      const matchCategory = currentCategoryFilter === 'all' ||
        (req.type && req.type.toLowerCase() === currentCategoryFilter.toLowerCase());

      const stInfo = getStatusBadge(req.status || req.durum);
      let matchStatus = currentStatusFilter === 'all' || stInfo.dataStatus === currentStatusFilter;

      return matchQuery && matchCategory && matchStatus;
    });
  }, [requestsList, searchQuery, currentCategoryFilter, currentStatusFilter]);

  // #1 Top Trend Showcase
  const topTrendRequest = useMemo(() => {
    const activeCandidates = requestsList.filter(r => {
      const stInfo = getStatusBadge(r.status || r.durum);
      return stInfo.dataStatus !== 'yayin' && stInfo.dataStatus !== 'red';
    });
    if (activeCandidates.length === 0) return null;
    const sorted = [...activeCandidates].sort((a, b) => (b.votes || b.oy || 0) - (a.votes || a.oy || 0));
    return (sorted[0] && (sorted[0].votes || sorted[0].oy || 0) > 0) ? sorted[0] : null;
  }, [requestsList]);

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-4 py-6 space-y-6 animate-fadeIn text-gray-100">

      {/* HEADER SECTION */}
      <div className="relative overflow-hidden rounded-3xl p-6 sm:p-8 text-center bg-gradient-to-br from-purple-950/80 via-slate-900 to-indigo-950 border border-purple-500/30 shadow-[0_0_40px_rgba(157,78,221,0.15)]">
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

        <h2 className="text-2xl sm:text-3xl font-black text-white drop-shadow-[0_0_15px_rgba(157,78,221,0.8)] tracking-tight mb-2">
          ✨ Mikrokosmos İstek Havuzu
        </h2>
        <p className="text-xs sm:text-sm text-purple-200/80 max-w-xl mx-auto leading-relaxed mb-6">
          Çevrilmesini istediğiniz serileri bize iletin veya mevcut isteklerin durumunu canlı takip edin!
        </p>

        {/* HEADER ACTION BUTTONS */}
        <div className="flex flex-wrap items-center justify-center gap-2.5">
          <button
            type="button"
            onClick={() => setIsNewModalOpen(true)}
            className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 text-white font-extrabold text-xs rounded-full shadow-lg shadow-purple-950/80 flex items-center gap-2 transition transform hover:scale-105 active:scale-95 cursor-pointer"
          >
            <Rocket size={15} />
            <span>Yeni İstek Gönder</span>
          </button>

          <button
            type="button"
            onClick={() => loadLiveSheetData(true)}
            className="px-4 py-2.5 bg-cyan-950/80 hover:bg-cyan-900/90 text-cyan-300 border border-cyan-500/40 font-bold text-xs rounded-full shadow-md flex items-center gap-2 transition active:scale-95 cursor-pointer"
          >
            <RotateCw size={14} className={isLoading ? 'animate-spin' : ''} />
            <span>Listeyi Yenile</span>
          </button>

          <a
            href={DISCORD_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-full shadow-md flex items-center gap-2 transition active:scale-95"
          >
            <MessageCircle size={14} />
            <span>Ekibe Sor (Discord)</span>
          </a>

          <button
            type="button"
            onClick={toggleAdminAuth}
            className={`px-4 py-2.5 border font-bold text-xs rounded-full shadow-md flex items-center gap-2 transition active:scale-95 cursor-pointer ${
              isAdminActive
                ? 'bg-fuchsia-950 text-fuchsia-300 border-fuchsia-500'
                : 'bg-white/10 hover:bg-white/20 border-purple-500/30 text-gray-200'
            }`}
          >
            <ShieldCheck size={14} />
            <span>{isAdminActive ? 'Çıkış Yap' : 'Admin Girişi'}</span>
          </button>
        </div>

        {isAdminActive && (
          <div className="mt-4 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-rose-950/80 border border-rose-500/50 text-rose-200 text-xs font-bold animate-pulse">
            <ShieldCheck size={14} className="text-rose-400" />
            <span>🔑 Yönetici Modu Aktif (Değişiklikleri kartların altındaki panelden yapabilirsiniz)</span>
          </div>
        )}
      </div>

      {/* DUYURU KUTUSU / SERİ KABUL KRİTERLERİ */}
      <div className="p-4 sm:p-5 rounded-2xl bg-purple-950/40 border border-purple-500/40 border-l-4 border-l-fuchsia-500 shadow-xl space-y-3">
        <div className="flex items-center gap-2 text-fuchsia-300 font-extrabold text-sm sm:text-base">
          <Info size={18} className="text-fuchsia-400 shrink-0" />
          <span>📌 Okuyucularımızın Dikkatine (Seri Kabul Kriterlerimiz)</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 text-xs text-purple-100/90 leading-relaxed">
          <div className="flex items-start gap-2 bg-black/30 p-2.5 rounded-xl border border-purple-500/20">
            <Flame size={14} className="text-amber-400 shrink-0 mt-0.5" />
            <span><strong>Oy Sayısı:</strong> En çok oy alan seriler en çabuk değerlendirmeye alınır. Oylarda aktif olalım.</span>
          </div>

          <div className="flex items-start gap-2 bg-black/30 p-2.5 rounded-xl border border-purple-500/20">
            <Sparkles size={14} className="text-fuchsia-400 shrink-0 mt-0.5" />
            <span><strong>Çizim Kalitesi:</strong> Çizimi profesyonel ve kaliteli olan serilerin alınma olasılığı yüksektir. Çizimi süper olmasa bile konusu çok ilgi çekici serileri tabii ki alıyoruz.</span>
          </div>

          <div className="flex items-start gap-2 bg-black/30 p-2.5 rounded-xl border border-purple-500/20">
            <Clock size={14} className="text-cyan-400 shrink-0 mt-0.5" />
            <span><strong>Güncellik:</strong> Kısa, tamamlanmış ve en yeni/güncel serileri de hızlı alıyoruz. Çünkü kısa oluyorlar.</span>
          </div>

          <div className="flex items-start gap-2 bg-black/30 p-2.5 rounded-xl border border-purple-500/20">
            <CheckCircle2 size={14} className="text-emerald-400 shrink-0 mt-0.5" />
            <span><strong>Emeğimiz:</strong> Bir seriyi başka fansubların yapması veya yapmış olması bizi ilgilendirmez; biz kendi emeğimizle istenilen her seriyi yapıyoruz.</span>
          </div>

          <div className="flex items-start gap-2 bg-black/30 p-2.5 rounded-xl border border-purple-500/20">
            <Bookmark size={14} className="text-indigo-400 shrink-0 mt-0.5" />
            <span><strong>Uzun Seriler:</strong> Uzun serilerin tamamlanmış olması bir artıdır. Devam eden uzun bir seri ise çizim ve konusuna ekstra dikkat ediyoruz.</span>
          </div>

          <div className="flex items-start gap-2 bg-black/30 p-2.5 rounded-xl border border-purple-500/20">
            <Info size={14} className="text-amber-300 shrink-0 mt-0.5" />
            <span><strong>İncelemede olan Seriler:</strong> İncelemede olan seriler bizim bile yapmakta kararsız kaldığımız serilerdir. Oylara bakılarak karar verilecek.</span>
          </div>
        </div>
      </div>

      {/* KATEGORİ SEKMELERİ */}
      <div className="flex items-center justify-center gap-2 flex-wrap border-b border-purple-500/20 pb-3">
        {[
          { id: 'all', label: 'Tüm İstekler' },
          { id: 'Manhwa', label: 'Manhwa' },
          { id: 'Novel', label: 'Novel' },
          { id: 'Manga', label: 'Manga' },
          { id: 'Manhua', label: 'Manhua' }
        ].map(cat => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setCurrentCategoryFilter(cat.id)}
            className={`px-4 py-1.5 rounded-full text-xs font-extrabold transition border cursor-pointer ${
              currentCategoryFilter === cat.id
                ? 'bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white border-fuchsia-400 shadow-md shadow-purple-950/60 scale-105'
                : 'bg-gray-900/80 text-gray-400 border-purple-500/20 hover:text-white hover:border-purple-500/40'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* HAFTANIN TREND İSTEĞİ VİTRİNİ */}
      {topTrendRequest && (
        <div className="relative overflow-hidden p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-fuchsia-950/40 via-purple-950/50 to-indigo-950/40 border-2 border-fuchsia-500/60 shadow-[0_0_25px_rgba(247,37,133,0.2)]">
          <div className="absolute top-3 right-3 bg-fuchsia-600 text-white font-black text-[10px] uppercase px-3 py-1 rounded-full shadow-md flex items-center gap-1">
            <Flame size={12} /> HAFTANIN TREND İSTEĞİ
          </div>

          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 pt-4 sm:pt-0">
            <img
              src={topTrendRequest.coverImage || topTrendRequest.resim || DEFAULT_COVER}
              alt={topTrendRequest.title || topTrendRequest.seri}
              onError={e => { (e.target as any).src = DEFAULT_COVER; }}
              className="w-24 h-36 sm:w-28 sm:h-40 object-cover rounded-2xl shadow-2xl border border-fuchsia-500/40 shrink-0"
            />

            <div className="flex-1 min-w-0 text-center sm:text-left space-y-2">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h3 className="text-lg sm:text-xl font-black text-white tracking-wide">
                  {topTrendRequest.title || topTrendRequest.seri}
                </h3>
                {(() => {
                  const badge = getStatusBadge(topTrendRequest.status || topTrendRequest.durum);
                  return (
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border flex items-center gap-1 ${badge.class}`}>
                      {badge.icon} {badge.text}
                    </span>
                  );
                })()}
              </div>

              <p className="text-xs text-gray-300/90 leading-relaxed line-clamp-2">
                <strong>İsteyen:</strong> <span className="text-fuchsia-300 font-bold">{topTrendRequest.requestedBy || topTrendRequest.kullanici}</span> ({topTrendRequest.createdAt || topTrendRequest.tarih}) • <span className="text-purple-300 font-bold">{topTrendRequest.type || topTrendRequest.kat}</span> {(topTrendRequest.originalStatus || topTrendRequest.seriDurumu) ? `• ${topTrendRequest.originalStatus || topTrendRequest.seriDurumu}` : ''}
              </p>

              {topTrendRequest.tags && topTrendRequest.tags.length > 0 && (
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1">
                  {topTrendRequest.tags.map((t, idx) => (
                    <span key={idx} className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-purple-950/80 border border-purple-500/40 text-purple-200">
                      #{t}
                    </span>
                  ))}
                </div>
              )}

              {(topTrendRequest.note || topTrendRequest.link) && (
                <div className="p-2 rounded-xl bg-black/40 border border-cyan-500/30 text-xs text-cyan-200 font-medium">
                  <strong>Not:</strong> {topTrendRequest.note || topTrendRequest.link}
                </div>
              )}

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => handleVote(topTrendRequest)}
                  className="px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs shadow-md flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
                >
                  <ThumbsUp size={14} />
                  <span>{topTrendRequest.votes || topTrendRequest.oy || 0} Oy</span>
                </button>

                {topTrendRequest.readLink && (
                  <a
                    href={topTrendRequest.readLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-md flex items-center gap-1.5 transition"
                  >
                    <BookOpen size={14} />
                    <span>Oku</span>
                  </a>
                )}

                <a
                  href={DISCORD_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-1.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-200 font-bold text-xs flex items-center gap-1.5 transition"
                >
                  <MessageCircle size={14} />
                  <span>Sor</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ARAMA VE DURUM FİLTRE ÇİPLERİ */}
      <div className="space-y-3">
        <div className="relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-400" />
          <input
            type="text"
            placeholder="Seri adı veya kullanıcı ara..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 bg-gray-900/90 border border-purple-500/30 focus:border-fuchsia-400 rounded-2xl text-xs sm:text-sm text-white placeholder:text-gray-500 focus:outline-none transition shadow-inner"
          />
        </div>

        {/* Status Filter Chips */}
        <div className="flex items-center justify-center gap-1.5 flex-wrap">
          {[
            { id: 'all', label: 'Tümü' },
            { id: 'beklemede', label: 'Beklemede' },
            { id: 'incelemede', label: 'İncelemede' },
            { id: 'kabul', label: 'Kabul Edildi' },
            { id: 'yapim', label: 'Yapımda' },
            { id: 'yakin', label: 'Yakında' },
            { id: 'yayin', label: 'Yayında!' },
            { id: 'red', label: 'Reddedildi' }
          ].map(chip => (
            <button
              key={chip.id}
              type="button"
              onClick={() => setCurrentStatusFilter(chip.id)}
              className={`px-3 py-1 rounded-full text-[11px] font-bold transition border cursor-pointer ${
                currentStatusFilter === chip.id
                  ? 'bg-purple-600 text-white border-purple-400 shadow-md scale-105'
                  : 'bg-gray-900/80 text-gray-400 border-purple-500/20 hover:text-white hover:border-purple-500/40'
              }`}
            >
              {chip.label}
            </button>
          ))}
        </div>
      </div>

      {/* LOADING INDICATOR */}
      {isLoading && (
        <div className="text-center py-10 space-y-3">
          <RotateCw size={28} className="animate-spin text-purple-400 mx-auto" />
          <p className="text-xs text-purple-300 font-bold">Galaksi verileri Google E-Tablo'dan çekiliyor...</p>
        </div>
      )}

      {/* CARD GRID */}
      {!isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredRequests.length === 0 ? (
            <div className="col-span-full text-center py-12 bg-gray-900/60 border border-purple-500/20 rounded-3xl p-6 space-y-3">
              <AlertTriangle size={32} className="mx-auto text-amber-400" />
              <p className="text-gray-300 font-bold text-sm">Aramanıza veya filtreye uygun seri isteği bulunamadı.</p>
              <button
                type="button"
                onClick={() => setIsNewModalOpen(true)}
                className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs rounded-xl shadow-lg transition"
              >
                İlk İsteği Siz Gönderin!
              </button>
            </div>
          ) : (
            filteredRequests.map((item, idx) => {
              const statusBadge = getStatusBadge(item.status || item.durum);

              return (
                <div
                  key={item.id || item.row || idx}
                  className="bg-gray-900/90 border border-purple-500/20 hover:border-purple-500/50 rounded-2xl p-3.5 sm:p-4 flex gap-3 sm:gap-4 shadow-xl transition-all duration-300 hover:shadow-purple-950/50 relative overflow-hidden group"
                >
                  {/* Cover Image */}
                  <img
                    src={item.coverImage || item.resim || DEFAULT_COVER}
                    alt={item.title || item.seri}
                    onError={e => { (e.target as any).src = DEFAULT_COVER; }}
                    className="w-20 h-28 sm:w-24 sm:h-32 object-cover rounded-xl shadow-lg border border-purple-500/30 shrink-0 group-hover:scale-105 transition-transform"
                  />

                  {/* Card Details */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div className="space-y-1">
                      {/* Header: Title + Status Badge */}
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-extrabold text-sm sm:text-base text-white truncate group-hover:text-purple-300 transition" title={item.title || item.seri}>
                          {item.title || item.seri}
                        </h4>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-black border flex items-center gap-1 shrink-0 ${statusBadge.class}`}>
                          {statusBadge.icon} {statusBadge.text}
                        </span>
                      </div>

                      {/* Requester & Category Meta */}
                      <div className="text-[11px] text-gray-400 space-x-1">
                        <span><strong>İsteyen:</strong> <span className="text-purple-300 font-bold">{item.requestedBy || item.kullanici}</span> ({item.createdAt || item.tarih})</span>
                        <span>|</span>
                        <span className="text-fuchsia-300 font-bold">{item.type || item.kat}</span>
                        {(item.originalStatus || item.seriDurumu) && (
                          <span className="text-amber-300 font-bold"> | 🔖 {item.originalStatus || item.seriDurumu}</span>
                        )}
                      </div>

                      {/* Genre Tags */}
                      {item.tags && item.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-1">
                          {item.tags.map((t, tIdx) => (
                            <span
                              key={tIdx}
                              className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded border ${
                                t.includes('+18')
                                  ? 'bg-rose-950 text-rose-300 border-rose-500/50'
                                  : t.includes('BL')
                                  ? 'bg-cyan-950 text-cyan-300 border-cyan-500/50'
                                  : 'bg-purple-950 text-purple-300 border-purple-500/30'
                              }`}
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Note / Rejection Reason Box */}
                      {statusBadge.dataStatus === 'red' && (item.link || item.note || item.rejectionReason) ? (
                        <div className="text-[10.5px] font-bold text-rose-300 bg-rose-950/60 border border-rose-500/40 px-2.5 py-1 rounded-lg mt-1 line-clamp-2">
                          ❌ {item.rejectionReason || item.note || item.link}
                        </div>
                      ) : (item.note || item.link) ? (
                        <div className="text-[10.5px] text-cyan-300 bg-black/40 border border-cyan-500/30 px-2.5 py-1 rounded-lg mt-1 line-clamp-2">
                          <strong>Not:</strong> {item.note || item.link}
                        </div>
                      ) : null}
                    </div>

                    {/* Card Action Bar */}
                    <div className="pt-2 border-t border-gray-800/80 flex items-center gap-2 flex-wrap mt-2">
                      <button
                        type="button"
                        onClick={() => handleVote(item)}
                        className="px-3 py-1 rounded-xl text-xs font-black transition border cursor-pointer bg-amber-950/60 hover:bg-amber-900/80 text-amber-300 border-amber-500/40 active:scale-95"
                      >
                        👍 {item.votes || item.oy || 0} Oy
                      </button>

                      {statusBadge.dataStatus === 'yayin' && item.readLink && (
                        <a
                          href={item.readLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs flex items-center gap-1 shadow transition"
                        >
                          <BookOpen size={12} /> Oku
                        </a>
                      )}

                      <a
                        href={DISCORD_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] text-gray-400 hover:text-white flex items-center gap-1 ml-auto"
                      >
                        <MessageCircle size={12} /> Ekibe Sor
                      </a>
                    </div>

                    {/* ADMIN TOOLS PANEL */}
                    {isAdminActive && (
                      <div className="mt-2 pt-2 border-t border-dashed border-purple-500/30 flex items-center gap-1.5 flex-wrap">
                        <button
                          type="button"
                          onClick={() => openEditModal(item)}
                          className="px-2 py-0.5 rounded bg-amber-600 hover:bg-amber-500 text-white text-[10px] font-black cursor-pointer"
                        >
                          ✏️ Düzenle
                        </button>
                        <button
                          type="button"
                          onClick={() => handleQuickStatusUpdate(item, 'İncelemede')}
                          className="px-2 py-0.5 rounded bg-purple-700 hover:bg-purple-600 text-white text-[10px] font-black cursor-pointer"
                        >
                          🔍 İnceleme
                        </button>
                        <button
                          type="button"
                          onClick={() => handleQuickStatusUpdate(item, 'Kabul Edildi')}
                          className="px-2 py-0.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-black cursor-pointer"
                        >
                          🟢 Kabul
                        </button>
                        <button
                          type="button"
                          onClick={() => handleQuickStatusUpdate(item, 'Yapımda')}
                          className="px-2 py-0.5 rounded bg-cyan-600 hover:bg-cyan-500 text-white text-[10px] font-black cursor-pointer"
                        >
                          🔵 Yapım
                        </button>
                        <button
                          type="button"
                          onClick={() => handleQuickStatusUpdate(item, 'Yakında')}
                          className="px-2 py-0.5 rounded bg-orange-600 hover:bg-orange-500 text-white text-[10px] font-black cursor-pointer"
                        >
                          ⏳ Yakında
                        </button>
                        <button
                          type="button"
                          onClick={() => handleQuickStatusUpdate(item, 'Yayında!')}
                          className="px-2 py-0.5 rounded bg-fuchsia-600 hover:bg-fuchsia-500 text-white text-[10px] font-black cursor-pointer"
                        >
                          🔮 Yayında
                        </button>
                        <button
                          type="button"
                          onClick={() => handleReject(item)}
                          className="px-2 py-0.5 rounded bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-black cursor-pointer"
                        >
                          🔴 Reddet
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(item)}
                          className="px-2 py-0.5 rounded bg-gray-800 hover:bg-gray-700 text-gray-200 text-[10px] font-black cursor-pointer"
                        >
                          🗑️ Sil
                        </button>
                      </div>
                    )}

                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* YENİ İSTEK GÖNDERME MODALI */}
      {isNewModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-slate-900 border border-purple-500/40 rounded-3xl p-6 max-w-lg w-full shadow-2xl relative max-h-[92vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setIsNewModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white p-2 rounded-full hover:bg-white/10 transition"
            >
              <X size={20} />
            </button>

            <h3 className="text-lg font-black text-purple-300 flex items-center gap-2 mb-4">
              <Rocket size={20} className="text-fuchsia-400" />
              <span>Seri İsteğinde Bulun</span>
            </h3>

            <form onSubmit={handleNewRequestSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-gray-300 mb-1">Kullanıcı Adınız:</label>
                <input
                  type="text"
                  required
                  placeholder="Örn: Starlight"
                  value={reqUser}
                  onChange={e => setReqUser(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-950 border border-purple-500/30 rounded-xl text-white text-xs placeholder:text-gray-600 focus:outline-none focus:border-purple-400"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-300 mb-1">İstediğiniz Seri Adı:</label>
                <input
                  type="text"
                  required
                  placeholder="Örn: Solo Leveling"
                  value={reqTitle}
                  onChange={e => handleTitleChange(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-950 border border-purple-500/30 rounded-xl text-white text-xs placeholder:text-gray-600 focus:outline-none focus:border-purple-400"
                />
                {duplicateWarning && (
                  <div className="mt-1.5 p-2.5 bg-amber-950/80 border border-amber-500/50 text-amber-200 text-xs rounded-xl font-medium leading-relaxed">
                    {duplicateWarning}
                  </div>
                )}
              </div>

              <div>
                <label className="block font-bold text-gray-300 mb-1">Kategori:</label>
                <select
                  value={reqKat}
                  onChange={e => setReqKat(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-950 border border-purple-500/30 rounded-xl text-white text-xs focus:outline-none focus:border-purple-400"
                >
                  <option value="Manhwa">Manhwa</option>
                  <option value="Novel">Novel</option>
                  <option value="Manga">Manga</option>
                  <option value="Manhua">Manhua</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-gray-300 mb-1">📖 Serinin Orijinal Durumu (İsteğe Bağlı):</label>
                <input
                  type="text"
                  placeholder="Örn: Tamamlandı (80 Bölüm), Devam Ediyor vb."
                  value={reqSeriDurum}
                  onChange={e => setReqSeriDurum(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-950 border border-purple-500/30 rounded-xl text-white text-xs placeholder:text-gray-600 focus:outline-none focus:border-purple-400"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-300 mb-1.5">Tür / Etiketler (İsteğe Bağlı):</label>
                <div className="flex flex-wrap gap-2">
                  {['BL', 'GL', 'Yeni Seri', '+18'].map(t => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => handleTagToggle(t)}
                      className={`px-3 py-1 rounded-xl text-xs font-bold transition border cursor-pointer ${
                        reqTags.includes(t)
                          ? 'bg-purple-600 text-white border-purple-400 shadow-md'
                          : 'bg-gray-950 text-gray-400 border-purple-500/20 hover:text-white'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-300 mb-1">🖼️ Kapak Resmi (Yükleyin veya Link Yapıştırın):</label>
                <div className="space-y-2">
                  <label className="flex items-center justify-center gap-2 px-4 py-2.5 bg-purple-950/60 hover:bg-purple-900/80 border border-dashed border-purple-500/50 text-purple-200 text-xs font-bold rounded-xl cursor-pointer transition">
                    <Upload size={14} />
                    <span>Galeriden / Bilgisayardan Fotoğraf Seç</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={e => handleFileUpload(e, false)}
                      className="hidden"
                    />
                  </label>
                  {uploadStatus && (
                    <div className="text-xs font-bold text-cyan-300">{uploadStatus}</div>
                  )}

                  <input
                    type="url"
                    placeholder="Veya doğrudan https://... resim linki yapıştırın"
                    value={reqImg}
                    onChange={e => setReqImg(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-gray-950 border border-purple-500/30 rounded-xl text-white text-xs placeholder:text-gray-600 focus:outline-none focus:border-purple-400"
                  />

                  {reqImg && (
                    <div className="text-center pt-1">
                      <img
                        src={fixImageUrl(reqImg)}
                        alt="Önizleme"
                        onError={e => { (e.target as any).src = DEFAULT_COVER; }}
                        className="w-16 h-24 object-cover mx-auto rounded-lg border border-purple-400 shadow-md"
                      />
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-300 mb-1">Not veya Bağlantı (İsteğe Bağlı):</label>
                <input
                  type="text"
                  placeholder="Örn: Raw linki veya açıklaması"
                  value={reqLink}
                  onChange={e => setReqLink(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-950 border border-purple-500/30 rounded-xl text-white text-xs placeholder:text-gray-600 focus:outline-none focus:border-purple-400"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewModalOpen(false)}
                  className="px-4 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold rounded-xl transition"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 text-white font-extrabold rounded-xl shadow-lg transition disabled:opacity-50"
                >
                  {isSubmitting ? 'Gönderiliyor...' : '🚀 Gönder'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADMIN EDİT MODALI */}
      {isEditModalOpen && editingRequest && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-slate-900 border border-purple-500/40 rounded-3xl p-6 max-w-lg w-full shadow-2xl relative max-h-[92vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setIsEditModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white p-2 rounded-full hover:bg-white/10 transition"
            >
              <X size={20} />
            </button>

            <h3 className="text-lg font-black text-purple-300 flex items-center gap-2 mb-4">
              <Edit3 size={20} className="text-amber-400" />
              <span>Seri Bilgilerini Düzenle</span>
            </h3>

            <form onSubmit={handleEditSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-gray-300 mb-1">Seri Adı:</label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={e => setEditTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-950 border border-purple-500/30 rounded-xl text-white text-xs focus:outline-none focus:border-purple-400"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-300 mb-1">Kategori:</label>
                <select
                  value={editKat}
                  onChange={e => setEditKat(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-950 border border-purple-500/30 rounded-xl text-white text-xs focus:outline-none focus:border-purple-400"
                >
                  <option value="Manhwa">Manhwa</option>
                  <option value="Novel">Novel</option>
                  <option value="Manga">Manga</option>
                  <option value="Manhua">Manhua</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-gray-300 mb-1">Durum:</label>
                <select
                  value={editDurum}
                  onChange={e => setEditDurum(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-950 border border-purple-500/30 rounded-xl text-white text-xs focus:outline-none focus:border-purple-400"
                >
                  <option value="Beklemede">Beklemede</option>
                  <option value="İncelemede">İncelemede</option>
                  <option value="Kabul Edildi">Kabul Edildi</option>
                  <option value="Yapımda">Yapımda</option>
                  <option value="Yakında">Yakında</option>
                  <option value="Yayında!">Yayında!</option>
                  <option value="Reddedildi">Reddedildi</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-gray-300 mb-1">📖 Serinin Orijinal Durumu:</label>
                <input
                  type="text"
                  placeholder="Örn: Tamamlandı (100 Bölüm)"
                  value={editSeriDurum}
                  onChange={e => setEditSeriDurum(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-950 border border-purple-500/30 rounded-xl text-white text-xs focus:outline-none focus:border-purple-400"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-300 mb-1">🖼️ Kapak Resmi (Yükleyin veya Değiştirin):</label>
                <div className="space-y-2">
                  <label className="flex items-center justify-center gap-2 px-4 py-2.5 bg-purple-950/60 hover:bg-purple-900/80 border border-dashed border-purple-500/50 text-purple-200 text-xs font-bold rounded-xl cursor-pointer transition">
                    <Upload size={14} />
                    <span>Yeni Fotoğraf Yükle</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={e => handleFileUpload(e, true)}
                      className="hidden"
                    />
                  </label>
                  {editUploadStatus && (
                    <div className="text-xs font-bold text-cyan-300">{editUploadStatus}</div>
                  )}

                  <input
                    type="url"
                    value={editImg}
                    onChange={e => setEditImg(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-gray-950 border border-purple-500/30 rounded-xl text-white text-xs focus:outline-none focus:border-purple-400"
                  />

                  {editImg && (
                    <div className="text-center pt-1">
                      <img
                        src={fixImageUrl(editImg)}
                        alt="Önizleme"
                        onError={e => { (e.target as any).src = DEFAULT_COVER; }}
                        className="w-16 h-24 object-cover mx-auto rounded-lg border border-purple-400 shadow-md"
                      />
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-300 mb-1">📖 Okuma Linki (Yayında Seriler İçin):</label>
                <input
                  type="url"
                  placeholder="https://mikrokosmosfb.blogspot.com/..."
                  value={editReadLink}
                  onChange={e => setEditReadLink(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-950 border border-purple-500/30 rounded-xl text-white text-xs focus:outline-none focus:border-purple-400"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-300 mb-1">Not / Bağlantı / ❌ Red Nedeni:</label>
                <input
                  type="text"
                  placeholder="Örn: Red Nedeni: Başka ekip çeviriyor"
                  value={editNote}
                  onChange={e => setEditNote(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-950 border border-purple-500/30 rounded-xl text-white text-xs focus:outline-none focus:border-purple-400"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-300 mb-1">Tür / Etiketler (Virgülle Ayırın):</label>
                <input
                  type="text"
                  placeholder="BL, Romantizm, +18"
                  value={editTags}
                  onChange={e => setEditTags(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-950 border border-purple-500/30 rounded-xl text-white text-xs focus:outline-none focus:border-purple-400"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold rounded-xl transition"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 text-white font-extrabold rounded-xl shadow-lg transition"
                >
                  💾 Değişiklikleri Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
