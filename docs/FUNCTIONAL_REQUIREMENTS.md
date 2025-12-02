# 📋 Yêu Cầu Chức Năng Trang Web

## 📌 Tổng Quan

Tài liệu này mô tả chi tiết các chức năng của hệ thống thương mại điện tử, được phân loại theo từng nhóm chức năng.

---

## 🧮 1. Chức Năng Tính Toán

### 1.1 Tính Tổng Tiền Sản Phẩm Trong Giỏ Hàng
- **Mô tả**: Tính tổng giá trị các sản phẩm trong giỏ hàng
- **Công thức**: 
  ```
  Tổng tiền = Σ (Giá sản phẩm × Số lượng)
  ```
- **Yêu cầu**:
  - Tính toán real-time khi thêm/xóa/sửa số lượng
  - Hiển thị tổng tiền trong giỏ hàng
  - Cập nhật tự động khi giá sản phẩm thay đổi
- **Vị trí**: Component `Cart`, `CartSummary`
- **Trạng thái**: ❌ Chưa có

### 1.2 Tính Tổng Đơn Hàng Sau Khi Áp Dụng Khuyến Mãi
- **Mô tả**: Tính tổng tiền đơn hàng sau khi áp dụng mã giảm giá/khuyến mãi
- **Công thức**:
  ```
  Tổng đơn hàng = Tổng tiền sản phẩm - Giảm giá khuyến mãi
  ```
- **Yêu cầu**:
  - Áp dụng khuyến mãi theo điều kiện (số lượng, giá trị đơn hàng)
  - Hỗ trợ giảm giá theo % hoặc số tiền cố định
  - Hiển thị số tiền được giảm
  - Tính toán phí vận chuyển sau khi áp dụng khuyến mãi
- **Vị trí**: Component `Checkout`, `OrderSummary`
- **Trạng thái**: ❌ Chưa có

### 1.3 Tính Phí Vận Chuyển
- **Mô tả**: Tính phí vận chuyển dựa trên địa chỉ giao hàng và phương thức vận chuyển
- **Yêu cầu**:
  - Tính phí theo khoảng cách/địa chỉ
  - Tính phí theo trọng lượng sản phẩm
  - Tính phí theo phương thức vận chuyển (nhanh/chậm)
  - Miễn phí vận chuyển nếu đơn hàng đạt giá trị tối thiểu
  - Hiển thị phí vận chuyển trong checkout
- **Vị trí**: Component `ShippingCalculator`, `Checkout`
- **Trạng thái**: ❌ Chưa có

### 1.4 Tính Doanh Thu Theo Ngày, Tháng, Năm
- **Mô tả**: Tính tổng doanh thu theo các khoảng thời gian khác nhau
- **Yêu cầu**:
  - Tính doanh thu theo ngày
  - Tính doanh thu theo tháng
  - Tính doanh thu theo năm
  - So sánh doanh thu giữa các kỳ
  - Hiển thị biểu đồ thống kê
- **Vị trí**: Admin Dashboard, Report Page
- **Trạng thái**: ❌ Chưa có

---

## 🔄 2. Chức Năng Cập Nhật

### 2.1 Cập Nhật Thông Tin Sản Phẩm và Loại Sản Phẩm
- **Mô tả**: Cho phép admin cập nhật thông tin sản phẩm và danh mục
- **Thông tin sản phẩm**:
  - Tên, mô tả, giá, hình ảnh
  - Số lượng tồn kho
  - Thương hiệu, danh mục
  - Trạng thái (active/inactive)
- **Thông tin loại sản phẩm**:
  - Tên, mô tả
  - Hình ảnh đại diện
  - Trạng thái
- **Vị trí**: Admin Product Management, Category Management
- **Trạng thái**: ✅ Đã có (Update Modal)

### 2.2 Cập Nhật Thông Tin Tài Khoản Người Dùng
- **Mô tả**: Cho phép admin và user cập nhật thông tin tài khoản
- **Thông tin có thể cập nhật**:
  - Họ tên, email, số điện thoại
  - Địa chỉ
  - Avatar
  - Mật khẩu (yêu cầu xác thực)
- **Phân quyền**:
  - User: Chỉ cập nhật thông tin của mình
  - Admin: Cập nhật thông tin bất kỳ user nào
- **Vị trí**: User Profile, Admin User Management
- **Trạng thái**: ✅ Đã có (Update Modal)

