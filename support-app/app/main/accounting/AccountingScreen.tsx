import React, { useCallback, useMemo } from "react";
import {
  ActivityIndicator,
  FlatList,
  ListRenderItem,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import StyledText from "@/app/components/helpers/StyledText";
import { useGetMonthlySummariesQuery } from "@/app/store/api/accountingApi";
import type { AccountingMonthSummary } from "@/app/interfaces/AccountingInterface";
import { useThemeColor } from "@/hooks/useThemeColor";

function monthHeading(year: number, month: number): string {
  const d = new Date(year, month - 1, 1);
  return d.toLocaleString(undefined, { month: "long", year: "numeric" });
}

function totalTxnCount(summary: AccountingMonthSummary): number {
  let n = 0;
  for (const row of Object.values(summary.by_transaction_type)) {
    n += row.count;
  }
  return n;
}

function currencySummaryLine(summary: AccountingMonthSummary): string {
  const entries = Object.entries(summary.currency_totals);
  if (entries.length === 0) return "—";
  return entries
    .map(([cur, row]) => `${cur} ${row.grand_total}`)
    .join(" · ");
}

export default function AccountingScreen() {
  const router = useRouter();
  const backgroundColor = useThemeColor({}, "background");
  const borderColor = useThemeColor({}, "borders");
  const mutedColor = useThemeColor({}, "icons");

  const { data: summaries = [], isLoading, isError, refetch, isFetching } =
    useGetMonthlySummariesQuery({ months_back: 36, status: "succeeded" });

  const sorted = useMemo(
    () =>
      [...summaries].sort((a, b) => {
        if (a.year !== b.year) return b.year - a.year;
        return b.month - a.month;
      }),
    [summaries],
  );

  const onPressRow = useCallback(
    (item: AccountingMonthSummary) => {
      router.push({
        pathname: "/main/accounting/AccountingDetailScreen",
        params: {
          year: String(item.year),
          month: String(item.month),
        },
      });
    },
    [router],
  );

  const renderItem: ListRenderItem<AccountingMonthSummary> = useCallback(
    ({ item }) => (
      <Pressable
        onPress={() => onPressRow(item)}
        style={({ pressed }) => [
          styles.row,
          {
            backgroundColor,
            borderColor,
            opacity: pressed ? 0.85 : 1,
          },
        ]}
      >
        <StyledText variant="titleMedium">{monthHeading(item.year, item.month)}</StyledText>
        <StyledText variant="bodySmall" style={{ color: mutedColor, marginTop: 4 }}>
          {totalTxnCount(item)} transactions · {currencySummaryLine(item)}
        </StyledText>
      </Pressable>
    ),
    [backgroundColor, borderColor, mutedColor, onPressRow],
  );

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (isError) {
    return (
      <View style={styles.centered}>
        <StyledText variant="bodyMedium">Could not load accounting data.</StyledText>
        <Pressable onPress={() => refetch()} style={styles.retry}>
          <StyledText variant="labelLarge">Retry</StyledText>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <FlatList
        data={sorted}
        keyExtractor={(item) => item.year_month}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        refreshing={isFetching && !isLoading}
        onRefresh={refetch}
        ListEmptyComponent={
          <StyledText variant="bodyMedium" style={{ textAlign: "center", marginTop: 24 }}>
            No payment transactions in range.
          </StyledText>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    padding: 16,
    gap: 12,
    paddingBottom: 32,
  },
  row: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    gap: 12,
  },
  retry: {
    padding: 12,
  },
});
