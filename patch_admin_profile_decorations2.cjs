const fs = require('fs');
let code = fs.readFileSync('src/components/AdminModal.tsx', 'utf8');
console.log("Cihazdan is present: ", code.includes("Cihazdan"));
