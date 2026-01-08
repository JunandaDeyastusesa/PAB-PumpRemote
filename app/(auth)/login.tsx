// LoginScreen.js - FIXED with new UI design
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

import {
  loginWithEmail,
  onAuthStateChange,
  getIdToken,
  resetPassword,
  getErrorMessage
} from "../../firebaseConfig";

// 🎨 Input Custom Component
const InputCustom = ({
  icon,
  placeholder,
  value,
  onChangeText,
  secureTextEntry,
  autoCapitalize,
  keyboardType
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
      keyboardType={keyboardType}
    />
  </Input>
);

// 🚀 Login Screen Component
const LoginScreen = () => {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // 🔄 Auto login check on mount
  useEffect(() => {
    const unsubscribe = onAuthStateChange(async (user) => {
      if (user) {
        try {
          const idToken = await getIdToken();
          if (idToken) {
            // ✅ Save both token AND userId
            await AsyncStorage.setItem("idToken", idToken);
            await AsyncStorage.setItem("userId", user.uid);
            console.log("✅ Auto login berhasil");
            console.log("👤 userId saved:", user.uid);
            router.replace("/(tabs)/home");
          }
        } catch (error) {
          console.error("Error auto login:", error);
        }
      }
      setIsCheckingAuth(false);
    });

    return () => unsubscribe();
  }, []);

  // 📝 Handle Login
  const handleLogin = async () => {
    if (!email.trim()) {
      Alert.alert("Perhatian", "Email wajib diisi");
      return;
    }

    if (!password) {
      Alert.alert("Perhatian", "Password wajib diisi");
      return;
    }

    setIsLoading(true);

    try {
      const result = await loginWithEmail(email.trim(), password);

      if (result.success) {
        const idToken = await getIdToken();

        console.log("✅ Login berhasil!");
        console.log("👤 UID:", result.user.uid);
        console.log("📧 Email:", result.user.email);

        // ✅ Save BOTH token AND userId
        if (idToken) {
          await AsyncStorage.setItem("idToken", idToken);
          await AsyncStorage.setItem("userId", result.user.uid);
          console.log("🔐 Token & userId disimpan");
          console.log("📦 userId:", result.user.uid);
        }

        router.replace("/(tabs)/home");

      } else {
        const errorMessage = getErrorMessage(result.errorCode);
        Alert.alert("Login Gagal", errorMessage);
      }
    } catch (error) {
      console.error("❌ Login error:", error);
      Alert.alert("Login Gagal", "Terjadi kesalahan tak terduga. Coba lagi.");
    } finally {
      setIsLoading(false);
    }
  };

  // 🔄 Handle Forgot Password
  const handleForgotPassword = () => {
    if (!email.trim()) {
      Alert.alert(
        "Lupa Password",
        "Masukkan email Anda terlebih dahulu",
        [{ text: "OK" }]
      );
      return;
    }

    Alert.alert(
      "Reset Password",
      `Kirim link reset password ke ${email}?`,
      [
        { text: "Batal", style: "cancel" },
        {
          text: "Kirim",
          onPress: async () => {
            try {
              const result = await resetPassword(email.trim());
              if (result.success) {
                Alert.alert(
                  "Berhasil!",
                  "Link reset password telah dikirim ke email Anda. Silakan cek inbox atau spam folder."
                );
              } else {
                Alert.alert("Gagal", result.error || "Gagal mengirim email reset");
              }
            } catch (error) {
              Alert.alert("Error", "Gagal mengirim email reset password");
            }
          }
        }
      ]
    );
  };

  // ⏳ Loading screen
  if (isCheckingAuth) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
        <Box flex={1} justifyContent="center" alignItems="center">
          <Text fontSize="$lg" color="#4A6EFF">
            Memeriksa autentikasi...
          </Text>
        </Box>
      </SafeAreaView>
    );
  }

  // 🎨 Render UI
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
      <Box flex={1} px="$6" pt="$16">
        <VStack space="4xl">
          {/* Header Section - Big Bold Text */}
          <VStack space="xs">
            <Text fontSize="$4xl" fontWeight="$bold" color="#34427C">
              Hey,
            </Text>
            <Text fontSize="$4xl" fontWeight="$bold" color="#34427C">
              Welcome
            </Text>
            <Text fontSize="$4xl" fontWeight="$bold" color="#34427C">
              Back
            </Text>
          </VStack>

          {/* Form Section */}
          <VStack space="md">
            <InputCustom
              icon={Mail}
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />

            <InputCustom
              icon={Lock}
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />

            {/* Links Section */}
            <HStack justifyContent="space-between" mt="$2">
              <Pressable
                onPress={() => router.push("/(auth)/register")}
                style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
              >
                <Text fontSize="$xs" color="#6B7280">
                  Belum Punya Akun?
                </Text>
              </Pressable>

              <Pressable
                onPress={handleForgotPassword}
                style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
              >
                <Text fontSize="$xs" color="#6B7280">
                </Text>
              </Pressable>
            </HStack>
          </VStack>

          {/* Login Button - Pushed to bottom */}
          <Button
            size="lg"
            bg="#4A6EFF"
            h="$12"
            borderRadius="$lg"
            mt="$250"
            onPress={handleLogin}
            isDisabled={isLoading || !email.trim() || !password}
            sx={{
              _pressed: {
                bg: "#3A5EEF",
                transform: [{ scale: 0.98 }]
              },
              _disabled: {
                bg: "#CAD5FF",
                opacity: 0.7
              }
            }}
          >
            <ButtonText fontSize="$md" fontWeight="$semibold">
              {isLoading ? "Loading..." : "Masuk"}
            </ButtonText>
          </Button>
        </VStack>
      </Box>
    </SafeAreaView>
  );
};

export default LoginScreen;