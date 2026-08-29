const fs = require('fs');

let code = fs.readFileSync('src/components/UserProfileModal.tsx', 'utf8');

const search = `<div className="w-12 h-12 rounded-xl bg-purple-900/40 border border-purple-500/30 flex items-center justify-center text-2xl shrink-0">
                                {item.icon}
                              </div>`;
const replace = `{item.icon?.startsWith('http') || item.icon?.startsWith('/') ? (
                              <div className="w-12 h-12 rounded-xl bg-purple-900/40 border border-purple-500/30 flex items-center justify-center shrink-0 overflow-hidden p-1">
                                <img src={item.icon} alt={item.name} className="w-full h-full object-cover rounded-lg" />
                              </div>
                            ) : (
                              <div className="w-12 h-12 rounded-xl bg-purple-900/40 border border-purple-500/30 flex items-center justify-center text-2xl shrink-0">
                                {item.icon}
                              </div>
                            )}`;

if(code.includes(search)) {
    code = code.replace(search, replace);
    fs.writeFileSync('src/components/UserProfileModal.tsx', code);
    console.log('Fixed UserProfileModal icons');
} else {
    console.log('Search string not found in UserProfileModal');
}
