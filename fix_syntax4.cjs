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

  // Regex across lines
  content = content.replace(/import React[\s\S]*?(?:return\s*\(trim\s*&&\s*!isNaN\(Number\(trim\)\)\)\s*\?\s*`\$\{trim\}px`\s*:\s*trim;\s*\};), {/, 'import React, {');
  content = content.replace(/import React[\s\S]*?(?:return\s*\(trim\s*&&\s*!isNaN\(Number\(trim\)\)\)\s*\?\s*`\$\{trim\}px`\s*:\s*trim;\s*\};)/, 'import React');

  fs.writeFileSync(file, content, 'utf8');
}

filesToPatch.forEach(patchFile);
