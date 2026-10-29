const fs = require('fs');
let code = fs.readFileSync('src/context/AppContext.tsx', 'utf8');

const search = `    setShopItems(prev => {
      const filtered = prev.filter(i => i.id !== itemId);
      
      const newThemeStyles = { ...themeStyles };
      delete newThemeStyles[itemId];

      // Sync global shop to D1
      // Delete from D1 directly
      console.log('Sending DELETE API request for', itemId);
      safeFetchJson(\`/api/shop?id=\${encodeURIComponent(itemId)}\`, {
        method: 'DELETE'
      }).then(res => {
        console.log('DELETE API response:', res);
      }).catch(err => {
        console.error('Failed to delete shop item from D1:', err);
      });

      return filtered;
    });`;

const replace = `    console.log('Sending DELETE API request for', itemId);
    safeFetchJson(\`/api/shop?id=\${encodeURIComponent(itemId)}\`, {
      method: 'DELETE'
    }).then(res => {
      console.log('DELETE API response:', res);
    }).catch(err => {
      console.error('Failed to delete shop item from D1:', err);
    });

    setShopItems(prev => prev.filter(i => i.id !== itemId));`;

code = code.replace(search, replace);
fs.writeFileSync('src/context/AppContext.tsx', code);
console.log("Fixed!");
