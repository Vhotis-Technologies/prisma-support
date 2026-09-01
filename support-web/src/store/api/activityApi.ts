/** Activity feed (polled on the activities page). */
import { SUPPORT_API } from "../../lib/routes";
import type {
  ActivityFeedResult,
  ActivityItem,
  GetActivityFeedArgs,
} from "../../types/activity";
import { getData } from "./client";

export async function getActivityFeed(
  arg?: GetActivityFeedArgs,
): Promise<ActivityFeedResult> {
  const response = await getData<{
    data?: { activities?: ActivityItem[]; meta?: ActivityFeedResult["meta"] };
  }>(SUPPORT_API.activityFeed, {
    params:
      arg != null && (arg.limit != null || arg.since != null)
        ? {
            ...(arg.limit != null ? { limit: arg.limit } : {}),
            ...(arg.since ? { since: arg.since } : {}),
          }
        : undefined,
  });
  return {
    activities: response.data?.activities ?? [],
    meta: response.data?.meta,
  };
}
