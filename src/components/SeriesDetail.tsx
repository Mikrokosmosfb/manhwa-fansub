import { findSeriesByQuery } from '../utils/seriesFinder';
import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Chapter, isSeries18Plus, isChapter18Plus } from '../types';
import {
  Bookmark,
  Star,
  Search,
  ArrowUpDown,
  BookOpen,
  CheckCircle2,
  Clock,
  Plus,
  X,
  Share2,
  Trash2,
  Edit,
  Flame,
  UserCheck,
  Palette,
  ShieldCheck,
  Calendar,
  Layers,
  ChevronDown,
  ChevronUp,
  Check,
  RefreshCw,
  PenTool,
  Sparkles,
  ShieldAlert,
  Megaphone,
  Tag,
  Lock,
  Bell,
  BellRing,
  Image as ImageIcon
} from 'lucide-react';
import { CommentsSection } from './CommentsSection';
import { checkIsChapterNew } from '../utils/dateUtils';
import { DiagonalStatusRibbon } from './DiagonalStatusRibbon';
import { ChapterSpecialBadge } from './ChapterSpecialBadge';
import { MangaAlertStack } from './MangaAlertBox';
import { sortChapters, getSeriesAlertsAndCleanSynopsis, extractBloggerSeriesMetadata } from '../utils/chapterUtils';
import { getOptimizedImageUrl, handleImageError } from '../utils/imageUtils';
import { extractImageUrls, isIframeUrl } from '../utils/imageParser';

interface SeriesDetailProps {
  seriesId: string;
}

