-- ============================================================================
-- Categories data from Fahasa
-- Total categories: 73
-- Structure: Main categories (level 1) + Subcategories (level 2)
-- ============================================================================

SET @created_by = 'system';

-- Level 1 (Main): Bút - Viết (ID: 100, Parent: NULL)
INSERT INTO categories (
    id, name, description, is_active, parent_id, sort_order,
    created_at, updated_at, created_by, updated_by, deleted_by
) VALUES (
    100, 'Bút - Viết', 'Fahasa cat_id: 279', TRUE, NULL, 1,
    NOW(), NOW(), @created_by, NULL, NULL
);

-- Level 2 (Sub): Bút Gel - Bút Nước - Ruột Bút Gel (ID: 101, Parent: 100)
INSERT INTO categories (
    id, name, description, is_active, parent_id, sort_order,
    created_at, updated_at, created_by, updated_by, deleted_by
) VALUES (
    101, 'Bút Gel - Bút Nước - Ruột Bút Gel', 'Fahasa cat_id: 6212', TRUE, 100, 1,
    NOW(), NOW(), @created_by, NULL, NULL
);

-- Level 2 (Sub): Bút Chì - Ruột Bút Chì (ID: 102, Parent: 100)
INSERT INTO categories (
    id, name, description, is_active, parent_id, sort_order,
    created_at, updated_at, created_by, updated_by, deleted_by
) VALUES (
    102, 'Bút Chì - Ruột Bút Chì', 'Fahasa cat_id: 6203', TRUE, 100, 2,
    NOW(), NOW(), @created_by, NULL, NULL
);

-- Level 2 (Sub): Bút Bi - Ruột Bút Bi (ID: 103, Parent: 100)
INSERT INTO categories (
    id, name, description, is_active, parent_id, sort_order,
    created_at, updated_at, created_by, updated_by, deleted_by
) VALUES (
    103, 'Bút Bi - Ruột Bút Bi', 'Fahasa cat_id: 6200', TRUE, 100, 3,
    NOW(), NOW(), @created_by, NULL, NULL
);

-- Level 2 (Sub): Bút Lông (ID: 104, Parent: 100)
INSERT INTO categories (
    id, name, description, is_active, parent_id, sort_order,
    created_at, updated_at, created_by, updated_by, deleted_by
) VALUES (
    104, 'Bút Lông', 'Fahasa cat_id: 6207', TRUE, 100, 4,
    NOW(), NOW(), @created_by, NULL, NULL
);

-- Level 2 (Sub): Bút Dạ Quang (ID: 105, Parent: 100)
INSERT INTO categories (
    id, name, description, is_active, parent_id, sort_order,
    created_at, updated_at, created_by, updated_by, deleted_by
) VALUES (
    105, 'Bút Dạ Quang', 'Fahasa cat_id: 6208', TRUE, 100, 5,
    NOW(), NOW(), @created_by, NULL, NULL
);

-- Level 2 (Sub): Bút Kỹ Thuật (ID: 106, Parent: 100)
INSERT INTO categories (
    id, name, description, is_active, parent_id, sort_order,
    created_at, updated_at, created_by, updated_by, deleted_by
) VALUES (
    106, 'Bút Kỹ Thuật', 'Fahasa cat_id: 6213', TRUE, 100, 6,
    NOW(), NOW(), @created_by, NULL, NULL
);

-- Level 2 (Sub): Bút Mực - Bút Máy (ID: 107, Parent: 100)
INSERT INTO categories (
    id, name, description, is_active, parent_id, sort_order,
    created_at, updated_at, created_by, updated_by, deleted_by
) VALUES (
    107, 'Bút Mực - Bút Máy', 'Fahasa cat_id: 6199', TRUE, 100, 7,
    NOW(), NOW(), @created_by, NULL, NULL
);

-- Level 2 (Sub): Bút Cao Cấp (ID: 108, Parent: 100)
INSERT INTO categories (
    id, name, description, is_active, parent_id, sort_order,
    created_at, updated_at, created_by, updated_by, deleted_by
) VALUES (
    108, 'Bút Cao Cấp', 'Fahasa cat_id: 6219', TRUE, 100, 8,
    NOW(), NOW(), @created_by, NULL, NULL
);

