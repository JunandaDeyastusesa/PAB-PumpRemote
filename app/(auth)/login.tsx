import React, { useState, useEffect } from "react";
import { Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";

import {
  Box,
  Button,
  ButtonText,
  HStack,
  Input,
  InputField,
  InputIcon,
  InputSlot,
  Pressable,
  Text,
  VStack,
} from "@gluestack-ui/themed";

import { Lock, Mail } from "lucide-react-native";

/* =====================
   FIREBASE (INLINE)
===================== */
import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  signInWithEmailAndPassword,
  onAuthStateChanged,
} from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyACxQcOLDQZ4me2pQ4WszW_lnIA__PIou8",
  authDomain: "irigo-d65a4.firebaseapp.com",
  projectId: "irigo-d65a4",
  storageBucket: "irigo-d65a4.firebasestorage.app",
  messagingSenderId: "563745426802",
  appId: "1:563745426802:web:62280e13ac97fb7137a1eb"
};

// Prevent re-initialization
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);

/* =====================
   Input Custom
===================== */
const InputCustom = ({
  icon,
  placeholder,
  value,
  onChangeText,
  secureTextEntry,
  autoCapitalize,
}) => (
  <Input
    variant="outline"
    size="lg"
    borderColor="transparent"
    borderRadius="$lg"
    h="$12"
    backgroundColor="#CAD5FF80"
  >
    <InputSlot pl="$4">
      <InputIcon as={icon} color="#34427C" size="sm" />
    </InputSlot>
    <InputField
      placeholder={placeholder}
      placeholderTextColor="#34427C"
      color="#34427C"
      value={value}
      onChangeText={onChangeText}
      secureTextEntry={secureTextEntry}
      autoCapitalize={autoCapitalize}
    />
  </Input>
);

/* =====================
   Login Screen
===================== */
const LoginScreen = () => {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  /* =====================
     Auto login check
  ===================== */
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const idToken = await user.getIdToken();
        await AsyncStorage.setItem("idToken", idToken);
        router.replace("/(tabs)/home");
      }
      setIsCheckingAuth(false);
    });

    return unsubscribe;
  }, []);

  /* =====================
     Handle Login
  ===================== */
  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Email dan password wajib diisi");
      return;
    }

    setIsLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );

      const user = userCredential.user;
      const idToken = await user.getIdToken();

      console.log("✅ UID:", user.uid);
      console.log("✅ ID TOKEN:", idToken.substring(0, 20) + "...");

      await AsyncStorage.setItem("idToken", idToken);

      router.replace("/(tabs)/home");
    } catch (error: any) {
      let message = "Login gagal";

      switch (error.code) {
        case "auth/user-not-found":
          message = "Akun tidak ditemukan";
          break;
        case "auth/wrong-password":
          message = "Password salah";
          break;
        case "auth/invalid-email":
          message = "Email tidak valid";
          break;
        case "auth/network-request-failed":
          message = "Koneksi internet bermasalah";
          break;
      }

      Alert.alert("Login Gagal", message);
    } finally {
      setIsLoading(false);
    }
  };

  /* =====================
     Loading screen
  ===================== */
  if (isCheckingAuth) {
    return (
      <SafeAreaView style={{ flex: 1 }}>
        <Box flex={1} justifyContent="center" alignItems="center">
          <Text>Memeriksa autentikasi...</Text>
        </Box>
      </SafeAreaView>
    );
  }

  /* =====================
     Render
  ===================== */
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
      <Box flex={1} px="$6" pt="$16">
        <VStack space="4xl">
          <VStack>
            <Text fontSize="$4xl" fontWeight="$bold">Hey,</Text>
            <Text fontSize="$4xl" fontWeight="$bold">Welcome</Text>
            <Text fontSize="$4xl" fontWeight="$bold">Back</Text>
          </VStack>

          <VStack space="md">
            <InputCustom
              icon={Mail}
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
            />
            <InputCustom
              icon={Lock}
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />

            <HStack justifyContent="space-between">
              <Pressable onPress={() => router.push("/(auth)/register")}>
                <Text fontSize="$xs">Belum Punya Akun?</Text>
              </Pressable>
              <Pressable onPress={() => Alert.alert("Info", "Segera hadir")}>
                <Text fontSize="$xs">Lupa Password?</Text>
              </Pressable>
            </HStack>
          </VStack>

          <Button
            size="lg"
            bg="#4A6EFF"
            h="$12"
            borderRadius="$lg"
            onPress={handleLogin}
            isDisabled={isLoading}
          >
            <ButtonText>
              {isLoading ? "Loading..." : "Masuk"}
            </ButtonText>
          </Button>
        </VStack>
      </Box>
    </SafeAreaView>
  );
};

export default LoginScreen;
