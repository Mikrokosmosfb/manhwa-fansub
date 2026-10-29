const fs = require('fs');

let code = fs.readFileSync('src/context/AppContext.tsx', 'utf8');

const search = `                const merged = [...base];
                for (const fetchedItem of data.shopItems) {
                  if (deletedIds.has(fetchedItem.id)) continue;
                  
                  const existingIdx = merged.findIndex(i => i.id === fetchedItem.id);
                  if (existingIdx >= 0) {
                    merged[existingIdx] = { ...merged[existingIdx], ...fetchedItem };
                  } else {
                    merged.unshift(fetchedItem);
                  }
                }
                return merged;`;

const replace = `                let merged = [...base];
                let newDeletedIds = new Set(deletedIds);
                let deletedIdsChanged = false;

                for (const fetchedItem of data.shopItems) {
                  if (fetchedItem.category === 'deleted') {
                    if (!newDeletedIds.has(fetchedItem.id)) {
                      newDeletedIds.add(fetchedItem.id);
                      deletedIdsChanged = true;
                    }
                    merged = merged.filter(i => i.id !== fetchedItem.id);
                    continue;
                  }

                  if (newDeletedIds.has(fetchedItem.id)) continue;
                  
                  const existingIdx = merged.findIndex(i => i.id === fetchedItem.id);
                  if (existingIdx >= 0) {
                    merged[existingIdx] = { ...merged[existingIdx], ...fetchedItem };
                  } else {
                    merged.unshift(fetchedItem);
                  }
                }

                if (deletedIdsChanged) {
                  try {
                    localStorage.setItem('mk_deleted_shop_items', JSON.stringify(Array.from(newDeletedIds)));
                  } catch(e){}
                }

                return merged;`;

if (code.includes(search)) {
    code = code.replace(search, replace);
    fs.writeFileSync('src/context/AppContext.tsx', code);
    console.log("Patched AppContext.tsx with global soft delete tracking!");
} else {
    console.log("Failed to find insertion point.");
}
