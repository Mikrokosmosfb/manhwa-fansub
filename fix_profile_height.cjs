const fs = require('fs');

function replaceHeight(filePath) {
  let code = fs.readFileSync(filePath, 'utf8');
  const target = 'className="relative w-full overflow-hidden bg-slate-950 border-b border-purple-500/20 pt-10 sm:pt-14 pb-14 sm:pb-20 px-4 flex flex-col items-center justify-center text-center shadow-2xl"';
  const replacement = 'className="relative w-full overflow-hidden bg-slate-950 border-b border-purple-500/20 pt-16 sm:pt-24 pb-20 sm:pb-32 px-4 flex flex-col items-center justify-center text-center shadow-2xl"';
  if (code.includes(target)) {
    code = code.replace(target, replacement);
    fs.writeFileSync(filePath, code);
    console.log("Patched " + filePath);
  }
}

replaceHeight('src/components/UserProfileModal.tsx');
replaceHeight('src/components/PublicProfileView.tsx');

