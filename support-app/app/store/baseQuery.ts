/**
 * Axios-based base query for RTK Query: auth header, token refresh, public endpoint list.
 * Used by all createApi modules in store/api.
 */
import type { BaseQueryFn } from "@reduxjs/toolkit/query/react";
import axios, { AxiosRequestConfig, AxiosResponse, AxiosError } from "axios";
import * as SecureStore from "expo-secure-store";
import { API_CONFIG } from "@/constants/Config";
import { Platform } from "react-native";
import { setTokens } from "@/app/store/slices/authSlice";
import { persistAuthTokens } from "@/app/store/authTokens";

function readAuthFromState(api: { getState: () => unknown }): {
  access: string | null;
  refresh: string | null;
} {
  const state = api.getState() as {
    auth?: { access: string | null; refresh: string | null };
  };
  return {
    access: state.auth?.access ?? null,
    refresh: state.auth?.refresh ?? null,
  };
}

async function applyRefreshedTokens(
  api: { dispatch: (action: unknown) => unknown },
  newAccess: string,
  newRefresh: string,
) {
  const hadPersistedRefresh = !!(await SecureStore.getItemAsync("refresh"));
  api.dispatch(setTokens({ access: newAccess, refresh: newRefresh }));
  if (hadPersistedRefresh) {
    await persistAuthTokens(newAccess, newRefresh);
  }
}

const baseURL = API_CONFIG.supportAppUrl?.replace(/\/$/, "") ?? "";

const axiosInstance = axios.create({
  baseURL,
  timeout: 30000,
});

const publicEndpoints = [
  "/api/v1/authentication/login/",
  "/api/v1/authentication/refresh/",
  "/api/v1/onboard/create_new_account/",
];

