export type BookFormat = "epub" | "pdf";

export type Book = {
  id: string;
  title: string;
  author: string;
  format: BookFormat;

  /** file:// URI to the imported source file, copied into app storage on import. */
  fileUri: string;
  /**
   * EPUB only: file:// URI to the folder the archive was unzipped into
   * (chapters + their images/CSS, so the reader's WebView can resolve
   * relative references). Null for PDFs.
   */
  extractedDir: string | null;
  /**
   * EPUB only: ordered chapter file paths (the OPF spine), relative to
   * `extractedDir`. Empty for PDFs — see `src/services/epubService.ts`.
   */
  spine: string[];
  /**
   * EPUB only: file:// URI to the cover image declared in the OPF manifest,
   * already extracted alongside the chapters. Null if the EPUB doesn't
   * declare one, or for PDFs — no first-page-thumbnail rendering yet (needs
   * a real PDF renderer, out of scope while on Expo Go — see CLAUDE.md's
   * Reader section). UI falls back to `accent` + the title's first letter
   * when this is null.
   */
  coverUri: string | null;
  /**
   * PDF only: best-effort page count from a byte-pattern heuristic (see
   * `src/services/pdfService.ts`), not a real PDF parse — null if it
   * couldn't be determined. Null for EPUBs (chapter count is `spine.length`
   * instead).
   */
  pageCount: number | null;

  /**
   * Current reading position: chapter index into `spine` for EPUBs, page
   * number for PDFs (not currently updated while reading a PDF — see the
   * reader screen). 0 for an unread book.
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
