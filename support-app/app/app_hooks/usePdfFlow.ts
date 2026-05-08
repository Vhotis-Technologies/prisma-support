/**
 * Authenticated PDF download from support API: fetch, optional token refresh, cache file, share sheet.
 */
import { useCallback, useState } from "react";
import axios from "axios";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import * as SecureStore from "expo-secure-store";
import { API_CONFIG } from "@/constants/Config";
import { persistAuthTokens } from "@/app/store/authTokens";

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]!);
  }
  return globalThis.btoa(binary);
}

async function refreshAccessToken(): Promise<string | null> {
  const refresh = await SecureStore.getItemAsync("refresh");
  if (!refresh) return null;
  const base = API_CONFIG.supportAppUrl?.replace(/\/$/, "") ?? "";
  if (!base) return null;
  try {
    const { data } = await axios.post<{ access: string; refresh: string }>(
      `${base}/api/v1/authentication/refresh/`,
      { refresh },
    );
    const access = data.access;
    const newRefresh = data.refresh;
    await persistAuthTokens(access, newRefresh);
    return access;
  } catch {
    return null;
  }
}

export function usePdfFlow() {
  const [pdfBusy, setPdfBusy] = useState(false);

  const downloadAccountingMonthPdf = useCallback(
    async (year: number, month: number, status: string = "succeeded") => {
      const base = API_CONFIG.supportAppUrl?.replace(/\/$/, "") ?? "";
      if (!base) {
        throw new Error("Support API URL is not configured");
      }

      const url = `${base}/api/v1/accounting/export_month_pdf/?year=${year}&month=${month}&status=${encodeURIComponent(status)}`;

      let access = await SecureStore.getItemAsync("access");

      const fetchPdf = async (token: string | null) =>
        axios.get<ArrayBuffer>(url, {
          responseType: "arraybuffer",
          headers: {
            // DRF APIView only negotiates JSON-like renderers; */* lets negotiation succeed while we still read PDF bytes from HttpResponse.
            Accept: "*/*",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          validateStatus: () => true,
        });

      setPdfBusy(true);
      try {
        let res = await fetchPdf(access);
        if (res.status === 401) {
          access = await refreshAccessToken();
          if (!access) {
            throw new Error("Session expired; please sign in again.");
          }
          res = await fetchPdf(access);
        }

        if (res.status !== 200) {
          let detail = `HTTP ${res.status}`;
          try {
            const decoder = new TextDecoder();
            detail = decoder.decode(res.data as ArrayBuffer).slice(0, 400);
          } catch {
            /* ignore */
          }
          throw new Error(detail || "Could not download PDF");
        }

        const filename = `accounting_${year}_${String(month).padStart(2, "0")}.pdf`;
        const dir = FileSystem.cacheDirectory ?? "";
        const dest = `${dir}${filename}`;

        const buf = res.data as unknown as ArrayBuffer;
        const b64 = arrayBufferToBase64(buf);
        await FileSystem.writeAsStringAsync(dest, b64, {
          encoding: FileSystem.EncodingType.Base64,
        });

        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(dest, {
            mimeType: "application/pdf",
            UTI: "com.adobe.pdf",
          });
        }
      } finally {
        setPdfBusy(false);
      }
    },
    [],
  );

  return { downloadAccountingMonthPdf, pdfBusy };
}
