/**
 * Customer detail flows for B2C, fleet, and partner segments.
 *
 * Selects exactly one RTK detail query based on `segment`, exposes a unified `customer` object,
 * and provides guarded mutations (terminate/renew subscription, remove vehicle/branch) with
 * automatic refetch and alert-based errors.
 *
 * @module app_hooks/useCustomerFlow
 */
import { useCallback, useMemo } from "react";
import { useAlertContext } from "@/app/contexts/AlertContext";
import type {
  B2CDetails,
  CustomerSegment,
  FleetDetails,
  PartnerDetails,
  UseCustomerFlowResult,
} from "@/app/interfaces/CustomerInterface";
import {
  useGetSupportB2cCustomerDetailQuery,
  useGetSupportFleetCustomerDetailQuery,
  useGetSupportPartnerCustomerDetailQuery,
  useRenewB2cSubscriptionMutation,
  useRenewFleetSubscriptionMutation,
  useRemoveSupportBranchMutation,
  useRemoveSupportVehicleMutation,
  useDeleteUserAccountMutation,
  useTerminateB2cSubscriptionMutation,
  useTerminateFleetSubscriptionMutation,
} from "@/app/store/api/customerApi";

/** Parses API error payloads (string body, `error`, or `detail` fields). */
function getErrMsg(e: unknown): string {
  if (e && typeof e === "object") {
    const x = e as { data?: unknown; status?: number };
    const d = x.data;
    if (typeof d === "string" && d.trim()) return d;
    if (d && typeof d === "object") {
      const o = d as { error?: string; detail?: string };
      if (o.error && typeof o.error === "string") return o.error;
      if (o.detail && typeof o.detail === "string") return o.detail;
    }
  }
  return "Something went wrong";
}

/**
 * @param customerId - Segment-specific id (user id, fleet id, or partner id).
 * @param segment - Drives which `customerApi` endpoint is active.
 */
