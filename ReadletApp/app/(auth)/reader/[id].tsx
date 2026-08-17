import FontAwesome from "@expo/vector-icons/FontAwesome";
import { Paths } from "expo-file-system";
import { StatusBar } from "expo-status-bar";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Pressable, StyleSheet } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { WebView, type WebViewMessageEvent } from "react-native-webview";

import { Text, View, useThemeColor } from "@/src/components/Themed";
import { useColorScheme } from "@/src/components/useColorScheme";
import Colors from "@/src/constants/StyleVariables";
import { useLibrary } from "@/src/context/LibraryProvider";
import { ensurePdfViewerHtml } from "@/src/services/pdfViewerHtml";
import { buildPaginationScript } from "@/src/services/readerPagination";
import { type Book, isReflowableFormat } from "@/src/types/Book";
import { goBack } from "@/src/utils/goBack";

/**
 * Reads a book via a `WebView` — chosen over a native EPUB/PDF library so
 * the app stays on Expo Go (no dev-client rebuild). Both EPUB/MOBI
 * ("reflowable", see `isReflowableFormat`) and PDF now page seamlessly,
 * "page" being the unit of navigation/progress for every format — see
 * `src/services/readerPagination.ts` and `src/services/pdfViewerHtml.ts`
 * for the two (necessarily different) mechanisms behind that:
 *
 * - EPUB/MOBI: the current spine chapter's already-extracted XHTML/HTML
 *   file loads straight from disk, with injected CSS turning it into a
 *   horizontally-paged multi-column layout (`readerPagination.ts`) —
 *   "chapter" is still the WebView's unit of *loading* (one `<WebView>`
 *   instance per chapter, remounted via `key={sourceUri}` same as before),
 *   but no longer the unit of navigation/progress; a swipe/tap can cross a
 *   chapter boundary mid-gesture, landing on the neighbor chapter's first
 *   or last page (see `handlePrevPage`/`handleNextPage`).
 * - PDF: a generated pdf.js-based viewer HTML is loaded instead of the
 *   raw PDF file (the platform's built-in PDF viewer, used previously,
 *   exposes no page-change events to JS) — one `<WebView>` instance for
 *   the whole book, since it's a single continuous document; the pdf.js
 *   `PDFViewer`'s own scroll-snapping *is* the swipe gesture there, so no
 *   RN-side pan gesture is attached for PDF.
 *
 * Both formats report page changes back to RN via the same
 * `postMessage({ type: "readletPageInfo", pageNumber, pageCount })`
 * shape (`handleWebViewMessage`), and both expose the same
 * `window.readletGoToPage(n)` for RN-driven navigation (button taps) via
 * the WebView ref's imperative `injectJavaScript` — the reader's bottom
 * bar and progress persistence are format-agnostic as a result.
 *
 * EPUB/MOBI font size is adjustable in-place (no re-zoom needed): it's
 * just the injected pagination script re-pushed via the WebView ref's
 * imperative `injectJavaScript` (not the `injectedJavaScript` prop, which
 * only runs once on load), passing along the *current* page's fraction so
 * re-pagination preserves roughly the same position instead of resetting
 * to page 1. PDF has no such control since that's pdf.js's own rendering,
 * not HTML we theme; only pinch-zoom works there (pdf.js's default
 * touch handling).
 *
 * Min/max font size are set wide enough (4px–200px) to not be a practical
 * ceiling — literal "unbounded" isn't meaningful for a CSS font-size (0px
 * is invisible, and some finite cap has to exist or the layout breaks).
 *
 * Every back/close button uses `goBack` (see `src/utils/goBack.ts`)
 * instead of calling `router.back()` directly — see that file's doc
 * comment for why.
 */
const MIN_FONT_SIZE = 4;
const MAX_FONT_SIZE = 200;
const DEFAULT_FONT_SIZE = 18;
const FONT_SIZE_STEP = 2;
const SWIPE_THRESHOLD = 60;

