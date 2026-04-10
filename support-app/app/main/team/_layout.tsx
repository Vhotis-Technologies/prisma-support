import React from "react";
import { Stack } from "expo-router";
import { useDrawerStackScreenOptions } from "@/hooks/useDrawerStackScreenOptions";

const TeamStackLayout = () => {
  const screenOptions = useDrawerStackScreenOptions();
  return (
    <Stack screenOptions={screenOptions}>
      <Stack.Screen name="CrewScreen" options={{ title: "Prisma Crew" }} />
      <Stack.Screen name="CrewDetailScreen" options={{ title: "Crew member" }} />
    </Stack>
  );
};

export default TeamStackLayout;
