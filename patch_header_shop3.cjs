const fs = require('fs');
let code = fs.readFileSync('src/components/Header.tsx', 'utf8');

code = code.replace(
  'group-hover:animate-[shimmer_1s_infinite]',
  'group-hover:translate-x-[200%] transition-transform duration-700'
);

fs.writeFileSync('src/components/Header.tsx', code);
console.log('Fixed shimmer class');
