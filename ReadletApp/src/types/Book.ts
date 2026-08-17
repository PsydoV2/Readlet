export type BookFormat = "epub" | "mobi" | "pdf";

/**
 * EPUB and MOBI are both "reflowable" formats in this app's model — chapter
 * files extracted to disk, navigated/tracked chapter-by-chapter (see
 * `src/services/epubService.ts` / `src/services/mobiService.ts`) — as
 * opposed to PDF, handed to the WebView's built-in viewer as-is. Screens
 * branch on this instead of repeating `format === "epub" || format === "mobi"`.
 */
export function isReflowableFormat(format: BookFormat): boolean {
  return format === "epub" || format === "mobi";
}

export type Book = {
  id: string;
  title: string;
  author: string;
  format: BookFormat;

  /** file:// URI to the imported source file, copied into app storage on import. */
  fileUri: string;
  /**
   * EPUB/MOBI only (see `isReflowableFormat`): file:// URI to the folder the
   * book's chapters (+ EPUB's images/CSS) were extracted into, so the
   * reader's WebView can resolve relative references. Null for PDFs.
   */
  extractedDir: string | null;
  /**
   * EPUB/MOBI only: ordered chapter file paths, relative to `extractedDir`
   * — the OPF spine for EPUB, a synthesized chapter split for MOBI (see
   * `src/services/mobiService.ts`, which has no real spine of its own).
   * Empty for PDFs.
   */
  spine: string[];
  /**
   * EPUB/MOBI only: file:// URI to the cover image (from the OPF manifest
   * for EPUB, the EXTH `CoverOffset` record for MOBI), already extracted
   * alongside the chapters. Null if the book doesn't declare one, or for
   * PDFs — no first-page-thumbnail rendering yet (needs a real PDF
   * renderer, out of scope while on Expo Go — see CLAUDE.md's Reader
   * section). UI falls back to `accent` + the title's first letter when
   * this is null.
   */
  coverUri: string | null;
  /**
   * PDF only: best-effort page count from a byte-pattern heuristic (see
   * `src/services/pdfService.ts`), not a real PDF parse — null if it
   * couldn't be determined. Null for EPUB/MOBI (chapter count is
   * `spine.length` instead).
   */
  pageCount: number | null;

  /**
   * Current reading position: chapter index into `spine` for EPUB/MOBI,
   * page number for PDFs (not currently updated while reading a PDF — see
   * the reader screen). 0 for an unread book.
   */
  currentPosition: number;
  /** 0–1, derived from `currentPosition` vs. `spine.length`/`pageCount`. */
  progress: number;

  sizeBytes: number;
  /** ISO date string. */
  addedAt: string;
  /** Deterministic placeholder cover color (see `src/utils/accentColor.ts`), used as the cover background/initial-letter badge whenever `coverUri` is null. */
  accent: string;
};
