import FontAwesome from "@expo/vector-icons/FontAwesome";
import { StatusBar } from "expo-status-bar";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";

import { Text, View, useThemeColor } from "@/src/components/Themed";
import { useColorScheme } from "@/src/components/useColorScheme";
import Colors from "@/src/constants/StyleVariables";
import { useLibrary } from "@/src/context/LibraryProvider";
import { goBack } from "@/src/utils/goBack";

/**
 * Reads a book via a `WebView` — chosen over a native EPUB/PDF library so
 * the app stays on Expo Go (no dev-client rebuild). EPUB: renders the
 * current spine chapter's extracted XHTML file directly from disk, with
 * injected CSS for theme-matching colors/typography; "chapter" is the
 * unit of both navigation and progress (no in-chapter pagination). PDF:
 * the file's local `file://` URI is handed straight to the WebView, which
 * renders it with the platform's built-in PDF viewer (WKWebView on iOS,
 * Chromium on Android) — no per-page progress tracking, since that viewer
 * doesn't expose page-change events to JS (would need `react-native-pdf`
 * and a dev client for that — see CLAUDE.md).
 */
export default function Reader() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const scheme = useColorScheme();
  const { books, updateProgress } = useLibrary();
  const book = books.find((b) => b.id === id);

  const [loadError, setLoadError] = useState(false);

  const canvas = useThemeColor({}, "canvas");
  const text = useThemeColor({}, "text");
  const textMuted = useThemeColor({}, "textMuted");
  const border = useThemeColor({}, "border");
  const surfaceHover = useThemeColor({}, "surfaceHover");
  const primary = useThemeColor({}, "primary");
  const danger = useThemeColor({}, "danger");

  const chapterIndex = book?.format === "epub" ? Math.min(book.currentPosition, book.spine.length - 1) : 0;
  const chapterUri =
    book?.format === "epub" && book.extractedDir ? `${book.extractedDir}/${book.spine[chapterIndex]}` : null;

  const injectedJavaScript = useMemo(() => {
    const css = `
      html, body {
        background: ${canvas} !important;
        color: ${text} !important;
        font-size: 18px !important;
        line-height: 1.6 !important;
        padding: 20px !important;
        box-sizing: border-box !important;
      }
      img, svg { max-width: 100% !important; height: auto !important; }
      a { color: ${primary} !important; }
    `;
    return `
      (function() {
        var style = document.createElement('style');
        style.textContent = ${JSON.stringify(css)};
        document.head.appendChild(style);
      })();
      true;
    `;
  }, [canvas, text, primary]);

  if (!book) {
    return (
      <View style={styles.root}>
        <Text>{t("reader.notFound")}</Text>
      </View>
    );
  }

  function goToChapter(nextIndex: number) {
    if (!book || book.format !== "epub") return;
    const clamped = Math.max(0, Math.min(nextIndex, book.spine.length - 1));
    if (clamped === book.currentPosition) return;
    setLoadError(false);
    void updateProgress(book.id, clamped, clamped / Math.max(book.spine.length - 1, 1));
  }

  const sourceUri = book.format === "epub" ? chapterUri : book.fileUri;

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
        <View style={styles.iconButton} />
      </View>

      {sourceUri && !loadError ? (
        <WebView
          key={sourceUri}
          source={{ uri: sourceUri }}
          style={styles.webview}
          originWhitelist={["*"]}
          allowFileAccess
          allowFileAccessFromFileURLs
          allowUniversalAccessFromFileURLs
          allowingReadAccessToURL={book.extractedDir ?? undefined}
          injectedJavaScript={book.format === "epub" ? injectedJavaScript : undefined}
          onError={() => setLoadError(true)}
        />
      ) : (
        <View style={styles.errorState}>
          <FontAwesome name="exclamation-circle" size={24} color={danger} />
          <Text style={[styles.errorText, { color: textMuted }]}>{t("reader.notFound")}</Text>
        </View>
      )}

      {book.format === "epub" && (
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
