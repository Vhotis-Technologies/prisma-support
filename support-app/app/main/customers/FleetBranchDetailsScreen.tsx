import React from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { type Href, useLocalSearchParams, useRouter } from "expo-router";
import StyledText from "@/app/components/helpers/StyledText";
import {
  useGetSupportFleetBranchDetailQuery,
  useRemoveSupportBranchMutation,
} from "@/app/store/api/customerApi";
import { useThemeColor } from "@/hooks/useThemeColor";
import { formatCurrency } from "@/app/utils/methods";
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

export default function FleetBranchDetailsScreen() {
  const router = useRouter();
  const { fleetId, branchId } = useLocalSearchParams<{
    fleetId: string;
    branchId: string;
  }>();
  const fid = typeof fleetId === "string" ? fleetId : "";
  const bid = typeof branchId === "string" ? branchId : "";
  const backgroundColor = useThemeColor({}, "background");
  const cardBg = useThemeColor({}, "cards");
  const borderColor = useThemeColor({}, "borders");
  const iconColor = useThemeColor({}, "icons");
  const muted = useThemeColor({ light: "#757575", dark: "#9E9E9E" }, "text");
  const tint = useThemeColor({}, "tint");
  const button = useThemeColor({}, "button");
  const error = useThemeColor({}, "error");
  const primary = useThemeColor({}, "primary");
  const { setAlertConfig, setIsVisible } = useAlertContext();

  const { data: branch, isLoading, isError, refetch } = useGetSupportFleetBranchDetailQuery(
    { fleetId: fid, branchId: bid },
    { skip: !fid || !bid }
  );
  const [removeBranch, { isLoading: removing }] = useRemoveSupportBranchMutation();

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

  const onRemoveBranch = () => {
    if (!branch) return;
    setAlertConfig({
      isVisible: true,
      title: "Remove branch",
      message: `Remove branch "${branch.name}" from this fleet? This cannot be undone if the branch has no vehicles.`,
      type: "warning",
      confirmLabel: "Remove branch",
      onClose: () => setIsVisible(false),
      onConfirm: () => {
        void (async () => {
          try {
            await removeBranch({ fleetId: fid, branchId: bid }).unwrap();
            router.back();
          } catch (e) {
            showError(getErrMsg(e));
            await refetch();
          }
        })();
      },
    });
  };

  if (!fid || !bid) {
    return (
      <View style={[styles.emptyWrap, { backgroundColor }]}>
        <StyledText variant="titleLarge">Branch not found</StyledText>
      </View>
    );
  }

  if (isLoading && !branch) {
    return (
      <View style={[styles.emptyWrap, { backgroundColor }]}>
        <ActivityIndicator size="large" color={primary} />
        <StyledText variant="bodyMedium" color={muted}>
          Loading branch…
        </StyledText>
      </View>
    );
  }

  if (isError || !branch) {
    return (
      <View style={[styles.emptyWrap, { backgroundColor }]}>
        <Ionicons name="business-outline" size={48} color={muted} />
        <StyledText variant="titleLarge">Branch not found</StyledText>
        <StyledText variant="bodyMedium" color={muted}>
          This branch may have been removed or the link is invalid.
        </StyledText>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
        <StyledText variant="headlineSmall" style={styles.title}>
          {branch.manager_name}
        </StyledText>
        <StyledText variant="bodyMedium" color={muted}>
          Branch admin · {branch.name}
        </StyledText>
        <View style={styles.row}>
          <Ionicons name="mail-outline" size={16} color={iconColor} />
          <StyledText variant="bodySmall" color={muted}>
            {branch.manager_email}
          </StyledText>
        </View>
        <View style={styles.row}>
          <Ionicons name="call-outline" size={16} color={iconColor} />
          <StyledText variant="bodySmall" color={muted}>
            {branch.manager_phone}
          </StyledText>
        </View>
      </View>

      <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
        <StyledText variant="titleMedium">Branch overview</StyledText>
        <StyledText variant="bodySmall" color={muted}>
          Address: {branch.address.address}, {branch.address.city}, {branch.address.postcode}
        </StyledText>
        <StyledText variant="bodySmall" color={muted}>
          Vehicles: {branch.vehicle_count} · Bookings: {branch.booking_count} · Admins:{" "}
          {branch.admin_count}
        </StyledText>
        <StyledText variant="bodySmall" color={muted}>
          Monthly spend: {formatCurrency(branch.spent_this_month)} / {formatCurrency(branch.spend_limit)}
        </StyledText>
        <StyledText variant="bodySmall" color={muted}>
          Avg booking value: {formatCurrency(branch.average_booking_value)}
        </StyledText>
        <StyledText variant="bodySmall" style={{ color: tint }}>
          Completion rate: {(branch.completion_rate * 100).toFixed(1)}%
        </StyledText>
      </View>

      <Pressable
        onPress={() =>
          router.push({
            pathname: "/main/customers/FleetBranchVehicleDetailsScreen",
            params: { fleetId: branch.fleet_id, branchId: branch.id },
          } as Href)
        }
        style={({ pressed }) => [
          styles.actionButton,
          { backgroundColor: button, opacity: pressed ? 0.9 : 1 },
        ]}
      >
        <Ionicons name="car-sport-outline" size={18} color="#fff" />
        <StyledText variant="labelLarge" style={styles.actionText}>
          View vehicles
        </StyledText>
      </Pressable>

      <Pressable
        onPress={onRemoveBranch}
        disabled={removing || branch.vehicle_count > 0}
        style={({ pressed }) => [
          styles.removeBranchBtn,
          {
            borderColor: error,
            opacity: removing || branch.vehicle_count > 0 ? 0.5 : pressed ? 0.85 : 1,
          },
        ]}
      >
        <Ionicons name="trash-outline" size={18} color={error} />
        <StyledText variant="labelLarge" style={{ color: error, fontFamily: "BarlowMedium" }}>
          Remove branch{branch.vehicle_count > 0 ? " (clear vehicles first)" : ""}
        </StyledText>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 8,
    gap: 12,
    paddingBottom: 12,
  },
  card: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    gap: 8,
  },
  title: {
    fontFamily: "BarlowMedium",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  actionButton: {
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  actionText: {
    color: "#fff",
    fontFamily: "BarlowMedium",
  },
  removeBranchBtn: {
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
  },
  emptyWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 16,
  },
});
