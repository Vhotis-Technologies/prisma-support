/**
 * Settings – aligned with client app: profile summary, preferences (notifications,
 * language, theme segments, location), account help link, logout.
 * Email prefs: GET/PATCH plus SecureStore mirror. Push: server only (GET /api/v1/me/, PATCH).
 */
import React, { useState, useEffect, useCallback } from "react";
import {
  ScrollView,
  StyleSheet,
  View,
  TouchableOpacity,
  Pressable,
} from "react-native";
import * as SecureStore from "expo-secure-store";
import { useThemeColor } from "@/hooks/useThemeColor";
import { useThemeContext } from "@/app/contexts/ThemeProvider";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import SettingItem from "@/app/components/settings/SettingItem";
import SettingLink from "@/app/components/settings/SettingLink";
import StyledText from "@/app/components/helpers/StyledText";
import { usePermissions } from "@/app/services/usePermissions";
import { useAuthContext } from "@/app/contexts/AuthContextProvider";
import { Snackbar } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import StyledButton from "@/app/components/helpers/StyledButton";
import type { SupportUserPayload } from "@/app/store/api/authApi";
import {
  useGetMeQuery,
  usePatchMeNotificationsMutation,
} from "@/app/store/api/authApi";
import { useAppDispatch, useAppSelector } from "@/app/store/main_store";
import { updateUser } from "@/app/store/slices/authSlice";
import { persistAuthUser } from "@/app/store/authTokens";
import {
  formatSupportFullName,
  formatSupportStaffRole,
} from "@/app/utils/methods";

const PREF_EMAIL = "support_pref_email_notifications";
const PREF_MARKETING = "support_pref_marketing";

async function persistIfRememberMe(user: SupportUserPayload) {
  const refresh = await SecureStore.getItemAsync("refresh");
  if (refresh) await persistAuthUser(user);
}

