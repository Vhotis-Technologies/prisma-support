/** Login / password-reset copy: 401 is credentials, 429 is rate-limit. */
import axios from "axios";

export function authErrorMessage(err: unknown, fallback: string): string {
  if (axios.isAxiosError(err)) {
    const status = err.response?.status;
    if (status === 401) {
      return "Email or password is incorrect.";
    }
    if (status === 429) {
      const limited = err.response?.data as { detail?: string; error?: string } | undefined;
      if (limited?.error) return String(limited.error);
      if (limited?.detail) return String(limited.detail);
      return "Too many attempts. Wait a minute and try again.";
    }
    const body = err.response?.data as { detail?: string; error?: string } | undefined;
    if (body?.error) return String(body.error);
    if (body?.detail) return String(body.detail);
  }
  return err instanceof Error ? err.message : fallback;
}

export function loginErrorMessage(err: unknown): string {
  return authErrorMessage(err, "Sign in failed.");
}
