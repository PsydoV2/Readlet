import { openDatabaseAsync, type SQLiteDatabase } from "expo-sqlite";

const DB_NAME = "readlet.db";

let dbPromise: Promise<SQLiteDatabase> | null = null;

/**
 * Opens (once, cached) the local library database and makes sure the
 * `books` table exists. Every column that isn't a plain scalar (`spine`) is
 * stored as JSON text — see `src/db/booksRepository.ts` for the
 * row↔`Book` mapping.
 */
export function getDatabase(): Promise<SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = openDatabaseAsync(DB_NAME).then(async (db) => {
      await db.execAsync(`
        PRAGMA journal_mode = WAL;
        CREATE TABLE IF NOT EXISTS books (
          id TEXT PRIMARY KEY NOT NULL,
          title TEXT NOT NULL,
          author TEXT NOT NULL,
          format TEXT NOT NULL,
          fileUri TEXT NOT NULL,
          extractedDir TEXT,
          spine TEXT NOT NULL DEFAULT '[]',
          pageCount INTEGER,
          currentPosition INTEGER NOT NULL DEFAULT 0,
          progress REAL NOT NULL DEFAULT 0,
          sizeBytes INTEGER NOT NULL DEFAULT 0,
          addedAt TEXT NOT NULL,
          accent TEXT NOT NULL
        );
      `);
      // No migration framework exists yet — `coverUri` was added after the
      // table above shipped, so installs that already created it need the
      // column bolted on. `ALTER TABLE` has no `IF NOT EXISTS` in SQLite;
      // swallow the "duplicate column" error it throws on every run after
      // the first.
      try {
        await db.execAsync(`ALTER TABLE books ADD COLUMN coverUri TEXT;`);
      } catch {
        // Column already exists.
      }
      // Same story as coverUri above: fontSize was added after this table
      // shipped.
      try {
        await db.execAsync(`ALTER TABLE books ADD COLUMN fontSize INTEGER;`);
      } catch {
        // Column already exists.
      }
      return db;
    });
  }
  return dbPromise;
}
