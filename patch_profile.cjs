const fs = require('fs');
let code = fs.readFileSync('src/components/UserProfileModal.tsx', 'utf8');

// Add imports
code = code.replace(
  "import { ThemeBackgroundEffects } from './ThemeBackgroundEffects';",
  "import { ThemeBackgroundEffects } from './ThemeBackgroundEffects';\nimport { SeriesCard } from './SeriesCard';"
);

// Add followedSeriesIds and seriesList to useApp
code = code.replace(
  "    equipTheme,\n    equipBadge,\n    equipFrame,\n    setView,\n    earnPoints\n  } = useApp();",
  "    equipTheme,\n    equipBadge,\n    equipFrame,\n    setView,\n    earnPoints,\n    followedSeriesIds,\n    seriesList\n  } = useApp();"
);

// Update activeTab types
code = code.replace(
  "const [activeTab, setActiveTab] = useState<'profile' | 'wardrobe' | 'badges' | 'library'>(initialTab);",
  "const [activeTab, setActiveTab] = useState<'profile' | 'wardrobe' | 'badges' | 'library' | 'followed'>(initialTab);"
);

code = code.replace(
  "const handleTabChange = (tab: 'profile' | 'wardrobe' | 'badges' | 'library') => {",
  "const handleTabChange = (tab: 'profile' | 'wardrobe' | 'badges' | 'library' | 'followed') => {"
);

// Change the big button
const oldBigButton = `            <button
              type="button"
              onClick={() => handleTabChange(activeTab === 'wardrobe' ? 'profile' : 'wardrobe')}
              className="flex-1 h-12 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-sm rounded-2xl shadow-xl transition-all flex items-center justify-center gap-2 active:scale-98"
            >
              <Palette size={18} />
              <span>Kozmetik Gardırobu</span>
            </button>`;

const newBigButton = `            <button
              type="button"
              onClick={() => handleTabChange('followed')}
              className="flex-1 h-12 bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white font-bold text-sm rounded-2xl shadow-xl transition-all flex items-center justify-center gap-2 active:scale-98"
            >
              <Bookmark size={18} />
              <span>Takip Edilen Seriler</span>
            </button>`;

code = code.replace(oldBigButton, newBigButton);

// Add tab button
const badgesTabButton = `          <button
            type="button"
            onClick={() => handleTabChange('badges')}
            className={\`px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 \${
              activeTab === 'badges'
                ? 'bg-slate-800 text-white shadow-md border border-white/10'
                : 'text-gray-400 hover:text-gray-200 hover:bg-slate-800/50'
            }\`}
          >
            <Award size={15} /> Unvanlar
          </button>`;

const followedTabButton = `          <button
            type="button"
            onClick={() => handleTabChange('followed')}
            className={\`px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 \${
              activeTab === 'followed'
                ? 'bg-slate-800 text-white shadow-md border border-white/10'
                : 'text-gray-400 hover:text-gray-200 hover:bg-slate-800/50'
            }\`}
          >
            <Bookmark size={15} /> Takip Edilenler
          </button>`;

code = code.replace(badgesTabButton, badgesTabButton + '\n' + followedTabButton);

// Add tab contents
const followedSeriesListCode = `
  const followedSeries = seriesList ? seriesList.filter(s => followedSeriesIds.includes(s.id)) : [];
`;

code = code.replace("  const {", followedSeriesListCode + "\n  const {");

const followedTabContent = `
        {activeTab === 'followed' && (
          <div className="bg-slate-900/90 border border-white/10 rounded-3xl p-5 sm:p-7 shadow-xl">
            <div className="border-b border-white/10 pb-4 mb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Bookmark size={20} className="text-pink-400" />
                Takip Edilen Seriler
              </h3>
              <p className="text-xs text-gray-400 mt-1">
                Takip ettiğiniz serilere yeni bölümler eklendiğinde bildirim alırsınız.
              </p>
            </div>
            
            {followedSeries.length === 0 ? (
              <div className="text-center py-12">
                <Bookmark size={40} className="mx-auto text-gray-700 mb-3" />
                <p className="text-gray-400 font-semibold text-sm">Henüz hiçbir seriyi takip etmiyorsunuz.</p>
                <button
                  onClick={() => { setView({ type: 'series-list' }); onClose(); }}
                  className="mt-4 px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl transition shadow"
                >
                  Serileri Keşfet
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mt-2">
                {followedSeries.map(s => (
                  <SeriesCard key={s.id} series={s} maxChapters={1} />
                ))}
              </div>
            )}
          </div>
        )}
`;

code = code.replace("{activeTab === 'library' && (", followedTabContent + "\n        {activeTab === 'library' && (");

fs.writeFileSync('src/components/UserProfileModal.tsx', code);
console.log('Patched UserProfileModal.tsx');
