import React, { useState, useRef, useMemo, Suspense } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/Header';
import { QuickNav } from './components/QuickNav';
import { HeroSlider } from './components/HeroSlider';
import { AnnouncementAlert } from './components/AnnouncementAlert';
import { DiscordWidget } from './components/DiscordWidget';
import {
  RandomSeriesWidget,
  QuickCategoriesWidget,
  RecentCommentsWidget,
  SiteStatsWidget
} from './components/SidebarWidgets';
import { SeriesCard } from './components/SeriesCard';
import { HorizontalReleaseCard } from './components/HorizontalReleaseCard';
import { NovelRowSkeleton, ReleaseGridSkeleton } from './components/SkeletonLoader';
import { isSeries18Plus } from './types';
import { ToastNotification } from './components/ToastNotification';
import { WeeklyPopularSlider } from './components/WeeklyPopularSlider';
import { MobileBottomNav } from './components/MobileBottomNav';
import { ScrollToTopBottom } from './components/ScrollToTopBottom';
import { Footer } from './components/Footer';
import { SeoManager } from './components/SeoManager';
import { BookOpen, Sparkles, TrendingUp, ChevronRight, ChevronLeft, Layers } from 'lucide-react';
import { sortSeriesByLatestRelease } from './utils/dateUtils';
import { getOptimizedImageUrl } from './utils/imageUtils';

// Lazy-loaded secondary views and modals to minimize initial bundle size and maximize PageSpeed
const SeriesDetail = React.lazy(() => import('./components/SeriesDetail').then(m => ({ default: m.SeriesDetail })));
const ManhwaReader = React.lazy(() => import('./components/ManhwaReader').then(m => ({ default: m.ManhwaReader })));
const NovelReader = React.lazy(() => import('./components/NovelReader').then(m => ({ default: m.NovelReader })));
const LibraryView = React.lazy(() => import('./components/LibraryView').then(m => ({ default: m.LibraryView })));
const AdvancedSearchView = React.lazy(() => import('./components/AdvancedSearchView').then(m => ({ default: m.AdvancedSearchView })));
const CategoriesView = React.lazy(() => import('./components/CategoriesView').then(m => ({ default: m.CategoriesView })));
const SeriesListView = React.lazy(() => import('./components/SeriesListView').then(m => ({ default: m.SeriesListView })));
const AZListView = React.lazy(() => import('./components/AZListView').then(m => ({ default: m.AZListView })));
const HistoryView = React.lazy(() => import('./components/HistoryView').then(m => ({ default: m.HistoryView })));
const ScheduleView = React.lazy(() => import('./components/ScheduleView').then(m => ({ default: m.ScheduleView })));
const RequestBoardView = React.lazy(() => import('./components/RequestBoardView').then(m => ({ default: m.RequestBoardView })));
const ReportModal = React.lazy(() => import('./components/ReportModal').then(m => ({ default: m.ReportModal })));
const RequestModal = React.lazy(() => import('./components/RequestModal').then(m => ({ default: m.RequestModal })));
const JoinTeamModal = React.lazy(() => import('./components/JoinTeamModal').then(m => ({ default: m.JoinTeamModal })));
const ManagementPanel = React.lazy(() => import('./components/ManagementPanel').then(m => ({ default: m.ManagementPanel })));
const NotificationsView = React.lazy(() => import('./components/NotificationsView').then(m => ({ default: m.NotificationsView })));
const LessonsView = React.lazy(() => import('./components/LessonsView').then(m => ({ default: m.LessonsView })));
const SocialMediaView = React.lazy(() => import('./components/SocialMediaView').then(m => ({ default: m.SocialMediaView })));
const AuthModal = React.lazy(() => import('./components/AuthModal').then(m => ({ default: m.AuthModal })));
const ShopModal = React.lazy(() => import('./components/ShopModal').then(m => ({ default: m.ShopModal })));
const ShopView = React.lazy(() => import('./components/ShopModal').then(m => ({ default: m.ShopView })));
const UserProfileModal = React.lazy(() => import('./components/UserProfileModal').then(m => ({ default: m.UserProfileModal })));
const DailyRewardModal = React.lazy(() => import('./components/DailyRewardModal').then(m => ({ default: m.DailyRewardModal })));
const PublicProfileView = React.lazy(() => import('./components/PublicProfileView').then(m => ({ default: m.PublicProfileView })));

