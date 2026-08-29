const fs = require('fs');

let code = fs.readFileSync('src/components/PublicProfileView.tsx', 'utf8');
const anchorStr = '{/* 🎬 Overlays */}';
const decorationBlock = `
        {/* ✨ Theme Profile Decorations (Chibis/PNGs) */}
        {activeThemeStyle?.profileDecorations?.map((dec, idx) => (
          <img
            key={dec.id || idx}
            src={dec.imageUrl}
            alt=""
            className="absolute pointer-events-none select-none drop-shadow-lg"
            style={{
              top: dec.top,
              right: dec.right,
              bottom: dec.bottom,
              left: dec.left,
              width: dec.width,
              transform: dec.rotation ? \`rotate(\${dec.rotation})\` : undefined,
              zIndex: dec.zIndex !== undefined ? dec.zIndex : 30,
            }}
          />
        ))}

        `;
        
if (code.includes(anchorStr) && !code.includes('Theme Profile Decorations')) {
  code = code.replace(anchorStr, decorationBlock + anchorStr);
  fs.writeFileSync('src/components/PublicProfileView.tsx', code);
  console.log("Patched PublicProfileView.tsx");
}

