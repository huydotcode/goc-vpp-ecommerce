# 🚀 Admin Order Management - Feature Enhancements

> Danh sách các tính năng cần nâng cấp cho trang quản lý đơn hàng admin

**Ngày tạo**: 10/12/2025  
**Trạng thái hiện tại**: MVP Complete - Basic CRUD operations working  
**Ưu tiên**: High → Medium → Low

---

## 📋 I. HIGH PRIORITY (Cần thiết cho production)

### 1. ✨ Bulk Actions (Hành động hàng loạt) ✅ COMPLETED

**Mô tả**: Cho phép admin thao tác với nhiều đơn hàng cùng lúc

**Features**:

- [x] Select all checkbox (header)
- [x] Individual row selection
- [x] Bulk status update
  - Select multiple orders → Change status to CONFIRMED
  - Confirmation dialog before applying
- [x] Selected count indicator (e.g., "3 đơn hàng đã chọn")
- [ ] Bulk export to CSV/Excel (Future enhancement)

**Technical**:

```typescript
// Frontend
- Add useState for selectedOrders: Set<number>
- Ant Design Table with rowSelection
- Bulk action toolbar (sticky when items selected)

// Backend
POST /orders/admin/bulk-update
{
  orderIds: number[],
  action: "UPDATE_STATUS" | "EXPORT",
  params: { status?: string }
}
```

**Impact**: Tiết kiệm thời gian cho admin khi xử lý nhiều đơn

---

### 2. 📅 Advanced Date Filters ✅ COMPLETED

**Mô tả**: Lọc đơn hàng theo khoảng thời gian

**Features**:

- [x] Date range picker (start date → end date)
- [x] Quick filters:
  - Hôm nay
  - Hôm qua
  - 7 ngày qua
  - 30 ngày qua
  - Tháng này
  - Tháng trước
  - Năm nay
  - Tất cả thời gian
- [x] Apply to both order list and statistics
- [x] Active filter tag with clear button

**Technical**:

```typescript
// Frontend
- Ant Design DatePicker.RangePicker
- Add startDate, endDate to filters

// Backend (Already exists in OrderService.getOrderStatistics)
- Extend getAllOrdersAdmin to accept createdAfter, createdBefore
- Add date range to Specification predicates
```

**Impact**: Dễ dàng theo dõi đơn hàng theo thời gian

---

### 3. 📄 Export & Print ✅ COMPLETED

**Mô tả**: Xuất dữ liệu và in hóa đơn

**Features**:

- [x] **Export Order List**
  - CSV format (all filtered orders) với UTF-8 BOM
  - Excel format với formatting (màu sắc theo trạng thái, currency format)
  - Include columns: Order Code, Date, Customer, Email, Phone, Address, Total, Status, Payment, User Account
  - Summary row với tổng số đơn và tổng tiền
- [x] **Print Invoice**
  - Professional invoice template với CSS styling
  - Company info header
  - Customer info section
  - Order items table với STT, SL, Đơn giá, Thành tiền
  - Totals section
  - Barcode cho order code
  - Status badge với màu sắc
  - Auto print khi mở popup
- [ ] **Export Single Order (PDF)** (Future enhancement)
  - PDF invoice generation
  - Download or email to customer

**Technical**:

```typescript
// Frontend
- ExcelJS library for Excel export
- jsPDF + html2canvas for PDF
- window.print() for printing

// Backend
- Apache POI for Excel generation
- iText/Flying Saucer for PDF
- Email service integration

Endpoints:
GET /orders/admin/export?format=csv|excel&filters=...
GET /orders/admin/{orderCode}/invoice/pdf
POST /orders/admin/{orderCode}/invoice/email
```

**Impact**: Báo cáo và lưu trữ dữ liệu chuyên nghiệp

---

### 4. 📊 Order Timeline & History ✅ COMPLETED

**Mô tả**: Theo dõi lịch sử thay đổi của đơn hàng

**Features**:

- [x] Status change log
  - Who changed (admin/employee name)
  - From status → To status
  - Timestamp
  - Reason/note (optional)
- [x] Visual timeline component
  - Vertical timeline in order detail
  - Icons & colors for each event type
  - User info & IP address display
