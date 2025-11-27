# 📸 Hướng Dẫn Upload Ảnh Vào Project

## 📋 Tổng Quan

Hệ thống hỗ trợ upload file (ảnh, video, raw) lên Cloudinary thông qua REST API. File sẽ được lưu tự động và trả về URL để sử dụng.

---

## 🔐 Bước 1: Lấy JWT Token

### Endpoint
```
POST http://localhost:8080/api/v1/login
```

### Headers
```
Content-Type: application/json
```

### Body (JSON)
```json
{
  "username": "root_admin@system.local",
  "password": "123123"
}
```

### Response
```json
{
  "status": "success",
  "message": "Request processed successfully",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiJ9..."
  }
}
```

**⚠️ Lưu token để sử dụng cho các request sau!**

---

## 📤 Bước 2: Upload Ảnh

### Endpoint
```
POST http://localhost:8080/api/v1/uploads
```

### Headers
```
Authorization: Bearer <your_token_here>
```

### Body (Form-data)

| Key | Type | Required | Default | Description |
|-----|------|----------|---------|-------------|
| `file` | **File** | ✅ Yes | - | File cần upload |
| `resourceType` | Text | ❌ No | `image` | Loại file: `image`, `video`, `raw` |
| `module` | Text | ❌ No | `shared` | Module/Thư mục con (vd: `categories`, `users`) |
| `entityId` | Text | ❌ No | - | ID entity (vd: category ID, user ID) |
| `purpose` | Text | ❌ No | `file` | Mục đích file (vd: `thumbnail`, `avatar`) |

---

## 🎯 Các Trường Hợp Sử Dụng

### 1. Upload Ảnh Đơn Giản

**Form-data:**
- `file`: [Chọn file ảnh .jpg, .png, .webp, .avif]
- `resourceType`: `image` (hoặc để trống)

**Ví dụ:** Upload ảnh avatar cho user
- `file`: avatar.jpg
- `resourceType`: `image`
- `module`: `users`
- `entityId`: `123`
- `purpose`: `avatar`

**Folder lưu:** `app/dev/users/123`

---

### 2. Upload Thumbnail Cho Category

**Form-data:**
- `file`: [Chọn file ảnh]
- `resourceType`: `image`
- `module`: `categories`
- `entityId`: `5`
- `purpose`: `thumbnail`

**Folder lưu:** `app/dev/categories/5`

---

### 3. Upload Ảnh Chung (Shared)

**Form-data:**
- `file`: [Chọn file ảnh]
- `resourceType`: `image`
- `module`: `shared` (hoặc để trống)
- `entityId`: (để trống)
- `purpose`: `file` (hoặc để trống)

**Folder lưu:** `app/dev/shared`

---

## ✅ Response Thành Công (200 OK)

```json
{
  "status": "success",
  "message": "Uploaded successfully",
  "data": {
    "secureUrl": "https://res.cloudinary.com/dlgqtldwk/image/upload/v1761966412/app/dev/shared/file_1761966405459_7cfe37db.png",
    "publicId": "app/dev/shared/file_1761966405459_7cfe37db",
    "resourceType": "image",
    "format": "png",
    "bytes": 70234,
    "width": 1920,
    "height": 1080,
    "duration": null,
    "folder": "app/dev/shared",
    "originalFilename": "my-image.png",
    "etag": "f829b914fc47cfc9c0747c119c27cf1b"
  },
  "errorCode": null,
  "timestamp": "2025-11-01T10:06:50.48331"
}
```

### Các Trường Quan Trọng:
- **`secureUrl`**: URL HTTPS của file đã upload (dùng để hiển thị)
- **`publicId`**: ID public của file trên Cloudinary
- **`bytes`**: Kích thước file (bytes)
- **`width`, `height`**: Kích thước ảnh (pixels)
- **`format`**: Định dạng file
- **`folder`**: Folder đã lưu

---

## 🚫 Lỗi Thường Gặp

### 1. 401 Unauthorized
**Nguyên nhân:** Token hết hạn hoặc không hợp lệ  
**Giải pháp:** Lấy token mới từ `/login`

```json
{
  "status": "401 UNAUTHORIZED",
  "message": "Token không hợp lệ hoặc đã hết hạn"
}
```

---

### 2. 400 Bad Request - "File is empty"
**Nguyên nhân:** Không chọn file hoặc file rỗng  
**Giải pháp:** Đảm bảo đã chọn file trong form-data

---

### 3. 400 Bad Request - "File type not allowed"
**Nguyên nhân:** Định dạng file không được hỗ trợ  
**Giải pháp:** Kiểm tra định dạng file

**Định dạng hỗ trợ:**
- **Image:** `.jpg`, `.png`, `.webp`, `.avif`
- **Video:** `.mp4`, `.webm`
- **Raw:** `.pdf`, `.docx`, `.zip`

---

### 4. 400 Bad Request - "Image exceeds max size"
**Nguyên nhân:** File quá lớn  
**Giải pháp:** Giảm kích thước file

**Giới hạn kích thước:**
- **Image:** Tối đa 2MB (2,097,152 bytes)
- **Video:** Tối đa 50MB (52,428,800 bytes)
- **Raw:** Tối đa 10MB (10,485,760 bytes)

---

