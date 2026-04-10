import React, { useMemo } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  getVoucherDisplayStatus,
  type VoucherDetails,
  type VoucherListStatus,
} from "@/app/interfaces/VoucherInterface";
import StyledText from "@/app/components/helpers/StyledText";
import { useThemeColor } from "@/hooks/useThemeColor";
import { formatCurrency } from "@/app/utils/methods";

function statusLabel(s: VoucherListStatus): string {
  switch (s) {
    case "active":
      return "Active";
    case "redeemed":
      return "Redeemed";
    case "expired":
      return "Expired";
    case "inactive":
      return "Inactive";
    default:
      return s;
  }
}

function statusColor(
  s: VoucherListStatus,
  colors: { success: string; warning: string; text: string; primary: string }
): string {
  switch (s) {
    case "active":
      return colors.success;
    case "redeemed":
      return colors.primary;
    case "expired":
      return colors.warning;
    case "inactive":
      return colors.text;
    default:
      return colors.text;
  }
}

export type VoucherItemProps = {
  voucher: VoucherDetails;
  onPress: (voucher: VoucherDetails) => void;
};

export default function VoucherItem({ voucher, onPress }: VoucherItemProps) {
  const borderColor = useThemeColor({}, "borders");
  const iconColor = useThemeColor({}, "icons");
  const textMuted = useThemeColor(
    { light: "#757575", dark: "#9E9E9E" },
    "text"
  );
  const success = useThemeColor({}, "success");
  const warning = useThemeColor({}, "warning");
  const primary = useThemeColor({}, "primary");
  const text = useThemeColor({}, "text");

  const displayStatus = useMemo(
    () => getVoucherDisplayStatus(voucher),
    [voucher]
  );

  const badgeColor = useMemo(
    () =>
      statusColor(displayStatus, {
        success,
        warning,
        primary,
        text,
      }),
    [displayStatus, success, warning, primary, text]
  );

  return (
    <Pressable
      onPress={() => onPress(voucher)}
      style={({ pressed }) => [
        styles.row,
        {
          borderColor,
          opacity: pressed ? 0.92 : 1,
        },
      ]}
    >
      <View style={styles.iconWrap}>
        <Ionicons name="gift-outline" size={22} color={iconColor} />
      </View>
      <View style={styles.body}>
        <StyledText variant="titleSmall" numberOfLines={1}>
          {voucher.code}
        </StyledText>
        <StyledText
          variant="bodySmall"
          color={textMuted}
          numberOfLines={1}
          style={styles.sub}
        >
          {voucher.assignedEmail}
        </StyledText>
        <StyledText variant="labelMedium" style={{ color: badgeColor }}>
          {statusLabel(displayStatus)} · {formatCurrency(Number(voucher.creditAmount))}
        </StyledText>
      </View>
      <Ionicons name="chevron-forward" size={20} color={textMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 2,
    borderBottomWidth: 0.2,
    marginBottom: 2,
    gap: 12,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  body: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  sub: {
    marginTop: 2,
  },
});
