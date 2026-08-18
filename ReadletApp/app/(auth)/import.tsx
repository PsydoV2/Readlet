import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Pressable, StyleSheet } from "react-native";

import ScreenHeader from "@/src/components/ScreenHeader";
import { Text, View, useThemeColor } from "@/src/components/Themed";
import Colors from "@/src/constants/StyleVariables";
import { useImportFlow } from "@/src/hooks/useImportFlow";
import { goBack } from "@/src/utils/goBack";

/**
 * Import flow entry point, presented as a modal from the "+" icon in the
 * Library header. Real: opens the native file picker, copies the file into
 * app storage, extracts/parses it (`src/services/importBook.ts`), and
 * lands on the new book's detail page.
 */
export default function Import() {
  const { t } = useTranslation();
  const router = useRouter();
  const { handlePick, isImporting } = useImportFlow((book) =>
    router.replace({ pathname: "/book/[id]", params: { id: book.id } })
  );
  const primary = useThemeColor({}, "primary");
  const primarySoft = useThemeColor({}, "primarySoft");
  const textMuted = useThemeColor({}, "textMuted");
  const border = useThemeColor({}, "border");

  return (
    <View style={styles.root}>
      <ScreenHeader title={t("import.title")} onClose={() => goBack(router, "/")} />

      <View style={styles.content}>
        <Pressable
          onPress={handlePick}
          disabled={isImporting}
          style={({ pressed }) => [styles.dropZone, { borderColor: border, opacity: pressed || isImporting ? 0.7 : 1 }]}
        >
          {isImporting ? (
            <ActivityIndicator color={primary} />
          ) : (
            <>
              <View style={[styles.iconCircle, { backgroundColor: primarySoft }]}>
                <FontAwesome name="upload" size={22} color={primary} />
              </View>
              <Text style={styles.dropTitle}>{t("import.dropTitle")}</Text>
              <Text style={[styles.dropSubtitle, { color: textMuted }]}>{t("import.dropSubtitle")}</Text>
            </>
          )}
        </Pressable>

        <Text style={[styles.hint, { color: textMuted }]}>{t("import.hint")}</Text>
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
  hint: {
    fontSize: Colors.fontSizeXSmall,
    textAlign: "center",
  },
});
