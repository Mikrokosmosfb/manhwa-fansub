const fs = require('fs');

function fixIconRendering(filePath) {
  let code = fs.readFileSync(filePath, 'utf8');
  
  // Replace {item.icon} when inside a span with the conditional rendering
  // We need to be careful with the exact match, it might vary slightly.
  
  if (filePath.includes('AdminModal')) {
    const searchAdmin = `<span className="text-xl">{item.icon}</span>`;
    const replaceAdmin = `{item.icon?.startsWith('http') || item.icon?.startsWith('/') ? (
                            <img src={item.icon} alt="icon" className="w-6 h-6 object-cover rounded-md" />
                          ) : (
                            <span className="text-xl">{item.icon}</span>
                          )}`;
    code = code.replace(searchAdmin, replaceAdmin);
  }

  if (filePath.includes('ShopModal')) {
    const searchShop = `<span className="text-2xl p-2 bg-gray-800/80 rounded-xl border border-gray-700/50 shadow-inner">
                      {item.icon}
                    </span>`;
    const replaceShop = `{item.icon?.startsWith('http') || item.icon?.startsWith('/') ? (
                      <div className="p-1.5 bg-gray-800/80 rounded-xl border border-gray-700/50 shadow-inner">
                        <img src={item.icon} alt={item.name} className="w-8 h-8 object-cover rounded-md" />
                      </div>
                    ) : (
                      <span className="text-2xl p-2 bg-gray-800/80 rounded-xl border border-gray-700/50 shadow-inner">
                        {item.icon}
                      </span>
                    )}`;
    code = code.replace(searchShop, replaceShop);
  }

  fs.writeFileSync(filePath, code);
}

fixIconRendering('src/components/AdminModal.tsx');
fixIconRendering('src/components/ShopModal.tsx');
console.log('Fixed icon renderings');
