const fs = require('fs');
let code = fs.readFileSync('src/components/Header.tsx', 'utf8');

const shopBtnRegex = /(\{\/\* Shop Action Button \(Prominent\) \*\/\}[\s\S]*?<\/button>\s*)/;
const match = code.match(shopBtnRegex);

if (match) {
    const shopBtnCode = match[1];
    
    // Remove it from its current position
    code = code.replace(shopBtnCode, '');
    
    // Insert it before User Profile / Auth Button
    const userProfileRegex = /(\{\/\* User Profile \/ Auth Button \(Desktop Only \- Mobile uses Bottom Nav\) \*\/\}[\s\S]*?<div className="hidden md:block">)/;
    code = code.replace(userProfileRegex, shopBtnCode + '$1');
    
    fs.writeFileSync('src/components/Header.tsx', code);
    console.log("Reordered buttons in Header");
} else {
    console.log("Could not find shop button");
}
