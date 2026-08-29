const fs = require('fs');
let code = fs.readFileSync('src/data/shopData.ts', 'utf8');

const decorationInterface = `export interface ThemeDecoration {
  id: string;
  imageUrl: string;
  top?: string;
  right?: string;
  bottom?: string;
  left?: string;
  width?: string;
  rotation?: string;
  zIndex?: number;
}

`;

if (!code.includes('ThemeDecoration')) {
  code = code.replace(/export interface ThemeStyle \{/, decorationInterface + 'export interface ThemeStyle {');
  code = code.replace(/gothic_silver_filigree';\n\}/, "gothic_silver_filigree';\n  decorations?: ThemeDecoration[];\n}");
  fs.writeFileSync('src/data/shopData.ts', code);
  console.log("Patched shopData.ts");
} else {
  console.log("Already patched");
}
