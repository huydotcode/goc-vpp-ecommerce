# Hướng Dẫn Hoàn Chỉnh: Setup và Test Chức Năng AI Gợi Ý Sản Phẩm

## Tổng Quan

Hệ thống AI gợi ý sản phẩm sử dụng:
- **Gemini API**: Chuyển đổi text → vector embeddings
- **ChromaDB**: Lưu trữ và tìm kiếm vector theo similarity
- **User History**: Track lịch sử xem sản phẩm để gợi ý cá nhân hóa (lưu trong database)

---

## Bước 1: Khởi Động ChromaDB (Docker)

### 1.1. Chạy ChromaDB Container

```bash
# Tạo và chạy container mới
docker run -d \
  --name chromadb \
  -p 8000:8000 \
  chromadb/chroma:latest

# Hoặc nếu đã có container
docker start chromadb
```

### 1.2. Kiểm Tra ChromaDB Đang Chạy

```bash
# Kiểm tra heartbeat
curl http://127.0.0.1:8000/api/v1/heartbeat

# Hoặc kiểm tra collection
cd server/scripts/ai
node checkChroma.js
```

**Kết quả mong đợi:**
- ChromaDB đang chạy và accessible
- Collection `products` có thể chưa tồn tại (sẽ tạo ở bước index)

---

## Bước 2: Cấu Hình Backend

### 2.1. Cấu Hình Environment Variables

Trong file `server/src/main/resources/application.properties`:

```properties
# Gemini API Key
ai.gemini.api-key=AIzaSyBP7V1jntwmcW7kTxMaNDmD--thGDCgaNY

# ChromaDB
ai.chroma.url=http://127.0.0.1:8000
ai.chroma.collection=products
```

Hoặc set environment variables:
```bash
# Windows PowerShell
$env:GEMINI_API_KEY='AIzaSyBP7V1jntwmcW7kTxMaNDmD--thGDCgaNY'
$env:CHROMA_URL='http://127.0.0.1:8000'
$env:CHROMA_COLLECTION='products'

# Linux/Mac
export GEMINI_API_KEY='AIzaSyBP7V1jntwmcW7kTxMaNDmD--thGDCgaNY'
export CHROMA_URL='http://127.0.0.1:8000'
export CHROMA_COLLECTION='products'
```

### 2.2. Khởi Động Backend Server

```bash
cd server
./gradlew bootRun
```

Server chạy tại: `http://localhost:8080`

**Kiểm tra server:**
```bash
curl http://localhost:8080/api/v1/products/suggestions?limit=5
```

---

## Bước 3: Tạo Database Table (Nếu Chưa Có)

### 3.1. Tạo Bảng User Product History

```bash
# Chạy SQL script
mysql -u root -p your_database < server/scripts-sql/create_user_product_history.sql
```

Hoặc chạy trực tiếp trong MySQL:
```sql
CREATE TABLE IF NOT EXISTS user_product_history (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(100) NOT NULL,
    product_id BIGINT NOT NULL,
    viewed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_user_product_history_user_product (user_id, product_id),
    INDEX idx_user_product_history_user_id (user_id),
    INDEX idx_user_product_history_product_id (product_id),
    INDEX idx_user_product_history_viewed_at (viewed_at),
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

## Bước 4: Tạo Dữ Liệu Sản Phẩm

### 4.1. Cài Đặt Dependencies

```bash
cd server/scripts/ai
npm install chromadb
```

### 4.2. Chạy Script Seed Products

```bash
# Windows PowerShell
$env:API_BASE_URL='http://localhost:8080/api/v1'
$env:ADMIN_USERNAME='root_admin@system.local'
$env:ADMIN_PASSWORD='123123'
node seedProducts.js

