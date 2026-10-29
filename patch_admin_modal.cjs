const fs = require('fs');
let code = fs.readFileSync('src/components/AdminModal.tsx', 'utf8');

const decorationUI = `
                {/* DECORATIONS (CHIBI / PNG) SECTION */}
                <div className="pt-4 mt-4 border-t border-gray-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="block text-sm font-bold text-amber-300">
                      🎨 Yorum Kartı Dekorasyonları (Chibi/PNG)
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        const newDec = { id: 'dec_' + Date.now(), imageUrl: '', top: '-10px', left: '-10px', width: '50px', zIndex: 20 };
                        setEditingThemeStyle({
                          ...editingThemeStyle,
                          decorations: [...(editingThemeStyle.decorations || []), newDec]
                        });
                      }}
                      className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-bold px-3 py-1.5 rounded-lg border border-amber-500/30 transition"
                    >
                      + Yeni Ekle
                    </button>
                  </div>
                  
                  {(!editingThemeStyle.decorations || editingThemeStyle.decorations.length === 0) && (
                     <p className="text-xs text-gray-400 italic">Henüz bir dekorasyon eklenmemiş. Yorum kutularına köşelerden sarkan karakterler veya simgeler eklemek için yeni bir dekorasyon oluşturun.</p>
                  )}

                  <div className="space-y-4">
                    {editingThemeStyle.decorations?.map((dec, idx) => (
                      <div key={dec.id} className="p-3 bg-gray-900 border border-purple-500/30 rounded-xl space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold text-purple-300">Dekorasyon #{idx + 1}</span>
                          <button
                            type="button"
                            onClick={() => {
                              const updated = editingThemeStyle.decorations!.filter(d => d.id !== dec.id);
                              setEditingThemeStyle({ ...editingThemeStyle, decorations: updated });
                            }}
                            className="text-rose-400 hover:text-rose-300 text-xs font-bold"
                          >
                            Sil
                          </button>
                        </div>
                        <ImageUploadField
                          label="Dekorasyon Görseli (PNG önerilir)"
                          value={dec.imageUrl}
                          onChange={(url) => {
                            const updated = [...editingThemeStyle.decorations!];
                            updated[idx].imageUrl = url;
                            setEditingThemeStyle({ ...editingThemeStyle, decorations: updated });
                          }}
                          aspectRatio="auto"
                          placeholder="Görsel URL veya bilgisayardan yükle"
                        />
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                          <div>
                            <label className="text-gray-400 mb-1 block">Top (Üst)</label>
                            <input type="text" placeholder="örn: -20px" value={dec.top || ''} onChange={e => { const u = [...editingThemeStyle.decorations!]; u[idx].top = e.target.value; setEditingThemeStyle({ ...editingThemeStyle, decorations: u }); }} className="w-full bg-gray-950 border border-gray-700 rounded p-1 text-white" />
                          </div>
                          <div>
                            <label className="text-gray-400 mb-1 block">Right (Sağ)</label>
                            <input type="text" placeholder="örn: -10px" value={dec.right || ''} onChange={e => { const u = [...editingThemeStyle.decorations!]; u[idx].right = e.target.value; setEditingThemeStyle({ ...editingThemeStyle, decorations: u }); }} className="w-full bg-gray-950 border border-gray-700 rounded p-1 text-white" />
                          </div>
                          <div>
                            <label className="text-gray-400 mb-1 block">Bottom (Alt)</label>
                            <input type="text" placeholder="örn: auto" value={dec.bottom || ''} onChange={e => { const u = [...editingThemeStyle.decorations!]; u[idx].bottom = e.target.value; setEditingThemeStyle({ ...editingThemeStyle, decorations: u }); }} className="w-full bg-gray-950 border border-gray-700 rounded p-1 text-white" />
                          </div>
                          <div>
                            <label className="text-gray-400 mb-1 block">Left (Sol)</label>
                            <input type="text" placeholder="örn: 5px" value={dec.left || ''} onChange={e => { const u = [...editingThemeStyle.decorations!]; u[idx].left = e.target.value; setEditingThemeStyle({ ...editingThemeStyle, decorations: u }); }} className="w-full bg-gray-950 border border-gray-700 rounded p-1 text-white" />
                          </div>
                          <div>
                            <label className="text-gray-400 mb-1 block">Genişlik (Width)</label>
                            <input type="text" placeholder="örn: 60px" value={dec.width || ''} onChange={e => { const u = [...editingThemeStyle.decorations!]; u[idx].width = e.target.value; setEditingThemeStyle({ ...editingThemeStyle, decorations: u }); }} className="w-full bg-gray-950 border border-gray-700 rounded p-1 text-white" />
                          </div>
                          <div>
                            <label className="text-gray-400 mb-1 block">Döndürme (Rotation)</label>
                            <input type="text" placeholder="örn: 15deg veya -10deg" value={dec.rotation || ''} onChange={e => { const u = [...editingThemeStyle.decorations!]; u[idx].rotation = e.target.value; setEditingThemeStyle({ ...editingThemeStyle, decorations: u }); }} className="w-full bg-gray-950 border border-gray-700 rounded p-1 text-white" />
                          </div>
                          <div>
                            <label className="text-gray-400 mb-1 block">Z-Index (Katman)</label>
                            <input type="number" placeholder="örn: 20" value={dec.zIndex || ''} onChange={e => { const u = [...editingThemeStyle.decorations!]; u[idx].zIndex = parseInt(e.target.value) || 0; setEditingThemeStyle({ ...editingThemeStyle, decorations: u }); }} className="w-full bg-gray-950 border border-gray-700 rounded p-1 text-white" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
`;

const insertionPoint = `                {/* Live Card Preview */}`;
if (code.includes(insertionPoint)) {
  code = code.replace(insertionPoint, decorationUI + "\n\n" + insertionPoint);
  fs.writeFileSync('src/components/AdminModal.tsx', code);
  console.log("Patched AdminModal.tsx successfully.");
} else {
  console.log("Insertion point not found.");
}
