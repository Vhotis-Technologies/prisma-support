/**
 * Decode JWT expiry and refresh the support access token for websocket + REST.
 */
import * as SecureStore from "expo-secure-store";
import { setTokens } from "@/app/store/slices/authSlice";
import { persistAuthTokens } from "@/app/store/authTokens";
import type { AppDispatch } from "@/app/store/main_store";

export function isAccessTokenFresh(token: string | null | undefined, skewMs = 30_000): boolean {
  if (!token) return false;
  try {
    const payload = JSON.parse(atob(token.split(".")[1] || ""));
    return typeof payload.exp === "number" && payload.exp * 1000 > Date.now() + skewMs;
  } catch {
    return false;
  }
}

export async function ensureSupportAccessToken(options: {
  apiUrl: string | undefined;
  access: string | null | undefined;
  refresh: string | null | undefined;
  dispatch: AppDispatch;
}): Promise<string | null> {
  const { apiUrl, access, refresh, dispatch } = options;
  if (isAccessTokenFresh(access)) {
    return access ?? null;
  }
  if (!apiUrl || !refresh) {
    return access || null;
  }
  try {
    const response = await fetch(`${apiUrl.replace(/\/$/, "")}/api/v1/authentication/refresh/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh }),
    });
    if (!response.ok) {
      return access || null;
    }
    const data = (await response.json()) as { access?: string; refresh?: string };
    if (!data.access) {
      return access || null;
    }
    const nextRefresh = data.refresh || refresh;
    dispatch(setTokens({ access: data.access, refresh: nextRefresh }));
    try {
      const hadPersisted = !!(await SecureStore.getItemAsync("refresh"));
      if (hadPersisted) {
        await persistAuthTokens(data.access, nextRefresh);
      }
    } catch {
      /* SecureStore unavailable on some web previews */
    }
    return data.access;
  } catch {
    return access || null;
  }
}