# Linux/Mac
API_BASE_URL=http://localhost:8080/api/v1 \
ADMIN_USERNAME=root_admin@system.local \
ADMIN_PASSWORD=123123 \
node seedProducts.js
```

**Kết quả mong đợi:**
- Tạo 200 sản phẩm (5 chủ đề x 40 sản phẩm)
- Mỗi sản phẩm có 1 default variant
- Log: `OK SKU-xxx` cho mỗi sản phẩm thành công

**Thời gian:** ~1-2 phút

### 4.3. Kiểm Tra Sản Phẩm Đã Tạo

```bash
# Lấy danh sách sản phẩm (cần token admin)
# Đăng nhập trước để lấy token
curl -X POST "http://localhost:8080/api/v1/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"root_admin@system.local","password":"123123"}'

# Sau đó dùng token để lấy sản phẩm
curl -X GET "http://localhost:8080/api/v1/products/advanced?page=1&size=10" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Bước 5: Index Sản Phẩm Vào ChromaDB

### 5.1. Chạy Script Index

```bash
cd server/scripts/ai

# Windows PowerShell
$env:API_BASE_URL='http://localhost:8080/api/v1'
$env:CHROMA_URL='http://127.0.0.1:8000'
$env:CHROMA_COLLECTION='products'
$env:GEMINI_API_KEY='AIzaSyBP7V1jntwmcW7kTxMaNDmD--thGDCgaNY'
$env:ADMIN_USERNAME='root_admin@system.local'
$env:ADMIN_PASSWORD='123123'
node indexChroma.js

# Linux/Mac
API_BASE_URL=http://localhost:8080/api/v1 \
CHROMA_URL=http://127.0.0.1:8000 \
CHROMA_COLLECTION=products \
GEMINI_API_KEY=AIzaSyBP7V1jntwmcW7kTxMaNDmD--thGDCgaNY \
ADMIN_USERNAME=root_admin@system.local \
ADMIN_PASSWORD=123123 \
node indexChroma.js
```

**Kết quả mong đợi:**
- Script tự động login admin
- Lấy từng batch 10 sản phẩm
- Tạo embedding cho mỗi sản phẩm bằng Gemini
- Upsert vào ChromaDB
- Log chi tiết: `[1/200] Đang xử lý: ... → Đang tạo embedding... ✓ Embedding thành công`

**Thời gian:** ~2-3 phút cho 200 sản phẩm (do rate limit của Gemini API)

### 5.2. Kiểm Tra Collection Đã Index

```bash
cd server/scripts/ai
node checkChroma.js
```

**Kết quả mong đợi:**
- Collection `products` tồn tại
- Có ít nhất 200+ items trong collection
- Hiển thị collection ID (cần để cập nhật trong code nếu thay đổi)

---

## Bước 6: Restart Backend Server

**QUAN TRỌNG:** Sau khi index hoặc sửa code, cần restart backend server:

```bash
# Dừng server (Ctrl+C)
# Sau đó chạy lại
cd server
./gradlew bootRun
```

Hoặc nếu đang chạy trong IDE, restart application.

---

## Bước 7: Test API Endpoints

### 7.1. Lấy Token Đăng Nhập

```bash
# Login để lấy token
curl -X POST "http://localhost:8080/api/v1/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"root_admin@system.local","password":"123123"}'

# Response sẽ có accessToken, copy token này để dùng cho các request sau
```

### 7.2. Test Vector Suggestions API

**Endpoint:** `GET /api/v1/products/vector-suggest`

```bash
TOKEN="your_jwt_token_here"

# Test với query text
curl -X GET "http://localhost:8080/api/v1/products/vector-suggest?q=bút+văn+phòng&limit=8" \
  -H "Authorization: Bearer ${TOKEN}"

# Test với từ khóa khác
curl -X GET "http://localhost:8080/api/v1/products/vector-suggest?q=màu+vẽ&limit=5" \
  -H "Authorization: Bearer ${TOKEN}"

# Test với category filter
curl -X GET "http://localhost:8080/api/v1/products/vector-suggest?q=màu+sắc&categoryId=3&limit=5" \
  -H "Authorization: Bearer ${TOKEN}"
```

