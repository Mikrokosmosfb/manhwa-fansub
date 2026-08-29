const fs = require('fs');

let code = fs.readFileSync('src/components/UserAvatar.tsx', 'utf8');

// 1. Add prop type
code = code.replace(`customFrameOffsetY?: number;`, `customFrameOffsetY?: number;\n  customFrameOffsetX?: number;`);

// 2. Add destructured prop
code = code.replace(`customFrameOffsetY,\n  customFrameHideBorder`, `customFrameOffsetY,\n  customFrameOffsetX,\n  customFrameHideBorder`);

// 3. Resolve activeFrameOffsetX
const activeOffsetSearch = `const activeFrameOffsetY = customFrameOffsetY !== undefined ? customFrameOffsetY : (resolvedFrameItem?.frameOffsetY || 0);`;
const activeOffsetReplace = `const activeFrameOffsetY = customFrameOffsetY !== undefined ? customFrameOffsetY : (resolvedFrameItem?.frameOffsetY || 0);
  const activeFrameOffsetX = customFrameOffsetX !== undefined ? customFrameOffsetX : (resolvedFrameItem?.frameOffsetX || 0);`;
code = code.replace(activeOffsetSearch, activeOffsetReplace);

// 4. Update transform for both video and img
const transformSearch = `transform: \`translate(-50%, calc(-50% + \${activeFrameOffsetY}%))\``;
const transformReplace = `transform: \`translate(calc(-50% + \${activeFrameOffsetX}%), calc(-50% + \${activeFrameOffsetY}%))\``;

// This should replace both occurrences
code = code.split(transformSearch).join(transformReplace);

fs.writeFileSync('src/components/UserAvatar.tsx', code);
console.log("Patched UserAvatar.tsx");
