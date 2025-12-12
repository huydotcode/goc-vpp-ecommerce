# Cải thiện Trang Đơn Hàng Người Dùng

## 📋 Tổng quan

Tài liệu này ghi lại các phân tích và đề xuất cải thiện cho 2 trang:

- `client/src/pages/Orders.tsx` - Danh sách đơn hàng
- `client/src/pages/OrderDetail.tsx` - Chi tiết đơn hàng

---

## 🔍 Phân tích hiện tại

### 1. Orders.tsx (Danh sách đơn hàng)

#### ✅ Đã có:

- Hiển thị danh sách đơn hàng với thông tin cơ bản
- Filter theo trạng thái (PENDING, CONFIRMED, SHIPPING, COMPLETED, CANCELLED, FAILED)
- Hiển thị hình ảnh sản phẩm đầu tiên
- Hiển thị tổng tiền, ngày tạo
- Click vào card để xem chi tiết

#### ❌ Thiếu:

1. **Chức năng hủy đơn hàng** - User không thể hủy đơn từ danh sách
2. **Filter không đầy đủ** - Thiếu PAID, DELIVERED, REFUNDED
3. **Pagination** - Không có phân trang nếu có nhiều đơn
4. **Search** - Không thể tìm kiếm đơn hàng
5. **Sắp xếp** - Không thể sắp xếp theo ngày, giá, trạng thái
6. **Action buttons** - Thiếu nút hủy, đánh giá, xem chi tiết rõ ràng
7. **Tracking info** - Không hiển thị mã vận đơn
8. **Estimated delivery** - Không có ngày dự kiến giao hàng
9. **Empty state tốt hơn** - Empty state hiện tại quá đơn giản
10. **Loading skeleton** - Chỉ có Spin, không có skeleton

---

### 2. OrderDetail.tsx (Chi tiết đơn hàng)

#### ✅ Đã có:

- Hiển thị thông tin chi tiết đơn hàng
- Steps hiển thị tiến trình đơn hàng
- Hiển thị danh sách sản phẩm
- PayOS payment section (nếu chưa thanh toán)
- Auto-remove PayOS URL khi đã thanh toán

#### ❌ Thiếu:

1. **Nút hủy đơn hàng** - Không có nút để user hủy đơn (PENDING, PAID, CONFIRMED)
2. **Nút yêu cầu hoàn tiền** - Không có cho CANCELLED, COMPLETED
3. **Tracking information** - Không hiển thị mã vận đơn, đơn vị vận chuyển
4. **Estimated delivery date** - Không có ngày dự kiến giao hàng
5. **Nút đánh giá sản phẩm** - Không có cho COMPLETED, DELIVERED
6. **Order History Timeline** - Không có lịch sử thay đổi trạng thái (admin có)
7. **Print/Download invoice** - Không có nút in/tải hóa đơn
8. **Steps không đúng** - PAID không có trong statusStepsOrder
9. **Refresh button** - Không có nút làm mới thủ công
10. **Auto-refresh** - Không tự động refresh khi status thay đổi
11. **Thông tin vận chuyển chi tiết** - Thiếu thông tin shipping company, tracking URL

---

## 🎯 Đề xuất cải thiện

### Priority: HIGH 🔴

#### 1. Thêm nút hủy đơn hàng

**Orders.tsx:**

```typescript
// Thêm vào mỗi order card
{
  canCancelOrder(order) && (
    <Button
      size="small"
      danger
      onClick={(e) => {
        e.stopPropagation();
        handleCancelOrder(order.orderCode);
      }}
    >
      Hủy đơn
    </Button>
  );
}

// Helper function
const canCancelOrder = (order: OrderSummary) => {
  return (
    order.status === "PENDING" ||
    order.status === "PAID" ||
    order.status === "CONFIRMED"
  );
};
```

**OrderDetail.tsx:**

```typescript
// Thêm action section
{
  canCancelOrder(data) && (
    <Card className="shadow-sm border-red-200">
      <Space direction="vertical" style={{ width: "100%" }}>
        <Alert message="Bạn có thể hủy đơn hàng này" type="info" showIcon />
        <Button
          danger
          block
          onClick={handleCancelOrder}
          loading={cancelMutation.isPending}
        >
          Hủy đơn hàng
        </Button>
      </Space>
    </Card>
  );
}
```

**API cần thêm:**

```typescript
// client/src/api/order.api.ts
cancelOrder: async (orderCode: string, reason?: string) => {
  const response = await api.post(`/api/v1/orders/${orderCode}/cancel`, {
    reason,
  });
  return response.data;
};
```

---

#### 2. Thêm filter đầy đủ các trạng thái

**Orders.tsx:**

