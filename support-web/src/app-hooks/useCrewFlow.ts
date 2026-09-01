/**
 * Crew profile plus PATCH toggles for **active** (new assignments) and **verified**.
 * @module app-hooks/useCrewFlow
 */
import { useCallback, useEffect, useState } from "react";
import { getCrewDetail, updateCrew } from "../store/api/crewApi";
import type { CrewMemberDetail } from "../types/crew";
import type { ConfirmRequest } from "../lib/confirm";
import { loadError, type LoadState, type Notice } from "../lib/load";

/** Keyed by crew id so a param change shows loading without setState in the effect. */
type Cache = { id: string; state: LoadState<CrewMemberDetail> };

function normalizeMember(member: CrewMemberDetail): CrewMemberDetail {
  return {
    ...member,
    total_bookings: member.total_bookings ?? 0,
    total_ratings: member.total_ratings ?? 0,
    average_rating:
      typeof member.average_rating === "number" && !Number.isNaN(member.average_rating)
        ? member.average_rating
        : 0,
    lifetime_earnings:
      typeof member.lifetime_earnings === "number" && !Number.isNaN(member.lifetime_earnings)
        ? member.lifetime_earnings
        : 0,
    specialties: member.specialties ?? [],
    service_areas: member.service_areas ?? [],
    vehicle_types: member.vehicle_types ?? [],
    comments: member.comments ?? [],
  };
}

export function useCrewFlow(crewId: string) {
  const [cache, setCache] = useState<Cache>({ id: "", state: { status: "loading" } });
  const [notice, setNotice] = useState<Notice | null>(null);
  const [confirm, setConfirm] = useState<ConfirmRequest | null>(null);
  const [confirmBusy, setConfirmBusy] = useState(false);

  useEffect(() => {
    if (!crewId) return;
    let cancelled = false;
    void getCrewDetail(crewId)
      .then((data) => {
        if (!cancelled) {
          setCache({ id: crewId, state: { status: "ok", data: normalizeMember(data) } });
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setCache({
            id: crewId,
            state: { status: "error", message: loadError(err, "Could not load profile") },
          });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [crewId]);

  const matched = cache.id === crewId;
  const member = matched && cache.state.status === "ok" ? cache.state.data : undefined;
  const isLoading = Boolean(crewId) && (!matched || cache.state.status === "loading");
  const isError =
    !crewId ||
    (matched && cache.state.status === "error") ||
    (matched && cache.state.status === "ok" && !cache.state.data);
  const errorMessage =
    matched && cache.state.status === "error"
      ? cache.state.message
      : "This profile may have been removed or the link is invalid.";

  const refetch = useCallback(() => {
    if (!crewId) return;
    void getCrewDetail(crewId)
      .then((data) => setCache({ id: crewId, state: { status: "ok", data: normalizeMember(data) } }))
      .catch((err: unknown) => {
        setCache({
          id: crewId,
          state: { status: "error", message: loadError(err, "Could not load profile") },
        });
      });
  }, [crewId]);

  const requestToggleActive = useCallback(() => {
    if (!member) return;
    const nextActive = !member.is_active;
    setConfirm({
      title: nextActive ? "Reactivate member" : "Deactivate member",
      message: `${nextActive ? "Reactivate" : "Deactivate"} ${member.name}? They will ${
        nextActive ? "start" : "stop"
      } receiving new assignments.`,
      confirmLabel: "Confirm",
      tone: "warning",
      onConfirm: () => {
        setConfirmBusy(true);
        void updateCrew({ crew_id: member.id, is_active: nextActive })
          .then((data) => {
            setConfirm(null);
            setConfirmBusy(false);
            setCache({ id: crewId, state: { status: "ok", data: normalizeMember(data) } });
            setNotice({
              type: "ok",
              message: `Crew member is now ${nextActive ? "active" : "inactive"}.`,
            });
          })
          .catch((err: unknown) => {
            setConfirmBusy(false);
            setConfirm(null);
            setNotice({ type: "error", message: loadError(err, "Could not update crew") });
          });
      },
    });
  }, [crewId, member]);

  const requestToggleVerified = useCallback(() => {
    if (!member) return;
    const nextVerified = !member.is_verified;
    setConfirm({
      title: nextVerified ? "Mark verified" : "Mark unverified",
      message: nextVerified
        ? `Confirm ${member.name} has passed verification checks?`
        : `Remove verified status from ${member.name}?`,
      confirmLabel: "Confirm",
      tone: "warning",
      onConfirm: () => {
        setConfirmBusy(true);
        void updateCrew({ crew_id: member.id, is_verified: nextVerified })
          .then((data) => {
            setConfirm(null);
            setConfirmBusy(false);
            setCache({ id: crewId, state: { status: "ok", data: normalizeMember(data) } });
            setNotice({
              type: "ok",
              message: `Verification set to ${nextVerified ? "verified" : "unverified"}.`,
            });
          })
          .catch((err: unknown) => {
            setConfirmBusy(false);
            setConfirm(null);
            setNotice({ type: "error", message: loadError(err, "Could not update crew") });
          });
      },
    });
  }, [crewId, member]);

  const clearConfirm = useCallback(() => {
    if (confirmBusy) return;
    setConfirm(null);
  }, [confirmBusy]);

  return {
    member,
    isLoading,
    isError,
    errorMessage,
    refetch,
    notice,
    clearNotice: () => setNotice(null),
    confirm,
    confirmBusy,
    clearConfirm,
    requestToggleActive,
    requestToggleVerified,
  };
}
