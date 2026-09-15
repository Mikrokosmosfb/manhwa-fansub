const fs = require('fs');
let code = fs.readFileSync('src/components/AdminModal.tsx', 'utf8');

// Add missing icon imports
const importRegex = /\} from 'lucide-react';/;
if (!code.includes('AlertOctagon')) {
  code = code.replace(importRegex, '  AlertOctagon,\n  ThumbsUp,\n  ThumbsDown,\n  CornerDownRight\n} from \'lucide-react\';');
}

// 1. List Preview Replacement
const listPreviewStart = `<div className="relative rounded-xl overflow-hidden p-3 border border-gray-800 bg-gray-900 my-2 min-h-[100px] flex flex-col justify-end">`;
const listPreviewEnd = `</p>
                          </div>
                        </div>`;

const listStartIndex = code.indexOf(listPreviewStart);
const listEndIndex = code.indexOf(listPreviewEnd) + listPreviewEnd.length;

if (listStartIndex !== -1 && listEndIndex > listStartIndex) {
    const listReplacement = `<div
                          style={
                            style.cardBgImageUrl
                              ? {
                                  backgroundImage: \`url(\${style.cardBgImageUrl})\`,
                                  backgroundSize: 'cover',
                                  backgroundPosition: 'center'
                                }
                              : undefined
                          }
                          className={\`relative p-4 sm:p-5 flex flex-col gap-3 transition-colors rounded-2xl my-2 \${
                            style.cardBgImageUrl
                              ? 'bg-transparent overflow-hidden'
                              : 'bg-gray-900/90 border border-purple-500/20'
                          } \${style.cardClass || ''}\`}
                        >
                          {/* ANIMATED BACKGROUND EFFECT PREVIEW */}
                          <ThemeBackgroundEffects effectOverlay={style.effectOverlay} />

                          {/* Theme Decorations (Chibis/PNGs) */}
                          {style?.decorations?.map((dec, idx) => (
                            <img
                              key={dec.id || idx}
                              src={dec.imageUrl}
                              className="absolute pointer-events-none drop-shadow-lg"
                              style={{
                                top: dec.top || undefined,
                                bottom: dec.bottom || undefined,
                                left: dec.left || undefined,
                                right: dec.right || undefined,
                                width: dec.width || undefined,
                                transform: dec.rotation ? \`rotate(\${dec.rotation})\` : undefined,
                                zIndex: dec.zIndex !== undefined ? dec.zIndex : 20
                              }}
                              alt=""
                            />
                          ))}

                          {/* Symmetrical User Info Header */}
                          <div className="relative z-10 flex items-center justify-between gap-2.5">
                            <div className="flex items-center min-w-0 gap-2 sm:gap-3">
                              {/* Avatar Container in foreground */}
                              <div className="relative z-20 shrink-0">
                                <UserAvatar
                                  avatar="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
                                  name="Okuyucu"
                                  themeBorderClass={style?.avatarBorderClass}
                                  size="md"
                                />
                              </div>

                              {/* Name and Date Container */}
                              <div
                                className={\`min-w-0 \${
                                  style?.cardBgImageUrl
                                    ? 'bg-black/75 px-3 py-1 rounded-xl border border-white/10 shadow-sm z-10 inline-flex items-center'
                                    : 'pl-1'
                                }\`}
                              >
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className={\`font-bold text-xs sm:text-sm tracking-wide truncate \${
                                    style ? style.nameClass : 'text-gray-100'
                                  }\`}>
                                    Okuyucu Yorum Kartı
                                  </span>
                                  {style.themeType === 'photo' ? (
                                    <span className="text-[9px] bg-rose-500 text-white font-extrabold px-1.5 py-0.2 rounded">
                                      Görsel Fonlu
                                    </span>
                                  ) : (
                                    <span className="text-[9px] bg-amber-400 text-black font-extrabold px-1.5 py-0.2 rounded">
                                      Aura
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            
                            {/* Right Action buttons (Report / Delete) */}
                            <div className={\`flex items-center gap-1 shrink-0 \${
                              style?.cardBgImageUrl
                                ? 'bg-black/70 p-1 rounded-xl border border-white/10 shadow-sm'
                                : ''
                            }\`}>
                              <button type="button" className="text-gray-400 hover:text-amber-400 p-1.5 rounded-lg hover:bg-white/10 transition">
                                <AlertOctagon size={15} />
                              </button>
                            </div>
                          </div>

                          {/* Comment Text */}
                          <div className={\`relative z-10 \${
                            style?.cardBgImageUrl
                              ? 'bg-black/75 p-3 rounded-xl border border-white/10 shadow-md'
                              : ''
                          }\`}>
                            <div className="text-xs sm:text-sm text-gray-200 leading-relaxed whitespace-pre-wrap break-words break-all [overflow-wrap:anywhere]">
                              "Örnek yorum metni ve arka plan canlı önizlemesi."
                            </div>
                          </div>

                          {/* Action Bar (Likes / Dislikes / Reply) - Clean Symmetrical Footer */}
                          <div className={\`relative z-10 flex items-center justify-between \${
                            style?.cardBgImageUrl
                              ? 'pt-1'
                              : 'border-t border-white/10 pt-2.5'
                          } text-xs\`}>
                            <div className={\`flex items-center gap-3.5 \${
                              style?.cardBgImageUrl
                                ? 'bg-black/70 px-3 py-1.5 rounded-xl border border-white/10 shadow-sm'
                                : ''
                            }\`}>
                              <button type="button" className="flex items-center gap-1.5 font-semibold px-2 py-1 rounded-lg text-gray-400 hover:text-purple-300 transition">
                                <ThumbsUp size={14} />
                                <span>0</span>
                              </button>
                              <button type="button" className="flex items-center gap-1.5 font-semibold px-2 py-1 rounded-lg text-gray-400 hover:text-red-300 transition">
                                <ThumbsDown size={14} />
                                <span>0</span>
                              </button>
                              <button type="button" className="flex items-center gap-1.5 text-gray-400 hover:text-purple-300 font-semibold px-2 py-1 rounded-lg hover:bg-white/5 transition">
                                <CornerDownRight size={14} />
                                <span>Yanıtla</span>
                              </button>
                            </div>
                          </div>
                        </div>`;
    code = code.substring(0, listStartIndex) + listReplacement + code.substring(listEndIndex);
} else {
    console.error("List preview start/end not found");
}