**Kết quả mong đợi:**
```json
{
  "status": "success",
  "data": [
    {
      "id": 1,
      "name": "Bút bi Thiên Long TL-027",
      "price": 5000,
      ...
    },
    ...
  ]
}
```

**Test cases:**
- ✅ Query: "bút" → Trả về sản phẩm về bút
- ✅ Query: "màu vẽ" → Trả về sản phẩm về màu, cọ, canvas
- ✅ Query: "chuột máy tính" → Trả về sản phẩm công nghệ
- ✅ Query: "cặp" → Trả về balo, túi sách (nhờ synonym expansion)

### 7.3. Test Track Product View API

**Endpoint:** `POST /api/v1/products/{id}/view`

```bash
TOKEN="your_jwt_token_here"
PRODUCT_ID=123

# Track product view
curl -X POST "http://localhost:8080/api/v1/products/${PRODUCT_ID}/view" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json"
```

**Kết quả mong đợi:**
- Status: `200 OK`
- Response body: `{}` (empty)
- Lưu vào database table `user_product_history`

**Lưu ý:**
- Nếu chưa đăng nhập → Request vẫn thành công nhưng không track (silent fail)
- Chỉ track khi có `Authorization` header hợp lệ

### 7.4. Test History-Based Suggestions API

**Bước 1: Track một số sản phẩm đã xem**

```bash
TOKEN="your_jwt_token_here"

# Track sản phẩm ID 1, 2, 3, 4, 5
for id in 1 2 3 4 5; do
  curl -X POST "http://localhost:8080/api/v1/products/${id}/view" \
    -H "Authorization: Bearer ${TOKEN}"
done
```

**Bước 2: Lấy gợi ý dựa trên history**

```bash
# Lấy gợi ý
curl -X GET "http://localhost:8080/api/v1/products/history-suggest?limit=8" \
  -H "Authorization: Bearer ${TOKEN}"

# Với category filter
curl -X GET "http://localhost:8080/api/v1/products/history-suggest?categoryId=1&limit=8" \
  -H "Authorization: Bearer ${TOKEN}"
```

**Kết quả mong đợi:**
```json
{
  "status": "success",
  "data": [
    {
      "id": 45,
      "name": "Học tập - balo 3",
      "price": 150000,
      ...
    },
    ...
  ]
}
```

**Test cases:**
- ✅ Xem 3 sản phẩm về "bút" → Gợi ý sản phẩm về bút, sổ, kẹp
- ✅ Xem sản phẩm category 1 → Gợi ý sản phẩm cùng category
- ✅ Chưa xem sản phẩm nào → Trả về best sellers
- ✅ User chưa đăng nhập → Trả về best sellers

### 7.5. Test Script Tự Động (Tùy Chọn)

```bash
cd server/scripts/ai

# Windows PowerShell
$env:API_BASE_URL='http://localhost:8080/api/v1'
$env:ADMIN_USERNAME='root_admin@system.local'
$env:ADMIN_PASSWORD='123123'
node testAI.js

# Linux/Mac
API_BASE_URL=http://localhost:8080/api/v1 \
ADMIN_USERNAME=root_admin@system.local \
ADMIN_PASSWORD=123123 \
node testAI.js
```

**Script sẽ test:**
- ✅ General Suggestions
- ✅ Vector Suggestions (nhiều loại query)
- ✅ Track Product Views
- ✅ History-based Suggestions
- ✅ Best Sellers

---

## Bước 8: Test Trên Frontend (UI Client)

### 8.1. Khởi Động Frontend

```bash
cd client
npm install
npm run dev
```

Frontend chạy tại: `http://localhost:5173`

### 8.2. Test AI Search Component

1. **Mở trang Home**: `http://localhost:5173`
2. **Scroll xuống phần "Test AI Gợi Ý Sản Phẩm"**
3. **Thử các từ khóa:**
   - `bút văn phòng`
   - `màu vẽ`
   - `chuột máy tính`
   - `sổ ghi chép`
   - `balo học sinh`
   - `cặp` (sẽ trả về balo nhờ synonym expansion)

