import { orderApi } from "@/api/order.api";
import type { Order } from "@/types/order.types";
import type { PageResult } from "@/types/page.types";

export interface OrderFilter {
  status?: string;
}

export const orderService = {
  getMyOrders: async (filter?: OrderFilter): Promise<Order[]> => {
    // Backend chưa có filter, tạm thời lấy tất cả rồi filter client nếu cần
    const orders = await orderApi.getMyOrders();
    if (filter?.status) {
      return orders.filter((o) => o.status === filter.status);
    }
    return orders;
  },

  getMyOrdersPaged: async (params: {
    page?: number;
    size?: number;
    status?: string;
    search?: string;
    sortBy?: string;
    sortDir?: "ASC" | "DESC";
  }): Promise<PageResult<Order>> => {
    return await orderApi.getMyOrdersPaged(params);
  },

  cancelOrder: async (orderCode: string, reason?: string): Promise<Order> => {
    return await orderApi.cancelOrder(orderCode, reason);
  },

  getAllOrders: async (): Promise<Order[]> => {
    return await orderApi.getAllOrders();
  },

  getAdminOrderByCode: async (orderCode: string): Promise<Order> => {
    return await orderApi.getAdminOrderByCode(orderCode);
  },
};
