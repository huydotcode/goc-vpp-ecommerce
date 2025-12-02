# 📍 Tổng Quan Routes & Pages (Client)

Tài liệu này tổng hợp tất cả các **route** và **component page** hiện có trên frontend React.

---

## 🧑‍💻 Cấu trúc layout tổng quát

- `UserLayout` (`client/src/components/layout/user/UserLayout.tsx`)

  - Bọc các route phía client (guest + customer).
  - Dùng `UserHeader` + `Layout.Content`.
  - Được bọc bởi `ProtectedRoute allowGuest={true}`.

- `UserHeader` (`client/src/components/layout/user/UserHeader.tsx`)

  - Logo desktop (`/images/logo.png`) + logo mobile (`/images/logo-icon.png`).
  - Dropdown tài khoản (login/register hoặc profile/logout).
  - Nút "Giỏ hàng" khi đã đăng nhập.

- `AdminLayout` (`client/src/components/layout/admin/AdminLayout.tsx`)
  - Bọc toàn bộ khu vực admin.
  - Được bọc bởi `ProtectedRoute allowedRoles={["ADMIN", "EMPLOYEE"]}`.

---

## 🌐 Public / Guest Routes

### `/`

- **Component**: `Home.tsx`
- **Layout**: `UserLayout` + `UserHeader`
- **Mô tả**: Trang chủ hiển thị danh sách sản phẩm (public, guest truy cập được).

### `/login`

- **Component**: `Login.tsx`
- **Mô tả**:
  - Form đăng nhập (username/password).
  - Nút đăng nhập với Google (OAuth).

### `/register`

- **Component**: `Register.tsx`
- **Trạng thái**: Placeholder.
- **Nội dung hiện tại**: Hiển thị tiêu đề "Đăng ký tài khoản" và mô tả trang đăng ký đang được phát triển.

### `/google/callback`

- **Component**: `GoogleCallback.tsx`
- **Mô tả**:
  - Nhận `accessToken` từ query/callback.
  - Lưu token vào `localStorage`.
  - Điều hướng người dùng sau khi login bằng Google.

### Lỗi và trạng thái HTTP

#### `/401`

- **Component**: `Unauthorized.tsx`
- **Mô tả**: Trang báo lỗi chưa đăng nhập / phiên hết hạn.

#### `/403`

- **Component**: `Forbidden.tsx`
- **Mô tả**:
  - Trang báo lỗi không có quyền truy cập.
  - Nút "Về trang chủ" điều hướng tùy theo role (user → `/`, admin/employee → `/admin`).

#### `/404` và `*`

- **Component**: `NotFound.tsx`
- **Mô tả**:
  - Trang báo không tìm thấy.
  - Nút "Về trang chủ" tương tự `Forbidden.tsx`.

---

## 👥 User Routes (bên trong `/` với `UserLayout`)

Tất cả các route con dưới đây đều được render trong `UserLayout` và `UserHeader`.

### `/` (index)

- **Component**: `Home.tsx`
- **Mô tả**:
  - Hiển thị danh sách sản phẩm.
  - Tìm kiếm theo tên, lọc theo danh mục.
  - Hiển thị banner khuyến mãi (nếu có).

### `/products/:id`

- **Component**: `ProductDetail.tsx`
- **Trạng thái**: Placeholder.
- **Mô tả**:
  - Nhận `id` sản phẩm từ URL.
  - Hiện thông báo "Trang chi tiết sản phẩm đang được phát triển" + mã sản phẩm.
  - Sau này sẽ hiển thị mô tả, hình ảnh, giá, tồn kho, khuyến mãi liên quan, v.v.

### `/cart`

- **Component**: `Cart.tsx`
- **Trạng thái**: Placeholder.
- **Mô tả**:
  - Hiện thông báo "Chức năng giỏ hàng (thêm, sửa, xóa sản phẩm) đang được phát triển".
  - Sau này sẽ hiển thị danh sách sản phẩm trong giỏ, tổng tiền, nút tới `/checkout`.

### `/checkout`

- **Bọc bởi**: `ProtectedRoute` (yêu cầu người dùng đã đăng nhập).
- **Component**: `Checkout.tsx`
- **Trạng thái**: Placeholder.
- **Mô tả**:
  - Hiện tiêu đề "Thanh toán".
  - Mô tả: trang thanh toán đang được phát triển; sẽ là nơi xác nhận đơn hàng, nhập địa chỉ, phương thức thanh toán.

### `/orders`

- **Bọc bởi**: `ProtectedRoute` (yêu cầu đăng nhập).
- **Component**: `Orders.tsx`
- **Trạng thái**: Placeholder.
- **Mô tả**:
  - Hiện tiêu đề "Đơn hàng của tôi".
  - Mô tả: trang lịch sử đơn hàng đang được phát triển.
  - Sau này sẽ hiển thị danh sách đơn hàng của user, cho phép xem chi tiết từng đơn.

---

## 🛡️ Admin Routes (bên trong `/admin` với `AdminLayout`)

