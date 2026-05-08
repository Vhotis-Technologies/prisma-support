import React, { useCallback, useLayoutEffect } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useNavigation } from "expo-router";
import StyledText from "@/app/components/helpers/StyledText";
import { useGetMonthDetailQuery } from "@/app/store/api/accountingApi";
import { usePdfFlow } from "@/app/app_hooks/usePdfFlow";
import { useThemeColor } from "@/hooks/useThemeColor";

const TX_LABELS: Record<string, string> = {
  payment: "Payment",
  refund: "Refund",
  vin_lookup: "Legacy lookup",
  tip: "Tip",
  fleet_subscription: "Fleet subscription",
  b2c_subscription: "B2C subscription",
  reschedule_fee: "Reschedule fee",
};

function monthHeading(year: number, month: number): string {
  const d = new Date(year, month - 1, 1);
  return d.toLocaleString(undefined, { month: "long", year: "numeric" });
}

export default function AccountingDetailScreen() {
  const { year: yParam, month: mParam } = useLocalSearchParams<{
    year: string;
    month: string;
  }>();
  const navigation = useNavigation();
  const tintColor = useThemeColor({}, "tint");
  const backgroundColor = useThemeColor({}, "background");
  const borderColor = useThemeColor({}, "borders");
  const mutedColor = useThemeColor({}, "icons");

  const year = Number(yParam);
  const month = Number(mParam);
  const paramsOk =
    Number.isFinite(year) &&
    Number.isFinite(month) &&
    month >= 1 &&
    month <= 12 &&
    year >= 2000 &&
    year <= 2100;

  const { downloadAccountingMonthPdf, pdfBusy } = usePdfFlow();

  const { data, isLoading, isError, refetch, isFetching } =
    useGetMonthDetailQuery(
      { year, month, status: "succeeded" },
      { skip: !paramsOk },
    );

  const onDownloadPdf = useCallback(async () => {
    if (!paramsOk) return;
    try {
      await downloadAccountingMonthPdf(year, month, "succeeded");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Download failed";
      Alert.alert("PDF", msg);
    }
  }, [paramsOk, year, month, downloadAccountingMonthPdf]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Pressable
            onPress={onDownloadPdf}
            disabled={pdfBusy || !paramsOk}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Download PDF"
            style={{ marginRight: 12, padding: 8, opacity: pdfBusy ? 0.5 : 1 }}
          >
            {pdfBusy ? (
              <ActivityIndicator size="small" color={tintColor} />
            ) : (
              <Ionicons name="download-outline" size={22} color={tintColor} />
            )}
          </Pressable>
          {navigation.canGoBack() ? (
            <Pressable
              onPress={() => navigation.goBack()}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel="Go back"
              style={{ marginRight: 8, padding: 8 }}
            >
              <Ionicons name="arrow-back" size={22} color={tintColor} />
            </Pressable>
          ) : null}
        </View>
      ),
    });
  }, [navigation, onDownloadPdf, pdfBusy, paramsOk, tintColor]);

  if (!paramsOk) {
    return (
      <View style={styles.centered}>
        <StyledText variant="bodyMedium">Invalid month.</StyledText>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" style={{ backgroundColor }} />
      </View>
    );
  }

  if (isError || !data) {
    return (
      <View style={styles.centered}>
        <StyledText variant="bodyMedium">Could not load this month.</StyledText>
        <Pressable onPress={() => refetch()} style={{ padding: 12 }}>
          <StyledText variant="labelLarge">Retry</StyledText>
        </Pressable>
      </View>
    );
  }

  const n = data.transaction_count;
  const countLabel = `${n} transaction${n === 1 ? "" : "s"}`;

  return (
    <ScrollView
      style={[styles.scroll, { backgroundColor }]}
      contentContainerStyle={styles.scrollContent}
      refreshControl={
        <RefreshControl
          refreshing={isFetching && !isLoading}
          onRefresh={refetch}
        />
      }
    >
      <StyledText variant="titleLarge" style={{ marginBottom: 8 }}>
        {monthHeading(year, month)}
      </StyledText>
      <StyledText
        variant="bodySmall"
        style={{ color: mutedColor, marginBottom: 16 }}
      >
        {countLabel}
      </StyledText>

      <StyledText variant="titleMedium" style={{ marginBottom: 8 }}>
        Totals by currency
      </StyledText>
      <View style={[styles.card, { backgroundColor, borderColor }]}>
        {Object.entries(data.currency_totals).map(([cur, row]) => (
          <View key={cur} style={styles.cardRow}>
            <StyledText variant="bodyMedium">{cur}</StyledText>
            <StyledText variant="bodyMedium">
              {row.count} tx · {row.grand_total}
            </StyledText>
          </View>
        ))}
      </View>

      <StyledText
        variant="titleMedium"
        style={{ marginTop: 20, marginBottom: 8 }}
      >
        VAT summary
      </StyledText>
      <View style={[styles.card, { backgroundColor, borderColor }]}>
        {Object.entries(data.vat_by_currency).map(([cur, v]) => (
          <View key={cur} style={styles.vatBlock}>
            <StyledText variant="labelLarge">{cur}</StyledText>
            <StyledText variant="bodySmall" style={{ color: mutedColor }}>
              Taxable gross {v.taxable_gross ?? "0.00"} · Net{" "}
              {v.net_of_vat ?? "0.00"} · VAT {v.vat_amount ?? "0.00"} · Exempt{" "}
              {v.exempt_total ?? "0.00"}
            </StyledText>
          </View>
        ))}
      </View>

      <StyledText
        variant="titleMedium"
        style={{ marginTop: 20, marginBottom: 8 }}
      >
        By transaction type
      </StyledText>
      <View style={[styles.card, { backgroundColor, borderColor }]}>
        {Object.entries(data.by_transaction_type).map(([tt, row]) => (
          <View key={tt} style={styles.cardRow}>
            <StyledText variant="bodyMedium">{TX_LABELS[tt] ?? tt}</StyledText>
            <StyledText variant="bodyMedium">
              {row.count} · {row.sum_amount}
            </StyledText>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    gap: 8,
  },
  cardRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
    flexWrap: "wrap",
  },
  vatBlock: {
    gap: 4,
    marginBottom: 8,
  },
});