-- Level 2 (Sub): Bút Thư Pháp (ID: 109, Parent: 100)
INSERT INTO categories (
    id, name, description, is_active, parent_id, sort_order,
    created_at, updated_at, created_by, updated_by, deleted_by
) VALUES (
    109, 'Bút Thư Pháp', 'Fahasa cat_id: 6214', TRUE, 100, 9,
    NOW(), NOW(), @created_by, NULL, NULL
);

-- Level 2 (Sub): Bút Sơn (ID: 110, Parent: 100)
INSERT INTO categories (
    id, name, description, is_active, parent_id, sort_order,
    created_at, updated_at, created_by, updated_by, deleted_by
) VALUES (
    110, 'Bút Sơn', 'Fahasa cat_id: 6217', TRUE, 100, 10,
    NOW(), NOW(), @created_by, NULL, NULL
);

-- Level 2 (Sub): Bút Ký (ID: 111, Parent: 100)
INSERT INTO categories (
    id, name, description, is_active, parent_id, sort_order,
    created_at, updated_at, created_by, updated_by, deleted_by
) VALUES (
    111, 'Bút Ký', 'Fahasa cat_id: 6229', TRUE, 100, 11,
    NOW(), NOW(), @created_by, NULL, NULL
);

-- Level 1 (Main): Sản phẩm về giấy (ID: 112, Parent: NULL)
INSERT INTO categories (
    id, name, description, is_active, parent_id, sort_order,
    created_at, updated_at, created_by, updated_by, deleted_by
) VALUES (
    112, 'Sản phẩm về giấy', 'Fahasa cat_id: 96', TRUE, NULL, 2,
    NOW(), NOW(), @created_by, NULL, NULL
);

-- Level 2 (Sub): Sổ Các Loại (ID: 113, Parent: 112)
INSERT INTO categories (
    id, name, description, is_active, parent_id, sort_order,
    created_at, updated_at, created_by, updated_by, deleted_by
) VALUES (
    113, 'Sổ Các Loại', 'Fahasa cat_id: 6319', TRUE, 112, 1,
    NOW(), NOW(), @created_by, NULL, NULL
);

-- Level 2 (Sub): Tập - Vở (ID: 114, Parent: 112)
INSERT INTO categories (
    id, name, description, is_active, parent_id, sort_order,
    created_at, updated_at, created_by, updated_by, deleted_by
) VALUES (
    114, 'Tập - Vở', 'Fahasa cat_id: 6309', TRUE, 112, 2,
    NOW(), NOW(), @created_by, NULL, NULL
);

-- Level 2 (Sub): Giấy Note (ID: 115, Parent: 112)
INSERT INTO categories (
    id, name, description, is_active, parent_id, sort_order,
    created_at, updated_at, created_by, updated_by, deleted_by
) VALUES (
    115, 'Giấy Note', 'Fahasa cat_id: 6318', TRUE, 112, 3,
    NOW(), NOW(), @created_by, NULL, NULL
);

-- Level 2 (Sub): Các Loại Giấy Khác (ID: 116, Parent: 112)
INSERT INTO categories (
    id, name, description, is_active, parent_id, sort_order,
    created_at, updated_at, created_by, updated_by, deleted_by
) VALUES (
    116, 'Các Loại Giấy Khác', 'Fahasa cat_id: 6478', TRUE, 112, 4,
    NOW(), NOW(), @created_by, NULL, NULL
);

-- Level 2 (Sub): Sticker (ID: 117, Parent: 112)
INSERT INTO categories (
    id, name, description, is_active, parent_id, sort_order,
    created_at, updated_at, created_by, updated_by, deleted_by
) VALUES (
    117, 'Sticker', 'Fahasa cat_id: 6381', TRUE, 112, 5,
    NOW(), NOW(), @created_by, NULL, NULL
);

