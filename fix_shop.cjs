const fs = require('fs');

function fix(file) {
  let content = fs.readFileSync(file, 'utf8');
  
  // Remove the badly placed helper
  const helper = `const formatDim = (v?: string | number | null) => { if (!v && v !== 0) return undefined; const trim = String(v).trim(); return (trim && !isNaN(Number(trim))) ? \`\${trim}px\` : trim; };`;
  content = content.replace(helper, '');
  
  // Replace multiple empty lines if any created
  content = content.replace(/\n\s*\n\s*\n/g, '\n\n');
  
  // Put it right before the first component declaration or export
  // Just find "export const " or "export function " or "const " (that is not formatDim)
  // Actually, we can just put it after all imports by finding the last "from '...';" or "from \"...\";" or "import '...';"
  
  fs.writeFileSync(file, content, 'utf8');
}

['src/components/ShopModal.tsx', 'src/components/UserProfileModal.tsx'].forEach(fix);
