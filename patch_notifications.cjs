const fs = require('fs');
let code = fs.readFileSync('src/components/NotificationsView.tsx', 'utf8');

// 1. Add SeriesCard import
if (!code.includes("import { SeriesCard }")) {
  code = code.replace(
    "import { AppNotification } from '../types';",
    "import { AppNotification } from '../types';\nimport { SeriesCard } from './SeriesCard';"
  );
}

// 2. Add seriesList to useApp
code = code.replace(
  `    setView,\n    user\n  } = useApp();`,
  `    setView,\n    user,\n    seriesList\n  } = useApp();`
);

// 3. Update useState
code = code.replace(
  `useState<'all' | 'followed' | 'chapters' | 'system' | 'unread'>('all');`,
  `useState<'all' | 'followed' | 'followed-series' | 'chapters' | 'system' | 'unread'>('all');`
);

// 4. Add followedSeries calculations
const beforeReturn = `  const totalSystemNotifications = currentNotifications.filter(n => n.type !== 'chapter').length;`;
const followedSeriesLogic = `  const totalSystemNotifications = currentNotifications.filter(n => n.type !== 'chapter').length;\n\n  const followedSeries = seriesList.filter(s => followedSeriesIds.includes(s.id));\n  const filteredFollowedSeries = followedSeries.filter(s => s.title.toLowerCase().includes(searchQuery.toLowerCase()));`;
code = code.replace(beforeReturn, followedSeriesLogic);

// 5. Add Tab Button and rename 'followed' tab
const allTabBtn = `          <button
            onClick={() => setActiveTab('all')}
            className={\`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap \${
              activeTab === 'all'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-gray-400 hover:text-white hover:bg-purple-950/60'
            }\`}
          >
            <Layers size={14} />
            <span>Tüm Bildirimler ({currentNotifications.length})</span>
          </button>`;

const followedSeriesTabBtn = `          <button
            onClick={() => setActiveTab('followed-series')}
            className={\`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap \${
              activeTab === 'followed-series'
                ? 'bg-pink-600 text-white shadow-md'
                : 'text-pink-300 hover:text-white hover:bg-pink-950/60'
            }\`}
          >
            <Bookmark size={14} />
            <span>Takip Edilen Seriler ({followedSeries.length})</span>
          </button>`;

code = code.replace(allTabBtn, allTabBtn + '\n' + followedSeriesTabBtn);

// Rename 'Takip Ettiklerim' to 'Takip Bildirimleri'
code = code.replace(
  `<span>Takip Ettiklerim ({totalFollowedNotifications})</span>`,
  `<span>Takip Bildirimleri ({totalFollowedNotifications})</span>`
);

// 6. Handle activeTab === 'followed-series' in rendering
const gridStart = `      {/* Notifications Grid / List */}
      <div className="space-y-3">
        {filteredNotifications.length === 0 ? (`;

const newGridStart = `      {/* Notifications Grid / List */}
      <div className="space-y-3">
        {activeTab === 'followed-series' ? (
          filteredFollowedSeries.length === 0 ? (
            <div className="bg-gray-900/60 border border-purple-500/20 rounded-3xl p-12 text-center space-y-3">
              <div className="w-16 h-16 rounded-3xl bg-pink-950/80 border border-pink-500/40 flex items-center justify-center mx-auto text-pink-400 shadow-lg">
                <Bookmark size={28} />
              </div>
              <h3 className="text-base font-extrabold text-white">
                {searchQuery ? 'Aramanızla eşleşen takip edilen seri bulunamadı' : 'Takip ettiğiniz hiçbir seri bulunmuyor'}
              </h3>
              <p className="text-xs text-gray-400 max-w-md mx-auto">
                Serilerin detay sayfalarından serileri takip ederek yeni bölümlerden anında haberdar olabilirsiniz.
              </p>
              <div className="pt-2">
                <button
                  onClick={() => setView({ type: 'series-list' })}
                  className="bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs px-4 py-2 rounded-xl transition shadow"
                >
                  Serileri Keşfet
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 mt-2">
              {filteredFollowedSeries.map(s => (
                <SeriesCard key={s.id} series={s} maxChapters={1} />
              ))}
            </div>
          )
        ) : filteredNotifications.length === 0 ? (`;

code = code.replace(gridStart, newGridStart);

// We need to add an extra closing parenthesis at the end of the conditional logic
const endBraces = `              </div>
            </div>
          );
        }))}
      </div>`;

const newEndBraces = `              </div>
            </div>
          );
        }))}
      </div>`;
// Wait, I replaced `{filteredNotifications.length === 0 ? (` with `{activeTab === 'followed-series' ? ( ... ) : filteredNotifications.length === 0 ? (`
// So I need to add one more closing paren to the end: `})))}` instead of `}))}` because `filteredNotifications.map(...)` is inside `( filteredNotifications.map(...) )`.
// Let's check the existing end:
// `          );`
// `        }))}`
// Now it should be:
// `        })))}`

code = code.replace(
  `          );\n        }))}\n      </div>`,
  `          );\n        })))} \n      </div>` // Added one closing paren for the new ternary operator
);

fs.writeFileSync('src/components/NotificationsView.tsx', code);
console.log('Patched NotificationsView.tsx');
