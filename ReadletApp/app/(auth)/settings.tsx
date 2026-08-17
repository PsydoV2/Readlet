import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Linking, Pressable, ScrollView, StyleSheet, Switch } from "react-native";

import ScreenHeader from "@/src/components/ScreenHeader";
import { Card, Text, View, useThemeColor } from "@/src/components/Themed";
import Colors from "@/src/constants/StyleVariables";
import LegalLinks from "@/src/constants/LegalLinks";
import { useAppLock } from "@/src/context/AppLockProvider";
import { useToast } from "@/src/context/ToastProvider";
import { type ThemePreference, useThemePreference } from "@/src/context/ThemePreferenceProvider";
import { goBack } from "@/src/utils/goBack";

type LanguageOption = "system" | "de" | "en";
type IconName = React.ComponentProps<typeof FontAwesome>["name"];

const themeOptions: { value: ThemePreference; label: string; icon: IconName }[] = [
  { value: "system", label: "System", icon: "adjust" },
  { value: "light", label: "Hell", icon: "sun-o" },
  { value: "dark", label: "Dunkel", icon: "moon-o" },
];

const languageOptions: { value: LanguageOption; label: string }[] = [
  { value: "system", label: "Systemsprache" },
  { value: "de", label: "Deutsch" },
  { value: "en", label: "English" },
];

/**
 * Settings modal: appearance (theme), language (UI only — no i18n wired up
 * yet, see CLAUDE.md), app lock (PIN + optional biometrics, fully
 * functional — see `AppLockProvider`), and external links to the legal
 * pages (Datenschutz/Impressum live on the website, not in-app — see
 * src/constants/LegalLinks.ts). Presented as a modal from the gear icon in
 * the Library header.
 */
export default function Settings() {
  const router = useRouter();
  const { showToast } = useToast();
  const { themePreference, setThemePreference } = useThemePreference();
  const { pinEnabled, biometricEnabled, biometricAvailable, biometricLabel, setBiometricEnabled, lockNow } =
    useAppLock();
  const [language, setLanguage] = useState<LanguageOption>("system");

  const textMuted = useThemeColor({}, "textMuted");
  const border = useThemeColor({}, "border");
  const primary = useThemeColor({}, "primary");

  function handleSelectLanguage(value: LanguageOption) {
    setLanguage(value);
    showToast("Sprachumschaltung folgt in einer späteren Version", "info");
  }

  function openLegalLink(url: string) {
    Linking.openURL(url).catch(() => showToast("Link konnte nicht geöffnet werden", "error"));
  }

  function handleTogglePinLock(next: boolean) {
    router.push({ pathname: "/settings-pin", params: { mode: next ? "enable" : "disable" } });
  }

  async function handleToggleBiometric(next: boolean) {
    const applied = await setBiometricEnabled(next);
    if (!applied) {
      showToast(`${biometricLabel} konnte nicht aktiviert werden`, "error");
    }
  }

  const appLockRows = [
    {
      key: "pinToggle",
      kind: "switch" as const,
      icon: "lock" as IconName,
      label: "PIN-Sperre",
      value: pinEnabled,
      onValueChange: handleTogglePinLock,
    },
    pinEnabled && {
      key: "changePin",
      kind: "action" as const,
      label: "PIN ändern",
      onPress: () => router.push({ pathname: "/settings-pin", params: { mode: "change" } }),
    },
    pinEnabled &&
      biometricAvailable && {
        key: "biometric",
        kind: "switch" as const,
        icon: "unlock-alt" as IconName,
        label: `${biometricLabel} verwenden`,
        value: biometricEnabled,
        onValueChange: handleToggleBiometric,
      },
    pinEnabled && {
      key: "lockNow",
      kind: "action" as const,
      label: "Jetzt sperren",
      onPress: lockNow,
    },
  ].filter((row): row is Exclude<typeof row, false | undefined> => Boolean(row));

  return (
    <View style={styles.root}>
      <ScreenHeader title="Einstellungen" onClose={() => goBack(router, "/")} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <SectionLabel color={textMuted}>Erscheinungsbild</SectionLabel>
        <Card style={styles.sectionCard}>
          {themeOptions.map((option, index) => (
            <OptionRow
              key={option.value}
              icon={option.icon}
              label={option.label}
              selected={themePreference === option.value}
              showDivider={index < themeOptions.length - 1}
              borderColor={border}
              accentColor={primary}
              onPress={() => setThemePreference(option.value)}
            />
          ))}
        </Card>

        <SectionLabel color={textMuted}>Sprache</SectionLabel>
        <Card style={styles.sectionCard}>
          {languageOptions.map((option, index) => (
            <OptionRow
              key={option.value}
              label={option.label}
              selected={language === option.value}
              showDivider={index < languageOptions.length - 1}
              borderColor={border}
              accentColor={primary}
              onPress={() => handleSelectLanguage(option.value)}
            />
          ))}
        </Card>

        <SectionLabel color={textMuted}>App-Sperre</SectionLabel>
        <Card style={styles.sectionCard}>
          {appLockRows.map((row, index) => {
            const showDivider = index < appLockRows.length - 1;
            if (row.kind === "switch") {
              return (
                <SwitchRow
                  key={row.key}
                  icon={row.icon}
                  label={row.label}
                  value={row.value}
                  onValueChange={row.onValueChange}
                  showDivider={showDivider}
                  borderColor={border}
                />
              );
            }
            return (
              <ActionRow
                key={row.key}
                label={row.label}
                trailingIcon="chevron-right"
                showDivider={showDivider}
                borderColor={border}
                onPress={row.onPress}
              />
            );
          })}
        </Card>

        <SectionLabel color={textMuted}>Rechtliches</SectionLabel>
        <Card style={styles.sectionCard}>
          <ActionRow
            icon="shield"
            label="Datenschutz"
            trailingIcon="external-link"
            borderColor={border}
            showDivider
            onPress={() => openLegalLink(LegalLinks.privacyUrl)}
          />
          <ActionRow
            icon="info-circle"
            label="Impressum"
            trailingIcon="external-link"
            borderColor={border}
            onPress={() => openLegalLink(LegalLinks.imprintUrl)}
          />
        </Card>
      </ScrollView>
    </View>
  );
}

