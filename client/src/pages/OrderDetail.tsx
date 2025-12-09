import { orderApi } from "@/api/order.api";
import { handleApiError } from "@/utils/error";
import { ArrowLeftOutlined } from "@ant-design/icons";
import { useQuery } from "@tanstack/react-query";
import { Card, Divider, Empty, Spin, Steps, Tag, Typography } from "antd";
import React from "react";
import { useNavigate, useParams } from "react-router-dom";

type OrderItemSummary = {
  productName?: string;
  quantity?: number;
  unitPrice?: number | string;
  subtotal?: number | string;
  imageUrl?: string | null;
};

type OrderDetail = {
  id: number;
  orderCode?: string;
  createdAt: string;
  totalAmount: number;
  status: string;
  paymentMethod?: string;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  customerAddress?: string | null;
  items?: OrderItemSummary[];
};

const statusColorMap: Record<string, string> = {
  COMPLETED: "green",
  PENDING: "gold",
  SHIPPING: "blue",
  CONFIRMED: "blue",
  PAID: "green",
  REFUNDED: "volcano",
  CANCELLED: "red",
  FAILED: "volcano",
};

const statusLabel = (status: string) => {
  switch (status) {
    case "COMPLETED":
      return "Hoàn thành";
    case "DELIVERED":
      return "Đã giao";
    case "PENDING":
      return "Đang xử lý";
    case "CONFIRMED":
      return "Đã xác nhận";
    case "SHIPPING":
      return "Đang giao";
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

const statusStepsOrder = [
  "PENDING",
  "CONFIRMED",
  "SHIPPING",
  "DELIVERED",
  "COMPLETED",
];

const statusToCurrentStep = (status: string) => {
  const idx = statusStepsOrder.indexOf(status);
  if (idx === -1) return 0;
  // clamp to last step if beyond
  return Math.min(idx, statusStepsOrder.length - 1);
};

const formatCurrency = (value: number | string | undefined) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(Number(value || 0));

const OrderDetailPage: React.FC = () => {
  const { orderCode } = useParams();
  const navigate = useNavigate();

  const { data, isLoading } = useQuery<OrderDetail | null>({
    queryKey: ["orderDetail", orderCode],
    queryFn: async () => {
      if (!orderCode) return null;
      try {
        return await orderApi.getOrderByCode(orderCode);
      } catch (error) {
        handleApiError(error);
        throw error;
      }
    },
    enabled: !!orderCode,
  });

  if (isLoading) {
    return (
      <div className="py-10 flex justify-center">
        <Spin />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="py-10">
        <Empty description="Không tìm thấy đơn hàng" />
      </div>
    );
  }

  return (
    <div className="space-y-4 flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-800"
        >
          <ArrowLeftOutlined /> Quay lại
        </button>
      </div>

      <div>
        <Typography.Title level={4} style={{ margin: 0 }}>
          Đơn hàng #{data.orderCode || data.id}
        </Typography.Title>
      </div>

      <Card className="shadow-sm">
        <Steps
          size="small"
          current={statusToCurrentStep(data.status)}
          items={statusStepsOrder.map((s) => ({
            title: statusLabel(s),
            status:
              s === data.status
                ? "process"
                : statusStepsOrder.indexOf(s) < statusToCurrentStep(data.status)
                  ? "finish"
                  : "wait",
          }))}
        />
      </Card>

      <Card className="shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1 text-gray-900">
            <div className="text-sm font-medium">
              {new Date(data.createdAt).toLocaleString("vi-VN", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>
            {data.customerName && (
              <div className="text-sm">
                {data.customerName}
                {data.customerPhone ? ` · ${data.customerPhone}` : ""}
              </div>
            )}
            {data.customerAddress && (
              <div className="text-sm">{data.customerAddress}</div>
            )}
            {data.customerEmail && (
              <div className="text-sm">{data.customerEmail}</div>
            )}
          </div>
          <Tag color={statusColorMap[data.status] || "default"}>
            {statusLabel(data.status)}
          </Tag>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card title="Phương thức thanh toán" className="shadow-sm">
          <div className="text-gray-900">
            {data.paymentMethod === "COD"
              ? "Thanh toán bằng tiền mặt (COD)"
              : "Thanh toán online"}
          </div>
        </Card>

        <Card title="Phương thức vận chuyển" className="shadow-sm">
          <div className="text-gray-900">
            Giao hàng tiêu chuẩn (dự kiến 3 - 5 ngày)
          </div>
        </Card>
      </div>

      <Card title="Sản phẩm" className="shadow-sm">
        {data.items && data.items.length > 0 ? (
          <>
            <div className="space-y-3">
              {data.items.map((item, idx) => (
                <div key={idx} className="flex gap-3 items-start">
                  <div className="w-16 h-16 bg-gray-100 border border-gray-200 rounded overflow-hidden">
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.productName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-xs text-gray-400">
                        No image
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium line-clamp-2">
                      {item.productName}
                    </div>
                    <div className="text-sm text-gray-500">
                      x{item.quantity}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-500">
                      {formatCurrency(item.unitPrice)}
                    </div>
                    <div className="font-semibold">
                      {formatCurrency(item.subtotal)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <Divider />
            <div className="flex justify-between text-base font-semibold">
              <span>Tổng tiền</span>
              <span>{formatCurrency(data.totalAmount)}</span>
            </div>
          </>
        ) : (
          <Empty description="Không có sản phẩm" />
        )}
      </Card>
    </div>
  );
};

export default OrderDetailPage;
