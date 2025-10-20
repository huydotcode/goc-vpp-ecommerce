# User Management Client - Thymeleaf CRUD Application

Ứng dụng quản lý User sử dụng Spring Boot + Thymeleaf với JWT Authentication.

## 🚀 Tính năng

- ✅ Đăng nhập với JWT Token
- ✅ Quản lý Users (CRUD)
- ✅ Lưu trữ Access Token vào localStorage và Cookie
- ✅ Tự động gửi Bearer Token trong HTTP Header
- ✅ UI Bootstrap 5 đẹp mắt và responsive

## 📋 Yêu cầu

- Java 21
- Spring Boot 3.5.6
- Backend API (spring-jwt-base) đang chạy trên port 8080

## 🛠️ Cài đặt

1. **Đảm bảo Backend đang chạy:**
   ```bash
   cd ../spring-jwt-base
   ./gradlew bootRun
   ```

2. **Chạy Client Application:**
   ```bash
   cd client
   ./gradlew bootRun
   ```

3. **Truy cập ứng dụng:**
   ```
   http://localhost:8081
   ```

## 🔐 Cách hoạt động JWT Authentication

### 1. Login Process
- User nhập username và password
- Client gửi request đến `/login` (Backend API)
- Backend trả về `accessToken`
- Client lưu token vào:
  - Cookie (HTTP-Only = false để JavaScript có thể truy cập)
  - localStorage (để persist khi reload trang)

### 2. API Calls với Bearer Token
Mỗi khi gọi API, `UserService` tự động:
```java
private HttpHeaders createHeaders() {
    HttpHeaders headers = new HttpHeaders();
    headers.setContentType(MediaType.APPLICATION_JSON);
    String token = tokenService.getToken();
    if (token != null && !token.isEmpty()) {
        headers.setBearerAuth(token); // Thêm Bearer Token
    }
    return headers;
}
```

### 3. Token Management
- `TokenService`: Quản lý token trong Cookie
- JavaScript trong HTML: Sync token giữa localStorage và Cookie
- Auto redirect về `/login` nếu không có token

## 📁 Cấu trúc Project

```
client/
├── src/main/java/www/java/client/
│   ├── ClientApplication.java          # Main application
│   ├── controller/
│   │   ├── AuthController.java         # Login/Logout controller
│   │   └── UserController.java         # User CRUD controller
│   ├── service/
│   │   ├── AuthService.java           # Authentication service
│   │   ├── TokenService.java          # Token management
│   │   └── UserService.java           # User API calls
│   └── model/
│       ├── User.java                   # User model
│       ├── LoginRequest.java           # Login DTO
│       └── LoginResponse.java          # Login response DTO
└── src/main/resources/
    ├── application.properties          # App configuration
    └── templates/
        ├── login.html                  # Login page
        └── users/
            ├── list.html               # User list page
            ├── form.html               # Create/Edit form
            └── view.html               # User detail page
```

## 🎨 UI Screenshots

### Login Page
- Form đăng nhập đẹp mắt với Bootstrap 5
- Thông báo lỗi/thành công
- Auto save token vào localStorage

### User List
- Hiển thị danh sách users dạng table
- Có avatar, status badge
- Actions: View, Edit, Delete
- Button thêm user mới

### Create/Edit Form
- Form validation
- Username read-only khi edit
- Password chỉ hiện khi create
- Switch button cho Active status

### User Detail
- Hiển thị đầy đủ thông tin user
- Avatar lớn
- Các button: Edit, Delete, Back

## 🔧 Configuration

File `application.properties`:
```properties
# Server chạy port 8081 để tránh conflict với backend (8080)
server.port=8081

# Backend API URL
backend.api.url=http://localhost:8080

# Thymeleaf configuration
spring.thymeleaf.cache=false
spring.thymeleaf.enabled=true
```

## 📝 API Endpoints (Client)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Redirect to login |
| GET | `/login` | Login page |
| POST | `/login` | Process login |
| GET | `/logout` | Logout |
| GET | `/users` | List all users |
| GET | `/users/new` | Create user form |
| POST | `/users` | Create user |
| GET | `/users/edit/{id}` | Edit user form |
| POST | `/users/update/{id}` | Update user |
| GET | `/users/view/{id}` | View user detail |
| GET | `/users/delete/{id}` | Delete user |

## 🔒 Security Flow

1. **Login:**
   ```
   User → Login Form → AuthController → AuthService → Backend API
   ← Token ← Save to Cookie & localStorage
   ```

2. **API Call:**
   ```
   User Action → Controller → UserService
   → Get Token from TokenService
   → Add Bearer Token to Header
   → Call Backend API
   ← Response
   ```

3. **Token Sync:**
   ```javascript
   // Trong mỗi HTML template
   window.addEventListener('load', function() {
       const token = localStorage.getItem('access_token');
       if (token) {
           document.cookie = `access_token=${token}; path=/; max-age=86400`;
       } else {
           window.location.href = '/login';
       }
   });
   ```

## 🐛 Troubleshooting

### Không kết nối được Backend
- Kiểm tra Backend có đang chạy không: `http://localhost:8080`
- Kiểm tra CORS configuration trong Backend

### Token không được lưu
- Mở Developer Tools → Application → Cookies
- Mở Console → localStorage
- Kiểm tra có `access_token` không

### API trả về 401 Unauthorized
- Token có thể đã hết hạn
- Logout và login lại

## 📚 Dependencies

```gradle
dependencies {
    implementation("org.springframework.boot:spring-boot-starter-web")
    implementation("org.springframework.boot:spring-boot-starter-thymeleaf")
    implementation("org.springframework.boot:spring-boot-starter-validation")
    implementation("org.springframework.boot:spring-boot-devtools")
}
```

## 🎯 Next Steps

- [ ] Thêm pagination cho user list
- [ ] Thêm search/filter functionality
- [ ] Thêm form validation với JavaScript
- [ ] Thêm loading spinner khi gọi API
- [ ] Thêm refresh token mechanism
- [ ] Thêm role-based access control

## 👨‍💻 Developer Notes

### Token Management Strategy
- **Cookie**: Dùng để server-side đọc token
- **localStorage**: Dùng để persist token khi user reload page
- **Sync**: JavaScript sync giữa localStorage và Cookie mỗi khi load page

### Why RestTemplate?
- Simple và dễ sử dụng
- Có thể nâng cấp lên WebClient nếu cần async

### Error Handling
- Try-catch trong Service layer
- Return null hoặc empty list khi có lỗi
- Controller check null và hiển thị message phù hợp

---

**Chúc bạn code vui vẻ! 🎉**