### 2.3 Cập Nhật Thông Tin Đơn Hàng
- **Mô tả**: Cho phép admin cập nhật thông tin đơn hàng
- **Thông tin có thể cập nhật**:
  - Địa chỉ giao hàng
  - Số lượng sản phẩm trong đơn hàng
  - Ghi chú đơn hàng
  - Trạng thái đơn hàng
- **Ràng buộc**:
  - Chỉ cập nhật được khi đơn hàng chưa giao
  - Phải cập nhật lại tổng tiền khi thay đổi số lượng
- **Vị trí**: Admin Order Management
- **Trạng thái**: ❌ Chưa có

### 2.4 Cập Nhật Trạng Thái Giao Hàng và Thanh Toán
- **Mô tả**: Cập nhật trạng thái đơn hàng trong quá trình xử lý
- **Trạng thái giao hàng**:
  - Đang xử lý
  - Đã xác nhận
  - Đang đóng gói
  - Đang vận chuyển
  - Đã giao hàng
  - Đã hủy
- **Trạng thái thanh toán**:
  - Chưa thanh toán
  - Đã thanh toán
  - Hoàn tiền
- **Vị trí**: Admin Order Management
- **Trạng thái**: ❌ Chưa có

### 2.5 Cập Nhật Thông Tin Khuyến Mãi
- **Mô tả**: Cho phép admin cập nhật thông tin chương trình khuyến mãi
- **Thông tin có thể cập nhật**:
  - Tên, mô tả
  - Điều kiện áp dụng
  - Giảm giá (% hoặc số tiền)
  - Thời gian áp dụng
  - Trạng thái (active/inactive)
- **Vị trí**: Admin Promotion Management
- **Trạng thái**: ✅ Đã có (Update Modal)

### 2.6 Cập Nhật Thông Tin Nhân Viên
- **Mô tả**: Cho phép admin cập nhật thông tin nhân viên
- **Thông tin có thể cập nhật**:
  - Họ tên, email, số điện thoại
  - Vị trí, phòng ban
  - Quyền truy cập
  - Trạng thái (active/inactive)
- **Vị trí**: Admin Employee Management
- **Trạng thái**: ⚠️ Có thể dùng User Management (role EMPLOYEE)

### 2.7 Cập Nhật Thông Tin Phản Hồi, Đánh Giá Của Khách Hàng
- **Mô tả**: Cho phép admin quản lý phản hồi và đánh giá sản phẩm
- **Chức năng**:
  - Xem danh sách đánh giá
  - Phê duyệt/từ chối đánh giá
  - Xóa đánh giá không phù hợp
  - Trả lời phản hồi của khách hàng
- **Vị trí**: Admin Review Management
- **Trạng thái**: ❌ Chưa có

---

## ⚙️ 3. Chức Năng Xử Lý

### 3.1 Xử Lý Đăng Ký và Đăng Nhập Tài Khoản
- **Mô tả**: Xử lý quá trình đăng ký và đăng nhập của người dùng
- **Đăng ký**:
  - Validate thông tin đầu vào
  - Kiểm tra email đã tồn tại
  - Mã hóa mật khẩu
  - Lưu vào CSDL
  - Gửi email xác nhận
  - Tự động đăng nhập sau khi đăng ký thành công
- **Đăng nhập**:
  - Xác thực email/mật khẩu
  - Tạo JWT token
  - Lưu refresh token
  - Redirect theo role
- **Vị trí**: `Login.tsx`, `Register.tsx` (chưa có)
- **Trạng thái**: 
  - ✅ Đăng nhập: Đã có
  - ❌ Đăng ký: Chưa có

### 3.2 Xử Lý Thêm, Sửa, Xóa Sản Phẩm Trong Giỏ Hàng
- **Mô tả**: Xử lý các thao tác với giỏ hàng
- **Thêm sản phẩm**:
  - Kiểm tra số lượng tồn kho
  - Thêm vào Session (Guest) hoặc CSDL (User)
  - Cập nhật tổng tiền
  - Hiển thị thông báo
- **Sửa số lượng**:
  - Validate số lượng (>= 0)
  - Nếu = 0 → xóa sản phẩm
  - Cập nhật tổng tiền
- **Xóa sản phẩm**:
  - Xóa khỏi giỏ hàng
  - Cập nhật tổng tiền
  - Hiển thị thông báo
- **Vị trí**: `Cart.tsx`, `CartItem.tsx`
- **Trạng thái**: ❌ Chưa có

