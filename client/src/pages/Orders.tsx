import { orderService } from "@/services/order.service";
import { handleApiError } from "@/utils/error";
import { useQuery } from "@tanstack/react-query";
import { Card, Empty, Image, Spin, Tabs, Tag, Typography } from "antd";
import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";

import type { Order, OrderItem } from "@/types/order.types";

const statusColorMap: Record<string, string> = {
  COMPLETED: "green",
  PENDING: "gold",
  PROCESSING: "blue",
  SHIPPING: "blue",
  CONFIRMED: "blue",
  DELIVERED: "purple",
  PAID: "green",
  REFUNDED: "volcano",
  CANCELLED: "red",
  FAILED: "volcano",
};

const statusLabel = (status: string) => {
  switch (status) {
    case "COMPLETED":
      return "Hoàn thành";
    // ... (keep existing statusLabel logic if unchanged, but simpler to replace whole block if I want to be safe)
    case "PENDING":
    case "PROCESSING":
      return "Đang xử lý";
    case "CONFIRMED":
      return "Đã xác nhận";
    case "SHIPPING":
      return "Đang giao";
    case "DELIVERED":
      return "Đã giao";
    case "PAID":
      return "Đã thanh toán";
    case "REFUNDED":
      return "Đã hoàn tiền";
    case "CANCELLED":
      return "Đã hủy";
    case "FAILED":
      return "Thất bại";
    default:
      return status;
  }
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(value);

interface OrdersPageProps {
  isAdmin?: boolean;
}

const OrdersPage: React.FC<OrdersPageProps> = ({ isAdmin = false }) => {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = React.useState<string | undefined>();

  const { data, isLoading } = useQuery({
    queryKey: [isAdmin ? "adminOrders" : "userOrders", statusFilter],
    queryFn: async () => {
      try {
        if (isAdmin) {
          // Admin always fetches all orders, backend might support status filter later
          // For now, client-side filtering is applied below, but consistent with user page pattern
          return await orderService.getAllOrders();
        } else {
          return await orderService.getMyOrders({
            status: statusFilter,
          });
        }
      } catch (error) {
        handleApiError(error);
        throw error;
      }
    },
  });

  const renderCards = useMemo(() => {
    let orders: Order[] = (data as Order[]) || [];

    // Client-side filtering if API doesn't support it for Admin or if generic getMyOrders handling needs it
    if (statusFilter && statusFilter !== "ALL") {
      orders = orders.filter((o) => o.status === statusFilter);
    }

    if (!orders || orders.length === 0) {
      return (
        <div className="py-10">
          <Empty
            description={
              isAdmin ? "Không có đơn hàng nào." : "Bạn chưa có đơn hàng nào."
            }
          />
        </div>
      );
    }
    return (
      <div className="flex flex-col gap-3 sm:gap-4">
        {orders.map((order) => (
          <Card
            key={order.id}
            hoverable
            onClick={() =>
              navigate(
                isAdmin
                  ? `/admin/orders/${order.orderCode || order.id}`
                  : `/user/orders/${order.orderCode || order.id}`
              )
            }
            className="transition-shadow"
            style={{ border: "1px solid #e5e7eb" }}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex gap-3 flex-1">
                <div className="w-16 h-16 rounded-md overflow-hidden bg-gray-100 border border-gray-200 shrink-0">
                  {order.items && order.items[0]?.imageUrl ? (
                    <Image
                      src={order.items[0].imageUrl}
                      alt={order.items[0].productName}
                      preview={false}
                      width={64}
                      height={64}
                      style={{ objectFit: "cover" }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                      No image
                    </div>
                  )}
                </div>
                <div className="space-y-1 flex-1 min-w-0">
                  <Typography.Text strong>
                    Đơn hàng #{order.orderCode || order.id}
                  </Typography.Text>
                  <div className="text-sm text-gray-500">
                    {new Date(order.createdAt).toLocaleString("vi-VN", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                    {isAdmin &&
                      order.customerName &&
                      ` • ${order.customerName}`}
                  </div>
                  {order.items && order.items.length > 0 && (
                    <div className="text-sm text-gray-600 space-y-1">
                      {order.items
                        .slice(0, 2)
                        .map((item: OrderItem, idx: number) => (
                          <div key={idx} className="flex justify-between gap-2">
                            <span className="line-clamp-1">
                              {item.productName}
                              {item.isGift && (
                                <span className="text-red-500 ml-1">
                                  (GIFT)
                                </span>
                              )}
                            </span>
                            <span className="text-gray-500">
                              x{item.quantity}
                            </span>
                          </div>
                        ))}
                      {order.items.length > 2 && (
                        <div className="text-gray-500">
                          +{order.items.length - 2} sản phẩm khác
                        </div>
                      )}
                    </div>
                  )}
                  <div className="text-base font-semibold">
                    {formatCurrency(
                      Number(order.finalAmount || order.totalAmount)
                    )}
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <Tag color={statusColorMap[order.status] || "default"}>
                  {statusLabel(order.status)}
                </Tag>

                {order.paymentMethod && (
                  <Typography.Text type="secondary" className="text-xs">
                    {order.paymentMethod === "COD"
                      ? "COD"
                      : "Thanh toán online"}
                  </Typography.Text>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  }, [data, navigate, isAdmin, statusFilter]);

  const tabs = [
    { key: "ALL", label: "Tất cả", value: undefined },
    { key: "PENDING", label: "Đang xử lý", value: "PENDING" },
    { key: "CONFIRMED", label: "Đã xác nhận", value: "CONFIRMED" },
    { key: "SHIPPING", label: "Đang giao", value: "SHIPPING" },
    { key: "COMPLETED", label: "Hoàn thành", value: "COMPLETED" },
    { key: "REFUNDED", label: "Đã hoàn tiền", value: "REFUNDED" },
    { key: "CANCELLED", label: "Đã hủy", value: "CANCELLED" },
    { key: "FAILED", label: "Thất bại", value: "FAILED" },
  ];

  return (
    <div className="space-y-4 p-4">
      <div className="flex flex-col flex-wrap gap-3">
        <Typography.Title level={3} style={{ margin: 0 }}>
          {isAdmin ? "Quản lý đơn hàng (Admin)" : "Đơn hàng của tôi"}
        </Typography.Title>
        <Tabs
          items={tabs.map((t) => ({ key: t.key, label: t.label }))}
          activeKey={tabs.find((t) => t.value === statusFilter)?.key || "ALL"}
          onChange={(key) => {
            const tab = tabs.find((t) => t.key === key);
            setStatusFilter(tab?.value);
          }}
        />
      </div>

      {isLoading ? (
        <div className="py-10 flex justify-center">
          <Spin />
        </div>
      ) : (
        renderCards
      )}
    </div>
  );
};

export default OrdersPage;
