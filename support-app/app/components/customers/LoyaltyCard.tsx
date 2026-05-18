import React from "react";
import { StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import StyledText from "@/app/components/helpers/StyledText";
import { useThemeColor } from "@/hooks/useThemeColor";
import type {
  LoyaltyProgressSnapshot,
  LoyaltyTier,
} from "@/app/interfaces/CustomerInterface";

interface LoyaltyCardProps {
  loyalty?: LoyaltyProgressSnapshot;
}

const TIER_LABEL: Record<LoyaltyTier, string> = {
  bronze: "Bronze",
  silver: "Silver",
  gold: "Gold",
  platinum: "Platinum",
};

const TIER_ACCENT: Record<LoyaltyTier, string> = {
  bronze: "#B97A4F",
  silver: "#9AA0A6",
  gold: "#C9A227",
  platinum: "#7D3CFF",
};

const LoyaltyCard: React.FC<LoyaltyCardProps> = ({ loyalty }) => {
  const backgroundColor = useThemeColor({}, "cards");
  const borderColor = useThemeColor({}, "borders");
  const iconColor = useThemeColor({}, "icons");
  const muted = useThemeColor({ light: "#757575", dark: "#9E9E9E" }, "text");
  const trackColor = useThemeColor({ light: "#E0E0E0", dark: "#2A2A2A" }, "background");

  if (!loyalty || !loyalty.is_b2c || !loyalty.current_tier) {
    return null;
  }

  const tier = loyalty.current_tier;
  const accent = TIER_ACCENT[tier];
  const isTopTier = loyalty.next_tier === null;

  const completed = loyalty.completed_bookings;
  const lowerBound = loyalty.current_threshold;
  const upperBound = loyalty.next_threshold ?? lowerBound;
  const span = Math.max(1, upperBound - lowerBound);
  const within = Math.max(0, Math.min(span, completed - lowerBound));
  const pct = isTopTier ? 1 : within / span;

  const benefits = loyalty.benefits ?? { discount: 0, free_service: [] };
  const discount = benefits.discount || 0;
  const services = Array.isArray(benefits.free_service) ? benefits.free_service : [];

  return (
    <View style={[styles.card, { backgroundColor, borderColor }]}>
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <Ionicons name="trophy-outline" size={18} color={accent} />
          <StyledText variant="titleMedium" style={styles.title}>
            Loyalty programme
          </StyledText>
        </View>
        <View style={[styles.tierPill, { borderColor: accent, backgroundColor: `${accent}1F` }]}>
          <StyledText
            variant="labelSmall"
            style={{ color: accent, fontFamily: "BarlowMedium" }}
          >
            {TIER_LABEL[tier]}
          </StyledText>
        </View>
      </View>

      <View style={styles.progressBlock}>
        <View style={styles.progressLabels}>
          <StyledText variant="labelSmall" color={muted}>
            {completed} completed wash{completed === 1 ? "" : "es"}
          </StyledText>
          <StyledText variant="labelSmall" color={muted}>
            {isTopTier
              ? "Top tier reached"
              : `${loyalty.washes_to_next} to ${TIER_LABEL[loyalty.next_tier as LoyaltyTier]}`}
          </StyledText>
        </View>
        <View style={[styles.progressTrack, { backgroundColor: trackColor }]}>
          <View
            style={[
              styles.progressFill,
              { backgroundColor: accent, width: `${Math.round(pct * 100)}%` },
            ]}
          />
        </View>
        {!isTopTier && (
          <StyledText variant="labelSmall" color={muted} style={styles.thresholdHint}>
            {lowerBound} → {upperBound} washes
          </StyledText>
        )}
      </View>

      <View style={styles.benefitsBlock}>
        <StyledText variant="labelMedium" style={styles.benefitsTitle}>
          Tier benefits
        </StyledText>
        <View style={styles.benefitRow}>
          <Ionicons name="pricetag-outline" size={14} color={iconColor} />
          <StyledText variant="bodySmall" color={muted}>
            {discount > 0 ? `${discount}% off paid bookings` : "No service discount"}
          </StyledText>
        </View>
        {services.length === 0 ? (
          <View style={styles.benefitRow}>
            <Ionicons name="remove-circle-outline" size={14} color={iconColor} />
            <StyledText variant="bodySmall" color={muted}>
              No complimentary perks yet
            </StyledText>
          </View>
        ) : (
          services.map((label) => (
            <View key={label} style={styles.benefitRow}>
              <Ionicons name="checkmark-circle-outline" size={14} color={accent} />
              <StyledText variant="bodySmall" color={muted}>
                {label}
              </StyledText>
            </View>
          ))
        )}
      </View>
    </View>
  );
};

export default LoyaltyCard;

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
  tierPill: {
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
  thresholdHint: {
    marginTop: 2,
  },
  benefitsBlock: {
    gap: 6,
  },
  benefitsTitle: {
    fontFamily: "BarlowMedium",
    marginBottom: 2,
  },
  benefitRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
});
