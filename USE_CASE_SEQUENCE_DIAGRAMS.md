# Sơ Đồ Tuần Tự Chi Tiết - Các Use Case Hệ Thống

> Tài liệu mô tả chi tiết luồng hoạt động của từng use case với sự tham gia của các thành phần: **Client (React)**, **Server (Spring Boot)**, **MariaDB**, **ChromaDB**, **Cloudinary**, **Gemini AI**, **PayOS Gateway**.

---

## 1. Tạo Sản Phẩm (Create Product)

### 1.1 Mô tả
Admin/Employee tạo sản phẩm mới với thông tin chi tiết và upload ảnh lên Cloudinary.

### 1.2 Các thành phần tham gia
| Thành phần | Vai trò |
|------------|---------|
| **Client (React)** | Giao diện nhập thông tin sản phẩm |
| **Server (Spring Boot)** | Xử lý logic, validate, lưu dữ liệu |
| **Cloudinary** | Lưu trữ hình ảnh sản phẩm |
| **MariaDB** | Lưu trữ thông tin sản phẩm |

### 1.3 Sơ đồ tuần tự

```mermaid
sequenceDiagram
    autonumber
    participant U as Admin/Employee
    participant FE as Client React
    participant BE as Spring Boot Server
    participant SEC as SecurityFilter
    participant PC as ProductController
    participant PS as ProductServiceImpl
    participant US as UploadService
    participant CL as Cloudinary
    participant DB as MariaDB

    U->>FE: Điền form tạo sản phẩm
    U->>FE: Chọn ảnh sản phẩm
    
    Note over FE: Upload ảnh trước
    FE->>BE: POST /api/v1/uploads<br/>Header: Authorization: Bearer JWT<br/>Body: FormData (file, resourceType=image)
    BE->>SEC: Validate JWT Token
    SEC-->>BE: Authentication OK
    BE->>US: upload(file, "image", "products", null, "thumbnail")
    US->>US: validateFile(file, "image")
    US->>CL: cloudinary.uploader.upload(file, options)
    CL-->>US: {publicId, secureUrl, format, width, height}
    US-->>BE: UploadResponseDTO
    BE-->>FE: {status: 200, data: {secureUrl: "https://..."}}
    
    Note over FE: Lưu URL ảnh vào state
    
    FE->>BE: POST /api/v1/products<br/>Header: Authorization: Bearer JWT<br/>Body: ProductDTO (name, sku, price, thumbnailUrl, variants...)
    BE->>SEC: Validate JWT Token
    SEC->>SEC: Check role: ADMIN or EMPLOYEE
    SEC-->>BE: Authorization OK
    BE->>PC: createProduct(@RequestBody Product)
    PC->>PC: @Valid validate request
    PC->>PS: createProduct(product)
    PS->>PS: Check SKU exists
    PS->>PS: Load Categories from categoryIds
    PS->>DB: productRepository.save(product)
    DB-->>PS: Product entity (with ID)
    PS->>PS: Process variants (ensureDefaultVariant)
    PS->>DB: productVariantRepository.saveAll(variants)
    DB-->>PS: Variants saved
    PS->>DB: productRepository.findById(id)
    DB-->>PS: Product with relations
    PS-->>PC: Product entity
    PC-->>BE: Product response
    BE-->>FE: {status: 200, data: Product}
    FE-->>U: Hiển thị thông báo "Tạo sản phẩm thành công"
```

### 1.4 Chi tiết từng bước

| Step | Actor | Service | Action | Data In | Data Out |
|------|-------|---------|--------|---------|----------|
| 1-2 | User | Client | Điền form | - | FormData |
| 3 | Client | Server | POST /uploads | file, JWT | - |
| 4-5 | Server | SecurityFilter | Validate JWT | JWT Token | Auth OK |
| 6-7 | Server | UploadService | Validate & Upload | file | - |
| 8-9 | UploadService | Cloudinary | Upload image | file bytes | URL, publicId |
| 10-11 | Server | Client | Return URL | - | secureUrl |
| 12 | Client | Server | POST /products | ProductDTO, JWT | - |
| 13-15 | Server | SecurityFilter | Auth + Role check | JWT | OK |
| 16-18 | ProductController | ProductService | Create product | Product | - |
| 19-22 | ProductService | MariaDB | Save product & variants | Entity | Saved entity |
| 23 | Server | Client | Return response | - | Product |

