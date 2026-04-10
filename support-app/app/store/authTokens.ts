import * as SecureStore from "expo-secure-store";

const ACCESS_KEY = "access";
const REFRESH_KEY = "refresh";
/** Parity with client: profile JSON for rehydrate when "Remember me" was used. */
const USER_KEY = "user";

export async function persistAuthTokens(access: string, refresh: string) {
  await SecureStore.setItemAsync(ACCESS_KEY, access);
  await SecureStore.setItemAsync(REFRESH_KEY, refresh);
}

export async function persistAuthUser(user: object) {
  await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
}

export async function clearAuthTokens() {
  try {
    await SecureStore.deleteItemAsync(ACCESS_KEY);
  } catch {
    /* key may be absent */
  }
  try {
    await SecureStore.deleteItemAsync(REFRESH_KEY);
  } catch {
    /* key may be absent */
  }
  try {
    await SecureStore.deleteItemAsync(USER_KEY);
  } catch {
    /* key may be absent */
  }
}
