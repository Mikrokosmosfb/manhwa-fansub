const fs = require('fs');
let code = fs.readFileSync('src/worker.ts', 'utf8');

// 1. Add column
code = code.replace(
  "try { await usersDb.prepare(`ALTER TABLE theme_styles ADD COLUMN decorations TEXT;`).run(); } catch(e){}",
  "try { await usersDb.prepare(`ALTER TABLE theme_styles ADD COLUMN decorations TEXT;`).run(); } catch(e){}\n          try { await usersDb.prepare(`ALTER TABLE theme_styles ADD COLUMN profile_decorations TEXT;`).run(); } catch(e){}"
);

// 2. Read map
code = code.replace(
  "decorations: i.decorations ? JSON.parse(i.decorations) : undefined",
  "decorations: i.decorations ? JSON.parse(i.decorations) : undefined,\n                profileDecorations: i.profile_decorations ? JSON.parse(i.profile_decorations) : undefined"
);

// 3. Write map
code = code.replace(
  "ts.decorations ? JSON.stringify(ts.decorations) : ''",
  "ts.decorations ? JSON.stringify(ts.decorations) : '',\n                    ts.profileDecorations ? JSON.stringify(ts.profileDecorations) : ''"
);

// 4. Update INSERT query
code = code.replace(
  "(id, name, card_class, avatar_border_class, name_class, badge_bg_class, glow_color, accent_text, card_bg_image_url, effect_overlay, theme_type, corner_mascot_url, corner_mascot_position, avatar_companion_url, decorations) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
  "(id, name, card_class, avatar_border_class, name_class, badge_bg_class, glow_color, accent_text, card_bg_image_url, effect_overlay, theme_type, corner_mascot_url, corner_mascot_position, avatar_companion_url, decorations, profile_decorations) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
);

fs.writeFileSync('src/worker.ts', code);
console.log("Patched worker.ts successfully.");