---

## 2. Gợi Ý Sản Phẩm AI (Vector-based Recommendation)

### 2.1 Mô tả
Hệ thống gợi ý sản phẩm dựa trên text query của user, sử dụng Gemini AI để tạo embedding và ChromaDB để tìm kiếm vector similarity.

### 2.2 Các thành phần tham gia
| Thành phần | Vai trò |
|------------|---------|
| **Client (React)** | Gửi query tìm kiếm |
| **Server (Spring Boot)** | Điều phối AI services |
| **Gemini AI (text-embedding-004)** | Tạo vector embedding từ text |
| **ChromaDB** | Vector database - tìm kiếm similarity |
| **MariaDB** | Lấy thông tin chi tiết sản phẩm |

### 2.3 Sơ đồ tuần tự

```mermaid
sequenceDiagram
    autonumber
    participant U as User
    participant FE as Client React
    participant BE as Spring Boot Server
    participant PC as ProductController
    participant PS as ProductServiceImpl
    participant AI as AiVectorService
    participant GE as Gemini AI API
    participant CH as ChromaDB
    participant DB as MariaDB

    U->>FE: Nhập query "bút viết mực xanh"
    FE->>BE: GET /api/v1/products/vector-suggest<br/>?q=bút viết mực xanh&limit=8
    BE->>PC: getVectorSuggestions(query, categoryId, limit)
    PC->>PS: suggestProductsByVector("bút viết mực xanh", null, 8)
    
    Note over PS: Mở rộng query với synonyms
    PS->>PS: expandQueryWithSynonyms(query)
    PS-->>PS: "bút viết mực xanh bút bi viết"
    
    Note over AI,GE: Tạo embedding vector 768 dimensions
    PS->>AI: embedWithGemini(expandedQuery)
    AI->>GE: POST /v1beta/models/text-embedding-004:embedContent<br/>{model, content: {parts: [{text}]}}
    GE-->>AI: {embedding: {values: [0.01, 0.02, ... 768 dims]}}
    AI-->>PS: List<Double> embedding
    
    Note over AI,CH: Query ChromaDB với vector
    PS->>AI: queryChroma(embedding, categoryId, limit=8)
    AI->>CH: POST /api/v2/collections/{collectionId}/query<br/>{query_embeddings: [[...]], n_results: 8}
    CH->>CH: Cosine similarity search
    CH-->>AI: {ids: [["1","5","12"]], distances: [[0.1, 0.2, 0.3]]}
    AI-->>PS: ChromaQueryResponse
    
    Note over PS,DB: Fetch product details từ MariaDB
    PS->>PS: Parse product IDs from response
    PS->>DB: productRepository.findAllById([1, 5, 12])
    DB-->>PS: List<Product>
    PS->>PS: Sort by ChromaDB distance order
    PS-->>PC: List<Product> ordered
    PC-->>BE: JSON Response
    BE-->>FE: {data: [Product1, Product2, ...]}
    FE-->>U: Hiển thị danh sách sản phẩm gợi ý
```

### 2.4 Chi tiết từng bước

| Step | Actor | Service | Action | Data In | Data Out |
|------|-------|---------|--------|---------|----------|
| 1-2 | User/Client | Server | Search request | query string | - |
| 3-5 | ProductService | - | Expand query | "bút viết" | "bút viết bút bi" |
| 6-9 | AiVectorService | Gemini API | Create embedding | text | float[768] |
| 10-14 | AiVectorService | ChromaDB | Vector similarity | embedding | product IDs |
| 15-17 | ProductService | MariaDB | Fetch products | IDs | Product list |
| 18-20 | Server | Client | Return results | - | JSON products |

