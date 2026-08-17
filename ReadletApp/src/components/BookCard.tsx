import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useRouter } from "expo-router";
import { Pressable, StyleSheet } from "react-native";

import { Text, View, useThemeColor } from "@/src/components/Themed";
import Colors from "@/src/constants/StyleVariables";
import type { Book } from "@/src/types/Book";

export default function BookCard({ book }: { book: Book }) {
  const router = useRouter();
  const borderMuted = useThemeColor({}, "borderMuted");
  const primary = useThemeColor({}, "primary");
  const textMuted = useThemeColor({}, "textMuted");
  const success = useThemeColor({}, "success");
  const onSuccess = useThemeColor({}, "onSuccess");

  const isFinished = book.progress >= 1;
  const isUnread = book.progress <= 0;

  return (
    <Pressable
      onPress={() =>
        router.push({ pathname: "/book/[id]", params: { id: book.id } })
      }
      style={({ pressed }) => [styles.root, pressed && styles.pressed]}
    >
      <View
        style={[
          styles.cover,
          { backgroundColor: book.accent },
          Colors.shadowSm,
        ]}
      >
        <Text style={styles.coverInitial}>{book.title.charAt(0)}</Text>

        <View
          style={[styles.formatBadge, { backgroundColor: "rgba(0,0,0,0.35)" }]}
        >
          <Text style={styles.formatBadgeText}>
            {book.format.toUpperCase()}
          </Text>
        </View>

        {isFinished && (
          <View style={[styles.doneBadge, { backgroundColor: success }]}>
            <FontAwesome name="check" size={10} color={onSuccess} />
          </View>
        )}
      </View>

      {!isUnread && !isFinished && (
        <View style={[styles.progressTrack, { backgroundColor: borderMuted }]}>
          <View
            style={[
              styles.progressFill,
              { backgroundColor: primary, width: `${book.progress * 100}%` },
            ]}
          />
        </View>
      )}

      <Text style={styles.title} numberOfLines={1}>
        {book.title}
      </Text>
      <Text style={[styles.author, { color: textMuted }]} numberOfLines={1}>
        {book.author}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    gap: Colors.gapXSmall,
    marginBottom: Colors.gapLarge,
  },
  pressed: {
    opacity: 0.7,
  },
  cover: {
    width: "100%",
    aspectRatio: 0.7,
    borderRadius: Colors.brMd,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Colors.gapXSmall,
  },
  coverInitial: {
    fontSize: Colors.fontSizeXXXLarge,
    fontWeight: Colors.fontWeightBold,
    color: "rgba(255,255,255,0.85)",
  },
  formatBadge: {
    position: "absolute",
    top: Colors.gapSmall,
    left: Colors.gapSmall,
    paddingHorizontal: Colors.gapXSmall,
    paddingVertical: 3,
    borderRadius: Colors.brSm,
  },
  formatBadgeText: {
    fontSize: 10,
    fontWeight: Colors.fontWeightSemibold,
    color: "#FFFFFF",
    letterSpacing: 0.3,
  },
  doneBadge: {
    position: "absolute",
    top: Colors.gapSmall,
    right: Colors.gapSmall,
    width: 18,
    height: 18,
    borderRadius: Colors.brRound,
    alignItems: "center",
    justifyContent: "center",
  },
  progressTrack: {
    height: 3,
    borderRadius: Colors.brRound,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: Colors.brRound,
  },
  title: {
    fontSize: Colors.fontSizeSmall,
    fontWeight: Colors.fontWeightSemibold,
  },
  author: {
    fontSize: Colors.fontSizeXSmall,
  },
});
