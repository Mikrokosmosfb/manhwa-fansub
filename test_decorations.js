const fs = require('fs');
let code = fs.readFileSync('src/components/AdminModal.tsx', 'utf8');

console.log("Profile dec input:", code.includes('const u = [...editingThemeStyle.profileDecorations!]; u[idx].imageUrl = e.target.value;'));
console.log("Decorations input:", code.includes('const u = [...editingThemeStyle.decorations!]; u[idx].imageUrl = e.target.value;'));

