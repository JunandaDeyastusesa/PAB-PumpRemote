import React, { useState, useEffect, useCallback, useRef } from "react";
import { ScrollView, TouchableOpacity, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Header } from "../../components/header";
import { Pressable, Box, Card, Text, Icon, Center, HStack, VStack, Spinner, Heading } from "@gluestack-ui/themed";
import { useRouter } from "expo-router";
import { ToggleRight, Thermometer, Droplets, Waves, Zap, ArrowUpNarrowWide, RefreshCw } from "lucide-react-native";

// API URLs
const API_BASE_URL = "http://100.64.57.66:9876";
const API_PUMP_URL = `${API_BASE_URL}/pump/1`;

// WebSocket URLs
const WS_BASE_URL = "ws://100.64.57.66:9876";
const WS_PUMP_URL = `${WS_BASE_URL}/ws/history-pump`;
const WS_MOISTURE_URL = `${WS_BASE_URL}/ws/moisture`;
const WS_WATER_LEVEL_URL = `${WS_BASE_URL}/ws/history-water-level`;

type ConnectionStatus = {
  pump: boolean;
  moisture: boolean;
  waterLevel: boolean;
};

type PumpInfo = {
  power_kwh: number;
  power_hp: number;
  voltage: number;
  name: string;
};

type Totals = {
  totalTime: number;
  totalEnergy: number;
  totalActivities: number;
};

type PumpStatus = {
  status: string;
  duration: string;
};

type PumpHistoryItem = {
  pump_name?: string;
  start_time?: string;
  end_time?: string;
  sum_time?: number;
  title?: string;
  time?: string;
};

type PumpStatusAndHistoryResponse = {
  last_status: boolean;
  data: PumpHistoryItem[];
};

type PumpHistoryResponse = PumpHistoryItem[];

type WSResponse = {
  action: string;
  status: string;
  message?: string;
  data?: any;
};

type GroupedHistory = {
  [date: string]: PumpHistoryItem[];
};

type InfoItem = {
  title: string;
  value: string | number;
  icon: any;
  satuan?: string;
};

// Helper function untuk format durasi dengan satuan dinamis
const formatDuration = (seconds = 0) => {
  if (seconds < 60) {
    return {
      value: seconds.toFixed(0),
      unit: "Detik"
    };
  }

  const minutes = seconds / 60;
  if (minutes < 60) {
    return {
      value: minutes.toFixed(2).replace(".", ","),
      unit: "Menit"
    };
  }

  const hours = minutes / 60;
  if (hours < 24) {
    return {
      value: hours.toFixed(2).replace(".", ","),
      unit: "Jam"
    };
  }

  const days = hours / 24;
  return {
    value: days.toFixed(2).replace(".", ","),
    unit: "Hari"
  };
};

