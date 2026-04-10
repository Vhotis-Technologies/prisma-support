import React, { useCallback } from "react";
import { ScrollView, StyleSheet, View, Pressable } from "react-native";
import { type Href, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import StyledText from "@/app/components/helpers/StyledText";
import { useThemeColor } from "@/hooks/useThemeColor";

type ActionItem = {
  key: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  href: Href;
};

const ACTIONS: ActionItem[] = [
  {
    key: "tickets",
    label: "Tickets",
    icon: "ticket-outline",
    href: "/main/tickets/TicketScreen",
  },
  {
    key: "bookings",
    label: "Bookings",
    icon: "calendar-outline",
    href: "/main/bookings/BookingScreen",
  },
  {
    key: "customers",
    label: "Customers",
    icon: "people-outline",
    href: "/main/customers/CustomersScreen",
  },
  {
    key: "team",
    label: "Crew",
    icon: "shield-outline",
    href: "/main/team/CrewScreen",
  },
  {
    key: "notifications",
    label: "Alerts",
    icon: "notifications-outline",
    href: "/main/notifications/NotificationScreen",
  },
  {
    key: "vouchers",
    label: "Vouchers",
    icon: "gift-outline",
    href: "/main/voucher/VoucherScreen",
  },
];

export default function DashboardQuickActions() {
  const router = useRouter();
  const cardBg = useThemeColor({}, "cards");
  const borderColor = useThemeColor({}, "borders");
  const iconColor = useThemeColor({}, "tint");

  const onPressAction = useCallback(
    (href: Href) => {
      router.push(href);
    },
    [router]
  );

  return (
    <View style={styles.section}>
      <StyledText variant="titleMedium" style={styles.sectionTitle}>
        Quick actions
      </StyledText>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {ACTIONS.map((item) => (
          <Pressable
            key={item.key}
            onPress={() => onPressAction(item.href)}
            style={({ pressed }) => [
              styles.chip,
              {
                backgroundColor: cardBg,
                borderColor,
                opacity: pressed ? 0.85 : 1,
              },
            ]}
          >
            <Ionicons name={item.icon} size={22} color={iconColor} />
            <StyledText variant="labelMedium" style={styles.chipLabel}>
              {item.label}
            </StyledText>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: 4,
  },
  sectionTitle: {
    fontFamily: "BarlowMedium",
    marginBottom: 10,
  },
  scrollContent: {
    flexDirection: "row",
    gap: 10,
    paddingRight: 8,
  },
  chip: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    minWidth: 88,
    gap: 6,
  },
  chipLabel: {
    fontFamily: "BarlowMedium",
  },
});
