import { useEffect, useState } from "react";
import { Pressable, StyleSheet } from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { Redirect } from "expo-router";

import { PinDots, PinKeypad } from "@/src/components/PinKeypad";
import { Text, View, useThemeColor } from "@/src/components/Themed";
import Colors from "@/src/constants/StyleVariables";
import { useAppLock } from "@/src/context/AppLockProvider";

const PIN_LENGTH = 4;
const WRONG_PIN_RESET_DELAY_MS = 400;

/**
 * The app-lock gate — outside the `(auth)` group so it's reachable while
 * locked (`(auth)/_layout.tsx` redirects here). No back button: the only
 * way past it is a correct PIN or biometric match, calling `unlock()`,
 * which flips `isLocked` false and this redirects straight back to `/`.
 */
export default function Lock() {
  const { isLocked, biometricEnabled, biometricLabel, verifyPin, authenticateWithBiometrics, unlock } = useAppLock();
  const [input, setInput] = useState("");
  const [error, setError] = useState(false);

  const primary = useThemeColor({}, "primary");
  const primarySoft = useThemeColor({}, "primarySoft");
  const textMuted = useThemeColor({}, "textMuted");
  const danger = useThemeColor({}, "danger");

  async function tryBiometrics() {
    const success = await authenticateWithBiometrics();
    if (success) unlock();
  }

  // Offer biometrics immediately on mount, so a Face ID/fingerprint user
  // usually never has to touch the keypad at all.
  useEffect(() => {
    if (biometricEnabled) void tryBiometrics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!isLocked) return <Redirect href="/" />;

  function handleDigit(digit: string) {
    if (input.length >= PIN_LENGTH) return;
    const next = input + digit;
    setInput(next);
    if (next.length < PIN_LENGTH) return;

    if (verifyPin(next)) {
      unlock();
      setInput("");
      setError(false);
      return;
    }

    setError(true);
    setTimeout(() => {
      setInput("");
      setError(false);
    }, WRONG_PIN_RESET_DELAY_MS);
  }

  function handleBackspace() {
    setInput((prev) => prev.slice(0, -1));
  }

  return (
    <View style={styles.root}>
      <View style={[styles.iconCircle, { backgroundColor: primarySoft }]}>
        <FontAwesome name="lock" size={26} color={primary} />
      </View>
      <Text style={styles.title}>Readlet ist gesperrt</Text>
      <Text style={[styles.subtitle, { color: error ? danger : textMuted }]}>
        {error ? "Falsche PIN" : "Gib deine PIN ein"}
      </Text>

      <View style={styles.dotsWrapper}>
        <PinDots length={PIN_LENGTH} filled={input.length} error={error} />
      </View>

      <PinKeypad onDigit={handleDigit} onBackspace={handleBackspace} />

      {biometricEnabled && (
        <Pressable onPress={tryBiometrics} hitSlop={8} style={styles.biometricButton}>
          <Text style={[styles.biometricButtonText, { color: primary }]}>Mit {biometricLabel} entsperren</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Colors.gapXLarge,
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
  subtitle: {
    fontSize: Colors.fontSizeMedium,
    marginTop: 2,
    marginBottom: Colors.gapXLarge,
  },
  dotsWrapper: {
    marginBottom: Colors.gapXLarge,
  },
  biometricButton: {
    marginTop: Colors.gapMedium,
  },
  biometricButtonText: {
    fontSize: Colors.fontSizeMedium,
    fontWeight: Colors.fontWeightMedium,
  },
});
