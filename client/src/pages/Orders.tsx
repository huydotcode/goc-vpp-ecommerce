import { orderService } from "@/services/order.service";
import { handleApiError } from "@/utils/error";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Card,
  Empty,
  Image,
  Input,
  Pagination,
  Select,
  Spin,
  Tabs,
  Tag,
  Typography,
  Space,
  Button,
} from "antd";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import type { Order, OrderItem } from "@/types/order.types";
import ReviewModal, {
  type ReviewFormValues,
  type ReviewableItem,
} from "@/components/order/ReviewModal";
import { reviewService } from "@/services/review.service";
import { toast } from "sonner";
import CancelOrderModal from "@/components/order/CancelOrderModal";

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

const OrdersPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewingOrder, setReviewingOrder] = useState<Order | null>(null);
  const [reviewingProductId, setReviewingProductId] = useState<number | null>(
    null
  );
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancellingOrderCode, setCancellingOrderCode] = useState<string | null>(
    null
  );

  const statusFilter = searchParams.get("status") || undefined;
  const searchText = searchParams.get("q") || "";
  const sortKey =
    (searchParams.get("sort") as
      | "newest"
      | "oldest"
      | "amountDesc"
      | "amountAsc"
      | null) || "newest";
  const currentPage = Number(searchParams.get("page") || "1");
  const pageSize = 8;

  const updateParams = (params: Record<string, string | undefined>) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(params).forEach(([key, value]) => {
      if (value === undefined || value === "" || value === null) {
        next.delete(key);
      } else {
        next.set(key, value);
      }
    });
    setSearchParams(next);
  };

  const { data, isLoading } = useQuery<{
    content: Order[];
    totalElements: number;
    number: number;
  }>({
    queryKey: ["userOrders", statusFilter, searchText, sortKey, currentPage],
    queryFn: async () => {
      try {
        const sortBy =
          sortKey === "amountDesc" || sortKey === "amountAsc"
            ? "finalAmount"
            : "createdAt";
        const sortDir =
          sortKey === "oldest" || sortKey === "amountAsc" ? "ASC" : "DESC";

        return await orderService.getMyOrdersPaged({
          page: currentPage - 1,
          size: pageSize,
          status: statusFilter,
          search: searchText.trim() || undefined,
          sortBy,
          sortDir,
        });
      } catch (error) {
        handleApiError(error);
        throw error;
      }
    },
  });

  const cancelMutation = useMutation({
    mutationFn: async (params: { orderCode: string; reason?: string }) => {
      return orderService.cancelOrder(params.orderCode, params.reason);
    },
    onSuccess: () => {
      toast.success("Hủy đơn hàng thành công");
      setCancelModalOpen(false);
      setCancellingOrderCode(null);
      queryClient.invalidateQueries({
        queryKey: ["userOrders"],
      });
    },
    onError: handleApiError,
  });

  const canCancelOrder = (order: Order) =>
    ["PENDING", "PAID", "CONFIRMED"].includes(order.status);

  const createReviewMutation = useMutation({
    mutationFn: async (params: {
      productId: number;
      values: ReviewFormValues;
    }) => {
      return await reviewService.createReview({
        productId: params.productId,
        rating: params.values.rating,
        content: params.values.content,
      });
    },
    onSuccess: () => {
      toast.success("Đánh giá thành công!");
      setReviewModalOpen(false);
      setReviewingOrder(null);
      setReviewingProductId(null);
      if (reviewingProductId) {
        setReviewStatus((prev) => ({
          ...prev,
          [reviewingProductId]: true,
        }));
      }
    },
    onError: handleApiError,
  });

  const handleSubmitReview = (values: ReviewFormValues) => {
    if (!reviewingProductId) {
      toast.error("Không xác định được sản phẩm cần đánh giá");
      return;
    }
    createReviewMutation.mutate({ productId: reviewingProductId, values });
  };

  const reviewableItems: ReviewableItem[] = useMemo(() => {
    if (!reviewingOrder || !reviewingOrder.items) return [];
    return reviewingOrder.items
      .filter((item) => !item.isGift && item.productId)
      .map((item) => ({
        productId: item.productId!,
        productName: item.productName,
        imageUrl: item.imageUrl,
        quantity: item.quantity,
      }));
  }, [reviewingOrder]);

  const [reviewStatus, setReviewStatus] = useState<Record<number, boolean>>({});

  const ordersData = useMemo(
    () => ({
      content: data?.content ?? [],
      totalElements: data?.totalElements ?? 0,
      number: data?.number ?? 0,
    }),
    [data]
  );

  const ensureCanReview = useCallback(
    async (productId: number): Promise<boolean> => {
      if (!productId) return false;
      const cached = reviewStatus[productId];
      if (cached === true) {
        toast.info("Bạn đã đánh giá sản phẩm này rồi");
        return false;
      }
      if (cached === false) return true;

      try {
        const hasReviewed = await reviewService.checkUserReviewed(productId);
        setReviewStatus((prev) => ({ ...prev, [productId]: hasReviewed }));
        if (hasReviewed) {
          toast.info("Bạn đã đánh giá sản phẩm này rồi");
          return false;
        }
        return true;
      } catch {
        // Nếu API lỗi, vẫn cho phép mở form để không chặn user
        return true;
      }
    },
    [reviewStatus]
  );

  // Prefetch review status for products in currently loaded orders
  useEffect(() => {
    const items = ordersData.content || [];

    const missingProductIds: number[] = [];
    for (const order of items) {
      for (const item of order.items || []) {
        if (!item.isGift && item.productId) {
          const pid = item.productId;
          if (
            reviewStatus[pid] === undefined &&
            !missingProductIds.includes(pid)
          ) {
            missingProductIds.push(pid);
          }
        }
      }
    }

    if (missingProductIds.length === 0) return;

    const fetchStatuses = async () => {
      const updates: Record<number, boolean> = {};
      await Promise.all(
        missingProductIds.map(async (pid) => {
          try {
            const hasReviewed = await reviewService.checkUserReviewed(pid);
            updates[pid] = hasReviewed;
          } catch {
            // ignore errors, treat as not-reviewed (will be re-checked on click)
          }
        })
      );
      if (Object.keys(updates).length > 0) {
        setReviewStatus((prev) => ({ ...prev, ...updates }));
      }
    };

    void fetchStatuses();
  }, [ordersData, reviewStatus]);

  const renderCards = useMemo(() => {
    const items = ordersData.content || [];
    if (!items || items.length === 0) {
      return (
        <div className="py-10">
          <Empty description={"Bạn chưa có đơn hàng nào."} />
        </div>
      );
    }
    return (
      <div className="flex flex-col gap-3 sm:gap-4">
        {items.map((order) => {
          const orderReviewableItems =
            (order.items || []).filter(
              (item) => !item.isGift && item.productId
            ) || [];
          const nextUnreviewedProduct = orderReviewableItems.find(
            (item) => reviewStatus[item.productId!] !== true
          );
          const hasUnreviewedProduct = !!nextUnreviewedProduct;
          const canReview =
            ["DELIVERED", "COMPLETED"].includes(order.status) &&
            hasUnreviewedProduct;
          return (
            <Card
              key={order.id}
              hoverable
              onClick={() =>
                navigate(`/user/orders/${order.orderCode || order.id}`)
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
                      {order.customerName && ` • ${order.customerName}`}
                    </div>
                    {order.items && order.items.length > 0 && (
                      <div className="text-sm text-gray-600 space-y-1">
                        {order.items
                          .slice(0, 2)
                          .map((item: OrderItem, idx: number) => (
                            <div
                              key={idx}
                              className="flex justify-between gap-2"
                            >
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
              <div className="mt-3 pt-3 border-t flex justify-end">
                <Space size="middle">
                  <Button
                    size="middle"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/user/orders/${order.orderCode || order.id}`);
                    }}
                  >
                    Chi tiết
                  </Button>
                  {canCancelOrder(order) && (
                    <Button
                      size="middle"
                      danger
                      onClick={(e) => {
                        e.stopPropagation();
                        setCancellingOrderCode(
                          order.orderCode || String(order.id)
                        );
                        setCancelModalOpen(true);
                      }}
                    >
                      Hủy
                    </Button>
                  )}
                  {canReview && (
                    <Button
                      size="middle"
                      onClick={async (e) => {
                        e.stopPropagation();
                        if (!nextUnreviewedProduct?.productId) return;

                        const ok = await ensureCanReview(
                          nextUnreviewedProduct.productId
                        );
                        if (!ok) return;

                        setReviewingOrder(order);
                        setReviewingProductId(nextUnreviewedProduct.productId);
                        setReviewModalOpen(true);
                      }}
                    >
                      Đánh giá
                    </Button>
                  )}
                </Space>
              </div>
            </Card>
          );
        })}
      </div>
    );
  }, [ordersData, navigate, ensureCanReview, reviewStatus]);

  const tabs = [
    { key: "ALL", label: "Tất cả", value: undefined },
    { key: "PENDING", label: "Đang xử lý", value: "PENDING" },
    { key: "PAID", label: "Đã thanh toán", value: "PAID" },
    { key: "CONFIRMED", label: "Đã xác nhận", value: "CONFIRMED" },
    { key: "SHIPPING", label: "Đang giao", value: "SHIPPING" },
    { key: "DELIVERED", label: "Đã giao", value: "DELIVERED" },
    { key: "COMPLETED", label: "Hoàn thành", value: "COMPLETED" },
    { key: "REFUNDED", label: "Đã hoàn tiền", value: "REFUNDED" },
    { key: "CANCELLED", label: "Đã hủy", value: "CANCELLED" },
  ];

  return (
    <div className="space-y-4 p-4">
      <div className="flex flex-col flex-wrap gap-3">
        <Typography.Title level={3} style={{ margin: 0 }}>
          Đơn hàng của tôi
        </Typography.Title>
        <Space wrap size="middle">
          <Input.Search
            placeholder="Tìm kiếm theo mã đơn hàng..."
            allowClear
            value={searchText}
            onChange={(e) => {
              updateParams({ q: e.target.value, page: "1" });
            }}
            onSearch={(value) => {
              updateParams({ q: value, page: "1" });
            }}
            style={{ minWidth: 240 }}
          />
          <Select
            value={sortKey}
            style={{ width: 200 }}
            onChange={(v) => updateParams({ sort: v, page: "1" })}
            options={[
              { label: "Mới nhất", value: "newest" },
              { label: "Cũ nhất", value: "oldest" },
              { label: "Tổng tiền cao → thấp", value: "amountDesc" },
              { label: "Tổng tiền thấp → cao", value: "amountAsc" },
            ]}
          />
        </Space>
        <Tabs
          items={tabs.map((t) => ({ key: t.key, label: t.label }))}
          activeKey={tabs.find((t) => t.value === statusFilter)?.key || "ALL"}
          onChange={(key) => {
            const tab = tabs.find((t) => t.key === key);
            updateParams({ status: tab?.value, page: "1" });
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

      {!isLoading && (ordersData?.totalElements || 0) > pageSize && (
        <div className="flex justify-end pt-2">
          <Pagination
            current={ordersData.number + 1}
            pageSize={pageSize}
            total={ordersData.totalElements}
            onChange={(page) => updateParams({ page: String(page) })}
            showSizeChanger={false}
            showTotal={(total) => `Tổng ${total} đơn hàng`}
          />
        </div>
      )}

      {/* Cancel Order Modal */}
      <CancelOrderModal
        open={cancelModalOpen}
        loading={cancelMutation.isPending}
        orderCode={cancellingOrderCode}
        onSubmit={(reason) => {
          if (!cancellingOrderCode) return;
          void cancelMutation.mutate({
            orderCode: cancellingOrderCode,
            reason,
          });
        }}
        onCancel={() => {
          setCancelModalOpen(false);
          setCancellingOrderCode(null);
        }}
      />

      {/* Review Modal from Orders page */}
      <ReviewModal
        open={reviewModalOpen}
        loading={createReviewMutation.isPending}
        items={reviewableItems}
        reviewingProductId={reviewingProductId}
        onChangeProduct={async (id) => {
          const ok = await ensureCanReview(id);
          if (!ok) return;
          setReviewingProductId(id);
        }}
        onSubmit={handleSubmitReview}
        onCancel={() => {
          setReviewModalOpen(false);
          setReviewingOrder(null);
          setReviewingProductId(null);
        }}
      />
    </div>
  );
};

export default OrdersPage;
