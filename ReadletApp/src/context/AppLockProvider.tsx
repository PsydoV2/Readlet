import * as LocalAuthentication from "expo-local-authentication";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { AppState, type AppStateStatus } from "react-native";

import {
  clearPin,
  getBiometricEnabledPref,
  getStoredPin,
  saveBiometricEnabledPref,
  savePin,
} from "@/src/services/appLockStorage";

type AppLockContextValue = {
  /** Persisted lock state has finished loading — gate rendering on this to avoid a flash of unlocked content. */
  isHydrated: boolean;
  /** Whether the lock screen should be shown right now. */
  isLocked: boolean;
  pinEnabled: boolean;
  biometricEnabled: boolean;
  /** Device has biometric hardware with at least one face/fingerprint enrolled. */
  biometricAvailable: boolean;
  /** "Face ID" / "Fingerabdruck" / "Biometrie", depending on what the device supports — for button copy. */
  biometricLabel: string;
  setPin: (pin: string) => Promise<void>;
  verifyPin: (candidate: string) => boolean;
  disablePinLock: () => Promise<void>;
  /** Prompts biometrics to confirm before persisting when enabling. Returns whether it took effect. */
  setBiometricEnabled: (enabled: boolean) => Promise<boolean>;
  authenticateWithBiometrics: () => Promise<boolean>;
  unlock: () => void;
  lockNow: () => void;
};

const AppLockContext = createContext<AppLockContextValue | null>(null);

/**
 * Local device-lock gate (PIN + optional biometrics) — see
 * `src/services/appLockStorage.ts` for what's persisted and why the PIN
 * isn't hashed. Wraps the app in `app/_layout.tsx`; `ThemedApp` renders
 * `AppLockScreen` instead of the `Stack` while `isLocked` is true.
 */
export function AppLockProvider({ children }: { children: ReactNode }) {
  const [isHydrated, setIsHydrated] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [pin, setPinState] = useState<string | null>(null);
  const [biometricEnabled, setBiometricEnabledState] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricLabel, setBiometricLabel] = useState("Biometrie");

  const pinEnabled = pin !== null;

  // Hydrate persisted state once on mount, then decide up front whether the
  // lock screen is needed — app/_layout.tsx keeps the splash screen up
  // until isHydrated, so there's no flash of unlocked content either way.
  useEffect(() => {
    void (async () => {
      try {
        const [storedPin, storedBiometricPref, hasHardware, isEnrolled, supportedTypes] = await Promise.all([
          getStoredPin(),
          getBiometricEnabledPref(),
          LocalAuthentication.hasHardwareAsync(),
          LocalAuthentication.isEnrolledAsync(),
          LocalAuthentication.supportedAuthenticationTypesAsync(),
        ]);

        const biometricSupported = hasHardware && isEnrolled;

        setPinState(storedPin);
        setBiometricAvailable(biometricSupported);
        setBiometricEnabledState(storedBiometricPref && biometricSupported);
        setBiometricLabel(
          supportedTypes.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)
            ? "Face ID"
            : supportedTypes.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)
              ? "Fingerabdruck"
              : "Biometrie"
        );
        setIsLocked(storedPin !== null);
      } catch (error) {
        console.error("Failed to hydrate app lock state", error);
      } finally {
        setIsHydrated(true);
      }
    })();
  }, []);

  // Re-lock whenever the app is fully backgrounded, so returning to it
  // always requires unlocking. "inactive" (e.g. the biometric system
  // prompt, an incoming call banner) is intentionally not treated as
  // backgrounding, or authenticating would immediately re-lock itself.
  const pinEnabledRef = useRef(pinEnabled);
  useEffect(() => {
    pinEnabledRef.current = pinEnabled;
  }, [pinEnabled]);
  useEffect(() => {
    const handleAppStateChange = (nextState: AppStateStatus) => {
      if (nextState === "background" && pinEnabledRef.current) {
        setIsLocked(true);
      }
    };
    const subscription = AppState.addEventListener("change", handleAppStateChange);
    return () => subscription.remove();
  }, []);

  const setPin = useCallback(async (newPin: string) => {
    await savePin(newPin);
    setPinState(newPin);
  }, []);

  const verifyPin = useCallback((candidate: string) => candidate.length > 0 && candidate === pin, [pin]);

  const disablePinLock = useCallback(async () => {
    await clearPin();
    await saveBiometricEnabledPref(false);
    setPinState(null);
    setBiometricEnabledState(false);
  }, []);

  const setBiometricEnabled = useCallback(async (enabled: boolean) => {
    if (enabled) {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: "Bestätige, um die biometrische Entsperrung zu aktivieren",
      });
      if (!result.success) return false;
    }
    await saveBiometricEnabledPref(enabled);
    setBiometricEnabledState(enabled);
    return true;
  }, []);

  const authenticateWithBiometrics = useCallback(async () => {
    const result = await LocalAuthentication.authenticateAsync({ promptMessage: "Entsperre Readlet" });
    return result.success;
  }, []);

  const unlock = useCallback(() => setIsLocked(false), []);
  const lockNow = useCallback(() => setIsLocked(true), []);

  const value = useMemo<AppLockContextValue>(
    () => ({
      isHydrated,
      isLocked,
      pinEnabled,
      biometricEnabled,
      biometricAvailable,
      biometricLabel,
      setPin,
      verifyPin,
      disablePinLock,
      setBiometricEnabled,
      authenticateWithBiometrics,
      unlock,
      lockNow,
    }),
    [
      isHydrated,
      isLocked,
      pinEnabled,
      biometricEnabled,
      biometricAvailable,
      biometricLabel,
      setPin,
      verifyPin,
      disablePinLock,
      setBiometricEnabled,
      authenticateWithBiometrics,
      unlock,
      lockNow,
    ]
  );

  return <AppLockContext.Provider value={value}>{children}</AppLockContext.Provider>;
}

export function useAppLock() {
  const ctx = useContext(AppLockContext);
  if (!ctx) throw new Error("useAppLock must be used within an AppLockProvider");
  return ctx;
}