-- Level 2 (Sub): Nhãn Vở - Nhãn Tên (ID: 118, Parent: 112)
INSERT INTO categories (
    id, name, description, is_active, parent_id, sort_order,
    created_at, updated_at, created_by, updated_by, deleted_by
) VALUES (
    118, 'Nhãn Vở - Nhãn Tên', 'Fahasa cat_id: 6317', TRUE, 112, 6,
    NOW(), NOW(), @created_by, NULL, NULL
);

-- Level 2 (Sub): Giấy Thủ Công - Giấy Màu (ID: 119, Parent: 112)
INSERT INTO categories (
    id, name, description, is_active, parent_id, sort_order,
    created_at, updated_at, created_by, updated_by, deleted_by
) VALUES (
    119, 'Giấy Thủ Công - Giấy Màu', 'Fahasa cat_id: 6313', TRUE, 112, 7,
    NOW(), NOW(), @created_by, NULL, NULL
);

-- Level 2 (Sub): Giấy Kiểm Tra (ID: 120, Parent: 112)
INSERT INTO categories (
    id, name, description, is_active, parent_id, sort_order,
    created_at, updated_at, created_by, updated_by, deleted_by
) VALUES (
    120, 'Giấy Kiểm Tra', 'Fahasa cat_id: 6314', TRUE, 112, 8,
    NOW(), NOW(), @created_by, NULL, NULL
);

-- Level 2 (Sub): Đánh Dấu Trang - Giấy Phân Trang (ID: 121, Parent: 112)
INSERT INTO categories (
    id, name, description, is_active, parent_id, sort_order,
    created_at, updated_at, created_by, updated_by, deleted_by
) VALUES (
    121, 'Đánh Dấu Trang - Giấy Phân Trang', 'Fahasa cat_id: 6322', TRUE, 112, 9,
    NOW(), NOW(), @created_by, NULL, NULL
);

-- Level 2 (Sub): Giấy Kê Tay (ID: 122, Parent: 112)
INSERT INTO categories (
    id, name, description, is_active, parent_id, sort_order,
    created_at, updated_at, created_by, updated_by, deleted_by
) VALUES (
    122, 'Giấy Kê Tay', 'Fahasa cat_id: 6310', TRUE, 112, 10,
    NOW(), NOW(), @created_by, NULL, NULL
);

-- Level 2 (Sub): Giấy Photo (ID: 123, Parent: 112)
INSERT INTO categories (
    id, name, description, is_active, parent_id, sort_order,
    created_at, updated_at, created_by, updated_by, deleted_by
) VALUES (
    123, 'Giấy Photo', 'Fahasa cat_id: 6320', TRUE, 112, 11,
    NOW(), NOW(), @created_by, NULL, NULL
);

-- Level 2 (Sub): Tập Chép Nhạc (ID: 124, Parent: 112)
INSERT INTO categories (
    id, name, description, is_active, parent_id, sort_order,
    created_at, updated_at, created_by, updated_by, deleted_by
) VALUES (
    124, 'Tập Chép Nhạc', 'Fahasa cat_id: 6312', TRUE, 112, 12,
    NOW(), NOW(), @created_by, NULL, NULL
);

-- Level 2 (Sub): Flash Card (ID: 125, Parent: 112)
INSERT INTO categories (
    id, name, description, is_active, parent_id, sort_order,
    created_at, updated_at, created_by, updated_by, deleted_by
) VALUES (
    125, 'Flash Card', 'Fahasa cat_id: 6330', TRUE, 112, 13,
    NOW(), NOW(), @created_by, NULL, NULL
);

-- Level 2 (Sub): Giấy Bìa (ID: 126, Parent: 112)
INSERT INTO categories (
    id, name, description, is_active, parent_id, sort_order,
    created_at, updated_at, created_by, updated_by, deleted_by
) VALUES (
    126, 'Giấy Bìa', 'Fahasa cat_id: 6482', TRUE, 112, 14,
    NOW(), NOW(), @created_by, NULL, NULL
);

-- Level 2 (Sub): Thời Khóa Biểu (ID: 127, Parent: 112)
INSERT INTO categories (
    id, name, description, is_active, parent_id, sort_order,
    created_at, updated_at, created_by, updated_by, deleted_by
) VALUES (
    127, 'Thời Khóa Biểu', 'Fahasa cat_id: 6311', TRUE, 112, 15,
    NOW(), NOW(), @created_by, NULL, NULL
);

