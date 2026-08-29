import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import {
  Sparkles,
  Zap,
  Coins,
  Send,
  UserCheck,
  Search,
  Plus,
  Minus,
  Equal,
  Clock,
  Trash2,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Users,
  Shield,
  Crown,
  History,
  Download,
  Gift,
  Award,
  ArrowRight,
  TrendingUp,
  MessageSquare,
  Sparkle
} from 'lucide-react';
import { KnownUserRecord, PointGrantLog } from '../types';

export const AdminPointsManager: React.FC = () => {
  const {
    user,
    knownUsers,
    pointGrantLogs,
    grantCosmoPoints,
    deletePointGrantLog,
    showToast
  } = useApp();

  const [targetEmail, setTargetEmail] = useState('');
  const [amount, setAmount] = useState<number | string>(250);
  const [mode, setMode] = useState<'add' | 'subtract' | 'set'>('add');
  const [note, setNote] = useState('🎁 Etkinlik / Yarışma Ödülü');
  const [sendNotification, setSendNotification] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [historySearchQuery, setHistorySearchQuery] = useState('');

  // Selected user preview
  const selectedUser = useMemo(() => {
    const clean = targetEmail.trim().toLowerCase();
    if (!clean) return null;
    return knownUsers.find(u => u.email.toLowerCase() === clean) || null;
  }, [targetEmail, knownUsers]);

  // Total points distributed calculation
  const totalPointsDistributed = useMemo(() => {
    return pointGrantLogs.reduce((acc, log) => {
      if (log.mode === 'add') return acc + log.amount;
      return acc;
    }, 0);
  }, [pointGrantLogs]);

  // Quick preset amount values
  const presetAmounts = [50, 100, 250, 500, 1000, 5000, 10000, 999999];

  // Quick preset notes
  const presetNotes = [
    '🎁 Etkinlik / Yarışma Ödülü',
    '✨ Sadakat & Destekçi Teşekkür Hediyesi',
    '💬 Değerli Yorum & Katkı Bonusu',
    '🛠️ Sistem Hatası & Bakım Telafisi',
    '👑 Özel VIP Üyelik Tanımlaması',
    '⚡ Manuel Yönetici Yüklemesi'
  ];

  // Filtered users for table
  const filteredUsers = useMemo(() => {
    const query = userSearchQuery.trim().toLowerCase();
    if (!query) return knownUsers;
    return knownUsers.filter(
      u =>
        u.email.toLowerCase().includes(query) ||
        u.name.toLowerCase().includes(query) ||
        (u.role && u.role.toLowerCase().includes(query))
    );
  }, [knownUsers, userSearchQuery]);

  // Filtered history logs
  const filteredLogs = useMemo(() => {
    const query = historySearchQuery.trim().toLowerCase();
    if (!query) return pointGrantLogs;
    return pointGrantLogs.filter(
      l =>
        l.targetEmail.toLowerCase().includes(query) ||
        (l.note && l.note.toLowerCase().includes(query)) ||
        l.adminEmail.toLowerCase().includes(query)
    );
  }, [pointGrantLogs, historySearchQuery]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = targetEmail.trim().toLowerCase();
    if (!cleanEmail) {
      showToast({
        title: 'E-posta Eksik ⚠️',
        message: 'Lütfen Cosmo-Puan yüklemek istediğiniz kullanıcının e-posta adresini girin.',
        type: 'warning'
      });
      return;
    }

    const numAmount = Math.abs(Number(amount)) || 0;
    if (numAmount <= 0 && mode !== 'set') {
      showToast({
        title: 'Miktar Geçersiz ⚠️',
        message: 'Lütfen 0\'dan büyük geçerli bir Cosmo-Puan miktarı belirleyin.',
        type: 'warning'
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await grantCosmoPoints(cleanEmail, numAmount, mode, note, sendNotification);
      if (res.success) {
        // Clear amount or keep for another
      }
    } catch (err: any) {
      showToast({
        title: 'Yükleme Başarısız ❌',
        message: err?.message || 'Puan yüklenirken bir hata oluştu.',
        type: 'warning'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSelectUserQuick = (userRecord: KnownUserRecord) => {
    setTargetEmail(userRecord.email);
    window.scrollTo({ top: 150, behavior: 'smooth' });
  };

  const handleExportLogs = () => {
    const jsonStr = JSON.stringify(pointGrantLogs, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mikrokosmos_cosmo_puan_loglari_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast({
      title: 'Loglar İndirildi 📥',
      message: 'Cosmo-Puan yükleme geçmişi JSON olarak kaydedildi.',
      type: 'info'
    });
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-purple-950/90 via-purple-900/60 to-amber-950/80 border border-purple-500/30 rounded-3xl p-4 sm:p-6 lg:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 via-orange-500 to-purple-600 border border-amber-400/50 flex items-center justify-center text-black shadow-xl shadow-amber-900/40 shrink-0">
              <Sparkles size={30} className="text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Yönetici Kontrolü
                </span>
                <span className="text-[11px] font-bold text-purple-300 flex items-center gap-1">
                  <Coins size={13} className="text-amber-400" />
                  Cosmo-Puan Sistemi
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white mt-1 flex items-center gap-2">
                <span>Manuel Cosmo-Puan Yükleme & Bakiye Yönetimi</span>
              </h2>
              <p className="text-xs sm:text-sm text-purple-200/80 mt-1 max-w-2xl leading-relaxed">
                İstediğiniz kullanıcı e-posta adresine doğrudan <strong>Cosmo-Puan</strong> tanımlayabilir, bakiye düşürebilir veya özel bakiye atayabilirsiniz. Yüklenen puanlar kullanıcının hesabına anında yansır.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-start lg:self-center">
            <button
              onClick={handleExportLogs}
              className="px-4 py-2.5 rounded-xl bg-gray-900/80 hover:bg-gray-800 border border-purple-500/30 text-purple-200 text-xs font-bold flex items-center gap-2 transition shadow cursor-pointer active:scale-95"
              title="Tüm puan geçmişini JSON olarak indir"
            >
              <Download size={14} className="text-amber-400" />
              <span>Logları İndir</span>
            </button>
          </div>
        </div>

        {/* Stats Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-purple-500/20">
          <div className="bg-gray-950/60 rounded-2xl p-3 border border-purple-500/20">
            <p className="text-[10px] text-gray-400 font-bold uppercase truncate">Kayıtlı Kullanıcı</p>
            <p className="text-lg font-black text-white flex items-center gap-1.5 mt-0.5">
              <Users size={16} className="text-purple-400" />
              {knownUsers.length}
            </p>
          </div>

          <div className="bg-gray-950/60 rounded-2xl p-3 border border-purple-500/20">
            <p className="text-[10px] text-gray-400 font-bold uppercase truncate">Dağıtılan Manuel CP</p>
            <p className="text-lg font-black text-amber-300 flex items-center gap-1.5 mt-0.5">
              <Coins size={16} className="text-amber-400" />
              {totalPointsDistributed.toLocaleString()} CP
            </p>
          </div>

          <div className="bg-gray-950/60 rounded-2xl p-3 border border-purple-500/20">
            <p className="text-[10px] text-gray-400 font-bold uppercase truncate">Toplam İşlem Logu</p>
            <p className="text-lg font-black text-white flex items-center gap-1.5 mt-0.5">
              <History size={16} className="text-indigo-400" />
              {pointGrantLogs.length}
            </p>
          </div>

          <div className="bg-gray-950/60 rounded-2xl p-3 border border-purple-500/20">
            <p className="text-[10px] text-gray-400 font-bold uppercase truncate">Yetkili Yönetici</p>
            <p className="text-xs font-black text-emerald-400 flex items-center gap-1.5 mt-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              {user?.email || 'aseleliyeva77@gmail.com'}
            </p>
          </div>
        </div>
      </div>

      {/* Main Grid: Form + User Quick Picker */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* ===================== LEFT: GRANT POINTS FORM (7 cols) ===================== */}
        <div className="lg:col-span-7 space-y-6">
          <form
            onSubmit={handleSubmit}
            className="bg-gray-900/90 border border-purple-500/20 rounded-3xl p-4 sm:p-6 lg:p-8 shadow-xl space-y-6"
          >
            <div className="flex items-center justify-between border-b border-gray-800 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 bg-amber-500/20 border border-amber-500/30 rounded-xl text-amber-400">
                  <Zap size={20} />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">Puan Yükleme Formu</h3>
                  <p className="text-xs text-gray-400">Hedef hesap ve yüklenecek Cosmo-Puan miktarını belirleyin.</p>
                </div>
              </div>

              {selectedUser && (
                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-black px-2.5 py-1 rounded-full flex items-center gap-1">
                  <CheckCircle2 size={12} /> Hesap Bulundu
                </span>
              )}
            </div>

            {/* Target Email Input */}
            <div className="space-y-2">
              <label className="block text-xs font-extrabold text-gray-300 flex items-center justify-between">
                <span>Hedef E-Posta Adresi <span className="text-red-400">*</span></span>
                {selectedUser && (
                  <span className="text-amber-300 text-[11px] font-bold">
                    Mevcut Bakiye: <strong>{selectedUser.coins?.toLocaleString()} CP</strong>
                  </span>
                )}
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={targetEmail}
                  onChange={e => setTargetEmail(e.target.value)}
                  placeholder="ornek: kullanici@gmail.com"
                  className="w-full bg-gray-950 border border-purple-500/40 text-white placeholder-gray-500 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 transition"
                />
              </div>

              {/* Quick Select Chips */}
              <div className="flex items-center gap-1.5 flex-wrap pt-1">
                <span className="text-[11px] text-gray-400 mr-1">Hızlı Seç:</span>
                {knownUsers.slice(0, 4).map(u => (
                  <button
                    key={u.uid}
                    type="button"
                    onClick={() => setTargetEmail(u.email)}
                    className={`text-[11px] px-2.5 py-1 rounded-xl border transition cursor-pointer flex items-center gap-1.5 ${
                      targetEmail.toLowerCase() === u.email.toLowerCase()
                        ? 'bg-amber-500 text-black font-extrabold border-amber-400 shadow-md'
                        : 'bg-gray-950 text-gray-300 hover:text-white hover:bg-gray-800 border-gray-800'
                    }`}
                  >
                    <img
                      src={u.avatar}
                      alt={u.name}
                      className="w-3.5 h-3.5 rounded-full object-cover"
                    />
                    <span>{u.name}</span>
                    <span className="text-[10px] opacity-70">({u.coins} CP)</span>
                  </button>
                ))}
              </div>
            </div>

            {/* User Live Preview Card */}
            {selectedUser && (
              <div className="p-4 rounded-2xl bg-purple-950/40 border border-purple-500/30 flex items-center justify-between gap-3 animate-fadeIn">
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={selectedUser.avatar}
                    alt={selectedUser.name}
                    className="w-11 h-11 rounded-2xl border-2 border-purple-400 object-cover shadow"
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-black text-white truncate">{selectedUser.name}</p>
                      {selectedUser.role === 'admin' && (
                        <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.2 rounded border border-amber-500/30 font-bold">
                          Admin
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-gray-400 truncate">{selectedUser.email}</p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <p className="text-[10px] text-gray-400 uppercase font-bold">Mevcut CP</p>
                  <p className="text-sm font-black text-amber-300">{selectedUser.coins?.toLocaleString()} CP</p>
                </div>
              </div>
            )}

            {/* Operation Mode Selector */}
            <div className="space-y-2">
              <label className="block text-xs font-extrabold text-gray-300">
                İşlem Türü
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setMode('add')}
                  className={`p-3 rounded-2xl border text-xs font-bold flex flex-col items-center gap-1 transition cursor-pointer ${
                    mode === 'add'
                      ? 'bg-emerald-950/80 border-emerald-400 text-emerald-200 shadow-lg shadow-emerald-950/50'
                      : 'bg-gray-950 border-gray-800 text-gray-400 hover:text-gray-200 hover:bg-gray-900'
                  }`}
                >
                  <Plus size={16} className={mode === 'add' ? 'text-emerald-400' : ''} />
                  <span>Puan Ekle (+)</span>
                  <span className="text-[10px] font-normal opacity-70">Bakiyeye ilave et</span>
                </button>

                <button
                  type="button"
                  onClick={() => setMode('subtract')}
                  className={`p-3 rounded-2xl border text-xs font-bold flex flex-col items-center gap-1 transition cursor-pointer ${
                    mode === 'subtract'
                      ? 'bg-red-950/80 border-red-400 text-red-200 shadow-lg shadow-red-950/50'
                      : 'bg-gray-950 border-gray-800 text-gray-400 hover:text-gray-200 hover:bg-gray-900'
                  }`}
                >
                  <Minus size={16} className={mode === 'subtract' ? 'text-red-400' : ''} />
                  <span>Puan Çıkar (-)</span>
                  <span className="text-[10px] font-normal opacity-70">Bakiyeden düş</span>
                </button>

                <button
                  type="button"
                  onClick={() => setMode('set')}
                  className={`p-3 rounded-2xl border text-xs font-bold flex flex-col items-center gap-1 transition cursor-pointer ${
                    mode === 'set'
                      ? 'bg-indigo-950/80 border-indigo-400 text-indigo-200 shadow-lg shadow-indigo-950/50'
                      : 'bg-gray-950 border-gray-800 text-gray-400 hover:text-gray-200 hover:bg-gray-900'
                  }`}
                >
                  <Equal size={16} className={mode === 'set' ? 'text-indigo-400' : ''} />
                  <span>Sabit Bakiye (=)</span>
                  <span className="text-[10px] font-normal opacity-70">Tam tutara ayarla</span>
                </button>
              </div>
            </div>

            {/* Amount Input & Preset Pills */}
            <div className="space-y-3">
              <label className="block text-xs font-extrabold text-gray-300">
                Cosmo-Puan (CP) Miktarı
              </label>

              {/* Amount Numeric Input */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-amber-400 font-black">
                  <Coins size={18} />
                </div>
                <input
                  type="number"
                  min="0"
                  required
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  className="w-full bg-gray-950 border border-purple-500/40 text-white font-mono font-black text-lg pl-11 pr-16 py-3 rounded-2xl focus:outline-none focus:ring-2 focus:ring-amber-400 transition"
                  placeholder="250"
                />
                <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-xs font-bold text-gray-400">
                  CP
                </div>
              </div>

              {/* Preset Amount Pills */}
              <div className="flex items-center gap-2 flex-wrap">
                {presetAmounts.map(preset => {
                  const isSelected = Number(amount) === preset;
                  return (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setAmount(preset)}
                      className={`text-xs px-3 py-1.5 rounded-xl border transition cursor-pointer font-bold ${
                        isSelected
                          ? 'bg-amber-500 text-black border-amber-400 shadow-md shadow-amber-950/60'
                          : 'bg-gray-950 text-gray-300 hover:text-white hover:bg-gray-800 border-gray-800'
                      }`}
                    >
                      {preset >= 999999 ? '👑 VIP Sınırsız' : `+${preset.toLocaleString()} CP`}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Reason Note */}
            <div className="space-y-2">
              <label className="block text-xs font-extrabold text-gray-300">
                Yönetici Notu & Açıklama
              </label>
              <input
                type="text"
                value={note}
                onChange={e => setNote(e.target.value)}
                placeholder="Örn: 1. Sezon Manhwa Yarışması 1.si"
                className="w-full bg-gray-950 border border-gray-800 text-white placeholder-gray-500 rounded-2xl px-4 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-purple-400 transition"
              />

              <div className="flex items-center gap-1.5 flex-wrap pt-1">
                {presetNotes.map(pn => (
                  <button
                    key={pn}
                    type="button"
                    onClick={() => setNote(pn)}
                    className={`text-[10px] px-2.5 py-1 rounded-lg border transition cursor-pointer ${
                      note === pn
                        ? 'bg-purple-900/60 text-purple-200 border-purple-400 font-bold'
                        : 'bg-gray-950 text-gray-400 hover:text-gray-200 border-gray-800'
                    }`}
                  >
                    {pn}
                  </button>
                ))}
              </div>
            </div>

            {/* Notification Checkbox */}
            <label className="flex items-center gap-3 p-3.5 rounded-2xl bg-gray-950 border border-gray-800/80 cursor-pointer hover:bg-gray-900 transition">
              <input
                type="checkbox"
                checked={sendNotification}
                onChange={e => setSendNotification(e.target.checked)}
                className="w-4 h-4 rounded text-amber-500 bg-gray-900 border-gray-700 focus:ring-amber-400"
              />
              <div className="text-xs">
                <span className="font-bold text-white">Kullanıcıya Otomatik Bildirim Gönder</span>
                <p className="text-[11px] text-gray-400">Puan yüklendiğinde kullanıcının bildirim çubuğunda tebrik mesajı yayınlanır.</p>
              </div>
            </label>

            {/* Submit Action */}
            <button
              type="submit"
              disabled={isSubmitting || !targetEmail.trim()}
              className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-purple-600 hover:from-amber-400 hover:to-purple-500 text-black font-black text-sm shadow-xl shadow-amber-950/80 flex items-center justify-center gap-2 transition active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <RotateCcw size={18} className="animate-spin text-black" />
                  <span>İşlem Uygulanıyor...</span>
                </>
              ) : (
                <>
                  <Send size={18} className="text-black" />
                  <span>
                    {targetEmail ? `${targetEmail} Hesabına` : 'Hesaba'}{' '}
                    {mode === 'add' ? `+${amount} CP Yükle` : mode === 'subtract' ? `-${amount} CP Düşür` : `${amount} CP Ayarla`}{' '}
                    ⚡
                  </span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* ===================== RIGHT: REGISTERED USERS DIRECTORY (5 cols) ===================== */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-gray-900/90 border border-purple-500/20 rounded-3xl p-4 sm:p-6 lg:p-8 shadow-xl space-y-4 flex flex-col h-full">
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users size={18} className="text-purple-400" />
                <h3 className="text-sm font-black text-white">Kayıtlı Kullanıcılar</h3>
              </div>
              <span className="text-[11px] text-gray-400 font-bold">
                {filteredUsers.length} Kullanıcı
              </span>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={userSearchQuery}
                onChange={e => setUserSearchQuery(e.target.value)}
                placeholder="E-posta veya kullanıcı adı ara..."
                className="w-full bg-gray-950 border border-gray-800 text-white placeholder-gray-500 rounded-xl pl-9 pr-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-purple-400 transition"
              />
            </div>

            {/* User List Scroll Area */}
            <div className="flex-1 overflow-y-auto max-h-[480px] space-y-2 pr-1 custom-scrollbar">
              {filteredUsers.map(u => {
                const isSelected = targetEmail.toLowerCase() === u.email.toLowerCase();
                return (
                  <div
                    key={u.uid}
                    className={`p-3 rounded-2xl border transition flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'bg-purple-950/80 border-amber-400 shadow-md shadow-amber-950/40'
                        : 'bg-gray-950/70 border-gray-800/80 hover:bg-gray-900 hover:border-purple-500/40'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img
                        src={u.avatar}
                        alt={u.name}
                        className="w-8 h-8 rounded-xl object-cover border border-purple-500/30 shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-xs font-bold text-white truncate">{u.name}</p>
                          {u.role === 'admin' && (
                            <span className="text-[9px] bg-amber-500/20 text-amber-300 px-1 rounded border border-amber-500/30 font-bold shrink-0">
                              Admin
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-gray-400 truncate">{u.email}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <div className="text-right">
                        <span className="text-xs font-black text-amber-300">
                          {u.coins?.toLocaleString()}
                        </span>
                        <span className="text-[10px] text-gray-400 ml-0.5">CP</span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleSelectUserQuick(u)}
                        className={`p-1.5 rounded-lg border text-xs font-bold transition cursor-pointer ${
                          isSelected
                            ? 'bg-amber-500 text-black border-amber-400'
                            : 'bg-purple-900/40 text-purple-300 hover:bg-purple-800 border-purple-500/30'
                        }`}
                        title="Bu hesaba puan yükle"
                      >
                        <Zap size={13} />
                      </button>
                    </div>
                  </div>
                );
              })}

              {filteredUsers.length === 0 && (
                <div className="text-center py-8 text-gray-500 text-xs">
                  Aramanızla eşleşen kullanıcı bulunamadı.
                </div>
              )}
            </div>

            <div className="p-3 bg-purple-950/30 rounded-2xl border border-purple-500/20 text-[11px] text-purple-200/80 leading-relaxed">
              💡 <strong>İpucu:</strong> Kullanıcı listesinde kayıtlı olmasa bile yukarıdaki kutuya dilediğiniz herhangi bir e-posta adresi yazıp doğrudan puan yükleyebilirsiniz!
            </div>
          </div>
        </div>

      </div>

      {/* ===================== BOTTOM: TRANSACTION AUDIT LOGS ===================== */}
      <div className="bg-gray-900/90 border border-purple-500/20 rounded-3xl p-4 sm:p-6 lg:p-8 shadow-xl space-y-4">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-indigo-500/20 border border-indigo-500/30 rounded-xl text-indigo-400">
              <History size={20} />
            </div>
            <div>
              <h3 className="text-base font-black text-white">Yükleme Geçmişi & İşlem Kayıtları</h3>
              <p className="text-xs text-gray-400">Yönetici tarafından yapılan tüm manuel puan transferleri.</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative w-full sm:w-64">
              <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={historySearchQuery}
                onChange={e => setHistorySearchQuery(e.target.value)}
                placeholder="Loglarda e-posta ara..."
                className="w-full bg-gray-950 border border-gray-800 text-white placeholder-gray-500 rounded-xl pl-9 pr-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-purple-400 transition"
              />
            </div>
          </div>
        </div>

        {/* Logs Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-300">
            <thead>
              <tr className="border-b border-gray-800 text-[11px] text-gray-400 uppercase font-black">
                <th className="py-3 px-3">Tarih</th>
                <th className="py-3 px-3">Hedef Hesap</th>
                <th className="py-3 px-3">İşlem</th>
                <th className="py-3 px-3">Miktar</th>
                <th className="py-3 px-3">Bakiye Değişimi</th>
                <th className="py-3 px-3">Yönetici Notu</th>
                <th className="py-3 px-3">Yönetici</th>
                <th className="py-3 px-3 text-right">Aksiyon</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/60">
              {filteredLogs.map(log => {
                const isAdd = log.mode === 'add';
                const isSub = log.mode === 'subtract';
                return (
                  <tr key={log.id} className="hover:bg-purple-950/20 transition">
                    <td className="py-3 px-3 whitespace-nowrap text-gray-400 font-mono text-[11px]">
                      {log.date}
                    </td>

                    <td className="py-3 px-3 font-bold text-white">
                      {log.targetEmail}
                    </td>

                    <td className="py-3 px-3">
                      <span
                        className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
                          isAdd
                            ? 'bg-emerald-950 text-emerald-300 border-emerald-500/40'
                            : isSub
                            ? 'bg-red-950 text-red-300 border-red-500/40'
                            : 'bg-indigo-950 text-indigo-300 border-indigo-500/40'
                        }`}
                      >
                        {isAdd ? 'Puan Eklendi (+)' : isSub ? 'Puan Düşüldü (-)' : 'Sabit Ayarlandı (=)'}
                      </span>
                    </td>

                    <td className="py-3 px-3 font-mono font-black">
                      <span className={isAdd ? 'text-emerald-400' : isSub ? 'text-red-400' : 'text-indigo-300'}>
                        {isAdd ? `+${log.amount}` : isSub ? `-${log.amount}` : `${log.amount}`} CP
                      </span>
                    </td>

                    <td className="py-3 px-3 font-mono text-[11px] text-gray-400">
                      {log.previousBalance !== undefined && log.newBalance !== undefined ? (
                        <span>
                          {log.previousBalance} CP → <strong className="text-amber-300">{log.newBalance} CP</strong>
                        </span>
                      ) : (
                        '-'
                      )}
                    </td>

                    <td className="py-3 px-3 text-gray-300 max-w-xs truncate">
                      {log.note || '-'}
                    </td>

                    <td className="py-3 px-3 text-gray-400 font-mono text-[10px]">
                      {log.adminEmail.split('@')[0]}
                    </td>

                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => {
                            setTargetEmail(log.targetEmail);
                            setAmount(log.amount);
                            setMode(log.mode);
                            if (log.note) setNote(log.note);
                            window.scrollTo({ top: 150, behavior: 'smooth' });
                          }}
                          className="p-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-purple-300 hover:text-white transition cursor-pointer"
                          title="Bu işlemi tekrar yükleme formuna aktar"
                        >
                          <RotateCcw size={13} />
                        </button>

                        <button
                          onClick={() => deletePointGrantLog(log.id)}
                          className="p-1.5 rounded-lg bg-red-950/40 hover:bg-red-900 text-red-400 hover:text-red-200 transition cursor-pointer"
                          title="Log kaydını sil"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-gray-500">
                    Henüz kayıtlı bir puan transferi bulunmamaktadır.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

      </div>

    </div>
  );
};
