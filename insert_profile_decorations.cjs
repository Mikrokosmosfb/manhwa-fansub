const fs = require('fs');

let code = fs.readFileSync('src/components/AdminModal.tsx', 'utf8');

// 1. Insert Profile Decorations Editor right before {/* Live Card Preview */}
const editorSearchStr = '{/* Live Card Preview */}';
const profileEditorBlock = `                {/* PROFILE DECORATIONS SECTION */}
                <div className="pt-4 mt-4 border-t border-gray-800 space-y-3 mb-6">
                  <div className="flex items-center justify-between">
                    <label className="block text-sm font-bold text-cyan-300">
                      🖼️ Profil Başlığı Dekorasyonları (Chibi/PNG)
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        const newDec = { id: 'pdec_' + Date.now(), imageUrl: '', top: '5%', right: '5%', width: '150px', zIndex: 30 };
                        setEditingThemeStyle({
                          ...editingThemeStyle,
                          profileDecorations: [...(editingThemeStyle.profileDecorations || []), newDec]
                        });
                      }}
                      className="px-2 py-1 bg-cyan-500/20 hover:bg-cyan-500/40 text-cyan-300 rounded text-xs font-bold transition"
                    >
                      + Dekor Ekle
                    </button>
                  </div>
                  
                  {(!editingThemeStyle.profileDecorations || editingThemeStyle.profileDecorations.length === 0) && (
                     <p className="text-xs text-gray-400 italic">Henüz profil için bir dekorasyon eklenmemiş. Profil başlığının üstünde veya yanlarında duracak büyük karakterler/efektler ekleyebilirsiniz.</p>
                  )}

                  <div className="space-y-3">
                    {editingThemeStyle.profileDecorations?.map((dec, idx) => (
                      <div key={dec.id || idx} className="bg-gray-900 border border-gray-700 p-3 rounded-lg relative">
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm('Bu profil dekorasyonunu silmek istediğinize emin misiniz?')) {
                              const updated = editingThemeStyle.profileDecorations!.filter(d => d.id !== dec.id);
                              setEditingThemeStyle({ ...editingThemeStyle, profileDecorations: updated });
                            }
                          }}
                          className="absolute top-2 right-2 text-rose-400 hover:text-rose-300 p-1 bg-rose-500/10 rounded"
                        >
                          <Trash2 size={14} />
                        </button>
                        
                        <div className="grid grid-cols-1 gap-2 mb-2 pr-8">
                          <div>
                            <label className="text-[10px] text-gray-400 font-bold">Görsel URL (PNG, WebP)</label>
                            <input type="text" placeholder="https://..." value={dec.imageUrl} onChange={e => { const u = [...editingThemeStyle.profileDecorations!]; u[idx].imageUrl = e.target.value; setEditingThemeStyle({ ...editingThemeStyle, profileDecorations: u }); }} className="w-full bg-gray-950 border border-gray-700 rounded p-1 text-white text-sm" />
                          </div>
                        </div>
                        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                          <div>
                            <label className="text-[10px] text-gray-400 font-bold">Top</label>
                            <input type="text" placeholder="örn: 5%" value={dec.top || ''} onChange={e => { const u = [...editingThemeStyle.profileDecorations!]; u[idx].top = e.target.value; setEditingThemeStyle({ ...editingThemeStyle, profileDecorations: u }); }} className="w-full bg-gray-950 border border-gray-700 rounded p-1 text-white" />
                          </div>
                          <div>
                            <label className="text-[10px] text-gray-400 font-bold">Right</label>
                            <input type="text" placeholder="örn: 5%" value={dec.right || ''} onChange={e => { const u = [...editingThemeStyle.profileDecorations!]; u[idx].right = e.target.value; setEditingThemeStyle({ ...editingThemeStyle, profileDecorations: u }); }} className="w-full bg-gray-950 border border-gray-700 rounded p-1 text-white" />
                          </div>
                          <div>
                            <label className="text-[10px] text-gray-400 font-bold">Bottom</label>
                            <input type="text" placeholder="örn: auto" value={dec.bottom || ''} onChange={e => { const u = [...editingThemeStyle.profileDecorations!]; u[idx].bottom = e.target.value; setEditingThemeStyle({ ...editingThemeStyle, profileDecorations: u }); }} className="w-full bg-gray-950 border border-gray-700 rounded p-1 text-white" />
                          </div>
                          <div>
                            <label className="text-[10px] text-gray-400 font-bold">Left</label>
                            <input type="text" placeholder="örn: auto" value={dec.left || ''} onChange={e => { const u = [...editingThemeStyle.profileDecorations!]; u[idx].left = e.target.value; setEditingThemeStyle({ ...editingThemeStyle, profileDecorations: u }); }} className="w-full bg-gray-950 border border-gray-700 rounded p-1 text-white" />
                          </div>
                          <div>
                            <label className="text-[10px] text-gray-400 font-bold">Width</label>
                            <input type="text" placeholder="örn: 150px" value={dec.width || ''} onChange={e => { const u = [...editingThemeStyle.profileDecorations!]; u[idx].width = e.target.value; setEditingThemeStyle({ ...editingThemeStyle, profileDecorations: u }); }} className="w-full bg-gray-950 border border-gray-700 rounded p-1 text-white" />
                          </div>
                          <div>
                            <label className="text-[10px] text-gray-400 font-bold">Rotation</label>
                            <input type="text" placeholder="örn: 15deg" value={dec.rotation || ''} onChange={e => { const u = [...editingThemeStyle.profileDecorations!]; u[idx].rotation = e.target.value; setEditingThemeStyle({ ...editingThemeStyle, profileDecorations: u }); }} className="w-full bg-gray-950 border border-gray-700 rounded p-1 text-white" />
                          </div>
                          <div>
                            <label className="text-[10px] text-gray-400 font-bold">z-Index</label>
                            <input type="number" placeholder="örn: 30" value={dec.zIndex || ''} onChange={e => { const u = [...editingThemeStyle.profileDecorations!]; u[idx].zIndex = parseInt(e.target.value) || 0; setEditingThemeStyle({ ...editingThemeStyle, profileDecorations: u }); }} className="w-full bg-gray-950 border border-gray-700 rounded p-1 text-white" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                `;

