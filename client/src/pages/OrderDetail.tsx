import { orderApi } from "@/api/order.api";
import { handleApiError } from "@/utils/error";
import {
  ArrowLeftOutlined,
  CopyOutlined,
  LinkOutlined,
} from "@ant-design/icons";
import { useQuery } from "@tanstack/react-query";
import {
  Button,
  Card,
  Divider,
  Empty,
  Input,
  Space,
  Spin,
  Steps,
  Tag,
  Typography,
  message,
} from "antd";
import React, { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getPayOSUrl, removePayOSUrl } from "../utils/payosStorage";

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

  // Get PayOS checkout URL from localStorage
  const payOSUrl = useMemo(() => {
    if (!orderCode) return null;
    return getPayOSUrl(orderCode);
  }, [orderCode]);

  // Check if order needs payment (PayOS method and pending status)
  const needsPayment = useMemo(() => {
    return (
      data?.paymentMethod === "PAYOS" &&
      (data?.status === "PENDING" || data?.status === "CONFIRMED") &&
      payOSUrl !== null
    );
  }, [data?.paymentMethod, data?.status, payOSUrl]);

  // Auto-remove PayOS URL when order is paid/completed
  React.useEffect(() => {
    if (
      orderCode &&
      data?.status &&
      (data.status === "PAID" || data.status === "COMPLETED") &&
      payOSUrl
    ) {
      // Order is paid, remove URL from localStorage
      removePayOSUrl(orderCode);
    }
  }, [orderCode, data?.status, payOSUrl]);

  const handleCopyUrl = () => {
    if (payOSUrl) {
      navigator.clipboard.writeText(payOSUrl);
      message.success("Đã copy link thanh toán!");
    }
  };

  const handlePayNow = () => {
    if (payOSUrl) {
      window.open(payOSUrl, "_blank");
    }
  };

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

      {/* PayOS Payment Section */}
      {needsPayment && (
        <Card className="shadow-sm border-orange-200 bg-orange-50">
          <Space direction="vertical" style={{ width: "100%" }} size="middle">
            <div>
              <Typography.Text strong className="text-orange-800">
                Đơn hàng chưa thanh toán
              </Typography.Text>
              <Typography.Paragraph className="text-sm text-gray-600 mt-1 mb-0">
                Vui lòng thanh toán để đơn hàng được xử lý. Bạn có thể thanh
                toán bằng cách nhấn nút bên dưới hoặc copy link thanh toán.
              </Typography.Paragraph>
            </div>
            <Space direction="vertical" style={{ width: "100%" }} size="small">
              <Button
                type="primary"
                size="large"
                block
                icon={<LinkOutlined />}
                onClick={handlePayNow}
              >
                Thanh toán ngay
              </Button>
              <div className="flex items-center gap-2">
                <Input
                  readOnly
                  value={payOSUrl || ""}
                  style={{ flex: 1 }}
                  placeholder="Link thanh toán PayOS"
                />
                <Button
                  icon={<CopyOutlined />}
                  onClick={handleCopyUrl}
                  title="Copy link thanh toán"
                >
                  Copy
                </Button>
              </div>
            </Space>
          </Space>
        </Card>
      )}

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
