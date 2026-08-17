import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Pressable, ScrollView, StyleSheet } from "react-native";

import ScreenHeader from "@/src/components/ScreenHeader";
import { Text, View, useThemeColor } from "@/src/components/Themed";
import Colors from "@/src/constants/StyleVariables";
import { getBookById } from "@/src/data/mockBooks";
import { useToast } from "@/src/context/ToastProvider";
import { goBack } from "@/src/utils/goBack";

const dateFormatter = new Intl.DateTimeFormat("de-DE", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

export default function BookDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { showToast } = useToast();
  const book = getBookById(id);

  const primary = useThemeColor({}, "primary");
  const onPrimary = useThemeColor({}, "onPrimary");
  const textMuted = useThemeColor({}, "textMuted");
  const border = useThemeColor({}, "border");
  const surfaceHover = useThemeColor({}, "surfaceHover");
  const borderMuted = useThemeColor({}, "borderMuted");
  const danger = useThemeColor({}, "danger");

  if (!book) {
    return (
      <View style={styles.root}>
        <ScreenHeader onBack={() => goBack(router, "/")} />
        <View style={styles.notFound}>
          <Text style={styles.notFoundText}>Buch nicht gefunden.</Text>
        </View>
      </View>
    );
  }

  const isUnread = book.progress <= 0;
  const isFinished = book.progress >= 1;
  const ctaLabel = isFinished ? "Erneut lesen" : isUnread ? "Lesen starten" : "Weiterlesen";

  return (
    <View style={styles.root}>
      <ScreenHeader onBack={() => goBack(router, "/")} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.cover, { backgroundColor: book.accent }, Colors.shadowLg]}>
          <Text style={styles.coverInitial}>{book.title.charAt(0)}</Text>
        </View>

        <View style={styles.titleBlock}>
          <Text style={styles.title}>{book.title}</Text>
          <Text style={[styles.author, { color: textMuted }]}>{book.author}</Text>
        </View>

        <View style={styles.chipRow}>
          <MetaChip icon="file-text-o" label={book.format.toUpperCase()} background={surfaceHover} />
          <MetaChip icon="files-o" label={`${book.pageCount} Seiten`} background={surfaceHover} />
          <MetaChip icon="hdd-o" label={`${book.sizeMb.toFixed(1)} MB`} background={surfaceHover} />
        </View>

        {!isUnread && (
          <View style={styles.progressSection}>
            <View style={styles.progressLabelRow}>
              <Text style={[styles.progressLabel, { color: textMuted }]}>
                {isFinished ? "Gelesen" : `Seite ${book.currentPage} von ${book.pageCount}`}
              </Text>
              <Text style={[styles.progressLabel, { color: textMuted }]}>
                {Math.round(book.progress * 100)}%
              </Text>
            </View>
            <View style={[styles.progressTrack, { backgroundColor: borderMuted }]}>
              <View
                style={[
                  styles.progressFill,
                  { backgroundColor: primary, width: `${book.progress * 100}%` },
                ]}
              />
            </View>
          </View>
        )}

        <Text style={[styles.addedAt, { color: textMuted }]}>
          Hinzugefügt am {dateFormatter.format(new Date(book.addedAt))}
        </Text>

        <Pressable
          onPress={() => router.push({ pathname: "/reader/[id]", params: { id: book.id } })}
          style={({ pressed }) => [styles.primaryButton, { backgroundColor: primary, opacity: pressed ? 0.85 : 1 }]}
        >
          <FontAwesome name="book" size={16} color={onPrimary} />
          <Text style={[styles.primaryButtonText, { color: onPrimary }]}>{ctaLabel}</Text>
        </Pressable>

        <Pressable
          onPress={() => showToast(`„${book.title}“ wurde entfernt`, "success")}
          style={({ pressed }) => [
            styles.deleteButton,
            { borderColor: border, opacity: pressed ? 0.6 : 1 },
          ]}
        >
          <FontAwesome name="trash-o" size={15} color={danger} />
          <Text style={[styles.deleteButtonText, { color: danger }]}>Aus Bibliothek entfernen</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

function MetaChip({
  icon,
  label,
  background,
}: {
  icon: React.ComponentProps<typeof FontAwesome>["name"];
  label: string;
  background: string;
}) {
  const textMuted = useThemeColor({}, "textMuted");
  return (
    <View style={[chipStyles.root, { backgroundColor: background }]}>
      <FontAwesome name={icon} size={12} color={textMuted} />
      <Text style={[chipStyles.text, { color: textMuted }]}>{label}</Text>
    </View>
  );
}

const chipStyles = StyleSheet.create({
  root: {
    flexDirection: "row",
    alignItems: "center",
    gap: Colors.gapXSmall,
    paddingHorizontal: Colors.gapMedium,
    paddingVertical: Colors.gapXSmall,
    borderRadius: Colors.brRound,
  },
  text: {
    fontSize: Colors.fontSizeXSmall,
    fontWeight: Colors.fontWeightMedium,
  },
});

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: {
    alignItems: "center",
    paddingHorizontal: Colors.gapXLarge,
    paddingBottom: Colors.gapXXXLarge,
    gap: Colors.gapLarge,
  },
  notFound: { flex: 1, alignItems: "center", justifyContent: "center" },
  notFoundText: { fontSize: Colors.fontSizeMedium },
  cover: {
    width: 168,
    aspectRatio: 0.7,
    borderRadius: Colors.brLg,
    alignItems: "center",
    justifyContent: "center",
    marginTop: Colors.gapMedium,
  },
  coverInitial: {
    fontSize: 56,
    fontWeight: Colors.fontWeightBold,
    color: "rgba(255,255,255,0.85)",
  },
  titleBlock: { alignItems: "center", gap: 4 },
  title: {
    fontSize: Colors.fontSizeXXLarge,
    fontWeight: Colors.fontWeightBold,
    textAlign: "center",
  },
  author: {
    fontSize: Colors.fontSizeMedium,
    textAlign: "center",
  },
  chipRow: {
    flexDirection: "row",
    gap: Colors.gapSmall,
    flexWrap: "wrap",
    justifyContent: "center",
  },
  progressSection: {
    width: "100%",
    gap: Colors.gapXSmall,
  },
  progressLabelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  progressLabel: {
    fontSize: Colors.fontSizeXSmall,
  },
  progressTrack: {
    height: 6,
    borderRadius: Colors.brRound,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: Colors.brRound,
  },
  addedAt: {
    fontSize: Colors.fontSizeXSmall,
  },
  primaryButton: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Colors.gapSmall,
    paddingVertical: Colors.gapMedium,
    borderRadius: Colors.brMd,
    marginTop: Colors.gapSmall,
  },
  primaryButtonText: {
    fontSize: Colors.fontSizeMedium,
    fontWeight: Colors.fontWeightSemibold,
  },
  deleteButton: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Colors.gapSmall,
    paddingVertical: Colors.gapMedium,
    borderRadius: Colors.brMd,
    borderWidth: 1,
  },
  deleteButtonText: {
    fontSize: Colors.fontSizeSmall,
    fontWeight: Colors.fontWeightMedium,
  },
});
