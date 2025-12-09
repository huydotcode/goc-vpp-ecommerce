package com.example.learnspring1.controller;

import com.example.learnspring1.domain.Order;
import com.example.learnspring1.domain.User;
import com.example.learnspring1.domain.dto.CheckoutRequestDTO;
import com.example.learnspring1.domain.dto.OrderSummaryDTO;
import com.example.learnspring1.domain.dto.OrderItemSummaryDTO;
import com.example.learnspring1.domain.dto.OrderDetailDTO;
import com.example.learnspring1.service.OrderService;
import com.example.learnspring1.service.UserService;
import com.example.learnspring1.utils.SecurityUtil;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/orders")
@Tag(name = "Order", description = "Quản lý đơn hàng")
@SecurityRequirement(name = "Bearer Authentication")
public class OrderController {

    private final OrderService orderService;
    private final UserService userService;

    public OrderController(OrderService orderService, UserService userService) {
        this.orderService = orderService;
        this.userService = userService;
    }

    private User getCurrentUser() {
        String currentUserEmail = SecurityUtil.getCurrentUserLogin()
                .orElseThrow(() -> new RuntimeException("User not authenticated"));
        User user = userService.getUserByEmail(currentUserEmail);
        if (user == null) {
            throw new RuntimeException("User not found");
        }
        return user;
    }

    public static class CreateCODOrderRequest {
        private Long amount;
        private String description;
        private String customerName;
        private String customerEmail;
        private String customerPhone;
        private String address;

        public Long getAmount() {
            return amount;
        }

        public void setAmount(Long amount) {
            this.amount = amount;
        }

        public String getDescription() {
            return description;
        }

        public void setDescription(String description) {
            this.description = description;
        }

        public String getCustomerName() {
            return customerName;
        }

        public void setCustomerName(String customerName) {
            this.customerName = customerName;
        }

        public String getCustomerEmail() {
            return customerEmail;
        }

        public void setCustomerEmail(String customerEmail) {
            this.customerEmail = customerEmail;
        }

        public String getCustomerPhone() {
            return customerPhone;
        }

        public void setCustomerPhone(String customerPhone) {
            this.customerPhone = customerPhone;
        }

        public String getAddress() {
            return address;
        }

        public void setAddress(String address) {
            this.address = address;
        }
    }