function SectionLabel({ children, color }: { children: string; color: string }) {
  return <Text style={[styles.sectionLabel, { color }]}>{children}</Text>;
}

function OptionRow({
  icon,
  label,
  selected,
  showDivider,
  borderColor,
  accentColor,
  onPress,
}: {
  icon?: IconName;
  label: string;
  selected: boolean;
  showDivider: boolean;
  borderColor: string;
  accentColor: string;
  onPress: () => void;
}) {
  const text = useThemeColor({}, "text");
  const textMuted = useThemeColor({}, "textMuted");

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        showDivider && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: borderColor },
        pressed && styles.rowPressed,
      ]}
    >
      <View style={styles.rowLeft}>
        {icon && <FontAwesome name={icon} size={16} color={selected ? accentColor : textMuted} style={styles.rowIcon} />}
        <Text style={[styles.rowLabel, { color: text }]}>{label}</Text>
      </View>
      {selected && <FontAwesome name="check" size={15} color={accentColor} />}
    </Pressable>
  );
}

/** Pressable row for navigation/instant actions — Datenschutz/Impressum (external), "PIN ändern"/"Jetzt sperren" (internal). */
function ActionRow({
  icon,
  label,
  trailingIcon,
  showDivider,
  borderColor,
  onPress,
}: {
  icon?: IconName;
  label: string;
  trailingIcon: IconName;
  showDivider?: boolean;
  borderColor: string;
  onPress: () => void;
}) {
  const textSubtle = useThemeColor({}, "textSubtle");

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        showDivider && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: borderColor },
        pressed && styles.rowPressed,
      ]}
    >
      <View style={styles.rowLeft}>
        {icon && <FontAwesome name={icon} size={16} color={textSubtle} style={styles.rowIcon} />}
        <Text style={styles.rowLabel}>{label}</Text>
      </View>
      <FontAwesome name={trailingIcon} size={13} color={textSubtle} />
    </Pressable>
  );
}

/** Row with a trailing `Switch` — "PIN-Sperre", "Face ID/Fingerabdruck verwenden". Only the switch itself is interactive. */
function SwitchRow({
  icon,
  label,
  value,
  onValueChange,
  showDivider,
  borderColor,
}: {
  icon?: IconName;
  label: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  showDivider?: boolean;
  borderColor: string;
}) {
  const textSubtle = useThemeColor({}, "textSubtle");
  const border = useThemeColor({}, "border");
  const primary = useThemeColor({}, "primary");
  const surface = useThemeColor({}, "surface");

  return (
    <View
      style={[
        styles.row,
        showDivider && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: borderColor },
      ]}
    >
      <View style={styles.rowLeft}>
        {icon && <FontAwesome name={icon} size={16} color={textSubtle} style={styles.rowIcon} />}
        <Text style={styles.rowLabel}>{label}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: border, true: primary }}
        thumbColor={surface}
        ios_backgroundColor={border}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: {
    paddingHorizontal: Colors.gapLarge,
    paddingBottom: Colors.gapXXXLarge,
    gap: Colors.gapSmall,
  },
  sectionLabel: {
    fontSize: Colors.fontSizeXSmall,
    fontWeight: Colors.fontWeightSemibold,
    letterSpacing: 0.4,
    textTransform: "uppercase",
    marginTop: Colors.gapLarge,
    marginBottom: Colors.gapXSmall,
    marginLeft: Colors.gapXSmall,
  },
  sectionCard: {
    padding: 0,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Colors.gapLarge,
    paddingVertical: Colors.gapMedium,
  },
  rowPressed: {
    opacity: 0.6,
  },
  rowLeft: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "transparent",
  },
  rowIcon: {
    width: 22,
  },
  rowLabel: {
    fontSize: Colors.fontSizeMedium,
  },
});
