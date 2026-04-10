/**
 * Support profile – header, avatar ring, name/email, info grid (gender, DOB, role).
 * Data: GET /api/v1/me/ (same `SupportUserPayload` as login), cached via RTK Query + Redux.
 */
import React, { useMemo } from "react";
import {
  View,
  StyleSheet,
  Pressable,
  ScrollView,
  Platform,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useThemeColor } from "@/hooks/useThemeColor";
import StyledText from "@/app/components/helpers/StyledText";
import { useGetMeQuery } from "@/app/store/api/authApi";
import { useAppSelector } from "@/app/store/main_store";
import {
  formatSupportDob,
  formatSupportFullName,
  formatSupportGender,
  formatSupportStaffRole,
} from "@/app/utils/methods";

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const access = useAppSelector((s) => s.auth.access);
  const authUser = useAppSelector((s) => s.auth.user);
  const {
    data: meUser,
    isLoading,
    isError,
    isFetching,
    refetch,
  } = useGetMeQuery(undefined, {
    skip: !access,
    refetchOnMountOrArgChange: true,
  });

  const backgroundColor = useThemeColor({}, "background");
  const cardColor = useThemeColor({}, "cards");
  const textColor = useThemeColor({}, "text");
  const borderColor = useThemeColor({}, "borders");
  const tint = useThemeColor({}, "tint");
  const mutedText = useThemeColor({}, "text");

  const user = meUser ?? authUser;
  const fullName = useMemo(
    () =>
      user
        ? formatSupportFullName(user.first_name, user.last_name) || user.email
        : "",
    [user],
  );
  const initial = useMemo(() => {
    const c =
      user?.first_name?.trim()?.charAt(0) ??
      user?.email?.trim()?.charAt(0) ??
      "?";
    return c.toUpperCase();
  }, [user]);

  const ringMuted = `${tint}40`;

  if (!access) {
    return (
      <View style={[styles.root, styles.centered, { backgroundColor }]}>
        <StyledText variant="bodyLarge" style={{ color: textColor }}>
          Sign in to view your profile.
        </StyledText>
      </View>
    );
  }

  if (isLoading && !user) {
    return (
      <View style={[styles.root, styles.centered, { backgroundColor }]}>
        <ActivityIndicator size="large" color={tint} />
      </View>
    );
  }

  if (isError && !user) {
    return (
      <View style={[styles.root, styles.centered, { backgroundColor }]}>
        <StyledText variant="bodyLarge" style={{ color: textColor }}>
          Could not load profile. Try again later.
        </StyledText>
      </View>
    );
  }

  if (!user) {
    return (
      <View style={[styles.root, styles.centered, { backgroundColor }]}>
        <ActivityIndicator size="large" color={tint} />
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor, paddingTop: insets.top }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
        ]}
        refreshControl={
          <RefreshControl
            refreshing={isFetching}
            onRefresh={refetch}
            tintColor={tint}
          />
        }
      >
        <View style={styles.hero}>
          <View style={[styles.avatarRingOuter, { borderColor: ringMuted }]}>
            <View style={[styles.avatarRingInner, { borderColor: tint }]}>
              <View style={[styles.avatar, { backgroundColor: tint }]}>
                <StyledText
                  variant="headlineMedium"
                  style={{ color: "#FFFFFF" }}
                >
                  {initial}
                </StyledText>
              </View>
            </View>
          </View>
          <View style={[styles.roleBadge, { backgroundColor: tint }]}>
            <StyledText variant="labelSmall" style={styles.roleBadgeText}>
              {formatSupportStaffRole(user.role)}
            </StyledText>
          </View>
          <StyledText
            variant="titleLarge"
            style={[styles.name, { color: textColor }]}
          >
            {fullName}
          </StyledText>
          <StyledText
            variant="bodyMedium"
            style={[styles.email, { color: mutedText, opacity: 0.65 }]}
          >
            {user.email}
          </StyledText>
        </View>

        <View style={styles.grid}>
          <View style={styles.gridRow}>
            <InfoCard
              icon="male-female-outline"
              label="Gender"
              value={formatSupportGender(user.gender)}
              cardColor={cardColor}
              borderColor={borderColor}
              textColor={textColor}
              tint={tint}
            />
            <InfoCard
              icon="calendar-outline"
              label="Date of birth"
              value={formatSupportDob(user.dob)}
              cardColor={cardColor}
              borderColor={borderColor}
              textColor={textColor}
              tint={tint}
            />
          </View>
          <InfoCard
            icon="shield-checkmark-outline"
            label="Role"
            value={formatSupportStaffRole(user.role)}
            cardColor={cardColor}
            borderColor={borderColor}
            textColor={textColor}
            tint={tint}
            wide
          />
        </View>

        <View style={[styles.menuCard, { backgroundColor: cardColor, borderColor }]}>
          <MenuRow
            icon="ticket-outline"
            title="Track tickets"
            onPress={() => router.push("/main/tickets/TicketScreen")}
            textColor={textColor}
            borderColor={borderColor}
            iconTint={tint}
          />
        </View>
      </ScrollView>
    </View>
  );
}

