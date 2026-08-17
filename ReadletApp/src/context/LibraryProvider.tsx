import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import { deleteBook, getAllBooks, renameBook, updateFontSize, updateReadingPosition } from "@/src/db/booksRepository";
import { deleteBookFiles, importBookFromPicker } from "@/src/services/importBook";
import type { Book } from "@/src/types/Book";

type LibraryContextValue = {
  books: Book[];
  /** Initial load from the DB hasn't finished yet. */
  isLoading: boolean;
  /** An import (picker + copy + parse) is in flight. */
  isImporting: boolean;
  refresh: () => Promise<void>;
  /** Runs the whole import flow; returns the new `Book`, or `null` if the user canceled the picker. Throws on an unsupported/malformed file. */
  importBook: () => Promise<Book | null>;
  removeBook: (id: string) => Promise<void>;
  updateProgress: (id: string, currentPosition: number, progress: number) => Promise<void>;
  updateFontSize: (id: string, fontSize: number) => Promise<void>;
  renameBook: (id: string, title: string) => Promise<void>;
};

const LibraryContext = createContext<LibraryContextValue | null>(null);

/**
 * Loads the library from SQLite on mount and exposes CRUD operations
 * backed by `src/db/booksRepository.ts` + `src/services/importBook.ts`.
 * Wraps the `(auth)` group in `app/_layout.tsx` so every screen shares one
 * in-memory copy of the book list instead of re-querying the DB per screen.
 */
export function LibraryProvider({ children }: { children: ReactNode }) {
  const [books, setBooks] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isImporting, setIsImporting] = useState(false);

  const refresh = useCallback(async () => {
    setBooks(await getAllBooks());
  }, []);

  useEffect(() => {
    void (async () => {
      await refresh();
      setIsLoading(false);
    })();
  }, [refresh]);

  const importBook = useCallback(async () => {
    setIsImporting(true);
    try {
      const book = await importBookFromPicker();
      if (book) await refresh();
      return book;
    } finally {
      setIsImporting(false);
    }
  }, [refresh]);

  const removeBook = useCallback(
    async (id: string) => {
      const book = books.find((b) => b.id === id);
      await deleteBook(id);
      if (book) await deleteBookFiles(book);
      await refresh();
    },
    [books, refresh]
  );

  const updateProgress = useCallback(async (id: string, currentPosition: number, progress: number) => {
    await updateReadingPosition(id, currentPosition, progress);
    setBooks((prev) => prev.map((b) => (b.id === id ? { ...b, currentPosition, progress } : b)));
  }, []);

  const updateFontSizeAction = useCallback(async (id: string, fontSize: number) => {
    await updateFontSize(id, fontSize);
    setBooks((prev) => prev.map((b) => (b.id === id ? { ...b, fontSize } : b)));
  }, []);

  const renameBookAction = useCallback(async (id: string, title: string) => {
    const trimmed = title.trim();
    if (!trimmed) return;
    await renameBook(id, trimmed);
    setBooks((prev) => prev.map((b) => (b.id === id ? { ...b, title: trimmed } : b)));
  }, []);

  const value = useMemo<LibraryContextValue>(
    () => ({
      books,
      isLoading,
      isImporting,
      refresh,
      importBook,
      removeBook,
      updateProgress,
      updateFontSize: updateFontSizeAction,
      renameBook: renameBookAction,
    }),
    [
      books,
      isLoading,
      isImporting,
      refresh,
      importBook,
      removeBook,
      updateProgress,
      updateFontSizeAction,
      renameBookAction,
    ]
  );

  return <LibraryContext.Provider value={value}>{children}</LibraryContext.Provider>;
}

export function useLibrary() {
  const ctx = useContext(LibraryContext);
  if (!ctx) throw new Error("useLibrary must be used within a LibraryProvider");
  return ctx;
}
