const fs = require('fs');
let code = fs.readFileSync('src/components/AdminModal.tsx', 'utf8');

const target = `                        onPointerDown={(e) => {
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

const replacement = `                        onPointerDown={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          
                          const target = e.currentTarget;
                          const container = target.parentElement;
                          if (!container) return;
                          
                          target.setPointerCapture(e.pointerId);
                          
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
                            target.removeEventListener('pointermove', handlePointerMove);
                            target.removeEventListener('pointerup', handlePointerUp);
                            target.removeEventListener('pointercancel', handlePointerUp);
                            try { target.releasePointerCapture(upEvent.pointerId); } catch(err){}
                            
                            // Akıllı Konumlandırma
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
                          
                          target.addEventListener('pointermove', handlePointerMove);
                          target.addEventListener('pointerup', handlePointerUp);
                          target.addEventListener('pointercancel', handlePointerUp);
                        }}`;

if (code.includes(target)) {
  code = code.replace(target, replacement);
  fs.writeFileSync('src/components/AdminModal.tsx', code);
  console.log("Patched AdminModal.tsx for mobile pointer capture dragging.");
} else {
  console.log("Target block not found in AdminModal.tsx");
}
