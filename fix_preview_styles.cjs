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

  // Insert helper if not exists
  if (!content.includes('const formatDim = ')) {
    content = content.replace('import React', 'import React\nconst formatDim = (v?: string | null) => { if (!v) return undefined; const trim = String(v).trim(); return (trim && !isNaN(Number(trim))) ? `${trim}px` : trim; };\n');
  }

  // Replace style keys
  const props = ['top', 'bottom', 'left', 'right', 'width'];
  let changes = 0;
  props.forEach(prop => {
    // looking for: prop: dec.prop || undefined,
    // or prop: dec.prop,
    // we can use regex
    const regex = new RegExp(`${prop}:\\s*dec\\.${prop}(?:\\s*\\|\\|\\s*undefined)?,?`, 'g');
    content = content.replace(regex, match => {
      changes++;
      return `${prop}: formatDim(dec.${prop}),`;
    });
  });

  fs.writeFileSync(file, content, 'utf8');
  console.log(`${file}: ${changes} changes made.`);
}

filesToPatch.forEach(patchFile);
