import fs from 'fs';
let code = fs.readFileSync('src/context/AppContext.tsx', 'utf8');

code = code.replace(
  /const openPublicProfile = \(uid: string\) => \{ setViewInternal\(\{ type: 'public-profile', userId: uid \}\); window\.history\.pushState\(null, '', `\#\/kullanici\/\$\{uid\}`\); \};/,
  "const openPublicProfile = (uid: string) => setView({ type: 'public-profile', userId: uid });"
);

fs.writeFileSync('src/context/AppContext.tsx', code);
