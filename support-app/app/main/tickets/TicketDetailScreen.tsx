import React, { useMemo, useState } from "react";
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
import StyledTextInput from "@/app/components/helpers/StyledTextInput";
import type { TicketStatus } from "@/app/interfaces/TicketInterface";
import { useThemeColor } from "@/hooks/useThemeColor";
import { useTicketDetailFlow } from "@/app/app_hooks/useTicketFlow";

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

function formatDetailTime(iso: string): string {
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

export default function TicketDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {
    ticket,
    isLoading,
    isError,
    markCompleted,
    canComplete,
    isUpdating,
  } = useTicketDetailFlow(id);

  const [resolutionNote, setResolutionNote] = useState("");

  const backgroundColor = useThemeColor({}, "background");
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
  const primaryColor = useThemeColor({}, "primary");

  const statusColor = useMemo(() => {
    if (!ticket) return text;
    switch (ticket.status) {
      case "pending":
        return warning;
      case "in_progress":
        return primary;
      case "resolved":
      case "closed":
        return success;
      default:
        return text;
    }
  }, [ticket, warning, primary, success, text]);

  const sortedUpdates = useMemo(() => {
    if (!ticket) return [];
    return [...ticket.updates].sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );
  }, [ticket]);

  if (isLoading && !ticket) {
    return (
      <View style={[styles.centered, { backgroundColor }]}>
        <ActivityIndicator size="large" color={primaryColor} />
      </View>
    );
  }

  if (isError || !ticket) {
    return (
      <View style={[styles.centered, { backgroundColor }]}>
        <StyledText variant="titleMedium">Ticket not found</StyledText>
        <StyledText variant="bodyMedium" color={textMuted} style={styles.mt8}>
          This ticket may have been removed or could not be loaded.
        </StyledText>
        <View style={styles.mt16}>
          <StyledButton
            title="Back to tickets"
            onPress={() => router.back()}
            variant="medium"
          />
        </View>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.scroll, { backgroundColor }]}
      contentContainerStyle={[
        styles.content,
        { paddingBottom: 24 + insets.bottom },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <View
        style={[
          styles.hero,
          { borderColor },
        ]}
      >
        <View style={styles.heroTop}>
          <StyledText variant="titleLarge" style={styles.subject}>
            {ticket.subject}
          </StyledText>
          <StyledText variant="bodySmall" color={textMuted}>
            #{ticket.ticket_code}
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
              {statusLabel(ticket.status)}
            </StyledText>
          </View>
        </View>

        <View style={styles.row}>
          <Ionicons name="person-outline" size={18} color={iconColor} />
          <StyledText variant="bodyLarge" style={styles.rowText}>
            {ticket.client_name}
          </StyledText>
        </View>
        <View style={styles.row}>
          <Ionicons name="time-outline" size={18} color={iconColor} />
          <StyledText variant="bodyMedium" color={textMuted}>
            Opened {formatDetailTime(ticket.timestamp)}
          </StyledText>
        </View>
      </View>

      <View
        style={[
          styles.section,
          { borderColor },
        ]}
      >
        <StyledText variant="titleMedium" style={styles.sectionTitle}>
          Description
        </StyledText>
        <StyledText variant="bodyMedium" style={styles.body}>
          {ticket.description}
        </StyledText>
      </View>

      <View
        style={[
          styles.section,
          { borderColor },
        ]}
      >
        <StyledText variant="titleMedium" style={styles.sectionTitle}>
          Updates
        </StyledText>
        {sortedUpdates.length === 0 ? (
          <StyledText variant="bodySmall" color={textMuted}>
            No updates yet. Add a note below when you resolve this ticket.
          </StyledText>
        ) : null}
        {sortedUpdates.map((u, index) => (
          <View
            key={u.id}
            style={[
              styles.updateRow,
              index > 0 && {
                paddingTop: 12,
                borderTopWidth: 1,
                borderTopColor: borderColor,
              },
            ]}
          >
            <StyledText variant="labelSmall" color={textMuted}>
              {formatDetailTime(u.timestamp)}
            </StyledText>
            <StyledText variant="bodyMedium" style={styles.updateMsg}>
              {u.message}
            </StyledText>
            <StyledText variant="labelSmall" color={textMuted}>
              Status: {statusLabel(u.status)}
            </StyledText>
          </View>
        ))}
      </View>

      {canComplete ? (
        <View style={styles.actions}>
          <StyledText variant="titleMedium" style={styles.sectionTitle}>
            Resolution note
          </StyledText>
          <StyledText variant="bodySmall" color={textMuted} style={styles.noteHint}>
            This message is saved on the ticket timeline and included in the customer
            email when you mark it completed.
          </StyledText>
          <StyledTextInput
            label="Message to customer (optional)"
            placeholder="e.g. We’ve issued a refund — it should appear within 3–5 business days."
            value={resolutionNote}
            onChangeText={setResolutionNote}
            multiline
            numberOfLines={4}
            style={styles.noteInput}
            editable={!isUpdating}
          />
          <StyledButton
            title={isUpdating ? "Updating…" : "Mark as completed"}
            onPress={() => {
              void (async () => {
                try {
                  await markCompleted(resolutionNote);
                  setResolutionNote("");
                } catch {
                  /* RTK surfaces error; keep note for retry */
                }
              })();
            }}
            variant="tonal"
            disabled={isUpdating}
          />
        </View>
      ) : (
        <View style={styles.completedNote}>
          <Ionicons name="checkmark-circle" size={20} color={success} />
          <StyledText variant="bodyMedium" color={textMuted}>
            This ticket is completed.
          </StyledText>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 5,
    paddingTop: 8,
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
    padding: 16,
    gap: 12,
  },
  heroTop: {
    gap: 10,
  },
  subject: {
    fontFamily: "BarlowMedium",
  },
  badge: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 40,
    borderWidth: 1,
  },
  badgeText: {
    fontFamily: "BarlowMedium",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  rowText: {
    fontFamily: "BarlowMedium",
    flex: 1,
  },
  section: {
    borderRadius: 2,
    borderBottomWidth: 0.2,
    padding: 16,
    gap: 12,
  },
  sectionTitle: {
    fontFamily: "BarlowMedium",
  },
  body: {
    lineHeight: 22,
  },
  updateRow: {
    gap: 6,
  },
  updateMsg: {
    lineHeight: 20,
  },
  completedNote: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    justifyContent: "center",
    paddingVertical: 8,
  },
  actions: {
    gap: 10,
  },
  noteHint: {
    lineHeight: 20,
  },
  noteInput: {
    minHeight: 100,
    textAlignVertical: "top",
  },
});
