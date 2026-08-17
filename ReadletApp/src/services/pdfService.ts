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
