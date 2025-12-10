# Mô Tả Sơ Đồ Tuần Tự (Sequence Diagram) - Các Chức Năng Hệ Thống

## 1. Tạo Sản Phẩm (Create Product)

### Actors:
- **Admin/Employee** (Client)
- **Frontend** (React)
- **Backend API** (Spring Boot)
- **ProductService**
- **Database**

### Flow:
1. Admin/Employee đăng nhập và có JWT token
2. Admin/Employee điền form tạo sản phẩm (tên, mô tả, giá, SKU, brand, category, variants, images)
3. Frontend gửi POST request đến `/api/v1/products` với:
   - Header: `Authorization: Bearer <JWT token>`
   - Body: Product data (JSON)
4. Backend API nhận request:
   - Security filter kiểm tra JWT token
   - Xác thực role (ADMIN hoặc EMPLOYEE) qua `@PreAuthorize("hasAnyRole('ADMIN', 'EMPLOYEE')")`
5. ProductController.validate() kiểm tra dữ liệu đầu vào
6. ProductController gọi ProductService.createProduct()
7. ProductService thực hiện:
   - Validate business logic
   - Tạo Product entity
   - Lưu vào Database
   - Set createdBy = current user email
   - Set createdAt = current timestamp
8. Database lưu Product và trả về entity đã lưu
9. ProductService trả về Product entity
10. ProductController trả về Product DTO
11. Frontend nhận response và hiển thị thông báo thành công
12. Frontend có thể redirect về trang danh sách sản phẩm

### Messages:
- `POST /api/v1/products` (với JWT token)
- `createProduct(productData)`
- `save(product)` → Database
- `200 OK` với Product data

---

## 2. Gợi Ý Sản Phẩm (AI Product Recommendation)

### Actors:
- **User** (Client)
- **Frontend** (React)
- **Backend API** (Spring Boot)
- **ProductService**
- **UserProductHistoryService** (optional)
- **AI Service** (Gemini + ChromaDB - cho vector search)
- **Database**

### Flow (Vector-based AI Recommendation):
1. User nhập query tìm kiếm (ví dụ: "bút viết mực xanh")
2. Frontend gửi GET request đến `/api/v1/products/vector-suggest` với:
   - Query params: `q=<query>`, `categoryId=<optional>`, `limit=8`
   - Header: `Authorization: Bearer <JWT token>` (optional - có thể public)
3. Backend API nhận request
4. ProductController gọi ProductService.suggestProductsByVector()
5. ProductService thực hiện:
   - Convert query text thành vector embedding (sử dụng Gemini AI)
   - Tìm kiếm trong ChromaDB vector database để tìm sản phẩm tương tự
   - Filter theo categoryId nếu có
   - Limit số lượng kết quả
6. AI Service (Gemini) tạo embedding vector từ query
7. ChromaDB tìm kiếm vector similarity
8. Database trả về danh sách Product entities
9. ProductService trả về List<Product>
10. ProductController trả về JSON response
11. Frontend nhận danh sách sản phẩm gợi ý và hiển thị

### Flow (History-based Recommendation):
1. User đã xem/click sản phẩm (tracked qua `/api/v1/products/{id}/view`)
2. Frontend gửi GET request đến `/api/v1/products/history-suggest` với:
   - Query params: `categoryId=<optional>`, `limit=8`
   - Header: `Authorization: Bearer <JWT token>` (required)
3. Backend API nhận request và xác thực user
4. ProductController gọi UserProductHistoryService.getUserHistory()
5. UserProductHistoryService lấy lịch sử 20 sản phẩm user đã xem
6. Nếu không có lịch sử → trả về best sellers
7. Nếu có lịch sử → ProductService.suggestProductsByUserHistory()
8. ProductService tìm sản phẩm tương tự dựa trên:
   - Category của sản phẩm đã xem
   - Brand của sản phẩm đã xem
   - Similar products
9. Database trả về danh sách Product
10. Frontend hiển thị gợi ý

### Messages:
- `GET /api/v1/products/vector-suggest?q=<query>&limit=8`
- `GET /api/v1/products/history-suggest?limit=8`
- `POST /api/v1/products/{id}/view` (track user view)
- `suggestProductsByVector(query, categoryId, limit)`
- `suggestProductsByUserHistory(productIds, categoryId, limit)`
- `200 OK` với List<Product>

---

## 3. Thanh Toán (Payment Flow - PayOS)

### Actors:
- **User** (Client)
- **Frontend** (React)
- **Backend API** (Spring Boot)
- **OrderService**
- **PayOSService**
- **PayOS Gateway** (External)
- **CartService**
- **Database**

### Flow (PayOS Payment):
1. User thêm sản phẩm vào giỏ hàng
2. User chọn phương thức thanh toán: PayOS
3. User điền thông tin địa chỉ giao hàng
4. Frontend gửi POST request đến `/api/v1/orders/checkout` với:
   - Header: `Authorization: Bearer <JWT token>`
   - Body: CheckoutRequestDTO (cartItemIds, paymentMethod=PAYOS, address, etc.)
