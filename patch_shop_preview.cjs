const fs = require('fs');
let code = fs.readFileSync('src/components/ShopModal.tsx', 'utf8');

const startStr = `<div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider flex items-center justify-between">`;
const endStr = `</div>\n                  </div>\n                )}\n\n                {/* ACTION BUTTONS */}`;

const startIndex = code.indexOf(startStr);
const endIndex = code.indexOf(endStr);

if (startIndex !== -1 && endIndex !== -1) {
    const newPreviewCode = `<div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider flex items-center justify-between mb-2">
                      <span>Canlı Yorum Kartı Önizlemesi</span>
                      <span className="text-amber-400 font-extrabold">Görünüm Örneği</span>
                    </div>
                    
                    <div
                      style={
                        themeStyle.cardBgImageUrl
                          ? {
                              backgroundImage: \`url(\${themeStyle.cardBgImageUrl})\`,
                              backgroundSize: 'cover',
                              backgroundPosition: 'center'
                            }
                          : undefined
                      }
                      className={\`relative p-4 sm:p-5 flex flex-col gap-3 transition-colors rounded-2xl \${
                        themeStyle.cardBgImageUrl
                          ? 'bg-transparent overflow-hidden'
                          : 'bg-gray-900/90 border border-purple-500/20'
                      } \${themeStyle.cardClass || ''}\`}
                    >
                      {/* ANIMATED BACKGROUND EFFECT PREVIEW */}
                      <ThemeBackgroundEffects effectOverlay={themeStyle.effectOverlay} />

                      {/* Theme Decorations (Chibis/PNGs) */}
                      {themeStyle?.decorations?.map((dec, idx) => (
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
                              avatar={user?.avatar}
                              name={user?.name || 'Okuyucu'}
                              frameId={equippedFrame}
                              themeBorderClass={themeStyle?.avatarBorderClass}
                              size="md"
                            />
                          </div>

                          {/* Name and Date Container */}
                          <div
                            className={\`min-w-0 \${
                              themeStyle?.cardBgImageUrl
                                ? 'bg-black/75 px-3 py-1 rounded-xl border border-white/10 shadow-sm z-10 inline-flex items-center'
                                : 'pl-1'
                            }\`}
                          >
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={\`font-bold text-xs sm:text-sm tracking-wide truncate \${
                                themeStyle ? themeStyle.nameClass : 'text-gray-100'
                              }\`}>
                                {user?.name || 'Okuyucu'}
                              </span>
                              <span className="text-[10px] text-gray-400 shrink-0">Az önce</span>
                            </div>
                          </div>
                        </div>
                        
                        {/* Right Action buttons (Report / Delete) */}
                        <div className={\`flex items-center gap-1 shrink-0 \${
                          themeStyle?.cardBgImageUrl
                            ? 'bg-black/70 p-1 rounded-xl border border-white/10 shadow-sm'
                            : ''
                        }\`}>
                          <button type="button" className="text-gray-400 hover:text-amber-400 p-1.5 rounded-lg hover:bg-white/10 transition">
                            <AlertOctagon size={15} />
                          </button>
                        </div>
                      </div>

                      {/* VIP Titles / Badges */}
                      {equippedBadges.length > 0 && (
                        <div className="relative z-10 flex items-center gap-1.5 flex-wrap pt-0.5">
                          {equippedBadges.map((badgeText, idx) => {
                            const badgeItem = itemsList.find(
                              i => i.category === 'badge' && (i.badgeText === badgeText || i.name === badgeText)
                            );
                            const badgeClass = badgeItem?.badgeStyle || (themeStyle ? themeStyle.badgeBgClass : 'bg-gradient-to-r from-amber-400 to-yellow-500 text-black');
                            return (
                              <span
                                key={idx}
                                className={\`text-[9px] sm:text-[10px] px-2 py-0.5 rounded-md font-bold tracking-tight shadow-sm border border-white/10 flex items-center gap-1 whitespace-nowrap leading-tight \${badgeClass}\`}
                              >
                                <span>{badgeText}</span>
                              </span>
                            );
                          })}
                        </div>
                      )}

                      {/* Comment Text */}
                      <div className={\`relative z-10 \${
                        themeStyle?.cardBgImageUrl
                          ? 'bg-black/75 p-3 rounded-xl border border-white/10 shadow-md'
                          : ''
                      }\`}>
                        <div className="text-xs sm:text-sm text-gray-200 leading-relaxed whitespace-pre-wrap break-words break-all [overflow-wrap:anywhere]">
                          bu seriyi okudum çok güzeldi
                        </div>
                      </div>

                      {/* Action Bar (Likes / Dislikes / Reply) - Clean Symmetrical Footer */}
                      <div className={\`relative z-10 flex items-center justify-between \${
                        themeStyle?.cardBgImageUrl
                          ? 'pt-1'
                          : 'border-t border-white/10 pt-2.5'
                      } text-xs\`}>
                        <div className={\`flex items-center gap-3.5 \${
                          themeStyle?.cardBgImageUrl
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
                    `;

    const oldContent = code.substring(startIndex, endIndex);
    code = code.replace(oldContent, newPreviewCode);
    
    fs.writeFileSync('src/components/ShopModal.tsx', code);
    console.log("Patched ShopModal.tsx preview successfully");
} else {
    console.log("Could not find start or end index for replacing");
}