### 5. 400 Bad Request - "resourceType must be image|video|raw"
**Nguyên nhân:** Giá trị `resourceType` sai  
**Giải pháp:** Chỉ dùng: `image`, `video`, hoặc `raw`

---

## 📝 Ví Dụ Với Postman

### 1. Cấu hình Request

**Method:** `POST`  
**URL:** `http://localhost:8080/api/v1/uploads`

### 2. Headers
```
Authorization: Bearer eyJhbGciOiJIUzI1NiJ9...
```

### 3. Body (Form-data)

| Key | Type | Value |
|-----|------|-------|
| `file` | **File** | [Chọn file] |
| `resourceType` | Text | `image` |
| `module` | Text | `categories` |
| `entityId` | Text | `5` |
| `purpose` | Text | `thumbnail` |

### 4. Send và kiểm tra Response

---

## 📝 Ví Dụ Với cURL

```bash
# 1. Lấy token
TOKEN=$(curl -X POST http://localhost:8080/api/v1/login \
  -H "Content-Type: application/json" \
  -d '{"username":"root_admin@system.local","password":"123123"}' \
  | jq -r '.data.accessToken')

# 2. Upload ảnh
curl -X POST http://localhost:8080/api/v1/uploads \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@/path/to/image.jpg" \
  -F "resourceType=image" \
  -F "module=categories" \
  -F "entityId=5" \
  -F "purpose=thumbnail"
```

---

## 📝 Ví Dụ Với JavaScript (Frontend)

```javascript
async function uploadImage(file, module = 'shared', entityId = null) {
  // 1. Lấy token
  const token = await getToken(); // Hàm lấy token của bạn
  
  // 2. Tạo FormData
  const formData = new FormData();
  formData.append('file', file);
  formData.append('resourceType', 'image');
  formData.append('module', module);
  if (entityId) {
    formData.append('entityId', entityId);
  }
  formData.append('purpose', 'thumbnail');
  
  // 3. Upload
  const response = await fetch('http://localhost:8080/api/v1/uploads', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: formData
  });
  
  const result = await response.json();
  
  if (response.ok) {
    console.log('Upload thành công!');
    console.log('URL:', result.data.secureUrl);
    return result.data.secureUrl;
  } else {
    console.error('Upload thất bại:', result.message);
    throw new Error(result.message);
  }
}

// Sử dụng
const fileInput = document.querySelector('#fileInput');
fileInput.addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (file) {
    try {
      const url = await uploadImage(file, 'categories', '5');
      console.log('Ảnh đã upload:', url);
    } catch (error) {
      console.error('Lỗi:', error);
    }
  }
});
```

---

## 📁 Cấu Trúc Folder Lưu Trữ

File được lưu theo cấu trúc:
```
app/dev/{module}/{entityId}/{purpose}_{timestamp}_{random}.{ext}
```

**Ví dụ:**
- `app/dev/shared/file_1761966405459_7cfe37db.png` (module=shared, không có entityId)
- `app/dev/categories/5/thumbnail_1761966405459_7cfe37db.png` (module=categories, entityId=5)
- `app/dev/users/123/avatar_1761966405459_7cfe37db.jpg` (module=users, entityId=123)

---

## 🔧 Cấu Hình (application.properties)

```properties
# Cloudinary Config
cloudinary.cloud_name=dlgqtldwk
cloudinary.api_key=824698927938353
cloudinary.api_secret=jWXhYXf3QDDN7BI8OcxWau4UoDw

# Default folder
cloudinary.default_folder=app/dev

# Allowed formats
cloudinary.allowed_image_formats=jpg,png,webp,avif
cloudinary.allowed_video_formats=mp4,webm
cloudinary.allowed_raw_formats=pdf,docx,zip

# Max file sizes (bytes)
cloudinary.max_image_bytes=2097152      # 2MB
cloudinary.max_video_bytes=52428800     # 50MB
cloudinary.max_raw_bytes=10485760       # 10MB
```

---

## 💡 Tips

1. **Lưu `secureUrl` vào database:** Sau khi upload thành công, lưu `secureUrl` vào database để sử dụng sau
2. **Validate file trước upload:** Kiểm tra kích thước và định dạng ở frontend trước khi upload
3. **Xử lý lỗi:** Luôn kiểm tra response status và xử lý lỗi phù hợp
4. **Token management:** Lưu token vào localStorage/session để tái sử dụng
5. **Optimize images:** Nén ảnh trước khi upload để giảm dung lượng

---

## 📚 Tài Liệu Tham Khảo

- **Cloudinary Documentation:** https://cloudinary.com/documentation
- **Spring Boot File Upload:** https://spring.io/guides/gs/uploading-files/
- **API Endpoint:** `http://localhost:8080/swagger-ui.html` (Xem chi tiết API)

---

## ✅ Checklist Upload Ảnh

- [ ] Có JWT token hợp lệ
- [ ] File đúng định dạng (.jpg, .png, .webp, .avif)
- [ ] File không vượt quá 2MB
- [ ] Chọn đúng `resourceType` (image/video/raw)
- [ ] Điền `module` và `entityId` (nếu cần)
- [ ] Kiểm tra response có `secureUrl`
- [ ] Lưu `secureUrl` vào database (nếu cần)

---

**Chúc bạn upload thành công! 🎉**

