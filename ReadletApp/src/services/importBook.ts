import * as DocumentPicker from "expo-document-picker";
import { Directory, File, Paths } from "expo-file-system";

import { insertBook } from "@/src/db/booksRepository";
import { extractAndParseEpub } from "@/src/services/epubService";
import { estimatePdfPageCount } from "@/src/services/pdfService";
import type { Book, BookFormat } from "@/src/types/Book";
import { accentColorForId } from "@/src/utils/accentColor";

const PICKER_MIME_TYPES = ["application/epub+zip", "application/pdf"];

function generateId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function formatFromAsset(name: string, mimeType?: string): BookFormat | null {
  if (mimeType === "application/epub+zip" || /\.epub$/i.test(name)) return "epub";
  if (mimeType === "application/pdf" || /\.pdf$/i.test(name)) return "pdf";
  return null;
}

/**
 * Opens the native file picker, copies the chosen EPUB/PDF into app
 * storage (`Paths.document/books/`), extracts/parses it, and inserts a row
 * into the library DB. Returns `null` if the user canceled the picker —
 * throws (with a message meant to be shown to the user) on an unsupported
 * or malformed file, so the caller can toast it.
 */
export async function importBookFromPicker(): Promise<Book | null> {
  // Deliberately not `copyToCacheDirectory: true`: in Expo Go on Android,
  // expo-document-picker's native module copies into the *shared*
  // `host.exp.exponent/cache/DocumentPicker/` folder, not into this
  // project's sandbox-isolated `Paths.cache` — a version mismatch between
  // the two Expo packages under Expo Go that throws `ERR_INVALID_PERMISSION`
  // reading the copy back out. `false` instead hands back the picker's raw
  // `content://` URI, which the new expo-file-system API always treats as
  // readable regardless of which app wrote it (see `FileSystemPath.kt`:
  // content URIs skip the internal sandbox-path check entirely) — we still
  // end up copying the bytes into our own `Paths.document/books/` below, so
  // nothing else changes.
  const result = await DocumentPicker.getDocumentAsync({
    type: PICKER_MIME_TYPES,
    copyToCacheDirectory: false,
  });
  if (result.canceled || result.assets.length === 0) return null;

  const asset = result.assets[0];
  if (!asset) return null;

  const format = formatFromAsset(asset.name, asset.mimeType);
  if (!format) {
    throw new Error("Nicht unterstütztes Dateiformat — nur EPUB und PDF werden unterstützt.");
  }

  const id = generateId();
  const booksDir = new Directory(Paths.document, "books");
  booksDir.create({ intermediates: true, idempotent: true });

  const destination = new File(booksDir, `${id}.${format}`);
  const pickedFile = new File(asset.uri);
  const bytes = await pickedFile.bytes();
  destination.create({ intermediates: true, overwrite: true });
  destination.write(bytes);

  let title = asset.name.replace(/\.(epub|pdf)$/i, "");
  let author = "Unbekannt";
  let spine: string[] = [];
  let extractedDir: string | null = null;
  let coverUri: string | null = null;
  let pageCount: number | null = null;

  if (format === "epub") {
    const parsed = await extractAndParseEpub(destination, id);
    title = parsed.title;
    author = parsed.author;
    spine = parsed.spine;
    extractedDir = parsed.extractedDir;
    coverUri = parsed.coverPath ? `${parsed.extractedDir}/${parsed.coverPath}` : null;
  } else {
    pageCount = await estimatePdfPageCount(destination);
  }

  const book: Book = {
    id,
    title,
    author,
    format,
    fileUri: destination.uri,
    extractedDir,
    spine,
    coverUri,
    pageCount,
    currentPosition: 0,
    progress: 0,
    sizeBytes: destination.size ?? asset.size ?? 0,
    addedAt: new Date().toISOString(),
    accent: accentColorForId(id),
  };

  await insertBook(book);
  return book;
}

/** Removes a book's copied source file and (for EPUBs) its extracted folder. Best-effort — swallows errors so a stale/missing file never blocks deleting the library row. */
export async function deleteBookFiles(book: Book): Promise<void> {
  try {
    new File(book.fileUri).delete();
  } catch {
    // Already gone or unreadable — nothing more we can do.
  }
  if (book.extractedDir) {
    try {
      new Directory(book.extractedDir).delete();
    } catch {
      // Same as above.
    }
  }
}