export const SeriesDetail: React.FC<SeriesDetailProps> = ({ seriesId }) => {
  const {
    seriesList,
    setView,
    bookmarks,
    toggleBookmark,
    bookmarkFolders,
    addBookmarkFolder,
    deleteBookmarkFolder,
    readingHistory,
    toggleChapterRead,
    markAllChaptersRead,
    markAllChaptersUnread,
    showNsfw,
    toggleNsfw,
    isFollowingSeries,
    toggleFollowSeries,
    openAuthModal,
    user,
    readingLists,
    setReadingLists,
    showToast,
    isLoadingSeries
  } = useApp();

  const series = useMemo(() => {
    return findSeriesByQuery(seriesList, seriesId);
  }, [seriesList, seriesId]);

  // Dynamically extract Blogger metadata if existing series has raw extra-info or Blogger defaults
  const dynamicMeta = series?.synopsis ? extractBloggerSeriesMetadata(series.synopsis) : null;
  const effectiveAuthor = (series?.author && series.author !== 'Blogger') ? series.author : (dynamicMeta?.author || series?.author || 'Blogger');
  const effectiveArtist = (series?.artist && series.artist !== 'Blogger') ? series.artist : (dynamicMeta?.artist || series?.artist || 'Blogger');
  const effectiveReleaseYear = series?.releaseYear || dynamicMeta?.releaseYear;
  const effectiveGenres = (series?.genres && series.genres.length > 0 && series.genres[0] !== 'Aksiyon') 
    ? series.genres 
    : (dynamicMeta?.genres && dynamicMeta.genres.length > 0 ? dynamicMeta.genres : (series?.genres || []));


  const [chapterSearch, setChapterSearch] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [chapterFilter, setChapterFilter] = useState<'all' | 'unread' | 'read' | '18plus'>('all');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isExpandedList, setIsExpandedList] = useState<boolean>(false);
  const CHAPTERS_PER_PAGE = 15;

  const [isBookmarkModalOpen, setIsBookmarkModalOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [isSynopsisExpanded, setIsSynopsisExpanded] = useState(false);

  const [isListModalOpen, setIsListModalOpen] = useState(false);
  const [newReadingListName, setNewReadingListName] = useState('');

  if (!series) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24 flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // 18+ / NSFW Content Guard
  if (isSeries18Plus(series) && !showNsfw) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16">
        <div className="bg-gradient-to-b from-gray-900 via-rose-950/40 to-gray-900 border border-rose-500/40 rounded-3xl p-8 sm:p-12 text-center space-y-6 shadow-2xl relative overflow-hidden">
          <div className="w-20 h-20 rounded-2xl bg-rose-900/60 border border-rose-500/50 text-rose-400 flex items-center justify-center mx-auto shadow-xl shadow-rose-950">
            <ShieldAlert size={40} />
          </div>
          <div className="space-y-2">
            <span className="bg-rose-900/80 text-rose-300 border border-rose-700/60 text-xs px-3 py-1 rounded-full font-black tracking-wider uppercase inline-block">
              🔞 +18 / Yetişkin İçeriği Koruması
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-white pt-2">
              {series.title}
            </h2>
            <p className="text-sm text-gray-300 max-w-lg mx-auto leading-relaxed pt-1">
              Bu seri yetişkin (+18) içerik barındırmaktadır. Sitenin içerik filtresi varsayılan olarak +18 içerikleri gizleyecek şekilde ayarlanmıştır.
            </p>
          </div>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => toggleNsfw(true)}
              className="w-full sm:w-auto bg-gradient-to-r from-rose-600 via-pink-600 to-purple-600 hover:from-rose-500 hover:to-purple-500 text-white font-extrabold text-sm px-6 py-3 rounded-2xl shadow-xl transition flex items-center justify-center gap-2"
            >
              <ShieldCheck size={18} />
              +18 İçerikleri Göster (Filtreyi Aç)
            </button>
            <button
              onClick={() => setView({ type: 'home' })}
              className="w-full sm:w-auto bg-gray-800 hover:bg-gray-700 text-gray-200 font-bold text-sm px-6 py-3 rounded-2xl transition"
            >
              Geri Dön
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Active bookmark folders for this series
  const currentBookmark = bookmarks[series.id];
  const selectedFolderNames = currentBookmark ? currentBookmark.folders : [];

  // Active reading lists for this series
  const activeReadingLists = readingLists.filter(l =>
    (l.seriesIds || []).some(
      id => String(id).trim() === String(series.id).trim() || (series.slug && String(id).trim() === String(series.slug).trim())
    )
  );
  const isAddedToAnyList = activeReadingLists.length > 0;

  // Reading history progress
  const historyProgress = readingHistory[series.id];

  // Helper to check if a chapter is read (supports multiple read chapters)
  const isChapterRead = (ch: Chapter): boolean => {
    if (!historyProgress) return false;
    if (historyProgress.readChapterIds && historyProgress.readChapterIds.includes(ch.id)) return true;
    return false;
  };

  const readChaptersCount = series.chapters.filter(c => isChapterRead(c)).length;
  const adultChaptersCount = series.chapters.filter(c => isChapter18Plus(c)).length;

  // Filter and sort chapters
  const filteredChapters = series.chapters.filter(c => {
    const matchesSearch = c.title.toLowerCase().includes(chapterSearch.toLowerCase()) ||
      c.number.toString().includes(chapterSearch);
    
    if (!matchesSearch) return false;

    if (chapterFilter === 'read') return isChapterRead(c);
    if (chapterFilter === 'unread') return !isChapterRead(c);
    if (chapterFilter === '18plus') return isChapter18Plus(c);
    return true;
  });

  const sortedChapters = sortChapters(filteredChapters, sortOrder);

  // Pagination calculations
  const totalChaptersCount = sortedChapters.length;
  const totalPages = Math.ceil(totalChaptersCount / CHAPTERS_PER_PAGE) || 1;
  const paginatedChapters = isExpandedList
    ? sortedChapters
    : sortedChapters.slice((currentPage - 1) * CHAPTERS_PER_PAGE, currentPage * CHAPTERS_PER_PAGE);

  const handleFolderCheck = (folderName: string) => {
    const isChecked = selectedFolderNames.includes(folderName);
    const updated = isChecked
      ? selectedFolderNames.filter(f => f !== folderName)
      : [...selectedFolderNames, folderName];

    toggleBookmark(series.id, updated);
  };

  const handleAddFolder = (e: React.FormEvent) => {
    e.preventDefault();
    if (newFolderName.trim()) {
      addBookmarkFolder(newFolderName);
      setNewFolderName('');
    }
  };

  const renderStars = (rating: number) => {
    const score5 = rating / 2;
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Star
          key={i}
          size={16}
          className={
            score5 >= i
              ? 'fill-amber-400 text-amber-400'
              : score5 >= i - 0.5
              ? 'fill-amber-400 text-amber-400 opacity-60'
              : 'text-gray-600'
          }
        />
      );
    }
    return stars;
  };

  const firstChapter = series.chapters[0];
  const latestChapter = series.chapters[series.chapters.length - 1];
  const heroBanner = series.bannerImage || series.heroImage;
  const backdropImage = heroBanner || series.coverImage;

  return (
    <div className="min-h-screen pb-16">
      {series.isDraft && (
        <div className="bg-amber-950/90 border-b border-amber-500/50 py-3 px-4 text-center">
          <div className="max-w-7xl mx-auto flex items-center justify-center gap-2 text-amber-200 text-xs sm:text-sm font-extrabold">
            <span className="bg-amber-500 text-black font-black text-[11px] px-2 py-0.5 rounded shadow-sm">TASLAK</span>
            <span>Bu seri şu anda Taslak modundadır. Sadece yöneticiler görebilir, sitede henüz yayında değildir.</span>
          </div>
        </div>
      )}
      
      {/* Hero Banner Section */}
      <div className="relative w-full h-64 sm:h-80 md:h-96 overflow-hidden bg-gray-950">
        {/* Ambient atmospheric background blur */}
        <div
          className="absolute inset-0 bg-cover bg-center filter blur-2xl brightness-50 scale-110 opacity-60"
          style={{ backgroundImage: `url(${getOptimizedImageUrl(backdropImage, { width: 600, quality: 60 })})` }}
        />
        
        {/* Crisp Banner Image when provided */}
        {heroBanner && (
          <img
            src={getOptimizedImageUrl(heroBanner, { width: 1200, quality: 80 })}
            alt={`${series.title} Arka Plan`}
            referrerPolicy="no-referrer"
            onError={(e) => handleImageError(e, heroBanner, series.title)}
            width="1200"
            height="384"
            fetchPriority="high"
            decoding="async"
            className="absolute inset-0 w-full h-full object-cover object-center opacity-85 hover:opacity-95 transition-opacity duration-500"
          />
        )}

        {/* Cinematic dark gradients top and bottom */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-transparent pointer-events-none z-10" />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/70 to-transparent pointer-events-none z-10" />
      </div>

      {/* Main Content Info Card */}
      <div className="max-w-6xl mx-auto px-3 sm:px-4 -mt-16 sm:-mt-28 md:-mt-36 relative z-20">
        <div className="bg-gray-900/95 border border-purple-500/20 rounded-2xl sm:rounded-3xl p-4 sm:p-8 shadow-2xl backdrop-blur-md">
          <div className="flex flex-col md:flex-row gap-5 md:gap-8">
            
            {/* Cover Column: ONLY on mobile (-mt-20, w-48, elevated floating), spacious on desktop (md:mt-0, md:w-64 lg:w-72) */}
            <div className="flex flex-col items-center flex-shrink-0 -mt-20 md:mt-0 w-full md:w-64 lg:w-72">
              <div className="relative w-48 sm:w-52 md:w-full shadow-[0_16px_40px_rgba(0,0,0,0.85)] md:shadow-2xl rounded-2xl overflow-hidden border-2 border-purple-400/40 ring-4 ring-gray-950/80 md:ring-0 transition-transform duration-300">
                <DiagonalStatusRibbon status={series.status} size="lg" />
                <img
                  src={getOptimizedImageUrl(series.coverImage, { width: 400, height: 533, quality: 80 })}
                  alt={series.title}
                  width="288"
                  height="384"
                  decoding="async"
                  referrerPolicy="no-referrer"
                  onError={(e) => handleImageError(e, series.coverImage, series.title)}
                  className="w-full aspect-[3/4] object-cover"
                />
                {series.ageRating && series.ageRating !== 'Genel' && (
                  <span className="absolute top-2 left-2 bg-red-700 text-white font-extrabold text-xs px-2 py-0.5 rounded shadow">
                    {series.ageRating}
                  </span>
                )}
                {series.isHot && (
                  <span className="absolute top-2 right-2 bg-amber-500 text-black font-extrabold text-[10px] uppercase px-2 py-0.5 rounded shadow flex items-center gap-0.5">
                    <Flame size={12} />
                    Sıcak
                  </span>
                )}
              </div>

              {/* Spacious & Cohesive Control Panel under Cover */}
              <div className="w-full max-w-[340px] sm:max-w-[360px] md:max-w-none mt-4 space-y-2.5">
                {/* 1. Unified Rating + 2-Column Info Card (Never truncates 'Devam Ediyor') */}
                <div className="w-full bg-gray-950/90 border border-purple-500/30 rounded-xl overflow-hidden shadow-md">
                  {/* Top Row: 5 Stars + Numeric Score */}
                  <div className="px-3.5 py-2.5 flex items-center justify-between bg-gradient-to-r from-purple-950/40 via-gray-950/80 to-indigo-950/40">
                    <div className="flex items-center gap-1">
                      {renderStars(series.rating)}
                    </div>
                    <div className="flex items-baseline gap-0.5">
                      <span className="text-amber-400 font-extrabold text-sm">{series.rating}</span>
                      <span className="text-[11px] text-gray-400 font-semibold">/ 10</span>
                    </div>
                  </div>
                  {/* Bottom Row: 2 Spacious Columns for Durum & Format */}
                  <div className="grid grid-cols-2 divide-x divide-purple-500/20 border-t border-purple-500/20 bg-gray-950/90 text-center">
                    <div className="py-2 px-2.5 flex flex-col items-center justify-center">
                      <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Durum</span>
                      <span className="mt-0.5 text-purple-200 font-extrabold text-xs sm:text-[13px]">
                        {series.status}
                      </span>
                    </div>
                    <div className="py-2 px-2.5 flex flex-col items-center justify-center">
                      <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Format</span>
                      <span className="mt-0.5 text-indigo-200 font-extrabold text-xs sm:text-[13px]">
                        {series.type}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 2. Primary Library / Bookmark CTA */}
                <button
                  onClick={() => {
                    if (!user) {
                      openAuthModal('login');
                      return;
                    }
                    setIsBookmarkModalOpen(true);
                  }}
                  className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-extrabold text-xs sm:text-sm shadow-lg transition-all active:scale-[0.98] cursor-pointer ${
                    selectedFolderNames.length > 0
                      ? 'bg-gradient-to-r from-purple-600 via-fuchsia-600 to-purple-600 hover:from-purple-500 hover:to-fuchsia-500 text-white ring-1 ring-purple-300/60 shadow-purple-900/40'
                      : 'bg-gradient-to-r from-purple-700 via-indigo-700 to-purple-800 hover:from-purple-600 hover:to-indigo-600 text-white border border-purple-400/30'
                  }`}
                >
                  <Bookmark
                    size={16}
                    className={`flex-shrink-0 ${selectedFolderNames.length > 0 ? 'fill-current' : ''}`}
                  />
                  <span className="truncate">
                    {selectedFolderNames.length > 0
                      ? `Kütüphanede (${selectedFolderNames.join(', ')})`
                      : 'Kütüphaneye Ekle'}
                  </span>
                </button>

                {/* 3. Spacious 2-Column Row: Listeye Ekle & Takip Et */}
                <div className="grid grid-cols-2 gap-2.5">
                  {/* Listeye Ekle */}
                  <button
                    onClick={() => {
                      if (!user) {
                        showToast({ title: 'Giriş Yapın', message: 'Liste oluşturmak için giriş yapmalısınız.', type: 'warning' });
                        return;
                      }
                      setIsListModalOpen(true);
                    }}
                    className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl font-bold text-xs sm:text-[13px] transition-all active:scale-95 cursor-pointer border ${
                      isAddedToAnyList
                        ? 'bg-purple-900/70 hover:bg-purple-800/80 border-purple-400/60 text-white shadow-sm'
                        : 'bg-gray-950/90 hover:bg-purple-950/70 border-purple-500/30 text-purple-200 hover:text-white hover:border-purple-400/50'
                    }`}
                    title={
                      isAddedToAnyList
                        ? `Ekli olduğu listeler: ${activeReadingLists.map(l => l.name).join(', ')}`
                        : 'Seriyi okuma listelerinize ekleyin'
                    }
                  >
                    <BookOpen size={15} className={`flex-shrink-0 ${isAddedToAnyList ? 'text-purple-300' : 'text-purple-400'}`} />
                    <span>{isAddedToAnyList ? 'Listede' : 'Listeye Ekle'}</span>
                    {isAddedToAnyList && <Check size={14} className="text-emerald-400 stroke-[3] flex-shrink-0" />}
                  </button>

                  {/* Takip Et */}
                  <button
                    onClick={() => toggleFollowSeries(series.id)}
                    className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl font-bold text-xs sm:text-[13px] transition-all active:scale-95 cursor-pointer border ${
                      isFollowingSeries(series.id)
                        ? 'bg-emerald-950/75 hover:bg-emerald-900/80 border-emerald-500/50 text-emerald-300 shadow-sm'
                        : 'bg-gray-950/90 hover:bg-purple-950/70 border-purple-500/30 text-purple-200 hover:text-white hover:border-purple-400/50'
                    }`}
                    title={
                      isFollowingSeries(series.id)
                        ? 'Seri takip listenizde. Tıklayarak takibi bırakabilirsiniz.'
                        : 'Yeni bölümler yüklendiğinde bildirim almak için seriyi takip edin.'
                    }
                  >
                    {isFollowingSeries(series.id) ? (
                      <>
                        <BellRing size={15} className="text-emerald-400 fill-emerald-500/20 flex-shrink-0" />
                        <span>Takipte</span>
                        <Check size={14} className="text-emerald-400 stroke-[3] flex-shrink-0" />
                      </>
                    ) : (
                      <>
                        <Bell size={15} className="text-purple-400 flex-shrink-0" />
                        <span>Takip Et</span>
                      </>
                    )}
                  </button>
                </div>

                {/* 4. Full-Width Wallpaper Button */}
                <button
                  onClick={() => setView({ type: 'wallpapers', seriesId: series.id })}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-bold text-xs sm:text-[13px] transition-all active:scale-[0.98] cursor-pointer bg-gray-950/90 hover:bg-pink-950/50 border border-pink-500/30 text-pink-200 hover:text-white hover:border-pink-400/60 shadow-sm"
                  title="Bu serinin yüksek çözünürlüklü duvar kağıtlarını görüntüle"
                >
                  <ImageIcon size={15} className="text-pink-400 flex-shrink-0" />
                  <span>Serinin Wallpaperları</span>
                </button>
              </div>
            </div>

            {/* Details Column */}
            <div className="flex-1 min-w-0 flex flex-col justify-between space-y-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight mb-2">
                  {series.title}
                </h1>

                {/* Clean Format-Aware Metadata Badges */}
                <div className="my-3 flex flex-wrap items-center gap-2 text-xs">
                  {/* Güncel Tag Badge */}
                  {(series.isGuncel || series.status === 'Güncel') && (
                    <div className="bg-gradient-to-r from-cyan-600 via-sky-600 to-blue-600 border border-cyan-300/40 rounded-xl px-3 py-1.5 flex items-center gap-1.5 text-white shadow-md font-extrabold">
                      <RefreshCw size={13} className="animate-spin-slow text-cyan-200" />
                      <span>GÜNCEL SERİ</span>
                    </div>
                  )}

                  {/* Author */}
                  <div className="bg-purple-950/80 border border-purple-500/30 rounded-xl px-3 py-1.5 flex items-center gap-1.5 text-purple-200 shadow-sm">
                    <PenTool size={14} className="text-purple-400" />
                    <span className="text-purple-300 font-bold">Yazar:</span>
                    <span className="font-extrabold text-white">{series.author || 'Belirtilmedi'}</span>
                  </div>

                  {/* Artist - Only for Manhwa/Manga/Webtoon */}
                  {!series.type.toLowerCase().includes('novel') && series.artist && (
                    <div className="bg-fuchsia-950/80 border border-fuchsia-500/30 rounded-xl px-3 py-1.5 flex items-center gap-1.5 text-fuchsia-200 shadow-sm">
                      <Palette size={14} className="text-fuchsia-400" />
                      <span className="text-fuchsia-300 font-bold">Çizer:</span>
                      <span className="font-extrabold text-white">{effectiveArtist}</span>
                    </div>
                  )}

                  {/* Ekip / Fansub - Only for Manhwa/Manga/Webtoon */}
                  {!series.type.toLowerCase().includes('novel') && series.translator && (
                    <div className="bg-indigo-950/80 border border-indigo-500/30 rounded-xl px-3 py-1.5 flex items-center gap-1.5 text-indigo-200 shadow-sm">
                      <ShieldCheck size={14} className="text-indigo-400" />
                      <span className="text-indigo-300 font-bold">Ekip:</span>
                      <span className="font-extrabold text-white">{series.translator}</span>
                    </div>
                  )}

                  {/* Release Year if available */}
                  {(effectiveReleaseYear || series.releaseYear) && (
                    <div className="bg-gray-900 border border-purple-500/20 rounded-xl px-3 py-1.5 flex items-center gap-1.5 text-gray-300 shadow-sm">
                      <Calendar size={14} className="text-purple-400" />
                      <span className="text-gray-400 font-bold">Çıkış Yılı:</span>
                      <span className="font-extrabold text-gray-200">{effectiveReleaseYear || series.releaseYear}</span>
                    </div>
                  )}
                </div>

                {/* Custom Badges & Genres (Tüm Özel Etiketler & Türler) */}
                {(() => {
                  const rawBadges = Array.isArray(series.customBadges) ? series.customBadges : [];
                  const rawGenres = Array.isArray(effectiveGenres) && effectiveGenres.length > 0 ? effectiveGenres : (series.genres || []);
                  const allTags = Array.from(new Set([...rawBadges, ...rawGenres])).filter(t => Boolean(t) && t.trim().length > 0);

                  if (allTags.length === 0) return null;

                  return (
                    <div className="flex flex-wrap items-center gap-1.5 my-3">
                      <span className="text-[11px] font-extrabold text-purple-300 uppercase tracking-wider flex items-center gap-1 mr-1">
                        <Tag size={13} className="text-purple-400" />
                        Etiketler & Türler:
                      </span>
                      {allTags.map(tag => {
                        const isCustomBadge = rawBadges.includes(tag);
                        const is18 = tag === '18+' || tag === '+18';

                        return (
                          <button
                            key={tag}
                            onClick={() => setView({ type: 'categories', genre: tag })}
                            className={`text-xs px-2.5 py-1 rounded-lg font-semibold transition cursor-pointer flex items-center gap-1 shadow-sm ${
                              is18
                                ? 'bg-rose-950/80 hover:bg-rose-900 border border-rose-500/50 text-rose-300 hover:text-white'
                                : isCustomBadge
                                ? 'bg-gradient-to-r from-purple-950 via-indigo-950 to-purple-900 hover:from-purple-900 hover:to-indigo-800 border border-purple-400/50 text-purple-200 hover:text-white ring-1 ring-purple-500/30'
                                : 'bg-purple-950/70 hover:bg-purple-900 border border-purple-500/30 text-purple-200 hover:text-white'
                            }`}
                            title={`"${tag}" etiketine ait tüm serileri gör`}
                          >
                            {isCustomBadge && <Sparkles size={11} className="text-amber-400 shrink-0" />}
                            <span>{tag}</span>
                          </button>
                        );
                      })}
                    </div>
                  );
                })()}

                {/* Synopsis */}
                {(() => {
                  // SADECE VE SADECE <div class="descManga"><div id="synopsis"><p>özet</p></div></div> içindeki metni al!
                  let synopsisText = '';
                  const rawContent = series.synopsis || '';

                  // HTML entity'leri temizle (&lt; -> < vb.)
                  const decoded = rawContent
                    .replace(/&lt;/g, '<')
                    .replace(/&gt;/g, '>')
                    .replace(/&quot;/g, '"')
                    .replace(/&#39;|&apos;/g, "'")
                    .replace(/&amp;/g, '&');

                  // 1. Doğrudan id="synopsis" veya class="descManga" bloğunu ara
                  const synopsisMatch = decoded.match(/<div[^>]*id=["']synopsis["'][^>]*>([\s\S]*?)<\/div>/i) ||
                                        decoded.match(/<div[^>]*class=["'][^"']*descManga[^"']*["'][^>]*>([\s\S]*?)<\/div>/i);

                  if (synopsisMatch && synopsisMatch[1]) {
                    // Sadece o bloğun içindeki metni al, tüm HTML etiketlerini ve çöpleri yok et
                    synopsisText = synopsisMatch[1]
                      .replace(/<br\s*\/?>/gi, '\n')
                      .replace(/<\/p>/gi, '\n\n')
                      .replace(/<[^>]+>/g, '')
                      .replace(/&nbsp;/gi, ' ')
                      .replace(/&amp;/gi, '&')
                      .replace(/&quot;/gi, '"')
                      .replace(/&#39;|&apos;/gi, "'")
                      .replace(/\n{3,}/g, '\n\n')
                      .trim();
                  } else {
                    // Eğer bu bloklar yoksa, serinin normal metnini al ama Blogger çöplerini temizle
                    const { cleanSynopsis } = getSeriesAlertsAndCleanSynopsis(series.synopsis, series.notice);
                    synopsisText = cleanSynopsis
                      .replace(/<topla>[\s\S]*?<\/topla>/gi, '')
                      .replace(/<div class="separator"[\s\S]*?<\/div>/gi, '')
                      .replace(/<input[\s\S]*?>/gi, '')
                      .replace(/<[^>]+>/g, '')
                      .trim();
                  }

                  if (!synopsisText || synopsisText.includes('<topla>') || synopsisText.includes('class="separator"')) {
                    synopsisText = 'Bu seri için henüz bir özet girilmemiştir.';
                  }
                  const isLongSynopsis = false;

                  return (
                    <div className="mt-4 relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-950/50 via-gray-950/90 to-indigo-950/50 border border-purple-500/35 shadow-[0_10px_30px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(168,85,247,0.2)] p-4 sm:p-5 transition-all duration-300">
                      {/* Top glowing highlight line */}
                      <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-purple-400/80 to-transparent pointer-events-none" />

                      {/* Subtle ambient glow & watermark */}
                      <div className="absolute -top-10 -right-10 w-28 h-28 bg-purple-600/15 rounded-full blur-2xl pointer-events-none" />
                      <BookOpen
                        size={72}
                        className="absolute -bottom-3 -right-3 text-purple-400/[0.04] -rotate-12 pointer-events-none select-none"
                      />

                      {/* Card Header */}
                      <div className="flex items-center gap-2.5 mb-2.5 pb-2 border-b border-purple-500/20">
                        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-600/40 to-indigo-600/40 border border-purple-400/40 flex items-center justify-center text-purple-300 shadow-inner flex-shrink-0">
                          <Sparkles size={14} className="text-purple-300" />
                        </div>
                        <h3 className="text-xs sm:text-[13px] font-black uppercase tracking-wider bg-gradient-to-r from-white via-purple-200 to-purple-400 bg-clip-text text-transparent">
                          Hikaye Özeti
                        </h3>
                      </div>

                      {/* Story Content */}
                      <div
                        onClick={() => {
                          if (isLongSynopsis && !isSynopsisExpanded) {
                            setIsSynopsisExpanded(true);
                          }
                        }}
                        className={`relative ${!isSynopsisExpanded && isLongSynopsis ? 'cursor-pointer' : ''}`}
                      >
                        <p
                          className="text-[13px] sm:text-sm text-gray-200/95 leading-[1.75] whitespace-pre-line text-left break-words font-normal"
                        >
                          {synopsisText}
                        </p>


                      </div>

                      {/* Single Expand / Collapse Pill Button */}
                      {isLongSynopsis && (
                        <div className="mt-3 pt-2.5 border-t border-purple-500/20 flex items-center justify-center">
                          <button
                            type="button"
                            onClick={() => setIsSynopsisExpanded(!isSynopsisExpanded)}
                            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-gradient-to-r from-purple-600/30 via-indigo-600/30 to-purple-600/30 hover:from-purple-600/50 hover:to-indigo-600/50 border border-purple-400/40 hover:border-purple-300/70 text-purple-200 hover:text-white text-xs font-extrabold tracking-wide shadow-[0_0_15px_rgba(168,85,247,0.2)] transition-all duration-200 active:scale-95 cursor-pointer group/btn"
                            aria-expanded={isSynopsisExpanded}
                          >
                            <span>{isSynopsisExpanded ? 'Daha Az Göster' : 'Devamını Oku'}</span>
                            {isSynopsisExpanded ? (
                              <ChevronUp size={14} className="text-purple-300 group-hover/btn:-translate-y-0.5 transition-transform" />
                            ) : (
                              <ChevronDown size={14} className="text-purple-300 group-hover/btn:translate-y-0.5 transition-transform" />
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>

              {/* Action Buttons (First / Last chapter / Progress / Follow) */}
              <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3">
                {/* On mobile: First & Last Chapter buttons side-by-side (grid-cols-2); On desktop: regular flex item */}
                {(firstChapter || latestChapter) && (
                  <div className="grid grid-cols-2 gap-2 flex-1 sm:flex sm:gap-3">
                    {firstChapter && (
                      <button
                        onClick={() =>
                          setView({ type: 'reader', seriesId: series.id, chapterId: firstChapter.id })
                        }
                        className="flex-1 bg-purple-800 hover:bg-purple-700 text-white font-bold py-2.5 px-3 sm:px-4 rounded-xl text-xs sm:text-sm flex items-center justify-center gap-1.5 sm:gap-2 shadow transition active:scale-95 whitespace-nowrap min-w-0"
                      >
                        <BookOpen size={16} className="flex-shrink-0" />
                        <span className="truncate">İlk Bölüm ({firstChapter.number})</span>
                      </button>
                    )}

                    {latestChapter && (
                      <button
                        onClick={() =>
                          setView({ type: 'reader', seriesId: series.id, chapterId: latestChapter.id })
                        }
                        className="flex-1 bg-indigo-800 hover:bg-indigo-700 text-white font-bold py-2.5 px-3 sm:px-4 rounded-xl text-xs sm:text-sm flex items-center justify-center gap-1.5 sm:gap-2 shadow transition active:scale-95 whitespace-nowrap min-w-0"
                      >
                        <BookOpen size={16} className="flex-shrink-0" />
                        <span className="truncate">Son Bölüm ({latestChapter.number})</span>
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Last read progress banner */}
              {historyProgress && (
                <div className="bg-emerald-950/60 border border-emerald-500/40 p-3 rounded-xl flex items-center justify-between text-xs text-emerald-200">
                  <div className="flex items-center gap-2">
                    <Clock size={16} className="text-emerald-400 flex-shrink-0" />
                    <span>
                      Kaldığın Yer:{' '}
                      <strong className="text-white">{historyProgress.lastChapterTitle}</strong>
                    </span>
                  </div>
                  <button
                    onClick={() =>
                      setView({
                        type: 'reader',
                        seriesId: series.id,
                        chapterId: historyProgress.lastChapterId
                      })
                    }
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-1 rounded-lg text-xs transition"
                  >
                    Kaldığın Yere Git
                  </button>
                </div>
              )}

            </div>
          </div>
        </div>

        {/* Compact Warning & Notice Banners Section (Only rendered if an active notice or warning exists) */}
        {(() => {
          const { alerts: seriesAlerts } = getSeriesAlertsAndCleanSynopsis(series.synopsis, series.notice);
          const hasAdultWarning =
            (series.is18Plus || series.genres.includes('18+') || (series.ageRating && series.ageRating !== 'Genel')) &&
            !seriesAlerts.some(a => a.type === 'warning');

          if (seriesAlerts.length === 0 && !series.releaseDay && !hasAdultWarning) return null;

          return (
            <div className="mt-4 space-y-2.5">
              {/* Structured Blogger / Admin Alerts (m-warning, m-info, note) */}
              {seriesAlerts.length > 0 && (
                <MangaAlertStack alerts={seriesAlerts} className="space-y-2.5" />
              )}

              {/* Release Schedule Banner */}
              {series.releaseDay && (
                <div className="bg-amber-950/50 border border-amber-500/40 rounded-2xl p-3 sm:p-3.5 flex items-center gap-3 shadow-md">
                  <Megaphone size={18} className="text-amber-400 flex-shrink-0" />
                  <p className="text-xs sm:text-sm text-amber-300/90 font-semibold flex items-center gap-1.5">
                    <Clock size={14} className="text-amber-400" />
                    Yayın Günü: <span className="text-white font-bold">{series.releaseDay}</span> {series.releaseTime && series.releaseTime.trim() ? ` (${series.releaseTime.trim()})` : ''}
                  </p>
                </div>
              )}

              {/* 18+ / Content Warning Banner (if not already shown by a custom m-warning alert) */}
              {hasAdultWarning && (
                <div className="bg-rose-950/60 border border-rose-800/80 rounded-2xl p-3 sm:p-3.5 flex items-start gap-3 shadow-md">
                  <ShieldAlert size={18} className="text-rose-400 mt-0.5 flex-shrink-0" />
                  <div className="text-xs sm:text-sm text-rose-200">
                    <span className="font-extrabold text-rose-300 block mb-0.5">Yetişkin / Özel İçerik Uyarısı ({series.ageRating || '18+'})</span>
                    <p className="text-[11px] sm:text-xs opacity-90 leading-relaxed">
                      Bu seri hassas temalar veya yetişkinlere yönelik unsurlar barındırabilir.
                    </p>
                  </div>
                </div>
              )}
            </div>
          );
        })()}

        {/* Chapters Section */}
        <div className="mt-8 relative overflow-hidden bg-gradient-to-b from-gray-900/95 via-gray-950/95 to-gray-950 border border-purple-500/25 rounded-2xl sm:rounded-3xl p-4 sm:p-7 shadow-[0_12px_40px_rgba(0,0,0,0.6)]">
          {/* Top Ambient Glow Line */}
          <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-purple-400/70 to-transparent" />
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

          {/* Header & Controls */}
          <div className="relative flex flex-col gap-3 mb-5 pb-4 border-b border-purple-500/15">
            {/* Row 1: Title, Count, Reading Stats & Quick Actions */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between gap-2">
                {/* Left: Icon, Title & Total Chapters */}
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-purple-600/25 border border-purple-400/30 flex items-center justify-center text-purple-300 shadow-sm shrink-0">
                    <Layers size={18} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-base sm:text-lg font-black tracking-tight text-white truncate">
                        Bölüm Listesi
                      </h2>
                      <span className="text-[11px] bg-purple-950/90 text-purple-200 border border-purple-500/40 px-2 py-0.5 rounded-md font-extrabold shadow-sm shrink-0">
                        {series.chapters.length} Bölüm
                      </span>
                      {adultChaptersCount > 0 && (
                        <span className="text-[11px] bg-rose-950/90 text-rose-200 border border-rose-500/40 px-1.5 py-0.5 rounded-md font-extrabold flex items-center gap-1 shadow-sm shrink-0">
                          <Flame size={11} className="text-rose-400 fill-rose-400/30" />
                          {adultChaptersCount} Smut
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Reading Stats & Actions */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <span
                    className={`text-[11px] px-2 py-1 rounded-lg font-extrabold border flex items-center gap-1 shadow-sm ${
                      readChaptersCount > 0
                        ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40'
                        : 'bg-gray-950/90 text-gray-400 border-gray-800'
                    }`}
                    title="Okunan Bölüm Sayısı"
                  >
                    <CheckCircle2 size={12} className={readChaptersCount > 0 ? 'text-emerald-400' : 'text-gray-500'} />
                    <span>{readChaptersCount}/{series.chapters.length}</span>
                  </span>

                  <button
                    onClick={() => markAllChaptersRead(series.id)}
                    className="text-[11px] font-bold text-purple-300 hover:text-white bg-purple-950/60 hover:bg-purple-900 border border-purple-500/30 px-2 py-1 rounded-lg transition cursor-pointer flex items-center gap-1 shadow-sm"
                    title="Tüm bölümleri okundu olarak işaretle"
                  >
                    <Check size={12} />
                    <span className="hidden sm:inline">Tümünü Oku</span>
                  </button>

                  {readChaptersCount > 0 && (
                    <button
                      onClick={() => markAllChaptersUnread(series.id)}
                      className="text-[11px] font-bold text-rose-300 hover:text-white bg-rose-950/50 hover:bg-rose-900 border border-rose-500/30 px-2 py-1 rounded-lg transition cursor-pointer"
                      title="Okundu işaretlerini sıfırla"
                    >
                      Sıfırla
                    </button>
                  )}
                </div>
              </div>

              {/* Progress Line running smoothly across */}
              {series.chapters.length > 0 && (
                <div className="w-full h-1 bg-gray-950 rounded-full overflow-hidden border border-purple-500/10">
                  <div
                    className="h-full bg-gradient-to-r from-purple-500 via-indigo-500 to-emerald-400 transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.round((readChaptersCount / series.chapters.length) * 100))}%` }}
                  />
                </div>
              )}
            </div>

            {/* Row 2: Search Input & Sort Order Button */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1 min-w-0">
                <input
                  type="text"
                  placeholder="Bölüm ara..."
                  value={chapterSearch}
                  onChange={e => { setChapterSearch(e.target.value); setCurrentPage(1); }}
                  className="w-full bg-gray-950/90 border border-purple-500/25 text-white placeholder-gray-500 text-xs rounded-xl pl-8 pr-7 py-2 focus:outline-none focus:border-purple-400 transition"
                />
                <Search size={14} className="absolute left-2.5 top-2.5 text-purple-400/70" />
                {chapterSearch && (
                  <button
                    type="button"
                    onClick={() => { setChapterSearch(''); setCurrentPage(1); }}
                    className="absolute right-2 top-2 text-gray-500 hover:text-white"
                  >
                    <X size={13} />
                  </button>
                )}
              </div>

              {/* Sort Order Button */}
              <button
                onClick={() => setSortOrder(prev => (prev === 'desc' ? 'asc' : 'desc'))}
                className="bg-gray-950/90 hover:bg-purple-950/80 border border-purple-500/30 hover:border-purple-400/60 text-purple-200 font-extrabold text-xs px-3 py-2 rounded-xl flex items-center gap-1.5 transition cursor-pointer shadow-sm shrink-0 whitespace-nowrap"
                title="Sıralamayı Değiştir"
              >
                <ArrowUpDown size={14} className="text-purple-400 shrink-0" />
                <span>{sortOrder === 'desc' ? 'Yeniden Eskiye' : 'Eskiden Yeniye'}</span>
              </button>
            </div>

            {/* Row 3: Filter Tabs as full-width segmented control */}
            <div className="grid grid-cols-3 sm:flex items-center bg-gray-950/90 border border-purple-500/25 rounded-xl p-1 text-xs shadow-inner gap-1">
              <button
                onClick={() => { setChapterFilter('all'); setCurrentPage(1); }}
                className={`py-1.5 px-3 rounded-lg font-extrabold transition cursor-pointer text-center whitespace-nowrap ${
                  chapterFilter === 'all'
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Hepsi
              </button>
              <button
                onClick={() => { setChapterFilter('unread'); setCurrentPage(1); }}
                className={`py-1.5 px-3 rounded-lg font-extrabold transition cursor-pointer text-center whitespace-nowrap ${
                  chapterFilter === 'unread'
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Okunmayan
              </button>
              <button
                onClick={() => { setChapterFilter('read'); setCurrentPage(1); }}
                className={`py-1.5 px-3 rounded-lg font-extrabold transition cursor-pointer text-center whitespace-nowrap ${
                  chapterFilter === 'read'
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Okunan
              </button>
              {adultChaptersCount > 0 && (
                <button
                  onClick={() => { setChapterFilter('18plus'); setCurrentPage(1); }}
                  className={`py-1.5 px-3 rounded-lg font-black transition cursor-pointer text-center whitespace-nowrap flex items-center justify-center gap-1 ${
                    chapterFilter === '18plus'
                      ? 'bg-gradient-to-r from-rose-600 to-red-600 text-white shadow'
                      : 'text-rose-400 hover:text-rose-200'
                  }`}
                >
                  <Flame size={12} className="fill-current" />
                  18+
                </button>
              )}
            </div>
          </div>
          
          {/* Chapters Grid / List */}
          {sortedChapters.length === 0 ? (
            <div className="p-10 text-center text-gray-400 text-sm bg-gray-950/50 rounded-2xl border border-purple-500/15">
              Aranan kriterlere uygun bölüm bulunamadı.
            </div>
          ) : (
            <div className="space-y-4">
              <div
                className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 ${
                  isExpandedList
                    ? 'max-h-[390px] sm:max-h-[520px] overflow-y-auto pr-1.5 custom-scrollbar overscroll-contain'
                    : 'max-h-[370px] md:max-h-none overflow-y-auto md:overflow-visible pr-1 md:pr-0 custom-scrollbar overscroll-contain'
                }`}
              >
                {paginatedChapters.map(ch => {
                  const isRead = isChapterRead(ch);
                  const isNew24h = checkIsChapterNew(ch, 24);
                  const is18 = isChapter18Plus(ch);

                  // Extract all individual page URLs (even if pasted as HTML <img> blocks)
                  // and skip the first 2 images (cover / fansub credits) + last image (outro)
                  const getChapterPreview = (chapter: Chapter): { thumb: string; raw: string } => {
                    let urls = extractImageUrls(chapter.images).filter(u => !isIframeUrl(u));
                    if (urls.length === 0 && chapter.content) {
                      urls = extractImageUrls(chapter.content).filter(u => !isIframeUrl(u));
                    }
                    if (urls.length > 0) {
                      let pool = urls;
                      if (urls.length >= 5) {
                        pool = urls.slice(2, urls.length - 1);
                      } else if (urls.length === 4) {
                        pool = urls.slice(2, 3);
                      } else if (urls.length === 3) {
                        pool = [urls[1]];
                      } else if (urls.length === 2) {
                        pool = [urls[1]];
                      }
                      let seed = Math.round((chapter.number || 1) * 31);
                      for (let i = 0; i < chapter.id.length; i++) {
                        seed += chapter.id.charCodeAt(i) * (i + 3);
                      }
                      const rawChosen =
                        pool[seed % pool.length] ||
                        urls[Math.floor(urls.length / 2)] ||
                        urls[0];
                      const optimized = getOptimizedImageUrl(rawChosen, {
                        width: 120,
                        height: 120,
                        quality: 65
                      })
                        .replace(/\/s1600\//g, '/s320/')
                        .replace(/=s1600$/g, '=s320');
                      return { thumb: optimized, raw: rawChosen };
                    }
                    const fallback = getOptimizedImageUrl(series.coverImage, {
                      width: 120,
                      height: 120,
                      quality: 65
                    });
                    return { thumb: fallback, raw: series.coverImage };
                  };

                  const { thumb: previewImg, raw: rawPreviewImg } = getChapterPreview(ch);

                  return (
                    <div
                      key={ch.id}
                      onClick={() =>
                        setView({ type: 'reader', seriesId: series.id, chapterId: ch.id })
                      }
                      className={`group relative overflow-hidden p-2.5 sm:p-3.5 rounded-2xl border text-left flex items-center justify-between gap-2.5 transition-all duration-200 hover:-translate-y-0.5 cursor-pointer ${
                        isRead
                          ? 'bg-gray-950/50 hover:bg-purple-950/35 border-emerald-500/25 hover:border-emerald-400/50 text-gray-300'
                          : is18
                          ? 'bg-gradient-to-r from-rose-950/35 via-gray-950/95 to-purple-950/30 hover:from-rose-950/55 hover:to-purple-950/50 border-rose-500/35 hover:border-rose-400/70 text-gray-100 shadow-[0_2px_14px_rgba(244,63,94,0.08)]'
                          : 'bg-gradient-to-r from-gray-900/90 via-gray-950/95 to-gray-900/90 hover:from-purple-950/60 hover:via-gray-900/95 hover:to-indigo-950/60 border-purple-500/20 hover:border-purple-400/55 text-gray-100 shadow-sm hover:shadow-[0_4px_20px_rgba(168,85,247,0.14)]'
                      }`}
                    >
                      {/* Left glowing indicator bar */}
                      <div
                        className={`absolute left-0 top-2.5 bottom-2.5 w-1 rounded-r-full transition-all ${
                          is18
                            ? 'bg-gradient-to-b from-rose-500 to-red-600 shadow-[0_0_8px_rgba(244,63,94,0.8)]'
                            : isRead
                            ? 'bg-gradient-to-b from-emerald-400 to-teal-500'
                            : 'bg-gradient-to-b from-purple-500 to-indigo-500 opacity-50 group-hover:opacity-100'
                        }`}
                      />

                      <div className="flex items-center gap-3 min-w-0 flex-1 pl-1">
                        {/* Chapter Mini Square Preview Thumbnail */}
                        <div
                          className={`relative w-11 h-11 sm:w-12 sm:h-12 rounded-xl overflow-hidden flex-shrink-0 bg-gray-950 border transition-all shadow-sm ${
                            is18
                              ? 'border-rose-500/60 group-hover:border-rose-400 shadow-[0_0_10px_rgba(244,63,94,0.2)]'
                              : isRead
                              ? 'border-emerald-500/45 group-hover:border-emerald-400'
                              : 'border-purple-500/35 group-hover:border-purple-400'
                          }`}
                        >
                          <img
                            src={previewImg}
                            onError={e => handleImageError(e, rawPreviewImg, series.title)}
                            alt={ch.title}
                            loading="lazy"
                            decoding="async"
                            className="w-full h-full object-cover group-hover:scale-110 transition duration-300"
                          />
                          <div
                            className={`absolute bottom-0 right-0 text-[9px] font-black px-1.5 py-0.2 rounded-tl-md backdrop-blur-xs border-t border-l ${
                              is18
                                ? 'bg-rose-950/90 text-rose-200 border-rose-500/40'
                                : isRead
                                ? 'bg-emerald-950/90 text-emerald-300 border-emerald-500/40'
                                : 'bg-purple-950/90 text-purple-200 border-purple-500/40'
                            }`}
                          >
                            #{ch.number}
                          </div>
                        </div>

                        {/* Chapter Title, Front 18+ Icon & Metadata */}
                        <div className="min-w-0 flex-1">
                          {/* Row 1: Front 18+ Icon Badge + Chapter Title */}
                          <div className="flex items-center gap-1.5 min-w-0">
                            {is18 && (
                              <span
                                className="inline-flex items-center gap-0.5 bg-gradient-to-r from-rose-600 via-red-600 to-rose-700 text-white text-[10px] font-black px-1.5 py-0.5 rounded-md border border-rose-400/70 shadow-[0_0_10px_rgba(244,63,94,0.4)] flex-shrink-0 tracking-tight"
                                title="18+ Yetişkin / Smut İçerikli Bölüm"
                              >
                                <Flame size={10} className="fill-amber-200 text-amber-200 flex-shrink-0" />
                                <span>18+</span>
                              </span>
                            )}
                            <span
                              className={`font-extrabold text-xs sm:text-[13px] truncate transition-colors ${
                                isRead
                                  ? 'text-gray-300 group-hover:text-white'
                                  : is18
                                  ? 'text-rose-100 group-hover:text-white'
                                  : 'text-white group-hover:text-purple-200'
                              }`}
                            >
                              {ch.title}
                            </span>
                          </div>

                          {/* Row 2: Date & Secondary Badges */}
                          <div className="flex items-center gap-1.5 flex-wrap mt-1">
                            <span className="text-[11px] text-gray-400 flex items-center gap-1">
                              <Calendar size={10} className="text-purple-400/70 flex-shrink-0" />
                              <span>{ch.publishedDate}</span>
                            </span>

                            {/* Chapter Special Tag Badge */}
                            {ch.specialTag && ch.specialTag.toLowerCase().trim() !== '18+' && (
                              <ChapterSpecialBadge tag={ch.specialTag} size="xs" />
                            )}

                            {/* 24-Hour "YENİ" Tag */}
                            {isNew24h && (
                              <span className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-[9px] font-black px-1.5 py-0.2 rounded uppercase flex-shrink-0 animate-pulse shadow-sm flex items-center gap-0.5">
                                <Flame size={9} />
                                YENİ
                              </span>
                            )}

                            {/* "OKUNDU" Tag */}
                            {isRead && (
                              <span className="bg-emerald-950/90 text-emerald-400 border border-emerald-700/60 text-[9px] font-extrabold px-1.5 py-0.2 rounded flex items-center gap-0.5 flex-shrink-0">
                                <Check size={9} />
                                OKUNDU
                              </span>
                            )}

                            {/* Non-logged in lock badge */}
                            {!user && (
                              <span className="bg-purple-950/90 text-amber-300 border border-purple-500/40 text-[9px] font-bold px-1.5 py-0.2 rounded flex items-center gap-0.5 flex-shrink-0">
                                <Lock size={8} />
                                Üyelik
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right Read Toggle Button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleChapterRead(series.id, ch.id, ch.number, ch.title);
                        }}
                        className={`p-2 rounded-xl border transition flex-shrink-0 cursor-pointer ${
                          isRead
                            ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-400 hover:bg-rose-950/80 hover:border-rose-500/50 hover:text-rose-400'
                            : 'bg-gray-900/90 border-purple-500/20 text-gray-500 hover:text-purple-200 hover:border-purple-400/50 opacity-70 group-hover:opacity-100'
                        }`}
                        title={isRead ? 'Okunmadı olarak işaretle' : 'Okundu olarak işaretle'}
                      >
                        <CheckCircle2 size={16} />
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Pagination & List Expansion Toggle Bar */}
              <div className="pt-4 border-t border-purple-500/15 flex flex-col sm:flex-row items-center justify-between gap-3">
                <button
                  onClick={() => setIsExpandedList(!isExpandedList)}
                  className="w-full sm:w-auto bg-gradient-to-r from-purple-950/80 via-indigo-950/80 to-purple-950/80 hover:from-purple-900 hover:to-indigo-900 border border-purple-500/35 hover:border-purple-400/60 text-purple-200 hover:text-white font-extrabold text-xs px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 transition cursor-pointer shadow-sm"
                >
                  {isExpandedList ? (
                    <>
                      <ChevronUp size={15} />
                      Bölüm Listesini Daralt (Sayfalı Görünüm)
                    </>
                  ) : (
                    <>
                      <ChevronDown size={15} />
                      Tüm Bölümleri Aç ({totalChaptersCount} Bölüm)
                    </>
                  )}
                </button>

                {!isExpandedList && totalPages > 1 && (
                  <div className="flex items-center gap-1.5 overflow-x-auto max-w-full py-1">
                    <span className="text-xs text-gray-400 mr-1 font-semibold">Sayfa:</span>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`w-8 h-8 rounded-xl text-xs font-extrabold transition flex items-center justify-center cursor-pointer ${
                          currentPage === page
                            ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md border border-purple-400/50'
                            : 'bg-gray-950 text-gray-400 hover:bg-purple-950/60 hover:text-white border border-purple-500/20'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Comments Section */}
        <div className="mt-8">
          <CommentsSection seriesId={series.id} />
        </div>

      </div>

      {/* Bookmark Modal Popup */}
      {isBookmarkModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto animate-fadeIn">
          <div className="bg-gray-900 border-2 border-purple-500 rounded-2xl p-5 sm:p-6 w-full max-w-md shadow-2xl relative my-auto max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsBookmarkModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white p-1 rounded-full hover:bg-gray-800"
            >
              <X size={20} />
            </button>

            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Bookmark className="text-purple-400 fill-current" size={20} />
              Kütüphanede Klasör Oluştur & Seç
            </h3>

            {/* Create new folder input */}
            <form onSubmit={handleAddFolder} className="flex gap-2 mb-4">
              <input
                type="text"
                placeholder="Yeni klasör adı..."
                value={newFolderName}
                onChange={e => setNewFolderName(e.target.value)}
                className="flex-1 bg-gray-950 border border-purple-500/30 text-white placeholder-gray-500 text-xs sm:text-sm rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-purple-400"
              />
              <button
                type="submit"
                className="bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs px-4 py-2 rounded-xl transition flex items-center gap-1"
              >
                <Plus size={16} />
                Oluştur
              </button>
            </form>

            {/* Folders List with Checkboxes */}
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {bookmarkFolders.map(folder => {
                const isChecked = selectedFolderNames.includes(folder.name);
                return (
                  <div
                    key={folder.id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-gray-950 border border-gray-800 hover:border-purple-500/40 transition"
                  >
                    <label className="flex items-center gap-3 cursor-pointer flex-1 text-sm font-semibold text-gray-200">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleFolderCheck(folder.name)}
                        className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 bg-gray-800 border-gray-700"
                      />
                      <span>{folder.name}</span>
                    </label>

                    {!folder.isDefault && (
                      <button
                        onClick={() => deleteBookmarkFolder(folder.id)}
                        className="text-red-400 hover:text-red-300 p-1"
                        title="Klasörü Sil"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setIsBookmarkModalOpen(false)}
                className="bg-purple-600 hover:bg-purple-500 text-white font-bold px-5 py-2 rounded-xl text-xs sm:text-sm"
              >
                Tamam
              </button>
            </div>
          </div>
        </div>

      )}
      {/* Reading List Modal */}
      {isListModalOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto animate-fadeIn"
          onClick={() => setIsListModalOpen(false)}
        >
          <div
            className="bg-gray-900 border border-purple-500/40 rounded-2xl max-w-md w-full overflow-hidden shadow-2xl my-auto max-h-[90vh] flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-4 border-b border-gray-800 flex items-center justify-between gap-2">
              <div>
                <h3 className="font-bold text-white flex items-center gap-2 text-sm sm:text-base">
                  <BookOpen size={18} className="text-purple-400" />
                  <span>Okuma Listelerine Ekle</span>
                  <span className="text-[11px] font-extrabold px-2 py-0.5 rounded-md bg-purple-950/90 border border-purple-500/30 text-purple-300">
                    {readingLists.length} / 3 Liste
                  </span>
                </h3>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  En fazla 3 liste oluşturabilir, her listeye maksimum 30 seri ekleyebilirsiniz.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsListModalOpen(false)}
                className="p-1.5 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-white transition shrink-0"
              >
                <X size={18} />
              </button>
            </div>

            {/* Create New Reading List Form */}
            <div className="px-4 pt-3.5 pb-2 border-b border-gray-800/70 bg-gray-950/40">
              {readingLists.length < 3 ? (
                <form
                  onSubmit={e => {
                    e.preventDefault();
                    const trimmed = newReadingListName.trim();
                    if (!trimmed) return;
                    if (readingLists.length >= 3) {
                      showToast({
                        title: 'Liste Limiti Dolu (3/3)',
                        message: 'Maksimum 3 okuma listesi oluşturabilirsiniz.',
                        type: 'warning'
                      });
                      return;
                    }
                    if (readingLists.some(l => l.name.toLowerCase() === trimmed.toLowerCase())) {
                      showToast({
                        title: 'Aynı İsimde Liste Var',
                        message: 'Bu isimde bir okuma listeniz zaten mevcut.',
                        type: 'warning'
                      });
                      return;
                    }
                    const createdList = {
                      id: 'list-' + Date.now(),
                      name: trimmed,
                      seriesIds: [String(series.id)]
                    };
                    setReadingLists([...readingLists, createdList]);
                    setNewReadingListName('');
                    showToast({
                      title: 'Yeni Liste Oluşturuldu',
                      message: `"${trimmed}" listesi oluşturuldu ve "${series.title}" eklendi.`,
                      type: 'success'
                    });
                  }}
                  className="flex items-center gap-2"
                >
                  <input
                    type="text"
                    value={newReadingListName}
                    onChange={e => setNewReadingListName(e.target.value)}
                    maxLength={40}
                    placeholder={`Yeni liste adı (${readingLists.length + 1}. liste)...`}
                    className="flex-1 bg-gray-950 border border-purple-500/30 focus:border-purple-400 rounded-xl px-3 py-2 text-xs sm:text-sm text-white placeholder-gray-500 focus:outline-none transition"
                  />
                  <button
                    type="submit"
                    disabled={!newReadingListName.trim()}
                    className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-40 disabled:pointer-events-none text-white font-bold text-xs flex items-center gap-1 transition shrink-0 cursor-pointer"
                  >
                    <Plus size={15} />
                    <span>Yeni Liste</span>
                  </button>
                </form>
              ) : (
                <div className="flex items-center justify-between text-xs text-amber-300/90 bg-amber-950/30 border border-amber-500/30 rounded-xl px-3 py-2">
                  <span>Maksimum 3 liste limitine ulaştınız (3/3).</span>
                </div>
              )}
            </div>

            {/* Existing Reading Lists */}
            <div className="p-4 space-y-2.5 max-h-72 overflow-y-auto">
              {readingLists.length === 0 ? (
                <div className="text-center py-6 space-y-1">
                  <p className="text-sm font-semibold text-gray-300">Henüz okuma listeniz yok.</p>
                  <p className="text-xs text-gray-500">
                    Yukarıdaki kutucuktan ilk okuma listenizi hemen oluşturabilirsiniz.
                  </p>
                </div>
              ) : (
                readingLists.map(list => {
                  const isInList = (list.seriesIds || []).some(
                    id => String(id).trim() === String(series.id).trim() || (series.slug && String(id).trim() === String(series.slug).trim())
                  );
                  const isListFull = (list.seriesIds || []).length >= 30;
                  return (
                    <div
                      key={list.id}
                      className={`w-full flex items-center justify-between gap-2 p-3 rounded-xl border transition ${
                        isInList
                          ? 'bg-purple-900/35 border-purple-500/60 text-white shadow-sm'
                          : 'bg-gray-950 border-gray-800 text-gray-300 hover:border-purple-500/30'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-white truncate">{list.name}</span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-md border shrink-0 ${
                              isListFull
                                ? 'bg-rose-950/80 border-rose-500/40 text-rose-300'
                                : 'bg-gray-900 border-gray-700 text-gray-400'
                            }`}
                          >
                            {(list.seriesIds || []).length} / 30 Seri
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            const newLists = readingLists.map(l => {
                              if (l.id === list.id) {
                                if (isInList) {
                                  return {
                                    ...l,
                                    seriesIds: (l.seriesIds || []).filter(
                                      id => String(id).trim() !== String(series.id).trim() && (!series.slug || String(id).trim() !== String(series.slug).trim())
                                    )
                                  };
                                } else {
                                  if ((l.seriesIds || []).length >= 30) {
                                    showToast({
                                      title: 'Liste Dolu (30/30)',
                                      message: 'Bir okuma listesine en fazla 30 seri eklenebilir.',
                                      type: 'warning'
                                    });
                                    return l;
                                  }
                                  return { ...l, seriesIds: [...(l.seriesIds || []), String(series.id)] };
                                }
                              }
                              return l;
                            });
                            setReadingLists(newLists);
                          }}
                          className={`inline-flex items-center gap-1 text-xs font-extrabold px-3 py-1.5 rounded-lg border transition cursor-pointer ${
                            isInList
                              ? 'text-emerald-300 bg-emerald-950/80 border-emerald-500/50 hover:bg-emerald-900/70'
                              : isListFull
                              ? 'text-gray-500 bg-gray-900 border-gray-800 cursor-not-allowed'
                              : 'text-purple-200 bg-purple-950/70 border-purple-500/40 hover:bg-purple-800/80 hover:text-white'
                          }`}
                        >
                          {isInList ? (
                            <>
                              <Check size={14} />
                              <span>Eklendi</span>
                            </>
                          ) : (
                            <>
                              <Plus size={14} />
                              <span>{isListFull ? 'Dolu' : 'Ekle'}</span>
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm(`"${list.name}" listesini silmek istediğinize emin misiniz?`)) {
                              setReadingLists(readingLists.filter(l => l.id !== list.id));
                              showToast({
                                title: 'Liste Silindi',
                                message: `"${list.name}" okuma listesi kaldırıldı.`,
                                type: 'info'
                              });
                            }
                          }}
                          className="p-1.5 rounded-lg text-gray-500 hover:text-rose-400 hover:bg-rose-950/40 transition cursor-pointer"
                          title="Listeyi Sil"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div className="px-4 py-3 border-t border-gray-800 bg-gray-950/50 flex items-center justify-between gap-3">
              <span className="text-xs text-gray-400 font-medium truncate">
                {isAddedToAnyList
                  ? `✓ ${activeReadingLists.map(l => l.name).join(', ')}`
                  : 'Bir liste seçin veya yeni oluşturun'}
              </span>
              <button
                type="button"
                onClick={() => {
                  setIsListModalOpen(false);
                  if (isAddedToAnyList) {
                    showToast({
                      title: 'Listeye Kaydedildi',
                      message: `"${series.title}" (${activeReadingLists.map(l => l.name).join(', ')}) listenize kaydedildi.`,
                      type: 'success'
                    });
                  }
                }}
                className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold text-xs sm:text-sm px-6 py-2 rounded-xl shadow-lg transition flex items-center gap-1.5 active:scale-95 cursor-pointer flex-shrink-0"
              >
                <Check size={16} />
                <span>Tamam</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
