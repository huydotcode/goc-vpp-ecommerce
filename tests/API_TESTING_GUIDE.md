# Hướng Dẫn Test API Authentication & Refresh Token

## 1. Chuẩn Bị

### Yêu cầu:
- Backend chạy trên `http://localhost:8080`
- Postman hoặc Insomnia (tùy chọn, có thể dùng web)
- Database MariaDB đang chạy

### Bước 1: Khởi động Backend
```bash
# Terminal 1 - Di chuyển vào thư mục spring-jwt-base
cd C:\Courses\pj\www-java-fullstack\spring-jwt-base

# Build project
./gradlew build

# Chạy ứng dụng
./gradlew bootRun
```

Khi thành công sẽ thấy:
```
Started ... in ... seconds
Application running at: http://localhost:8080
```

---

## 2. Test API Login (Đăng Nhập)

### 2.1 Sử dụng Postman

**Bước 1: Tạo Request**
- Method: `POST`
- URL: `http://localhost:8080/api/v1/login`

**Bước 2: Headers**
```
Content-Type: application/json
```

**Bước 3: Body (raw JSON)**
```json
{
    "username": "root_admin@system.local",
    "password": "123123"
}
```

**Bước 4: Gửi Request**
- Nhấn "Send"

**Kết quả mong đợi (200 OK):**
```json
{
    "status": "success",
    "message": "Request processed successfully",
    "data": {
        "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJsZWFybnNwcmluZzEiLCJpYXQiOjE3MzEyNzU2MDAsImV4cCI6MTczMTM2MjAwMCwiY2xhaW1zIjoiLi4uIiwic3ViIjoicm9vdF9hZG1pbkBzeXN0ZW0ubG9jYWwifQ...."
    },
    "errors": null
}
```

**Kiểm tra Cookie:**
- Mở Developer Tools (F12) → Network
- Tìm request `/login`
- Tab Cookies → Thấy `refreshToken` (HTTP-only cookie)

**Lưu Access Token:**
- Copy giá trị `accessToken`
- Lưu vào Postman Environment hoặc biến tạm thời

---

## 3. Test API Refresh Token

### 3.1 Sử dụng Postman (Tự động gửi Cookie)

**Bước 1: Tạo Request Refresh**
- Method: `POST`
- URL: `http://localhost:8080/api/v1/refresh`

**Bước 2: Headers**
```
Content-Type: application/json
```

**Lưu ý:** Postman **tự động** gửi cookies từ request `/login` trước đó nếu cookie path matching.

**Bước 3: Gửi Request (không cần Body)**
- Nhấn "Send"

**Kết quả mong đợi (200 OK):**
```json
{
    "status": "success",
    "message": "Request processed successfully",
    "data": {
        "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJsZWFybnNwcmluZzEiLCJpYXQiOjE3MzEyNzU2MDEsImV4cCI6MTczMTM2MjAwMSwiY2xhaW1zIjoiLi4uIiwic3ViIjoicm9vdF9hZG1pbkBzeXN0ZW0ubG9jYWwifQ...."
    },
    "errors": null
}
```

**Refresh Token xoay (Rotated):**
- Cookie `refreshToken` được cấp lại với giá trị mới

### 3.2 Nếu Cookie Không Gửi Tự Động

**Giải pháp 1: Kiểm tra Cookie Path**
- F12 → Application → Cookies
- Xem `refreshToken` có path `/api/v1` không
- Nếu có, Postman phải gửi request đúng path

**Giải pháp 2: Gửi Cookie Thủ Công**
- Tìm giá trị cookie từ request login
- Trong Postman: Tab `Cookies` → Thêm manual cookie:
  ```
  Name: refreshToken
  Value: [giá trị token từ login]
  Domain: localhost
  Path: /api/v1
  ```

**Giải pháp 3: Test với curl (Terminal)**
```bash
# Lưu cookie từ login vào file
curl -c cookies.txt -X POST http://localhost:8080/api/v1/login \
  -H "Content-Type: application/json" \
  -d '{"username":"root_admin@system.local","password":"123123"}'

# Sử dụng cookie từ file để gọi refresh
curl -b cookies.txt -X POST http://localhost:8080/api/v1/refresh
```

---

## 4. Test Protected API (API Cần Xác Thực)

### 4.1 Ví Dụ: Gọi API Bảo Vệ

**Bước 1: Tạo Request Mới**
- Method: `GET`
- URL: `http://localhost:8080/api/v1/[protected-endpoint]`

