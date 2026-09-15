import React from 'react';

/**
 * Base shimmer pulse element with subtle purple-gray glowing gradient
 */
export const SkeletonBox: React.FC<{
  className?: string;
  style?: React.CSSProperties;
}> = ({ className = '', style }) => {
  return (
    <div
      style={style}
      className={`relative overflow-hidden bg-gray-800/60 rounded-lg before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_2s_infinite] before:bg-gradient-to-r before:from-transparent before:via-purple-500/10 before:to-transparent ${className}`}
    />
  );
};

/**
 * Skeleton Loader for 'Yeni Yüklenen Noveller' horizontal card items
 */
export const NovelCardSkeleton: React.FC = () => {
  return (
    <div className="flex-shrink-0 w-32 sm:w-44 bg-gray-900/90 border border-purple-500/20 rounded-2xl sm:rounded-3xl p-2.5 sm:p-3 shadow-xl flex flex-col space-y-2.5 animate-pulse">
      {/* Cover Image Skeleton */}
      <div className="relative aspect-[3/4] rounded-xl sm:rounded-2xl overflow-hidden bg-gray-800/80 border border-purple-500/10 flex items-center justify-center">
        <SkeletonBox className="w-full h-full rounded-none" />
        {/* Fake type tag */}
        <div className="absolute bottom-2 right-2 w-14 h-4 rounded bg-gray-700/60" />
        {/* Fake rating badge */}
        <div className="absolute top-2 right-2 w-10 h-4 rounded-full bg-black/60" />
      </div>

      {/* Title & Info Skeleton */}
      <div className="flex-1 flex flex-col justify-between space-y-2 px-0.5 pt-0.5">
        <div className="space-y-1.5">
          <SkeletonBox className="h-4 w-4/5 rounded" />
          <SkeletonBox className="h-3 w-1/2 rounded" />
        </div>

        {/* Chapters list skeleton */}
        <div className="space-y-1.5 pt-2 border-t border-gray-800/80">
          <SkeletonBox className="h-6 w-full rounded-lg bg-purple-950/40 border border-purple-800/20" />
          <SkeletonBox className="h-6 w-full rounded-lg bg-purple-950/30 border border-purple-800/10" />
        </div>
      </div>
    </div>
  );
};

/**
 * Skeleton Loader Row for 'Yeni Yüklenen Noveller' section
 */
export const NovelRowSkeleton: React.FC<{ count?: number }> = ({ count = 6 }) => {
  return (
    <div className="flex gap-3 sm:gap-4 overflow-x-hidden pb-2 pt-1">
      {Array.from({ length: count }).map((_, i) => (
        <NovelCardSkeleton key={`novel-skel-${i}`} />
      ))}
    </div>
  );
};

/**
 * Skeleton Loader for 'Yeni Yüklenen Bölümler' HorizontalReleaseCard
 */
