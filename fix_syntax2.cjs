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

  // Regex to remove the wrongly inserted formatDim on the first line
  content = content.replace(/import Reactconst formatDim = [^;]+;/, 'import React');

  fs.writeFileSync(file, content, 'utf8');
}

filesToPatch.forEach(patchFile);
