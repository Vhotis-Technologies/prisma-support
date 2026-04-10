import { createApi } from "@reduxjs/toolkit/query/react";
import axiosBaseQuery from "@/app/store/baseQuery";

export type SupportStaffRole = "admin" | "support";

export interface SupportUserPayload {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: SupportStaffRole;
  allow_email_notifications?: boolean;
  allow_push_notifications?: boolean;
  gender?: string | null;
  dob?: string | null;
}

export interface PatchMeNotificationsRequest {
  allow_email_notifications?: boolean;
  allow_push_notifications?: boolean;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterSupportRequest {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  gender: "male" | "female";
  dob?: string;
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

export type LoginResponse = AuthTokens & {
  user?: SupportUserPayload;
};

export type RegisterSupportResponse = AuthTokens & {
  user: SupportUserPayload;
};

export type ResetPasswordResponse = AuthTokens & {
  message: string;
  user: SupportUserPayload;
};

export const authApi = createApi({
  reducerPath: "authApi",
  baseQuery: axiosBaseQuery(),
  endpoints: (builder) => ({
    login: builder.mutation<LoginResponse, LoginRequest>({
      query: (body) => ({
        url: "/api/v1/authentication/login/",
        method: "POST",
        data: body,
      }),
    }),

    registerSupport: builder.mutation<
      RegisterSupportResponse,
      RegisterSupportRequest
    >({
      query: (body) => ({
        url: "/api/v1/onboard/create_new_account/",
        method: "POST",
        data: {
          credentials: {
            email: body.email,
            password: body.password,
            first_name: body.first_name,
            last_name: body.last_name,
            gender: body.gender,
            ...(body.dob ? { dob: body.dob } : {}),
          },
        },
      }),
    }),

    getMe: builder.query<SupportUserPayload, void>({
      query: () => ({
        url: "/api/v1/me/",
        method: "GET",
      }),
    }),

    patchMeNotifications: builder.mutation<
      SupportUserPayload,
      PatchMeNotificationsRequest
    >({
      query: (body) => ({
        url: "/api/v1/me/",
        method: "PATCH",
        data: body,
      }),
    }),

    requestPasswordReset: builder.mutation<
      { message: string },
      { email: string }
    >({
      query: ({ email }) => ({
        url: "/api/v1/auth/password-reset/",
        method: "POST",
        data: { email },
      }),
    }),

    validateResetToken: builder.mutation<
      {
        valid: boolean;
        message: string;
        expires_at: string;
        user_email: string;
      },
      { token: string }
    >({
      query: ({ token }) => ({
        url: "/api/v1/auth/validate-reset-token/",
        method: "POST",
        data: { token },
      }),
    }),

    resetPassword: builder.mutation<
      ResetPasswordResponse,
      { token: string; password: string }
    >({
      query: ({ token, password }) => ({
        url: "/api/v1/auth/reset-password/",
        method: "POST",
        data: { token, password },
      }),
    }),
  }),
});

export const {
  useLoginMutation,
  useRegisterSupportMutation,
  useGetMeQuery,
  usePatchMeNotificationsMutation,
  useRequestPasswordResetMutation,
  useValidateResetTokenMutation,
  useResetPasswordMutation,
} = authApi;
