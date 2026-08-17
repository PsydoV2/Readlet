import FontAwesome from "@expo/vector-icons/FontAwesome";
import { StatusBar } from "expo-status-bar";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Text, View, useThemeColor } from "@/src/components/Themed";
import { useColorScheme } from "@/src/components/useColorScheme";
import Colors from "@/src/constants/StyleVariables";
import mockChapterText from "@/src/data/mockChapterText";
import { getBookById } from "@/src/data/mockBooks";
import { goBack } from "@/src/utils/goBack";

/**
 * Distraction-free reading view. Tapping the page toggles the top/bottom
 * chrome so the text can take the full screen — the reading experience
 * this app exists for. Content is placeholder copy until EPUB/PDF text
 * extraction is wired up (see CLAUDE.md).
 */
export default function Reader() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const scheme = useColorScheme();
  const book = getBookById(id);

  const [chromeVisible, setChromeVisible] = useState(true);

  const canvas = useThemeColor({}, "canvas");
  const text = useThemeColor({}, "text");
  const textMuted = useThemeColor({}, "textMuted");
  const border = useThemeColor({}, "border");
  const surfaceHover = useThemeColor({}, "surfaceHover");
  const primary = useThemeColor({}, "primary");

  if (!book) {
    return (
      <View style={styles.root}>
        <Text>Buch nicht gefunden.</Text>
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: canvas }]}>
      <StatusBar style={scheme === "dark" ? "light" : "dark"} hidden={!chromeVisible} animated />

      <Pressable style={styles.tapArea} onPress={() => setChromeVisible((v) => !v)}>
        <ScrollView
          contentContainerStyle={[
            styles.content,
            {
              paddingTop: (chromeVisible ? insets.top + 56 : insets.top) + Colors.gapLarge,
              paddingBottom: (chromeVisible ? insets.bottom + 64 : insets.bottom) + Colors.gapLarge,
            },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.chapterLabel}>Kapitel 1</Text>
          <Text style={styles.bookTitle}>{book.title}</Text>
          {mockChapterText.map((paragraph, i) => (
            <Text key={i} style={[styles.paragraph, { color: text }]}>
              {paragraph}
            </Text>
          ))}
        </ScrollView>
      </Pressable>

      {chromeVisible && (
        <View
          style={[
            styles.topBar,
            { paddingTop: insets.top, backgroundColor: canvas, borderBottomColor: border },
          ]}
        >
          <Pressable
            onPress={() => goBack(router, "/")}
            hitSlop={8}
            style={({ pressed }) => [
              styles.backButton,
              { backgroundColor: surfaceHover, opacity: pressed ? 0.6 : 1 },
            ]}
          >
            <FontAwesome name="chevron-left" size={16} color={text} />
          </Pressable>
          <Text style={styles.topBarTitle} numberOfLines={1}>
            {book.title}
          </Text>
          <View style={styles.backButton} />
        </View>
      )}

      {chromeVisible && (
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
          <Text style={[styles.bottomBarText, { color: textMuted }]}>
            Seite {book.currentPage} von {book.pageCount}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  tapArea: { flex: 1 },
  content: {
    paddingHorizontal: Colors.gapXLarge,
    gap: Colors.gapMedium,
  },
  chapterLabel: {
    fontSize: Colors.fontSizeXSmall,
    fontWeight: Colors.fontWeightSemibold,
    letterSpacing: 1,
    textTransform: "uppercase",
    opacity: 0.5,
  },
  bookTitle: {
    fontSize: Colors.fontSizeXLarge,
    fontWeight: Colors.fontWeightBold,
    marginBottom: Colors.gapSmall,
  },
  paragraph: {
    fontSize: Colors.fontSizeMedium,
    lineHeight: Colors.lineHeightLarge,
  },
  topBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Colors.gapLarge,
    paddingBottom: Colors.gapSmall,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backButton: {
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
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Colors.gapLarge,
    paddingTop: Colors.gapSmall,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: Colors.gapXSmall,
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
  bottomBarText: {
    fontSize: Colors.fontSizeXSmall,
    textAlign: "center",
  },
});
