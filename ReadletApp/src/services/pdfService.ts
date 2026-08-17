import type { File } from "expo-file-system";

/** Counts non-overlapping occurrences of a byte sequence, without decoding the whole file to a JS string first. */
function countByteOccurrences(bytes: Uint8Array, needle: string): number {
  const pattern = Array.from(needle, (c) => c.charCodeAt(0));
  let count = 0;
  outer: for (let i = 0; i <= bytes.length - pattern.length; i++) {
    for (let j = 0; j < pattern.length; j++) {
      if (bytes[i + j] !== pattern[j]) continue outer;
    }
    count++;
  }
  return count;
}

/**
 * Above this size, skip the heuristic entirely rather than call
 * `file.bytes()` — reading a whole PDF into one JS `Uint8Array` reliably
 * OOMs on Android for large (e.g. scanned) PDFs well before the byte scan
 * itself would even run (see `importBook.ts`'s copy step, which hit the
 * same failure mode). Since the reader now gets pdf.js's *real* page count
 * the first time the PDF is actually opened (see `pdfViewerHtml.ts`), this
 * heuristic only ever has to seed the Book Detail chip until then — a
 * `null` (chip hidden) is a fine, unsurprising placeholder for a book that
 * hasn't been opened yet, but risking a crash on import to slightly
 * shorten how long that placeholder shows isn't a good trade.
 */
const MAX_HEURISTIC_SCAN_BYTES = 20 * 1024 * 1024;

/**
 * Best-effort PDF page count: scans the raw bytes for `/Type/Page` object
 * markers (both the compact and space-separated spelling PDF producers
 * use), which is how most simple, uncompressed-xref PDFs mark each page
 * object. This is **not a real PDF parser** — it can under/overcount for
 * PDFs with compressed object streams or unusual structure. Good enough for
 * an approximate progress indicator; swap for a real PDF library
 * (necessarily native, so revisit the Expo-Go-vs-dev-client tradeoff — see
 * CLAUDE.md) if this proves unreliable in practice.
 */
export async function estimatePdfPageCount(file: File): Promise<number | null> {
  try {
    if ((file.size ?? 0) > MAX_HEURISTIC_SCAN_BYTES) return null;
    const bytes = await file.bytes();
    // "/Type/Page" also matches inside "/Type/Pages" (the root pages-tree
    // node), so subtract those out rather than trying to exclude them in
    // the byte scan itself.
    const compact = countByteOccurrences(bytes, "/Type/Page") - countByteOccurrences(bytes, "/Type/Pages");
    const spaced = countByteOccurrences(bytes, "/Type /Page") - countByteOccurrences(bytes, "/Type /Pages");
    const count = compact + spaced;
    return count > 0 ? count : null;
  } catch {
    return null;
  }
}
