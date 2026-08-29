const fs = require('fs');

let code = fs.readFileSync('src/context/AppContext.tsx', 'utf8');

// We will just rewrite the 4 functions entirely using regex or replace.

const searchUpdateShopItem = `  const updateShopItem = (itemId: string, updated: Partial<ShopItem>) => {
    setShopItems(prev => {
      const oldItem = prev.find(item => item.id === itemId);
      if (oldItem && oldItem.frameImageUrl !== updated.frameImageUrl) {
        if (oldItem.frameImageUrl && oldItem.frameImageUrl.includes('/api/r2/file/')) {
          fetch(oldItem.frameImageUrl, { method: 'DELETE' }).catch(err => {
            console.error('Failed to delete old frame image from R2:', err);
          });
        }
      }
      const merged = prev.map(item => item.id === itemId ? { ...item, ...updated } : item);
      
      const newThemeStyles = { ...themeStyles };
      if (updated.name && newThemeStyles[itemId]) {
        newThemeStyles[itemId] = { ...newThemeStyles[itemId], name: updated.name! };
      }
      // Sync global shop to D1
      safeFetchJson('/api/shop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shopItems: merged,
          themeStyles: newThemeStyles
        })
      }).catch(() => {});
      return merged;
    });
    if (updated.name && themeStyles[itemId]) {
      setThemeStyles(prev => ({
        ...prev,
        [itemId]: { ...prev[itemId], name: updated.name! }
      }));
    }
  };`;

const replaceUpdateShopItem = `  const updateShopItem = (itemId: string, updated: Partial<ShopItem>) => {
    const oldItem = shopItems.find(item => item.id === itemId);
    if (oldItem && oldItem.frameImageUrl !== updated.frameImageUrl) {
      if (oldItem.frameImageUrl && oldItem.frameImageUrl.includes('/api/r2/file/')) {
        fetch(oldItem.frameImageUrl, { method: 'DELETE' }).catch(err => {
          console.error('Failed to delete old frame image from R2:', err);
        });
      }
    }
    const mergedItems = shopItems.map(item => item.id === itemId ? { ...item, ...updated } : item);
    
    const newThemeStyles = { ...themeStyles };
    if (updated.name && newThemeStyles[itemId]) {
      newThemeStyles[itemId] = { ...newThemeStyles[itemId], name: updated.name! };
    }

    safeFetchJson('/api/shop', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        shopItems: mergedItems,
        themeStyles: newThemeStyles
      })
    }).catch(() => {});

    setShopItems(mergedItems);
    if (updated.name && themeStyles[itemId]) {
      setThemeStyles(newThemeStyles);
    }
  };`;

const searchUpdateThemeStyle = `  const updateThemeStyle = (themeId: string, updated: Partial<ThemeStyle>) => {
    setThemeStyles(prev => {
      const oldStyle = prev[themeId];
      if (oldStyle && oldStyle.cardBgImageUrl !== updated.cardBgImageUrl) {
        if (oldStyle.cardBgImageUrl && oldStyle.cardBgImageUrl.includes('/api/r2/file/')) {
           // Delete the old R2 image if it has been replaced or removed
           fetch(oldStyle.cardBgImageUrl, { method: 'DELETE' }).catch(err => {
             console.error('Failed to delete old theme image from R2:', err);
           });
        }
      }
      const merged = { ...prev, [themeId]: { ...prev[themeId], ...updated } };
      
      const newShopItems = shopItems.map(item => {
        if (item.id === themeId) {
          return { ...item, name: updated.name ?? item.name };
        }
        return item;
      });
      // Sync global shop to D1
      safeFetchJson('/api/shop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shopItems: newShopItems,
          themeStyles: merged
        })
      }).catch(() => {});
      return merged;
    });
    setShopItems(prev => prev.map(item => {
      if (item.id === themeId) {
        return {
          ...item,
          name: updated.name ?? item.name,
        };
      }
      return item;
    }));
  };`;

const replaceUpdateThemeStyle = `  const updateThemeStyle = (themeId: string, updated: Partial<ThemeStyle>) => {
    const oldStyle = themeStyles[themeId];
    if (oldStyle && oldStyle.cardBgImageUrl !== updated.cardBgImageUrl) {
      if (oldStyle.cardBgImageUrl && oldStyle.cardBgImageUrl.includes('/api/r2/file/')) {
          fetch(oldStyle.cardBgImageUrl, { method: 'DELETE' }).catch(err => {
            console.error('Failed to delete old theme image from R2:', err);
          });
      }
    }
    const mergedStyles = { ...themeStyles, [themeId]: { ...themeStyles[themeId], ...updated } };
    
    const newShopItems = shopItems.map(item => {
      if (item.id === themeId) {
        return { ...item, name: updated.name ?? item.name };
      }
      return item;
    });

    safeFetchJson('/api/shop', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        shopItems: newShopItems,
        themeStyles: mergedStyles
      })
    }).catch(() => {});

    setThemeStyles(mergedStyles);
    setShopItems(newShopItems);
  };`;

const searchAddShopItem = `  const addShopItemAndStyle = (item: ShopItem, style?: ThemeStyle) => {
    setShopItems(prev => {
      const merged = [item, ...prev.filter(i => i.id !== item.id)];
      
      safeFetchJson('/api/shop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shopItems: merged,
          themeStyles: style ? { ...themeStyles, [item.id]: style } : themeStyles
        })
      }).catch(() => {});
      return merged;
    });
    if (style) {
      setThemeStyles(prev => ({
        ...prev,
        [item.id]: style
      }));
    }
  };`;

const replaceAddShopItem = `  const addShopItemAndStyle = (item: ShopItem, style?: ThemeStyle) => {
    const mergedItems = [item, ...shopItems.filter(i => i.id !== item.id)];
    const newThemeStyles = style ? { ...themeStyles, [item.id]: style } : themeStyles;

    safeFetchJson('/api/shop', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        shopItems: mergedItems,
        themeStyles: newThemeStyles
      })
    }).catch(() => {});

    setShopItems(mergedItems);
    if (style) {
      setThemeStyles(newThemeStyles);
    }
  };`;

code = code.replace(searchUpdateShopItem, replaceUpdateShopItem);
code = code.replace(searchUpdateThemeStyle, replaceUpdateThemeStyle);
code = code.replace(searchAddShopItem, replaceAddShopItem);

fs.writeFileSync('src/context/AppContext.tsx', code);
console.log("Fixed all shop APIs");
