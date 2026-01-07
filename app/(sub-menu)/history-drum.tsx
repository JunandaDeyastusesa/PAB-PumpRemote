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
            date: "12 Jan 2025",
            data: [
              { title: "Pompa Air Inoto A", time: "13:00:10", status: "On" },
              { title: "Pompa Air Inoto B", time: "13:00:00", status: "On" },
              { title: "Pompa Air Inoto C", time: "12:50:50", status: "On" },
              { title: "Pompa Air Inoto B", time: "15:50:40", status: "Off" },
            ],
          },
          {
            date: "11 Jan 2025",
            data: [
              { title: "Pompa Air Inoto B", time: "13:00:00", status: "On" },
              { title: "Pompa Air Inoto A", time: "12:50:50", status: "On" },
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