### 3.3 Xử Lý Thanh Toán Đơn Hàng
- **Mô tả**: Xử lý quá trình thanh toán và tạo đơn hàng
- **Quy trình**:
  1. Validate giỏ hàng (có sản phẩm, đã đăng nhập)
  2. Kiểm tra số lượng tồn kho
  3. Tính tổng tiền (bao gồm phí vận chuyển, khuyến mãi)
  4. Tạo đơn hàng trong CSDL
  5. Tạo chi tiết đơn hàng
  6. Cập nhật số lượng tồn kho
  7. Áp dụng khuyến mãi (nếu có)
  8. Gửi email xác nhận đơn hàng
  9. Xóa giỏ hàng (Session)
  10. Redirect đến trang xác nhận đơn hàng
- **Vị trí**: `Checkout.tsx`, `OrderService`
- **Trạng thái**: ❌ Chưa có

### 3.4 Xử Lý Xác Nhận Đơn Hàng, Giao Hàng
- **Mô tả**: Xử lý quá trình xác nhận và giao hàng
- **Xác nhận đơn hàng**:
  - Admin xem đơn hàng mới
  - Xác nhận đơn hàng
  - Cập nhật trạng thái: "Đã xác nhận"
  - Gửi email thông báo cho khách hàng
- **Giao hàng**:
  - Cập nhật trạng thái: "Đang vận chuyển"
  - Nhập mã vận đơn
  - Cập nhật trạng thái: "Đã giao hàng"
  - Gửi email thông báo
- **Vị trí**: Admin Order Management
- **Trạng thái**: ❌ Chưa có

### 3.5 Xử Lý Phân Quyền Giữa Khách Hàng, Nhân Viên và Quản Trị Viên
- **Mô tả**: Quản lý quyền truy cập theo role
- **Guest (Khách hàng)**:
  - Xem sản phẩm
  - Thêm vào giỏ hàng
  - Đăng ký tài khoản
- **Customer (Người dùng đã đăng ký)**:
  - Tất cả quyền của Guest
  - Thanh toán
  - Xem lịch sử đơn hàng
  - Đánh giá sản phẩm
- **Employee (Nhân viên)**:
  - Tất cả quyền của Customer
  - Xem danh sách đơn hàng
  - Cập nhật trạng thái đơn hàng
  - Xem thống kê cơ bản
- **Admin (Quản trị viên)**:
  - Tất cả quyền của Employee
  - Quản lý sản phẩm, danh mục
  - Quản lý người dùng, nhân viên
  - Quản lý đơn hàng
  - Quản lý khuyến mãi
  - Xem thống kê đầy đủ
  - Xuất báo cáo
- **Vị trí**: `ProtectedRoute.tsx`, `AuthContext.tsx`
- **Trạng thái**: ✅ Đã có (cần cải thiện cho Guest)

---

## 💾 4. Chức Năng Lưu Trữ

### 4.1 Lưu Thông Tin Người Dùng, Nhân Viên và Quản Trị Viên
- **Mô tả**: Lưu trữ thông tin tài khoản trong CSDL
- **Thông tin lưu trữ**:
  - Thông tin cá nhân (họ tên, email, số điện thoại)
  - Địa chỉ
  - Avatar
  - Mật khẩu (đã mã hóa)
  - Role (USER, EMPLOYEE, ADMIN)
  - Trạng thái (active/inactive)
  - Ngày tạo, ngày cập nhật
- **Vị trí**: Database `users` table
- **Trạng thái**: ✅ Đã có

### 4.2 Lưu Thông Tin Sản Phẩm, Loại Sản Phẩm
- **Mô tả**: Lưu trữ thông tin sản phẩm và danh mục
- **Sản phẩm**:
  - Tên, mô tả, giá
  - Hình ảnh (nhiều ảnh)
  - Số lượng tồn kho
  - Thương hiệu, danh mục
  - Trạng thái
- **Loại sản phẩm**:
  - Tên, mô tả
  - Hình ảnh đại diện
  - Trạng thái
- **Vị trí**: Database `products`, `categories` tables
- **Trạng thái**: ✅ Đã có

### 4.3 Lưu Thông Tin Đơn Hàng và Chi Tiết Đơn Hàng
- **Mô tả**: Lưu trữ thông tin đơn hàng
- **Đơn hàng**:
  - Mã đơn hàng
  - Thông tin khách hàng
  - Địa chỉ giao hàng
  - Tổng tiền
  - Phí vận chuyển
  - Giảm giá
  - Trạng thái đơn hàng
  - Trạng thái thanh toán
  - Ngày đặt hàng
