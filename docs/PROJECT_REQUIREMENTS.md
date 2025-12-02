# 📋 Phân Tích Yêu Cầu Bài Tập Lớn

## 📌 Tổng Quan

Website thương mại điện tử với 3 loại người dùng:

1. **Guest** - Người dùng không có tài khoản
2. **Customer** - Người dùng có tài khoản (đã đăng ký)
3. **Admin** - Người quản trị hệ thống

---

## 👤 1. Người Dùng Không Có Tài Khoản (Guest)

### 1.1 Xem Danh Sách Sản Phẩm

- **Mô tả**: Hiển thị danh sách sản phẩm từ CSDL
- **Yêu cầu**:
  - Lấy dữ liệu từ backend API
  - Hiển thị thông tin cơ bản: tên, giá, hình ảnh
  - Có thể phân trang, tìm kiếm, lọc theo danh mục
- **Route**: `/home` (public, không cần đăng nhập)
- **Trạng thái**: ✅ Đã có (Home.tsx)

### 1.2 Xem Chi Tiết Sản Phẩm

- **Mô tả**: Xem thông tin chi tiết của từng sản phẩm
- **Yêu cầu**:
  - Hiển thị đầy đủ thông tin: mô tả, giá, hình ảnh, số lượng tồn kho
  - Có thể xem từ danh sách sản phẩm
- **Route**: `/home/products/:id` (public)
- **Trạng thái**: ❌ Chưa có

### 1.3 Thêm Sản Phẩm Vào Giỏ Hàng

- **Mô tả**: Chọn mua sản phẩm và thêm vào giỏ hàng
- **Yêu cầu**:
  - Có thể thêm từ trang danh sách hoặc trang chi tiết
  - Lưu thông tin trong Session (không cập nhật CSDL)
  - Hiển thị số lượng sản phẩm trong giỏ hàng
- **Route**: Action từ `/home` hoặc `/home/products/:id`
- **Trạng thái**: ❌ Chưa có

### 1.4 Xem Giỏ Hàng

- **Mô tả**: Xem danh sách sản phẩm đã chọn mua
- **Yêu cầu**:
  - Hiển thị danh sách sản phẩm trong giỏ hàng
  - Thông tin: tên, giá, số lượng, tổng tiền
  - Dữ liệu lưu trong Session
- **Route**: `/home/cart` (public)
- **Trạng thái**: ❌ Chưa có

### 1.5 Chỉnh Sửa Giỏ Hàng

- **Mô tả**: Cập nhật số lượng hoặc xóa sản phẩm khỏi giỏ hàng
- **Yêu cầu**:
  - Có thể tăng/giảm số lượng
  - Nếu số lượng = 0 → xóa sản phẩm khỏi giỏ hàng
  - Cập nhật tổng tiền tự động
- **Route**: Action trong `/home/cart`
- **Trạng thái**: ❌ Chưa có

### 1.6 Đăng Ký Tài Khoản

- **Mô tả**: Tạo tài khoản mới cho website
- **Yêu cầu**:
  - Form đăng ký với các thông tin cần thiết
  - Email không được trùng với tài khoản khác
  - Sau khi đăng ký thành công:
    - Lưu vào CSDL
    - Gửi email xác nhận
    - Hiển thị thông báo thành công
- **Route**: `/register` (public)
- **Trạng thái**: ❌ Chưa có

---

## 👥 2. Người Dùng Có Tài Khoản (Customer)

### 2.1 Kế Thừa Tất Cả Chức Năng Của Guest

- ✅ Xem danh sách sản phẩm
- ✅ Xem chi tiết sản phẩm
- ✅ Thêm vào giỏ hàng
- ✅ Xem giỏ hàng
- ✅ Chỉnh sửa giỏ hàng

### 2.2 Thanh Toán (Checkout)

- **Mô tả**: Xử lý đặt hàng khi đã đăng nhập
- **Yêu cầu**:
  - Chỉ thực hiện được khi:
    - Giỏ hàng đã có sản phẩm
    - Người dùng đã đăng nhập thành công
  - Sau khi thanh toán thành công:
    - Cập nhật thông tin vào CSDL (tạo đơn hàng)
    - Gửi email xác nhận đặt hàng
    - Hiển thị thông báo thành công
    - Xóa Session giỏ hàng (set về null)
- **Route**: `/home/checkout` (protected, yêu cầu đăng nhập)
- **Trạng thái**: ❌ Chưa có

### 2.3 Xem Lịch Sử Đơn Hàng

- **Mô tả**: Xem các đơn hàng đã đặt
- **Yêu cầu**:
  - Hiển thị danh sách đơn hàng của user hiện tại
  - Xem chi tiết từng đơn hàng
- **Route**: `/home/orders` (protected)
- **Trạng thái**: ❌ Chưa có

---

## 🔐 3. Người Quản Trị Hệ Thống (Admin)

### 3.1 Kế Thừa Tất Cả Chức Năng Của Customer

- ✅ Tất cả chức năng của Guest
- ✅ Thanh toán
- ✅ Xem lịch sử đơn hàng

