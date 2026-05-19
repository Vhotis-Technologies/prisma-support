import React, { useCallback } from "react";
import { View, Text, StyleSheet, Pressable, ScrollView } from "react-native";
import { DrawerContentComponentProps } from "@react-navigation/drawer";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { Colors } from "@/constants/Colors";
import { useThemeContext } from "@/app/contexts/ThemeProvider";
import StyledText from "../helpers/StyledText";
import { useAppDispatch, useAppSelector } from "@/app/store/main_store";
import bookingApi from "@/app/store/api/bookingApi";

const PRIMARY = "#6366F1";
const ACTIVE_BG_LIGHT = "#F3F4F6";
const BADGE_SOFT_BG = "#EEF2FF";
const BORDER_LIGHT = "#E5E7EB";

type NavItem = {
  key: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  route?: string;
  badge?: string;
  badgeVariant?: "purple" | "danger";
};

const PRIMARY_ITEMS: NavItem[] = [
  { key: "home", label: "Home", icon: "home-outline", route: "dashboard" },
  {
    key: "bookings",
    label: "Bookings",
    icon: "cube-outline",
    route: "bookings",
  },
  {
    key: "team",
    label: "Prisma Crew",
    icon: "people-outline",
    route: "team",
  },
  {
    key: "customers",
    label: "Customers",
    icon: "people-outline",
    route: "customers",
  },
  {
    key: "activities",
    label: "Activities",
    icon: "time-outline",
    route: "activities",
  },
  {
    key: "tickets",
    label: "Tickets",
    icon: "ticket-outline",
    route: "tickets",
  },
  {
    key: "voucher",
    label: "Vouchers",
    icon: "gift-outline",
    route: "voucher",
  },
  {
    key: "payout",
    label: "Payouts",
    icon: "cash-outline",
    route: "payout",
  },
  {
    key: "accounting",
    label: "Accounting",
    icon: "calculator-outline",
    route: "accounting",
  },
];

const SECONDARY_ITEMS: NavItem[] = [
  {
    key: "notifications",
    label: "Notifications",
    icon: "notifications-outline",
    route: "notifications",
    badge: "+9",
    badgeVariant: "danger",
  },
  {
    key: "settings",
    label: "Settings",
    icon: "settings-outline",
    route: "settings",
  },
  { key: "help", label: "Help", icon: "help-circle-outline", route: "help" },
];

