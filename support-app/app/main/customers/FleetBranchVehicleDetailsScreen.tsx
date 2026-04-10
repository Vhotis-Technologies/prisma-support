import React, { useMemo } from "react";
import { ActivityIndicator, FlatList, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { type Href, useLocalSearchParams, useRouter } from "expo-router";
import StyledText from "@/app/components/helpers/StyledText";
import SupportVehicleComponent, {
  supportVehiclesGridColumnWrapper,
  supportVehiclesListContent,
} from "@/app/components/customers/SupportVehicleComponent";
import type { Vehicle } from "@/app/interfaces/CustomerInterface";
import {
  useGetSupportFleetBranchDetailQuery,
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

export default function FleetBranchVehicleDetailsScreen() {
  const router = useRouter();
  const { fleetId, branchId } = useLocalSearchParams<{ fleetId: string; branchId: string }>();
  const fid = typeof fleetId === "string" ? fleetId : "";
  const bid = typeof branchId === "string" ? branchId : "";
  const backgroundColor = useThemeColor({}, "background");
  const muted = useThemeColor({ light: "#757575", dark: "#9E9E9E" }, "text");
  const primary = useThemeColor({}, "primary");
  const { setAlertConfig, setIsVisible } = useAlertContext();

  const { data: branch, isLoading, isError, refetch } = useGetSupportFleetBranchDetailQuery(
    { fleetId: fid, branchId: bid },
    { skip: !fid || !bid }
  );
  const [removeVehicle, { isLoading: removing }] = useRemoveSupportVehicleMutation();

  const vehicles = useMemo(() => branch?.vehicles ?? [], [branch?.vehicles]);

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

  const onDeleteVehicle = (vehicle: Vehicle) => {
    if (!branch) return;
    setAlertConfig({
      isVisible: true,
      title: "Remove vehicle",
      message: `Remove ${vehicle.registration_number} from this branch?`,
      type: "warning",
      confirmLabel: "Remove",
      onClose: () => setIsVisible(false),
      onConfirm: () => {
        void (async () => {
          try {
            await removeVehicle({ vehicleId: vehicle.id, fleetId: fid }).unwrap();
            await refetch();
          } catch (e) {
            showError(getErrMsg(e));
          }
        })();
      },
    });
  };

  if (!fid || !bid) {
    return (
      <View style={[styles.emptyWrap, { backgroundColor }]}>
        <StyledText variant="titleLarge">Vehicle list unavailable</StyledText>
      </View>
    );
  }

  if (isLoading && !branch) {
    return (
      <View style={[styles.emptyWrap, { backgroundColor }]}>
        <ActivityIndicator size="large" color={primary} />
        <StyledText variant="bodyMedium" color={muted}>
          Loading vehicles…
        </StyledText>
      </View>
    );
  }

  if (isError || !branch) {
    return (
      <View style={[styles.emptyWrap, { backgroundColor }]}>
        <Ionicons name="car-outline" size={48} color={muted} />
        <StyledText variant="titleLarge">Vehicle list unavailable</StyledText>
        <StyledText variant="bodyMedium" color={muted}>
          Branch data could not be loaded.
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
        contentContainerStyle={[supportVehiclesListContent, styles.listPad]}
        columnWrapperStyle={supportVehiclesGridColumnWrapper}
        extraData={removing}
        ListHeaderComponent={
          <View style={styles.header}>
            <StyledText variant="titleLarge">Vehicles · {branch.name}</StyledText>
            <StyledText variant="bodySmall" color={muted}>
              {vehicles.length} vehicles currently assigned to this branch.
            </StyledText>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyList}>
            <StyledText variant="titleMedium">No vehicles on this branch</StyledText>
            <StyledText variant="bodySmall" color={muted}>
              Assign vehicles to this branch to manage them here.
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
            onDeletePress={onDeleteVehicle}
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
  listPad: {
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
