import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  ListRenderItem,
  StyleSheet,
  View,
} from "react-native";
import { type Href, useRouter } from "expo-router";
import CrewMemberItem from "@/app/components/crew/CrewMemberItem";
import StyledText from "@/app/components/helpers/StyledText";
import type { CrewMemberListItem } from "@/app/interfaces/CrewInterface";
import { useGetCrewListQuery } from "@/app/store/api/crewApi";
import { useThemeColor } from "@/hooks/useThemeColor";
import StyledTextInput from "@/app/components/helpers/StyledTextInput";

function matchesCrewSearch(member: CrewMemberListItem, raw: string): boolean {
  const q = raw.trim().toLowerCase();
  if (!q) return true;
  const phoneNorm = member.phone.replace(/\s/g, "").toLowerCase();
  const qPhone = q.replace(/\s/g, "");
  return (
    member.name.toLowerCase().includes(q) ||
    member.email.toLowerCase().includes(q) ||
    phoneNorm.includes(qPhone)
  );
}

export default function CrewScreen() {
  const router = useRouter();
  const backgroundColor = useThemeColor({}, "background");
  const cardBg = useThemeColor({}, "cards");
  const borderColor = useThemeColor({}, "borders");
  const textMuted = useThemeColor(
    { light: "#757575", dark: "#9E9E9E" },
    "text",
  );
  const textColor = useThemeColor({}, "text");

  const [search, setSearch] = useState("");

  const { data: crew = [], isLoading, isError, error, refetch, isFetching } =
    useGetCrewListQuery();

  const filteredCrew = useMemo(() => {
    if (!search.trim()) return crew;
    return crew.filter((m) => matchesCrewSearch(m, search));
  }, [crew, search]);

  const onMemberPress = useCallback(
    (member: CrewMemberListItem) => {
      router.push({
        pathname: "/main/team/CrewDetailScreen",
        params: { id: member.id },
      } as Href);
    },
    [router],
  );

  const renderItem: ListRenderItem<CrewMemberListItem> = useCallback(
    ({ item }) => <CrewMemberItem member={item} onPress={onMemberPress} />,
    [onMemberPress],
  );

  const keyExtractor = useCallback((item: CrewMemberListItem) => item.id, []);

  const listHeader = useMemo(
    () => (
      <View style={styles.header}>
        <StyledText variant="bodyMedium" color={textMuted}>
          {crew.length} member{crew.length === 1 ? "" : "s"}
          {search.trim() && crew.length > 0
            ? ` · showing ${filteredCrew.length}`
            : ""}
          {" · tap for full profile and actions"}
        </StyledText>
        <StyledTextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search by name, phone, or email"
          placeholderTextColor={textMuted}
          style={[
            styles.searchInput,
            {
              backgroundColor: cardBg,
              borderColor,
              color: textColor,
            },
          ]}
          autoCapitalize="none"
          autoCorrect={false}
          clearButtonMode="while-editing"
        />
        {(isLoading || isFetching) && (
          <View style={styles.inlineLoading}>
            <ActivityIndicator color={textMuted} />
            <StyledText variant="bodySmall" color={textMuted}>
              Loading…
            </StyledText>
          </View>
        )}
        {isError && (
          <StyledText variant="bodySmall" style={styles.errorText}>
            {(error as { data?: { error?: string } })?.data?.error ??
              "Could not load crew. Pull to retry."}
          </StyledText>
        )}
      </View>
    ),
    [
      crew.length,
      filteredCrew.length,
      search,
      textMuted,
      cardBg,
      borderColor,
      textColor,
      isLoading,
      isFetching,
      isError,
      error,
    ],
  );

  const empty = useMemo(
    () => (
      <View style={styles.empty}>
        <StyledText variant="titleMedium">No crew members</StyledText>
        <StyledText variant="bodyMedium" color={textMuted}>
          {crew.length > 0
            ? "No matches for your search."
            : "When detailers join, they will appear here."}
        </StyledText>
      </View>
    ),
    [textMuted, crew.length],
  );

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <FlatList
        data={isError ? [] : filteredCrew}
        extraData={search}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={!isLoading && !isFetching ? empty : null}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshing={isFetching && !isLoading}
        onRefresh={refetch}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 8,
    paddingBottom: 24,
  },
  header: {
    marginBottom: 16,
    marginTop: 8,
    gap: 8,
  },
  title: {
    marginBottom: 4,
  },
  searchInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: "BarlowRegular",
    marginTop: 4,
  },
  inlineLoading: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  errorText: {
    color: "#c62828",
  },
  empty: {
    paddingVertical: 48,
    alignItems: "center",
    gap: 8,
  },
});
