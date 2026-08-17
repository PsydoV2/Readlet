import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet } from "react-native";

import { PinDots, PinKeypad } from "@/src/components/PinKeypad";
import ScreenHeader from "@/src/components/ScreenHeader";
import { Text, View, useThemeColor } from "@/src/components/Themed";
import Colors from "@/src/constants/StyleVariables";
import { useAppLock } from "@/src/context/AppLockProvider";
import { useToast } from "@/src/context/ToastProvider";
import { goBack } from "@/src/utils/goBack";

const PIN_LENGTH = 4;
const WRONG_PIN_RESET_DELAY_MS = 400;

type Mode = "enable" | "change" | "disable";
type Step = "current" | "new" | "confirm";

/**
 * PIN entry flow for Settings' "App-Sperre" — first-time setup (`?mode=
 * enable`), changing an existing PIN (`change`, asks for the current one
 * first), or disabling the lock (`disable`, also gated behind the current
 * PIN so picking up an unlocked phone isn't enough to turn it off). See
 * `AppLockProvider` for where the PIN is actually persisted.
 */
export default function PinSetup() {
  const { t } = useTranslation();
  const { mode: rawMode } = useLocalSearchParams<{ mode: string }>();
  const mode: Mode = rawMode === "change" || rawMode === "disable" ? rawMode : "enable";
  const router = useRouter();
  const { showToast } = useToast();
  const { verifyPin, setPin, disablePinLock } = useAppLock();

  const [step, setStep] = useState<Step>(mode === "enable" ? "new" : "current");
  const [input, setInput] = useState("");
  const [firstEntry, setFirstEntry] = useState("");
  const [error, setError] = useState(false);

  const textMuted = useThemeColor({}, "textMuted");
  const danger = useThemeColor({}, "danger");

  const title = t(
    mode === "disable" ? "pinSetup.titleDisable" : mode === "change" ? "pinSetup.titleChange" : "pinSetup.titleEnable"
  );
  const subtitle = t(
    error
      ? "pinSetup.subtitleError"
      : step === "current"
        ? "pinSetup.subtitleCurrent"
        : step === "new"
          ? "pinSetup.subtitleNew"
          : "pinSetup.subtitleConfirm"
  );

  function flashError() {
    setError(true);
    setTimeout(() => {
      setError(false);
      setInput("");
    }, WRONG_PIN_RESET_DELAY_MS);
  }

  async function handleComplete(pinValue: string) {
    if (step === "current") {
      if (!verifyPin(pinValue)) {
        flashError();
        return;
      }
      setInput("");

      if (mode === "disable") {
        await disablePinLock();
        showToast(t("pinSetup.disabledToast"), "success");
        goBack(router, "/settings");
        return;
      }

      setStep("new");
      return;
    }

    if (step === "new") {
      setFirstEntry(pinValue);
      setInput("");
      setStep("confirm");
      return;
    }

    // step === "confirm"
    if (pinValue !== firstEntry) {
      setFirstEntry("");
      setStep("new");
      flashError();
      return;
    }

    await setPin(pinValue);
    setInput("");
    showToast(t(mode === "change" ? "pinSetup.changedToast" : "pinSetup.enabledToast"), "success");
    goBack(router, "/settings");
  }

  function handleDigit(digit: string) {
    if (input.length >= PIN_LENGTH) return;
    const next = input + digit;
    setInput(next);
    if (next.length === PIN_LENGTH) void handleComplete(next);
  }

  function handleBackspace() {
    setInput((prev) => prev.slice(0, -1));
  }

  return (
    <View style={styles.root}>
      <ScreenHeader title={title} onBack={() => goBack(router, "/settings")} />

      <View style={styles.content}>
        <Text style={[styles.subtitle, { color: error ? danger : textMuted }]}>{subtitle}</Text>

        <View style={styles.dotsWrapper}>
          <PinDots length={PIN_LENGTH} filled={input.length} error={error} />
        </View>

        <PinKeypad onDigit={handleDigit} onBackspace={handleBackspace} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: {
    flex: 1,
    alignItems: "center",
    paddingTop: Colors.gapXXLarge,
  },
  subtitle: {
    fontSize: Colors.fontSizeMedium,
    marginBottom: Colors.gapXLarge,
  },
  dotsWrapper: {
    marginBottom: Colors.gapXLarge,
  },
});
