import React, { useMemo } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type {
  TicketItemComponentProps,
  TicketStatus,
} from "@/app/interfaces/TicketInterface";
import StyledText from "@/app/components/helpers/StyledText";
import { useThemeColor } from "@/hooks/useThemeColor";

function statusLabel(status: TicketStatus): string {
  switch (status) {
    case "pending":
      return "Pending";
    case "in_progress":
      return "In progress";
    case "resolved":
      return "Resolved";
    case "closed":
      return "Closed";
    default:
      return status;
  }
}

function statusColor(
  status: TicketStatus,
  colors: {
    warning: string;
    primary: string;
    success: string;
    text: string;
  },
): string {
  switch (status) {
    case "pending":
      return colors.warning;
    case "in_progress":
      return colors.primary;
    case "resolved":
    case "closed":
      return colors.success;
    default:
      return colors.text;
  }
}

function formatListTime(iso: string): string {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

const TicketItem = ({ ticket, onPress }: TicketItemComponentProps) => {
  const borderColor = useThemeColor({}, "borders");
  const iconColor = useThemeColor({}, "icons");
  const textMuted = useThemeColor(
    { light: "#757575", dark: "#9E9E9E" },
    "text",
  );
  const warning = useThemeColor({}, "warning");
  const primary = useThemeColor({}, "primary");
  const success = useThemeColor({}, "success");
  const text = useThemeColor({}, "text");

  const badgeColor = useMemo(
    () =>
      statusColor(ticket.status, {
        warning,
        primary,
        success,
        text,
      }),
    [ticket.status, warning, primary, success, text],
  );

  const timeLabel = useMemo(
    () => formatListTime(ticket.timestamp),
    [ticket.timestamp],
  );

  return (
    <Pressable
      onPress={() => onPress(ticket)}
      accessibilityRole="button"
      accessibilityLabel={`Ticket ${ticket.subject}, ${statusLabel(ticket.status)}`}
      style={({ pressed }) => [
        styles.card,
        {
          borderColor,
          opacity: pressed ? 0.92 : 1,
          transform: [{ scale: pressed ? 0.99 : 1 }],
        },
      ]}
    >
      <View style={styles.topRow}>
        <View style={styles.iconWrap}>
          <Ionicons name="ticket-outline" size={20} color={iconColor} />
        </View>
        <View style={styles.topMain}>
          <StyledText
            variant="titleMedium"
            style={styles.subject}
            numberOfLines={2}
          >
            {ticket.subject}
          </StyledText>
          <View
            style={[
              styles.badge,
              {
                backgroundColor: `${badgeColor}22`,
                borderColor: badgeColor,
              },
            ]}
          >
            <StyledText
              variant="labelSmall"
              style={[styles.badgeText, { color: badgeColor }]}
            >
              {statusLabel(ticket.status)}
            </StyledText>
          </View>
        </View>
      </View>

      <View style={styles.clientRow}>
        <Ionicons name="person-outline" size={16} color={iconColor} />
        <StyledText
          variant="bodyLarge"
          style={{ fontFamily: "BarlowMedium", flex: 1 }}
          numberOfLines={1}
        >
          {ticket.client_name}
        </StyledText>
      </View>

      <View style={styles.metaRow}>
        <Ionicons name="keypad-outline" size={14} color={iconColor} />
        <StyledText variant="bodySmall" color={textMuted}>
          #{ticket.ticket_code}
        </StyledText>
      </View>

      <View style={styles.metaRow}>
        <Ionicons name="time-outline" size={14} color={iconColor} />
        <StyledText variant="bodySmall" color={textMuted}>
          {timeLabel}
        </StyledText>
      </View>
    </Pressable>
  );
};

export default TicketItem;

const styles = StyleSheet.create({
  card: {
    borderRadius: 2,
    borderBottomWidth: 0.2,
    padding: 14,
    marginBottom: 10,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 10,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  topMain: {
    flex: 1,
    gap: 8,
  },
  subject: {
    fontFamily: "BarlowMedium",
  },
  badge: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 40,
    borderWidth: 0.2,
  },
  badgeText: {
    fontFamily: "BarlowMedium",
  },
  clientRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
});
