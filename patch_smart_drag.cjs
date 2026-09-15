const fs = require('fs');
let code = fs.readFileSync('src/components/AdminModal.tsx', 'utf8');

const oldLogic = `const handlePointerUp = () => {
                            document.removeEventListener('pointermove', handlePointerMove);
                            document.removeEventListener('pointerup', handlePointerUp);
                          };`;

const newLogic = `const handlePointerUp = (upEvent) => {
                            document.removeEventListener('pointermove', handlePointerMove);
                            document.removeEventListener('pointerup', handlePointerUp);
                            
                            // Akıllı Konumlandırma (Sağa/Sola veya Alta/Üste sabitleme)
                            setEditingThemeStyle((prev: any) => {
                              if (!prev || !prev.decorations) return prev;
                              const updated = [...prev.decorations];
                              const currentDec = updated[idx];
                              const container = e.currentTarget.parentElement;
                              if (container) {
                                const cRect = container.getBoundingClientRect();
                                const iRect = e.currentTarget.getBoundingClientRect();
                                
                                const imgCenterX = iRect.left + iRect.width / 2;
                                const imgCenterY = iRect.top + iRect.height / 2;
                                const containerCenterX = cRect.left + cRect.width / 2;
                                const containerCenterY = cRect.top + cRect.height / 2;
                                
                                let finalTop = currentDec.top;
                                let finalBottom = '';
                                let finalLeft = currentDec.left;
                                let finalRight = '';
                                
                                if (imgCenterX > containerCenterX) {
                                  // Sağ yarıda ise sağa sabitle
                                  const distRight = Math.round(cRect.right - iRect.right);
                                  finalRight = \`\${distRight}px\`;
                                  finalLeft = '';
                                }
                                if (imgCenterY > containerCenterY) {
                                  // Alt yarıda ise alta sabitle
                                  const distBottom = Math.round(cRect.bottom - iRect.bottom);
                                  finalBottom = \`\${distBottom}px\`;
                                  finalTop = '';
                                }
                                
                                updated[idx] = { ...currentDec, top: finalTop, bottom: finalBottom, left: finalLeft, right: finalRight };
                              }
                              return { ...prev, decorations: updated };
                            });
                          };`;

if (code.includes(oldLogic)) {
  code = code.replace(oldLogic, newLogic);
  fs.writeFileSync('src/components/AdminModal.tsx', code);
  console.log("Patched AdminModal.tsx for smart dragging.");
} else {
  console.log("Target block not found.");
}
