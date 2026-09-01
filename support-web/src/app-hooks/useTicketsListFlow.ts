/**
 * Ticket list, newest first, with client-side search (code, subject, client).
 * @module app-hooks/useTicketsListFlow
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { getSupportTicketsList } from "../store/api/ticketApi";
import type { TicketListItem } from "../types/ticket";
import { loadError, type LoadState } from "../lib/load";

function normalizeQuery(q: string): string {
  return q.trim().toLowerCase();
}

function ticketMatchesSearch(ticket: TicketListItem, q: string): boolean {
  if (!q) return true;
  return (
    ticket.ticket_code.toLowerCase().includes(q) ||
    ticket.subject.toLowerCase().includes(q) ||
    ticket.client_name.toLowerCase().includes(q)
  );
}

function sortNewest(rows: TicketListItem[]): TicketListItem[] {
  return [...rows].sort(
    (a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp),
  );
}

export function useTicketsListFlow() {
  const [searchQuery, setSearchQuery] = useState("");
  const [rows, setRows] = useState<LoadState<TicketListItem[]>>({
    status: "loading",
  });
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void getSupportTicketsList()
      .then((data) => {
        if (!cancelled) setRows({ status: "ok", data: sortNewest(data) });
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setRows({
            status: "error",
            message: loadError(
              err,
              "Could not load tickets. Check CLIENT_API_URL and SUPPORT_INTERNAL_API_KEY on the support server.",
            ),
          });
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    void getSupportTicketsList()
      .then((data) => setRows({ status: "ok", data: sortNewest(data) }))
      .catch((err: unknown) => {
        setRows({
          status: "error",
          message: loadError(err, "Could not load tickets"),
        });
      })
      .finally(() => setRefreshing(false));
  }, []);

  const tickets = useMemo(
    () => (rows.status === "ok" ? rows.data : []),
    [rows],
  );

  const filtered = useMemo(() => {
    const q = normalizeQuery(searchQuery);
    if (!q) return tickets;
    return tickets.filter((ticket) => ticketMatchesSearch(ticket, q));
  }, [searchQuery, tickets]);

  const queueHint =
    rows.status === "loading"
      ? "Loading tickets…"
      : searchQuery.trim() && tickets.length > 0
        ? `${tickets.length} tickets · showing ${filtered.length}`
        : `${tickets.length} ticket${tickets.length === 1 ? "" : "s"}`;

  return {
    searchQuery,
    setSearchQuery,
    rows,
    filtered,
    queueHint,
    refreshing,
    onRefresh,
  };
}
