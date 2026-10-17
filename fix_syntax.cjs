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

  // Fix syntax error
  content = content.replace("import Reactconst formatDim = (v?: string | null) => { if (!v) return undefined; const trim = String(v).trim(); return (trim && !isNaN(Number(trim))) ? `${trim}px` : trim; };, {", "import React, {");
  
  content = content.replace("import Reactconst formatDim = (v?: string | null) => { if (!v) return undefined; const trim = String(v).trim(); return (trim && !isNaN(Number(trim))) ? `${trim}px` : trim; };", "import React");
  
  // Add formatDim properly after imports
  if (content.includes('formatDim') && !content.includes('const formatDim =')) {
    // it means we removed it above, so we need to put it back properly.
  }
  
  const helper = `\nconst formatDim = (v?: string | number | null) => { if (!v && v !== 0) return undefined; const trim = String(v).trim(); return (trim && !isNaN(Number(trim))) ? \`\${trim}px\` : trim; };\n`;
  if (!content.includes('const formatDim =')) {
    // Add it after the last import
    const lines = content.split('\n');
    let lastImportIdx = -1;
    for(let i=0; i<lines.length; i++) {
        if(lines[i].startsWith('import ')) lastImportIdx = i;
    }
    lines.splice(lastImportIdx + 1, 0, helper);
    content = lines.join('\n');
  }

  fs.writeFileSync(file, content, 'utf8');
}

filesToPatch.forEach(patchFile);
