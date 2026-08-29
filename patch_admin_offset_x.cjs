const fs = require('fs');

let code = fs.readFileSync('src/components/AdminModal.tsx', 'utf8');

const search = `                  {/* Dikey Konum Kaydırma (Y Offset) */}
                  <div className="space-y-2 pt-2 border-t border-gray-800/80">`;
const replace = `                  {/* Yatay Konum Kaydırma (X Offset) */}
                  <div className="space-y-2 pt-2 border-t border-gray-800/80">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-black text-cyan-200 flex items-center gap-1.5">
                        ↔️ Yatay Hizalama (X-Offset): <span className="text-cyan-400 font-mono text-sm font-black">{editingShopItem.frameOffsetX ?? 0}%</span>
                      </label>
                      <span className="text-[10px] text-gray-400">
                        (Sola (-) / Sağa (+))
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min="-30"
                        max="30"
                        step="1"
                        value={editingShopItem.frameOffsetX ?? 0}
                        onChange={e => setEditingShopItem({ ...editingShopItem, frameOffsetX: Number(e.target.value) })}
                        className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                      />
                      <button
                        type="button"
                        onClick={() => setEditingShopItem({ ...editingShopItem, frameOffsetX: 0 })}
                        className="px-2.5 py-1 bg-gray-900 hover:bg-gray-800 text-gray-300 text-[10px] font-bold rounded-lg border border-gray-700 whitespace-nowrap"
                      >
                        Sıfırla (0%)
                      </button>
                    </div>
                  </div>

                  {/* Dikey Konum Kaydırma (Y Offset) */}
                  <div className="space-y-2 pt-2 border-t border-gray-800/80">`;

if (code.includes(search)) {
    code = code.replace(search, replace);
    fs.writeFileSync('src/components/AdminModal.tsx', code);
    console.log("Patched AdminModal.tsx");
} else {
    console.log("Could not find insertion point in AdminModal.tsx");
}
