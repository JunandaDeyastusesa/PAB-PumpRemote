import { Tabs } from "expo-router/tabs";
import { Text } from "@gluestack-ui/themed";
import Ionicons from "@expo/vector-icons/Ionicons";

const noHead = { headerShown: false };

const TabsLayout = () => {
  return (
    <Tabs
      screenOptions={({ route }) => ({
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
        tabBarStyle: { height: 60 },
        tabBarLabel: ({ children, color, focused }) => (
          <Text mb="$2" color={focused ? "#4A6EFF" : color} fontSize="$xs" fontWeight={focused ? "bold" : "light"}>
            {children}
          </Text>
        ),
      })}
    >
      <Tabs.Screen name="home" options={{ title: "Home", ...noHead }} />
      <Tabs.Screen name="power" options={{ title: "Power", ...noHead }} />
      <Tabs.Screen name="profile" options={{ title: "Profile", ...noHead }} />
    </Tabs>
  );
};

export default TabsLayout;
