import FontAwesome from "@expo/vector-icons/FontAwesome";
import { StatusBar } from "expo-status-bar";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";

import { Text, View, useThemeColor } from "@/src/components/Themed";
import { useColorScheme } from "@/src/components/useColorScheme";
import Colors from "@/src/constants/StyleVariables";
import { useLibrary } from "@/src/context/LibraryProvider";
import { isReflowableFormat } from "@/src/types/Book";
import { goBack } from "@/src/utils/goBack";

/**
 * Reads a book via a `WebView` — chosen over a native EPUB/PDF library so
 * the app stays on Expo Go (no dev-client rebuild). EPUB/MOBI (both
 * "reflowable", see `isReflowableFormat`): renders the current spine
 * chapter's extracted XHTML/HTML file directly from disk, with injected
 * CSS for theme-matching colors/typography; "chapter" is the unit of both
 * navigation and progress (no in-chapter pagination). PDF: the file's
 * local `file://` URI is handed straight to the WebView, which renders it
 * with the platform's built-in PDF viewer (WKWebView on iOS, Chromium on
 * Android) — no per-page progress tracking, since that viewer doesn't
 * expose page-change events to JS (would need `react-native-pdf` and a dev
 * client for that — see CLAUDE.md).
 *
 * EPUB/MOBI font size is adjustable in-place (no re-zoom needed): it's
 * just the injected CSS's `font-size` re-pushed via the WebView ref's
 * imperative `injectJavaScript` (not the `injectedJavaScript` prop, which
 * only runs once on load) — no dev client involved. PDF has no such
 * control since that's the platform's built-in viewer, not HTML we
 * control; only pinch-zoom works there.
 *
 * Min/max are set wide enough (4px–200px) to not be a practical ceiling —
 * literal "unbounded" isn't meaningful for a CSS font-size (0px is
 * invisible, and some finite cap has to exist or the layout breaks).
 *
 * EPUB/MOBI chapters can also be swiped, not just tapped via the bottom
 * bar's buttons: a `react-native-gesture-handler` `Gesture.Pan()` sits over
 * the `WebView` (only for reflowable formats — PDF keeps its native
 * viewer's own touch handling untouched). `activeOffsetX`/`failOffsetY`
 * make it recognize a swipe only once the drag is clearly horizontal;
 * anything more vertical fails the gesture immediately and falls through
 * to the `WebView`, so scrolling a long chapter still works normally.
 */
const MIN_FONT_SIZE = 4;
const MAX_FONT_SIZE = 200;
const DEFAULT_FONT_SIZE = 18;
const FONT_SIZE_STEP = 2;
const SWIPE_THRESHOLD = 60;

