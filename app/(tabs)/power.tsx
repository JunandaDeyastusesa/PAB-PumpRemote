import Ionicons from "@expo/vector-icons/Ionicons";
import { Box, Card, Center, HStack, Heading, Pressable, Text, VStack } from "@gluestack-ui/themed";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useEffect, useState, useCallback, useRef } from "react";
import { Alert, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Header } from "../../components/header";

// WebSocket URLs
const WS_BASE_URL = "ws://100.64.57.66:9876";
const WS_PUMP_URL = `${WS_BASE_URL}/ws/history-pump`;

// Helper functions dengan caching
const formatDuration = (seconds) => {
  if (seconds < 60) {
    return { value: (seconds).toFixed(0), unit: "detik" };
  } else if (seconds < 3600) {
    return { value: (seconds / 60).toFixed(0), unit: "menit" };
  } else {
    return { value: (seconds / 3600).toFixed(1), unit: "jam" };
  }
};

const calculateEnergy = (seconds, powerKW = 64) => ((seconds / 3600) * powerKW).toFixed(0);

const getHourMinute = (isoTime) => {
  if (!isoTime) return "00:00";
  const parts = isoTime.split("T");
  if (parts.length < 2) return "00:00";
  return parts[1].slice(0, 5);
};

// Fungsi untuk format tanggal sederhana
const formatDateSimple = (dateString) => {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) {
    return "Hari Ini";
  } else if (date.toDateString() === yesterday.toDateString()) {
    return "Kemarin";
  } else {
    return date.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }
};

// Power Button Component
const PowerButton = ({ lastStatus, onPress, pumpUIState }) => {
  const getButtonColor = () => {
    if (pumpUIState === "WAITING") return "#9CA3AF";
    if (pumpUIState === "INITIAL" || lastStatus === null || lastStatus === undefined) {
      return "#EF4444";
    }
    return lastStatus ? "#22C55E" : "#EF4444";
  };

  const getStatusText = () => {
    if (pumpUIState === "WAITING") return "Processing...";
    if (pumpUIState === "INITIAL" || lastStatus === null || lastStatus === undefined) {
      return "Power OFF";
    }
    return lastStatus ? "Power ON" : "Power OFF";
  };

  const isDisabled = pumpUIState === "WAITING" || pumpUIState === "INITIAL";

  return (
    <Box bg="$blue50" borderRadius="$2xl" p="$6" alignItems="center" my="$4">
      <Heading size="xl" mb="$2">
        {getStatusText()}
      </Heading>

      <Pressable onPress={onPress} disabled={isDisabled}>
        <Center
          w={80}
          h={80}
          borderRadius="$xl"
          backgroundColor={getButtonColor()}
          opacity={isDisabled ? 0.6 : 1}
        >
          <Ionicons name="power" size={40} color="white" />
        </Center>
      </Pressable>
    </Box>
  );
};

// Optimized Pump History Card Component
const PumpHistoryCard = React.memo(({ item, powerKW = 64 }) => {
  const duration = formatDuration(item.sum_time || 0);
  const energy = calculateEnergy(item.sum_time || 0, powerKW);
  const timeText = item.time || `${getHourMinute(item.start_time)} - ${getHourMinute(item.end_time)}`;

  return (
    <Card backgroundColor="$blue100" borderRadius="$xl" p="$4" justifyContent="center" variant="filled">
      <HStack space="sm">
        <VStack
          alignItems="center"
          justifyContent="center"
          borderRightWidth={1}
          borderStyle="dashed"
          borderColor="$blue300"
          pr="$3"
        >
          <Center>
            <Text fontSize="$2xl" fontWeight="$bold">{duration.value}</Text>
            <Text fontSize="$xs">{duration.unit}</Text>
          </Center>
        </VStack>
        <VStack flex={1}>
          <HStack justifyContent="space-between" ml="$4">
            <VStack justifyContent="center">
              <Text fontWeight="$bold" mb="$1">{item.title || "Pompa 1"}</Text>
              <Text fontSize="$sm">{timeText} WIB</Text>
            </VStack>
            <VStack justifyContent="center" alignItems="center">
              <Text fontSize="$sm">{energy} Kwh</Text>
            </VStack>
          </HStack>
        </VStack>
      </HStack>
    </Card>
  );
});

PumpHistoryCard.displayName = 'PumpHistoryCard';

