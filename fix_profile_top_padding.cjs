const fs = require('fs');

function replaceTopPadding(filePath) {
  let code = fs.readFileSync(filePath, 'utf8');
  
  // The current string we put in the last step
  const target = 'className="relative w-full overflow-hidden bg-slate-950 border-b border-purple-500/20 pt-16 sm:pt-24 pb-20 sm:pb-32 px-4 flex flex-col items-center justify-center text-center shadow-2xl"';
  // The new string with much larger top padding
  const replacement = 'className="relative w-full overflow-hidden bg-slate-950 border-b border-purple-500/20 pt-32 sm:pt-48 pb-20 sm:pb-32 px-4 flex flex-col items-center justify-center text-center shadow-2xl"';
  
  if (code.includes(target)) {
    code = code.replace(target, replacement);
    fs.writeFileSync(filePath, code);
    console.log("Patched " + filePath);
  } else {
    console.log("Target not found in " + filePath);
  }
}

replaceTopPadding('src/components/UserProfileModal.tsx');
replaceTopPadding('src/components/PublicProfileView.tsx');

function replaceAdminPreview(filePath) {
  let code = fs.readFileSync(filePath, 'utf8');
  
  const target = 'className="relative min-h-[400px] sm:min-h-[480px] flex items-center justify-center pt-16 sm:pt-24 pb-20 sm:pb-32 px-4 overflow-hidden rounded-3xl isolate border border-white/5 bg-gray-950 shadow-2xl mt-3"';
  const replacement = 'className="relative min-h-[450px] sm:min-h-[550px] flex items-center justify-center pt-32 sm:pt-48 pb-20 sm:pb-32 px-4 overflow-hidden rounded-3xl isolate border border-white/5 bg-gray-950 shadow-2xl mt-3"';
  
  if (code.includes(target)) {
    code = code.replace(target, replacement);
    fs.writeFileSync(filePath, code);
    console.log("Patched Admin Preview in " + filePath);
  } else {
    console.log("Admin preview target not found");
  }
}

replaceAdminPreview('src/components/AdminModal.tsx');

