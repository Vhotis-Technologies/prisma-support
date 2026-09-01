/** Partner and crew payout queues, unpaid earnings, and mark-paid. */
import { SUPPORT_API } from "../../lib/routes";
import type {
  CreateCrewPayoutArg,
  CreateCrewPayoutResponse,
  CrewPayoutQueueItem,
  CrewUnpaidDetail,
  CrewUnpaidSummary,
  MarkCrewPayoutPaidArg,
  MarkPartnerPayoutPaidArg,
  PartnerBalance,
  PartnerPayoutQueueItem,
  RecordCrewPaymentMadeArg,
  RecordCrewPaymentMadeResult,
} from "../../types/payout";
import { getData, postData } from "./client";

export async function getPartnerPayoutQueue(
  status?: string,
): Promise<PartnerPayoutQueueItem[]> {
  const response = await getData<{ data?: { payout_requests?: PartnerPayoutQueueItem[] } }>(
    SUPPORT_API.partnerPayoutQueue,
    { params: status ? { status } : undefined },
  );
  return response.data?.payout_requests ?? [];
}

export async function getCrewPayoutQueue(status?: string): Promise<CrewPayoutQueueItem[]> {
  const response = await getData<{ data?: { payout_requests?: CrewPayoutQueueItem[] } }>(
    SUPPORT_API.crewPayoutQueue,
    { params: status ? { status } : undefined },
  );
  return response.data?.payout_requests ?? [];
}

export async function getCrewPayoutDetail(
  payoutId: string,
): Promise<CrewPayoutQueueItem | null> {
  const response = await getData<{ data?: { payout?: CrewPayoutQueueItem } }>(
    SUPPORT_API.crewPayoutDetail,
    { params: { payout_id: payoutId } },
  );
  return response.data?.payout ?? null;
}

export async function getPartnerBalance(
  payoutRequestId: string,
): Promise<PartnerBalance | null> {
  const response = await getData<{ data?: PartnerBalance }>(SUPPORT_API.partnerBalance, {
    params: { payout_request_id: payoutRequestId },
  });
  return response.data ?? null;
}

export async function getCrewUnpaidEarnings(): Promise<CrewUnpaidSummary[]> {
  const response = await getData<{ data?: { crew_unpaid_earnings?: CrewUnpaidSummary[] } }>(
    SUPPORT_API.crewUnpaidEarnings,
  );
  return response.data?.crew_unpaid_earnings ?? [];
}

export async function getCrewUnpaidEarningsDetail(
  crewMemberId: string,
): Promise<CrewUnpaidDetail | null> {
  const response = await getData<{ data?: CrewUnpaidDetail }>(
    SUPPORT_API.crewUnpaidEarningsDetail,
    { params: { crew_member_id: crewMemberId } },
  );
  return response.data ?? null;
}

export function markPartnerPayoutPaid(body: MarkPartnerPayoutPaidArg) {
  return postData<{ message?: string }>(SUPPORT_API.markPartnerPayoutPaid, body);
}

export function markCrewPayoutPaid(body: MarkCrewPayoutPaidArg) {
  return postData<{ message?: string }>(SUPPORT_API.markCrewPayoutPaid, body);
}

export function createCrewPayout(body: CreateCrewPayoutArg) {
  return postData<CreateCrewPayoutResponse>(SUPPORT_API.createCrewPayout, body);
}

export async function recordCrewPaymentMade(
  body: RecordCrewPaymentMadeArg,
): Promise<RecordCrewPaymentMadeResult | undefined> {
  const response = await postData<{ data?: RecordCrewPaymentMadeResult }>(
    SUPPORT_API.recordCrewPaymentMade,
    body,
  );
  return response.data;
}
