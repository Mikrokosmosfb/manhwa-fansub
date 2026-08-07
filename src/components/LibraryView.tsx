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
  BookOpen
} from 'lucide-react';

export const LibraryView: React.FC = () => {
  const {
    seriesList,
    setView,
    bookmarks,
    bookmarkFolders,
    addBookmarkFolder,
    deleteBookmarkFolder,
    readingHistory,
    removeBookmark,
    exportBackupData,
    importBackupData
  } = useApp();

  const [activeFolder, setActiveFolder] = useState<string>('Okuyorum');
  const [searchQuery, setSearchQuery] = useState('');
  const [newFolderName, setNewFolderName] = useState('');
  const [isAddingFolder, setIsAddingFolder] = useState(false);

  // Filter bookmarked series in the current active folder
  const bookmarkedSeriesIds = Object.keys(bookmarks).filter(seriesId => {
    const item = bookmarks[seriesId];
    return item.folders.includes(activeFolder);
  });

  const bookmarkedSeries = seriesList.filter(s => bookmarkedSeriesIds.includes(s.id));

  const filteredSeries = bookmarkedSeries.filter(s =>
    s.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Library statistics
  const bookmarkItems = Object.values(bookmarks) as BookmarkItem[];
  const totalBookmarked = Object.keys(bookmarks).length;
  const readingCount = bookmarkItems.filter(b => b.folders.includes('Okuyorum')).length;
  const plannedCount = bookmarkItems.filter(b => b.folders.includes('Okuyacağım')).length;
  const finishedCount = bookmarkItems.filter(b => b.folders.includes('Bitirdim')).length;

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
        <div className="bg-gray-900/90 border border-purple-500/20 p-4 rounded-2xl text-center shadow">
          <span className="text-2xl font-extrabold text-purple-400 block">{totalBookmarked}</span>
          <span className="text-xs text-gray-400 font-semibold uppercase">Toplam Seri</span>
        </div>
        <div className="bg-gray-900/90 border border-purple-500/20 p-4 rounded-2xl text-center shadow">
          <span className="text-2xl font-extrabold text-emerald-400 block">{readingCount}</span>
          <span className="text-xs text-gray-400 font-semibold uppercase">Okuyorum</span>
        </div>
        <div className="bg-gray-900/90 border border-purple-500/20 p-4 rounded-2xl text-center shadow">
          <span className="text-2xl font-extrabold text-amber-400 block">{plannedCount}</span>
          <span className="text-xs text-gray-400 font-semibold uppercase">Okuyacağım</span>
        </div>
        <div className="bg-gray-900/90 border border-purple-500/20 p-4 rounded-2xl text-center shadow">
          <span className="text-2xl font-extrabold text-indigo-400 block">{finishedCount}</span>
          <span className="text-xs text-gray-400 font-semibold uppercase">Bitirdim</span>
        </div>
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
          {bookmarkFolders.map(folder => {
            const isActive = activeFolder === folder.name;
            const folderItemCount = (Object.values(bookmarks) as BookmarkItem[]).filter(b =>
              b.folders.includes(folder.name)
            ).length;

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
          <p className="text-base font-semibold">"{activeFolder}" klasöründe kayıtlı seri bulunmuyor.</p>
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
            const firstUnreadChapter = s.chapters.find(c => c.id !== history?.lastChapterId);

            return (
              <div
                key={s.id}
                className="bg-gray-900/90 border border-purple-500/20 rounded-2xl overflow-hidden shadow-lg flex flex-col group hover:border-purple-500/40 transition"
              >
                {/* Cover Image */}
                <div
                  onClick={() => setView({ type: 'series-detail', seriesId: s.id })}
                  className="relative aspect-[3/4] overflow-hidden cursor-pointer bg-gray-950"
                >
                  <img
                    src={s.coverImage}
                    alt={s.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  />

                  {/* Format tag */}
                  <span className="absolute bottom-2 right-2 text-[10px] font-bold bg-purple-700 text-white px-2 py-0.5 rounded shadow">
                    {s.type}
                  </span>

                  {/* Delete from library button */}
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      if (confirm(`"${s.title}" kütüphanenizden çıkarılsın mı?`)) {
                        removeBookmark(s.id);
                      }
                    }}
                    className="absolute top-2 right-2 bg-red-600/80 hover:bg-red-600 text-white p-1.5 rounded-full shadow transition"
                    title="Kütüphaneden Sil"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                {/* Info */}
                <div className="p-3 flex-1 flex flex-col justify-between space-y-2">
                  <h3
                    onClick={() => setView({ type: 'series-detail', seriesId: s.id })}
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
                        onClick={() =>
                          setView({
                            type: 'reader',
                            seriesId: s.id,
                            chapterId: history.lastChapterId
                          })
                        }
                        className="w-full bg-purple-700 hover:bg-purple-600 text-white text-[10px] font-bold py-1 rounded-lg flex items-center justify-center gap-1"
                      >
                        <BookOpen size={12} />
                        Okumaya Devam Et
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setView({ type: 'series-detail', seriesId: s.id })}
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
