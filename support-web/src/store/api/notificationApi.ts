import { SUPPORT_API } from "../../lib/routes";
import type {
  SaveNotificationTokenRequest,
  SaveNotificationTokenResponse,
} from "../../types/notification";
import { patchData } from "./client";

/** Expo push token registration. Mobile-only — do not call from web. */
export function saveNotificationToken(body: SaveNotificationTokenRequest) {
  return patchData<SaveNotificationTokenResponse>(SUPPORT_API.saveNotificationToken, body);
}
