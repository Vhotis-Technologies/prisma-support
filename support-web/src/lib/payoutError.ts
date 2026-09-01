import axios from "axios";
import { loadError } from "./load";

/** Payout saves can 500 after the transfer is recorded — keep the app's cautionary copy. */
export function payoutError(err: unknown, fallback: string): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data;
    if (
      typeof data === "string" &&
      (data.includes("<!DOCTYPE html>") || data.includes("Server Error"))
    ) {
      return "Server error while saving. Check detailer logs — the payment may still have been recorded.";
    }
    if (err.response?.status === 500) {
      return "Server error while saving. Check detailer logs — the payment may still have been recorded.";
    }
  }
  return loadError(err, fallback);
}
