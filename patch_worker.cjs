const fs = require('fs');

let code = fs.readFileSync('src/worker.ts', 'utf8');

// 1. Add column to table creation
const createTableSearch = `frame_offset_y REAL,
              frame_hide_border INTEGER DEFAULT 0,`;
const createTableReplace = `frame_offset_y REAL,
              frame_offset_x REAL,
              frame_hide_border INTEGER DEFAULT 0,`;
code = code.replace(createTableSearch, createTableReplace);

// 2. Add column fallback inside init function (to alter table)
const alterTableFallback = `try { await usersDb.prepare(\`ALTER TABLE shop_items ADD COLUMN frame_offset_y REAL;\`).run(); } catch(e){}`;
const alterTableFallbackNew = `try { await usersDb.prepare(\`ALTER TABLE shop_items ADD COLUMN frame_offset_y REAL;\`).run(); } catch(e){}
          try { await usersDb.prepare(\`ALTER TABLE shop_items ADD COLUMN frame_offset_x REAL;\`).run(); } catch(e){}`;
if (!code.includes("ADD COLUMN frame_offset_y")) {
    const insertAfter = `try { await usersDb.prepare(\`ALTER TABLE user_library ADD COLUMN claimed_checkin_days TEXT DEFAULT '[]';\`).run(); } catch(e){}`;
    code = code.replace(insertAfter, insertAfter + '\n          ' + alterTableFallbackNew);
} else {
    code = code.replace(`try { await usersDb.prepare(\`ALTER TABLE shop_items ADD COLUMN frame_offset_y REAL;\`).run(); } catch(e){}`, alterTableFallbackNew);
}

// 3. Add to SELECT mapping
const selectSearch = `frameOffsetY: i.frame_offset_y !== null && i.frame_offset_y !== undefined ? Number(i.frame_offset_y) : undefined,
                frameHideBorder: Boolean(i.frame_hide_border),`;
const selectReplace = `frameOffsetY: i.frame_offset_y !== null && i.frame_offset_y !== undefined ? Number(i.frame_offset_y) : undefined,
                frameOffsetX: i.frame_offset_x !== null && i.frame_offset_x !== undefined ? Number(i.frame_offset_x) : undefined,
                frameHideBorder: Boolean(i.frame_hide_border),`;
code = code.replace(selectSearch, selectReplace);

// 4. Add to INSERT mapping
const insertSearch = `id, name, category, theme_type, price, description, icon, rarity, badge_text, badge_style, frame_style, frame_image_url, frame_scale, frame_offset_y, frame_hide_border, emojis
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                  \`).bind(
                    item.id, item.name, item.category, item.themeType || '', item.price,
                    item.description || '', item.icon || '', item.rarity || '', item.badgeText || '',
                    item.badgeStyle || '', item.frameStyle || '', item.frameImageUrl || '',
                    item.frameScale || 135, item.frameOffsetY || 0, item.frameHideBorder ? 1 : 0,
                    item.emojis ? JSON.stringify(item.emojis) : ''
                  )`;
const insertReplace = `id, name, category, theme_type, price, description, icon, rarity, badge_text, badge_style, frame_style, frame_image_url, frame_scale, frame_offset_y, frame_offset_x, frame_hide_border, emojis
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                  \`).bind(
                    item.id, item.name, item.category, item.themeType || '', item.price,
                    item.description || '', item.icon || '', item.rarity || '', item.badgeText || '',
                    item.badgeStyle || '', item.frameStyle || '', item.frameImageUrl || '',
                    item.frameScale || 135, item.frameOffsetY || 0, item.frameOffsetX || 0, item.frameHideBorder ? 1 : 0,
                    item.emojis ? JSON.stringify(item.emojis) : ''
                  )`;
code = code.replace(insertSearch, insertReplace);

fs.writeFileSync('src/worker.ts', code);
console.log("Patched worker.ts");
