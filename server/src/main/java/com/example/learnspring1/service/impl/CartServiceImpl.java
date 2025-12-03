package com.example.learnspring1.service.impl;

import com.example.learnspring1.domain.*;
import com.example.learnspring1.domain.dto.CartItemRequestDTO;
import com.example.learnspring1.domain.dto.CartResponseDTO;
import com.example.learnspring1.repository.CartItemRepository;
import com.example.learnspring1.repository.CartRepository;
import com.example.learnspring1.repository.ProductRepository;
import com.example.learnspring1.service.CartService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class CartServiceImpl implements CartService {

    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final ProductRepository productRepository;

    @Override
    public CartResponseDTO getCart(User user) {
        Cart cart = cartRepository.findByUser(user)
                .orElseGet(() -> {
                    Cart newCart = Cart.builder()
                            .user(user)
                            .build();
                    return cartRepository.save(newCart);
                });
        return mapToDTO(cart);
    }

    @Override
    public CartResponseDTO addItem(User user, CartItemRequestDTO request) {
        Product product = productRepository.findById(request.getProductId())
                .orElseThrow(() -> new RuntimeException("Product not found"));

        // Kiểm tra tồn kho
        if (product.getStockQuantity() == null || product.getStockQuantity() < request.getQuantity()) {
            throw new RuntimeException("Insufficient stock");
        }

        // Kiểm tra sản phẩm có active không
        if (product.getIsActive() == null || !product.getIsActive()) {
            throw new RuntimeException("Product is not available");
        }

        Cart cart = cartRepository.findByUser(user)
                .orElseGet(() -> {
                    Cart newCart = Cart.builder().user(user).build();
                    return cartRepository.save(newCart);
                });

        // Kiểm tra sản phẩm đã có trong giỏ chưa
        CartItem existingItem = cartItemRepository.findByCartAndProduct(cart, product)
                .orElse(null);

        if (existingItem != null) {
            // Cập nhật số lượng
            int newQuantity = existingItem.getQuantity() + request.getQuantity();
            if (product.getStockQuantity() < newQuantity) {
                throw new RuntimeException("Insufficient stock");
            }
            existingItem.setQuantity(newQuantity);
            cartItemRepository.save(existingItem);
        } else {
            // Thêm mới
            BigDecimal price = product.getDiscountPrice() != null
                    ? product.getDiscountPrice()
                    : product.getPrice();

            if (price == null) {
                throw new RuntimeException("Product price is not set");
            }

            CartItem newItem = CartItem.builder()
                    .cart(cart)
                    .product(product)
                    .quantity(request.getQuantity())
                    .unitPrice(price)
                    .build();
            cartItemRepository.save(newItem);
        }

        // Reload cart để có items mới nhất
        cart = cartRepository.findById(cart.getId())
                .orElseThrow(() -> new RuntimeException("Cart not found"));
        return mapToDTO(cart);
    }

    @Override
    public CartResponseDTO updateItemQuantity(User user, Long cartItemId, Integer quantity) {
        if (quantity <= 0) {
            throw new RuntimeException("Quantity must be greater than 0");
        }

        CartItem item = cartItemRepository.findById(cartItemId)
                .orElseThrow(() -> new RuntimeException("Cart item not found"));

        // Kiểm tra quyền sở hữu
        if (!item.getCart().getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Unauthorized");
        }

        // Kiểm tra tồn kho
        if (item.getProduct().getStockQuantity() == null ||
                item.getProduct().getStockQuantity() < quantity) {
            throw new RuntimeException("Insufficient stock");
        }

        item.setQuantity(quantity);
        cartItemRepository.save(item);

        Cart cart = item.getCart();
        cart = cartRepository.findById(cart.getId())
                .orElseThrow(() -> new RuntimeException("Cart not found"));
        return mapToDTO(cart);
    }

    @Override
    public CartResponseDTO removeItem(User user, Long cartItemId) {
        CartItem item = cartItemRepository.findById(cartItemId)
                .orElseThrow(() -> new RuntimeException("Cart item not found"));

        // Kiểm tra quyền sở hữu
        if (!item.getCart().getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Unauthorized");
        }

        Cart cart = item.getCart();
        cartItemRepository.delete(item);

        // Reload cart
        cart = cartRepository.findById(cart.getId())
                .orElseThrow(() -> new RuntimeException("Cart not found"));
        return mapToDTO(cart);
    }

    @Override
    public void clearCart(User user) {
        Cart cart = cartRepository.findByUser(user)
                .orElse(null);
        if (cart != null) {
            cartItemRepository.deleteByCart(cart);
        }
    }

    @Override
    public void deleteCartAfterCheckout(User user) {
        Cart cart = cartRepository.findByUser(user)
                .orElse(null);
        if (cart != null) {
            cartRepository.delete(cart);
        }
    }

    private CartResponseDTO mapToDTO(Cart cart) {
        CartResponseDTO dto = new CartResponseDTO();
        dto.setCartId(cart.getId());

        List<CartResponseDTO.CartItemDTO> itemDTOs = cart.getItems().stream()
                .map(item -> {
                    CartResponseDTO.CartItemDTO itemDTO = new CartResponseDTO.CartItemDTO();
                    itemDTO.setId(item.getId());
                    itemDTO.setProductId(item.getProduct().getId());
                    itemDTO.setProductName(item.getProduct().getName());

                    // Lấy ảnh đầu tiên của sản phẩm
                    if (item.getProduct().getImages() != null && !item.getProduct().getImages().isEmpty()) {
                        itemDTO.setProductImageUrl(item.getProduct().getImages().get(0).getImageUrl());
                    } else {
                        itemDTO.setProductImageUrl(null);
                    }

                    itemDTO.setUnitPrice(item.getUnitPrice());
                    itemDTO.setQuantity(item.getQuantity());
                    itemDTO.setSubtotal(item.getUnitPrice().multiply(BigDecimal.valueOf(item.getQuantity())));

                    return itemDTO;
                })
                .collect(Collectors.toList());

        // Tính tổng sau khi map
        BigDecimal totalAmount = itemDTOs.stream()
                .map(CartResponseDTO.CartItemDTO::getSubtotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        int totalItems = itemDTOs.stream()
                .mapToInt(CartResponseDTO.CartItemDTO::getQuantity)
                .sum();

        dto.setItems(itemDTOs);
        dto.setTotalAmount(totalAmount);
        dto.setTotalItems(totalItems);

        return dto;
    }
}