**Kết quả mong đợi:**
- Hiển thị loading khi đang tìm kiếm
- Trả về 8 sản phẩm liên quan đến từ khóa
- Sản phẩm có tên, hình ảnh, giá

### 8.3. Test History-Based Suggestions

1. **Đăng nhập vào hệ thống** (nếu chưa đăng nhập)
2. **Click vào 3-5 sản phẩm** để xem chi tiết:
   - Ví dụ: Click vào các sản phẩm "Học tập - balo 1", "Học tập - balo 2", "Học tập - vở 1"
3. **Quay lại trang Home**
4. **Scroll xuống phần "Gợi ý dành cho bạn"**

**Kết quả mong đợi:**
- Hiển thị loading skeleton khi đang tải
- Trả về 8 sản phẩm tương tự với các sản phẩm đã xem
- Sản phẩm gợi ý có cùng chủ đề/category với sản phẩm đã xem
- Nếu chưa xem sản phẩm nào → hiển thị best sellers

### 8.4. Test Auto Track Product View

1. **Mở Developer Console (F12)** → Tab **Network**
2. **Click vào bất kỳ ProductCard nào**
3. **Kiểm tra Network tab:**
   - Tìm request: `POST /api/v1/products/{id}/view`
   - Status: `200 OK`
   - Request Headers: Có `Authorization: Bearer ...`

**Kết quả mong đợi:**
- Request được gửi tự động khi click vào card
- Không cần click button, chỉ cần click vào card là track
- Lưu vào database table `user_product_history`

### 8.5. Test Flow Hoàn Chỉnh

**Scenario: User Xem Sản Phẩm Balo → Gợi Ý Balo**

1. **Đăng nhập** vào hệ thống
2. **Click vào 3 sản phẩm balo**:
   - "Học tập - balo 1"
   - "Học tập - balo 2"  
   - "Học tập - balo 3"
3. **Quay lại Home** → Scroll xuống "Gợi ý dành cho bạn"
4. **Kiểm tra kết quả**:
   - ✅ Nên có nhiều sản phẩm balo trong gợi ý
   - ✅ Có thể có sản phẩm học tập khác (vở, bút chì, etc.)

---

## Bước 9: Kiểm Tra Logs và Troubleshooting

### 9.1. Backend Logs

**Thành công:**
```
DEBUG ... o.s.web.client.RestTemplate : Response 200 OK
Hibernate: select p1_0.id... from products p1_0 where p1_0.id in (?,?,?,?,?,?,?,?)
DEBUG ... Completed 200 OK
```

**Lỗi:**
```
WARN ... Resolved [java.lang.IllegalStateException: Failed to query ChromaDB...]
```

### 9.2. Lỗi Thường Gặp

#### Lỗi: "Failed to query ChromaDB. Last error: 404 Not Found"

**Nguyên nhân:** Collection ID không đúng hoặc ChromaDB không chạy

**Giải pháp:**
1. Kiểm tra ChromaDB đang chạy:
   ```bash
   docker ps | grep chroma
   docker start chromadb
   ```

2. Chạy `node checkChroma.js` để lấy collection ID mới
3. Cập nhật `collectionId` trong `AiVectorService.java` (dòng 183)
4. Restart backend server

#### Lỗi: "GEMINI_API_KEY is not configured"

**Giải pháp:**
1. Kiểm tra `application.properties` có `ai.gemini.api-key`
2. Hoặc set environment variable `GEMINI_API_KEY`
3. Test API key:
   ```bash
   curl "https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=YOUR_KEY" \
     -H "Content-Type: application/json" \
     -d '{"model":"models/text-embedding-004","content":{"parts":[{"text":"test"}]}}'
   ```

#### Lỗi: "Collection is empty" hoặc không có kết quả khi search

**Giải pháp:**
1. Chạy lại script index:
   ```bash
   cd server/scripts/ai
   node indexChroma.js
   ```

