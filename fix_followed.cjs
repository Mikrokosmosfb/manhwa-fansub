const fs = require('fs');
let code = fs.readFileSync('src/components/UserProfileModal.tsx', 'utf8');

const oldLogic = `  const followedSeries = seriesList ? seriesList.filter(s => followedSeriesIds.includes(s.id)) : [];`;
const newLogic = `  const bookmarkedSeriesIds = Object.keys(bookmarks || {});
  const followedSeries = seriesList ? seriesList.filter(s => 
    followedSeriesIds.some(id => String(id) === String(s.id)) || bookmarkedSeriesIds.includes(String(s.id))
  ) : [];`;

code = code.replace(oldLogic, newLogic);
fs.writeFileSync('src/components/UserProfileModal.tsx', code);
console.log('Fixed followedSeries logic');