```typescript
const tabs = [
  { key: "ALL", label: "Tất cả", value: undefined },
  { key: "PENDING", label: "Chờ thanh toán", value: "PENDING" },
  { key: "PAID", label: "Đã thanh toán", value: "PAID" },
  { key: "CONFIRMED", label: "Đã xác nhận", value: "CONFIRMED" },
  { key: "SHIPPING", label: "Đang giao", value: "SHIPPING" },
  { key: "DELIVERED", label: "Đã giao", value: "DELIVERED" },
  { key: "COMPLETED", label: "Hoàn thành", value: "COMPLETED" },
  { key: "CANCELLED", label: "Đã hủy", value: "CANCELLED" },
  { key: "REFUNDED", label: "Đã hoàn tiền", value: "REFUNDED" },
];
```

---

#### 3. Fix Steps để hiển thị PAID

**OrderDetail.tsx:**

```typescript
const statusStepsOrder = [
  "PENDING",
  "PAID", // Thêm PAID vào steps
  "CONFIRMED",
  "SHIPPING",
  "DELIVERED",
  "COMPLETED",
];

// Cải thiện statusToCurrentStep để xử lý PAID
const statusToCurrentStep = (status: string) => {
  // Map các status không có trong steps
  const statusMap: Record<string, string> = {
    PAID: "CONFIRMED", // PAID tương đương CONFIRMED trong flow
  };

  const mappedStatus = statusMap[status] || status;
  const idx = statusStepsOrder.indexOf(mappedStatus);
  if (idx === -1) return 0;
  return Math.min(idx, statusStepsOrder.length - 1);
};
```

---

#### 4. Thêm tracking information

**OrderDetail.tsx:**

```typescript
// Thêm vào type
type OrderDetail = {
  // ... existing fields
  trackingNumber?: string;
  shippingCompany?: string;
  estimatedDeliveryDate?: string;
  trackingUrl?: string;
};

// Thêm card hiển thị tracking
{
  (data.status === "SHIPPING" || data.status === "DELIVERED") &&
    data.trackingNumber && (
      <Card title="Thông tin vận chuyển" className="shadow-sm">
        <Space direction="vertical" style={{ width: "100%" }}>
          <div>
            <Typography.Text strong>Mã vận đơn: </Typography.Text>
            <Typography.Text copyable>{data.trackingNumber}</Typography.Text>
          </div>
          {data.shippingCompany && (
            <div>
              <Typography.Text strong>Đơn vị vận chuyển: </Typography.Text>
              <Typography.Text>{data.shippingCompany}</Typography.Text>
            </div>
          )}
          {data.trackingUrl && (
            <Button
              type="link"
              href={data.trackingUrl}
              target="_blank"
              icon={<LinkOutlined />}
            >
              Theo dõi đơn hàng
            </Button>
          )}
          {data.estimatedDeliveryDate && (
            <div>
              <Typography.Text strong>Dự kiến giao: </Typography.Text>
              <Typography.Text>
                {new Date(data.estimatedDeliveryDate).toLocaleDateString(
                  "vi-VN"
                )}
              </Typography.Text>
            </div>
          )}
        </Space>
      </Card>
    );
}
```

---

#### 5. Thêm action buttons

**Orders.tsx:**

```typescript
// Thêm vào mỗi order card
<div className="flex flex-col items-end gap-2">
  <Tag color={statusColorMap[order.status] || "default"}>
    {statusLabel(order.status)}
  </Tag>
  <Space size="small">
    <Button
      size="small"
      onClick={(e) => {
        e.stopPropagation();
        navigate(`/user/orders/${order.orderCode || order.id}`);
      }}
    >
      Chi tiết
    </Button>
    {canCancelOrder(order) && (
      <Button
        size="small"
        danger
        onClick={(e) => {
          e.stopPropagation();
          handleCancelOrder(order.orderCode);
        }}
      >
        Hủy
      </Button>
    )}
    {canReview(order) && (
      <Button
        size="small"
        onClick={(e) => {
          e.stopPropagation();
          navigate(`/user/orders/${order.orderCode}/review`);
        }}
      >
        Đánh giá
      </Button>
    )}
  </Space>
  {order.paymentMethod && (
    <Typography.Text type="secondary" className="text-xs">
      {order.paymentMethod === "COD" ? "COD" : "Thanh toán online"}
    </Typography.Text>
  )}
</div>
```

---

### Priority: MEDIUM 🟡

#### 6. Thêm Order History Timeline

**OrderDetail.tsx:**

```typescript
// Import component
import OrderTimeline from "@/components/admin/OrderTimeline";

// Fetch order history
const { data: historyData, isLoading: historyLoading } = useQuery({
  queryKey: ["orderHistory", orderCode],
  queryFn: async () => {
    if (!orderCode) return [];
    try {
      return await orderApi.getOrderHistory(orderCode);
    } catch (error) {
      handleApiError(error);
      return [];
    }
  },
  enabled: !!orderCode,
});

// Thêm vào render
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
</Card>;
```