-- Level 2 (Sub): Bao Lì Xì (ID: 128, Parent: 112)
INSERT INTO categories (
    id, name, description, is_active, parent_id, sort_order,
    created_at, updated_at, created_by, updated_by, deleted_by
) VALUES (
    128, 'Bao Lì Xì', 'Fahasa cat_id: 6759', TRUE, 112, 16,
    NOW(), NOW(), @created_by, NULL, NULL
);

-- Level 1 (Main): Dụng cụ học sinh (ID: 129, Parent: NULL)
INSERT INTO categories (
    id, name, description, is_active, parent_id, sort_order,
    created_at, updated_at, created_by, updated_by, deleted_by
) VALUES (
    129, 'Dụng cụ học sinh', 'Fahasa cat_id: 94', TRUE, NULL, 3,
    NOW(), NOW(), @created_by, NULL, NULL
);

-- Level 2 (Sub): Gôm - tẩy (ID: 130, Parent: 129)
INSERT INTO categories (
    id, name, description, is_active, parent_id, sort_order,
    created_at, updated_at, created_by, updated_by, deleted_by
) VALUES (
    130, 'Gôm - tẩy', 'Fahasa cat_id: 3108', TRUE, 129, 1,
    NOW(), NOW(), @created_by, NULL, NULL
);

-- Level 2 (Sub): Bóp Viết - Hộp Bút (ID: 131, Parent: 129)
INSERT INTO categories (
    id, name, description, is_active, parent_id, sort_order,
    created_at, updated_at, created_by, updated_by, deleted_by
) VALUES (
    131, 'Bóp Viết - Hộp Bút', 'Fahasa cat_id: 268', TRUE, 129, 2,
    NOW(), NOW(), @created_by, NULL, NULL
);

-- Level 2 (Sub): Gọt Bút Chì (ID: 132, Parent: 129)
INSERT INTO categories (
    id, name, description, is_active, parent_id, sort_order,
    created_at, updated_at, created_by, updated_by, deleted_by
) VALUES (
    132, 'Gọt Bút Chì', 'Fahasa cat_id: 269', TRUE, 129, 3,
    NOW(), NOW(), @created_by, NULL, NULL
);

-- Level 2 (Sub): Thước (ID: 133, Parent: 129)
INSERT INTO categories (
    id, name, description, is_active, parent_id, sort_order,
    created_at, updated_at, created_by, updated_by, deleted_by
) VALUES (
    133, 'Thước', 'Fahasa cat_id: 3153', TRUE, 129, 4,
    NOW(), NOW(), @created_by, NULL, NULL
);

-- Level 2 (Sub): Ba Lô (ID: 134, Parent: 129)
INSERT INTO categories (
    id, name, description, is_active, parent_id, sort_order,
    created_at, updated_at, created_by, updated_by, deleted_by
) VALUES (
    134, 'Ba Lô', 'Fahasa cat_id: 7038', TRUE, 129, 5,
    NOW(), NOW(), @created_by, NULL, NULL
);

-- Level 2 (Sub): Bao Tập - Bao Sách (ID: 135, Parent: 129)
INSERT INTO categories (
    id, name, description, is_active, parent_id, sort_order,
    created_at, updated_at, created_by, updated_by, deleted_by
) VALUES (
    135, 'Bao Tập - Bao Sách', 'Fahasa cat_id: 6148', TRUE, 129, 6,
    NOW(), NOW(), @created_by, NULL, NULL
);

-- Level 2 (Sub): Bảng Viết - Bông Lau Bảng (ID: 136, Parent: 129)
INSERT INTO categories (
    id, name, description, is_active, parent_id, sort_order,
    created_at, updated_at, created_by, updated_by, deleted_by
) VALUES (
    136, 'Bảng Viết - Bông Lau Bảng', 'Fahasa cat_id: 281', TRUE, 129, 7,
    NOW(), NOW(), @created_by, NULL, NULL
);

