import type { OrderHistoryItem } from "@/api/adminOrder.api";
import OrderTimeline from "@/components/admin/OrderTimeline";
import { adminOrderService } from "@/services/adminOrder.service";
import { handleApiError } from "@/utils/error";
import { ArrowLeftOutlined, HistoryOutlined } from "@ant-design/icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Button,
  Card,
  Divider,
  Empty,
  Form,
  Input,
  message,
  Modal,
  Select,
  Spin,
  Steps,
  Tag,
  Typography,
} from "antd";
import React, { useState } from "react";
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
  // User account info
  userId?: number;
  userFirstName?: string;
  userLastName?: string;
};

const statusColorMap: Record<string, string> = {
  COMPLETED: "green",
  PENDING: "gold",
  PAID: "cyan",
  SHIPPING: "geekblue",
  CONFIRMED: "blue",
  DELIVERED: "purple",
  REFUNDED: "orange",
  CANCELLED: "red",
};

const statusLabel = (status: string) => {
  switch (status) {
    case "COMPLETED":
      return "Hoàn thành";
    case "DELIVERED":
      return "Đã giao";
    case "PENDING":
      return "Chờ thanh toán";
    case "PAID":
      return "Đã thanh toán";
    case "CONFIRMED":
      return "Đã xác nhận";
    case "SHIPPING":
      return "Đang giao";
    case "REFUNDED":
      return "Đã hoàn tiền";
    case "CANCELLED":
      return "Đã hủy";
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
  return Math.min(idx, statusStepsOrder.length - 1);
};

const formatCurrency = (value: number | string | undefined) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(Number(value || 0));

const AdminOrderDetailPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [form] = Form.useForm();

  const { data, isLoading, refetch } = useQuery<OrderDetail | null>({
    queryKey: ["adminOrderDetail", id],
    queryFn: async () => {
      if (!id) return null;
      try {
        return await adminOrderService.getOrderByCode(id);
      } catch (error) {
        handleApiError(error);
        throw error;
      }
    },
    enabled: !!id,
  });

  // Fetch order history
  const {
    data: historyData,
    isLoading: historyLoading,
    refetch: refetchHistory,
  } = useQuery<OrderHistoryItem[]>({
    queryKey: ["orderHistory", id],
    queryFn: async () => {
      if (!id) return [];
      try {
        return await adminOrderService.getOrderHistory(id);
      } catch (error) {
        handleApiError(error);
        throw error;
      }
    },
    enabled: !!id,
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ status, note }: { status: string; note?: string }) => {
      if (!data?.orderCode) throw new Error("Order code not found");
      return await adminOrderService.updateOrderStatus(
        data.orderCode,
        status,
        note
      );
    },
    onSuccess: () => {
      message.success("Cập nhật trạng thái đơn hàng thành công");
      setIsStatusModalOpen(false);
      refetch();
      refetchHistory();
      queryClient.invalidateQueries({ queryKey: ["adminOrders"] });
      queryClient.invalidateQueries({ queryKey: ["adminOrderStats"] });
    },
    onError: (error) => {
      handleApiError(error);
    },
  });

  const handleUpdateStatus = () => {
    form.validateFields().then((values) => {
      updateStatusMutation.mutate({ status: values.status, note: values.note });
    });
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
    <div className="p-6 max-w-7xl mx-auto space-y-4 flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-800"
        >
          <ArrowLeftOutlined /> Quay lại
        </button>
      </div>

      <div className="flex items-center justify-between">
        <Typography.Title level={4} style={{ margin: 0 }}>
          Đơn hàng #{data.orderCode || data.id}
        </Typography.Title>
        <Space>
          <Button
            type="primary"
            onClick={() => {
              form.setFieldsValue({ status: data.status });
              setIsStatusModalOpen(true);
            }}
          >
            Cập nhật trạng thái
          </Button>
        </Space>
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

      <Card title="Thông tin đơn hàng" className="shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Text type="secondary" className="text-xs">
              Trạng thái
            </Text>
            <div>
              <Tag color={statusColorMap[data.status] || "default"}>
                {statusLabel(data.status)}
              </Tag>
            </div>
          </div>
          <div>
            <Text type="secondary" className="text-xs">
              Ngày đặt
            </Text>
            <div className="text-sm text-gray-900">
              {new Date(data.createdAt).toLocaleString("vi-VN", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>
          </div>
          <div>
            <Text type="secondary" className="text-xs">
              Tên khách hàng
            </Text>
            <div className="text-sm text-gray-900">
              {data.customerName || "N/A"}
            </div>
          </div>
          <div>
            <Text type="secondary" className="text-xs">
              Email
            </Text>
            <div className="text-sm text-gray-900">
              {data.customerEmail || "N/A"}
            </div>
          </div>
          {data.userId && (
            <div>
              <Text type="secondary" className="text-xs">
                Tài khoản liên kết
              </Text>
              <div className="text-sm text-gray-900">
                <Tag color="green">
                  {data.userFirstName} {data.userLastName}
                </Tag>
                <Text type="secondary" className="text-xs ml-2">
                  (ID: {data.userId})
                </Text>
              </div>
            </div>
          )}
          <div>
            <Text type="secondary" className="text-xs">
              Số điện thoại
            </Text>
            <div className="text-sm text-gray-900">
              {data.customerPhone || "N/A"}
            </div>
          </div>
          <div>
            <Text type="secondary" className="text-xs">
              Địa chỉ giao hàng
            </Text>
            <div className="text-sm text-gray-900">
              {data.customerAddress || "N/A"}
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card title="Phương thức thanh toán" className="shadow-sm">
          <div className="text-gray-900">
            {data.paymentMethod === "COD"
              ? "Thanh toán bằng tiền mặt (COD)"
              : "Thanh toán bằng PAYOS"}
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
              <span className="text-red-600">
                {formatCurrency(data.totalAmount)}
              </span>
            </div>
          </>
        ) : (
          <Empty description="Không có sản phẩm" />
        )}
      </Card>

      {/* Order History Timeline */}
      <Card
        title={
          <span>
            <HistoryOutlined className="mr-2" />
            Lịch sử đơn hàng
          </span>
        }
        className="shadow-sm"
      >
        <OrderTimeline history={historyData || []} loading={historyLoading} />
      </Card>

      {/* Update Status Modal */}
      <Modal
        title="Cập nhật trạng thái đơn hàng"
        open={isStatusModalOpen}
        onOk={handleUpdateStatus}
        onCancel={() => setIsStatusModalOpen(false)}
        confirmLoading={updateStatusMutation.isPending}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="status"
            label="Trạng thái"
            rules={[{ required: true, message: "Vui lòng chọn trạng thái" }]}
          >
            <Select
              options={[
                { label: "Chờ thanh toán", value: "PENDING" },
                { label: "Đã thanh toán", value: "PAID" },
                { label: "Đã xác nhận", value: "CONFIRMED" },
                { label: "Đang giao", value: "SHIPPING" },
                { label: "Đã giao", value: "DELIVERED" },
                { label: "Hoàn thành", value: "COMPLETED" },
                { label: "Đã hủy", value: "CANCELLED" },
                { label: "Đã hoàn tiền", value: "REFUNDED" },
              ]}
            />
          </Form.Item>
          <Form.Item name="note" label="Ghi chú (tùy chọn)">
            <Input.TextArea
              rows={2}
              placeholder="Nhập ghi chú cho thay đổi này..."
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};



export default AdminOrderDetailPage;
