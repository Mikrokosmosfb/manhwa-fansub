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
  if (!tag || !tag.trim()) return null;
  const rawTag = tag.trim();
  const normalized = rawTag.toLowerCase();

  // Pick badge styling and icon based on keywords, but ALWAYS preserve the user's exact custom text!
  let badgeStyle = 'bg-gradient-to-r from-purple-600 via-indigo-600 to-fuchsia-600 text-white border-purple-300/40 shadow-purple-950/50';
  let icon = <Sparkles className="flex-shrink-0" />;

  if (normalized.includes('sezon final') || normalized.includes('season final')) {
    badgeStyle = 'bg-gradient-to-r from-amber-500 via-orange-600 to-rose-600 text-white border-amber-300/60 shadow-amber-950/80 shadow-md ring-1 ring-amber-400/50';
    icon = <Sparkles className="text-amber-200 fill-amber-200 flex-shrink-0 animate-pulse" />;
  } else if (normalized.includes('final')) {
    badgeStyle = 'bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white border-red-300/60 shadow-red-950/80 shadow-md ring-1 ring-red-400/50 animate-pulse';
    icon = <Crown className="text-amber-300 fill-amber-300 flex-shrink-0" />;
  } else if (normalized.includes('ekstra') || normalized.includes('extra')) {
    badgeStyle = 'bg-gradient-to-r from-cyan-500 via-teal-500 to-blue-600 text-white border-cyan-300/50 shadow-cyan-950/60 shadow-md';
    icon = <Zap className="text-cyan-100 fill-cyan-100 flex-shrink-0" />;
  } else if (normalized.includes('yan bölüm') || normalized.includes('side story') || normalized.includes('yan bolum')) {
    badgeStyle = 'bg-gradient-to-r from-emerald-500 via-teal-600 to-green-600 text-white border-emerald-300/50 shadow-emerald-950/60 shadow-md';
    icon = <Bookmark className="text-emerald-100 fill-emerald-100 flex-shrink-0" />;
  } else if (normalized.includes('özel') || normalized.includes('ozel') || normalized.includes('special')) {
    badgeStyle = 'bg-gradient-to-r from-fuchsia-600 via-purple-600 to-pink-600 text-white border-fuchsia-300/50 shadow-fuchsia-950/60 shadow-md';
    icon = <Star className="text-fuchsia-100 fill-fuchsia-100 flex-shrink-0" />;
  }

  // Display user's exact custom text (e.g. 'Extra son' -> 'EXTRA SON')
  const displayText = rawTag.toUpperCase();

  // Size configurations
  let sizeClasses = 'text-[11px] sm:text-xs px-2.5 py-1 rounded-lg font-black tracking-wider gap-1.5 shadow-sm';
  let iconSize = 13;
  if (size === 'xs') {
    sizeClasses = 'text-[10px] sm:text-[11px] px-2 py-0.5 rounded-md font-extrabold tracking-wide gap-1 shadow-sm';
    iconSize = 11;
  } else if (size === 'md') {
    sizeClasses = 'text-xs sm:text-sm px-3.5 py-1.5 rounded-xl font-black tracking-wider gap-1.5 shadow-md';
    iconSize = 15;
  }

  return (
    <span
      className={`inline-flex items-center border uppercase flex-shrink-0 whitespace-nowrap select-none transition-transform hover:scale-105 ${badgeStyle} ${sizeClasses} ${className}`}
    >
      {React.cloneElement(icon, { size: iconSize })}
      <span>{displayText}</span>
    </span>
  );
};
