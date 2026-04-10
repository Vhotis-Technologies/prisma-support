import React from "react";
import { ActivityIndicator, ScrollView, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { type Href, useLocalSearchParams, useRouter } from "expo-router";
import StyledText from "@/app/components/helpers/StyledText";
import { useCustomerFlow } from "@/app/app_hooks/useCustomerFlow";
import { useThemeColor } from "@/hooks/useThemeColor";
import { formatCurrency } from "@/app/utils/methods";
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
  const primary = useThemeColor({}, "primary");

  const { customer, isLoading, isError } = useCustomerFlow(customerId, "b2c");

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
});
