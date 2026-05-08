/**
 * Dynamic Expo config: merges app.json and injects appEnv from EAS / local env.
 */
const appJson = require("./app.json");

const appEnv = process.env.EXPO_PUBLIC_APP_ENV || "development";

const envUrls = {
  production: {
    support_app_url: "https://support.prismavalet.com",
    detailer_app_url: "https://detailer.prismavalet.com",
    customer_app_url: "https://client.prismavalet.com",
    websocket_url: "wss://support.prismavalet.com/ws/support/",
  },
  staging: {
    support_app_url: "https://stagingsupport.prismavalet.com",
    detailer_app_url: "https://staging.detailer.prismavalet.com",
    customer_app_url: "https://staging.client.prismavalet.com",
    websocket_url: "wss://stagingsupport.prismavalet.com/ws/support/",
  },
};

const selectedUrls = envUrls[appEnv] || envUrls.staging;

module.exports = {
  expo: {
    ...appJson.expo,
    extra: {
      ...appJson.expo.extra,
      ...selectedUrls,
      appEnv,
    },
  },
};
