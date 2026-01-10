import { Tabs } from "expo-router/tabs";
import { Text } from "@gluestack-ui/themed";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const TabsLayout = () => {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={({ route }) => ({
        tabBarStyle: {
          height: 60 + insets.bottom,
          paddingBottom: insets.bottom,
        },
        tabBarIcon: ({ focused, color }) => {
          let iconName: keyof typeof Ionicons.glyphMap = "home-outline";

          switch (route.name) {
            case "home":
              iconName = "home-outline";
              break;
            case "power":
              iconName = "power";
              break;
            case "profile":
              iconName = "person-circle-outline";
              break;
          }

          return (
            <Ionicons
              name={iconName}
              size={22}
              color={focused ? "#4A6EFF" : color}
            />
          );
        },
        tabBarIconStyle: { marginTop: 5 },
        tabBarLabel: ({ children, color, focused }) => (
          <Text
            mb="$2"
            color={focused ? "#4A6EFF" : color}
            fontSize="$xs"
            fontWeight={focused ? "bold" : "light"}
          >
            {children}
          </Text>
        ),
      })}
    >
      <Tabs.Screen name="home" options={{ title: "Home", headerShown: false }} />
      <Tabs.Screen name="power" options={{ title: "Power", headerShown: false }} />
      <Tabs.Screen name="profile" options={{ title: "Profile", headerShown: false }} />
    </Tabs>
  );
};

export default TabsLayout;
