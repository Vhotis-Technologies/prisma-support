/**
 * Auth state and sign-up types for login/register flows.
 */

export interface UserProfileProps {
  id?: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  gender: string;
  dob: string;
  allow_push_notifications: boolean;
  allow_email_notifications: boolean;
  allow_marketing_emails: boolean;
  notification_token: string;
  is_verified: boolean;
  is_support: boolean;
  is_admin: boolean;
  is_active: boolean;
}

export default interface AuthState {
  user?: UserProfileProps | null;
  access?: string;
  refresh?: string;
  isAuthenticated?: boolean;
  isLoading?: boolean;
  signUpData?: SignUpScreenProps;
}

export interface BusinessAddress {
  address: string;
  post_code: string;
  city: string;
  country: string;
  latitude: number;
  longitude: number;
}

export interface SignUpScreenProps {
  name: string;
  email: string;
  phone: string;
  password: string;
  referred_code?: string;
  isFleetOwner?: boolean;
  isDealership?: boolean;
  business_name?: string;
  business_address?: BusinessAddress;
}

export interface LoginScreenProps {
  email: string;
  password: string;
}
