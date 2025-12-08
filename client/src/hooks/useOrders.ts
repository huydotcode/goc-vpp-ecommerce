import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { orderApi } from "../api/order.api";
import type { CheckoutRequest } from "../types/order.types";
import { handleApiError } from "../utils/error";

export const useCheckout = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CheckoutRequest) => orderApi.checkout(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      toast.success("Đặt hàng thành công!");
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
