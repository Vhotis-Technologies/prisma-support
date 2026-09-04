/**
 * B2C / fleet / partner detail plus guarded mutations (subscription, vehicle, delete).
 * Partners have no subscription actions; referred users load only for the partners segment.
 * @module app-hooks/useCustomerDetailFlow
 */
import { useCallback, useEffect, useState } from "react";
import {
  deleteUserAccount,
  getSupportB2cCustomerDetail,
  getSupportFleetCustomerDetail,
  getSupportPartnerCustomerDetail,
  getSupportPartnerReferredUsers,
  removeSupportVehicle,
  renewB2cSubscription,
  renewFleetSubscription,
  terminateB2cSubscription,
  terminateFleetSubscription,
} from "../store/api/customerApi";
import type {
  B2CDetails,
  CustomerSegment,
  FleetDetails,
  PartnerDetails,
  ReferredUserDetails,
} from "../types/customer";
import type { ConfirmRequest } from "../lib/confirm";
import { loadError, type LoadState, type Notice } from "../lib/load";

type DetailData = B2CDetails | FleetDetails | PartnerDetails;
/** Keyed by id + segment so a param change shows loading without setState in the effect. */
type DetailCache = { id: string; segment: CustomerSegment; state: LoadState<DetailData> };

function fetchDetail(customerId: string, segment: CustomerSegment): Promise<DetailData> {
  if (segment === "b2c") return getSupportB2cCustomerDetail(customerId);
  if (segment === "fleets") return getSupportFleetCustomerDetail(customerId);
  return getSupportPartnerCustomerDetail(customerId);
}

