import React from "react";
import { Stack } from "expo-router";
import { useDrawerStackScreenOptions } from "@/hooks/useDrawerStackScreenOptions";

const VoucherLayout = () => {
  const screenOptions = useDrawerStackScreenOptions();
  return (
    <Stack screenOptions={screenOptions} initialRouteName="VoucherScreen">
      <Stack.Screen name="VoucherScreen" options={{ title: "Voucher" }} />
      <Stack.Screen name="VoucherDetailScreen" options={{ title: "Voucher details" }} />
    </Stack>
  );
};

export default VoucherLayout;