const Power = () => {
  const router = useRouter();
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);

  // States
  const [authToken, setAuthToken] = useState(null);
  const [pumpUIState, setPumpUIState] = useState("INITIAL");
  const [lastStatus, setLastStatus] = useState(null);
  const [pumpHistory, setPumpHistory] = useState([]);
  const [groupedHistory, setGroupedHistory] = useState({});
  const [connectionStatus, setConnectionStatus] = useState({ pump: false });
  const [powerKW] = useState(64);

  // Optimized group history function
  const groupAndSortHistory = useCallback((history) => {
    if (history.length === 0) return {};

    // Sort by newest first
    const sortedHistory = [...history].sort((a, b) =>
      new Date(b.start_time || 0) - new Date(a.start_time || 0)
    );

    const grouped = {};
    sortedHistory.forEach(item => {
      const date = item.start_time?.split("T")[0] || "unknown";
      if (!grouped[date]) grouped[date] = [];
      grouped[date].push(item);
    });

    // Sort dates descending
    const sortedDates = Object.keys(grouped).sort((a, b) => new Date(b) - new Date(a));
    const result = {};
    sortedDates.forEach(date => {
      result[date] = grouped[date];
    });

    return result;
  }, []);

  // Group history by date
  useEffect(() => {
    const grouped = groupAndSortHistory(pumpHistory);
    setGroupedHistory(grouped);
  }, [pumpHistory, groupAndSortHistory]);

  // Get auth token
  useEffect(() => {
    const getToken = async () => {
      try {
        const token = await AsyncStorage.getItem("idToken");

        if (token) {
          console.log("✅ Firebase idToken loaded");
          setAuthToken(token);
        } else {
          console.log("❌ No idToken found");
          Alert.alert(
            "Session Expired",
            "Silakan login kembali",
            [{ text: "OK", onPress: () => router.replace("/(auth)/login") }]
          );
        }
      } catch (error) {
        console.error("Error loading idToken:", error);
      }
    };

    getToken();
  }, []);

  // Setup WebSocket dengan optimasi
  useEffect(() => {
    if (!authToken) return;

    const connectPumpWS = () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }

      // const ws = new WebSocket(`${WS_PUMP_URL}?token=${authToken}`);
      // wsRef.current = ws;

      const ws = new WebSocket(WS_PUMP_URL, [], {
        headers: { Authorization: authToken }
      });

      ws.onopen = () => {
        console.log("WS Connected: history-pump");
        setConnectionStatus(prev => ({ ...prev, pump: true }));

        // Request initial data
        ws.send(JSON.stringify({
          action: "get_status_and_history",
          data: { pump_id: 1 }
        }));
      };

      ws.onmessage = (event) => {
        try {
          const response = JSON.parse(event.data);

          // Handle waiting state
          if (response.status === "success" && response.data === "waiting") {
            setPumpUIState("WAITING");
            return;
          }

          // Handle pump command response - RESPONS CEPAT
          if (response.action === "pump_status") {
            const isOn = response.message === "pump turned on";
            setLastStatus(isOn);

            // Update UI state immediately
            setPumpUIState("IDLE");

            // Request updated history immediately for realtime update
            setTimeout(() => {
              if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({
                  action: "get_status_and_history",
                  data: { pump_id: 1 }
                }));
              }
            }, 300); // Reduced delay for faster response
            return;
          }

          // Handle status and history data
          if (response.status === "success" && response.data && response.data.data) {
            const { data, last_status } = response.data;

            // Update last_status immediately
            setLastStatus(last_status);
            setPumpUIState("IDLE");

            // Update history - using requestAnimationFrame for smoother UI updates
            if (data && Array.isArray(data)) {
              requestAnimationFrame(() => {
                const sortedData = [...data]
                  .sort((a, b) => new Date(b.start_time || 0) - new Date(a.start_time || 0));
                setPumpHistory(sortedData);
              });
            }
          }
        } catch (err) {
          console.error("Error parsing WS data:", err);
        }
      };

      ws.onerror = (err) => {
        console.error("WS Error:", err);
        setConnectionStatus(prev => ({ ...prev, pump: false }));
      };

      ws.onclose = () => {
        console.log("WS Closed. Reconnecting...");
        setConnectionStatus(prev => ({ ...prev, pump: false }));
        setPumpUIState("WAITING");

        // Reconnect with exponential backoff
        reconnectTimeoutRef.current = setTimeout(connectPumpWS, 3000);
      };
    };

    connectPumpWS();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.close();
      }
    };
  }, [authToken]);

  // Optimized power toggle handler
  const handlePowerToggle = useCallback(() => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      Alert.alert("Error", "Koneksi WebSocket belum siap");
      return;
    }

    if (pumpUIState === "WAITING" || pumpUIState === "INITIAL") return;

    const newStatus = !lastStatus;

    // Update UI state immediately for better UX
    setPumpUIState("WAITING");

    // Kirim perintah
    ws.send(JSON.stringify({
      action: "pump_command",
      data: {
        pump_id: 1,
        status: newStatus
      }
    }));

    // Pre-emptively update status for instant feedback
    setLastStatus(newStatus);
  }, [lastStatus, pumpUIState]);

  const handleViewAllHistory = () => router.push("/(sub-menu)/history-pump");

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FEFF' }}>
      <Header title="Monitoring Pompa" />

      {/* Bagian atas tetap visible */}
      <Box px="$5" py="$4">
        {/* Power Button */}
        <PowerButton
          lastStatus={lastStatus}
          onPress={handlePowerToggle}
          pumpUIState={pumpUIState}
        />

        {/* Header Riwayat */}
        <HStack justifyContent="space-between" alignItems="center" mt="$3">
          <VStack>
            <Heading size="lg">Riwayat Penggunaan</Heading>
          </VStack>
          <Pressable onPress={handleViewAllHistory}>
            <Text color="$blue600" fontWeight="$semibold">Lihat Semua</Text>
          </Pressable>
        </HStack>
      </Box>

      {/* Scrollable list - Realtime History */}
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        <Box px="$3" pb="$4" mx="$1">
          {Object.keys(groupedHistory).length === 0 ? (
            <Center py="$10">
              <Text color="$textLight600">Belum ada riwayat penggunaan</Text>
            </Center>
          ) : (
            Object.entries(groupedHistory).map(([date, items]) => (
              <VStack key={date} space="sm" mb="$6">
                {/* Date Header - hanya tanggal saja */}
                <Box px="$2">
                  <Text fontSize="$sm" color="$textLight600" fontWeight="$semibold">
                    {formatDateSimple(date)}
                  </Text>
                </Box>

                {/* History Items */}
                {items.map((item, i) => (
                  <PumpHistoryCard
                    key={`${date}-${i}-${item.start_time}`}
                    item={{
                      ...item,
                      title: item.pump_name || "Pompa 1",
                      time: `${getHourMinute(item.start_time)} - ${getHourMinute(item.end_time)}`,
                    }}
                    powerKW={powerKW}
                  />
                ))}
              </VStack>
            ))
          )}
        </Box>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Power;