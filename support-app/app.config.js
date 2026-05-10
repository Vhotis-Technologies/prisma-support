/**
 * Dynamic Expo config: extends static app.json (via Expo `config`) and injects URLs from EAS / local env.
 * Function form satisfies expo-doctor when both app.json and app.config.js exist.
 */
module.exports = ({ config }) => {
  const appEnv = process.env.EXPO_PUBLIC_APP_ENV || "development";

  const envUrls = {
    production: {
      support_app_url: "https://support.prismavalet.com",
      detailer_app_url: "https://crew.prismavalet.com",
      customer_app_url: "https://client.prismavalet.com",
      websocket_url: "wss://support.prismavalet.com/ws/support/",
    },
    staging: {
      support_app_url: "https://staging.support.prismavalet.com",
      detailer_app_url: "https://staging.crew.prismavalet.com",
      customer_app_url: "https://staging.client.prismavalet.com",
      websocket_url: "wss://stagingsupport.prismavalet.com/ws/support/",
    },
  };

  const selectedUrls = envUrls[appEnv] || envUrls.staging;

  return {
    ...config,
    extra: {
      ...(config.extra || {}),
      ...selectedUrls,
      appEnv,
    },
  };
};
