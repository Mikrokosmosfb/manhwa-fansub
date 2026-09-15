const fs = require('fs');

function injectDecorations(filepath) {
  let code = fs.readFileSync(filepath, 'utf8');
  const anchorStr = '{/* 🎬 MÜKEMMEL SİNEMATİK GEÇİŞ';
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
    fs.writeFileSync(filepath, code);
    console.log("Patched " + filepath);
  }
}

injectDecorations('src/components/UserProfileModal.tsx');
injectDecorations('src/components/PublicProfileView.tsx');