---

## 3. Thanh Toán (Payment Flow - PayOS)

### 3.1 Mô tả
User checkout giỏ hàng và thanh toán qua PayOS gateway.

### 3.2 Các thành phần tham gia
| Thành phần | Vai trò |
|------------|---------|
| **Client (React)** | Giao diện checkout |
| **Server (Spring Boot)** | Xử lý order, tích hợp PayOS |
| **PayOS Gateway** | Xử lý thanh toán online |
| **MariaDB** | Lưu Order, OrderItems, cập nhật stock |

### 3.3 Sơ đồ tuần tự

```mermaid
sequenceDiagram
    autonumber
    participant U as User
    participant FE as Client React
    participant BE as Spring Boot Server
    participant OC as OrderController
    participant OS as OrderService
    participant POC as PayOSController
    participant POS as PayOSService
    participant PAY as PayOS Gateway
    participant DB as MariaDB

    Note over U,FE: Phase 1: Checkout từ Cart
    U->>FE: Click "Thanh toán"
    FE->>BE: POST /api/v1/orders/checkout<br/>Header: Authorization: Bearer JWT<br/>Body: {cartItemIds, paymentMethod: "PAYOS", address}
    BE->>OC: checkoutFromCart(user, request)
    OC->>OS: checkoutFromCart(user, CheckoutRequestDTO)
    
    OS->>DB: cartRepository.findByUser(user)
    DB-->>OS: Cart with items
    OS->>OS: Validate cart items
    OS->>OS: Check stock availability
    
    OS->>DB: Create Order (status=PENDING)
    DB-->>OS: Order with orderCode
    
    loop For each CartItem
        OS->>DB: Create OrderItem
        OS->>DB: Decrease ProductVariant.stockQuantity
    end
    
    OS->>DB: Remove checkout items from Cart
    OS-->>OC: Order entity
    OC-->>BE: {orderCode, totalAmount, status: PENDING}
    BE-->>FE: Order response

    Note over U,PAY: Phase 2: Create PayOS Payment Link
    FE->>BE: POST /api/v1/payment/payos/create<br/>Body: {orderCode, amount, description}
    BE->>POC: createPayment(request)
    POC->>POS: createPaymentLink(amount, desc, orderCode, returnUrl, cancelUrl)
    
    POS->>POS: Generate signature (HMAC-SHA256)
    POS->>PAY: POST /v2/payment-requests<br/>{orderCode, amount, signature, returnUrl, cancelUrl}
    PAY-->>POS: {code: "00", checkoutUrl, paymentLinkId}
    
    POS->>DB: Update Order.paymentLinkId
    POS-->>POC: PayOS response
    POC-->>BE: {checkoutUrl: "https://pay.payos.vn/..."}
    BE-->>FE: checkoutUrl
    
    FE->>U: Redirect to PayOS checkout page
    U->>PAY: Thanh toán (QR/Bank)
    
    Note over PAY,DB: Phase 3: Webhook callback
    PAY->>BE: POST /api/v1/payment/payos/webhook<br/>{code, orderCode, data, signature}
    BE->>POC: handleWebhook(webhookData)
    POC->>POS: verifyWebhook(webhookData)
    POS->>POS: Verify HMAC-SHA256 signature
    POS-->>POC: true (valid)
    
    alt Payment Success (code = "00")
        POC->>DB: Update Order.status = PAID
        POC-->>BE: {error: "0", message: "Success"}
    else Payment Failed
        POC->>DB: Update Order.status = CANCELLED
        POC->>DB: Restore stock quantities
        POC-->>BE: {error: code, message: desc}
    end
    
    Note over PAY,U: Phase 4: Return to Frontend
    PAY->>BE: GET /api/v1/payment/payos/return<br/>?code=00&orderCode=xxx
    BE->>POC: handleReturn(params)
    POC->>POC: Validate payment status
    POC-->>U: Redirect to FE /payment-result?status=success
    FE-->>U: Hiển thị "Thanh toán thành công"
```