export const axiosBaseQuery = (): BaseQueryFn => {
  
  return async ({ url, method, data, params, headers }, api, extraOptions) => {
    try {
      const { access: accessFromState } = readAuthFromState(api);
      const access =
        accessFromState || (await SecureStore.getItemAsync("access"));

      // Check if data is FormData (React Native compatible check)
      const isFormData =
        data instanceof FormData ||
        (data &&
          typeof data === "object" &&
          data.constructor &&
          data.constructor.name === "FormData") ||
        (data && typeof data === "object" && "_parts" in data);

      // For FormData in React Native, use fetch API instead of axios
      // Axios has issues with React Native FormData serialization
      if (isFormData && Platform.OS !== "web") {
        // Build URL with params
        let fullUrl = `${baseURL}${url}`;
        if (params) {
          const queryString = new URLSearchParams(params as any).toString();
          fullUrl += `?${queryString}`;
        }

        // Build headers
        const requestHeaders: HeadersInit = {};
        if (access && !publicEndpoints.includes(url || "")) {
          requestHeaders.Authorization = `Bearer ${access}`;
        }
        // Don't set Content-Type - fetch will set it automatically with boundary

        const response = await fetch(fullUrl, {
          method: method || "GET",
          headers: requestHeaders,
          body: data as FormData,
        });

        if (!response.ok) {
          let errorData;
          try {
            errorData = await response.json();
          } catch {
            errorData = await response.text();
          }

          // Handle 401 errors with token refresh (skip for public auth endpoints)
          if (response.status === 401 && !publicEndpoints.includes(url || "")) {
            try {
              const { refresh: refreshFromState } = readAuthFromState(api);
              const refreshToken =
                refreshFromState ||
                (await SecureStore.getItemAsync("refresh"));

              if (!refreshToken) {
                // api.dispatch(setIsAuthenticated(false));
                return {
                  error: {
                    status: 401,
                    data: "Authentication failed - no refresh token",
                  },
                };
              }

              // Try to refresh the token using axios
              const refreshResponse = await axiosInstance.post(
                "/api/v1/authentication/refresh/",
                {
                  refresh: refreshToken,
                }
              );

              const { access: newAccess, refresh: newRefresh } =
                refreshResponse.data;
              await applyRefreshedTokens(api, newAccess, newRefresh);

              const retryHeaders: HeadersInit = {
                Authorization: `Bearer ${newAccess}`,
              };

              const retryResponse = await fetch(fullUrl, {
                method: method || "GET",
                headers: retryHeaders,
                body: data as FormData,
              });

              if (!retryResponse.ok) {
                let retryErrorData;
                try {
                  retryErrorData = await retryResponse.json();
                } catch {
                  retryErrorData = await retryResponse.text();
                }
                return {
                  error: {
                    status: retryResponse.status,
                    data: retryErrorData,
                  },
                };
              }

              let retryResponseData;
              try {
                retryResponseData = await retryResponse.json();
              } catch {
                retryResponseData = await retryResponse.text();
              }

              return {
                data: retryResponseData,
                meta: {
                  response: retryResponse,
                },
              };
            } catch (refreshError) {
              // If refresh fails, logout the user
              // api.dispatch(setIsAuthenticated(false));
              return {
                error: {
                  status: 401,
                  data: "Authentication failed",
                },
              };
            }
          }

          return {
            error: {
              status: response.status,
              data: errorData,
            },
          };
        }

        let responseData;
        try {
          responseData = await response.json();
        } catch {
          responseData = await response.text();
        }

        return {
          data: responseData,
          meta: {
            response: response,
          },
        };
      }

      // For non-FormData requests, use axios as before
      // Build headers with authentication if needed
      const requestHeaders = { ...headers };
      if (access && !publicEndpoints.includes(url || "")) {
        requestHeaders.Authorization = `Bearer ${access}`;
      }

      // Set Content-Type header based on data type
      if (data && typeof data === "object" && !requestHeaders["Content-Type"]) {
        requestHeaders["Content-Type"] = "application/json";
      }

      const config: AxiosRequestConfig = {
        url,
        method,
        data,
        params,
        headers: requestHeaders,
      };

      const response: AxiosResponse = await axiosInstance(config);

      return {
        data: response.data,
        meta: {
          response: response,
        },
      };
    } catch (error) {
      const axiosError = error as AxiosError;
      const isPublicEndpoint = publicEndpoints.includes(url || "");

      // Handle 401 errors with token refresh (not for login/register/refresh failures)
      if (axiosError.response?.status === 401 && !isPublicEndpoint) {
        try {
          const { refresh: refreshFromState } = readAuthFromState(api);
          const refreshToken =
            refreshFromState || (await SecureStore.getItemAsync("refresh"));

          if (!refreshToken) {
            // api.dispatch(setIsAuthenticated(false));
            return {
              error: {
                status: 401,
                data: "Authentication failed - no refresh token",
              },
            };
          }

          // Try to refresh the token
          const refreshResponse = await axiosInstance.post(
            "/api/v1/authentication/refresh/",
            {
              refresh: refreshToken,
            }
          );

          const { access: newAccess, refresh: newRefresh } =
            refreshResponse.data;
          await applyRefreshedTokens(api, newAccess, newRefresh);

          const retryHeaders = { ...headers };
          retryHeaders.Authorization = `Bearer ${newAccess}`;

          const retryConfig: AxiosRequestConfig = {
            url,
            method,
            data,
            params,
            headers: retryHeaders,
          };

          const retryResponse: AxiosResponse = await axiosInstance(retryConfig);

          return {
            data: retryResponse.data,
            meta: {
              response: retryResponse,
            },
          };
        } catch (refreshError) {
          // If refresh fails, logout the user
          // api.dispatch(setIsAuthenticated(false));
          return {
            error: {
              status: 401,
              data: "Authentication failed",
            },
          };
        }
      }

      // Return other errors as normal
      return {
        error: {
          status: axiosError.response?.status,
          data: axiosError.response?.data || axiosError.message,
        },
      };
    }
  };
};

export default axiosBaseQuery;
