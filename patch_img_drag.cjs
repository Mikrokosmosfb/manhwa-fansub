const fs = require('fs');
let code = fs.readFileSync('src/components/AdminModal.tsx', 'utf8');

code = code.replace(/title="Sürükleyip yerini değiştirebilirsiniz"/g, 'title="Sürükleyip yerini değiştirebilirsiniz" draggable={false}');
fs.writeFileSync('src/components/AdminModal.tsx', code);
console.log("Added draggable={false}");
