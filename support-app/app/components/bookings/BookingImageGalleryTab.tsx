import React, { useState } from "react";
import {
  ActivityIndicator,
  Image,
  Linking,
  ScrollView,
  Share,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import StyledText from "@/app/components/helpers/StyledText";
import type { BookingImageItem } from "@/app/interfaces/BookingInterface";
import { useThemeColor } from "@/hooks/useThemeColor";

interface BookingImageGalleryTabProps {
  images: BookingImageItem[];
  /** Shown in share/download context when provided (parity with client ServiceImageGalleryTab) */
  bookingReference?: string;
}

export default function BookingImageGalleryTab({
  images,
  bookingReference,
}: BookingImageGalleryTabProps) {
  const [openingIds, setOpeningIds] = useState<Set<number>>(new Set());
  const [sharingIds, setSharingIds] = useState<Set<number>>(new Set());

  const cardColor = useThemeColor({}, "cards");
  const borderColor = useThemeColor({}, "borders");
  const textColor = useThemeColor({}, "text");
  const iconColor = useThemeColor({}, "icons");
  const backgroundColor = useThemeColor({}, "background");

  const formatDateTime = (dateString: string) => {
    if (!dateString || dateString.trim() === "") {
      return "N/A";
    }
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) {
      return "Invalid Date";
    }
    return date.toLocaleString("en-IE", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleOpenImage = async (imageUrl: string, imageId: number) => {
    setOpeningIds((prev) => new Set(prev).add(imageId));
    try {
      const can = await Linking.canOpenURL(imageUrl);
      if (can) await Linking.openURL(imageUrl);
    } catch (e) {
      console.warn("Open image failed:", e);
    } finally {
      setOpeningIds((prev) => {
        const next = new Set(prev);
        next.delete(imageId);
        return next;
      });
    }
  };

  const handleShare = async (imageUrl: string, imageId: number) => {
    setSharingIds((prev) => new Set(prev).add(imageId));
    try {
      await Share.share({
        url: imageUrl,
        message: bookingReference
          ? `Booking ${bookingReference} — image`
          : "Booking image",
      });
    } catch (e) {
      console.warn("Share failed:", e);
    } finally {
      setSharingIds((prev) => {
        const next = new Set(prev);
        next.delete(imageId);
        return next;
      });
    }
  };

  if (images.length === 0) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor }]}>
        <Ionicons name="images-outline" size={64} color={iconColor} />
        <StyledText
          variant="titleMedium"
          style={[styles.emptyTitle, { color: textColor }]}
        >
          No Images Available
        </StyledText>
        <StyledText
          variant="bodyMedium"
          style={[styles.emptyDescription, { color: textColor }]}
        >
          There are no images in this category.
        </StyledText>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
      nestedScrollEnabled
    >
      <View style={styles.grid}>
        {images.map((image) => {
          const isOpening = openingIds.has(image.id);
          const isSharing = sharingIds.has(image.id);

          return (
            <View
              key={image.id}
              style={[styles.imageCard, { backgroundColor: cardColor, borderColor }]}
            >
              <View style={styles.imageWrapper}>
                <Image
                  source={{ uri: image.image_url }}
                  style={styles.image}
                  resizeMode="cover"
                />
                <View style={styles.overlay}>
                  <View style={styles.buttonGroup}>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => handleOpenImage(image.image_url, image.id)}
                      disabled={isOpening}
                      activeOpacity={0.7}
                    >
                      {isOpening ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <MaterialIcons name="cloud-download" size={20} color="#FFFFFF" />
                      )}
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => handleShare(image.image_url, image.id)}
                      disabled={isSharing}
                      activeOpacity={0.7}
                    >
                      {isSharing ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <Ionicons name="share-outline" size={20} color="#FFFFFF" />
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
              <View style={styles.timestampContainer}>
                <Ionicons name="time-outline" size={12} color={iconColor} />
                <StyledText
                  variant="bodySmall"
                  style={[styles.timestampText, { color: textColor }]}
                >
                  Taken: {formatDateTime(image.created_at)}
                </StyledText>
              </View>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 8,
    paddingBottom: 20,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 5,
    justifyContent: "space-between",
  },
  imageCard: {
    width: "48%",
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
    marginBottom: 12,
  },
  imageWrapper: {
    width: "100%",
    aspectRatio: 1,
    position: "relative",
    overflow: "hidden",
  },
  image: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: "100%",
    height: "100%",
  },
  overlay: {
    position: "absolute",
    top: 8,
    right: 8,
  },
  buttonGroup: {
    flexDirection: "row",
    gap: 8,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  timestampContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    padding: 10,
    paddingTop: 8,
  },
  timestampText: {
    fontSize: 11,
    opacity: 0.8,
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  emptyTitle: {
    marginTop: 16,
    marginBottom: 8,
    fontWeight: "600",
  },
  emptyDescription: {
    textAlign: "center",
    opacity: 0.7,
  },
});
