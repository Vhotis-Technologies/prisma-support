import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { FleetCustomerRowProps } from "@/app/interfaces/CustomerInterface";
import StyledText from "@/app/components/helpers/StyledText";
import { useThemeColor } from "@/hooks/useThemeColor";

const FleetCustomerItem = ({ customer, onPress }: FleetCustomerRowProps) => {
  const backgroundColor = useThemeColor({}, "cards");
  const borderColor = useThemeColor({}, "borders");
  const iconColor = useThemeColor({}, "icons");
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
        : "Subscribed fleet"
      : customer.subscription.status === "expired"
      ? "Subscription expired"
      : "Subscription terminated";

  return (
    <Pressable
      onPress={() => onPress?.(customer)}
      accessibilityRole="button"
      accessibilityLabel={`Fleet ${customer.name}`}
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
      <StyledText variant="titleMedium" style={styles.title} numberOfLines={1}>
        {customer.name}
      </StyledText>
      <StyledText variant="bodySmall" color={textMuted} numberOfLines={1}>
        Owner: {customer.fleet_owner}
      </StyledText>
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

      <View style={styles.contactRow}>
        <Ionicons name="mail-outline" size={16} color={iconColor} />
        <StyledText variant="bodySmall" color={textMuted} numberOfLines={1}>
          {customer.contact.email}
        </StyledText>
      </View>

      <View style={styles.metricsRow}>
        <View style={styles.metric}>
          <StyledText variant="labelSmall" color={textMuted}>
            Branches
          </StyledText>
          <StyledText variant="titleSmall">{customer.no_of_branches}</StyledText>
        </View>
        <View style={styles.metric}>
          <StyledText variant="labelSmall" color={textMuted}>
            Vehicles
          </StyledText>
          <StyledText variant="titleSmall">{customer.total_vehicles}</StyledText>
        </View>
      </View>
    </Pressable>
  );
};

export default FleetCustomerItem;

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    marginBottom: 10,
  },
  title: {
    fontFamily: "BarlowMedium",
  },
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
  },
  subscriptionPill: {
    marginTop: 8,
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  metricsRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 10,
  },
  metric: {
    flex: 1,
    gap: 2,
  },
});