5. Backend API xác thực user
6. OrderController gọi OrderService.checkoutFromCart()
7. OrderService thực hiện:
   - Lấy Cart của user từ Database
   - Validate số lượng sản phẩm còn trong kho
   - Tạo Order với status = PENDING
   - Tạo OrderItems từ CartItems
   - Trừ stock của sản phẩm
   - Tính tổng tiền
   - Xóa CartItems đã checkout khỏi Cart
   - Lưu Order vào Database
8. OrderService trả về Order với orderCode
9. Frontend nhận orderCode và gửi POST request đến `/api/v1/payment/payos/create` với:
   - Body: { orderCode, amount, description }
10. PayOSController gọi PayOSService.createPaymentLink()
11. PayOSService tạo payment link:
    - Tạo payment request với PayOS API
    - Gửi request đến PayOS Gateway
12. PayOS Gateway trả về paymentLinkId và checkoutUrl
13. PayOSService cập nhật Order.paymentLinkId trong Database
14. PayOSController trả về checkoutUrl
15. Frontend redirect user đến checkoutUrl (PayOS payment page)
16. User thanh toán trên PayOS
17. PayOS gửi webhook đến `/api/v1/payment/payos/webhook`:
    - PayOSController nhận webhook
    - PayOSService.verifyWebhook() xác thực signature
    - Nếu thành công → update Order.status = PAID
    - Nếu thất bại → update Order.status = CANCELLED
18. PayOS redirect user về `/api/v1/payment/payos/return`
19. PayOSController xác thực payment và redirect về frontend với status
20. Frontend hiển thị kết quả thanh toán

### Flow (COD - Cash on Delivery):
1. User chọn phương thức thanh toán: COD
2. Frontend gửi POST request đến `/api/v1/orders/checkout` với paymentMethod=COD
3. OrderService tạo Order với status = PENDING (chờ xác nhận)
4. Frontend hiển thị thông báo "Đơn hàng COD đã được tạo thành công"
5. Admin xác nhận đơn hàng → Order.status = CONFIRMED
6. User nhận hàng và thanh toán

### Messages:
- `POST /api/v1/orders/checkout` (với CheckoutRequestDTO)
- `POST /api/v1/payment/payos/create` (với orderCode, amount)
- `checkoutFromCart(user, request)`
- `createPaymentLink(orderCode, amount, description)`
- `POST /api/v1/payment/payos/webhook` (PayOS → Backend)
- `GET /api/v1/payment/payos/return` (PayOS redirect)
- `updateOrderStatus(orderCode, PAID)`
- `200 OK` với checkoutUrl hoặc orderCode

---

## 4. Tạo Khuyến Mãi (Create Promotion)

### Actors:
- **Admin/Employee** (Client)
- **Frontend** (React)
- **Backend API** (Spring Boot)
- **PromotionService**
- **Database**

### Flow:
1. Admin/Employee đăng nhập và có JWT token
2. Admin/Employee điền form tạo khuyến mãi:
   - Tên chương trình
   - Mô tả
   - Loại giảm giá (percentage hoặc fixed amount)
   - Giá trị giảm giá
   - Ngày bắt đầu
   - Ngày kết thúc
   - Danh sách sản phẩm áp dụng (optional)
   - Điều kiện áp dụng (minimum order amount, etc.)
3. Frontend gửi POST request đến `/api/v1/promotions` với:
   - Header: `Authorization: Bearer <JWT token>`
   - Body: PromotionRequestDTO (JSON)
4. Backend API nhận request:
   - Security filter kiểm tra JWT token
   - Xác thực role (ADMIN hoặc EMPLOYEE) qua `@PreAuthorize("hasAnyRole('ADMIN', 'EMPLOYEE')")`
5. PromotionController.validate() kiểm tra dữ liệu đầu vào
6. PromotionController gọi PromotionService.createPromotion()
7. PromotionService thực hiện:
   - Validate business logic:
     - Ngày bắt đầu < ngày kết thúc
     - Giá trị giảm giá hợp lệ
     - Không trùng với promotion khác đang active
   - Tạo Promotion entity
   - Set isActive = true (nếu trong thời gian hiệu lực)
   - Lưu vào Database
   - Set createdBy = current user email
   - Set createdAt = current timestamp
8. Database lưu Promotion và trả về entity đã lưu
9. PromotionService trả về Promotion entity
10. PromotionController convert sang PromotionResponseDTO và trả về
11. Frontend nhận response và hiển thị thông báo thành công
12. Frontend có thể redirect về trang danh sách khuyến mãi

### Messages:
- `POST /api/v1/promotions` (với JWT token)
- `createPromotion(promotionRequestDTO)`
- `save(promotion)` → Database
- `200 OK` với PromotionResponseDTO

