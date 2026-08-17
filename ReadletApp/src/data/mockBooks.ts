import type { Book } from "@/src/types/Book";

/**
 * Placeholder library content so the UI has something real to lay out
 * before EPUB/PDF import is wired up. Delete once `expo-document-picker` +
 * local metadata storage land — see CLAUDE.md.
 */
const mockBooks: Book[] = [
  {
    id: "1",
    title: "Die Vermessung der Welt",
    author: "Daniel Kehlmann",
    format: "epub",
    progress: 0.62,
    pageCount: 304,
    currentPage: 188,
    sizeMb: 2.1,
    addedAt: "2026-07-02",
    accent: "#3D5A5C",
  },
  {
    id: "2",
    title: "Sapiens",
    author: "Yuval Noah Harari",
    format: "pdf",
    progress: 0.18,
    pageCount: 512,
    currentPage: 92,
    sizeMb: 14.6,
    accent: "#5C4A6E",
    addedAt: "2026-06-14",
  },
  {
    id: "3",
    title: "Der Steppenwolf",
    author: "Hermann Hesse",
    format: "epub",
    progress: 1,
    pageCount: 248,
    currentPage: 248,
    sizeMb: 1.4,
    accent: "#7A3B2E",
    addedAt: "2026-05-21",
  },
  {
    id: "4",
    title: "Klara and the Sun",
    author: "Kazuo Ishiguro",
    format: "epub",
    progress: 0,
    pageCount: 336,
    currentPage: 0,
    sizeMb: 1.9,
    accent: "#4A5A38",
    addedAt: "2026-08-09",
  },
  {
    id: "5",
    title: "Thinking, Fast and Slow",
    author: "Daniel Kahneman",
    format: "pdf",
    progress: 0.4,
    pageCount: 499,
    currentPage: 200,
    sizeMb: 9.8,
    accent: "#2E4A5C",
    addedAt: "2026-04-30",
  },
  {
    id: "6",
    title: "Nachtzug nach Lissabon",
    author: "Pascal Mercier",
    format: "epub",
    progress: 0.05,
    pageCount: 416,
    currentPage: 21,
    sizeMb: 2.6,
    accent: "#8A5A2E",
    addedAt: "2026-08-14",
  },
];

export default mockBooks;

export function getBookById(id: string | undefined): Book | undefined {
  return mockBooks.find((book) => book.id === id);
}