/** `(currentPosition + pagePosition) / spine.length`, clamped — see `Book.progress`'s doc comment. EPUB/MOBI only; PDF's progress is computed inline where it's used instead, since it has no `pagePosition`/`spine` to speak of. */
function overallProgressFor(book: Book, chapterIndex: number, pagePosition: number): number {
  return Math.min(1, Math.max(0, (chapterIndex + pagePosition) / Math.max(book.spine.length, 1)));
}

export default function Reader() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const scheme = useColorScheme();
  const { books, updateProgress, updatePageCount, updateFontSize } = useLibrary();
  const book = books.find((b) => b.id === id);

  const [loadError, setLoadError] = useState(false);
  // Lazy initializer: reads the book's last-saved font size once on mount,
  // so reopening a book doesn't reset it to the default. Safe to read
  // `book` here (rather than syncing via an effect) because `LibraryProvider`
  // has already loaded the full library by the time this screen can be
  // navigated to — see CLAUDE.md's Library data & import section.
  const [fontSize, setFontSize] = useState(() => book?.fontSize ?? DEFAULT_FONT_SIZE);
  const [pageNumber, setPageNumber] = useState(1);
  const [pageCount, setPageCount] = useState(1);
  /**
   * PDF only: result of the pdf.js-viewer-preparation effect below, tagged
   * with the book id it belongs to. Tagging (rather than resetting to
   * `null` synchronously at the top of that effect on every `book.id`
   * change) is what lets the effect body only ever call `setState` from
   * inside its async `.then`/`.catch` — a bare reset would be a
   * synchronous `setState` directly in the effect body, which can trigger
   * cascading renders and is exactly what `react-hooks/set-state-in-effect`
   * flags. `pdfReady`/`pdfViewerUri`/`pdfLoadError` below derive "not
   * ready yet for the *current* book" from the id mismatch instead.
   */
  const [pdfViewerState, setPdfViewerState] = useState<
    { status: "ready"; bookId: string; uri: string } | { status: "error"; bookId: string } | null
  >(null);
  const webviewRef = useRef<WebView>(null);
  // Captured once, not re-read on every render: the PDF viewer only needs
  // to know where to *open*, same as the EPUB/MOBI font-size lazy
  // initializer above — see the PDF-preparation effect for why this can't
  // just be `book.currentPosition` read live instead.
  const initialPdfPageRef = useRef(book && book.format === "pdf" ? Math.max(1, book.currentPosition) : 1);

  const canvas = useThemeColor({}, "canvas");
  const text = useThemeColor({}, "text");
  const textMuted = useThemeColor({}, "textMuted");
  const border = useThemeColor({}, "border");
  const surfaceHover = useThemeColor({}, "surfaceHover");
  const primary = useThemeColor({}, "primary");
  const danger = useThemeColor({}, "danger");

  const isReflowable = book ? isReflowableFormat(book.format) : false;
  const chapterIndex = book && isReflowable ? Math.min(book.currentPosition, book.spine.length - 1) : 0;
  const chapterUri =
    book && isReflowable && book.extractedDir ? `${book.extractedDir}/${book.spine[chapterIndex]}` : null;

  // PDF: prepare the pdf.js viewer HTML once per book, not once per page
  // turn — `updateProgress` below changes `book` (a new object identity)
  // on every page turn, but a PDF is one continuous document; re-running
  // this per turn would reload and re-parse the whole thing on every
  // swipe. Scoped to `book.id`/`book.format` only, deliberately not
  // `book.currentPosition` — `initialPdfPageRef` above is where "where to
  // open" gets read, exactly once.
  useEffect(() => {
    if (!book || book.format !== "pdf") return;
    let cancelled = false;
    const bookId = book.id;
    ensurePdfViewerHtml(book, initialPdfPageRef.current, { canvas, text })
      .then((uri) => {
        if (!cancelled) setPdfViewerState({ status: "ready", bookId, uri });
      })
      .catch((error) => {
        console.error("[Reader] PDF-Viewer konnte nicht vorbereitet werden:", error);
        if (!cancelled) setPdfViewerState({ status: "error", bookId });
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [book?.id, book?.format]);

  const pdfReady = book && pdfViewerState?.bookId === book.id ? pdfViewerState : null;
  const pdfViewerUri = pdfReady?.status === "ready" ? pdfReady.uri : null;
  const pdfPrepError = pdfReady?.status === "error";

  const injectedJavaScript = useMemo(
    () => buildPaginationScript(fontSize, { canvas, text, primary }, book?.pagePosition ?? 0),
    [fontSize, canvas, text, primary, book?.pagePosition]
  );

  // `injectedJavaScript` only runs after the page's own load event — by
  // then the WebView has already painted a default white frame, which
  // shows as a brief flash on every chapter change (each one remounts the
  // WebView via `key={sourceUri}`). Paint the theme background as early as
  // possible instead: `injectedJavaScriptBeforeContentLoaded` runs at
  // document-start, before the page has parsed/painted anything, so
  // setting it straight on `<html>` here pre-empts that white frame.
  const injectedJavaScriptBeforeContentLoaded = useMemo(
    () => `document.documentElement.style.backgroundColor = ${JSON.stringify(canvas)}; true;`,
    [canvas],
  );

  function handleFontSizeChange(direction: 1 | -1) {
    setFontSize((prev) => {
      const next = Math.max(MIN_FONT_SIZE, Math.min(MAX_FONT_SIZE, prev + direction * FONT_SIZE_STEP));
      if (next !== prev && book) {
        const currentFraction = pageCount > 1 ? (pageNumber - 1) / (pageCount - 1) : 0;
        webviewRef.current?.injectJavaScript(buildPaginationScript(next, { canvas, text, primary }, currentFraction));
        void updateFontSize(book.id, next);
      }
      return next;
    });
  }

  if (!book) {
    return (
      <View style={styles.root}>
        <Text>{t("reader.notFound")}</Text>
      </View>
    );
  }

  function goToChapter(nextIndex: number, entryPagePosition: number) {
    if (!book || !isReflowable) return;
    const clamped = Math.max(0, Math.min(nextIndex, book.spine.length - 1));
    if (clamped === chapterIndex && entryPagePosition === book.pagePosition) return;
    setLoadError(false);
    setPageNumber(1);
    setPageCount(1);
    void updateProgress(book.id, clamped, entryPagePosition, overallProgressFor(book, clamped, entryPagePosition));
  }

  function handlePrevPage() {
    if (!book) return;
    if (!isReflowable) {
      webviewRef.current?.injectJavaScript(`window.readletGoToPage(${pageNumber - 1}); true;`);
    } else if (pageNumber > 1) {
      webviewRef.current?.injectJavaScript(`window.readletGoToPage(${pageNumber - 1}); true;`);
    } else if (chapterIndex > 0) {
      goToChapter(chapterIndex - 1, 1);
    }
  }

  function handleNextPage() {
    if (!book) return;
    if (!isReflowable) {
      webviewRef.current?.injectJavaScript(`window.readletGoToPage(${pageNumber + 1}); true;`);
    } else if (pageNumber < pageCount) {
      webviewRef.current?.injectJavaScript(`window.readletGoToPage(${pageNumber + 1}); true;`);
    } else if (chapterIndex < book.spine.length - 1) {
      goToChapter(chapterIndex + 1, 0);
    }
  }

  function handleWebViewMessage(event: WebViewMessageEvent) {
    let data: unknown;
    try {
      data = JSON.parse(event.nativeEvent.data);
    } catch {
      return;
    }
    if (!data || typeof data !== "object") return;
    const message = data as { type?: string; pageNumber?: number; pageCount?: number };
    if (
      message.type !== "readletPageInfo" ||
      typeof message.pageNumber !== "number" ||
      typeof message.pageCount !== "number"
    ) {
      return;
    }

    setPageNumber(message.pageNumber);
    setPageCount(message.pageCount);
    if (!book) return;

    if (isReflowable) {
      const fraction = message.pageCount > 1 ? (message.pageNumber - 1) / (message.pageCount - 1) : 0;
      if (book.currentPosition !== chapterIndex || Math.abs(book.pagePosition - fraction) > 0.001) {
        void updateProgress(book.id, chapterIndex, fraction, overallProgressFor(book, chapterIndex, fraction));
      }
    } else {
      if (message.pageCount !== book.pageCount) void updatePageCount(book.id, message.pageCount);
      if (book.currentPosition !== message.pageNumber) {
        const progress = message.pageCount > 0 ? Math.min(1, message.pageNumber / message.pageCount) : 0;
        void updateProgress(book.id, message.pageNumber, 0, progress);
      }
    }
  }

  // Only decides who "wins" the touch; the actual page change still goes
  // through handlePrevPage/handleNextPage's own clamping and chapter-
  // boundary handling. PDF isn't wired up here at all — pdf.js's own
  // scroll-snapping in ScrollMode.PAGE already *is* the swipe gesture.
  const swipeGesture = Gesture.Pan()
    .runOnJS(true)
    .activeOffsetX([-20, 20])
    .failOffsetY([-20, 20])
    // eslint-disable-next-line react-hooks/refs -- handlePrevPage/handleNextPage read webviewRef.current, but only once this callback actually *fires* (a real touch gesture, well after render) — not during render itself, which is what the rule guards against.
    .onEnd((event) => {
      if (event.translationX <= -SWIPE_THRESHOLD) {
        handleNextPage();
      } else if (event.translationX >= SWIPE_THRESHOLD) {
        handlePrevPage();
      }
    });

  const sourceUri = isReflowable ? chapterUri : pdfViewerUri;
  const hasLoadError = loadError || pdfPrepError;
  const isFirstPage = isReflowable ? chapterIndex <= 0 && pageNumber <= 1 : pageNumber <= 1;
  const isLastPage = isReflowable
    ? chapterIndex >= book.spine.length - 1 && pageNumber >= pageCount
    : pageNumber >= pageCount;

  return (
    <View style={[styles.root, { backgroundColor: canvas }]}>
      <StatusBar style={scheme === "dark" ? "light" : "dark"} />

      <View style={[styles.topBar, { paddingTop: insets.top, backgroundColor: canvas, borderBottomColor: border }]}>
        <Pressable
          onPress={() => goBack(router, "/")}
          hitSlop={8}
          style={({ pressed }) => [styles.iconButton, { backgroundColor: surfaceHover, opacity: pressed ? 0.6 : 1 }]}
        >
          <FontAwesome name="chevron-left" size={16} color={text} />
        </Pressable>
        <Text style={styles.topBarTitle} numberOfLines={1}>
          {book.title}
        </Text>
        {isReflowable ? (
          <View style={[styles.fontSizeControls, { backgroundColor: surfaceHover }]}>
            <Pressable
              onPress={() => handleFontSizeChange(-1)}
              disabled={fontSize <= MIN_FONT_SIZE}
              hitSlop={6}
              accessibilityLabel={t("reader.decreaseFontSize")}
              style={({ pressed }) => [
                styles.fontSizeButton,
                { opacity: fontSize <= MIN_FONT_SIZE ? 0.3 : pressed ? 0.6 : 1 },
              ]}
            >
              <Text style={styles.fontSizeButtonTextSmall}>A</Text>
            </Pressable>
            <View style={[styles.fontSizeDivider, { backgroundColor: border }]} />
            <Pressable
              onPress={() => handleFontSizeChange(1)}
              disabled={fontSize >= MAX_FONT_SIZE}
              hitSlop={6}
              accessibilityLabel={t("reader.increaseFontSize")}
              style={({ pressed }) => [
                styles.fontSizeButton,
                { opacity: fontSize >= MAX_FONT_SIZE ? 0.3 : pressed ? 0.6 : 1 },
              ]}
            >
              <Text style={styles.fontSizeButtonTextLarge}>A</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.iconButton} />
        )}
      </View>

      {!isReflowable && !sourceUri && !hasLoadError ? (
        <View style={styles.errorState}>
          <ActivityIndicator color={primary} />
        </View>
      ) : sourceUri && !hasLoadError ? (
        (() => {
          const webView = (
            <WebView
              key={sourceUri}
              ref={webviewRef}
              source={{ uri: sourceUri }}
              style={[styles.webview, { backgroundColor: canvas }]}
              originWhitelist={["*"]}
              allowFileAccess
              allowFileAccessFromFileURLs
              allowUniversalAccessFromFileURLs
              allowingReadAccessToURL={isReflowable ? (book.extractedDir ?? undefined) : Paths.document.uri}
              injectedJavaScriptBeforeContentLoaded={isReflowable ? injectedJavaScriptBeforeContentLoaded : undefined}
              injectedJavaScript={isReflowable ? injectedJavaScript : undefined}
              onMessage={handleWebViewMessage}
              onError={() => setLoadError(true)}
            />
          );
          return isReflowable ? <GestureDetector gesture={swipeGesture}>{webView}</GestureDetector> : webView;
        })()
      ) : (
        <View style={styles.errorState}>
          <FontAwesome name="exclamation-circle" size={24} color={danger} />
          <Text style={[styles.errorText, { color: textMuted }]}>{t("reader.notFound")}</Text>
        </View>
      )}

      <View
        style={[
          styles.bottomBar,
          { paddingBottom: insets.bottom + Colors.gapSmall, backgroundColor: canvas, borderTopColor: border },
        ]}
      >
        <View style={[styles.bottomProgressTrack, { backgroundColor: border }]}>
          <View style={[styles.bottomProgressFill, { backgroundColor: primary, width: `${book.progress * 100}%` }]} />
        </View>
        <View style={styles.bottomRow}>
          <Pressable
            onPress={handlePrevPage}
            disabled={isFirstPage}
            hitSlop={8}
            style={({ pressed }) => [styles.navButton, { opacity: isFirstPage ? 0.3 : pressed ? 0.6 : 1 }]}
          >
            <FontAwesome name="chevron-left" size={13} color={text} />
            <Text style={styles.navButtonText}>{t("reader.previousPage")}</Text>
          </Pressable>
          <Text style={[styles.bottomBarText, { color: textMuted }]}>
            {t("reader.pageOf", { current: pageNumber, total: pageCount })}
          </Text>
          <Pressable
            onPress={handleNextPage}
            disabled={isLastPage}
            hitSlop={8}
            style={({ pressed }) => [styles.navButton, { opacity: isLastPage ? 0.3 : pressed ? 0.6 : 1 }]}
          >
            <Text style={styles.navButtonText}>{t("reader.nextPage")}</Text>
            <FontAwesome name="chevron-right" size={13} color={text} />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  webview: { flex: 1 },
  errorState: { flex: 1, alignItems: "center", justifyContent: "center", gap: Colors.gapSmall },
  errorText: { fontSize: Colors.fontSizeMedium },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Colors.gapLarge,
    paddingBottom: Colors.gapSmall,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: Colors.brRound,
    alignItems: "center",
    justifyContent: "center",
  },
  topBarTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: Colors.fontSizeSmall,
    fontWeight: Colors.fontWeightSemibold,
    marginHorizontal: Colors.gapSmall,
  },
  fontSizeControls: {
    flexDirection: "row",
    alignItems: "center",
    height: 36,
    borderRadius: Colors.brRound,
    overflow: "hidden",
  },
  fontSizeButton: {
    width: 32,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  fontSizeButtonTextSmall: {
    fontSize: Colors.fontSizeXSmall,
    fontWeight: Colors.fontWeightSemibold,
  },
  fontSizeButtonTextLarge: {
    fontSize: Colors.fontSizeMedium,
    fontWeight: Colors.fontWeightSemibold,
  },
  fontSizeDivider: {
    width: StyleSheet.hairlineWidth,
    height: 16,
  },
  bottomBar: {
    paddingHorizontal: Colors.gapLarge,
    paddingTop: Colors.gapSmall,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: Colors.gapSmall,
  },
  bottomProgressTrack: {
    height: 3,
    borderRadius: Colors.brRound,
    overflow: "hidden",
  },
  bottomProgressFill: {
    height: "100%",
    borderRadius: Colors.brRound,
  },
  bottomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  navButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: Colors.gapXSmall,
    paddingVertical: Colors.gapXSmall,
    paddingHorizontal: Colors.gapSmall,
  },
  navButtonText: {
    fontSize: Colors.fontSizeSmall,
    fontWeight: Colors.fontWeightMedium,
  },
  bottomBarText: {
    fontSize: Colors.fontSizeXSmall,
  },
});
