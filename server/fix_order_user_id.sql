-- Script để sửa constraint user_id trong bảng orders
-- Chạy script này trong database để cho phép user_id = NULL

ALTER TABLE orders MODIFY COLUMN user_id BIGINT NULL;

