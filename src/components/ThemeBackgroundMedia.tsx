import React, { useState, useEffect, useRef } from 'react';

interface ThemeBackgroundMediaProps {
  url?: string | null;
  className?: string;
  opacity?: number;
  onMediaError?: () => void;
  onMediaLoad?: () => void;
}

export interface ResolvedMediaInfo {
  mediaUrl: string;
  mediaType?: 'image' | 'video';
  posterUrl?: string;
}

const resolvedMediaCache = new Map<string, ResolvedMediaInfo>();
const inFlightMediaResolves = new Map<string, Promise<ResolvedMediaInfo | null>>();

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
    trimmed.includes('v.pinimg.com/') ||
    /v\d*\.pinimg\.com\/videos\//i.test(trimmed)
  );
}

export function isResolvableExternalPageUrl(url?: string | null): boolean {
  if (!url) return false;
  const trimmed = url.trim();
  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) return false;
  const lower = trimmed.toLowerCase();
  const isAlreadyDirect =
    lower.includes('i.pinimg.com') ||
    lower.includes('v1.pinimg.com') ||
    lower.includes('v.pinimg.com') ||
    /\.(gif|webp|png|jpe?g|mp4|webm|mov|m4v|svg)(\?.*)?$/i.test(lower);
  if (isAlreadyDirect) return false;
  return (
    lower.includes('pinterest.') ||
    lower.includes('pin.it/') ||
    lower.includes('tenor.com/view/') ||
    lower.includes('giphy.com/gifs/')
  );
}

export async function resolveExternalMediaLink(rawUrl: string): Promise<ResolvedMediaInfo | null> {
  const trimmed = (rawUrl || '').trim();
  if (!trimmed) return null;

  const cached = resolvedMediaCache.get(trimmed);
  if (cached) return cached;

  const existingPromise = inFlightMediaResolves.get(trimmed);
  if (existingPromise) return existingPromise;

  const promise = (async (): Promise<ResolvedMediaInfo | null> => {
    try {
      const res = await fetch(`/api/resolve-media?url=${encodeURIComponent(trimmed)}`);
      if (!res.ok) return null;
      const data = await res.json();
      if (data && data.success && data.mediaUrl) {
        const info: ResolvedMediaInfo = {
          mediaUrl: data.mediaUrl,
          mediaType: data.mediaType,
          posterUrl: data.posterUrl,
        };
        resolvedMediaCache.set(trimmed, info);
        return info;
      }
      return null;
    } catch {
      return null;
    } finally {
      inFlightMediaResolves.delete(trimmed);
    }
  })();

  inFlightMediaResolves.set(trimmed, promise);
  return promise;
}

/**
 * Renders theme background media (static images, animated GIFs/WebPs, and MP4/WebM videos)
 * using dedicated <img> (with referrerPolicy="no-referrer") or <video> elements instead of CSS backgroundImage,
 * ensuring external hosts like Pinterest (i.pinimg.com / v1.pinimg.com / pin.it) animate and load reliably.
 */
export const ThemeBackgroundMedia: React.FC<ThemeBackgroundMediaProps> = ({
  url,
  className = '',
  opacity = 1,
  onMediaError,
  onMediaLoad,
}) => {
  const trimmed = (url || '').trim();
  const needsRuntimeResolve = isResolvableExternalPageUrl(trimmed);

  const [resolved, setResolved] = useState<ResolvedMediaInfo | null>(() =>
    trimmed && needsRuntimeResolve ? resolvedMediaCache.get(trimmed) || null : null
  );
  const [resolveFailed, setResolveFailed] = useState(false);
  const [hasError, setHasError] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    setHasError(false);
    setResolveFailed(false);

    if (!trimmed || !needsRuntimeResolve) {
      setResolved(null);
      return;
    }

    const cached = resolvedMediaCache.get(trimmed);
    if (cached) {
      setResolved(cached);
      return;
    }

    let cancelled = false;
    setResolved(null);
    resolveExternalMediaLink(trimmed).then((info) => {
      if (cancelled) return;
      if (info && info.mediaUrl) {
        setResolved(info);
      } else {
        setResolveFailed(true);
        onMediaError?.();
      }
    });

    return () => {
      cancelled = true;
    };
  }, [trimmed, needsRuntimeResolve]);

  const effectiveUrl = needsRuntimeResolve ? resolved?.mediaUrl || '' : trimmed;
  const isVideo =
    (resolved?.mediaType === 'video' && needsRuntimeResolve) || isAnimatedVideoUrl(effectiveUrl);

  // Imperatively enforce muted + playsInline on the DOM element (works around React's muted attribute omission on Android Chrome/iOS Safari)
  useEffect(() => {
    const el = videoRef.current;
    if (!el || !isVideo || !effectiveUrl) return;
    el.muted = true;
    el.defaultMuted = true;
    el.playsInline = true;
    el.setAttribute('muted', '');
    el.setAttribute('playsinline', '');
    el.setAttribute('webkit-playsinline', '');
    if (el.paused) {
      el.play().catch(() => {});
    }
  }, [effectiveUrl, isVideo]);

  if (!trimmed || hasError || resolveFailed) return null;
  if (needsRuntimeResolve && !effectiveUrl) return null;

  if (isVideo) {
    return (
      <video
        ref={videoRef}
        key={effectiveUrl}
        src={effectiveUrl}
        poster={resolved?.posterUrl}
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        disablePictureInPicture
        disableRemotePlayback
        onLoadedMetadata={(e) => {
          const el = e.currentTarget;
          el.muted = true;
          el.play().catch(() => {});
        }}
        onCanPlay={(e) => {
          const el = e.currentTarget;
          if (el.paused) {
            el.muted = true;
            el.play().catch(() => {});
          }
        }}
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
      key={effectiveUrl}
      src={effectiveUrl}
      alt=""
      loading="eager"
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