- **Chi tiết đơn hàng**:
  - Sản phẩm
  - Số lượng
  - Giá tại thời điểm mua
  - Tổng tiền
- **Vị trí**: Database `orders`, `order_items` tables
- **Trạng thái**: ❌ Chưa có

### 4.4 Lưu Thông Tin Giỏ Hàng Tạm Thời
- **Mô tả**: Lưu trữ giỏ hàng tạm thời
- **Guest**:
  - Lưu trong Session (sessionStorage/localStorage)
  - Không lưu vào CSDL
- **User đã đăng nhập**:
  - Có thể lưu trong Session hoặc CSDL
  - Đồng bộ giữa các thiết bị
- **Cấu trúc**:
  ```json
  {
    "items": [
      {
        "productId": 1,
        "productName": "Product Name",
        "price": 100000,
        "quantity": 2,
        "imageUrl": "url"
      }
    ],
    "total": 200000,
    "updatedAt": "2024-12-19T10:00:00Z"
  }
  ```
- **Vị trí**: Session Storage / Database `cart_items` table
- **Trạng thái**: ❌ Chưa có

### 4.5 Lưu Thông Tin Khuyến Mãi, Mã Giảm Giá
- **Mô tả**: Lưu trữ chương trình khuyến mãi
- **Thông tin lưu trữ**:
  - Tên, mô tả
  - Điều kiện áp dụng
  - Giảm giá (% hoặc số tiền)
  - Thời gian bắt đầu/kết thúc
  - Số lần sử dụng
  - Trạng thái
- **Vị trí**: Database `promotions` table
- **Trạng thái**: ✅ Đã có

### 4.6 Lưu Thông Tin Phản Hồi và Đánh Giá Sản Phẩm
- **Mô tả**: Lưu trữ đánh giá và phản hồi của khách hàng
- **Thông tin lưu trữ**:
  - Sản phẩm được đánh giá
  - Khách hàng đánh giá
  - Số sao (1-5)
  - Nội dung đánh giá
  - Hình ảnh (nếu có)
  - Trạng thái (pending/approved/rejected)
  - Ngày đánh giá
- **Vị trí**: Database `reviews` table
- **Trạng thái**: ❌ Chưa có

---

## 🔍 5. Chức Năng Tìm Kiếm

### 5.1 Tìm Kiếm Sản Phẩm Theo Tên, Loại, Giá hoặc Thương Hiệu
- **Mô tả**: Tìm kiếm sản phẩm với nhiều tiêu chí
- **Tiêu chí tìm kiếm**:
  - Tên sản phẩm (full-text search)
  - Loại sản phẩm (category)
  - Khoảng giá (min-max)
  - Thương hiệu (brand)
  - Kết hợp nhiều tiêu chí
- **Yêu cầu**:
  - Tìm kiếm real-time
  - Highlight từ khóa
  - Sắp xếp kết quả (giá, tên, mới nhất)
  - Phân trang kết quả
- **Vị trí**: `Home.tsx`, Search Component
- **Trạng thái**: ⚠️ Có tìm kiếm cơ bản, cần cải thiện

### 5.2 Tìm Kiếm Đơn Hàng Theo Mã hoặc Trạng Thái
- **Mô tả**: Tìm kiếm đơn hàng trong hệ thống
- **Tiêu chí tìm kiếm**:
  - Mã đơn hàng (order code)
  - Trạng thái đơn hàng
  - Trạng thái thanh toán
  - Ngày đặt hàng
  - Tên khách hàng
- **Vị trí**: Admin Order Management
- **Trạng thái**: ❌ Chưa có

### 5.3 Tìm Kiếm Khách Hàng hoặc Nhân Viên
- **Mô tả**: Tìm kiếm người dùng trong hệ thống
- **Tiêu chí tìm kiếm**:
  - Tên
  - Email
  - Số điện thoại
  - Role (USER, EMPLOYEE, ADMIN)
  - Trạng thái (active/inactive)
- **Vị trí**: Admin User Management
- **Trạng thái**: ✅ Đã có (ProTable search)

### 5.4 Tìm Kiếm Loại Sản Phẩm hoặc Danh Mục
- **Mô tả**: Tìm kiếm danh mục sản phẩm
- **Tiêu chí tìm kiếm**:
  - Tên danh mục
  - Trạng thái
- **Vị trí**: Admin Category Management
- **Trạng thái**: ✅ Đã có (ProTable search)

