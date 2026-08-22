import { Series, Comment } from '../types';
import { ShopItem, ThemeStyle } from '../data/shopData';

/**
 * Generates SQL statements compatible with Cloudflare D1 SQLite database
 */
export function generateCloudflareD1Sql(
  seriesList: Series[],
  commentsList: Comment[] = [],
  shopItemsList: ShopItem[] = [],
  themeStylesMap: Record<string, ThemeStyle> = {}
): string {
  let sql = `-- ============================================================
-- CLOUDFLARE D1 VERİTABANI YEDEK & VERİ AKTARIM SQL SCRIPT'İ
-- Oluşturulma Tarihi: ${new Date().toLocaleString('tr-TR')}
-- ============================================================
-- Cloudflare D1 veritabanınıza aktarmak için terminalden çalıştırın:
-- npx wrangler d1 execute YOUR_DB_NAME --file=./cloudflare-d1-export.sql
-- ============================================================

-- Tabloları Oluştur (Yoksa)
CREATE TABLE IF NOT EXISTS series (
    id TEXT PRIMARY KEY,
    slug TEXT,
    title TEXT NOT NULL,
    type TEXT NOT NULL,
    cover_image TEXT NOT NULL,
    banner_image TEXT,
    synopsis TEXT,
    genres_json TEXT DEFAULT '[]',
    rating REAL DEFAULT 5.0,
    status TEXT DEFAULT 'Devam Ediyor',
    author TEXT,
    artist TEXT,
    translator TEXT,
    release_day TEXT,
    release_time TEXT,
    is_hot INTEGER DEFAULT 0,
    is_new INTEGER DEFAULT 0,
    is_guncel INTEGER DEFAULT 1,
    is_18_plus INTEGER DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS chapters (
    id TEXT PRIMARY KEY,
    series_id TEXT NOT NULL,
    chapter_number REAL NOT NULL,
    title TEXT NOT NULL,
    published_date TEXT,
    special_tag TEXT,
    images_json TEXT DEFAULT '[]',
    content TEXT,
    notice TEXT,
    created_at INTEGER,
    FOREIGN KEY(series_id) REFERENCES series(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS comments (
    id TEXT PRIMARY KEY,
    series_id TEXT NOT NULL,
    chapter_id TEXT,
    user_id TEXT NOT NULL,
    user_name TEXT NOT NULL,
    user_avatar TEXT,
    text TEXT NOT NULL,
    image_url TEXT,
    parent_id TEXT,
    is_spoiler INTEGER DEFAULT 0,
    likes_json TEXT DEFAULT '[]',
    dislikes_json TEXT DEFAULT '[]',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS shop_items (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    theme_type TEXT,
    price INTEGER NOT NULL,
    description TEXT,
    icon TEXT,
    rarity TEXT,
    badge_text TEXT
);

CREATE TABLE IF NOT EXISTS theme_styles (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    card_class TEXT,
    avatar_border_class TEXT,
    name_class TEXT,
    badge_bg_class TEXT,
    glow_color TEXT,
    accent_text TEXT,
    card_bg_image_url TEXT,
    effect_overlay TEXT,
    theme_type TEXT
);

-- ============================================================
-- VERİ EKLEME (INSERT INSTRUCTIONS)
-- ============================================================

`;

  // Escape single quotes for SQL
  const esc = (str?: string) => {
    if (!str) return 'NULL';
    return `'${str.replace(/'/g, "''")}'`;
  };

  // Series SQL
  seriesList.forEach(s => {
    const genresJson = JSON.stringify(s.genres || []);
    sql += `INSERT OR REPLACE INTO series (
      id, slug, title, type, cover_image, banner_image, synopsis, genres_json,
      rating, status, author, artist, translator, release_day, release_time,
      is_hot, is_new, is_guncel, is_18_plus, updated_at
    ) VALUES (
      ${esc(s.id)}, ${esc(s.slug || '')}, ${esc(s.title)}, ${esc(s.type)}, ${esc(s.coverImage)},
      ${esc(s.bannerImage)}, ${esc(s.synopsis)}, ${esc(genresJson)}, ${s.rating || 5.0},
      ${esc(s.status)}, ${esc(s.author)}, ${esc(s.artist)}, ${esc(s.translator)},
      ${esc(s.releaseDay)}, ${esc(s.releaseTime)}, ${s.isHot ? 1 : 0}, ${s.isNew ? 1 : 0},
      ${s.isGuncel ? 1 : 0}, ${s.is18Plus ? 1 : 0}, ${esc(s.updatedAt || new Date().toISOString())}
    );\n`;

    // Chapters SQL
    (s.chapters || []).forEach(ch => {
      const imagesJson = JSON.stringify(ch.images || []);
      sql += `INSERT OR REPLACE INTO chapters (
        id, series_id, chapter_number, title, published_date, special_tag,
        images_json, content, notice, created_at
      ) VALUES (
        ${esc(ch.id)}, ${esc(s.id)}, ${ch.number}, ${esc(ch.title)}, ${esc(ch.publishedDate)},
        ${esc(ch.specialTag)}, ${esc(imagesJson)}, ${esc(ch.content)}, ${esc(ch.notice)},
        ${ch.createdAt || Date.now()}
      );\n`;
    });
  });

  // Comments SQL
  commentsList.forEach(c => {
    const likesJson = JSON.stringify(c.likes || []);
    const dislikesJson = JSON.stringify(c.dislikes || []);
    sql += `INSERT OR REPLACE INTO comments (
      id, series_id, chapter_id, user_id, user_name, user_avatar,
      text, image_url, parent_id, is_spoiler, likes_json, dislikes_json, created_at
    ) VALUES (
      ${esc(c.id)}, ${esc(c.seriesId)}, ${esc(c.chapterId)}, ${esc(c.userId)}, ${esc(c.userName)},
      ${esc(c.userAvatar)}, ${esc(c.text)}, ${esc(c.imageUrl)}, ${esc(c.parentId)},
      ${c.isSpoiler ? 1 : 0}, ${esc(likesJson)}, ${esc(dislikesJson)}, ${esc(c.date || new Date().toISOString())}
    );\n`;
  });

  // Shop Items SQL
  shopItemsList.forEach(item => {
    sql += `INSERT OR REPLACE INTO shop_items (
      id, name, category, theme_type, price, description, icon, rarity, badge_text
    ) VALUES (
      ${esc(item.id)}, ${esc(item.name)}, ${esc(item.category)}, ${esc(item.themeType)},
      ${item.price}, ${esc(item.description)}, ${esc(item.icon)}, ${esc(item.rarity)}, ${esc(item.badgeText)}
    );\n`;
  });

  // Theme Styles SQL
  Object.values(themeStylesMap).forEach(ts => {
    sql += `INSERT OR REPLACE INTO theme_styles (
      id, name, card_class, avatar_border_class, name_class, badge_bg_class,
      glow_color, accent_text, card_bg_image_url, effect_overlay, theme_type
    ) VALUES (
      ${esc(ts.id)}, ${esc(ts.name)}, ${esc(ts.cardClass)}, ${esc(ts.avatarBorderClass)},
      ${esc(ts.nameClass)}, ${esc(ts.badgeBgClass)}, ${esc(ts.glowColor)}, ${esc(ts.accentText)},
      ${esc(ts.cardBgImageUrl)}, ${esc(ts.effectOverlay)}, ${esc(ts.themeType)}
    );\n`;
  });

  return sql;
}

export function downloadCloudflareD1Sql(
  seriesList: Series[],
  commentsList: Comment[] = [],
  shopItemsList: ShopItem[] = [],
  themeStylesMap: Record<string, ThemeStyle> = {}
) {
  const sql = generateCloudflareD1Sql(seriesList, commentsList, shopItemsList, themeStylesMap);
  const blob = new Blob([sql], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `cloudflare-d1-database-${new Date().toISOString().slice(0, 10)}.sql`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
