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
      websockets_url: "wss://support.prismavalet.com/ws",
    },
    staging: {
      support_app_url: "https://bat-useful-penguin.ngrok-free.app/support",
      detailer_app_url: "https://bat-useful-penguin.ngrok-free.app/detailer",
      customer_app_url: "https://bat-useful-penguin.ngrok-free.app/client",
      websocket_url: "wss://bat-useful-penguin.ngrok-free.app/support/ws/support/",
      websockets_url: "wss://bat-useful-penguin.ngrok-free.app/support/ws",
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
