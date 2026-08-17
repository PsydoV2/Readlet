import { Directory, File, Paths } from "expo-file-system";

import i18next from "@/src/i18n";
import { ensurePdfjsAssets, pdfjsDir } from "@/src/services/pdfViewerAssets";
import type { Book } from "@/src/types/Book";

/** Per-book generated viewer files live here, separate from the shared pdf.js library in `pdfjsDir` — deleted alongside the book by `deleteBookFiles` (see `src/services/importBook.ts`). */
function viewerDirFor(bookId: string): Directory {
  return new Directory(Paths.document, "pdfjs-viewers", bookId);
}

export function pdfViewerDirForDeletion(bookId: string): Directory {
  return viewerDirFor(bookId);
}

/**
 * Generates (once per book, cached on disk) a minimal pdf.js-based page
 * viewer and returns its `file://` URI for the reader's WebView `source`.
 *
 * The PDF itself is handed to pdf.js as its own `file://` URL
 * (`pdfjsLib.getDocument({ url })`, which fetches it internally) rather
 * than read into memory here and passed as `data` — an earlier version
 * read the file, base64-encoded it, and embedded that as a JS string;
 * either approach loads the *entire* file into RN's JS heap at once,
 * which reliably OOMs on Android for a large (e.g. scanned) PDF, the same
 * failure mode `importBook.ts`'s copy step hit reading a picked file's
 * bytes the same way. Letting pdf.js fetch the file itself keeps that
 * memory pressure in the WebView's own process instead. pdf.js/pdf_viewer
 * library files are referenced by *absolute* `file://` URIs (via
 * `pdfjsDir`, shared across all books — see `pdfViewerAssets.ts`) rather
 * than relative paths, so there's no ambiguity from the viewer HTML and
 * the library living in different directories.
 *
 * Uses the reusable `PDFViewer` component from `pdf_viewer.mjs` (the same
 * one pdf.js's own viewer app is built on) in `ScrollMode.PAGE` — native
 * WebView scroll-snapping then *is* the page-swipe gesture, no separate
 * RN-side pan gesture needed (contrast with the EPUB/MOBI reader, which
 * has to build its own since it isn't scroll-driven — see
 * `readerPagination.ts`). Page changes are reported back to RN via
 * `postMessage({ type: "readletPageInfo", pageNumber, pageCount })`, the
 * same message shape the EPUB/MOBI pagination script emits, so the reader
 * screen's `onMessage` handler is shared between both formats.
 *
 * No cmaps/standard-fonts are bundled (pdf.js ships thousands of small
 * files for those, covering CJK text and non-embedded standard-font
 * fallback) — PDFs with embedded fonts (the common case) render fine;
 * PDFs relying on non-embedded CJK fonts may show missing glyphs. No text
 * layer either (`textLayerMode: DISABLE`) — text selection/search isn't
 * implemented, only page rendering/navigation.
 */
export async function ensurePdfViewerHtml(
  book: Book,
  initialPage: number,
  theme: { canvas: string; text: string },
): Promise<string> {
  await ensurePdfjsAssets();

  const viewerDir = viewerDirFor(book.id);
  viewerDir.create({ intermediates: true, idempotent: true });

  const html = buildViewerHtml({
    pdfJsUri: `${pdfjsDir.uri}/pdf.mjs`,
    pdfWorkerUri: `${pdfjsDir.uri}/pdf.worker.mjs`,
    pdfViewerJsUri: `${pdfjsDir.uri}/pdf_viewer.mjs`,
    pdfViewerCssUri: `${pdfjsDir.uri}/pdf_viewer.css`,
    pdfUri: book.fileUri,
    initialPage,
    canvas: theme.canvas,
    text: theme.text,
    errorMessage: i18next.t("reader.pdfLoadError"),
  });
  const htmlFile = new File(viewerDir, "viewer.html");
  htmlFile.create({ intermediates: true, overwrite: true });
  htmlFile.write(html);

  return htmlFile.uri;
}

function buildViewerHtml(opts: {
  pdfJsUri: string;
  pdfWorkerUri: string;
  pdfViewerJsUri: string;
  pdfViewerCssUri: string;
  pdfUri: string;
  initialPage: number;
  canvas: string;
  text: string;
  errorMessage: string;
}): string {
  return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
<link rel="stylesheet" href="${opts.pdfViewerCssUri}" />
<style>
  html, body { margin: 0; padding: 0; height: 100%; overflow: hidden; background: ${opts.canvas}; }
  #viewerContainer { position: absolute; inset: 0; overflow: auto; }
  .pdfViewer .page { border: none !important; box-shadow: none !important; margin: 0 auto !important; }
  #readlet-error { display: none; position: absolute; inset: 0; align-items: center; justify-content: center; padding: 24px; text-align: center; font-family: -apple-system, Roboto, sans-serif; color: ${opts.text}; }
</style>
</head>
<body>
  <div id="viewerContainer"><div id="viewer" class="pdfViewer"></div></div>
  <div id="readlet-error"></div>
  <script type="module">
    import * as pdfjsLib from "${opts.pdfJsUri}";
    import { EventBus, PDFViewer, ScrollMode } from "${opts.pdfViewerJsUri}";

    pdfjsLib.GlobalWorkerOptions.workerSrc = "${opts.pdfWorkerUri}";
    var errorMessage = ${JSON.stringify(opts.errorMessage)};

    function post(data) {
      if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(JSON.stringify(data));
    }

    function showError(message) {
      var el = document.getElementById("readlet-error");
      el.textContent = message;
      el.style.display = "flex";
    }

    var eventBus = new EventBus();
    var pdfViewer = new PDFViewer({
      container: document.getElementById("viewerContainer"),
      eventBus: eventBus,
      textLayerMode: 0,
    });

    eventBus.on("pagesinit", function () {
      pdfViewer.scrollMode = ScrollMode.PAGE;
      pdfViewer.currentScaleValue = "page-fit";
      var initial = Math.min(Math.max(${JSON.stringify(opts.initialPage)}, 1), pdfViewer.pagesCount);
      pdfViewer.currentPageNumber = initial;
      post({ type: "readletPageInfo", pageNumber: pdfViewer.currentPageNumber, pageCount: pdfViewer.pagesCount });
    });

    eventBus.on("pagechanging", function (evt) {
      post({ type: "readletPageInfo", pageNumber: evt.pageNumber, pageCount: pdfViewer.pagesCount });
    });

    window.readletGoToPage = function (n) {
      if (!pdfViewer.pdfDocument) return;
      pdfViewer.currentPageNumber = Math.min(Math.max(n, 1), pdfViewer.pagesCount);
    };

    pdfjsLib.getDocument({ url: ${JSON.stringify(opts.pdfUri)} }).promise.then(function (pdfDocument) {
      pdfViewer.setDocument(pdfDocument);
    }).catch(function (error) {
      showError(errorMessage);
      post({ type: "readletError", message: String((error && error.message) || error) });
    });
  </script>
</body>
</html>
`;
}
