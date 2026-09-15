const fs = require('fs');

let code = fs.readFileSync('src/context/AppContext.tsx', 'utf8');

// 1. Update useState for shopItems
const searchState = `  const [shopItems, setShopItems] = useState<ShopItem[]>(() => {
    const saved = localStorage.getItem('mk_shop_items');
    if (saved) {
      try {
        const savedItems: ShopItem[] = JSON.parse(saved);
        const savedMap = new Map(savedItems.map(item => [item.id, item]));
        const mergedDefault = SHOP_ITEMS.map(defaultItem => {
          return savedMap.has(defaultItem.id) ? { ...defaultItem, ...savedMap.get(defaultItem.id)! } : defaultItem;
        });
        const defaultIds = new Set(SHOP_ITEMS.map(i => i.id));
        const customSaved = savedItems.filter(i => !defaultIds.has(i.id));
        return [...mergedDefault, ...customSaved];
      } catch (e) {}
    }
    return SHOP_ITEMS;
  });`;

const replaceState = `  const [shopItems, setShopItems] = useState<ShopItem[]>(() => {
    const saved = localStorage.getItem('mk_shop_items');
    const deletedStr = localStorage.getItem('mk_deleted_shop_items');
    let deletedIds = new Set<string>();
    if (deletedStr) {
      try { deletedIds = new Set(JSON.parse(deletedStr)); } catch(e){}
    }

    if (saved) {
      try {
        const savedItems: ShopItem[] = JSON.parse(saved);
        const savedMap = new Map(savedItems.map(item => [item.id, item]));
        const mergedDefault = SHOP_ITEMS
          .filter(defaultItem => !deletedIds.has(defaultItem.id))
          .map(defaultItem => {
            return savedMap.has(defaultItem.id) ? { ...defaultItem, ...savedMap.get(defaultItem.id)! } : defaultItem;
          });
        const defaultIds = new Set(SHOP_ITEMS.map(i => i.id));
        const customSaved = savedItems.filter(i => !defaultIds.has(i.id) && !deletedIds.has(i.id));
        return [...mergedDefault, ...customSaved];
      } catch (e) {}
    }
    return SHOP_ITEMS.filter(i => !deletedIds.has(i.id));
  });`;

// 2. Update deleteShopItemAndStyle to track in localStorage
const searchDelete = `    setShopItems(prev => prev.filter(i => i.id !== itemId));`;
const replaceDelete = `    setShopItems(prev => prev.filter(i => i.id !== itemId));
    try {
      const deletedStr = localStorage.getItem('mk_deleted_shop_items') || '[]';
      const deletedList = new Set(JSON.parse(deletedStr));
      deletedList.add(itemId);
      localStorage.setItem('mk_deleted_shop_items', JSON.stringify(Array.from(deletedList)));
    } catch (e) {}`;

// 3. Update useEffect fetch from D1 to also filter out deleted items just in case
const searchEffect = `              setShopItems(prev => {
                const merged = [...prev];
                for (const fetchedItem of data.shopItems) {
                  const existingIdx = merged.findIndex(i => i.id === fetchedItem.id);
                  if (existingIdx >= 0) {
                    merged[existingIdx] = { ...merged[existingIdx], ...fetchedItem };
                  } else {
                    merged.unshift(fetchedItem);
                  }
                }
                return merged;
              });`;

const replaceEffect = `              setShopItems(prev => {
                // If D1 gives us a list, and an item is missing in D1, 
                // it might have been deleted from another device.
                // We should remove items that are in prev but not in D1, EXCEPT if D1 is completely empty (unseeded)
                // OR if it's a new default item.
                // The safest robust way: sync deletedIds.
                
                const deletedStr = localStorage.getItem('mk_deleted_shop_items');
                let deletedIds = new Set<string>();
                if (deletedStr) {
                  try { deletedIds = new Set(JSON.parse(deletedStr)); } catch(e){}
                }

                // First, remove items from prev that are NO LONGER in fetched items, 
                // assuming fetched items isn't completely empty (which means unseeded).
                let base = [...prev];
                if (data.shopItems.length > 0) {
                  const fetchedIds = new Set(data.shopItems.map((i: any) => i.id));
                  base = base.filter(item => fetchedIds.has(item.id) || !deletedIds.has(item.id));
                  // Actually, if it's not in fetchedIds, and D1 is seeded, it was deleted!
                  // Let's force it: if D1 is seeded, any custom item not in D1 should be dropped.
                  const defaultIds = new Set(SHOP_ITEMS.map(i => i.id));
                  base = base.filter(item => fetchedIds.has(item.id) || (defaultIds.has(item.id) && !deletedIds.has(item.id)));
                }

                const merged = [...base];
                for (const fetchedItem of data.shopItems) {
                  if (deletedIds.has(fetchedItem.id)) continue;
                  
                  const existingIdx = merged.findIndex(i => i.id === fetchedItem.id);
                  if (existingIdx >= 0) {
                    merged[existingIdx] = { ...merged[existingIdx], ...fetchedItem };
                  } else {
                    merged.unshift(fetchedItem);
                  }
                }
                return merged;
              });`;

if (code.includes(searchState) && code.includes(searchDelete) && code.includes(searchEffect)) {
    code = code.replace(searchState, replaceState);
    code = code.replace(searchDelete, replaceDelete);
    code = code.replace(searchEffect, replaceEffect);
    fs.writeFileSync('src/context/AppContext.tsx', code);
    console.log("Patched AppContext.tsx with deleted tracking logic!");
} else {
    console.log("Failed to find insertion points.");
}
