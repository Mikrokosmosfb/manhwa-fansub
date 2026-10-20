const fs = require('fs');
let code = fs.readFileSync('src/components/AdminModal.tsx', 'utf8');

const target = 'className="relative min-h-[450px] sm:min-h-[550px] flex items-center justify-center pt-32 sm:pt-48 pb-20 sm:pb-32 px-4 overflow-hidden rounded-3xl isolate border border-white/5 bg-gray-950 shadow-2xl mt-3"';
const replacement = 'className="relative min-h-[450px] sm:min-h-[550px] flex flex-col items-center justify-center pt-32 sm:pt-48 pb-20 sm:pb-32 px-4 overflow-hidden rounded-3xl isolate border border-white/5 bg-gray-950 shadow-2xl mt-3"';

if (code.includes(target)) {
  code = code.replace(target, replacement);
  fs.writeFileSync('src/components/AdminModal.tsx', code);
  console.log("Patched container AdminModal.tsx");
}

