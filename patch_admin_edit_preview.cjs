const fs = require('fs');
let code = fs.readFileSync('src/components/AdminModal.tsx', 'utf8');

const startStr = `<div className="relative z-10 flex items-center justify-between gap-2">
                      <div className={\`flex items-center gap-2.5 w-fit \${
                        editingThemeStyle.cardBgImageUrl ? 'bg-black/75 px-3 py-1.5 rounded-xl border border-white/10 shadow-md' : ''
                      }\`}>
                        <img`;
const endStr = `</p>
                    </div>`;

const startIndex = code.indexOf(startStr);
const endIndex = code.indexOf(endStr) + endStr.length;

if (startIndex !== -1 && endIndex !== -1) {
    const newCode = `{/* Symmetrical User Info Header */}
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
                          "Bu tema harika! Yorumlarım artık çok daha tarz duruyor. ✨"
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

    const oldContent = code.substring(startIndex, endIndex);
    code = code.replace(oldContent, newCode);
    
    fs.writeFileSync('src/components/AdminModal.tsx', code);
    console.log("Patched AdminModal edit preview successfully");
} else {
    console.log("Could not find start or end index for replacing edit preview");
}