-- Level 2 (Sub): Compa (ID: 137, Parent: 129)
INSERT INTO categories (
    id, name, description, is_active, parent_id, sort_order,
    created_at, updated_at, created_by, updated_by, deleted_by
) VALUES (
    137, 'Compa', 'Fahasa cat_id: 3156', TRUE, 129, 8,
    NOW(), NOW(), @created_by, NULL, NULL
);

-- Level 2 (Sub): Bộ Dụng Cụ Học Tập (ID: 138, Parent: 129)
INSERT INTO categories (
    id, name, description, is_active, parent_id, sort_order,
    created_at, updated_at, created_by, updated_by, deleted_by
) VALUES (
    138, 'Bộ Dụng Cụ Học Tập', 'Fahasa cat_id: 6150', TRUE, 129, 9,
    NOW(), NOW(), @created_by, NULL, NULL
);

-- Level 2 (Sub): Mực (ID: 139, Parent: 129)
INSERT INTO categories (
    id, name, description, is_active, parent_id, sort_order,
    created_at, updated_at, created_by, updated_by, deleted_by
) VALUES (
    139, 'Mực', 'Fahasa cat_id: 3151', TRUE, 129, 10,
    NOW(), NOW(), @created_by, NULL, NULL
);

-- Level 2 (Sub): Dụng Cụ Học Sinh Khác (ID: 140, Parent: 129)
INSERT INTO categories (
    id, name, description, is_active, parent_id, sort_order,
    created_at, updated_at, created_by, updated_by, deleted_by
) VALUES (
    140, 'Dụng Cụ Học Sinh Khác', 'Fahasa cat_id: 6474', TRUE, 129, 11,
    NOW(), NOW(), @created_by, NULL, NULL
);

-- Level 2 (Sub): Phấn - Hộp Đựng Phấn (ID: 141, Parent: 129)
INSERT INTO categories (
    id, name, description, is_active, parent_id, sort_order,
    created_at, updated_at, created_by, updated_by, deleted_by
) VALUES (
    141, 'Phấn - Hộp Đựng Phấn', 'Fahasa cat_id: 6237', TRUE, 129, 12,
    NOW(), NOW(), @created_by, NULL, NULL
);

-- Level 2 (Sub): Cặp (ID: 142, Parent: 129)
INSERT INTO categories (
    id, name, description, is_active, parent_id, sort_order,
    created_at, updated_at, created_by, updated_by, deleted_by
) VALUES (
    142, 'Cặp', 'Fahasa cat_id: 7037', TRUE, 129, 13,
    NOW(), NOW(), @created_by, NULL, NULL
);

-- Level 1 (Main): Dụng Cụ Vẽ (ID: 143, Parent: NULL)
INSERT INTO categories (
    id, name, description, is_active, parent_id, sort_order,
    created_at, updated_at, created_by, updated_by, deleted_by
) VALUES (
    143, 'Dụng Cụ Vẽ', 'Fahasa cat_id: 6221', TRUE, NULL, 4,
    NOW(), NOW(), @created_by, NULL, NULL
);

-- Level 2 (Sub): Bút Vẽ (ID: 144, Parent: 143)
INSERT INTO categories (
    id, name, description, is_active, parent_id, sort_order,
    created_at, updated_at, created_by, updated_by, deleted_by
) VALUES (
    144, 'Bút Vẽ', 'Fahasa cat_id: 6222', TRUE, 143, 1,
    NOW(), NOW(), @created_by, NULL, NULL
);

-- Level 2 (Sub): Màu Vẽ (ID: 145, Parent: 143)
INSERT INTO categories (
    id, name, description, is_active, parent_id, sort_order,
    created_at, updated_at, created_by, updated_by, deleted_by
) VALUES (
    145, 'Màu Vẽ', 'Fahasa cat_id: 6227', TRUE, 143, 2,
    NOW(), NOW(), @created_by, NULL, NULL
);

