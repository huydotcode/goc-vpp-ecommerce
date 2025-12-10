-- ============================================================================
-- Script để kiểm tra dữ liệu products với JOIN các bảng liên quan
-- ============================================================================

-- 1. Xem tổng quan products với categories
SELECT 
    p.id AS product_id,
    p.name AS product_name,
    p.sku,
    p.price,
    p.discount_price,
    p.brand,
    p.thumbnail_url,
    p.is_active,
    p.is_featured,
    GROUP_CONCAT(c.name SEPARATOR ', ') AS categories,
    COUNT(DISTINCT pv.id) AS variant_count,
    COUNT(DISTINCT pi.id) AS image_count
FROM products p
LEFT JOIN product_categories pc ON p.id = pc.product_id
LEFT JOIN categories c ON pc.category_id = c.id
LEFT JOIN product_variants pv ON p.id = pv.product_id
LEFT JOIN product_images pi ON p.id = pi.product_id
GROUP BY p.id, p.name, p.sku, p.price, p.discount_price, p.brand, p.thumbnail_url, p.is_active, p.is_featured
ORDER BY p.id
LIMIT 20;

-- 2. Xem chi tiết products với variants
SELECT 
    p.id AS product_id,
    p.name AS product_name,
    p.sku AS product_sku,
    p.price AS product_price,
    pv.id AS variant_id,
    pv.variant_type,
    pv.variant_value,
    pv.price AS variant_price,
    pv.stock_quantity,
    pv.sku AS variant_sku,
    pv.is_default,
    pv.is_active AS variant_active
FROM products p
LEFT JOIN product_variants pv ON p.id = pv.product_id
ORDER BY p.id, pv.sort_order, pv.id
LIMIT 50;

-- 3. Xem chi tiết products với images
SELECT 
    p.id AS product_id,
    p.name AS product_name,
    p.thumbnail_url AS product_thumbnail,
    pi.id AS image_id,
    pi.image_url,
    pi.sort_order AS image_sort,
    pi.is_primary
FROM products p
LEFT JOIN product_images pi ON p.id = pi.product_id
ORDER BY p.id, pi.sort_order, pi.id
LIMIT 50;

-- 4. Xem products với categories chi tiết
SELECT 
    p.id AS product_id,
    p.name AS product_name,
    c.id AS category_id,
    c.name AS category_name,
    c.parent_id,
    (SELECT name FROM categories WHERE id = c.parent_id) AS parent_category_name
FROM products p
INNER JOIN product_categories pc ON p.id = pc.product_id
INNER JOIN categories c ON pc.category_id = c.id
ORDER BY p.id, c.id
LIMIT 50;

-- 5. Tổng hợp đầy đủ: Products + Categories + Variants + Images
SELECT 
    p.id AS product_id,
    p.name AS product_name,
    p.sku AS product_sku,
    p.price AS product_price,
    p.discount_price,
    p.brand,
    p.thumbnail_url,
    p.is_active,
    p.is_featured,
    -- Categories
    GROUP_CONCAT(DISTINCT CONCAT(c.id, ':', c.name) SEPARATOR ' | ') AS categories,
    -- Variants summary
    COUNT(DISTINCT pv.id) AS total_variants,
    SUM(CASE WHEN pv.is_active = 1 THEN pv.stock_quantity ELSE 0 END) AS total_stock,
    -- Images summary
    COUNT(DISTINCT pi.id) AS total_images,
    -- First variant info
    MAX(CASE WHEN pv.is_default = 1 THEN pv.variant_value END) AS default_variant,
    -- First image
    MAX(CASE WHEN pi.is_primary = 1 THEN pi.image_url END) AS primary_image
FROM products p
LEFT JOIN product_categories pc ON p.id = pc.product_id
LEFT JOIN categories c ON pc.category_id = c.id
LEFT JOIN product_variants pv ON p.id = pv.product_id AND pv.deleted_by IS NULL
LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.deleted_by IS NULL
GROUP BY p.id, p.name, p.sku, p.price, p.discount_price, p.brand, p.thumbnail_url, p.is_active, p.is_featured
ORDER BY p.id;

