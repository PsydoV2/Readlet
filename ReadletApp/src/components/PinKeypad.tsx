import { Pressable, StyleSheet } from "react-native";

import { Text, View, useThemeColor } from "@/src/components/Themed";
import Colors from "@/src/constants/StyleVariables";

/** Row of filled/empty dots showing how many of `length` digits have been entered. */
export function PinDots({ length, filled, error }: { length: number; filled: number; error?: boolean }) {
  const border = useThemeColor({}, "border");
  const primary = useThemeColor({}, "primary");
  const danger = useThemeColor({}, "danger");

  const activeColor = error ? danger : primary;

  return (
    <View style={dotStyles.row}>
      {Array.from({ length }).map((_, i) => (
        <View
          key={i}
          style={[
            dotStyles.dot,
            {
              borderColor: i < filled ? activeColor : border,
              backgroundColor: i < filled ? activeColor : "transparent",
            },
          ]}
        />
      ))}
    </View>
  );
}

const dotStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: Colors.gapLarge,
    backgroundColor: "transparent",
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: Colors.brRound,
    borderWidth: 1.5,
  },
});

const KEY_SIZE = 92;
const KEY_GAP = Colors.gapLarge;
const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "⌫"] as const;

/** 3×4 numeric keypad — digits, a blank spacer cell, and backspace. */
export function PinKeypad({ onDigit, onBackspace }: { onDigit: (digit: string) => void; onBackspace: () => void }) {
  const surfaceHover = useThemeColor({}, "surfaceHover");
  const border = useThemeColor({}, "border");

  return (
    <View style={keypadStyles.grid}>
      {KEYS.map((key, i) => {
        if (key === "") return <View key={i} style={keypadStyles.key} />;

        const onPress = key === "⌫" ? onBackspace : () => onDigit(key);
        return (
          <Pressable
            key={i}
            onPress={onPress}
            hitSlop={4}
            style={({ pressed }) => [
              keypadStyles.key,
              { backgroundColor: pressed ? border : surfaceHover },
            ]}
          >
            <Text style={keypadStyles.keyLabel}>{key}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const keypadStyles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    width: KEY_SIZE * 3 + KEY_GAP * 2,
    gap: KEY_GAP,
    backgroundColor: "transparent",
  },
  key: {
    width: KEY_SIZE,
    height: KEY_SIZE,
    borderRadius: Colors.brRound,
    alignItems: "center",
    justifyContent: "center",
  },
  keyLabel: {
    fontSize: Colors.fontSizeXXLarge,
    fontWeight: Colors.fontWeightSemibold,
  },
});
