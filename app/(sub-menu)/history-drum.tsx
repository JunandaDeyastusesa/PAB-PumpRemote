import React, { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { ScrollView } from "react-native";
import { Box, VStack, HStack, Text, Card, Center } from "@gluestack-ui/themed";

const HistoryDrum = ({ initialStatus = [] }) => {
  const [historyData, setHistoryData] = useState(
    initialStatus.length > 0
      ? initialStatus
      : [
        {
          date: "09 Jan 2026",
          data: [
            { title: "Pompa Air Utama", time: "17:05:42", status: "95%" },
            { title: "Pompa Air Utama", time: "17:01:18", status: "92%" },
            { title: "Pompa Air Utama", time: "16:56:47", status: "90%" },
            { title: "Pompa Air Utama", time: "16:52:13", status: "88%" },
            { title: "Pompa Air Utama", time: "16:47:55", status: "85%" },
            { title: "Pompa Air Utama", time: "16:43:29", status: "83%" },
            { title: "Pompa Air Utama", time: "16:38:54", status: "80%" },
            { title: "Pompa Air Utama", time: "16:34:21", status: "78%" },
            { title: "Pompa Air Utama", time: "16:29:46", status: "75%" },
            { title: "Pompa Air Utama", time: "16:25:08", status: "73%" },
            { title: "Pompa Air Utama", time: "16:20:33", status: "70%" },
            { title: "Pompa Air Utama", time: "16:15:57", status: "68%" },
            { title: "Pompa Air Utama", time: "16:11:24", status: "65%" },
            { title: "Pompa Air Utama", time: "16:06:49", status: "63%" },
            { title: "Pompa Air Utama", time: "16:02:15", status: "60%" },
            { title: "Pompa Air Utama", time: "15:57:41", status: "58%" },
            { title: "Pompa Air Utama", time: "15:53:06", status: "55%" },
            { title: "Pompa Air Utama", time: "15:48:32", status: "53%" },
            { title: "Pompa Air Utama", time: "15:44:00", status: "50%" },
            { title: "Pompa Air Utama", time: "15:39:26", status: "48%" },
          ],
        },
        {
          date: "08 Jan 2026",
          data: [
            { title: "Pompa Air Utama", time: "15:34:51", status: "45%" },
            { title: "Pompa Air Utama", time: "15:30:18", status: "43%" },
            { title: "Pompa Air Utama", time: "15:25:44", status: "40%" },
            { title: "Pompa Air Utama", time: "15:21:09", status: "38%" },
            { title: "Pompa Air Utama", time: "15:16:36", status: "35%" },
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
                  <Card key={i} backgroundColor="$blue100" borderRadius="$xl" p="$4" variant="filled">
                    <HStack justifyContent="space-between" alignItems="center">
                      <VStack>
                        <Text fontWeight="$bold">{item.title}</Text>
                        <Text fontSize="$sm">{item.time} WIB</Text>
                      </VStack>

                      <Center>
                        <Text fontSize="$md" fontWeight="$bold" color={item.status === "On" ? "$blue800" : "$red600"}>
                          {item.status}
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

export default HistoryDrum;
