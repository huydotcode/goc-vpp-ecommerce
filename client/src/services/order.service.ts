import { orderApi } from "@/api/order.api";
import type { Order } from "@/types/order.types";

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
};
