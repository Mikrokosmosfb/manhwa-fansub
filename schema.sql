-- ============================================================
-- CLOUDFLARE D1 DATABASE SCHEMA - MANHVA & FANSUB PLATFORM
-- ============================================================
-- Cloudflare D1 veritabanınıza yüklemek için terminalden:
-- npx wrangler d1 execute YOUR_DATABASE_NAME --file=./schema.sql
-- ============================================================

-- 1. Yorumlar Tablosu (Comments Table)
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
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    equipped_theme TEXT,
    equipped_badge TEXT,
    equipped_badges_json TEXT,
    equipped_frame TEXT
);

-- 2. Seriler Tablosu (Series Table)
CREATE TABLE IF NOT EXISTS series (
    id TEXT PRIMARY KEY,
    slug TEXT,
    title TEXT NOT NULL,
    type TEXT NOT NULL, -- 'Manhwa', 'Web Novel', 'Manga', etc.
    cover_image TEXT NOT NULL,
    banner_image TEXT,
    synopsis TEXT,
    genres_json TEXT DEFAULT '[]',
    rating REAL DEFAULT 5.0,
    status TEXT DEFAULT 'Devam Ediyor',
    author TEXT,
    artist TEXT,
    translator TEXT,
    editor TEXT,
    release_day TEXT,
    release_time TEXT,
    is_hot INTEGER DEFAULT 0,
    is_new INTEGER DEFAULT 0,
    is_guncel INTEGER DEFAULT 1,
    is_18_plus INTEGER DEFAULT 0,
    views INTEGER DEFAULT 0,
    likes_count INTEGER DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Bölümler Tablosu (Chapters Table)
CREATE TABLE IF NOT EXISTS chapters (
    id TEXT PRIMARY KEY,
    series_id TEXT NOT NULL,
    chapter_number REAL NOT NULL,
    title TEXT NOT NULL,
    published_date TEXT,
    special_tag TEXT, -- 'Sezon Finali', 'Final', 'Ekstra', vb.
    images_json TEXT DEFAULT '[]',
    content TEXT, -- Novel metni için
    notice TEXT,
    views INTEGER DEFAULT 0,
    created_at INTEGER DEFAULT (unixepoch()),
    FOREIGN KEY(series_id) REFERENCES series(id) ON DELETE CASCADE
);

-- 4. Mağaza Eşyaları Tablosu (Shop Items Table)
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

-- 5. Tema Stilleri Tablosu (Theme Styles Table)
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

-- 6. Kullanıcılar Tablosu (Users Table - Secure Password & Profile)
CREATE TABLE IF NOT EXISTS users (
    uid TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT,
    name TEXT NOT NULL,
    avatar TEXT,
    bio TEXT,
    provider TEXT DEFAULT 'email',
    role TEXT DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. Kullanıcı Kütüphanesi, Envanter & Cosmo-Puan Tablosu (User Library & Progress)
CREATE TABLE IF NOT EXISTS user_library (
    uid TEXT PRIMARY KEY,
    followed_series TEXT DEFAULT '[]',
    bookmarks TEXT DEFAULT '{}',
    reading_history TEXT DEFAULT '{}',
    notifications TEXT DEFAULT '[]',
    cosmo_points INTEGER DEFAULT 10,
    shop_items TEXT DEFAULT '[]',
    equipped_theme TEXT,
    equipped_badge TEXT,
    equipped_badges TEXT DEFAULT '[]',
    equipped_frame TEXT,
    reading_lists TEXT DEFAULT '[]',
    daily_checkin_day INTEGER DEFAULT 0,
    last_daily_checkin TEXT,
    claimed_checkin_days TEXT DEFAULT '[]',
    FOREIGN KEY(uid) REFERENCES users(uid) ON DELETE CASCADE
);

-- 8. E-Posta OTP Doğrulama Kodları Tablosu (Email Verification OTP)
CREATE TABLE IF NOT EXISTS email_verifications (
    email TEXT PRIMARY KEY,
    code TEXT NOT NULL,
    name TEXT,
    password_hash TEXT,
    expires_at INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 9. Kullanıcı Favorileri & Okuma Geçmişi (Legacy)
CREATE TABLE IF NOT EXISTS user_bookmarks (
    user_id TEXT NOT NULL,
    series_id TEXT NOT NULL,
    folder_name TEXT DEFAULT 'Okuyacaklarım',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY(user_id, series_id)
);

-- Hızlı Sorgulama İndeksleri (Indexes for High Performance)
CREATE INDEX IF NOT EXISTS idx_comments_series ON comments(series_id);
CREATE INDEX IF NOT EXISTS idx_comments_chapter ON comments(chapter_id);
CREATE INDEX IF NOT EXISTS idx_chapters_series ON chapters(series_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_verifications_email ON email_verifications(email);
