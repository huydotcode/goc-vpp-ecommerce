-- ============================================================================
-- Script để xóa toàn bộ dữ liệu products và related data
-- CẢNH BÁO: Script này sẽ xóa TẤT CẢ products, variants, images, và cart_items
-- ============================================================================

-- Tắt foreign key checks tạm thời để tránh lỗi constraint
SET FOREIGN_KEY_CHECKS = 0;

-- Xóa cart_items (vì có foreign key đến products và variants)
DELETE FROM cart_items;

-- Xóa product_images (child của products)
DELETE FROM product_images;

-- Xóa product_variants (child của products)
DELETE FROM product_variants;

-- Xóa product_categories (join table)
DELETE FROM product_categories;

-- Xóa products (parent)
DELETE FROM products;

-- Bật lại foreign key checks
SET FOREIGN_KEY_CHECKS = 1;

-- Reset AUTO_INCREMENT về 1 (optional)
ALTER TABLE products AUTO_INCREMENT = 1;
ALTER TABLE product_variants AUTO_INCREMENT = 1;
ALTER TABLE product_images AUTO_INCREMENT = 1;
ALTER TABLE cart_items AUTO_INCREMENT = 1;

DELETE FROM categories;

SELECT 'Đã xóa toàn bộ dữ liệu products!' AS result;


