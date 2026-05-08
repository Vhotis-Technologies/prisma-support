import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { B2CCustomerRowProps } from "@/app/interfaces/CustomerInterface";
import StyledText from "@/app/components/helpers/StyledText";
import { useThemeColor } from "@/hooks/useThemeColor";
import { formatCurrency } from "@/app/utils/methods";

const B2CCustomerItem = ({ customer, onPress }: B2CCustomerRowProps) => {
  const backgroundColor = useThemeColor({}, "cards");
  const borderColor = useThemeColor({}, "borders");
  const iconColor = useThemeColor({}, "icons");
  const primary = useThemeColor({}, "primary");
  const textMuted = useThemeColor({ light: "#757575", dark: "#9E9E9E" }, "text");
  const success = useThemeColor({}, "success");
  const warning = useThemeColor({}, "warning");
  const error = useThemeColor({}, "error");

  const subscriptionTone =
    customer.subscription.status === "active"
      ? customer.subscription.is_trial
        ? warning
        : success
      : error;
  const subscriptionLabel =
    customer.subscription.status === "active"
      ? customer.subscription.is_trial
        ? "Trial subscription"
        : "Subscribed"
      : customer.subscription.status === "expired"
        ? "Subscription expired"
        : "Subscription terminated";

  return (
    <Pressable
      onPress={() => onPress?.(customer)}
      accessibilityRole="button"
      accessibilityLabel={`Customer ${customer.name}`}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor,
          borderColor,
          opacity: pressed ? 0.92 : 1,
          transform: [{ scale: pressed ? 0.99 : 1 }],
        },
      ]}
    >
      <View style={styles.headerRow}>
        <StyledText variant="titleMedium" style={styles.name} numberOfLines={1}>
          {customer.name}
        </StyledText>
        <View style={[styles.pill, { borderColor: primary, backgroundColor: `${primary}18` }]}>
          <StyledText variant="labelSmall" style={{ color: primary, fontFamily: "BarlowMedium" }}>
            {customer.loyalty_tier}
          </StyledText>
        </View>
      </View>

      <View
        style={[
          styles.subscriptionPill,
          { borderColor: subscriptionTone, backgroundColor: `${subscriptionTone}18` },
        ]}
      >
        <Ionicons name="sparkles-outline" size={14} color={subscriptionTone} />
        <StyledText variant="labelSmall" style={{ color: subscriptionTone, fontFamily: "BarlowMedium" }}>
          {subscriptionLabel}
        </StyledText>
      </View>
      <StyledText variant="bodySmall" color={textMuted} numberOfLines={1}>
        {customer.subscription.subtype} · {customer.subscription.billing_type}
      </StyledText>

      <View style={styles.row}>
        <Ionicons name="mail-outline" size={16} color={iconColor} />
        <StyledText variant="bodySmall" color={textMuted} numberOfLines={1}>
          {customer.contact.email}
        </StyledText>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <StyledText variant="labelSmall" color={textMuted}>
            Total spend
          </StyledText>
          <StyledText variant="titleSmall">{formatCurrency(customer.total_spend)}</StyledText>
        </View>
        <View style={styles.stat}>
          <StyledText variant="labelSmall" color={textMuted}>
            Bookings
          </StyledText>
          <StyledText variant="titleSmall">{customer.total_bookings}</StyledText>
        </View>
      </View>
    </Pressable>
  );
};

export default B2CCustomerItem;

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    marginBottom: 10,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    marginBottom: 8,
  },
  name: {
    flex: 1,
    fontFamily: "BarlowMedium",
  },
  pill: {
    borderWidth: 1,
    borderRadius: 999,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  subscriptionPill: {
    marginTop: 6,
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
    gap: 12,
  },
  stat: {
    flex: 1,
    gap: 2,
  },
});
