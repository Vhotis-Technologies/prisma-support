/**
 * Matches client: save Expo push token via PATCH save_notification_token.
 */
import { createApi } from "@reduxjs/toolkit/query/react";
import axiosBaseQuery from "@/app/store/baseQuery";

export const notificationApi = createApi({
  reducerPath: "notificationApi",
  baseQuery: axiosBaseQuery(),
  endpoints: (builder) => ({
    saveNotificationToken: builder.mutation<
      { success: boolean },
      { token: string }
    >({
      query: ({ token }) => ({
        url: "/api/v1/notifications/save_notification_token/",
        method: "PATCH",
        data: { token },
      }),
    }),
  }),
});

export const { useSaveNotificationTokenMutation } = notificationApi;