-- 6. Kiểm tra products thiếu dữ liệu
SELECT 
    p.id,
    p.name,
    p.sku,
    CASE 
        WHEN p.thumbnail_url IS NULL OR p.thumbnail_url = '' THEN '❌ Thiếu thumbnail'
        ELSE '✓ Có thumbnail'
    END AS thumbnail_status,
    CASE 
        WHEN COUNT(DISTINCT pv.id) = 0 THEN '❌ Không có variant'
        ELSE CONCAT('✓ Có ', COUNT(DISTINCT pv.id), ' variants')
    END AS variant_status,
    CASE 
        WHEN COUNT(DISTINCT pi.id) = 0 THEN '❌ Không có image'
        ELSE CONCAT('✓ Có ', COUNT(DISTINCT pi.id), ' images')
    END AS image_status,
    CASE 
        WHEN COUNT(DISTINCT pc.category_id) = 0 THEN '❌ Không có category'
        ELSE CONCAT('✓ Có ', COUNT(DISTINCT pc.category_id), ' categories')
    END AS category_status
FROM products p
LEFT JOIN product_variants pv ON p.id = pv.product_id AND pv.deleted_by IS NULL
LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.deleted_by IS NULL
LEFT JOIN product_categories pc ON p.id = pc.product_id
GROUP BY p.id, p.name, p.sku, p.thumbnail_url
HAVING 
    p.thumbnail_url IS NULL OR p.thumbnail_url = ''
    OR COUNT(DISTINCT pv.id) = 0
    OR COUNT(DISTINCT pi.id) = 0
    OR COUNT(DISTINCT pc.category_id) = 0
ORDER BY p.id;

-- 7. Thống kê tổng quan
SELECT 
    'Tổng số products' AS metric,
    COUNT(*) AS value
FROM products
WHERE deleted_by IS NULL

UNION ALL

SELECT 
    'Products có variants' AS metric,
    COUNT(DISTINCT p.id) AS value
FROM products p
INNER JOIN product_variants pv ON p.id = pv.product_id
WHERE p.deleted_by IS NULL AND pv.deleted_by IS NULL

UNION ALL

SELECT 
    'Products có images' AS metric,
    COUNT(DISTINCT p.id) AS value
FROM products p
INNER JOIN product_images pi ON p.id = pi.product_id
WHERE p.deleted_by IS NULL AND pi.deleted_by IS NULL

UNION ALL

SELECT 
    'Products có categories' AS metric,
    COUNT(DISTINCT p.id) AS value
FROM products p
INNER JOIN product_categories pc ON p.id = pc.product_id
WHERE p.deleted_by IS NULL

UNION ALL

SELECT 
    'Tổng số variants' AS metric,
    COUNT(*) AS value
FROM product_variants
WHERE deleted_by IS NULL

UNION ALL

SELECT 
    'Tổng số images' AS metric,
    COUNT(*) AS value
FROM product_images
WHERE deleted_by IS NULL

UNION ALL

SELECT 
    'Tổng số categories được sử dụng' AS metric,
    COUNT(DISTINCT category_id) AS value
FROM product_categories;

-- 8. Xem products theo category cụ thể
SELECT 
    p.id,
    p.name,
    p.sku,
    p.price,
    p.discount_price,
    p.thumbnail_url,
    c.name AS category_name,
    COUNT(DISTINCT pv.id) AS variant_count,
    COUNT(DISTINCT pi.id) AS image_count
FROM products p
INNER JOIN product_categories pc ON p.id = pc.product_id
INNER JOIN categories c ON pc.category_id = c.id
LEFT JOIN product_variants pv ON p.id = pv.product_id AND pv.deleted_by IS NULL
LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.deleted_by IS NULL
WHERE c.id = 5  -- Thay đổi category_id ở đây
  AND p.deleted_by IS NULL
GROUP BY p.id, p.name, p.sku, p.price, p.discount_price, p.thumbnail_url, c.name
ORDER BY p.id;