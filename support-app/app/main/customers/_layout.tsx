import React from "react";
import { Stack } from "expo-router";
import { useDrawerStackScreenOptions } from "@/hooks/useDrawerStackScreenOptions";

const CustomersLayout = () => {
  const screenOptions = useDrawerStackScreenOptions();
  return (
    <Stack screenOptions={screenOptions}>
      <Stack.Screen
        name="CustomersScreen"
        options={{
          title: "Customers",
        }}
      />
      <Stack.Screen
        name="B2CDetailsScreen"
        options={{
          title: "B2C customer",
        }}
      />
      <Stack.Screen
        name="B2CVehiclesScreen"
        options={{
          title: "B2C vehicles",
        }}
      />
      <Stack.Screen
        name="FleetDetailsScreen"
        options={{
          title: "Fleet customer",
        }}
      />
      <Stack.Screen
        name="FleetBranchDetailsScreen"
        options={{
          title: "Fleet branch",
        }}
      />
      <Stack.Screen
        name="FleetBranchVehicleDetailsScreen"
        options={{
          title: "Branch vehicles",
        }}
      />
      <Stack.Screen
        name="PartnerDetailsScreen"
        options={{
          title: "Partner customer",
        }}
      />
      <Stack.Screen
        name="PartnerAllVehiclesScreen"
        options={{
          title: "Partner vehicles",
        }}
      />
      <Stack.Screen
        name="PartnerReferredUsersScreen"
        options={{
          title: "Referred users",
        }}
      />
      <Stack.Screen
        name="PartnerReferredUserVehiclesScreen"
        options={{
          title: "User vehicles",
        }}
      />
      <Stack.Screen
        name="SupportVehicleDetailsScreen"
        options={{
          title: "Vehicle details",
        }}
      />
    </Stack>
  );
};

export default CustomersLayout;
