/**
 * Ticket detail plus mark-completed (status `resolved`).
 * Terminal tickets (`resolved` / `closed`) cannot be updated. An optional
 * resolution note is stored on the timeline and emailed to the customer.
 *
 * @module app-hooks/useTicketFlow
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { getSupportTicketDetail, updateSupportTicket } from "../store/api/ticketApi";
import type { TicketDetails, TicketUpdate } from "../types/ticket";
import type { ConfirmRequest } from "../lib/confirm";
import { loadError, type LoadState, type Notice } from "../lib/load";

const TERMINAL = new Set(["resolved", "closed"]);

/** Keyed by ticket id so a param change shows loading without setState in the effect. */
type Cache = { id: string; state: LoadState<TicketDetails> };

function sortUpdates(updates: TicketUpdate[]): TicketUpdate[] {
  return [...updates].sort(
    (a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp),
  );
}

export function useTicketFlow(ticketId: string) {
  const [cache, setCache] = useState<Cache>({ id: "", state: { status: "loading" } });
  const [notice, setNotice] = useState<Notice | null>(null);
  const [confirm, setConfirm] = useState<ConfirmRequest | null>(null);
  const [confirmBusy, setConfirmBusy] = useState(false);

  useEffect(() => {
    if (!ticketId) return;
    let cancelled = false;
    void getSupportTicketDetail(ticketId)
      .then((data) => {
        if (!cancelled) setCache({ id: ticketId, state: { status: "ok", data } });
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setCache({
            id: ticketId,
            state: { status: "error", message: loadError(err, "Could not load ticket") },
          });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [ticketId]);

  const matched = cache.id === ticketId;
  const ticket = matched && cache.state.status === "ok" ? cache.state.data : undefined;
  const isLoading = Boolean(ticketId) && (!matched || cache.state.status === "loading");
  const isError =
    !ticketId ||
    (matched && cache.state.status === "error") ||
    (matched && cache.state.status === "ok" && !cache.state.data);
  const errorMessage =
    matched && cache.state.status === "error"
      ? cache.state.message
      : "This ticket may have been removed or the link is invalid.";

  const updates = useMemo(
    () => (ticket ? sortUpdates(ticket.updates) : []),
    [ticket],
  );

  const canComplete = Boolean(ticket && !TERMINAL.has(ticket.status));

  const refetch = useCallback(() => {
    if (!ticketId) return;
    void getSupportTicketDetail(ticketId)
      .then((data) => setCache({ id: ticketId, state: { status: "ok", data } }))
      .catch((err: unknown) => {
        setCache({
          id: ticketId,
          state: { status: "error", message: loadError(err, "Could not load ticket") },
        });
      });
  }, [ticketId]);

  const requestComplete = useCallback(
    (message?: string) => {
      if (!ticket || !canComplete) return;
      const trimmed = message?.trim() ?? "";
      setConfirm({
        title: "Mark as completed",
        message: trimmed
          ? "Resolve this ticket and email the customer with your note?"
          : "Resolve this ticket? The customer will be emailed that it is completed.",
        confirmLabel: "Mark completed",
        tone: "warning",
        onConfirm: () => {
          setConfirmBusy(true);
          void updateSupportTicket({
            ticketId: ticket.id,
            status: "resolved",
            ...(trimmed ? { message: trimmed } : {}),
          })
            .then((data) => {
              setConfirm(null);
              setConfirmBusy(false);
              setCache({ id: ticketId, state: { status: "ok", data } });
              setNotice({ type: "ok", message: "Ticket marked as completed." });
            })
            .catch((err: unknown) => {
              setConfirmBusy(false);
              setConfirm(null);
              setNotice({
                type: "error",
                message: loadError(err, "Could not update ticket"),
              });
            });
        },
      });
    },
    [canComplete, ticket, ticketId],
  );

  const clearConfirm = useCallback(() => {
    if (confirmBusy) return;
    setConfirm(null);
  }, [confirmBusy]);

  return {
    ticket,
    updates,
    isLoading,
    isError,
    errorMessage,
    refetch,
    notice,
    clearNotice: () => setNotice(null),
    confirm,
    confirmBusy,
    clearConfirm,
    canComplete,
    requestComplete,
  };
}
