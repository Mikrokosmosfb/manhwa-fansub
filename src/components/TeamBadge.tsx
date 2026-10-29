import React from 'react';
import {
  Crown,
  Star,
  ShieldAlert,
  Award,
  Zap,
  PenTool,
  Palette,
  Sparkles
} from 'lucide-react';

export interface TeamRolePreset {
  id: string;
  name: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  badgeClass: string;
  iconColor: string;
  description: string;
}

export const TEAM_ROLE_PRESETS: TeamRolePreset[] = [
  {
    id: 'kurucu',
    name: 'Kurucu',
    icon: Crown,
    badgeClass: 'bg-gradient-to-r from-amber-500/20 via-yellow-500/20 to-amber-600/20 border-amber-400/60 text-amber-300 shadow-sm shadow-amber-950/60',
    iconColor: 'text-amber-400',
    description: 'Mikrokosmos Fansub Kurucusu'
  },
  {
    id: 'yonetici',
    name: 'Yönetici',
    icon: Star,
    badgeClass: 'bg-gradient-to-r from-purple-500/25 via-fuchsia-500/25 to-pink-500/25 border-purple-400/60 text-purple-200 shadow-sm shadow-purple-950/60',
    iconColor: 'text-purple-300',
    description: 'Üst Düzey Ekip Yöneticisi'
  },
  {
    id: 'admin',
    name: 'Admin',
    icon: ShieldAlert,
    badgeClass: 'bg-gradient-to-r from-red-600/25 via-rose-500/25 to-red-700/25 border-rose-400/60 text-rose-300 shadow-sm shadow-red-950/60',
    iconColor: 'text-rose-400',
    description: 'Sistem & Platform Yöneticisi'
  },
  {
    id: 'yardimci-yonetici',
    name: 'Yardımcı Yönetici',
    icon: Award,
    badgeClass: 'bg-gradient-to-r from-violet-500/25 via-indigo-500/25 to-blue-500/25 border-violet-400/60 text-violet-300 shadow-sm shadow-violet-950/60',
    iconColor: 'text-violet-300',
    description: 'Yönetim Destek & Koordinatör'
  },
  {
    id: 'moderator',
    name: 'Moderatör',
    icon: Zap,
    badgeClass: 'bg-gradient-to-r from-cyan-500/25 via-sky-500/25 to-blue-500/25 border-cyan-400/60 text-cyan-300 shadow-sm shadow-cyan-950/60',
    iconColor: 'text-cyan-300',
    description: 'Topluluk & Yorum Düzenleyici'
  },
  {
    id: 'cevirmen',
    name: 'Çevirmen',
    icon: PenTool,
    badgeClass: 'bg-gradient-to-r from-emerald-500/25 via-teal-500/25 to-green-500/25 border-emerald-400/60 text-emerald-300 shadow-sm shadow-emerald-950/60',
    iconColor: 'text-emerald-300',
    description: 'Seri Çevirmeni'
  },
  {
    id: 'editor',
    name: 'Editör',
    icon: Palette,
    badgeClass: 'bg-gradient-to-r from-fuchsia-500/25 via-pink-500/25 to-rose-500/25 border-fuchsia-400/60 text-fuchsia-300 shadow-sm shadow-fuchsia-950/60',
    iconColor: 'text-fuchsia-300',
    description: 'Dizgi, Temizleme & Grafik Editörü'
  },
  {
    id: 'son-soz-bukucu',
    name: 'Son Söz Bükücü',
    icon: Crown,
    badgeClass: 'bg-gradient-to-r from-amber-500/30 via-yellow-400/35 to-amber-600/30 border-amber-400 text-amber-200 shadow-md shadow-amber-950/80 animate-pulse',
    iconColor: 'text-amber-300',
    description: '1. Yorum Şampiyonu'
  },
  {
    id: 'bas-elestirmen',
    name: 'Baş Eleştirmen',
    icon: Award,
    badgeClass: 'bg-gradient-to-r from-cyan-500/30 via-sky-400/35 to-blue-600/30 border-cyan-400 text-cyan-200 shadow-md shadow-cyan-950/80',
    iconColor: 'text-cyan-300',
    description: '2. Yorum Şampiyonu'
  },
  {
    id: 'yorumbaz',
    name: 'Yorumbaz',
    icon: Sparkles,
    badgeClass: 'bg-gradient-to-r from-purple-500/30 via-fuchsia-400/35 to-pink-600/30 border-purple-400 text-purple-200 shadow-md shadow-purple-950/80',
    iconColor: 'text-pink-300',
    description: '3. Yorum Şampiyonu'
  }
];

