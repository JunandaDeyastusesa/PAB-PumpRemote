// RegisterScreen.js - SIMPLIFIED VERSION
import React, { useState } from "react";
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

import { Lock, Mail, User } from "lucide-react-native";

import {
  registerWithEmail,
  getIdToken,
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
  keyboardType,
  error
}) => (
  <VStack space="xs">
    <Input
      variant="outline"
      size="lg"
      borderColor={error ? "$red500" : "transparent"}
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
    {error && (
      <Text fontSize="$xs" color="$red500" ml="$4">
        {error}
      </Text>
    )}
  </VStack>
);

// 🚀 Register Screen Component
const RegisterScreen = () => {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({
    email: "",
    password: "",
    confirmPassword: ""
  });

  // 📝 Validate Form
  const validateForm = () => {
    const newErrors = {
      email: "",
      password: "",
      confirmPassword: ""
    };

    let isValid = true;

    // Email validation
    if (!email.trim()) {
      newErrors.email = "Email wajib diisi";
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Format email tidak valid";
      isValid = false;
    }

    // Password validation
    if (!password) {
      newErrors.password = "Password wajib diisi";
      isValid = false;
    } else if (password.length < 6) {
      newErrors.password = "Password minimal 6 karakter";
      isValid = false;
    }

    // Confirm password validation
    if (!confirmPassword) {
      newErrors.confirmPassword = "Konfirmasi password wajib diisi";
      isValid = false;
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = "Password tidak cocok";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  // 🔄 Clear error on field change
  const clearError = (field) => {
    setErrors(prev => ({
      ...prev,
      [field]: ""
    }));
  };

  // 📝 Handle Register
  const handleRegister = async () => {
    if (!validateForm()) return;

    setIsLoading(true);

    try {
      const result = await registerWithEmail(email.trim(), password);

      if (result.success) {
        // Get token after successful registration
        const idToken = await getIdToken();

        console.log("✅ Registrasi berhasil!");
        console.log("👤 UID:", result.user.uid);
        console.log("📧 Email:", result.user.email);

        // Save token and user ID
        if (idToken) {
          await AsyncStorage.setItem("idToken", idToken);
          await AsyncStorage.setItem("userId", result.user.uid);
          console.log("🔐 Token & userId disimpan");
        }

        Alert.alert(
          "Registrasi Berhasil!",
          "Akun Anda telah berhasil dibuat. Silakan login.",
          [
            {
              text: "Login Sekarang",
              onPress: () => router.push("/(auth)/login")
            }
          ]
        );

      } else {
        const errorMessage = getErrorMessage(result.errorCode);
        Alert.alert("Registrasi Gagal", errorMessage);
      }
    } catch (error) {
      console.error("❌ Register error:", error);
      Alert.alert(
        "Registrasi Gagal",
        "Terjadi kesalahan tak terduga. Silakan coba lagi."
      );
    } finally {
      setIsLoading(false);
    }
  };

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
              Let's Get
            </Text>
            <Text fontSize="$4xl" fontWeight="$bold" color="#34427C">
              Started
            </Text>
          </VStack>

          {/* Form Section */}
          <VStack space="md">
            {/* Email Input */}
            <InputCustom
              icon={Mail}
              placeholder="Email"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                clearError("email");
              }}
              autoCapitalize="none"
              keyboardType="email-address"
              error={errors.email}
            />

            {/* Password Input */}
            <InputCustom
              icon={Lock}
              placeholder="Password"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                clearError("password");
              }}
              secureTextEntry
              error={errors.password}
            />

            {/* Confirm Password Input */}
            <InputCustom
              icon={Lock}
              placeholder="Konfirmasi Password"
              value={confirmPassword}
              onChangeText={(text) => {
                setConfirmPassword(text);
                clearError("confirmPassword");
              }}
              secureTextEntry
              error={errors.confirmPassword}
            />

            {/* Links Section */}
            <HStack justifyContent="flex-end" mt="$2">
              <Pressable
                onPress={() => router.push("/(auth)/login")}
                style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
              >
                <Text fontSize="$xs" color="#6B7280">
                  Sudah Punya Akun?
                </Text>
              </Pressable>
            </HStack>
          </VStack>

          {/* Register Button - Pushed to bottom */}
          <Button
            size="lg"
            bg="#4A6EFF"
            h="$12"
            borderRadius="$lg"
            mt="$200"
            onPress={handleRegister}
            isDisabled={
              isLoading ||
              !email.trim() ||
              !password ||
              !confirmPassword
            }
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
              {isLoading ? "Mendaftarkan..." : "Daftar Sekarang"}
            </ButtonText>
          </Button>
        </VStack>
      </Box>
    </SafeAreaView>
  );
};

export default RegisterScreen;