import { useMutation, useQuery } from "@tanstack/react-query";
import { orderApi } from "../api/order.api";
import { handleApiError } from "../utils/error";
import { toast } from "sonner";
import type { CheckoutRequest } from "../types/order.types";

export const useCheckout = () => {
  return useMutation({
    mutationFn: (data: CheckoutRequest) => orderApi.checkout(data),
    onSuccess: () => {
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
