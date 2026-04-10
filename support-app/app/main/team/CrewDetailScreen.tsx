import React, { useMemo } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import StyledText from "@/app/components/helpers/StyledText";
import type { CrewMemberDetail } from "@/app/interfaces/CrewInterface";
import { useCrewFlow } from "@/app/app_hooks/useCrewFlow";
import { useThemeColor } from "@/hooks/useThemeColor";
import { formatCurrency } from "@/app/utils/methods";


function initials(name: string): string {
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}


export default function CrewDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const crewId = typeof id === "string" ? id : "";
  const insets = useSafeAreaInsets();
  const backgroundColor = useThemeColor({}, "background");
  const cardBg = useThemeColor({}, "cards");
  const borderColor = useThemeColor({}, "borders");
  const iconColor = useThemeColor({}, "icons");
  const muted = useThemeColor({ light: "#757575", dark: "#9E9E9E" }, "text");
  const primary = useThemeColor({}, "primary");
  const error = useThemeColor({}, "error");
  const success = useThemeColor({}, "success");
  const tint = useThemeColor({}, "tint");
  const warning = useThemeColor({}, "warning");

  const {
    member,
    isLoading,
    isError,
    errorMessage,
    refetch,
    updateLoading,
    openCall,
    openEmail,
    requestToggleActive,
    requestToggleVerified,
  } = useCrewFlow(crewId);

  const safeMember = useMemo((): CrewMemberDetail | undefined => {
    if (!member) return undefined;
    const total_bookings = member.total_bookings ?? 0;
    const total_ratings = member.total_ratings ?? 0;
    const average_rating =
      typeof member.average_rating === "number" && !Number.isNaN(member.average_rating)
        ? member.average_rating
        : 0;
    const lifetime_earnings =
      typeof member.lifetime_earnings === "number" && !Number.isNaN(member.lifetime_earnings)
        ? member.lifetime_earnings
        : 0;
    return {
      ...member,
      total_bookings,
      total_ratings,
      average_rating,
      lifetime_earnings,
      specialties: member.specialties ?? [],
      service_areas: member.service_areas ?? [],
      vehicle_types: member.vehicle_types ?? [],
      comments: member.comments ?? [],
    };
  }, [member]);

  if (!crewId) {
    return (
      <View style={[styles.centered, { backgroundColor }]}>
        <Ionicons name="person-outline" size={48} color={muted} />
        <StyledText variant="titleLarge" style={styles.emptyTitle}>
          Invalid link
        </StyledText>
        <StyledText variant="bodyMedium" color={muted}>
          No crew member id was provided.
        </StyledText>
      </View>
    );
  }

  if (isLoading && !safeMember) {
    return (
      <View style={[styles.centered, { backgroundColor }]}>
        <ActivityIndicator size="large" color={primary} />
        <StyledText variant="bodyMedium" color={muted} style={styles.emptyTitle}>
          Loading profile…
        </StyledText>
      </View>
    );
  }

  if (isError || !safeMember) {
    const is404 =
      (errorMessage ?? "").toLowerCase().includes("not found") ||
      (errorMessage ?? "").toLowerCase().includes("404");
    return (
      <View style={[styles.centered, { backgroundColor }]}>
        <Ionicons name="person-outline" size={48} color={muted} />
        <StyledText variant="titleLarge" style={styles.emptyTitle}>
          {is404 ? "Crew member not found" : "Could not load profile"}
        </StyledText>
        <StyledText variant="bodyMedium" color={muted} style={{ textAlign: "center" }}>
          {errorMessage ??
            "This profile may have been removed or the link is invalid."}
        </StyledText>
        <Pressable
          onPress={() => refetch()}
          style={({ pressed }) => [
            styles.retryBtn,
            { borderColor: primary, opacity: pressed ? 0.85 : 1 },
          ]}
        >
          <StyledText variant="labelLarge" style={{ color: primary }}>
            Retry
          </StyledText>
        </Pressable>
      </View>
    );
  }

  const memberView = safeMember;
  const activeColor = memberView.is_active ? success : error;
  const verifiedColor = memberView.is_verified ? tint : muted;

  return (
    <ScrollView
      style={[styles.scroll, { backgroundColor }]}
      contentContainerStyle={[
        styles.content,
        { paddingBottom: Math.max(insets.bottom, 24) + 16 },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <View style={[styles.hero, { borderColor }]}>
        <View style={styles.heroTop}>
          <View style={[styles.avatar, { backgroundColor: `${primary}22` }]}>
            <StyledText variant="headlineSmall" style={{ color: primary }}>
              {initials(memberView.name)}
            </StyledText>
          </View>
          <View style={styles.heroTitles}>
            <StyledText variant="headlineSmall" style={styles.name}>
              {memberView.name}
            </StyledText>
            <StyledText variant="bodyMedium" color={muted}>
              {memberView.headline}
            </StyledText>
          </View>
        </View>
        <View style={styles.pillRow}>
          <View
            style={[
              styles.pill,
              { backgroundColor: `${activeColor}18`, borderColor: activeColor },
            ]}
          >
            <StyledText
              variant="labelMedium"
              style={{ color: activeColor, fontFamily: "BarlowMedium" }}
            >
              {memberView.is_active ? "Active" : "Inactive"}
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
              variant="labelMedium"
              style={{ color: verifiedColor, fontFamily: "BarlowMedium" }}
            >
              {memberView.is_verified ? "Verified" : "Unverified"}
            </StyledText>
          </View>
        </View>
        <View style={[styles.statsRow, { borderTopColor: `${muted}33` }]}>
          <View style={styles.stat}>
            <StyledText variant="labelSmall" color={muted}>
              Bookings
            </StyledText>
            <StyledText variant="titleMedium" style={styles.statVal}>
              {memberView.total_bookings.toLocaleString()}
            </StyledText>
          </View>
          <View style={styles.stat}>
            <StyledText variant="labelSmall" color={muted}>
              Rating
            </StyledText>
            <View style={styles.ratingRow}>
              <Ionicons name="star" size={18} color={warning} />
              <StyledText variant="titleMedium" style={styles.statVal}>
                {memberView.average_rating.toFixed(1)}
              </StyledText>
              <StyledText variant="bodySmall" color={muted}>
                ({memberView.total_ratings})
              </StyledText>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.actionsRow}>
        <Pressable
          disabled={updateLoading}
          onPress={() => requestToggleActive(memberView)}
          style={({ pressed }) => [
            styles.actionBtn,
            {
              borderColor: primary,
              opacity: updateLoading ? 0.5 : pressed ? 0.85 : 1,
            },
          ]}
        >
          <Ionicons
            name={memberView.is_active ? "pause-circle-outline" : "play-circle-outline"}
            size={22}
            color={primary}
          />
          <StyledText
            variant="labelLarge"
            style={{ color: primary, fontFamily: "BarlowMedium" }}
          >
            {memberView.is_active ? "Deactivate" : "Reactivate"}
          </StyledText>
        </Pressable>
        <Pressable
          disabled={updateLoading}
          onPress={() => requestToggleVerified(memberView)}
          style={({ pressed }) => [
            styles.actionBtn,
            {
              borderColor,
              opacity: updateLoading ? 0.5 : pressed ? 0.85 : 1,
            },
          ]}
        >
          <Ionicons
            name={memberView.is_verified ? "shield-outline" : "shield-checkmark-outline"}
            size={22}
            color={iconColor}
          />
          <StyledText variant="labelLarge" style={{ fontFamily: "BarlowMedium" }}>
            {memberView.is_verified ? "Unverify" : "Verify"}
          </StyledText>
        </Pressable>
      </View>

      <Section title="Contact" icon="call-outline" borderColor={borderColor}>
        <Pressable
          onPress={() => openEmail(memberView.email)}
          style={({ pressed }) => [styles.linkRow, { opacity: pressed ? 0.75 : 1 }]}
        >
          <Ionicons name="mail-outline" size={18} color={primary} />
          <StyledText variant="bodyMedium" style={{ color: primary, flex: 1 }}>
            {memberView.email}
          </StyledText>
        </Pressable>
        <Pressable
          onPress={() => openCall(memberView.phone)}
          style={({ pressed }) => [styles.linkRow, { opacity: pressed ? 0.75 : 1 }]}
        >
          <Ionicons name="call-outline" size={18} color={primary} />
          <StyledText variant="bodyMedium" style={{ color: primary }}>
            {memberView.phone}
          </StyledText>
        </Pressable>
      </Section>

      <Section title="Profile" icon="person-outline" borderColor={borderColor}>
        <DetailRow label="Joined" value={memberView.date_joined} muted={muted} />
        {memberView.bio ? (
          <>
            <StyledText variant="labelMedium" color={muted} style={styles.blockLabel}>
              Bio
            </StyledText>
            <StyledText variant="bodyMedium" style={styles.block}>
              {memberView.bio}
            </StyledText>
          </>
        ) : null}
        <TagBlock title="Specialties" items={memberView.specialties} muted={muted} />
        <TagBlock title="Service areas" items={memberView.service_areas} muted={muted} />
        <TagBlock title="Vehicle types" items={memberView.vehicle_types} muted={muted} />
      </Section>

      <Section title="Performance" icon="stats-chart-outline" borderColor={borderColor}>
        <DetailRow
          label="Lifetime earnings"
          value={formatCurrency(memberView.lifetime_earnings)}
          muted={muted}
        />
        <DetailRow
          label="Total bookings"
          value={memberView.total_bookings.toLocaleString()}
          muted={muted}
        />
        <DetailRow
          label="Average rating"
          value={`${memberView.average_rating.toFixed(1)} / 5`}
          muted={muted}
        />
        <DetailRow
          label="Total ratings"
          value={memberView.total_ratings.toLocaleString()}
          muted={muted}
        />
      </Section>

      <Section title="Comments & notes" icon="chatbubbles-outline" borderColor={borderColor}>
        {memberView.comments.length === 0 ? (
          <StyledText variant="bodyMedium" color={muted}>
            No comments yet.
          </StyledText>
        ) : (
          memberView.comments.map((c) => (
            <View
              key={c.id}
              style={[styles.commentCard, { borderColor, backgroundColor: cardBg }]}
            >
              <View style={styles.commentHeader}>
                <View
                  style={[
                    styles.sourcePill,
                    {
                      backgroundColor:
                        c.source === "customer" ? `${success}22` : `${tint}22`,
                      borderColor: c.source === "customer" ? success : tint,
                    },
                  ]}
                >
                  <StyledText
                    variant="labelSmall"
                    style={{
                      color: c.source === "customer" ? success : tint,
                      fontFamily: "BarlowMedium",
                    }}
                  >
                    {c.source === "customer" ? "Customer" : "Support"}
                  </StyledText>
                </View>
                <StyledText variant="labelSmall" color={muted}>
                  {c.created_at}
                </StyledText>
              </View>
              <StyledText variant="labelMedium" color={muted}>
                {c.author_label}
              </StyledText>
              {typeof c.rating === "number" ? (
                <View style={styles.starsRow}>
                  {[1, 2, 3, 4, 5].map((s) => {
                    const rounded = Math.round(
                      Math.min(5, Math.max(0, c.rating as number)),
                    );
                    return (
                      <Ionicons
                        key={s}
                        name={s <= rounded ? "star" : "star-outline"}
                        size={14}
                        color={warning}
                      />
                    );
                  })}
                </View>
              ) : null}
              <StyledText variant="bodyMedium" style={styles.block}>
                {c.text}
              </StyledText>
            </View>
          ))
        )}
      </Section>
    </ScrollView>
  );
}