### 5.5 Tìm Kiếm Chương Trình Khuyến Mãi
- **Mô tả**: Tìm kiếm chương trình khuyến mãi
- **Tiêu chí tìm kiếm**:
  - Tên chương trình
  - Trạng thái (active/inactive)
  - Thời gian áp dụng
- **Vị trí**: Admin Promotion Management
- **Trạng thái**: ✅ Đã có (ProTable search)

---

## 📊 6. Chức Năng Thống Kê

### 6.1 Thống Kê Doanh Thu Theo Thời Gian
- **Mô tả**: Thống kê doanh thu theo các khoảng thời gian
- **Yêu cầu**:
  - Doanh thu theo ngày
  - Doanh thu theo tháng
  - Doanh thu theo năm
  - So sánh giữa các kỳ
  - Biểu đồ đường (line chart)
  - Xuất báo cáo
- **Vị trí**: Admin Dashboard, Report Page
- **Trạng thái**: ❌ Chưa có

### 6.2 Thống Kê Số Lượng Đơn Hàng Theo Trạng Thái
- **Mô tả**: Thống kê số lượng đơn hàng theo từng trạng thái
- **Yêu cầu**:
  - Số đơn hàng theo trạng thái (đang xử lý, đã xác nhận, đang giao, đã giao, đã hủy)
  - Biểu đồ tròn (pie chart) hoặc cột (bar chart)
  - Tỷ lệ phần trăm
  - Filter theo thời gian
- **Vị trí**: Admin Dashboard
- **Trạng thái**: ❌ Chưa có

### 6.3 Thống Kê Sản Phẩm Bán Chạy
- **Mô tả**: Thống kê các sản phẩm được bán nhiều nhất
- **Yêu cầu**:
  - Top 10 sản phẩm bán chạy
  - Số lượng đã bán
  - Doanh thu từ mỗi sản phẩm
  - Biểu đồ cột (bar chart)
  - Filter theo thời gian
- **Vị trí**: Admin Dashboard, Report Page
- **Trạng thái**: ❌ Chưa có

### 6.4 Thống Kê Khách Hàng và Nhân Viên Hoạt Động
- **Mô tả**: Thống kê hoạt động của người dùng
- **Yêu cầu**:
  - Số lượng khách hàng mới theo thời gian
  - Số lượng đơn hàng của từng khách hàng
  - Khách hàng VIP (mua nhiều nhất)
  - Hoạt động của nhân viên (số đơn hàng xử lý)
  - Biểu đồ và bảng thống kê
- **Vị trí**: Admin Dashboard
- **Trạng thái**: ❌ Chưa có

### 6.5 Thống Kê Số Lượng Hàng Tồn Kho
- **Mô tả**: Thống kê tình trạng tồn kho
- **Yêu cầu**:
  - Số lượng sản phẩm còn lại
  - Sản phẩm sắp hết hàng (cảnh báo)
  - Sản phẩm hết hàng
  - Giá trị tồn kho
  - Biểu đồ và bảng thống kê
- **Vị trí**: Admin Dashboard, Inventory Report
- **Trạng thái**: ❌ Chưa có

---

## 📄 7. Chức Năng Kết Xuất

### 7.1 Xuất File Excel Danh Sách Đơn Hàng
- **Mô tả**: Xuất danh sách đơn hàng ra file Excel
- **Yêu cầu**:
  - Xuất tất cả đơn hàng hoặc đơn hàng đã filter
  - Các cột: Mã đơn hàng, Ngày đặt, Khách hàng, Tổng tiền, Trạng thái
  - Format Excel (.xlsx)
  - Tên file: `don-hang-YYYY-MM-DD.xlsx`
- **Vị trí**: Admin Order Management
- **Trạng thái**: ❌ Chưa có (có sẵn utility `exportExcel.ts`)

### 7.2 Xuất File Excel Doanh Thu và Sản Phẩm Bán Chạy
- **Mô tả**: Xuất báo cáo doanh thu và sản phẩm bán chạy
- **Yêu cầu**:
  - Sheet 1: Doanh thu theo thời gian
  - Sheet 2: Top sản phẩm bán chạy
  - Format Excel với biểu đồ (nếu có thể)
  - Tên file: `bao-cao-doanh-thu-YYYY-MM-DD.xlsx`
- **Vị trí**: Admin Report Page
- **Trạng thái**: ❌ Chưa có

