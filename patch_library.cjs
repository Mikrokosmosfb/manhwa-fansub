const fs = require('fs');
let code = fs.readFileSync('src/components/LibraryView.tsx', 'utf8');

// 1. Add `followedSeriesIds` to `useApp` destructuring
code = code.replace(
  `    importBackupData,\n    isFollowingSeries,\n    toggleFollowSeries,\n    openAuthModal\n  } = useApp();`,
  `    importBackupData,\n    isFollowingSeries,\n    toggleFollowSeries,\n    openAuthModal,\n    followedSeriesIds\n  } = useApp();`
);

// 2. Add `const followedCount = followedSeriesIds.length;`
code = code.replace(
  `  const readingCount = getFolderCount('Okuyorum');\n  const plannedCount = getFolderCount('Okuyacağım');\n  const finishedCount = getFolderCount('Bitirdim');`,
  `  const readingCount = getFolderCount('Okuyorum');\n  const plannedCount = getFolderCount('Okuyacağım');\n  const finishedCount = getFolderCount('Bitirdim');\n  const followedCount = followedSeriesIds.length;`
);

// 3. Update bookmarkedSeriesIds to handle 'Takip Edilenler'
const oldFiltering = `  // Filter bookmarked series in the current active folder
  const bookmarkedSeriesIds = Object.keys(bookmarks).filter(seriesId => {
    const item = bookmarks[seriesId];
    if (!item) return false;
    if (activeFolder === 'Tüm Seriler' || activeFolder === 'Tümü' || activeFolder === 'all') {
      return true;
    }
    if (!item.folders || !Array.isArray(item.folders)) return false;
    return item.folders.some(f => f.trim().toLowerCase() === activeFolder.trim().toLowerCase());
  });`;

const newFiltering = `  // Filter bookmarked series in the current active folder
  let bookmarkedSeriesIds: string[] = [];
  if (activeFolder === 'Takip Edilenler') {
    bookmarkedSeriesIds = followedSeriesIds;
  } else {
    bookmarkedSeriesIds = Object.keys(bookmarks).filter(seriesId => {
      const item = bookmarks[seriesId];
      if (!item) return false;
      if (activeFolder === 'Tüm Seriler' || activeFolder === 'Tümü' || activeFolder === 'all') {
        return true;
      }
      if (!item.folders || !Array.isArray(item.folders)) return false;
      return item.folders.some(f => f.trim().toLowerCase() === activeFolder.trim().toLowerCase());
    });
  }`;

code = code.replace(oldFiltering, newFiltering);

// 4. Update Stats Counter Cards grid 
code = code.replace(
  `      {/* Stats Counter Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">`,
  `      {/* Stats Counter Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">`
);

// 5. Add Takip Edilenler counter card right after "Tüm Seriler"
const tumSerilerCard = `        <button
          onClick={() => setActiveFolder('Tüm Seriler')}
          className={\`p-4 rounded-2xl text-center shadow transition border \${
            activeFolder === 'Tüm Seriler'
              ? 'bg-purple-950/90 border-purple-500 ring-2 ring-purple-500/40'
              : 'bg-gray-900/90 border-purple-500/20 hover:border-purple-500/40'
          }\`}
        >
          <span className="text-2xl font-extrabold text-purple-400 block">{totalBookmarked}</span>
          <span className="text-xs text-gray-300 font-semibold uppercase">Toplam Seri</span>
        </button>`;

const followedCard = `        <button
          onClick={() => setActiveFolder('Takip Edilenler')}
          className={\`p-4 rounded-2xl text-center shadow transition border \${
            activeFolder === 'Takip Edilenler'
              ? 'bg-pink-950/90 border-pink-500 ring-2 ring-pink-500/40'
              : 'bg-gray-900/90 border-purple-500/20 hover:border-pink-500/40'
          }\`}
        >
          <span className="text-2xl font-extrabold text-pink-400 block">{followedCount}</span>
          <span className="text-xs text-gray-300 font-semibold uppercase">Takipte</span>
        </button>`;

code = code.replace(tumSerilerCard, tumSerilerCard + '\\n' + followedCard);

// 6. Add "Takip Edilenler" tab next to "Tüm Seriler"
const tumSerilerTab = `          {/* ALL SERIES TAB */}
          <button
            onClick={() => setActiveFolder('Tüm Seriler')}
            className={\`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 whitespace-nowrap transition \${
              activeFolder === 'Tüm Seriler'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                : 'bg-gray-950 text-gray-300 hover:bg-purple-950/60 border border-gray-800'
            }\`}
          >
            <BookOpen size={15} />
            <span>Tüm Seriler</span>
            <span className="bg-black/40 text-purple-200 px-1.5 py-0.5 rounded-full text-[10px]">
              {totalBookmarked}
            </span>
          </button>`;

const followedTab = `          {/* FOLLOWED SERIES TAB */}
          <button
            onClick={() => setActiveFolder('Takip Edilenler')}
            className={\`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 whitespace-nowrap transition \${
              activeFolder === 'Takip Edilenler'
                ? 'bg-pink-600 text-white shadow-lg shadow-pink-600/30'
                : 'bg-gray-950 text-gray-300 hover:bg-purple-950/60 border border-gray-800'
            }\`}
          >
            <Bell size={15} />
            <span>Takip Edilenler</span>
            <span className="bg-black/40 text-pink-200 px-1.5 py-0.5 rounded-full text-[10px]">
              {followedCount}
            </span>
          </button>`;

code = code.replace(tumSerilerTab, tumSerilerTab + '\\n' + followedTab);

fs.writeFileSync('src/components/LibraryView.tsx', code);
console.log("Patched LibraryView.tsx");
