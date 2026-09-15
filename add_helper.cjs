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

  if (!content.includes('const formatDim =')) {
    const helper = `\nconst formatDim = (v?: string | number | null) => { if (!v && v !== 0) return undefined; const trim = String(v).trim(); return (trim && !isNaN(Number(trim))) ? \`\${trim}px\` : trim; };\n`;
    
    // Add it after the imports
    let lastImportIndex = 0;
    const lines = content.split('\n');
    for(let i=0; i<lines.length; i++) {
        if(lines[i].startsWith('import ')) {
            lastImportIndex = i;
        }
    }
    
    lines.splice(lastImportIndex + 1, 0, helper);
    content = lines.join('\n');
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Added to ${file}`);
  }
}

filesToPatch.forEach(patchFile);
