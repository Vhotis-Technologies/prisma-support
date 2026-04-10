import React, { useMemo } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type {
  NotificationCategory,
  SupportNotificationItem,
} from "@/app/interfaces/NotificationInterface";
import StyledText from "@/app/components/helpers/StyledText";
import { useThemeColor } from "@/hooks/useThemeColor";

function categoryIcon(category: NotificationCategory): keyof typeof Ionicons.glyphMap {
  switch (category) {
    case "booking":
      return "calendar-outline";
    case "voucher":
      return "gift-outline";
    case "ticket":
      return "ticket-outline";
    default:
      return "notifications-outline";
  }
}

function shortRelativeTime(iso: string): string {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return "—";
  const diffMs = Date.now() - t;
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 1) return "Now";
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return new Date(iso).toLocaleDateString("en-IE", {
    day: "numeric",
    month: "short",
  });
}

export type NotificationItemProps = {
  notification: SupportNotificationItem;
  onPress: (notification: SupportNotificationItem) => void;
};

export default function NotificationItem({
  notification,
  onPress,
}: NotificationItemProps) {
  const backgroundColor = useThemeColor({}, "cards");
  const borderColor = useThemeColor({}, "borders");
  const iconColor = useThemeColor({}, "icons");
  const primary = useThemeColor({}, "primary");
  const textMuted = useThemeColor(
    { light: "#757575", dark: "#9E9E9E" },
    "text",
  );

  const unreadTint = useMemo(
    () => (!notification.read ? `${primary}12` : backgroundColor),
    [notification.read, primary, backgroundColor],
  );

  const timeLabel = useMemo(
    () => shortRelativeTime(notification.createdAt),
    [notification.createdAt],
  );

  const iconName = useMemo(
    () => categoryIcon(notification.category),
    [notification.category],
  );

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => onPress(notification)}
      style={({ pressed }) => [
        styles.row,
        {
          backgroundColor: unreadTint,
          borderColor,
          opacity: pressed ? 0.9 : 1,
        },
      ]}
    >
      <View style={styles.iconWrap}>
        <Ionicons name={iconName} size={18} color={iconColor} />
      </View>
      <View style={styles.main}>
        <View style={styles.titleRow}>
          <StyledText variant="labelMedium" numberOfLines={1} style={styles.title}>
            {notification.title}
          </StyledText>
          <StyledText
            variant="labelSmall"
            color={textMuted}
            style={styles.time}
            numberOfLines={1}
          >
            {timeLabel}
          </StyledText>
        </View>
        <StyledText
          variant="bodySmall"
          color={textMuted}
          numberOfLines={1}
          style={styles.preview}
        >
          {notification.body}
        </StyledText>
      </View>
      {!notification.read ? (
        <View style={[styles.unreadDot, { backgroundColor: primary }]} />
      ) : (
        <View style={styles.unreadPlaceholder} />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 6,
    gap: 8,
    minHeight: 52,
  },
  iconWrap: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  main: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  title: {
    flex: 1,
    minWidth: 0,
  },
  time: {
    flexShrink: 0,
    maxWidth: 52,
  },
  preview: {
    lineHeight: 18,
  },
  unreadDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    flexShrink: 0,
  },
  unreadPlaceholder: {
    width: 6,
    height: 6,
    flexShrink: 0,
    opacity: 0,
  },
});
