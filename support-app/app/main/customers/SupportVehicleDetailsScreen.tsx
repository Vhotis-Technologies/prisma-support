import React from "react";
import {
  ActivityIndicator,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import StyledText from "@/app/components/helpers/StyledText";
import StyledButton from "@/app/components/helpers/StyledButton";
import VehicleInspectionSection from "@/app/components/customers/VehicleInspectionSection";
import VehicleRecordSection from "@/app/components/customers/VehicleRecordSection";
import { useGetSupportVehicleDetailQuery } from "@/app/store/api/customerApi";
import { useThemeColor } from "@/hooks/useThemeColor";
import { formatCurrency, formatDate } from "@/app/utils/methods";

export default function SupportVehicleDetailsScreen() {
  const { vehicleId } = useLocalSearchParams<{ vehicleId: string }>();
  const id = typeof vehicleId === "string" ? vehicleId : "";

  const backgroundColor = useThemeColor({}, "background");
  const textColor = useThemeColor({}, "text");
  const iconColor = useThemeColor({}, "icons");
  const primaryColor = useThemeColor({}, "primary");
  const borderColor = useThemeColor({}, "borders");
  const cardBackgroundColor = useThemeColor({}, "cards");

  const { data: vehicleStats, isLoading, refetch, isFetching, isError } = useGetSupportVehicleDetailQuery(
    id,
    { skip: !id }
  );

  const vehicle = vehicleStats?.vehicle;

  if (!id) {
    return (
      <View style={[styles.container, { backgroundColor }]}>
        <View style={styles.errorContainer}>
          <StyledText variant="bodyLarge" style={{ color: textColor }}>
            Invalid link
          </StyledText>
          <StyledButton title="Go back" variant="tonal" onPress={() => router.back()} style={{ marginTop: 20 }} />
        </View>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={primaryColor} />
          <StyledText variant="bodyMedium" style={{ color: textColor, marginTop: 12 }}>
            Loading vehicle details…
          </StyledText>
        </View>
      </View>
    );
  }

  if (isError || !vehicle || !vehicleStats) {
    return (
      <View style={[styles.container, { backgroundColor }]}>
        <View style={styles.errorContainer}>
          <MaterialIcons name="error-outline" size={48} color={iconColor} />
          <StyledText variant="bodyLarge" style={{ color: textColor, marginTop: 16, textAlign: "center" }}>
            Vehicle not found
          </StyledText>
          <StyledButton title="Go back" variant="tonal" onPress={() => router.back()} style={{ marginTop: 20 }} />
        </View>
      </View>
    );
  }

  const imageUri = vehicle.image && typeof vehicle.image === "string" ? vehicle.image : null;

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={isFetching} onRefresh={refetch} tintColor={primaryColor} />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.card, { backgroundColor: cardBackgroundColor, borderColor }]}>
          <View style={styles.imageContainer}>
            {imageUri ? (
              <Image source={{ uri: imageUri }} style={styles.vehicleImage} resizeMode="cover" />
            ) : (
              <View style={[styles.placeholderImage, { backgroundColor: borderColor }]}>
                <MaterialIcons name="directions-car" size={64} color={iconColor} />
              </View>
            )}
          </View>

          <View style={styles.vehicleTitleSection}>
            <StyledText variant="headlineSmall" style={[styles.vehicleTitle, { color: textColor }]}>
              {vehicle.year} {vehicle.make} {vehicle.model}
            </StyledText>

            <View style={styles.vehicleInfoGrid}>
              <View style={styles.infoItem}>
                <Ionicons
                  name="color-palette-outline"
                  size={20}
                  color={vehicle.color?.toLowerCase() || iconColor}
                />
                <View style={styles.infoItemText}>
                  <StyledText variant="bodySmall" style={{ color: iconColor }}>
                    Color
                  </StyledText>
                  <StyledText variant="bodyMedium" style={{ color: textColor, fontWeight: "500" }}>
                    {vehicle.color || "N/A"}
                  </StyledText>
                </View>
              </View>

              <View style={styles.infoItem}>
                <Ionicons name="card-outline" size={20} color={iconColor} />
                <View style={styles.infoItemText}>
                  <StyledText variant="bodySmall" style={{ color: iconColor }}>
                    Registration
                  </StyledText>
                  <StyledText variant="bodyMedium" style={{ color: textColor, fontWeight: "500" }}>
                    {(vehicle.licence || vehicle.registration_number || "").toUpperCase() || "N/A"}
                  </StyledText>
                </View>
              </View>

            </View>
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: cardBackgroundColor, borderColor }]}>
          <StyledText variant="titleMedium" style={[styles.sectionTitle, { color: textColor }]}>
            Service statistics
          </StyledText>

          <View style={styles.statsGrid}>
            <View style={[styles.statCard, { backgroundColor }]}>
              <View style={[styles.statIconContainer, { backgroundColor: `${primaryColor}15` }]}>
                <Ionicons name="calendar-outline" size={24} color={primaryColor} />
              </View>
              <StyledText variant="headlineSmall" style={{ color: textColor, fontWeight: "700" }}>
                {vehicleStats.total_bookings ?? 0}
              </StyledText>
              <StyledText variant="bodySmall" style={{ color: iconColor }}>
                Total bookings
              </StyledText>
            </View>

            <View style={[styles.statCard, { backgroundColor }]}>
              <View style={[styles.statIconContainer, { backgroundColor: "#28a74515" }]}>
                <Ionicons name="cash-outline" size={24} color="#28a745" />
              </View>
              <StyledText variant="headlineSmall" style={{ color: textColor, fontWeight: "700" }}>
                {formatCurrency(vehicleStats.total_amount ?? 0)}
              </StyledText>
              <StyledText variant="bodySmall" style={{ color: iconColor }}>
                Total spent
              </StyledText>
            </View>
          </View>

          <View style={styles.statsGrid}>
            <View style={[styles.statCard, { backgroundColor }]}>
              <View style={[styles.statIconContainer, { backgroundColor: "#ffc10715" }]}>
                <Ionicons name="time-outline" size={24} color="#ffc107" />
              </View>
              <StyledText variant="bodyLarge" style={{ color: textColor, fontWeight: "600" }}>
                {vehicleStats.last_cleaned ? formatDate(vehicleStats.last_cleaned) : "Never"}
              </StyledText>
              <StyledText variant="bodySmall" style={{ color: iconColor }}>
                Last cleaned
              </StyledText>
            </View>

            <View style={[styles.statCard, { backgroundColor }]}>
              <View style={[styles.statIconContainer, { backgroundColor: "#dc354515" }]}>
                <Ionicons name="notifications-outline" size={24} color="#dc3545" />
              </View>
              <StyledText variant="bodyLarge" style={{ color: textColor, fontWeight: "600" }}>
                {vehicleStats.next_recommended_service
                  ? formatDate(vehicleStats.next_recommended_service)
                  : "Not scheduled"}
              </StyledText>
              <StyledText variant="bodySmall" style={{ color: iconColor }}>
                Next service
              </StyledText>
            </View>
          </View>
        </View>

        <VehicleRecordSection stats={vehicleStats} vehicleId={vehicle.id} />

        <VehicleInspectionSection inspection={vehicleStats.latest_inspection} />

        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  card: {
    margin: 10,
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  imageContainer: {
    marginHorizontal: -12,
    marginTop: -12,
    marginBottom: 16,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    overflow: "hidden",
  },
  vehicleImage: {
    width: "100%",
    height: 280,
  },
  placeholderImage: {
    width: "100%",
    height: 200,
    justifyContent: "center",
    alignItems: "center",
  },
  vehicleTitleSection: {
    marginTop: 8,
  },
  vehicleTitle: {
    fontWeight: "700",
    marginBottom: 16,
  },
  vehicleInfoGrid: {
    gap: 16,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  infoItemText: {
    flex: 1,
  },
  sectionTitle: {
    fontWeight: "600",
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
});
