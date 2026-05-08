import React from "react";
import { Stack } from "expo-router";
import { useDrawerStackScreenOptions } from "@/hooks/useDrawerStackScreenOptions";

const AccountingLayout = () => {
  const screenOptions = useDrawerStackScreenOptions();
  return (
    <Stack screenOptions={screenOptions}>
      <Stack.Screen
        name="AccountingScreen"
        options={{
          title: "Accounting",
        }}
      />
      <Stack.Screen
        name="AccountingDetailScreen"
        options={{
          title: "Month detail",
        }}
      />
    </Stack>
  );
};

export default AccountingLayout;
