# 🛒 E-Commerce Fullstack Application

<div align="center">

![Java](https://img.shields.io/badge/Java-21-orange?style=for-the-badge&logo=openjdk)
![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.5-green?style=for-the-badge&logo=springboot)
![React](https://img.shields.io/badge/React-19-blue?style=for-the-badge&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue?style=for-the-badge&logo=typescript)
![MariaDB](https://img.shields.io/badge/MariaDB-10.6-brown?style=for-the-badge&logo=mariadb)

**Một ứng dụng thương mại điện tử fullstack hiện đại với tích hợp AI và thanh toán trực tuyến**

</div>

---

## 📋 Mục Lục

- [Giới Thiệu](#-giới-thiệu)
- [Tính Năng](#-tính-năng)
- [Công Nghệ Sử Dụng](#-công-nghệ-sử-dụng)
- [Kiến Trúc Hệ Thống](#-kiến-trúc-hệ-thống)
- [Cài Đặt](#-cài-đặt)
- [Cấu Hình](#-cấu-hình)
- [Chạy Ứng Dụng](#-chạy-ứng-dụng)
- [API Documentation](#-api-documentation)
- [Cấu Trúc Dự Án](#-cấu-trúc-dự-án)
- [Screenshots](#-screenshots)

---

## 🎯 Giới Thiệu

Đây là một dự án **E-Commerce Fullstack** hoàn chỉnh được xây dựng với mục đích học tập và thực hành các công nghệ web hiện đại. Ứng dụng cung cấp đầy đủ các chức năng của một website bán hàng trực tuyến, từ quản lý sản phẩm, giỏ hàng, đặt hàng cho đến thanh toán trực tuyến và tích hợp AI gợi ý sản phẩm.

### 🎓 Mục Tiêu Dự Án

- Xây dựng ứng dụng web fullstack với kiến trúc hiện đại
- Tích hợp AI (Gemini + ChromaDB) cho hệ thống gợi ý sản phẩm thông minh
- Triển khai xác thực an toàn với JWT và OAuth2 (Google Login)
- Tích hợp cổng thanh toán (PayOS/VnPay)
- Quản lý hình ảnh với Cloudinary

---

## ✨ Tính Năng

### 🛍️ Dành Cho Khách Hàng

| Tính Năng | Mô Tả |
|-----------|-------|
| **Xem Sản Phẩm** | Duyệt danh mục, tìm kiếm, lọc theo giá, thương hiệu |
| **Chi Tiết Sản Phẩm** | Xem thông tin, hình ảnh, đánh giá, biến thể sản phẩm |
| **Giỏ Hàng** | Thêm, xóa, cập nhật số lượng sản phẩm |
| **Đặt Hàng** | Checkout với nhiều địa chỉ giao hàng |
| **Thanh Toán** | Hỗ trợ PayOS, VnPay, COD |
| **Khuyến Mãi** | Áp dụng mã giảm giá, quà tặng kèm |
| **AI Gợi Ý** | Gợi ý sản phẩm dựa trên lịch sử xem/mua |
| **Đánh Giá** | Viết review và cho điểm sản phẩm |
| **Quản Lý Đơn** | Theo dõi trạng thái đơn hàng |
| **Hồ Sơ** | Quản lý thông tin cá nhân, địa chỉ |

### 👨‍💼 Dành Cho Admin

| Tính Năng | Mô Tả |
|-----------|-------|
| **Dashboard** | Thống kê doanh thu, đơn hàng, khách hàng |
| **Quản Lý Sản Phẩm** | CRUD sản phẩm, biến thể, hình ảnh |
| **Quản Lý Danh Mục** | Tổ chức danh mục sản phẩm |
| **Quản Lý Đơn Hàng** | Xử lý, cập nhật trạng thái đơn |
| **Quản Lý Khuyến Mãi** | Tạo promotion với điều kiện đa dạng |
| **Quản Lý Người Dùng** | Phân quyền, quản lý tài khoản |
| **Import/Export** | Nhập xuất dữ liệu Excel/CSV |

### 🔐 Bảo Mật

- ✅ Xác thực JWT (JSON Web Token)
- ✅ OAuth2 với Google Login
- ✅ Phân quyền RBAC (Role-Based Access Control)
- ✅ Password hashing với BCrypt

---

## 🛠️ Công Nghệ Sử Dụng

### Backend

| Công Nghệ | Phiên Bản | Mục Đích |
|-----------|-----------|----------|
| **Java** | 21 | Ngôn ngữ lập trình chính |
| **Spring Boot** | 3.5.4 | Framework phát triển web |
| **Spring Security** | 6.x | Xác thực & phân quyền |
| **Spring Data JPA** | 3.x | ORM và truy vấn database |
| **MariaDB** | 10.6+ | Cơ sở dữ liệu quan hệ |
| **Lombok** | 1.18.36 | Giảm boilerplate code |
| **Cloudinary** | 1.39.0 | Lưu trữ hình ảnh đám mây |
| **SpringDoc OpenAPI** | 2.7.0 | API Documentation (Swagger) |
| **OkHttp** | 4.12.0 | HTTP Client cho ChromaDB |

### Frontend

| Công Nghệ | Phiên Bản | Mục Đích |
|-----------|-----------|----------|
| **React** | 19.2 | UI Library |
| **TypeScript** | 5.9 | Type-safe JavaScript |
| **Vite** | 7.2 | Build tool & dev server |
| **Ant Design** | 5.28 | UI Component Library |
| **TailwindCSS** | 4.1 | Utility-first CSS |
| **TanStack Query** | 5.90 | Data fetching & caching |
| **React Router** | 7.9 | Client-side routing |
| **Axios** | 1.13 | HTTP Client |
| **Framer Motion** | 12.x | Animations |

### AI & Vector Search

| Công Nghệ | Mục Đích |
|-----------|----------|
| **Google Gemini** | Text Embedding (text-embedding-004) |
| **ChromaDB** | Vector Database cho semantic search |

### Thanh Toán

| Cổng Thanh Toán | Mô Tả |
|-----------------|-------|
| **PayOS** | Thanh toán qua QR code, chuyển khoản |
| **VnPay** | Cổng thanh toán phổ biến tại Việt Nam |
| **COD** | Thanh toán khi nhận hàng |

---

## 🏗️ Kiến Trúc Hệ Thống

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT (React)                           │
│   ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │
│   │   Pages     │  │ Components  │  │  Services/API Layer     │ │
│   └─────────────┘  └─────────────┘  └─────────────────────────┘ │
└───────────────────────────┬─────────────────────────────────────┘
                            │ HTTP/REST
┌───────────────────────────▼─────────────────────────────────────┐
│                     SERVER (Spring Boot)                         │
│   ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │
│   │ Controllers │──│  Services   │──│     Repositories        │ │
│   └─────────────┘  └─────────────┘  └───────────┬─────────────┘ │
│                           │                      │               │
│                    ┌──────▼──────┐               │               │
│                    │ AI Vector   │               │               │
│                    │  Service    │               │               │
│                    └──────┬──────┘               │               │
└───────────────────────────┼──────────────────────┼───────────────┘
                            │                      │
              ┌─────────────▼─────┐     ┌──────────▼──────────┐
              │     ChromaDB      │     │      MariaDB        │
              │  (Vector Store)   │     │   (Relational DB)   │
              └─────────────────┬─┘     └─────────────────────┘
                                │
              ┌─────────────────▼─────────────────┐
              │         Google Gemini API          │
              │      (Text Embedding Service)      │
              └────────────────────────────────────┘
```

---

## 📦 Cài Đặt

### Yêu Cầu Hệ Thống

- **Java 21** hoặc cao hơn
- **Node.js 18+** và npm
- **MariaDB 10.6+**
- **ChromaDB** (Docker recommended)
- **Git**

### 1. Clone Repository

```bash
git clone https://github.com/your-username/www-java-fullstack.git
cd www-java-fullstack
```

### 2. Cài Đặt Database

```bash
# Tạo database MariaDB
mysql -u root -p
CREATE DATABASE ecommerce_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 3. Cài Đặt ChromaDB (Docker)

```bash
docker run -d -p 8000:8000 chromadb/chroma
```

### 4. Cài Đặt Backend Dependencies

```bash
cd server
./gradlew build
```

### 5. Cài Đặt Frontend Dependencies

```bash
cd client
npm install
```

---

## ⚙️ Cấu Hình

### Backend (`server/src/main/resources/application.properties`)

```properties
# Database
spring.datasource.url=jdbc:mariadb://localhost:3306/ecommerce_db
spring.datasource.username=your_username
spring.datasource.password=your_password

# JWT Secret
spring.security.jwt.secret-key=your-secret-key-here

# Cloudinary
cloudinary.cloud-name=your-cloud-name
cloudinary.api-key=your-api-key
cloudinary.api-secret=your-api-secret

# Google OAuth2
spring.security.oauth2.client.registration.google.client-id=your-client-id
spring.security.oauth2.client.registration.google.client-secret=your-client-secret

# PayOS
payos.client-id=your-payos-client-id
payos.api-key=your-payos-api-key
payos.checksum-key=your-payos-checksum-key

# Gemini AI
gemini.api-key=your-gemini-api-key

# ChromaDB
chroma.url=http://localhost:8000
chroma.collection=products
```

### Frontend (`client/.env`)

```env
VITE_API_URL=http://localhost:8080/api/v1
```

---

## 🚀 Chạy Ứng Dụng

### Chạy Backend

```bash
cd server
./gradlew bootRun
```

Backend sẽ chạy tại: `http://localhost:8080`

### Chạy Frontend

```bash
cd client
npm run dev
```

Frontend sẽ chạy tại: `http://localhost:5173`

### Index Sản Phẩm vào ChromaDB (AI Search)

```bash
cd server/scripts/ai
$env:GEMINI_API_KEY="your-gemini-api-key"
node indexChroma.js
```

---

## 📚 API Documentation

Sau khi chạy backend, truy cập Swagger UI:

```
http://localhost:8080/swagger-ui/index.html
```

### Các Endpoint Chính

| Method | Endpoint | Mô Tả |
|--------|----------|-------|
| `POST` | `/api/v1/login` | Đăng nhập |
| `POST` | `/api/v1/register` | Đăng ký |
| `GET` | `/api/v1/products` | Danh sách sản phẩm |
| `GET` | `/api/v1/products/{id}` | Chi tiết sản phẩm |
| `GET` | `/api/v1/categories` | Danh mục sản phẩm |
| `POST` | `/api/v1/cart` | Thêm vào giỏ hàng |
| `POST` | `/api/v1/orders` | Tạo đơn hàng |
| `GET` | `/api/v1/ai/recommend` | AI gợi ý sản phẩm |

---

## 📂 Cấu Trúc Dự Án

```
www-java-fullstack/
├── 📁 server/                      # Backend Spring Boot
│   ├── 📁 src/main/java/
│   │   └── 📁 com/example/learnspring1/
│   │       ├── 📁 config/          # Cấu hình (Security, CORS, etc.)
│   │       ├── 📁 controller/      # REST Controllers
│   │       ├── 📁 domain/          # Entities & DTOs
│   │       ├── 📁 repository/      # JPA Repositories
│   │       ├── 📁 service/         # Business Logic
│   │       └── 📁 utils/           # Utilities
│   ├── 📁 scripts/ai/              # AI indexing scripts
│   └── 📄 build.gradle.kts         # Gradle build config
│
├── 📁 client/                      # Frontend React
│   ├── 📁 src/
│   │   ├── 📁 api/                 # API client functions
│   │   ├── 📁 components/          # React components
│   │   ├── 📁 pages/               # Page components
│   │   ├── 📁 hooks/               # Custom React hooks
│   │   ├── 📁 services/            # Business services
│   │   ├── 📁 types/               # TypeScript interfaces
│   │   └── 📁 utils/               # Helper functions
│   ├── 📄 package.json
│   └── 📄 vite.config.ts
│
└── 📄 README.md
```

---

## 📸 Screenshots

> *Thêm screenshots của ứng dụng tại đây*

### Trang Chủ
<!-- ![Home Page](./docs/screenshots/home.png) -->

### Trang Sản Phẩm
<!-- ![Products Page](./docs/screenshots/products.png) -->

### Giỏ Hàng
<!-- ![Cart Page](./docs/screenshots/cart.png) -->

### Trang Admin
<!-- ![Admin Dashboard](./docs/screenshots/admin.png) -->

---

## 👥 Đóng Góp

Mọi đóng góp đều được chào đón! Vui lòng đọc [CONTRIBUTING.md](./client/CONTRIBUTING.md) để biết thêm chi tiết.

---

## 📄 License

Dự án này được phát hành dưới giấy phép MIT. Xem file [LICENSE](./LICENSE) để biết thêm chi tiết.

---

<div align="center">

**Made with ❤️ by Developer**

</div>
