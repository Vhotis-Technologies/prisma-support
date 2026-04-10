import React, { useMemo } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import StyledText from "@/app/components/helpers/StyledText";
import StyledButton from "@/app/components/helpers/StyledButton";
import {
  getVoucherDisplayStatus,
  type VoucherListStatus,
} from "@/app/interfaces/VoucherInterface";
import { useThemeColor } from "@/hooks/useThemeColor";
import { formatCurrency } from "@/app/utils/methods";
import { useVoucherDetailFlow } from "@/app/app_hooks/useVoucherFlow";

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

function formatDetailTime(iso: string | null): string {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function DetailRow({
  label,
  value,
  icon,
  iconColor,
  muted,
}: {
  label: string;
  value: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  muted: string;
}) {
  return (
    <View style={styles.detailRow}>
      <Ionicons name={icon} size={20} color={iconColor} />
      <View style={styles.detailBody}>
        <StyledText variant="labelSmall" color={muted}>
          {label}
        </StyledText>
        <StyledText variant="bodyMedium" style={styles.detailValue}>
          {value}
        </StyledText>
      </View>
    </View>
  );
}

export default function VoucherDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {
    voucher,
    isLoading,
    isError,
    deactivateVoucher,
    canDeactivate,
    isUpdating,
  } = useVoucherDetailFlow(id);

  const backgroundColor = useThemeColor({}, "background");
  const borderColor = useThemeColor({}, "borders");
  const iconColor = useThemeColor({}, "icons");
  const textMuted = useThemeColor(
    { light: "#757575", dark: "#9E9E9E" },
    "text",
  );
  const success = useThemeColor({}, "success");
  const warning = useThemeColor({}, "warning");
  const primary = useThemeColor({}, "primary");
  const text = useThemeColor({}, "text");
  const primaryColor = useThemeColor({}, "primary");

  const displayStatus = useMemo(
    () => (voucher ? getVoucherDisplayStatus(voucher) : "inactive"),
    [voucher],
  );

  const statusColor = useMemo(() => {
    switch (displayStatus) {
      case "active":
        return success;
      case "redeemed":
        return primary;
      case "expired":
        return warning;
      case "inactive":
        return text;
      default:
        return text;
    }
  }, [displayStatus, success, primary, warning, text]);

  if (isLoading && !voucher) {
    return (
      <View style={[styles.centered, { backgroundColor }]}>
        <ActivityIndicator size="large" color={primaryColor} />
      </View>
    );
  }

  if (isError || !voucher) {
    return (
      <View style={[styles.centered, { backgroundColor }]}>
        <StyledText variant="titleMedium">Voucher not found</StyledText>
        <StyledText variant="bodyMedium" color={textMuted} style={styles.mt8}>
          This voucher may have been removed or could not be loaded.
        </StyledText>
        <View style={styles.mt16}>
          <StyledButton
            title="Back"
            onPress={() => router.back()}
            variant="medium"
          />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: 24 + insets.bottom },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.hero, { borderColor }]}>
          <View style={styles.heroTop}>
            <StyledText variant="bodyMedium" style={styles.code}>
              {voucher.code}
            </StyledText>
            <View
              style={[
                styles.badge,
                {
                  backgroundColor: `${statusColor}22`,
                  borderColor: statusColor,
                },
              ]}
            >
              <StyledText
                variant="labelSmall"
                style={[styles.badgeText, { color: statusColor }]}
              >
                {statusLabel(displayStatus)}
              </StyledText>
            </View>
          </View>
          <StyledText variant="headlineSmall" style={styles.credit}>
            {formatCurrency(Number(voucher.creditAmount))}
          </StyledText>
        </View>

        <View style={[styles.section, { borderColor }]}>
          <StyledText variant="titleMedium" style={styles.sectionTitle}>
            Assignment
          </StyledText>
          <DetailRow
            label="Assigned email"
            value={voucher.assignedEmail}
            icon="mail-outline"
            iconColor={iconColor}
            muted={textMuted}
          />
          <DetailRow
            label="Linked user"
            value={voucher.assignedUserLabel ?? "Not linked yet"}
            icon="person-outline"
            iconColor={iconColor}
            muted={textMuted}
          />
        </View>

        <View style={[styles.section, { borderColor }]}>
          <StyledText variant="titleMedium" style={styles.sectionTitle}>
            Validity
          </StyledText>
          <DetailRow
            label="Active flag"
            value={voucher.isActive ? "Yes" : "No"}
            icon="flash-outline"
            iconColor={iconColor}
            muted={textMuted}
          />
          <DetailRow
            label="Valid from"
            value={formatDetailTime(voucher.validFrom)}
            icon="calendar-outline"
            iconColor={iconColor}
            muted={textMuted}
          />
          <DetailRow
            label="Expires at"
            value={formatDetailTime(voucher.expiresAt)}
            icon="hourglass-outline"
            iconColor={iconColor}
            muted={textMuted}
          />
        </View>

        <View style={[styles.section, { borderColor }]}>
          <StyledText variant="titleMedium" style={styles.sectionTitle}>
            Redemption
          </StyledText>
          <DetailRow
            label="Redeemed at"
            value={formatDetailTime(voucher.redeemedAt)}
            icon="checkmark-circle-outline"
            iconColor={iconColor}
            muted={textMuted}
          />
          <DetailRow
            label="Booking reference"
            value={voucher.consumedBookingRef ?? "—"}
            icon="car-outline"
            iconColor={iconColor}
            muted={textMuted}
          />
        </View>

        <View style={[styles.section, { borderColor }]}>
          <StyledText variant="titleMedium" style={styles.sectionTitle}>
            Record
          </StyledText>
          <DetailRow
            label="Internal ID"
            value={voucher.id}
            icon="key-outline"
            iconColor={iconColor}
            muted={textMuted}
          />
          <DetailRow
            label="Created at"
            value={formatDetailTime(voucher.createdAt)}
            icon="time-outline"
            iconColor={iconColor}
            muted={textMuted}
          />
        </View>

        {canDeactivate ? (
          <StyledButton
            title={isUpdating ? "Updating…" : "Deactivate voucher"}
            variant="tonal"
            onPress={() => void deactivateVoucher()}
            disabled={isUpdating}
          />
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 16,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  mt8: {
    marginTop: 8,
    textAlign: "center",
  },
  mt16: {
    marginTop: 16,
  },
  hero: {
    borderRadius: 2,
    borderBottomWidth: 0.2,
    padding: 20,
    gap: 12,
  },
  heroTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  code: {
    flex: 1,
    fontFamily: "BarlowMedium",
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
  },
  badgeText: {
    fontWeight: "600",
  },
  credit: {
    fontFamily: "BarlowMedium",
    marginTop: 4,
  },
  section: {
    borderRadius: 2,
    borderBottomWidth: 0.2,
    padding: 16,
    gap: 16,
  },
  sectionTitle: {
    fontFamily: "BarlowMedium",
    marginBottom: 4,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  detailBody: {
    flex: 1,
    gap: 4,
  },
  detailValue: {
    lineHeight: 22,
  },
});
