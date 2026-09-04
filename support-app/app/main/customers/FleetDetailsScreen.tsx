import React from "react";
import {
  ActivityIndicator,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { type Href, useLocalSearchParams, useRouter } from "expo-router";
import StyledText from "@/app/components/helpers/StyledText";
import { useCustomerFlow } from "@/app/app_hooks/useCustomerFlow";
import { useAlertContext } from "@/app/contexts/AlertContext";
import { useThemeColor } from "@/hooks/useThemeColor";
import { formatCurrency } from "@/app/utils/methods";
import type { FleetSubscription } from "@/app/interfaces/CustomerInterface";
import PersonalDataExportCard from "@/app/components/customers/PersonalDataExportCard";

export default function FleetDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const customerId = typeof id === "string" ? id : "";
  const backgroundColor = useThemeColor({}, "background");
  const cardBg = useThemeColor({}, "cards");
  const borderColor = useThemeColor({}, "borders");
  const iconColor = useThemeColor({}, "icons");
  const muted = useThemeColor({ light: "#757575", dark: "#9E9E9E" }, "text");
  const tint = useThemeColor({}, "tint");
  const success = useThemeColor({}, "success");
  const warning = useThemeColor({}, "warning");
  const error = useThemeColor({}, "error");
  const primary = useThemeColor({}, "primary");

  const { setAlertConfig, setIsVisible } = useAlertContext();
  const {
    customer: fleet,
    isLoading,
    isError,
    terminateSubscription,
    renewSubscription,
    terminateSubscriptionLoading,
    renewSubscriptionLoading,
  } = useCustomerFlow(customerId, "fleets");

  const subscription: FleetSubscription | null = fleet?.subscription ?? null;

  const formatDateTime = (value?: string) => {
    if (!value) return "N/A";
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return "N/A";
    return parsed.toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const subscriptionState = (() => {
    if (!subscription?.subtype || subscription.subtype === "No plan") {
      return { label: "No subscription", color: muted };
    }
    if (subscription.status === "terminated") {
      return { label: "Terminated", color: error };
    }
    if (subscription.status === "expired") {
      return { label: "Expired", color: error };
    }
    if (subscription.status === "pending") {
      return { label: "Pending payment", color: warning };
    }
    if (subscription.status === "past_due") {
      return { label: "Past due", color: warning };
    }
    if (subscription.status === "trialing" || subscription.is_trial) {
      return { label: "Trial active", color: warning };
    }
    return { label: "Active", color: success };
  })();

  const onTerminateSubscription = () => {
    if (!subscription || subscription.status === "terminated") return;
    setAlertConfig({
      isVisible: true,
      title: "Terminate subscription",
      message: `Terminate the ${subscription.subtype} plan (${subscription.billing_type} billing) for ${fleet?.name}?`,
      type: "warning",
      confirmLabel: "Terminate",
      onClose: () => setIsVisible(false),
      onConfirm: () => {
        void terminateSubscription("Support termination");
      },
    });
  };

  const onRenewSubscription = () => {
    if (!subscription) return;
    setAlertConfig({
      isVisible: true,
      title: "Renew subscription",
      message: `Renew ${fleet?.name} for another ${subscription.billing_type} billing period?`,
      type: "warning",
      confirmLabel: "Renew",
      onClose: () => setIsVisible(false),
      onConfirm: () => {
        void renewSubscription();
      },
    });
  };

  if (!customerId) {
    return (
      <View style={[styles.emptyWrap, { backgroundColor }]}>
        <Ionicons name="business-outline" size={48} color={muted} />
        <StyledText variant="titleLarge">Fleet not found</StyledText>
      </View>
    );
  }

  if (isLoading && !fleet) {
    return (
      <View style={[styles.emptyWrap, { backgroundColor }]}>
        <ActivityIndicator size="large" color={primary} />
        <StyledText variant="bodyMedium" color={muted}>
          Loading fleet…
        </StyledText>
      </View>
    );
  }

  if (isError || !fleet) {
    return (
      <View style={[styles.emptyWrap, { backgroundColor }]}>
        <Ionicons name="business-outline" size={48} color={muted} />
        <StyledText variant="titleLarge">Fleet not found</StyledText>
        <StyledText variant="bodyMedium" color={muted}>
          This fleet may have been removed or the link is invalid.
        </StyledText>
      </View>
    );
  }

  const subBusy = terminateSubscriptionLoading || renewSubscriptionLoading;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
        <StyledText variant="headlineSmall" style={styles.title}>
          {fleet.name}
        </StyledText>
        <StyledText variant="bodyMedium" color={muted}>
          Owner: {fleet.fleet_owner}
        </StyledText>
        <StyledText variant="bodySmall" color={muted}>
          Referral code: {fleet.referral_code}
        </StyledText>
        <View style={styles.metaRow}>
          <View style={styles.meta}>
            <StyledText variant="labelSmall" color={muted}>
              Total spend
            </StyledText>
            <StyledText variant="titleSmall">
              {formatCurrency(fleet.total_spend)}
            </StyledText>
          </View>
          <View style={styles.meta}>
            <StyledText variant="labelSmall" color={muted}>
              Bookings
            </StyledText>
            <StyledText variant="titleSmall">{fleet.total_bookings}</StyledText>
          </View>
        </View>
      </View>

      <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
        <StyledText variant="titleMedium">Overview</StyledText>
        <StyledText variant="bodySmall" color={muted}>
          Branches: {fleet.no_of_branches}
        </StyledText>
        <StyledText variant="bodySmall" color={muted}>
          Vehicles: {fleet.total_vehicles}
        </StyledText>
        <StyledText variant="bodySmall" color={primary}>
          Email:
          <StyledText
            variant="bodySmall"
            color={primary}
            onPress={() => Linking.openURL(`mailto:${fleet.contact.email}`)}
          >
            {fleet.contact.email}
          </StyledText>
        </StyledText>
        <StyledText
          variant="bodySmall"
          color={primary}
          onPress={() => Linking.openURL(`tel:${fleet.contact.phone}`)}
        >
          Phone:
          <StyledText
            variant="bodySmall"
            color={primary}
            onPress={() => Linking.openURL(`tel:${fleet.contact.phone}`)}
          >
            {fleet.contact.phone}
          </StyledText>
        </StyledText>
      </View>

      <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
        <View style={styles.subscriptionHeader}>
          <StyledText variant="titleMedium">Subscription</StyledText>
          <View
            style={[
              styles.subscriptionPill,
              {
                borderColor: subscriptionState.color,
                backgroundColor: `${subscriptionState.color}18`,
              },
            ]}
          >
            <StyledText
              variant="labelSmall"
              style={{
                color: subscriptionState.color,
                fontFamily: "BarlowMedium",
              }}
            >
              {subscriptionState.label}
            </StyledText>
          </View>
        </View>

        <StyledText variant="bodySmall" color={muted}>
          Plan: {subscription?.subtype?.trim() ? subscription.subtype : "N/A"}
        </StyledText>
        <StyledText variant="bodySmall" color={muted}>
          Billing: {subscription?.billing_type ?? "N/A"}
        </StyledText>
        <StyledText variant="bodySmall" color={muted}>
          Started: {formatDateTime(subscription?.started_at)}
        </StyledText>
        <StyledText variant="bodySmall" color={muted}>
          Trial: {subscription?.is_trial ? "Yes" : "No"}
        </StyledText>
        {subscription?.is_trial && subscription.trial_ends_at ? (
          <StyledText variant="bodySmall" color={muted}>
            Trial ends: {formatDateTime(subscription.trial_ends_at)}
          </StyledText>
        ) : null}
        <StyledText variant="bodySmall" color={muted}>
          {subscription?.is_trial ? "Current period ends" : "Renews / period ends"}:{" "}
          {formatDateTime(subscription?.ends_at)}
        </StyledText>
        <StyledText variant="bodySmall" color={muted}>
          Last paid: {subscription?.last_paid_at ? formatDateTime(subscription.last_paid_at) : "Never"}
        </StyledText>
        {subscription?.terminated_at ? (
          <StyledText variant="bodySmall" color={muted}>
            Terminated: {formatDateTime(subscription.terminated_at)}
          </StyledText>
        ) : null}

        <View style={styles.subscriptionActions}>
          <Pressable
            onPress={onTerminateSubscription}
            disabled={
              subBusy ||
              !subscription ||
              subscription.status === "terminated" ||
              subscription.subtype === "No plan"
            }
            style={({ pressed }) => [
              styles.subscriptionActionBtn,
              {
                borderColor: error,
                opacity:
                  subBusy ||
                  !subscription ||
                  subscription.status === "terminated" ||
                  subscription.subtype === "No plan"
                    ? 0.5
                    : pressed
                      ? 0.84
                      : 1,
              },
            ]}
          >
            <Ionicons name="close-circle-outline" size={16} color={error} />
            <StyledText
              variant="labelSmall"
              style={{ color: error, fontFamily: "BarlowMedium" }}
            >
              Terminate subscription
            </StyledText>
          </Pressable>

          <Pressable
            onPress={onRenewSubscription}
            disabled={
              subBusy || !subscription || subscription.subtype === "No plan"
            }
            style={({ pressed }) => [
              styles.subscriptionActionBtn,
              {
                borderColor: tint,
                opacity:
                  subBusy || !subscription || subscription.subtype === "No plan"
                    ? 0.5
                    : pressed
                      ? 0.84
                      : 1,
              },
            ]}
          >
            <Ionicons name="refresh-outline" size={16} color={tint} />
            <StyledText
              variant="labelSmall"
              style={{ color: tint, fontFamily: "BarlowMedium" }}
            >
              Renew subscription
            </StyledText>
          </Pressable>
        </View>
      </View>

      <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
        <StyledText variant="titleMedium">Branches</StyledText>
        {fleet.branches.map((branch) => (
          <Pressable
            key={branch.id}
            onPress={() =>
              router.push({
                pathname: "/main/customers/FleetBranchDetailsScreen",
                params: { fleetId: fleet.id, branchId: branch.id },
              } as Href)
            }
            style={({ pressed }) => [
              styles.rowCard,
              { borderColor: `${borderColor}99`, opacity: pressed ? 0.92 : 1 },
            ]}
          >
            <View style={styles.branchTopRow}>
              <StyledText
                variant="bodyLarge"
                style={{ fontFamily: "BarlowMedium" }}
              >
                {branch.name}
              </StyledText>
              <Ionicons
                name="chevron-forward-outline"
                size={18}
                color={iconColor}
              />
            </View>
            <StyledText variant="bodySmall" color={muted}>
              {branch.city || "N/A"} · Vehicles {branch.vehicle_count} ·
              Bookings {branch.booking_count} · Admins {branch.admin_count}
            </StyledText>
            <StyledText variant="labelSmall" style={{ color: tint }}>
              Tap to open branch details
            </StyledText>
          </Pressable>
        ))}
      </View>

      <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
        <StyledText variant="titleMedium">Admins</StyledText>
        {fleet.admins.map((admin) => (
          <View key={admin.id} style={styles.row}>
            <Ionicons name="person-circle-outline" size={18} color={tint} />
            <StyledText variant="bodySmall" color={muted}>
              {admin.name} · {admin.branch_name}
            </StyledText>
          </View>
        ))}
        <View style={styles.row}>
          <Ionicons name="mail-outline" size={16} color={iconColor} />
          <StyledText variant="bodySmall" color={muted}>
            {fleet.contact.email}
          </StyledText>
        </View>
      </View>

      <PersonalDataExportCard
        entityType="fleet"
        entityId={fleet.id}
        defaultEmail={fleet.contact.email}
      />
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
    paddingTop: 8,
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
  metaRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  meta: {
    flex: 1,
    gap: 2,
  },
  subscriptionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  subscriptionPill: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  subscriptionActions: {
    marginTop: 8,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  subscriptionActionBtn: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  rowCard: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    gap: 4,
  },
  branchTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  emptyWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 16,
  },
});
