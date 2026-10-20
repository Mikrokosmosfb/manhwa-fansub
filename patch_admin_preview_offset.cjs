const fs = require('fs');

let code = fs.readFileSync('src/components/AdminModal.tsx', 'utf8');

code = code.split('customFrameOffsetY={item.frameOffsetY}').join('customFrameOffsetY={item.frameOffsetY}\n                            customFrameOffsetX={item.frameOffsetX}');

code = code.split('customFrameOffsetY={editingShopItem.frameOffsetY}').join('customFrameOffsetY={editingShopItem.frameOffsetY}\n                        customFrameOffsetX={editingShopItem.frameOffsetX}');

fs.writeFileSync('src/components/AdminModal.tsx', code);
console.log("Patched AdminModal.tsx preview offsets");
