/**
 * Session owner only. Context + `useAuth` live in `context.ts` so Fast Refresh
 * can remount this provider without dropping the hook export.
 */
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  clearSession,
  getStoredUser,
  hasSession,
  SESSION_CLEARED_EVENT,
  setSession,
  setStoredUser,
  type SetSessionOptions,
} from "../lib/authStorage";
import * as authApi from "../store/api/authApi";
import type { LoginResponse, SupportUserPayload } from "../types/user";
import { AuthContext } from "./context";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SupportUserPayload | null>(() =>
    hasSession() ? getStoredUser() : null,
  );

  useEffect(() => {
    const onCleared = () => setUser(null);
    window.addEventListener(SESSION_CLEARED_EVENT, onCleared);
    return () => window.removeEventListener(SESSION_CLEARED_EVENT, onCleared);
  }, []);

  const applySession = useCallback(async (data: LoginResponse, options?: SetSessionOptions) => {
    if (!data.access || !data.refresh) {
      throw new Error("Invalid auth response");
    }
    if (data.user) {
      setSession(data.access, data.refresh, data.user, options);
      setUser(data.user);
      return;
    }
    setSession(data.access, data.refresh, undefined, options);
    const me = await authApi.getMe();
    setSession(data.access, data.refresh, me, options);
    setUser(me);
  }, []);

  useEffect(() => {
    if (!hasSession() || getStoredUser()) return;
    let cancelled = false;
    void authApi
      .getMe()
      .then((me) => {
        if (cancelled) return;
        setStoredUser(me);
        setUser(me);
      })
      .catch(() => {
        if (cancelled) return;
        clearSession();
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(
    async (email: string, password: string, rememberMe = false) => {
      await applySession(await authApi.login({ email, password }), { persist: rememberMe });
    },
    [applySession],
  );

  const completePasswordReset = useCallback(
    async (token: string, password: string) => {
      await applySession(await authApi.resetPassword(token, password), { persist: true });
    },
    [applySession],
  );

  const logout = useCallback(() => {
    clearSession();
    setUser(null);
  }, []);

  const updateUser = useCallback((next: SupportUserPayload) => {
    setStoredUser(next);
    setUser(next);
  }, []);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user && hasSession()),
      login,
      completePasswordReset,
      updateUser,
      logout,
    }),
    [user, login, completePasswordReset, updateUser, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
