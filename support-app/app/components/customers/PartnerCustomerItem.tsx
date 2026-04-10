import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { PartnerCustomerRowProps } from "@/app/interfaces/CustomerInterface";
import StyledText from "@/app/components/helpers/StyledText";
import { useThemeColor } from "@/hooks/useThemeColor";

const PartnerCustomerItem = ({ customer, onPress }: PartnerCustomerRowProps) => {
  const backgroundColor = useThemeColor({}, "cards");
  const borderColor = useThemeColor({}, "borders");
  const iconColor = useThemeColor({}, "icons");
  const tint = useThemeColor({}, "tint");
  const textMuted = useThemeColor({ light: "#757575", dark: "#9E9E9E" }, "text");

  return (
    <Pressable
      onPress={() => onPress?.(customer)}
      accessibilityRole="button"
      accessibilityLabel={`Partner ${customer.business_name}`}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor,
          borderColor,
          opacity: pressed ? 0.92 : 1,
          transform: [{ scale: pressed ? 0.99 : 1 }],
        },
      ]}
    >
      <View style={styles.headerRow}>
        <StyledText variant="titleMedium" style={styles.title} numberOfLines={1}>
          {customer.business_name}
        </StyledText>
        <View style={[styles.badge, { borderColor: tint, backgroundColor: `${tint}18` }]}>
          <StyledText variant="labelSmall" style={{ color: tint, fontFamily: "BarlowMedium" }}>
            {customer.referral_code}
          </StyledText>
        </View>
      </View>

      <View style={styles.row}>
        <Ionicons name="mail-outline" size={16} color={iconColor} />
        <StyledText variant="bodySmall" color={textMuted} numberOfLines={1}>
          {customer.contact.email}
        </StyledText>
      </View>

      <View style={styles.row}>
        <Ionicons name="people-outline" size={16} color={iconColor} />
        <StyledText variant="bodySmall" color={textMuted}>
          Total referred: {customer.total_referred}
        </StyledText>
      </View>
    </Pressable>
  );
};

export default PartnerCustomerItem;

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    marginBottom: 10,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  title: {
    flex: 1,
    fontFamily: "BarlowMedium",
  },
  badge: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 6,
  },
});
