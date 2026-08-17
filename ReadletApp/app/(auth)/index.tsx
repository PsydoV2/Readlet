import { useRouter } from "expo-router";
import { FlatList, Pressable, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import FontAwesome from "@expo/vector-icons/FontAwesome";

import BookCard from "@/src/components/BookCard";
import { Card, Text, View, useThemeColor } from "@/src/components/Themed";
import Colors from "@/src/constants/StyleVariables";
import mockBooks from "@/src/data/mockBooks";

/**
 * Library — the app's home screen: a grid of imported books with cover
 * art, title, author and reading progress. See CLAUDE.md for the full
 * planned flow.
 */
export default function Library() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const primary = useThemeColor({}, "primary");
  const primarySoft = useThemeColor({}, "primarySoft");
  const textMuted = useThemeColor({}, "textMuted");
  const text = useThemeColor({}, "text");
  const surfaceHover = useThemeColor({}, "surfaceHover");
  const canvas = useThemeColor({}, "canvas");
  const border = useThemeColor({}, "border");

  const books = mockBooks;

  return (
    <View style={styles.root}>
      <View
        style={[
          styles.header,
          { paddingTop: insets.top + Colors.gapMedium, backgroundColor: canvas, borderBottomColor: border },
        ]}
      >
        <View style={styles.headerTextBlock}>
          <Text style={styles.headerTitle}>Bibliothek</Text>
          <Text style={[styles.headerSubtitle, { color: textMuted }]}>
            {books.length} {books.length === 1 ? "Buch" : "Bücher"}
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

      <FlatList
        data={books}
        keyExtractor={(book) => book.id}
        numColumns={2}
        style={styles.list}
        columnWrapperStyle={styles.row}
        contentContainerStyle={[
          styles.listContent,
          { paddingTop: Colors.gapLarge, paddingBottom: insets.bottom + Colors.gapXXXLarge },
        ]}
        renderItem={({ item }) => <BookCard book={item} />}
        ListEmptyComponent={
          <Card style={styles.emptyCard}>
            <View style={[styles.emptyIconCircle, { backgroundColor: primarySoft }]}>
              <FontAwesome name="book" size={26} color={primary} />
            </View>
            <Text style={styles.emptyTitle}>Deine Bibliothek ist leer</Text>
            <Text style={[styles.emptySubtitle, { color: textMuted }]}>
              Importiere ein EPUB oder PDF, um loszulegen.
            </Text>
          </Card>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  list: { flex: 1 },
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
    paddingVertical: Colors.gapXXLarge,
    marginTop: Colors.gapXLarge,
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
