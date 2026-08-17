import { getDatabase } from "@/src/db/database";
import type { Book } from "@/src/types/Book";

type BookRow = {
  id: string;
  title: string;
  author: string;
  format: string;
  fileUri: string;
  extractedDir: string | null;
  spine: string;
  coverUri: string | null;
  pageCount: number | null;
  currentPosition: number;
  progress: number;
  sizeBytes: number;
  addedAt: string;
  accent: string;
  fontSize: number | null;
};

function rowToBook(row: BookRow): Book {
  return {
    id: row.id,
    title: row.title,
    author: row.author,
    format: row.format === "pdf" ? "pdf" : row.format === "mobi" ? "mobi" : "epub",
    fileUri: row.fileUri,
    extractedDir: row.extractedDir,
    spine: JSON.parse(row.spine) as string[],
    coverUri: row.coverUri,
    pageCount: row.pageCount,
    currentPosition: row.currentPosition,
    progress: row.progress,
    sizeBytes: row.sizeBytes,
    addedAt: row.addedAt,
    accent: row.accent,
    fontSize: row.fontSize,
  };
}

export async function getAllBooks(): Promise<Book[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<BookRow>("SELECT * FROM books ORDER BY addedAt DESC");
  return rows.map(rowToBook);
}

export async function getBookById(id: string): Promise<Book | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<BookRow>("SELECT * FROM books WHERE id = ?", id);
  return row ? rowToBook(row) : null;
}

export async function insertBook(book: Book): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT INTO books
       (id, title, author, format, fileUri, extractedDir, spine, coverUri, pageCount, currentPosition, progress, sizeBytes, addedAt, accent, fontSize)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    book.id,
    book.title,
    book.author,
    book.format,
    book.fileUri,
    book.extractedDir,
    JSON.stringify(book.spine),
    book.coverUri,
    book.pageCount,
    book.currentPosition,
    book.progress,
    book.sizeBytes,
    book.addedAt,
    book.accent,
    book.fontSize
  );
}

export async function updateReadingPosition(id: string, currentPosition: number, progress: number): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    "UPDATE books SET currentPosition = ?, progress = ? WHERE id = ?",
    currentPosition,
    progress,
    id
  );
}

export async function updateFontSize(id: string, fontSize: number): Promise<void> {
  const db = await getDatabase();
  await db.runAsync("UPDATE books SET fontSize = ? WHERE id = ?", fontSize, id);
}

export async function renameBook(id: string, title: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync("UPDATE books SET title = ? WHERE id = ?", title, id);
}

export async function deleteBook(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync("DELETE FROM books WHERE id = ?", id);
}
