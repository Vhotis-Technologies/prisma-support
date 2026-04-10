import React, { useMemo } from "react";
import { ActivityIndicator, FlatList, StyleSheet, View } from "react-native";
import { type Href, useLocalSearchParams, useRouter } from "expo-router";
import StyledText from "@/app/components/helpers/StyledText";
import SupportVehicleComponent, {
  supportVehiclesGridColumnWrapper,
  supportVehiclesListContent,
} from "@/app/components/customers/SupportVehicleComponent";
import type { Vehicle } from "@/app/interfaces/CustomerInterface";
import {
  useGetSupportB2cCustomerDetailQuery,
  useRemoveSupportVehicleMutation,
} from "@/app/store/api/customerApi";
import { useThemeColor } from "@/hooks/useThemeColor";
import { useAlertContext } from "@/app/contexts/AlertContext";

function getErrMsg(e: unknown): string {
  if (e && typeof e === "object") {
    const x = e as { data?: unknown };
    const d = x.data;
    if (typeof d === "string" && d.trim()) return d;
    if (d && typeof d === "object") {
      const o = d as { error?: string };
      if (o.error && typeof o.error === "string") return o.error;
    }
  }
  return "Something went wrong";
}

export default function B2CVehiclesScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const userId = typeof id === "string" ? id : "";
  const backgroundColor = useThemeColor({}, "background");
  const muted = useThemeColor({ light: "#757575", dark: "#9E9E9E" }, "text");
  const primary = useThemeColor({}, "primary");
  const { setAlertConfig, setIsVisible } = useAlertContext();

  const { data: customer, isLoading, refetch } = useGetSupportB2cCustomerDetailQuery(userId, {
    skip: !userId,
  });
  const [removeVehicle, { isLoading: removing }] = useRemoveSupportVehicleMutation();

  const vehicles = useMemo(() => customer?.vehicles ?? [], [customer?.vehicles]);

  const showError = (message: string) => {
    setAlertConfig({
      isVisible: true,
      title: "Error",
      message,
      type: "error",
      confirmLabel: "OK",
      onConfirm: () => setIsVisible(false),
    });
  };

  const onRemoveVehicle = (vehicle: Vehicle) => {
    if (!customer) return;
    setAlertConfig({
      isVisible: true,
      title: "Remove vehicle",
      message: `Remove ${vehicle.registration_number} from ${customer.name}'s profile?`,
      type: "warning",
      confirmLabel: "Remove",
      onClose: () => setIsVisible(false),
      onConfirm: () => {
        void (async () => {
          try {
            await removeVehicle({ vehicleId: vehicle.id, userId }).unwrap();
            await refetch();
          } catch (e) {
            showError(getErrMsg(e));
          }
        })();
      },
    });
  };

  if (!userId) {
    return (
      <View style={[styles.emptyWrap, { backgroundColor }]}>
        <StyledText variant="titleLarge">Customer not found</StyledText>
      </View>
    );
  }

  if (isLoading && !customer) {
    return (
      <View style={[styles.emptyWrap, { backgroundColor }]}>
        <ActivityIndicator size="large" color={primary} />
        <StyledText variant="bodyMedium" color={muted}>
          Loading vehicles…
        </StyledText>
      </View>
    );
  }

  if (!customer) {
    return (
      <View style={[styles.emptyWrap, { backgroundColor }]}>
        <StyledText variant="titleLarge">Customer not found</StyledText>
        <StyledText variant="bodyMedium" color={muted}>
          Unable to load vehicle list.
        </StyledText>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <FlatList
        data={vehicles}
        numColumns={2}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[supportVehiclesListContent, styles.content]}
        columnWrapperStyle={supportVehiclesGridColumnWrapper}
        extraData={removing}
        ListHeaderComponent={
          <View style={styles.header}>
            <StyledText variant="titleLarge">{customer.name}</StyledText>
            <StyledText variant="bodySmall" color={muted}>
              {vehicles.length} vehicle{vehicles.length === 1 ? "" : "s"} on this account.
            </StyledText>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyList}>
            <StyledText variant="titleMedium">No vehicles on file</StyledText>
            <StyledText variant="bodySmall" color={muted}>
              Vehicles linked to this customer will appear here.
            </StyledText>
          </View>
        }
        renderItem={({ item }) => (
          <SupportVehicleComponent
            vehicle={item}
            onCardPress={() =>
              router.push({
                pathname: "/main/customers/SupportVehicleDetailsScreen",
                params: { vehicleId: item.id },
              } as Href)
            }
            onDeletePress={onRemoveVehicle}
            deleteDisabled={removing}
          />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 5,
    paddingTop: 8,
  },
  header: {
    marginBottom: 8,
    gap: 3,
  },
  emptyWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 16,
  },
  emptyList: {
    alignItems: "center",
    paddingVertical: 48,
    gap: 8,
  },
});
