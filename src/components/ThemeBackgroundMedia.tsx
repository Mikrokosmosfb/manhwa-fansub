import React, { useState, useEffect } from 'react';

interface ThemeBackgroundMediaProps {
  url?: string | null;
  className?: string;
  opacity?: number;
  onMediaError?: () => void;
  onMediaLoad?: () => void;
}

export function isAnimatedVideoUrl(url?: string | null): boolean {
  if (!url) return false;
  const trimmed = url.trim();
  const clean = trimmed.split('?')[0].split('#')[0].toLowerCase();
  return (
    clean.endsWith('.mp4') ||
    clean.endsWith('.webm') ||
    clean.endsWith('.mov') ||
    clean.endsWith('.m4v') ||
    trimmed.startsWith('data:video/') ||
    trimmed.includes('v1.pinimg.com/videos/') ||
    trimmed.includes('v.pinimg.com/')
  );
}

/**
 * Renders theme background media (static images, animated GIFs/WebPs, and MP4/WebM videos)
 * using dedicated <img> (with referrerPolicy="no-referrer") or <video> elements instead of CSS backgroundImage,
 * ensuring external hosts like Pinterest (i.pinimg.com / v1.pinimg.com) animate and load reliably.
 */
export const ThemeBackgroundMedia: React.FC<ThemeBackgroundMediaProps> = ({
  url,
  className = '',
  opacity = 1,
  onMediaError,
  onMediaLoad,
}) => {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [url]);

  const trimmed = (url || '').trim();
  if (!trimmed || hasError) return null;

  if (isAnimatedVideoUrl(trimmed)) {
    return (
      <video
        key={trimmed}
        src={trimmed}
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        onLoadedData={() => onMediaLoad?.()}
        onError={() => {
          setHasError(true);
          onMediaError?.();
        }}
        className={`absolute inset-0 w-full h-full object-cover pointer-events-none select-none ${className}`}
        style={{ opacity }}
      />
    );
  }

  return (
    <img
      key={trimmed}
      src={trimmed}
      alt=""
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
      draggable={false}
      onLoad={() => onMediaLoad?.()}
      onError={() => {
        setHasError(true);
        onMediaError?.();
      }}
      className={`absolute inset-0 w-full h-full object-cover pointer-events-none select-none ${className}`}
      style={{ opacity }}
    />
  );
};