const SettingsScreen = () => {
  const dispatch = useAppDispatch();
  const accessToken = useAppSelector((s) => s.auth.access);
  const authUser = useAppSelector((s) => s.auth.user);
  const { theme, setTheme } = useThemeContext();
  const { handleLogout } = useAuthContext();
  const {
    toggleNotificationPermission,
    toggleLocationPermission,
    permissionStatus,
  } = usePermissions();
  const { data: meUser } = useGetMeQuery(undefined, {
    skip: !accessToken,
    refetchOnMountOrArgChange: true,
  });
  const [patchNotifications] = usePatchMeNotificationsMutation();

  const [emailNotifications, setEmailNotifications] = useState(false);
  /** User wants push; UI shows on only when OS permission is also granted. */
  const [pushPrefEnabled, setPushPrefEnabled] = useState(false);
  const [marketingNotifications, setMarketingNotifications] = useState(false);
  const [locationServices, setLocationServices] = useState(
    permissionStatus.location.granted,
  );
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");

  const profileUser = meUser ?? authUser;
  const displayName = profileUser
    ? formatSupportFullName(
        profileUser.first_name,
        profileUser.last_name,
      ) || profileUser.email
    : "Support";
  const roleSubtitle = profileUser
    ? formatSupportStaffRole(profileUser.role)
    : "—";

  const loadProfileAndPrefs = useCallback(async () => {
    try {
      const [e, m] = await Promise.all([
        SecureStore.getItemAsync(PREF_EMAIL),
        SecureStore.getItemAsync(PREF_MARKETING),
      ]);
      setMarketingNotifications(m === "true");
      if (typeof authUser?.allow_email_notifications === "boolean") {
        setEmailNotifications(authUser.allow_email_notifications);
      } else if (e != null) {
        setEmailNotifications(e === "true");
      }
      if (typeof authUser?.allow_push_notifications === "boolean") {
        setPushPrefEnabled(authUser.allow_push_notifications);
      }
    } catch {
      /* keep defaults */
    }
  }, [
    authUser?.allow_email_notifications,
    authUser?.allow_push_notifications,
  ]);

  useEffect(() => {
    loadProfileAndPrefs();
  }, [loadProfileAndPrefs]);

  useEffect(() => {
    if (!meUser) return;
    dispatch(updateUser(meUser));
    setEmailNotifications(!!meUser.allow_email_notifications);
    setPushPrefEnabled(!!meUser.allow_push_notifications);
    void SecureStore.setItemAsync(
      PREF_EMAIL,
      meUser.allow_email_notifications ? "true" : "false",
    );
    void (async () => {
      const refresh = await SecureStore.getItemAsync("refresh");
      if (refresh) await persistAuthUser(meUser);
    })();
  }, [meUser, dispatch]);

  useEffect(() => {
    setLocationServices(permissionStatus.location.granted);
  }, [permissionStatus.location.granted]);

  const showSnack = (msg: string) => {
    setSnackbarMessage(msg);
    setSnackbarVisible(true);
  };

  const handleNotificationToggle = async (type: string, value: boolean) => {
    switch (type) {
      case "email": {
        const prev = emailNotifications;
        setEmailNotifications(value);
        try {
          const updated = await patchNotifications({
            allow_email_notifications: value,
          }).unwrap();
          dispatch(updateUser(updated));
          await SecureStore.setItemAsync(PREF_EMAIL, value ? "true" : "false");
          await persistIfRememberMe(updated);
          showSnack(
            value ? "Email notifications on." : "Email notifications off.",
          );
        } catch {
          setEmailNotifications(prev);
          showSnack("Could not update email preference. Try again.");
        }
        break;
      }
      case "marketing":
        setMarketingNotifications(value);
        await SecureStore.setItemAsync(
          PREF_MARKETING,
          value ? "true" : "false",
        );
        showSnack(value ? "Marketing emails on." : "Marketing emails off.");
        break;
      case "push":
        if (value) {
          const permissionGranted = await toggleNotificationPermission(true);
          if (permissionGranted) {
            try {
              const updated = await patchNotifications({
                allow_push_notifications: true,
              }).unwrap();
              dispatch(updateUser(updated));
              setPushPrefEnabled(true);
              await persistIfRememberMe(updated);
              showSnack("Push notifications enabled.");
            } catch {
              setPushPrefEnabled(false);
              showSnack("Could not save push preference. Try again.");
            }
          } else {
            try {
              const updated = await patchNotifications({
                allow_push_notifications: false,
              }).unwrap();
              dispatch(updateUser(updated));
              await persistIfRememberMe(updated);
            } catch {
              /* ignore */
            }
            setPushPrefEnabled(false);
            showSnack(
              permissionStatus.notifications.canAskAgain
                ? "Permission denied. Try again or enable in device settings."
                : "Enable notifications in device settings.",
            );
          }
        } else {
          const prevPush = pushPrefEnabled;
          setPushPrefEnabled(false);
          try {
            const updated = await patchNotifications({
              allow_push_notifications: false,
            }).unwrap();
            dispatch(updateUser(updated));
            await toggleNotificationPermission(false);
            await persistIfRememberMe(updated);
            showSnack("Push notifications disabled.");
          } catch {
            setPushPrefEnabled(prevPush);
            showSnack("Could not update push preference. Try again.");
          }
        }
        break;
    }
  };

  const handleThemeToggle = useCallback(
    (type: string, value: boolean) => {
      if (value) setTheme(type as "light" | "dark" | "system");
    },
    [setTheme],
  );

  const handleGeneralToggle = async (type: string, value: boolean) => {
    if (type === "location") {
      if (value) {
        const success = await toggleLocationPermission(true);
        showSnack(success ? "Location enabled." : "Failed to enable location.");
      } else {
        await toggleLocationPermission(false);
        showSnack("Disable location in device settings.");
      }
    }
  };

  const backgroundColor = useThemeColor({}, "background");
  const cardColor = useThemeColor({}, "cards");
  const textColor = useThemeColor({}, "text");
  const borderColor = useThemeColor({}, "borders");
  const primaryColor = useThemeColor({}, "primary");
  const tintColor = useThemeColor({}, "tint");
  const sectionLabelColor = useThemeColor({}, "text");
  const insets = useSafeAreaInsets();

  const pushEffective =
    pushPrefEnabled && permissionStatus.notifications.granted;

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 20, paddingTop: 10 },
        ]}
      >
        <Pressable
          style={[
            styles.profileBlock,
            { backgroundColor: cardColor, borderColor },
          ]}
          onPress={() => router.push("/main/profile/ProfileScreen")}
        >
          <View style={[styles.avatar, { backgroundColor: tintColor }]}>
            <StyledText
              variant="titleMedium"
              style={{ color: backgroundColor }}
            >
              {displayName.charAt(0)?.toUpperCase() ?? "?"}
            </StyledText>
          </View>
          <View style={styles.profileInfo}>
            <StyledText
              variant="titleMedium"
              style={{ color: textColor }}
              numberOfLines={1}
            >
              {displayName}
            </StyledText>
            <StyledText
              variant="bodySmall"
              style={[styles.email, { color: textColor }]}
              numberOfLines={1}
            >
              {roleSubtitle}
            </StyledText>
          </View>
          <View style={styles.editRow}>
            <StyledText variant="labelMedium" style={{ color: primaryColor }}>
              Edit
            </StyledText>
            <Ionicons name="chevron-forward" size={18} color={primaryColor} />
          </View>
        </Pressable>

        <StyledText
          variant="labelSmall"
          style={[styles.sectionHeader, { color: sectionLabelColor }]}
        >
          PREFERENCES
        </StyledText>
        <View
          style={[
            styles.sectionCard,
            { backgroundColor: cardColor, borderColor },
          ]}
        >
          <SettingItem
            title="Email notifications"
            description="Updates and alerts via email"
            value={emailNotifications}
            onValueChange={(v) => handleNotificationToggle("email", v)}
          />
          <SettingItem
            title="Push notifications"
            description="Instant alerts on your device"
            value={pushEffective}
            onValueChange={(v) => handleNotificationToggle("push", v)}
          />
          <SettingLink
            title="Language"
            description="English"
            onPress={() => showSnack("More languages coming soon.")}
          />
          <View style={[styles.themeRow, { borderBottomColor: borderColor }]}>
            <View style={styles.themeLabels}>
              <StyledText variant="labelLarge" style={{ color: textColor }}>
                Theme
              </StyledText>
              <StyledText
                variant="bodySmall"
                style={{ color: textColor, opacity: 0.8 }}
              >
                {theme === "dark"
                  ? "Dark"
                  : theme === "light"
                    ? "Light"
                    : "System"}
              </StyledText>
            </View>
            <View style={styles.themeSegments}>
              <TouchableOpacity
                style={[
                  styles.segment,
                  theme === "dark" && { backgroundColor: primaryColor },
                  { borderColor },
                ]}
                onPress={() => handleThemeToggle("dark", true)}
              >
                <StyledText
                  variant="labelSmall"
                  style={{ color: theme === "dark" ? "#fff" : textColor }}
                >
                  Dark
                </StyledText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.segment,
                  theme === "light" && { backgroundColor: primaryColor },
                  { borderColor },
                ]}
                onPress={() => handleThemeToggle("light", true)}
              >
                <StyledText
                  variant="labelSmall"
                  style={{ color: theme === "light" ? "#fff" : textColor }}
                >
                  Light
                </StyledText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.segment,
                  theme === "system" && { backgroundColor: primaryColor },
                  { borderColor },
                ]}
                onPress={() => handleThemeToggle("system", true)}
              >
                <StyledText
                  variant="labelSmall"
                  style={{ color: theme === "system" ? "#fff" : textColor }}
                >
                  System
                </StyledText>
              </TouchableOpacity>
            </View>
          </View>
          <SettingItem
            title="Location services"
            description="Use your location for maps and nearby context"
            value={locationServices}
            onValueChange={(v) => handleGeneralToggle("location", v)}
          />
        </View>

        <StyledText
          variant="labelSmall"
          style={[styles.sectionHeader, { color: sectionLabelColor }]}
        >
          ACCOUNT
        </StyledText>
        <View
          style={[
            styles.sectionCard,
            { backgroundColor: cardColor, borderColor },
          ]}
        >
          <SettingLink
            title="Help & support"
            description="Guides and how to get help"
            onPress={() => router.push("" as any)}
          />
        </View>

        <StyledButton title="Log out" onPress={handleLogout} variant="tonal" />
      </ScrollView>

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
      >
        {snackbarMessage}
      </Snackbar>
    </View>
  );
};

export default SettingsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
  },
  profileBlock: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  profileInfo: {
    flex: 1,
    minWidth: 0,
  },
  email: {
    opacity: 0.8,
    marginTop: 2,
  },
  editRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  sectionHeader: {
    marginBottom: 8,
    marginLeft: 4,
    letterSpacing: 0.5,
    opacity: 0.8,
  },
  sectionCard: {
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 24,
    overflow: "hidden",
  },
  themeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  themeLabels: {
    flex: 1,
    marginRight: 16,
  },
  themeSegments: {
    flexDirection: "row",
    gap: 6,
  },
  segment: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
});
