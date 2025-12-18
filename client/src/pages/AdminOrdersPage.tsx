import type { AdminOrderFilters, BulkOrderRequest } from "@/api/adminOrder.api";
import { adminOrderService } from "@/services/adminOrder.service";
import { handleApiError } from "@/utils/error";
import {
  exportOrdersToCSV,
  exportOrdersToExcel,
  type OrderExportData,
} from "@/utils/exportOrders";
import {
  CalendarOutlined,
  CheckOutlined,
  CloseOutlined,
  DownOutlined,
  DownloadOutlined,
  FileExcelOutlined,
  ReloadOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { MenuProps } from "antd";
import {
  Alert,
  Button,
  Card,
  Checkbox,
  Col,
  DatePicker,
  Dropdown,
  Empty,
  Image,
  Input,
  Modal,
  Pagination,
  Row,
  Select,
  Space,
  Spin,
  Statistic,
  Tabs,
  Tag,
  Typography,
} from "antd";
import dayjs, { Dayjs } from "dayjs";
import React, { useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const { RangePicker } = DatePicker;

const { Title, Text } = Typography;

const statusColorMap: Record<string, string> = {
  COMPLETED: "green",
  PENDING: "gold",
  PAID: "cyan",
  CONFIRMED: "blue",
  SHIPPING: "geekblue",
  DELIVERED: "purple",
  CANCELLED: "red",
  REFUNDED: "orange",
};

const statusLabel = (status: string) => {
  switch (status) {
    case "COMPLETED":
      return "Hoàn thành";
    case "PENDING":
      return "Chờ thanh toán / xác nhận";
    case "PAID":
      return "Đã thanh toán";
    case "CONFIRMED":
      return "Đã xác nhận";
    case "SHIPPING":
      return "Đang giao";
    case "DELIVERED":
      return "Đã giao";
    case "CANCELLED":
      return "Đã hủy";
    case "REFUNDED":
      return "Đã hoàn tiền";
    default:
      return status;
  }
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(value);

const AdminOrdersPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [searchText, setSearchText] = useState("");
  const [searchType, setSearchType] = useState<
    "orderCode" | "customerName" | "customerEmail" | "customerPhone"
  >("orderCode");
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);

  // Bulk actions state
  const [selectedOrderIds, setSelectedOrderIds] = useState<Set<number>>(
    new Set()
  );
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [bulkStatus, setBulkStatus] = useState<string>("");

  // Date filter state
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null]>([
    null,
    null,
  ]);
  const [datePresetLabel, setDatePresetLabel] =
    useState<string>("Tất cả thời gian");

  // Fetch statistics (with date filter)
  const { data: stats } = useQuery({
    queryKey: [
      "adminOrderStats",
      dateRange[0]?.toISOString(),
      dateRange[1]?.toISOString(),
    ],
    queryFn: async () => {
      try {
        const startDate = dateRange[0]
          ? dateRange[0].startOf("day").toISOString()
          : undefined;
        const endDate = dateRange[1]
          ? dateRange[1].endOf("day").toISOString()
          : undefined;
        return await adminOrderService.getStatistics(startDate, endDate);
      } catch (error) {
        handleApiError(error);
        throw error;
      }
    },
  });

  // Fetch orders
  const { data, isLoading, refetch } = useQuery({
    queryKey: [
      "adminOrders",
      statusFilter,
      searchText,
      searchType,
      currentPage,
      pageSize,
      dateRange[0]?.toISOString(),
      dateRange[1]?.toISOString(),
    ],
    queryFn: async () => {
      try {
        const filters: AdminOrderFilters = {
          page: currentPage,
          size: pageSize,
          sortBy: "createdAt",
          direction: "desc",
        };

        if (statusFilter) {
          filters.status = statusFilter;
        }

        if (searchText.trim()) {
          filters[searchType] = searchText.trim();
        }

        // Add date range filters
        if (dateRange[0]) {
          filters.startDate = dateRange[0].startOf("day").toISOString();
        }
        if (dateRange[1]) {
          filters.endDate = dateRange[1].endOf("day").toISOString();
        }

        return await adminOrderService.getAllOrders(filters);
      } catch (error) {
        handleApiError(error);
        throw error;
      }
    },
  });

  const handleSearch = () => {
    setCurrentPage(0);
    refetch();
  };

  const handleReset = () => {
    setSearchText("");
    setSearchType("orderCode");
    setStatusFilter(undefined);
    setCurrentPage(0);
    setDateRange([null, null]);
    setDatePresetLabel("Tất cả thời gian");
  };

  // Date preset handlers
  const applyDatePreset = (preset: string) => {
    const now = dayjs();
    let start: Dayjs | null = null;
    let end: Dayjs | null = now;

    switch (preset) {
      case "today":
        start = now.startOf("day");
        setDatePresetLabel("Hôm nay");
        break;
      case "yesterday":
        start = now.subtract(1, "day").startOf("day");
        end = now.subtract(1, "day").endOf("day");
        setDatePresetLabel("Hôm qua");
        break;
      case "7days":
        start = now.subtract(7, "day").startOf("day");
        setDatePresetLabel("7 ngày qua");
        break;
      case "30days":
        start = now.subtract(30, "day").startOf("day");
        setDatePresetLabel("30 ngày qua");
        break;
      case "thisMonth":
        start = now.startOf("month");
        setDatePresetLabel("Tháng này");
        break;
      case "lastMonth":
        start = now.subtract(1, "month").startOf("month");
        end = now.subtract(1, "month").endOf("month");
        setDatePresetLabel("Tháng trước");
        break;
      case "thisYear":
        start = now.startOf("year");
        setDatePresetLabel("Năm nay");
        break;
      case "all":
        start = null;
        end = null;
        setDatePresetLabel("Tất cả thời gian");
        break;
      default:
        break;
    }

    setDateRange([start, end]);
    setCurrentPage(0);
  };

  const handleDateRangeChange = (
    dates: [Dayjs | null, Dayjs | null] | null
  ) => {
    if (dates) {
      setDateRange(dates);
      setDatePresetLabel("Tùy chỉnh");
    } else {
      setDateRange([null, null]);
      setDatePresetLabel("Tất cả thời gian");
    }
    setCurrentPage(0);
  };

  const datePresetMenuItems: MenuProps["items"] = [
    { key: "all", label: "Tất cả thời gian" },
    { type: "divider" },
    { key: "today", label: "Hôm nay" },
    { key: "yesterday", label: "Hôm qua" },
    { key: "7days", label: "7 ngày qua" },
    { key: "30days", label: "30 ngày qua" },
    { type: "divider" },
    { key: "thisMonth", label: "Tháng này" },
    { key: "lastMonth", label: "Tháng trước" },
    { key: "thisYear", label: "Năm nay" },
  ];

  // Export handlers
  const [isExporting, setIsExporting] = useState(false);

  const getExportData = (): OrderExportData[] => {
    return (data?.content || []).map((order) => ({
      id: order.id,
      orderCode: order.orderCode,
      createdAt: order.createdAt,
      totalAmount: order.totalAmount,
      status: order.status,
      paymentMethod: order.paymentMethod,
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      customerPhone: order.customerPhone,
      userFirstName: order.userFirstName,
      userLastName: order.userLastName,
      items: order.items?.map((item) => ({
        productName: item.productName,
        quantity: item.quantity,
      })),
    }));
  };

  const handleExportCSV = () => {
    const orders = getExportData();
    if (orders.length === 0) {
      toast.warning("Không có dữ liệu để xuất");
      return;
    }
    exportOrdersToCSV(orders);
    toast.success(`Đã xuất ${orders.length} đơn hàng ra file CSV`);
  };

  const handleExportExcel = async () => {
    const orders = getExportData();
    if (orders.length === 0) {
      toast.warning("Không có dữ liệu để xuất");
      return;
    }
    setIsExporting(true);
    try {
      await exportOrdersToExcel(orders);
      toast.success(`Đã xuất ${orders.length} đơn hàng ra file Excel`);
    } catch (error) {
      handleApiError(error);
    } finally {
      setIsExporting(false);
    }
  };

  const exportMenuItems: MenuProps["items"] = [
    {
      key: "csv",
      label: "Xuất CSV",
      icon: <DownloadOutlined />,
      onClick: handleExportCSV,
    },
    {
      key: "excel",
      label: "Xuất Excel",
      icon: <FileExcelOutlined />,
      onClick: handleExportExcel,
    },
  ];

  // Bulk operations
  const bulkUpdateMutation = useMutation({
    mutationFn: async (request: BulkOrderRequest) => {
      return await adminOrderService.bulkUpdateOrders(request);
    },
    onSuccess: (response) => {
      toast.success("Cập nhật trạng thái đơn hàng thành công");
      setSelectedOrderIds(new Set());
      setIsBulkModalOpen(false);
      setBulkStatus("");
      refetch();
      queryClient.invalidateQueries({ queryKey: ["adminOrderStats"] });

      // Show detailed results if there were failures
      if (response.failedCount > 0) {
        const failedOrders = response.results
          .filter((r) => !r.success)
          .map((r) => `${r.orderCode || r.orderId}: ${r.message}`)
          .join("\n");
        Modal.warning({
          title: "Cập nhật trạng thái đơn hàng thất bại",
          content: (
            <div>
              <p>
                Thành công: {response.successCount}, Thất bại:{" "}
                {response.failedCount}
              </p>
              <pre style={{ maxHeight: "200px", overflow: "auto" }}>
                {failedOrders}
              </pre>
            </div>
          ),
        });
      }
    },
    onError: (error) => {
      handleApiError(error);
    },
  });

  const handleSelectAll = useCallback(
    (checked: boolean) => {
      if (checked) {
        const allIds = new Set(data?.content.map((order) => order.id) || []);
        setSelectedOrderIds(allIds);
      } else {
        setSelectedOrderIds(new Set());
      }
    },
    [data]
  );

  const handleSelectOrder = useCallback(
    (orderId: number, checked: boolean) => {
      const newSelected = new Set(selectedOrderIds);
      if (checked) {
        newSelected.add(orderId);
      } else {
        newSelected.delete(orderId);
      }
      setSelectedOrderIds(newSelected);
    },
    [selectedOrderIds]
  );

  const handleBulkStatusUpdate = useCallback(() => {
    if (selectedOrderIds.size === 0) {
      toast.warning("Vui lòng chọn ít nhất một đơn hàng");
      return;
    }
    setIsBulkModalOpen(true);
  }, [selectedOrderIds]);

  const handleBulkUpdateConfirm = useCallback(() => {
    if (!bulkStatus) {
      toast.warning("Vui lòng chọn trạng thái");
      return;
    }

    bulkUpdateMutation.mutate({
      orderIds: Array.from(selectedOrderIds),
      action: "UPDATE_STATUS",
      params: { status: bulkStatus },
    });
  }, [bulkStatus, selectedOrderIds, bulkUpdateMutation]);

  const handleClearSelection = useCallback(() => {
    setSelectedOrderIds(new Set());
  }, []);

  const renderCards = useMemo(() => {
    const orders = data?.content || [];

    if (orders.length === 0) {
      return (
        <div className="mt-8">
          <Empty description="Không có đơn hàng" />
        </div>
      );
    }

    const isAllSelected =
      orders.length > 0 &&
      orders.every((order) => selectedOrderIds.has(order.id));

    return (
      <div className="space-y-4 flex flex-col gap-4">
        {/* Select All Header */}
        <div className="flex items-center justify-between gap-3 p-3 bg-gray-50 rounded-lg">
          <Checkbox
            checked={isAllSelected}
            indeterminate={
              selectedOrderIds.size > 0 && selectedOrderIds.size < orders.length
            }
            onChange={(e) => handleSelectAll(e.target.checked)}
          >
            <Text strong>Chọn tất cả ({orders.length} đơn hàng)</Text>
          </Checkbox>

          {/* Bulk Actions - Show when items selected */}
          {selectedOrderIds.size > 0 && (
            <Space>
              <Text type="secondary" className="text-sm">
                <CheckOutlined className="mr-1" />
                {selectedOrderIds.size} đơn hàng đã chọn
              </Text>
              <Button
                type="primary"
                size="small"
                onClick={handleBulkStatusUpdate}
                loading={bulkUpdateMutation.isPending}
              >
                Cập nhật trạng thái
              </Button>
              <Button
                size="small"
                icon={<CloseOutlined />}
                onClick={handleClearSelection}
              >
                Bỏ chọn
              </Button>
            </Space>
          )}
        </div>

        {orders.map((order) => (
          <Card
            key={order.id}
            hoverable
            className="w-full shadow-sm"
            onClick={(e) => {
              // Don't navigate if clicking checkbox
              const target = e.target as HTMLElement;
              if (
                target.closest(".ant-checkbox-wrapper") ||
                target.closest(".order-checkbox")
              ) {
                return;
              }
              navigate(`/admin/orders/${order.orderCode}`);
            }}
          >
            <div className="flex items-start gap-3">
              {/* Checkbox */}
              <div
                className="order-checkbox mt-1"
                onClick={(e) => e.stopPropagation()}
              >
                <Checkbox
                  checked={selectedOrderIds.has(order.id)}
                  onChange={(e) =>
                    handleSelectOrder(order.id, e.target.checked)
                  }
                />
              </div>

              {/* Order Content */}
              <div className="flex-1">
                <div className="space-y-4">
                  {/* Header */}
                  <div className="flex items-center justify-between pb-3 border-b">
                    <div>
                      <Text strong className="text-base">
                        #{order.orderCode}
                      </Text>
                      <Text type="secondary" className="ml-3">
                        {new Date(order.createdAt).toLocaleString("vi-VN")}
                      </Text>
                    </div>

                    {order.status === "PENDING" ? (
                      <Tag
                        color={
                          order.paymentMethod === "COD" ? "gold" : "geekblue"
                        }
                      >
                        {order.paymentMethod === "COD"
                          ? "Chờ xác nhận COD"
                          : "Chờ thanh toán PayOS"}
                      </Tag>
                    ) : (
                      <Tag color={statusColorMap[order.status] || "default"}>
                        {statusLabel(order.status)}
                      </Tag>
                    )}
                  </div>

                  {/* Customer Info */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    <div>
                      <Text type="secondary" className="text-xs">
                        Khách hàng
                      </Text>
                      <div>
                        <Text className="text-sm">
                          {order.userFirstName} {order.userLastName}
                        </Text>
                      </div>
                    </div>
                    <div>
                      <Text type="secondary" className="text-xs">
                        Email
                      </Text>
                      <div>
                        <Text className="text-sm">
                          {order.customerEmail || "N/A"}
                        </Text>
                      </div>
                    </div>
                    <div>
                      <Text type="secondary" className="text-xs">
                        Số điện thoại
                      </Text>
                      <div>
                        <Text className="text-sm">
                          {order.customerPhone || "N/A"}
                        </Text>
                      </div>
                    </div>
                  </div>

                  {/* Products */}
                  {order.items && order.items.length > 0 && (
                    <div className="space-y-2">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-3">
                          <Image
                            src={
                              item.imageUrl || "https://via.placeholder.com/60"
                            }
                            alt={item.productName}
                            width={60}
                            height={60}
                            className="rounded object-cover"
                            preview={false}
                          />
                          <div className="flex-1">
                            <Text className="text-sm">{item.productName}</Text>
                            <Text type="secondary" className="text-xs ml-2">
                              x{item.quantity}
                            </Text>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-3 border-t">
                    <div>
                      <Text type="secondary" className="text-xs">
                        Phương thức thanh toán
                      </Text>
                      <div>
                        <Text className="text-sm">
                          {order.paymentMethod === "COD" ? "Tiền mặt" : "PayOS"}
                        </Text>
                      </div>
                    </div>
                    <div className="text-right">
                      <Text type="secondary" className="text-xs">
                        Tổng tiền
                      </Text>
                      <div>
                        <Text strong className="text-base text-red-600">
                          {formatCurrency(
                            order.finalAmount ?? order.totalAmount
                          )}
                        </Text>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  }, [
    data,
    navigate,
    selectedOrderIds,
    handleSelectAll,
    handleSelectOrder,
    handleBulkStatusUpdate,
    handleClearSelection,
    bulkUpdateMutation.isPending,
  ]);

  const tabItems = [
    { key: "ALL", label: `Tất cả (${stats?.totalOrders || 0})` },
    {
      key: "PENDING",
      label: `Chờ thanh toán / xác nhận (${stats?.pendingCount || 0})`,
    },
    { key: "PAID", label: `Đã thanh toán (${stats?.paidCount || 0})` },
    { key: "CONFIRMED", label: `Đã xác nhận (${stats?.confirmedCount || 0})` },
    { key: "SHIPPING", label: `Đang giao (${stats?.shippingCount || 0})` },
    { key: "DELIVERED", label: `Đã giao (${stats?.deliveredCount || 0})` },
    { key: "COMPLETED", label: `Hoàn thành (${stats?.completedCount || 0})` },
    { key: "CANCELLED", label: `Đã hủy (${stats?.cancelledCount || 0})` },
    { key: "REFUNDED", label: `Đã hoàn tiền (${stats?.refundedCount || 0})` },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <Title level={2}>Quản lý đơn hàng</Title>

      {/* Statistics */}
      {stats && (
        <Row gutter={16} className="mb-6">
          <Col xs={12} sm={12} md={6}>
            <Card>
              <Statistic title="Tổng đơn hàng" value={stats.totalOrders} />
            </Card>
          </Col>
          <Col xs={12} sm={12} md={6}>
            <Card>
              <Statistic
                title="Tổng doanh thu"
                value={stats.totalRevenue}
                precision={0}
                suffix="₫"
              />
            </Card>
          </Col>
          <Col xs={12} sm={12} md={6}>
            <Card>
              <Statistic
                title="Đang xử lý"
                value={stats.pendingCount + stats.confirmedCount}
              />
            </Card>
          </Col>
          <Col xs={12} sm={12} md={6}>
            <Card>
              <Statistic title="Đang giao" value={stats.shippingCount} />
            </Card>
          </Col>
        </Row>
      )}

      {/* Search & Filter */}
      <Card className="mb-4 shadow-sm">
        <Space direction="vertical" size="middle" className="w-full">
          {/* Search Row */}
          <div className="flex flex-wrap gap-3">
            <Space.Compact className="flex-1 min-w-[300px]">
              <Select
                value={searchType}
                onChange={setSearchType}
                className="w-40"
                options={[
                  { label: "Mã đơn hàng", value: "orderCode" },
                  { label: "Tên khách hàng", value: "customerName" },
                  { label: "Email", value: "customerEmail" },
                  { label: "Số điện thoại", value: "customerPhone" },
                ]}
              />
              <Input
                placeholder={`Tìm theo ${searchType === "orderCode" ? "mã đơn hàng" : searchType === "customerName" ? "tên khách hàng" : searchType === "customerEmail" ? "email" : "số điện thoại"}`}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                onPressEnter={handleSearch}
                allowClear
              />
            </Space.Compact>

            {/* Date Filter */}
            <Space.Compact>
              <Dropdown
                menu={{
                  items: datePresetMenuItems,
                  onClick: ({ key }) => applyDatePreset(key),
                }}
                trigger={["click"]}
              >
                <Button icon={<CalendarOutlined />}>
                  {datePresetLabel} <DownOutlined />
                </Button>
              </Dropdown>
              <RangePicker
                value={dateRange}
                onChange={handleDateRangeChange}
                format="DD/MM/YYYY"
                placeholder={["Từ ngày", "Đến ngày"]}
                allowClear
                style={{ width: 250 }}
              />
            </Space.Compact>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Space>
              <Button
                type="primary"
                icon={<SearchOutlined />}
                onClick={handleSearch}
              >
                Tìm kiếm
              </Button>
              <Button icon={<ReloadOutlined />} onClick={handleReset}>
                Đặt lại
              </Button>
              <Button icon={<ReloadOutlined />} onClick={() => refetch()}>
                Làm mới
              </Button>
            </Space>

            {/* Export Buttons */}
            <Dropdown
              menu={{ items: exportMenuItems }}
              trigger={["click"]}
              disabled={!data?.content?.length}
            >
              <Button icon={<DownloadOutlined />} loading={isExporting}>
                Xuất dữ liệu <DownOutlined />
              </Button>
            </Dropdown>
          </div>

          {/* Active Filters Display */}
          {(dateRange[0] || dateRange[1]) && (
            <div className="flex items-center gap-2">
              <Text type="secondary" className="text-sm">
                Đang lọc:
              </Text>
              <Tag
                closable
                onClose={() => {
                  setDateRange([null, null]);
                  setDatePresetLabel("Tất cả thời gian");
                }}
                color="blue"
              >
                <CalendarOutlined className="mr-1" />
                {dateRange[0]?.format("DD/MM/YYYY")} -{" "}
                {dateRange[1]?.format("DD/MM/YYYY")}
              </Tag>
            </div>
          )}
        </Space>
      </Card>

      {/* Tabs */}
      <Tabs
        activeKey={statusFilter || "ALL"}
        onChange={(key) => {
          setStatusFilter(key === "ALL" ? undefined : key);
          setCurrentPage(0);
        }}
        items={tabItems}
        className="mb-4"
      />

      {/* Orders List */}
      <Spin spinning={isLoading}>{renderCards}</Spin>

      {/* Pagination */}
      {data && data.totalPages > 1 && (
        <div className="flex justify-center mt-6">
          <Pagination
            current={currentPage + 1}
            total={data.totalItems}
            pageSize={pageSize}
            showSizeChanger
            pageSizeOptions={[10, 20, 50, 100]}
            onChange={(page, size) => {
              setCurrentPage(page - 1);
              setPageSize(size);
            }}
            showTotal={(total) => `Tổng ${total} đơn hàng`}
          />
        </div>
      )}

      {/* Bulk Update Status Modal */}
      <Modal
        title="Cập nhật trạng thái hàng loạt"
        open={isBulkModalOpen}
        onOk={handleBulkUpdateConfirm}
        onCancel={() => {
          setIsBulkModalOpen(false);
          setBulkStatus("");
        }}
        confirmLoading={bulkUpdateMutation.isPending}
        okText="Xác nhận"
        cancelText="Hủy"
      >
        <Space direction="vertical" className="w-full" size="large">
          <Alert
            message={`Bạn đang cập nhật ${selectedOrderIds.size} đơn hàng`}
            type="warning"
            showIcon
          />
          <div>
            <Text strong className="block mb-2">
              Chọn trạng thái mới:
            </Text>
            <Select
              value={bulkStatus}
              onChange={setBulkStatus}
              className="w-full"
              placeholder="Chọn trạng thái"
              options={[
                { label: "Đã thanh toán", value: "PAID" },
                { label: "Đã xác nhận", value: "CONFIRMED" },
                { label: "Đang giao", value: "SHIPPING" },
                { label: "Đã giao", value: "DELIVERED" },
                { label: "Hoàn thành", value: "COMPLETED" },
                { label: "Đã hủy", value: "CANCELLED" },
                { label: "Đã hoàn tiền", value: "REFUNDED" },
              ]}
            />
          </div>
        </Space>
      </Modal>
    </div>
  );
};

export default AdminOrdersPage;