### 3.2 Tìm Kiếm Thông Tin (Backend)

- **Mô tả**: Tìm kiếm thông tin về:
  - Sản phẩm / Loại sản phẩm
  - Tài khoản người dùng
  - Đơn đặt hàng
- **Yêu cầu**: API hỗ trợ tìm kiếm với nhiều tiêu chí
- **Trạng thái**: ✅ Đã có (các API đã có search/filter)

### 3.3 Quản Lý Sản Phẩm / Loại Sản Phẩm

#### 3.3.1 Xem Danh Sách

- **Mô tả**: Xem danh sách sản phẩm/loại sản phẩm
- **Route**: `/admin/products`, `/admin/categories`
- **Trạng thái**: ✅ Đã có

#### 3.3.2 Xem Chi Tiết

- **Mô tả**: Xem chi tiết từng sản phẩm/loại sản phẩm
- **Route**: Modal hoặc detail page
- **Trạng thái**: ✅ Đã có

#### 3.3.3 Xóa Sản Phẩm/Loại Sản Phẩm

- **Mô tả**: Xóa sản phẩm/loại sản phẩm với điều kiện
- **Ràng buộc**:
  - Sản phẩm: Chỉ xóa được nếu chưa có trong đơn hàng nào
  - Loại sản phẩm: Chỉ xóa được nếu chưa có sản phẩm nào
- **Route**: Action trong danh sách
- **Trạng thái**: ⚠️ Cần kiểm tra ràng buộc

#### 3.3.4 Thêm Mới

- **Mô tả**: Thêm sản phẩm/loại sản phẩm mới
- **Route**: Modal create
- **Trạng thái**: ✅ Đã có

#### 3.3.5 Cập Nhật

- **Mô tả**: Cập nhật thông tin sản phẩm/loại sản phẩm
- **Route**: Modal update
- **Trạng thái**: ✅ Đã có

### 3.4 Quản Lý Tài Khoản Người Dùng

#### 3.4.1 Xem Danh Sách

- **Mô tả**: Xem danh sách tài khoản người dùng đã đăng ký
- **Route**: `/admin/users`
- **Trạng thái**: ✅ Đã có

#### 3.4.2 Xem Chi Tiết

- **Mô tả**: Xem chi tiết từng tài khoản
- **Yêu cầu**: Không hiển thị password
- **Route**: Modal detail
- **Trạng thái**: ✅ Đã có

#### 3.4.3 Xóa Tài Khoản

- **Mô tả**: Xóa tài khoản người dùng
- **Ràng buộc**: Chỉ xóa được nếu người dùng chưa đặt hàng online lần nào
- **Route**: Action trong danh sách
- **Trạng thái**: ⚠️ Cần kiểm tra ràng buộc

#### 3.4.4 Cập Nhật

- **Mô tả**: Cập nhật thông tin tài khoản người dùng
- **Route**: Modal update
- **Trạng thái**: ✅ Đã có

### 3.5 Quản Lý Đơn Hàng Trực Tuyến

#### 3.5.1 Xem Danh Sách

- **Mô tả**: Xem danh sách các đơn hàng
- **Yêu cầu**: Sắp xếp theo ngày mua (mới nhất trước)
- **Route**: `/admin/orders`
- **Trạng thái**: ❌ Chưa có

#### 3.5.2 Xem Chi Tiết

- **Mô tả**: Xem chi tiết đơn hàng
- **Yêu cầu**: Hiển thị thông tin đầy đủ: sản phẩm, số lượng, giá, tổng tiền
- **Route**: Modal hoặc detail page
- **Trạng thái**: ❌ Chưa có

#### 3.5.3 Cập Nhật Số Lượng

- **Mô tả**: Cập nhật số lượng mặt hàng trong đơn hàng
- **Route**: Action trong chi tiết đơn hàng
- **Trạng thái**: ❌ Chưa có

---

## 🔒 4. Phân Quyền Truy Cập

### 4.1 Public Routes (Guest có thể truy cập)

- `/home` - Trang chủ, danh sách sản phẩm
- `/home/products/:id` - Chi tiết sản phẩm
- `/home/cart` - Giỏ hàng
- `/login` - Đăng nhập
- `/register` - Đăng ký

### 4.2 Protected Routes (Yêu cầu đăng nhập)

- `/home/checkout` - Thanh toán (Customer)
- `/home/orders` - Lịch sử đơn hàng (Customer)
- `/admin/*` - Tất cả trang admin (Admin/Employee)

### 4.3 Role-Based Access

- **Guest**: Chỉ xem và thêm vào giỏ hàng
- **Customer (USER)**: Tất cả chức năng của Guest + Thanh toán
- **Admin/Employee**: Tất cả chức năng của Customer + Quản lý hệ thống

---

## 📝 5. Ràng Buộc Dữ Liệu

### 5.1 Ràng Buộc Khi Xóa

- **Sản phẩm**: Chỉ xóa được nếu chưa có trong đơn hàng nào
- **Loại sản phẩm**: Chỉ xóa được nếu chưa có sản phẩm nào
- **Tài khoản người dùng**: Chỉ xóa được nếu chưa đặt hàng online lần nào

