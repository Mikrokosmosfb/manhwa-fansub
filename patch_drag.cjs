const fs = require('fs');
let code = fs.readFileSync('src/components/AdminModal.tsx', 'utf8');

const oldPreview = `{/* Decorations Preview */}
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
                    ))}`;

const newPreview = `{/* Decorations Preview (Draggable) */}
                    {editingThemeStyle.decorations?.map((dec, idx) => (
                      <img
                        key={'prev_' + idx}
                        src={dec.imageUrl}
                        className="absolute cursor-move drop-shadow-lg hover:ring-2 hover:ring-amber-500/80 hover:bg-amber-500/10 rounded-lg transition-shadow"
                        onPointerDown={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          const startX = e.clientX;
                          const startY = e.clientY;
                          const startTop = parseFloat(dec.top) || 0;
                          const startLeft = parseFloat(dec.left) || 0;
                          
                          const handlePointerMove = (moveEvent) => {
                            const deltaX = moveEvent.clientX - startX;
                            const deltaY = moveEvent.clientY - startY;
                            setEditingThemeStyle((prev: any) => {
                              if (!prev || !prev.decorations) return prev;
                              const updated = [...prev.decorations];
                              updated[idx] = {
                                ...updated[idx],
                                top: \`\${startTop + deltaY}px\`,
                                left: \`\${startLeft + deltaX}px\`,
                                right: '',
                                bottom: ''
                              };
                              return { ...prev, decorations: updated };
                            });
                          };
                          const handlePointerUp = () => {
                            document.removeEventListener('pointermove', handlePointerMove);
                            document.removeEventListener('pointerup', handlePointerUp);
                          };
                          document.addEventListener('pointermove', handlePointerMove);
                          document.addEventListener('pointerup', handlePointerUp);
                        }}
                        style={{
                          top: dec.top || undefined,
                          bottom: dec.bottom || undefined,
                          left: dec.left || undefined,
                          right: dec.right || undefined,
                          width: dec.width || undefined,
                          transform: dec.rotation ? \`rotate(\${dec.rotation})\` : undefined,
                          zIndex: dec.zIndex !== undefined ? dec.zIndex : 20,
                          touchAction: 'none'
                        }}
                        title="Sürükleyip yerini değiştirebilirsiniz"
                        alt=""
                      />
                    ))}`;

if (code.includes('className="absolute pointer-events-none drop-shadow-lg"')) {
  code = code.replace(oldPreview, newPreview);
  fs.writeFileSync('src/components/AdminModal.tsx', code);
  console.log("Patched AdminModal.tsx for draggable decorations.");
} else {
  console.log("Target block not found. Regex check needed.");
}
