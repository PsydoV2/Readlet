import { Card, ScreenContent, Text, View, useThemeColor } from "@/components/Themed";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { StyleSheet } from "react-native";

/**
 * Library — the app's home screen. Will show the grid/list of imported
 * books (cover art, title, author, reading progress) once EPUB/PDF import
 * is wired up. See CLAUDE.md for the full planned flow.
 */
export default function Library() {
  const primary = useThemeColor({}, "primary");
  const textMuted = useThemeColor({}, "textMuted");

  return (
    <View style={styles.root}>
      <ScreenContent style={styles.content}>
        <Card style={styles.card}>
          <View style={[styles.iconCircle, { backgroundColor: primary + "22" }]}>
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
  content: { flex: 0, alignItems: "center", paddingTop: 48 },
  card: { alignItems: "center", gap: 8, paddingVertical: 32, width: "100%" },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  title: { fontSize: 17, fontWeight: "600" },
  subtitle: { fontSize: 14, textAlign: "center" },
});
