import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import FontAwesome from "@expo/vector-icons/FontAwesome";

import BookCard from "@/src/components/BookCard";
import { Text, View, useThemeColor } from "@/src/components/Themed";
import Colors from "@/src/constants/StyleVariables";
import { useLibrary } from "@/src/context/LibraryProvider";
import { useToast } from "@/src/context/ToastProvider";

const NUM_COLUMNS = 2;

/**
 * Library — the app's home screen: a grid of imported books with cover
 * art, title, author and reading progress. See CLAUDE.md for the full
 * planned flow.
 */
export default function Library() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  // Fixed per-card width (not `flex: 1` on the card itself) so every book
  // renders at the same size regardless of how many share its row — an odd
  // book count would otherwise leave a lone last-row card stretched to the
  // full row width. See BookCard's own comment.
  const cardWidth = (windowWidth - Colors.gapLarge * 2 - Colors.gapMedium) / NUM_COLUMNS;
  const { books, isLoading, importBook, isImporting } = useLibrary();
  const { showToast } = useToast();
  const primary = useThemeColor({}, "primary");
  const primarySoft = useThemeColor({}, "primarySoft");
  const textMuted = useThemeColor({}, "textMuted");
  const text = useThemeColor({}, "text");
  const surfaceHover = useThemeColor({}, "surfaceHover");
  const canvas = useThemeColor({}, "canvas");
  const border = useThemeColor({}, "border");

  async function handlePick() {
    try {
      const book = await importBook();
      if (!book) return; // picker was canceled
      showToast(t("import.successToast", { title: book.title }), "success");
      router.push({ pathname: "/book/[id]", params: { id: book.id } });
    } catch (error) {
      console.error("[Import] Import fehlgeschlagen:", error);
      const message = error instanceof Error ? error.message : String(error);
      showToast(t("import.errorToast", { message }), "error");
    }
  }

  return (
    <View style={styles.root}>
      <View
        style={[
          styles.header,
          { paddingTop: insets.top + Colors.gapMedium, backgroundColor: canvas, borderBottomColor: border },
        ]}
      >
        <View style={styles.headerTextBlock}>
          <Text style={styles.headerTitle}>{t("library.title")}</Text>
          <Text style={[styles.headerSubtitle, { color: textMuted }]}>
            {t("library.count", { count: books.length })}
          </Text>
        </View>
        <View style={styles.headerActions}>
          <Pressable
            onPress={() => router.push("/import")}
            hitSlop={8}
            style={({ pressed }) => [
              styles.headerIconButton,
              { backgroundColor: surfaceHover, opacity: pressed ? 0.6 : 1 },
            ]}
          >
            <FontAwesome name="plus" size={16} color={text} />
          </Pressable>
          <Pressable
            onPress={() => router.push("/settings")}
            hitSlop={8}
            style={({ pressed }) => [
              styles.headerIconButton,
              { backgroundColor: surfaceHover, opacity: pressed ? 0.6 : 1 },
            ]}
          >
            <FontAwesome name="gear" size={18} color={text} />
          </Pressable>
        </View>
      </View>

      {isLoading ? (
        <View style={styles.loading}>
          <ActivityIndicator color={primary} />
        </View>
      ) : (
        <FlatList
          data={books}
          keyExtractor={(book) => book.id}
          numColumns={NUM_COLUMNS}
          style={styles.list}
          columnWrapperStyle={styles.row}
          contentContainerStyle={[
            styles.listContent,
            { paddingTop: Colors.gapLarge, paddingBottom: insets.bottom + Colors.gapXXXLarge },
          ]}
          renderItem={({ item }) => <BookCard book={item} width={cardWidth} />}
          ListEmptyComponent={
            <Pressable
              onPress={handlePick}
              disabled={isImporting}
              style={({ pressed }) => [
                styles.emptyCard,
                { borderColor: border, opacity: pressed || isImporting ? 0.7 : 1 },
              ]}
            >
              {isImporting ? (
                <ActivityIndicator color={primary} />
              ) : (
                <>
                  <View style={[styles.emptyIconCircle, { backgroundColor: primarySoft }]}>
                    <FontAwesome name="upload" size={26} color={primary} />
                  </View>
                  <Text style={styles.emptyTitle}>{t("library.emptyTitle")}</Text>
                  <Text style={[styles.emptySubtitle, { color: textMuted }]}>{t("library.emptySubtitle")}</Text>
                </>
              )}
            </Pressable>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  list: { flex: 1 },
  loading: { flex: 1, alignItems: "center", justifyContent: "center" },
  listContent: {
    paddingHorizontal: Colors.gapLarge,
    flexGrow: 1,
  },
  row: {
    gap: Colors.gapMedium,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingHorizontal: Colors.gapLarge,
    paddingBottom: Colors.gapMedium,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTextBlock: {
    gap: 2,
  },
  headerActions: {
    flexDirection: "row",
    gap: Colors.gapSmall,
  },
  headerIconButton: {
    width: 36,
    height: 36,
    borderRadius: Colors.brRound,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: Colors.fontSizeXXXLarge,
    fontWeight: Colors.fontWeightBold,
  },
  headerSubtitle: {
    fontSize: Colors.fontSizeMedium,
  },
  emptyCard: {
    alignItems: "center",
    gap: Colors.gapSmall,
    paddingVertical: Colors.gapXXXLarge,
    paddingHorizontal: Colors.gapLarge,
    marginTop: Colors.gapXLarge,
    borderWidth: 1,
    borderStyle: "dashed",
    borderRadius: Colors.brLg,
  },
  emptyIconCircle: {
    width: 56,
    height: 56,
    borderRadius: Colors.brRound,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Colors.gapSmall,
  },
  emptyTitle: {
    fontSize: Colors.fontSizeLarge,
    fontWeight: Colors.fontWeightSemibold,
  },
  emptySubtitle: {
    fontSize: Colors.fontSizeMedium,
    textAlign: "center",
  },
});
