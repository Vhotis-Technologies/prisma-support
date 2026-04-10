import React, { useMemo } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type {
  ActivityItemComponentProps,
  ActivityType,
} from "@/app/interfaces/ActivityInterface";
import StyledText from "@/app/components/helpers/StyledText";
import { useThemeColor } from "@/hooks/useThemeColor";

function typeLabel(type: ActivityType): string {
  const labels: Record<ActivityType, string> = {
    booking: "Booking",
    customer: "Customer",
    fleet: "Fleet",
    partner: "Partner",
    detailer: "Detailer",
    subscription: "Subscription",
    branch: "Branch",
    vehicle: "Vehicle",
    fleet_vehicle: "Fleet",
    transfer: "Transfer",
    payout: "Partner",
  };
  return labels[type];
}

function typeIcon(type: ActivityType): keyof typeof Ionicons.glyphMap {
  switch (type) {
    case "booking":
      return "calendar-outline";
    case "customer":
      return "person-outline";
    case "fleet":
      return "car-outline";
    case "partner":
      return "business-outline";
    case "detailer":
      return "brush-outline";
    case "subscription":
      return "card-outline";
    case "branch":
      return "git-branch-outline";
    case "vehicle":
      return "car-sport-outline";
    case "fleet_vehicle":
      return "car-outline";
    case "transfer":
      return "swap-horizontal-outline";
    case "payout":
      return "cash-outline";
    default:
      return "ellipse-outline";
  }
}

function typeAccent(
  type: ActivityType,
  colors: { primary: string; warning: string; success: string; tint: string },
): string {
  switch (type) {
    case "booking":
      return colors.primary;
    case "customer":
      return colors.tint;
    case "fleet":
      return colors.success;
    case "partner":
      return colors.warning;
    case "detailer":
      return colors.tint;
    case "subscription":
      return colors.primary;
    case "branch":
      return colors.success;
    case "vehicle":
      return colors.tint;
    case "fleet_vehicle":
      return colors.success;
    case "transfer":
      return colors.warning;
    case "payout":
      return colors.success;
    default:
      return colors.tint;
  }
}

function formatActivityTime(iso: string): string {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return d.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: d.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    });
  } catch {
    return iso;
  }
}

const ActivityItem = ({ activity, onPress }: ActivityItemComponentProps) => {
  const backgroundColor = useThemeColor({}, "cards");
  const borderColor = useThemeColor({}, "borders");
  const iconColor = useThemeColor({}, "icons");
  const textMuted = useThemeColor(
    { light: "#757575", dark: "#9E9E9E" },
    "text",
  );
  const primary = useThemeColor({}, "primary");
  const warning = useThemeColor({}, "warning");
  const success = useThemeColor({}, "success");
  const tint = useThemeColor({}, "tint");

  const accent = useMemo(
    () =>
      typeAccent(activity.activity_type, { primary, warning, success, tint }),
    [activity.activity_type, primary, warning, success, tint],
  );

  const timeLabel = useMemo(
    () => formatActivityTime(activity.timestamp),
    [activity.timestamp],
  );

  const handlePress = () => {
    onPress?.(activity);
  };

  const content = (
    <>
      <View style={styles.topRow}>
        <View
          style={[
            styles.iconWrap,
            { backgroundColor: `${accent}18`, borderColor: `${accent}44` },
          ]}
        >
          <Ionicons
            name={typeIcon(activity.activity_type)}
            size={20}
            color={accent}
          />
        </View>
        <View style={styles.topText}>
          <StyledText
            variant="titleMedium"
            style={styles.title}
            numberOfLines={2}
          >
            {activity.title}
          </StyledText>
          <View
            style={[
              styles.typePill,
              { backgroundColor: `${accent}14`, borderColor: `${accent}33` },
            ]}
          >
            <StyledText
              variant="labelSmall"
              style={[styles.typePillText, { color: accent }]}
            >
              {typeLabel(activity.activity_type)}
            </StyledText>
          </View>
        </View>
      </View>

      <StyledText
        variant="bodyMedium"
        color={textMuted}
        style={styles.summary}
        numberOfLines={2}
      >
        {activity.summary}
      </StyledText>

      <View style={styles.footerRow}>
        <Ionicons name="time-outline" size={14} color={iconColor} />
        <StyledText variant="bodySmall" color={textMuted}>
          {timeLabel}
        </StyledText>
      </View>
    </>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={handlePress}
        accessibilityRole="button"
        accessibilityLabel={`${activity.title}. ${activity.summary}`}
        style={({ pressed }) => [
          styles.card,
          {
            borderColor,
            opacity: pressed ? 0.92 : 1,
            transform: [{ scale: pressed ? 0.99 : 1 }],
          },
        ]}
      >
        {content}
      </Pressable>
    );
  }

  return (
    <View style={[styles.card, { borderColor}]}>
      {content}
    </View>
  );
};

export default ActivityItem;

const styles = StyleSheet.create({
  card: {
    borderRadius: 2,
    borderBottomWidth: 0.2,
    padding: 5,
    marginBottom: 2,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginBottom: 5,
  },
  iconWrap: {
    width: 30,
    height: 30,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  topText: {
    flex: 1,
    gap: 6,
  },
  title: {
    fontFamily: "BarlowMedium",
  },
  typePill: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    borderRadius: 5,
    borderWidth: 1,
  },
  typePillText: {
    fontFamily: "BarlowMedium",
  },
  summary: {
    marginBottom: 10,
  },
  footerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
});
