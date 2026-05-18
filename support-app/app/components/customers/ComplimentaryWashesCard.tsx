import React from "react";
import { StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import StyledText from "@/app/components/helpers/StyledText";
import { useThemeColor } from "@/hooks/useThemeColor";
import type { SubscriptionComplimentarySnapshot } from "@/app/interfaces/CustomerInterface";

interface ComplimentaryWashesCardProps {
  complimentary?: SubscriptionComplimentarySnapshot;
}

const formatDate = (iso?: string | null) => {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const ComplimentaryWashesCard: React.FC<ComplimentaryWashesCardProps> = ({
  complimentary,
}) => {
  const backgroundColor = useThemeColor({}, "cards");
  const borderColor = useThemeColor({}, "borders");
  const iconColor = useThemeColor({}, "icons");
  const tint = useThemeColor({}, "tint");
  const muted = useThemeColor({ light: "#757575", dark: "#9E9E9E" }, "text");
  const trackColor = useThemeColor({ light: "#E0E0E0", dark: "#2A2A2A" }, "background");

  if (!complimentary || complimentary.max_subscription <= 0) {
    return null;
  }

  const max = complimentary.max_subscription;
  const remaining = Math.max(0, Math.min(max, complimentary.remaining_subscription));
  const used = Math.max(0, max - remaining);
  const remainingPct = max > 0 ? remaining / max : 0;

  const periodEnd = formatDate(complimentary.period_end);
  const periodStart = formatDate(complimentary.period_start);

  return (
    <View style={[styles.card, { backgroundColor, borderColor }]}>
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <Ionicons name="sparkles-outline" size={18} color={tint} />
          <StyledText variant="titleMedium" style={styles.title}>
            Complimentary washes
          </StyledText>
        </View>
        <View style={[styles.pill, { borderColor: tint, backgroundColor: `${tint}1F` }]}>
          <StyledText
            variant="labelSmall"
            style={{ color: tint, fontFamily: "BarlowMedium" }}
          >
            {remaining} of {max} left
          </StyledText>
        </View>
      </View>

      <View style={styles.progressBlock}>
        <View style={[styles.progressTrack, { backgroundColor: trackColor }]}>
          <View
            style={[
              styles.progressFill,
              { backgroundColor: tint, width: `${Math.round(remainingPct * 100)}%` },
            ]}
          />
        </View>
        <View style={styles.progressLabels}>
          <StyledText variant="labelSmall" color={muted}>
            Used: {used}
          </StyledText>
          <StyledText variant="labelSmall" color={muted}>
            Allowance: {max}
          </StyledText>
        </View>
      </View>

      <View style={styles.metaRow}>
        <Ionicons name="calendar-outline" size={14} color={iconColor} />
        <StyledText variant="bodySmall" color={muted}>
          {periodStart && periodEnd
            ? `Resets on ${periodEnd}`
            : "Resets with the next billing period"}
        </StyledText>
      </View>
    </View>
  );
};

export default ComplimentaryWashesCard;

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 5,
    padding: 14,
    gap: 12,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  title: {
    fontFamily: "BarlowMedium",
  },
  pill: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  progressBlock: {
    gap: 6,
  },
  progressLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },
  progressTrack: {
    height: 8,
    borderRadius: 999,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 999,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
});
