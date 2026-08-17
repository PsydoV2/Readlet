import FontAwesome from "@expo/vector-icons/FontAwesome";
import { Pressable, StyleSheet, type GestureResponderEvent } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Text, View, useThemeColor } from "@/src/components/Themed";
import Colors from "@/src/constants/StyleVariables";

type ScreenHeaderProps = {
  title?: string;
  /** Shows a chevron-left button that calls this handler (typically `router.back()`). */
  onBack?: (event: GestureResponderEvent) => void;
  /** Shows a close ("×") button instead of a back chevron — for modal screens. */
  onClose?: (event: GestureResponderEvent) => void;
  right?: React.ReactNode;
};

/**
 * Minimal in-content header used instead of expo-router's default native
 * header, so every screen fully controls its own chrome. Pair with
 * `headerShown: false` on the Stack.
 */
export default function ScreenHeader({ title, onBack, onClose, right }: ScreenHeaderProps) {
  const insets = useSafeAreaInsets();
  const text = useThemeColor({}, "text");

  return (
    <View style={[styles.root, { paddingTop: insets.top + Colors.gapSmall }]}>
      <View style={styles.side}>
        {onBack && (
          <Pressable
            onPress={onBack}
            hitSlop={8}
            style={({ pressed }) => [styles.iconButton, pressed && styles.iconButtonPressed]}
          >
            <FontAwesome name="chevron-left" size={16} color={text} />
          </Pressable>
        )}
        {onClose && (
          <Pressable
            onPress={onClose}
            hitSlop={8}
            style={({ pressed }) => [styles.iconButton, pressed && styles.iconButtonPressed]}
          >
            <FontAwesome name="close" size={18} color={text} />
          </Pressable>
        )}
      </View>

      {title ? (
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
      ) : (
        <View style={styles.title} />
      )}

      <View style={[styles.side, styles.sideRight]}>{right}</View>
    </View>
  );
}

const ICON_BUTTON_SIZE = 36;

const styles = StyleSheet.create({
  root: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Colors.gapLarge,
    paddingBottom: Colors.gapSmall,
  },
  side: {
    width: ICON_BUTTON_SIZE,
    flexDirection: "row",
    backgroundColor: "transparent",
  },
  sideRight: {
    justifyContent: "flex-end",
  },
  iconButton: {
    width: ICON_BUTTON_SIZE,
    height: ICON_BUTTON_SIZE,
    borderRadius: Colors.brRound,
    alignItems: "center",
    justifyContent: "center",
  },
  iconButtonPressed: {
    opacity: 0.6,
  },
  title: {
    flex: 1,
    textAlign: "center",
    fontSize: Colors.fontSizeMedium,
    fontWeight: Colors.fontWeightSemibold,
  },
});