- [x] Audit trail
  - Track all modifications (status, shipping info, order creation)
  - IP address logging
  - Immutable records (cannot be deleted)
- [x] Change types supported:
  - ORDER_CREATED: Tạo đơn hàng
  - STATUS_CHANGE: Thay đổi trạng thái
  - SHIPPING_UPDATE: Cập nhật giao hàng
  - PAYMENT_UPDATE: Cập nhật thanh toán
  - NOTE_ADDED: Thêm ghi chú
  - CANCELLED: Hủy đơn hàng
  - REFUNDED: Hoàn tiền

**Technical**:

```sql
-- New Table
CREATE TABLE order_history (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  order_id BIGINT NOT NULL,
  changed_by_user_id BIGINT,
  change_type VARCHAR(50), -- STATUS_CHANGE, SHIPPING_UPDATE, etc.
  old_value TEXT,
  new_value TEXT,
  note TEXT,
  ip_address VARCHAR(45),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id),
  FOREIGN KEY (changed_by_user_id) REFERENCES users(id)
);
```

```java
// Backend
@Entity OrderHistory
OrderHistoryRepository
OrderHistoryService.logChange(order, changeType, oldValue, newValue, note)

// Auto-log on every update (AOP or manual in service)
```

**Impact**: Truy xuất nguồn gốc, giải quyết tranh chấp

---

## 📈 II. MEDIUM PRIORITY (Cải thiện trải nghiệm)

### 5. 💬 Internal Notes & Comments

**Mô tả**: Admin có thể thêm ghi chú riêng cho đơn hàng

**Features**:

- [ ] Add note textarea in order detail
- [ ] List of notes (newest first)
- [ ] Each note shows:
  - Author name
  - Timestamp
  - Content
- [ ] Edit/delete own notes (within 5 minutes)
- [ ] @mention other admins (optional)

**Technical**:

```sql
CREATE TABLE order_notes (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  order_id BIGINT NOT NULL,
  user_id BIGINT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

**Impact**: Giao tiếp nội bộ, ghi nhận thông tin quan trọng

---

### 6. 📧 Customer Communication

**Mô tả**: Gửi email/SMS cho khách hàng từ admin panel

**Features**:

- [ ] Send order confirmation email (manual resend)
- [ ] Send status update notification
- [ ] Custom message to customer
- [ ] Email templates:
  - Order confirmed
  - Shipping notification
  - Delivered
  - Cancellation
- [ ] SMS notification (optional - integration required)

**Technical**:

```java
// Backend
EmailService.sendOrderNotification(order, template, customMessage)
SMSService.sendOrderSMS(orderCode, phone, message)

// Frontend
- "Gửi email xác nhận" button
- Modal with template preview & custom message field
```

**Impact**: Tăng tương tác, giảm số lượng khách hỏi về đơn hàng

---

### 7. 🔍 Advanced Search & Filters

**Mô tả**: Tìm kiếm và lọc nâng cao hơn

**Features**:

- [ ] Multiple status selection (checkbox group)
- [ ] Price range slider/input
- [ ] Payment method filter
- [ ] User account filter (có tài khoản / khách vãng lai)
- [ ] Product name search (find orders containing specific product)
- [ ] Save filter presets (custom views)
- [ ] Reset to default

**Technical**:

```typescript
// Frontend
- FilterDrawer component
- Persist filters to localStorage/URL params

// Backend
- Extend Specification with more predicates
- Add totalAmount range filter
- Add item product name filter (JOIN items → product)
```

**Impact**: Tìm kiếm đơn hàng nhanh và chính xác hơn

---

### 8. 📱 Order Status Automation

**Mô tả**: Tự động chuyển trạng thái theo điều kiện

**Features**:

- [ ] Auto-confirm after payment success (for online payment)
- [ ] Auto-cancel PENDING orders after 24h (configurable)
- [ ] Auto-complete DELIVERED orders after 7 days
- [ ] Scheduled job (cron) for automation
- [ ] Admin can enable/disable rules
- [ ] Notification before auto-action

**Technical**:

```java
// Backend
@Scheduled(cron = "0 0 */6 * * *") // Every 6 hours
public void autoProcessOrders() {
  // Find PENDING orders older than 24h
  // Send notification email
  // Auto-cancel after grace period
}

