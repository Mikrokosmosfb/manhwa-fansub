import JSZip from 'jszip';

export async function downloadProjectZip() {
  const zip = new JSZip();

  // Root config files
  zip.file('package.json', JSON.stringify({
    name: "mikrokosmos-web-novel-manhwa",
    private: true,
    version: "1.0.0",
    type: "module",
    scripts: {
      dev: "vite --port=3000 --host=0.0.0.0",
      build: "vite build",
      preview: "vite preview",
      lint: "tsc --noEmit"
    },
    dependencies: {
      "@google/genai": "^2.4.0",
      "@tailwindcss/vite": "^4.1.14",
      "@vitejs/plugin-react": "^5.0.4",
      "lucide-react": "^0.546.0",
      "react": "^19.0.1",
      "react-dom": "^19.0.1",
      "vite": "^6.2.3",
      "express": "^4.21.2",
      "dotenv": "^17.2.3",
      "motion": "^12.23.24"
    },
    devDependencies: {
      "@types/node": "^22.14.0",
      "autoprefixer": "^10.4.21",
      "esbuild": "^0.25.0",
      "tailwindcss": "^4.1.14",
      "tsx": "^4.21.0",
      "typescript": "~5.8.2",
      "@types/express": "^4.17.21"
    }
  }, null, 2));

  zip.file('index.html', `<!DOCTYPE html>
<html lang="tr">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Mikrokosmos - Manhwa & Web Novel</title>
  </head>
  <body class="bg-gray-950 text-white min-h-screen">
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>`);

  zip.file('vite.config.ts', `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
});`);

  zip.file('tsconfig.json', `{
  "compilerOptions": {
    "target": "ES2022",
    "useDefineForClassFields": true,
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": false,
    "unusedLocals": false
  },
  "include": ["src"]
}`);

  zip.file('README.md', `# Mikrokosmos Web Novel & Manhwa Platformu

## Kurulum ve Çalıştırma

\`\`\`bash
npm install
npm run dev
npm run build
\`\`\`
`);

  // Dynamically import only source code files as raw text (exclude large images/assets)
  const srcModules = import.meta.glob(['/src/**/*.ts', '/src/**/*.tsx', '/src/**/*.css', '/src/**/*.js'], { query: '?raw', eager: true }) as Record<string, { default: string } | string>;

  for (const path in srcModules) {
    const rawContent = typeof srcModules[path] === 'string' 
      ? (srcModules[path] as string)
      : (srcModules[path] as { default: string }).default;

    const zipPath = path.startsWith('/') ? path.slice(1) : path;
    zip.file(zipPath, rawContent);
  }

  const blob = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'mikrokosmos-proje-kodlari.zip';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
