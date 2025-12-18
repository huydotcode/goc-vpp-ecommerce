import { orderApi } from "@/api/order.api";
import type { Order } from "@/types/order.types";
import { handleApiError } from "@/utils/error";
import {
  ArrowLeftOutlined,
  CopyOutlined,
  HistoryOutlined,
  LinkOutlined,
  StarOutlined,
} from "@ant-design/icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
} from "antd";
import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { getPayOSUrl, removePayOSUrl } from "../utils/payosStorage";
import type { PromotionSummary } from "@/types/cart.types";
import { reviewService } from "@/services/review.service";
import { useAuth } from "@/contexts/AuthContext";
import ReviewModal, {
  type ReviewFormValues,
  type ReviewableItem,
} from "@/components/order/ReviewModal";
import CancelOrderModal from "@/components/order/CancelOrderModal";
import type { OrderHistoryItem } from "@/api/adminOrder.api";
import UserOrderTimeline from "@/components/order/UserOrderTimeline";

// type OrderItemSummary = {
//   productName?: string;
//   quantity?: number;
//   unitPrice?: number | string;
//   subtotal?: number | string;
//   imageUrl?: string | null;
// };

// type OrderDetail = {
//   id: number;
//   name: string;
//   value: number;
// };

// type OrderItemSummary = {
//   productName?: string;
//   quantity?: number;
//   unitPrice?: number | string;
//   subtotal?: number | string;
//   imageUrl?: string | null;
// };

// type OrderDetail = {
//   id: number;
//   orderCode?: string;
//   createdAt: string;
//   totalAmount: number;
//   status: string;
//   paymentMethod?: string;
//   customerName?: string;
//   customerPhone?: string;
//   customerEmail?: string;
//   customerAddress?: string | null;
//   items?: OrderItemSummary[];
//   name: string;
//   value: number;
// };

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

interface OrderDetailPageProps {
  isAdmin?: boolean;
}

