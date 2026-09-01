/**
 * Read-only staff profile from GET `/api/v1/me/`, falling back to the cached session user.
 * The support app does not PATCH name/email/gender/dob — neither does web.
 *
 * @module app-hooks/useProfileFlow
 */
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../auth/context";
import { loadError, type Notice } from "../lib/load";
import { getMe } from "../store/api/authApi";
import type { SupportUserPayload } from "../types/user";

export function useProfileFlow() {
  const { user, updateUser } = useAuth();
  const [profile, setProfile] = useState<SupportUserPayload | null>(user);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void getMe()
      .then((me) => {
        if (cancelled) return;
        updateUser(me);
        setProfile(me);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setNotice({
          type: "error",
          message: loadError(err, "Could not refresh profile"),
        });
      });
    return () => {
      cancelled = true;
    };
  }, [updateUser]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setNotice(null);
    void getMe()
      .then((me) => {
        updateUser(me);
        setProfile(me);
      })
      .catch((err: unknown) => {
        setNotice({
          type: "error",
          message: loadError(err, "Could not refresh profile"),
        });
      })
      .finally(() => setRefreshing(false));
  }, [updateUser]);

  return {
    profile: profile ?? user,
    notice,
    clearNotice: () => setNotice(null),
    refreshing,
    onRefresh,
  };
}
