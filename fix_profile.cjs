const fs = require('fs');
let code = fs.readFileSync('src/components/UserProfileModal.tsx', 'utf8');

// Remove the incorrect definition 
code = code.replace(
  "  const followedSeries = seriesList ? seriesList.filter(s => followedSeriesIds.includes(s.id)) : [];\n\n  const {",
  "  const {"
);

// Add it AFTER useApp destructuring
code = code.replace(
  "  } = useApp();",
  "  } = useApp();\n\n  const followedSeries = seriesList ? seriesList.filter(s => followedSeriesIds.includes(s.id)) : [];"
);

// Remove duplicated seriesList from destructuring if any
code = code.replace(
  /    seriesList,\n    seriesList/g,
  "    seriesList"
);

fs.writeFileSync('src/components/UserProfileModal.tsx', code);
console.log('Fixed UserProfileModal.tsx');