---

## 5. Authentication (Đăng Nhập / Đăng Ký)

### Actors:
- **User** (Client)
- **Frontend** (React)
- **Backend API** (Spring Boot)
- **AuthenticationManager**
- **UserDetailsService**
- **SecurityUtil** (JWT)
- **UserService**
- **Database**

### Flow (Login):
1. User điền form đăng nhập (username/email, password)
2. Frontend gửi POST request đến `/api/v1/login` với:
   - Body: LoginDTO { username, password }
3. Backend API nhận request (endpoint public, không cần JWT)
4. AuthController tạo UsernamePasswordAuthenticationToken
5. AuthController gọi AuthenticationManager.authenticate()
6. AuthenticationManager gọi UserDetailsService.loadUserByUsername()
7. UserDetailsService:
   - Tìm User trong Database theo email/username
   - Kiểm tra password (BCrypt)
   - Tạo UserDetails với authorities (ROLE_ADMIN, ROLE_EMPLOYEE, ROLE_USER)
8. AuthenticationManager xác thực thành công → trả về Authentication object
9. AuthController gọi SecurityUtil.createToken(authentication):
   - Tạo JWT access token với:
     - Subject: username/email
     - Claims: authorities, user info trong "truonggiang" claim
     - Expiration: 24 giờ
   - Tạo JWT refresh token với:
     - Subject: username/email
     - Type: "refresh"
     - Expiration: 30 ngày
10. AuthController set refresh token vào HTTP-only cookie:
    - Cookie name: "refreshToken"
    - HttpOnly: true
    - Path: "/api/v1"
    - MaxAge: 30 days
11. AuthController trả về ResponseLoginDTO:
    - accessToken (trong response body)
    - refreshToken (trong response body - cho mobile clients)
12. Frontend lưu accessToken vào localStorage/sessionStorage
13. Frontend redirect user đến trang chủ hoặc trang trước đó

### Flow (Register):
1. User điền form đăng ký (username, email, password)
2. Frontend gửi POST request đến `/api/v1/register` với:
   - Body: RegisterDTO { username, email, password }
3. Backend API nhận request (endpoint public)
4. AuthController.validate() kiểm tra dữ liệu đầu vào
5. AuthController kiểm tra:
   - Email đã tồn tại? → trả về error
   - Username đã tồn tại? → trả về error
6. AuthController tạo User entity:
   - Role: USER (mặc định)
   - isActive: true
   - Password: encode bằng BCrypt
7. AuthController gọi UserService.createUser()
8. UserService lưu User vào Database
9. AuthController trả về APIResponse với User data
10. Frontend hiển thị thông báo "Đăng ký thành công"
11. Frontend có thể redirect đến trang đăng nhập

### Flow (Refresh Token):
1. Access token hết hạn (401 Unauthorized)
2. Frontend tự động gửi POST request đến `/api/v1/refresh`:
   - Cookie: refreshToken (tự động gửi kèm)
3. Backend API nhận request
4. AuthController lấy refreshToken từ cookie
5. AuthController gọi SecurityUtil.getUsernameFromRefreshToken():
   - Decode và validate refresh token
   - Trả về username/email
6. AuthController gọi UserDetailsService.loadUserByUsername()
7. UserDetailsService load user từ Database
8. AuthController tạo Authentication mới với authorities
9. AuthController tạo access token mới (24 giờ)
10. AuthController tạo refresh token mới (30 ngày) - token rotation
11. AuthController set refresh token mới vào cookie
12. AuthController trả về access token mới
13. Frontend lưu access token mới và retry request ban đầu

### Messages:
- `POST /api/v1/login` (với LoginDTO)
- `POST /api/v1/register` (với RegisterDTO)
- `POST /api/v1/refresh` (với refreshToken cookie)
- `authenticate(authenticationToken)`
- `loadUserByUsername(username)`
- `createToken(authentication)` → JWT access token
- `createRefreshToken(username)` → JWT refresh token
- `200 OK` với ResponseLoginDTO { accessToken, refreshToken }

---

## Lưu Ý Chung:

### Security:
- Tất cả endpoints (trừ login, register, public GET) đều yêu cầu JWT token
- JWT token được gửi trong header: `Authorization: Bearer <token>`
- Refresh token được lưu trong HTTP-only cookie để bảo mật
- Role-based access control: ADMIN, EMPLOYEE, USER

### Error Handling:
- 401 Unauthorized: Token không hợp lệ hoặc hết hạn
- 403 Forbidden: Không có quyền truy cập
- 400 Bad Request: Dữ liệu đầu vào không hợp lệ
- 404 Not Found: Resource không tồn tại
- 500 Internal Server Error: Lỗi server

### Database Transactions:
- Các thao tác tạo/update/delete đều được wrap trong transaction
- Rollback tự động nếu có lỗi xảy ra