const ViewLoadingFallback: React.FC = () => (
  <div className="min-h-[50vh] flex flex-col items-center justify-center p-8 space-y-4">
    <div className="w-10 h-10 border-3 border-purple-500/20 border-t-purple-500 rounded-full animate-spin" />
    <span className="text-xs font-bold text-purple-300 animate-pulse tracking-wider">YÜKLENİYOR...</span>
  </div>
);

const MainContent: React.FC = () => {
  const { view, setView, seriesList, showNsfw, isLoadingSeries } = useApp();
  const [popularTab, setPopularTab] = useState<'weekly' | 'monthly' | 'yearly'>('weekly');
  const [visibleComicCount, setVisibleComicCount] = useState(12);
  const novelScrollRef = useRef<HTMLDivElement>(null);

  const scrollNovelRow = (direction: 'left' | 'right') => {
    if (novelScrollRef.current) {
      const amount = direction === 'left' ? -320 : 320;
      novelScrollRef.current.scrollBy({ left: amount, behavior: 'smooth' });
    }
  };

  // Filter series based on NSFW preference
  const visibleSeriesList = useMemo(() => {
    return showNsfw ? seriesList : seriesList.filter(s => !isSeries18Plus(s));
  }, [seriesList, showNsfw]);

  // Home Page Feed sections - strictly sorted by latest chapter / release (newest first)
  const novelSeries = useMemo(() => {
    return sortSeriesByLatestRelease(visibleSeriesList.filter(s => s.type === 'Web Novel'));
  }, [visibleSeriesList]);

  const comicSeries = useMemo(() => {
    return sortSeriesByLatestRelease(visibleSeriesList.filter(s => s.type !== 'Web Novel'));
  }, [visibleSeriesList]);

  // Popular tabs mock data sorting
  const popularSeries = useMemo(() => {
    return [...visibleSeriesList].sort((a, b) => b.rating - a.rating);
  }, [visibleSeriesList]);

  if (view.type === 'series-detail') {
    return (
      <Suspense fallback={<ViewLoadingFallback />}>
        <SeriesDetail seriesId={view.seriesId} />
      </Suspense>
    );
  }

  if (view.type === 'reader') {
    const targetSeries = seriesList.find(s => s.id === view.seriesId);
    return (
      <Suspense fallback={<ViewLoadingFallback />}>
        {targetSeries?.type === 'Web Novel' ? (
          <NovelReader seriesId={view.seriesId} chapterId={view.chapterId} />
        ) : (
          <ManhwaReader seriesId={view.seriesId} chapterId={view.chapterId} />
        )}
      </Suspense>
    );
  }

  if (view.type === 'library') {
    return (
      <Suspense fallback={<ViewLoadingFallback />}>
        <LibraryView />
      </Suspense>
    );
  }

  if (view.type === 'public-profile') {
    return (
      <Suspense fallback={<ViewLoadingFallback />}>
        <PublicProfileView userId={view.userId} />
      </Suspense>
    );
  }

  if (view.type === 'profile') {
    return (
      <Suspense fallback={<ViewLoadingFallback />}>
        <UserProfileModal isOpen={true} onClose={() => setView({ type: 'home' })} initialTab={view.initialTab} />
      </Suspense>
    );
  }

  if (view.type === 'shop') {
    return (
      <Suspense fallback={<ViewLoadingFallback />}>
        <ShopView />
      </Suspense>
    );
  }

  if (view.type === 'categories') {
    return (
      <Suspense fallback={<ViewLoadingFallback />}>
        <CategoriesView initialGenre={view.genre} />
      </Suspense>
    );
  }

  if (view.type === 'advanced-search') {
    return (
      <Suspense fallback={<ViewLoadingFallback />}>
        <AdvancedSearchView />
      </Suspense>
    );
  }

  if (view.type === 'series-list') {
    return (
      <Suspense fallback={<ViewLoadingFallback />}>
        <SeriesListView />
      </Suspense>
    );
  }

  if (view.type === 'az-list') {
    return (
      <Suspense fallback={<ViewLoadingFallback />}>
        <AZListView />
      </Suspense>
    );
  }

  if (view.type === 'history') {
    return (
      <Suspense fallback={<ViewLoadingFallback />}>
        <HistoryView />
      </Suspense>
    );
  }

  if (view.type === 'schedule') {
    return (
      <Suspense fallback={<ViewLoadingFallback />}>
        <ScheduleView />
      </Suspense>
    );
  }

  if (view.type === 'request-board') {
    return (
      <Suspense fallback={<ViewLoadingFallback />}>
        <RequestBoardView />
      </Suspense>
    );
  }

  if (view.type === 'report') {
    return (
      <Suspense fallback={<ViewLoadingFallback />}>
        <ReportModal />
      </Suspense>
    );
  }

  if (view.type === 'request') {
    return (
      <Suspense fallback={<ViewLoadingFallback />}>
        <RequestModal />
      </Suspense>
    );
  }

  if (view.type === 'join-team') {
    return (
      <Suspense fallback={<ViewLoadingFallback />}>
        <JoinTeamModal />
      </Suspense>
    );
  }

  if (view.type === 'lessons') {
    return (
      <Suspense fallback={<ViewLoadingFallback />}>
        <LessonsView />
      </Suspense>
    );
  }

  if (view.type === 'social-media') {
    return (
      <Suspense fallback={<ViewLoadingFallback />}>
        <SocialMediaView />
      </Suspense>
    );
  }

  if (view.type === 'admin' || view.type === 'management') {
    return (
      <Suspense fallback={<ViewLoadingFallback />}>
        <ManagementPanel />
      </Suspense>
    );
  }

  if (view.type === 'notifications') {
    return (
      <Suspense fallback={<ViewLoadingFallback />}>
        <NotificationsView />
      </Suspense>
    );
  }

  // DEFAULT: Home View
  return (
    <div className="space-y-4 sm:space-y-6 md:space-y-8">
      {/* Hero Featured Slider */}
      <HeroSlider />

      {/* Announcement Banner */}
      <AnnouncementAlert />

      <div className="max-w-7xl mx-auto px-2.5 sm:px-4 space-y-6 sm:space-y-8">
        {/* 🔥 Bu Haftanın Sevilenleri Slider */}
        <WeeklyPopularSlider />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
        
        {/* Main Feed Column (2 Cols on Large Screens) */}
        <div className="lg:col-span-2 space-y-6 sm:space-y-8">
          
          {/* Section 1: Yeni Yüklenen Noveller (Sağa - Sola Kaydırılabilir) */}
          <section className="bg-gray-900/90 border border-purple-500/20 rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 shadow-xl relative">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-gray-800">
              <h2 className="text-sm sm:text-lg font-extrabold text-white flex items-center gap-1.5 sm:gap-2">
                <BookOpen className="text-purple-400" size={18} />
                Yeni Yüklenen Noveller
              </h2>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <div className="flex items-center gap-0.5 sm:gap-1 bg-gray-950 p-1 rounded-xl border border-purple-500/20">
                  <button
                    onClick={() => scrollNovelRow('left')}
                    className="p-1 rounded-lg text-purple-300 hover:text-white hover:bg-purple-900/60 transition"
                    title="Sola Kaydır"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    onClick={() => scrollNovelRow('right')}
                    className="p-1 rounded-lg text-purple-300 hover:text-white hover:bg-purple-900/60 transition"
                    title="Sağa Kaydır"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
                <button
                  onClick={() => setView({ type: 'categories', genre: 'Web Novel' })}
                  className="text-[11px] sm:text-xs font-bold text-purple-300 hover:text-white bg-purple-950/80 hover:bg-purple-900 border border-purple-800 px-2.5 py-1 rounded-xl transition flex items-center gap-0.5 sm:gap-1"
                >
                  Tümünü Gör
                  <ChevronRight size={13} />
                </button>
              </div>
            </div>

            <div
              ref={novelScrollRef}
              className="flex gap-3 sm:gap-4 overflow-x-auto no-scrollbar scroll-smooth snap-x pb-2 pt-1"
            >
              {isLoadingSeries ? (
                <NovelRowSkeleton count={5} />
              ) : novelSeries.length === 0 ? (
                <div className="w-full py-8 text-center text-xs text-gray-500">
                  Henüz roman eklenmedi.
                </div>
              ) : (
                novelSeries.map(s => (
                  <div key={s.id} className="flex-shrink-0 w-32 sm:w-44 snap-start">
                    <SeriesCard series={s} maxChapters={2} />
                  </div>
                ))
              )}
            </div>
          </section>

          {/* Section 2: Yeni Yüklenen Çizgi Roman / Manhwa Bölümleri (Orijinal Tasarım, Bilgisayarda 2'li Grid) */}
          <section className="bg-gray-900/90 border border-purple-500/20 rounded-2xl sm:rounded-3xl p-3 sm:p-5 shadow-xl">
            <div className="flex items-center justify-between pb-3 mb-3 sm:mb-4 border-b border-gray-800 gap-2">
              <h2 className="text-xs xs:text-sm sm:text-lg font-extrabold text-white flex items-center gap-1.5 sm:gap-2 min-w-0">
                <Sparkles className="text-purple-400 flex-shrink-0" size={17} />
                <span>Yeni Yüklenen Bölümler</span>
              </h2>
              <button
                onClick={() => setView({ type: 'series-list' })}
                className="text-[10px] xs:text-[11px] sm:text-xs font-bold text-purple-300 hover:text-white bg-purple-950/80 hover:bg-purple-900 border border-purple-800 px-2 sm:px-2.5 py-1 rounded-xl transition flex items-center gap-0.5 sm:gap-1 cursor-pointer whitespace-nowrap flex-shrink-0"
              >
                <span>Tümünü Gör</span>
                <ChevronRight size={13} />
              </button>
            </div>

            {/* Bilgisayarda (md ve lg ekranlarda) 2'li grid, mobilde tekli liste */}
            {isLoadingSeries ? (
               <ReleaseGridSkeleton count={6} />
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4">
                  {comicSeries.slice(0, visibleComicCount).map((s, idx) => (
                    <HorizontalReleaseCard key={s.id} series={s} maxChapters={4} index={idx} />
                  ))}
                </div>

                {comicSeries.length > visibleComicCount && (
                  <div className="pt-2 text-center">
                    <button
                      onClick={() => setVisibleComicCount(prev => prev + 12)}
                      className="w-full py-3 rounded-2xl bg-purple-950/60 hover:bg-purple-900/80 border border-purple-500/30 text-purple-200 hover:text-white font-bold text-xs sm:text-sm transition flex items-center justify-center gap-2 cursor-pointer shadow-lg active:scale-98"
                    >
                      <span>Daha Fazla Göster ({Math.min(visibleComicCount, comicSeries.length)} / {comicSeries.length})</span>
                      <ChevronRight size={15} />
                    </button>
                  </div>
                )}
              </div>
            )}
          </section>

        </div>

        {/* Sidebar Column (1 Col) */}
        <div className="space-y-6">
          
          {/* Discord Chibi Mascot Widget */}
          <DiscordWidget />

          {/* Popular Series Widget with Tabs (Haftalık, Aylık, Yıllık) */}
          <section className="bg-gray-900/90 border border-purple-500/20 rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                <TrendingUp className="text-amber-400" size={18} />
                En Çok Beğenilenler
              </h3>
            </div>

            {/* Popular Tabs */}
            <div className="flex bg-gray-950 p-1 rounded-xl border border-purple-500/20 text-xs font-bold">
              <button
                onClick={() => setPopularTab('weekly')}
                className={`flex-1 py-1.5 rounded-lg transition ${
                  popularTab === 'weekly' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                Haftalık
              </button>
              <button
                onClick={() => setPopularTab('monthly')}
                className={`flex-1 py-1.5 rounded-lg transition ${
                  popularTab === 'monthly' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                Aylık
              </button>
              <button
                onClick={() => setPopularTab('yearly')}
                className={`flex-1 py-1.5 rounded-lg transition ${
                  popularTab === 'yearly' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                Yıllık
              </button>
            </div>

            {/* Popular Items List */}
            <div className="space-y-3 pt-1">
              {popularSeries.slice(0, 5).map((s, idx) => (
                <div
                  key={s.id}
                  onClick={() => setView({ type: 'series-detail', seriesId: s.id })}
                  className="flex items-center gap-3 p-2 rounded-xl bg-gray-950/60 hover:bg-purple-950/40 border border-gray-800 hover:border-purple-500/30 cursor-pointer transition group"
                >
                  <span className="w-6 h-6 rounded-lg bg-purple-900/80 text-purple-200 font-black text-xs flex items-center justify-center flex-shrink-0">
                    {idx + 1}
                  </span>
                  <img
                    src={getOptimizedImageUrl(s.coverImage, { width: 80, height: 112, quality: 65 })}
                    alt={s.title}
                    width="40"
                    height="56"
                    loading="lazy"
                    decoding="async"
                    className="w-10 h-14 object-cover rounded-lg flex-shrink-0 border border-purple-500/20"
                  />
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs font-bold text-gray-200 group-hover:text-purple-300 truncate">
                      {s.title}
                    </h4>
                    <div className="flex items-center gap-2 mt-1 text-[10px] text-gray-400">
                      <span className="text-amber-400 font-bold">★ {s.rating}</span>
                      <span>• {s.type}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

          </section>

          {/* Ne Okusam? (Rastgele Seri) Widget */}
          <RandomSeriesWidget />

          {/* Popüler Türler & Kategoriler Widget */}
          <QuickCategoriesWidget />

          {/* Son Okuyucu Yorumları Widget */}
          <RecentCommentsWidget />

          {/* Fansub İstatistikleri Widget */}
          <SiteStatsWidget />

        </div>

      </div>
    </div>
    </div>
  );
};

const AppLayout: React.FC = () => {
  const { theme, view, isAuthModalOpen, closeAuthModal, authModalInitialTab, isDailyRewardOpen, closeDailyReward, publicProfileUserId, closePublicProfile } = useApp();
  return (
    <div className={`min-h-screen flex flex-col font-sans selection:bg-purple-600 selection:text-white overflow-x-hidden w-full max-w-full pb-20 md:pb-0 transition-colors duration-200 ${
      theme === 'light' ? 'bg-slate-100 text-slate-900' : 'bg-gray-950 text-gray-100'
    }`}>
      <SeoManager />
      <Header />
      <QuickNav />
      <main className="flex-1 w-full max-w-full overflow-hidden">
        <MainContent />
      </main>
      <Footer />
      <MobileBottomNav />
      <ScrollToTopBottom />
      
      <Suspense fallback={null}>
        {isAuthModalOpen && (
          <AuthModal
            isOpen={isAuthModalOpen}
            onClose={closeAuthModal}
            initialTab={authModalInitialTab}
          />
        )}
        {isDailyRewardOpen && (
          <DailyRewardModal
            isOpen={isDailyRewardOpen}
            onClose={closeDailyReward}
          />
        )}
        <ShopModal />
      </Suspense>
      
      <ToastNotification />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppLayout />
    </AppProvider>
  );
}
