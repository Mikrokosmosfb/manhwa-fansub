import React, { useState, useMemo } from 'react';
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
  ExternalLink,
  MessageCircle,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Ban,
  Tag,
  Share2
} from 'lucide-react';

const DEFAULT_COVER = "https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?q=80&w=300&auto=format&fit=crop";
const DISCORD_URL = "https://discord.gg/H4cAsuFSYz";
const IMGBB_API_KEY = "889bb65f39d53ff8809f0a9a97974b2a";

const DEFAULT_INITIAL_REQUESTS: SeriesRequest[] = [
  {
    id: 'req-1',
    title: 'Solo Leveling: Ragnarok',
    type: 'Manhwa',
    synopsis: 'Sung Jin-Woo\'nun oğlu Sung Su-ho\'nun zindanlardaki aksiyon dolu maceraları.',
    votes: 48,
    votedUserIds: [],
    status: 'Yapımda',
    requestedBy: 'Starlight',
    createdAt: '2026-09-15',
    coverImage: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=400&auto=format&fit=crop&q=80',
    originalStatus: 'Devam Ediyor (50+ Bölüm)',
    tags: ['Aksiyon', 'Yeni Seri', 'Fantezi'],
    note: 'Çeviri ve editör ekibi atandı, yakında ilk bölümler yayında olacak.'
  },
  {
    id: 'req-2',
    title: 'Omniscient Reader\'s Viewpoint',
    type: 'Web Novel',
    synopsis: 'Kim Dokja\'nın tek okuyucusu olduğu web novel gerçeğe dönüşür.',
    votes: 35,
    votedUserIds: [],
    status: 'Yayında!',
    requestedBy: 'KozmikOkur',
    createdAt: '2026-08-10',
    coverImage: 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=400&auto=format&fit=crop&q=80',
    originalStatus: 'Tamamlandı (551 Bölüm)',
    tags: ['Novel', 'Fantezi'],
    readLink: '/#/seri/omniscient-reader'
  },
  {
    id: 'req-3',
    title: 'Pick Me Up! Infinite Gacha',
    type: 'Manhwa',
    synopsis: 'En zor gacha oyununda seviye 1 mobil karakter olarak uyanan Loki\'nin mücadelesi.',
    votes: 29,
    votedUserIds: [],
    status: 'İncelemede',
    requestedBy: 'Aysel',
    createdAt: '2026-10-01',
    coverImage: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=400&auto=format&fit=crop&q=80',
    originalStatus: 'Devam Ediyor',
    tags: ['Aksiyon', 'Gacha', 'Sistem']
  },
  {
    id: 'req-4',
    title: 'Semantic Error',
    type: 'Manhwa',
    synopsis: 'Kuralcı bilgisayar mühendisliği öğrencisi Chu Sang-woo ile popüler tasarım öğrencisi Jang Jae-young\'un hikayesi.',
    votes: 22,
    votedUserIds: [],
    status: 'Kabul Edildi',
    requestedBy: 'YaoiFan',
    createdAt: '2026-09-28',
    coverImage: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400&auto=format&fit=crop&q=80',
    originalStatus: 'Tamamlandı',
    tags: ['BL', 'Romantizm']
  }
];

