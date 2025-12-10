import type { Order, OrderDetail } from "@/types/order.types";
import apiClient from "./client";

export interface AdminOrdersResponse {
  content: Order[];
  currentPage: number;
  totalItems: number;
  totalPages: number;
  pageSize: number;
}

export interface AdminOrderFilters {
  orderCode?: string;
  status?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  size?: number;
  sortBy?: string;
  direction?: "asc" | "desc";
}

export interface OrderStatistics {
  totalOrders: number;
  totalRevenue: number;
  pendingCount: number;
  confirmedCount: number;
  shippingCount: number;
  completedCount: number;
  cancelledCount: number;
  paidCount: number;
  deliveredCount: number;
  refundedCount: number;
}

export interface BulkOrderRequest {
  orderIds: number[];
  action: "UPDATE_STATUS" | "EXPORT";
  params: {
    status?: string;
  };
}

export interface BulkOrderResult {
  orderId: number;
  orderCode: string | null;
  success: boolean;
  message: string;
}

export interface BulkOrderResponse {
  totalRequested: number;
  successCount: number;
  failedCount: number;
  results: BulkOrderResult[];
  message: string;
}

export interface OrderHistoryItem {
  id: number;
  changeType: string;
  changeTypeLabel: string;
  oldValue?: string;
  newValue?: string;
  note?: string;
  ipAddress?: string;
  createdAt: string;
  changedByUserId?: number;
  changedByName?: string;
  changedByUsername?: string;
}

export const adminOrderApi = {
  getAllOrders: async (
    filters?: AdminOrderFilters
  ): Promise<AdminOrdersResponse> => {
    const params = new URLSearchParams();

    if (filters?.orderCode) params.append("orderCode", filters.orderCode);
    if (filters?.status) params.append("status", filters.status);
    if (filters?.customerName)
      params.append("customerName", filters.customerName);
    if (filters?.customerEmail)
      params.append("customerEmail", filters.customerEmail);
    if (filters?.customerPhone)
      params.append("customerPhone", filters.customerPhone);
    if (filters?.startDate) params.append("startDate", filters.startDate);
    if (filters?.endDate) params.append("endDate", filters.endDate);
    if (filters?.page !== undefined)
      params.append("page", filters.page.toString());
    if (filters?.size !== undefined)
      params.append("size", filters.size.toString());
    if (filters?.sortBy) params.append("sortBy", filters.sortBy);
    if (filters?.direction) params.append("direction", filters.direction);

    const response = await apiClient.get<AdminOrdersResponse>(
      `/orders/admin/all${params.toString() ? `?${params.toString()}` : ""}`
    );
    return response.data;
  },

  getOrderByCode: async (orderCode: string): Promise<OrderDetail> => {
    const response = await apiClient.get<OrderDetail>(
      `/orders/admin/${orderCode}`
    );
    return response.data;
  },

  updateOrderStatus: async (
    orderCode: string,
    status: string,
    note?: string
  ): Promise<{ message: string }> => {
    const params: Record<string, string> = { status };
    if (note) params.note = note;

    const response = await apiClient.put<{ message: string }>(
      `/orders/admin/${orderCode}/status`,
      null,
      { params }
    );
    return response.data;
  },

  updateShippingInfo: async (
    orderCode: string,
    data: { customerAddress?: string; customerPhone?: string }
  ): Promise<{ message: string }> => {
    const response = await apiClient.put<{ message: string }>(
      `/orders/admin/${orderCode}/shipping`,
      data
    );
    return response.data;
  },

  getStatistics: async (
    startDate?: string,
    endDate?: string
  ): Promise<OrderStatistics> => {
    const params = new URLSearchParams();
    if (startDate) params.append("startDate", startDate);
    if (endDate) params.append("endDate", endDate);

    const response = await apiClient.get<OrderStatistics>(
      `/orders/admin/stats${params.toString() ? `?${params.toString()}` : ""}`
    );
    return response.data;
  },

  bulkUpdateOrders: async (
    request: BulkOrderRequest
  ): Promise<BulkOrderResponse> => {
    const response = await apiClient.post<BulkOrderResponse>(
      `/orders/admin/bulk-update`,
      request
    );
    return response.data;
  },

  getOrderHistory: async (orderCode: string): Promise<OrderHistoryItem[]> => {
    const response = await apiClient.get<OrderHistoryItem[]>(
      `/orders/admin/${orderCode}/history`
    );
    return response.data;
  },
};
