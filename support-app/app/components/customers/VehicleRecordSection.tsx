import React, { useCallback, useState } from "react";
import { ActivityIndicator, Alert, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import StyledText from "@/app/components/helpers/StyledText";
import StyledButton from "@/app/components/helpers/StyledButton";
import type { SupportVehicleStats } from "@/app/interfaces/SupportVehicleInterface";
import { useSupportVehicleTransferMutation } from "@/app/store/api/customerApi";
import { useThemeColor } from "@/hooks/useThemeColor";
import { formatDate } from "@/app/utils/methods";

type Props = {
  stats: SupportVehicleStats;
  vehicleId: string;
};

function transferStatusLabel(status: string): string {
  switch (status) {
    case "pending":
      return "Pending";
    case "approved":
      return "Approved";
    case "rejected":
      return "Rejected";
    case "expired":
      return "Expired";
    default:
      return status;
  }
}

export default function VehicleRecordSection({ stats, vehicleId }: Props) {
  const textColor = useThemeColor({}, "text");
  const iconColor = useThemeColor({}, "icons");
  const primaryColor = useThemeColor({}, "primary");
  const borderColor = useThemeColor({}, "borders");
  const backgroundColor = useThemeColor({}, "background");
  const cardBackground = useThemeColor({}, "cards");

  const [transferMutation, { isLoading: mutationLoading }] = useSupportVehicleTransferMutation();
  const [busyTransferId, setBusyTransferId] = useState<string | null>(null);

  const timeline = stats.ownership_timeline ?? [];
  const transfers = stats.vehicle_transfers ?? [];
  const fleetLinks = stats.fleet_links ?? [];
  const current = stats.current_owner;
  const ownerCount = stats.vehicle?.owner_count;

  const runTransferAction = useCallback(
    (transferId: string, action: "approve" | "reject") => {
      const title = action === "approve" ? "Approve transfer" : "Reject transfer";
      const message =
        action === "approve"
          ? "Complete this transfer: end the seller’s ownership and assign the vehicle to the buyer. Customer emails will be sent as in the app."
          : "Mark this transfer as rejected. The buyer will be notified by email.";

      Alert.alert(title, message, [
        { text: "Cancel", style: "cancel" },
        {
          text: action === "approve" ? "Approve" : "Reject",
          style: action === "reject" ? "destructive" : "default",
          onPress: async () => {
            setBusyTransferId(transferId);
            try {
              await transferMutation({ vehicleId, transferId, action }).unwrap();
            } catch (e) {
              const errObj = e as {
                data?: { error?: string } | string;
                error?: string;
              };
              const raw = errObj?.data;
              const msg =
                typeof raw === "object" && raw && "error" in raw
                  ? String((raw as { error?: string }).error)
                  : typeof raw === "string"
                    ? raw
                    : (errObj?.error ?? "Request failed");
              Alert.alert("Could not update transfer", String(msg));
            } finally {
              setBusyTransferId(null);
            }
          },
        },
      ]);
    },
    [transferMutation, vehicleId]
  );

  return (
    <>
      <View style={[styles.card, { backgroundColor: cardBackground, borderColor }]}>
        <StyledText variant="titleMedium" style={[styles.sectionTitle, { color: textColor }]}>
          Ownership
        </StyledText>
        {typeof ownerCount === "number" ? (
          <StyledText variant="bodySmall" style={{ color: iconColor, marginBottom: 8 }}>
            Reported owner count (vehicle): {ownerCount}
          </StyledText>
        ) : null}
        {current ? (
          <View style={[styles.highlightBox, { backgroundColor, borderColor }]}>
            <StyledText variant="labelLarge" style={{ color: iconColor }}>
              Current registered owner
            </StyledText>
            <StyledText variant="bodyMedium" style={{ color: textColor, fontWeight: "600", marginTop: 4 }}>
              {current.name}
            </StyledText>
            <StyledText variant="bodySmall" style={{ color: iconColor, marginTop: 2 }}>
              {current.email}
            </StyledText>
            <StyledText variant="bodySmall" style={{ color: iconColor, marginTop: 6 }}>
              Since {current.start_date} · {current.ownership_type}
            </StyledText>
          </View>
        ) : (
          <StyledText variant="bodyMedium" style={{ color: iconColor }}>
            No active ownership period (vehicle may be between owners).
          </StyledText>
        )}
      </View>

      {fleetLinks.length > 0 ? (
        <View style={[styles.card, { backgroundColor: cardBackground, borderColor }]}>
          <StyledText variant="titleMedium" style={[styles.sectionTitle, { color: textColor }]}>
            Fleet associations
          </StyledText>
          {fleetLinks.map((link) => (
            <View
              key={link.fleet_vehicle_id}
              style={[styles.rowItem, { borderBottomColor: borderColor }]}
            >
              <Ionicons name="business-outline" size={20} color={iconColor} />
              <View style={styles.rowItemText}>
                <StyledText variant="bodyMedium" style={{ color: textColor, fontWeight: "500" }}>
                  {link.fleet_name || "Fleet"}
                </StyledText>
                {link.branch_name ? (
                  <StyledText variant="bodySmall" style={{ color: iconColor }}>
                    Branch: {link.branch_name}
                  </StyledText>
                ) : null}
              </View>
            </View>
          ))}
        </View>
      ) : null}

      <View style={[styles.card, { backgroundColor: cardBackground, borderColor }]}>
        <StyledText variant="titleMedium" style={[styles.sectionTitle, { color: textColor }]}>
          Ownership history
        </StyledText>
        {timeline.length === 0 ? (
          <StyledText variant="bodyMedium" style={{ color: iconColor }}>
            No ownership records.
          </StyledText>
        ) : (
          timeline.map((row) => (
            <View
              key={row.id}
              style={[styles.timelineRow, { borderLeftColor: row.is_current ? primaryColor : borderColor }]}
            >
              <View style={styles.timelineContent}>
                <StyledText variant="bodyMedium" style={{ color: textColor, fontWeight: "600" }}>
                  {row.owner_name}
                </StyledText>
                <StyledText variant="bodySmall" style={{ color: iconColor }}>
                  {row.start_date}
                  {row.end_date ? ` → ${row.end_date}` : ""}
                  {row.is_current ? " · current" : ""}
                </StyledText>
                <StyledText variant="bodySmall" style={{ color: iconColor }}>
                  {row.ownership_type} · {row.owner_email}
                </StyledText>
              </View>
            </View>
          ))
        )}
      </View>

      <View style={[styles.card, { backgroundColor: cardBackground, borderColor }]}>
        <StyledText variant="titleMedium" style={[styles.sectionTitle, { color: textColor }]}>
          Transfers
        </StyledText>
        {transfers.length === 0 ? (
          <StyledText variant="bodyMedium" style={{ color: iconColor }}>
            No transfer requests for this vehicle.
          </StyledText>
        ) : (
          transfers.map((t) => {
            const busy = busyTransferId === t.id && mutationLoading;
            const showActions = t.can_approve && t.can_reject;
            return (
              <View key={t.id} style={[styles.transferCard, { backgroundColor, borderColor }]}>
                <View style={styles.transferHeader}>
                  <StyledText variant="labelLarge" style={{ color: textColor, fontWeight: "600" }}>
                    {transferStatusLabel(t.status)}
                  </StyledText>
                  <StyledText variant="bodySmall" style={{ color: iconColor }}>
                    Requested {t.requested_at ? formatDate(t.requested_at) : "—"}
                  </StyledText>
                </View>
                <StyledText variant="bodySmall" style={{ color: iconColor, marginTop: 4 }}>
                  From: {t.from_owner_name} ({t.from_owner_email})
                </StyledText>
                <StyledText variant="bodySmall" style={{ color: iconColor, marginTop: 2 }}>
                  To: {t.to_owner_name} ({t.to_owner_email})
                </StyledText>
                <StyledText variant="bodySmall" style={{ color: iconColor, marginTop: 4 }}>
                  Expires {t.expires_at ? formatDate(t.expires_at) : "—"}
                </StyledText>
                {showActions ? (
                  <View style={styles.transferActions}>
                    {busy ? (
                      <ActivityIndicator color={primaryColor} style={{ marginVertical: 8 }} />
                    ) : (
                      <>
                        <StyledButton
                          title="Approve"
                          variant="tonal"
                          onPress={() => runTransferAction(t.id, "approve")}
                          style={styles.actionBtn}
                        />
                        <StyledButton
                          title="Reject"
                          variant="tonal"
                          onPress={() => runTransferAction(t.id, "reject")}
                          style={styles.actionBtn}
                        />
                      </>
                    )}
                  </View>
                ) : null}
              </View>
            );
          })
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 10,
    marginTop: 6,
    marginBottom: 10,
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  sectionTitle: {
    fontWeight: "600",
    marginBottom: 12,
  },
  highlightBox: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginTop: 4,
  },
  rowItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowItemText: {
    flex: 1,
  },
  timelineRow: {
    borderLeftWidth: 3,
    marginBottom: 12,
    paddingLeft: 12,
  },
  timelineContent: {
    flex: 1,
  },
  transferCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  transferHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
  },
  transferActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 12,
    flexWrap: "wrap",
  },
  actionBtn: {
    flex: 1,
    minWidth: 120,
  },
});
