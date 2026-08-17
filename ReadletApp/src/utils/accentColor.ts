/**
 * Deterministic placeholder cover colors, picked by hashing the book id —
 * same book always gets the same color, without storing/generating real
 * cover art. Used as the cover background/initial-letter badge whenever a
 * book has no real cover image (`Book.coverUri`) — always true for PDFs
 * (no first-page-thumbnail rendering yet, see `src/types/Book.ts`), and
 * true for an EPUB that doesn't declare a cover in its manifest.
 */
const PALETTE = [
  "#3D5A5C",
  "#5C4A6E",
  "#7A3B2E",
  "#4A5A38",
  "#2E4A5C",
  "#8A5A2E",
  "#5C3D5A",
  "#3A5C4A",
] as const;

export function accentColorForId(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) | 0;
  }
  const index = Math.abs(hash) % PALETTE.length;
  return PALETTE[index] ?? PALETTE[0];
}
