import {
  adminOrderApi,
  type AdminOrderFilters,
  type OrderStatistics,
  type BulkOrderRequest,
  type BulkOrderResponse,
  type OrderHistoryItem,
} from "@/api/adminOrder.api";
import type { OrderDetail } from "@/types/order.types";

export const adminOrderService = {
  getAllOrders: async (filters?: AdminOrderFilters) => {
    return await adminOrderApi.getAllOrders(filters);
  },

  getOrderByCode: async (orderCode: string): Promise<OrderDetail> => {
    return await adminOrderApi.getOrderByCode(orderCode);
  },

  updateOrderStatus: async (
    orderCode: string,
    status: string,
    note?: string
  ) => {
    return await adminOrderApi.updateOrderStatus(orderCode, status, note);
  },

  updateShippingInfo: async (
    orderCode: string,
    data: { customerAddress?: string; customerPhone?: string }
  ) => {
    return await adminOrderApi.updateShippingInfo(orderCode, data);
  },

  getStatistics: async (
    startDate?: string,
    endDate?: string
  ): Promise<OrderStatistics> => {
    return await adminOrderApi.getStatistics(startDate, endDate);
  },

  bulkUpdateOrders: async (
    request: BulkOrderRequest
  ): Promise<BulkOrderResponse> => {
    return await adminOrderApi.bulkUpdateOrders(request);
  },

  getOrderHistory: async (orderCode: string): Promise<OrderHistoryItem[]> => {
    return await adminOrderApi.getOrderHistory(orderCode);
  },
};
