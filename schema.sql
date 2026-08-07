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
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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

-- 4. Kullanıcı Favorileri & Okuma Geçmişi
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
