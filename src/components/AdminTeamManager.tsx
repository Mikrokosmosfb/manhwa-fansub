import React, { useState, useMemo } from 'react';
import {
  ShieldCheck,
  Crown,
  Users,
  Search,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  UserCheck
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { TeamBadge, TeamBadges, TEAM_ROLE_PRESETS } from './TeamBadge';

export const AdminTeamManager: React.FC = () => {
  const {
    knownUsers,
    teamRoles,
    assignTeamRole,
    removeTeamRole,
    showToast
  } = useApp();

  const [targetEmail, setTargetEmail] = useState('');
  const [selectedRoles, setSelectedRoles] = useState<string[]>(['Çevirmen']);
  const [customRoleInput, setCustomRoleInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Selected user preview from knownUsers
  const selectedUser = useMemo(() => {
    const clean = targetEmail.trim().toLowerCase();
    if (!clean) return null;
    return knownUsers.find(u => u.email.toLowerCase() === clean) || null;
  }, [targetEmail, knownUsers]);

  // List of active team members
  const teamMembersList = useMemo(() => {
    return Object.values(teamRoles).sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  }, [teamRoles]);

  // Filtered team members
  const filteredTeamMembers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return teamMembersList;
    return teamMembersList.filter(m =>
      (m.email && m.email.toLowerCase().includes(q)) ||
      (m.name && m.name.toLowerCase().includes(q)) ||
      (m.roles && m.roles.some(r => r.toLowerCase().includes(q)))
    );
  }, [teamMembersList, searchQuery]);

  const togglePresetRole = (roleName: string) => {
    setSelectedRoles(prev => {
      if (prev.includes(roleName)) {
        return prev.filter(r => r !== roleName);
      } else {
        return [...prev, roleName];
      }
    });
  };

  const handleAddCustomRole = () => {
    const clean = customRoleInput.trim();
    if (!clean) return;
    if (!selectedRoles.includes(clean)) {
      setSelectedRoles(prev => [...prev, clean]);
    }
    setCustomRoleInput('');
  };

  const handleEditMember = (email: string) => {
    const record = teamRoles[email.toLowerCase().trim()];
    if (record) {
      setTargetEmail(record.email);
      setSelectedRoles(record.roles && record.roles.length > 0 ? record.roles : ['Çevirmen']);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleRemoveMember = async (email: string, name?: string) => {
    if (!confirm(`"${name || email}" kullanıcısının tüm ekip rollerini kaldırmak istediğinize emin misiniz?`)) {
      return;
    }
    const res = await removeTeamRole(email);
    showToast?.({
      title: res.success ? 'Rol Kaldırıldı 🗑️' : 'Hata ⚠️',
      message: res.message,
      type: res.success ? 'info' : 'warning'
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = targetEmail.trim().toLowerCase();
    if (!cleanEmail) {
      showToast?.({
        title: 'E-posta Eksik ⚠️',
        message: 'Lütfen ekip rolü atamak istediğiniz kullanıcının e-posta adresini girin.',
        type: 'warning'
      });
      return;
    }

    if (selectedRoles.length === 0) {
      showToast?.({
        title: 'Rol Seçilmedi ⚠️',
        message: 'Lütfen kullanıcıya en az bir ekip rolü (Çevirmen, Editör vb.) seçin.',
        type: 'warning'
      });
      return;
    }

    setIsSubmitting(true);
    const resolvedName = selectedUser?.name || cleanEmail.split('@')[0];
    const res = await assignTeamRole(cleanEmail, selectedRoles, resolvedName, selectedUser?.uid);
    setIsSubmitting(false);

    showToast?.({
      title: res.success ? 'Ekip Rolü Kaydedildi ✨' : 'Hata ⚠️',
      message: res.message,
      type: res.success ? 'success' : 'error'
    });

    // Reset target email on success
    if (res.success) {
      setTargetEmail('');
      setSelectedRoles(['Çevirmen']);
      setCustomRoleInput('');
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-purple-950 via-gray-900 to-indigo-950 border border-purple-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-black uppercase tracking-wider">
              <ShieldCheck size={14} />
              <span>Resmi Ekip Unvanları</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Ekip & Rol Yönetimi
            </h2>
            <p className="text-xs sm:text-sm text-purple-200/80 max-w-2xl leading-relaxed">
              Çevirmen, Editör, Kurucu, Yönetici, Moderatör gibi resmi ekip unvanlarını belirleyin.
              Bu etiketler sitede <strong>bölüm yorumlarında, yanıtlarında, Top 50 sıralamasında ve profillerde</strong> isimlerinin hemen yanında renkli ve simgeli olarak otomatik gösterilir.
            </p>
          </div>

          <div className="bg-black/40 border border-purple-500/30 rounded-2xl p-4 shrink-0 flex items-center gap-4 shadow-inner">
            <div className="w-12 h-12 rounded-2xl bg-purple-600/20 border border-purple-400/40 flex items-center justify-center text-purple-300">
              <Users size={24} />
            </div>
            <div>
              <div className="text-[10px] text-gray-400 uppercase font-black">Toplam Ekip Üyesi</div>
              <div className="text-2xl font-black text-white">{teamMembersList.length} Kişi</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Left Form, Right Active Team Directory */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* ===================== LEFT: ROLE ASSIGNMENT FORM (7 cols) ===================== */}
        <div className="lg:col-span-7 bg-gray-900/90 border border-purple-500/20 rounded-3xl p-5 sm:p-7 shadow-xl space-y-6">
          
          <div className="flex items-center justify-between border-b border-gray-800 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 bg-purple-500/20 border border-purple-500/30 rounded-xl text-purple-300">
                <Crown size={20} />
              </div>
              <div>
                <h3 className="text-base font-black text-white">Ekip Rolü Tanımla / Güncelle</h3>
                <p className="text-xs text-gray-400">Kullanıcının e-postasını girip atanacak unvanları seçin.</p>
              </div>
            </div>
            {selectedUser && (
              <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-black px-2.5 py-1 rounded-full flex items-center gap-1">
                <CheckCircle2 size={12} /> Hesap Bulundu
              </span>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Target Email Input */}
            <div className="space-y-2">
              <label className="block text-xs font-extrabold text-gray-300">
                Hedef E-Posta Adresi <span className="text-red-400">*</span>
              </label>
              <input
                type="email"
                required
                value={targetEmail}
                onChange={e => setTargetEmail(e.target.value)}
                placeholder="ornek: cevirmen@gmail.com"
                className="w-full bg-gray-950 border border-purple-500/40 text-white placeholder-gray-500 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-400 transition"
              />

              {/* Quick Select from Known Users */}
              <div className="flex items-center gap-1.5 flex-wrap pt-1">
                <span className="text-[11px] text-gray-400 mr-1">Hızlı Seç:</span>
                {knownUsers.slice(0, 5).map(u => (
                  <button
                    key={u.uid}
                    type="button"
                    onClick={() => setTargetEmail(u.email)}
                    className={`text-[11px] px-2.5 py-1 rounded-xl border transition cursor-pointer flex items-center gap-1.5 ${
                      targetEmail.toLowerCase() === u.email.toLowerCase()
                        ? 'bg-purple-600 text-white font-extrabold border-purple-400 shadow-md'
                        : 'bg-gray-950 text-gray-300 hover:text-white hover:bg-gray-800 border-gray-800'
                    }`}
                  >
                    <img src={u.avatar} alt={u.name} className="w-3.5 h-3.5 rounded-full object-cover" />
                    <span>{u.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Selected User Live Preview Card */}
            {selectedUser && (
              <div className="p-4 rounded-2xl bg-purple-950/40 border border-purple-500/30 flex items-center justify-between gap-3 animate-fadeIn">
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={selectedUser.avatar}
                    alt={selectedUser.name}
                    className="w-11 h-11 rounded-2xl border-2 border-purple-400 object-cover shadow"
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-black text-white truncate">{selectedUser.name}</p>
                    <p className="text-[11px] text-gray-400 truncate">{selectedUser.email}</p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-[10px] text-gray-400 block font-bold">Mevcut Rolleri</span>
                  <TeamBadges roles={teamRoles[selectedUser.email.toLowerCase()]?.roles} size="xs" />
                </div>
              </div>
            )}

            {/* Preset Roles Toggle Grid */}
            <div className="space-y-2.5 pt-2">
              <label className="block text-xs font-extrabold text-gray-300 flex items-center justify-between">
                <span>Resmi Ekip Rolleri (Birden fazla seçilebilir)</span>
                <span className="text-purple-300 text-[11px]">Seçili: {selectedRoles.length} rol</span>
              </label>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {TEAM_ROLE_PRESETS.map(preset => {
                  const isChecked = selectedRoles.includes(preset.name);
                  const Icon = preset.icon;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => togglePresetRole(preset.name)}
                      className={`p-2.5 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between gap-1.5 ${
                        isChecked
                          ? `${preset.badgeClass} ring-2 ring-purple-400/50 scale-[1.02]`
                          : 'bg-gray-950/80 border-gray-800 text-gray-400 hover:border-purple-500/40 hover:text-gray-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <Icon size={16} className={preset.iconColor} />
                        <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center text-[9px] font-bold ${
                          isChecked ? 'bg-purple-500 border-white text-white' : 'border-gray-700'
                        }`}>
                          {isChecked ? '✓' : ''}
                        </span>
                      </div>
                      <span className="text-xs font-black truncate">{preset.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Role Input */}
            <div className="space-y-2 pt-2">
              <label className="block text-xs font-extrabold text-gray-300">
                Özel Rol Ekle (Opsiyonel)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customRoleInput}
                  onChange={e => setCustomRoleInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddCustomRole(); } }}
                  placeholder="örn: Kıdemli Çevirmen, Dizgici, Redaktör..."
                  className="flex-1 bg-gray-950 border border-gray-800 text-white placeholder-gray-500 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-purple-400 transition"
                />
                <button
                  type="button"
                  onClick={handleAddCustomRole}
                  className="px-3 py-2 bg-purple-900/60 hover:bg-purple-800 text-purple-200 border border-purple-500/30 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer shrink-0"
                >
                  <Plus size={14} /> Ekle
                </button>
              </div>
            </div>

            {/* Live Badge Preview Bar */}
            <div className="p-3.5 bg-black/60 border border-purple-500/30 rounded-2xl space-y-2">
              <div className="flex items-center justify-between text-[11px] text-gray-400 font-bold">
                <span className="flex items-center gap-1 text-purple-300">
                  <Sparkles size={13} /> Sitede Nasıl Görünecek?
                </span>
                <span>Canlı Önizleme</span>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-black text-white">{selectedUser?.name || 'Örnek Kullanıcı'}</span>
                <TeamBadges roles={selectedRoles} size="xs" />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:from-purple-500 hover:via-indigo-500 hover:to-purple-500 text-white font-black text-sm tracking-wide shadow-xl shadow-purple-950/60 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <span>Kaydediliyor...</span>
              ) : (
                <>
                  <UserCheck size={18} />
                  <span>Ekip Rollerini Ata ve Sitede Yayınla</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* ===================== RIGHT: REGISTERED TEAM DIRECTORY (5 cols) ===================== */}
        <div className="lg:col-span-5 bg-gray-900/90 border border-purple-500/20 rounded-3xl p-5 sm:p-7 shadow-xl space-y-5 flex flex-col">
          
          <div className="flex items-center justify-between border-b border-gray-800 pb-4">
            <div className="flex items-center gap-2">
              <Users size={18} className="text-purple-400" />
              <h3 className="text-base font-black text-white">Mevcut Ekip Kadrosu</h3>
            </div>
            <span className="text-xs text-purple-300 font-bold px-2 py-0.5 rounded-full bg-purple-950/60 border border-purple-500/30">
              {filteredTeamMembers.length} Üye
            </span>
          </div>

          {/* Search Input */}
          <div className="relative">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Ekip üyesi veya rol ara..."
              className="w-full bg-gray-950 border border-gray-800 text-white placeholder-gray-500 rounded-xl pl-9 pr-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-purple-400 transition"
            />
          </div>

          {/* Members List */}
          <div className="space-y-2.5 overflow-y-auto max-h-[540px] pr-1 custom-scrollbar">
            {filteredTeamMembers.map(member => (
              <div
                key={member.email}
                className="p-3.5 rounded-2xl bg-gray-950/80 border border-gray-800/80 hover:border-purple-500/40 hover:bg-gray-950 transition flex items-center justify-between gap-3 group"
              >
                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-black text-white truncate">{member.name || member.email}</p>
                  </div>
                  <p className="text-[10px] text-gray-400 truncate">{member.email}</p>
                  <div className="pt-0.5">
                    <TeamBadges roles={member.roles} size="xs" />
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleEditMember(member.email)}
                    className="p-2 rounded-xl bg-purple-950/60 hover:bg-purple-800 text-purple-300 hover:text-white transition border border-purple-500/30 cursor-pointer"
                    title="Rolleri Düzenle"
                  >
                    <Edit2 size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemoveMember(member.email, member.name)}
                    className="p-2 rounded-xl bg-red-950/40 hover:bg-red-700 text-red-400 hover:text-white transition border border-red-500/30 cursor-pointer"
                    title="Ekip Rolünü Kaldır"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}

            {filteredTeamMembers.length === 0 && (
              <div className="text-center py-12 text-gray-500 text-xs">
                Aramanızla eşleşen ekip üyesi bulunamadı.
              </div>
            )}
          </div>

          <div className="p-3.5 bg-purple-950/30 rounded-2xl border border-purple-500/20 text-[11px] text-purple-200/80 leading-relaxed">
            ✨ <strong>Otomatik Gösterim:</strong> Buradan atadığınız tüm roller sitenin her yerinde (yorumlarda, sıralamada, profil sayfalarında) kullanıcıların isimlerinin yanında anında görünür!
          </div>

        </div>

      </div>
    </div>
  );
};
