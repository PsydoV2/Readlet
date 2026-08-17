export type BookFormat = "epub" | "pdf";

export type Book = {
  id: string;
  title: string;
  author: string;
  format: BookFormat;
  /** 0–1. 0 = unread, 1 = finished. */
  progress: number;
  pageCount: number;
  currentPage: number;
  sizeMb: number;
  /** ISO date string. */
  addedAt: string;
  /** Accent color used for the placeholder cover until real cover art is extracted on import. */
  accent: string;
};
