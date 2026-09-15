export interface DbRow { [key: string]: unknown }

export interface DbAdapter {
  query<T extends DbRow = DbRow>(sql: string, params?: unknown[]): Promise<T[]>;
  queryFirst<T extends DbRow = DbRow>(sql: string, params?: unknown[]): Promise<T | null>;
  execute(sql: string, params?: unknown[]): Promise<void>;
}

function makeD1Adapter(db: D1Database): DbAdapter {
  return {
    async query<T extends DbRow>(sql: string, params: unknown[] = []) {
      const res = params.length
        ? await db.prepare(sql).bind(...params).all()
        : await db.prepare(sql).all();
      return (res.results ?? []) as T[];
    },
    async queryFirst<T extends DbRow>(sql: string, params: unknown[] = []) {
      const row = params.length
        ? await db.prepare(sql).bind(...params).first()
        : await db.prepare(sql).first();
      return (row ?? null) as T | null;
    },
    async execute(sql: string, params: unknown[] = []) {
      if (params.length) await db.prepare(sql).bind(...params).run();
      else await db.prepare(sql).run();
    },
  };
}

export async function getDb(): Promise<DbAdapter | null> {
  // Cloudflare D1 (edge runtime)
  try {
    const { getRequestContext } = await import("@cloudflare/next-on-pages");
    const ctx = getRequestContext();
    const d1  = (ctx.env as Record<string, unknown>).DB as D1Database | undefined;
    if (d1) return makeD1Adapter(d1);
  } catch { /* not on Cloudflare */ }

  // Local Node.js dev only — tree-shaken away on edge builds
  if (process.env.NEXT_RUNTIME !== "edge") {
    try {
      const { createClient } = await import("@libsql/client");
      const { existsSync, mkdirSync } = await import("fs");
      const { join } = await import("path");

      const dbDir  = join(process.cwd(), ".local-db");
      const dbFile = join(dbDir, "movie-diary.db");
      if (!existsSync(dbDir)) mkdirSync(dbDir, { recursive: true });

      const client = createClient({ url: `file:${dbFile}` });

      try { await client.execute("SELECT 1 FROM push_subscriptions LIMIT 1"); }
      catch {
        await client.executeMultiple(`
          CREATE TABLE IF NOT EXISTS movies (
            id INTEGER PRIMARY KEY AUTOINCREMENT, tmdb_id INTEGER,
            title TEXT NOT NULL, poster_url TEXT, genre TEXT, runtime INTEGER, overview TEXT,
            created_at TEXT NOT NULL DEFAULT (datetime('now'))
          );
          CREATE TABLE IF NOT EXISTS diary_entries (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            movie_id INTEGER NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
            watched_date TEXT NOT NULL, start_time TEXT, end_time TEXT,
            your_rating INTEGER, partner_rating INTEGER,
            favorite_scene TEXT, favorite_character TEXT, best_quote TEXT,
            laugh_memory TEXT, cry_memory TEXT, special_memory TEXT,
            mood_before TEXT, mood_after TEXT, location TEXT DEFAULT 'Home', snacks TEXT,
            added_by TEXT NOT NULL DEFAULT '1' CHECK(added_by IN ('1','2')),
            created_at TEXT NOT NULL DEFAULT (datetime('now'))
          );
          CREATE TABLE IF NOT EXISTS photos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            entry_id INTEGER NOT NULL REFERENCES diary_entries(id) ON DELETE CASCADE,
            url TEXT NOT NULL, label TEXT, created_at TEXT NOT NULL DEFAULT (datetime('now'))
          );
          CREATE TABLE IF NOT EXISTS album_photos (
            id TEXT PRIMARY KEY,
            image_url TEXT NOT NULL, r2_key TEXT NOT NULL,
            caption TEXT, taken_date TEXT,
            favorite INTEGER NOT NULL DEFAULT 0,
            added_by TEXT NOT NULL DEFAULT '1' CHECK(added_by IN ('1','2')),
            created_at TEXT NOT NULL DEFAULT (datetime('now'))
          );
          CREATE INDEX IF NOT EXISTS idx_album_created  ON album_photos(created_at DESC);
          CREATE INDEX IF NOT EXISTS idx_album_favorite ON album_photos(favorite);
          CREATE TABLE IF NOT EXISTS album_comments (
            id TEXT PRIMARY KEY,
            photo_id TEXT NOT NULL REFERENCES album_photos(id) ON DELETE CASCADE,
            author TEXT NOT NULL, emoji TEXT NOT NULL, content TEXT NOT NULL,
            parent_id TEXT,
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            edited_at TEXT
          );
          CREATE INDEX IF NOT EXISTS idx_comments_photo   ON album_comments(photo_id);
          CREATE INDEX IF NOT EXISTS idx_comments_created ON album_comments(created_at);
          CREATE TABLE IF NOT EXISTS settings (
            key   TEXT PRIMARY KEY,
            value TEXT NOT NULL
          );
          INSERT OR IGNORE INTO settings (key, value) VALUES ('person1_name',  'Him');
          INSERT OR IGNORE INTO settings (key, value) VALUES ('person1_emoji', '🫘');
          INSERT OR IGNORE INTO settings (key, value) VALUES ('person2_name',  'Her');
          INSERT OR IGNORE INTO settings (key, value) VALUES ('person2_emoji', '🌻');
          CREATE TABLE IF NOT EXISTS push_subscriptions (
            id TEXT PRIMARY KEY,
            person TEXT NOT NULL CHECK(person IN ('1','2')),
            endpoint TEXT NOT NULL UNIQUE,
            p256dh TEXT NOT NULL, auth TEXT NOT NULL,
            created_at TEXT NOT NULL DEFAULT (datetime('now'))
          );
        `);
      }

      try { await client.execute("SELECT 1 FROM wishlist LIMIT 1"); }
      catch {
        await client.executeMultiple(`
          CREATE TABLE IF NOT EXISTS wishlist (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL, poster_url TEXT, runtime INTEGER, remark TEXT,
            added_by TEXT NOT NULL DEFAULT '1' CHECK(added_by IN ('1','2')),
            created_at TEXT NOT NULL DEFAULT (datetime('now'))
          );
          CREATE INDEX IF NOT EXISTS idx_wishlist_created ON wishlist(created_at DESC);
        `);
      }

      try { await client.execute("SELECT media_type FROM movies LIMIT 1"); }
      catch { await client.execute("ALTER TABLE movies ADD COLUMN media_type TEXT NOT NULL DEFAULT 'movie'"); }

      try { await client.execute("SELECT 1 FROM episodes LIMIT 1"); }
      catch {
        await client.executeMultiple(`
          CREATE TABLE IF NOT EXISTS episodes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            entry_id INTEGER NOT NULL REFERENCES diary_entries(id) ON DELETE CASCADE,
            episode_number INTEGER NOT NULL,
            watched_date TEXT NOT NULL, start_time TEXT, end_time TEXT,
            created_at TEXT NOT NULL DEFAULT (datetime('now'))
          );
          CREATE INDEX IF NOT EXISTS idx_episodes_entry_id ON episodes(entry_id);
        `);
      }

      try { await client.execute("SELECT 1 FROM login_attempts LIMIT 1"); }
      catch {
        await client.executeMultiple(`
          CREATE TABLE IF NOT EXISTS login_attempts (
            ip TEXT NOT NULL,
            attempted_at INTEGER NOT NULL
          );
          CREATE INDEX IF NOT EXISTS idx_login_attempts_ip ON login_attempts(ip, attempted_at);
        `);
      }

      type Args = Parameters<typeof client.execute>[0] extends { args: infer A } ? A : never;
      return {
        async query<T extends DbRow>(sql: string, params: unknown[] = []) {
          const res = await client.execute({ sql, args: params as Args });
          return res.rows as unknown as T[];
        },
        async queryFirst<T extends DbRow>(sql: string, params: unknown[] = []) {
          const res = await client.execute({ sql, args: params as Args });
          return (res.rows[0] ?? null) as unknown as T | null;
        },
        async execute(sql: string, params: unknown[] = []) {
          await client.execute({ sql, args: params as Args });
        },
      };
    } catch (err) {
      console.error("[db] local adapter failed:", err);
    }
  }

  return null;
}