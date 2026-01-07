import React, { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { ScrollView } from "react-native";
import { Box, VStack, HStack, Text, Card, Center } from "@gluestack-ui/themed";

const HistoryTanah = ({ initialData = [] }) => {
  const [historyData, setHistoryData] = useState(
    initialData.length > 0
      ? initialData
      : [
          {
            date: "12 Jan 2025",
            data: [
              { title: "Kelembapan Tanah", time: "13:00:10", value: "40%" },
              { title: "Kelembapan Tanah", time: "12:50:50", value: "37%" },
              { title: "Kelembapan Tanah", time: "15:50:40", value: "10%" },
            ],
          },
          {
            date: "11 Jan 2025",
            data: [
              { title: "Kelembapan Tanah", time: "13:00:00", value: "40%" },
              { title: "Kelembapan Tanah", time: "12:50:50", value: "30%" },
              { title: "Kelembapan Tanah", time: "15:50:40", value: "20%" },
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
                  <Card key={i} backgroundColor="$blue100" borderRadius="$xl" p="$4" variant="filled">
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

export default HistoryTanah;
