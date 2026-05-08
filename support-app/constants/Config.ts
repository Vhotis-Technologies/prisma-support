  /**
 * App config from Expo extra: Stripe key, API URLs (detailer, customer, websocket), Google API keys. Fallbacks for dev.
 */
import Constants from "expo-constants";

// Function to get config with fallbacks
const getConfig = () => {
  const config =
    Constants.expoConfig?.extra || (Constants.manifest as any)?.extra || {};
  return config;
};

const config = getConfig();

/** Baked at build time via app.config.js (EXPO_PUBLIC_APP_ENV) + eas.json per profile. */
export const APP_ENV =
  (config.appEnv as string | undefined) ||
  (typeof process !== "undefined" &&
    (process as { env?: { EXPO_PUBLIC_APP_ENV?: string } }).env
      ?.EXPO_PUBLIC_APP_ENV) ||
  "development";

export function getStripePublishableKey(): string | undefined {
  const stripe = config.stripe as
    | { publishableKey?: string; productionPublishableKey?: string }
    | undefined;
  if (!stripe) return undefined;
  if (APP_ENV === "production") {
    return stripe.productionPublishableKey || stripe.publishableKey;
  }
  return stripe.publishableKey;
}

export const STRIPE_PUBLISHABLE_KEY = getStripePublishableKey();

// Stripe Configuration (raw keys; prefer STRIPE_PUBLISHABLE_KEY)
export const STRIPE_CONFIG = {
  publishableKey: config.stripe?.publishableKey,
  productionPublishableKey: config.stripe?.productionPublishableKey,
};

// API Configuration with fallbacks for testing
// support_app_url: Django support API (see app.json extra). Android emulator: http://10.0.2.2:8000
export const API_CONFIG = {
  detailerAppUrl: config.detailer_app_url,
  customerAppUrl: config.customer_app_url,
  supportAppUrl: config.support_app_url,
  websocketUrl: config.websocket_url,
};


// Google API Keys Configuration
// Note: The API key should be added to app.json or app.config.js under extra.googleApiKeys
// Example configuration:
// {
//   "extra": {
//     "googleApiKeys": "YOUR_GOOGLE_PLACES_API_KEY_HERE"
//   }
// }
// The Places API key must have the following APIs enabled:
// - Places API (New)
// - Places API (Legacy) - for autocomplete
// - Geocoding API - for place details
export const KEY_CONFIGS = {
  googleApiKeys: config.googleApiKeys || config.googoleApiKeys, // Support both correct and typo'd config keys
};

// App Configuration
export const APP_CONFIG = {
  name: Constants.expoConfig?.name || "support-app",
  version: Constants.expoConfig?.version || "1.0.0",
  scheme: Constants.expoConfig?.scheme || "supportapp",
  projectId:
    Constants.expoConfig?.extra?.eas?.projectId ||
    "3ecd3333-a225-44f2-9799-4119919ca371",
};

// Validation (missing keys are handled at runtime where needed)
