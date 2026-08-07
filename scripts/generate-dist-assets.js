const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('Building Vite production assets...');
execSync('npm run build', { stdio: 'inherit' });

const distDir = path.join(__dirname, '..', 'dist');
const indexHtml = fs.readFileSync(path.join(distDir, 'index.html'), 'utf-8');
const assetsDir = path.join(distDir, 'assets');
const assetFiles = fs.readdirSync(assetsDir);

const assetsMap = {};

assetFiles.forEach(file => {
  const filePath = path.join(assetsDir, file);
  if (file.endsWith('.zip')) return;
  const content = fs.readFileSync(filePath, 'base64');
  assetsMap['assets/' + file] = content;
});

const tsContent = `// Auto-generated production assets for instant Cloudflare Pages direct upload ZIP
export const BUILT_INDEX_HTML = ${JSON.stringify(indexHtml)};

export const BUILT_ASSETS_BASE64: Record<string, string> = ${JSON.stringify(assetsMap, null, 2)};
`;

fs.writeFileSync(path.join(__dirname, '..', 'src', 'utils', 'distAssetsData.ts'), tsContent);
console.log('Successfully generated src/utils/distAssetsData.ts');