function Section({
  title,
  icon,
  borderColor,
  children,
}: {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  borderColor: string;
  children: React.ReactNode;
}) {
  const iconColor = useThemeColor({}, "icons");
  return (
    <View style={[styles.section, { borderColor }]}>
      <View style={styles.sectionHeader}>
        <Ionicons name={icon} size={20} color={iconColor} />
        <StyledText variant="titleMedium" style={styles.sectionTitle}>
          {title}
        </StyledText>
      </View>
      {children}
    </View>
  );
}

function DetailRow({
  label,
  value,
  muted,
}: {
  label: string;
  value: string;
  muted: string;
}) {
  return (
    <View style={styles.detailRow}>
      <StyledText variant="labelMedium" color={muted} style={styles.detailLabel}>
        {label}
      </StyledText>
      <StyledText variant="bodyMedium" style={styles.detailValue}>
        {value}
      </StyledText>
    </View>
  );
}

function TagBlock({
  title,
  items,
  muted,
}: {
  title: string;
  items: string[];
  muted: string;
}) {
  const success = useThemeColor({}, "success");
  if (!items.length) return null;
  return (
    <>
      <StyledText variant="labelMedium" color={muted} style={styles.blockLabel}>
        {title}
      </StyledText>
      {items.map((tag) => (
        <View key={tag} style={styles.tagRow}>
          <Ionicons name="checkmark-circle" size={16} color={success} />
          <StyledText variant="bodyMedium" style={styles.tagText}>
            {tag}
          </StyledText>
        </View>
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: {
    paddingHorizontal: 5,
    paddingTop: 12,
    gap: 14,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    gap: 8,
  },
  emptyTitle: {
    marginTop: 12,
    fontFamily: "BarlowMedium",
  },
  retryBtn: {
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 14,
    borderWidth: 2,
  },
  hero: {
    borderRadius: 2,
    borderBottomWidth: 0.2,
    padding: 18,
  },
  heroTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  heroTitles: {
    flex: 1,
    gap: 4,
  },
  name: {
    fontFamily: "BarlowMedium",
  },
  pillRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 14,
  },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  statsRow: {
    flexDirection: "row",
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 24,
  },
  stat: { gap: 4 },
  statVal: { fontFamily: "BarlowMedium" },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  actionsRow: {
    flexDirection: "row",
    gap: 10,
  },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 2,
  },
  section: {
    borderRadius: 2,
    borderBottomWidth: 0.2,
    padding: 16,
    gap: 10,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  sectionTitle: {
    fontFamily: "BarlowMedium",
  },
  linkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 8,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    paddingVertical: 6,
  },
  detailLabel: {
    width: 130,
    flexShrink: 0,
  },
  detailValue: {
    flex: 1,
    fontFamily: "BarlowRegular",
  },
  blockLabel: {
    marginTop: 8,
    marginBottom: 4,
  },
  block: {
    lineHeight: 22,
  },
  tagRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 3,
  },
  tagText: {
    flex: 1,
    fontFamily: "BarlowRegular",
  },
  commentCard: {
    borderRadius: 2,
    borderBottomWidth: 0.2,
    padding: 12,
    marginBottom: 10,
    gap: 6,
  },
  commentHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sourcePill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 2,
    borderBottomWidth: 0.2,
  },
  starsRow: {
    flexDirection: "row",
    gap: 2,
  },
});
