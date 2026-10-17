const fs = require('fs');
let code = fs.readFileSync('src/context/AppContext.tsx', 'utf8');

const target = `  const buyShopItem = (itemId: string) => {
    if (!user) {
      openAuthModal('login');
      return { success: false, message: 'Lütfen önce giriş yapın.' };
    }

    const item = SHOP_ITEMS.find(i => i.id === itemId);`;

const replacement = `  const buyShopItem = (itemId: string) => {
    if (!user) {
      openAuthModal('login');
      return { success: false, message: 'Lütfen önce giriş yapın.' };
    }

    const item = shopItems.find(i => i.id === itemId) || SHOP_ITEMS.find(i => i.id === itemId);`;

code = code.replace(target, replacement);
fs.writeFileSync('src/context/AppContext.tsx', code);
console.log("Patched buyShopItem");