// Helper function untuk format energi dengan satuan dinamis
const formatEnergy = (kwh = 0) => {
  if (kwh < 0.001) {
    const wh = kwh * 1000;
    return {
      value: wh.toFixed(0),
      unit: "Wh"
    };
  }

  if (kwh < 1) {
    return {
      value: kwh.toFixed(2).replace(".", ","),
      unit: "kWh"
    };
  }

  return {
    value: kwh.toFixed(1).replace(".", ","),
    unit: "kWh"
  };
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

// Helper functions untuk history
const getHourMinute = (isoTime) => {
  if (!isoTime) return "00:00";
  const parts = isoTime.split("T");
  if (parts.length < 2) return "00:00";
  return parts[1].slice(0, 5);
};

const calculateEnergy = (seconds, powerKW = 3) => ((seconds / 3600) * powerKW).toFixed(0);

// Optimized Pump History Card Component
const PumpHistoryCard = React.memo(({ item, powerKW = 3 }) => {
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

// Komponen WeatherCard yang terpisah
const WeatherCard = ({ router }) => {
  const [temperature, setTemperature] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState('');

  const latitude = -6.2088;
  const longitude = 106.8456;

  const fetchWeatherData = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&timezone=Asia%2FJakarta`
      );

      const data = await response.json();

      if (data.current_weather && data.current_weather.temperature) {
        setTemperature(data.current_weather.temperature);
        setLastUpdate(new Date().toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit'
        }));
      }
    } catch (error) {
      console.error('Error fetching weather:', error);
      setTemperature(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWeatherData();
    const interval = setInterval(fetchWeatherData, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      style={{ flex: 1 }}
      onPress={() => router.push("/(sub-menu)/todolist")}
    >
      <Card
        backgroundColor="$blue200"
        borderRadius="$2xl"
        p="$3"
        variant="filled"
        style={{ flex: 1, height: '100%' }}
      >
        <VStack space="xs" style={{ flex: 1 }}>
          <HStack justifyContent="space-between" alignItems="center" flex={1}>
            <HStack alignItems="center" space="sm">
              <Center backgroundColor="$blue400" w="$6" h="$6" borderRadius="$full">
                <Icon as={Thermometer} size="sm" color="$white" />
              </Center>
              {loading && <Spinner size="small" color="$blue600" />}
            </HStack>

            {temperature !== null ? (
              <Text fontWeight="$bold" fontSize="$2xl" color="$blue900">
                {temperature.toFixed(1)}°C
              </Text>
            ) : (
              <Text fontWeight="$bold" fontSize="$lg" color="$blue700">
                ...
              </Text>
            )}
          </HStack>

          <HStack justifyContent="space-between" alignItems="center" flex={1}>
            <Text fontSize="$md" color="$blue900" fontWeight="$medium">
              Suhu Udara
            </Text>
          </HStack>
        </VStack>
      </Card>
    </TouchableOpacity>
  );
};

const Home = () => {
  const router = useRouter();
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);

  // State untuk data real-time
  const [pumpStatus, setPumpStatus] = useState({ status: "Off", duration: "0 Jam" });
  const [temperature, setTemperature] = useState(0);
  const [humidity, setHumidity] = useState(0);
  const [soilMoisture, setSoilMoisture] = useState(0);
  const [moistureTime, setMoistureTime] = useState("");
  const [waterLevel, setWaterLevel] = useState(0);
  const [pumpHistory, setPumpHistory] = useState([]);
  const [groupedHistory, setGroupedHistory] = useState({});

  // State untuk totals dari get_history
  const [totals, setTotals] = useState({
    totalTime: 0,
    totalEnergy: 0,
    totalActivities: 0
  });

  const [pumpInfo, setPumpInfo] = useState({
    power_kwh: 3,
    power_hp: 4,
    voltage: 380,
    name: "Pump Inoto A"
  });

  // Connection status
  const [connectionStatus, setConnectionStatus] = useState({
    pump: false,
    moisture: false,
    waterLevel: false
  });

  const [authToken, setAuthToken] = useState<string | null>(null);
  const [powerKW] = useState(3);

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


  // Fetch pump data from API
  const fetchPumpData = async () => {
    if (!authToken) return;

    try {
      console.log("📡 Fetching pump data from API...");
      const response = await fetch(API_PUMP_URL, {
        headers: {
          Authorization: authToken,
          "Content-Type": "application/json",
        },
      });


      if (response.ok) {
        const data = await response.json();
        console.log("✅ Pump API Data:", data);

        setPumpInfo({
          power_kwh: data.power_kw || 2.5,
          power_hp: data.power_hp || 3.3,
          voltage: data.voltage || 220,
          name: data.pump_name || "Pump A"
        });

        setPumpStatus(prev => ({
          ...prev,
          status: data.status_pump ? "On" : "Off"
        }));

      } else {
        console.error("❌ Error fetching pump data, status:", response.status);
      }
    } catch (error) {
      console.error("❌ Error fetching pump data:", error);
    }
  };

  // Fungsi untuk meminta data get_history (untuk totals)
  // Fungsi untuk mengirim request get_history
  const requestAllHistory = (websocket) => {
    if (websocket && websocket.readyState === WebSocket.OPEN) {
      console.log("📤 SENDING get_history request...");

      const requestData = {
        action: "get_history",
        data: {
          history_pump_id: 1
        }
      };

      console.log("📤 Request payload:", JSON.stringify(requestData));
      websocket.send(JSON.stringify(requestData));
    }
  };


  // Setup WebSocket connections
  useEffect(() => {
    if (!authToken) return;

    const connectPumpWS = () => {
      const ws = new WebSocket(WS_PUMP_URL, [], {
        headers: { Authorization: authToken }
      });

      wsRef.current = ws;

      ws.onopen = () => {
        console.log("✅ WebSocket connected");
        setConnectionStatus(p => ({ ...p, pump: true }));

        // Kirim request get_history
        const requestPayload = {
          action: "get_history",
          data: { history_pump_id: 1 }
        };

        console.log("📤 Sending request:", requestPayload);
        ws.send(JSON.stringify(requestPayload));
      };

      ws.onmessage = (e) => {
        try {
          const res = JSON.parse(e.data);
          console.log("📥 Received action:", res.action, "Data type:", typeof res.data);

          // ---- HANDLE get_history RESPONSE ----
          if (res.action === "get_history") {
            console.log("📊 get_history response details:", {
              hasData: !!res.data,
              isArray: Array.isArray(res.data),
              data: res.data
            });

            // Format 1: Data langsung berupa array
            if (Array.isArray(res.data)) {
              console.log("✅ Data is direct array, processing", res.data.length, "items");
              processHistoryData(res.data);
            }
            // Format 2: Data dalam object dengan properti tertentu
            else if (res.data && typeof res.data === 'object') {
              // Cek berbagai kemungkinan properti
              const dataArray = res.data.items || res.data.records || res.data.data || res.data.history;
              if (Array.isArray(dataArray)) {
                console.log("✅ Found array in data property, processing", dataArray.length, "items");
                processHistoryData(dataArray);
              } else {
                console.log("⚠️ Could not find array in data object:", Object.keys(res.data));
              }
            }
            // Format 3: Error response
            else if (res.error) {
              console.error("❌ Server returned error:", res.error);
            }
            // Format tidak dikenali
            else {
              console.log("⚠️ Unexpected response format for get_history");
            }
          }

        } catch (err) {
          console.error("❌ Parse error:", err);
        }
      };
    };

    const connectMoistureWS = () => {
      try {
        const websocket = new WebSocket(WS_MOISTURE_URL, [], {
          headers: { Authorization: authToken }
        });

        websocket.onopen = () => {
          console.log("✅ WebSocket Connected: moisture");
          setConnectionStatus(prev => ({ ...prev, moisture: true }));

          // Request initial data
          websocket.send(JSON.stringify({
            action: "get_last"
          }));
        };

        websocket.onmessage = (event) => {
          try {
            const response = JSON.parse(event.data);
            const payload = response.data || response;

            // Update soil moisture (REALTIME)
            if (payload?.soil_moisture !== undefined) {
              setSoilMoisture(payload.soil_moisture);
              setHumidity(payload.soil_moisture);
              setMoistureTime(payload.Time || "");
            }

            // Update temperature if available (REALTIME)
            if (payload?.temperature !== undefined) {
              setTemperature(payload.temperature);
            }
          } catch (error) {
            console.error("❌ Error parsing moisture data:", error);
          }
        };

        websocket.onerror = (error) => {
          console.error("❌ WebSocket Error (moisture):", error);
          setConnectionStatus(prev => ({ ...prev, moisture: false }));
        };

        websocket.onclose = () => {
          console.log("🔌 WebSocket Closed: moisture");
          setConnectionStatus(prev => ({ ...prev, moisture: false }));

          setTimeout(() => {
            console.log("🔄 Reconnecting to moisture...");
            connectMoistureWS();
          }, 5000);
        };

      } catch (error) {
        console.error("❌ Error creating moisture WebSocket:", error);
      }
    };

    const connectWaterLevelWS = () => {
      try {
        const websocket = new WebSocket(WS_WATER_LEVEL_URL, [], {
          headers: { Authorization: authToken }
        });

        websocket.onopen = () => {
          console.log("✅ Water Level WebSocket Connected");
          setConnectionStatus(prev => ({ ...prev, waterLevel: true }));

          // Request initial data
          websocket.send(JSON.stringify({
            action: "get_last"
          }));
        };

        websocket.onmessage = (event) => {
          try {
            const response = JSON.parse(event.data);
            console.log("📥 Water Level WS Message:", response);

            // ===== REALTIME WATER LEVEL =====
            // Format 1: Standard format
            if (
              response.action === "water_level" &&
              response.status === "success" &&
              typeof response.level === "number"
            ) {
              setWaterLevel(response.level);
            }
            // Format 2: Data dalam properti data
            else if (
              response.data &&
              typeof response.data.level === "number"
            ) {
              setWaterLevel(response.data.level);
            }
            // Format 3: Langsung level number
            else if (typeof response.level === "number") {
              setWaterLevel(response.level);
            }
            // Format 4: get_last response
            else if (response.action === "get_last" && response.data) {
              const data = response.data;
              if (typeof data.level === "number") {
                setWaterLevel(data.level);
              }
            }

          } catch (error) {
            console.error("❌ Error parsing water level data:", error);
          }
        };

        websocket.onerror = (error) => {
          console.error("❌ Water Level WebSocket Error:", error);
          setConnectionStatus(prev => ({ ...prev, waterLevel: false }));
        };

        websocket.onclose = () => {
          console.log("🔌 Water Level WebSocket Closed");
          setConnectionStatus(prev => ({ ...prev, waterLevel: false }));

          setTimeout(() => {
            console.log("🔄 Reconnecting to water level...");
            connectWaterLevelWS();
          }, 5000);
        };

      } catch (error) {
        console.error("❌ Error creating water level WebSocket:", error);
      }
    };

    connectPumpWS();
    connectMoistureWS();
    connectWaterLevelWS();

  }, [authToken]);

  // Fungsi helper untuk memproses data history
  const processHistoryData = (dataArray) => {
    const totalTime = dataArray.reduce((sum, item) => sum + Number(item.sum_time || 0), 0);
    const totalEnergy = (totalTime / 3600) * (pumpInfo?.power_kwh || 1.5);

    setTotals({
      totalTime: Math.trunc(totalTime),
      totalEnergy: Number(totalEnergy.toFixed(2)),
      totalActivities: dataArray.length,
    });

    setPumpHistory(dataArray);
  };

  // Helper functions
  const calculateDuration = (item: any) => {
    if (!item || !item.sum_time) return "0 Jam";
    const hours = Math.floor(item.sum_time / 3600);
    const minutes = Math.floor((item.sum_time % 3600) / 60);
    return hours > 0 ? `${hours} Jam ${minutes} Menit` : `${minutes} Menit`;
  };

  // Format durasi untuk Pompa Nyala dari totals
  const pumpRuntime = formatDuration(totals.totalTime);

  // Format energi untuk Energi terpakai dari totals
  const energyConsumed = formatEnergy(totals.totalEnergy);

  // Info items (REALTIME DATA) dengan Pompa Nyala dan Energi Terpakai
  const infoItems = [
    {
      title: "Level Drum",
      value: waterLevel.toFixed(0),
      icon: ArrowUpNarrowWide,
      satuan: "%"
    },
    {
      title: "Pompa Nyala",
      value: pumpRuntime.value,
      icon: Waves,
      satuan: pumpRuntime.unit
    },
    {
      title: "Energi terpakai",
      value: energyConsumed.value,
      icon: Zap,
      satuan: energyConsumed.unit
    },
  ];

  const infoPump = [
    { title: "Power(kwh)", value: pumpInfo.power_kwh.toFixed(1) },
    { title: "Power(hp)", value: pumpInfo.power_hp.toFixed(1) },
    { title: "Voltage(V)", value: pumpInfo.voltage.toFixed(0) },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#F8FEFF" }}>
      <Header title="Monitoring Pompa" />

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Connection Status Indicator */}
        {(!connectionStatus.pump || !connectionStatus.moisture || !connectionStatus.waterLevel) && (
          <Box px="$4" mt="$2">
            <Card backgroundColor="$orange100" borderRadius="$lg" p="$2" variant="filled">
              <Text fontSize="$xs" color="$orange900">
                {!connectionStatus.pump && "Pump disconnected "}
                {!connectionStatus.moisture && "Moisture disconnected "}
                {!connectionStatus.waterLevel && "Water level disconnected"}
              </Text>
            </Card>
          </Box>
        )}

        {/* Saklar Pompa + Sensor (REALTIME) */}
        <HStack mt="$4" px="$4" space="md">
          {/* Saklar Pompa (REALTIME STATUS) */}
          <Card backgroundColor="$blue500" borderRadius="$2xl" flex={1} p="$4" variant="filled">
            <VStack space="sm">
              <Center backgroundColor="$blue700" w="$8" h="$8" borderRadius="$full">
                <Icon as={ToggleRight} size="md" color="$white" />
              </Center>
              <Text color="$white" fontSize="$lg" fontWeight="$semibold">
                Saklar Pompa Air
              </Text>
              <Text color="$white" fontSize="$5xl" fontWeight="$bold">
                {pumpStatus.status}
              </Text>
              <Text color="$white" fontSize="$sm">
                {pumpStatus.duration}
              </Text>
            </VStack>
          </Card>

          {/* Sensor (REALTIME DATA) */}
          <VStack flex={1} space="sm">
            <WeatherCard router={router} />

            <TouchableOpacity onPress={() => router.push("/(sub-menu)/history-tanah")} activeOpacity={0.7}>
              <Card backgroundColor="$blue200" borderRadius="$2xl" p="$3" variant="filled">
                <VStack space="xs">
                  <HStack justifyContent="space-between" alignItems="center">
                    <Center backgroundColor="$blue500" w="$6" h="$6" borderRadius="$full">
                      <Icon as={Droplets} size="sm" color="$white" />
                    </Center>
                    <Text fontWeight="$bold" fontSize="$2xl" color="$blue900">
                      {soilMoisture}%
                    </Text>
                  </HStack>
                  <Text fontSize="$md" color="$blue900" fontWeight="$medium">
                    Kelembapan Tanah
                  </Text>
                </VStack>
              </Card>
            </TouchableOpacity>
          </VStack>
        </HStack>

        {/* Info Pemakaian (REALTIME) dengan Pompa Nyala & Energi Terpakai */}
        <HStack px="$4" mt="$5" flexWrap="wrap" justifyContent="space-between">
          {infoItems.map((item, i) => {
            const isClickable = item.title === "Level Drum";

            const Content = (
              <Card variant="ghost" p="$2" width="100%">
                <VStack space="xs">
                  <Text fontSize="$xs">{item.title}</Text>
                  <HStack alignItems="flex-end" space="xs">
                    <Center backgroundColor="$blue500" w="$5" h="$5" borderRadius="$full">
                      <Icon as={item.icon} size="sm" color="$white" />
                    </Center>
                    <HStack alignItems="flex-end">
                      <Text fontSize="$md" fontWeight="$bold">
                        {item.value}
                      </Text>
                      <Text fontSize="$xs" fontWeight="$medium" ml="$1">
                        {item.satuan}
                      </Text>
                    </HStack>
                  </HStack>
                </VStack>
              </Card>
            );

            return (
              <Box key={i} width="32%" mb="$3">
                {isClickable ? (
                  <Pressable onPress={() => router.push("/(sub-menu)/history-drum")} w="100%">
                    {Content}
                  </Pressable>
                ) : (
                  Content
                )}
              </Box>
            );
          })}
        </HStack>

        {/* Info Pompa */}
        <Box px="$4">
          <Card backgroundColor="$blue500" borderRadius="$2xl" p="$4" variant="filled">
            <HStack space="md">
              <Center w="$11" h="$11">
                <Icon as={Waves} color="$white" size="lg" />
              </Center>
              <VStack flex={1} space="sm">
                <Text fontWeight="$bold" fontSize="$md" color="$white">
                  {pumpInfo.name}
                </Text>
                <HStack justifyContent="space-between">
                  {infoPump.map((item, i) => (
                    <VStack key={i} flex={1}>
                      <Text color="$white" fontSize="$xs">
                        {item.title}
                      </Text>
                      <Text fontWeight="$bold" color="$white">
                        {item.value}
                      </Text>
                    </VStack>
                  ))}
                </HStack>
              </VStack>
            </HStack>
          </Card>
        </Box>

        {/* Riwayat Penggunaan dengan grouping seperti Power screen */}
        <VStack px="$4" mt="$5" space="sm">
          <HStack justifyContent="space-between" alignItems="center">
            <VStack>
              <Text fontSize="$md" fontWeight="$semibold">
                Riwayat Penggunaan
              </Text>
            </VStack>
          </HStack>

          {/* Scrollable history dengan grouping */}
          <Box>
            {Object.keys(groupedHistory).length === 0 ? (
              <Box bg="$blue50" p="$6" borderRadius="$xl" alignItems="center">
                <Text fontSize="$sm" color="$textLight600">
                  Tidak ada riwayat penggunaan
                </Text>
              </Box>
            ) : (
              Object.entries(groupedHistory).slice(0, 2).map(([date, items]) => (
                <VStack key={date} space="sm" mb="$6">
                  {/* Date Header - hanya tanggal saja */}
                  <Box>
                    <Text fontSize="$sm" color="$textLight600" fontWeight="$semibold">
                      {formatDateSimple(date)}
                    </Text>
                  </Box>

                  {/* History Items (maksimal 3 per tanggal) */}
                  {items.slice(0, 5).map((item, i) => (
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
        </VStack>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Home;