import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { useColorScheme as useSystemColorScheme } from "react-native";

export type ThemePreference = "system" | "light" | "dark";

type ThemePreferenceContextValue = {
  themePreference: ThemePreference;
  setThemePreference: (preference: ThemePreference) => void;
  /** "system" resolved against the current OS setting; otherwise the explicit choice. */
  colorScheme: "light" | "dark";
};

const ThemePreferenceContext = createContext<ThemePreferenceContextValue | null>(null);

/**
 * Lets the user override the OS color scheme from Settings. Not persisted
 * yet — resets to "system" on app restart until local storage is wired up
 * (see CLAUDE.md roadmap). Every themed surface should read the resolved
 * scheme via `useColorScheme` from `@/src/components/useColorScheme` (which
 * this provider backs) rather than react-native's raw hook, so the override
 * actually cascades.
 */
export function ThemePreferenceProvider({ children }: { children: ReactNode }) {
  const systemScheme = useSystemColorScheme();
  const [themePreference, setThemePreference] = useState<ThemePreference>("system");

  const colorScheme: "light" | "dark" =
    themePreference === "system" ? (systemScheme === "dark" ? "dark" : "light") : themePreference;

  const value = useMemo(
    () => ({ themePreference, setThemePreference, colorScheme }),
    [themePreference, colorScheme]
  );

  return <ThemePreferenceContext.Provider value={value}>{children}</ThemePreferenceContext.Provider>;
}

export function useThemePreference() {
  const ctx = useContext(ThemePreferenceContext);
  if (!ctx) throw new Error("useThemePreference must be used within a ThemePreferenceProvider");
  return ctx;
}
