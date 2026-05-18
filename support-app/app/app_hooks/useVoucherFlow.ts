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
import { useAlertContext } from "../contexts/AlertContext";

export type VoucherTabKind = "winner" | "gift";

function getErrMsg(e: unknown): string {
  if (!e || typeof e !== "object") return "Something went wrong";
  const data = (e as { data?: unknown }).data;
  if (typeof data === "object" && data !== null && "error" in data) {
    const err = (data as { error: unknown }).error;
    if (typeof err === "string" && err.trim()) return err;
  }
  if (typeof data === "string" && data.trim()) return data;
  return "Something went wrong";
}

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

/* Get the voucher detail. the method checks to ensure that the user grants the permission to deactivate the voucher.
 * */
export function useVoucherDetailFlow(
  voucherId: string | undefined,
  tabKind: VoucherTabKind,
) {
  const access = useAppSelector((s) => s.auth.access);
  const { setAlertConfig, setIsVisible } = useAlertContext();


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
    [setAlertConfig, setIsVisible],
  );

  const isWinner = tabKind === "winner";
  const voucher = isWinner ? winnerQ.data : giftQ.data;
  const isLoading = isWinner ? winnerQ.isLoading : giftQ.isLoading;
  const isFetching = isWinner ? winnerQ.isFetching : giftQ.isFetching;
  const isError = isWinner ? winnerQ.isError : giftQ.isError;
  const refetch = isWinner ? winnerQ.refetch : giftQ.refetch;

  const deactivateVoucher = useCallback(() => {
    if (!voucherId) return;

    const label = isWinner ? "winner" : "gift";
    const code = voucher?.code ? ` (${voucher.code})` : "";

    setAlertConfig({
      isVisible: true,
      title: "Deactivate voucher?",
      message: `Are you sure you want to deactivate this ${label} voucher${code}? This cannot be undone.`,
      type: "warning",
      confirmLabel: "Deactivate",
      onClose: () => setIsVisible(false),
      onConfirm: () => {
        void (async () => {
          try {
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
            setIsVisible(false);
          } catch (e: unknown) {
            setIsVisible(false);
            showError("Could not deactivate voucher", getErrMsg(e));
          }
        })();
      },
    });
  }, [
    voucherId,
    voucher?.code,
    isWinner,
    updateWinnerMut,
    updateGiftMut,
    setAlertConfig,
    setIsVisible,
    showError,
  ]);

  const canDeactivate = Boolean(
    voucher && voucher.isActive && (voucher.kind !== "gift" || voucher.isPaid),
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