### 5.2 Validation

- **Client-side**: Sử dụng JavaScript/TypeScript hoặc form validation
- **Server-side**: Sử dụng Model validation (Spring Boot)
- **Không dùng**: Functions/Check constraints/Stored Procedures trong CSDL

### 5.3 Email Validation

- Email không được trùng khi đăng ký
- Gửi email xác nhận sau khi đăng ký
- Gửi email xác nhận sau khi đặt hàng thành công

---

## 🗄️ 6. Quản Lý Session

### 6.1 Giỏ Hàng

- **Lưu trữ**: Session (không lưu vào CSDL cho Guest)
- **Cấu trúc**:
  ```typescript
  {
    items: [
      {
        productId: number,
        productName: string,
        price: number,
        quantity: number,
        imageUrl: string
      }
    ],
    total: number
  }
  ```
- **Xóa**: Sau khi thanh toán thành công → set Session về null

### 6.2 Authentication

- **JWT Token**: Lưu trong localStorage
- **Refresh Token**: Lưu trong HTTP-only cookie
- **User Info**: Lưu trong Context/State

---

## 📊 7. Tổng Kết Trạng Thái

### 7.1 Đã Hoàn Thành ✅

- [x] Authentication & Authorization
- [x] User Management (Admin)
- [x] Category Management (Admin)
- [x] Product Management (Admin)
- [x] Promotion Management (Admin)
- [x] File Upload (Cloudinary)
- [x] Xem danh sách sản phẩm (Guest)

### 7.2 Chưa Hoàn Thành ❌

- [ ] Xem chi tiết sản phẩm (Guest)
- [ ] Giỏ hàng (thêm, xem, chỉnh sửa)
- [ ] Đăng ký tài khoản
- [ ] Thanh toán (Checkout)
- [ ] Xem lịch sử đơn hàng (Customer)
- [ ] Quản lý đơn hàng (Admin)
- [ ] Public routes cho Guest

### 7.3 Cần Kiểm Tra ⚠️

- [ ] Ràng buộc xóa sản phẩm (chưa có trong đơn hàng)
- [ ] Ràng buộc xóa loại sản phẩm (chưa có sản phẩm)
- [ ] Ràng buộc xóa tài khoản (chưa đặt hàng)
- [ ] Email service (gửi email xác nhận)

---

## 🎯 8. Ưu Tiên Triển Khai

### Phase 1: Guest Features (Ưu tiên cao)

1. ✅ Xem danh sách sản phẩm (đã có)
2. ❌ Xem chi tiết sản phẩm
3. ❌ Giỏ hàng (thêm, xem, chỉnh sửa)
4. ❌ Đăng ký tài khoản
5. ❌ Cấu hình public routes

### Phase 2: Customer Features

1. ❌ Thanh toán (Checkout)
2. ❌ Xem lịch sử đơn hàng
3. ❌ API đơn hàng (Backend)

### Phase 3: Admin Features

1. ❌ Quản lý đơn hàng (xem danh sách, chi tiết, cập nhật)
2. ⚠️ Kiểm tra và fix ràng buộc xóa dữ liệu

### Phase 4: Email & Notifications

1. ❌ Email service (gửi email xác nhận đăng ký)
2. ❌ Email service (gửi email xác nhận đặt hàng)

---

## 📌 9. Lưu Ý Kỹ Thuật

### 9.1 Session Management

- Sử dụng `sessionStorage` hoặc `localStorage` cho giỏ hàng của Guest
- Chuyển sang lưu trong CSDL khi user đăng nhập

### 9.2 Route Protection

- Cần cập nhật `ProtectedRoute` để hỗ trợ `allowGuest={true}`
- Cập nhật `RoleBasedRedirect` để Guest có thể truy cập `/home`

### 9.3 API Endpoints Cần Thiết

- `GET /api/products/:id` - Chi tiết sản phẩm
- `POST /api/cart` - Thêm vào giỏ hàng (Session)
- `GET /api/cart` - Lấy giỏ hàng (Session)
- `PUT /api/cart/:id` - Cập nhật số lượng
- `DELETE /api/cart/:id` - Xóa sản phẩm khỏi giỏ hàng
- `POST /api/register` - Đăng ký tài khoản
- `POST /api/orders` - Tạo đơn hàng (Checkout)
- `GET /api/orders` - Lấy danh sách đơn hàng (Customer)
- `GET /api/orders/:id` - Chi tiết đơn hàng
- `GET /api/admin/orders` - Danh sách đơn hàng (Admin)
- `PUT /api/admin/orders/:id/items/:itemId` - Cập nhật số lượng trong đơn hàng

---

## 📚 10. Tài Liệu Tham Khảo

- [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md) - Kế hoạch triển khai chi tiết
- [REFACTORING_REPORT.md](./REFACTORING_REPORT.md) - Báo cáo refactoring
- [UPLOAD_IMPROVEMENTS.md](./UPLOAD_IMPROVEMENTS.md) - Cải tiến upload

---

**Cập nhật lần cuối**: 2024-12-19
