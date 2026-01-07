import { Box, Image, HStack, Heading, Text, View, Pressable } from "@gluestack-ui/themed";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "@expo/vector-icons/Ionicons";
import { router, useNavigation } from "expo-router";

type HeaderProps = {
    title: string;
};

const Header = ({ title }: HeaderProps) => {
    const navigation = useNavigation();

    const handleNotification = () => {
        router.push('../../(sub-menu)/todolist');
    };
    return (
        <Box bg="#F8FEFF" px="$4" py="$2">
            <HStack justifyContent="space-between" alignItems="center">
                <View>
                    <Heading size="md" mb="$0">{title}</Heading>
                    <Text size="sm" mt="$0">Monitoring Pompa</Text>
                </View>

                <HStack>
                    <Pressable onPress={handleNotification}>
                        <Ionicons name="notifications-outline" size={24} color="black" />
                    </Pressable>
                </HStack>
            </HStack>
        </Box>
    )
}

export default Header;