import React from "react";
import { Table, Tag, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useQuery } from "@tanstack/react-query";
import { handleApiError } from "@/utils/error";

interface OrderItem {
  id: number;
  createdAt: string;
  status: string;
  totalAmount: number;
}

const mockOrders: OrderItem[] = [
  {
    id: 1,
    createdAt: "2024-12-01T10:30:00Z",
    status: "COMPLETED",
    totalAmount: 1200000,
  },
  {
    id: 2,
    createdAt: "2024-12-05T14:15:00Z",
    status: "PENDING",
    totalAmount: 350000,
  },
];

const statusColorMap: Record<string, string> = {
  COMPLETED: "green",
  PENDING: "gold",
  CANCELLED: "red",
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(value);

const OrdersPage: React.FC = () => {
  const { data, isLoading } = useQuery({
    queryKey: ["userOrders"],
    queryFn: async () => {
      try {
        // TODO: Thay bằng gọi API thật khi backend sẵn sàng
        // const response = await orderService.getMyOrders();
        // return response.data;
        return new Promise<OrderItem[]>((resolve) => {
          setTimeout(() => resolve(mockOrders), 500);
        });
      } catch (error) {
        handleApiError(error);
        throw error;
      }
    },
  });

  const columns: ColumnsType<OrderItem> = [
    {
      title: "Mã đơn hàng",
      dataIndex: "id",
      key: "id",
      render: (id: number) => <span>#{id}</span>,
    },
    {
      title: "Ngày đặt",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (value: string) =>
        new Date(value).toLocaleString("vi-VN", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status: string) => (
        <Tag color={statusColorMap[status] || "default"}>
          {status === "COMPLETED"
            ? "Hoàn thành"
            : status === "PENDING"
              ? "Đang xử lý"
              : status === "CANCELLED"
                ? "Đã hủy"
                : status}
        </Tag>
      ),
    },
    {
      title: "Tổng tiền",
      dataIndex: "totalAmount",
      key: "totalAmount",
      align: "right",
      render: (value: number) => <span>{formatCurrency(value)}</span>,
    },
  ];

  return (
    <div className="space-y-4">
      <div>
        <Typography.Title level={4}>Đơn hàng của tôi</Typography.Title>
        <Typography.Paragraph type="secondary">
          Xem lại lịch sử các đơn hàng bạn đã đặt.
        </Typography.Paragraph>
      </div>

      <Table<OrderItem>
        rowKey="id"
        columns={columns}
        dataSource={data || []}
        loading={isLoading}
        pagination={false}
        locale={{
          emptyText: "Bạn chưa có đơn hàng nào.",
        }}
      />
    </div>
  );
};

export default OrdersPage;