function InfoCard({
  icon,
  label,
  value,
  cardColor,
  borderColor,
  textColor,
  tint,
  wide,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  cardColor: string;
  borderColor: string;
  textColor: string;
  tint: string;
  wide?: boolean;
}) {
  return (
    <View
      style={[
        styles.infoCard,
        wide ? styles.infoCardWide : styles.infoCardHalf,
        { backgroundColor: cardColor, borderColor },
      ]}
    >
      <View style={[styles.infoIconWrap, { backgroundColor: `${tint}18` }]}>
        <Ionicons name={icon} size={20} color={tint} />
      </View>
      <View style={styles.infoTextCol}>
        <StyledText
          variant="labelSmall"
          style={{ color: textColor, opacity: 0.55 }}
        >
          {label}
        </StyledText>
        <StyledText
          variant="labelLarge"
          style={{ color: textColor, marginTop: 4 }}
          numberOfLines={2}
        >
          {value}
        </StyledText>
      </View>
    </View>
  );
}

function MenuRow({
  icon,
  title,
  onPress,
  textColor,
  borderColor,
  iconTint,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  onPress: () => void;
  textColor: string;
  borderColor: string;
  iconTint: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.menuRow,
        { borderBottomColor: borderColor, opacity: pressed ? 0.75 : 1 },
      ]}
    >
      <View style={[styles.menuIconWrap, { backgroundColor: `${iconTint}14` }]}>
        <Ionicons name={icon} size={22} color={iconTint} />
      </View>
      <StyledText variant="labelLarge" style={[styles.menuTitle, { color: textColor }]}>
        {title}
      </StyledText>
      <Ionicons name="chevron-forward" size={20} color={textColor} style={{ opacity: 0.4 }} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  centered: {
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  headerSpacer: {
    width: 40,
  },
  scrollContent: {
    paddingHorizontal: 12,
  },
  hero: {
    alignItems: "center",
    marginBottom: 28,
  },
  avatarRingOuter: {
    width: 112,
    height: 112,
    borderRadius: 56,
    borderWidth: 3,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarRingInner: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    alignItems: "center",
    justifyContent: "center",
  },
  avatar: {
    width: 86,
    height: 86,
    borderRadius: 43,
    alignItems: "center",
    justifyContent: "center",
  },
  roleBadge: {
    marginTop: -14,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.12,
        shadowRadius: 4,
      },
      android: { elevation: 3 },
    }),
  },
  roleBadgeText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  name: {
    marginTop: 12,
    fontWeight: "700",
  },
  email: {
    marginTop: 6,
  },
  grid: {
    gap: 12,
    marginBottom: 20,
  },
  gridRow: {
    flexDirection: "row",
    gap: 12,
  },
  infoCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
  },
  infoCardHalf: {
    flex: 1,
  },
  infoCardWide: {
    width: "100%",
  },
  infoIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  infoTextCol: {
    flex: 1,
    minWidth: 0,
  },
  menuCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
  },
  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 16,
    gap: 14,
    borderBottomWidth: 0,
  },
  menuIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  menuTitle: {
    flex: 1,
  },
});
