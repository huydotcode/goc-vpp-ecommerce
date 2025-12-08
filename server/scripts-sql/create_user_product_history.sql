-- Tạo bảng user_product_history để lưu lịch sử xem sản phẩm của người dùng
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

