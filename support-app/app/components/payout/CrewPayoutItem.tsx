import React, { useMemo } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { CrewPayoutItemProps } from "@/app/interfaces/PayoutInterface";
import StyledText from "@/app/components/helpers/StyledText";
import { useThemeColor } from "@/hooks/useThemeColor";
import { formatCurrency } from "@/app/utils/methods";

function statusLabel(status: string): string {
  switch (status) {
    case "pending":
      return "Pending";
    case "processing":
      return "Processing";
    case "completed":
      return "Paid";
    case "failed":
      return "Failed";
    case "cancelled":
      return "Cancelled";
    default:
      return status;
  }
}

const CrewPayoutItem = ({ item, onPress, variant = "pending" }: CrewPayoutItemProps) => {
  const isPaid = variant === "paid" || item.status === "completed";
  const borderColor = useThemeColor({}, "borders");
  const iconColor = useThemeColor({}, "icons");
  const textMuted = useThemeColor({ light: "#757575", dark: "#9E9E9E" }, "text");
  const warning = useThemeColor({}, "warning");
  const success = useThemeColor({}, "success");
  const primary = useThemeColor({}, "primary");

  const badgeColor = useMemo(() => {
    if (item.status === "completed") return success;
    if (item.status === "processing") return primary;
    if (item.status === "failed" || item.status === "cancelled") return textMuted;
    return warning;
  }, [item.status, success, primary, textMuted, warning]);

  return (
    <Pressable
      onPress={() => onPress?.(item)}
      accessibilityRole="button"
      accessibilityLabel={`Crew payout ${item.crew_member_name}`}
      style={({ pressed }) => [
        styles.card,
        { borderColor, opacity: pressed ? 0.92 : 1 },
      ]}
    >
      <View style={styles.topRow}>
        <View style={styles.nameBlock}>
          <StyledText variant="titleMedium" style={{ fontFamily: "BarlowMedium" }} numberOfLines={1}>
            {item.crew_member_name || "Crew member"}
          </StyledText>
          <StyledText variant="bodySmall" color={textMuted} numberOfLines={1}>
            {item.crew_member_email}
          </StyledText>
        </View>
        <View style={[styles.pill, { borderColor: badgeColor, backgroundColor: `${badgeColor}18` }]}>
          <StyledText variant="labelSmall" style={{ color: badgeColor, fontFamily: "BarlowMedium" }}>
            {statusLabel(item.status)}
          </StyledText>
        </View>
      </View>

      <StyledText variant="headlineSmall" style={{ fontFamily: "BarlowMedium" }}>
        {formatCurrency(item.amount)}
      </StyledText>

      <StyledText variant="bodySmall" color={textMuted}>
        {item.pay_frequency_label}
        {item.period_start_display && item.period_end_display
          ? ` · ${item.period_start_display} – ${item.period_end_display}`
          : ""}
      </StyledText>

      {isPaid && item.paid_at_display ? (
        <View style={styles.row}>
          <Ionicons name="checkmark-circle-outline" size={16} color={iconColor} />
          <StyledText variant="bodySmall" color={textMuted}>
            Paid {item.paid_at_display}
          </StyledText>
        </View>
      ) : (
        <View style={styles.row}>
          <Ionicons name="calendar-outline" size={16} color={iconColor} />
          <StyledText variant="bodySmall" color={textMuted}>
            Initiated {item.requested_at_display || item.requested_at}
          </StyledText>
        </View>
      )}

      {isPaid && item.payout_reference ? (
        <View style={styles.row}>
          <Ionicons name="document-text-outline" size={16} color={iconColor} />
          <StyledText variant="bodySmall" color={textMuted}>
            Ref {item.payout_reference}
          </StyledText>
        </View>
      ) : null}
    </Pressable>
  );
};

export default CrewPayoutItem;

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
