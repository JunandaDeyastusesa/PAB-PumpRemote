import React, { useState, useEffect } from 'react';
import { Header } from "../../components/header";
import {
    Box,
    HStack,
    Heading,
    Text,
    Center,
    VStack,
    ScrollView,
    Pressable
} from "@gluestack-ui/themed";
import { SafeAreaView } from "react-native-safe-area-context";
import { Alert } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getAuth, signOut } from "firebase/auth";

/* ================= COMPONENTS ================= */

const ProfileCard = ({ userName, pumpName, infoPump }) => (
    <Box bg="$blue500" borderRadius="$2xl" p="$5" mb="$4">
        <HStack space="md" alignItems="flex-start">
            <Center w={60} h={60} borderRadius="$full" bg="$blue400">
                <Ionicons name="person" size={32} color="white" />
            </Center>

            <VStack flex={1}>
                <Text fontSize="$lg" fontWeight="$bold" color="$white" mb="$1">
                    {userName}
                </Text>
                <Text fontSize="$sm" color="$white" mb="$4" lineHeight="$sm">
                    {pumpName}
                </Text>

                <HStack space="sm" justifyContent="space-between">
                    {infoPump.map((item, index) => (
                        <VStack key={index} flex={1}>
                            <Text fontSize="$xs" color="$white">
                                {item.title}
                            </Text>
                            <Text fontSize="$md" fontWeight="$bold" color="$white">
                                {item.value}
                            </Text>
                        </VStack>
                    ))}
                </HStack>
            </VStack>
        </HStack>
    </Box>
);

const PumpListItem = ({ item, isActive }) => (
    <Box bg="$blue100" borderRadius="$lg" p="$4">
        <HStack justifyContent="space-between" alignItems="center">
            <VStack flex={1}>
                <Text fontSize="$md" fontWeight="$semibold" mb="$1">
                    {item.title}
                </Text>
                <Text fontSize="$sm" color="$textLight600">
                    {item.value}
                </Text>
            </VStack>

            <Center w={40} h={40}>
                <Ionicons
                    name={isActive ? "toggle" : "toggle-outline"}
                    size={32}
                    color={isActive ? "#2CB810" : "#666"}
                />
            </Center>
        </HStack>
    </Box>
);

/* ================= MAIN ================= */

const Profile = () => {
    const router = useRouter();

    const [userProfile] = useState({
        name: 'User Pompa',
        activePump: 'Loading...'
    });

    const [infoPump, setInfoPump] = useState([
        { title: 'Power(kwh)', value: 'Loading...' },
        { title: 'Power(hp)', value: 'Loading...' },
        { title: 'Voltage(V)', value: 'Loading...' },
    ]);

    const [daftarPompa, setDaftarPompa] = useState([
        { id: 1, title: 'Loading...', value: 'Loading...', isActive: false },
    ]);

    useEffect(() => {
        const fetchPumpData = async () => {
            try {
                const token = await AsyncStorage.getItem("idToken");
                if (!token) return;

                const response = await fetch('http://100.64.57.66:9876/pump/1', {
                    headers: { Authorization: token },
                });

                const data = await response.json();

                setInfoPump([
                    { title: 'Power(kwh)', value: data.power_kw?.toString() || '0' },
                    { title: 'Power(hp)', value: data.power_hp?.toString() || '0' },
                    { title: 'Voltage(V)', value: data.voltage?.toString() || '0' },
                ]);

                setDaftarPompa([
                    {
                        id: 1,
                        title: data.pump_name || 'Pompa 1',
                        value: `${data.power_kw || 0}KWH, ${data.power_hp || 0}HP, ${data.voltage || 0}V`,
                        isActive: data.status_pump || false
                    },
                ]);
            } catch (err) {
                console.error(err);
            }
        };

        fetchPumpData();
    }, []);

    /* ===== LOGOUT ===== */

    const doLogout = async () => {
        try {
            const auth = getAuth();
            await signOut(auth);

            await AsyncStorage.multiRemove([
                "idToken",
                "UID",
                "userEmail",
                "loginTimestamp",
            ]);

            router.replace("/(auth)/login");
        } catch (err) {
            Alert.alert("Logout Error", "Gagal logout. Silakan coba lagi.");
        }
    };

    const handleLogout = () => {
        Alert.alert(
            "Konfirmasi Logout",
            "Apakah Anda yakin ingin keluar?",
            [
                { text: "Batal", style: "cancel" },
                { text: "Keluar", style: "destructive", onPress: doLogout },
            ],
            { cancelable: true }
        );
    };

    return (
        <SafeAreaView style={{ backgroundColor: '#F8FEFF' }}>
            <Header title="Profil" />

            <ScrollView showsVerticalScrollIndicator={false}>
                <Box px="$5" py="$4">
                    <ProfileCard
                        userName={userProfile.name}
                        pumpName={daftarPompa[0]?.title || 'Loading...'}
                        infoPump={infoPump}
                    />

                    <VStack space="sm" mb="$4">
                        <Heading size="lg">Daftar Pompa</Heading>
                        {daftarPompa.map((item) => (
                            <PumpListItem key={item.id} item={item} isActive={item.isActive} />
                        ))}
                    </VStack>

                    <Box mt="$4" mb="$6">
                        <Pressable onPress={handleLogout}>
                            <Box
                                bg="$white"
                                borderRadius="$lg"
                                p="$3"
                                mt="$240"
                                borderWidth={1}
                                borderColor="$red200"
                            >
                                <HStack justifyContent="space-between" alignItems="center">
                                    <HStack space="md" alignItems="center">
                                        <Ionicons name="log-out-outline" size={24} color="#DC2626" />
                                        <Text fontSize="$md" fontWeight="$semibold" color="$red600">
                                            Keluar
                                        </Text>
                                    </HStack>
                                    <Ionicons name="chevron-forward" size={24} color="#DC2626" />
                                </HStack>
                            </Box>
                        </Pressable>
                    </Box>
                </Box>
            </ScrollView>
        </SafeAreaView>
    );
};

export default Profile;
