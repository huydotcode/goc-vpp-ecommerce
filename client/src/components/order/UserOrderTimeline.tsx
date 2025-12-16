import type { OrderHistoryItem } from "@/api/adminOrder.api";
import {
  ClockCircleOutlined,
  CloseCircleOutlined,
  RollbackOutlined,
  SyncOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import { Empty, Tag, Timeline, Typography } from "antd";
import React from "react";

const { Text } = Typography;

interface UserOrderTimelineProps {
  history: OrderHistoryItem[];
  loading?: boolean;
}

const statusLabelMap: Record<string, string> = {
  PENDING: "Chờ thanh toán",
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

const UserOrderTimeline: React.FC<UserOrderTimelineProps> = ({
  history,
  loading,
}) => {
  if (loading) {
    return (
      <div className="flex justify-center py-6 text-sm text-gray-500">
        Đang tải lịch sử đơn hàng...
      </div>
    );
  }

  if (!history || history.length === 0) {
    return (
      <Empty
        description="Chưa có hoạt động nào cho đơn hàng này"
        image={Empty.PRESENTED_IMAGE_SIMPLE}
      />
    );
  }

  return (
    <Timeline
      items={history.map((item) => {
        const isStatusChange = item.changeType === "STATUS_CHANGE";

        let icon: React.ReactNode = <ClockCircleOutlined />;
        let color = "blue";

        if (item.changeType === "ORDER_CREATED") {
          icon = <CheckCircleOutlined />;
          color = "green";
        } else if (item.changeType === "CANCELLED") {
          icon = <CloseCircleOutlined />;
          color = "red";
        } else if (item.changeType === "REFUNDED") {
          icon = <RollbackOutlined />;
          color = "gold";
        } else if (item.changeType === "STATUS_CHANGE") {
          icon = <SyncOutlined />;
          color = "geekblue";
        }

        return {
          color,
          dot: (
            <div className="flex items-center justify-center w-7 h-7 rounded-full bg-white border border-gray-200">
              {icon}
            </div>
          ),
          children: (
            <div className="pb-3 ml-1">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <Text strong className="text-sm">
                  {item.changeTypeLabel}
                </Text>
                <Text type="secondary" className="text-xs">
                  {new Date(item.createdAt).toLocaleString("vi-VN", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </Text>
              </div>

              {isStatusChange && item.oldValue && item.newValue ? (
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs text-gray-500">Trạng thái:</span>
                  <Tag className="m-0" color="default">
                    {formatStatusValue(item.oldValue)}
                  </Tag>
                  <span className="text-gray-400 text-xs">→</span>
                  <Tag className="m-0" color={color}>
                    {formatStatusValue(item.newValue)}
                  </Tag>
                </div>
              ) : item.newValue ? (
                <div className="text-sm text-gray-700 mb-1">
                  {item.newValue}
                </div>
              ) : null}

              {item.note && (
                <div className="text-xs text-gray-600 italic mt-1">
                  "{item.note}"
                </div>
              )}
            </div>
          ),
        };
      })}
    />
  );
};

export default UserOrderTimeline;