2. Kiểm tra collection có dữ liệu:
   ```bash
   node checkChroma.js
   ```

3. Kiểm tra log backend để xem ChromaDB có trả về IDs không

#### Lỗi: History suggestions trả về best sellers thay vì gợi ý dựa trên history

**Nguyên nhân:**
- Chưa có lịch sử (chưa click vào sản phẩm nào)
- Không lấy được embeddings từ ChromaDB
- User chưa đăng nhập

**Giải pháp:**
1. Đảm bảo đã đăng nhập
2. Click vào vài sản phẩm để tạo history
3. Kiểm tra database table `user_product_history` có dữ liệu không
4. Kiểm tra logs backend để xem có lỗi không

#### Lỗi: Track Product View không hoạt động

**Nguyên nhân:**
- Chưa đăng nhập → Silent fail (không track)
- Component ProductCard không gọi trackProductView

**Giải pháp:**
1. Kiểm tra đã đăng nhập chưa
2. Kiểm tra Network tab xem có request `POST /products/{id}/view` không
3. Kiểm tra code ProductCard có gọi `trackProductView.mutate(id)` không

---

## Bước 10: Test Performance

### 10.1. Đo Thời Gian Response

```bash
# Test vector suggestions
time curl -X GET "http://localhost:8080/api/v1/products/vector-suggest?q=bút&limit=8" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Test history suggestions
time curl -X GET "http://localhost:8080/api/v1/products/history-suggest?limit=8" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Kết quả mong đợi:**
- Vector suggestions: ~500ms - 1s (do gọi Gemini API)
- History suggestions: ~1-2s (do tính vector trung bình + query ChromaDB)
- General suggestions: ~100-200ms

---

## Checklist Test

### Setup
- [ ] ChromaDB đang chạy (Docker)
- [ ] Backend server đang chạy trên port 8080
- [ ] Frontend client đang chạy trên port 5173
- [ ] Database table `user_product_history` đã tạo
- [ ] Gemini API key hợp lệ

### Data
- [ ] Đã seed 200 sản phẩm
- [ ] Đã index tất cả sản phẩm vào ChromaDB
- [ ] Collection có ít nhất 200+ items

### API Test
- [ ] Vector suggestions hoạt động với các query khác nhau
- [ ] History suggestions hoạt động sau khi track views
- [ ] Track product view API hoạt động
- [ ] Fallback hoạt động khi không có kết quả từ ChromaDB

### Frontend Test
- [ ] AI Search component trả về kết quả
- [ ] History Suggestions hiển thị đúng
- [ ] Auto track product view hoạt động khi click card
- [ ] Gợi ý có độ liên quan cao với lịch sử

### Performance
- [ ] Response time < 2 giây cho mỗi request
- [ ] Logs backend không có lỗi

---

## Kết Quả Mong Đợi

✅ **Thành công:**
- AI Search trả về sản phẩm liên quan đến từ khóa
- History Suggestions trả về sản phẩm tương tự với lịch sử
- Auto track product view hoạt động tự động
- Response time < 2 giây cho mỗi request
- Gợi ý có độ liên quan cao

❌ **Cần kiểm tra:**
- Response time > 5 giây → Kiểm tra ChromaDB connection
- Không có kết quả → Kiểm tra collection đã được index chưa
- Lỗi 500 → Kiểm tra logs backend để xem chi tiết
- Gợi ý không liên quan → Kiểm tra embeddings trong ChromaDB

---

## Tips

1. **Test với nhiều loại query:** Từ khóa ngắn, dài, có dấu, không dấu
2. **Test với nhiều categories:** Mỗi category có sản phẩm khác nhau
3. **Test edge cases:** Query rỗng, không có kết quả, user chưa đăng nhập
4. **Monitor logs:** Kiểm tra server logs để debug
5. **Test trên nhiều browsers:** Đảm bảo tracking hoạt động trên mọi browser
6. **Kiểm tra database:** Xem table `user_product_history` có dữ liệu không

