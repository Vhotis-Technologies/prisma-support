import React from "react";
import {
  ActivityIndicator,
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
import StyledButton from "@/app/components/helpers/StyledButton";

export default function B2CDetailsScreen() {
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
    customer,
    isLoading,
    isError,
    terminateSubscription,
    renewSubscription,
    terminateSubscriptionLoading,
    renewSubscriptionLoading,
  } = useCustomerFlow(customerId, "b2c");

  const subscription: FleetSubscription | null = customer?.subscription ?? null;

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
    if (subscription.is_trial) {
      return { label: "Trial active", color: warning };
    }
    return { label: "Active", color: success };
  })();

  const onTerminateSubscription = () => {
    if (!subscription || subscription.status === "terminated") return;
    setAlertConfig({
      isVisible: true,
      title: "Terminate subscription",
      message: `Terminate the ${subscription.subtype} plan (${subscription.billing_type} billing) for ${customer?.name}?`,
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
      message: `Renew ${customer?.name} consumer subscription for another ${subscription.billing_type} billing period?`,
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
        <Ionicons name="person-outline" size={48} color={muted} />
        <StyledText variant="titleLarge">Customer not found</StyledText>
      </View>
    );
  }

  if (isLoading && !customer) {
    return (
      <View style={[styles.emptyWrap, { backgroundColor }]}>
        <ActivityIndicator size="large" color={primary} />
        <StyledText variant="bodyMedium" color={muted}>
          Loading customer…
        </StyledText>
      </View>
    );
  }

  if (isError || !customer) {
    return (
      <View style={[styles.emptyWrap, { backgroundColor }]}>
        <Ionicons name="person-outline" size={48} color={muted} />
        <StyledText variant="titleLarge">Customer not found</StyledText>
        <StyledText variant="bodyMedium" color={muted}>
          This customer may have been removed or the link is invalid.
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
        <StyledText variant="headlineSmall" style={styles.name}>
          {customer.name}
        </StyledText>
        <StyledText variant="bodyMedium" color={muted}>
          Tier: {customer.loyalty_tier}
        </StyledText>
        <View style={styles.metaRow}>
          <View style={styles.meta}>
            <StyledText variant="labelSmall" color={muted}>
              Total spend
            </StyledText>
            <StyledText variant="titleMedium">{formatCurrency(customer.total_spend)}</StyledText>
          </View>
          <View style={styles.meta}>
            <StyledText variant="labelSmall" color={muted}>
              Total bookings
            </StyledText>
            <StyledText variant="titleMedium">{customer.total_bookings}</StyledText>
          </View>
        </View>
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
          Subscription ends: {formatDateTime(subscription?.ends_at)}
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
            disabled={subBusy || !subscription || subscription.subtype === "No plan"}
            style={({ pressed }) => [
              styles.subscriptionActionBtn,
              {
                borderColor: tint,
                opacity:
                  subBusy || !subscription || subscription.subtype === "No plan" ? 0.5 : pressed ? 0.84 : 1,
              },
            ]}
          >
            <Ionicons name="refresh-outline" size={16} color={tint} />
            <StyledText variant="labelSmall" style={{ color: tint, fontFamily: "BarlowMedium" }}>
              Renew subscription
            </StyledText>
          </Pressable>
        </View>
      </View>

      <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
        <StyledText variant="titleMedium">Contact</StyledText>
        <View style={styles.row}>
          <Ionicons name="mail-outline" size={16} color={iconColor} />
          <StyledText variant="bodyMedium" color={muted}>
            {customer.contact.email}
          </StyledText>
        </View>
        <View style={styles.row}>
          <Ionicons name="call-outline" size={16} color={iconColor} />
          <StyledText variant="bodyMedium" color={muted}>
            {customer.contact.phone}
          </StyledText>
        </View>
      </View>

      <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
        <StyledText variant="titleMedium">Account details</StyledText>
        <StyledText variant="bodySmall" color={muted}>
          Address: {customer.address.address}, {customer.address.city}, {customer.address.postcode},{" "}
          {customer.address.country}
        </StyledText>
        <StyledText variant="bodySmall" color={muted}>
          Vehicles: {customer.no_of_vehicles}
        </StyledText>
        <StyledText variant="bodySmall" color={muted}>
          Last booking: {customer.last_booking_date}
        </StyledText>
        <StyledText variant="bodySmall" color={muted}>
          Avg booking value: {formatCurrency(customer.average_booking_value)}
        </StyledText>
        <StyledText variant="bodySmall" color={muted}>
          Completed: {customer.completed_bookings} · Cancelled: {customer.cancelled_bookings}
        </StyledText>
        <StyledText variant="bodySmall" style={{ color: tint }}>
          Preferred: {customer.preferred_services?.length ? customer.preferred_services.join(", ") : "—"}
        </StyledText>
        {customer.notes ? (
          <StyledText variant="bodySmall" color={muted}>
            Notes: {customer.notes}
          </StyledText>
        ) : null}
      </View>

      <StyledButton
        title="View vehicles"
        icon={<Ionicons name="car-sport-outline" size={18} color="#fff" />}
        onPress={() =>
          router.push({
            pathname: "/main/customers/B2CVehiclesScreen",
            params: { id: customer.id },
          } as Href)
        }
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
    gap: 10,
  },
  card: {
    borderWidth: 1,
    borderRadius: 5,
    padding: 14,
    gap: 8,
  },
  name: {
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
