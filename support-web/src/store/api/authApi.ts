/** Login, refresh, me, and password reset. No public signup UI. */
import { SUPPORT_API } from "../../lib/routes";
import type {
  LoginRequest,
  LoginResponse,
  PatchMeNotificationsRequest,
  RefreshTokenResponse,
  RegisterSupportRequest,
  RegisterSupportResponse,
  ResetPasswordResponse,
  SupportUserPayload,
  ValidateResetTokenResponse,
} from "../../types/user";
import { getData, patchData, postData } from "./client";

export function login(body: LoginRequest) {
  return postData<LoginResponse>(SUPPORT_API.login, {
    email: body.email.trim().toLowerCase(),
    password: body.password,
  });
}

export function refreshAccessToken(refresh: string) {
  return postData<RefreshTokenResponse>(SUPPORT_API.refresh, { refresh });
}

export function registerSupport(body: RegisterSupportRequest) {
  return postData<RegisterSupportResponse>(SUPPORT_API.register, {
    credentials: {
      email: body.email,
      password: body.password,
      first_name: body.first_name,
      last_name: body.last_name,
      gender: body.gender,
      ...(body.dob ? { dob: body.dob } : {}),
    },
  });
}

export function getMe() {
  return getData<SupportUserPayload>(SUPPORT_API.me);
}

export function patchMeNotifications(body: PatchMeNotificationsRequest) {
  return patchData<SupportUserPayload>(SUPPORT_API.me, body);
}

export function requestPasswordReset(email: string) {
  return postData<{ message: string }>(SUPPORT_API.passwordReset, { email });
}

export function validateResetToken(token: string) {
  return postData<ValidateResetTokenResponse>(SUPPORT_API.validateResetToken, {
    token,
  });
}

export function resetPassword(token: string, password: string) {
  return postData<ResetPasswordResponse>(SUPPORT_API.resetPassword, {
    token,
    password,
  });
}
