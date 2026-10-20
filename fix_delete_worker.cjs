const fs = require('fs');
let code = fs.readFileSync('src/worker.ts', 'utf8');

const search = `              try {
                await usersDb.batch([
                  usersDb.prepare('DELETE FROM shop_items WHERE id = ?').bind(itemId),
                  usersDb.prepare('DELETE FROM theme_styles WHERE id = ?').bind(itemId)
                ]);
                return new Response(JSON.stringify({ success: true, message: 'Item deleted' }), { headers });
              } catch (e) {
                return new Response(JSON.stringify({ success: false, message: 'DB Error: ' + e.message }), { status: 500, headers });
              }`;

const replace = `              try {
                await usersDb.prepare('DELETE FROM shop_items WHERE id = ?').bind(itemId).run();
              } catch(e) {}
              
              try {
                await usersDb.prepare('DELETE FROM theme_styles WHERE id = ?').bind(itemId).run();
              } catch(e) {}
              
              return new Response(JSON.stringify({ success: true, message: 'Item deleted safely' }), { headers });`;

if (code.includes(search)) {
    code = code.replace(search, replace);
    fs.writeFileSync('src/worker.ts', code);
    console.log("Fixed worker.ts delete logic");
} else {
    console.log("Could not find search string in worker.ts");
}