const OrderDetailPage: React.FC<OrderDetailPageProps> = ({
  isAdmin = false,
}) => {
  const { orderCode, id } = useParams(); // 'orderCode' for user, 'id' (which is orderCode) for admin
  const code = orderCode || id;
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewingProductId, setReviewingProductId] = useState<number | null>(
    null
  );
  const [productReviewStatus, setProductReviewStatus] = useState<
    Record<number, boolean>
  >({});

  const { data, isLoading, refetch } = useQuery<Order | null>({
    queryKey: ["orderDetail", orderCode],
    queryFn: async () => {
      if (!code) return null;
      try {
        return await orderApi.getOrderByCode(code);
      } catch (error) {
        handleApiError(error);
        throw error;
      }
    },
    enabled: !!orderCode,
  });

  const parsedPromotions: PromotionSummary[] = useMemo(() => {
    if (!data?.appliedPromotions) return [];
    try {
      const parsed = JSON.parse(data.appliedPromotions) as PromotionSummary[];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }, [data?.appliedPromotions]);

  const shippingFee = useMemo(
    () => Number(data?.shippingFee ?? 0),
    [data?.shippingFee]
  );

  const discountAmount = useMemo(
    () => Number(data?.discountAmount ?? 0),
    [data?.discountAmount]
  );

  const finalAmount = useMemo(() => {
    if (data?.finalAmount !== undefined && data?.finalAmount !== null) {
      return Number(data.finalAmount);
    }
    const total = Number(data?.totalAmount ?? 0);
    return total - discountAmount + shippingFee;
  }, [data?.finalAmount, data?.totalAmount, discountAmount, shippingFee]);

  // Lịch sử đơn hàng (timeline) cho user
  const { data: historyData, isLoading: historyLoading } = useQuery<
    OrderHistoryItem[]
  >({
    queryKey: ["userOrderHistory", orderCode],
    queryFn: async () => {
      if (!orderCode) return [];
      try {
        return await orderApi.getOrderHistory(orderCode);
      } catch (error) {
        handleApiError(error);
        throw error;
      }
    },
    enabled: !!orderCode && !isAdmin,
  });

  const cancelOrderMutation = useMutation({
    mutationFn: async (params: { orderCode: string; reason?: string }) => {
      return await orderApi.cancelOrder(params.orderCode, params.reason);
    },
    onSuccess: () => {
      toast.success("Đã hủy đơn hàng thành công");
      setCancelModalOpen(false);
      refetch();
      queryClient.invalidateQueries({ queryKey: ["userOrders"] });
    },
    onError: (error) => {
      handleApiError(error);
    },
  });

  const canCancelOrder = (order: Order | null) => {
    if (!order) return false;
    return (
      order.status === "PENDING" ||
      order.status === "PAID" ||
      order.status === "CONFIRMED"
    );
  };

  const handleCancelOrder = (reason?: string) => {
    if (orderCode) {
      cancelOrderMutation.mutate({
        orderCode,
        reason,
      });
    }
  };

  // Get PayOS checkout URL from localStorage
  const payOSUrl = useMemo(() => {
    if (!orderCode) return null;
    return getPayOSUrl(orderCode);
  }, [orderCode]);

  // Fetch review status for products in completed orders
  useEffect(() => {
    if (data?.status === "COMPLETED" && data.items && user && !isAdmin) {
      const checkReviews = async () => {
        const statusMap: Record<number, boolean> = {};
        for (const item of data.items || []) {
          console.log({ item });
          if (!item.isGift && item.productId) {
            try {
              const hasReviewed = await reviewService.checkUserReviewed(
                item.productId
              );
              statusMap[item.productId] = hasReviewed;
            } catch {
              statusMap[item.productId] = false;
            }
          }
        }
        setProductReviewStatus(statusMap);
      };
      checkReviews();
    }
  }, [data, user, isAdmin]);

  // Auto open review modal when navigated with state (from Orders page)
  useEffect(() => {
    if (
      location.state &&
      (location.state as { openReview?: boolean }).openReview &&
      data?.status === "COMPLETED" &&
      data.items &&
      !isAdmin
    ) {
      const firstReviewable = data.items.find(
        (item) => !item.isGift && item.productId
      );
      if (firstReviewable && firstReviewable.productId) {
        handleOpenReviewModal(firstReviewable.productId);
      }
    }
  }, [location.state, data, isAdmin]);

  // Mutation to create review
  const createReviewMutation = useMutation({
    mutationFn: async (values: ReviewFormValues) => {
      if (!reviewingProductId) throw new Error("Product ID not set");
      return await reviewService.createReview({
        productId: reviewingProductId,
        rating: values.rating,
        content: values.content,
      });
    },
    onSuccess: () => {
      toast.success("Đánh giá thành công!");
      setReviewModalOpen(false);
      if (reviewingProductId) {
        setProductReviewStatus((prev) => ({
          ...prev,
          [reviewingProductId]: true,
        }));
      }
      setReviewingProductId(null);
    },
    onError: (error) => {
      handleApiError(error);
    },
  });

  const handleOpenReviewModal = (productId: number) => {
    setReviewingProductId(productId);
    setReviewModalOpen(true);
  };

  const handleSubmitReview = (values: ReviewFormValues) => {
    createReviewMutation.mutate(values);
  };

  const reviewableItems: ReviewableItem[] = useMemo(
    () =>
      (data?.items || [])
        .filter((item) => !item.isGift && item.productId)
        .map((item) => ({
          productId: item.productId!,
          productName: item.productName,
          imageUrl: item.imageUrl,
          quantity: item.quantity,
        })),
    [data?.items]
  );

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
      toast.success("Đã xóa link thanh toán");
    }
  }, [orderCode, data?.status, payOSUrl]);

  const handleCopyUrl = () => {
    if (payOSUrl) {
      navigator.clipboard.writeText(payOSUrl);
      toast.success("Đã copy link thanh toán!");
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
          {isAdmin ? "Chi tiết đơn hàng (Admin)" : "Chi tiết đơn hàng"} #
          {data.orderCode || data.id}
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
              Ngày tạo:{" "}
              {new Date(data.createdAt).toLocaleString("vi-VN", {
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
                  <div className="text-sm">Họ tên: {data.customerName}</div>
                )}
                {data.customerPhone && (
                  <div className="text-sm">SĐT: {data.customerPhone}</div>
                )}
                {data.customerEmail && (
                  <div className="text-sm">Email: {data.customerEmail}</div>
                )}
              </>
            )}
            {data.customerAddress && (
              <div className="text-sm">
                Địa chỉ giao hàng: {data.customerAddress}
              </div>
            )}
            {data.description && (
              <div className="text-sm text-gray-500 italic">
                Ghi chú: {data.description}
              </div>
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
              {data.items &&
                data.items.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex gap-3 items-start cursor-pointer hover:bg-gray-50 p-2 rounded-md"
                    style={{ opacity: item.isGift ? 0.8 : 1 }}
                    onClick={() => {
                      navigate(`/products/${item.productId}`);
                    }}
                  >
                    <div className="w-16 h-16 bg-gray-100 border border-gray-200 rounded overflow-hidden relative">
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
                      {item.isGift && (
                        <div className="absolute top-0 right-0 bg-red-500 text-white text-[10px] px-1">
                          GIFT
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium line-clamp-2">
                        {item.productName}
                        {item.isGift && (
                          <span className="ml-2 text-red-500 text-xs">
                            (Quà tặng)
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-500">
                        x{item.quantity}
                      </div>
                      {/* Review button for completed orders */}
                      {!isAdmin &&
                        data.status === "COMPLETED" &&
                        !item.isGift &&
                        item.productId && (
                          <div className="mt-2">
                            {productReviewStatus[item.productId] ? (
                              <Tag color="green" icon={<StarOutlined />}>
                                Đã đánh giá
                              </Tag>
                            ) : (
                              <Button
                                size="small"
                                icon={<StarOutlined />}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  e.preventDefault();
                                  handleOpenReviewModal(item.productId);
                                }}
                              >
                                Đánh giá sản phẩm
                              </Button>
                            )}
                          </div>
                        )}
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-500">
                        {item.isGift ? (
                          <span className="line-through text-xs mr-1">
                            {formatCurrency(item.unitPrice)}
                          </span>
                        ) : (
                          formatCurrency(item.unitPrice)
                        )}
                        {item.isGift && (
                          <span className="text-red-500">0đ</span>
                        )}
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

              {discountAmount > 0 && (
                <div className="flex justify-between text-base text-green-600">
                  <span>Giảm giá</span>
                  <span>-{formatCurrency(discountAmount)}</span>
                </div>
              )}

              {shippingFee > 0 && (
                <div className="flex justify-between text-base">
                  <span>Phí vận chuyển</span>
                  <span>{formatCurrency(shippingFee)}</span>
                </div>
              )}

              {parsedPromotions.length > 0 && (
                <div className="text-sm text-gray-500 bg-gray-50 p-2 rounded">
                  <div>Mã giảm giá đã áp dụng:</div>
                  {parsedPromotions.map((p, i) => (
                    <div key={i} className="ml-2">
                      • {p.name}: -{formatCurrency(p.value)}
                    </div>
                  ))}
                </div>
              )}

              <div className="flex justify-between text-lg font-bold pt-2 border-t mt-2">
                <span>Thành tiền</span>
                <span className="text-red-500">
                  {formatCurrency(finalAmount)}
                </span>
              </div>
            </div>
          </>
        ) : (
          <Empty description="Không có sản phẩm" />
        )}
      </Card>

      {/* Order History Timeline (User) */}
      {!isAdmin && (
        <Card
          title={
            <span>
              <HistoryOutlined className="mr-2" />
              Lịch sử đơn hàng
            </span>
          }
          className="shadow-sm"
        >
          <UserOrderTimeline
            history={historyData || []}
            loading={historyLoading}
          />
        </Card>
      )}

      {/* Cancel Order Section */}
      {canCancelOrder(data) && (
        <Card className="shadow-sm border-red-200 bg-red-50">
          <Space direction="vertical" style={{ width: "100%" }} size="middle">
            <Button
              danger
              block
              size="large"
              onClick={() => setCancelModalOpen(true)}
            >
              Hủy đơn hàng
            </Button>
          </Space>
        </Card>
      )}

      {/* Cancel Order Modal */}
      <CancelOrderModal
        open={cancelModalOpen}
        loading={cancelOrderMutation.isPending}
        orderCode={orderCode}
        onSubmit={handleCancelOrder}
        onCancel={() => setCancelModalOpen(false)}
      />

      {/* Review Modal */}
      <ReviewModal
        open={reviewModalOpen}
        loading={createReviewMutation.isPending}
        items={reviewableItems}
        reviewingProductId={reviewingProductId}
        onChangeProduct={(id) => setReviewingProductId(id)}
        onSubmit={handleSubmitReview}
        onCancel={() => {
          setReviewModalOpen(false);
          setReviewingProductId(null);
        }}
      />
    </div>
  );
};

export default OrderDetailPage;
