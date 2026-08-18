import { useCallback } from "react";
import { useTranslation } from "react-i18next";

import { useLibrary } from "@/src/context/LibraryProvider";
import { useToast } from "@/src/context/ToastProvider";
import type { Book } from "@/src/types/Book";

/**
 * Shared "pick a file, import it, toast the result" flow behind both the
 * Library screen's empty-state drop zone and the Import modal's drop zone —
 * identical everywhere except what happens on success (Library pushes to
 * the new book's detail page, Import replaces itself with it).
 */
export function useImportFlow(onImported: (book: Book) => void) {
  const { t } = useTranslation();
  const { importBook, isImporting } = useLibrary();
  const { showToast } = useToast();

  const handlePick = useCallback(async () => {
    try {
      const book = await importBook();
      if (!book) return; // picker was canceled
      showToast(t("import.successToast", { title: book.title }), "success");
      onImported(book);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      showToast(t("import.errorToast", { message }), "error");
    }
  }, [importBook, onImported, showToast, t]);

  return { handlePick, isImporting };
}
