const fs = require('fs');
let code = fs.readFileSync('src/components/AdminModal.tsx', 'utf8');

code = code.replace(/Send\n\s*AlertOctagon/, 'Send,\n  AlertOctagon');

fs.writeFileSync('src/components/AdminModal.tsx', code);
console.log('Fixed comma');
