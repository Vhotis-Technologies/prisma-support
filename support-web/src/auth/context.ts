/** Auth context + hook (kept out of AuthProvider for Fast Refresh). */
import { createContext, useContext } from "react";
import type { SupportUserPayload } from "../types/user";

export type AuthContextValue = {
  user: SupportUserPayload | null;
  isAuthenticated: boolean;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  completePasswordReset: (token: string, password: string) => Promise<void>;
  updateUser: (user: SupportUserPayload) => void;
  logout: () => void;
};

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
