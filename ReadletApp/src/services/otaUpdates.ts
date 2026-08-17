import * as Updates from "expo-updates";

/**
 * Thin wrapper around `expo-updates` for the manual "Nach Updates suchen"
 * row in Settings (see `app/(auth)/settings.tsx`).
 *
 * OTA updates themselves need no app code at all beyond the `app.json`
 * `updates`/`runtimeVersion` config and the `channel` set per build profile
 * in `eas.json`: `expo-updates` already checks for a new update on every
 * cold start and, if one is found, downloads it silently in the background
 * and applies it on the *next* cold start — no code, no interrupted
 * session. This module only exists to let a user check *right now* and
 * apply immediately, mirroring the "Jetzt sperren" pattern elsewhere in
 * Settings (a manual trigger for something that also happens on its own).
 *
 * `Updates.isEnabled` is false whenever there's no update to check against
 * — Expo Go, a dev build, or `__DEV__` in general — so every function here
 * degrades to a `"unavailable"` result instead of throwing in those cases,
 * the same way `biometricAvailable` degrades in `AppLockProvider` rather
 * than crashing when there's no hardware.
 */
export type UpdateCheckResult = "unavailable" | "upToDate" | "installed" | "error";

/**
 * Checks for a new update and, if one exists, downloads and applies it
 * immediately (reloading the app). Resolves once a result is known — the
 * "installed" case never actually resolves in practice, since
 * `Updates.reloadAsync()` restarts the app first.
 */
export async function checkAndApplyUpdate(): Promise<UpdateCheckResult> {
  if (__DEV__ || !Updates.isEnabled) return "unavailable";

  try {
    const check = await Updates.checkForUpdateAsync();
    if (!check.isAvailable) return "upToDate";

    await Updates.fetchUpdateAsync();
    await Updates.reloadAsync();
    return "installed";
  } catch (error) {
    console.error("[otaUpdates] check/apply failed", error);
    return "error";
  }
}
