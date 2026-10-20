const fs = require('fs');
let code = fs.readFileSync('src/worker.ts', 'utf8');
code = code.replace(
  "const name = (cleanEmail === 'aseleliyeva77@gmail.com' || cleanEmail === 'mikrokosmosfansub@gmail.com') ? 'Aseleliyeva' : 'Mikrokosmos';",
  "const name = cleanEmail === 'aseleliyeva77@gmail.com' ? 'Aseleliyeva' : 'Mikrokosmos';"
);
fs.writeFileSync('src/worker.ts', code);