**API cần thêm:**

```typescript
// client/src/api/order.api.ts
getOrderHistory: async (orderCode: string) => {
  const response = await api.get(`/api/v1/orders/${orderCode}/history`);
  return response.data;
};
```

---

#### 7. Thêm pagination

**Orders.tsx:**

```typescript
const [currentPage, setCurrentPage] = useState(1);
const [pageSize, setPageSize] = useState(10);

const { data, isLoading } = useQuery({
  queryKey: ["userOrders", statusFilter, currentPage, pageSize],
  queryFn: async () => {
    try {
      const response = await orderService.getMyOrders({
        status: statusFilter,
        page: currentPage - 1,
        size: pageSize,
      });
      return response;
    } catch (error) {
      handleApiError(error);
      throw error;
    }
  },
});

// Thêm pagination component
<Pagination
  current={currentPage}
  pageSize={pageSize}
  total={data?.totalElements || 0}
  onChange={(page, size) => {
    setCurrentPage(page);
    setPageSize(size);
  }}
  showSizeChanger
  showTotal={(total) => `Tổng ${total} đơn hàng`}
  style={{ marginTop: 16, textAlign: "right" }}
/>;
```

---

#### 8. Thêm search

**Orders.tsx:**

```typescript
const [searchText, setSearchText] = useState("");

// Thêm search input
<Input.Search
  placeholder="Tìm kiếm theo mã đơn hàng..."
  value={searchText}
  onChange={(e) => setSearchText(e.target.value)}
  onSearch={(value) => {
    // Filter orders by orderCode
    // Hoặc gọi API với search param
  }}
  style={{ marginBottom: 16 }}
/>;

// Hoặc filter client-side
const filteredOrders = useMemo(() => {
  if (!searchText) return orders;
  return orders.filter((order) =>
    order.orderCode?.toLowerCase().includes(searchText.toLowerCase())
  );
}, [orders, searchText]);
```

---

#### 9. Thêm auto-refresh cho pending orders

**OrderDetail.tsx:**

```typescript
const { data, isLoading, refetch } = useQuery(...);

// Auto-refresh khi status là PENDING hoặc PAID
useEffect(() => {
  if (data?.status === "PENDING" || data?.status === "PAID") {
    const interval = setInterval(() => {
      refetch();
    }, 30000); // Refresh mỗi 30 giây

    return () => clearInterval(interval);
  }
}, [data?.status, refetch]);

// Thêm visual indicator
{data?.status === "PENDING" && (
  <Alert
    message="Đang tự động cập nhật trạng thái đơn hàng..."
    type="info"
    showIcon
    style={{ marginBottom: 16 }}
  />
)}
```

---

#### 10. Thêm print/download invoice

**OrderDetail.tsx:**

```typescript
import { PrinterOutlined, DownloadOutlined } from "@ant-design/icons";

const handlePrintInvoice = () => {
  window.print();
  // Hoặc mở print dialog với invoice template
};

const handleDownloadInvoice = async () => {
  try {
    const response = await orderApi.downloadInvoice(orderCode);
    const blob = new Blob([response.data], { type: "application/pdf" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `invoice-${orderCode}.pdf`;
    link.click();
    window.URL.revokeObjectURL(url);
  } catch (error) {
    handleApiError(error);
  }
};

// Thêm vào render
<Card className="shadow-sm">
  <Space>
    <Button icon={<PrinterOutlined />} onClick={handlePrintInvoice}>
      In hóa đơn
    </Button>
    <Button icon={<DownloadOutlined />} onClick={handleDownloadInvoice}>
      Tải hóa đơn PDF
    </Button>
    <Button icon={<ReloadOutlined />} onClick={() => refetch()}>
      Làm mới
    </Button>
  </Space>
</Card>;
```

---

### Priority: LOW 🟢

#### 11. Cải thiện empty state

**Orders.tsx:**

```typescript
<Empty
  image={Empty.PRESENTED_IMAGE_SIMPLE}
  description={
    <span>
      <Typography.Text type="secondary">
        Bạn chưa có đơn hàng nào.
      </Typography.Text>
      <br />
      <Button
        type="link"
        onClick={() => navigate("/products")}
        style={{ marginTop: 8 }}
      >
        Mua sắm ngay
      </Button>
    </span>
  }
/>
```

---

#### 12. Thêm loading skeleton

**Orders.tsx:**

