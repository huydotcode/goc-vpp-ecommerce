import { orderApi } from "@/api/order.api";
import { handleApiError } from "@/utils/error";
import { ArrowLeftOutlined } from "@ant-design/icons";
import { useQuery } from "@tanstack/react-query";
import { Card, Divider, Empty, Spin, Steps, Tag, Typography, Button } from "antd";
import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { orderService } from "@/services/order.service";

import type { Order } from "@/types/order.types";

interface PromotionSummary {
  id: number;
  name: string;
  value: number;
}

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

interface OrderDetailPageProps {
  isAdmin?: boolean;
}

const OrderDetailPage: React.FC<OrderDetailPageProps> = ({ isAdmin = false }) => {
  const { orderCode, id } = useParams(); // 'orderCode' for user, 'id' (which is orderCode) for admin
  const code = orderCode || id;
  const navigate = useNavigate();

  const { data, isLoading } = useQuery<Order | null>({
    queryKey: [isAdmin ? "adminOrderDetail" : "orderDetail", code],
    queryFn: async () => {
      if (!code) return null;
      try {
        if (isAdmin) {
          return await orderService.getAdminOrderByCode(code);
        } else {
          return await orderApi.getOrderByCode(code);
        }
      } catch (error) {
        handleApiError(error);
        throw error;
      }
    },
    enabled: !!code,
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
    <div className="space-y-4 flex flex-col gap-4 p-4">
      <div className="flex items-center gap-2">
        <Button
          onClick={() => {
            if (isAdmin) {
              navigate("/admin/orders");
            } else {
              navigate(-1);
            }
          }}
          icon={<ArrowLeftOutlined />}
        >
          {isAdmin ? "Quay lại danh sách" : "Quay lại"}
        </Button>
      </div>

      <div>
        <Typography.Title level={4} style={{ margin: 0 }}>
          {isAdmin ? "Chi tiết đơn hàng (Admin)" : "Chi tiết đơn hàng"} #{data.orderCode || data.id}
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
              Ngày tạo: {new Date(data.createdAt).toLocaleString("vi-VN", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>
            {isAdmin && (
              <>
                <div className="text-sm border-t pt-1 mt-1">
                  <strong>Thông tin khách hàng:</strong>
                </div>
                {data.customerName && (
                  <div className="text-sm">
                    Họ tên: {data.customerName}
                  </div>
                )}
                {data.customerPhone && (
                  <div className="text-sm">
                    SĐT: {data.customerPhone}
                  </div>
                )}
                {data.customerEmail && (
                  <div className="text-sm">
                    Email: {data.customerEmail}
                  </div>
                )}
              </>
            )}
            {data.customerAddress && (
              <div className="text-sm">Địa chỉ giao hàng: {data.customerAddress}</div>
            )}
            {data.description && (
              <div className="text-sm text-gray-500 italic">Ghi chú: {data.description}</div>
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
              {data.items && data.items.map((item, idx) => (
                <div key={idx} className="flex gap-3 items-start" style={{ opacity: item.isGift ? 0.8 : 1 }}>
                  <div className="w-16 h-16 bg-gray-100 border border-gray-200 rounded overflow-hidden relative">
                    {item.productImageUrl ? (
                      <img
                        src={item.productImageUrl}
                        alt={item.productName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-xs text-gray-400">
                        No image
                      </div>
                    )}
                    {item.isGift && (
                      <div className="absolute top-0 right-0 bg-red-500 text-white text-[10px] px-1">
                        GIFT
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium line-clamp-2">
                      {item.productName}
                      {item.isGift && <span className="ml-2 text-red-500 text-xs">(Quà tặng)</span>}
                    </div>
                    <div className="text-sm text-gray-500">
                      x{item.quantity}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-500">
                      {item.isGift ? <span className="line-through text-xs mr-1">{formatCurrency(item.unitPrice)}</span> : formatCurrency(item.unitPrice)}
                      {item.isGift && <span className="text-red-500">0đ</span>}
                    </div>
                    <div className="font-semibold">
                      {item.isGift ? "0đ" : formatCurrency(item.subtotal)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <Divider />

            <div className="space-y-2">
              <div className="flex justify-between text-base">
                <span className="text-gray-600">Tổng tiền hàng</span>
                <span>{formatCurrency(data.totalAmount)}</span>
              </div>

              {data.discountAmount && data.discountAmount > 0 && (
                <div className="flex justify-between text-base text-green-600">
                  <span>Giảm giá</span>
                  <span>-{formatCurrency(data.discountAmount)}</span>
                </div>
              )}

              {data.appliedPromotions && (
                <div className="text-sm text-gray-500 bg-gray-50 p-2 rounded">
                  <div>Mã giảm giá đã áp dụng:</div>
                  {(JSON.parse(data.appliedPromotions) as PromotionSummary[]).map((p, i) => (
                    <div key={i} className="ml-2">• {p.name}: -{formatCurrency(p.value)}</div>
                  ))}
                </div>
              )}

              <div className="flex justify-between text-lg font-bold pt-2 border-t mt-2">
                <span>Thành tiền</span>
                <span className="text-red-500">{formatCurrency(data.finalAmount || data.totalAmount)}</span>
              </div>
            </div>
          </>
        ) : (
          <Empty description="Không có sản phẩm" />
        )}
      </Card >
    </div >
  );
};

export default OrderDetailPage;
