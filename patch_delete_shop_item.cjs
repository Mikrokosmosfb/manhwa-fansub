const fs = require('fs');

// Patch AppContext.tsx
let contextCode = fs.readFileSync('src/context/AppContext.tsx', 'utf8');
const searchContext = `      safeFetchJson('/api/shop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shopItems: filtered,
          themeStyles: newThemeStyles
        })
      }).catch(() => {});`;
const replaceContext = `      // Delete from D1 directly
      safeFetchJson(\`/api/shop?id=\${itemId}\`, {
        method: 'DELETE'
      }).catch(err => {
        console.error('Failed to delete shop item from D1:', err);
      });`;
contextCode = contextCode.replace(searchContext, replaceContext);
fs.writeFileSync('src/context/AppContext.tsx', contextCode);
console.log("Patched AppContext.tsx");