-- Level 2 (Sub): Tập Vẽ - Giấy Vẽ (ID: 146, Parent: 143)
INSERT INTO categories (
    id, name, description, is_active, parent_id, sort_order,
    created_at, updated_at, created_by, updated_by, deleted_by
) VALUES (
    146, 'Tập Vẽ - Giấy Vẽ', 'Fahasa cat_id: 6228', TRUE, 143, 3,
    NOW(), NOW(), @created_by, NULL, NULL
);

-- Level 2 (Sub): Khay - Cọ Vẽ (ID: 147, Parent: 143)
INSERT INTO categories (
    id, name, description, is_active, parent_id, sort_order,
    created_at, updated_at, created_by, updated_by, deleted_by
) VALUES (
    147, 'Khay - Cọ Vẽ', 'Fahasa cat_id: 6226', TRUE, 143, 4,
    NOW(), NOW(), @created_by, NULL, NULL
);

-- Level 2 (Sub): Bộ Vẽ Sáng Tạo (ID: 148, Parent: 143)
INSERT INTO categories (
    id, name, description, is_active, parent_id, sort_order,
    created_at, updated_at, created_by, updated_by, deleted_by
) VALUES (
    148, 'Bộ Vẽ Sáng Tạo', 'Fahasa cat_id: 6232', TRUE, 143, 5,
    NOW(), NOW(), @created_by, NULL, NULL
);

-- Level 2 (Sub): Giá Vẽ - Khung Vẽ (ID: 149, Parent: 143)
INSERT INTO categories (
    id, name, description, is_active, parent_id, sort_order,
    created_at, updated_at, created_by, updated_by, deleted_by
) VALUES (
    149, 'Giá Vẽ - Khung Vẽ', 'Fahasa cat_id: 6294', TRUE, 143, 6,
    NOW(), NOW(), @created_by, NULL, NULL
);

-- Level 1 (Main): Sản Phẩm VPP Khác (ID: 150, Parent: NULL)
INSERT INTO categories (
    id, name, description, is_active, parent_id, sort_order,
    created_at, updated_at, created_by, updated_by, deleted_by
) VALUES (
    150, 'Sản Phẩm VPP Khác', 'Fahasa cat_id: 6281', TRUE, NULL, 5,
    NOW(), NOW(), @created_by, NULL, NULL
);

-- Level 2 (Sub): Dao Rọc Giấy - Lưỡi Dao Rọc Giấy - Kéo (ID: 151, Parent: 150)
INSERT INTO categories (
    id, name, description, is_active, parent_id, sort_order,
    created_at, updated_at, created_by, updated_by, deleted_by
) VALUES (
    151, 'Dao Rọc Giấy - Lưỡi Dao Rọc Giấy - Kéo', 'Fahasa cat_id: 6282', TRUE, 150, 1,
    NOW(), NOW(), @created_by, NULL, NULL
);

-- Level 2 (Sub): Bút Xóa Nước - Xóa Kéo (ID: 152, Parent: 150)
INSERT INTO categories (
    id, name, description, is_active, parent_id, sort_order,
    created_at, updated_at, created_by, updated_by, deleted_by
) VALUES (
    152, 'Bút Xóa Nước - Xóa Kéo', 'Fahasa cat_id: 6285', TRUE, 150, 2,
    NOW(), NOW(), @created_by, NULL, NULL
);

-- Level 2 (Sub): Keo Khô - Hồ Dán (ID: 153, Parent: 150)
INSERT INTO categories (
    id, name, description, is_active, parent_id, sort_order,
    created_at, updated_at, created_by, updated_by, deleted_by
) VALUES (
    153, 'Keo Khô - Hồ Dán', 'Fahasa cat_id: 6284', TRUE, 150, 3,
    NOW(), NOW(), @created_by, NULL, NULL
);

-- Level 2 (Sub): Băng Keo - Cắt Băng Keo (ID: 154, Parent: 150)
INSERT INTO categories (
    id, name, description, is_active, parent_id, sort_order,
    created_at, updated_at, created_by, updated_by, deleted_by
) VALUES (
    154, 'Băng Keo - Cắt Băng Keo', 'Fahasa cat_id: 6283', TRUE, 150, 4,
    NOW(), NOW(), @created_by, NULL, NULL
);

