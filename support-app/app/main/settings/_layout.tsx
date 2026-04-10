import React from "react";
import { Stack } from "expo-router";
import { useDrawerStackScreenOptions } from "@/hooks/useDrawerStackScreenOptions";

const SettingsLayout = () => {
  const screenOptions = useDrawerStackScreenOptions();
  return (
    <Stack screenOptions={screenOptions} initialRouteName="SettingsScreen">
      <Stack.Screen name="SettingsScreen" options={{ title: "Settings" }} />
    </Stack>
  );
};

export default SettingsLayout;
