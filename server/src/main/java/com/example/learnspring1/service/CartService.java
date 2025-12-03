package com.example.learnspring1.service;

import com.example.learnspring1.domain.dto.CartItemRequestDTO;
import com.example.learnspring1.domain.dto.CartResponseDTO;
import com.example.learnspring1.domain.User;

public interface CartService {
    // Lấy giỏ hàng của user (tạo mới nếu chưa có)
    CartResponseDTO getCart(User user);

    // Thêm sản phẩm vào giỏ hàng
    CartResponseDTO addItem(User user, CartItemRequestDTO request);

    // Cập nhật số lượng sản phẩm
    CartResponseDTO updateItemQuantity(User user, Long cartItemId, Integer quantity);

    // Xóa sản phẩm khỏi giỏ hàng
    CartResponseDTO removeItem(User user, Long cartItemId);

    // Xóa toàn bộ giỏ hàng
    void clearCart(User user);

    // Xóa giỏ hàng sau khi checkout thành công
    void deleteCartAfterCheckout(User user);
}