// Config table for rules
CREATE TABLE order_automation_rules (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  rule_type VARCHAR(50),
  enabled BOOLEAN DEFAULT TRUE,
  config JSON, -- e.g., {"timeout_hours": 24}
  created_at TIMESTAMP
);
```

**Impact**: Giảm tải công việc thủ công, tăng hiệu quả

---

## 📊 III. LOW PRIORITY (Nice to have)

### 9. 📈 Analytics Dashboard

**Mô tả**: Biểu đồ và phân tích dữ liệu đơn hàng

**Features**:

- [ ] Revenue chart (line/bar) - 7 days, 30 days, 12 months
- [ ] Order status distribution (pie chart)
- [ ] Top selling products (bar chart)
- [ ] Order count by hour/day (heatmap)
- [ ] Average order value (AOV)
- [ ] Customer retention rate
- [ ] Export analytics report (PDF)

**Technical**:

```typescript
// Frontend
- Chart.js / Recharts / Apache ECharts
- Dashboard page: /admin/analytics

// Backend
GET /orders/admin/analytics/revenue?period=7d|30d|12m
GET /orders/admin/analytics/top-products?limit=10
GET /orders/admin/analytics/order-distribution
```

**Impact**: Ra quyết định kinh doanh dựa trên dữ liệu

---

### 10. 🔔 Real-time Notifications

**Mô tả**: Thông báo tức thì khi có đơn hàng mới hoặc thay đổi

**Features**:

- [ ] WebSocket connection
- [ ] Toast notification for:
  - New order created
  - Payment received
  - Order status changed by another admin
- [ ] Notification bell icon with count
- [ ] Notification history panel
- [ ] Mark as read/unread
- [ ] Sound/desktop notification (opt-in)

**Technical**:

```java
// Backend
- Spring WebSocket + STOMP
- Broadcast to all connected admins

@MessageMapping("/orders/new")
@SendTo("/topic/orders")
public OrderNotification notifyNewOrder(Order order) {
  return new OrderNotification(order);
}
```

```typescript
// Frontend
- SockJS + Stomp client
- Subscribe to /topic/orders
- Update UI on message received
```

**Impact**: Admin không bỏ lỡ đơn hàng, phản hồi nhanh hơn

---

### 11. 🏷️ Order Tags & Labels

**Mô tả**: Gắn nhãn để phân loại đơn hàng

**Features**:

- [ ] Create custom tags (VIP, Urgent, Fraudulent, etc.)
- [ ] Assign multiple tags to order
- [ ] Filter by tags
- [ ] Tag color coding
- [ ] Tag statistics (count orders per tag)

**Technical**:

```sql
CREATE TABLE order_tags (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(50) UNIQUE NOT NULL,
  color VARCHAR(20),
  created_at TIMESTAMP
);

