const fs = require('fs');
let code = fs.readFileSync('src/components/AdminModal.tsx', 'utf8');

const target = `                        onPointerDown={(e) => {
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
                          const handlePointerUp = (upEvent) => {
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
                          };
                          document.addEventListener('pointermove', handlePointerMove);
                          document.addEventListener('pointerup', handlePointerUp);
                        }}`;

const replacement = `                        onPointerDown={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          
                          const target = e.currentTarget;
                          const container = target.parentElement;
                          if (!container) return;
                          
                          const cRect = container.getBoundingClientRect();
                          const iRect = target.getBoundingClientRect();
                          
                          const startX = e.clientX;
                          const startY = e.clientY;
                          
                          const startLeft = iRect.left - cRect.left;
                          const startTop = iRect.top - cRect.top;
                          
                          const handlePointerMove = (moveEvent) => {
                            const deltaX = moveEvent.clientX - startX;
                            const deltaY = moveEvent.clientY - startY;
                            setEditingThemeStyle((prev: any) => {
                              if (!prev || !prev.decorations) return prev;
                              const updated = [...prev.decorations];
                              updated[idx] = {
                                ...updated[idx],
                                top: \`\${Math.round(startTop + deltaY)}px\`,
                                left: \`\${Math.round(startLeft + deltaX)}px\`,
                                right: '',
                                bottom: ''
                              };
                              return { ...prev, decorations: updated };
                            });
                          };
                          
                          const handlePointerUp = (upEvent) => {
                            document.removeEventListener('pointermove', handlePointerMove);
                            document.removeEventListener('pointerup', handlePointerUp);
                            
                            // Akıllı Konumlandırma (Yüzdelik ile kaydetme - Responsive uyum için)
                            setEditingThemeStyle((prev: any) => {
                              if (!prev || !prev.decorations) return prev;
                              const updated = [...prev.decorations];
                              
                              const cRectEnd = container.getBoundingClientRect();
                              const iRectEnd = target.getBoundingClientRect();
                              
                              const leftPx = iRectEnd.left - cRectEnd.left;
                              const topPx = iRectEnd.top - cRectEnd.top;
                              const rightPx = cRectEnd.right - iRectEnd.right;
                              const bottomPx = cRectEnd.bottom - iRectEnd.bottom;
                              
                              let finalLeft = '';
                              let finalRight = '';
                              let finalTop = '';
                              let finalBottom = '';
                              
                              if (leftPx < rightPx) {
                                finalLeft = \`\${Math.round(leftPx)}px\`;
                              } else {
                                finalRight = \`\${Math.round(rightPx)}px\`;
                              }
                              
                              if (topPx < bottomPx) {
                                finalTop = \`\${Math.round(topPx)}px\`;
                              } else {
                                finalBottom = \`\${Math.round(bottomPx)}px\`;
                              }
                              
                              updated[idx] = { 
                                ...updated[idx], 
                                top: finalTop, 
                                bottom: finalBottom, 
                                left: finalLeft, 
                                right: finalRight 
                              };
                              
                              return { ...prev, decorations: updated };
                            });
                          };
                          document.addEventListener('pointermove', handlePointerMove);
                          document.addEventListener('pointerup', handlePointerUp);
                        }}`;

if (code.includes(target)) {
  code = code.replace(target, replacement);
  fs.writeFileSync('src/components/AdminModal.tsx', code);
  console.log("Patched AdminModal.tsx for smooth smart dragging.");
} else {
  console.log("Target block not found in AdminModal.tsx");
}
