/** B2C, fleet, partner, branch, and vehicle records. */
import { SUPPORT_API } from "../../lib/routes";
import type {
  B2CDetails,
  B2cSubscriptionMutationPayload,
  CustomerSegment,
  DeleteUserAccountArg,
  DeleteUserAccountResult,
  FleetBranchDetails,
  FleetDetails,
  FleetSubscriptionMutationPayload,
  PartnerDetails,
  RemoveSupportBranchArg,
  RemoveSupportVehicleArg,
  RenewB2cSubscriptionArg,
  RenewFleetSubscriptionArg,
  ReferredUserDetails,
  SupportCustomerListItem,
  SupportFleetBranchQueryArg,
  TerminateB2cSubscriptionArg,
  TerminateFleetSubscriptionArg,
} from "../../types/customer";
import type {
  SupportVehicleStats,
  SupportVehicleTransferResponse,
  VehicleTransferAction,
} from "../../types/vehicle";
import { getData, patchData, postData } from "./client";

function parseListRows(
  rows: unknown[],
  segment: CustomerSegment,
): SupportCustomerListItem[] {
  const out: SupportCustomerListItem[] = [];
  for (const row of rows) {
    if (!row || typeof row !== "object") continue;
    const type = (row as { type?: unknown }).type;
    if (segment === "b2c" && type === "b2c") {
      out.push(row as SupportCustomerListItem);
    } else if (segment === "fleets" && type === "fleet") {
      out.push(row as SupportCustomerListItem);
    } else if (segment === "partners" && type === "partner") {
      out.push(row as SupportCustomerListItem);
    }
  }
  return out;
}

export async function getSupportCustomersList(
  segment: CustomerSegment,
): Promise<SupportCustomerListItem[]> {
  const response = await getData<{ data?: { customers?: unknown[] } }>(
    SUPPORT_API.customersList,
    { params: { segment } },
  );
  const rows = Array.isArray(response.data?.customers) ? response.data.customers : [];
  return parseListRows(rows, segment);
}

export async function getSupportB2cCustomerDetail(customerId: string): Promise<B2CDetails> {
  const response = await getData<{ data?: { customer?: B2CDetails } }>(
    SUPPORT_API.b2cDetail,
    { params: { customer_id: customerId } },
  );
  const customer = response.data?.customer;
  if (!customer) throw new Error("Missing customer in response");
  return customer;
}

export async function getSupportFleetCustomerDetail(customerId: string): Promise<FleetDetails> {
  const response = await getData<{ data?: { customer?: FleetDetails } }>(
    SUPPORT_API.fleetDetail,
    { params: { customer_id: customerId } },
  );
  const customer = response.data?.customer;
  if (!customer) throw new Error("Missing customer in response");
  return customer;
}

export async function getSupportPartnerCustomerDetail(
  customerId: string,
): Promise<PartnerDetails> {
  const response = await getData<{ data?: { customer?: PartnerDetails } }>(
    SUPPORT_API.partnerDetail,
    { params: { customer_id: customerId } },
  );
  const customer = response.data?.customer;
  if (!customer) throw new Error("Missing customer in response");
  return customer;
}

export async function getSupportFleetBranchDetail(
  arg: SupportFleetBranchQueryArg,
): Promise<FleetBranchDetails> {
  const response = await getData<{ data?: { branch?: FleetBranchDetails } }>(
    SUPPORT_API.fleetBranchDetail,
    { params: { fleet_id: arg.fleetId, branch_id: arg.branchId } },
  );
  const branch = response.data?.branch;
  if (!branch) throw new Error("Missing branch in response");
  return branch;
}

export async function getSupportPartnerReferredUsers(
  partnerId: string,
): Promise<ReferredUserDetails[]> {
  const response = await getData<{ data?: { users?: ReferredUserDetails[] } }>(
    SUPPORT_API.partnerReferredUsers,
    { params: { partner_id: partnerId } },
  );
  return response.data?.users ?? [];
}

export async function getSupportVehicleDetail(vehicleId: string): Promise<SupportVehicleStats> {
  const response = await getData<{ data?: SupportVehicleStats; error?: string }>(
    SUPPORT_API.vehicleDetail,
    { params: { vehicle_id: vehicleId } },
  );
  const raw = response.data;
  if (!raw?.vehicle) {
    throw new Error(response.error || "Missing vehicle in response");
  }
  return {
    ...raw,
    vehicle: {
      ...raw.vehicle,
      licence: raw.vehicle.licence || raw.vehicle.registration_number || "",
    },
  };
}

export function terminateFleetSubscription(arg: TerminateFleetSubscriptionArg) {
  return patchData<{ data?: FleetSubscriptionMutationPayload }>(
    SUPPORT_API.terminateFleetSubscription,
    { fleet_id: arg.fleetId, ...(arg.reason != null ? { reason: arg.reason } : {}) },
  );
}

export function renewFleetSubscription(arg: RenewFleetSubscriptionArg) {
  return patchData<{ data?: FleetSubscriptionMutationPayload }>(
    SUPPORT_API.renewFleetSubscription,
    { fleet_id: arg.fleetId },
  );
}

export function terminateB2cSubscription(arg: TerminateB2cSubscriptionArg) {
  return patchData<{ data?: B2cSubscriptionMutationPayload }>(
    SUPPORT_API.terminateB2cSubscription,
    { user_id: arg.userId, ...(arg.reason != null ? { reason: arg.reason } : {}) },
  );
}

export function renewB2cSubscription(arg: RenewB2cSubscriptionArg) {
  return patchData<{ data?: B2cSubscriptionMutationPayload }>(
    SUPPORT_API.renewB2cSubscription,
    { user_id: arg.userId },
  );
}

export function removeSupportVehicle(arg: RemoveSupportVehicleArg) {
  return patchData<{ data?: { message?: string } }>(SUPPORT_API.removeVehicle, {
    vehicle_id: arg.vehicleId,
    ...(arg.fleetId != null ? { fleet_id: arg.fleetId } : {}),
    ...(arg.userId != null ? { user_id: arg.userId } : {}),
  });
}

export function removeSupportBranch(arg: RemoveSupportBranchArg) {
  return patchData<{ data?: { message?: string } }>(SUPPORT_API.removeBranch, {
    fleet_id: arg.fleetId,
    branch_id: arg.branchId,
  });
}

export function supportVehicleTransfer(arg: {
  vehicleId: string;
  transferId: string;
  action: VehicleTransferAction;
}) {
  return patchData<SupportVehicleTransferResponse>(SUPPORT_API.vehicleTransfer, {
    vehicle_id: arg.vehicleId,
    transfer_id: arg.transferId,
    action: arg.action,
  });
}

export async function deleteUserAccount(
  body: DeleteUserAccountArg,
): Promise<DeleteUserAccountResult> {
  const response = await postData<{ data?: DeleteUserAccountResult }>(
    SUPPORT_API.deleteUserAccount,
    body,
  );
  return response.data ?? {};
}
