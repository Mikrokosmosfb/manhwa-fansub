const fs = require('fs');
let code = fs.readFileSync('src/components/ShopModal.tsx', 'utf8');

const importRegex = /\} from 'lucide-react';/;
if (code.match(importRegex)) {
  code = code.replace(importRegex, '  AlertOctagon,\n  ThumbsUp,\n  ThumbsDown,\n  CornerDownRight\n} from \'lucide-react\';');
  fs.writeFileSync('src/components/ShopModal.tsx', code);
  console.log('Added missing icons to ShopModal');
}
