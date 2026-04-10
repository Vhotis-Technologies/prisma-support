import React from "react";
import { Stack } from "expo-router";
import { useDrawerStackScreenOptions } from "@/hooks/useDrawerStackScreenOptions";

const BookingsLayout = () => {
  const screenOptions = useDrawerStackScreenOptions();
  return (
    <Stack screenOptions={screenOptions}>
      <Stack.Screen name="BookingScreen" options={{ title: "Bookings" }} />
      <Stack.Screen name="BookingDetailsScreen" options={{ title: "Booking details" }} />
      <Stack.Screen name="BulkOrderDetailsScreen" options={{ title: "Fleet bulk order" }} />
    </Stack>
  );
};

export default BookingsLayout;
