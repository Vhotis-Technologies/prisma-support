/**
 * Typed GET/POST/PATCH/DELETE helpers over the shared axios instance.
 * Feature modules (`bookingApi`, `customerApi`, …) wrap `SUPPORT_API` paths only.
 *
 * @module store/api/client
 */
import type { AxiosRequestConfig } from "axios";
import { api, getApiBaseUrl } from "../../lib/api";
import { SUPPORT_API } from "../../lib/routes";

export { api, getApiBaseUrl };

export async function getHealth(): Promise<string> {
  const { data } = await api.get<string>(SUPPORT_API.health, { responseType: "text" });
  return data;
}

export async function getData<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
  const { data } = await api.get<T>(url, config);
  return data;
}

export async function postData<T>(url: string, body?: unknown, config?: AxiosRequestConfig): Promise<T> {
  const { data } = await api.post<T>(url, body, config);
  return data;
}

export async function patchData<T>(url: string, body?: unknown, config?: AxiosRequestConfig): Promise<T> {
  const { data } = await api.patch<T>(url, body, config);
  return data;
}

export async function deleteData<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
  const { data } = await api.delete<T>(url, config);
  return data;
}
