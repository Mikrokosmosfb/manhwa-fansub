const fs = require('fs');
let code = fs.readFileSync('src/components/AdminModal.tsx', 'utf8');

const search = `<input
                    type="text"
                    placeholder="Emoji (örn: 🖼️, ✨) veya Resim Linki"
                    value={editingShopItem.icon}`;

const replace = `{(editingShopItem.icon?.startsWith('http') || editingShopItem.icon?.startsWith('/')) && (
                    <img src={editingShopItem.icon} alt="preview" className="w-10 h-10 object-cover rounded-lg border border-gray-700 bg-black/50 shrink-0" />
                  )}
                  <input
                    type="text"
                    placeholder="Emoji (örn: 🖼️, ✨) veya Resim Linki"
                    value={editingShopItem.icon}`;

if (code.includes(search)) {
    code = code.replace(search, replace);
    fs.writeFileSync('src/components/AdminModal.tsx', code);
    console.log("Patched icon input");
} else {
    console.log("Could not find icon input");
}
