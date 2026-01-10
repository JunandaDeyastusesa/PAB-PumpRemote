import React, { useState, useEffect, useCallback, useRef } from "react";
import { ScrollView, TouchableOpacity, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Header } from "../../components/header";
import { Pressable, Box, Card, Text, Icon, Center, HStack, VStack, Spinner } from "@gluestack-ui/themed";
import { useRouter } from "expo-router";
import { ToggleRight, Thermometer, Droplets, Waves, Zap, ArrowUpNarrowWide } from "lucide-react-native";

const API_BASE = "http://100.64.57.66:9876";
const WS_BASE = "ws://100.64.57.66:9876";

const formatDuration = (seconds = 0) => {
  if (seconds < 60) return { value: seconds.toFixed(0), unit: "Detik" };
  if (seconds < 3600) return { value: (seconds / 60).toFixed(2).replace(".", ","), unit: "Menit" };
  if (seconds < 86400) return { value: (seconds / 3600).toFixed(2).replace(".", ","), unit: "Jam" };
  return { value: (seconds / 86400).toFixed(2).replace(".", ","), unit: "Hari" };
};

const formatEnergy = (kwh = 0) => {
  if (kwh < 0.001) return { value: (kwh * 1000).toFixed(0), unit: "Wh" };
  if (kwh < 1) return { value: kwh.toFixed(2).replace(".", ","), unit: "kWh" };
  return { value: kwh.toFixed(1).replace(".", ","), unit: "kWh" };
};

const formatDate = (dateString) => {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return "Hari Ini";
  if (date.toDateString() === yesterday.toDateString()) return "Kemarin";

  return date.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
};

const getTimeFromISO = (isoTime) => isoTime ? isoTime.split("T")[1]?.slice(0, 5) || "00:00" : "00:00";

