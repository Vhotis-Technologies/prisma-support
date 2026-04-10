/**
 * Registers the device Expo push token with the support backend.
 *
 * **Pattern:** matches the consumer `prisma_client` app — POST token via
 * `save_notification_token` once per session. Deduplication uses in-memory
 * `tokenSaved` / `isSavingToken` only (token is not stored in SecureStore).
 */
import { useState, useEffect } from "react";
import { useSaveNotificationTokenMutation } from "@/app/store/api/notificationApi";
import { useNotificationService } from "@/app/services/useNotificationService";

export const useNotification = (): {
  saveNotificationToken: (token: string) => Promise<boolean>;
  expoPushToken: string | undefined;
  tokenSaved: boolean;
  isSavingToken: boolean;
} => {
  const { expoPushToken } = useNotificationService();
  const [tokenSaved, setTokenSaved] = useState(false);
  const [isSavingToken, setIsSavingToken] = useState(false);
  const [saveNotificationTokenMutation] = useSaveNotificationTokenMutation();

  const saveNotificationToken = async (token: string): Promise<boolean> => {
    try {
      if (!token || tokenSaved || isSavingToken) {
        return false;
      }

      setIsSavingToken(true);
      const result = await saveNotificationTokenMutation({ token }).unwrap();

      if (result.success) {
        setTokenSaved(true);
        return true;
      }
      return false;
    } catch {
      return false;
    } finally {
      setIsSavingToken(false);
    }
  };

  useEffect(() => {
    if (expoPushToken && !tokenSaved) {
      saveNotificationToken(expoPushToken);
    }
  }, [expoPushToken, tokenSaved]);

  return {
    saveNotificationToken,
    expoPushToken,
    tokenSaved,
    isSavingToken,
  };
};
