import { useAuth } from "@/contexts/AuthContext";
import { cartService } from "@/services/cart.service";
import type {
  AddCartItemRequest,
  CartItem,
  CartPromotionPreview,
  CartResponse,
} from "@/types/cart.types";
import { handleApiError } from "@/utils/error";
import {
  buildGuestCartItemId,
  clearGuestCart,
  loadGuestCart,
  removeGuestItem,
  updateGuestItemQuantity,
  upsertGuestItem,
} from "@/utils/guestCart";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import React, { useCallback } from "react";
import { toast } from "sonner";

const cartKeys = {
  all: (isAuthenticated: boolean) =>
    ["cart", isAuthenticated ? "auth" : "guest"] as const,
};

type AddCartItemPayload = AddCartItemRequest;
type UpdateCartItemPayload = { cartItemId: number; quantity: number };

export const useCart = () => {
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuth();

  const buildGuestCartResponse = (items: CartItem[]): CartResponse => {
    const totalAmount = items.reduce((sum, it) => sum + it.subtotal, 0);
    const totalItems = items.reduce((sum, it) => sum + it.quantity, 0);
    return {
      cartId: -1,
      items,
      totalAmount,
      totalItems,
      discountAmount: 0,
      finalAmount: totalAmount,
      appliedPromotions: [],
      giftItems: [],
    };
  };

  const getGuestItems = (): CartItem[] => {
    const raw = loadGuestCart();
    return raw.map((it) => {
      const unitPrice = it.unitPrice ?? 0;
      return {
        id: it.id,
        productId: it.productId,
        variantId: it.variantId,
        productName: it.productName,
        variantName: it.variantName,
        sku: it.sku,
        productImageUrl: it.productImageUrl,
        unitPrice,
        quantity: it.quantity,
        subtotal: unitPrice * it.quantity,
        isGuest: true,
      };
    });
  };

  const cartQuery = useQuery<CartResponse>({
    queryKey: cartKeys.all(isAuthenticated),
    queryFn: () => {
      if (isAuthenticated) {
        return cartService.getCart();
      }
      return Promise.resolve(buildGuestCartResponse(getGuestItems()));
    },
    staleTime: 30_000,
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: cartKeys.all(isAuthenticated) });

  const addItemMutation = useMutation({
    mutationFn: async (payload: AddCartItemPayload) => {
      if (isAuthenticated) {
        const { productId, variantId, quantity } = payload;
        return cartService.addItem({ productId, variantId, quantity });
      }

      const {
        productId,
        variantId = null,
        quantity,
        productName = "Sản phẩm",
        variantName = null,
        sku = null,
        productImageUrl = null,
        unitPrice = 0,
      } = payload;

      const id = buildGuestCartItemId(productId, variantId);
      const nextItems = upsertGuestItem({
        id,
        productId,
        variantId,
        quantity,
        productName,
        variantName,
        sku,
        productImageUrl,
        unitPrice,
      });

      return buildGuestCartResponse(
        nextItems.map((it) => ({
          ...it,
          subtotal: (it.unitPrice ?? 0) * it.quantity,
          isGuest: true,
        }))
      );
    },
    onSuccess: (data) => {
      queryClient.setQueryData(cartKeys.all(isAuthenticated), data);
      toast.success("Đã thêm vào giỏ");
    },
    onError: handleApiError,
  });

  const updateItemMutation = useMutation({
    mutationFn: async ({ cartItemId, quantity }: UpdateCartItemPayload) => {
      if (isAuthenticated) {
        return cartService.updateItem({ cartItemId, quantity });
      }
      const nextItems = updateGuestItemQuantity(cartItemId, quantity);
      return buildGuestCartResponse(
        nextItems.map((it) => ({
          ...it,
          subtotal: (it.unitPrice ?? 0) * it.quantity,
          isGuest: true,
        }))
      );
    },
    onSuccess: (data) => {
      queryClient.setQueryData(cartKeys.all(isAuthenticated), data);
      toast.success("Đã cập nhật số lượng");
    },
    onError: handleApiError,
  });

  const removeItemMutation = useMutation({
    mutationFn: async (cartItemId: number) => {
      if (isAuthenticated) {
        return cartService.removeItem(cartItemId);
      }
      const nextItems = removeGuestItem(cartItemId);
      return buildGuestCartResponse(
        nextItems.map((it) => ({
          ...it,
          subtotal: (it.unitPrice ?? 0) * it.quantity,
          isGuest: true,
        }))
      );
    },
    onSuccess: (data) => {
      queryClient.setQueryData(cartKeys.all(isAuthenticated), data);
      toast.success("Đã xóa sản phẩm");
    },
    onError: handleApiError,
  });

  const clearCartMutation = useMutation({
    mutationFn: async () => {
      if (isAuthenticated) {
        return cartService.clearCart();
      }
      clearGuestCart();
      return buildGuestCartResponse([]);
    },
    onSuccess: (data) => {
      queryClient.setQueryData(cartKeys.all(isAuthenticated), data);
      toast.success("Đã làm trống giỏ hàng");
    },
    onError: handleApiError,
  });

  // Merge guest cart into server cart when user logs in
  const mergeGuestCart = async () => {
    const guestItems = loadGuestCart();
    if (!guestItems.length) return;
    for (const item of guestItems) {
      try {
        await cartService.addItem({
          productId: item.productId,
          variantId: item.variantId ?? null,
          quantity: item.quantity,
        });
      } catch (error) {
        // swallow and continue to merge others
        console.error("Failed to merge guest cart item", item, error);
      }
    }
    clearGuestCart();
    invalidate();
  };

  React.useEffect(() => {
    if (isAuthenticated) {
      void mergeGuestCart();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  const previewPromotionsFn = useCallback(
    async (cartItemIds: number[]): Promise<CartPromotionPreview> => {
      if (isAuthenticated) {
        return cartService.previewPromotions(cartItemIds);
      }
      const items = getGuestItems().filter((it) =>
        cartItemIds.includes(it.id)
      );
      const subtotal = items.reduce((sum, it) => sum + it.subtotal, 0);
      return {
        subtotal,
        discountAmount: 0,
        finalAmount: subtotal,
        appliedPromotions: [],
        giftItems: [],
      };
    },
    [isAuthenticated]
  );

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
    previewPromotions: previewPromotionsFn,
  };
};