**Bước 2: Headers - Thêm Access Token**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJsZWFybnNwcmluZzEiLCJpYXQiOjE3MzEyNzU2MDAsImV4cCI6MTczMTM2MjAwMCwiY2xhaW1zIjoiLi4uIiwic3ViIjoicm9vdF9hZG1pbkBzeXN0ZW0ubG9jYWwifQ....
```

**Bước 3: Gửi Request**
- Nhấn "Send"

**Kết quả mong đợi:**
- 200 OK nếu token hợp lệ
- 401 Unauthorized nếu token không hợp lệ / hết hạn

### 4.2 Tự Động Thêm Token (Postman Environment)

**Bước 1: Tạo Environment**
- Tab "Environments" → "Create"
- Tên: `Local Development`

**Bước 2: Thêm Variable**
```
VARIABLE NAME: accessToken
INITIAL VALUE: (để trống)
CURRENT VALUE: (để trống)
```

**Bước 3: Update từ Login Response**
- Sau khi login thành công
- Scripts tab → Thêm script:
```javascript
if (pm.response.code === 200) {
    var jsonData = pm.response.json();
    pm.environment.set("accessToken", jsonData.data.accessToken);
}
```

**Bước 4: Sử dụng Token trong Requests**
- Headers:
```
Authorization: Bearer {{accessToken}}
```

---

## 5. Test Flow Hoàn Chỉnh (Step-by-Step)

### Scenario: Đăng Nhập → Gọi API → Hết Hạn Token → Refresh → Gọi Lại

#### Step 1: Login
```bash
curl -c cookies.txt -X POST http://localhost:8080/api/v1/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "root_admin@system.local",
    "password": "123123"
  }'
```
**Lưu:** `accessToken` từ response

#### Step 2: Gọi Protected API ngay lập tức
```bash
curl -b cookies.txt -X GET http://localhost:8080/api/v1/[protected-endpoint] \
  -H "Authorization: Bearer {accessToken}"
```
**Kết quả:** ✅ 200 OK

#### Step 3: Chờ Token Hết Hạn (Test)
- Hiện tại token hết hạn sau 24 giờ
- Để test nhanh, có thể giảm `spring.jwt.token-validity-in-seconds` trong `application.properties`
- Ví dụ: `spring.jwt.token-validity-in-seconds=10` (10 giây)

#### Step 4: Gọi Protected API Lại (Sau khi Hết Hạn)
```bash
curl -b cookies.txt -X GET http://localhost:8080/api/v1/[protected-endpoint] \
  -H "Authorization: Bearer {accessToken}"
```
**Kết quả:** ❌ 401 Unauthorized (Token expired)

#### Step 5: Refresh Token
```bash
curl -b cookies.txt -X POST http://localhost:8080/api/v1/refresh
```
**Lưu:** `accessToken` mới từ response

#### Step 6: Gọi Protected API với Token Mới
```bash
curl -b cookies.txt -X GET http://localhost:8080/api/v1/[protected-endpoint] \
  -H "Authorization: Bearer {newAccessToken}"
```
**Kết quả:** ✅ 200 OK (Token mới có hiệu lực)

---

## 6. Test Error Cases

### 6.1 Login - Sai Password
```bash
curl -X POST http://localhost:8080/api/v1/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "root_admin@system.local",
    "password": "sai_password"
  }'
```
**Kết quả mong đợi:** 401 Unauthorized
```json
{
    "status": "error",
    "message": "Invalid credentials",
    "data": null,
    "errors": ["Username or password is incorrect"]
}
```

### 6.2 Refresh - Cookie Hết Hạn
```bash
curl -X POST http://localhost:8080/api/v1/refresh
```
**Kết quả mong đợi:** 401 Unauthorized
```json
{
    "status": "error",
    "message": "Invalid refresh token",
    "data": null,
    "errors": ["Refresh token is missing or expired"]
}
```

### 6.3 Protected API - Không Có Token
```bash
curl -X GET http://localhost:8080/api/v1/[protected-endpoint]
```
**Kết quả mong đợi:** 401 Unauthorized
```json
{
    "status": "error",
    "message": "Unauthorized",
    "data": null,
    "errors": ["Missing authorization header"]
}
```

### 6.4 Protected API - Token Sai
```bash
curl -X GET http://localhost:8080/api/v1/[protected-endpoint] \
  -H "Authorization: Bearer invalid_token_here"
