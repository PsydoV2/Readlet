import * as SecureStore from "expo-secure-store";

const PIN_KEY = "readlet.appLock.pin";
const BIOMETRIC_ENABLED_KEY = "readlet.appLock.biometricEnabled";

/**
 * Persists the app-lock PIN and biometric preference via expo-secure-store
 * (iOS Keychain / Android Keystore — already encrypted at rest by the OS).
 *
 * The PIN is stored as-is, not hashed: this gates local access to the app
 * on this device, not an account credential guarding a server — there's no
 * separate threat model where a hash adds protection beyond what the
 * OS-encrypted keychain already provides, since the comparison also
 * happens entirely on-device, right next to whatever's stored.
 */

export async function getStoredPin(): Promise<string | null> {
  return SecureStore.getItemAsync(PIN_KEY);
}

export async function savePin(pin: string): Promise<void> {
  await SecureStore.setItemAsync(PIN_KEY, pin);
}

export async function clearPin(): Promise<void> {
  await SecureStore.deleteItemAsync(PIN_KEY);
}

export async function getBiometricEnabledPref(): Promise<boolean> {
  return (await SecureStore.getItemAsync(BIOMETRIC_ENABLED_KEY)) === "true";
}

export async function saveBiometricEnabledPref(enabled: boolean): Promise<void> {
  if (enabled) {
    await SecureStore.setItemAsync(BIOMETRIC_ENABLED_KEY, "true");
  } else {
    await SecureStore.deleteItemAsync(BIOMETRIC_ENABLED_KEY);
  }
}
