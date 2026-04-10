/**
 * Support winner vouchers: list, create, patch via RTK Query.
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

export function useVoucherFlow() {
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

  const getVoucherById = useCallback(
    (id: string) => sorted.find((v) => v.id === id),
    [sorted],
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
    getVoucherById,
    createVoucher,
    isCreating,
  };
}

export function useVoucherDetailFlow(voucherId: string | undefined) {
  const access = useAppSelector((s) => s.auth.access);
  const {
    data: voucher,
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useGetVoucherDetailQuery(voucherId!, {
    skip: !access || !voucherId,
    refetchOnMountOrArgChange: true,
  });

  const [updateVoucherMut, { isLoading: isUpdating }] =
    useUpdateVoucherMutation();

  const deactivateVoucher = useCallback(async () => {
    if (!voucherId) return;
    await updateVoucherMut({
      voucherId,
      is_active: false,
    }).unwrap();
  }, [voucherId, updateVoucherMut]);

  return {
    voucher,
    isLoading,
    isFetching,
    isError,
    refetch,
    deactivateVoucher,
    isUpdating,
    canDeactivate: Boolean(voucher?.isActive),
  };
}

export type { CreateVoucherBody };
