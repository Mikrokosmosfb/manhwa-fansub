const fs = require('fs');

let ctx = fs.readFileSync('src/context/AppContext.tsx', 'utf8');

const search = `      safeFetchJson(\`/api/shop?id=\${itemId}\`, {
        method: 'DELETE'
      }).catch(err => {`;
      
const replace = `      console.log('Sending DELETE API request for', itemId);
      safeFetchJson(\`/api/shop?id=\${encodeURIComponent(itemId)}\`, {
        method: 'DELETE'
      }).then(res => {
        console.log('DELETE API response:', res);
      }).catch(err => {`;

if(ctx.includes(search)) {
    ctx = ctx.replace(search, replace);
    fs.writeFileSync('src/context/AppContext.tsx', ctx);
    console.log("Patched AppContext.tsx for debug");
} else {
    console.log("Could not find search string in AppContext.tsx");
}
