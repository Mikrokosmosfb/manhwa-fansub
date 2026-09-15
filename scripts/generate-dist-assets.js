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

// 1. Subdirectory assets/
if (fs.existsSync(assetsDir)) {
  const assetFiles = fs.readdirSync(assetsDir);
  assetFiles.forEach(file => {
    const filePath = path.join(assetsDir, file);
    if (file.endsWith('.zip')) return;
    const content = fs.readFileSync(filePath, 'base64');
    assetsMap['assets/' + file] = content;
  });
}

// 2. Root files in dist (e.g. manifest.webmanifest, registerSW.js, sw.js, pwa icons)
const rootDistFiles = fs.readdirSync(distDir);
rootDistFiles.forEach(file => {
  const filePath = path.join(distDir, file);
  if (fs.statSync(filePath).isFile() && file !== 'index.html' && !file.endsWith('.zip')) {
    const content = fs.readFileSync(filePath, 'base64');
    assetsMap[file] = content;
  }
});

const tsContent = `// Auto-generated production assets for instant Cloudflare Pages direct upload ZIP
export const BUILT_INDEX_HTML = ${JSON.stringify(indexHtml)};

export const BUILT_ASSETS_BASE64: Record<string, string> = ${JSON.stringify(assetsMap, null, 2)};
`;

fs.writeFileSync(path.join(__dirname, '..', 'src', 'utils', 'distAssetsData.ts'), tsContent);
console.log('Successfully generated src/utils/distAssetsData.ts');
