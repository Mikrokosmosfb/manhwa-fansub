const fs = require('fs');
const filesToPatch = [
  'src/components/AdminModal.tsx',
  'src/components/ChibiThemeCreator.tsx',
  'src/components/UserProfileModal.tsx',
  'src/components/ShopModal.tsx',
  'src/components/CommentsSection.tsx',
  'src/components/PublicProfileView.tsx'
];

function patchFile(file) {
  if (!fs.existsSync(file)) return;
  let content = fs.readFileSync(file, 'utf8');

  // Exact match replacement
  const badStr = 'import Reactconst formatDim = (v?: string | null) => { if (!v) return undefined; const trim = String(v).trim(); return (trim && !isNaN(Number(trim))) ? `${trim}px` : trim; };';
  content = content.replace(badStr, 'import React');

  fs.writeFileSync(file, content, 'utf8');
}

filesToPatch.forEach(patchFile);