```
**Kết quả mong đợi:** 401 Unauthorized
```json
{
    "status": "error",
    "message": "Unauthorized",
    "data": null,
    "errors": ["Invalid token"]
}
```

---

## 7. Swagger UI Test (Web Browser)

### 7.1 Mở Swagger
```
http://localhost:8080/api/v1/swagger-ui.html
```

### 7.2 Test Login
1. Tìm endpoint `/login`
2. Nhấn "Try it out"
3. Nhập JSON body:
```json
{
    "username": "root_admin@system.local",
    "password": "123123"
}
```
4. Nhấn "Execute"
5. Xem response + cookies

### 7.3 Test Refresh
1. Tìm endpoint `/refresh`
2. Nhấn "Try it out"
3. Nhấn "Execute"
4. Cookies tự động được gửi từ login trước đó
5. Xem response

### 7.4 Test Protected API (Tự động thêm Token)
1. Nếu API cần Bearer token, Swagger sẽ hiển thị nút "Authorize"
2. Nhấn nút "Authorize"
3. Nhập token: `Bearer {accessToken}`
4. Nhấn "Authorize"
5. Bây giờ tất cả request sẽ thêm token tự động

---

## 8. Checklist Test

### Login Endpoint
- [ ] Login thành công → 200 OK + accessToken + refreshToken cookie
- [ ] Login sai password → 401 Unauthorized
- [ ] Login user không tồn tại → 401 Unauthorized
- [ ] Cookie có HttpOnly flag
- [ ] Cookie có path `/api/v1`
- [ ] Cookie có MaxAge = 30 ngày

### Refresh Endpoint
- [ ] Refresh với cookie hợp lệ → 200 OK + accessToken mới + refreshToken mới
- [ ] Refresh không có cookie → 401 Unauthorized
- [ ] Refresh với cookie hết hạn → 401 Unauthorized

### Protected API
- [ ] Gọi với token hợp lệ → 200 OK + data
- [ ] Gọi không có token → 401 Unauthorized
- [ ] Gọi với token sai → 401 Unauthorized
- [ ] Gọi với token hết hạn → 401 Unauthorized
- [ ] Gọi sau refresh → 200 OK + data

---

## 9. Debugging Tips

### 9.1 Kiểm tra Token Content
Dùng website: https://jwt.io
- Paste token vào "Encoded"
- Xem payload (claims, expiration, etc.)

### 9.2 Xem Console Backend
```
[SecurityUtil] Invalid refresh token: ...
[AuthController] Refresh token error: ...
```

### 9.3 Xem Logs trong Console
- Tìm `Jwt decoded successfully`
- Tìm `Token validation failed`

### 9.4 Enable DEBUG Logging
Thêm vào `application.properties`:
```properties
logging.level.com.example.learnspring1=DEBUG
logging.level.org.springframework.security=DEBUG
```

---

## 10. Quick Test Commands (Copy-Paste Ready)

### Login
```bash
curl -c cookies.txt -X POST http://localhost:8080/api/v1/login \
  -H "Content-Type: application/json" \
  -d '{"username":"root_admin@system.local","password":"123123"}' \
  | jq .
```

### Lưu Token
```bash
TOKEN=$(curl -s -X POST http://localhost:8080/api/v1/login \
  -H "Content-Type: application/json" \
  -d '{"username":"root_admin@system.local","password":"123123"}' \
  | jq -r '.data.accessToken')

echo $TOKEN
```

### Refresh
```bash
curl -b cookies.txt -X POST http://localhost:8080/api/v1/refresh \
  | jq .
```

### Call Protected API
```bash
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8080/api/v1/[protected-endpoint] \
  | jq .
```

---

## 11. Troubleshooting

### Cookie Không Lưu trong Postman
- **Giải pháp:** Kiểm tra Settings → Cookie → "Automatically follow redirects" bật
- Hoặc dùng tab "Cookies" để thêm manual

### Token Hết Hạn Quá Nhanh
- **Giải pháp:** Tăng `spring.jwt.token-validity-in-seconds` trong `application.properties`
- Ví dụ: `spring.jwt.token-validity-in-seconds=3600` (1 giờ)

### Refresh Token Không Hoạt Động
- **Giải pháp 1:** Xóa cookies và login lại
- **Giải pháp 2:** Kiểm tra console backend có lỗi gì không
- **Giải pháp 3:** Đảm bảo `spring.jwt.refresh-token-base64-secret` có giá trị

### 401 Unauthorized Không Rõ Lý Do
- **Giải pháp:** Decode token tại jwt.io xem expiration time
- Paste token vào JWT.io để xem payload

---

## 12. Next Steps: Google OAuth2

Sau khi test thành công refresh token, tiếp tục implement Google OAuth2 login:

1. **Cấu hình Google OAuth2** trong `application.properties`
2. **Update SecurityConfiguration** để enable OAuth2 login
3. **Tạo Google OAuth2 Controller** để handle callback
4. **Test** `/login/oauth2/authorization/google`

---

**Lưu ý:** 
- Nếu có lỗi, check console backend để xem error messages
- Token JWT có thể decode tại https://jwt.io để debug
- Refresh token lưu trong HTTP-only cookie, nên JavaScript không thể access (bảo mật)