    @Operation(summary = "Checkout từ giỏ hàng", description = "Tạo đơn hàng từ giỏ hàng, trừ stock, và xóa giỏ hàng")
    @PostMapping("/checkout")
    public ResponseEntity<Map<String, Object>> checkout(@Valid @RequestBody CheckoutRequestDTO request) {
        try {
            User currentUser = getCurrentUser();
            Order order = orderService.checkoutFromCart(currentUser, request);

            Map<String, Object> response = new HashMap<>();
            response.put("orderCode", order.getOrderCode());
            response.put("status", order.getStatus().name());
            response.put("paymentMethod", order.getPaymentMethod().name());
            response.put("totalAmount", order.getTotalAmount());
            response.put("message", "Order created successfully");

            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (RuntimeException e) {
            Map<String, Object> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("error", "Failed to create order: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    @PostMapping("/cod")
    public ResponseEntity<Map<String, Object>> createCODOrder(@RequestBody CreateCODOrderRequest request) {
        long amount = request.getAmount() != null ? request.getAmount() : 0L;
        if (amount <= 0) {
            Map<String, Object> error = new HashMap<>();
            error.put("error", "Amount must be greater than 0");
            return ResponseEntity.badRequest().body(error);
        }

        String orderCode = String.valueOf(System.currentTimeMillis());
        String userEmail = SecurityUtil.getCurrentUserLogin().orElse(null);

        String description = request.getDescription() != null
                ? request.getDescription()
                : "Don hang COD";

        try {
            Order order = orderService.createOrder(
                    orderCode,
                    userEmail,
                    BigDecimal.valueOf(amount),
                    Order.PaymentMethod.COD,
                    null, // Không có paymentLinkId cho COD
                    description,
                    request.getCustomerName(),
                    request.getCustomerEmail(),
                    request.getCustomerPhone());

            Map<String, Object> response = new HashMap<>();
            response.put("orderCode", order.getOrderCode());
            response.put("status", order.getStatus().name());
            response.put("paymentMethod", order.getPaymentMethod().name());
            response.put("totalAmount", order.getTotalAmount());
            response.put("message", "Order created successfully. You will pay when receiving the order.");

            // Log để debug
            System.out.println("COD Order created: " + order.getOrderCode() + " with status: " + order.getStatus());

            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("error", "Failed to create order: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    @GetMapping("/{orderCode}")
    public ResponseEntity<?> getOrderByCode(@PathVariable String orderCode) {
        User currentUser = getCurrentUser();
        Order order = orderService.getOrderWithItemsByCode(orderCode)
                .filter(o -> o.getUser() != null && o.getUser().getId().equals(currentUser.getId()))
                .orElseThrow(() -> new RuntimeException("Order not found"));
        return ResponseEntity.ok(toDetailDTO(order));
    }

    @GetMapping
    public ResponseEntity<?> getMyOrders() {
        User currentUser = getCurrentUser();
        return ResponseEntity.ok(
                orderService.getOrdersWithItemsByUserId(currentUser.getId()).stream().map(this::toSummaryDTO).toList());
    }

    private OrderSummaryDTO toSummaryDTO(Order order) {
        return OrderSummaryDTO.builder()
                .id(order.getId())
                .orderCode(order.getOrderCode())
                .totalAmount(order.getTotalAmount())
                .status(order.getStatus())
                .paymentMethod(order.getPaymentMethod())
                .createdAt(order.getCreatedAt())
                .items(order.getItems() != null
                        ? order.getItems().stream()
                                .map(oi -> OrderItemSummaryDTO.builder()
                                        .productName(oi.getProductName())
                                        .quantity(oi.getQuantity())
                                        .unitPrice(oi.getUnitPrice())
                                        .subtotal(oi.getSubtotal())
                                        .imageUrl(resolveImage(oi))
                                        .build())
                                .toList()
                        : java.util.Collections.emptyList())
                .build();
    }

    private OrderDetailDTO toDetailDTO(Order order) {
        return OrderDetailDTO.builder()
                .id(order.getId())
                .orderCode(order.getOrderCode())
                .totalAmount(order.getTotalAmount())
                .status(order.getStatus())
                .paymentMethod(order.getPaymentMethod())
                .createdAt(order.getCreatedAt())
                .customerName(order.getCustomerName())
                .customerEmail(order.getCustomerEmail())
                .customerPhone(order.getCustomerPhone())
                .customerAddress(order.getCustomerAddress())
                .description(order.getDescription())
                .items(order.getItems() != null
                        ? order.getItems().stream()
                                .map(oi -> OrderItemSummaryDTO.builder()
                                        .productName(oi.getProductName())
                                        .quantity(oi.getQuantity())
                                        .unitPrice(oi.getUnitPrice())
                                        .subtotal(oi.getSubtotal())
                                        .imageUrl(resolveImage(oi))
                                        .build())
                                .toList()
                        : java.util.Collections.emptyList())
                .build();
    }

    private String resolveImage(com.example.learnspring1.domain.OrderItem oi) {
        if (oi.getVariant() != null && oi.getVariant().getImageUrl() != null) {
            return oi.getVariant().getImageUrl();
        }
        if (oi.getProduct() != null) {
            return oi.getProduct().getThumbnailUrl();
        }
        return null;
    }

    @PutMapping("/{orderCode}/status")
    public ResponseEntity<Map<String, Object>> updateOrderStatus(
            @PathVariable String orderCode,
            @RequestParam String status) {
        try {
            Order.OrderStatus orderStatus = Order.OrderStatus.valueOf(status.toUpperCase());
            Order order = orderService.updateOrderStatus(orderCode, orderStatus);

            Map<String, Object> response = new HashMap<>();
            response.put("orderCode", order.getOrderCode());
            response.put("status", order.getStatus().name());
            response.put("message", "Order status updated successfully");

            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            Map<String, Object> error = new HashMap<>();
            error.put("error", "Invalid status: " + status);
            return ResponseEntity.badRequest().body(error);
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("error", "Failed to update order status: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }
}
