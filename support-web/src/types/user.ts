export type SupportStaffRole = "admin" | "support";

export type SupportUserPayload = {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: SupportStaffRole;
  allow_email_notifications?: boolean;
  allow_push_notifications?: boolean;
  gender?: string | null;
  dob?: string | null;
};

export type PatchMeNotificationsRequest = {
  allow_email_notifications?: boolean;
  allow_push_notifications?: boolean;
};

export type LoginRequest = {
  email: string;
  password: string;
};

export type RegisterSupportRequest = {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  gender: "male" | "female";
  dob?: string;
};

export type AuthTokens = {
  access: string;
  refresh: string;
};

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

export type ValidateResetTokenResponse = {
  valid: boolean;
  message: string;
  expires_at: string;
  user_email: string;
};

export type RefreshTokenResponse = {
  access: string;
  refresh?: string;
};
