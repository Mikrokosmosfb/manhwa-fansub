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

      try {
        await db.prepare("ALTER TABLE series ADD COLUMN slug TEXT").run();
      } catch (e) {}
    } catch (e) {
      console.error('Error initializing tables:', e);
    }
  }

  try {
    // SERIES API
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
