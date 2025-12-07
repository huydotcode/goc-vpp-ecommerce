-- Seed Categories with Parent Structure
-- This script creates parent categories and updates existing categories with parent_id
-- Run this after clearing existing category data

-- Step 1: Insert Parent Categories
-- Note: IDs will be auto-generated, but we'll use variables to reference them

-- Parent Category: Bìa các loại
INSERT INTO categories (name, thumbnail_url, description, is_active, parent_id, sort_order, created_at, updated_at, created_by, updated_by, deleted_by)
VALUES ('Bìa các loại', NULL, 'Các loại bìa văn phòng', TRUE, NULL, 1, NOW(), NOW(), 'root_admin@system.local', NULL, NULL);

SET @parent_bia_id = LAST_INSERT_ID();

-- Parent Category: Bút các loại
INSERT INTO categories (name, thumbnail_url, description, is_active, parent_id, sort_order, created_at, updated_at, created_by, updated_by, deleted_by)
VALUES ('Bút các loại', NULL, 'Các loại bút văn phòng', TRUE, NULL, 2, NOW(), NOW(), 'root_admin@system.local', NULL, NULL);

SET @parent_but_id = LAST_INSERT_ID();

-- Parent Category: Dụng cụ văn phòng (already exists, but we'll update it)
-- Note: If "Dụng cụ văn phòng" already exists, we'll use it as parent
-- Otherwise, we'll create a new one

-- Check if "Dụng cụ văn phòng" exists, if not create it
INSERT INTO categories (name, thumbnail_url, description, is_active, parent_id, sort_order, created_at, updated_at, created_by, updated_by, deleted_by)
SELECT 'Dụng cụ văn phòng', NULL, 'Các dụng cụ văn phòng', TRUE, NULL, 3, NOW(), NOW(), 'root_admin@system.local', NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Dụng cụ văn phòng' AND deleted_by IS NULL);

SET @parent_dung_cu_id = (SELECT id FROM categories WHERE name = 'Dụng cụ văn phòng' AND deleted_by IS NULL LIMIT 1);

-- Parent Category: Pin
INSERT INTO categories (name, thumbnail_url, description, is_active, parent_id, sort_order, created_at, updated_at, created_by, updated_by, deleted_by)
VALUES ('Pin', NULL, 'Các loại pin', TRUE, NULL, 4, NOW(), NOW(), 'root_admin@system.local', NULL, NULL);

SET @parent_pin_id = LAST_INSERT_ID();

-- Parent Category: Phụ kiện bút
INSERT INTO categories (name, thumbnail_url, description, is_active, parent_id, sort_order, created_at, updated_at, created_by, updated_by, deleted_by)
VALUES ('Phụ kiện bút', NULL, 'Phụ kiện cho bút', TRUE, NULL, 5, NOW(), NOW(), 'root_admin@system.local', NULL, NULL);

SET @parent_phu_kien_but_id = LAST_INSERT_ID();

-- Parent Category: Sổ
INSERT INTO categories (name, thumbnail_url, description, is_active, parent_id, sort_order, created_at, updated_at, created_by, updated_by, deleted_by)
VALUES ('Sổ', NULL, 'Các loại sổ', TRUE, NULL, 6, NOW(), NOW(), 'root_admin@system.local', NULL, NULL);

SET @parent_so_id = LAST_INSERT_ID();

-- Step 2: Insert Child Categories with parent_id

-- Bìa các loại - Children
INSERT INTO categories (name, thumbnail_url, description, is_active, parent_id, sort_order, created_at, updated_at, created_by, updated_by, deleted_by)
VALUES 
('Bìa acco - bìa báo cáo', 'https://res.cloudinary.com/dlgqtldwk/image/upload/v1764834347/app/dev/categories/thumbnailurl_1764834341100_b062d385.jpg', 'Bìa acco - bìa báo cáo', TRUE, @parent_bia_id, 1, NOW(), NOW(), 'root_admin@system.local', NULL, NULL),
('Bìa cây - Bìa treo', 'https://res.cloudinary.com/dlgqtldwk/image/upload/v1764834324/app/dev/categories/thumbnailurl_1764834321164_cbe6c5ea.jpg', 'Bìa cây - Bìa treo', TRUE, @parent_bia_id, 2, NOW(), NOW(), 'root_admin@system.local', NULL, NULL),
('Bìa còng', 'https://res.cloudinary.com/dlgqtldwk/image/upload/v1764834228/app/dev/categories/thumbnailurl_1764834224808_3340ba2f.jpg', 'Bìa còng', TRUE, @parent_bia_id, 3, NOW(), NOW(), 'root_admin@system.local', NULL, NULL),
('Bìa hộp', 'https://res.cloudinary.com/dlgqtldwk/image/upload/v1764834179/app/dev/categories/thumbnailurl_1764834175537_cf53e48e.jpg', 'Bìa hộp', TRUE, @parent_bia_id, 4, NOW(), NOW(), 'root_admin@system.local', NULL, NULL),
('Bìa lá - bìa nhiều lá', 'https://res.cloudinary.com/dlgqtldwk/image/upload/v1764834150/app/dev/categories/thumbnailurl_1764834146022_5c558776.jpg', 'Bìa lá - bìa nhiều lá', TRUE, @parent_bia_id, 5, NOW(), NOW(), 'root_admin@system.local', NULL, NULL);

-- Update parent thumbnail from first child
UPDATE categories 
SET thumbnail_url = (
    SELECT thumbnail_url FROM categories 
    WHERE parent_id = @parent_bia_id AND thumbnail_url IS NOT NULL 
    ORDER BY sort_order ASC LIMIT 1
),
updated_at = NOW()
WHERE id = @parent_bia_id;

-- Bút các loại - Children
INSERT INTO categories (name, thumbnail_url, description, is_active, parent_id, sort_order, created_at, updated_at, created_by, updated_by, deleted_by)
VALUES 
('Bút dạ quang', 'https://res.cloudinary.com/dlgqtldwk/image/upload/v1764834212/app/dev/categories/thumbnailurl_1764834208206_5cea549e.jpg', 'Bút dạ quang', TRUE, @parent_but_id, 1, NOW(), NOW(), 'root_admin@system.local', NULL, NULL),
('Bút lông bảng - lông dầu', 'https://res.cloudinary.com/dlgqtldwk/image/upload/v1764834257/app/dev/categories/thumbnailurl_1764834253126_1ef37b4f.jpg', 'Bút lông bảng - lông dầu', TRUE, @parent_but_id, 2, NOW(), NOW(), 'root_admin@system.local', NULL, NULL),
('Bút lông dầu', 'https://res.cloudinary.com/dlgqtldwk/image/upload/v1764834431/app/dev/categories/thumbnailurl_1764834427654_72bbdf34.webp', 'Bút lông dầu', TRUE, @parent_but_id, 3, NOW(), NOW(), 'root_admin@system.local', NULL, NULL),
('Bút phấn nước', 'https://res.cloudinary.com/dlgqtldwk/image/upload/v1764834040/app/dev/categories/thumbnailurl_1764834036809_a095688f.jpg', 'Bút phấn nước', TRUE, @parent_but_id, 4, NOW(), NOW(), 'root_admin@system.local', NULL, NULL),
('Bút xóa', 'https://res.cloudinary.com/dlgqtldwk/image/upload/v1764834407/app/dev/categories/thumbnailurl_1764834403931_d30dbe69.jpg', 'Bút xóa', TRUE, @parent_but_id, 5, NOW(), NOW(), 'root_admin@system.local', NULL, NULL);

-- Update parent thumbnail from first child
UPDATE categories 
SET thumbnail_url = (
    SELECT thumbnail_url FROM categories 
    WHERE parent_id = @parent_but_id AND thumbnail_url IS NOT NULL 
    ORDER BY sort_order ASC LIMIT 1
),
updated_at = NOW()
WHERE id = @parent_but_id;

-- Dụng cụ văn phòng - Children
INSERT INTO categories (name, thumbnail_url, description, is_active, parent_id, sort_order, created_at, updated_at, created_by, updated_by, deleted_by)
VALUES 
('Bấm kim', 'https://res.cloudinary.com/dlgqtldwk/image/upload/v1764834298/app/dev/categories/thumbnailurl_1764834294983_9de04801.jpg', 'Bấm kim', TRUE, @parent_dung_cu_id, 1, NOW(), NOW(), 'root_admin@system.local', NULL, NULL),
('Băng keo', 'https://res.cloudinary.com/dlgqtldwk/image/upload/v1764834198/app/dev/categories/thumbnailurl_1764834194866_4847bf2c.jpg', 'Băng keo', TRUE, @parent_dung_cu_id, 2, NOW(), NOW(), 'root_admin@system.local', NULL, NULL),
('Dao rọc giấy', 'https://res.cloudinary.com/dlgqtldwk/image/upload/v1764834246/app/dev/categories/thumbnailurl_1764834241775_41dfa8ec.jpg', 'Dao rọc giấy', TRUE, @parent_dung_cu_id, 3, NOW(), NOW(), 'root_admin@system.local', NULL, NULL),
('Hộp cắm bút', 'https://res.cloudinary.com/dlgqtldwk/image/upload/v1764834468/app/dev/categories/thumbnailurl_1764834464367_2cc7c60a.jpg', 'Hộp cắm bút', TRUE, @parent_dung_cu_id, 4, NOW(), NOW(), 'root_admin@system.local', NULL, NULL),
('Kéo văn phòng', 'https://res.cloudinary.com/dlgqtldwk/image/upload/v1764834276/app/dev/categories/thumbnailurl_1764834272335_4d105182.jpg', 'Kéo văn phòng', TRUE, @parent_dung_cu_id, 5, NOW(), NOW(), 'root_admin@system.local', NULL, NULL),
('Kẹp giấy', 'https://res.cloudinary.com/dlgqtldwk/image/upload/v1764834012/app/dev/categories/thumbnailurl_1764834006092_403f71af.jpg', 'Kẹp giấy', TRUE, @parent_dung_cu_id, 6, NOW(), NOW(), 'root_admin@system.local', NULL, NULL),
('Lưỡi dao rọc giấy', 'https://res.cloudinary.com/dlgqtldwk/image/upload/v1764834396/app/dev/categories/thumbnailurl_1764834392113_505f6b17.jpg', 'Lưỡi dao rọc giấy', TRUE, @parent_dung_cu_id, 7, NOW(), NOW(), 'root_admin@system.local', NULL, NULL);

-- Update existing "Dụng cụ văn phòng" category to have NULL parent_id (it's a parent)
UPDATE categories 
SET parent_id = NULL, sort_order = 3, updated_at = NOW()
WHERE name = 'Dụng cụ văn phòng' AND deleted_by IS NULL;

-- Update parent thumbnail from first child
UPDATE categories 
SET thumbnail_url = (
    SELECT thumbnail_url FROM categories 
    WHERE parent_id = @parent_dung_cu_id AND thumbnail_url IS NOT NULL 
    ORDER BY sort_order ASC LIMIT 1
),
updated_at = NOW()
WHERE id = @parent_dung_cu_id;

-- Pin - Children
INSERT INTO categories (name, thumbnail_url, description, is_active, parent_id, sort_order, created_at, updated_at, created_by, updated_by, deleted_by)
VALUES 
('Pin Alkaline', 'https://res.cloudinary.com/dlgqtldwk/image/upload/v1764834381/app/dev/categories/thumbnailurl_1764834376449_32e57b41.jpg', 'Pin Alkaline', TRUE, @parent_pin_id, 1, NOW(), NOW(), 'root_admin@system.local', NULL, NULL),
('Pin Carbon', 'https://res.cloudinary.com/dlgqtldwk/image/upload/v1764834311/app/dev/categories/thumbnailurl_1764834307070_1d5f3bd9.jpg', 'Pin Carbon', TRUE, @parent_pin_id, 2, NOW(), NOW(), 'root_admin@system.local', NULL, NULL);

-- Update parent thumbnail from first child
UPDATE categories 
SET thumbnail_url = (
    SELECT thumbnail_url FROM categories 
    WHERE parent_id = @parent_pin_id AND thumbnail_url IS NOT NULL 
    ORDER BY sort_order ASC LIMIT 1
),
updated_at = NOW()
WHERE id = @parent_pin_id;

-- Phụ kiện bút - Children
INSERT INTO categories (name, thumbnail_url, description, is_active, parent_id, sort_order, created_at, updated_at, created_by, updated_by, deleted_by)
VALUES 
('Mực bút lông bảng - lông dầu', 'https://res.cloudinary.com/dlgqtldwk/image/upload/v1764834365/app/dev/categories/thumbnailurl_1764834362196_76c198bb.webp', 'Mực bút lông bảng - lông dầu', TRUE, @parent_phu_kien_but_id, 1, NOW(), NOW(), 'root_admin@system.local', NULL, NULL);

-- Update parent thumbnail from first child
UPDATE categories 
SET thumbnail_url = (
    SELECT thumbnail_url FROM categories 
    WHERE parent_id = @parent_phu_kien_but_id AND thumbnail_url IS NOT NULL 
    ORDER BY sort_order ASC LIMIT 1
),
updated_at = NOW()
WHERE id = @parent_phu_kien_but_id;

-- Sổ - Children
INSERT INTO categories (name, thumbnail_url, description, is_active, parent_id, sort_order, created_at, updated_at, created_by, updated_by, deleted_by)
VALUES 
('Sổ lò xo', 'https://res.cloudinary.com/dlgqtldwk/image/upload/v1764834289/app/dev/categories/thumbnailurl_1764834284804_4e21dbe8.jpg', 'Sổ lò xo', TRUE, @parent_so_id, 1, NOW(), NOW(), 'root_admin@system.local', NULL, NULL);

-- Update parent thumbnail from first child
UPDATE categories 
SET thumbnail_url = (
    SELECT thumbnail_url FROM categories 
    WHERE parent_id = @parent_so_id AND thumbnail_url IS NOT NULL 
    ORDER BY sort_order ASC LIMIT 1
),
updated_at = NOW()
WHERE id = @parent_so_id;
