/**
 * Support vouchers: winner (RTK Query) vs gift (separate slice).
 */
import { useCallback, useMemo } from "react";
import { useAppSelector } from "@/app/store/main_store";
import {
  useGetVouchersListQuery,
  useGetVoucherDetailQuery,
  useCreateVoucherMutation,
  useUpdateVoucherMutation,
  type CreateVoucherBody,
} from "@/app/store/api/voucherApi";
import {
  useGetGiftVouchersListQuery,
  useGetGiftVoucherDetailQuery,
  useUpdateGiftVoucherMutation,
} from "@/app/store/api/giftVoucherApi";

export type VoucherTabKind = "winner" | "gift";

export function useWinnerVoucherFlow() {
  const access = useAppSelector((s) => s.auth.access);
  const {
    data: vouchers = [],
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useGetVouchersListQuery(undefined, {
    skip: !access,
    refetchOnMountOrArgChange: true,
  });

  const [createVoucherMut, { isLoading: isCreating }] =
    useCreateVoucherMutation();

  const sorted = useMemo(
    () =>
      [...vouchers].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
    [vouchers],
  );

  const createVoucher = useCallback(
    async (body: CreateVoucherBody) => {
      return createVoucherMut(body).unwrap();
    },
    [createVoucherMut],
  );

  return {
    vouchers: sorted,
    isLoading,
    isFetching,
    isError,
    refetch,
    createVoucher,
    isCreating,
  };
}

export function useGiftVoucherFlow() {
  const access = useAppSelector((s) => s.auth.access);
  const {
    data: vouchers = [],
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useGetGiftVouchersListQuery(undefined, {
    skip: !access,
    refetchOnMountOrArgChange: true,
  });

  const sorted = useMemo(
    () =>
      [...vouchers].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
    [vouchers],
  );

  return {
    vouchers: sorted,
    isLoading,
    isFetching,
    isError,
    refetch,
  };
}

export function useVoucherDetailFlow(
  voucherId: string | undefined,
  tabKind: VoucherTabKind,
) {
  const access = useAppSelector((s) => s.auth.access);
  const skipWinner = !access || !voucherId || tabKind !== "winner";
  const skipGift = !access || !voucherId || tabKind !== "gift";

  const winnerQ = useGetVoucherDetailQuery(voucherId!, {
    skip: skipWinner,
    refetchOnMountOrArgChange: true,
  });

  const giftQ = useGetGiftVoucherDetailQuery(voucherId!, {
    skip: skipGift,
    refetchOnMountOrArgChange: true,
  });

  const [updateWinnerMut, { isLoading: updatingWinner }] =
    useUpdateVoucherMutation();
  const [updateGiftMut, { isLoading: updatingGift }] =
    useUpdateGiftVoucherMutation();

  const isWinner = tabKind === "winner";
  const voucher = isWinner ? winnerQ.data : giftQ.data;
  const isLoading = isWinner ? winnerQ.isLoading : giftQ.isLoading;
  const isFetching = isWinner ? winnerQ.isFetching : giftQ.isFetching;
  const isError = isWinner ? winnerQ.isError : giftQ.isError;
  const refetch = isWinner ? winnerQ.refetch : giftQ.refetch;

  const deactivateVoucher = useCallback(async () => {
    if (!voucherId) return;
    if (isWinner) {
      await updateWinnerMut({
        voucherId,
        is_active: false,
      }).unwrap();
    } else {
      await updateGiftMut({
        voucherId,
        is_active: false,
      }).unwrap();
    }
  }, [voucherId, isWinner, updateWinnerMut, updateGiftMut]);

  const canDeactivate = Boolean(
    voucher &&
      voucher.isActive &&
      (voucher.kind !== "gift" || voucher.isPaid),
  );

  return {
    voucher,
    tabKind,
    isLoading,
    isFetching,
    isError,
    refetch,
    deactivateVoucher,
    isUpdating: updatingWinner || updatingGift,
    canDeactivate,
  };
}

export type { CreateVoucherBody };
