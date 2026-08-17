import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Image, Pressable, ScrollView, StyleSheet, TextInput } from "react-native";

import ScreenHeader from "@/src/components/ScreenHeader";
import { Text, View, useThemeColor } from "@/src/components/Themed";
import Colors from "@/src/constants/StyleVariables";
import { useLibrary } from "@/src/context/LibraryProvider";
import { useToast } from "@/src/context/ToastProvider";
import { isReflowableFormat } from "@/src/types/Book";
import { goBack } from "@/src/utils/goBack";

export default function BookDetail() {
  const { t, i18n } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { showToast } = useToast();
  const { books, removeBook, renameBook } = useLibrary();
  const book = books.find((b) => b.id === id);

  const primary = useThemeColor({}, "primary");
  const onPrimary = useThemeColor({}, "onPrimary");
  const text = useThemeColor({}, "text");
  const textMuted = useThemeColor({}, "textMuted");
  const border = useThemeColor({}, "border");
  const surfaceHover = useThemeColor({}, "surfaceHover");
  const borderMuted = useThemeColor({}, "borderMuted");
  const danger = useThemeColor({}, "danger");

  const [coverFailed, setCoverFailed] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState("");

  if (!book) {
    return (
      <View style={styles.root}>
        <ScreenHeader onBack={() => goBack(router, "/")} />
        <View style={styles.notFound}>
          <Text style={styles.notFoundText}>{t("bookDetail.notFound")}</Text>
        </View>
      </View>
    );
  }

  const isUnread = book.progress <= 0;
  const isFinished = book.progress >= 1;
  const ctaLabel = isFinished
    ? t("bookDetail.ctaRestart")
    : isUnread
      ? t("bookDetail.ctaStart")
      : t("bookDetail.ctaContinue");

  const chapterOrPageCount = isReflowableFormat(book.format) ? book.spine.length : book.pageCount;
  const dateFormatter = new Intl.DateTimeFormat(i18n.language === "en" ? "en-US" : "de-DE", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  async function handleRemove() {
    if (!book) return;
    await removeBook(book.id);
    showToast(t("bookDetail.removedToast", { title: book.title }), "success");
    goBack(router, "/");
  }

  function handleStartRename() {
    if (!book) return;
    setTitleDraft(book.title);
    setIsEditingTitle(true);
  }

  function handleCancelRename() {
    setIsEditingTitle(false);
  }

  async function handleConfirmRename() {
    if (!book) return;
    const trimmed = titleDraft.trim();
    if (!trimmed) {
      showToast(t("bookDetail.renameEmptyError"), "error");
      return;
    }
    setIsEditingTitle(false);
    if (trimmed === book.title) return;
    await renameBook(book.id, trimmed);
    showToast(t("bookDetail.renameSuccessToast"), "success");
  }

  const showCoverImage = book.coverUri && !coverFailed;

  return (
    <View style={styles.root}>
      <ScreenHeader onBack={() => goBack(router, "/")} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.cover, !showCoverImage && { backgroundColor: book.accent }, Colors.shadowLg]}>
          {showCoverImage ? (
            <Image
              source={{ uri: book.coverUri ?? undefined }}
              style={styles.coverImage}
              onError={() => setCoverFailed(true)}
            />
          ) : (
            <Text style={styles.coverInitial}>{book.title.charAt(0)}</Text>
          )}
        </View>

        <View style={styles.titleBlock}>
          {isEditingTitle ? (
            <View style={styles.titleEditRow}>
              <TextInput
                value={titleDraft}
                onChangeText={setTitleDraft}
                style={[styles.titleInput, { color: text, borderBottomColor: primary }]}
                autoFocus
                selectTextOnFocus
                maxLength={200}
                returnKeyType="done"
                onSubmitEditing={handleConfirmRename}
              />
              <View style={styles.titleEditActions}>
                <Pressable
                  onPress={handleCancelRename}
                  hitSlop={8}
                  style={[styles.titleEditButton, { backgroundColor: surfaceHover }]}
                >
                  <FontAwesome name="close" size={16} color={textMuted} />
                </Pressable>
                <Pressable
                  onPress={handleConfirmRename}
                  hitSlop={8}
                  style={[styles.titleEditButton, { backgroundColor: primary }]}
                >
                  <FontAwesome name="check" size={16} color={onPrimary} />
                </Pressable>
              </View>
            </View>
          ) : (
            <View style={styles.titleRow}>
              <Text style={styles.title} numberOfLines={2}>
                {book.title}
              </Text>
              <Pressable onPress={handleStartRename} hitSlop={8} style={styles.pencilButton}>
                <FontAwesome name="pencil" size={14} color={textMuted} />
              </Pressable>
            </View>
          )}
          <Text style={[styles.author, { color: textMuted }]}>{book.author}</Text>
        </View>

        <View style={styles.chipRow}>
          <MetaChip icon="file-text-o" label={book.format.toUpperCase()} background={surfaceHover} />
          {chapterOrPageCount != null && (
            <MetaChip
              icon="files-o"
              label={t("bookDetail.pages", { count: chapterOrPageCount })}
              background={surfaceHover}
            />
          )}
          <MetaChip
            icon="hdd-o"
            label={t("bookDetail.sizeInMb", { size: (book.sizeBytes / (1024 * 1024)).toFixed(1) })}
            background={surfaceHover}
          />
        </View>

        {!isUnread && (
          <View style={styles.progressSection}>
            <View style={styles.progressLabelRow}>
              <Text style={[styles.progressLabel, { color: textMuted }]}>
                {isFinished
                  ? t("bookDetail.finished")
                  : isReflowableFormat(book.format)
                    ? t("bookDetail.chaptersRead", { current: book.currentPosition + 1, total: book.spine.length })
                    : t("bookDetail.pagesRead", { current: book.currentPosition, total: book.pageCount ?? "?" })}
              </Text>
              <Text style={[styles.progressLabel, { color: textMuted }]}>{Math.round(book.progress * 100)}%</Text>
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
          {t("bookDetail.addedOn", { date: dateFormatter.format(new Date(book.addedAt)) })}
        </Text>

        <Pressable
          onPress={() => router.push({ pathname: "/reader/[id]", params: { id: book.id } })}
          style={({ pressed }) => [styles.primaryButton, { backgroundColor: primary, opacity: pressed ? 0.85 : 1 }]}
        >
          <FontAwesome name="book" size={16} color={onPrimary} />
          <Text style={[styles.primaryButtonText, { color: onPrimary }]}>{ctaLabel}</Text>
        </Pressable>

        <Pressable
          onPress={handleRemove}
          style={({ pressed }) => [
            styles.deleteButton,
            { borderColor: border, opacity: pressed ? 0.6 : 1 },
          ]}
        >
          <FontAwesome name="trash-o" size={15} color={danger} />
          <Text style={[styles.deleteButtonText, { color: danger }]}>{t("bookDetail.remove")}</Text>
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
    overflow: "hidden",
  },
  coverImage: {
    width: "100%",
    height: "100%",
  },
  coverInitial: {
    fontSize: 56,
    fontWeight: Colors.fontWeightBold,
    color: "rgba(255,255,255,0.85)",
  },
  titleBlock: { width: "100%", alignItems: "center", gap: 4 },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Colors.gapXSmall,
  },
  title: {
    fontSize: Colors.fontSizeXXLarge,
    fontWeight: Colors.fontWeightBold,
    textAlign: "center",
  },
  titleEditRow: {
    width: "100%",
    alignItems: "center",
    gap: Colors.gapMedium,
  },
  titleInput: {
    width: "100%",
    fontSize: Colors.fontSizeXXLarge,
    fontWeight: Colors.fontWeightBold,
    textAlign: "center",
    borderBottomWidth: 2,
    paddingVertical: 4,
  },
  titleEditActions: {
    flexDirection: "row",
    gap: Colors.gapMedium,
  },
  titleEditButton: {
    width: 40,
    height: 40,
    borderRadius: Colors.brRound,
    alignItems: "center",
    justifyContent: "center",
  },
  pencilButton: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
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
