import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { orderApi } from "../api/order.api";
import { orderService } from "@/services/order.service";
import type { CheckoutRequest, Order } from "../types/order.types";
import { handleApiError } from "../utils/error";

export const useCheckout = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CheckoutRequest) => orderApi.checkout(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
    },
    onError: (error) => {
      handleApiError(error);
    },
  });
};

export const useOrder = (orderCode: string | null, enabled = true) => {
  return useQuery({
    queryKey: ["order", orderCode],
    queryFn: () => orderApi.getOrderByCode(orderCode!),
    enabled: enabled && !!orderCode,
  });
};

export type OrdersSortKey = "newest" | "oldest" | "amountDesc" | "amountAsc";

interface UseUserOrdersParams {
  status?: string;
  search?: string;
  sortKey: OrdersSortKey;
  page: number; // 1-based
  pageSize: number;
}

export const useUserOrders = ({
  status,
  search,
  sortKey,
  page,
  pageSize,
}: UseUserOrdersParams) => {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["userOrders", status, search, sortKey, page, pageSize],
    queryFn: async (): Promise<{
      content: Order[];
      totalElements: number;
      number: number;
    }> => {
      try {
        const sortBy =
          sortKey === "amountDesc" || sortKey === "amountAsc"
            ? "finalAmount"
            : "createdAt";
        const sortDir =
          sortKey === "oldest" || sortKey === "amountAsc" ? "ASC" : "DESC";

        return await orderService.getMyOrdersPaged({
          page: page - 1,
          size: pageSize,
          status,
          search: search?.trim() || undefined,
          sortBy,
          sortDir,
        });
      } catch (error) {
        handleApiError(error);
        throw error;
      }
    },
  });

  const cancelMutation = useMutation({
    mutationFn: async (params: { orderCode: string; reason?: string }) => {
      return orderService.cancelOrder(params.orderCode, params.reason);
    },
    onSuccess: () => {
      toast.success("Hủy đơn hàng thành công");
      queryClient.invalidateQueries({ queryKey: ["userOrders"] });
    },
    onError: handleApiError,
  });

  return {
    ordersData: {
      content: data?.content ?? [],
      totalElements: data?.totalElements ?? 0,
      number: data?.number ?? 0,
    },
    isLoading,
    cancelMutation,
  };
};
