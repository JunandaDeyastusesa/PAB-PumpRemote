import Ionicons from "@expo/vector-icons/Ionicons";
import { Box, Card, Center, HStack, Heading, Pressable, Text, VStack } from "@gluestack-ui/themed";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { Alert, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Header } from "../../components/header";

const WS_URL = "ws://100.64.57.66:9876/ws/history-pump";

const formatWaktu = (detik) => {
  if (detik < 60) return { nilai: detik.toFixed(0), satuan: "detik" };
  if (detik < 3600) return { nilai: (detik / 60).toFixed(0), satuan: "menit" };
  return { nilai: (detik / 3600).toFixed(1), satuan: "jam" };
};

const hitungEnergi = (detik) => ((detik / 3600) * 64).toFixed(0);

const ambilJam = (waktuISO) => {
  if (!waktuISO) return "00:00";
  return waktuISO.split("T")[1]?.slice(0, 5) || "00:00";
};

const formatTanggal = (tgl) => {
  const date = new Date(tgl);
  const today = new Date();
  const kemarin = new Date(today);
  kemarin.setDate(kemarin.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return "Hari Ini";
  if (date.toDateString() === kemarin.toDateString()) return "Kemarin";

  return date.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
};

const TombolPower = ({ status, onPress, loading }) => {
  const warnaButton = loading ? "#9CA3AF" : (status ? "#22C55E" : "#EF4444");
  const textStatus = loading ? "Processing..." : (status ? "Power ON" : "Power OFF");

  return (
    <Box bg="$blue50" borderRadius="$2xl" p="$6" alignItems="center" my="$4">
      <Heading size="xl" mb="$2">{textStatus}</Heading>
      <Pressable onPress={onPress} disabled={loading}>
        <Center w={80} h={80} borderRadius="$xl" backgroundColor={warnaButton} opacity={loading ? 0.6 : 1}>
          <Ionicons name="power" size={40} color="white" />
        </Center>
      </Pressable>
    </Box>
  );
};

const CardRiwayat = ({ data }) => {
  const waktu = formatWaktu(data.sum_time || 0);
  const energi = hitungEnergi(data.sum_time || 0);
  const jamText = `${ambilJam(data.start_time)} - ${ambilJam(data.end_time)}`;

  return (
    <Card backgroundColor="$blue100" borderRadius="$xl" p="$4" variant="filled">
      <HStack space="sm">
        <VStack alignItems="center" justifyContent="center" borderRightWidth={1}
          borderStyle="dashed" borderColor="$blue300" pr="$3">
          <Text fontSize="$2xl" fontWeight="$bold">{waktu.nilai}</Text>
          <Text fontSize="$xs">{waktu.satuan}</Text>
        </VStack>
        <VStack flex={1}>
          <HStack justifyContent="space-between" ml="$4">
            <VStack justifyContent="center">
              <Text fontWeight="$bold" mb="$1">{data.pump_name || "Pompa 1"}</Text>
              <Text fontSize="$sm">{jamText} WIB</Text>
            </VStack>
            <VStack justifyContent="center" alignItems="center">
              <Text fontSize="$sm">{energi} Kwh</Text>
            </VStack>
          </HStack>
        </VStack>
      </HStack>
    </Card>
  );
};

const Power = () => {
  const router = useRouter();
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(false);
  const [statusPompa, setStatusPompa] = useState(null);
  const [riwayat, setRiwayat] = useState([]);
  const [riwayatPerTanggal, setRiwayatPerTanggal] = useState({});
  const [ws, setWs] = useState(null);

  useEffect(() => {
    const loadToken = async () => {
      const savedToken = await AsyncStorage.getItem("idToken");
      if (savedToken) {
        setToken(savedToken);
      } else {
        Alert.alert("Session Expired", "Silakan login kembali", [
          { text: "OK", onPress: () => router.replace("/(auth)/login") }
        ]);
      }
    };
    loadToken();
  }, []);

  useEffect(() => {
    if (!token) return;

    const connectWS = () => {
      const websocket = new WebSocket(WS_URL, [], {
        headers: { Authorization: token }
      });

      websocket.onopen = () => {
        websocket.send(JSON.stringify({
          action: "get_status_and_history",
          data: { pump_id: 1 }
        }));
      };

      websocket.onmessage = (e) => {
        const res = JSON.parse(e.data);

        if (res.status === "success" && res.data === "waiting") {
          setLoading(true);
          return;
        }

        if (res.action === "pump_status") {
          const isOn = res.message === "pump turned on";
          setStatusPompa(isOn);
          setLoading(false);

          setTimeout(() => {
            if (websocket.readyState === WebSocket.OPEN) {
              websocket.send(JSON.stringify({
                action: "get_status_and_history",
                data: { pump_id: 1 }
              }));
            }
          }, 300);
          return;
        }

        if (res.status === "success" && res.data?.data) {
          setStatusPompa(res.data.last_status);
          setLoading(false);

          if (res.data.data && Array.isArray(res.data.data)) {
            const sorted = [...res.data.data].sort((a, b) =>
              new Date(b.start_time) - new Date(a.start_time)
            );
            setRiwayat(sorted);
          }
        }
      };

      websocket.onerror = () => console.error("WS Error");
      websocket.onclose = () => {
        setLoading(true);
        setTimeout(connectWS, 3000);
      };

      setWs(websocket);
    };

    connectWS();

    return () => {
      if (ws) ws.close();
    };
  }, [token]);

  useEffect(() => {
    if (riwayat.length === 0) {
      setRiwayatPerTanggal({});
      return;
    }

    const grouped = {};
    riwayat.forEach(item => {
      const tanggal = item.start_time?.split("T")[0] || "unknown";
      if (!grouped[tanggal]) grouped[tanggal] = [];
      grouped[tanggal].push(item);
    });

    const sortedDates = Object.keys(grouped).sort((a, b) => new Date(b) - new Date(a));
    const result = {};
    sortedDates.forEach(date => {
      result[date] = grouped[date];
    });

    setRiwayatPerTanggal(result);
  }, [riwayat]);

  const togglePower = () => {
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      Alert.alert("Error", "Koneksi WebSocket belum siap");
      return;
    }

    if (loading) return;

    setLoading(true);
    setStatusPompa(!statusPompa);

    ws.send(JSON.stringify({
      action: "pump_command",
      data: { pump_id: 1, status: !statusPompa }
    }));
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FEFF' }}>
      <Header title="Monitoring Pompa" />

      <Box px="$5" py="$4">
        <TombolPower status={statusPompa} onPress={togglePower} loading={loading} />

        <HStack justifyContent="space-between" alignItems="center" mt="$3">
          <Heading size="lg">Riwayat Penggunaan</Heading>
          <Pressable onPress={() => router.push("/(sub-menu)/history-pump")}>
            <Text color="$blue600" fontWeight="$semibold">Lihat Semua</Text>
          </Pressable>
        </HStack>
      </Box>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        <Box px="$3" pb="$4" mx="$1">
          {Object.keys(riwayatPerTanggal).length === 0 ? (
            <Center py="$10">
              <Text color="$textLight600">Belum ada riwayat penggunaan</Text>
            </Center>
          ) : (
            Object.entries(riwayatPerTanggal).map(([tanggal, items]) => (
              <VStack key={tanggal} space="sm" mb="$6">
                <Box px="$2">
                  <Text fontSize="$sm" color="$textLight600" fontWeight="$semibold">
                    {formatTanggal(tanggal)}
                  </Text>
                </Box>
                {items.map((item, i) => (
                  <CardRiwayat key={`${tanggal}-${i}`} data={item} />
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