package com.example.learnspring1.service.impl;

import com.example.learnspring1.domain.*;
import com.example.learnspring1.domain.dto.CartItemRequestDTO;
import com.example.learnspring1.domain.dto.CartResponseDTO;
import com.example.learnspring1.repository.CartItemRepository;
import com.example.learnspring1.repository.CartRepository;
import com.example.learnspring1.repository.ProductRepository;
import com.example.learnspring1.repository.ProductVariantRepository;
import com.example.learnspring1.service.CartService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class CartServiceImpl implements CartService {

    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final ProductRepository productRepository;
    private final ProductVariantRepository productVariantRepository;

    private ProductVariant resolveVariantOrDefault(Product product, Long variantId) {
        // Nếu product có variantId -> lấy đúng variant
        if (variantId != null) {
            return productVariantRepository.findById(variantId)
                    .filter(v -> v.getProduct().getId().equals(product.getId()))
                    .orElseThrow(() -> new RuntimeException("Variant không hợp lệ"));
        }
        // Nếu không truyền variantId, lấy default variant nếu có
        return productVariantRepository.findByProductIdAndIsDefaultTrue(product.getId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy default variant"));
    }

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

        ProductVariant variant = resolveVariantOrDefault(product, request.getVariantId());
        if (variant.getStockQuantity() == null || variant.getStockQuantity() < request.getQuantity()) {
            throw new RuntimeException("Insufficient stock");
        }
        if (variant.getIsActive() == null || !variant.getIsActive()) {
            throw new RuntimeException("Variant is not available");
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
        CartItem existingItem = cartItemRepository.findByCartAndProductAndVariant(cart, product, variant)
                .orElse(null);

        if (existingItem != null) {
            // Cập nhật số lượng
            int newQuantity = existingItem.getQuantity() + request.getQuantity();
            if (variant.getStockQuantity() == null || variant.getStockQuantity() < newQuantity) {
                throw new RuntimeException("Insufficient stock");
            }
            existingItem.setQuantity(newQuantity);
            cartItemRepository.save(existingItem);
        } else {
            // Thêm mới
            BigDecimal price;
            if (variant != null && variant.getPrice() != null) {
                price = variant.getPrice();
            } else {
                price = product.getDiscountPrice() != null
                        ? product.getDiscountPrice()
                        : product.getPrice();
            }

            if (price == null) {
                throw new RuntimeException("Product price is not set");
            }

            CartItem newItem = CartItem.builder()
                    .cart(cart)
                    .product(product)
                    .variant(variant)
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
        if (item.getVariant() == null) {
            throw new RuntimeException("Variant not found for cart item");
        }
        if (item.getVariant().getStockQuantity() == null ||
                item.getVariant().getStockQuantity() < quantity) {
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
    public CartResponseDTO updateItemVariant(User user, Long cartItemId, Long variantId) {
        CartItem item = cartItemRepository.findById(cartItemId)
                .orElseThrow(() -> new RuntimeException("Cart item not found"));

        // Kiểm tra quyền sở hữu
        if (!item.getCart().getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Unauthorized");
        }

        Product product = item.getProduct();
        ProductVariant newVariant = resolveVariantOrDefault(product, variantId);

        // Validate variant belongs to product
        if (!newVariant.getProduct().getId().equals(product.getId())) {
            throw new RuntimeException("Variant does not belong to product");
        }

        // Check stock
        if (newVariant.getStockQuantity() == null ||
                newVariant.getStockQuantity() < item.getQuantity()) {
            throw new RuntimeException("Insufficient stock");
        }

        // Check if variant is active
        if (newVariant.getIsActive() == null || !newVariant.getIsActive()) {
            throw new RuntimeException("Variant is not available");
        }

        // Check if same variant already exists in cart
        Optional<CartItem> existing = cartItemRepository.findByCartAndProductAndVariant(
                item.getCart(), product, newVariant);

        if (existing.isPresent() && !existing.get().getId().equals(cartItemId)) {
            // Merge with existing item
            CartItem existingItem = existing.get();
            int newQuantity = existingItem.getQuantity() + item.getQuantity();

            // Check stock for merged quantity
            if (newVariant.getStockQuantity() < newQuantity) {
                throw new RuntimeException("Insufficient stock for merged quantity");
            }

            existingItem.setQuantity(newQuantity);
            cartItemRepository.save(existingItem);
            cartItemRepository.delete(item);
        } else {
            // Update variant
            BigDecimal newPrice = newVariant.getPrice() != null
                    ? newVariant.getPrice()
                    : (product.getDiscountPrice() != null ? product.getDiscountPrice() : product.getPrice());

            if (newPrice == null) {
                throw new RuntimeException("Product price is not set");
            }

            item.setVariant(newVariant);
            item.setUnitPrice(newPrice);
            cartItemRepository.save(item);
        }

        Cart cart = cartRepository.findByIdWithItems(item.getCart().getId())
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

        Long cartId = item.getCart().getId();

        // Xóa item
        cartItemRepository.delete(item);
        cartItemRepository.flush(); // Đảm bảo delete được commit trước khi reload

        // Reload cart với items được fetch
        Cart cart = cartRepository.findByIdWithItems(cartId)
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
                    if (item.getVariant() != null) {
                        itemDTO.setVariantId(item.getVariant().getId());
                        itemDTO.setVariantName(item.getVariant().getVariantValue());
                        itemDTO.setSku(item.getVariant().getSku());
                    } else {
                        itemDTO.setVariantId(null);
                        itemDTO.setVariantName(null);
                        itemDTO.setSku(item.getProduct().getSku());
                    }

                    // Lấy ảnh đầu tiên của sản phẩm
                    if (item.getProduct().getThumbnailUrl() != null) {
                        itemDTO.setProductImageUrl(item.getProduct().getThumbnailUrl());
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
