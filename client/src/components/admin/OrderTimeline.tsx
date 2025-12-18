import type { OrderHistoryItem } from "@/api/adminOrder.api";
import {
  CarOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  DollarOutlined,
  EditOutlined,
  PlusCircleOutlined,
  RollbackOutlined,
  SyncOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { Empty, Spin, Tag, Timeline, Typography } from "antd";
import React from "react";

const { Text } = Typography;

interface OrderTimelineProps {
  history: OrderHistoryItem[];
  loading?: boolean;
}

const changeTypeConfig: Record<
  string,
  { color: string; icon: React.ReactNode; bgColor: string }
> = {
  ORDER_CREATED: {
    color: "green",
    icon: <PlusCircleOutlined />,
    bgColor: "#f6ffed",
  },
  STATUS_CHANGE: {
    color: "geekblue",
    icon: <SyncOutlined />,
    bgColor: "#e6f4ff",
  },
  SHIPPING_UPDATE: {
    color: "geekblue",
    icon: <CarOutlined />,
    bgColor: "#e6f4ff",
  },
  PAYMENT_UPDATE: {
    color: "cyan",
    icon: <DollarOutlined />,
    bgColor: "#e6fffb",
  },
  NOTE_ADDED: {
    color: "purple",
    icon: <EditOutlined />,
    bgColor: "#f9f0ff",
  },
  CANCELLED: {
    color: "red",
    icon: <CloseCircleOutlined />,
    bgColor: "#fff1f0",
  },
  REFUNDED: {
    color: "gold",
    icon: <RollbackOutlined />,
    bgColor: "#fffbe6",
  },
};

const statusLabelMap: Record<string, string> = {
  PENDING: "Chờ thanh toán / xác nhận",
  PAID: "Đã thanh toán",
  CONFIRMED: "Đã xác nhận",
  SHIPPING: "Đang giao",
  DELIVERED: "Đã giao",
  COMPLETED: "Hoàn thành",
  CANCELLED: "Đã hủy",
  REFUNDED: "Đã hoàn tiền",
};

const formatStatusValue = (value: string | undefined): string => {
  if (!value) return "N/A";
  return statusLabelMap[value] || value;
};

const OrderTimeline: React.FC<OrderTimelineProps> = ({ history, loading }) => {
  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Spin tip="Đang tải lịch sử..." />
      </div>
    );
  }

  if (!history || history.length === 0) {
    return (
      <Empty
        description="Chưa có lịch sử thay đổi"
        image={Empty.PRESENTED_IMAGE_SIMPLE}
      />
    );
  }

  return (
    <Timeline
      items={history.map((item) => {
        const config = changeTypeConfig[item.changeType] || {
          color: "gray",
          icon: <ClockCircleOutlined />,
          bgColor: "#fafafa",
        };

        const isStatusChange = item.changeType === "STATUS_CHANGE";

        return {
          color: config.color,
          dot: (
            <div
              className="flex items-center justify-center w-8 h-8 rounded-full"
              style={{ backgroundColor: config.bgColor }}
            >
              {config.icon}
            </div>
          ),
          children: (
            <div className="pb-4 ml-2">
              {/* Header */}
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <Tag color={config.color} className="m-0">
                  {item.changeTypeLabel}
                </Tag>
                <Text type="secondary" className="text-xs">
                  {new Date(item.createdAt).toLocaleString("vi-VN", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                  })}
                </Text>
              </div>

              {/* Content */}
              {isStatusChange && item.oldValue && item.newValue ? (
                <div className="flex items-center gap-2 mb-2">
                  <Tag color="default">{formatStatusValue(item.oldValue)}</Tag>
                  <span className="text-gray-400">→</span>
                  <Tag color={config.color}>
                    {formatStatusValue(item.newValue)}
                  </Tag>
                </div>
              ) : item.oldValue || item.newValue ? (
                <div className="text-sm mb-2 p-2 bg-gray-50 rounded">
                  {item.oldValue && (
                    <div className="text-gray-500">
                      <Text delete type="secondary">
                        {item.oldValue}
                      </Text>
                    </div>
                  )}
                  {item.newValue && (
                    <div className="text-gray-800">
                      <Text strong>{item.newValue}</Text>
                    </div>
                  )}
                </div>
              ) : null}

              {/* Note */}
              {item.note && (
                <div className="text-sm text-gray-600 italic mb-2 p-2 bg-blue-50 rounded border-l-2 border-blue-400">
                  "{item.note}"
                </div>
              )}

              {/* Footer - User */}
              <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400">
                <span className="flex items-center gap-1">
                  <UserOutlined />
                  {item.changedByName ? (
                    <span>{item.changedByName}</span>
                  ) : (
                    <span className="italic">Hệ thống</span>
                  )}
                </span>
              </div>
            </div>
          ),
        };
      })}
    />
  );
};

export default OrderTimeline;