### 3.4 Chi tiết từng bước

| Phase | Step | Actor | Service | Action | Data |
|-------|------|-------|---------|--------|------|
| 1 | 1-10 | User→Server | OrderService | Create Order | CartItems → Order |
| 1 | 11-13 | OrderService | MariaDB | Save Order, Items, Update Stock | Entities |
| 2 | 14-20 | Server | PayOS | Create payment link | orderCode → checkoutUrl |
| 2 | 21 | User | PayOS | Complete payment | Bank/QR |
| 3 | 22-27 | PayOS | Server | Webhook callback | Signature verify |
| 3 | 28-30 | Server | MariaDB | Update order status | PAID/CANCELLED |
| 4 | 31-33 | PayOS | Client | Redirect with result | status, message |

---

## 4. Tạo Khuyến Mãi (Create Promotion)

### 4.1 Mô tả
Admin/Employee tạo chương trình khuyến mãi với các điều kiện và quà tặng.

### 4.2 Các thành phần tham gia
| Thành phần | Vai trò |
|------------|---------|
| **Client (React)** | Giao diện quản lý khuyến mãi |
| **Server (Spring Boot)** | Xử lý logic promotion |
| **MariaDB** | Lưu Promotion, Conditions, GiftItems |

### 4.3 Sơ đồ tuần tự

```mermaid
sequenceDiagram
    autonumber
    participant U as Admin/Employee
    participant FE as Client React
    participant BE as Spring Boot Server
    participant SEC as SecurityFilter
    participant PMC as PromotionController
    participant PMS as PromotionServiceImpl
    participant DB as MariaDB

    U->>FE: Điền form tạo khuyến mãi<br/>(tên, loại giảm giá, điều kiện, quà tặng)
    FE->>BE: POST /api/v1/promotions<br/>Header: Authorization: Bearer JWT<br/>Body: PromotionRequestDTO
    
    BE->>SEC: Validate JWT Token
    SEC->>SEC: Check role: ADMIN or EMPLOYEE
    SEC-->>BE: Authorization OK
    
    BE->>PMC: createPromotion(@Valid PromotionRequestDTO)
    PMC->>PMC: @Valid validate request
    PMC->>PMS: createPromotion(request)
    
    PMS->>PMS: Validate discountType & discountAmount
    PMS->>PMS: Build Promotion entity
    
    Note over PMS,DB: Build Conditions (điều kiện áp dụng)
    loop For each ConditionGroup
        PMS->>PMS: Create PromotionCondition
        loop For each ConditionDetail
            PMS->>DB: productRepository.findById(productId)
            DB-->>PMS: Product entity
            PMS->>PMS: Create PromotionConditionDetail
        end
    end
    
    Note over PMS,DB: Build GiftItems (quà tặng)
    loop For each GiftItem
        PMS->>DB: productRepository.findById(productId)
        DB-->>PMS: Product entity
        PMS->>PMS: Create PromotionGiftItem
    end
    
    PMS->>DB: promotionRepository.save(promotion)
    DB-->>PMS: Promotion entity (with ID)
    
    PMS-->>PMC: Promotion entity
    PMC-->>BE: Promotion response
    BE-->>FE: {status: 200, data: Promotion}
    FE-->>U: Hiển thị "Tạo khuyến mãi thành công"
```

### 4.4 Chi tiết dữ liệu

**Request PromotionRequestDTO:**
```json
{
  "name": "Mua 2 tặng 1",
  "thumbnailUrl": "https://cloudinary.com/...",
  "description": "Mua 2 sản phẩm được tặng 1",
  "discountType": "FREE_GIFT",
  "discountAmount": null,
  "conditions": [{
    "conditionType": "BUY_TOGETHER",
    "details": [
      {"productId": 1, "requiredQuantity": 2}
    ]
  }],
  "giftItems": [
    {"productId": 5, "quantity": 1}
  ]
}
```

