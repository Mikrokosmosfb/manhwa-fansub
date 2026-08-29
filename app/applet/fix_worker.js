import fs from 'fs';
let code = fs.readFileSync('src/worker.ts', 'utf8');

const adminStartMarker = '// ADMIN GRANT POINTS';
const authStartMarker = '// AUTHENTICATION API';

const adminStartIndex = code.indexOf(adminStartMarker);
const authStartIndex = code.indexOf(authStartMarker);

if (adminStartIndex !== -1 && authStartIndex !== -1 && adminStartIndex > authStartIndex) {
  const legacyMarker = '// GET ALL USERS (Legacy)';
  const legacyIndex = code.indexOf(legacyMarker, adminStartIndex);
  
  if (legacyIndex !== -1) {
    const adminBlock = code.substring(adminStartIndex, legacyIndex);
    code = code.substring(0, adminStartIndex) + code.substring(legacyIndex);
    
    const newAuthIndex = code.indexOf(authStartMarker);
    code = code.substring(0, newAuthIndex) + '\n        // ADMIN API\n        ' + adminBlock + '\n\n        ' + code.substring(newAuthIndex);
    
    fs.writeFileSync('src/worker.ts', code, 'utf8');
    console.log('Successfully moved admin endpoints out of /api/auth to top-level!');
  } else {
    console.log('Legacy marker not found');
  }
} else {
  console.log('Admin block not found or already outside /api/auth');
}
