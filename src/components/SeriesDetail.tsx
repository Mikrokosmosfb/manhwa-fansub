import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Chapter, isSeries18Plus } from '../types';
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
  BellRing
} from 'lucide-react';
import { CommentsSection } from './CommentsSection';
import { checkIsChapterNew } from '../utils/dateUtils';
import { DiagonalStatusRibbon } from './DiagonalStatusRibbon';
import { ChapterSpecialBadge } from './ChapterSpecialBadge';
import { sortChapters } from '../utils/chapterUtils';
import { getOptimizedImageUrl } from '../utils/imageUtils';

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
    showToast
  } = useApp();

  const series = seriesList.find(s => s.id === seriesId);

  const [chapterSearch, setChapterSearch] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [chapterFilter, setChapterFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isExpandedList, setIsExpandedList] = useState<boolean>(false);
  const CHAPTERS_PER_PAGE = 15;

  const [isBookmarkModalOpen, setIsBookmarkModalOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [isSynopsisExpanded, setIsSynopsisExpanded] = useState(false);
  const [isListModalOpen, setIsListModalOpen] = useState(false);

  if (!series) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center text-gray-300">
        <h2 className="text-2xl font-bold mb-4">Seri Bulunamadı</h2>
        <button
          onClick={() => setView({ type: 'home' })}
          className="bg-purple-600 hover:bg-purple-500 text-white font-bold px-6 py-2 rounded-full"
        >
          Ana Sayfaya Dön
        </button>
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

  // Reading history progress
  const historyProgress = readingHistory[series.id];

  // Helper to check if a chapter is read (supports multiple read chapters)
  const isChapterRead = (ch: Chapter): boolean => {
    if (!historyProgress) return false;
    if (historyProgress.readChapterIds && historyProgress.readChapterIds.includes(ch.id)) return true;
    return false;
  };

  const readChaptersCount = series.chapters.filter(c => isChapterRead(c)).length;

  // Filter and sort chapters
  const filteredChapters = series.chapters.filter(c => {
    const matchesSearch = c.title.toLowerCase().includes(chapterSearch.toLowerCase()) ||
      c.number.toString().includes(chapterSearch);
    
    if (!matchesSearch) return false;

    if (chapterFilter === 'read') return isChapterRead(c);
    if (chapterFilter === 'unread') return !isChapterRead(c);
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
            
            {/* Cover Column: ONLY on mobile (-mt-20, w-48, elevated floating), normal on desktop (md:mt-0, md:w-52) */}
            <div className="flex flex-col items-center md:items-start flex-shrink-0 -mt-20 md:mt-0">
              <div className="relative w-48 sm:w-52 md:w-52 shadow-[0_16px_40px_rgba(0,0,0,0.85)] md:shadow-2xl rounded-2xl overflow-hidden border-2 border-purple-400/40 ring-4 ring-gray-950/80 md:ring-0 transition-transform duration-300">
                <DiagonalStatusRibbon status={series.status} size="lg" />
                <img
                  src={getOptimizedImageUrl(series.coverImage, { width: 400, height: 533, quality: 80 })}
                  alt={series.title}
                  width="208"
                  height="277"
                  decoding="async"
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

              {/* Rating Badge (Positioned above Library/Bookmark button) */}
              <div className="mt-3.5 w-full flex justify-center">
                <div className="inline-flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/30 px-3.5 py-1.5 rounded-full text-amber-300 font-extrabold text-xs sm:text-sm shadow-inner">
                  <div className="flex">{renderStars(series.rating)}</div>
                  <span className="ml-1 text-amber-300 font-extrabold">{series.rating} / 10</span>
                </div>
              </div>

              {/* Bookmark Button */}
              <button
                onClick={() => {
                  if (!user) {
                    openAuthModal('login');
                    return;
                  }
                  setIsBookmarkModalOpen(true);
                }}
                className={`mt-2.5 w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-sm shadow-lg transition-all ${
                  selectedFolderNames.length > 0
                    ? 'bg-purple-600 hover:bg-purple-500 text-white ring-2 ring-purple-400'
                    : 'bg-gradient-to-r from-purple-700 via-indigo-700 to-purple-800 hover:from-purple-600 hover:to-indigo-600 text-white'
                }`}
              >
                <Bookmark
                  size={18}
                  className={selectedFolderNames.length > 0 ? 'fill-current' : ''}
                />
                {selectedFolderNames.length > 0
                  ? `Kütüphanede (${selectedFolderNames.join(', ')})`
                  : 'Kütüphaneye Ekle'}
              </button>

              {/* Okuma Listesine Ekle Button */}
              <button
                onClick={() => {
                  if (!user) {
                    showToast({ title: 'Giriş Yapın', message: 'Liste oluşturmak için giriş yapmalısınız.', type: 'warning' });
                    return;
                  }
                  setIsListModalOpen(true);
                }}
                className="mt-2 w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-bold text-xs sm:text-sm shadow-md transition-all active:scale-95 bg-gray-950/90 hover:bg-purple-950/80 border border-purple-500/30 text-purple-200 hover:text-white hover:border-purple-400"
              >
                <BookOpen size={16} className="text-purple-400" />
                <span>Listeye Ekle</span>
              </button>
              {/* Takip Et (Follow) Button */}
              <button
                onClick={() => toggleFollowSeries(series.id)}
                className={`mt-2 w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-bold text-xs sm:text-sm shadow-md transition-all active:scale-95 ${
                  isFollowingSeries(series.id)
                    ? 'bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/50 text-emerald-300 ring-1 ring-emerald-500/30'
                    : 'bg-gray-950/90 hover:bg-purple-950/80 border border-purple-500/30 text-purple-200 hover:text-white hover:border-purple-400'
                }`}
                title={
                  isFollowingSeries(series.id)
                    ? 'Seri takip listenizde. Tıklayarak takibi bırakabilirsiniz.'
                    : 'Yeni bölümler yüklendiğinde bildirim almak için seriyi takip edin.'
                }
              >
                {isFollowingSeries(series.id) ? (
                  <>
                    <BellRing size={16} className="text-emerald-400 fill-emerald-500/20 animate-pulse" />
                    <span>Takip Ediliyor</span>
                    <Check size={14} className="text-emerald-400" />
                  </>
                ) : (
                  <>
                    <Bell size={16} className="text-purple-400" />
                    <span>Takip Et</span>
                  </>
                )}
              </button>

              {/* Status & Type info badges */}
              <div className="w-full grid grid-cols-2 gap-2 mt-3 text-center text-xs font-semibold">
                <div className="bg-purple-950/80 border border-purple-800/60 p-2 rounded-xl text-purple-200">
                  <span className="block text-[10px] text-gray-400 uppercase">Durum</span>
                  {series.status}
                </div>
                <div className="bg-indigo-950/80 border border-indigo-800/60 p-2 rounded-xl text-indigo-200">
                  <span className="block text-[10px] text-gray-400 uppercase">Format</span>
                  {series.type}
                </div>
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
                      <span className="font-extrabold text-white">{series.artist}</span>
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
                  {series.releaseYear && (
                    <div className="bg-gray-900 border border-purple-500/20 rounded-xl px-3 py-1.5 flex items-center gap-1.5 text-gray-300 shadow-sm">
                      <Calendar size={14} className="text-purple-400" />
                      <span className="text-gray-400 font-bold">Çıkış Yılı:</span>
                      <span className="font-extrabold text-gray-200">{series.releaseYear}</span>
                    </div>
                  )}
                </div>

                {/* Custom Badges & Genres */}
                <div className="flex flex-wrap gap-1.5 my-3">
                  {series.customBadges && series.customBadges.map(badge => (
                    <button
                      key={badge}
                      onClick={() => setView({ type: 'categories', genre: badge })}
                      className="bg-purple-950/70 hover:bg-purple-900 border border-purple-500/30 text-purple-200 hover:text-white text-xs px-2.5 py-1 rounded-lg transition"
                    >
                      {badge}
                    </button>
                  ))}

                  {series.genres.map(g => (
                    <button
                      key={g}
                      onClick={() => setView({ type: 'categories', genre: g })}
                      className="bg-purple-950/70 hover:bg-purple-900 border border-purple-500/30 text-purple-200 hover:text-white text-xs px-2.5 py-1 rounded-lg transition"
                    >
                      {g}
                    </button>
                  ))}
                </div>

                {/* Synopsis */}
                {(() => {
                  const synopsisText = series.synopsis?.trim() || 'Bu seri için henüz bir özet girilmemiştir.';
                  const isLongSynopsis = synopsisText.length > 200 || synopsisText.split('\n').length > 3;

                  return (
                    <div className="mt-4 bg-gray-950/70 border border-purple-500/25 hover:border-purple-500/40 rounded-2xl p-4 sm:p-5 transition-all shadow-inner relative group/synopsis">
                      {/* Header */}
                      <div className="flex items-center justify-between gap-2 mb-2 pb-1.5 border-b border-purple-500/15">
                        <h3 className="text-xs uppercase font-black tracking-wider text-purple-400 flex items-center gap-1.5">
                          <Sparkles size={13} className="text-purple-400" />
                          Özet
                        </h3>
                        {isLongSynopsis && (
                          <button
                            type="button"
                            onClick={() => setIsSynopsisExpanded(!isSynopsisExpanded)}
                            className="text-[11px] font-bold text-purple-300 hover:text-white transition flex items-center gap-1 sm:hidden bg-purple-950/80 px-2.5 py-0.5 rounded-md border border-purple-500/30"
                          >
                            <span>{isSynopsisExpanded ? 'Kapat' : 'Genişlet'}</span>
                            {isSynopsisExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                          </button>
                        )}
                      </div>

                      {/* Content with smooth fade */}
                      <div className="relative">
                        <p
                          className={`text-xs sm:text-sm text-gray-200/95 leading-relaxed whitespace-pre-line text-left break-words transition-all duration-300 ${
                            !isSynopsisExpanded && isLongSynopsis
                              ? 'line-clamp-3 sm:line-clamp-4 overflow-hidden'
                              : ''
                          }`}
                        >
                          {synopsisText}
                        </p>

                        {!isSynopsisExpanded && isLongSynopsis && (
                          <div className="absolute bottom-0 inset-x-0 h-10 bg-gradient-to-t from-gray-950 via-gray-950/70 to-transparent pointer-events-none" />
                        )}
                      </div>

                      {/* Symmetrical Expand / Collapse Arrow Button */}
                      {isLongSynopsis && (
                        <button
                          type="button"
                          onClick={() => setIsSynopsisExpanded(!isSynopsisExpanded)}
                          className="mt-3 w-full py-2 px-4 rounded-xl bg-purple-950/60 hover:bg-purple-900/80 border border-purple-500/30 hover:border-purple-400/60 text-purple-200 hover:text-white text-xs font-extrabold transition-all duration-200 flex items-center justify-center gap-2 group/btn shadow-md active:scale-[0.99] cursor-pointer"
                          aria-expanded={isSynopsisExpanded}
                        >
                          <span>{isSynopsisExpanded ? 'Daha Az Göster' : 'Özetin Devamını Oku'}</span>
                          {isSynopsisExpanded ? (
                            <ChevronUp size={15} className="text-purple-400 group-hover/btn:-translate-y-0.5 transition-transform" />
                          ) : (
                            <ChevronDown size={15} className="text-purple-400 group-hover/btn:translate-y-0.5 transition-transform" />
                          )}
                        </button>
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
        {(series.notice || series.releaseDay || series.is18Plus || series.genres.includes('18+') || (series.ageRating && series.ageRating !== 'Genel')) && (
          <div className="mt-4 space-y-2.5">
            {/* Translator / Admin Notice Banner */}
            {(series.notice || series.releaseDay) && (
              <div className="bg-amber-950/50 border border-amber-500/40 rounded-xl p-3 sm:p-3.5 flex items-start gap-3 shadow-md">
                <Megaphone size={18} className="text-amber-400 mt-0.5 flex-shrink-0" />
                <div className="text-xs sm:text-sm text-amber-100 flex-1">
                  {series.notice && <p className="font-medium leading-relaxed">{series.notice}</p>}
                  {series.releaseDay && (
                    <p className="mt-1 text-[11px] sm:text-xs text-amber-300/90 font-semibold flex items-center gap-1.5">
                      <Clock size={13} className="text-amber-400" />
                      Yayın Günü: <span className="text-white font-bold">{series.releaseDay}</span> {series.releaseTime ? `(${series.releaseTime})` : ''}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* 18+ / Content Warning Banner */}
            {(series.is18Plus || series.genres.includes('18+') || (series.ageRating && series.ageRating !== 'Genel')) && (
              <div className="bg-rose-950/60 border border-rose-800/80 rounded-xl p-3 sm:p-3.5 flex items-start gap-3 shadow-md">
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
        )}

        {/* Chapters Section */}
        <div className="mt-8 bg-gray-900/90 border border-purple-500/20 rounded-3xl p-5 sm:p-8 shadow-xl">
          
          {/* Header & Controls */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-gray-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-purple-900/60 border border-purple-500/40 flex items-center justify-center text-purple-300 shadow-inner">
                <BookOpen size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-lg sm:text-xl font-bold text-white">
                    Bölüm Listesi
                  </h2>
                  <span className="text-xs bg-purple-950 text-purple-300 border border-purple-800 px-2.5 py-0.5 rounded-full font-extrabold">
                    {series.chapters.length} Bölüm
                  </span>
                  <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-bold border flex items-center gap-1 ${
                    readChaptersCount > 0
                      ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700/50'
                      : 'bg-gray-950 text-gray-400 border-gray-800'
                  }`}>
                    <CheckCircle2 size={12} className={readChaptersCount > 0 ? 'text-emerald-400' : 'text-gray-500'} />
                    <span>{readChaptersCount} / {series.chapters.length} Okundu</span>
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-1 text-xs text-gray-400 flex-wrap">
                  <span>Okumak istediğiniz bölümü seçin.</span>
                  {/* Bulk Read Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => markAllChaptersRead(series.id)}
                      className="text-[11px] font-bold text-purple-300 hover:text-purple-100 hover:underline cursor-pointer flex items-center gap-1"
                      title="Tüm bölümleri okundu olarak işaretle"
                    >
                      <Check size={12} />
                      Tümünü Okundu Yap
                    </button>
                    {readChaptersCount > 0 && (
                      <>
                        <span className="text-gray-600">•</span>
                        <button
                          onClick={() => markAllChaptersUnread(series.id)}
                          className="text-[11px] font-bold text-rose-400/90 hover:text-rose-300 hover:underline cursor-pointer"
                          title="Okundu işaretlerini temizle"
                        >
                          Sıfırla
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Controls: Search, Filter Tabs & Sort */}
            <div className="flex flex-wrap items-center gap-2">
              
              {/* Filter Tabs (Hepsi, Okunmayanlar, Okunanlar) */}
              <div className="flex items-center bg-gray-950 border border-purple-500/30 rounded-xl p-1 text-xs">
                <button
                  onClick={() => { setChapterFilter('all'); setCurrentPage(1); }}
                  className={`px-2.5 py-1 rounded-lg font-bold transition ${
                    chapterFilter === 'all'
                      ? 'bg-purple-600 text-white shadow'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Hepsi
                </button>
                <button
                  onClick={() => { setChapterFilter('unread'); setCurrentPage(1); }}
                  className={`px-2.5 py-1 rounded-lg font-bold transition ${
                    chapterFilter === 'unread'
                      ? 'bg-purple-600 text-white shadow'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Okunmayanlar
                </button>
                <button
                  onClick={() => { setChapterFilter('read'); setCurrentPage(1); }}
                  className={`px-2.5 py-1 rounded-lg font-bold transition ${
                    chapterFilter === 'read'
                      ? 'bg-purple-600 text-white shadow'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Okunanlar
                </button>
              </div>

              {/* Search Chapter */}
              <div className="relative flex-1 sm:w-44">
                <input
                  type="text"
                  placeholder="Bölüm ara..."
                  value={chapterSearch}
                  onChange={e => { setChapterSearch(e.target.value); setCurrentPage(1); }}
                  className="w-full bg-gray-950 border border-purple-500/30 text-white placeholder-gray-500 text-xs rounded-xl pl-8 pr-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-purple-400"
                />
                <Search size={14} className="absolute left-2.5 top-2 text-gray-400" />
              </div>

              {/* Sort Order Button */}
              <button
                onClick={() => setSortOrder(prev => (prev === 'desc' ? 'asc' : 'desc'))}
                className="bg-purple-900/70 hover:bg-purple-800 border border-purple-500/40 text-purple-200 font-semibold text-xs px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition"
                title="Sıralamayı Değiştir"
              >
                <ArrowUpDown size={14} />
                <span>{sortOrder === 'desc' ? 'Son -> İlk' : 'İlk -> Son'}</span>
              </button>
            </div>
          </div>

          {/* Chapters Grid / List */}
          {sortedChapters.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-sm bg-gray-950/40 rounded-2xl border border-gray-800">
              Aranan kriterlere uygun bölüm bulunamadı.
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {paginatedChapters.map(ch => {
                  const isRead = isChapterRead(ch);
                  const isNew24h = checkIsChapterNew(ch, 24);

                  // Pick a varied preview image frame from chapter images or fallback to series cover
                  const getChapterPreview = (chapter: Chapter): string => {
                    if (chapter.images && chapter.images.length > 0) {
                      let seed = (chapter.number || 1) * 17;
                      for (let i = 0; i < chapter.id.length; i++) {
                        seed += chapter.id.charCodeAt(i) * (i + 1);
                      }
                      const idx = seed % chapter.images.length;
                      return chapter.images[idx] || chapter.images[0];
                    }
                    return series.coverImage;
                  };

                  const previewImg = getChapterPreview(ch);

                  return (
                    <div
                      key={ch.id}
                      onClick={() =>
                        setView({ type: 'reader', seriesId: series.id, chapterId: ch.id })
                      }
                      className={`p-3 rounded-2xl border text-left flex items-center justify-between transition group hover:-translate-y-0.5 cursor-pointer relative ${
                        isRead
                          ? 'bg-purple-950/40 border-purple-500/40 text-purple-100'
                          : 'bg-gray-950/70 hover:bg-purple-950/50 border-gray-800 hover:border-purple-500/40 text-gray-200'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1 pr-2">
                        {/* Chapter Frame Preview Thumbnail */}
                        <div className="relative w-11 h-11 rounded-xl overflow-hidden bg-gray-900 border border-purple-500/30 flex-shrink-0 group-hover:border-purple-400 transition">
                          <img
                            src={previewImg}
                            alt="Bölüm Karesi"
                            className="w-full h-full object-cover group-hover:scale-110 transition duration-300"
                          />
                          <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition" />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-bold text-xs sm:text-sm text-gray-100 group-hover:text-purple-300 truncate">
                              {ch.title}
                            </span>
                            
                            {/* Chapter Special Tag Badge */}
                            {ch.specialTag && (
                              <ChapterSpecialBadge tag={ch.specialTag} size="sm" />
                            )}

                            {/* 24-Hour "YENİ" Tag */}
                            {isNew24h && (
                              <span className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded-md uppercase flex-shrink-0 animate-pulse shadow-sm flex items-center gap-0.5">
                                <Flame size={10} />
                                YENİ
                              </span>
                            )}

                            {/* "OKUNDU" Tag */}
                            {isRead && (
                              <span className="bg-emerald-950/90 text-emerald-400 border border-emerald-700/60 text-[9px] font-extrabold px-1.5 py-0.5 rounded-md flex items-center gap-0.5 flex-shrink-0 shadow-sm">
                                <Check size={10} />
                                OKUNDU
                              </span>
                            )}

                            {/* Non-logged in lock badge */}
                            {!user && (
                              <span className="bg-purple-950/90 text-amber-300 border border-purple-500/40 text-[9px] font-bold px-1.5 py-0.5 rounded-md flex items-center gap-0.5 flex-shrink-0 shadow-sm">
                                <Lock size={9} />
                                Üyelik
                              </span>
                            )}
                          </div>

                          <span className="text-[11px] text-gray-400 block mt-0.5">
                            {ch.publishedDate}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleChapterRead(series.id, ch.id, ch.number, ch.title);
                        }}
                        className={`p-1.5 rounded-xl border transition flex-shrink-0 cursor-pointer ${
                          isRead
                            ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-400 hover:bg-rose-950/80 hover:border-rose-500/50 hover:text-rose-400'
                            : 'bg-gray-900/80 border-gray-800 text-gray-500 hover:text-purple-300 hover:border-purple-500/40 opacity-50 group-hover:opacity-100'
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
              <div className="pt-4 border-t border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-3">
                <button
                  onClick={() => setIsExpandedList(!isExpandedList)}
                  className="w-full sm:w-auto bg-purple-950/80 hover:bg-purple-900 border border-purple-500/40 text-purple-200 font-bold text-xs px-4 py-2 rounded-xl flex items-center justify-center gap-2 transition"
                >
                  {isExpandedList ? (
                    <>
                      <ChevronUp size={16} />
                      Bölüm Listesini Daralt (Sayfalı Görünüm)
                    </>
                  ) : (
                    <>
                      <ChevronDown size={16} />
                      Tüm Bölümleri Aç ({totalChaptersCount} Bölüm)
                    </>
                  )}
                </button>

                {!isExpandedList && totalPages > 1 && (
                  <div className="flex items-center gap-1.5 overflow-x-auto max-w-full py-1">
                    <span className="text-xs text-gray-400 mr-1">Sayfa:</span>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`w-8 h-8 rounded-xl text-xs font-bold transition flex items-center justify-center ${
                          currentPage === page
                            ? 'bg-purple-600 text-white shadow-md'
                            : 'bg-gray-950 text-gray-400 hover:bg-gray-800 hover:text-white border border-gray-800'
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-gray-900 border-2 border-purple-500 rounded-2xl p-6 w-full max-w-md shadow-2xl relative">
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
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setIsListModalOpen(false)}>
          <div className="bg-gray-900 border border-gray-800 rounded-2xl max-w-sm w-full overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b border-gray-800 flex items-center justify-between">
              <h3 className="font-bold text-white flex items-center gap-2"><BookOpen size={18} className="text-purple-400" /> Okuma Listelerine Ekle</h3>
              <button onClick={() => setIsListModalOpen(false)} className="p-1 hover:bg-gray-800 rounded-lg text-gray-400"><X size={18}/></button>
            </div>
            <div className="p-4 space-y-2">
              {readingLists.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">Önce profilinizden bir okuma listesi oluşturun.</p>
              ) : (
                readingLists.map(list => {
                  const isInList = list.seriesIds.includes(series.id);
                  return (
                    <button
                      key={list.id}
                      onClick={() => {
                        const newLists = readingLists.map(l => {
                          if (l.id === list.id) {
                            if (isInList) {
                              return { ...l, seriesIds: l.seriesIds.filter(id => id !== series.id) };
                            } else {
                              if (l.seriesIds.length >= 30) {
                                showToast({ title: 'Liste Dolu', message: 'Bu listeye en fazla 30 seri eklenebilir.', type: 'error' });
                                return l;
                              }
                              return { ...l, seriesIds: [...l.seriesIds, series.id] };
                            }
                          }
                          return l;
                        });
                        setReadingLists(newLists);
                      }}
                      className={`w-full flex items-center justify-between p-3 rounded-xl border transition ${isInList ? 'bg-purple-900/40 border-purple-500/50 text-purple-200' : 'bg-gray-950 border-gray-800 text-gray-400 hover:bg-gray-800 hover:text-white'}`}
                    >
                      <span className="font-bold text-sm">{list.name}</span>
                      {isInList ? <Check size={16} className="text-purple-400" /> : <Plus size={16} />}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
