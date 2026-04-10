import React from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { type Href, useLocalSearchParams, useRouter } from "expo-router";
import StyledButton from "@/app/components/helpers/StyledButton";
import StyledText from "@/app/components/helpers/StyledText";
import { useCustomerFlow } from "@/app/app_hooks/useCustomerFlow";
import { useGetSupportPartnerReferredUsersQuery } from "@/app/store/api/customerApi";
import { useThemeColor } from "@/hooks/useThemeColor";
import { formatCurrency } from "@/app/utils/methods";

export default function PartnerDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const customerId = typeof id === "string" ? id : "";
  const backgroundColor = useThemeColor({}, "background");
  const cardBg = useThemeColor({}, "cards");
  const borderColor = useThemeColor({}, "borders");
  const iconColor = useThemeColor({}, "icons");
  const muted = useThemeColor({ light: "#757575", dark: "#9E9E9E" }, "text");
  const tint = useThemeColor({}, "tint");
  const button = useThemeColor({}, "button");
  const primary = useThemeColor({}, "primary");

  const { customer: partner, isLoading, isError } = useCustomerFlow(customerId, "partners");
  const { data: referredUsers = [] } = useGetSupportPartnerReferredUsersQuery(customerId, {
    skip: !customerId,
  });

  if (!customerId) {
    return (
      <View style={[styles.emptyWrap, { backgroundColor }]}>
        <Ionicons name="briefcase-outline" size={48} color={muted} />
        <StyledText variant="titleLarge">Partner not found</StyledText>
      </View>
    );
  }

  if (isLoading && !partner) {
    return (
      <View style={[styles.emptyWrap, { backgroundColor }]}>
        <ActivityIndicator size="large" color={primary} />
        <StyledText variant="bodyMedium" color={muted}>
          Loading partner…
        </StyledText>
      </View>
    );
  }

  if (isError || !partner) {
    return (
      <View style={[styles.emptyWrap, { backgroundColor }]}>
        <Ionicons name="briefcase-outline" size={48} color={muted} />
        <StyledText variant="titleLarge">Partner not found</StyledText>
        <StyledText variant="bodyMedium" color={muted}>
          This partner may have been removed or the link is invalid.
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
          {partner.business_name}
        </StyledText>
        <StyledText variant="bodyMedium" color={muted}>
          Referral code: {partner.referral_code}
        </StyledText>
        <StyledText variant="bodySmall" color={muted}>
          Contact: {partner.contact.email} · {partner.contact.phone}
        </StyledText>
      </View>

      <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
        <StyledText variant="titleMedium">Referral metrics</StyledText>
        <StyledText variant="bodySmall" color={muted}>
          Total referred: {partner.total_referred}
        </StyledText>
        <StyledText variant="bodySmall" color={muted}>
          Active referred: {partner.active_referred}
        </StyledText>
        <StyledText variant="bodySmall" color={muted}>
          Churned: {partner.churned_referred}
        </StyledText>
        <StyledText variant="bodySmall" style={{ color: tint }}>
          Conversion: {(partner.conversion_rate * 100).toFixed(1)}%
        </StyledText>
        <StyledText variant="bodySmall" color={muted}>
          Vehicles registered: {partner.vehicles_registered}
        </StyledText>
        <StyledText variant="bodySmall" color={muted}>
          Referred users in support records: {referredUsers.length}
        </StyledText>
        <StyledButton
          title="Referred users"
          variant="tonal"
          onPress={() =>
            router.push({
              pathname: "/main/customers/PartnerReferredUsersScreen",
              params: { id: partner.id },
            } as Href)
          }
          style={styles.referredButton}
          icon={<Ionicons name="people-outline" size={16} color={tint} />}
        />
        <Pressable
          onPress={() =>
            router.push({
              pathname: "/main/customers/PartnerAllVehiclesScreen",
              params: { id: partner.id },
            } as Href)
          }
          style={({ pressed }) => [
            styles.vehicleButton,
            { backgroundColor: button, opacity: pressed ? 0.9 : 1 },
          ]}
        >
          <Ionicons name="car-sport-outline" size={18} color="#fff" />
          <StyledText variant="labelLarge" style={styles.vehicleButtonText}>
            View all vehicles
          </StyledText>
        </Pressable>
      </View>

      <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
        <StyledText variant="titleMedium">Activity and revenue</StyledText>
        <StyledText variant="bodySmall" color={muted}>
          Total spend: {formatCurrency(partner.total_spend)}
        </StyledText>
        <StyledText variant="bodySmall" color={muted}>
          Total bookings: {partner.total_bookings}
        </StyledText>
        <StyledText variant="bodySmall" color={muted}>
          Completed: {partner.completed_bookings} · Cancelled: {partner.cancelled_bookings}
        </StyledText>
        <StyledText variant="bodySmall" color={muted}>
          Revenue total: {formatCurrency(partner.revenue_total)}
        </StyledText>
        <StyledText variant="bodySmall" color={muted}>
          Revenue this month: {formatCurrency(partner.revenue_this_month)}
        </StyledText>
      </View>

      <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
        <StyledText variant="titleMedium">Commissions</StyledText>
        <View style={styles.row}>
          <Ionicons name="cash-outline" size={16} color={iconColor} />
          <StyledText variant="bodySmall" color={muted}>
            Total earned: {formatCurrency(partner.commission_total_earned)}
          </StyledText>
        </View>
        <View style={styles.row}>
          <Ionicons name="time-outline" size={16} color={iconColor} />
          <StyledText variant="bodySmall" color={muted}>
            Pending: {formatCurrency(partner.commission_pending)}
          </StyledText>
        </View>
        <View style={styles.row}>
          <Ionicons name="checkmark-circle-outline" size={16} color={iconColor} />
          <StyledText variant="bodySmall" color={muted}>
            Paid: {formatCurrency(partner.commission_paid)}
          </StyledText>
        </View>
      </View>

      <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
        <StyledText variant="titleMedium">Referred user insights</StyledText>
        <StyledText variant="bodySmall" color={muted}>
          Active users: {referredUsers.filter((user) => user.referred_status === "active").length}
        </StyledText>
        <StyledText variant="bodySmall" color={muted}>
          Inactive users: {referredUsers.filter((user) => user.referred_status === "inactive").length}
        </StyledText>
        <StyledText variant="bodySmall" color={muted}>
          Churned users: {referredUsers.filter((user) => user.referred_status === "churned").length}
        </StyledText>
      </View>

      <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
        <StyledText variant="titleMedium">Address</StyledText>
        <StyledText variant="bodySmall" color={muted}>
          {partner.address.address}, {partner.address.city}, {partner.address.postcode},{" "}
          {partner.address.country}
        </StyledText>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 8,
    gap: 6,
    paddingBottom: 24,
    paddingTop: 8,
  },
  card: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    gap: 6,
  },
  title: {
    fontFamily: "BarlowMedium",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  referredButton: {
    marginTop: 10,
    alignSelf: "flex-start",
  },
  vehicleButton: {
    marginTop: 10,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    alignSelf: "stretch",
  },
  vehicleButtonText: {
    color: "#fff",
    fontFamily: "BarlowMedium",
  },
  emptyWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 16,
  },
});