export default function Reader() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const scheme = useColorScheme();
  const { books, updateProgress, updateFontSize } = useLibrary();
  const book = books.find((b) => b.id === id);

  const [loadError, setLoadError] = useState(false);
  // Lazy initializer: reads the book's last-saved font size once on mount,
  // so reopening a book doesn't reset it to the default. Safe to read
  // `book` here (rather than syncing via an effect) because `LibraryProvider`
  // has already loaded the full library by the time this screen can be
  // navigated to — see CLAUDE.md's Library data & import section.
  const [fontSize, setFontSize] = useState(() => book?.fontSize ?? DEFAULT_FONT_SIZE);
  const webviewRef = useRef<WebView>(null);

  const canvas = useThemeColor({}, "canvas");
  const text = useThemeColor({}, "text");
  const textMuted = useThemeColor({}, "textMuted");
  const border = useThemeColor({}, "border");
  const surfaceHover = useThemeColor({}, "surfaceHover");
  const primary = useThemeColor({}, "primary");
  const danger = useThemeColor({}, "danger");

  const chapterIndex = book && isReflowableFormat(book.format) ? Math.min(book.currentPosition, book.spine.length - 1) : 0;
  const chapterUri =
    book && isReflowableFormat(book.format) && book.extractedDir ? `${book.extractedDir}/${book.spine[chapterIndex]}` : null;

  const buildReaderStyleScript = useCallback(
    (size: number) => {
      const css = `
        html, body {
          background: ${canvas} !important;
          color: ${text} !important;
          font-size: ${size}px !important;
          line-height: 1.6 !important;
          padding: 20px !important;
          box-sizing: border-box !important;
        }
        img, svg { max-width: 100% !important; height: auto !important; }
        a { color: ${primary} !important; }
      `;
      // Re-runnable: removes any style tag it previously injected before
      // adding the new one, so calling this again (via injectJavaScript,
      // on a font-size change) doesn't stack duplicate <style> tags.
      return `
        (function() {
          var existing = document.getElementById('readlet-reader-style');
          if (existing) { existing.remove(); }
          var style = document.createElement('style');
          style.id = 'readlet-reader-style';
          style.textContent = ${JSON.stringify(css)};
          document.head.appendChild(style);
        })();
        true;
      `;
    },
    [canvas, text, primary],
  );

  const injectedJavaScript = useMemo(
    () => buildReaderStyleScript(fontSize),
    [buildReaderStyleScript, fontSize],
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
      if (next !== prev) {
        webviewRef.current?.injectJavaScript(buildReaderStyleScript(next));
        if (book) void updateFontSize(book.id, next);
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

  function goToChapter(nextIndex: number) {
    if (!book || !isReflowableFormat(book.format)) return;
    const clamped = Math.max(0, Math.min(nextIndex, book.spine.length - 1));
    if (clamped === book.currentPosition) return;
    setLoadError(false);
    void updateProgress(book.id, clamped, clamped / Math.max(book.spine.length - 1, 1));
  }

  // Only decides who "wins" the touch (see doc comment above); the actual
  // chapter change still goes through goToChapter's own clamping.
  const swipeGesture = Gesture.Pan()
    .runOnJS(true)
    .activeOffsetX([-20, 20])
    .failOffsetY([-20, 20])
    .onEnd((event) => {
      if (event.translationX <= -SWIPE_THRESHOLD) {
        goToChapter(chapterIndex + 1);
      } else if (event.translationX >= SWIPE_THRESHOLD) {
        goToChapter(chapterIndex - 1);
      }
    });

  const isReflowable = isReflowableFormat(book.format);
  const sourceUri = isReflowable ? chapterUri : book.fileUri;

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

      {sourceUri && !loadError ? (
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
              allowingReadAccessToURL={book.extractedDir ?? undefined}
              injectedJavaScriptBeforeContentLoaded={isReflowable ? injectedJavaScriptBeforeContentLoaded : undefined}
              injectedJavaScript={isReflowable ? injectedJavaScript : undefined}
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

      {isReflowable && (
        <View
          style={[
            styles.bottomBar,
            { paddingBottom: insets.bottom + Colors.gapSmall, backgroundColor: canvas, borderTopColor: border },
          ]}
        >
          <View style={[styles.bottomProgressTrack, { backgroundColor: border }]}>
            <View
              style={[styles.bottomProgressFill, { backgroundColor: primary, width: `${book.progress * 100}%` }]}
            />
          </View>
          <View style={styles.bottomRow}>
            <Pressable
              onPress={() => goToChapter(chapterIndex - 1)}
              disabled={chapterIndex <= 0}
              hitSlop={8}
              style={({ pressed }) => [styles.navButton, { opacity: chapterIndex <= 0 ? 0.3 : pressed ? 0.6 : 1 }]}
            >
              <FontAwesome name="chevron-left" size={13} color={text} />
              <Text style={styles.navButtonText}>{t("reader.previousChapter")}</Text>
            </Pressable>
            <Text style={[styles.bottomBarText, { color: textMuted }]}>
              {t("reader.chapterOf", { current: chapterIndex + 1, total: book.spine.length })}
            </Text>
            <Pressable
              onPress={() => goToChapter(chapterIndex + 1)}
              disabled={chapterIndex >= book.spine.length - 1}
              hitSlop={8}
              style={({ pressed }) => [
                styles.navButton,
                { opacity: chapterIndex >= book.spine.length - 1 ? 0.3 : pressed ? 0.6 : 1 },
              ]}
            >
              <Text style={styles.navButtonText}>{t("reader.nextChapter")}</Text>
              <FontAwesome name="chevron-right" size={13} color={text} />
            </Pressable>
          </View>
        </View>
      )}
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
