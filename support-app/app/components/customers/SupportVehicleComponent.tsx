import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import StyledText from "@/app/components/helpers/StyledText";
import type { Vehicle } from "@/app/interfaces/CustomerInterface";
import { useThemeColor } from "@/hooks/useThemeColor";

function statusColor(
  status: Vehicle["status"],
  colors: { success: string; warning: string; error: string }
): string {
  switch (status) {
    case "active":
      return colors.success;
    case "maintenance":
      return colors.warning;
    case "inactive":
      return colors.error;
    default:
      return colors.success;
  }
}

export interface SupportVehicleComponentProps {
  vehicle: Vehicle;
  onDeletePress?: (vehicle: Vehicle) => void;
  deleteDisabled?: boolean;
  /** Opens vehicle detail (stats + inspection). Delete control remains separate. */
  onCardPress?: (vehicle: Vehicle) => void;
  /** Shown under the title when listing vehicles in mixed contexts (e.g. partner rollups). */
  subtitle?: string;
}

/**
 * Garage-style vehicle card for support: two-per-row grids, image + compact details, delete on image only.
 */
const SupportVehicleComponent: React.FC<SupportVehicleComponentProps> = ({
  vehicle,
  onDeletePress,
  deleteDisabled,
  onCardPress,
  subtitle,
}) => {
  const cardsColor = useThemeColor({}, "cards");
  const textColor = useThemeColor({}, "text");
  const iconColor = useThemeColor({}, "icons");
  const borderColor = useThemeColor({}, "borders");
  const muted = useThemeColor({ light: "#757575", dark: "#9E9E9E" }, "text");
  const imagePlaceholderBg = useThemeColor({ light: "#e8e8e8", dark: "#3a3a3a" }, "background");
  const success = useThemeColor({}, "success");
  const warning = useThemeColor({}, "warning");
  const error = useThemeColor({}, "error");
  const badgeColor = statusColor(vehicle.status, { success, warning, error });
  const hasImage = Boolean(vehicle.image_url?.trim?.());

  const cardInner = (
    <>
      <View style={styles.imageContainer}>
        {hasImage ? (
          <Image source={{ uri: vehicle.image_url }} style={styles.vehicleImage} contentFit="cover" />
        ) : (
          <View style={[styles.vehicleImage, styles.imagePlaceholder, { backgroundColor: imagePlaceholderBg }]}>
            <Ionicons name="car-outline" size={40} color={muted} />
          </View>
        )}
        <TouchableOpacity
          style={[styles.deleteButton, deleteDisabled && styles.deleteButtonDisabled]}
          onPress={() => !deleteDisabled && onDeletePress?.(vehicle)}
          disabled={deleteDisabled}
          accessibilityRole="button"
          accessibilityLabel="Remove vehicle"
        >
          <Ionicons name="trash-outline" size={16} color="white" />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <StyledText variant="labelLarge" style={[styles.vehicleTitle, { color: textColor }]}>
          {vehicle.year} {vehicle.make} {vehicle.model}
        </StyledText>

        <View
          style={[
            styles.statusPill,
            { borderColor: badgeColor, backgroundColor: `${badgeColor}18` },
          ]}
        >
          <StyledText variant="labelSmall" style={{ color: badgeColor, fontFamily: "BarlowMedium" }}>
            {vehicle.status}
          </StyledText>
        </View>

        {subtitle ? (
          <StyledText variant="bodySmall" color={muted} numberOfLines={2} style={{ fontFamily: "BarlowMedium" }}>
            {subtitle}
          </StyledText>
        ) : null}

        <View style={styles.details}>
          <View style={styles.detailRow}>
            <Ionicons
              name="color-palette-outline"
              size={14}
              color={vehicle.color?.toLowerCase() || iconColor}
            />
            <StyledText variant="bodySmall" style={[styles.detailText, { color: textColor }]} numberOfLines={1}>
              {vehicle.color || "N/A"}
            </StyledText>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="car-sport-outline" size={14} color={iconColor} />
            <StyledText variant="bodySmall" style={[styles.detailText, { color: textColor }]} numberOfLines={1}>
              {vehicle.registration_number?.toUpperCase() || "N/A"}
            </StyledText>
          </View>
        </View>

        <StyledText variant="bodySmall" style={[styles.metaLine, { color: muted }]} numberOfLines={2}>
          VIN: {vehicle.vin || "—"} · Last: {vehicle.last_service_date || "—"}
        </StyledText>
      </View>
    </>
  );

  if (onCardPress) {
    return (
      <TouchableOpacity
        activeOpacity={0.88}
        onPress={() => onCardPress(vehicle)}
        style={[styles.cardContainer, { backgroundColor: cardsColor, borderColor }]}
        accessibilityRole="button"
        accessibilityLabel={`${vehicle.year} ${vehicle.make} ${vehicle.model}, view details`}
      >
        {cardInner}
      </TouchableOpacity>
    );
  }

  return (
    <View style={[styles.cardContainer, { backgroundColor: cardsColor, borderColor }]}>
      {cardInner}
    </View>
  );
};

export default SupportVehicleComponent;

/** Use with `FlatList` `numColumns={2}` as `columnWrapperStyle`. Matches client garage grid spacing. */
export const supportVehiclesGridColumnWrapper = StyleSheet.create({
  row: {
    justifyContent: "space-between",
    marginBottom: 5,
    gap: 2,
  },
}).row;

export const supportVehiclesListContent = StyleSheet.create({
  base: {
    paddingHorizontal: 5,
    paddingBottom: 24,
  },
}).base;

const styles = StyleSheet.create({
  cardContainer: {
    width: "49%",
    marginBottom: 5,
    borderRadius: 10,
    borderWidth: 1,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  imageContainer: {
    width: "100%",
    height: 120,
    position: "relative",
    overflow: "hidden",
  },
  vehicleImage: {
    width: "100%",
    height: "100%",
  },
  imagePlaceholder: {
    alignItems: "center",
    justifyContent: "center",
  },
  deleteButton: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  deleteButtonDisabled: {
    opacity: 0.45,
  },
  content: {
    padding: 12,
    gap: 6,
  },
  vehicleTitle: {
    fontWeight: "600",
    lineHeight: 20,
    fontFamily: "BarlowMedium",
  },
  statusPill: {
    alignSelf: "flex-start",
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  details: {
    marginTop: 4,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  detailText: {
    marginLeft: 6,
    flex: 1,
    opacity: 0.9,
  },
  metaLine: {
    opacity: 0.85,
    fontSize: 11,
    lineHeight: 14,
  },
});
