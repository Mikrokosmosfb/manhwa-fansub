import React from 'react';
import { useApp } from '../context/AppContext';
import { SHOP_ITEMS } from '../data/shopData';
import { getOptimizedImageUrl } from '../utils/imageUtils';

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

interface UserAvatarProps {
  src?: string | null;
  avatar?: string | null;
  name?: string;
  size?: AvatarSize | number;
  frameId?: string | null;
  customFrameStyle?: string;
  customFrameImageUrl?: string;
  customFrameScale?: number;
  customFrameOffsetY?: number;
  customFrameOffsetX?: number;
  customFrameHideBorder?: boolean;
  themeBorderClass?: string;
  className?: string;
  imgClassName?: string;
  showFrame?: boolean;
}

const SIZE_MAP: Record<AvatarSize, { container: string; img: string; text: string }> = {
  xs: { container: 'w-6 h-6', img: 'w-6 h-6', text: 'text-[9px]' },
  sm: { container: 'w-8 h-8', img: 'w-8 h-8', text: 'text-[11px]' },
  md: { container: 'w-10 h-10', img: 'w-10 h-10', text: 'text-xs' },
  lg: { container: 'w-14 h-14', img: 'w-14 h-14', text: 'text-sm' },
  xl: { container: 'w-20 h-20', img: 'w-20 h-20', text: 'text-xl' },
  '2xl': { container: 'w-28 h-28', img: 'w-28 h-28', text: 'text-3xl' },
};

const isVideoUrl = (url?: string | null) => {
  if (!url) return false;
  const cleanUrl = url.split('?')[0].toLowerCase();
  return (
    cleanUrl.endsWith('.webm') ||
    cleanUrl.endsWith('.mp4') ||
    cleanUrl.endsWith('.mov') ||
    cleanUrl.endsWith('.ogg') ||
    url.startsWith('data:video/')
  );
};

export const UserAvatar: React.FC<UserAvatarProps> = ({
  src,
  avatar,
  name = 'User',
  size = 'md',
  frameId,
  customFrameStyle,
  customFrameImageUrl,
  customFrameScale,
  customFrameOffsetY,
  customFrameOffsetX,
  customFrameHideBorder,
  themeBorderClass,
  className = '',
  imgClassName = '',
  showFrame = true
}) => {
  const imageSource = src || avatar;
  const { shopItems } = useApp();
  const allItems = shopItems && shopItems.length > 0 ? shopItems : SHOP_ITEMS;

  // Resolve frame item
  const resolvedFrameItem = frameId ? allItems.find(i => i.id === frameId && i.category === 'frame') : null;
  const activeFrameStyle = customFrameStyle !== undefined ? customFrameStyle : resolvedFrameItem?.frameStyle;
  const activeFrameImageUrl = customFrameImageUrl !== undefined ? customFrameImageUrl : resolvedFrameItem?.frameImageUrl;
  const activeFrameScale = customFrameScale !== undefined ? customFrameScale : (resolvedFrameItem?.frameScale || 140);
  const activeFrameOffsetY = customFrameOffsetY !== undefined ? customFrameOffsetY : (resolvedFrameItem?.frameOffsetY || 0);
  const activeFrameOffsetX = customFrameOffsetX !== undefined ? customFrameOffsetX : (resolvedFrameItem?.frameOffsetX || 0);
  const activeFrameHideBorder = customFrameHideBorder !== undefined ? customFrameHideBorder : (resolvedFrameItem?.frameHideBorder ?? (Boolean(activeFrameImageUrl)));

  const sizeInfo = typeof size === 'string' ? SIZE_MAP[size] || SIZE_MAP.md : null;
  const customDimensions = typeof size === 'number' ? { width: `${size}px`, height: `${size}px` } : undefined;

  const initials = (name || 'U').slice(0, 2).toUpperCase();

  // Determine avatar circle border/glow class (ALWAYS purely circular)
  const getAvatarBorderClass = () => {
    if (!showFrame) return 'border border-purple-400/30';
    if (activeFrameImageUrl && activeFrameHideBorder) {
      return 'border border-transparent'; // Clean zero-border when PNG frame is equipped
    }
    if (activeFrameStyle) return activeFrameStyle;
    if (themeBorderClass) return themeBorderClass;
    return 'border border-purple-400/30';
  };

  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 select-none rounded-full ${
        sizeInfo ? sizeInfo.container : ''
      } ${className}`}
      style={customDimensions}
    >
      {/* Inner Avatar Circular Image or Initial Fallback */}
      <div
        className={`w-full h-full rounded-full overflow-hidden flex items-center justify-center bg-slate-950 transition-all ${getAvatarBorderClass()}`}
      >
        {imageSource ? (
          <img
            src={getOptimizedImageUrl(imageSource, {
              width: typeof size === 'number' ? Math.min(size * 2, 128) : size === '2xl' ? 128 : size === 'xl' ? 96 : size === 'lg' ? 64 : size === 'md' ? 48 : 36,
              height: typeof size === 'number' ? Math.min(size * 2, 128) : size === '2xl' ? 128 : size === 'xl' ? 96 : size === 'lg' ? 64 : size === 'md' ? 48 : 36,
              quality: 70
            })}
            alt={name}
            loading="lazy"
            decoding="async"
            className={`w-full h-full object-cover rounded-full ${imgClassName}`}
            onError={(e) => {
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
        ) : (
          <span className={`font-black text-purple-200 ${sizeInfo ? sizeInfo.text : 'text-xs'}`}>
            {initials}
          </span>
        )}
      </div>

      {/* Transparent PNG/WebP/GIF/WebM Frame Graphic Overlay - Perfectly Centered & Scaled */}
      {showFrame && activeFrameImageUrl && (
        isVideoUrl(activeFrameImageUrl) ? (
          <video
            src={activeFrameImageUrl}
            autoPlay
            loop
            muted
            playsInline
            style={{
              width: `${activeFrameScale}%`,
              height: `${activeFrameScale}%`,
              transform: `translate(calc(-50% + ${activeFrameOffsetX}%), calc(-50% + ${activeFrameOffsetY}%))`
            }}
            className="absolute top-1/2 left-1/2 max-w-none pointer-events-none object-contain z-10 select-none drop-shadow-md transition-all duration-150"
          />
        ) : (
          <img
            src={getOptimizedImageUrl(activeFrameImageUrl, { width: 160, quality: 80 })}
            alt="Avatar Frame"
            loading="lazy"
            decoding="async"
            style={{
              width: `${activeFrameScale}%`,
              height: `${activeFrameScale}%`,
              transform: `translate(calc(-50% + ${activeFrameOffsetX}%), calc(-50% + ${activeFrameOffsetY}%))`
            }}
            className="absolute top-1/2 left-1/2 max-w-none pointer-events-none object-contain z-10 select-none drop-shadow-md transition-all duration-150"
          />
        )
      )}
    </div>
  );
};
