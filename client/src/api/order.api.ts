import apiClient from "./client";
import { API_ENDPOINTS } from "./endpoints";
import type {
  CheckoutRequest,
  CheckoutResponse,
  Order,
} from "../types/order.types";

interface ApiResponseWrapper<T> {
  status: string;
  message: string;
  data: T;
  errorCode?: string | null;
}

export const orderApi = {
  checkout: async (data: CheckoutRequest): Promise<CheckoutResponse> => {
    const res = (await apiClient.post(API_ENDPOINTS.ORDERS_CHECKOUT, data)) as
      | CheckoutResponse
      | ApiResponseWrapper<CheckoutResponse>;

    // Response có thể được wrap trong APIResponse
    if (res && typeof res === "object") {
      // Nếu có orderCode trực tiếp (không wrap)
      if ("orderCode" in res) {
        return res as CheckoutResponse;
      }

      // Nếu được wrap trong ApiResponse
      if ("data" in res && res.data) {
        return (res as ApiResponseWrapper<CheckoutResponse>).data;
      }
    }

    throw new Error("Không đọc được response từ checkout");
  },

  getOrderByCode: async (orderCode: string): Promise<Order> => {
    const res = (await apiClient.get(
      `${API_ENDPOINTS.ORDERS}/${orderCode}`
    )) as Order | ApiResponseWrapper<Order>;

    if (res && typeof res === "object") {
      if ("orderCode" in res) {
        return res as Order;
      }

      if ("data" in res && res.data) {
        return (res as ApiResponseWrapper<Order>).data;
      }
    }

    throw new Error("Không đọc được order từ response");
  },
};
