import React, { useEffect } from "react";
import { Drawer } from "expo-router/drawer";
import DrawerComponent from "@/app/components/dashboard/DrawerComponent";
import { useThemeColor } from "@/hooks/useThemeColor";
import { StatusBar } from "react-native";
import { useThemeContext } from "../contexts/ThemeProvider";
import { useNotification } from "@/app/app_hooks/useNotification";
import { useAppDispatch, useAppSelector } from "@/app/store/main_store";
import { useGetDashboardMetricsQuery } from "@/app/store/api/dashboardApi";
import { useGetMeQuery } from "@/app/store/api/authApi";
import { updateUser } from "@/app/store/slices/authSlice";

const MainLayout = () => {
  /* Same idea as client main layout: keep hook mounted so token can POST when ready */
  useNotification();

  const dispatch = useAppDispatch();
  const access = useAppSelector((s) => s.auth.access);
  const { data: meUser } = useGetMeQuery(undefined, {
    skip: !access,
    refetchOnMountOrArgChange: true,
  });
  useEffect(() => {
    if (meUser) dispatch(updateUser(meUser));
  }, [meUser, dispatch]);

  useGetDashboardMetricsQuery("daily", {
    skip: !access,
    refetchOnMountOrArgChange: true,
  });

  const backgroundColor = useThemeColor({}, "background");
  const { currentTheme } = useThemeContext();
  const statusBarStyle =
    currentTheme === "dark" ? "light-content" : "dark-content";
  return (
    <React.Fragment>
      <StatusBar barStyle={statusBarStyle} />
      <Drawer
          drawerContent={(props) => <DrawerComponent {...props} />}
          screenOptions={{
            headerShown: false,
            drawerStyle: {
              width: 250,
              backgroundColor: backgroundColor,
            },
          }}
        >
          <Drawer.Screen
            name="dashboard"
            options={{ title: "Home", headerTitle: "Home" }}
          />
          <Drawer.Screen
            name="bookings"
            options={{ title: "Bookings", headerTitle: "Bookings" }}
          />
          <Drawer.Screen
            name="notifications"
            options={{ title: "Notifications", headerTitle: "Notifications" }}
          />
          <Drawer.Screen
            name="profile"
            options={{ title: "Profile", headerTitle: "Profile" }}
          />
          <Drawer.Screen
            name="help"
            options={{ title: "Help", headerTitle: "Help" }}
          />
          <Drawer.Screen
            name="settings"
            options={{ title: "Settings", headerTitle: "Settings" }}
          />
          <Drawer.Screen
            name="activities"
            options={{ title: "Activities", headerTitle: "Activities" }}
          />
          <Drawer.Screen
            name="tickets"
            options={{
              title: "Tickets",
              headerTitle: "Tickets",
            }}
          />
          <Drawer.Screen
            name="crew-chat"
            options={{
              title: "Crew Chats",
              headerTitle: "Crew Chats",
            }}
          />
          <Drawer.Screen
            name="customers"
            options={{
              title: "Customers",
              headerTitle: "Customers",
            }}
          />
          <Drawer.Screen
            name="team"
            options={{ title: "Prisma Crew", headerTitle: "Prisma Crew" }}
          />
          <Drawer.Screen
            name="voucher"
            options={{ title: "Voucher", headerTitle: "Voucher" }}
          />
          <Drawer.Screen
            name="payout"
            options={{ title: "Payouts", headerTitle: "Payouts" }}
          />
          <Drawer.Screen
            name="accounting"
            options={{ title: "Accounting", headerTitle: "Accounting" }}
          />
        </Drawer>
    </React.Fragment>
  );
};

export default MainLayout;
