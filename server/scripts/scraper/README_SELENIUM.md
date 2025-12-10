# Fahasa Product Scraper - Selenium Version

Script để scrape sản phẩm từ Fahasa.com sử dụng Selenium WebDriver.

## Tính năng

✅ Bypass 403 Forbidden bằng cách giả lập browser thật  
✅ Scrape tên sản phẩm, giá, hình ảnh, URL  
✅ Map với category_id trong database  
✅ Auto-generate SKU (FHS000001, FHS000002, ...)  
✅ Check duplicate product names  
✅ Export ra JSON và SQL  
✅ Hỗ trợ pagination

## Yêu cầu

```bash
pip install selenium webdriver-manager beautifulsoup4
```

## Cài đặt

Script sử dụng Microsoft Edge (có sẵn trên Windows 10/11). Selenium 4.6+ tự động quản lý Edge driver.

## Sử dụng

### 1. Cấu hình URLs

Mở file `fahasa_selenium_scraper.py` và chỉnh sửa `scrape_config`:

```python
scrape_config = [
    {
        'url': 'https://www.fahasa.com/van-phong-pham/but-viet/but-gel-but-nuoc-ruot-but-gel.html?order=created_at&limit=24',
        'max_pages': 3,
        'category_id': 101  # ID từ database
    },
    {
        'url': 'https://www.fahasa.com/van-phong-pham/but-viet/but-chi-ruot-but-chi.html?order=created_at&limit=24',
        'max_pages': 5,
        'category_id': 102
    },
    # ... thêm categories khác
]
```

### 2. Chạy script

```bash
cd server/scripts/scraper
python fahasa_selenium_scraper.py
```

### 3. Kết quả

Script sẽ tạo 2 files:

- `fahasa_products_selenium.json` - Dữ liệu JSON
- `fahasa_products_selenium_seed.sql` - SQL INSERT statements

## Tùy chỉnh

### Headless Mode

```python
# Hiện browser (để debug)
scraper = FahasaSeleniumScraper(headless=False)

# Chạy ngầm (nhanh hơn)
scraper = FahasaSeleniumScraper(headless=True)
```

### Số trang scrape

Thay đổi `max_pages` trong config:

```python
{
    'url': '...',
    'max_pages': 10,  # Scrape 10 trang
    'category_id': 101
}
```

## Mapping Category IDs

Category IDs tương ứng với database (từ `script_01.sql`):

### Bút - Viết

- 100: Bút - Viết (parent)
- 101: Bút Gel - Bút Nước - Ruột Bút Gel
- 102: Bút Chì - Ruột Bút Chì
- 103: Bút Bi - Ruột Bút Bi
- 104: Bút Lông
- 105: Bút Dạ Quang
- 106: Bút Kỹ Thuật
- 107: Bút Mực - Bút Máy
- 108: Bút Cao Cấp
- 109: Bút Thư Pháp
- 110: Bút Sơn
- 111: Bút Ký

### Sản phẩm về giấy

- 112: Sản phẩm về giấy (parent)
- 113: Sổ Các Loại
- 114: Tập - Vở
- 115: Giấy Note
- 116: Các Loại Giấy Khác
- 117: Sticker
- 118: Nhãn Vở - Nhãn Tên
- 119: Giấy Thủ Công - Giấy Màu
- 120: Giấy Kiểm Tra
- 121: Đánh Dấu Trang - Giấy Phân Trang
- 122: Giấy Kê Tay
- 123: Giấy Photo
- 124: Tập Chép Nhạc
- 125: Flash Card
- 126: Giấy Bìa
- 127: Thời Khóa Biểu
- 128: Bao Lì Xì

### Dụng cụ học sinh

- 129: Dụng cụ học sinh (parent)
- 130: Gôm - tẩy
- 131: Bóp Viết - Hộp Bút
- 132: Gọt Bút Chì
- 133: Thước
- 134: Ba Lô
- 135: Bao Tập - Bao Sách
- 136: Bảng Viết - Bông Lau Bảng
- 137: Compa
- 138: Bộ Dụng Cụ Học Tập
- 139: Mực
- 140: Dụng Cụ Học Sinh Khác
- 141: Phấn - Hộp Đựng Phấn
- 142: Cặp

... (xem full list trong `load_category_mapping()`)

## Troubleshooting

### Lỗi encoding khi print console

Đây là lỗi của Windows console (cp1252), không ảnh hưởng đến dữ liệu. JSON và SQL vẫn lưu đúng tiếng Việt.

### Browser không mở

Kiểm tra xem Microsoft Edge đã được cài đặt chưa. Nếu dùng Windows 10/11 thì Edge có sẵn.

### Scrape bị chậm

- Bật `headless=True` để chạy nhanh hơn
- Giảm `max_pages`
- Tăng delay giữa các requests nếu bị block

### Không tìm thấy products

Website có thể đã thay đổi HTML structure. Kiểm tra file `debug_selenium_page.html` để xem HTML thực tế.

## Ví dụ Output

### JSON

```json
[
  {
    "name": "Bút Gel Zootopia 0.5 mm - iiGEN YZ360039",
    "price": 24000.0,
    "discount_price": 30000.0,
    "sku": "FHS000001",
    "brand": "Fahasa",
    "image_url": "https://cdn1.fahasa.com/media/catalog/product/6/9/6949029929401.jpg",
    "product_url": "https://www.fahasa.com/iigen-zootopia-viet-gel-yz360039.html",
    "category_id": 101
  }
]
```

### SQL

```sql
INSERT INTO products (
    name, description, price, discount_price, sku, brand,
    thumbnail_url, is_active, is_featured,
    created_at, updated_at, created_by, updated_by, deleted_by
) VALUES (
    'Bút Gel Zootopia 0.5 mm - iiGEN YZ360039', '', 24000.0000, 30000.0000, 'FHS000001', 'Fahasa',
    'https://cdn1.fahasa.com/media/catalog/product/6/9/6949029929401.jpg', TRUE, FALSE,
    NOW(), NOW(), @created_by, NULL, NULL
);
SET @product1_id = LAST_INSERT_ID();

INSERT INTO product_categories (product_id, category_id) VALUES (@product1_id, 101);

INSERT INTO product_variants (
    product_id, variant_type, variant_value, price, stock_quantity, sku,
    sort_order, is_default, is_active,
    created_at, updated_at, created_by, updated_by, deleted_by
) VALUES (
    @product1_id, 'OTHER', 'Mặc định', 24000.0000, 100, 'FHS000001',
    1, TRUE, TRUE,
    NOW(), NOW(), @created_by, NULL, NULL
);

INSERT INTO product_images (
    product_id, image_url, sort_order, is_primary,
    created_at, updated_at, created_by, updated_by, deleted_by
) VALUES (
    @product1_id, 'https://cdn1.fahasa.com/media/catalog/product/6/9/6949029929401.jpg', 1, TRUE,
    NOW(), NOW(), @created_by, NULL, NULL
);
```

## Performance

- **Headless mode**: ~3-5 giây/trang
- **With UI**: ~5-7 giây/trang
- **24 products/page**: ~2-3 minutes cho 10 trang

## Notes

- Script tự động delay ngẫu nhiên giữa các requests để tránh bị block
- SKU format: `FHS` + 6 digits (FHS000001, FHS000002, ...)
- Script check duplicate product names để tránh trùng lặp
- Default stock quantity: 100 (có thể customize trong code)
