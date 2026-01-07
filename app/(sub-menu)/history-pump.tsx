import { Box, HStack, Heading, Pressable, ScrollView, Text, VStack, Center, Spinner } from "@gluestack-ui/themed";
import { useRouter } from 'expo-router';
import { RefreshCw } from "lucide-react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Alert, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// WebSocket URLs
const API_BASE_URL = "http://100.64.57.66:9876";
const WS_BASE_URL = "ws://100.64.57.66:9876";
const WS_PUMP_URL = `${WS_BASE_URL}/ws/history-pump`;

// Helper functions
const secondsToHours = (seconds = 0) => {
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
    return {
        value: hours.toFixed(2).replace(".", ","),
        unit: "Jam"
    };
};

// Fungsi untuk format yang hanya menampilkan menit (untuk backward compatibility)
const secondsToMinutes = (seconds = 0) => {
    const minutes = seconds / 60;
    return minutes.toFixed(2).replace(".", ",");
};

// Fungsi untuk menghitung KWH berdasarkan power_kw dari API
const calculateEnergy = (seconds, powerKW = 0.064) => {
    const hours = seconds / 3600;
    const kwh = powerKW * hours;
    return kwh.toFixed(2).replace(".", ",");
};

const getHourMinute = (isoTime) => {
    if (!isoTime) return "00:00";
    const parts = isoTime.split("T");
    if (parts.length < 2) return "00:00";
    return parts[1].slice(0, 5);
};

const formatDateHeader = (dateString) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
        weekday: 'long',
        day: '2-digit',
        month: 'long',
        year: 'numeric'
    });
};

// Component Pump History Card
const PumpHistoryCard = ({ item, powerKW }) => {
    const duration = secondsToHours(item.sum_time);

    return (
        <Box
            bg={"$blue100"}
            borderRadius="$xl"
            p="$4"
            my="$1"
            mx="$1"
        >
            <HStack space="sm" alignItems="center">
                <VStack
                    alignItems="center"
                    justifyContent="center"
                    borderRightWidth={1}
                    borderStyle="dashed"
                    borderColor="$blue300"
                    pr="$3"
                    minWidth={70}
                >
                    <Center>
                        <Text fontSize="$2xl" fontWeight="$bold">{duration.value}</Text>
                        <Text fontSize="$xs">{duration.unit}</Text>
                    </Center>
                </VStack>
                <VStack flex={1}>
                    <HStack justifyContent="space-between" ml="$4" alignItems="center">
                        <VStack justifyContent="center">
                            <Text fontWeight="$bold" mb="$1">
                                {item.title}
                            </Text>
                            <Text fontSize="$sm">{item.time} WIB</Text>
                        </VStack>
                        <VStack justifyContent="center" alignItems="center">
                            <Text fontSize="$sm" fontWeight="$semibold">{item.sumEnergy} Kwh</Text>
                        </VStack>
                    </HStack>
                </VStack>
            </HStack>
        </Box>
    );
};

