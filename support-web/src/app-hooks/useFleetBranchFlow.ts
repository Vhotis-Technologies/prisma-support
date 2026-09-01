/**
 * Fleet branch detail, remove-branch, and remove-vehicle.
 * @module app-hooks/useFleetBranchFlow
 */
import { useCallback, useEffect, useState } from "react";
import {
  getSupportFleetBranchDetail,
  removeSupportBranch,
  removeSupportVehicle,
} from "../store/api/customerApi";
import type { FleetBranchDetails } from "../types/customer";
import type { ConfirmRequest } from "../lib/confirm";
import { loadError, type LoadState, type Notice } from "../lib/load";

/** Keyed by fleet + branch so a param change shows loading without setState in the effect. */
type Cache = { fleetId: string; branchId: string; state: LoadState<FleetBranchDetails> };

export function useFleetBranchFlow(
  fleetId: string,
  branchId: string,
  onRemoved?: () => void,
) {
  const [cache, setCache] = useState<Cache>({
    fleetId: "",
    branchId: "",
    state: { status: "loading" },
  });
  const [notice, setNotice] = useState<Notice | null>(null);
  const [confirm, setConfirm] = useState<ConfirmRequest | null>(null);
  const [confirmBusy, setConfirmBusy] = useState(false);
  const [removingVehicleId, setRemovingVehicleId] = useState<string | null>(null);

  useEffect(() => {
    if (!fleetId || !branchId) return;
    let cancelled = false;
    void getSupportFleetBranchDetail({ fleetId, branchId })
      .then((data) => {
        if (!cancelled) setCache({ fleetId, branchId, state: { status: "ok", data } });
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setCache({
            fleetId,
            branchId,
            state: { status: "error", message: loadError(err, "Could not load branch") },
          });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [fleetId, branchId]);

  const matched = cache.fleetId === fleetId && cache.branchId === branchId;
  const branch = matched && cache.state.status === "ok" ? cache.state.data : undefined;
  const isLoading =
    Boolean(fleetId && branchId) && (!matched || cache.state.status === "loading");
  const isError =
    !fleetId ||
    !branchId ||
    (matched && cache.state.status === "error") ||
    (matched && cache.state.status === "ok" && !cache.state.data);
  const errorMessage =
    matched && cache.state.status === "error"
      ? cache.state.message
      : "This branch may have been removed or the link is invalid.";

  const refetch = useCallback(() => {
    if (!fleetId || !branchId) return;
    void getSupportFleetBranchDetail({ fleetId, branchId })
      .then((data) => setCache({ fleetId, branchId, state: { status: "ok", data } }))
      .catch((err: unknown) => {
        setCache({
          fleetId,
          branchId,
          state: { status: "error", message: loadError(err, "Could not load branch") },
        });
      });
  }, [fleetId, branchId]);

  const requestRemoveBranch = useCallback(() => {
    if (!branch) return;
    setConfirm({
      title: "Remove branch",
      message: `Remove branch "${branch.name}" from this fleet? This cannot be undone if the branch has no vehicles.`,
      confirmLabel: "Remove branch",
      tone: "danger",
      onConfirm: () => {
        setConfirmBusy(true);
        void removeSupportBranch({ fleetId, branchId })
          .then(() => {
            setConfirm(null);
            setConfirmBusy(false);
            onRemoved?.();
          })
          .catch((err: unknown) => {
            setConfirmBusy(false);
            setConfirm(null);
            setNotice({ type: "error", message: loadError(err, "Could not remove branch") });
            refetch();
          });
      },
    });
  }, [branch, branchId, fleetId, onRemoved, refetch]);

  const requestRemoveVehicle = useCallback(
    (vehicleId: string, label: string) => {
      setConfirm({
        title: "Remove vehicle",
        message: `Remove ${label} from this branch?`,
        confirmLabel: "Remove",
        tone: "danger",
        onConfirm: () => {
          setConfirmBusy(true);
          setRemovingVehicleId(vehicleId);
          void removeSupportVehicle({ vehicleId, fleetId })
            .then(() => {
              setConfirm(null);
              setConfirmBusy(false);
              setRemovingVehicleId(null);
              setNotice({ type: "ok", message: "Vehicle removed." });
              refetch();
            })
            .catch((err: unknown) => {
              setConfirmBusy(false);
              setRemovingVehicleId(null);
              setConfirm(null);
              setNotice({ type: "error", message: loadError(err, "Could not remove vehicle") });
            });
        },
      });
    },
    [fleetId, refetch],
  );

  const clearConfirm = useCallback(() => {
    if (confirmBusy) return;
    setConfirm(null);
  }, [confirmBusy]);

  return {
    branch,
    isLoading,
    isError,
    errorMessage,
    notice,
    clearNotice: () => setNotice(null),
    confirm,
    confirmBusy,
    clearConfirm,
    requestRemoveBranch,
    requestRemoveVehicle,
    removingVehicleId,
  };
}
