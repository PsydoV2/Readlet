import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import * as SystemUI from "expo-system-ui";
import { useEffect } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useColorScheme } from "react-native";
import { DarkTheme, DefaultTheme, Slot, ThemeProvider } from "expo-router";
import Colors from "@/src/constants/StyleVariables";
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
  const [loaded, error] = useFonts({
    ...FontAwesome.font,
  });
  const scheme = useColorScheme();

  useEffect(() => {
    if (error) {
      console.error(error);
      SplashScreen.hideAsync().catch(console.error);
    }
  }, [error]);

  useEffect(() => {
    if (!loaded) return;
    const bg = scheme === "dark" ? Colors.dark.canvas : Colors.light.canvas;
    void (async () => {
      await SystemUI.setBackgroundColorAsync(bg).catch(console.error);
      await SplashScreen.hideAsync().catch(console.error);
    })();
  }, [loaded, scheme]);

  if (!loaded && !error) return null;

  return (
    <SafeAreaProvider>
      <ToastProvider>
        <ThemeProvider value={scheme === "dark" ? navigationDarkTheme : navigationLightTheme}>
          <StatusBar style="auto" />
          <Slot />
        </ThemeProvider>
      </ToastProvider>
    </SafeAreaProvider>
  );
}