Tất cả các route con dưới đây đều được bảo vệ bởi:

```tsx
<ProtectedRoute allowedRoles={["ADMIN", "EMPLOYEE"]}>
  <AdminLayout />
</ProtectedRoute>
```

### `/admin` (index)

- **Component**: `Admin.tsx`
- **Mô tả**:
  - Trang dashboard/tổng quan admin (hiện tại chủ yếu dùng để test auth/refresh).

### `/admin/users`

- **Component**: `components/admin/user/main-protable.tsx` (ProTable)
- **Mô tả**:
  - Quản lý tài khoản người dùng:
    - Danh sách user.
    - Tạo mới, sửa, xem chi tiết, import/export.
    - Lọc theo role, trạng thái, email, username, v.v.

### `/admin/categories`

- **Component**: `components/admin/category/main-protable.tsx`
- **Mô tả**:
  - Quản lý danh mục sản phẩm:
    - Danh sách, tạo mới, sửa, xóa (với ràng buộc).

### `/admin/products`

- **Component**: `components/admin/product/main-protable.tsx`
- **Mô tả**:
  - Quản lý sản phẩm:
    - Danh sách, tạo mới, sửa, xóa.
    - Import/Export Excel.
    - Quản lý hình ảnh sản phẩm.

### `/admin/promotions`

- **Component**: `components/admin/promotion/main-protable.tsx`
- **Mô tả**:
  - Quản lý chương trình khuyến mãi:
    - Danh sách khuyến mãi.
    - Tạo/sửa chi tiết điều kiện, quà tặng.

### `/admin/orders`

- **Component**: `pages/AdminOrders.tsx`
- **Trạng thái**: Placeholder.
- **Mô tả**:
  - Sẽ là trang danh sách đơn hàng:
    - Xem, lọc, sắp xếp đơn hàng.
    - Cập nhật trạng thái (đang xử lý, đã giao, đã hủy…).

### `/admin/orders/:id`

- **Component**: `pages/AdminOrderDetail.tsx`
- **Trạng thái**: Placeholder.
- **Mô tả**:
  - Hiển thị "Chi tiết đơn hàng đang được phát triển" + mã đơn hàng.
  - Sau này sẽ quản lý chi tiết từng đơn, cập nhật số lượng, trạng thái, ghi chú, v.v.

### `/admin/permissions`

- **Component**: `pages/AdminPermissions.tsx`
- **Trạng thái**: Placeholder.
- **Mô tả**:
  - Sẽ dùng để cấu hình phân quyền, vai trò (RBAC) cho user/nhân viên.

### `/admin/profile`

- **Component**: `pages/AdminProfile.tsx`
- **Trạng thái**: Placeholder.
- **Mô tả**:
  - Khu vực cấu hình thông tin tài khoản admin (tên, email, avatar, v.v.).

---

## 🔐 Bảo vệ route (`ProtectedRoute`)

- **File**: `client/src/components/ProtectedRoute.tsx`
- **Props chính**:
  - `allowedRoles?: ("ADMIN" | "EMPLOYEE" | "USER")[]`
  - `requireRole?: "ADMIN" | "EMPLOYEE" | "USER" | ("ADMIN" | "EMPLOYEE" | "USER")[]`
  - `requireAdmin?: boolean` (ADMIN hoặc EMPLOYEE)
  - `allowGuest?: boolean` (cho guest truy cập, nhưng vẫn kiểm role nếu đã login)

### Cách sử dụng hiện tại

- User routes:

```tsx
<Route
  path="/"
  element={
    <ProtectedRoute allowGuest={true}>
      <UserLayout />
    </ProtectedRoute>
  }
>
  <Route index element={<Home />} />
  <Route path="products/:id" element={<ProductDetailPage />} />
  <Route path="cart" element={<CartPage />} />
  <Route
    path="checkout"
    element={
      <ProtectedRoute>
        <CheckoutPage />
      </ProtectedRoute>
    }
  />
  <Route
    path="orders"
    element={
      <ProtectedRoute>
        <OrdersPage />
      </ProtectedRoute>
    }
  />
</Route>
```

- Admin routes:

```tsx
<Route
  path="/admin"
  element={
    <ProtectedRoute allowedRoles={["ADMIN", "EMPLOYEE"]}>
      <AdminLayout />
    </ProtectedRoute>
  }
>
  {/* ...admin child routes... */}
</Route>
```

---

## ✅ Tóm tắt trạng thái page

- **Đã triển khai UI chức năng chính**:

  - `Home`, `Login`, `Admin` + các bảng quản lý (Users/Categories/Products/Promotions).

- **Đã có page (placeholder, cần implement logic sau)**:

  - `Register`
  - `ProductDetail`
  - `Cart`
  - `Checkout`
  - `Orders`
  - `AdminOrders`
  - `AdminOrderDetail`
  - `AdminPermissions`
  - `AdminProfile`

- **Đầy đủ routes lỗi & auth**:
  - `401`, `403`, `404`, `*`, `google/callback`.

---

**Cập nhật lần cuối**: 2024-12-19
