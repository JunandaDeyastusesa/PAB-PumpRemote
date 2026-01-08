import { useEffect } from "react";
import { Stack } from "expo-router";
import { GluestackUIProvider } from "@gluestack-ui/themed";
import { config } from "@gluestack-ui/config";
import * as SplashScreen from "expo-splash-screen";

// Mencegah splash screen bawaan otomatis hide
SplashScreen.preventAutoHideAsync();

const noHead = { headerShown: false };

const StackLayout = () => {
  useEffect(() => {
    // Sembunyikan splash screen bawaan segera
    SplashScreen.hideAsync();
  }, []);

  return (
    <GluestackUIProvider config={config}>
      <Stack initialRouteName="(splash)/index">
        <Stack.Screen name="(splash)/index" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={noHead} />
        <Stack.Screen name="(auth)" options={noHead} />
        <Stack.Screen name="modal" options={noHead} />
        <Stack.Screen name="(sub-menu)/history-cuaca" options={{ title: "Riwayat Cuaca" }} />
        <Stack.Screen name="(sub-menu)/history-drum" options={{ title: "Riwayat Level Drum" }} />
        <Stack.Screen name="(sub-menu)/history-tanah" options={{ title: "Riwayat Kelembaban Tanah" }} />
        <Stack.Screen name="(sub-menu)/history-pump" options={{ title: "Riwayat Pompa" }} />
        <Stack.Screen name="(sub-menu)/todolist" options={{ title: "TodoList" }} />
      </Stack>
    </GluestackUIProvider>
  );
};

export default StackLayout;