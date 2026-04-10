import React from "react";
import { Stack } from "expo-router";
import { useDrawerStackScreenOptions } from "@/hooks/useDrawerStackScreenOptions";

const ProfileLayout = () => {
  const screenOptions = useDrawerStackScreenOptions();
  return (
    <Stack screenOptions={screenOptions} initialRouteName="ProfileScreen">
      <Stack.Screen name="ProfileScreen" options={{ title: "Profile" }} />
    </Stack>
  );
};

export default ProfileLayout;
