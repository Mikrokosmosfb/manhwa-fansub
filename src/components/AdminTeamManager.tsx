import React, { useState, useMemo, useEffect, useRef } from 'react';
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
  UserCheck,
  X,
  User,
  RefreshCw
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { TeamBadge, TeamBadges, TEAM_ROLE_PRESETS } from './TeamBadge';

interface CloudflareUserItem {
  uid?: string;
  email: string;
  name: string;
  avatar?: string;
}

export const AdminTeamManager: React.FC = () => {
  const {
    knownUsers,
    teamRoles,
    assignTeamRole,
    removeTeamRole,
    comments,
    showToast
  } = useApp();

  const [targetEmail, setTargetEmail] = useState('');
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [fetchedCloudflareUsers, setFetchedCloudflareUsers] = useState<CloudflareUserItem[]>([]);
  const [isLoadingCloudflareUsers, setIsLoadingCloudflareUsers] = useState(false);

  const [selectedRoles, setSelectedRoles] = useState<string[]>(['Çevirmen']);
  const [customRoleInput, setCustomRoleInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const searchContainerRef = useRef<HTMLDivElement>(null);

  // 1. Fetch Cloudflare D1 Registered Users on Mount
  const fetchUsersFromCloudflare = async () => {
    setIsLoadingCloudflareUsers(true);
    try {
      const res = await fetch('/api/admin/users');
      if (!res.ok) return;
      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) return;
      const data = await res.json();
      if (data && data.success && Array.isArray(data.users)) {
        setFetchedCloudflareUsers(data.users);
      }
    } catch (e) {
      console.warn('Could not fetch Cloudflare users:', e);
    } finally {
      setIsLoadingCloudflareUsers(false);
    }
  };

  useEffect(() => {
    fetchUsersFromCloudflare();
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 2. Aggregate all available users (Cloudflare D1 + knownUsers + Comments)
  const allUsersList = useMemo(() => {
    const map = new Map<string, CloudflareUserItem>();

    // Add Cloudflare users
    fetchedCloudflareUsers.forEach(u => {
      if (u && u.email) {
        map.set(u.email.toLowerCase().trim(), {
          uid: u.uid,
          email: u.email.trim(),
          name: u.name || u.email.split('@')[0],
          avatar: u.avatar
        });
      }
    });

    // Add knownUsers
    knownUsers.forEach(u => {
      if (u && u.email) {
        const key = u.email.toLowerCase().trim();
        if (!map.has(key)) {
          map.set(key, {
            uid: u.uid,
            email: u.email.trim(),
            name: u.name || u.email.split('@')[0],
            avatar: u.avatar
          });
        } else {
          const existing = map.get(key)!;
          if (!existing.avatar) existing.avatar = u.avatar;
          if (!existing.name) existing.name = u.name;
        }
      }
    });

    // Add comment authors
    comments.forEach(c => {
      if (c && c.userName && c.userId && c.userId.includes('@')) {
        const key = c.userId.toLowerCase().trim();
        if (!map.has(key)) {
          map.set(key, {
            uid: c.userId,
            email: c.userId,
            name: c.userName,
            avatar: c.userAvatar
          });
        }
      }
    });

    return Array.from(map.values());
  }, [fetchedCloudflareUsers, knownUsers, comments]);

  // Currently selected target user preview
  const selectedUser = useMemo(() => {
    const clean = targetEmail.trim().toLowerCase();
    if (!clean) return null;
    return allUsersList.find(u => u.email.toLowerCase() === clean) || {
      email: targetEmail,
      name: targetEmail.split('@')[0]
    };
  }, [targetEmail, allUsersList]);

  // Filtered users for live autocomplete dropdown
  const searchedUsersList = useMemo(() => {
    const q = userSearchQuery.trim().toLowerCase();
    if (!q) return allUsersList.slice(0, 15);

    return allUsersList.filter(u => {
      const normName = u.name.toLowerCase();
      const normEmail = u.email.toLowerCase();
      return normName.includes(q) || normEmail.includes(q);
    }).slice(0, 20);
  }, [allUsersList, userSearchQuery]);

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

  const handleSelectUserFromDropdown = (userItem: CloudflareUserItem) => {
    setTargetEmail(userItem.email);
    setUserSearchQuery(`${userItem.name} (${userItem.email})`);
    setIsDropdownOpen(false);

    // If user already has team roles assigned, pre-populate them
    const existing = teamRoles[userItem.email.toLowerCase().trim()];
    if (existing && existing.roles && existing.roles.length > 0) {
      setSelectedRoles(existing.roles);
    }
  };

  const handleClearSelectedUser = () => {
    setTargetEmail('');
    setUserSearchQuery('');
    setSelectedRoles(['Çevirmen']);
  };

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
      setUserSearchQuery(`${record.name || record.email} (${record.email})`);
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
        title: 'Kullanıcı Seçilmedi ⚠️',
        message: 'Lütfen ekip rolü atamak istediğiniz bir kullanıcı arayın veya seçin.',
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

    if (res.success) {
      handleClearSelectedUser();
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
              Kullanıcı adını yazarak arayabilir ve Cloudflare veritabanındaki tüm üyeler arasından seçim yapabilirsiniz.
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
                <p className="text-xs text-gray-400">Üyenin adını veya e-postasını arayıp seçin, ardından unvan atayın.</p>
              </div>
            </div>
            {targetEmail && (
              <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-black px-2.5 py-1 rounded-full flex items-center gap-1">
                <CheckCircle2 size={12} /> Seçim Yapıldı
              </span>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Live Autocomplete User Search Field */}
            <div className="space-y-2 relative" ref={searchContainerRef}>
              <div className="flex items-center justify-between">
                <label className="block text-xs font-extrabold text-gray-300 flex items-center gap-1.5">
                  <Search size={14} className="text-purple-400" />
                  <span>Kullanıcı Ara (Kullanıcı Adı veya E-Posta)</span>
                  <span className="text-red-400">*</span>
                </label>
                <button
                  type="button"
                  onClick={fetchUsersFromCloudflare}
                  disabled={isLoadingCloudflareUsers}
                  className="text-[11px] text-purple-300 hover:text-purple-200 flex items-center gap-1 transition cursor-pointer"
                  title="Cloudflare Üye Listesini Yenile"
                >
                  <RefreshCw size={11} className={isLoadingCloudflareUsers ? 'animate-spin' : ''} />
                  <span>Cloudflare Üyelerini Yenile ({allUsersList.length})</span>
                </button>
              </div>

              <div className="relative">
                <input
                  type="text"
                  value={userSearchQuery}
                  onChange={e => {
                    setUserSearchQuery(e.target.value);
                    if (!isDropdownOpen) setIsDropdownOpen(true);
                    if (targetEmail && e.target.value !== selectedUser?.name) {
                      setTargetEmail('');
                    }
                  }}
                  onFocus={() => setIsDropdownOpen(true)}
                  placeholder="Kullanıcı adı veya e-posta girin (örn: Ahmet, cevirmen@gmail.com)..."
                  className="w-full bg-gray-950 border border-purple-500/40 text-white placeholder-gray-500 rounded-2xl pl-10 pr-10 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-400 transition"
                />
                <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-purple-400 pointer-events-none" />
                
                {userSearchQuery && (
                  <button
                    type="button"
                    onClick={handleClearSelectedUser}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-white rounded-full hover:bg-gray-800 transition cursor-pointer"
                    title="Aramayı Temizle"
                  >
                    <X size={15} />
                  </button>
                )}
              </div>

              {/* Autocomplete Dropdown List */}
              {isDropdownOpen && (
                <div className="absolute left-0 right-0 top-full mt-2 z-50 bg-gray-950 border border-purple-500/40 rounded-2xl shadow-2xl overflow-hidden max-h-72 overflow-y-auto custom-scrollbar backdrop-blur-xl divide-y divide-gray-800/60 animate-fadeIn">
                  <div className="p-2.5 bg-purple-950/40 text-[11px] font-bold text-purple-300 flex items-center justify-between border-b border-purple-900/40">
                    <span>
                      {searchedUsersList.length > 0
                        ? `${searchedUsersList.length} Kullanıcı Bulundu`
                        : 'Eşleşen Kullanıcı Bulunamadı'}
                    </span>
                    <span className="text-gray-400 text-[10px]">Tıklayarak Seçin</span>
                  </div>

                  {searchedUsersList.length > 0 ? (
                    searchedUsersList.map(u => {
                      const isCurrentlySelected = targetEmail.toLowerCase() === u.email.toLowerCase();
                      const existingRecord = teamRoles[u.email.toLowerCase()];
                      return (
                        <div
                          key={u.email}
                          onClick={() => handleSelectUserFromDropdown(u)}
                          className={`p-3 flex items-center justify-between gap-3 cursor-pointer transition ${
                            isCurrentlySelected
                              ? 'bg-purple-900/50 border-l-4 border-purple-400'
                              : 'hover:bg-purple-950/40'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <img
                              src={u.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(u.email)}`}
                              alt={u.name}
                              className="w-9 h-9 rounded-xl border border-purple-500/30 object-cover shrink-0"
                            />
                            <div className="min-w-0">
                              <p className="text-xs font-black text-white truncate">{u.name}</p>
                              <p className="text-[11px] text-gray-400 truncate">{u.email}</p>
                            </div>
                          </div>

                          {existingRecord && existingRecord.roles && existingRecord.roles.length > 0 ? (
                            <div className="shrink-0 text-right">
                              <TeamBadges roles={existingRecord.roles} size="xs" />
                            </div>
                          ) : (
                            <span className="text-[10px] text-gray-500 font-bold shrink-0">
                              Üye
                            </span>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <div className="p-4 text-center text-xs text-gray-400 space-y-2">
                      <p>Girdiğiniz arama terimine uygun kayıtlı üye bulunamadı.</p>
                      {userSearchQuery.includes('@') && (
                        <button
                          type="button"
                          onClick={() => {
                            setTargetEmail(userSearchQuery.trim());
                            setIsDropdownOpen(false);
                          }}
                          className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition"
                        >
                          "{userSearchQuery}" Adresini Doğrudan Kullan
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Quick Select Pill Buttons for Registered Users */}
              <div className="flex items-center gap-1.5 flex-wrap pt-1">
                <span className="text-[11px] text-gray-400 mr-1 font-bold">Kayıtlı Üyeler:</span>
                {allUsersList.slice(0, 6).map(u => (
                  <button
                    key={u.email}
                    type="button"
                    onClick={() => handleSelectUserFromDropdown(u)}
                    className={`text-[11px] px-2.5 py-1 rounded-xl border transition cursor-pointer flex items-center gap-1.5 ${
                      targetEmail.toLowerCase() === u.email.toLowerCase()
                        ? 'bg-purple-600 text-white font-extrabold border-purple-400 shadow-md'
                        : 'bg-gray-950 text-gray-300 hover:text-white hover:bg-gray-800 border-gray-800'
                    }`}
                  >
                    <img src={u.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(u.email)}`} alt={u.name} className="w-3.5 h-3.5 rounded-full object-cover" />
                    <span>{u.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Selected User Live Preview Card */}
            {targetEmail && (
              <div className="p-4 rounded-2xl bg-purple-950/40 border border-purple-500/40 flex items-center justify-between gap-3 animate-fadeIn shadow-lg">
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={selectedUser?.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(targetEmail)}`}
                    alt={selectedUser?.name || targetEmail}
                    className="w-12 h-12 rounded-2xl border-2 border-purple-400 object-cover shadow"
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-black text-white truncate">{selectedUser?.name || targetEmail.split('@')[0]}</p>
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full font-bold">
                        Seçili
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-400 truncate">{targetEmail}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right hidden sm:block">
                    <span className="text-[10px] text-gray-400 block font-bold">Mevcut Rolleri</span>
                    <TeamBadges roles={teamRoles[targetEmail.toLowerCase()]?.roles} size="xs" />
                  </div>
                  <button
                    type="button"
                    onClick={handleClearSelectedUser}
                    className="p-1.5 bg-gray-800 hover:bg-rose-600 text-gray-300 hover:text-white rounded-xl transition cursor-pointer"
                    title="Seçimi Temizle"
                  >
                    <X size={15} />
                  </button>
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
              disabled={isSubmitting || !targetEmail}
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
