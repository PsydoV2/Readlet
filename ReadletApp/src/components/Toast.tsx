import Colors from "@/src/constants/StyleVariables";
import { useColorScheme } from "@/src/components/useColorScheme";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useEffect, useRef, useState } from "react";
import { Animated, Pressable, StyleSheet, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type ToastProps = {
  message: string;
  type?: "success" | "error" | "info";
  duration?: number; // in ms
  onHide?: () => void;
};

const ICON_BY_TYPE = {
  success: "check-circle" as const,
  error: "exclamation-circle" as const,
  info: "info-circle" as const,
};

/**
 * Bottom-anchored toast, styled as a neutral card (surface + border) rather
 * than a solid status-color fill — a full-color banner clashes with the
 * design system's rule that color lives only in accents, never a background
 * fill (see CLAUDE.md's Library FAB note for the same reasoning). The status
 * color shows up only on the leading icon.
 *
 * Anchored to the bottom, not the top: a top toast used to sit right over
 * the Library header's import/settings buttons — un-dismissable and
 * un-clickable-through until it timed out. Bottom also gets a tap-to-dismiss
 * so a message never has to be waited out.
 */
export default function Toast({
  message,
  type = "info",
  duration = 3000,
  onHide,
}: ToastProps) {
  const [visible, setVisible] = useState(true);
  const translateY = useRef(new Animated.Value(100)).current;
  const colorScheme = useColorScheme();
  const colorPalette = colorScheme === "dark" ? Colors.dark : Colors.light;
  const insets = useSafeAreaInsets();

  const accentColor =
    type === "success"
      ? colorPalette.success
      : type === "error"
      ? colorPalette.danger
      : colorPalette.info;

  const hide = () => {
    Animated.timing(translateY, {
      toValue: 100,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setVisible(false);
      onHide?.();
    });
  };

  useEffect(() => {
    Animated.spring(translateY, {
      toValue: 0,
      useNativeDriver: true,
    }).start();

    const timer = setTimeout(hide, duration);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [duration]);

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          bottom: insets.bottom + Colors.gapLarge,
          backgroundColor: colorPalette.surface,
          borderColor: colorPalette.border,
          transform: [{ translateY }],
        },
        Colors.shadowMd,
      ]}
    >
      <Pressable onPress={hide} style={styles.pressable} hitSlop={4}>
        <FontAwesome name={ICON_BY_TYPE[type]} size={18} color={accentColor} />
        <Text style={[styles.text, { color: colorPalette.text }]}>{message}</Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: Colors.gapLarge,
    right: Colors.gapLarge,
    borderRadius: Colors.brMd,
    borderWidth: StyleSheet.hairlineWidth,
    zIndex: 9999,
  },
  pressable: {
    flexDirection: "row",
    alignItems: "center",
    gap: Colors.gapSmall,
    paddingVertical: Colors.gapMedium,
    paddingHorizontal: Colors.gapLarge,
  },
  text: {
    flex: 1,
    fontSize: Colors.fontSizeMedium,
    fontWeight: Colors.fontWeightMedium,
  },
});
