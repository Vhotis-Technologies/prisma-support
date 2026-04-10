/**
 * Auth persistence: Redux holds the active session; SecureStore mirrors it only when "Remember me" is on
 * (same idea as the client app). Rehydrate from SecureStore on launch only when tokens + user were persisted.
 */
import { useLoginMutation } from "@/app/store/api/authApi";
import {
  clearAuthTokens,
  persistAuthTokens,
  persistAuthUser,
} from "@/app/store/authTokens";
import { useAppDispatch } from "@/app/store/main_store";
import { clearSession, setSession } from "@/app/store/slices/authSlice";
import { router, type Href } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { createContext, useContext, useEffect } from "react";
import { useAlertContext } from "./AlertContext";

interface AuthContextType {
  handleLogin: (
    email: string,
    password: string,
    rememberMe: boolean,
  ) => Promise<void>;
  handleLogout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AuthContextProvider = ({ children }: { children: React.ReactNode }) => {
  const dispatch = useAppDispatch();
  const { setAlertConfig, setIsVisible } = useAlertContext();
  const [loginRequest] = useLoginMutation();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const storedAccess = await SecureStore.getItemAsync("access");
      const storedRefresh = await SecureStore.getItemAsync("refresh");
      const userJson = await SecureStore.getItemAsync("user");
      if (!cancelled && storedAccess && storedRefresh && userJson) {
        try {
          dispatch(
            setSession({
              access: storedAccess,
              refresh: storedRefresh,
              user: JSON.parse(userJson),
            }),
          );
          router.replace("/main/dashboard/DashboardScreen" as Href);
        } catch {
          await clearAuthTokens();
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [dispatch]);

  const handleLogout = async () => {
    setAlertConfig({
      title: "Logout",
      message: "Are you sure you want to logout?",
      type: "success",
      isVisible: true,
      onConfirm: async () => {
        dispatch(clearSession());
        await clearAuthTokens();
        router.replace("/" as Href);
      },
      onClose: () => {
        setIsVisible(false);
      },
    });
  };

  const handleLogin = async (
    email: string,
    password: string,
    rememberMe: boolean,
  ) => {
    try {
      const result = await loginRequest({
        email: email.trim().toLowerCase(),
        password,
      }).unwrap();

      dispatch(
        setSession({
          access: result.access,
          refresh: result.refresh,
          user: result.user ?? null,
        }),
      );

      if (rememberMe) {
        await persistAuthTokens(result.access, result.refresh);
        if (result.user) {
          await persistAuthUser(result.user);
        }
      } else {
        await clearAuthTokens();
      }

      router.replace("/main/dashboard/DashboardScreen" as Href);
    } catch (e) {
      const message =
        e &&
        typeof e === "object" &&
        "data" in e &&
        typeof (e as { data: unknown }).data === "object" &&
        (e as { data: { detail?: string } }).data != null &&
        typeof (e as { data: { detail?: string } }).data.detail === "string"
          ? (e as { data: { detail: string } }).data.detail
          : "Sign in failed.";
      setAlertConfig({
        isVisible: true,
        title: "Sign in failed",
        message,
        type: "error",
        onClose() {
          setIsVisible(false);
          router.replace("/onboarding/SigninScreen" as Href);
        },
      });
    }
  };

  const value = {
    handleLogin,
    handleLogout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuthContext = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error(
      "useAuthContext must be used within an AuthContextProvider",
    );
  }
  return context;
};

export default AuthContextProvider;
