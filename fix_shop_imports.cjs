const fs = require('fs');
let code = fs.readFileSync('src/components/ShopModal.tsx', 'utf8');

code = code.replace(/CalendarDays\n\s*AlertOctagon/, 'CalendarDays,\n  AlertOctagon');

fs.writeFileSync('src/components/ShopModal.tsx', code);
console.log('Fixed syntax error in imports');