| Step | Actor | Service | Action | Data |
|------|-------|---------|--------|------|
| 1-2 | User→Server | - | Send request | PromotionRequestDTO |
| 3-5 | SecurityFilter | - | Auth + Role check | JWT → OK |
| 6-9 | PromotionService | - | Validate & Build | DTO → Entity |
| 10-15 | PromotionService | MariaDB | Save conditions | Condition entities |
| 16-18 | PromotionService | MariaDB | Save gift items | GiftItem entities |
| 19-22 | PromotionService | MariaDB | Save promotion | Promotion entity |

---

## 5. Authentication (Đăng Nhập / Đăng Ký)

### 5.1 Mô tả
Xác thực người dùng qua username/password, tạo JWT token và refresh token.

### 5.2 Các thành phần tham gia
| Thành phần | Vai trò |
|------------|---------|
| **Client (React)** | Form đăng nhập/đăng ký |
| **Server (Spring Boot)** | Xử lý authentication |
| **BCrypt** | Mã hóa password |
| **JWT (SecurityUtil)** | Tạo và verify token |
| **MariaDB** | Lưu User, verify credentials |

### 5.3 Sơ đồ tuần tự - Login

```mermaid
sequenceDiagram
    autonumber
    participant U as User
    participant FE as Client React
    participant BE as Spring Boot Server
    participant AC as AuthController
    participant AM as AuthenticationManager
    participant UDS as UserDetailsService
    participant SEC as SecurityUtil
    participant DB as MariaDB

    U->>FE: Nhập username/password
    FE->>BE: POST /api/v1/login<br/>Body: {username, password}
    BE->>AC: login(@RequestBody LoginDTO)
    
    AC->>AC: Create UsernamePasswordAuthenticationToken
    AC->>AM: authenticate(authToken)
    AM->>UDS: loadUserByUsername(username)
    
    UDS->>DB: userRepository.findByEmail(username)
    DB-->>UDS: User entity
    
    UDS->>UDS: Verify password (BCrypt.matches)
    UDS->>UDS: Build UserDetails with authorities<br/>(ROLE_ADMIN, ROLE_USER, etc.)
    UDS-->>AM: UserDetails
    AM-->>AC: Authentication object
    
    Note over AC,SEC: Tạo JWT Tokens
    AC->>SEC: createToken(authentication)
    SEC->>SEC: Build JWT claims:<br/>- sub: username<br/>- truonggiang: {user info}<br/>- authorities: [roles]<br/>- exp: +24 hours
    SEC->>SEC: Sign with HS512 secret key
    SEC-->>AC: accessToken (JWT)
    
    AC->>SEC: createRefreshToken(username)
    SEC->>SEC: Build refresh token:<br/>- sub: username<br/>- type: "refresh"<br/>- exp: +30 days
    SEC-->>AC: refreshToken (JWT)
    
    Note over AC,FE: Set cookies & response
    AC->>AC: Create HttpOnly cookie<br/>(name: refreshToken, path: /api/v1)
    AC->>BE: Add cookie to response
    
    AC-->>BE: ResponseLoginDTO {accessToken, refreshToken}
    BE-->>FE: {status: 200, data: {accessToken, refreshToken}}
    
    FE->>FE: Store accessToken (localStorage)
    FE-->>U: Redirect to Home page
```

### 5.4 Sơ đồ tuần tự - Register

```mermaid
sequenceDiagram
    autonumber
    participant U as User
    participant FE as Client React
    participant BE as Spring Boot Server
    participant AC as AuthController
    participant US as UserService
    participant DB as MariaDB

    U->>FE: Điền form đăng ký<br/>(username, email, password)
    FE->>BE: POST /api/v1/register<br/>Body: RegisterDTO
    BE->>AC: register(@Valid RegisterDTO)
    
    AC->>AC: @Valid validate request
    
    AC->>DB: userRepository.findByEmail(email)
    alt Email exists
        DB-->>AC: User found
        AC-->>BE: Error: "Email đã tồn tại"
        BE-->>FE: {status: 400, message: "Email đã tồn tại"}
    else Email available
        DB-->>AC: null
    end
    
    AC->>AC: Create User entity:<br/>- role: ROLE_USER<br/>- isActive: true<br/>- password: BCrypt.encode(password)
    
    AC->>US: createUser(user)
    US->>DB: userRepository.save(user)
    DB-->>US: User entity (with ID)
    US-->>AC: Created User
    
    AC-->>BE: APIResponse {data: User}
    BE-->>FE: {status: 200, data: User, message: "Đăng ký thành công"}
    FE-->>U: Hiển thị thông báo & redirect to Login
```

