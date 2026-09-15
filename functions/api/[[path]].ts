export async function onRequest(context: any) {
  const { request, env } = context;
  const url = new URL(request.url);
  const path = url.pathname;

  const r2 = env.BUCKET || env.R2 || env.FANSUB_BUCKET || env.MY_BUCKET || env.STORAGE;
  const kv = env.KV || env.FANSUB_KV || env.KV_STORAGE;
  const db = env.DB || env.mikrokosmos_db || env.D1;

  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers });
  }

  if (db) {
    try {
      await db.prepare(`
        CREATE TABLE IF NOT EXISTS series (
          id TEXT PRIMARY KEY,
          slug TEXT,
          title TEXT NOT NULL,
          type TEXT NOT NULL,
          cover_image TEXT NOT NULL,
          banner_image TEXT,
          synopsis TEXT,
          genres_json TEXT,
          rating REAL DEFAULT 5.0,
          status TEXT DEFAULT 'Devam Ediyor',
          author TEXT,
          artist TEXT,
          translator TEXT,
          release_day TEXT,
          release_time TEXT,
          is_hot INTEGER DEFAULT 0,
          is_new INTEGER DEFAULT 0,
          is_guncel INTEGER DEFAULT 0,
          is_18_plus INTEGER DEFAULT 0,
          updated_at TEXT
        );
      `).run();

      await db.prepare(`
        CREATE TABLE IF NOT EXISTS chapters (
          id TEXT PRIMARY KEY,
          series_id TEXT NOT NULL,
          chapter_number REAL NOT NULL,
          title TEXT,
          published_date TEXT,
          special_tag TEXT,
          images_json TEXT,
          content TEXT,
          notice TEXT,
          created_at INTEGER
        );
      `).run();

      await db.prepare(`
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
          likes_json TEXT,
          dislikes_json TEXT,
          created_at TEXT
        );
      `).run();

      await db.prepare(`
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
      `).run();

      await db.prepare(`
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
      `).run();

      await db.prepare(`
        CREATE TABLE IF NOT EXISTS point_grants (
          id TEXT PRIMARY KEY,
          target_email TEXT NOT NULL,
          amount INTEGER NOT NULL,
          mode TEXT NOT NULL,
          note TEXT,
          admin_email TEXT NOT NULL,
          created_at TEXT NOT NULL,
          previous_balance INTEGER DEFAULT 0,
          new_balance INTEGER DEFAULT 0
        );
      `).run();

      await db.prepare(`
        CREATE TABLE IF NOT EXISTS users (
          uid TEXT PRIMARY KEY,
          email TEXT UNIQUE NOT NULL,
          name TEXT NOT NULL,
          avatar TEXT,
          role TEXT DEFAULT 'user',
          cosmo_points INTEGER DEFAULT 10,
          inventory_json TEXT,
          equipped_theme TEXT,
          equipped_badge TEXT,
          equipped_badges_json TEXT,
          equipped_frame TEXT,
          created_at TEXT,
          updated_at TEXT
        );
      `).run();

      
      try { await db.prepare("ALTER TABLE users ADD COLUMN bookmarks_json TEXT DEFAULT '{}'").run(); } catch (e) {}
      try { await db.prepare("ALTER TABLE users ADD COLUMN followed_series_json TEXT DEFAULT '[]'").run(); } catch (e) {}
      try { await db.prepare("ALTER TABLE users ADD COLUMN reading_history_json TEXT DEFAULT '{}'").run(); } catch (e) {}
      try { await db.prepare("ALTER TABLE users ADD COLUMN notifications_json TEXT DEFAULT '[]'").run(); } catch (e) {}
      try {
        await db.prepare("ALTER TABLE series ADD COLUMN slug TEXT").run();
      } catch (e) {}
    } catch (e) {
      console.error('Error initializing tables:', e);
    }
  }

  try {
    // 1. CLOUDFLARE R2 IMAGE UPLOAD & FILE SERVING
    if (path.startsWith('/api/upload/r2') && request.method === 'POST') {
      try {
        const body = await request.json() as any;
        const { image, filename } = body;
        if (!image) {
          return new Response(JSON.stringify({ success: false, message: 'Yüklenecek resim verisi (base64) bulunamadı.' }), { status: 400, headers });
        }

        const cleanFilename = (filename || 'shop_image.png').replace(/[^a-zA-Z0-9.-]/g, '_');
        const r2Key = `shop/${Date.now()}-${cleanFilename}`;

        if (r2) {
          try {
            const base64Data = image.includes('base64,') ? image.split('base64,')[1] : image;
            const binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
            await r2.put(r2Key, binaryData, {
              httpMetadata: {
                contentType: image.startsWith('data:image/jpeg') ? 'image/jpeg' : image.startsWith('data:image/webp') ? 'image/webp' : 'image/png'
              }
            });

            return new Response(JSON.stringify({
              success: true,
              message: 'Görsel Cloudflare R2 bucket deposuna başarıyla yüklendi!',
              url: `/api/r2/file/${encodeURIComponent(r2Key)}`,
              r2Key,
              storage: 'Cloudflare R2 (S3 Object Storage)'
            }), { headers });
          } catch (r2Err: any) {
            console.error('R2 upload failed, falling back:', r2Err);
          }
        }

        // Fallback image url if R2 is not bound
        return new Response(JSON.stringify({
          success: true,
          message: 'Görsel yüklendi (Base64).',
          url: image,
          storage: 'Cloudflare R2 Fallback (Base64)'
        }), { headers });
      } catch (e: any) {
        return new Response(JSON.stringify({ success: false, message: 'R2 Yükleme hatası: ' + e.message }), { status: 500, headers });
      }
    }

    if (path.startsWith('/api/r2/file/') && request.method === 'GET') {
      const fileKey = decodeURIComponent(path.replace('/api/r2/file/', ''));
      if (r2 && fileKey) {
        try {
          const object = await r2.get(fileKey);
          if (object) {
            const fileHeaders = new Headers();
            object.writeHttpMetadata(fileHeaders);
            fileHeaders.set('etag', object.httpEtag);
            fileHeaders.set('Cache-Control', 'public, max-age=31536000');
            return new Response(object.body, { headers: fileHeaders });
          }
        } catch (e) {}
      }
      return new Response('File not found in Cloudflare R2 Storage', { status: 404 });
    }

    // SERIES API
    
    if (path.startsWith('/api/auth/library')) {
      if (request.method === 'GET') {
        const url = new URL(request.url);
        const uid = url.searchParams.get('uid');
        if (!uid || !db) return new Response(JSON.stringify({ success: false }), { status: 400, headers });
        const user = await db.prepare("SELECT * FROM users WHERE uid = ?").bind(uid).first();
        if (!user) return new Response(JSON.stringify({ success: false }), { status: 404, headers });
        return new Response(JSON.stringify({
          success: true,
          bookmarks: user.bookmarks_json || '{}',
          followed_series: user.followed_series_json || '[]',
          reading_history: user.reading_history_json || '{}',
          notifications: user.notifications_json || '[]',
          cosmo_points: user.cosmo_points || 0,
          shop_items: user.inventory_json || '[]',
          equipped_theme: user.equipped_theme,
          equipped_badge: user.equipped_badge,
          equipped_badges: user.equipped_badges_json,
          equipped_frame: user.equipped_frame
        }), { headers });
      }
      if (request.method === 'POST') {
        if (!db) return new Response(JSON.stringify({ success: false }), { status: 500, headers });
        const body = await request.json();
        await db.prepare(`
          UPDATE users SET 
            bookmarks_json = ?, followed_series_json = ?, reading_history_json = ?, 
            notifications_json = ?, cosmo_points = ?, inventory_json = ?, 
            equipped_theme = ?, equipped_badge = ?, equipped_badges_json = ?, equipped_frame = ?, updated_at = ?
          WHERE uid = ?
        `).bind(
          body.bookmarks || '{}', body.followed_series || '[]', body.reading_history || '{}',
          body.notifications || '[]', body.cosmo_points || 0, body.shop_items || '[]',
          body.equipped_theme || null, body.equipped_badge || null, body.equipped_badges || '[]', body.equipped_frame || null,
          new Date().toLocaleString('tr-TR'), body.uid
        ).run();
        return new Response(JSON.stringify({ success: true }), { headers });
      }
    }

    if (path.startsWith('/api/series')) {
      if (request.method === 'GET') {
        if (r2) {
          try {
            const item = await r2.get('data/series.json');
            const data = item ? await item.json() : [];
            return new Response(JSON.stringify({ success: true, storage: 'R2', data }), { headers });
          } catch (e: any) {
            return new Response(JSON.stringify({ success: false, storage: 'R2', error: e.message }), { headers });
          }
        }

        if (kv) {
          try {
            const data = (await kv.get('data/series.json', 'json')) || [];
            return new Response(JSON.stringify({ success: true, storage: 'KV', data }), { headers });
          } catch (e: any) {
            return new Response(JSON.stringify({ success: false, storage: 'KV', error: e.message }), { headers });
          }
        }

        if (db) {
          const { results: series } = await db.prepare("SELECT * FROM series").all();
          const { results: chapters } = await db.prepare("SELECT * FROM chapters").all();

          const fullSeries = (series || []).map((s: any) => ({
            id: s.id,
            slug: s.slug || s.id,
            title: s.title,
            type: s.type,
            coverImage: s.cover_image,
            bannerImage: s.banner_image,
            synopsis: s.synopsis,
            genres: s.genres_json ? JSON.parse(s.genres_json) : [],
            rating: s.rating,
            status: s.status,
            author: s.author,
            artist: s.artist,
            translator: s.translator,
            releaseDay: s.release_day,
            releaseTime: s.release_time,
            isHot: Boolean(s.is_hot),
            isNew: Boolean(s.is_new),
            isGuncel: Boolean(s.is_guncel),
            is18Plus: Boolean(s.is_18_plus),
            updatedAt: s.updated_at,
            chapters: (chapters || []).filter((c: any) => c.series_id === s.id).map((ch: any) => ({
              id: ch.id,
              number: ch.chapter_number,
              title: ch.title,
              publishedDate: ch.published_date,
              specialTag: ch.special_tag,
              images: ch.images_json ? JSON.parse(ch.images_json) : [],
              content: ch.content,
              notice: ch.notice,
              createdAt: ch.created_at
            }))
          }));

          return new Response(JSON.stringify({ success: true, storage: 'D1', data: fullSeries }), { headers });
        }

        return new Response(JSON.stringify({
          success: false,
          message: 'Cloudflare Depolama Bağlantısı Eksik (R2, KV veya D1 bağlanmalıdır)'
        }), { headers });
      }

      if (request.method === 'POST') {
        const body: any = await request.json();
        const seriesListInput: any[] = Array.isArray(body.seriesList)
          ? body.seriesList
          : body.series
          ? [body.series]
          : [];

        if (seriesListInput.length === 0) {
          return new Response(JSON.stringify({ error: 'Series object or seriesList required' }), { status: 400, headers });
        }

        if (r2) {
          try {
            let existingList: any[] = [];
            const item = await r2.get('data/series.json');
            if (item) {
              existingList = await item.json();
            }
            const seriesMap = new Map<string, any>();
            existingList.forEach((s: any) => seriesMap.set(s.id, s));
            seriesListInput.forEach((s: any) => seriesMap.set(s.id, s));
            const mergedList = Array.from(seriesMap.values());

            await r2.put('data/series.json', JSON.stringify(mergedList), {
              httpMetadata: { contentType: 'application/json' }
            });

            return new Response(JSON.stringify({
              success: true,
              storage: 'R2',
              count: seriesListInput.length,
              total: mergedList.length,
              message: 'Seriler Cloudflare R2 Depolamasına Başarıyla Kaydedildi!'
            }), { headers });
          } catch (e: any) {
            return new Response(JSON.stringify({ success: false, error: e.message }), { status: 500, headers });
          }
        }

        if (kv) {
          try {
            let existingList: any[] = (await kv.get('data/series.json', 'json')) || [];
            const seriesMap = new Map<string, any>();
            existingList.forEach((s: any) => seriesMap.set(s.id, s));
            seriesListInput.forEach((s: any) => seriesMap.set(s.id, s));
            const mergedList = Array.from(seriesMap.values());

            await kv.put('data/series.json', JSON.stringify(mergedList));

            return new Response(JSON.stringify({
              success: true,
              storage: 'KV',
              count: seriesListInput.length,
              total: mergedList.length,
              message: 'Seriler Cloudflare KV Depolamasına Başarıyla Kaydedildi!'
            }), { headers });
          } catch (e: any) {
            return new Response(JSON.stringify({ success: false, error: e.message }), { status: 500, headers });
          }
        }

        if (db) {
          const statements: any[] = [];

          for (const s of seriesListInput) {
            statements.push(
              db.prepare(`
                INSERT OR REPLACE INTO series (
                  id, slug, title, type, cover_image, banner_image, synopsis, genres_json,
                  rating, status, author, artist, translator, release_day, release_time,
                  is_hot, is_new, is_guncel, is_18_plus, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
              `).bind(
                s.id, s.slug || s.id, s.title, s.type, s.coverImage, s.bannerImage || '',
                s.synopsis || '', JSON.stringify(s.genres || []), s.rating || 5.0,
                s.status || 'Devam Ediyor', s.author || '', s.artist || '', s.translator || '',
                s.releaseDay || 'Pazartesi', s.releaseTime || '', s.isHot ? 1 : 0,
                s.isNew ? 1 : 0, s.isGuncel ? 1 : 0, s.is18Plus ? 1 : 0, s.updatedAt || new Date().toISOString()
              )
            );

            if (Array.isArray(s.chapters)) {
              for (const ch of s.chapters) {
                statements.push(
                  db.prepare(`
                    INSERT OR REPLACE INTO chapters (
                      id, series_id, chapter_number, title, published_date, special_tag,
                      images_json, content, notice, created_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                  `).bind(
                    ch.id, s.id, ch.number, ch.title || '', ch.publishedDate || '',
                    ch.specialTag || '', JSON.stringify(ch.images || []), ch.content || '',
                    ch.notice || '', ch.createdAt || Date.now()
                  )
                );
              }
            }
          }

          const BATCH_SIZE = 50;
          for (let i = 0; i < statements.length; i += BATCH_SIZE) {
            const chunk = statements.slice(i, i + BATCH_SIZE);
            await db.batch(chunk);
          }

          return new Response(JSON.stringify({
            success: true,
            storage: 'D1',
            count: seriesListInput.length,
            message: 'Seriler Cloudflare D1 Veritabanına Kaydedildi'
          }), { headers });
        }

        return new Response(JSON.stringify({
          success: false,
          message: 'Cloudflare Binding missing in environment. Please attach an R2 Bucket, KV Namespace, or D1 Database in Cloudflare Dashboard.'
        }), { status: 500, headers });
      }

      if (request.method === 'DELETE') {
        const seriesId = url.searchParams.get('id');

        if (r2) {
          if (seriesId) {
            const item = await r2.get('data/series.json');
            let existingList: any[] = item ? await item.json() : [];
            existingList = existingList.filter((s: any) => s.id !== seriesId);
            await r2.put('data/series.json', JSON.stringify(existingList), {
              httpMetadata: { contentType: 'application/json' }
            });
          }
          return new Response(JSON.stringify({ success: true, storage: 'R2', message: 'Seri Cloudflare R2 deposundan silindi' }), { headers });
        }

        if (kv) {
          if (seriesId) {
            let existingList: any[] = (await kv.get('data/series.json', 'json')) || [];
            existingList = existingList.filter((s: any) => s.id !== seriesId);
            await kv.put('data/series.json', JSON.stringify(existingList));
          }
          return new Response(JSON.stringify({ success: true, storage: 'KV', message: 'Seri Cloudflare KV deposundan silindi' }), { headers });
        }

        if (db && seriesId) {
          await db.prepare("DELETE FROM chapters WHERE series_id = ?").bind(seriesId).run();
          await db.prepare("DELETE FROM series WHERE id = ?").bind(seriesId).run();
          return new Response(JSON.stringify({ success: true, storage: 'D1', message: 'Seri Cloudflare D1 deposundan silindi' }), { headers });
        }

        return new Response(JSON.stringify({ success: true }), { headers });
      }
    }

    // COMMENTS API
    if (path.startsWith('/api/comments')) {
      if (request.method === 'GET') {
        if (r2) {
          const item = await r2.get('data/comments.json');
          const data = item ? await item.json() : [];
          return new Response(JSON.stringify({ success: true, storage: 'R2', data }), { headers });
        }

        if (kv) {
          const data = (await kv.get('data/comments.json', 'json')) || [];
          return new Response(JSON.stringify({ success: true, storage: 'KV', data }), { headers });
        }

        if (db) {
          const { results } = await db.prepare("SELECT * FROM comments ORDER BY created_at DESC").all();
          const mapped = (results || []).map((c: any) => ({
            id: c.id,
            seriesId: c.series_id,
            chapterId: c.chapter_id,
            userId: c.user_id,
            userName: c.user_name,
            userAvatar: c.user_avatar,
            text: c.text,
            imageUrl: c.image_url,
            parentId: c.parent_id,
            isSpoiler: Boolean(c.is_spoiler),
            likes: c.likes_json ? JSON.parse(c.likes_json) : [],
            dislikes: c.dislikes_json ? JSON.parse(c.dislikes_json) : [],
            date: c.created_at
          }));
          return new Response(JSON.stringify({ success: true, storage: 'D1', data: mapped }), { headers });
        }

        return new Response(JSON.stringify({ success: true, data: [] }), { headers });
      }

      if (request.method === 'POST') {
        const c: any = await request.json();

        if (r2) {
          const item = await r2.get('data/comments.json');
          let existing: any[] = item ? await item.json() : [];
          existing = [c, ...existing.filter((x: any) => x.id !== c.id)];
          await r2.put('data/comments.json', JSON.stringify(existing), {
            httpMetadata: { contentType: 'application/json' }
          });
          return new Response(JSON.stringify({ success: true, storage: 'R2' }), { headers });
        }

        if (kv) {
          let existing: any[] = (await kv.get('data/comments.json', 'json')) || [];
          existing = [c, ...existing.filter((x: any) => x.id !== c.id)];
          await kv.put('data/comments.json', JSON.stringify(existing));
          return new Response(JSON.stringify({ success: true, storage: 'KV' }), { headers });
        }

        if (db) {
          await db.prepare(`
            INSERT OR REPLACE INTO comments (
              id, series_id, chapter_id, user_id, user_name, user_avatar,
              text, image_url, parent_id, is_spoiler, likes_json, dislikes_json, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).bind(
            c.id, c.seriesId, c.chapterId || '', c.userId, c.userName, c.userAvatar || '',
            c.text, c.imageUrl || '', c.parentId || '', c.isSpoiler ? 1 : 0,
            JSON.stringify(c.likes || []), JSON.stringify(c.dislikes || []), c.date || new Date().toISOString()
          ).run();
          return new Response(JSON.stringify({ success: true, storage: 'D1' }), { headers });
        }

        return new Response(JSON.stringify({ success: true }), { headers });
      }

      if (request.method === 'DELETE') {
        const commentId = url.searchParams.get('id');

        if (r2 && commentId) {
          const item = await r2.get('data/comments.json');
          let existing: any[] = item ? await item.json() : [];
          existing = existing.filter((x: any) => x.id !== commentId);
          await r2.put('data/comments.json', JSON.stringify(existing), {
            httpMetadata: { contentType: 'application/json' }
          });
          return new Response(JSON.stringify({ success: true, storage: 'R2' }), { headers });
        }

        if (kv && commentId) {
          let existing: any[] = (await kv.get('data/comments.json', 'json')) || [];
          existing = existing.filter((x: any) => x.id !== commentId);
          await kv.put('data/comments.json', JSON.stringify(existing));
          return new Response(JSON.stringify({ success: true, storage: 'KV' }), { headers });
        }

        if (db && commentId) {
          await db.prepare("DELETE FROM comments WHERE id = ?").bind(commentId).run();
          return new Response(JSON.stringify({ success: true, storage: 'D1' }), { headers });
        }

        return new Response(JSON.stringify({ success: true }), { headers });
      }
    }

    // SHOP & THEMES API
    if (path.startsWith('/api/shop')) {
      if (request.method === 'GET') {
        if (r2) {
          const item = await r2.get('data/shop.json');
          const data = item ? await item.json() : { shopItems: [], themeStyles: {} };
          return new Response(JSON.stringify({ success: true, storage: 'R2', ...data }), { headers });
        }
        if (kv) {
          const data = (await kv.get('data/shop.json', 'json')) || { shopItems: [], themeStyles: {} };
          return new Response(JSON.stringify({ success: true, storage: 'KV', ...data }), { headers });
        }
        if (db) {
          const { results: items } = await db.prepare("SELECT * FROM shop_items").all();
          const { results: styles } = await db.prepare("SELECT * FROM theme_styles").all();

          const shopItems = (items || []).map((i: any) => ({
            id: i.id,
            name: i.name,
            category: i.category,
            themeType: i.theme_type,
            price: i.price,
            description: i.description,
            icon: i.icon,
            rarity: i.rarity,
            badgeText: i.badge_text
          }));

          const themeStylesMap: Record<string, any> = {};
          (styles || []).forEach((s: any) => {
            themeStylesMap[s.id] = {
              id: s.id,
              name: s.name,
              cardClass: s.card_class,
              avatarBorderClass: s.avatar_border_class,
              nameClass: s.name_class,
              badgeBgClass: s.badge_bg_class,
              glowColor: s.glow_color,
              accentText: s.accent_text,
              cardBgImageUrl: s.card_bg_image_url,
              effectOverlay: s.effect_overlay,
              themeType: s.theme_type
            };
          });

          return new Response(JSON.stringify({ success: true, storage: 'D1', shopItems, themeStyles: themeStylesMap }), { headers });
        }
        return new Response(JSON.stringify({ success: true, shopItems: [], themeStyles: {} }), { headers });
      }

      if (request.method === 'POST') {
        const body: any = await request.json();
        const shopItemsInput = body.shopItems || [];
        const themeStylesInput = body.themeStyles || {};

        if (r2) {
          await r2.put('data/shop.json', JSON.stringify({ shopItems: shopItemsInput, themeStyles: themeStylesInput }), {
            httpMetadata: { contentType: 'application/json' }
          });
          return new Response(JSON.stringify({ success: true, storage: 'R2', message: 'Mağaza ve temalar R2 deposuna kaydedildi' }), { headers });
        }

        if (kv) {
          await kv.put('data/shop.json', JSON.stringify({ shopItems: shopItemsInput, themeStyles: themeStylesInput }));
          return new Response(JSON.stringify({ success: true, storage: 'KV', message: 'Mağaza ve temalar KV deposuna kaydedildi' }), { headers });
        }

        if (db) {
          const statements: any[] = [];
          for (const item of shopItemsInput) {
            statements.push(
              db.prepare(`
                INSERT OR REPLACE INTO shop_items (
                  id, name, category, theme_type, price, description, icon, rarity, badge_text
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
              `).bind(
                item.id, item.name, item.category, item.themeType || '', item.price,
                item.description || '', item.icon || '', item.rarity || '', item.badgeText || ''
              )
            );
          }

          for (const ts of Object.values(themeStylesInput) as any[]) {
            statements.push(
              db.prepare(`
                INSERT OR REPLACE INTO theme_styles (
                  id, name, card_class, avatar_border_class, name_class, badge_bg_class,
                  glow_color, accent_text, card_bg_image_url, effect_overlay, theme_type
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
              `).bind(
                ts.id, ts.name, ts.cardClass || '', ts.avatarBorderClass || '', ts.nameClass || '',
                ts.badgeBgClass || '', ts.glowColor || '', ts.accentText || '',
                ts.cardBgImageUrl || '', ts.effectOverlay || '', ts.themeType || ''
              )
            );
          }

          if (statements.length > 0) {
            const BATCH_SIZE = 50;
            for (let i = 0; i < statements.length; i += BATCH_SIZE) {
              const chunk = statements.slice(i, i + BATCH_SIZE);
              await db.batch(chunk);
            }
          }

          return new Response(JSON.stringify({ success: true, storage: 'D1', message: 'Mağaza ve temalar D1 veritabanına kaydedildi' }), { headers });
        }

        return new Response(JSON.stringify({ success: true }), { headers });
      }
    }

    // 5. MANUAL COSMO-POINTS GRANTING & USER MANAGEMENT API
    if (path.startsWith('/api/admin/grant-points')) {
      if (request.method === 'GET') {
        if (r2) {
          const item = await r2.get('data/point_grants.json');
          const logs = item ? await item.json() : [];
          return new Response(JSON.stringify({ success: true, storage: 'R2', logs }), { headers });
        }
        if (kv) {
          const logs = (await kv.get('data/point_grants.json', 'json')) || [];
          return new Response(JSON.stringify({ success: true, storage: 'KV', logs }), { headers });
        }
        if (db) {
          const { results } = await db.prepare("SELECT * FROM point_grants ORDER BY created_at DESC LIMIT 10000").all();
          const logs = (results || []).map((r: any) => ({
            id: r.id,
            targetEmail: r.target_email,
            amount: r.amount,
            mode: r.mode,
            note: r.note,
            adminEmail: r.admin_email,
            date: r.created_at,
            timestamp: new Date(r.created_at).getTime() || Date.now(),
            previousBalance: r.previous_balance,
            newBalance: r.new_balance
          }));
          return new Response(JSON.stringify({ success: true, storage: 'D1', logs }), { headers });
        }
        return new Response(JSON.stringify({ success: true, logs: [] }), { headers });
      }

      if (request.method === 'POST') {
        const body: any = await request.json();
        const { targetEmail, amount, mode, note, adminEmail, previousBalance, newBalance } = body;

        if (!targetEmail) {
          return new Response(JSON.stringify({ success: false, message: 'Hedef e-posta adresi belirtilmelidir.' }), { status: 400, headers });
        }

        const logId = 'pgrant-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7);
        const grantLog = {
          id: logId,
          targetEmail: targetEmail.toLowerCase().trim(),
          amount: Number(amount) || 0,
          mode: mode || 'add',
          note: note || 'Manuel Yönetici Yüklemesi',
          adminEmail: adminEmail || 'admin',
          date: new Date().toLocaleString('tr-TR'),
          timestamp: Date.now(),
          previousBalance: Number(previousBalance) || 0,
          newBalance: Number(newBalance) || 0
        };

        if (r2) {
          const existingItem = await r2.get('data/point_grants.json');
          const logs = existingItem ? await existingItem.json() : [];
          logs.unshift(grantLog);
          await r2.put('data/point_grants.json', JSON.stringify(logs.slice(0, 200)), {
            httpMetadata: { contentType: 'application/json' }
          });
        } else if (kv) {
          const logs = (await kv.get('data/point_grants.json', 'json')) || [];
          logs.unshift(grantLog);
          await kv.put('data/point_grants.json', JSON.stringify(logs.slice(0, 200)));
        }

        if (db) {
          await db.prepare(`
            INSERT INTO point_grants (
              id, target_email, amount, mode, note, admin_email, created_at, previous_balance, new_balance
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).bind(
            grantLog.id, grantLog.targetEmail, grantLog.amount, grantLog.mode,
            grantLog.note, grantLog.adminEmail, grantLog.date, grantLog.previousBalance, grantLog.newBalance
          ).run();

          // Also update or insert user balance in users table if present
          try {
            const existing = await db.prepare("SELECT * FROM users WHERE email = ?").bind(grantLog.targetEmail).first();
            if (existing) {
              let currentNotifs = [];
              if (existing.notifications_json) {
                try { currentNotifs = JSON.parse(existing.notifications_json); } catch(e){}
              }
              const signText = grantLog.mode === 'add' ? `+${grantLog.amount}` : grantLog.mode === 'subtract' ? `-${grantLog.amount}` : `${grantLog.newBalance}`;
              const sysNotif = {
                id: 'n-' + Date.now(),
                title: '🎁 Cosmo-Puan Tanımlandı!',
                message: `Yönetici tarafından hesabınıza ${signText} Cosmo-Puan tanımlandı. Güncel Bakiye: ${grantLog.newBalance} CP. ${grantLog.note ? 'Not: ' + grantLog.note : ''}`,
                type: 'reward',
                createdAt: Date.now(),
                isRead: false
              };
              currentNotifs.unshift(sysNotif);
              await db.prepare("UPDATE users SET cosmo_points = ?, updated_at = ?, notifications_json = ? WHERE email = ?")
                .bind(grantLog.newBalance, grantLog.date, JSON.stringify(currentNotifs.slice(0, 50)), grantLog.targetEmail).run();
            } else {
              await db.prepare("INSERT INTO users (uid, email, name, cosmo_points, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)")
                .bind('u-' + Date.now(), grantLog.targetEmail, grantLog.targetEmail.split('@')[0], grantLog.newBalance, grantLog.date, grantLog.date).run();
            }
          } catch (e) {
            console.error('Error updating user balance in D1:', e);
          }
        }

        return new Response(JSON.stringify({
          success: true,
          message: `${targetEmail} hesabına ${grantLog.amount} Cosmo-Puan başarıyla tanımlandı!`,
          log: grantLog,
          newBalance: grantLog.newBalance
        }), { headers });
      }

      if (request.method === 'DELETE') {
        const url = new URL(request.url);
        const logId = url.searchParams.get('id');
        if (!logId) {
          return new Response(JSON.stringify({ success: false, message: 'Silinecek kayıt IDsi belirtilmedi.' }), { status: 400, headers });
        }

        if (db) {
          await db.prepare("DELETE FROM point_grants WHERE id = ?").bind(logId).run();
        }
        if (r2) {
          const item = await r2.get('data/point_grants.json');
          if (item) {
            const list = await item.json();
            const updated = list.filter((l: any) => l.id !== logId);
            await r2.put('data/point_grants.json', JSON.stringify(updated), {
              httpMetadata: { contentType: 'application/json' }
            });
          }
        }
        if (kv) {
          const list = (await kv.get('data/point_grants.json', 'json')) || [];
          const updated = list.filter((l: any) => l.id !== logId);
          await kv.put('data/point_grants.json', JSON.stringify(updated));
        }

        return new Response(JSON.stringify({ success: true, message: 'İşlem kaydı silindi.' }), { headers });
      }
    }

    // 6. USER REGISTRY & PUBLIC PROFILE API
    if (path.startsWith('/api/public-profile')) {
      const uid = url.searchParams.get('uid');
      if (uid) {
        if (db) {
          try {
            const u: any = await db.prepare("SELECT * FROM users WHERE uid = ? OR email = ?").bind(uid, uid).first();
            if (u) {
              return new Response(JSON.stringify({
                success: true,
                profile: {
                  uid: u.uid,
                  name: u.name,
                  avatar: u.avatar,
                  bio: u.bio || '',
                  role: u.role,
                  coins: u.cosmo_points || 0,
                  equippedTheme: u.equipped_theme,
                  equippedBadge: u.equipped_badge,
                  equippedBadges: u.equipped_badges_json ? JSON.parse(u.equipped_badges_json) : [],
                  equippedFrame: u.equipped_frame,
                  inventory: u.inventory_json ? JSON.parse(u.inventory_json) : [],
                  readingHistory: u.reading_history_json ? JSON.parse(u.reading_history_json) : {},
                  readingLists: u.reading_lists_json ? JSON.parse(u.reading_lists_json) : [],
                  createdAt: u.created_at
                }
              }), { headers: { ...headers, 'Cache-Control': 'public, max-age=60' } });
            }
          } catch (e) {
            console.error('Error fetching public profile from D1:', e);
          }
        }

        if (r2) {
          try {
            const item = await r2.get('data/users.json');
            const users: any[] = item ? await item.json() : [];
            const found = users.find(u => u.uid === uid || u.email?.toLowerCase() === uid.toLowerCase());
            if (found) {
              return new Response(JSON.stringify({ success: true, profile: found }), { headers: { ...headers, 'Cache-Control': 'public, max-age=60' } });
            }
          } catch (e) {}
        }

        if (kv) {
          try {
            const users: any[] = (await kv.get('data/users.json', 'json')) || [];
            const found = users.find(u => u.uid === uid || u.email?.toLowerCase() === uid.toLowerCase());
            if (found) {
              return new Response(JSON.stringify({ success: true, profile: found }), { headers: { ...headers, 'Cache-Control': 'public, max-age=60' } });
            }
          } catch (e) {}
        }
      }
      return new Response(JSON.stringify({ success: false, message: 'Kullanıcı bulunamadı.' }), { headers: { ...headers, 'Cache-Control': 'public, max-age=60' } });
    }

    if (path.startsWith('/api/admin/users')) {
      if (request.method === 'GET') {
        if (db) {
          const { results } = await db.prepare("SELECT uid, email, name, avatar, role, cosmo_points as coins, updated_at as lastActive FROM users ORDER BY updated_at DESC LIMIT 10000").all();
          return new Response(JSON.stringify({ success: true, storage: 'D1', users: results || [] }), { headers });
        }
        if (r2) {
          const item = await r2.get('data/users.json');
          const users = item ? await item.json() : [];
          return new Response(JSON.stringify({ success: true, storage: 'R2', users }), { headers });
        }
        if (kv) {
          const users = (await kv.get('data/users.json', 'json')) || [];
          return new Response(JSON.stringify({ success: true, storage: 'KV', users }), { headers });
        }
        return new Response(JSON.stringify({ success: true, users: [] }), { headers });
      }

      if (request.method === 'POST') {
        const body: any = await request.json();
        const userObj = body.user;
        if (userObj && userObj.email) {
          const cleanEmail = userObj.email.toLowerCase().trim();
          if (db) {
            await db.prepare(`
              INSERT INTO users (uid, email, name, avatar, role, cosmo_points, created_at, updated_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?)
              ON CONFLICT(email) DO UPDATE SET
                name = COALESCE(?, name),
                avatar = COALESCE(?, avatar),
                cosmo_points = COALESCE(?, cosmo_points),
                updated_at = ?
            `).bind(
              userObj.uid || ('u-' + Date.now()), cleanEmail, userObj.name || cleanEmail.split('@')[0],
              userObj.avatar || '', userObj.role || 'user', userObj.coins || 10,
              new Date().toISOString(), new Date().toISOString(),
              userObj.name, userObj.avatar, userObj.coins, new Date().toISOString()
            ).run();
          }
          if (r2) {
            const item = await r2.get('data/users.json');
            let list: any[] = item ? await item.json() : [];
            const idx = list.findIndex(u => u.email?.toLowerCase() === cleanEmail);
            if (idx >= 0) {
              list[idx] = { ...list[idx], ...userObj, lastActive: new Date().toLocaleString('tr-TR') };
            } else {
              list.push({ ...userObj, lastActive: new Date().toLocaleString('tr-TR') });
            }
            await r2.put('data/users.json', JSON.stringify(list.slice(0, 500)), {
              httpMetadata: { contentType: 'application/json' }
            });
          } else if (kv) {
            let list: any[] = (await kv.get('data/users.json', 'json')) || [];
            const idx = list.findIndex(u => u.email?.toLowerCase() === cleanEmail);
            if (idx >= 0) {
              list[idx] = { ...list[idx], ...userObj, lastActive: new Date().toLocaleString('tr-TR') };
            } else {
              list.push({ ...userObj, lastActive: new Date().toLocaleString('tr-TR') });
            }
            await kv.put('data/users.json', JSON.stringify(list.slice(0, 500)));
          }
        }
        return new Response(JSON.stringify({ success: true }), { headers });
      }
    }

    // DIAGNOSTIC / STATUS API
    if (path.startsWith('/api/status') || path.startsWith('/api/d1-status')) {
      const activeStorage = r2
        ? 'R2 Bucket (S3/Nesne Depolama)'
        : kv
        ? 'KV Namespace'
        : db
        ? 'D1 SQL Veritabanı'
        : 'Bağlı Değil';

      let totalSeriesCount = 0;
      if (r2) {
        const item = await r2.get('data/series.json');
        const list = item ? await item.json() : [];
        totalSeriesCount = list.length;
      } else if (kv) {
        const list = (await kv.get('data/series.json', 'json')) || [];
        totalSeriesCount = list.length;
      } else if (db) {
        const { results } = await db.prepare("SELECT COUNT(*) as count FROM series").all();
        totalSeriesCount = results?.[0]?.count || 0;
      }

      return new Response(JSON.stringify({
        connected: Boolean(r2 || kv || db),
        activeStorage,
        r2Connected: Boolean(r2),
        kvConnected: Boolean(kv),
        d1Connected: Boolean(db),
        totalSeries: totalSeriesCount,
        message: r2
          ? 'Cloudflare R2 Nesne Depolama aktif (Sınırsız/Yüksek Kapasite).'
          : kv
          ? 'Cloudflare KV Anahtar-Değer Depolama aktif.'
          : db
          ? 'Cloudflare D1 SQL Veritabanı aktif (Bağlı ve Hazır).'
          : 'Henüz Cloudflare Depolama bağlaması tanımlanmadı. Dashboard > Settings > Bindings altından bağlama ekleyebilirsiniz.'
      }), { headers });
    }

    return new Response(JSON.stringify({ status: "Cloudflare Pages Function Active" }), { headers });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers });
  }
}
