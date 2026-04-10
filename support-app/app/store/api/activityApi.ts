import { createApi } from "@reduxjs/toolkit/query/react";
import type ActivityInterface from "@/app/interfaces/ActivityInterface";
import axiosBaseQuery from "../baseQuery";

export interface ActivityFeedMeta {
  limit: number;
  lookback_days: number | null;
}

export interface ActivityFeedResult {
  activities: ActivityInterface[];
  meta?: ActivityFeedMeta;
}

export interface GetActivityFeedArgs {
  limit?: number;
  since?: string;
}

const activityApi = createApi({
  reducerPath: "activityApi",
  baseQuery: axiosBaseQuery(),
  tagTypes: ["ActivityFeed"],
  endpoints: (builder) => ({
    getActivityFeed: builder.query<
      ActivityFeedResult,
      GetActivityFeedArgs | undefined
    >({
      query: (arg) => ({
        url: "/api/v1/activities/get_activity_feed/",
        method: "GET",
        params:
          arg != null && (arg.limit != null || arg.since != null)
            ? {
                ...(arg.limit != null ? { limit: arg.limit } : {}),
                ...(arg.since ? { since: arg.since } : {}),
              }
            : undefined,
      }),
      transformResponse: (response: {
        data?: {
          activities?: ActivityInterface[];
          meta?: ActivityFeedMeta;
        };
      }): ActivityFeedResult => ({
        activities: response.data?.activities ?? [],
        meta: response.data?.meta,
      }),
      providesTags: [{ type: "ActivityFeed", id: "LIST" }],
    }),
  }),
});

export const { useGetActivityFeedQuery } = activityApi;
export default activityApi;
