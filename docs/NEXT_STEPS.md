# Kế hoạch bước tiếp theo (giỏ hàng → checkout → đơn hàng)

Tài liệu này mô tả các bước ưu tiên để hoàn thiện luồng giỏ hàng, thanh toán và đơn hàng, bám theo `FUNCTIONAL_REQUIREMENTS.md` và hiện trạng code.

## 1. Frontend

- Cart UI: kết nối API giỏ hàng hiện có; hiển thị items, tăng/giảm/xóa, tổng tiền; state qua React Query; chặn thao tác khi tồn kho không đủ.
- Checkout page: lấy giỏ hàng, form thông tin nhận hàng (tên, phone, email, địa chỉ), chọn phương thức thanh toán (COD / VnPay / PayOS), hiển thị tóm tắt phí (subtotal, giảm giá, phí ship, tổng).
- Orders page: gọi API thật `/orders/my` (cần BE), hiển thị orderCode, trạng thái giao hàng/thanh toán, tổng tiền, createdAt; thêm trang chi tiết đơn hàng.
- Service/API layer: thêm `cart.api.ts`, `order.api.ts`, hooks `useCart`, `useCheckout`, `useOrders`; tái sử dụng `handleApiError`.
- UX bảo vệ: nếu chưa đăng nhập, redirect login khi vào cart/checkout; lock nút đặt hàng khi đang submit; thông báo lỗi rõ ràng.

## 2. Backend

- Mở rộng OrderService:
  - Nhận giỏ hàng user, tạo Order + OrderItems từ Cart; kiểm tồn kho và trừ stock.
  - Tính tiền: subtotal từ cart, giảm giá (promotion), phí vận chuyển, totalAmount; lưu lại breakdown.
  - Lưu địa chỉ/phone/email nhận hàng, ghi chú, payment method.
  - Sau checkout thành công: clear hoặc delete cart (`deleteCartAfterCheckout`).
- API đơn hàng:
  - `POST /orders/checkout` (yêu cầu login): tạo đơn từ cart + thông tin giao hàng + payment method.
  - `GET /orders/my` (paginate): trả về đơn của user kèm items tóm tắt.
  - `GET /orders/{orderCode}`: chi tiết đơn (items, status, payment, shipping info).
  - `PUT /orders/{orderCode}/status` (admin/employee): cập nhật trạng thái giao hàng/thanh toán; audit.
- Payment integration:
  - Liên kết PaymentController/PayOS/VnPay với Order: lưu `paymentLinkId`, cập nhật status PAID/CANCELLED qua callback/IPN.
  - Redirect URL FE nhận param, gọi BE confirm, cập nhật Order.

## 3. Promotion & phí vận chuyển

- CartResponseDTO: bổ sung trường `subtotal`, `discount`, `shippingFee`, `grandTotal`, `appliedPromotion`.
- Service tính phí:
  - Promotion: áp dụng theo điều kiện (giá trị tối thiểu/số lượng, phần trăm hoặc số tiền).
  - Shipping: cấu hình phí cố định + miễn phí khi đạt ngưỡng; chuẩn bị hook tính theo địa chỉ nếu cần sau này.
- FE hiển thị breakdown trên Cart/Checkout; cho phép nhập mã khuyến mãi (BE validate).

## 4. Kiểm thử và an toàn

- Unit test CartService/OrderService: kiểm tồn kho, tính tiền, trừ stock, soft delete cart.
- Integration test API `/cart`, `/orders/checkout`, `/orders/my`.
- Bảo mật: kiểm tra quyền sở hữu cart/order; validate input (quantity > 0, địa chỉ, phone/email).
- Observability: log/tối thiểu audit createdBy/updatedBy cho Order/OrderItem; thêm error handling IPN/return.

## 5. Triển khai từng bước (gợi ý thứ tự)

1. BE: mở rộng OrderService + checkout API từ cart, clear cart, update stock.
2. FE: hook + UI cart/checkout gọi API mới, render breakdown.
3. BE: API `/orders/my` + chi tiết; FE: Orders page dùng API thật.
4. Payment: gắn Order với VnPay/PayOS, cập nhật status qua callback.
5. Promotion/ship: thêm tính toán và hiển thị trên FE.
6. Bổ sung test và tài liệu (update `ROUTES_OVERVIEW`, `IMPLEMENTATION_PLAN`).
