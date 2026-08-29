const fs = require('fs');

let workerCode = fs.readFileSync('src/worker.ts', 'utf8');

const searchWorker = `              await usersDb.batch([
                usersDb.prepare('DELETE FROM shop_items WHERE id = ?').bind(itemId),
                usersDb.prepare('DELETE FROM theme_styles WHERE id = ?').bind(itemId)
              ]);
              return new Response(JSON.stringify({ success: true, message: 'Item deleted' }), { headers });
            }
            return new Response(JSON.stringify({ success: false, message: 'Invalid request' }), { status: 400, headers });`;
            
const replaceWorker = `              try {
                await usersDb.batch([
                  usersDb.prepare('DELETE FROM shop_items WHERE id = ?').bind(itemId),
                  usersDb.prepare('DELETE FROM theme_styles WHERE id = ?').bind(itemId)
                ]);
                return new Response(JSON.stringify({ success: true, message: 'Item deleted' }), { headers });
              } catch (e) {
                return new Response(JSON.stringify({ success: false, message: 'DB Error: ' + e.message }), { status: 500, headers });
              }
            }
            return new Response(JSON.stringify({ success: false, message: 'Invalid request' }), { status: 400, headers });`;

if (workerCode.includes(searchWorker)) {
    workerCode = workerCode.replace(searchWorker, replaceWorker);
    fs.writeFileSync('src/worker.ts', workerCode);
    console.log("Patched worker.ts try-catch for DELETE");
} else {
    console.log("Could not find insertion point");
}
