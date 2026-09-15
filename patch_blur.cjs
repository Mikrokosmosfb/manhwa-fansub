const fs = require('fs');
let commentsCode = fs.readFileSync('src/components/CommentsSection.tsx', 'utf8');

// Replace backdrop-blur-md with just a solid darker bg
commentsCode = commentsCode.replace(/bg-black\/60 backdrop-blur-md/g, 'bg-black/75');
commentsCode = commentsCode.replace(/bg-black\/50 backdrop-blur-md/g, 'bg-black/70');
fs.writeFileSync('src/components/CommentsSection.tsx', commentsCode);

let adminCode = fs.readFileSync('src/components/AdminModal.tsx', 'utf8');
adminCode = adminCode.replace(/bg-black\/60 backdrop-blur-md/g, 'bg-black/75');
adminCode = adminCode.replace(/bg-black\/50 backdrop-blur-md/g, 'bg-black/70');
fs.writeFileSync('src/components/AdminModal.tsx', adminCode);

console.log("Removed backdrop-blur-md to fix Android rendering glitches.");
