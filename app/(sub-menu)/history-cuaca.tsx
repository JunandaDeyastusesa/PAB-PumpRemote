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
            date: "09 Jan 2026",
            data: [
              { title: "Suhu Udara", time: "18:00:00", value: "26.4°C" },
              { title: "Suhu Udara", time: "19:00:00", value: "26.8°C" },
              { title: "Suhu Udara", time: "18:00:00", value: "27.2°C" },
              { title: "Suhu Udara", time: "17:00:00", value: "27.6°C" },
              { title: "Suhu Udara", time: "16:00:00", value: "27.2°C" },
              { title: "Suhu Udara", time: "15:00:00", value: "27.0°C" },
              { title: "Suhu Udara", time: "14:00:00", value: "28.0°C" },
              { title: "Suhu Udara", time: "13:00:00", value: "27.1°C" },
              { title: "Suhu Udara", time: "12:00:00", value: "27.4°C" },
              { title: "Suhu Udara", time: "11:00:00", value: "28.0°C" },
            ],
          },
          {
            date: "08 Jan 2025",
            data: [
              { title: "Suhu Udara", time: "13:20:00", value: "30°C" },
              { title: "Suhu Udara", time: "10:40:20", value: "28°C" },
              { title: "Suhu Udara", time: "07:50:00", value: "27°C" },
            ],
          },
        ]
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#F8FEFF" }}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <VStack px="$4" mb="$5" space="lg">
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
