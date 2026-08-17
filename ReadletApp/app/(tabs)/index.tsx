import { Card, ScreenContent, Text, View, useThemeColor } from "@/src/components/Themed";
import Colors from "@/src/constants/StyleVariables";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { StyleSheet } from "react-native";

/**
 * Library — the app's home screen. Will show the grid/list of imported
 * books (cover art, title, author, reading progress) once EPUB/PDF import
 * is wired up. See CLAUDE.md for the full planned flow.
 */
export default function Library() {
  const primary = useThemeColor({}, "primary");
  const primarySoft = useThemeColor({}, "primarySoft");
  const textMuted = useThemeColor({}, "textMuted");

  return (
    <View style={styles.root}>
      <ScreenContent style={styles.content}>
        <Card style={styles.card}>
          <View style={[styles.iconCircle, { backgroundColor: primarySoft }]}>
            <FontAwesome name="book" size={26} color={primary} />
          </View>
          <Text style={styles.title}>Your library is empty</Text>
          <Text style={[styles.subtitle, { color: textMuted }]}>
            Import an EPUB or PDF to get started.
          </Text>
        </Card>
      </ScreenContent>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: "center" },
  content: { flex: 0, alignItems: "center", paddingTop: Colors.gapXXXLarge },
  card: {
    alignItems: "center",
    gap: Colors.gapSmall,
    paddingVertical: Colors.gapXXLarge,
    width: "100%",
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: Colors.brRound,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Colors.gapSmall,
  },
  title: {
    fontSize: Colors.fontSizeLarge,
    fontWeight: Colors.fontWeightSemibold,
  },
  subtitle: { fontSize: Colors.fontSizeMedium, textAlign: "center" },
});
