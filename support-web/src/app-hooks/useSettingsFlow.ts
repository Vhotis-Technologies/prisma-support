/**
 * Settings: refresh GET `/api/v1/me/`, PATCH email notifications, confirm logout.
 * Push, marketing, theme, and location from the mobile app are omitted on web.
 *
 * @module app-hooks/useSettingsFlow
 */
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../auth/context";
import type { ConfirmRequest } from "../lib/confirm";
import { loadError, type Notice } from "../lib/load";
import { getMe, patchMeNotifications } from "../store/api/authApi";

export function useSettingsFlow() {
  const { user, updateUser, logout } = useAuth();
  const [notice, setNotice] = useState<Notice | null>(null);
  const [savingEmail, setSavingEmail] = useState(false);
  const [confirm, setConfirm] = useState<ConfirmRequest | null>(null);

  useEffect(() => {
    let cancelled = false;
    void getMe()
      .then((me) => {
        if (cancelled) return;
        updateUser(me);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setNotice({
          type: "error",
          message: loadError(err, "Could not refresh account prefs"),
        });
      });
    return () => {
      cancelled = true;
    };
  }, [updateUser]);

  const emailEnabled = user?.allow_email_notifications === true;

  const onToggleEmail = useCallback(
    (next: boolean) => {
      if (!user || savingEmail) return;
      const previous = user;
      updateUser({ ...user, allow_email_notifications: next });
      setSavingEmail(true);
      setNotice(null);
      void patchMeNotifications({ allow_email_notifications: next })
        .then((updated) => {
          updateUser(updated);
          setNotice({
            type: "ok",
            message: next ? "Email notifications on." : "Email notifications off.",
          });
        })
        .catch((err: unknown) => {
          updateUser(previous);
          setNotice({
            type: "error",
            message: loadError(err, "Could not update email preference. Try again."),
          });
        })
        .finally(() => setSavingEmail(false));
    },
    [savingEmail, updateUser, user],
  );

  const requestLogout = useCallback(() => {
    setConfirm({
      title: "Log out?",
      message: "You will need to sign in again to use this desk.",
      confirmLabel: "Log out",
      tone: "danger",
      onConfirm: () => {
        setConfirm(null);
        logout();
      },
    });
  }, [logout]);

  const clearConfirm = useCallback(() => setConfirm(null), []);

  return {
    user,
    emailEnabled,
    savingEmail,
    onToggleEmail,
    notice,
    clearNotice: () => setNotice(null),
    confirm,
    clearConfirm,
    requestLogout,
  };
}
