package com.example.learnspring1.service;

import com.example.learnspring1.domain.*;
import com.example.learnspring1.domain.dto.BulkOrderRequest;
import com.example.learnspring1.domain.dto.BulkOrderResponse;
import com.example.learnspring1.domain.dto.CheckoutRequestDTO;
import com.example.learnspring1.repository.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jakarta.persistence.criteria.Predicate;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class OrderService {

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final UserRepository userRepository;
    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final ProductVariantRepository productVariantRepository;
    private final CartService cartService;
    private final OrderAuditLogService orderAuditLogService;

    public OrderService(
            OrderRepository orderRepository,
            OrderItemRepository orderItemRepository,
            UserRepository userRepository,
            CartRepository cartRepository,
            CartItemRepository cartItemRepository,
            ProductVariantRepository productVariantRepository,
            CartService cartService,
            OrderAuditLogService orderAuditLogService) {
        this.orderRepository = orderRepository;
        this.orderItemRepository = orderItemRepository;
        this.userRepository = userRepository;
        this.cartRepository = cartRepository;
        this.cartItemRepository = cartItemRepository;
        this.productVariantRepository = productVariantRepository;
        this.cartService = cartService;
        this.orderAuditLogService = orderAuditLogService;
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

        Order savedOrder = orderRepository.save(order);

        // Log order creation to history
        orderAuditLogService.logOrderCreated(savedOrder, null);

        return savedOrder;
    }

    @Transactional
    public Order updateOrderStatus(String orderCode, Order.OrderStatus status) {
        return updateOrderStatus(orderCode, status, null, null);
    }

    @Transactional
    public Order updateOrderStatus(String orderCode, Order.OrderStatus newStatus, String note, String ipAddress) {
        Optional<Order> orderOpt = orderRepository.findByOrderCode(orderCode);
        if (orderOpt.isPresent()) {
            Order order = orderOpt.get();
            Order.OrderStatus oldStatus = order.getStatus();
            order.setStatus(newStatus);
            Order savedOrder = orderRepository.save(order);

            // Log to history
            orderAuditLogService.logStatusChange(order, oldStatus, newStatus, note, ipAddress);

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

        // Tạo Order
        Order order = Order.builder()
                .orderCode(orderCode)
                .user(user)
                .totalAmount(totalAmount)
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

        // Xóa các items đã checkout khỏi cart (không xóa toàn bộ cart)
        // Sử dụng orphanRemoval bằng cách xóa khỏi collection để JPA tự động xóa
        cart.getItems().removeAll(itemsToCheckout);
        cartRepository.saveAndFlush(cart);

        return order;
    }

    // ========== ADMIN METHODS ==========

    /**
     * Admin: Get all orders with pagination and filters
     */
    public Page<Order> getAllOrdersAdmin(
            String orderCode,
            String status,
            String customerName,
            String customerEmail,
            String customerPhone,
            Instant startDate,
            Instant endDate,
            Pageable pageable) {

        Specification<Order> spec = (root, query, criteriaBuilder) -> {
            // Eager load relationships
            if (query != null) {
                root.fetch("user", jakarta.persistence.criteria.JoinType.LEFT);
                root.fetch("items", jakarta.persistence.criteria.JoinType.LEFT)
                        .fetch("product", jakarta.persistence.criteria.JoinType.LEFT);
                root.fetch("items", jakarta.persistence.criteria.JoinType.LEFT)
                        .fetch("variant", jakarta.persistence.criteria.JoinType.LEFT);
                query.distinct(true);
            }

            List<Predicate> predicates = new ArrayList<>();

            if (orderCode != null && !orderCode.trim().isEmpty()) {
                predicates.add(criteriaBuilder.like(
                        criteriaBuilder.lower(root.get("orderCode")),
                        "%" + orderCode.toLowerCase() + "%"));
            }

            if (status != null && !status.trim().isEmpty()) {
                try {
                    Order.OrderStatus orderStatus = Order.OrderStatus.valueOf(status.toUpperCase());
                    predicates.add(criteriaBuilder.equal(root.get("status"), orderStatus));
                } catch (IllegalArgumentException e) {
                    // Invalid status, ignore filter
                }
            }

            if (customerName != null && !customerName.trim().isEmpty()) {
                predicates.add(criteriaBuilder.like(
                        criteriaBuilder.lower(root.get("customerName")),
                        "%" + customerName.toLowerCase() + "%"));
            }

            if (customerEmail != null && !customerEmail.trim().isEmpty()) {
                predicates.add(criteriaBuilder.like(
                        criteriaBuilder.lower(root.get("customerEmail")),
                        "%" + customerEmail.toLowerCase() + "%"));
            }

            if (customerPhone != null && !customerPhone.trim().isEmpty()) {
                predicates.add(criteriaBuilder.like(
                        criteriaBuilder.lower(root.get("customerPhone")),
                        "%" + customerPhone.toLowerCase() + "%"));
            }

            // Date range filters
            if (startDate != null) {
                predicates.add(criteriaBuilder.greaterThanOrEqualTo(root.get("createdAt"), startDate));
            }

            if (endDate != null) {
                predicates.add(criteriaBuilder.lessThanOrEqualTo(root.get("createdAt"), endDate));
            }

            return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
        };

        return orderRepository.findAll(spec, pageable);
    }

    /**
     * Admin: Update customer shipping info
     */
    @Transactional
    public Order updateShippingInfo(String orderCode, String customerAddress, String customerPhone) {
        return updateShippingInfo(orderCode, customerAddress, customerPhone, null);
    }

    @Transactional
    public Order updateShippingInfo(String orderCode, String customerAddress, String customerPhone, String ipAddress) {
        Order order = orderRepository.findByOrderCode(orderCode)
                .orElseThrow(() -> new RuntimeException("Order not found with code: " + orderCode));

        String oldAddress = order.getCustomerAddress();
        String oldPhone = order.getCustomerPhone();

        if (customerAddress != null) {
            order.setCustomerAddress(customerAddress);
        }
        if (customerPhone != null) {
            order.setCustomerPhone(customerPhone);
        }

        Order savedOrder = orderRepository.save(order);

        // Log to history
        orderAuditLogService.logShippingUpdate(order, oldAddress, customerAddress, oldPhone, customerPhone, ipAddress);

        return savedOrder;
    }

    /**
     * Admin: Get order statistics
     */
    public OrderStatistics getOrderStatistics(Instant startDate, Instant endDate) {
        List<Order> orders;

        if (startDate != null && endDate != null) {
            orders = orderRepository.findOrdersByDateRange(startDate, endDate);
        } else {
            orders = orderRepository.findAll();
        }

        long totalOrders = orders.size();
        BigDecimal totalRevenue = orders.stream()
                .filter(o -> o.getStatus() == Order.OrderStatus.COMPLETED ||
                        o.getStatus() == Order.OrderStatus.SHIPPING ||
                        o.getStatus() == Order.OrderStatus.CONFIRMED)
                .map(Order::getTotalAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        long pendingCount = orderRepository.countByStatus(Order.OrderStatus.PENDING);
        long confirmedCount = orderRepository.countByStatus(Order.OrderStatus.CONFIRMED);
        long shippingCount = orderRepository.countByStatus(Order.OrderStatus.SHIPPING);
        long completedCount = orderRepository.countByStatus(Order.OrderStatus.COMPLETED);
        long cancelledCount = orderRepository.countByStatus(Order.OrderStatus.CANCELLED);
        long paidCount = orderRepository.countByStatus(Order.OrderStatus.PAID);
        long deliveredCount = orderRepository.countByStatus(Order.OrderStatus.DELIVERED);
        long refundedCount = orderRepository.countByStatus(Order.OrderStatus.REFUNDED);

        return OrderStatistics.builder()
                .totalOrders(totalOrders)
                .totalRevenue(totalRevenue)
                .pendingCount(pendingCount)
                .confirmedCount(confirmedCount)
                .shippingCount(shippingCount)
                .completedCount(completedCount)
                .cancelledCount(cancelledCount)
                .paidCount(paidCount)
                .deliveredCount(deliveredCount)
                .refundedCount(refundedCount)
                .build();
    }

    // Inner class for statistics
    public static class OrderStatistics {
        private long totalOrders;
        private BigDecimal totalRevenue;
        private long pendingCount;
        private long confirmedCount;
        private long shippingCount;
        private long completedCount;
        private long cancelledCount;
        private long paidCount;
        private long deliveredCount;
        private long refundedCount;

        public static OrderStatisticsBuilder builder() {
            return new OrderStatisticsBuilder();
        }

        public static class OrderStatisticsBuilder {
            private long totalOrders;
            private BigDecimal totalRevenue;
            private long pendingCount;
            private long confirmedCount;
            private long shippingCount;
            private long completedCount;
            private long cancelledCount;
            private long paidCount;
            private long deliveredCount;
            private long refundedCount;

            public OrderStatisticsBuilder totalOrders(long totalOrders) {
                this.totalOrders = totalOrders;
                return this;
            }

            public OrderStatisticsBuilder totalRevenue(BigDecimal totalRevenue) {
                this.totalRevenue = totalRevenue;
                return this;
            }

            public OrderStatisticsBuilder pendingCount(long pendingCount) {
                this.pendingCount = pendingCount;
                return this;
            }

            public OrderStatisticsBuilder confirmedCount(long confirmedCount) {
                this.confirmedCount = confirmedCount;
                return this;
            }

            public OrderStatisticsBuilder shippingCount(long shippingCount) {
                this.shippingCount = shippingCount;
                return this;
            }

            public OrderStatisticsBuilder completedCount(long completedCount) {
                this.completedCount = completedCount;
                return this;
            }

            public OrderStatisticsBuilder cancelledCount(long cancelledCount) {
                this.cancelledCount = cancelledCount;
                return this;
            }

            public OrderStatisticsBuilder paidCount(long paidCount) {
                this.paidCount = paidCount;
                return this;
            }

            public OrderStatisticsBuilder deliveredCount(long deliveredCount) {
                this.deliveredCount = deliveredCount;
                return this;
            }

            public OrderStatisticsBuilder refundedCount(long refundedCount) {
                this.refundedCount = refundedCount;
                return this;
            }

            public OrderStatistics build() {
                OrderStatistics stats = new OrderStatistics();
                stats.totalOrders = this.totalOrders;
                stats.totalRevenue = this.totalRevenue;
                stats.pendingCount = this.pendingCount;
                stats.confirmedCount = this.confirmedCount;
                stats.shippingCount = this.shippingCount;
                stats.completedCount = this.completedCount;
                stats.cancelledCount = this.cancelledCount;
                stats.paidCount = this.paidCount;
                stats.deliveredCount = this.deliveredCount;
                stats.refundedCount = this.refundedCount;
                return stats;
            }
        }

        // Getters
        public long getTotalOrders() {
            return totalOrders;
        }

        public BigDecimal getTotalRevenue() {
            return totalRevenue;
        }

        public long getPendingCount() {
            return pendingCount;
        }

        public long getConfirmedCount() {
            return confirmedCount;
        }

        public long getShippingCount() {
            return shippingCount;
        }

        public long getCompletedCount() {
            return completedCount;
        }

        public long getCancelledCount() {
            return cancelledCount;
        }

        public long getPaidCount() {
            return paidCount;
        }

        public long getDeliveredCount() {
            return deliveredCount;
        }

        public long getRefundedCount() {
            return refundedCount;
        }
    }

    /**
     * Bulk update orders
     */
    @Transactional
    public BulkOrderResponse bulkUpdateOrders(BulkOrderRequest request) {
        List<BulkOrderResponse.BulkOrderResult> results = new ArrayList<>();
        int successCount = 0;
        int failedCount = 0;

        for (Long orderId : request.getOrderIds()) {
            try {
                Optional<Order> orderOpt = orderRepository.findById(orderId);
                if (orderOpt.isEmpty()) {
                    results.add(new BulkOrderResponse.BulkOrderResult(
                            orderId, null, false, "Order not found"));
                    failedCount++;
                    continue;
                }

                Order order = orderOpt.get();
                String orderCode = order.getOrderCode();

                // Handle different actions
                if ("UPDATE_STATUS".equals(request.getAction())) {
                    String statusStr = request.getParams().getStatus();
                    if (statusStr == null || statusStr.isEmpty()) {
                        results.add(new BulkOrderResponse.BulkOrderResult(
                                orderId, orderCode, false, "Status is required"));
                        failedCount++;
                        continue;
                    }

                    try {
                        Order.OrderStatus newStatus = Order.OrderStatus.valueOf(statusStr.toUpperCase());
                        Order.OrderStatus oldStatus = order.getStatus();

                        order.setStatus(newStatus);
                        orderRepository.save(order);

                        // Log audit
                        orderAuditLogService.logStatusChange(
                                order,
                                oldStatus,
                                newStatus,
                                null,
                                null);

                        results.add(new BulkOrderResponse.BulkOrderResult(
                                orderId, orderCode, true, "Status updated to " + newStatus));
                        successCount++;
                    } catch (IllegalArgumentException e) {
                        results.add(new BulkOrderResponse.BulkOrderResult(
                                orderId, orderCode, false, "Invalid status: " + statusStr));
                        failedCount++;
                    }
                } else {
                    results.add(new BulkOrderResponse.BulkOrderResult(
                            orderId, orderCode, false, "Unknown action: " + request.getAction()));
                    failedCount++;
                }
            } catch (Exception e) {
                results.add(new BulkOrderResponse.BulkOrderResult(
                        orderId, null, false, "Error: " + e.getMessage()));
                failedCount++;
            }
        }

        String message = String.format("Bulk update completed: %d succeeded, %d failed out of %d total",
                successCount, failedCount, request.getOrderIds().size());

        return new BulkOrderResponse(
                request.getOrderIds().size(),
                successCount,
                failedCount,
                results,
                message);
    }
}