// 2. Edit Preview Replacement
const editPreviewStart = `<div className="relative z-10 flex items-center justify-between gap-2">
                      <div className={\`flex items-center gap-2.5 w-fit \${
                        editingThemeStyle.cardBgImageUrl ? 'bg-black/75 px-3 py-1.5 rounded-xl border border-white/10 shadow-md' : ''
                      }\`}>
                        <img`;
const editPreviewEnd = `uygulandı. 🔥✨"
                    </p>`;

const editStartIndex = code.indexOf(editPreviewStart);
const editEndIndex = code.indexOf(editPreviewEnd) + editPreviewEnd.length;

if (editStartIndex !== -1 && editEndIndex > editStartIndex) {
    const editReplacement = `{/* Symmetrical User Info Header */}
                      <div className="relative z-10 flex items-center justify-between gap-2.5">
                        <div className="flex items-center min-w-0 gap-2 sm:gap-3">
                          {/* Avatar Container in foreground */}
                          <div className="relative z-20 shrink-0">
                            <UserAvatar
                              avatar="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
                              name="Admin Okuyucu"
                              themeBorderClass={editingThemeStyle?.avatarBorderClass}
                              size="md"
                            />
                          </div>

                          {/* Name and Date Container */}
                          <div
                            className={\`min-w-0 \${
                              editingThemeStyle?.cardBgImageUrl
                                ? 'bg-black/75 px-3 py-1 rounded-xl border border-white/10 shadow-sm z-10 inline-flex items-center'
                                : 'pl-1'
                            }\`}
                          >
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={\`font-bold text-xs sm:text-sm tracking-wide truncate \${
                                editingThemeStyle ? editingThemeStyle.nameClass : 'text-gray-100'
                              }\`}>
                                Admin Okuyucu
                              </span>
                              <span className="text-[9px] bg-amber-400 text-black font-extrabold px-1.5 py-0.2 rounded uppercase">
                                Yönetici
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        {/* Right Action buttons (Report / Delete) */}
                        <div className={\`flex items-center gap-1 shrink-0 \${
                          editingThemeStyle?.cardBgImageUrl
                            ? 'bg-black/70 p-1 rounded-xl border border-white/10 shadow-sm'
                            : ''
                        }\`}>
                          <button type="button" className="text-gray-400 hover:text-amber-400 p-1.5 rounded-lg hover:bg-white/10 transition">
                            <AlertOctagon size={15} />
                          </button>
                        </div>
                      </div>

                      {/* Comment Text */}
                      <div className={\`relative z-10 \${
                        editingThemeStyle?.cardBgImageUrl
                          ? 'bg-black/75 p-3 rounded-xl border border-white/10 shadow-md'
                          : ''
                      }\`}>
                        <div className="text-xs sm:text-sm text-gray-200 leading-relaxed whitespace-pre-wrap break-words break-all [overflow-wrap:anywhere]">
                          "Bu tema harika görünüyor! Arka plan resmi tam olarak istediğim gibi yorum kartına uygulandı. 🔥✨"
                        </div>
                      </div>

                      {/* Action Bar (Likes / Dislikes / Reply) - Clean Symmetrical Footer */}
                      <div className={\`relative z-10 flex items-center justify-between \${
                        editingThemeStyle?.cardBgImageUrl
                          ? 'pt-1'
                          : 'border-t border-white/10 pt-2.5'
                      } text-xs\`}>
                        <div className={\`flex items-center gap-3.5 \${
                          editingThemeStyle?.cardBgImageUrl
                            ? 'bg-black/70 px-3 py-1.5 rounded-xl border border-white/10 shadow-sm'
                            : ''
                        }\`}>
                          <button type="button" className="flex items-center gap-1.5 font-semibold px-2 py-1 rounded-lg text-gray-400 hover:text-purple-300 transition">
                            <ThumbsUp size={14} />
                            <span>0</span>
                          </button>
                          <button type="button" className="flex items-center gap-1.5 font-semibold px-2 py-1 rounded-lg text-gray-400 hover:text-red-300 transition">
                            <ThumbsDown size={14} />
                            <span>0</span>
                          </button>
                          <button type="button" className="flex items-center gap-1.5 text-gray-400 hover:text-purple-300 font-semibold px-2 py-1 rounded-lg hover:bg-white/5 transition">
                            <CornerDownRight size={14} />
                            <span>Yanıtla</span>
                          </button>
                        </div>
                      </div>`;
    code = code.substring(0, editStartIndex) + editReplacement + code.substring(editEndIndex);
} else {
    console.error("Edit preview start/end not found");
}

fs.writeFileSync('src/components/AdminModal.tsx', code);
console.log('Done replacing both previews');
