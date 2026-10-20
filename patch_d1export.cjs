const fs = require('fs');
let code = fs.readFileSync('src/utils/cloudflareD1Export.ts', 'utf8');

const target1 = `theme_type TEXT
);`;
const replacement1 = `theme_type TEXT,
    decorations TEXT
);`;
code = code.replace(target1, replacement1);

const target2 = `const columns = [
        'id', 'name', 'card_class', 'avatar_border_class', 'name_class',
        'badge_bg_class', 'glow_color', 'accent_text', 'card_bg_image_url',
        'effect_overlay', 'theme_type'
      ];`;
const replacement2 = `const columns = [
        'id', 'name', 'card_class', 'avatar_border_class', 'name_class',
        'badge_bg_class', 'glow_color', 'accent_text', 'card_bg_image_url',
        'effect_overlay', 'theme_type', 'decorations'
      ];`;
code = code.replace(target2, replacement2);

const target3 = `const valMap: Record<string, any> = {
        id: ts.id,
        name: ts.name,
        card_class: ts.cardClass || null,
        avatar_border_class: ts.avatarBorderClass || null,
        name_class: ts.nameClass || null,
        badge_bg_class: ts.badgeBgClass || null,
        glow_color: ts.glowColor || null,
        accent_text: ts.accentText || null,
        card_bg_image_url: ts.cardBgImageUrl || null,
        effect_overlay: ts.effectOverlay || null,
        theme_type: ts.themeType || null
      };`;
const replacement3 = `const valMap: Record<string, any> = {
        id: ts.id,
        name: ts.name,
        card_class: ts.cardClass || null,
        avatar_border_class: ts.avatarBorderClass || null,
        name_class: ts.nameClass || null,
        badge_bg_class: ts.badgeBgClass || null,
        glow_color: ts.glowColor || null,
        accent_text: ts.accentText || null,
        card_bg_image_url: ts.cardBgImageUrl || null,
        effect_overlay: ts.effectOverlay || null,
        theme_type: ts.themeType || null,
        decorations: ts.decorations ? JSON.stringify(ts.decorations) : null
      };`;
code = code.replace(target3, replacement3);

fs.writeFileSync('src/utils/cloudflareD1Export.ts', code);
console.log("Patched cloudflareD1Export.ts for decorations.");
