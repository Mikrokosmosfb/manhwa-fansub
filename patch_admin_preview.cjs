const fs = require('fs');
let code = fs.readFileSync('src/components/AdminModal.tsx', 'utf8');

const decorPreview = `
                    {/* Decorations Preview */}
                    {editingThemeStyle.decorations?.map((dec, idx) => (
                      <img
                        key={'prev_' + idx}
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

const insertionPoint = `<ThemeBackgroundEffects effectOverlay={editingThemeStyle.effectOverlay} />`;
if (code.includes(insertionPoint)) {
  code = code.replace(insertionPoint, insertionPoint + "\n" + decorPreview);
  fs.writeFileSync('src/components/AdminModal.tsx', code);
  console.log("Patched AdminModal.tsx Preview successfully.");
} else {
  console.log("Insertion point not found.");
}
