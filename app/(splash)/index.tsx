import React, { useEffect, useRef, useState } from "react";
import { Animated, Image } from "react-native";
import { useRouter } from "expo-router";
import { Box, Center, HStack, Text } from "@gluestack-ui/themed";
import { SafeAreaView } from "react-native-safe-area-context";

interface SplashScreenProps {
  logoSource?: any;
  logoDuration?: number;
  typingSpeed?: number;
  loadingDuration?: number;
}

const SplashScreen: React.FC<SplashScreenProps> = ({
  logoSource = require("../../assets/images/irrigo.png"),
  logoDuration = 1000,
  typingSpeed = 150,
  loadingDuration = 2000,
}) => {
  const router = useRouter();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  const [showLoading, setShowLoading] = useState(false);
  const [typedText, setTypedText] = useState("");

  const fullText = " Irrigo";

  const startTyping = () => {
    setTypedText(""); // Reset typedText terlebih dahulu
    let index = 0;
    const interval = setInterval(() => {
      if (index < fullText.length) {
        setTypedText((prev) => prev + fullText.charAt(index));
        index++;
      } else {
        clearInterval(interval);
      }
    }, typingSpeed);

    return interval; // Return interval untuk cleanup
  };

  useEffect(() => {
    let typingInterval: number;
    let navigationTimeout: number;

    Animated.sequence([
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: logoDuration,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 4,
          tension: 80,
          useNativeDriver: true,
        }),
      ]),
      Animated.spring(scaleAnim, {
        toValue: 1.05,
        friction: 3,
        tension: 50,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 3,
        tension: 50,
        useNativeDriver: true,
      }),
    ]).start(() => {
      typingInterval = startTyping();
      setShowLoading(true);

      const animateDot = (dot: Animated.Value, delay: number) => {
        Animated.loop(
          Animated.sequence([
            Animated.timing(dot, {
              toValue: 1,
              duration: 400,
              delay,
              useNativeDriver: false,
            }),
            Animated.timing(dot, {
              toValue: 0.3,
              duration: 400,
              useNativeDriver: false,
            }),
          ])
        ).start();
      };

      animateDot(dot1, 0);
      animateDot(dot2, 200);
      animateDot(dot3, 400);

      navigationTimeout = setTimeout(() => {
        router.replace("/(tabs)/home");
      }, loadingDuration) as unknown as number;
    });

    // Cleanup function
    return () => {
      if (typingInterval) clearInterval(typingInterval);
      if (navigationTimeout) clearTimeout(navigationTimeout);
    };
  }, []);

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <Center flex={1} bg="$backgroundLight">
        {/* Logo */}
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Box width={200} height={200} justifyContent="center" alignItems="center">
            <Image
              source={logoSource}
              style={{ width: "80%", height: "80%" }}
              resizeMode="contain"
            />
          </Box>
        </Animated.View>

        {/* Animasi Text */}
        <Text
          mt="$4"
          fontSize="$2xl"
          fontWeight="$bold"
          color="$primary500"
          minHeight={30}
        >
          {typedText}
        </Text>

        {/* Loading */}
        {showLoading && (
          <Center mt="$6">
            <HStack space="sm">
              {[dot1, dot2, dot3].map((dot, i) => (
                <Animated.View
                  key={i}
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: 50,
                    backgroundColor: "#4A6EFF",
                    opacity: dot,
                  }}
                />
              ))}
            </HStack>
            <Text mt="$3" fontWeight="$bold" fontSize="$md" color="$primary500">
              Memuat…
            </Text>
          </Center>
        )}
      </Center>
    </SafeAreaView>
  );
};

export default SplashScreen;