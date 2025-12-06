import apiClient from "./client";
import { API_ENDPOINTS } from "./endpoints";
import type {
  AddCartItemRequest,
  CartResponse,
  UpdateCartItemRequest,
} from "@/types/cart.types";

export const cartApi = {
  getCart: async (): Promise<CartResponse> => {
    const res = await apiClient.get<CartResponse>(API_ENDPOINTS.CART);
    return res.data;
  },

  addItem: async (payload: AddCartItemRequest): Promise<CartResponse> => {
    const res = await apiClient.post<CartResponse>(
      API_ENDPOINTS.CART_ITEMS,
      payload
    );
    return res.data;
  },

  updateItem: async ({
    cartItemId,
    quantity,
  }: UpdateCartItemRequest): Promise<CartResponse> => {
    const res = await apiClient.put<CartResponse>(
      `${API_ENDPOINTS.CART_ITEMS}/${cartItemId}?quantity=${quantity}`
    );
    return res.data;
  },

  removeItem: async (cartItemId: number): Promise<CartResponse> => {
    const res = await apiClient.delete<CartResponse>(
      `${API_ENDPOINTS.CART_ITEMS}/${cartItemId}`
    );
    return res.data;
  },

  clearCart: async (): Promise<void> => {
    await apiClient.delete<void>(API_ENDPOINTS.CART);
  },
};
