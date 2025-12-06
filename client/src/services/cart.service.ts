import { cartApi } from "@/api/cart.api";
import type {
  AddCartItemRequest,
  CartResponse,
  UpdateCartItemRequest,
} from "@/types/cart.types";

export const cartService = {
  getCart: (): Promise<CartResponse> => cartApi.getCart(),
  addItem: (payload: AddCartItemRequest): Promise<CartResponse> =>
    cartApi.addItem(payload),
  updateItem: (payload: UpdateCartItemRequest): Promise<CartResponse> =>
    cartApi.updateItem(payload),
  removeItem: (cartItemId: number): Promise<CartResponse> =>
    cartApi.removeItem(cartItemId),
  clearCart: (): Promise<void> => cartApi.clearCart(),
};
