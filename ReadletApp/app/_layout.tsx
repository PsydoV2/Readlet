import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import * as SystemUI from "expo-system-ui";
import { useEffect } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useColorScheme } from "react-native";
import { DarkTheme, DefaultTheme, Slot, ThemeProvider } from "expo-router";
import Colors from "@/constants/StyleVariables";
import { ToastProvider } from "@/src/context/ToastProvider";

export { ErrorBoundary } from "expo-router";

SplashScreen.preventAutoHideAsync();

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
    const bg = scheme === "dark" ? Colors.dark.bgDark : Colors.light.bgDark;
    void (async () => {
      await SystemUI.setBackgroundColorAsync(bg).catch(console.error);
      await SplashScreen.hideAsync().catch(console.error);
    })();
  }, [loaded, scheme]);

  if (!loaded && !error) return null;

  return (
    <SafeAreaProvider>
      <ToastProvider>
        <ThemeProvider value={scheme === "dark" ? DarkTheme : DefaultTheme}>
          <StatusBar style="auto" />
          <Slot />
        </ThemeProvider>
      </ToastProvider>
    </SafeAreaProvider>
  );
}
