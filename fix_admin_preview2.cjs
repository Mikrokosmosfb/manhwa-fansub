const fs = require('fs');
let code = fs.readFileSync('src/components/AdminModal.tsx', 'utf8');

const oldHeader = `{/* Profile User Info Header */}
                    <div className="relative z-10 w-full flex flex-col items-center text-center pb-8 pt-4">
                      <div className="relative">
                        <UserAvatar
                          avatar="https://api.dicebear.com/7.x/bottts/svg?seed=ProfilePreview"
                          name="Admin Okuyucu"
                          themeBorderClass={editingThemeStyle?.avatarBorderClass}
                          size="xl"
                        />
                      </div>
                      
                      <div className="mt-5 space-y-1.5 w-full">
                        <h2 className={\`text-2xl sm:text-3xl md:text-4xl font-black tracking-tight \${editingThemeStyle.nameClass || 'text-white'}\`}>
                          Admin Okuyucu
                        </h2>
                        <div className="flex items-center justify-center gap-1.5 sm:gap-2 mt-1 sm:mt-2 text-sm">
                          <span className="text-gray-400 font-medium">
                            Yönetici
                          </span>
                          <span className="text-gray-600">•</span>
                          <span className="text-gray-500 text-xs sm:text-sm truncate">admin@mikrokosmos.com</span>
                        </div>
                      </div>

                      {/* Theme Indicator Badge */}
                      <div className="mt-4">
                        <span className={\`inline-flex items-center gap-1.5 px-3 py-1 sm:px-4 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-widest shadow-lg border border-white/10 \${
                          editingThemeStyle.badgeBgClass || 'bg-slate-800 text-slate-300'
                        }\`}>
                          <Palette size={12} className="opacity-70" />
                          {editingThemeStyle.name || 'Tema Adı'}
                        </span>
                      </div>
                    </div>`;

const newHeader = `{/* Profile User Info Header */}
                    <div className="relative z-10 w-full flex flex-col items-center text-center pb-8 pt-4">
                      <div className="relative">
                        <UserAvatar
                          avatar="https://api.dicebear.com/7.x/bottts/svg?seed=ProfilePreview"
                          name="Admin Okuyucu"
                          themeBorderClass={editingThemeStyle?.avatarBorderClass}
                          size="xl"
                          className="transition-transform duration-500 hover:scale-105 shadow-2xl"
                        />
                      </div>
                      
                      <div className="mt-5 space-y-1.5 w-full">
                        <h2 className={\`text-2xl sm:text-3xl font-black tracking-tight \${
                            editingThemeStyle ? editingThemeStyle.nameClass : 'text-white'
                          }\`}>
                          Admin Okuyucu
                        </h2>
                        
                        <p className="text-xs sm:text-sm text-gray-400 font-medium flex items-center justify-center gap-2">
                          <span className="text-purple-300 font-bold">Yönetici</span>
                          <span>•</span>
                          <span className="font-mono bg-white/5 border border-white/10 px-2 py-0.5 rounded-md text-[11px] sm:text-xs text-gray-300">admin@mikrokosmos.com</span>
                        </p>
                      </div>

                      {/* Badges Flow */}
                      <div className="flex items-center justify-center gap-2 flex-wrap mt-5 max-w-2xl">
                        <div className="inline-flex items-center gap-1.5 bg-purple-500/20 border border-purple-500/30 px-3 py-1 rounded-full text-xs font-bold text-purple-200 backdrop-blur-sm shadow-sm">
                          <Palette size={13} className={editingThemeStyle.accentText || 'text-purple-400'} />
                          <span>{editingThemeStyle.name || 'Tema Adı'}</span>
                        </div>
                      </div>
                    </div>`;

if (code.includes(oldHeader)) {
  code = code.replace(oldHeader, newHeader);
  fs.writeFileSync('src/components/AdminModal.tsx', code);
  console.log("Patched AdminModal.tsx");
} else {
  console.log("Target not found! Attempting alternative regex approach.");
}

