import {Box, Button, ButtonText, HStack, Input, InputField, InputIcon, InputSlot, Pressable, Text, VStack,
} from "@gluestack-ui/themed";
import { useRouter } from "expo-router";
import { AtSign, Lock, Mail, User } from "lucide-react-native";
import React, { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";

// Input Component dengan Props
const InputCustom = ({icon, placeholder, value, onChangeText, secureTextEntry, autoCapitalize, }) => (
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
      fontFamily="Poppins-Regular"
    />
  </Input>
);

// Register Screen dengan State dan Navigation
const RegisterScreen = () => {
  const router = useRouter();

  // State Management
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Handler untuk Register
  const handleRegister = () => {
    if (!fullName || !username || !email || !password) return;

    setIsLoading(true);

    // Simulasi proses register
    setTimeout(() => {
      setIsLoading(false);
      // Navigate ke Login setelah register berhasil
      alert("Registrasi berhasil! Silakan login.");
      router.push("/login");
    }, 1000);
  };

  // Handler untuk navigasi ke Login
  const handleNavigateToLogin = () => {
    router.push("/login");
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
      <Box flex={1} bg="$white" px="$6" pt="$16">
        <VStack space="4xl">
          {/* Header */}
          <VStack space="xs">
            {["Hey,", "Let's get", "Started"].map((text, index) => (
              <Text
                key={index}
                fontSize="$4xl"
                color="$black"
                fontWeight="$bold"
                lineHeight="$4xl"
                fontFamily="Poppins-Bold"
              >
                {text}
              </Text>
            ))}
          </VStack>

          {/* Form dengan State */}
          <VStack space="md">
            <InputCustom
              icon={User}
              placeholder="Nama Lengkap"
              value={fullName}
              onChangeText={setFullName}
            />

            <InputCustom
              icon={AtSign}
              placeholder="Username"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
            />

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

            {/* Link dengan Navigation */}
            <HStack justifyContent="flex-end" mt="$1">
              <Pressable onPress={handleNavigateToLogin}>
                <Text
                  fontSize="$xs"
                  color="$trueGray500"
                  fontFamily="Poppins-Regular"
                >
                  Sudah Punya Akun?
                </Text>
              </Pressable>
            </HStack>
          </VStack>

          {/* Register Button */}
          <Button size="lg" bg="#4A6EFF" borderRadius="$lg" h="$12" onPress={handleRegister}
            isDisabled={
              isLoading || !fullName || !username || !email || !password
            }
          >
            <ButtonText fontWeight="$semibold" fontSize="$md" fontFamily="Poppins-SemiBold">
              {isLoading ? "Loading..." : "→ Daftar Akun"}
            </ButtonText>
          </Button>
        </VStack>
      </Box>
    </SafeAreaView>
  );
};

export default RegisterScreen;
