/**
 * Namespaced localStorage so prisma-web (`prisma.client.*`) and support-web
 * can share a browser without clobbering each other's JWT session.
 *
 * When "Remember me" is unchecked at login, tokens live in memory only (like
 * the mobile apps' SecureStore gate). Checked logins persist across browser restarts.
 *
 * `clearSession` also dispatches `SESSION_CLEARED_EVENT` so AuthProvider can
 * drop in-memory user state when the axios interceptor logs out.
 *
 * @module lib/authStorage
 */
import type { SupportUserPayload } from "../types/user";

const ACCESS_KEY = "prisma.support.access";
const REFRESH_KEY = "prisma.support.refresh";
const USER_KEY = "prisma.support.user";

export const SESSION_CLEARED_EVENT = "prisma.support:session-cleared";

export type SetSessionOptions = {
  persist?: boolean;
};

let memoryAccess: string | null = null;
let memoryRefresh: string | null = null;
let memoryUser: SupportUserPayload | null = null;
let sessionPersistent = false;

function hydrateFromLocalStorage(): void {
  const access = localStorage.getItem(ACCESS_KEY);
  const refresh = localStorage.getItem(REFRESH_KEY);
  if (!access || !refresh) return;

  memoryAccess = access;
  memoryRefresh = refresh;
  sessionPersistent = true;

  const rawUser = localStorage.getItem(USER_KEY);
  if (!rawUser) return;
  try {
    memoryUser = JSON.parse(rawUser) as SupportUserPayload;
  } catch {
    memoryUser = null;
  }
}

if (typeof window !== "undefined") {
  hydrateFromLocalStorage();
}

export function hasPersistedSession(): boolean {
  return sessionPersistent && Boolean(memoryAccess && memoryRefresh);
}

export function getAccessToken(): string | null {
  return memoryAccess;
}

export function getRefreshToken(): string | null {
  return memoryRefresh;
}

export function getStoredUser(): SupportUserPayload | null {
  return memoryUser;
}

export function hasSession(): boolean {
  return Boolean(memoryAccess && memoryRefresh);
}

export function setSession(
  access: string,
  refresh: string,
  user?: SupportUserPayload | null,
  options?: SetSessionOptions,
): void {
  const persist = options?.persist ?? sessionPersistent;
  sessionPersistent = persist;

  memoryAccess = access;
  memoryRefresh = refresh;
  if (user !== undefined && user !== null) {
    memoryUser = user;
  }

  if (persist) {
    localStorage.setItem(ACCESS_KEY, access);
    localStorage.setItem(REFRESH_KEY, refresh);
    if (user) {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    }
  } else {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem(USER_KEY);
  }
}

export function setStoredUser(user: SupportUserPayload): void {
  memoryUser = user;
  if (sessionPersistent) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }
}

export function clearSession(): void {
  memoryAccess = null;
  memoryRefresh = null;
  memoryUser = null;
  sessionPersistent = false;
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem(USER_KEY);
  window.dispatchEvent(new Event(SESSION_CLEARED_EVENT));
}
