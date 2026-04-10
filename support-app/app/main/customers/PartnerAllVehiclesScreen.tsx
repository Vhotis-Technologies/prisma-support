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
  useGetSupportPartnerCustomerDetailQuery,
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

export default function PartnerAllVehiclesScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const partnerId = typeof id === "string" ? id : "";
  const backgroundColor = useThemeColor({}, "background");
  const muted = useThemeColor({ light: "#757575", dark: "#9E9E9E" }, "text");
  const primary = useThemeColor({}, "primary");
  const { setAlertConfig, setIsVisible } = useAlertContext();

  const {
    data: partner,
    isLoading: partnerLoading,
    refetch,
  } = useGetSupportPartnerCustomerDetailQuery(partnerId, { skip: !partnerId });
  const [removeVehicle, { isLoading: removing }] = useRemoveSupportVehicleMutation();

  const vehicles = useMemo(() => partner?.vehicles ?? [], [partner?.vehicles]);
  const partnerUserId = partner?.user_id;

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

  const onRemove = (vehicle: Vehicle) => {
    if (!partnerUserId) {
      showError("Partner account is missing; cannot remove vehicle.");
      return;
    }
    setAlertConfig({
      isVisible: true,
      title: "Remove vehicle",
      message: `Remove ${vehicle.registration_number} from ${partner?.business_name ?? "this partner"}'s profile?`,
      type: "warning",
      confirmLabel: "Remove",
      onClose: () => setIsVisible(false),
      onConfirm: () => {
        void (async () => {
          try {
            await removeVehicle({
              vehicleId: vehicle.id,
              userId: partnerUserId,
              partnerId,
            }).unwrap();
            await refetch();
          } catch (e) {
            showError(getErrMsg(e));
          }
        })();
      },
    });
  };

  if (!partnerId) {
    return (
      <View style={[styles.emptyWrap, { backgroundColor }]}>
        <StyledText variant="titleLarge">Partner not found</StyledText>
      </View>
    );
  }

  if (partnerLoading && !partner) {
    return (
      <View style={[styles.emptyWrap, { backgroundColor }]}>
        <ActivityIndicator size="large" color={primary} />
        <StyledText variant="bodyMedium" color={muted}>
          Loading vehicles…
        </StyledText>
      </View>
    );
  }

  if (!partner) {
    return (
      <View style={[styles.emptyWrap, { backgroundColor }]}>
        <StyledText variant="titleLarge">Partner not found</StyledText>
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
            <StyledText variant="titleLarge">Partner vehicles</StyledText>
            <StyledText variant="bodySmall" color={muted}>
              {partner.business_name} · {vehicles.length}{" "}
              {vehicles.length === 1 ? "vehicle" : "vehicles"} on this partner account.
            </StyledText>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyList}>
            <StyledText variant="titleMedium">No vehicles on partner account</StyledText>
            <StyledText variant="bodySmall" color={muted}>
              Referred users&apos; vehicles are listed under each referred user.
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
            onDeletePress={onRemove}
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
