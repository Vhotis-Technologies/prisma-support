/**
 * Vehicle record: stats, ownership, and support-side transfer approve/reject.
 * @module app-hooks/useVehicleDetailFlow
 */
import { useCallback, useEffect, useState } from "react";
import { getSupportVehicleDetail, supportVehicleTransfer } from "../store/api/customerApi";
import type { SupportVehicleStats, VehicleTransferAction } from "../types/vehicle";
import type { ConfirmRequest } from "../lib/confirm";
import { loadError, type LoadState, type Notice } from "../lib/load";

/** Keyed by vehicle id so a param change shows loading without setState in the effect. */
type Cache = { id: string; state: LoadState<SupportVehicleStats> };

export function useVehicleDetailFlow(vehicleId: string) {
  const [cache, setCache] = useState<Cache>({ id: "", state: { status: "loading" } });
  const [notice, setNotice] = useState<Notice | null>(null);
  const [confirm, setConfirm] = useState<ConfirmRequest | null>(null);
  const [confirmBusy, setConfirmBusy] = useState(false);
  const [busyTransferId, setBusyTransferId] = useState<string | null>(null);

  useEffect(() => {
    if (!vehicleId) return;
    let cancelled = false;
    void getSupportVehicleDetail(vehicleId)
      .then((data) => {
        if (!cancelled) setCache({ id: vehicleId, state: { status: "ok", data } });
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setCache({
            id: vehicleId,
            state: { status: "error", message: loadError(err, "Could not load vehicle") },
          });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [vehicleId]);

  const matched = cache.id === vehicleId;
  const stats = matched && cache.state.status === "ok" ? cache.state.data : undefined;
  const isLoading = Boolean(vehicleId) && (!matched || cache.state.status === "loading");
  const isError =
    !vehicleId ||
    (matched && cache.state.status === "error") ||
    (matched && cache.state.status === "ok" && !cache.state.data);
  const errorMessage =
    matched && cache.state.status === "error"
      ? cache.state.message
      : "This vehicle may have been removed or the link is invalid.";

  const refetch = useCallback(() => {
    if (!vehicleId) return;
    void getSupportVehicleDetail(vehicleId)
      .then((data) => setCache({ id: vehicleId, state: { status: "ok", data } }))
      .catch((err: unknown) => {
        setCache({
          id: vehicleId,
          state: { status: "error", message: loadError(err, "Could not load vehicle") },
        });
      });
  }, [vehicleId]);

  const requestTransferAction = useCallback(
    (transferId: string, action: VehicleTransferAction) => {
      setConfirm({
        title: action === "approve" ? "Approve transfer" : "Reject transfer",
        message:
          action === "approve"
            ? "Complete this transfer: end the seller’s ownership and assign the vehicle to the buyer. Customer emails will be sent as in the app."
            : "Mark this transfer as rejected. The buyer will be notified by email.",
        confirmLabel: action === "approve" ? "Approve" : "Reject",
        tone: action === "reject" ? "danger" : "warning",
        onConfirm: () => {
          setConfirmBusy(true);
          setBusyTransferId(transferId);
          void supportVehicleTransfer({ vehicleId, transferId, action })
            .then((response) => {
              setConfirm(null);
              setConfirmBusy(false);
              setBusyTransferId(null);
              if (response.error) {
                setNotice({ type: "error", message: response.error });
                return;
              }
              setNotice({
                type: "ok",
                message: response.data?.message ?? "Transfer updated.",
              });
              if (response.data?.vehicle) {
                setCache({ id: vehicleId, state: { status: "ok", data: response.data.vehicle } });
              } else {
                refetch();
              }
            })
            .catch((err: unknown) => {
              setConfirmBusy(false);
              setBusyTransferId(null);
              setConfirm(null);
              setNotice({ type: "error", message: loadError(err, "Could not update transfer") });
            });
        },
      });
    },
    [refetch, vehicleId],
  );

  const clearConfirm = useCallback(() => {
    if (confirmBusy) return;
    setConfirm(null);
  }, [confirmBusy]);

  return {
    stats,
    isLoading,
    isError,
    errorMessage,
    notice,
    clearNotice: () => setNotice(null),
    confirm,
    confirmBusy,
    clearConfirm,
    requestTransferAction,
    busyTransferId,
  };
}
