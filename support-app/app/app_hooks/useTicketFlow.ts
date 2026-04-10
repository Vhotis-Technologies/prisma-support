/**
 * Support tickets: list/detail via RTK Query and staff actions (e.g. mark resolved).
 */
import { useCallback, useMemo } from "react";
import { useAppSelector } from "@/app/store/main_store";
import type TicketDetails from "@/app/interfaces/TicketInterface";
import {
  useGetSupportTicketsListQuery,
  useGetSupportTicketDetailQuery,
  useUpdateSupportTicketMutation,
} from "@/app/store/api/ticketApi";

const TERMINAL = new Set(["resolved", "closed"]);

export function useTicketFlow() {
  const access = useAppSelector((s) => s.auth.access);
  const {
    data: tickets = [],
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useGetSupportTicketsListQuery(undefined, {
    skip: !access,
    refetchOnMountOrArgChange: true,
  });

  const [updateTicket, { isLoading: isUpdating }] =
    useUpdateSupportTicketMutation();

  const sortedTickets = useMemo(
    () =>
      [...tickets].sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      ),
    [tickets],
  );

  const getTicketById = useCallback(
    (id: string) => sortedTickets.find((t) => t.id === id),
    [sortedTickets],
  );

  const markCompleted = useCallback(
    async (id: string, message?: string) => {
      const trimmed = message?.trim();
      await updateTicket({
        ticketId: id,
        status: "resolved",
        ...(trimmed ? { message: trimmed } : {}),
      }).unwrap();
    },
    [updateTicket],
  );

  return {
    tickets: sortedTickets,
    isLoading,
    isFetching,
    isError,
    refetch,
    getTicketById,
    markCompleted,
    isUpdating,
  };
}

/** Detail screen: full ticket + refetch; ``markCompleted`` sets status to ``resolved``. */
export function useTicketDetailFlow(ticketId: string | undefined) {
  const access = useAppSelector((s) => s.auth.access);
  const {
    data: ticket,
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useGetSupportTicketDetailQuery(ticketId!, {
    skip: !access || !ticketId,
    refetchOnMountOrArgChange: true,
  });

  const [updateTicket, { isLoading: isUpdating }] =
    useUpdateSupportTicketMutation();

  const markCompleted = useCallback(
    async (message?: string) => {
      if (!ticketId) return;
      const trimmed = message?.trim();
      await updateTicket({
        ticketId,
        status: "resolved",
        ...(trimmed ? { message: trimmed } : {}),
      }).unwrap();
    },
    [ticketId, updateTicket],
  );

  const canComplete = Boolean(
    ticket && !TERMINAL.has(ticket.status),
  );

  return {
    ticket,
    isLoading,
    isFetching,
    isError,
    refetch,
    markCompleted,
    canComplete,
    isUpdating,
  };
}
