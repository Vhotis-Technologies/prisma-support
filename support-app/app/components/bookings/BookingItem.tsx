import React, { useMemo } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  BookingItemComponentProps,
  BookingStatus,
  type BulkOrderListItem,
} from "@/app/interfaces/BookingInterface";
import { formatCurrency } from "@/app/utils/methods";
import StyledText from "@/app/components/helpers/StyledText";
import { useThemeColor } from "@/hooks/useThemeColor";

function statusLabel(status: BookingStatus): string {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function statusColor(
  status: BookingStatus,
  colors: {
    warning: string;
    primary: string;
    error: string;
    success: string;
    text: string;
  }
): string {
  switch (status) {
    case "pending":
      return colors.warning;
    case "confirmed":
      return colors.primary;
    case "cancelled":
      return colors.error;
    case "completed":
      return colors.success;
    default:
      return colors.text;
  }
}

function isBulkListItem(b: BookingItemComponentProps["booking"]): b is BulkOrderListItem {
  return b.kind === "bulk_order";
}

const BookingItem = ({ booking, onPress }: BookingItemComponentProps) => {
  const backgroundColor = useThemeColor({}, "cards");
  const borderColor = useThemeColor({}, "borders");
  const iconColor = useThemeColor({}, "icons");
  const textMuted = useThemeColor(
    { light: "#757575", dark: "#9E9E9E" },
    "text"
  );
  const warning = useThemeColor({}, "warning");
  const primary = useThemeColor({}, "primary");
  const error = useThemeColor({}, "error");
  const success = useThemeColor({}, "success");
  const text = useThemeColor({}, "text");

  const badgeColor = useMemo(
    () =>
      statusColor(booking.status, {
        warning,
        primary,
        error,
        success,
        text,
      }),
    [booking.status, warning, primary, error, success, text]
  );

  const handlePress = () => {
    onPress?.(booking);
  };

  const a11yLabel = isBulkListItem(booking)
    ? `Bulk order ${booking.booking_reference} for ${booking.client_name}, ${booking.vehicle_count} vehicles`
    : `Booking ${booking.booking_reference} for ${booking.client_name}`;

  return (
    <Pressable
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={a11yLabel}
      style={({ pressed }) => [
        styles.pressable,
        {
          borderColor,
          opacity: pressed ? 0.92 : 1,
          transform: [{ scale: pressed ? 0.99 : 1 }],
        },
      ]}
    >
      <View style={styles.headerRow}>
        <View style={styles.refRow}>
          <Ionicons
            name={isBulkListItem(booking) ? "layers-outline" : "receipt-outline"}
            size={18}
            color={iconColor}
          />
          <StyledText
            variant="bodyMedium"
            style={[styles.reference, { fontFamily: "BarlowMedium" }]}
          >
            {booking.booking_reference}
          </StyledText>
        </View>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: `${badgeColor}22`, borderColor: badgeColor },
          ]}
        >
          <StyledText
            variant="labelSmall"
            style={[styles.statusText, { color: badgeColor }]}
          >
            {statusLabel(booking.status)}
          </StyledText>
        </View>
      </View>

      <View style={styles.clientRow}>
        <Ionicons name="person-outline" size={16} color={iconColor} />
        <StyledText
          variant="bodyLarge"
          style={{ fontFamily: "BarlowMedium", flex: 1 }}
          numberOfLines={1}
        >
          {booking.client_name}
        </StyledText>
        <StyledText variant="labelSmall" color={textMuted}>
          {isBulkListItem(booking) ? "Bulk order" : booking.client_type}
        </StyledText>
      </View>

      <View style={styles.metaRow}>
        <View style={styles.metaItem}>
          <Ionicons name="calendar-outline" size={14} color={iconColor} />
          <StyledText variant="bodySmall" color={textMuted}>
            Booked {booking.booking_date}
          </StyledText>
        </View>
        <View style={styles.metaItem}>
          <Ionicons name="time-outline" size={14} color={iconColor} />
          <StyledText numberOfLines={2} variant="bodySmall" color={textMuted}>
            {isBulkListItem(booking)
              ? `${booking.vehicle_count} vehicles · ${formatCurrency(booking.total_amount)} · ${booking.appointment_date}`
              : `Appt ${booking.appointment_date}`}
          </StyledText>
        </View>
      </View>
    </Pressable>
  );
};

export default BookingItem;

const styles = StyleSheet.create({
  pressable: {
    borderBottomWidth: 0.2,
    padding: 10,
    marginBottom: 2,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  refRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
    marginRight: 8,
  },
  reference: {
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
  },
  statusText: {
    fontFamily: "BarlowMedium",
  },
  clientRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
});
