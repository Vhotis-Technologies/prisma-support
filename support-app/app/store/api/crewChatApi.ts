import { createApi } from "@reduxjs/toolkit/query/react";
import axiosBaseQuery from "@/app/store/baseQuery";

export interface CrewChatThread {
  id: string;
  crew_name: string;
  crew_email: string;
  status: "open" | "closed";
  last_message_at: string;
  support_unread_count: number;
  crew_unread_count: number;
}

export interface CrewChatMessage {
  _id: string;
  text: string;
  createdAt: string;
  user: {
    _id: string;
    name: string;
    role?: string;
  };
  booking_reference?: string;
}

export interface CrewChatThreadDetail {
  id: string;
  crew_name: string;
  crew_email: string;
  status: "open" | "closed";
  last_message_at: string;
  messages: CrewChatMessage[];
}

export interface GetThreadsResponse {
  data: {
    threads: CrewChatThread[];
  };
}

export interface GetThreadResponse {
  data: {
    thread: CrewChatThreadDetail;
  };
}

export interface SendMessageRequest {
  thread_id: string;
  body: string;
}

export interface SendMessageResponse {
  data: {
    message: CrewChatMessage;
  };
}

export interface CloseThreadRequest {
  thread_id: string;
}

export interface CloseThreadResponse {
  data: {
    thread: {
      id: string;
      status: string;
    };
  };
}

export const crewChatApi = createApi({
  reducerPath: "crewChatApi",
  baseQuery: axiosBaseQuery(),
  tagTypes: ["CrewChatThreads", "CrewChatThread"],
  endpoints: (builder) => ({
    getCrewChatThreads: builder.query<GetThreadsResponse, string>({
      query: (status = "open") => ({
        url: `/crew-chat/list_threads/`,
        method: "GET",
        params: { status },
      }),
      providesTags: ["CrewChatThreads"],
    }),
    
    getCrewChatThread: builder.query<GetThreadResponse, string>({
      query: (threadId) => ({
        url: `/crew-chat/get_thread/`,
        method: "GET",
        params: { thread_id: threadId },
      }),
      providesTags: (_result, _error, threadId) => [
        { type: "CrewChatThread", id: threadId },
      ],
    }),
    
    sendCrewChatMessage: builder.mutation<SendMessageResponse, SendMessageRequest>({
      query: (body) => ({
        url: `/crew-chat/send_message/`,
        method: "POST",
        data: body,
      }),
      invalidatesTags: (_result, _error, arg) => [
        "CrewChatThreads",
        { type: "CrewChatThread", id: arg.thread_id },
      ],
    }),
    
    closeCrewChatThread: builder.mutation<CloseThreadResponse, string>({
      query: (threadId) => ({
        url: `/crew-chat/close_thread/`,
        method: "PATCH",
        data: { thread_id: threadId },
      }),
      invalidatesTags: (_result, _error, threadId) => [
        "CrewChatThreads",
        { type: "CrewChatThread", id: threadId },
      ],
    }),
    
    reopenCrewChatThread: builder.mutation<CloseThreadResponse, string>({
      query: (threadId) => ({
        url: `/crew-chat/reopen_thread/`,
        method: "PATCH",
        data: { thread_id: threadId },
      }),
      invalidatesTags: (_result, _error, threadId) => [
        "CrewChatThreads",
        { type: "CrewChatThread", id: threadId },
      ],
    }),
  }),
});

export const {
  useGetCrewChatThreadsQuery,
  useGetCrewChatThreadQuery,
  useSendCrewChatMessageMutation,
  useCloseCrewChatThreadMutation,
  useReopenCrewChatThreadMutation,
} = crewChatApi;
