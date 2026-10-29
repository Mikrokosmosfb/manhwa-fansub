const fs = require('fs');
let code = fs.readFileSync('src/context/AppContext.tsx', 'utf8');

const search = `  const addShopItemAndStyle = (item: ShopItem, style?: ThemeStyle) => {
    setShopItems(prev => {
      const merged = [item, ...prev.filter(i => i.id !== item.id)];
      
      safeFetchJson('/api/shop', {`;

const replace = `  const addShopItemAndStyle = (item: ShopItem, style?: ThemeStyle) => {
    try {
      const deletedStr = localStorage.getItem('mk_deleted_shop_items') || '[]';
      const deletedList = new Set(JSON.parse(deletedStr));
      if (deletedList.has(item.id)) {
        deletedList.delete(item.id);
        localStorage.setItem('mk_deleted_shop_items', JSON.stringify(Array.from(deletedList)));
      }
    } catch(e){}
    setShopItems(prev => {
      const merged = [item, ...prev.filter(i => i.id !== item.id)];
      
      safeFetchJson('/api/shop', {`;

if (code.includes(search)) {
    code = code.replace(search, replace);
    fs.writeFileSync('src/context/AppContext.tsx', code);
    console.log("Patched addShopItemAndStyle!");
} else {
    console.log("Could not find search string for addShopItemAndStyle.");
}