export const getTeamRoleConfig = (roleName: string): {
  name: string;
  Icon: React.ComponentType<{ size?: number; className?: string }>;
  badgeClass: string;
  iconColor: string;
} => {
  const clean = (roleName || '').trim().toLowerCase();

  if (clean.includes('son söz bükücü') || clean.includes('son soz bukucu')) {
    return { name: 'Son Söz Bükücü', Icon: Crown, badgeClass: TEAM_ROLE_PRESETS[7].badgeClass, iconColor: TEAM_ROLE_PRESETS[7].iconColor };
  }
  if (clean.includes('baş eleştirmen') || clean.includes('bas elestirmen')) {
    return { name: 'Baş Eleştirmen', Icon: Award, badgeClass: TEAM_ROLE_PRESETS[8].badgeClass, iconColor: TEAM_ROLE_PRESETS[8].iconColor };
  }
  if (clean.includes('yorumbaz')) {
    return { name: 'Yorumbaz', Icon: Sparkles, badgeClass: TEAM_ROLE_PRESETS[9].badgeClass, iconColor: TEAM_ROLE_PRESETS[9].iconColor };
  }

  if (clean === 'kurucu') {
    return { name: 'Kurucu', Icon: Crown, badgeClass: TEAM_ROLE_PRESETS[0].badgeClass, iconColor: TEAM_ROLE_PRESETS[0].iconColor };
  }
  if (clean === 'yonetici' || clean === 'yönetici') {
    return { name: 'Yönetici', Icon: Star, badgeClass: TEAM_ROLE_PRESETS[1].badgeClass, iconColor: TEAM_ROLE_PRESETS[1].iconColor };
  }
  if (clean === 'admin' || clean === 'administrator') {
    return { name: 'Admin', Icon: ShieldAlert, badgeClass: TEAM_ROLE_PRESETS[2].badgeClass, iconColor: TEAM_ROLE_PRESETS[2].iconColor };
  }
  if (clean.includes('yardımcı') || clean.includes('yardimci') || clean === 'co-admin') {
    return { name: roleName || 'Yardımcı Yönetici', Icon: Award, badgeClass: TEAM_ROLE_PRESETS[3].badgeClass, iconColor: TEAM_ROLE_PRESETS[3].iconColor };
  }
  if (clean === 'moderator' || clean === 'moderatör' || clean === 'mod') {
    return { name: 'Moderatör', Icon: Zap, badgeClass: TEAM_ROLE_PRESETS[4].badgeClass, iconColor: TEAM_ROLE_PRESETS[4].iconColor };
  }
  if (clean.includes('çevirmen') || clean.includes('cevirmen') || clean.includes('translator')) {
    return { name: roleName || 'Çevirmen', Icon: PenTool, badgeClass: TEAM_ROLE_PRESETS[5].badgeClass, iconColor: TEAM_ROLE_PRESETS[5].iconColor };
  }
  if (clean.includes('editör') || clean.includes('editor') || clean.includes('typesetter') || clean.includes('cleaner') || clean.includes('dizgi')) {
    return { name: roleName || 'Editör', Icon: Palette, badgeClass: TEAM_ROLE_PRESETS[6].badgeClass, iconColor: TEAM_ROLE_PRESETS[6].iconColor };
  }

  // Custom role fallback
  return {
    name: roleName,
    Icon: Sparkles,
    badgeClass: 'bg-gradient-to-r from-blue-500/25 to-indigo-500/25 border-indigo-400/60 text-indigo-300 shadow-sm',
    iconColor: 'text-indigo-300'
  };
};

interface TeamBadgeProps {
  role: string;
  size?: 'xs' | 'sm' | 'md';
  showIcon?: boolean;
  className?: string;
}

export const TeamBadge: React.FC<TeamBadgeProps> = ({
  role,
  size = 'xs',
  showIcon = true,
  className = ''
}) => {
  if (!role || !role.trim()) return null;

  const { name, Icon, badgeClass, iconColor } = getTeamRoleConfig(role);

  const sizeClasses = {
    xs: 'text-[9px] px-1.5 py-0.5 gap-1 rounded-md',
    sm: 'text-[10px] px-2 py-0.5 gap-1.5 rounded-lg',
    md: 'text-xs px-2.5 py-1 gap-1.5 rounded-xl font-black'
  }[size];

  const iconSizes = {
    xs: 10,
    sm: 11,
    md: 13
  }[size];

  return (
    <span
      className={`inline-flex items-center font-black uppercase tracking-wider border backdrop-blur-md shrink-0 transition-transform hover:scale-105 select-none ${sizeClasses} ${badgeClass} ${className}`}
      title={`Mikrokosmos Ekip Rolü: ${name}`}
    >
      {showIcon && <Icon size={iconSizes} className={`shrink-0 ${iconColor}`} />}
      <span className="truncate">{name}</span>
    </span>
  );
};

interface TeamBadgesProps {
  roles?: string[] | null;
  role?: string | null;
  size?: 'xs' | 'sm' | 'md';
  maxDisplay?: number;
  className?: string;
}

export const TeamBadges: React.FC<TeamBadgesProps> = ({
  roles,
  role,
  size = 'xs',
  maxDisplay = 3,
  className = ''
}) => {
  const list: string[] = [];
  if (roles && Array.isArray(roles)) {
    roles.forEach(r => {
      if (r && !list.includes(r.trim())) list.push(r.trim());
    });
  }
  if (role && !list.includes(role.trim())) {
    list.unshift(role.trim());
  }

  if (list.length === 0) return null;

  const displayList = list.slice(0, maxDisplay);

  return (
    <div className={`inline-flex items-center gap-1 flex-wrap shrink-0 ${className}`}>
      {displayList.map((r, idx) => (
        <TeamBadge key={r + idx} role={r} size={size} />
      ))}
    </div>
  );
};