export function useCustomerDetailFlow(
  customerId: string,
  segment: CustomerSegment,
  onDeleted?: () => void,
) {
  const [cache, setCache] = useState<DetailCache>({
    id: "",
    segment,
    state: { status: "loading" },
  });
  const [referred, setReferred] = useState<LoadState<ReferredUserDetails[]>>({
    status: "loading",
  });
  const [notice, setNotice] = useState<Notice | null>(null);
  const [confirm, setConfirm] = useState<ConfirmRequest | null>(null);
  const [confirmBusy, setConfirmBusy] = useState(false);
  const [removingVehicleId, setRemovingVehicleId] = useState<string | null>(null);

  useEffect(() => {
    if (!customerId) return;
    let cancelled = false;
    void fetchDetail(customerId, segment)
      .then((data) => {
        if (!cancelled) setCache({ id: customerId, segment, state: { status: "ok", data } });
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setCache({
            id: customerId,
            segment,
            state: { status: "error", message: loadError(err, "Could not load customer") },
          });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [customerId, segment]);

  useEffect(() => {
    if (segment !== "partners" || !customerId) return;
    let cancelled = false;
    void getSupportPartnerReferredUsers(customerId)
      .then((data) => {
        if (!cancelled) setReferred({ status: "ok", data });
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setReferred({
            status: "error",
            message: loadError(err, "Could not load referred users"),
          });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [customerId, segment]);

  const matched = cache.id === customerId && cache.segment === segment;
  const customer = matched && cache.state.status === "ok" ? cache.state.data : undefined;
  const isLoading = Boolean(customerId) && (!matched || cache.state.status === "loading");
  const isError =
    !customerId || (matched && cache.state.status === "error") || (matched && cache.state.status === "ok" && !cache.state.data);
  const errorMessage =
    matched && cache.state.status === "error" ? cache.state.message : "This customer may have been removed or the link is invalid.";

  const refetch = useCallback(() => {
    if (!customerId) return;
    void fetchDetail(customerId, segment)
      .then((data) => setCache({ id: customerId, segment, state: { status: "ok", data } }))
      .catch((err: unknown) => {
        setCache({
          id: customerId,
          segment,
          state: { status: "error", message: loadError(err, "Could not load customer") },
        });
      });
  }, [customerId, segment]);

  const requestTerminate = useCallback(() => {
    if (!customer || customer.type === "partner") return;
    const sub = customer.subscription;
    if (!sub || sub.status === "terminated" || sub.subtype === "No plan") return;
    setConfirm({
      title: "Terminate subscription",
      message: `Terminate the ${sub.subtype} plan (${sub.billing_type} billing) for ${customer.name}?`,
      confirmLabel: "Terminate",
      tone: "danger",
      onConfirm: () => {
        setConfirmBusy(true);
        const request =
          segment === "fleets"
            ? terminateFleetSubscription({ fleetId: customerId, reason: "Support termination" })
            : terminateB2cSubscription({ userId: customerId, reason: "Support termination" });
        void request
          .then(() => {
            setConfirm(null);
            setConfirmBusy(false);
            setNotice({ type: "ok", message: "Subscription terminated." });
            refetch();
          })
          .catch((err: unknown) => {
            setConfirmBusy(false);
            setConfirm(null);
            setNotice({
              type: "error",
              message: loadError(err, "Could not terminate subscription"),
            });
          });
      },
    });
  }, [customer, customerId, refetch, segment]);

  const requestRenew = useCallback(() => {
    if (!customer || customer.type === "partner") return;
    const sub = customer.subscription;
    if (!sub || sub.subtype === "No plan") return;
    setConfirm({
      title: "Renew subscription",
      message: `Renew ${customer.name} for another ${sub.billing_type} billing period?`,
      confirmLabel: "Renew",
      tone: "warning",
      onConfirm: () => {
        setConfirmBusy(true);
        const request =
          segment === "fleets"
            ? renewFleetSubscription({ fleetId: customerId })
            : renewB2cSubscription({ userId: customerId });
        void request
          .then(() => {
            setConfirm(null);
            setConfirmBusy(false);
            setNotice({ type: "ok", message: "Subscription renewed." });
            refetch();
          })
          .catch((err: unknown) => {
            setConfirmBusy(false);
            setConfirm(null);
            setNotice({ type: "error", message: loadError(err, "Could not renew subscription") });
          });
      },
    });
  }, [customer, customerId, onDeleted, segment]);

  const requestDeleteAccount = useCallback(() => {
    if (segment !== "b2c" || !customer) return;
    setConfirm({
      title: "Delete customer account?",
      message: `Deactivate ${customer.name}'s account. They will not be able to sign in. Booking history is retained for compliance.`,
      confirmLabel: "Delete account",
      tone: "danger",
      onConfirm: () => {
        setConfirmBusy(true);
        void deleteUserAccount({ user_id: customerId, reason: "Deleted by support" })
          .then(() => {
            setConfirm(null);
            setConfirmBusy(false);
            onDeleted?.();
          })
          .catch((err: unknown) => {
            setConfirmBusy(false);
            setConfirm(null);
            setNotice({ type: "error", message: loadError(err, "Could not delete account") });
          });
      },
    });
  }, [customer, customerId, onDeleted, segment]);

  const requestRemoveVehicle = useCallback(
    (vehicleId: string, label: string, ctx: { userId?: string; fleetId?: string; partnerId?: string }) => {
      setConfirm({
        title: "Remove vehicle",
        message: `Remove ${label} from this customer?`,
        confirmLabel: "Remove",
        tone: "danger",
        onConfirm: () => {
          setConfirmBusy(true);
          setRemovingVehicleId(vehicleId);
          void removeSupportVehicle({
            vehicleId,
            ...(ctx.fleetId ? { fleetId: ctx.fleetId } : {}),
            ...(ctx.userId ? { userId: ctx.userId } : {}),
            ...(ctx.partnerId ? { partnerId: ctx.partnerId } : {}),
          })
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
    [refetch],
  );

  const clearConfirm = useCallback(() => {
    if (confirmBusy) return;
    setConfirm(null);
  }, [confirmBusy]);

  const b2c = customer?.type === "b2c" ? customer : undefined;
  const fleet = customer?.type === "fleet" ? customer : undefined;
  const partner = customer?.type === "partner" ? customer : undefined;
  const referredUsers = referred.status === "ok" ? referred.data : [];

  return {
    customer,
    b2c,
    fleet,
    partner,
    isLoading,
    isError,
    errorMessage,
    refetch,
    notice,
    clearNotice: () => setNotice(null),
    showNotice: setNotice,
    confirm,
    confirmBusy,
    clearConfirm,
    requestTerminate,
    requestRenew,
    requestDeleteAccount,
    requestRemoveVehicle,
    removingVehicleId,
    referredUsers,
    referredError: referred.status === "error" ? referred.message : null,
    referredLoading: segment === "partners" && referred.status === "loading",
  };
}