export const HorizontalReleaseCardSkeleton: React.FC = () => {
  return (
    <div className="bg-gray-900/90 border border-purple-500/20 rounded-2xl sm:rounded-3xl p-3 sm:p-4 flex gap-3 sm:gap-4 shadow-xl items-stretch animate-pulse">
      {/* Left: Cover Poster Skeleton & Rating */}
      <div className="w-24 sm:w-28 md:w-30 lg:w-32 flex-shrink-0 flex flex-col items-center gap-1.5 self-start">
        <div className="relative w-full aspect-[2/3] rounded-xl sm:rounded-2xl overflow-hidden bg-gray-800/80 border border-purple-500/10">
          <SkeletonBox className="w-full h-full rounded-none" />
        </div>
        {/* Rating Pill Skeleton */}
        <div className="w-16 h-4.5 sm:h-5 rounded-full bg-black/80 border border-neutral-800/80 flex items-center justify-center gap-1 mt-0.5">
          <div className="w-10 h-2 bg-amber-500/30 rounded-full" />
        </div>
      </div>

      {/* Right: Info & Chapters Skeleton */}
      <div className="flex-1 min-w-0 flex flex-col justify-between space-y-2 sm:space-y-3">
        {/* Header Badges Skeleton */}
        <div>
          <div className="flex items-center justify-between gap-1 mb-1 sm:mb-1.5">
            <div className="flex items-center gap-1.5">
              <SkeletonBox className="h-3.5 w-12 rounded bg-purple-900/50" />
              <SkeletonBox className="h-3.5 w-14 rounded bg-gray-800/60" />
            </div>
            <SkeletonBox className="h-3.5 w-16 rounded bg-gray-800/50" />
          </div>

          {/* Title Skeleton */}
          <div className="space-y-1.5 my-1 sm:my-2">
            <SkeletonBox className="h-4.5 sm:h-5 w-5/6 rounded-md bg-gray-700/60" />
            <SkeletonBox className="h-3.5 sm:h-4 w-1/2 rounded-md bg-gray-800/50" />
          </div>
        </div>

        {/* Chapters Grid / List Skeleton (4 chapters) */}
        <div className="space-y-1.5">
          <SkeletonBox className="h-7 sm:h-8 w-full rounded-xl bg-purple-950/40 border border-purple-800/20" />
          <SkeletonBox className="h-7 sm:h-8 w-full rounded-xl bg-purple-950/30 border border-purple-800/20" />
          <SkeletonBox className="h-7 sm:h-8 w-full rounded-xl bg-purple-950/20 border border-purple-800/10" />
          <SkeletonBox className="h-7 sm:h-8 w-full rounded-xl bg-purple-950/20 border border-purple-800/10 hidden sm:block" />
        </div>
      </div>
    </div>
  );
};

/**
 * Skeleton Loader Grid for 'Yeni Yüklenen Bölümler' section (2-column layout on desktop)
 */
export const ReleaseGridSkeleton: React.FC<{ count?: number }> = ({ count = 6 }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <HorizontalReleaseCardSkeleton key={`rel-skel-${i}`} />
      ))}
    </div>
  );
};

/**
 * Skeleton Loader for 'Bu Haftanın Sevilenleri' Slider to eliminate CLS
 */
export const WeeklyPopularSliderSkeleton: React.FC = () => {
  return (
    <div className="flex gap-3 sm:gap-4 overflow-x-hidden py-1 animate-pulse">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={`pop-skel-${i}`} className="w-32 sm:w-40 flex-shrink-0 space-y-2">
          <div className="relative aspect-[2/3] rounded-2xl overflow-hidden bg-gray-800/80 border-2 border-purple-500/30">
            <SkeletonBox className="w-full h-full rounded-none" />
          </div>
          <div className="space-y-1 pt-1">
            <SkeletonBox className="h-3.5 w-5/6 rounded" />
            <SkeletonBox className="h-3 w-1/2 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
};

/**
 * Skeleton Loader for RandomSeriesWidget to eliminate CLS
 */
export const RandomSeriesWidgetSkeleton: React.FC = () => {
  return (
    <div className="bg-gray-900/90 border border-purple-500/20 rounded-2xl sm:rounded-3xl p-4 shadow-xl space-y-3.5 animate-pulse min-h-[195px] flex flex-col justify-between">
      <div className="flex items-center justify-between border-b border-gray-800/80 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-purple-950/60 border border-purple-800/30" />
          <div className="space-y-1">
            <div className="h-3.5 w-24 bg-purple-900/40 rounded" />
            <div className="h-2.5 w-36 bg-gray-800/60 rounded" />
          </div>
        </div>
        <div className="h-7 w-16 bg-purple-900/40 rounded-xl" />
      </div>
      <div className="bg-gray-950/80 rounded-2xl p-3 border border-purple-500/20 flex gap-3.5 items-center">
        <div className="w-20 aspect-[3/4] rounded-xl bg-gray-800/80 flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-3/4 bg-gray-700/60 rounded" />
          <div className="h-3 w-1/2 bg-gray-800/50 rounded" />
          <div className="h-7 w-full bg-purple-950/60 rounded-xl mt-2" />
        </div>
      </div>
    </div>
  );
};