const HistoryPump = () => {
    const router = useRouter();

    // States
    const [authToken, setAuthToken] = useState(null);
    const [pumpHistory, setPumpHistory] = useState([]);
    const [groupedHistory, setGroupedHistory] = useState({});
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);

    // State untuk power_kw dari API
    const [powerKW, setPowerKW] = useState(0.064); // Default 0.064 kW = 64W

    // Refs
    const wsRef = useRef(null);
    const reconnectTimeoutRef = useRef(null);

    // Get auth token
    useEffect(() => {
        const getToken = async () => {
            try {
                const token = await AsyncStorage.getItem("idToken");
                if (token) {
                    setAuthToken(token);
                } else {
                    Alert.alert(
                        "Session Expired",
                        "Silakan login kembali",
                        [{ text: "OK", onPress: () => router.replace("/(auth)/login") }]
                    );
                    setIsLoading(false);
                }
            } catch (err) {
                console.error("Error loading token:", err);
                setIsLoading(false);
            }
        };
        getToken();
    }, []);

    // Fetch power_kw dari API
    const fetchPumpPower = useCallback(async () => {
        if (!authToken) return;

        try {
            const response = await fetch(`${API_BASE_URL}/pump/1`, {
                method: 'GET',
                headers: {
                    'Authorization': authToken
                },
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            // Set power_kw dari API, default ke 0.064 jika tidak ada
            setPowerKW(data.power_kw || 0.064);

        } catch (err) {
            console.error('Error fetching pump power:', err);
            // Tetap gunakan default jika error
            setPowerKW(0.064);
        }
    }, [authToken]);

    // Group history by date
    const groupHistoryData = useCallback((data) => {
        if (!data || data.length === 0) {
            setGroupedHistory({});
            return {};
        }

        const grouped = data.reduce((acc, item) => {
            const date = item.start_time?.split("T")[0] || "unknown";
            if (!acc[date]) acc[date] = [];
            acc[date].push(item);
            return acc;
        }, {});

        // Sort items within each date (terbaru dulu)
        Object.keys(grouped).forEach(date => {
            grouped[date].sort((a, b) => new Date(b.start_time) - new Date(a.start_time));
        });

        setGroupedHistory(grouped);
        return grouped;
    }, []);

    // Setup WebSocket untuk real-time data
    const connectWebSocket = useCallback(() => {
        if (!authToken) return;

        // Close existing connection
        if (wsRef.current) {
            wsRef.current.close();
        }

        // Clear any pending reconnection
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
        }

        const ws = new WebSocket(WS_PUMP_URL, [], {
            headers: { Authorization: authToken }
        });

        ws.onopen = () => {
            console.log("✅ WebSocket Connected: history-pump");

            // Request all history data
            ws.send(JSON.stringify({
                action: "get_history",
                data: {
                    pump_id: 1
                }
            }));
        };

        ws.onmessage = (event) => {
            try {
                const response = JSON.parse(event.data);

                // Handle history data response
                if (response.action === "get_history" || response.status === "success") {
                    let historyData = [];

                    // Extract data from different response formats
                    if (response.data && Array.isArray(response.data)) {
                        historyData = response.data;
                    } else if (response.data && response.data.data && Array.isArray(response.data.data)) {
                        historyData = response.data.data;
                    } else if (Array.isArray(response)) {
                        historyData = response;
                    }

                    if (historyData.length > 0) {
                        // Sort by start_time descending (terbaru dulu)
                        const sortedData = [...historyData]
                            .filter(item => item.start_time && item.end_time)
                            .sort((a, b) => new Date(b.start_time) - new Date(a.start_time));

                        setPumpHistory(sortedData);
                        groupHistoryData(sortedData);
                    } else {
                        setPumpHistory([]);
                        setGroupedHistory({});
                    }

                    setIsLoading(false);
                    setIsRefreshing(false);
                }

            } catch (err) {
                console.error("❌ Error parsing WS data:", err);
                setIsLoading(false);
                setIsRefreshing(false);
            }
        };

        ws.onerror = (error) => {
            console.error("❌ WebSocket Error:", error);
            setIsLoading(false);
            setIsRefreshing(false);
        };

        ws.onclose = () => {
            console.log("🔌 WebSocket Closed");
            setTimeout(connectWebSocket, 5000);
        };
    }, [authToken, groupHistoryData]);

    // Initialize WebSocket connection dan fetch power
    useEffect(() => {
        if (authToken) {
            // Fetch power_kw terlebih dahulu
            fetchPumpPower();
            // Kemudian connect WebSocket
            connectWebSocket();
        }

        // Cleanup function
        return () => {
            if (wsRef.current) {
                wsRef.current.close(1000, "Component unmounting");
            }
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
            }
        };
    }, [authToken, connectWebSocket, fetchPumpPower]);

    // Handler untuk refresh data
    const handleRefresh = () => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            setIsRefreshing(true);

            wsRef.current.send(JSON.stringify({
                action: "get_history",
                data: {
                    pump_id: 1
                }
            }));

            // Juga refresh power dari API
            fetchPumpPower();
        } else {
            connectWebSocket();
        }
    };

    // Calculate totals dengan power_kw aktual
    const calculateTotals = () => {
        if (pumpHistory.length === 0) return null;

        const totalTime = pumpHistory.reduce((sum, item) => sum + (item.sum_time || 0), 0);
        const totalEnergy = calculateEnergy(totalTime, powerKW);
        const totalActivities = pumpHistory.length;

        return { totalTime, totalEnergy, totalActivities };
    };

    const totals = calculateTotals();

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FEFF' }}>
            <ScrollView
                contentContainerStyle={{ paddingTop: 0 }}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={isRefreshing}
                        onRefresh={handleRefresh}
                        colors={["#2563eb"]}
                        tintColor="#2563eb"
                    />
                }
            >
                <Box px="$3" pb="$8" pt="$0">
                    {isLoading ? (
                        <Center py="$10">
                            <VStack space="md" alignItems="center">
                                <Spinner size="large" color="$blue600" />
                                <Text color="$textLight600">Memuat riwayat pompa...</Text>
                            </VStack>
                        </Center>
                    ) : pumpHistory.length === 0 ? (
                        <Center py="$10">
                            <VStack space="md" alignItems="center">
                                <Text color="$textLight600" fontSize="$lg">Belum ada riwayat</Text>
                                <Text fontSize="$sm" color="$textLight500" textAlign="center" px="$10">
                                    Data riwayat pompa akan muncul di sini{'\n'}
                                    setelah pompa digunakan.
                                </Text>
                                <Pressable onPress={handleRefresh} mt="$4">
                                    <Text color="$blue600" fontWeight="$semibold">Refresh</Text>
                                </Pressable>
                            </VStack>
                        </Center>
                    ) : (
                        <>
                            {/* Total Summary Card */}
                            {totals && (() => {
                                const totalDuration = secondsToHours(totals.totalTime);
                                return (
                                    <Box mb="$6" p="$4" bg="$blue50" borderRadius="$xl" mx="$1">
                                        <VStack space="sm">
                                            <Heading size="md" color="$textLight800">
                                                Ringkasan Total
                                            </Heading>
                                            <HStack justifyContent="space-between" pt="$2">
                                                <VStack>
                                                    <Text color="$textLight600" fontSize="$xs">Total Aktivitas</Text>
                                                    <Text fontSize="$xl" fontWeight="$bold" color="$blue600">
                                                        {totals.totalActivities}
                                                    </Text>
                                                </VStack>
                                                <VStack>
                                                    <Text color="$textLight600" fontSize="$xs">Total Waktu</Text>
                                                    <Text fontSize="$xl" fontWeight="$bold" color="$blue600">
                                                        {totalDuration.value}
                                                        <Text fontSize="$xs" color="$textLight500"> {totalDuration.unit}</Text>
                                                    </Text>
                                                </VStack>
                                                <VStack>
                                                    <Text color="$textLight600" fontSize="$xs">Total Energi</Text>
                                                    <Text fontSize="$xl" fontWeight="$bold" color="$blue600">
                                                        {totals.totalEnergy}
                                                        <Text fontSize="$xs" color="$textLight500"> Kwh</Text>
                                                    </Text>
                                                </VStack>
                                            </HStack>
                                        </VStack>
                                    </Box>
                                );
                            })()}

                            {/* History by Date */}
                            {Object.entries(groupedHistory).map(([date, items]) => {
                                const totalTimeForDate = items.reduce((sum, item) => sum + (item.sum_time || 0), 0);
                                const dateDuration = secondsToHours(totalTimeForDate);

                                return (
                                    <VStack key={date} space="sm" mb="$6">
                                        {/* Date Header */}
                                        <Box px="$3" py="$2" borderRadius="$lg">
                                            <HStack justifyContent="space-between" alignItems="center">
                                                <VStack>
                                                    <Text fontSize="$md" color="$textLight600" fontWeight="$semibold">
                                                        {formatDateHeader(date)}
                                                    </Text>
                                                    <Text fontSize="$xs" color="$textLight600">
                                                        {items.length} aktivitas • {dateDuration.value} {dateDuration.unit}
                                                    </Text>
                                                </VStack>
                                                <Text fontSize="$xs" color="$textLight600">
                                                    {calculateEnergy(totalTimeForDate, powerKW)} Kwh
                                                </Text>
                                            </HStack>
                                        </Box>

                                        {/* History Items */}
                                        {items.map((item, i) => (
                                            <PumpHistoryCard
                                                key={`${date}-${i}-${item.start_time}-${item.end_time}`}
                                                item={{
                                                    pump_name: item.pump_name || "Pompa 1",
                                                    start_time: item.start_time,
                                                    end_time: item.end_time,
                                                    sum_time: item.sum_time || 0,
                                                    title: item.pump_name || "Pompa 1",
                                                    time: `${getHourMinute(item.start_time)} - ${getHourMinute(item.end_time)}`,
                                                    sumEnergy: calculateEnergy(item.sum_time || 0, powerKW)
                                                }}
                                                powerKW={powerKW}
                                            />
                                        ))}
                                    </VStack>
                                );
                            })}
                        </>
                    )}
                </Box>
            </ScrollView>
        </SafeAreaView>
    );
};

export default HistoryPump;