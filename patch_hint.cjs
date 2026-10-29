const fs = require('fs');
let code = fs.readFileSync('src/components/AdminModal.tsx', 'utf8');

const target = `<label className="block text-xs font-bold text-amber-300">
                    👁️ Canlı Yorum Kartı Önizlemesi (Live Comment Card Preview):
                  </label>`;

const replacement = `<label className="block text-xs font-bold text-amber-300">
                    👁️ Canlı Yorum Kartı Önizlemesi (Live Comment Card Preview):
                  </label>
                  <p className="text-[10px] text-gray-400">💡 İpucu: Eklediğiniz dekorasyonları fare veya parmağınızla tutup sürükleyerek yerini kolayca ayarlayabilirsiniz.</p>`;

if (code.includes(target)) {
  code = code.replace(target, replacement);
  fs.writeFileSync('src/components/AdminModal.tsx', code);
  console.log("Patched AdminModal.tsx with hint.");
} else {
  console.log("Hint target not found.");
}
