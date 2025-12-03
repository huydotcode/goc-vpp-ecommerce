package com.example.learnspring1.controller;

import com.example.learnspring1.domain.User;
import com.example.learnspring1.domain.dto.CartItemRequestDTO;
import com.example.learnspring1.domain.dto.CartResponseDTO;
import com.example.learnspring1.service.CartService;
import com.example.learnspring1.service.UserService;
import com.example.learnspring1.utils.SecurityUtil;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/cart")
@Tag(name = "Cart", description = "Quản lý giỏ hàng (yêu cầu đăng nhập)")
@SecurityRequirement(name = "Bearer Authentication")
@RequiredArgsConstructor
public class CartController {

    private final CartService cartService;
    private final UserService userService;

    private User getCurrentUser() {
        String currentUserEmail = SecurityUtil.getCurrentUserLogin()
                .orElseThrow(() -> new RuntimeException("User not authenticated"));
        User user = userService.getUserByEmail(currentUserEmail);
        if (user == null) {
            throw new RuntimeException("User not found");
        }
        return user;
    }

    @Operation(summary = "Lấy giỏ hàng của user hiện tại", description = "Trả về giỏ hàng của user đang đăng nhập. Tạo mới nếu chưa có.")
    @GetMapping
    public ResponseEntity<CartResponseDTO> getCart() {
        User currentUser = getCurrentUser();
        CartResponseDTO cart = cartService.getCart(currentUser);
        return ResponseEntity.ok(cart);
    }

    @Operation(summary = "Thêm sản phẩm vào giỏ hàng", description = "Thêm sản phẩm vào giỏ hàng. Nếu sản phẩm đã có, tăng số lượng.")
    @PostMapping("/items")
    public ResponseEntity<CartResponseDTO> addItem(@Valid @RequestBody CartItemRequestDTO request) {
        User currentUser = getCurrentUser();
        CartResponseDTO cart = cartService.addItem(currentUser, request);
        return ResponseEntity.ok(cart);
    }

    @Operation(summary = "Cập nhật số lượng sản phẩm", description = "Cập nhật số lượng của một sản phẩm trong giỏ hàng.")
    @PutMapping("/items/{cartItemId}")
    public ResponseEntity<CartResponseDTO> updateItemQuantity(
            @PathVariable Long cartItemId,
            @RequestParam Integer quantity) {
        User currentUser = getCurrentUser();
        CartResponseDTO cart = cartService.updateItemQuantity(currentUser, cartItemId, quantity);
        return ResponseEntity.ok(cart);
    }

    @Operation(summary = "Xóa sản phẩm khỏi giỏ hàng", description = "Xóa một sản phẩm khỏi giỏ hàng.")
    @DeleteMapping("/items/{cartItemId}")
    public ResponseEntity<CartResponseDTO> removeItem(@PathVariable Long cartItemId) {
        User currentUser = getCurrentUser();
        CartResponseDTO cart = cartService.removeItem(currentUser, cartItemId);
        return ResponseEntity.ok(cart);
    }

    @Operation(summary = "Xóa toàn bộ giỏ hàng", description = "Xóa tất cả sản phẩm trong giỏ hàng.")
    @DeleteMapping
    public ResponseEntity<Void> clearCart() {
        User currentUser = getCurrentUser();
        cartService.clearCart(currentUser);
        return ResponseEntity.noContent().build();
    }
}