```typescript
import { Skeleton } from "antd";

{
  isLoading ? (
    <div className="flex flex-col gap-3 sm:gap-4">
      {[1, 2, 3].map((i) => (
        <Card key={i}>
          <Skeleton active avatar paragraph={{ rows: 3 }} />
        </Card>
      ))}
    </div>
  ) : (
    renderCards
  );
}
```

---

#### 13. Thêm estimated delivery date

**Orders.tsx & OrderDetail.tsx:**

```typescript
// Thêm vào order card
{
  order.estimatedDeliveryDate && (
    <div className="text-xs text-blue-600 mt-1">
      📦 Dự kiến giao: {formatDate(order.estimatedDeliveryDate)}
    </div>
  );
}
```

---

#### 14. Thêm reorder functionality

**OrderDetail.tsx:**

```typescript
const handleReorder = async () => {
  try {
    // Lấy danh sách sản phẩm từ đơn hàng
    const items = data.items || [];

    // Thêm vào cart
    for (const item of items) {
      await cartService.addToCart({
        variantId: item.variantId,
        quantity: item.quantity,
      });
    }

    toast.success("Đã thêm sản phẩm vào giỏ hàng");
    navigate("/cart");
  } catch (error) {
    handleApiError(error);
  }
};

// Thêm button
{
  data.status === "COMPLETED" && (
    <Button block onClick={handleReorder}>
      Đặt lại đơn hàng
    </Button>
  );
}
```

---

## 📝 Checklist triển khai

### Phase 1: High Priority

- [ ] Thêm nút hủy đơn hàng (Orders.tsx & OrderDetail.tsx)
- [ ] Thêm API cancel order (backend)
- [ ] Thêm filter đầy đủ các trạng thái (Orders.tsx)
- [ ] Fix Steps để hiển thị PAID (OrderDetail.tsx)
- [ ] Thêm tracking information (OrderDetail.tsx)
- [ ] Thêm action buttons (Orders.tsx)

### Phase 2: Medium Priority

- [ ] Thêm Order History Timeline (OrderDetail.tsx)
- [ ] Thêm API get order history (backend)
- [ ] Thêm pagination (Orders.tsx)
- [ ] Thêm search (Orders.tsx)
- [ ] Thêm auto-refresh (OrderDetail.tsx)
- [ ] Thêm print/download invoice (OrderDetail.tsx)

### Phase 3: Low Priority

- [ ] Cải thiện empty state
- [ ] Thêm loading skeleton
- [ ] Thêm estimated delivery date
- [ ] Thêm reorder functionality

---

## 🔗 API Endpoints cần thêm

### Backend (Java)

```java
// Cancel order
@PostMapping("/orders/{orderCode}/cancel")
public ResponseEntity<?> cancelOrder(
    @PathVariable String orderCode,
    @RequestBody(required = false) CancelOrderRequest request
) {
    // Validate: chỉ cho phép hủy nếu status là PENDING, PAID, CONFIRMED
    // Update status to CANCELLED
    // Log to order history
}

// Get order history
@GetMapping("/orders/{orderCode}/history")
public ResponseEntity<List<OrderHistoryItem>> getOrderHistory(
    @PathVariable String orderCode
) {
    // Return order history timeline
}

// Download invoice
@GetMapping("/orders/{orderCode}/invoice")
public ResponseEntity<Resource> downloadInvoice(
    @PathVariable String orderCode
) {
    // Generate PDF invoice
    // Return PDF file
}
```

---

## 📊 Metrics để đo lường

- **User engagement**: Số lần user xem chi tiết đơn hàng
- **Cancel rate**: Tỷ lệ đơn hàng bị hủy
- **Support tickets**: Số ticket liên quan đến đơn hàng (sẽ giảm nếu có tracking info)
- **Time to complete**: Thời gian từ đặt hàng đến hoàn thành

---

## 🎨 UI/UX Improvements

1. **Visual hierarchy**: Làm rõ các action buttons với màu sắc và kích thước
2. **Mobile responsive**: Đảm bảo tất cả features hoạt động tốt trên mobile
3. **Loading states**: Thêm skeleton loading thay vì chỉ có Spin
4. **Error handling**: Hiển thị error messages rõ ràng hơn
5. **Confirmation dialogs**: Thêm confirm dialog trước khi hủy đơn

---

## 📅 Timeline đề xuất

- **Week 1**: Phase 1 (High Priority)
- **Week 2**: Phase 2 (Medium Priority)
- **Week 3**: Phase 3 (Low Priority) + Testing & Bug fixes

---

## 🔄 Notes

- Tất cả các thay đổi cần được test kỹ trên cả desktop và mobile
- Cần thêm unit tests cho các functions mới
- Cần update API documentation
- Cần thông báo cho users về các tính năng mới

---

**Last Updated**: 2025-12-11
**Author**: AI Assistant
**Status**: Draft - Pending Review
