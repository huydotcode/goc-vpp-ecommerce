import apiClient from "./client";
import { API_ENDPOINTS } from "./endpoints";
import type {
  CheckoutRequest,
  CheckoutResponse,
  Order,
  OrderStatistics,
  OrderStatisticsByRange,
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

  getMyOrders: async (): Promise<Order[]> => {
    const res = (await apiClient.get(API_ENDPOINTS.ORDERS)) as
      | Order[]
      | ApiResponseWrapper<Order[]>;

    if (Array.isArray(res)) {
      return res;
    }
    if (res && typeof res === "object" && "data" in res && res.data) {
      return (res as ApiResponseWrapper<Order[]>).data;
    }

    throw new Error("Không đọc được danh sách đơn hàng");
  },

  getStatistics: async (): Promise<OrderStatistics> => {
    const res = (await apiClient.get(API_ENDPOINTS.ORDERS_STATISTICS)) as
      | OrderStatistics
      | ApiResponseWrapper<OrderStatistics>;

    if (res && typeof res === "object") {
      // Nếu có dailySales trực tiếp (không wrap)
      if ("dailySales" in res) {
        return res as OrderStatistics;
      }

      // Nếu được wrap trong ApiResponse
      if ("data" in res && res.data) {
        return (res as ApiResponseWrapper<OrderStatistics>).data;
      }
    }

    throw new Error("Không đọc được thống kê từ response");
  },

  getStatisticsByRange: async (
    startDate: string,
    endDate: string
  ): Promise<OrderStatisticsByRange> => {
    const res = (await apiClient.get(
      `${API_ENDPOINTS.ORDERS_STATISTICS_RANGE}?startDate=${startDate}&endDate=${endDate}`
    )) as OrderStatisticsByRange | ApiResponseWrapper<OrderStatisticsByRange>;

    if (res && typeof res === "object") {
      // Nếu có dailySales trực tiếp (không wrap)
      if ("dailySales" in res) {
        return res as OrderStatisticsByRange;
      }

      // Nếu được wrap trong ApiResponse
      if ("data" in res && res.data) {
        return (res as ApiResponseWrapper<OrderStatisticsByRange>).data;
      }
    }

    throw new Error("Không đọc được thống kê từ response");
  },

  getAllOrders: async (): Promise<Order[]> => {
    const res = (await apiClient.get(`${API_ENDPOINTS.ORDERS}/all`)) as
      | Order[]
      | ApiResponseWrapper<Order[]>;

    if (Array.isArray(res)) {
      return res;
    }
    if (res && typeof res === "object" && "data" in res && res.data) {
      return (res as ApiResponseWrapper<Order[]>).data;
    }

    throw new Error("Không đọc được danh sách đơn hàng");
  },

  getAdminOrderByCode: async (orderCode: string): Promise<Order> => {
    const res = (await apiClient.get(
      `${API_ENDPOINTS.ORDERS}/admin/${orderCode}`
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
