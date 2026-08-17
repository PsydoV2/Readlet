import { useThemePreference } from "@/src/context/ThemePreferenceProvider";

/**
 * Resolved light/dark scheme — follows the OS unless the user picked an
 * explicit theme in Settings (`app/settings.tsx`). Backed by
 * `ThemePreferenceProvider`; must be used within it (the whole app is, via
 * `app/_layout.tsx`).
 */
export function useColorScheme(): "light" | "dark" {
  return useThemePreference().colorScheme;
}