### 5.5 Sơ đồ tuần tự - Refresh Token

```mermaid
sequenceDiagram
    autonumber
    participant FE as Client React
    participant BE as Spring Boot Server
    participant AC as AuthController
    participant SEC as SecurityUtil
    participant UDS as UserDetailsService
    participant DB as MariaDB

    Note over FE: Access token expired (401)
    FE->>BE: POST /api/v1/refresh<br/>Cookie: refreshToken=xxx
    BE->>AC: refresh(request, response)
    
    AC->>AC: Extract refreshToken from cookie
    AC->>SEC: getUsernameFromRefreshToken(refreshToken)
    SEC->>SEC: Decode & validate JWT
    SEC->>SEC: Check token type = "refresh"
    SEC->>SEC: Check not expired
    SEC-->>AC: username
    
    AC->>UDS: loadUserByUsername(username)
    UDS->>DB: userRepository.findByEmail(username)
    DB-->>UDS: User entity
    UDS-->>AC: UserDetails
    
    AC->>AC: Create new Authentication
    
    AC->>SEC: createToken(authentication)
    SEC-->>AC: newAccessToken
    
    AC->>SEC: createRefreshToken(username)
    SEC-->>AC: newRefreshToken
    
    Note over AC: Token Rotation - new refresh token
    AC->>AC: Set new refreshToken cookie
    AC-->>BE: ResponseLoginDTO {accessToken: new}
    BE-->>FE: {accessToken: "new_token"}
    
    FE->>FE: Update stored accessToken
    FE->>BE: Retry original request with new token
```

### 5.6 Chi tiết JWT Token Structure

**Access Token Claims:**
```json
{
  "sub": "user@example.com",
  "truonggiang": {
    "id": 1,
    "username": "user",
    "email": "user@example.com",
    "roles": ["ROLE_USER"]
  },
  "authorities": ["ROLE_USER"],
  "iat": 1702134000,
  "exp": 1702220400
}
```

**Refresh Token Claims:**
```json
{
  "sub": "user@example.com",
  "type": "refresh",
  "iat": 1702134000,
  "exp": 1704726000
}
```

| Token Type | Lifetime | Storage | Usage |
|------------|----------|---------|-------|
| Access Token | 24 hours | localStorage | API requests header |
| Refresh Token | 30 days | HttpOnly Cookie | Get new access token |

---

## Tổng Kết Architecture

```mermaid
flowchart TB
    subgraph Client["Client (React)"]
        UI[User Interface]
        LS[LocalStorage - Access Token]
    end
    
    subgraph Server["Spring Boot Server"]
        SF[SecurityFilter - JWT]
        C[Controllers]
        S[Services]
    end
    
    subgraph External["External Services"]
        GE[Gemini AI - Embedding]
        CL[Cloudinary - Images]
        PAY[PayOS - Payment]
    end
    
    subgraph Database["Databases"]
        MA[MariaDB - Main Data]
        CH[ChromaDB - Vectors]
    end
    
    UI --> SF
    SF --> C
    C --> S
    S --> MA
    S --> GE
    S --> CH
    S --> CL
    S --> PAY
```

| Use Case | External Services | Databases |
|----------|------------------|-----------|
| Tạo sản phẩm | Cloudinary | MariaDB |
| Gợi ý AI | Gemini, ChromaDB | MariaDB |
| Thanh toán | PayOS | MariaDB |
| Khuyến mãi | - | MariaDB |
| Authentication | - | MariaDB |
