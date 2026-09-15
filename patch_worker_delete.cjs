const fs = require('fs');
let workerCode = fs.readFileSync('src/worker.ts', 'utf8');

const searchWorker = `        if (path.startsWith('/api/shop')) {
          if (request.method === 'GET') {`;
const replaceWorker = `        if (path.startsWith('/api/shop')) {
          if (request.method === 'DELETE') {
            const urlObj = new URL(request.url);
            const itemId = urlObj.searchParams.get('id');
            if (itemId && usersDb) {
              await usersDb.batch([
                usersDb.prepare('DELETE FROM shop_items WHERE id = ?').bind(itemId),
                usersDb.prepare('DELETE FROM theme_styles WHERE id = ?').bind(itemId)
              ]);
              return new Response(JSON.stringify({ success: true, message: 'Item deleted' }), { headers });
            }
            return new Response(JSON.stringify({ success: false, message: 'Invalid request' }), { status: 400, headers });
          }
          if (request.method === 'GET') {`;

if (workerCode.includes(searchWorker)) {
    workerCode = workerCode.replace(searchWorker, replaceWorker);
    fs.writeFileSync('src/worker.ts', workerCode);
    console.log("Patched worker.ts for DELETE /api/shop");
} else {
    console.log("Could not find insertion point in worker.ts");
}
