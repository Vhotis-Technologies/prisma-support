import React, { useMemo } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { PartnerPayoutItemProps } from "@/app/interfaces/PayoutInterface";
import StyledText from "@/app/components/helpers/StyledText";
import { useThemeColor } from "@/hooks/useThemeColor";
import { formatCurrency } from "@/app/utils/methods";

function statusLabel(status: string): string {
  switch (status) {
    case "pending":
      return "Pending";
    case "processing":
      return "Processing";
    case "paid":
      return "Paid";
    case "cancelled":
      return "Cancelled";
    default:
      return status;
  }
}

const PartnerPayoutItem = ({ item, onPress }: PartnerPayoutItemProps) => {
  const borderColor = useThemeColor({}, "borders");
  const iconColor = useThemeColor({}, "icons");
  const textMuted = useThemeColor({ light: "#757575", dark: "#9E9E9E" }, "text");
  const warning = useThemeColor({}, "warning");
  const success = useThemeColor({}, "success");
  const primary = useThemeColor({}, "primary");

  const badgeColor = useMemo(() => {
    if (item.status === "paid") return success;
    if (item.status === "processing") return primary;
    if (item.status === "cancelled") return textMuted;
    return warning;
  }, [item.status, success, primary, textMuted, warning]);

  return (
    <Pressable
      onPress={() => onPress?.(item)}
      accessibilityRole="button"
      accessibilityLabel={`Partner payout ${item.partner_name}`}
      style={({ pressed }) => [
        styles.card,
        { borderColor, opacity: pressed ? 0.92 : 1 },
      ]}
    >
      <View style={styles.topRow}>
        <View style={styles.nameBlock}>
          <StyledText variant="titleMedium" style={{ fontFamily: "BarlowMedium" }} numberOfLines={1}>
            {item.partner_name || "Partner"}
          </StyledText>
          <StyledText variant="bodySmall" color={textMuted} numberOfLines={1}>
            {item.partner_user_email}
          </StyledText>
        </View>
        <View style={[styles.pill, { borderColor: badgeColor, backgroundColor: `${badgeColor}18` }]}>
          <StyledText variant="labelSmall" style={{ color: badgeColor, fontFamily: "BarlowMedium" }}>
            {statusLabel(item.status)}
          </StyledText>
        </View>
      </View>

      <StyledText variant="headlineSmall" style={{ fontFamily: "BarlowMedium" }}>
        {formatCurrency(item.amount_requested)}
      </StyledText>

      <View style={styles.row}>
        <Ionicons name="calendar-outline" size={16} color={iconColor} />
        <StyledText variant="bodySmall" color={textMuted}>
          Requested {item.requested_at_display || item.requested_at}
        </StyledText>
      </View>

      {item.status === "paid" && item.paid_at_display ? (
        <View style={styles.row}>
          <Ionicons name="checkmark-circle-outline" size={16} color={success} />
          <StyledText variant="bodySmall" color={textMuted}>
            Paid {item.paid_at_display}
          </StyledText>
        </View>
      ) : null}
    </Pressable>
  );
};

export default PartnerPayoutItem;

const styles = StyleSheet.create({
  card: {
    borderRadius: 2,
    borderBottomWidth: 0.2,
    padding: 14,
    marginBottom: 10,
    gap: 8,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 10,
  },
  nameBlock: {
    flex: 1,
    gap: 4,
  },
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
});
