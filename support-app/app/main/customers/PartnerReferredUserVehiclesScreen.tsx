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
  useGetSupportPartnerReferredUsersQuery,
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

export default function PartnerReferredUserVehiclesScreen() {
  const router = useRouter();
  const { partnerId, userId } = useLocalSearchParams<{ partnerId: string; userId: string }>();
  const pid = typeof partnerId === "string" ? partnerId : "";
  const uid = typeof userId === "string" ? userId : "";
  const backgroundColor = useThemeColor({}, "background");
  const muted = useThemeColor({ light: "#757575", dark: "#9E9E9E" }, "text");
  const primary = useThemeColor({}, "primary");
  const { setAlertConfig, setIsVisible } = useAlertContext();

  const { data: referredUsers = [], isLoading, refetch } = useGetSupportPartnerReferredUsersQuery(pid, {
    skip: !pid,
  });
  const [removeVehicle, { isLoading: removing }] = useRemoveSupportVehicleMutation();

  const user = useMemo(() => referredUsers.find((u) => u.id === uid), [referredUsers, uid]);
  const vehicles = useMemo(() => user?.vehicles ?? [], [user?.vehicles]);

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
    if (!user) return;
    setAlertConfig({
      isVisible: true,
      title: "Remove vehicle",
      message: `Remove ${vehicle.registration_number} from ${user.name}'s profile?`,
      type: "warning",
      confirmLabel: "Remove",
      onClose: () => setIsVisible(false),
      onConfirm: () => {
        void (async () => {
          try {
            await removeVehicle({ vehicleId: vehicle.id, userId: uid }).unwrap();
            await refetch();
          } catch (e) {
            showError(getErrMsg(e));
          }
        })();
      },
    });
  };

  if (!pid || !uid) {
    return (
      <View style={[styles.emptyWrap, { backgroundColor }]}>
        <StyledText variant="titleLarge">Referred user not found</StyledText>
      </View>
    );
  }

  if (isLoading && !user) {
    return (
      <View style={[styles.emptyWrap, { backgroundColor }]}>
        <ActivityIndicator size="large" color={primary} />
        <StyledText variant="bodyMedium" color={muted}>
          Loading vehicles…
        </StyledText>
      </View>
    );
  }

  if (!user) {
    return (
      <View style={[styles.emptyWrap, { backgroundColor }]}>
        <StyledText variant="titleLarge">Referred user not found</StyledText>
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
            <StyledText variant="titleLarge">{user.name}</StyledText>
            <StyledText variant="bodySmall" color={muted}>
              {vehicles.length} vehicles linked to this referred user.
            </StyledText>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyList}>
            <StyledText variant="titleMedium">No vehicles available</StyledText>
            <StyledText variant="bodySmall" color={muted}>
              This referred user currently has no vehicles attached.
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
    gap: 4,
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
