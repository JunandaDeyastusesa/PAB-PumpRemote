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
          date: "09 Jan 2026",
          data: [
            { title: "Kelembapan Tanah", time: "16:58:42", value: "42%" },
            { title: "Kelembapan Tanah", time: "16:55:10", value: "40%" },
            { title: "Kelembapan Tanah", time: "16:50:33", value: "39%" },
            { title: "Kelembapan Tanah", time: "16:45:58", value: "41%" },
            { title: "Kelembapan Tanah", time: "16:40:21", value: "38%" },
            { title: "Kelembapan Tanah", time: "16:35:47", value: "36%" },
            { title: "Kelembapan Tanah", time: "16:30:09", value: "37%" },
            { title: "Kelembapan Tanah", time: "16:25:55", value: "35%" },
            { title: "Kelembapan Tanah", time: "16:20:14", value: "34%" },
            { title: "Kelembapan Tanah", time: "16:15:36", value: "33%" },
            { title: "Kelembapan Tanah", time: "16:10:02", value: "32%" },
            { title: "Kelembapan Tanah", time: "16:05:48", value: "31%" },
            { title: "Kelembapan Tanah", time: "16:00:19", value: "30%" },
            { title: "Kelembapan Tanah", time: "15:55:41", value: "29%" },
            { title: "Kelembapan Tanah", time: "15:50:40", value: "28%" },
            { title: "Kelembapan Tanah", time: "15:45:22", value: "27%" },
            { title: "Kelembapan Tanah", time: "15:40:05", value: "26%" },
            { title: "Kelembapan Tanah", time: "15:35:33", value: "25%" },
            { title: "Kelembapan Tanah", time: "15:30:11", value: "24%" },
            { title: "Kelembapan Tanah", time: "15:25:49", value: "23%" },
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
