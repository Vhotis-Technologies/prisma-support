/** Matches client API ``Ticket.status`` choices. */
export type TicketStatus =
  | "pending"
  | "in_progress"
  | "resolved"
  | "closed";

/** Row in the support ticket list */
export interface TicketListItem {
  id: string;
  ticket_code: string;
  client_name: string;
  subject: string;
  timestamp: string;
  status: TicketStatus;
}

export interface TicketUpdate {
  id: string;
  timestamp: string;
  message: string;
  status: TicketStatus;
}

/** Full ticket for detail view */
export default interface TicketDetails extends TicketListItem {
  description: string;
  updates: TicketUpdate[];
}

export interface TicketItemComponentProps {
  ticket: TicketListItem;
  onPress: (ticket: TicketListItem) => void;
}
