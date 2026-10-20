const fs = require('fs');
let code = fs.readFileSync('src/components/ShopModal.tsx', 'utf8');

const startStr = `<div
                      style={
                        themeStyle.cardBgImageUrl
                          ? {
                              backgroundImage: \`url(\${themeStyle.cardBgImageUrl})\`,`;
const endStr = `<span>Yanıtla</span>
                          </button>
                        </div>
                      </div>
                    </div>`;

const startIndex = code.indexOf(startStr);
const endIndex = code.indexOf(endStr) + endStr.length;

console.log(code.substring(startIndex, endIndex));