CREATE TABLE order_tag_mapping (
  order_id BIGINT,
  tag_id BIGINT,
  PRIMARY KEY (order_id, tag_id)
);
```

**Impact**: Tổ chức đơn hàng theo ngữ cảnh riêng

---

### 12. 🔄 Order Refund Flow

**Mô tả**: Quy trình hoàn tiền đầy đủ

**Features**:

- [ ] Refund request from customer (frontend)
- [ ] Admin review refund request
- [ ] Partial refund support (return some items)
- [ ] Refund amount calculation
- [ ] Refund to original payment method
- [ ] Refund status tracking
- [ ] Generate refund invoice

**Technical**:

```sql
CREATE TABLE refund_requests (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  order_id BIGINT NOT NULL,
  amount DECIMAL(10,2),
  reason TEXT,
  status VARCHAR(20), -- PENDING, APPROVED, REJECTED, COMPLETED
  admin_note TEXT,
  processed_by BIGINT,
  created_at TIMESTAMP,
  processed_at TIMESTAMP
);
```

**Impact**: Xử lý hoàn tiền chuyên nghiệp, tăng niềm tin

---

### 13. 📦 Inventory Integration

**Mô tả**: Liên kết với hệ thống kho

**Features**:

- [ ] Check stock before order confirmation
- [ ] Auto-deduct stock on order confirmed
- [ ] Restore stock on order cancelled
- [ ] Low stock warning in order detail
- [ ] Suggest alternative products if out of stock
- [ ] Stock reservation for pending orders (time-limited)

**Technical**:

```java
// In OrderService
@Transactional
public Order confirmOrder(String orderCode) {
  Order order = findOrder(orderCode);
  for (OrderItem item : order.getItems()) {
    inventoryService.deductStock(item.getVariant(), item.getQuantity());
  }
  order.setStatus(CONFIRMED);
  return orderRepository.save(order);
}
```

**Impact**: Đồng bộ kho hàng, tránh bán vượt tồn kho

---

## 🛠️ IV. TECHNICAL IMPROVEMENTS

### 14. ⚡ Performance Optimization

- [ ] Implement Redis caching for order statistics
- [ ] Lazy load order items images
- [ ] Virtual scrolling for long order lists
- [ ] Debounce search input
- [ ] Index database columns (orderCode, status, createdAt, customerEmail)

---

### 15. 🧪 Testing

- [ ] Unit tests for OrderService methods
- [ ] Integration tests for REST APIs
- [ ] E2E tests with Playwright/Cypress
- [ ] Load testing (simulate 1000 concurrent admins)

---

### 16. 📱 Mobile Responsive

- [ ] Optimize for tablet (iPad)
- [ ] Touch-friendly UI
- [ ] Swipe actions (swipe left to cancel order)
- [ ] Progressive Web App (PWA) support

---

## 📝 V. DOCUMENTATION

### 17. 📖 Admin User Guide

- [ ] How to process orders (step-by-step)
- [ ] FAQ section
- [ ] Video tutorials
- [ ] Keyboard shortcuts guide

---

### 18. 🔐 Security Enhancements

- [ ] Two-factor authentication for admin
- [ ] IP whitelist for admin access
- [ ] Session timeout (auto logout after 30min idle)
- [ ] Action confirmation for critical operations (cancel, refund)
- [ ] Rate limiting on API endpoints

---

## 🎯 PRIORITIZATION MATRIX

| Feature                 | Impact | Effort    | Priority |
| ----------------------- | ------ | --------- | -------- |
| Bulk Actions            | High   | Medium    | **HIGH** |
| Date Filters            | High   | Low       | **HIGH** |
| Export/Print            | High   | Medium    | **HIGH** |
| Order Timeline          | High   | High      | **HIGH** |
| Internal Notes          | Medium | Low       | MEDIUM   |
| Email Customer          | Medium | Medium    | MEDIUM   |
| Advanced Search         | Medium | Medium    | MEDIUM   |
| Status Automation       | Medium | High      | MEDIUM   |
| Analytics Dashboard     | Low    | High      | LOW      |
| Real-time Notifications | Low    | High      | LOW      |
| Order Tags              | Low    | Medium    | LOW      |
| Refund Flow             | Low    | High      | LOW      |
| Inventory Integration   | High   | Very High | LOW\*    |

\*Low priority vì phụ thuộc vào hệ thống kho chưa có

---

## 📅 IMPLEMENTATION ROADMAP

### Phase 1 (Sprint 1-2) - Essential Features

- [ ] Date range filters
- [ ] Export to CSV/Excel
- [ ] Print invoice
- [ ] Order timeline & history

### Phase 2 (Sprint 3-4) - UX Improvements

- [ ] Bulk actions
- [ ] Internal notes
- [ ] Advanced search
- [ ] Customer email notifications

### Phase 3 (Sprint 5-6) - Automation & Analytics

- [ ] Status automation rules
- [ ] Analytics dashboard
- [ ] Real-time notifications

### Phase 4 (Future) - Advanced Features

- [ ] Order tags
- [ ] Refund flow
- [ ] Inventory integration
- [ ] Mobile app

---

## 💡 NOTES

- Mỗi feature nên có **user story** và **acceptance criteria** rõ ràng trước khi implement
- Ưu tiên **feedback từ admin users** thực tế
- **Mobile-first approach** cho các tính năng mới
- **Backward compatibility** khi thêm API mới
- **Feature flags** để test production dần dần

---

**Last Updated**: 10/12/2025  
**Next Review**: Sau khi Phase 1 hoàn thành
