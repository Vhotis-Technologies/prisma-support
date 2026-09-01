import axios from "axios";

/** Fetch lifecycle used by page hooks. Never set `loading` inside `useEffect` — key a cache by id. */
export type LoadState<T> =
  | { status: "loading" }
  | { status: "ok"; data: T }
  | { status: "error"; message: string };

/** Transient success/error copy shown in a page banner after a mutation. */
export type Notice = { type: "ok" | "error"; message: string };

export function loadError(err: unknown, fallback: string): string {
  if (axios.isAxiosError(err)) {
    const body = err.response?.data as { error?: string; detail?: string } | undefined;
    if (body?.error) return String(body.error);
    if (body?.detail) return String(body.detail);
    return `${fallback} (${err.response?.status ?? "network"})`;
  }
  return fallback;
}