-- Level 2 (Sub): Dây Đeo - Bảng Tên (ID: 155, Parent: 150)
INSERT INTO categories (
    id, name, description, is_active, parent_id, sort_order,
    created_at, updated_at, created_by, updated_by, deleted_by
) VALUES (
    155, 'Dây Đeo - Bảng Tên', 'Fahasa cat_id: 6475', TRUE, 150, 5,
    NOW(), NOW(), @created_by, NULL, NULL
);

-- Level 2 (Sub): Văn Phòng Phẩm Khác (ID: 156, Parent: 150)
INSERT INTO categories (
    id, name, description, is_active, parent_id, sort_order,
    created_at, updated_at, created_by, updated_by, deleted_by
) VALUES (
    156, 'Văn Phòng Phẩm Khác', 'Fahasa cat_id: 6473', TRUE, 150, 6,
    NOW(), NOW(), @created_by, NULL, NULL
);

-- Level 2 (Sub): Quả Địa Cầu (ID: 157, Parent: 150)
INSERT INTO categories (
    id, name, description, is_active, parent_id, sort_order,
    created_at, updated_at, created_by, updated_by, deleted_by
) VALUES (
    157, 'Quả Địa Cầu', 'Fahasa cat_id: 7047', TRUE, 150, 7,
    NOW(), NOW(), @created_by, NULL, NULL
);

-- Level 1 (Main): Dụng cụ văn phòng (ID: 158, Parent: NULL)
INSERT INTO categories (
    id, name, description, is_active, parent_id, sort_order,
    created_at, updated_at, created_by, updated_by, deleted_by
) VALUES (
    158, 'Dụng cụ văn phòng', 'Fahasa cat_id: 95', TRUE, NULL, 6,
    NOW(), NOW(), @created_by, NULL, NULL
);

-- Level 2 (Sub): Bìa - File Hồ Sơ (ID: 159, Parent: 158)
INSERT INTO categories (
    id, name, description, is_active, parent_id, sort_order,
    created_at, updated_at, created_by, updated_by, deleted_by
) VALUES (
    159, 'Bìa - File Hồ Sơ', 'Fahasa cat_id: 6261', TRUE, 158, 1,
    NOW(), NOW(), @created_by, NULL, NULL
);

-- Level 2 (Sub): Đồ Bấm Kim - Kim Bấm - Gỡ Kim - Kim Kẹp (ID: 160, Parent: 158)
INSERT INTO categories (
    id, name, description, is_active, parent_id, sort_order,
    created_at, updated_at, created_by, updated_by, deleted_by
) VALUES (
    160, 'Đồ Bấm Kim - Kim Bấm - Gỡ Kim - Kim Kẹp', 'Fahasa cat_id: 240', TRUE, 158, 2,
    NOW(), NOW(), @created_by, NULL, NULL
);

-- Level 2 (Sub): Kẹp Giấy - Kẹp Bướm - Kẹp Các Loại (ID: 161, Parent: 158)
INSERT INTO categories (
    id, name, description, is_active, parent_id, sort_order,
    created_at, updated_at, created_by, updated_by, deleted_by
) VALUES (
    161, 'Kẹp Giấy - Kẹp Bướm - Kẹp Các Loại', 'Fahasa cat_id: 6145', TRUE, 158, 3,
    NOW(), NOW(), @created_by, NULL, NULL
);

-- Level 2 (Sub): Cắm Bút (ID: 162, Parent: 158)
INSERT INTO categories (
    id, name, description, is_active, parent_id, sort_order,
    created_at, updated_at, created_by, updated_by, deleted_by
) VALUES (
    162, 'Cắm Bút', 'Fahasa cat_id: 6147', TRUE, 158, 4,
    NOW(), NOW(), @created_by, NULL, NULL
);

-- Level 2 (Sub): Mực Dấu - Con Dấu - Tăm Bông (ID: 163, Parent: 158)
INSERT INTO categories (
    id, name, description, is_active, parent_id, sort_order,
    created_at, updated_at, created_by, updated_by, deleted_by
) VALUES (
    163, 'Mực Dấu - Con Dấu - Tăm Bông', 'Fahasa cat_id: 5965', TRUE, 158, 5,
    NOW(), NOW(), @created_by, NULL, NULL
);

