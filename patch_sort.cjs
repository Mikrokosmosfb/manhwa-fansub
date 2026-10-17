const fs = require('fs');
let code = fs.readFileSync('src/components/CommentsSection.tsx', 'utf8');

const oldSort = `.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());`;
const newSort = `.sort((a, b) => {
      const timeA = new Date(a.date).getTime();
      const timeB = new Date(b.date).getTime();
      if (isNaN(timeA) && isNaN(timeB)) return 0;
      if (isNaN(timeA)) return 1;
      if (isNaN(timeB)) return -1;
      return timeB - timeA;
    });`;

const oldSortReplies = `.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());`;
const newSortReplies = `.sort((a, b) => {
      const timeA = new Date(a.date).getTime();
      const timeB = new Date(b.date).getTime();
      if (isNaN(timeA) && isNaN(timeB)) return 0;
      if (isNaN(timeA)) return -1;
      if (isNaN(timeB)) return 1;
      return timeA - timeB;
    });`;

code = code.replace(oldSort, newSort);
code = code.replace(oldSortReplies, newSortReplies);

fs.writeFileSync('src/components/CommentsSection.tsx', code);
console.log("Patched sorting for NaN dates.");