function DrawerComponent(props: DrawerContentComponentProps) {
  const dispatch = useAppDispatch();
  const authUser = useAppSelector((s) => s.auth.user);
  const footerFirstName =
    authUser?.first_name?.trim() || authUser?.email?.split("@")[0] || "Account";
  const insets = useSafeAreaInsets();
  const { currentTheme } = useThemeContext();
  const isDark = currentTheme === "dark";

  const surface = isDark ? Colors.dark.cards : "#FFFFFF";
  const textMain = isDark ? Colors.dark.text : "#1F2937";
  const textMuted = isDark ? "#9CA3AF" : "#6B7280";
  const activeBg = isDark ? "#2C2C2E" : ACTIVE_BG_LIGHT;
  const border = isDark ? Colors.dark.borders : BORDER_LIGHT;

  const activeRoute = props.state.routes[props.state.index]?.name;

  const navigateTo = useCallback(
    (route?: string) => {
      if (route) {
        props.navigation.navigate(route as never);
      }
      props.navigation.closeDrawer();
    },
    [props.navigation],
  );

  const isRowActive = (item: NavItem) => {
    if (!item.route) return false;
    switch (item.key) {
      case "home":
        return activeRoute === "DashboardScreen";
      case "bookings":
        return (
          activeRoute === "BookingScreen" ||
          activeRoute === "BookingDetailsScreen"
        );
      case "team":
        return (
          activeRoute === "CrewScreen" || activeRoute === "CrewDetailScreen"
        );
      case "notifications":
        return activeRoute === "NotificationsScreen";
      case "settings":
        return activeRoute === "SettingsScreen";
      case "help":
        return activeRoute === "HelpScreen";
      case "customers":
        return (
          activeRoute === "CustomersScreen" ||
          activeRoute === "B2CDetailsScreen" ||
          activeRoute === "FleetDetailsScreen" ||
          activeRoute === "FleetBranchDetailsScreen" ||
          activeRoute === "FleetBranchVehicleDetailsScreen" ||
          activeRoute === "PartnerDetailsScreen" ||
          activeRoute === "PartnerReferredUsersScreen" ||
          activeRoute === "PartnerReferredUserVehiclesScreen"
        );
      case "activities":
        return activeRoute === "ActivitiesScreen";
      case "tickets":
        return (
          activeRoute === "TicketScreen" ||
          activeRoute === "TicketDetailScreen"
        );
      case "voucher":
        return (
          activeRoute === "voucher" ||
          activeRoute === "VoucherScreen" ||
          activeRoute === "VoucherDetailScreen"
        );
      case "payout":
        return (
          activeRoute === "payout" ||
          activeRoute === "PayoutScreen" ||
          activeRoute === "PayoutDetailScreen" ||
          activeRoute === "CrewUnpaidDetailScreen"
        );
      case "accounting":
        return (
          activeRoute === "AccountingScreen" ||
          activeRoute === "AccountingDetailScreen"
        );
      default:
        return false;
    }
  };

  return (
    <View
      style={[
        styles.root,
        { backgroundColor: surface, paddingTop: insets.top },
      ]}
    >
      <View style={styles.header}>
        <View style={styles.brandRow}>
          <StyledText
            variant="titleLarge"
            style={styles.brandText}
            children="Prisma Car Care"
          />
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.navBlock}>
          {PRIMARY_ITEMS.map((item) => {
            const rowActive = isRowActive(item);

            return (
              <Pressable
                key={item.key}
                onPress={() => {
                  if (item.key === "bookings") {
                    dispatch(
                      bookingApi.util.prefetch("getSupportBookingsList", undefined, {
                        ifOlderThan: 45,
                      }),
                    );
                  }
                  navigateTo(item.route);
                }}
                style={({ pressed }) => [
                  styles.row,
                  rowActive && { backgroundColor: activeBg },
                  pressed && styles.pressed,
                ]}
              >
                <Ionicons
                  name={item.icon}
                  size={22}
                  color={rowActive ? textMain : textMuted}
                />
                <Text
                  style={[
                    styles.rowLabel,
                    { color: rowActive ? textMain : textMuted },
                  ]}
                >
                  {item.label}
                </Text>
                {item.badge ? (
                  <View
                    style={[
                      styles.badge,
                      item.badgeVariant === "purple" && {
                        backgroundColor: isDark ? "#312E81" : BADGE_SOFT_BG,
                      },
                      item.badgeVariant === "danger" && {
                        backgroundColor: isDark ? "#4C1D95" : BADGE_SOFT_BG,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.badgeText,
                        { color: PRIMARY },
                        item.badgeVariant === "danger" && { color: PRIMARY },
                      ]}
                    >
                      {item.badge}
                    </Text>
                  </View>
                ) : null}
              </Pressable>
            );
          })}
        </View>

        <View style={styles.spacer} />

        <View style={styles.navBlock}>
          {SECONDARY_ITEMS.map((item) => {
            const rowActive = isRowActive(item);
            return (
              <Pressable
                key={item.key}
                onPress={() => navigateTo(item.route)}
                style={({ pressed }) => [
                  styles.row,
                  rowActive && { backgroundColor: activeBg },
                  pressed && styles.pressed,
                ]}
              >
                <Ionicons
                  name={item.icon}
                  size={22}
                  color={rowActive ? textMain : textMuted}
                />
                <Text
                  style={[
                    styles.rowLabel,
                    { color: textMain },
                    !rowActive && { color: textMuted },
                  ]}
                >
                  {item.label}
                </Text>
                {item.badge ? (
                  <View
                    style={[
                      styles.badge,
                      { backgroundColor: isDark ? "#312E81" : BADGE_SOFT_BG },
                    ]}
                  >
                    <Text style={[styles.badgeText, { color: PRIMARY }]}>
                      {item.badge}
                    </Text>
                  </View>
                ) : null}
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      <View style={[styles.footer, { borderTopColor: border }]}>
        <Pressable
          style={({ pressed }) => [
            styles.footerChip,
            pressed && styles.pressed,
          ]}
          onPress={() => navigateTo("profile")}
        >
          <StyledText style={[styles.footerLabel, { color: textMain }]}>
            {footerFirstName}
          </StyledText>

          <Ionicons name="chevron-forward" size={16} color={textMuted} />
        </Pressable>
      </View>
    </View>
  );
}

export default DrawerComponent;

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  logoMark: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(99, 102, 241, 0.12)",
  },
  brandText: {
    fontSize: 22,
    fontFamily: "BarlowMedium",
    letterSpacing: -0.3,
  },
  iconBtn: {
    padding: 4,
  },
  pressed: {
    opacity: 0.7,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 12,
    paddingBottom: 16,
  },
  navBlock: {
    gap: 4,
  },
  spacer: {
    height: 28,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    gap: 12,
  },
  rowLabel: {
    flex: 1,
    fontSize: 16,
    fontFamily: "RobotoRegular",
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "600",
    fontFamily: "RobotoMedium",
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 10,
    paddingTop: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingBottom: 20,
  },
  footerChip: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
    width: "100%",
    padding: 10,
  },
  teamSwatch: {
    width: 32,
    height: 32,
    borderRadius: 8,
  },
  footerLabel: {
    fontSize: 15,
    fontWeight: "600",
    fontFamily: "RobotoMedium",
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
});
