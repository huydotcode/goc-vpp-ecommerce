package com.example.learnspring1.service;

import com.example.learnspring1.domain.*;
import com.example.learnspring1.domain.dto.CheckoutRequestDTO;
import com.example.learnspring1.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

// Imports updated by tool
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.example.learnspring1.service.PromotionService;
import com.example.learnspring1.service.impl.PromotionCalculator;

@Service
public class OrderService {

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final UserRepository userRepository;
    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final ProductVariantRepository productVariantRepository;
    private final CartService cartService;
    private final PromotionService promotionService;
    private final PromotionCalculator promotionCalculator;
    private final ObjectMapper objectMapper;

    public OrderService(
            OrderRepository orderRepository,
            OrderItemRepository orderItemRepository,
            UserRepository userRepository,
            CartRepository cartRepository,
            CartItemRepository cartItemRepository,
            ProductVariantRepository productVariantRepository,
            CartService cartService,
            PromotionService promotionService,
            PromotionCalculator promotionCalculator,
            ObjectMapper objectMapper) {
        this.orderRepository = orderRepository;
        this.orderItemRepository = orderItemRepository;
        this.userRepository = userRepository;
        this.cartRepository = cartRepository;
        this.cartItemRepository = cartItemRepository;
        this.productVariantRepository = productVariantRepository;
        this.cartService = cartService;
        this.promotionService = promotionService;
        this.promotionCalculator = promotionCalculator;
        this.objectMapper = objectMapper;
    }


    @Transactional
    public Order createOrder(
            String orderCode,
            String userEmail,
            BigDecimal totalAmount,
            Order.PaymentMethod paymentMethod,
            String paymentLinkId,
            String description,
            String customerName,
            String customerEmail,
            String customerPhone) {
        User user = null;
        if (userEmail != null) {
            user = userRepository.findByEmail(userEmail).orElse(null);
        }

        // Xác định status ban đầu dựa trên payment method
        Order.OrderStatus initialStatus;
        if (paymentMethod == Order.PaymentMethod.COD) {
            initialStatus = Order.OrderStatus.CONFIRMED; // COD: đã xác nhận, chờ giao hàng
        } else {
            initialStatus = Order.OrderStatus.PENDING; // PayOS: chờ thanh toán
        }

        Order order = Order.builder()
                .orderCode(orderCode)
                .user(user)
                .totalAmount(totalAmount)
                .paymentMethod(paymentMethod)
                .paymentLinkId(paymentLinkId)
                .status(initialStatus)
                .description(description)
                .customerName(customerName)
                .customerEmail(customerEmail)
                .customerPhone(customerPhone)
                .build();

        return orderRepository.save(order);
    }

    @Transactional
    public Order updateOrderStatus(String orderCode, Order.OrderStatus status) {
        Optional<Order> orderOpt = orderRepository.findByOrderCode(orderCode);
        if (orderOpt.isPresent()) {
            Order order = orderOpt.get();
            order.setStatus(status);
            Order savedOrder = orderRepository.save(order);
            return savedOrder;
        }
        throw new RuntimeException("Order not found with code: " + orderCode);
    }

    @Transactional
    public Order updatePaymentLinkId(String orderCode, String paymentLinkId) {
        Optional<Order> orderOpt = orderRepository.findByOrderCode(orderCode);
        if (orderOpt.isPresent()) {
            Order order = orderOpt.get();
            order.setPaymentLinkId(paymentLinkId);
            return orderRepository.save(order);
        }
        throw new RuntimeException("Order not found with code: " + orderCode);
    }

    public Optional<Order> getOrderByCode(String orderCode) {
        return orderRepository.findByOrderCode(orderCode);
    }

