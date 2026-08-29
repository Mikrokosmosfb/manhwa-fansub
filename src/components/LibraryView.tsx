import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { BookmarkItem } from '../types';
import {
  Bookmark,
  Search,
  Plus,
  Trash2,
  Folder,
  Download,
  Upload,
  Clock,
  ExternalLink,
  BookOpen,
  Bell,
  BellRing
} from 'lucide-react';
import { DiagonalStatusRibbon } from './DiagonalStatusRibbon';
import { getOptimizedImageUrl } from '../utils/imageUtils';

interface LibraryViewProps {
  onCloseModal?: () => void;
}

export const LibraryView: React.FC<LibraryViewProps> = ({ onCloseModal }) => {
  const {
    user,
    seriesList,
    setView,
    bookmarks,
    bookmarkFolders,
    addBookmarkFolder,
    deleteBookmarkFolder,
    readingHistory,
    removeBookmark,
    exportBackupData,
    importBackupData,
    isFollowingSeries,
    toggleFollowSeries,
    openAuthModal
  } = useApp();

  const handleNavigateSeries = (seriesId: string) => {
    setView({ type: 'series-detail', seriesId });
    if (onCloseModal) onCloseModal();
  };

  const handleNavigateReader = (seriesId: string, chapterId: string) => {
    setView({ type: 'reader', seriesId, chapterId });
    if (onCloseModal) onCloseModal();
  };

  const [activeFolder, setActiveFolder] = useState<string>('Tüm Seriler');
  const [searchQuery, setSearchQuery] = useState('');
  const [newFolderName, setNewFolderName] = useState('');
  const [isAddingFolder, setIsAddingFolder] = useState(false);

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 animate-fadeIn">
        <div className="bg-gradient-to-b from-purple-950/80 via-gray-900/90 to-gray-950 border border-purple-500/30 rounded-3xl p-6 sm:p-10 shadow-2xl text-center space-y-6 relative overflow-hidden">
          <div className="w-20 h-20 mx-auto rounded-3xl bg-purple-900/50 border border-purple-400/40 flex items-center justify-center text-purple-300 shadow-xl shadow-purple-950/80">
            <Bookmark size={36} className="text-purple-300 fill-purple-400/30" />
          </div>

          <div className="space-y-2 max-w-md mx-auto">
            <h2 className="text-2xl font-black text-white">Kütüphaneniz İçin Giriş Yapın</h2>
            <p className="text-sm text-purple-200/80 leading-relaxed">
              Kütüphane, yer imleri, özel okuma klasörleri oluşturma ve serileri takip etme özellikleri kayıtlı üyelere özeldir.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-2xl mx-auto text-left pt-2">
            <div className="p-4 rounded-2xl bg-black/40 border border-purple-500/20 space-y-1">
              <div className="text-purple-400 font-black text-xs flex items-center gap-1.5">
                <Bookmark size={16} /> Yer İmleri & Klasörler
              </div>
              <p className="text-[11px] text-gray-400">Okuduğunuz serileri 'Okuyorum', 'Bitirdim' veya özel klasörlerde düzenleyin.</p>
            </div>
            <div className="p-4 rounded-2xl bg-black/40 border border-purple-500/20 space-y-1">
              <div className="text-amber-400 font-black text-xs flex items-center gap-1.5">
                <BellRing size={16} /> Yeni Bölüm Bildirimleri
              </div>
              <p className="text-[11px] text-gray-400">Takip ettiğiniz serilere yeni bölüm geldiğinde anında haberiniz olsun.</p>
            </div>
            <div className="p-4 rounded-2xl bg-black/40 border border-purple-500/20 space-y-1">
              <div className="text-emerald-400 font-black text-xs flex items-center gap-1.5">
                <Clock size={16} /> Otomatik İlerleme Senkronu
              </div>
              <p className="text-[11px] text-gray-400">Tüm cihazlarınızda kaldığınız sayfa ve bölümden devam edin.</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
            <button
              onClick={() => openAuthModal('login')}
              className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold rounded-2xl text-sm shadow-xl shadow-purple-950/60 transition active:scale-95 border border-purple-400/40"
            >
              Giriş Yap
            </button>
            <button
              onClick={() => openAuthModal('register')}
              className="w-full sm:w-auto px-8 py-3 bg-gray-900 hover:bg-gray-800 text-purple-200 hover:text-white font-bold rounded-2xl text-sm border border-purple-500/30 transition active:scale-95"
            >
              Ücretsiz Kayıt Ol
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Library statistics
  const bookmarkItems = Object.values(bookmarks) as BookmarkItem[];
  const totalBookmarked = Object.keys(bookmarks).length;

  const getFolderCount = (folderName: string) => {
    if (folderName === 'Tüm Seriler' || folderName === 'Tümü' || folderName === 'all') {
      return totalBookmarked;
    }
    return bookmarkItems.filter(b =>
      b.folders && Array.isArray(b.folders) && b.folders.some(f => f.trim().toLowerCase() === folderName.trim().toLowerCase())
    ).length;
  };

  const readingCount = getFolderCount('Okuyorum');
  const plannedCount = getFolderCount('Okuyacağım');
  const finishedCount = getFolderCount('Bitirdim');

  // Filter bookmarked series in the current active folder
  const bookmarkedSeriesIds = Object.keys(bookmarks).filter(seriesId => {
    const item = bookmarks[seriesId];
    if (!item) return false;
    if (activeFolder === 'Tüm Seriler' || activeFolder === 'Tümü' || activeFolder === 'all') {
      return true;
    }
    if (!item.folders || !Array.isArray(item.folders)) return false;
    return item.folders.some(f => f.trim().toLowerCase() === activeFolder.trim().toLowerCase());
  });

  const bookmarkedSeries = seriesList.filter(s =>
    bookmarkedSeriesIds.some(id => String(id) === String(s.id))
  );

  const filteredSeries = bookmarkedSeries.filter(s =>
    s.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateFolder = (e: React.FormEvent) => {
    e.preventDefault();
    if (newFolderName.trim()) {
      addBookmarkFolder(newFolderName.trim());
      setActiveFolder(newFolderName.trim());
      setNewFolderName('');
      setIsAddingFolder(false);
    }
  };

  const handleFileRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = ev => {
        const text = ev.target?.result as string;
        if (text) {
          const success = importBackupData(text);
          if (success) {
            alert('Kütüphane yedeği başarıyla yüklendi!');
          } else {
            alert('Yedek dosyası okunurken bir hata oluştu.');
          }
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-3">
            <Bookmark className="text-purple-400 fill-current" size={28} />
            Kütüphanem
          </h1>
          <p className="text-xs sm:text-sm text-gray-400 mt-1">
            Kaydettiğiniz seriler, okuma klasörleriniz ve geçmişiniz.
          </p>
        </div>

        {/* Backup / Restore Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={exportBackupData}
            className="bg-purple-900/80 hover:bg-purple-800 border border-purple-500/40 text-purple-200 text-xs font-semibold px-3 py-2 rounded-xl flex items-center gap-1.5 transition"
            title="Kütüphane Verilerini JSON İndir"
          >
            <Download size={15} />
            Yedekle
          </button>

          <label className="bg-indigo-900/80 hover:bg-indigo-800 border border-indigo-500/40 text-indigo-200 text-xs font-semibold px-3 py-2 rounded-xl flex items-center gap-1.5 cursor-pointer transition">
            <Upload size={15} />
            Yedeği Yükle
            <input type="file" accept=".json" onChange={handleFileRestore} className="hidden" />
          </label>
        </div>
      </div>

      {/* Stats Counter Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <button
          onClick={() => setActiveFolder('Tüm Seriler')}
          className={`p-4 rounded-2xl text-center shadow transition border ${
            activeFolder === 'Tüm Seriler'
              ? 'bg-purple-950/90 border-purple-500 ring-2 ring-purple-500/40'
              : 'bg-gray-900/90 border-purple-500/20 hover:border-purple-500/40'
          }`}
        >
          <span className="text-2xl font-extrabold text-purple-400 block">{totalBookmarked}</span>
          <span className="text-xs text-gray-300 font-semibold uppercase">Toplam Seri</span>
        </button>

        <button
          onClick={() => setActiveFolder('Okuyorum')}
          className={`p-4 rounded-2xl text-center shadow transition border ${
            activeFolder === 'Okuyorum'
              ? 'bg-emerald-950/90 border-emerald-500 ring-2 ring-emerald-500/40'
              : 'bg-gray-900/90 border-purple-500/20 hover:border-emerald-500/40'
          }`}
        >
          <span className="text-2xl font-extrabold text-emerald-400 block">{readingCount}</span>
          <span className="text-xs text-gray-300 font-semibold uppercase">Okuyorum</span>
        </button>

        <button
          onClick={() => setActiveFolder('Okuyacağım')}
          className={`p-4 rounded-2xl text-center shadow transition border ${
            activeFolder === 'Okuyacağım'
              ? 'bg-amber-950/90 border-amber-500 ring-2 ring-amber-500/40'
              : 'bg-gray-900/90 border-purple-500/20 hover:border-amber-500/40'
          }`}
        >
          <span className="text-2xl font-extrabold text-amber-400 block">{plannedCount}</span>
          <span className="text-xs text-gray-300 font-semibold uppercase">Okuyacağım</span>
        </button>

        <button
          onClick={() => setActiveFolder('Bitirdim')}
          className={`p-4 rounded-2xl text-center shadow transition border ${
            activeFolder === 'Bitirdim'
              ? 'bg-indigo-950/90 border-indigo-500 ring-2 ring-indigo-500/40'
              : 'bg-gray-900/90 border-purple-500/20 hover:border-indigo-500/40'
          }`}
        >
          <span className="text-2xl font-extrabold text-indigo-400 block">{finishedCount}</span>
          <span className="text-xs text-gray-300 font-semibold uppercase">Bitirdim</span>
        </button>
      </div>

      {/* Library In-Search Bar */}
      <div className="relative mb-6">
        <input
          type="text"
          placeholder="Kütüphanedeki serilerde ara..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full bg-gray-900 border border-purple-500/30 text-white placeholder-gray-500 text-xs sm:text-sm rounded-2xl pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-400 shadow-md"
        />
        <Search size={18} className="absolute left-3.5 top-3.5 text-gray-400" />
      </div>

      {/* Folder Tabs & Create Folder Button */}
      <div className="bg-gray-900/90 border border-purple-500/20 rounded-2xl p-3 mb-6 shadow-md">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {/* ALL SERIES TAB */}
          <button
            onClick={() => setActiveFolder('Tüm Seriler')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 whitespace-nowrap transition ${
              activeFolder === 'Tüm Seriler'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                : 'bg-gray-950 text-gray-300 hover:bg-purple-950/60 border border-gray-800'
            }`}
          >
            <BookOpen size={15} />
            <span>Tüm Seriler</span>
            <span className="bg-black/40 text-purple-200 px-1.5 py-0.5 rounded-full text-[10px]">
              {totalBookmarked}
            </span>
          </button>

          {/* DYNAMIC FOLDERS */}
          {bookmarkFolders.map(folder => {
            const isActive = activeFolder === folder.name;
            const folderItemCount = getFolderCount(folder.name);

            return (
              <button
                key={folder.id}
                onClick={() => setActiveFolder(folder.name)}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 whitespace-nowrap transition ${
                  isActive
                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                    : 'bg-gray-950 text-gray-300 hover:bg-purple-950/60 border border-gray-800'
                }`}
              >
                <Folder size={15} />
                <span>{folder.name}</span>
                <span className="bg-black/30 text-purple-200 px-1.5 py-0.5 rounded-full text-[10px]">
                  {folderItemCount}
                </span>
              </button>
            );
          })}

          {/* Add custom folder toggle button */}
          <button
            onClick={() => setIsAddingFolder(!isAddingFolder)}
            className="px-3 py-2 rounded-xl text-xs font-bold bg-purple-950/60 hover:bg-purple-900 border border-purple-500/30 text-purple-300 flex items-center gap-1 whitespace-nowrap transition"
          >
            <Plus size={15} />
            Yeni Klasör
          </button>
        </div>

        {/* Add folder inline form */}
        {isAddingFolder && (
          <form onSubmit={handleCreateFolder} className="flex gap-2 mt-3 pt-3 border-t border-gray-800">
            <input
              type="text"
              placeholder="Yeni klasör adı..."
              value={newFolderName}
              onChange={e => setNewFolderName(e.target.value)}
              className="flex-1 bg-gray-950 border border-purple-500/30 text-white placeholder-gray-500 text-xs rounded-xl px-3 py-2 focus:outline-none"
            />
            <button
              type="submit"
              className="bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs px-4 py-2 rounded-xl"
            >
              Ekle
            </button>
          </form>
        )}
      </div>

      {/* Series Grid in Active Folder */}
      {filteredSeries.length === 0 ? (
        <div className="bg-gray-900/60 border border-purple-500/20 rounded-3xl p-12 text-center text-gray-400">
          <Bookmark size={40} className="mx-auto mb-3 text-purple-400/50" />
          <p className="text-base font-semibold">
            {activeFolder === 'Tüm Seriler'
              ? 'Kütüphanenizde henüz kayıtlı seri bulunmuyor.'
              : `"${activeFolder}" klasöründe kayıtlı seri bulunmuyor.`}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Anasayfadan veya seriler sayfasından serileri kütüphanenize ekleyebilirsiniz.
          </p>
          <button
            onClick={() => setView({ type: 'series-list' })}
            className="mt-4 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs px-6 py-2.5 rounded-full shadow"
          >
            Serilere Göz At
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filteredSeries.map(s => {
            const history = readingHistory[s.id];
            const isRead = (chId: string) => Boolean(history?.readChapterIds?.includes(chId));
            const firstUnreadChapter = s.chapters.find(c => !isRead(c.id));

            return (
              <div
                key={s.id}
                className="bg-gray-900/90 border border-purple-500/20 rounded-2xl overflow-hidden shadow-lg flex flex-col group hover:border-purple-500/40 transition"
              >
                {/* Cover Image */}
                <div
                  onClick={() => handleNavigateSeries(s.id)}
                  className="relative aspect-[3/4] overflow-hidden cursor-pointer bg-gray-950"
                >
                  <DiagonalStatusRibbon status={s.status} size="md" />

                  <img
                    src={getOptimizedImageUrl(s.coverImage, { width: 300, height: 400, quality: 75 })}
                    alt={s.title}
                    width="200"
                    height="267"
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  />

                  {/* Format tag */}
                  <span className="absolute bottom-2 right-2 text-[10px] font-bold bg-purple-700 text-white px-2 py-0.5 rounded shadow">
                    {s.type}
                  </span>

                  {/* Action buttons on card cover */}
                  <div className="absolute top-2 right-2 flex items-center gap-1.5 z-10">
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        toggleFollowSeries(s.id);
                      }}
                      className={`p-1.5 rounded-full shadow backdrop-blur-sm transition ${
                        isFollowingSeries(s.id)
                          ? 'bg-emerald-600/90 text-white hover:bg-emerald-500'
                          : 'bg-black/60 text-gray-300 hover:text-white hover:bg-black/80'
                      }`}
                      title={isFollowingSeries(s.id) ? 'Takip Ediliyor (Bildirimler Açık)' : 'Takip Et (Bildirimleri Aç)'}
                    >
                      {isFollowingSeries(s.id) ? (
                        <BellRing size={13} className="text-white animate-pulse" />
                      ) : (
                        <Bell size={13} />
                      )}
                    </button>

                    {/* Delete from library button */}
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        if (confirm(`"${s.title}" kütüphanenizden çıkarılsın mı?`)) {
                          removeBookmark(s.id);
                        }
                      }}
                      className="bg-red-600/80 hover:bg-red-600 text-white p-1.5 rounded-full shadow transition"
                      title="Kütüphaneden Sil"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                {/* Info */}
                <div className="p-3 flex-1 flex flex-col justify-between space-y-2">
                  <h3
                    onClick={() => handleNavigateSeries(s.id)}
                    className="text-xs font-bold text-white line-clamp-2 hover:text-purple-300 cursor-pointer transition"
                  >
                    {s.title}
                  </h3>

                  {/* Reading progress */}
                  {history ? (
                    <div className="bg-purple-950/60 border border-purple-800/40 p-2 rounded-xl text-[11px] text-purple-200 space-y-1">
                      <div className="flex items-center gap-1 font-semibold truncate">
                        <Clock size={12} className="text-purple-400 flex-shrink-0" />
                        <span className="truncate">Kaldığın Yer: {history.lastChapterTitle}</span>
                      </div>
                      <button
                        onClick={() => handleNavigateReader(s.id, history.lastChapterId)}
                        className="w-full bg-purple-700 hover:bg-purple-600 text-white text-[10px] font-bold py-1 rounded-lg flex items-center justify-center gap-1"
                      >
                        <BookOpen size={12} />
                        Okumaya Devam Et
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleNavigateSeries(s.id)}
                      className="w-full bg-gray-800 hover:bg-purple-800 text-gray-200 hover:text-white text-[11px] font-bold py-1.5 rounded-xl transition"
                    >
                      Bölümlere Git
                    </button>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