const WeatherCard = ({ router }) => {
  const [temp, setTemp] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState('');

  const fetchWeather = async () => {
    try {
      setLoading(true);
      const lat = -7.2504, lng = 112.7688;
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current_weather=true&timezone=Asia%2FJakarta`;

      const res = await fetch(url);
      const data = await res.json();

      if (data.current_weather?.temperature) {
        setTemp(data.current_weather.temperature);
        setLastUpdate(new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }));
      }
    } catch (error) {
      setTemp(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWeather();
    const interval = setInterval(fetchWeather, 600000);
    return () => clearInterval(interval);
  }, []);

  return (
    <TouchableOpacity activeOpacity={0.7} style={{ flex: 1 }} onPress={() => router.push("/(sub-menu)/history-cuaca")}>
      <Card backgroundColor="$blue200" borderRadius="$2xl" p="$3" variant="filled" style={{ flex: 1 }}>
        <VStack space="xs" style={{ flex: 1 }}>
          <HStack justifyContent="space-between" alignItems="center" flex={1}>
            <HStack alignItems="center" space="sm">
              <Center backgroundColor="$blue400" w="$6" h="$6" borderRadius="$full">
                <Icon as={Thermometer} size="sm" color="$white" />
              </Center>
              {loading && <Spinner size="small" color="$blue600" />}
            </HStack>
            <Text fontWeight="$bold" fontSize="$2xl" color="$blue900">
              {temp !== null ? `${temp.toFixed(1)}°C` : "..."}
            </Text>
          </HStack>
          <HStack justifyContent="space-between" alignItems="center" flex={1}>
            <Text fontSize="$md" color="$blue900" fontWeight="$medium">Suhu Udara</Text>
          </HStack>
        </VStack>
      </Card>
    </TouchableOpacity>
  );
};

const HistoryCard = ({ item, powerKW = 3 }) => {
  const duration = formatDuration(item.sum_time || 0);
  const energy = ((item.sum_time || 0) / 3600 * powerKW).toFixed(0);
  const timeText = item.time || `${getTimeFromISO(item.start_time)} - ${getTimeFromISO(item.end_time)}`;

  return (
    <Card backgroundColor="$blue100" borderRadius="$xl" p="$4" justifyContent="center" variant="filled">
      <HStack space="sm">
        <VStack alignItems="center" justifyContent="center" borderRightWidth={1} borderStyle="dashed" borderColor="$blue300" pr="$3">
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
};

const Home = () => {
  const router = useRouter();
  const wsRef = useRef(null);

  const [authToken, setAuthToken] = useState(null);
  const [pumpStatus, setPumpStatus] = useState({ status: "Off", duration: "0 Jam" });
  const [temp, setTemp] = useState(0);
  const [humidity, setHumidity] = useState(0);
  const [soilMoisture, setSoilMoisture] = useState(0);
  const [waterLevel, setWaterLevel] = useState(0);
  const [pumpHistory, setPumpHistory] = useState([]);
  const [groupedHistory, setGroupedHistory] = useState({});

  const [totals, setTotals] = useState({
    totalTime: 0,
    totalEnergy: 0,
    totalActivities: 0
  });

  const [pumpInfo, setPumpInfo] = useState({
    power_kwh: 0,
    power_hp: 0,
    voltage: 0,
    name: "-"
  });

  const [loadingPump, setLoadingPump] = useState(false);
  const [connections, setConnections] = useState({
    pump: false,
    moisture: false,
    waterLevel: false
  });

  useEffect(() => {
    const loadToken = async () => {
      try {
        const token = await AsyncStorage.getItem("idToken");
        if (token) {
          setAuthToken(token);
        } else {
          Alert.alert("Session Expired", "Silakan login kembali", [
            { text: "OK", onPress: () => router.replace("/(auth)/login") }
          ]);
        }
      } catch (error) {
        console.error("Token error:", error);
      }
    };
    loadToken();
  }, []);

  const fetchPumpData = async () => {
    if (!authToken) return;

    try {
      setLoadingPump(true);
      const res = await fetch(`${API_BASE}/pump/1`, {
        headers: { 'Authorization': authToken }
      });

      if (res.ok) {
        const data = await res.json();
        setPumpInfo({
          power_kwh: data.power_kw || data.power_kwh || 2.5,
          power_hp: data.power_hp || 3.3,
          voltage: data.voltage || 220,
          name: data.pump_name || "Pump A"
        });
        setPumpStatus(prev => ({ ...prev, status: data.status_pump ? "Off" : "on" }));
      } else if (res.status === 401) {
        router.replace("/(auth)/login");
      }
    } catch (error) {
      console.error("Pump fetch error:", error);
    } finally {
      setLoadingPump(false);
    }
  };

  useEffect(() => {
    if (authToken) {
      fetchPumpData();
      const interval = setInterval(fetchPumpData, 30000);
      return () => clearInterval(interval);
    }
  }, [authToken]);

  useEffect(() => {
    if (!authToken) return;

    const connectPumpWS = () => {
      try {
        const ws = new WebSocket(`${WS_BASE}/ws/history-pump`, [], {
          headers: { Authorization: authToken }
        });

        wsRef.current = ws;

        ws.onopen = () => {
          setConnections(p => ({ ...p, pump: true }));
          ws.send(JSON.stringify({ action: "get_history", data: { pump_id: 1 } }));
        };

        ws.onmessage = (e) => {
          try {
            const res = JSON.parse(e.data);

            const history = Array.isArray(res.data) ? res.data : [];

            if (history.length === 0) {
              setPumpHistory([]);
              return;
            }

            const totalTime = history.reduce(
              (sum, item) => sum + Number(item.sum_time || 0),
              0
            );

            const totalEnergy =
              (totalTime / 3600) * (pumpInfo?.power_kwh || 2.5);

            setTotals({
              totalTime: Math.trunc(totalTime),
              totalEnergy: Number(totalEnergy.toFixed(2)),
              totalActivities: history.length,
            });

            setPumpHistory(history);

          } catch (err) {
            console.error("WS parse error:", err);
          }
        };


        ws.onerror = () => setConnections(p => ({ ...p, pump: false }));
        ws.onclose = () => {
          setConnections(p => ({ ...p, pump: false }));
          setTimeout(connectPumpWS, 3000);
        };
      } catch (error) {
        console.error("WS error:", error);
      }
    };

    const connectMoistureWS = () => {
      const ws = new WebSocket(`${WS_BASE}/ws/moisture`, [], {
        headers: { Authorization: authToken }
      });

      ws.onopen = () => {
        setConnections(p => ({ ...p, moisture: true }));
        ws.send(JSON.stringify({ action: "get_last" }));
      };

      ws.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data).data || JSON.parse(e.data);
          if (data?.soil_moisture !== undefined) {
            setSoilMoisture(data.soil_moisture);
            setHumidity(data.soil_moisture);
          }
          if (data?.temperature !== undefined) setTemp(data.temperature);
        } catch (error) {
          console.error("Moisture error:", error);
        }
      };

      ws.onclose = () => {
        setConnections(p => ({ ...p, moisture: false }));
        setTimeout(connectMoistureWS, 5000);
      };
    };

    const connectWaterLevelWS = () => {
      const ws = new WebSocket(`${WS_BASE}/ws/history-water-level`, [], {
        headers: { Authorization: authToken }
      });

      ws.onopen = () => {
        setConnections(p => ({ ...p, waterLevel: true }));
        ws.send(JSON.stringify({ action: "get_last" }));
      };

      ws.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data);
          if (typeof data.level === "number") setWaterLevel(data.level);
          else if (data.data?.level) setWaterLevel(data.data.level);
        } catch (error) {
          console.error("Water level error:", error);
        }
      };

      ws.onclose = () => {
        setConnections(p => ({ ...p, waterLevel: false }));
        setTimeout(connectWaterLevelWS, 5000);
      };
    };

    connectPumpWS();
    connectMoistureWS();
    connectWaterLevelWS();

    return () => {
      if (wsRef.current) wsRef.current.close();
    };
  }, [authToken]);

  useEffect(() => {
    if (pumpHistory.length === 0) {
      setGroupedHistory({});
      return;
    }

    const sorted = [...pumpHistory].sort((a, b) => new Date(b.start_time || 0) - new Date(a.start_time || 0));
    const grouped = {};

    sorted.forEach(item => {
      const date = item.start_time?.split("T")[0] || "unknown";
      if (!grouped[date]) grouped[date] = [];
      grouped[date].push(item);
    });

    const sortedDates = Object.keys(grouped).sort((a, b) => new Date(b) - new Date(a));
    const result = {};
    sortedDates.forEach(date => result[date] = grouped[date]);

    setGroupedHistory(result);
  }, [pumpHistory]);

  const pumpRuntime = formatDuration(totals.totalTime);
  const energyUsed = formatEnergy(totals.totalEnergy);

  const infoItems = [
    { title: "Level Drum", value: waterLevel.toFixed(0), icon: ArrowUpNarrowWide, unit: "%", clickable: true },
    { title: "Pompa Nyala", value: pumpRuntime.value, icon: Waves, unit: pumpRuntime.unit, clickable: false },
    { title: "Energi terpakai", value: energyUsed.value, icon: Zap, unit: energyUsed.unit, clickable: false },
  ];

  const pumpDetails = [
    { title: "Power(kwh)", value: pumpInfo.power_kwh.toFixed(1) },
    { title: "Power(hp)", value: pumpInfo.power_hp.toFixed(1) },
    { title: "Voltage(V)", value: pumpInfo.voltage.toFixed(0) },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#F8FEFF" }}>
      <Header title="Monitoring Pompa" />

      <ScrollView showsVerticalScrollIndicator={false}>
        {(!connections.pump || !connections.moisture || !connections.waterLevel) && (
          <Box px="$4" mt="$2">
            <Card backgroundColor="$orange100" borderRadius="$lg" p="$2" variant="filled">
              <Text fontSize="$xs" color="$orange900">
                {!connections.pump && "Pump disconnected "}
                {!connections.moisture && "Moisture disconnected "}
                {!connections.waterLevel && "Water level disconnected"}
              </Text>
            </Card>
          </Box>
        )}

        <HStack mt="$4" px="$4" space="md">
          <Card backgroundColor="$blue500" borderRadius="$2xl" flex={1} p="$4" variant="filled">
            <VStack space="sm">
              <HStack justifyContent="space-between" alignItems="center">
                <Center backgroundColor="$blue700" w="$8" h="$8" borderRadius="$full">
                  <Icon as={ToggleRight} size="md" color="$white" />
                </Center>
                {loadingPump && <Spinner size="small" color="$white" />}
              </HStack>
              <Text color="$white" fontSize="$lg" fontWeight="$semibold">Saklar Pompa Air</Text>
              <Text color="$white" fontSize="$5xl" fontWeight="$bold">{pumpStatus.status}</Text>
              <Text color="$white" fontSize="$sm">{pumpStatus.duration}</Text>
            </VStack>
          </Card>

          <VStack flex={1} space="sm">
            <WeatherCard router={router} />

            <TouchableOpacity onPress={() => router.push("/(sub-menu)/history-tanah")} activeOpacity={0.7}>
              <Card backgroundColor="$blue200" borderRadius="$2xl" p="$3" variant="filled">
                <VStack space="xs">
                  <HStack justifyContent="space-between" alignItems="center">
                    <Center backgroundColor="$blue500" w="$6" h="$6" borderRadius="$full">
                      <Icon as={Droplets} size="sm" color="$white" />
                    </Center>
                    <Text fontWeight="$bold" fontSize="$2xl" color="$blue900">{soilMoisture}%</Text>
                  </HStack>
                  <Text fontSize="$md" color="$blue900" fontWeight="$medium">Kelembapan Tanah</Text>
                </VStack>
              </Card>
            </TouchableOpacity>
          </VStack>
        </HStack>

        <HStack px="$4" mt="$5" flexWrap="wrap" justifyContent="space-between">
          {infoItems.map((item, i) => {
            const Content = (
              <Card variant="ghost" p="$2" width="100%">
                <VStack space="xs">
                  <Text fontSize="$xs">{item.title}</Text>
                  <HStack alignItems="flex-end" space="xs">
                    <Center backgroundColor="$blue500" w="$5" h="$5" borderRadius="$full">
                      <Icon as={item.icon} size="sm" color="$white" />
                    </Center>
                    <HStack alignItems="flex-end">
                      <Text fontSize="$md" fontWeight="$bold">{item.value}</Text>
                      <Text fontSize="$xs" fontWeight="$medium" ml="$1">{item.unit}</Text>
                    </HStack>
                  </HStack>
                </VStack>
              </Card>
            );

            return (
              <Box key={i} width="32%" mb="$3">
                {item.clickable ? (
                  <Pressable onPress={() => router.push("/(sub-menu)/history-drum")} w="100%">
                    {Content}
                  </Pressable>
                ) : Content}
              </Box>
            );
          })}
        </HStack>

        <Box px="$4">
          <Card backgroundColor="$blue500" borderRadius="$2xl" p="$4" variant="filled">
            <HStack space="md">
              <Center w="$11" h="$11">
                <Icon as={Waves} color="$white" size="lg" />
              </Center>
              <VStack flex={1} space="sm">
                <Text fontWeight="$bold" fontSize="$md" color="$white">{pumpInfo.name}</Text>
                {loadingPump ? (
                  <Center py="$3"><Spinner size="small" color="$white" /></Center>
                ) : (
                  <HStack justifyContent="space-between">
                    {pumpDetails.map((item, i) => (
                      <VStack key={i} flex={1}>
                        <Text color="$white" fontSize="$xs">{item.title}</Text>
                        <Text fontWeight="$bold" color="$white">{item.value}</Text>
                      </VStack>
                    ))}
                  </HStack>
                )}
              </VStack>
            </HStack>
          </Card>
        </Box>

        <VStack px="$4" mt="$5" space="sm">
          <Text fontSize="$md" fontWeight="$semibold">Riwayat Penggunaan</Text>

          <Box>
            {Object.keys(groupedHistory).length === 0 ? (
              <Box bg="$blue50" p="$6" borderRadius="$xl" alignItems="center">
                <Text fontSize="$sm" color="$textLight600">Tidak ada riwayat penggunaan</Text>
              </Box>
            ) : (
              Object.entries(groupedHistory).slice(0, 2).map(([date, items]) => (
                <VStack key={date} space="sm" mb="$6">
                  <Text fontSize="$sm" color="$textLight600" fontWeight="$semibold">{formatDate(date)}</Text>
                  {items.slice(0, 5).map((item, i) => (
                    <HistoryCard
                      key={`${date}-${i}`}
                      item={{
                        ...item,
                        title: item.pump_name || "Pompa 1",
                        time: `${getTimeFromISO(item.start_time)} - ${getTimeFromISO(item.end_time)}`,
                      }}
                      powerKW={pumpInfo.power_kwh || 3}
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