-- Level 2 (Sub): Đục Lỗ - Máy bấm giá (ID: 164, Parent: 158)
INSERT INTO categories (
    id, name, description, is_active, parent_id, sort_order,
    created_at, updated_at, created_by, updated_by, deleted_by
) VALUES (
    164, 'Đục Lỗ - Máy bấm giá', 'Fahasa cat_id: 241', TRUE, 158, 6,
    NOW(), NOW(), @created_by, NULL, NULL
);

-- Level 1 (Main): Lịch Agenda (ID: 165, Parent: NULL)
INSERT INTO categories (
    id, name, description, is_active, parent_id, sort_order,
    created_at, updated_at, created_by, updated_by, deleted_by
) VALUES (
    165, 'Lịch Agenda', 'Fahasa cat_id: 6523', TRUE, NULL, 7,
    NOW(), NOW(), @created_by, NULL, NULL
);

-- Level 2 (Sub): Lịch bloc (ID: 166, Parent: 165)
INSERT INTO categories (
    id, name, description, is_active, parent_id, sort_order,
    created_at, updated_at, created_by, updated_by, deleted_by
) VALUES (
    166, 'Lịch bloc', 'Fahasa cat_id: 6525', TRUE, 165, 1,
    NOW(), NOW(), @created_by, NULL, NULL
);

-- Level 2 (Sub): Lịch bàn (ID: 167, Parent: 165)
INSERT INTO categories (
    id, name, description, is_active, parent_id, sort_order,
    created_at, updated_at, created_by, updated_by, deleted_by
) VALUES (
    167, 'Lịch bàn', 'Fahasa cat_id: 6526', TRUE, 165, 2,
    NOW(), NOW(), @created_by, NULL, NULL
);

-- Level 2 (Sub): Lịch Tờ, Lịch Lò Xo (ID: 168, Parent: 165)
INSERT INTO categories (
    id, name, description, is_active, parent_id, sort_order,
    created_at, updated_at, created_by, updated_by, deleted_by
) VALUES (
    168, 'Lịch Tờ, Lịch Lò Xo', 'Fahasa cat_id: 6524', TRUE, 165, 3,
    NOW(), NOW(), @created_by, NULL, NULL
);

-- Level 2 (Sub): Lịch khác (ID: 169, Parent: 165)
INSERT INTO categories (
    id, name, description, is_active, parent_id, sort_order,
    created_at, updated_at, created_by, updated_by, deleted_by
) VALUES (
    169, 'Lịch khác', 'Fahasa cat_id: 6527', TRUE, 165, 4,
    NOW(), NOW(), @created_by, NULL, NULL
);

-- Level 1 (Main): Sản Phẩm Điện Tử (ID: 170, Parent: NULL)
INSERT INTO categories (
    id, name, description, is_active, parent_id, sort_order,
    created_at, updated_at, created_by, updated_by, deleted_by
) VALUES (
    170, 'Sản Phẩm Điện Tử', 'Fahasa cat_id: 6298', TRUE, NULL, 8,
    NOW(), NOW(), @created_by, NULL, NULL
);

-- Level 2 (Sub): Máy tính điện tử (ID: 171, Parent: 170)
INSERT INTO categories (
    id, name, description, is_active, parent_id, sort_order,
    created_at, updated_at, created_by, updated_by, deleted_by
) VALUES (
    171, 'Máy tính điện tử', 'Fahasa cat_id: 6299', TRUE, 170, 1,
    NOW(), NOW(), @created_by, NULL, NULL
);

-- Level 1 (Main): Thiệp (ID: 172, Parent: NULL)
INSERT INTO categories (
    id, name, description, is_active, parent_id, sort_order,
    created_at, updated_at, created_by, updated_by, deleted_by
) VALUES (
    172, 'Thiệp', 'Fahasa cat_id: 6529', TRUE, NULL, 9,
    NOW(), NOW(), @created_by, NULL, NULL
);
