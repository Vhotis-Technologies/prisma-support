import React, { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import StyledText from "@/app/components/helpers/StyledText";
import StyledButton from "@/app/components/helpers/StyledButton";
import { useAlertContext } from "@/app/contexts/AlertContext";
import { useThemeColor } from "@/hooks/useThemeColor";
import { useUserDataExportFlow } from "@/app/app_hooks/usePdfFlow";
import {
  useEmailUserDataPdfMutation,
  useGetCustomerDataExportQuery,
} from "@/app/store/api/customerApi";

type EntityType = "b2c" | "fleet" | "partner";

type Props = {
  entityType: EntityType;
  entityId: string;
  defaultEmail?: string;
};

function isMailableEmail(email?: string) {
  const value = (email || "").trim();
  return Boolean(value && !value.endsWith("@prisma.invalid") && value.includes("@"));
}

export default function PersonalDataExportCard({
  entityType,
  entityId,
  defaultEmail,
}: Props) {
  const cardBg = useThemeColor({}, "cards");
  const borderColor = useThemeColor({}, "borders");
  const muted = useThemeColor({ light: "#757575", dark: "#9E9E9E" }, "text");
  const { setAlertConfig, setIsVisible } = useAlertContext();
  const [expanded, setExpanded] = useState(false);

  const { data, isLoading, isError, refetch } = useGetCustomerDataExportQuery(
    { entityType, entityId },
    { skip: !entityId },
  );
  const { downloadUserDataPdf, exportBusy } = useUserDataExportFlow();
  const [emailMut, { isLoading: emailBusy }] = useEmailUserDataPdfMutation();

  const busy = exportBusy || emailBusy;
  const profile = (data?.profile as Record<string, unknown> | null | undefined) ?? null;
  const fleet = (data?.fleet as Record<string, unknown> | null | undefined) ?? null;
  const partner = (data?.partner as Record<string, unknown> | null | undefined) ?? null;
  const addresses = Array.isArray(data?.addresses) ? data.addresses : [];
  const vehicles = Array.isArray(data?.vehicles) ? data.vehicles : [];
  const bookings = Array.isArray(data?.bookings) ? data.bookings : [];
  const payments = Array.isArray(data?.payments) ? data.payments : [];

  const onDownload = () => {
    void (async () => {
      try {
        await downloadUserDataPdf(entityType, entityId);
      } catch (e) {
        setAlertConfig({
          isVisible: true,
          title: "Could not download PDF",
          message: e instanceof Error ? e.message : "Something went wrong",
          type: "error",
          confirmLabel: "OK",
          onConfirm: () => setIsVisible(false),
        });
      }
    })();
  };

  const onEmail = () => {
    const hint =
      typeof data?.recipient_hint === "string" ? data.recipient_hint : undefined;
    const recipient = isMailableEmail(defaultEmail)
      ? defaultEmail!.trim()
      : isMailableEmail(hint)
        ? hint!.trim()
        : undefined;
    if (!recipient) {
      setAlertConfig({
        isVisible: true,
        title: "No email on file",
        message: "This account has no mailable email. Add one before sending the export.",
        type: "warning",
        confirmLabel: "OK",
        onConfirm: () => setIsVisible(false),
      });
      return;
    }
    setAlertConfig({
      isVisible: true,
      title: "Email personal data export?",
      message: `Send the data package PDF to ${recipient}?`,
      type: "warning",
      confirmLabel: "Send email",
      onClose: () => setIsVisible(false),
      onConfirm: () => {
        void (async () => {
          try {
            const result = await emailMut({
              entity_type: entityType,
              entity_id: entityId,
            }).unwrap();
            setAlertConfig({
              isVisible: true,
              title: "Export queued",
              message: result.message || `Export queued for ${recipient}.`,
              type: "success",
              onClose: () => setIsVisible(false),
            });
          } catch (e) {
            setAlertConfig({
              isVisible: true,
              title: "Could not email export",
              message: e instanceof Error ? e.message : "Something went wrong",
              type: "error",
              confirmLabel: "OK",
              onConfirm: () => setIsVisible(false),
            });
          }
        })();
      },
    });
  };

  return (
    <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
      <StyledText variant="titleMedium">Personal data (GDPR)</StyledText>
      <StyledText variant="bodySmall" color={muted}>
        Review the package we would send for a subject-access request, then download or email the
        PDF.
      </StyledText>

      {isLoading ? <ActivityIndicator /> : null}
      {isError ? (
        <StyledText variant="bodySmall" color={muted}>
          Could not load data package.
        </StyledText>
      ) : null}

      {!isLoading && data ? (
        <>
          <StyledText variant="bodySmall" color={muted}>
            {(data.title as string) || "Data package"} · Addresses {addresses.length} · Vehicles{" "}
            {vehicles.length} · Bookings {bookings.length} · Payments {payments.length}
          </StyledText>

          <Pressable onPress={() => setExpanded((v) => !v)}>
            <StyledText variant="labelMedium">
              {expanded ? "Hide details" : "Review package"}
            </StyledText>
          </Pressable>

          {expanded ? (
            <View style={styles.preview}>
              {profile ? (
                <StyledText variant="bodySmall" color={muted}>
                  Profile: {String(profile.name)} · {String(profile.email)} ·{" "}
                  {String(profile.phone)}
                </StyledText>
              ) : null}
              {fleet ? (
                <StyledText variant="bodySmall" color={muted}>
                  Fleet: {String(fleet.name)} · owner {String(fleet.owner_email)} · bookings{" "}
                  {String(fleet.total_bookings)}
                </StyledText>
              ) : null}
              {partner ? (
                <StyledText variant="bodySmall" color={muted}>
                  Partner: {String(partner.business_name)} · code{" "}
                  {String(partner.referral_code)} · referred {String(partner.total_referred)}
                </StyledText>
              ) : null}
              {bookings.slice(0, 5).map((row) => {
                const b = row as Record<string, unknown>;
                return (
                  <StyledText key={String(b.reference)} variant="bodySmall" color={muted}>
                    {String(b.reference)} · {String(b.status)} · {String(b.service)}
                  </StyledText>
                );
              })}
            </View>
          ) : null}
        </>
      ) : null}

      <StyledButton
        title={busy ? "Working…" : "Download PDF"}
        icon={<Ionicons name="download-outline" size={18} color="#fff" />}
        onPress={onDownload}
        disabled={busy || isLoading}
        variant="tonal"
      />
      <StyledButton
        title="Email to customer"
        icon={<Ionicons name="mail-outline" size={18} color="#fff" />}
        onPress={onEmail}
        disabled={busy || isLoading}
      />
      <StyledButton title="Refresh package" onPress={() => void refetch()} disabled={isLoading} variant="tonal" />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 5,
    padding: 14,
    gap: 8,
  },
  preview: {
    gap: 4,
  },
});
