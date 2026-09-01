/** Support tickets: list, detail, and mark-completed (`resolved`). */
import { SUPPORT_API } from "../../lib/routes";
import type {
  ApiTicketDetail,
  ApiTicketListRow,
  ApiTicketUpdateRow,
  TicketDetails,
  TicketListItem,
  TicketStatus,
  UpdateSupportTicketArgs,
} from "../../types/ticket";
import { getData, patchData } from "./client";

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
  fallbackStatus: TicketStatus,
): TicketDetails["updates"][number] {
  const msg =
    row.message && row.message.trim()
      ? row.message.trim()
      : row.kind === "status_change" && row.status_to
        ? `Status updated to ${row.status_to.replace(/_/g, " ")}`
        : "";
  const status = row.status_to ? asTicketStatus(row.status_to) : fallbackStatus;
  return {
    id: row.id,
    timestamp: row.created_at,
    message: msg,
    status,
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
  return {
    id: row.id,
    ticket_code: row.ticket_code,
    client_name: row.client_name,
    subject: row.subject,
    timestamp: row.timestamp,
    status,
    description: row.description ?? "",
    updates: row.updates.map((update) => mapApiUpdate(update, status)),
  };
}

export async function getSupportTicketsList(): Promise<TicketListItem[]> {
  const response = await getData<{ data?: { tickets?: ApiTicketListRow[] } }>(
    SUPPORT_API.ticketsList,
  );
  return (response.data?.tickets ?? []).map(mapListRow);
}

export async function getSupportTicketDetail(ticketId: string): Promise<TicketDetails> {
  const response = await getData<{ data?: { ticket?: ApiTicketDetail } }>(
    SUPPORT_API.ticketDetail,
    { params: { ticket_id: ticketId } },
  );
  const ticket = response.data?.ticket;
  if (!ticket) throw new Error("Missing ticket in response");
  return mapDetailRow(ticket);
}

export async function updateSupportTicket(
  arg: UpdateSupportTicketArgs,
): Promise<TicketDetails> {
  const response = await patchData<{ data?: { ticket?: ApiTicketDetail } }>(
    SUPPORT_API.updateTicket,
    {
      ticket_id: arg.ticketId,
      status: arg.status,
      ...(arg.message != null && arg.message !== "" ? { message: arg.message } : {}),
    },
  );
  const ticket = response.data?.ticket;
  if (!ticket) throw new Error("Missing ticket in response");
  return mapDetailRow(ticket);
}
