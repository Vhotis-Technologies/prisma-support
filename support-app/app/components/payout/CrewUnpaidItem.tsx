import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { CrewUnpaidSummaryItemProps } from "@/app/interfaces/PayoutInterface";
import StyledText from "@/app/components/helpers/StyledText";
import { useThemeColor } from "@/hooks/useThemeColor";
import { formatCurrency } from "@/app/utils/methods";

const CrewUnpaidItem = ({ item, onPress }: CrewUnpaidSummaryItemProps) => {
  const borderColor = useThemeColor({}, "borders");
  const iconColor = useThemeColor({}, "icons");
  const textMuted = useThemeColor({ light: "#757575", dark: "#9E9E9E" }, "text");
  const warning = useThemeColor({}, "warning");

  return (
    <Pressable
      onPress={() => onPress?.(item)}
      accessibilityRole="button"
      accessibilityLabel={`Crew unpaid earnings ${item.crew_member_name}`}
      style={({ pressed }) => [
        styles.card,
        { borderColor, opacity: pressed ? 0.92 : 1 },
      ]}
    >
      <View style={styles.topRow}>
        <View style={styles.nameBlock}>
          <StyledText
            variant="titleMedium"
            style={{ fontFamily: "BarlowMedium" }}
            numberOfLines={1}
          >
            {item.crew_member_name || "Crew member"}
          </StyledText>
          <StyledText variant="bodySmall" color={textMuted} numberOfLines={1}>
            {item.crew_member_email}
          </StyledText>
        </View>
        <View
          style={[
            styles.pill,
            { borderColor: warning, backgroundColor: `${warning}18` },
          ]}
        >
          <StyledText
            variant="labelSmall"
            style={{ color: warning, fontFamily: "BarlowMedium" }}
          >
            Unpaid
          </StyledText>
        </View>
      </View>

      <StyledText variant="headlineSmall" style={{ fontFamily: "BarlowMedium" }}>
        {formatCurrency(item.unpaid_amount)}
      </StyledText>

      <View style={styles.row}>
        <Ionicons name="briefcase-outline" size={16} color={iconColor} />
        <StyledText variant="bodySmall" color={textMuted}>
          {item.unpaid_job_count} unpaid job
          {item.unpaid_job_count === 1 ? "" : "s"}
        </StyledText>
      </View>

      {item.latest_earning_at_display ? (
        <View style={styles.row}>
          <Ionicons name="time-outline" size={16} color={iconColor} />
          <StyledText variant="bodySmall" color={textMuted}>
            Latest {item.latest_earning_at_display}
          </StyledText>
        </View>
      ) : null}
    </Pressable>
  );
};

export default CrewUnpaidItem;

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
