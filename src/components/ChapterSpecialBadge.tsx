import React from 'react';
import { Sparkles, Crown, Zap, Bookmark, Star, Flame } from 'lucide-react';

interface ChapterSpecialBadgeProps {
  tag?: string;
  size?: 'xs' | 'sm' | 'md';
  className?: string;
}

export const ChapterSpecialBadge: React.FC<ChapterSpecialBadgeProps> = ({
  tag,
  size = 'sm',
  className = ''
}) => {
  if (!tag) return null;

  const normalized = tag.trim().toLowerCase();

  // Pick badge styling based on tag type
  let badgeStyle = 'bg-gradient-to-r from-purple-600 via-indigo-600 to-fuchsia-600 text-white border-purple-300/40';
  let icon = <Sparkles className="flex-shrink-0" />;
  let displayText = tag;

  if (normalized.includes('sezon final') || normalized.includes('season final')) {
    badgeStyle = 'bg-gradient-to-r from-amber-500 via-rose-500 to-purple-600 text-white border-amber-300/50 shadow-amber-900/30';
    icon = <Sparkles className="text-amber-200 fill-amber-200 flex-shrink-0" />;
    displayText = 'SEZON FİNALİ';
  } else if (normalized.includes('final')) {
    badgeStyle = 'bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white border-red-300/50 shadow-red-900/50 animate-pulse';
    icon = <Crown className="text-amber-300 fill-amber-300 flex-shrink-0" />;
    displayText = 'FİNAL';
  } else if (normalized.includes('ekstra') || normalized.includes('extra')) {
    badgeStyle = 'bg-gradient-to-r from-cyan-500 via-teal-500 to-blue-600 text-white border-cyan-300/40 shadow-cyan-900/30';
    icon = <Zap className="text-cyan-100 fill-cyan-100 flex-shrink-0" />;
    displayText = 'EKSTRA';
  } else if (normalized.includes('yan bölüm') || normalized.includes('side story') || normalized.includes('yan bolum')) {
    badgeStyle = 'bg-gradient-to-r from-emerald-500 via-teal-600 to-green-600 text-white border-emerald-300/40 shadow-emerald-900/30';
    icon = <Bookmark className="text-emerald-100 fill-emerald-100 flex-shrink-0" />;
    displayText = 'YAN BÖLÜM';
  } else if (normalized.includes('özel') || normalized.includes('ozel') || normalized.includes('special')) {
    badgeStyle = 'bg-gradient-to-r from-fuchsia-600 via-purple-600 to-pink-600 text-white border-fuchsia-300/40 shadow-fuchsia-900/30';
    icon = <Star className="text-fuchsia-100 fill-fuchsia-100 flex-shrink-0" />;
    displayText = 'ÖZEL';
  }

  // Size configurations
  let sizeClasses = 'text-[9px] px-1.5 py-0.2 rounded-md font-extrabold gap-0.5';
  let iconSize = 9;

  if (size === 'xs') {
    sizeClasses = 'text-[8px] px-1 py-0.1 rounded font-black gap-0.5';
    iconSize = 8;
  } else if (size === 'md') {
    sizeClasses = 'text-[10px] sm:text-xs px-2 py-0.5 rounded-lg font-black gap-1';
    iconSize = 12;
  }

  return (
    <span
      className={`inline-flex items-center border shadow-sm tracking-wide uppercase flex-shrink-0 whitespace-nowrap select-none ${badgeStyle} ${sizeClasses} ${className}`}
    >
      {React.cloneElement(icon, { size: iconSize })}
      <span>{displayText}</span>
    </span>
  );
};
