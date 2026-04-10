import React from "react";
import { Stack } from "expo-router";
import { useDrawerStackScreenOptions } from "@/hooks/useDrawerStackScreenOptions";

const ActivitiesLayout = () => {
  const screenOptions = useDrawerStackScreenOptions();
  return (
    <Stack screenOptions={screenOptions}>
      <Stack.Screen name="ActivitiesScreen" options={{ title: "Activities" }} />
    </Stack>
  );
};

export default ActivitiesLayout;
