import { useEffect, useState } from "react";
import { Animated, Image, StyleSheet } from "react-native";

import { useColorScheme } from "@/src/components/useColorScheme";
import Colors from "@/src/constants/StyleVariables";

type FakeSplashScreenProps = {
  /** Called once the fade-out finishes; the caller unmounts this then. */
  onFinish: () => void;
};

/**
 * A JS-rendered stand-in for the splash screen, shown for a beat right
 * after the *native* splash screen (app.json's `expo-splash-screen` config
 * + app/_layout.tsx's `SplashScreen.hideAsync`) hands off to the app.
 *
 * It's "fake" in that it isn't the OS-level splash — that one is a single
 * static image the OS paints before any JS runs, so it has no styling
 * hooks: no rounded corners on the logo (they'd have to be baked into the
 * PNG itself), no fade. This component can do both, and bridges the
 * native splash's hard cut to the library screen into a smooth handoff.
 */
export default function FakeSplashScreen({ onFinish }: FakeSplashScreenProps) {
  const scheme = useColorScheme();
  const theme = scheme === "dark" ? Colors.dark : Colors.light;
  // Starts fully opaque — not faded in — so there's no frame where this
  // overlay is transparent. It mounts in the same commit that hides the
  // native splash (see app/_layout.tsx), so the very first paint the user
  // sees already has this at opacity 1; only the logo gets an entrance
  // animation, which is purely cosmetic since it never exposes the Slot
  // content underneath.
  const [opacity] = useState(() => new Animated.Value(1));
  const [logoScale] = useState(() => new Animated.Value(0.92));

  useEffect(() => {
    Animated.spring(logoScale, {
      toValue: 1,
      friction: 6,
      tension: 60,
      useNativeDriver: true,
    }).start();

    // Hold briefly, then fade the whole overlay out and hand off to the app.
    const holdTimer = setTimeout(() => {
      Animated.timing(opacity, {
        toValue: 0,
        duration: 280,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) onFinish();
      });
    }, 700);

    return () => clearTimeout(holdTimer);
    // Intentionally run once per mount: `opacity`/`logoScale` are stable
    // across re-renders and `onFinish` is expected to unmount this
    // component, not re-trigger the animation.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        StyleSheet.absoluteFill,
        styles.root,
        { backgroundColor: theme.canvas, opacity },
      ]}
    >
      <Animated.View
        style={[
          styles.logoWrap,
          { backgroundColor: theme.surface, transform: [{ scale: logoScale }] },
          Colors.shadowMd,
        ]}
      >
        <Image
          source={require("@/assets/images/logo.png")}
          style={styles.logo}
          resizeMode="cover"
        />
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    zIndex: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  // Rounded-corner mat around the logo — the logo.png asset itself is a
  // plain square PNG, so the rounding has to happen here via overflow
  // clipping, same idiom as BookCard's cover image.
  logoWrap: {
    width: 104,
    height: 104,
    borderRadius: Colors.brXl,
    overflow: "hidden",
  },
  logo: {
    width: "100%",
    height: "100%",
  },
});
