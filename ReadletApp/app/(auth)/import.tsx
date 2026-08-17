import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useRouter } from "expo-router";
import { Pressable, StyleSheet } from "react-native";

import ScreenHeader from "@/src/components/ScreenHeader";
import { Text, View, useThemeColor } from "@/src/components/Themed";
import Colors from "@/src/constants/StyleVariables";
import { useToast } from "@/src/context/ToastProvider";
import { goBack } from "@/src/utils/goBack";

/**
 * Import flow entry point, presented as a modal from the "+" icon in the
 * Library header.
 * The actual file picker (expo-document-picker) + metadata extraction
 * isn't wired up yet — see CLAUDE.md — so the CTA below just confirms the
 * intended flow for now.
 */
export default function Import() {
  const router = useRouter();
  const { showToast } = useToast();
  const primary = useThemeColor({}, "primary");
  const primarySoft = useThemeColor({}, "primarySoft");
  const onPrimary = useThemeColor({}, "onPrimary");
  const textMuted = useThemeColor({}, "textMuted");
  const border = useThemeColor({}, "border");

  return (
    <View style={styles.root}>
      <ScreenHeader title="Buch importieren" onClose={() => goBack(router, "/")} />

      <View style={styles.content}>
        <View style={[styles.dropZone, { borderColor: border }]}>
          <View style={[styles.iconCircle, { backgroundColor: primarySoft }]}>
            <FontAwesome name="upload" size={22} color={primary} />
          </View>
          <Text style={styles.dropTitle}>EPUB oder PDF auswählen</Text>
          <Text style={[styles.dropSubtitle, { color: textMuted }]}>
            Das Buch bleibt lokal auf deinem Gerät — kein Upload, kein Account nötig.
          </Text>
        </View>

        <Pressable
          onPress={() => showToast("Dateiauswahl kommt bald", "info")}
          style={({ pressed }) => [styles.primaryButton, { backgroundColor: primary, opacity: pressed ? 0.85 : 1 }]}
        >
          <FontAwesome name="file-o" size={16} color={onPrimary} />
          <Text style={[styles.primaryButtonText, { color: onPrimary }]}>Datei auswählen</Text>
        </Pressable>

        <Text style={[styles.hint, { color: textMuted }]}>Unterstützt .epub und .pdf</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: {
    flex: 1,
    paddingHorizontal: Colors.gapXLarge,
    paddingTop: Colors.gapXLarge,
    gap: Colors.gapLarge,
  },
  dropZone: {
    alignItems: "center",
    gap: Colors.gapSmall,
    paddingVertical: Colors.gapXXXLarge,
    paddingHorizontal: Colors.gapLarge,
    borderWidth: 1,
    borderStyle: "dashed",
    borderRadius: Colors.brLg,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: Colors.brRound,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Colors.gapSmall,
  },
  dropTitle: {
    fontSize: Colors.fontSizeLarge,
    fontWeight: Colors.fontWeightSemibold,
  },
  dropSubtitle: {
    fontSize: Colors.fontSizeSmall,
    textAlign: "center",
    lineHeight: Colors.lineHeightSmall,
  },
  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Colors.gapSmall,
    paddingVertical: Colors.gapMedium,
    borderRadius: Colors.brMd,
  },
  primaryButtonText: {
    fontSize: Colors.fontSizeMedium,
    fontWeight: Colors.fontWeightSemibold,
  },
  hint: {
    fontSize: Colors.fontSizeXSmall,
    textAlign: "center",
  },
});
