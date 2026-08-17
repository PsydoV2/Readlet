import { type ComponentProps } from "react";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { Tabs } from "expo-router";
import { type ColorValue } from "react-native";
import Colors from "@/src/constants/StyleVariables";
import { useColorScheme } from "react-native";

function TabBarIcon(props: {
  name: ComponentProps<typeof FontAwesome>["name"];
  color: ColorValue;
}) {
  return <FontAwesome size={26} style={{ marginBottom: -2 }} {...props} />;
}

export default function TabsLayout() {
  const scheme = useColorScheme();
  const theme = Colors[scheme === "dark" ? "dark" : "light"];

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: theme.bgDark },
        headerTintColor: theme.text,
        tabBarStyle: { backgroundColor: theme.bgDark },
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.borderMuted,
        tabBarLabelStyle: { fontSize: 12, fontWeight: "600" },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Library",
          tabBarIcon: ({ color }) => <TabBarIcon name="book" color={color} />,
        }}
      />
    </Tabs>
  );
}
