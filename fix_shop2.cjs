const fs = require('fs');

function fix(file) {
  let content = fs.readFileSync(file, 'utf8');
  const helper = `\nconst formatDim = (v?: string | number | null) => { if (!v && v !== 0) return undefined; const trim = String(v).trim(); return (trim && !isNaN(Number(trim))) ? \`\${trim}px\` : trim; };\n`;
  
  // Just replace the first "export const " with helper + "export const "
  if (content.includes('export const ')) {
      content = content.replace('export const ', helper + 'export const ');
  } else if (content.includes('export function ')) {
      content = content.replace('export function ', helper + 'export function ');
  } else {
      content = content.replace('const ', helper + 'const ');
  }

  fs.writeFileSync(file, content, 'utf8');
}

['src/components/ShopModal.tsx', 'src/components/UserProfileModal.tsx'].forEach(fix);
