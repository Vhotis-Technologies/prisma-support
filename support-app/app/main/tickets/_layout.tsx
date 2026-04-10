import React from "react";
import { Stack } from "expo-router";
import { useDrawerStackScreenOptions } from "@/hooks/useDrawerStackScreenOptions";

const TicketsLayout = () => {
  const screenOptions = useDrawerStackScreenOptions();
  return (
    <Stack screenOptions={screenOptions}>
      <Stack.Screen name="TicketScreen" options={{ title: "Tickets" }} />
      <Stack.Screen name="TicketDetailScreen" options={{ title: "Ticket details" }} />
    </Stack>
  );
};

export default TicketsLayout;
