import React, { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { ScrollView } from "react-native";
import { Box, VStack, HStack, Text, Card, Center } from "@gluestack-ui/themed";

const HistoryCuaca = ({ initialWeather = [] }) => {
  const [historyData, setHistoryData] = useState(
    initialWeather.length > 0
      ? initialWeather
      : [
          {
            date: "12 Jan 2025",
            data: [
              { title: "Suhu Udara", time: "13:20:00", value: "30°C" },
              { title: "Suhu Udara", time: "10:40:20", value: "28°C" },
              { title: "Suhu Udara", time: "07:50:00", value: "27°C" },
            ],
          },
          {
            date: "11 Jan 2025",
            data: [
              { title: "Suhu Udara", time: "14:10:20", value: "29°C" },
              { title: "Suhu Udara", time: "09:30:10", value: "31°C" },
            ],
          },
        ]
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#F8FEFF" }}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <VStack px="$4" mt="$3" mb="$5" space="lg">
          {historyData.map((section, index) => (
            <Box key={index}>
              <Text fontSize="$sm" color="$textLight600" mb="$2">
                {section.date}
              </Text>

              <VStack space="sm">
                {section.data.map((item, i) => (
                  <Card
                    key={i}
                    backgroundColor="$blue100"
                    borderRadius="$xl"
                    p="$4"
                    variant="filled"
                  >
                    <HStack justifyContent="space-between" alignItems="center">
                      <VStack>
                        <Text fontWeight="$bold">{item.title}</Text>
                        <Text fontSize="$sm">{item.time} WIB</Text>
                      </VStack>

                      <Center>
                        <Text fontSize="$lg" fontWeight="$bold" color="$blue900">
                          {item.value}
                        </Text>
                      </Center>
                    </HStack>
                  </Card>
                ))}
              </VStack>
            </Box>
          ))}
        </VStack>
      </ScrollView>
    </SafeAreaView>
  );
};

export default HistoryCuaca;
