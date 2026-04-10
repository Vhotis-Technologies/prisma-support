import { StyleSheet, Text, View, Linking } from "react-native";
import React, { useState } from "react";
import { useThemeColor } from "@/hooks/useThemeColor";
import StyledButton from "@/app/components/helpers/StyledButton";
import { usePermissions } from "@/app/services/usePermissions";
import { useNotification } from "@/app/app_hooks/useNotification";
import StyledText from "@/app/components/helpers/StyledText";
import { Snackbar } from "react-native-paper";

const AllowNotificationModal = ({
  onClose,
  onPermissionGranted,
}: {
  onClose: () => void;
  onPermissionGranted?: () => void;
}) => {
  const backgroundColor = useThemeColor({}, "background");
  const cardColor = useThemeColor({}, "cards");
  const textColor = useThemeColor({}, "text");
  const borderColor = useThemeColor({}, "borders");
  const primaryColor = useThemeColor({}, "primary");
  const { requestNotificationPermission, permissionStatus } = usePermissions();
  const { saveNotificationToken, expoPushToken, isSavingToken } =
    useNotification();

  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");

  const canAskAgain = permissionStatus.notifications.canAskAgain;

  const handleEnableNotifications = async () => {
    try {
      const granted = await requestNotificationPermission();

      if (granted) {
        if (expoPushToken) {
          await saveNotificationToken(expoPushToken);
        }

        setSnackbarMessage("Notifications enabled successfully!");
        setSnackbarVisible(true);
        onPermissionGranted?.();

        setTimeout(() => {
          onClose();
        }, 2000);
      } else {
        setSnackbarMessage(
          "Permission was previously denied. Please enable notifications in your device settings, then restart the app.",
        );
        setSnackbarVisible(true);

        setTimeout(() => {
          onClose();
        }, 4000);
      }
    } catch (error) {
      console.error("Error requesting notification permission:", error);
      setSnackbarMessage(
        "Error requesting permission. Please try again or enable in device settings.",
      );
      setSnackbarVisible(true);

      setTimeout(() => {
        onClose();
      }, 3000);
    }
  };

  const handleNotNow = () => {
    onClose();
  };

  return (
    <View style={[styles.content, { backgroundColor }]}>
      <View style={[styles.iconContainer, { backgroundColor }]}>
        <Text style={[styles.icon, { color: primaryColor }]}>🔔</Text>
      </View>

      <StyledText style={[styles.title]} variant="titleLarge">
        Stay in the loop
      </StyledText>

      <StyledText style={[styles.description]} variant="bodyMedium">
        Get alerts for new tickets, bookings, and updates while you are on the
        move.
      </StyledText>

      <StyledText style={[styles.helpText]} variant="bodySmall">
        {canAskAgain
          ? "When you tap Enable notifications, your device will ask for permission. Tap Allow to receive push alerts."
          : "Notification permission was denied before. Enable notifications in device settings to receive updates."}
      </StyledText>

      <View style={styles.buttonContainer}>
        {canAskAgain ? (
          <>
            <StyledButton
              title={isSavingToken ? "Setting up…" : "Enable notifications"}
              variant="medium"
              onPress={handleEnableNotifications}
              style={styles.enableButton}
              disabled={isSavingToken}
            />
            <StyledButton
              title="Not now"
              variant="medium"
              onPress={handleNotNow}
              style={[styles.notNowButton, { borderColor }]}
            />
          </>
        ) : (
          <>
            <StyledButton
              title="Open settings"
              variant="medium"
              onPress={async () => {
                try {
                  await Linking.openSettings();
                } catch (error) {
                  console.error("Error opening settings:", error);
                  setSnackbarMessage(
                    "Could not open settings. Please open device settings manually.",
                  );
                  setSnackbarVisible(true);
                }
              }}
              style={[styles.enableButton, { backgroundColor: primaryColor }]}
            />
            <StyledButton
              title="Cancel"
              variant="medium"
              onPress={handleNotNow}
              style={[styles.notNowButton, { borderColor }]}
            />
          </>
        )}
      </View>

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
      >
        {snackbarMessage}
      </Snackbar>
    </View>
  );
};

export default AllowNotificationModal;

const styles = StyleSheet.create({
  content: {
    width: "100%",
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  icon: {
    fontSize: 40,
  },
  title: {
    textAlign: "center",
    marginBottom: 12,
  },
  description: {
    textAlign: "center",
    marginBottom: 16,
  },
  helpText: {
    textAlign: "center",
    marginBottom: 24,
    fontStyle: "italic",
    opacity: 0.8,
  },
  buttonContainer: {
    width: "100%",
    gap: 12,
  },
  enableButton: {
    width: "100%",
  },
  notNowButton: {
    width: "100%",
  },
});