code = code.replace(editorSearchStr, profileEditorBlock + editorSearchStr);

// 2. Insert Profile Preview right after the Comment Preview's closing div.
// To reliably find the closing div of Comment Preview, we can search for the end of it.
const commentPreviewEndStr = `                            <span>Yanıtla</span>
                          </button>
                        </div>
                      </div>
                  </div>
                </div>`;

const profilePreviewBlock = `
                {/* Live Profile Header Preview */}
                <div className="space-y-1.5 pt-6">
                  <label className="block text-xs font-bold text-cyan-300">
                    👁️ Canlı Profil Başlığı Önizlemesi (Live Profile Header Preview):
                  </label>
                  <p className="text-[10px] text-gray-400">💡 İpucu: Profil dekorasyonlarını fare veya parmağınızla tutup sürükleyerek yerini kolayca ayarlayabilirsiniz.</p>
                  
                  <div className="relative min-h-[300px] sm:min-h-[380px] flex items-center justify-center p-6 sm:p-12 overflow-hidden rounded-3xl isolate border border-white/5 bg-gray-950 shadow-2xl mt-3">
                    {/* Background Layer */}
                    <div 
                      className="absolute inset-0 pointer-events-none transition-all duration-700 bg-cover bg-center z-0"
                      style={{
                        backgroundImage: editingThemeStyle.cardBgImageUrl ? \`url(\${editingThemeStyle.cardBgImageUrl})\` : undefined,
                        opacity: editingThemeStyle.cardBgImageUrl ? 0.75 : 1
                      }}
                    />
                    
                    {!editingThemeStyle.cardBgImageUrl && (
                      <div
                        className="absolute inset-0 pointer-events-none z-0"
                        style={{
                          background: editingThemeStyle.glowColor
                            ? \`radial-gradient(circle at 50% 30%, \${editingThemeStyle.glowColor}50 0%, transparent 70%)\`
                            : 'radial-gradient(circle at 50% 30%, #7c3aed40 0%, transparent 70%)'
                        }}
                      />
                    )}

                    <div className="absolute inset-0 pointer-events-none z-0">
                      <ThemeBackgroundEffects effectOverlay={editingThemeStyle.effectOverlay} isHero={true} />
                    </div>

                    <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-transparent pointer-events-none z-0" />
                    <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/40 to-transparent pointer-events-none z-0" />

                    {/* Profile Decorations Preview (Draggable) */}
                    {editingThemeStyle.profileDecorations?.map((dec, idx) => (
                      <img
                        key={'pprev_' + idx}
                        src={dec.imageUrl}
                        className="absolute cursor-move drop-shadow-lg hover:ring-2 hover:ring-cyan-500/80 hover:bg-cyan-500/10 rounded-lg transition-shadow"
                        onPointerDown={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          
                          const target = e.currentTarget;
                          const container = target.parentElement;
                          if (!container) return;
                          
                          target.setPointerCapture(e.pointerId);
                          
                          const cRect = container.getBoundingClientRect();
                          const iRect = target.getBoundingClientRect();
                          
                          const startX = e.clientX;
                          const startY = e.clientY;
                          
                          const startLeft = iRect.left - cRect.left;
                          const startTop = iRect.top - cRect.top;
                          
                          const handlePointerMove = (moveEvent) => {
                            const deltaX = moveEvent.clientX - startX;
                            const deltaY = moveEvent.clientY - startY;
                            setEditingThemeStyle((prev: any) => {
                              if (!prev || !prev.profileDecorations) return prev;
                              const updated = [...prev.profileDecorations];
                              updated[idx] = {
                                ...updated[idx],
                                top: \`\${Math.round(startTop + deltaY)}px\`,
                                left: \`\${Math.round(startLeft + deltaX)}px\`,
                                right: '',
                                bottom: ''
                              };
                              return { ...prev, profileDecorations: updated };
                            });
                          };
                          
                          const handlePointerUp = (upEvent) => {
                            target.removeEventListener('pointermove', handlePointerMove);
                            target.removeEventListener('pointerup', handlePointerUp);
                            target.removeEventListener('pointercancel', handlePointerUp);
                            try { target.releasePointerCapture(upEvent.pointerId); } catch(err){}
                            
                            // Akıllı Konumlandırma
                            setEditingThemeStyle((prev: any) => {
                              if (!prev || !prev.profileDecorations) return prev;
                              const updated = [...prev.profileDecorations];
                              
                              const cRectEnd = container.getBoundingClientRect();
                              const iRectEnd = target.getBoundingClientRect();
                              
                              const leftPx = iRectEnd.left - cRectEnd.left;
                              const topPx = iRectEnd.top - cRectEnd.top;
                              const rightPx = cRectEnd.right - iRectEnd.right;
                              const bottomPx = cRectEnd.bottom - iRectEnd.bottom;
                              
                              let finalLeft = '';
                              let finalRight = '';
                              let finalTop = '';
                              let finalBottom = '';
                              
                              if (leftPx < rightPx) {
                                finalLeft = \`\${Math.round(leftPx)}px\`;
                              } else {
                                finalRight = \`\${Math.round(rightPx)}px\`;
                              }
                              
                              if (topPx < bottomPx) {
                                finalTop = \`\${Math.round(topPx)}px\`;
                              } else {
                                finalBottom = \`\${Math.round(bottomPx)}px\`;
                              }
                              
                              updated[idx] = {
                                 ...updated[idx],
                                 top: finalTop,
                                 bottom: finalBottom,
                                 left: finalLeft,
                                 right: finalRight
                               };
                              
                              return { ...prev, profileDecorations: updated };
                            });
                          };
                          
                          target.addEventListener('pointermove', handlePointerMove);
                          target.addEventListener('pointerup', handlePointerUp);
                          target.addEventListener('pointercancel', handlePointerUp);
                        }}
                        style={{
                          top: dec.top || undefined,
                          bottom: dec.bottom || undefined,
                          left: dec.left || undefined,
                          right: dec.right || undefined,
                          width: dec.width || undefined,
                          transform: dec.rotation ? \`rotate(\${dec.rotation})\` : undefined,
                          zIndex: dec.zIndex !== undefined ? dec.zIndex : 30,
                          touchAction: 'none'
                        }}
                        title="Sürükleyip yerini değiştirebilirsiniz" draggable={false}
                        alt=""
                      />
                    ))}

                    {/* Profile User Info Header */}
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
                    </div>
                  </div>
                </div>`;

if (code.includes(commentPreviewEndStr)) {
  code = code.replace(commentPreviewEndStr, commentPreviewEndStr + '\n' + profilePreviewBlock);
  fs.writeFileSync('src/components/AdminModal.tsx', code);
  console.log("Successfully injected Profile Decorations editor and preview!");
} else {
  console.log("Failed to find injection points.");
}
