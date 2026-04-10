import React, { useMemo } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { CrewMemberRowProps } from "@/app/interfaces/CrewInterface";
import StyledText from "@/app/components/helpers/StyledText";
import { useThemeColor } from "@/hooks/useThemeColor";

const CrewMemberItem = ({ member, onPress }: CrewMemberRowProps) => {
  const borderColor = useThemeColor({}, "borders");
  const iconColor = useThemeColor({}, "icons");
  const textMuted = useThemeColor(
    { light: "#757575", dark: "#9E9E9E" },
    "text"
  );
  const success = useThemeColor({}, "success");
  const error = useThemeColor({}, "error");
  const tint = useThemeColor({}, "tint");

  const activeColor = useMemo(
    () => (member.is_active ? success : error),
    [member.is_active, success, error]
  );
  const verifiedColor = useMemo(
    () => (member.is_verified ? tint : textMuted),
    [member.is_verified, tint, textMuted]
  );

  return (
    <Pressable
      onPress={() => onPress?.(member)}
      accessibilityRole="button"
      accessibilityLabel={`Crew member ${member.name}`}
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
        <View style={styles.nameBlock}>
          <StyledText
            variant="titleMedium"
            style={{ fontFamily: "BarlowMedium" }}
            numberOfLines={1}
          >
            {member.name}
          </StyledText>
          <StyledText variant="bodySmall" color={textMuted} numberOfLines={1}>
            {member.headline}
          </StyledText>
        </View>
        <View style={styles.pills}>
          <View
            style={[
              styles.pill,
              {
                backgroundColor: `${activeColor}22`,
                borderColor: activeColor,
              },
            ]}
          >
            <StyledText
              variant="labelSmall"
              style={{ color: activeColor, fontFamily: "BarlowMedium" }}
            >
              {member.is_active ? "Active" : "Inactive"}
            </StyledText>
          </View>
          <View
            style={[
              styles.pill,
              {
                backgroundColor: `${verifiedColor}18`,
                borderColor: verifiedColor,
              },
            ]}
          >
            <StyledText
              variant="labelSmall"
              style={{ color: verifiedColor, fontFamily: "BarlowMedium" }}
            >
              {member.is_verified ? "Verified" : "Unverified"}
            </StyledText>
          </View>
        </View>
      </View>

      <View style={styles.row}>
        <Ionicons name="mail-outline" size={16} color={iconColor} />
        <StyledText variant="bodySmall" color={textMuted} numberOfLines={1}>
          {member.email}
        </StyledText>
      </View>
      <View style={styles.row}>
        <Ionicons name="call-outline" size={16} color={iconColor} />
        <StyledText variant="bodySmall" color={textMuted}>
          {member.phone}
        </StyledText>
      </View>
    </Pressable>
  );
};

export default CrewMemberItem;

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
    justifyContent: "space-between",
    gap: 10,
    marginBottom: 10,
  },
  nameBlock: {
    flex: 1,
    gap: 4,
  },
  pills: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    justifyContent: "flex-end",
    maxWidth: "48%",
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
    marginTop: 6,
  },
});
