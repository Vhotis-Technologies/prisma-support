export type TicketStatus = "pending" | "in_progress" | "resolved" | "closed";

export type TicketListItem = {
  id: string;
  ticket_code: string;
  client_name: string;
  subject: string;
  timestamp: string;
  status: TicketStatus;
};

export type TicketUpdate = {
  id: string;
  timestamp: string;
  message: string;
  status: TicketStatus;
};

export type TicketDetails = TicketListItem & {
  description: string;
  updates: TicketUpdate[];
};

/** Wire row from client support API before UI mapping. */
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

export type UpdateSupportTicketArgs = {
  ticketId: string;
  status: TicketStatus;
  message?: string;
};
