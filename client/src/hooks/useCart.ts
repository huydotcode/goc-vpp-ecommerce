import { cartService } from "@/services/cart.service";
import type { AddCartItemRequest, CartResponse } from "@/types/cart.types";
import { handleApiError } from "@/utils/error";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const cartKeys = {
  all: ["cart"] as const,
};

export const useCart = () => {
  const queryClient = useQueryClient();

  const cartQuery = useQuery<CartResponse>({
    queryKey: cartKeys.all,
    queryFn: () => cartService.getCart(),
    staleTime: 30_000,
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: cartKeys.all });

  const addItemMutation = useMutation({
    mutationFn: (payload: AddCartItemRequest) => cartService.addItem(payload),
    onSuccess: () => {
      invalidate();
      toast.success("Đã thêm vào giỏ");
    },
    onError: handleApiError,
  });

  const updateItemMutation = useMutation({
    mutationFn: ({
      cartItemId,
      quantity,
    }: {
      cartItemId: number;
      quantity: number;
    }) => cartService.updateItem({ cartItemId, quantity }),
    onSuccess: () => {
      invalidate();
      toast.success("Đã cập nhật số lượng");
    },
    onError: handleApiError,
  });

  const removeItemMutation = useMutation({
    mutationFn: (cartItemId: number) => cartService.removeItem(cartItemId),
    onSuccess: () => {
      invalidate();
      toast.success("Đã xóa sản phẩm");
    },
    onError: handleApiError,
  });

  const clearCartMutation = useMutation({
    mutationFn: () => cartService.clearCart(),
    onSuccess: () => {
      invalidate();
      toast.success("Đã làm trống giỏ hàng");
    },
    onError: handleApiError,
  });

  return {
    cart: cartQuery.data,
    isLoading: cartQuery.isLoading,
    isFetching: cartQuery.isFetching,
    refetch: cartQuery.refetch,
    addItem: addItemMutation.mutateAsync,
    updateItem: updateItemMutation.mutateAsync,
    removeItem: removeItemMutation.mutateAsync,
    clearCart: clearCartMutation.mutateAsync,
    adding: addItemMutation.isPending,
    updating: updateItemMutation.isPending,
    removing: removeItemMutation.isPending,
    clearing: clearCartMutation.isPending,
  };
};