export function useCustomerFlow<Seg extends CustomerSegment>(
  customerId: string,
  segment: Seg
): UseCustomerFlowResult<Seg>;
export function useCustomerFlow(customerId: string, segment: CustomerSegment) {
  const { setAlertConfig, setIsVisible } = useAlertContext();

  const b2cQ = useGetSupportB2cCustomerDetailQuery(customerId, {
    skip: !customerId || segment !== "b2c",
    refetchOnMountOrArgChange: true,
  });
  const fleetQ = useGetSupportFleetCustomerDetailQuery(customerId, {
    skip: !customerId || segment !== "fleets",
    refetchOnMountOrArgChange: true,
  });
  const partnerQ = useGetSupportPartnerCustomerDetailQuery(customerId, {
    skip: !customerId || segment !== "partners",
    refetchOnMountOrArgChange: true,
  });

  const customer = useMemo((): B2CDetails | FleetDetails | PartnerDetails | undefined => {
    if (segment === "b2c") return b2cQ.data;
    if (segment === "fleets") return fleetQ.data;
    return partnerQ.data;
  }, [segment, b2cQ.data, fleetQ.data, partnerQ.data]);

  const isLoading =
    segment === "b2c"
      ? b2cQ.isLoading
      : segment === "fleets"
        ? fleetQ.isLoading
        : partnerQ.isLoading;

  const isError =
    segment === "b2c" ? b2cQ.isError : segment === "fleets" ? fleetQ.isError : partnerQ.isError;

  const refetch = useCallback(() => {
    if (segment === "b2c") return b2cQ.refetch();
    if (segment === "fleets") return fleetQ.refetch();
    return partnerQ.refetch();
  }, [segment, b2cQ, fleetQ, partnerQ]);

  const showError = useCallback(
    (title: string, message: string) => {
      setAlertConfig({
        isVisible: true,
        title,
        message,
        type: "error",
        confirmLabel: "OK",
        onConfirm: () => setIsVisible(false),
      });
    },
    [setAlertConfig, setIsVisible]
  );

  const [terminateFleetSubscriptionMut, { isLoading: terminateFleetLoading }] =
    useTerminateFleetSubscriptionMutation();
  const [renewFleetSubscriptionMut, { isLoading: renewFleetLoading }] =
    useRenewFleetSubscriptionMutation();
  const [terminateB2cSubscriptionMut, { isLoading: terminateB2cLoading }] =
    useTerminateB2cSubscriptionMutation();
  const [renewB2cSubscriptionMut, { isLoading: renewB2cLoading }] = useRenewB2cSubscriptionMutation();
  const [removeVehicleMut, { isLoading: removeVehicleLoading }] = useRemoveSupportVehicleMutation();
  const [removeBranchMut, { isLoading: removeBranchLoading }] = useRemoveSupportBranchMutation();

  const terminateSubscription = useCallback(
    async (reason?: string) => {
      if (!customerId) return;
      try {
        if (segment === "fleets") {
          await terminateFleetSubscriptionMut({
            fleetId: customerId,
            ...(reason != null && reason.trim() ? { reason: reason.trim() } : {}),
          }).unwrap();
        } else if (segment === "b2c") {
          await terminateB2cSubscriptionMut({
            userId: customerId,
            ...(reason != null && reason.trim() ? { reason: reason.trim() } : {}),
          }).unwrap();
        } else {
          return;
        }
        await refetch();
      } catch (e) {
        showError("Could not terminate subscription", getErrMsg(e));
      }
    },
    [
      segment,
      customerId,
      terminateFleetSubscriptionMut,
      terminateB2cSubscriptionMut,
      refetch,
      showError,
    ]
  );

  const renewSubscription = useCallback(async () => {
    if (!customerId) return;
    try {
      if (segment === "fleets") {
        await renewFleetSubscriptionMut({ fleetId: customerId }).unwrap();
      } else if (segment === "b2c") {
        await renewB2cSubscriptionMut({ userId: customerId }).unwrap();
      } else {
        return;
      }
      await refetch();
    } catch (e) {
      showError("Could not renew subscription", getErrMsg(e));
    }
  }, [segment, customerId, renewFleetSubscriptionMut, renewB2cSubscriptionMut, refetch, showError]);

  const removeVehicle = useCallback(
    async (args: { vehicleId: string; fleetId?: string; userId?: string }) => {
      try {
        await removeVehicleMut({
          vehicleId: args.vehicleId,
          ...(args.fleetId != null ? { fleetId: args.fleetId } : {}),
          ...(args.userId != null ? { userId: args.userId } : {}),
        }).unwrap();
        await refetch();
      } catch (e) {
        showError("Could not remove vehicle", getErrMsg(e));
      }
    },
    [removeVehicleMut, refetch, showError]
  );

  const removeBranch = useCallback(
    async (fleetId: string, branchId: string) => {
      try {
        await removeBranchMut({ fleetId, branchId }).unwrap();
        await refetch();
      } catch (e) {
        showError("Could not remove branch", getErrMsg(e));
      }
    },
    [removeBranchMut, refetch, showError]
  );

  const [deleteUserAccountMut, { isLoading: deleteUserAccountMutLoading }] =
    useDeleteUserAccountMutation();

  const deleteUserAccount = useCallback(
    async (reason?: string) => {
      if (segment !== "b2c" || !customerId) return;
      try {
        await deleteUserAccountMut({ user_id: customerId, reason }).unwrap();
        await refetch();
      } catch (e) {
        showError("Could not delete account", getErrMsg(e));
        throw e;
      }
    },
    [segment, customerId, deleteUserAccountMut, refetch, showError],
  );

  const deleteUserAccountLoading =
    segment === "b2c" ? deleteUserAccountMutLoading : false;

  return {
    customer,
    isLoading,
    isError,
    refetch,
    terminateSubscription,
    renewSubscription,
    removeVehicle,
    removeBranch,
    deleteUserAccount,
    terminateSubscriptionLoading: terminateFleetLoading || terminateB2cLoading,
    renewSubscriptionLoading: renewFleetLoading || renewB2cLoading,
    removeVehicleLoading,
    removeBranchLoading,
    deleteUserAccountLoading,
  } satisfies UseCustomerFlowResult<CustomerSegment>;
}