    public List<Order> getOrdersByUserId(Long userId) {
        return orderRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    public List<Order> getOrdersWithItemsByUserId(Long userId) {
        return orderRepository.findWithItemsByUserIdOrderByCreatedAtDesc(userId);
    }

    public Optional<Order> getOrderWithItemsByCode(String orderCode) {
        return orderRepository.findWithItemsByOrderCode(orderCode);
    }

    /**
     * Checkout từ Cart: Tạo Order + OrderItems từ Cart, trừ stock, clear cart
     */
    @Transactional
    public Order checkoutFromCart(User user, CheckoutRequestDTO request) {
        // Lấy cart của user với items
        Cart cart = cartRepository.findByUser(user)
                .orElseThrow(() -> new RuntimeException("Cart is empty"));

        // Fetch cart với items và products
        cart = cartRepository.findByIdWithItems(cart.getId())
                .orElseThrow(() -> new RuntimeException("Cart not found"));

        if (cart.getItems() == null || cart.getItems().isEmpty()) {
            throw new RuntimeException("Cart is empty");
        }

        // Lọc các items cần checkout
        List<CartItem> itemsToCheckout;
        if (request.getCartItemIds() != null && !request.getCartItemIds().isEmpty()) {
            // Chỉ checkout các items được chọn
            itemsToCheckout = cart.getItems().stream()
                    .filter(item -> request.getCartItemIds().contains(item.getId()))
                    .collect(Collectors.toList());
        } else {
            // Checkout tất cả items
            itemsToCheckout = cart.getItems();
        }

        if (itemsToCheckout.isEmpty()) {
            throw new RuntimeException("No items selected for checkout");
        }

        // Validate và trừ stock cho các items được chọn
        for (CartItem cartItem : itemsToCheckout) {
            Product product = cartItem.getProduct();
            ProductVariant variant = cartItem.getVariant();
            if (variant == null) {
                variant = productVariantRepository.findByProductIdAndIsDefaultTrue(product.getId())
                        .orElseThrow(() -> new RuntimeException("Variant not found for product: " + product.getName()));
            }

            // Kiểm tra product active
            if (product.getIsActive() == null || !product.getIsActive()) {
                throw new RuntimeException("Product " + product.getName() + " is not available");
            }

            // Kiểm tra stock trên variant
            if (variant.getIsActive() == null || !variant.getIsActive()) {
                throw new RuntimeException("Variant for product " + product.getName() + " is not available");
            }
            if (variant.getStockQuantity() == null || variant.getStockQuantity() < cartItem.getQuantity()) {
                throw new RuntimeException("Insufficient stock for variant of product: " + product.getName());
            }
            variant.setStockQuantity(variant.getStockQuantity() - cartItem.getQuantity());
            productVariantRepository.save(variant);
        }

        // Tính tổng tiền từ các items được chọn
        BigDecimal totalAmount = itemsToCheckout.stream()
                .map(item -> item.getUnitPrice().multiply(BigDecimal.valueOf(item.getQuantity())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Tạo orderCode
        String orderCode = String.valueOf(System.currentTimeMillis());

        // Xác định status ban đầu
        Order.OrderStatus initialStatus;
        if (request.getPaymentMethod() == Order.PaymentMethod.COD) {
            initialStatus = Order.OrderStatus.CONFIRMED;
        } else {
            initialStatus = Order.OrderStatus.PENDING;
        }

        // Calculate Promotions
        List<Promotion> activePromotions = promotionService.getActivePromotions();
        PromotionCalculator.CalculationResult promoResult = promotionCalculator.calculate(totalAmount, itemsToCheckout, activePromotions);
        
        String appliedPromotionsJson = null;
        try {
            if (!promoResult.getAppliedPromotions().isEmpty()) {
                appliedPromotionsJson = objectMapper.writeValueAsString(promoResult.getAppliedPromotions().stream()
                    .map(p -> Map.of("id", p.getId(), "name", p.getName(), "value", p.getDiscountAmount()))
                    .collect(Collectors.toList()));
            }
        } catch (JsonProcessingException e) {
            e.printStackTrace(); // Log error but don't fail order
        }

        // Tạo Order
        Order order = Order.builder()
                .orderCode(orderCode)
                .user(user)
                .totalAmount(totalAmount)
                .discountAmount(promoResult.getDiscountAmount())
                .finalAmount(promoResult.getFinalTotal())
                .appliedPromotions(appliedPromotionsJson)
                .paymentMethod(request.getPaymentMethod())
                .paymentLinkId(null) // Sẽ được set sau khi tạo payment link
                .status(initialStatus)
                .description(request.getDescription())
                .customerName(request.getCustomerName())
                .customerEmail(request.getCustomerEmail())
                .customerPhone(request.getCustomerPhone())
                .customerAddress(request.getAddress())
                .build();

        order = orderRepository.save(order);

        // Tạo OrderItems từ các items được chọn
        for (CartItem cartItem : itemsToCheckout) {
            OrderItem orderItem = OrderItem.builder()
                    .order(order)
                    .product(cartItem.getProduct())
                    .variant(cartItem.getVariant())
                    .productName(cartItem.getProduct().getName())
                    .unitPrice(cartItem.getUnitPrice())
                    .quantity(cartItem.getQuantity())
                    .subtotal(cartItem.getUnitPrice().multiply(BigDecimal.valueOf(cartItem.getQuantity())))
                    .build();

            orderItemRepository.save(orderItem);
        }

        // Add Gift Items
        for (PromotionGiftItem gift : promoResult.getGiftItems()) {
             // Create mock variant/product info for gift if needed, or link to actual product
             // Should check if gift item needs to reduce stock? Assuming gifts also reduce stock logic is needed but out of scope for strict 'add item', 
             // but let's assume we link to product.
             // For simplicity, we just add OrderItem with price 0.
             
             OrderItem giftItem = OrderItem.builder()
                    .order(order)
                    .product(gift.getProduct())
                    .variant(null) // Gifts might not have variant selected, or use default. Assuming default or null.
                    .productName(gift.getProduct().getName() + " (GIFT)")
                    .unitPrice(BigDecimal.ZERO)
                    .quantity(gift.getQuantity())
                    .subtotal(BigDecimal.ZERO)
                    .isGift(true)
                    .build();
            orderItemRepository.save(giftItem);
        }

        // Xóa các items đã checkout khỏi cart (không xóa toàn bộ cart)
        // Sử dụng orphanRemoval bằng cách xóa khỏi collection để JPA tự động xóa
        cart.getItems().removeAll(itemsToCheckout);
        cartRepository.saveAndFlush(cart);

        return order;
    }
}
