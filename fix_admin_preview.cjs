const fs = require('fs');

let code = fs.readFileSync('src/components/AdminModal.tsx', 'utf8');

const oldHeader = `{/* Profile User Info Header */}
                    <div className="relative z-10 w-full flex flex-col items-center text-center">
                      <div className={\`w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden flex items-center justify-center bg-slate-950 shadow-2xl \${editingThemeStyle.avatarBorderClass || 'border border-purple-400/30'}\`}>
                        <img src="https://api.dicebear.com/7.x/bottts/svg?seed=ProfilePreview" alt="Avatar" className="w-full h-full object-cover" />
                      </div>
                      <div className="mt-4 space-y-1 w-full">
                        <h2 className={\`text-xl sm:text-2xl font-black tracking-tight \${editingThemeStyle.nameClass || 'text-white'}\`}>
                          Yönetici Baş Okur
                        </h2>
                        <div className="flex items-center justify-center gap-1.5 mt-2">
                          <span className={\`px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest shadow-sm \${editingThemeStyle.badgeBgClass || 'bg-slate-800 text-slate-300'}\`}>
                            SEVİYE 50 • Efsane
                          </span>
                        </div>
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

code = code.replace(oldHeader, newHeader);

const oldContainer = 'className="relative min-h-[300px] sm:min-h-[380px] flex items-center justify-center p-6 sm:p-12 overflow-hidden rounded-3xl isolate border border-white/5 bg-gray-950 shadow-2xl mt-3"';
const newContainer = 'className="relative min-h-[400px] sm:min-h-[480px] flex items-center justify-center pt-16 sm:pt-24 pb-20 sm:pb-32 px-4 overflow-hidden rounded-3xl isolate border border-white/5 bg-gray-950 shadow-2xl mt-3"';

code = code.replace(oldContainer, newContainer);

fs.writeFileSync('src/components/AdminModal.tsx', code);
console.log("Patched AdminModal.tsx");

