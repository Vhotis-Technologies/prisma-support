import { createApi } from "@reduxjs/toolkit/query/react";
import type TicketDetails from "@/app/interfaces/TicketInterface";
import type { TicketListItem, TicketStatus } from "@/app/interfaces/TicketInterface";
import axiosBaseQuery from "../baseQuery";

const CACHE_SEC = 120;

/** Raw update row from client support API */
export type ApiTicketUpdateRow = {
  id: string;
  kind: string;
  status_to?: string | null;
  message?: string | null;
  created_at: string;
};

export type ApiTicketListRow = {
  id: string;
  ticket_code: string;
  subject: string;
  client_name: string;
  client_email: string;
  timestamp: string;
  status: string;
};

export type ApiTicketDetail = ApiTicketListRow & {
  description: string;
  issue_type?: string;
  booking_reference?: string | null;
  updates: ApiTicketUpdateRow[];
};

function asTicketStatus(raw: string): TicketStatus {
  if (
    raw === "pending" ||
    raw === "in_progress" ||
    raw === "resolved" ||
    raw === "closed"
  ) {
    return raw;
  }
  return "pending";
}

function mapApiUpdate(
  row: ApiTicketUpdateRow,
  fallbackStatus: TicketStatus
): TicketDetails["updates"][number] {
  const msg =
    row.message && row.message.trim()
      ? row.message.trim()
      : row.kind === "status_change" && row.status_to
        ? `Status updated to ${row.status_to.replace(/_/g, " ")}`
        : "";
  const st = row.status_to
    ? asTicketStatus(row.status_to)
    : fallbackStatus;
  return {
    id: row.id,
    timestamp: row.created_at,
    message: msg,
    status: st,
  };
}

function mapListRow(row: ApiTicketListRow): TicketListItem {
  return {
    id: row.id,
    ticket_code: row.ticket_code,
    client_name: row.client_name,
    subject: row.subject,
    timestamp: row.timestamp,
    status: asTicketStatus(row.status),
  };
}

function mapDetailRow(row: ApiTicketDetail): TicketDetails {
  const status = asTicketStatus(row.status);
  const updates = [...row.updates].map((u) => mapApiUpdate(u, status));
  return {
    id: row.id,
    ticket_code: row.ticket_code,
    client_name: row.client_name,
    subject: row.subject,
    timestamp: row.timestamp,
    status,
    description: row.description ?? "",
    updates,
  };
}

export type UpdateSupportTicketArgs = {
  ticketId: string;
  status: TicketStatus;
  message?: string;
};

const ticketApi = createApi({
  reducerPath: "ticketApi",
  baseQuery: axiosBaseQuery(),
  tagTypes: ["SupportTickets", "SupportTicket"],
  refetchOnReconnect: true,
  keepUnusedDataFor: CACHE_SEC,
  endpoints: (builder) => ({
    getSupportTicketsList: builder.query<TicketListItem[], void>({
      query: () => ({
        url: "/api/v1/tickets/list_tickets/",
        method: "GET",
      }),
      transformResponse: (response: {
        data?: { tickets?: ApiTicketListRow[] };
      }): TicketListItem[] => {
        const rows = response.data?.tickets ?? [];
        return rows.map(mapListRow);
      },
      providesTags: [{ type: "SupportTickets", id: "LIST" }],
    }),

    getSupportTicketDetail: builder.query<TicketDetails, string>({
      query: (ticketId) => ({
        url: "/api/v1/tickets/get_ticket_detail/",
        method: "GET",
        params: { ticket_id: ticketId },
      }),
      transformResponse: (response: {
        data?: { ticket?: ApiTicketDetail };
      }): TicketDetails => {
        const t = response.data?.ticket;
        if (!t) throw new Error("Missing ticket in response");
        return mapDetailRow(t);
      },
      providesTags: (_r, _e, ticketId) => [
        { type: "SupportTicket", id: ticketId },
      ],
    }),

    updateSupportTicket: builder.mutation<
      TicketDetails,
      UpdateSupportTicketArgs
    >({
      query: ({ ticketId, status, message }) => ({
        url: "/api/v1/tickets/update_ticket/",
        method: "PATCH",
        data: {
          ticket_id: ticketId,
          status,
          ...(message != null && message !== "" ? { message } : {}),
        },
      }),
      transformResponse: (response: {
        data?: { ticket?: ApiTicketDetail };
      }): TicketDetails => {
        const t = response.data?.ticket;
        if (!t) throw new Error("Missing ticket in response");
        return mapDetailRow(t);
      },
      invalidatesTags: (_r, _e, arg) => [
        { type: "SupportTickets", id: "LIST" },
        { type: "SupportTicket", id: arg.ticketId },
      ],
    }),
  }),
});

export const {
  useGetSupportTicketsListQuery,
  useGetSupportTicketDetailQuery,
  useUpdateSupportTicketMutation,
} = ticketApi;
export default ticketApi;
