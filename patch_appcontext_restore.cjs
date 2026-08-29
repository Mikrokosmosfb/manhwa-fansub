const fs = require('fs');
let code = fs.readFileSync('src/context/AppContext.tsx', 'utf8');

const searchAdd = `  const addShopItemAndStyle = (item: ShopItem, style?: ThemeStyle) => {
    const mergedItems = [item, ...shopItems.filter(i => i.id !== item.id)];
    const newThemeStyles = style ? { ...themeStyles, [item.id]: style } : themeStyles;`;

const replaceAdd = `  const addShopItemAndStyle = (item: ShopItem, style?: ThemeStyle) => {
    try {
      const deletedStr = localStorage.getItem('mk_deleted_shop_items') || '[]';
      const deletedList = new Set(JSON.parse(deletedStr));
      if (deletedList.has(item.id)) {
        deletedList.delete(item.id);
        localStorage.setItem('mk_deleted_shop_items', JSON.stringify(Array.from(deletedList)));
      }
    } catch(e){}
    const mergedItems = [item, ...shopItems.filter(i => i.id !== item.id)];
    const newThemeStyles = style ? { ...themeStyles, [item.id]: style } : themeStyles;`;

if (code.includes(searchAdd)) {
    code = code.replace(searchAdd, replaceAdd);
    fs.writeFileSync('src/context/AppContext.tsx', code);
    console.log("Patched addShopItemAndStyle for restoring deleted items.");
}
