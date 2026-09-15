const fs = require('fs');
let code = fs.readFileSync('src/worker.ts', 'utf8');

const search = `              try {
                await usersDb.prepare('DELETE FROM shop_items WHERE id = ?').bind(itemId).run();
              } catch(e) {}
              
              try {
                await usersDb.prepare('DELETE FROM theme_styles WHERE id = ?').bind(itemId).run();
              } catch(e) {}
              
              return new Response(JSON.stringify({ success: true, message: 'Item deleted safely' }), { headers });`;

const replace = `              try {
                // Instead of deleting, mark it as deleted so clients know it's gone globally
                // if it was a default item.
                const exists = await usersDb.prepare('SELECT id FROM shop_items WHERE id = ?').bind(itemId).first();
                if (exists) {
                  await usersDb.prepare('UPDATE shop_items SET category = ? WHERE id = ?').bind('deleted', itemId).run();
                } else {
                  // Just insert a tombstone so clients know to hide it
                  await usersDb.prepare('INSERT INTO shop_items (id, name, category, price) VALUES (?, ?, ?, ?)').bind(itemId, 'Deleted', 'deleted', 0).run();
                }
              } catch(e) {}
              
              try {
                await usersDb.prepare('DELETE FROM theme_styles WHERE id = ?').bind(itemId).run();
              } catch(e) {}
              
              return new Response(JSON.stringify({ success: true, message: 'Item deleted safely' }), { headers });`;

if (code.includes(search)) {
    code = code.replace(search, replace);
    fs.writeFileSync('src/worker.ts', code);
    console.log("Fixed worker.ts to use soft delete");
} else {
    console.log("Could not find search string in worker.ts");
}