export const RequestBoardView: React.FC = () => {
  const {
    seriesRequests,
    setSeriesRequests,
    voteSeriesRequest,
    addSeriesRequest,
    updateSeriesRequest,
    deleteSeriesRequest,
    user,
    isAdminLoggedIn,
    showToast
  } = useApp();

  // Populate default requests if list is completely empty
  React.useEffect(() => {
    if (!seriesRequests || seriesRequests.length === 0) {
      if (setSeriesRequests) {
        setSeriesRequests(DEFAULT_INITIAL_REQUESTS);
      }
    }
  }, [seriesRequests, setSeriesRequests]);

  const requestsList = (seriesRequests && seriesRequests.length > 0) ? seriesRequests : DEFAULT_INITIAL_REQUESTS;

  // Local State
  const [currentCategoryFilter, setCurrentCategoryFilter] = useState<string>('all');
  const [currentStatusFilter, setCurrentStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isAdminModeLocal, setIsAdminModeLocal] = useState<boolean>(() => {
    return Boolean(localStorage.getItem('mikro_admin_pass') || isAdminLoggedIn);
  });

  // Modal States
  const [isNewModalOpen, setIsNewModalOpen] = useState<boolean>(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [editingRequest, setEditingRequest] = useState<SeriesRequest | null>(null);

  // Form Fields - New Request
  const [reqUser, setReqUser] = useState<string>(user?.name || '');
  const [reqTitle, setReqTitle] = useState<string>('');
  const [reqKat, setReqKat] = useState<string>('Manhwa');
  const [reqSeriDurum, setReqSeriDurum] = useState<string>('');
  const [reqImg, setReqImg] = useState<string>('');
  const [reqLink, setReqLink] = useState<string>('');
  const [reqTags, setReqTags] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadStatus, setUploadStatus] = useState<string>('');
  const [duplicateWarning, setDuplicateWarning] = useState<string>('');

  // Form Fields - Edit Request
  const [editTitle, setEditTitle] = useState<string>('');
  const [editKat, setEditKat] = useState<string>('Manhwa');
  const [editDurum, setEditDurum] = useState<string>('Beklemede');
  const [editSeriDurum, setEditSeriDurum] = useState<string>('');
  const [editImg, setEditImg] = useState<string>('');
  const [editReadLink, setEditReadLink] = useState<string>('');
  const [editNote, setEditNote] = useState<string>('');
  const [editTags, setEditTags] = useState<string>('');
  const [editUploadStatus, setEditUploadStatus] = useState<string>('');

  const currentUserId = user?.uid || user?.email || 'anonymous-user';
  const isAdminActive = isAdminModeLocal || isAdminLoggedIn || (user && (user.email === 'aseleliyeva77@gmail.com' || user.email === 'mikrokosmosfansub@gmail.com'));

  const toggleAdminAuth = () => {
    const savedPass = localStorage.getItem('mikro_admin_pass');
    if (!savedPass && !isAdminLoggedIn) {
      const p = prompt('Yönetici Şifrenizi Girin:');
      if (p) {
        localStorage.setItem('mikro_admin_pass', p);
        setIsAdminModeLocal(true);
        showToast?.({ title: '🔑 Yönetici Modu Aktif', message: 'Yönetici yetkileriyle istekleri düzenleyebilirsiniz.', type: 'success' });
      }
    } else {
      localStorage.removeItem('mikro_admin_pass');
      setIsAdminModeLocal(false);
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
          // ImgBB Upload
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
            // Fallback to FileReader base64 URL directly
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
    const clean = val.toLowerCase().trim();
    const exists = requestsList.find(x => String(x.title || '').toLowerCase().trim() === clean);
    if (exists) {
      setDuplicateWarning(`⚠️ "${exists.title}" zaten listede var! (Mevcut Oy: ${exists.votes || 0}). Tekrar eklemek yerine ona oy verebilirsiniz.`);
    } else {
      setDuplicateWarning('');
    }
  };

  const handleTagToggle = (tagVal: string) => {
    setReqTags(prev => prev.includes(tagVal) ? prev.filter(t => t !== tagVal) : [...prev, tagVal]);
  };

  const handleNewRequestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reqTitle.trim()) return;

    addSeriesRequest({
      title: reqTitle.trim(),
      type: reqKat,
      synopsis: reqLink.trim() || `${reqTitle.trim()} serisi için kullanıcı isteği.`,
      requestedBy: reqUser.trim() || user?.name || 'Starlight',
      coverImage: reqImg.trim() || DEFAULT_COVER,
      originalStatus: reqSeriDurum.trim(),
      tags: reqTags,
      note: reqLink.trim(),
      status: 'Beklemede'
    });

    showToast?.({ title: '✨ İstek Gönderildi!', message: `"${reqTitle.trim()}" isteğiniz başarıyla havuzumuza eklendi!`, type: 'success' });
    setIsNewModalOpen(false);
    setReqTitle('');
    setReqSeriDurum('');
    setReqImg('');
    setReqLink('');
    setReqTags([]);
    setDuplicateWarning('');
  };

  const openEditModal = (req: SeriesRequest) => {
    if (!isAdminActive) {
      alert('Yönetici girişi yapmalısınız!');
      return;
    }
    setEditingRequest(req);
    setEditTitle(req.title || '');
    setEditKat(req.type || 'Manhwa');
    setEditDurum(req.status || 'Beklemede');
    setEditSeriDurum(req.originalStatus || '');
    setEditImg(req.coverImage || '');
    setEditReadLink(req.readLink || '');
    setEditNote(req.note || req.synopsis || '');
    setEditTags(req.tags ? req.tags.join(', ') : '');
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRequest) return;

    const parsedTags = editTags ? editTags.split(',').map(t => t.trim()).filter(Boolean) : [];

    if (updateSeriesRequest) {
      updateSeriesRequest(editingRequest.id, {
        title: editTitle.trim(),
        type: editKat,
        status: editDurum,
        originalStatus: editSeriDurum.trim(),
        coverImage: editImg.trim() || DEFAULT_COVER,
        readLink: editReadLink.trim(),
        note: editNote.trim(),
        tags: parsedTags
      });
    }

    showToast?.({ title: '💾 Kaydedildi!', message: `"${editTitle.trim()}" bilgileri başarıyla güncellendi.`, type: 'success' });
    setIsEditModalOpen(false);
    setEditingRequest(null);
  };

  const handleQuickStatusUpdate = (reqId: string, newStatus: string, customNote?: string) => {
    if (!isAdminActive) {
      alert('Yönetici girişi yapmalısınız!');
      return;
    }
    if (updateSeriesRequest) {
      updateSeriesRequest(reqId, {
        status: newStatus,
        ...(customNote !== undefined ? { note: customNote } : {})
      });
    }
    showToast?.({ title: '✅ Durum Güncellendi', message: `İstek durumu "${newStatus}" olarak ayarlandı.`, type: 'success' });
  };

  const handleReject = (req: SeriesRequest) => {
    if (!isAdminActive) {
      alert('Yönetici girişi yapmalısınız!');
      return;
    }
    const reason = prompt('Reddetme nedenini yazın (İsteğe bağlı):', 'Başka ekip çeviriyor');
    if (reason !== null) {
      handleQuickStatusUpdate(req.id, 'Reddedildi', reason ? `Red Nedeni: ${reason}` : '');
    }
  };

  const handleDelete = (req: SeriesRequest) => {
    if (!isAdminActive) {
      alert('Yönetici girişi yapmalısınız!');
      return;
    }
    if (confirm(`"${req.title}" isteğini tamamen silmek istediğinize emin misiniz?`)) {
      if (deleteSeriesRequest) {
        deleteSeriesRequest(req.id);
      }
      showToast?.({ title: '🗑️ İstek Silindi', message: `"${req.title}" havuzdan kaldırıldı.`, type: 'info' });
    }
  };

  const getStatusBadge = (rawStatus?: string) => {
    const st = String(rawStatus || 'Beklemede').toLowerCase();
    if (st.includes('incele')) {
      return { class: 'bg-purple-950/80 text-purple-300 border-purple-500/50', text: 'İncelemede', icon: <Clock size={11} /> };
    }
    if (st.includes('kabul')) {
      return { class: 'bg-emerald-950/80 text-emerald-300 border-emerald-500/50', text: 'Kabul Edildi', icon: <CheckCircle2 size={11} /> };
    }
    if (st.includes('yapim') || st.includes('yapım')) {
      return { class: 'bg-cyan-950/80 text-cyan-300 border-cyan-500/50', text: 'Yapımda', icon: <Sparkles size={11} /> };
    }
    if (st.includes('yakin') || st.includes('yakın')) {
      return { class: 'bg-amber-950/80 text-amber-300 border-amber-500/50', text: 'Yakında', icon: <Clock size={11} /> };
    }
    if (st.includes('yayin') || st.includes('yayın')) {
      return { class: 'bg-fuchsia-950/80 text-fuchsia-300 border-fuchsia-500/50', text: 'Yayında!', icon: <BookOpen size={11} /> };
    }
    if (st.includes('red')) {
      return { class: 'bg-rose-950/80 text-rose-300 border-rose-500/50', text: 'Reddedildi', icon: <Ban size={11} /> };
    }
    return { class: 'bg-amber-950/60 text-amber-400 border-amber-500/40', text: 'Beklemede', icon: <Clock size={11} /> };
  };

  // Filtered requests calculation
  const filteredRequests = useMemo(() => {
    return requestsList.filter(req => {
      const q = searchQuery.toLowerCase().trim();
      const matchQuery = !q ||
        req.title.toLowerCase().includes(q) ||
        req.requestedBy.toLowerCase().includes(q) ||
        (req.synopsis && req.synopsis.toLowerCase().includes(q));

      const matchCategory = currentCategoryFilter === 'all' ||
        req.type?.toLowerCase() === currentCategoryFilter.toLowerCase();

      const st = String(req.status || 'Beklemede').toLowerCase();
      let matchStatus = currentStatusFilter === 'all';
      if (!matchStatus) {
        if (currentStatusFilter === 'beklemede' && st.includes('beklem')) matchStatus = true;
        if (currentStatusFilter === 'incelemede' && st.includes('incelem')) matchStatus = true;
        if (currentStatusFilter === 'kabul' && st.includes('kabul')) matchStatus = true;
        if (currentStatusFilter === 'yapim' && (st.includes('yapim') || st.includes('yapım'))) matchStatus = true;
        if (currentStatusFilter === 'yakin' && (st.includes('yakin') || st.includes('yakın'))) matchStatus = true;
        if (currentStatusFilter === 'yayin' && (st.includes('yayin') || st.includes('yayın'))) matchStatus = true;
        if (currentStatusFilter === 'red' && st.includes('red')) matchStatus = true;
      }

      return matchQuery && matchCategory && matchStatus;
    });
  }, [requestsList, searchQuery, currentCategoryFilter, currentStatusFilter]);

  // #1 Top Trend Showcase
  const topTrendRequest = useMemo(() => {
    const activeCandidates = requestsList.filter(r => {
      const st = String(r.status || '').toLowerCase();
      return !st.includes('yayin') && !st.includes('red');
    });
    if (activeCandidates.length === 0) return null;
    return [...activeCandidates].sort((a, b) => b.votes - a.votes)[0] || null;
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
            onClick={() => {
              showToast?.({ title: '🔄 Liste Yenilendi', message: 'Tüm istek verileri güncellendi.', type: 'info' });
            }}
            className="px-4 py-2.5 bg-cyan-950/80 hover:bg-cyan-900/90 text-cyan-300 border border-cyan-500/40 font-bold text-xs rounded-full shadow-md flex items-center gap-2 transition active:scale-95 cursor-pointer"
          >
            <RotateCw size={14} />
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
            <span>{isAdminActive ? 'Yönetici Modu (Çıkış)' : 'Admin Girişi'}</span>
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
            <span><strong>Çizim Kalitesi:</strong> Çizimi profesyonel ve kaliteli olan serilerin alınma olasılığı yüksektir. Konusu ilgi çekici serilere öncelik veriyoruz.</span>
          </div>

          <div className="flex items-start gap-2 bg-black/30 p-2.5 rounded-xl border border-purple-500/20">
            <Clock size={14} className="text-cyan-400 shrink-0 mt-0.5" />
            <span><strong>Güncellik:</strong> Kısa, tamamlanmış ve en yeni/güncel serileri de hızlı şekilde listeye ekliyoruz.</span>
          </div>

          <div className="flex items-start gap-2 bg-black/30 p-2.5 rounded-xl border border-purple-500/20">
            <CheckCircle2 size={14} className="text-emerald-400 shrink-0 mt-0.5" />
            <span><strong>Emeğimiz:</strong> Başka ekibin yapması bizi bağlamaz; Mikrokosmos kendi kalitesiyle istenilen her seriyi çevirir.</span>
          </div>

          <div className="flex items-start gap-2 bg-black/30 p-2.5 rounded-xl border border-purple-500/20">
            <Bookmark size={14} className="text-indigo-400 shrink-0 mt-0.5" />
            <span><strong>Uzun Seriler:</strong> Tamamlanmış uzun seriler artıdır. Devam eden serilerde çizim ve konuya ekstra önem gösteriyoruz.</span>
          </div>

          <div className="flex items-start gap-2 bg-black/30 p-2.5 rounded-xl border border-purple-500/20">
            <Info size={14} className="text-amber-300 shrink-0 mt-0.5" />
            <span><strong>İncelemede olan Seriler:</strong> Değerlendirilen serilerin kaderi topluluğumuzun vereceği oylara göre netleşecektir.</span>
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
              src={topTrendRequest.coverImage || DEFAULT_COVER}
              alt={topTrendRequest.title}
              onError={e => { (e.target as any).src = DEFAULT_COVER; }}
              className="w-24 h-36 sm:w-28 sm:h-40 object-cover rounded-2xl shadow-2xl border border-fuchsia-500/40 shrink-0"
            />

            <div className="flex-1 min-w-0 text-center sm:text-left space-y-2">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h3 className="text-lg sm:text-xl font-black text-white tracking-wide">
                  {topTrendRequest.title}
                </h3>
                {(() => {
                  const badge = getStatusBadge(topTrendRequest.status);
                  return (
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border flex items-center gap-1 ${badge.class}`}>
                      {badge.icon} {badge.text}
                    </span>
                  );
                })()}
              </div>

              <p className="text-xs text-gray-300/90 leading-relaxed line-clamp-2">
                <strong>İsteyen:</strong> <span className="text-fuchsia-300 font-bold">{topTrendRequest.requestedBy}</span> ({topTrendRequest.createdAt}) • <span className="text-purple-300 font-bold">{topTrendRequest.type}</span> {topTrendRequest.originalStatus ? `• ${topTrendRequest.originalStatus}` : ''}
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

              {topTrendRequest.note && (
                <div className="p-2 rounded-xl bg-black/40 border border-cyan-500/30 text-xs text-cyan-200 font-medium">
                  <strong>Not:</strong> {topTrendRequest.note}
                </div>
              )}

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => voteSeriesRequest(topTrendRequest.id)}
                  className="px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs shadow-md flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
                >
                  <ThumbsUp size={14} />
                  <span>{topTrendRequest.votes} Oy</span>
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
        {/* Search input */}
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

      {/* CARD GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredRequests.length === 0 ? (
          <div className="col-span-full text-center py-12 bg-gray-900/60 border border-purple-500/20 rounded-3xl p-6 space-y-3">
            <AlertTriangle size={32} className="mx-auto text-amber-400" />
            <p className="text-gray-300 font-bold text-sm">Aramanıza uygun seri isteği bulunamadı.</p>
            <button
              type="button"
              onClick={() => setIsNewModalOpen(true)}
              className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs rounded-xl shadow-lg transition"
            >
              İlk İsteği Siz Gönderin!
            </button>
          </div>
        ) : (
          filteredRequests.map(item => {
            const hasVoted = item.votedUserIds.includes(currentUserId);
            const statusBadge = getStatusBadge(item.status);

            return (
              <div
                key={item.id}
                className="bg-gray-900/90 border border-purple-500/20 hover:border-purple-500/50 rounded-2xl p-3.5 sm:p-4 flex gap-3 sm:gap-4 shadow-xl transition-all duration-300 hover:shadow-purple-950/50 relative overflow-hidden group"
              >
                {/* Cover Image */}
                <img
                  src={item.coverImage || DEFAULT_COVER}
                  alt={item.title}
                  onError={e => { (e.target as any).src = DEFAULT_COVER; }}
                  className="w-20 h-28 sm:w-24 sm:h-32 object-cover rounded-xl shadow-lg border border-purple-500/30 shrink-0 group-hover:scale-105 transition-transform"
                />

                {/* Card Details */}
                <div className="flex-1 min-w-0 flex flex-col justify-between">
                  <div className="space-y-1">
                    {/* Header: Title + Status Badge */}
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-extrabold text-sm sm:text-base text-white truncate group-hover:text-purple-300 transition" title={item.title}>
                        {item.title}
                      </h4>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-black border flex items-center gap-1 shrink-0 ${statusBadge.class}`}>
                        {statusBadge.icon} {statusBadge.text}
                      </span>
                    </div>

                    {/* Requester & Category Meta */}
                    <div className="text-[11px] text-gray-400 space-x-1">
                      <span><strong>İsteyen:</strong> <span className="text-purple-300 font-bold">{item.requestedBy}</span> ({item.createdAt})</span>
                      <span>|</span>
                      <span className="text-fuchsia-300 font-bold">{item.type}</span>
                      {item.originalStatus && (
                        <span className="text-amber-300 font-bold"> | 🔖 {item.originalStatus}</span>
                      )}
                    </div>

                    {/* Genre Tags */}
                    {item.tags && item.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {item.tags.map((t, idx) => (
                          <span
                            key={idx}
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
                    {item.status === 'Reddedildi' && (item.rejectionReason || item.note) ? (
                      <div className="text-[10.5px] font-bold text-rose-300 bg-rose-950/60 border border-rose-500/40 px-2.5 py-1 rounded-lg mt-1 line-clamp-2">
                        ❌ {item.rejectionReason || item.note}
                      </div>
                    ) : item.note ? (
                      <div className="text-[10.5px] text-cyan-300 bg-black/40 border border-cyan-500/30 px-2.5 py-1 rounded-lg mt-1 line-clamp-2">
                        <strong>Not:</strong> {item.note}
                      </div>
                    ) : null}
                  </div>

                  {/* Card Action Bar */}
                  <div className="pt-2 border-t border-gray-800/80 flex items-center gap-2 flex-wrap mt-2">
                    <button
                      type="button"
                      onClick={() => voteSeriesRequest(item.id)}
                      className={`px-3 py-1 rounded-xl text-xs font-black transition border cursor-pointer ${
                        hasVoted
                          ? 'bg-amber-500 text-black border-amber-300 shadow-md scale-105'
                          : 'bg-amber-950/60 hover:bg-amber-900/80 text-amber-300 border-amber-500/40'
                      }`}
                    >
                      👍 {item.votes} Oy
                    </button>

                    {String(item.status || '').toLowerCase().includes('yayin') && item.readLink && (
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
                        onClick={() => handleQuickStatusUpdate(item.id, 'İncelemede')}
                        className="px-2 py-0.5 rounded bg-purple-700 hover:bg-purple-600 text-white text-[10px] font-black cursor-pointer"
                      >
                        🔍 İnceleme
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickStatusUpdate(item.id, 'Kabul Edildi')}
                        className="px-2 py-0.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-black cursor-pointer"
                      >
                        🟢 Kabul
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickStatusUpdate(item.id, 'Yapımda')}
                        className="px-2 py-0.5 rounded bg-cyan-600 hover:bg-cyan-500 text-white text-[10px] font-black cursor-pointer"
                      >
                        🔵 Yapım
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickStatusUpdate(item.id, 'Yakında')}
                        className="px-2 py-0.5 rounded bg-orange-600 hover:bg-orange-500 text-white text-[10px] font-black cursor-pointer"
                      >
                        ⏳ Yakında
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickStatusUpdate(item.id, 'Yayında!')}
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
                  {['BL', 'GL', 'Yeni Seri', '+18', 'Aksiyon', 'Romantizm'].map(t => (
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
                        src={reqImg}
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
                  className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 text-white font-extrabold rounded-xl shadow-lg transition"
                >
                  🚀 Gönder
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
                        src={editImg}
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
