import "@/src/i18n"; // side-effect: initializes i18next synchronously before anything renders

import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import * as SystemUI from "expo-system-ui";
import { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { DarkTheme, DefaultTheme, Slot, ThemeProvider } from "expo-router";
import Colors from "@/src/constants/StyleVariables";
import { useColorScheme } from "@/src/components/useColorScheme";
import { AppLockProvider, useAppLock } from "@/src/context/AppLockProvider";
import { LibraryProvider } from "@/src/context/LibraryProvider";
import { ThemePreferenceProvider } from "@/src/context/ThemePreferenceProvider";
import { ToastProvider } from "@/src/context/ToastProvider";

export { ErrorBoundary } from "expo-router";

SplashScreen.preventAutoHideAsync();

// Navigation chrome (headers/back buttons on any Stack we add, default
// screen/card backgrounds) themed from our own palette instead of the
// generic iOS-blue expo-router defaults.
const navigationLightTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: Colors.light.primary,
    background: Colors.light.canvas,
    card: Colors.light.surface,
    text: Colors.light.text,
    border: Colors.light.border,
    notification: Colors.light.danger,
  },
};

const navigationDarkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: Colors.dark.primary,
    background: Colors.dark.canvas,
    card: Colors.dark.surface,
    text: Colors.dark.text,
    border: Colors.dark.border,
    notification: Colors.dark.danger,
  },
};

export default function RootLayout() {
  return (
    // Required by react-native-gesture-handler (used for the reader's
    // swipe-to-change-chapter gesture) to work on Android — must wrap
    // everything, at the outermost level.
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemePreferenceProvider>
          {/* Wraps everything so both app/lock.tsx and (auth)/_layout.tsx's
              redirect can read it — see src/context/AppLockProvider.tsx. */}
          <AppLockProvider>
            <LibraryProvider>
              <ToastProvider>
                <ThemedApp />
              </ToastProvider>
            </LibraryProvider>
          </AppLockProvider>
        </ThemePreferenceProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

/**
 * Split out so it can read the resolved (user-overridable) scheme from
 * `ThemePreferenceProvider` and the hydrated lock state from
 * `AppLockProvider`. Rendering is held back (native splash screen stays up)
 * until both fonts and the persisted lock state are ready, so there's
 * never a flash of unlocked content or unstyled icons. Which of `/lock` vs
 * `(auth)/...` actually renders is decided by `(auth)/_layout.tsx`'s
 * redirect, not here — this just provides the themed shell around
 * whichever route is active.
 */
function ThemedApp() {
  const [fontsLoaded, fontError] = useFonts({ ...FontAwesome.font });
  const scheme = useColorScheme();
  const { isHydrated } = useAppLock();

  const ready = (fontsLoaded || Boolean(fontError)) && isHydrated;

  useEffect(() => {
    if (fontError) console.error(fontError);
  }, [fontError]);

  useEffect(() => {
    if (!ready) return;
    const bg = scheme === "dark" ? Colors.dark.canvas : Colors.light.canvas;
    void (async () => {
      await SystemUI.setBackgroundColorAsync(bg).catch(console.error);
      await SplashScreen.hideAsync().catch(console.error);
    })();
  }, [ready, scheme]);

  if (!ready) return null;

  return (
    <ThemeProvider value={scheme === "dark" ? navigationDarkTheme : navigationLightTheme}>
      <StatusBar style={scheme === "dark" ? "light" : "dark"} />
      {/*
        No native header, no tab bar anywhere below: every screen owns its
        full-bleed layout and draws its own chrome (see ScreenHeader)
        instead of expo-router's default page-title header / bottom nav.
      */}
      <Slot />
    </ThemeProvider>
  );
}