### 7.3 Xuất Báo Cáo Thống Kê Hoạt Động Hệ Thống
- **Mô tả**: Xuất báo cáo tổng hợp hoạt động hệ thống
- **Yêu cầu**:
  - Tổng quan doanh thu
  - Số lượng đơn hàng
  - Sản phẩm bán chạy
  - Khách hàng mới
  - Hàng tồn kho
  - Format Excel hoặc PDF
  - Tên file: `bao-cao-tong-hop-YYYY-MM-DD.xlsx`
- **Vị trí**: Admin Report Page
- **Trạng thái**: ❌ Chưa có

---

## 🎯 8. Chức Năng Gợi Ý Sản Phẩm

### 8.1 Đề Xuất Các Sản Phẩm Phù Hợp Với Người Dùng
- **Mô tả**: Gợi ý sản phẩm dựa trên hành vi và sở thích người dùng
- **Thuật toán gợi ý**:
  - Sản phẩm cùng danh mục đã xem
  - Sản phẩm cùng thương hiệu
  - Sản phẩm bán chạy
  - Sản phẩm mới nhất
  - Sản phẩm có giá tương tự
  - Sản phẩm khách hàng khác cũng mua
- **Yêu cầu**:
  - Hiển thị trong trang chủ
  - Hiển thị trong trang chi tiết sản phẩm
  - Hiển thị trong giỏ hàng
  - Cá nhân hóa theo lịch sử mua hàng (nếu đã đăng nhập)
- **Vị trí**: `Home.tsx`, `ProductDetail.tsx`, `Cart.tsx`
- **Trạng thái**: ❌ Chưa có

---

## 📊 9. Tổng Kết Trạng Thái

### 9.1 Đã Hoàn Thành ✅
- [x] Cập nhật thông tin sản phẩm và loại sản phẩm
- [x] Cập nhật thông tin tài khoản người dùng
- [x] Cập nhật thông tin khuyến mãi
- [x] Xử lý đăng nhập tài khoản
- [x] Xử lý phân quyền
- [x] Lưu thông tin người dùng, sản phẩm, loại sản phẩm, khuyến mãi
- [x] Tìm kiếm sản phẩm (cơ bản)
- [x] Tìm kiếm người dùng, danh mục, khuyến mãi

### 9.2 Chưa Hoàn Thành ❌
- [ ] Tính tổng tiền giỏ hàng
- [ ] Tính tổng đơn hàng sau khuyến mãi
- [ ] Tính phí vận chuyển
- [ ] Tính doanh thu theo thời gian
- [ ] Cập nhật thông tin đơn hàng
- [ ] Cập nhật trạng thái giao hàng và thanh toán
- [ ] Cập nhật thông tin phản hồi, đánh giá
- [ ] Xử lý đăng ký tài khoản
- [ ] Xử lý thêm, sửa, xóa giỏ hàng
- [ ] Xử lý thanh toán đơn hàng
- [ ] Xử lý xác nhận đơn hàng, giao hàng
- [ ] Lưu thông tin đơn hàng
- [ ] Lưu thông tin giỏ hàng
- [ ] Lưu thông tin phản hồi, đánh giá
- [ ] Tìm kiếm đơn hàng
- [ ] Tất cả chức năng thống kê
- [ ] Tất cả chức năng kết xuất
- [ ] Gợi ý sản phẩm

### 9.3 Cần Cải Thiện ⚠️
- [ ] Tìm kiếm sản phẩm nâng cao (filter theo giá, thương hiệu)
- [ ] Cập nhật thông tin nhân viên (có thể dùng User Management)

---

## 🎯 10. Ưu Tiên Triển Khai

### Phase 1: Core E-commerce Features (Ưu tiên cao nhất)
1. Giỏ hàng (thêm, sửa, xóa, tính tổng tiền)
2. Xem chi tiết sản phẩm
3. Đăng ký tài khoản
4. Thanh toán đơn hàng
5. Quản lý đơn hàng (Admin)

### Phase 2: Enhanced Features
1. Tính phí vận chuyển
2. Áp dụng khuyến mãi khi thanh toán
3. Cập nhật trạng thái đơn hàng
4. Đánh giá sản phẩm

### Phase 3: Analytics & Reports
1. Thống kê doanh thu
2. Thống kê sản phẩm bán chạy
3. Xuất báo cáo Excel
4. Dashboard thống kê

### Phase 4: Advanced Features
1. Gợi ý sản phẩm
2. Tìm kiếm nâng cao
3. Thống kê chi tiết

---

**Cập nhật lần cuối**: 2024-12-19

