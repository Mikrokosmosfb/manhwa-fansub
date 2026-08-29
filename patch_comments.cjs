const fs = require('fs');
let code = fs.readFileSync('src/components/CommentsSection.tsx', 'utf8');

const decorUI = `
        {/* Theme Decorations (Chibis/PNGs) */}
        {themeStyle?.decorations?.map((dec, idx) => (
          <img
            key={dec.id || idx}
            src={dec.imageUrl}
            className="absolute pointer-events-none drop-shadow-lg"
            style={{
              top: dec.top || undefined,
              bottom: dec.bottom || undefined,
              left: dec.left || undefined,
              right: dec.right || undefined,
              width: dec.width || undefined,
              transform: dec.rotation ? \`rotate(\${dec.rotation})\` : undefined,
              zIndex: dec.zIndex !== undefined ? dec.zIndex : 20
            }}
            alt=""
          />
        ))}
`;

const insertionPoint = `<ThemeBackgroundEffects effectOverlay={themeStyle?.effectOverlay} />`;
if (code.includes(insertionPoint)) {
  code = code.replace(insertionPoint, insertionPoint + "\n" + decorUI);
  fs.writeFileSync('src/components/CommentsSection.tsx', code);
  console.log("Patched CommentsSection.tsx successfully.");
} else {
  console.log("Insertion point not found.");
}
