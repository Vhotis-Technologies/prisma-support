/**
 * Shared axios client for the support Django API (`VITE_API_URL`, default :8002).
 *
 * Bearer tokens are attached except on `PUBLIC_PATH_PREFIXES`. A 401 retries once
 * after refresh; concurrent 401s share a single refresh call. Refresh uses a
 * raw axios POST so the interceptor cannot recurse.
 *
 * @module lib/api
 */
import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";
import {
  clearSession,
  getAccessToken,
  getRefreshToken,
  setSession,
} from "./authStorage";
import { PUBLIC_PATH_PREFIXES, SUPPORT_API } from "./routes";

const apiBaseUrl = (
  import.meta.env.VITE_API_URL || "http://localhost:8002"
).replace(/\/$/, "");

const usesNgrok =
  /ngrok(-free)?\.(app|dev|io)\b/i.test(apiBaseUrl) ||
  (typeof window !== "undefined" &&
    /ngrok(-free)?\.(app|dev|io)\b/i.test(window.location.hostname));
const ngrokHeaders = usesNgrok
  ? { "ngrok-skip-browser-warning": "true" }
  : {};

function isPublicPath(url: string | undefined): boolean {
  if (!url) return false;
  const path = url.startsWith("http") ? new URL(url).pathname : url;
  return PUBLIC_PATH_PREFIXES.some((prefix) => path.includes(prefix));
}

export const api = axios.create({
  baseURL: apiBaseUrl,
  timeout: 30000,
  headers: { "Content-Type": "application/json", ...ngrokHeaders },
});

api.interceptors.request.use((config) => {
  if (typeof FormData !== "undefined" && config.data instanceof FormData) {
    const headers = config.headers;
    if (headers && typeof headers.delete === "function") {
      headers.delete("Content-Type");
    } else if (headers) {
      delete headers["Content-Type"];
    }
  }
  const access = getAccessToken();
  if (access && !isPublicPath(config.url)) {
    config.headers.Authorization = `Bearer ${access}`;
  }
  return config;
});

let refreshPromise: Promise<string> | null = null;

async function refreshSessionAccessToken(): Promise<string> {
  const refresh = getRefreshToken();
  if (!refresh) {
    throw new Error("No refresh token");
  }
  const { data } = await axios.post<{ access: string; refresh?: string }>(
    `${apiBaseUrl}${SUPPORT_API.refresh}`,
    { refresh },
    { timeout: 30000, headers: ngrokHeaders },
  );
  setSession(data.access, data.refresh || refresh);
  return data.access;
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as
      | (InternalAxiosRequestConfig & { _retried?: boolean })
      | undefined;
    const status = error.response?.status;

    if (
      !original ||
      status !== 401 ||
      original._retried ||
      isPublicPath(original.url)
    ) {
      return Promise.reject(error);
    }

    original._retried = true;

    try {
      if (!refreshPromise) {
        refreshPromise = refreshSessionAccessToken().finally(() => {
          refreshPromise = null;
        });
      }
      const access = await refreshPromise;
      original.headers.Authorization = `Bearer ${access}`;
      return api(original);
    } catch {
      clearSession();
      return Promise.reject(error);
    }
  },
);

export function getApiBaseUrl(): string {
  return apiBaseUrl;
}
