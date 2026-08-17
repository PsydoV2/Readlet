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
   * Current reading position: chapter index into `spine` for EPUB/MOBI
   * (0-based), 1-based page number for PDFs — both updated live by the
   * reader screen as the user pages through (see
   * `src/services/readerPagination.ts` / `src/services/pdfViewerHtml.ts`).
   * 0 for an unread book (PDFs treat 0 the same as "not opened yet, start
   * at page 1" — 0 isn't a valid PDF page number).
   */
  currentPosition: number;
  /**
   * EPUB/MOBI only: 0–1 position *within* the current chapter (`currentPosition`)
   * — e.g. 0.5 roughly means "halfway through this chapter's pages". Always
   * 0 for PDF, where `currentPosition` already *is* the page number, so no
   * second within-unit fraction is needed. Chapter-level pagination varies
   * with font size and screen size, so this fraction (not a raw page
   * number, which would be meaningless after either changes) is what
   * actually gets persisted and restored — see `readerPagination.ts`'s doc
   * comment for the full reasoning.
   */
  pagePosition: number;
  /**
   * 0–1 overall progress through the book: `(currentPosition + pagePosition) / spine.length`
   * for EPUB/MOBI, `currentPosition / pageCount` for PDF.
   */
  progress: number;

  /**
   * EPUB/MOBI only: the reader's last-used font size in px, so it doesn't
   * reset to the default every time the book is reopened. Null until the
   * user changes it at least once (the reader falls back to its own
   * default in that case); always null for PDFs, which have no reader-
   * controlled font size (see the reader screen).
   */
  fontSize: number | null;

  sizeBytes: number;
  /** ISO date string. */
  addedAt: string;
  /** Deterministic placeholder cover color (see `src/utils/accentColor.ts`), used as the cover background/initial-letter badge whenever `coverUri` is null. */
  accent: string;
};
