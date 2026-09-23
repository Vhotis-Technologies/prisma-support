/**
 * Public API / WebSocket origins for the desk SPA.
 *
 * Vite bakes ``VITE_API_URL`` / ``VITE_WS_URL`` at build time. Production compose
 * used to omit ``VITE_WS_URL``, so the bundle fell back to ``ws://localhost:8002``.
 * If the baked value is missing or still localhost while the page is on a live
 * desk/support host, resolve to the matching public API origin instead.
 */

function stripSlash(url: string): string {
  return url.replace(/\/$/, "");
}

function isLoopback(url: string): boolean {
  try {
    const host = new URL(url).hostname;
    return host === "localhost" || host === "127.0.0.1";
  } catch {
    return false;
  }
}

function httpToWs(httpUrl: string): string {
  return httpUrl.replace(/^https:/i, "wss:").replace(/^http:/i, "ws:");
}

function hostApiOrigin(): string | null {
  if (typeof window === "undefined") return null;
  const host = window.location.hostname;
  if (host === "desk.prismavalet.com" || host === "support.prismavalet.com") {
    return "https://support.prismavalet.com";
  }
  if (
    host === "staging.desk.prismavalet.com" ||
    host === "staging.support.prismavalet.com"
  ) {
    return "https://staging.support.prismavalet.com";
  }
  return null;
}

export function resolveApiBaseUrl(): string {
  const baked = stripSlash(String(import.meta.env.VITE_API_URL || ""));
  const fromHost = hostApiOrigin();
  if (fromHost && (!baked || isLoopback(baked))) {
    return fromHost;
  }
  return baked || "http://localhost:8002";
}

export function resolveWsBaseUrl(): string {
  const baked = stripSlash(String(import.meta.env.VITE_WS_URL || ""));
  const fromHost = hostApiOrigin();
  if (fromHost && (!baked || isLoopback(baked))) {
    return httpToWs(fromHost);
  }
  if (baked) return baked;
  return httpToWs(resolveApiBaseUrl());
}

export function jwtExpiresSoon(token: string, skewMs = 30_000): boolean {
  try {
    const payload = JSON.parse(atob(token.split(".")[1] || ""));
    return typeof payload.exp !== "number" || payload.exp * 1000 <= Date.now() + skewMs;
  } catch {
    return true;
  }
}
