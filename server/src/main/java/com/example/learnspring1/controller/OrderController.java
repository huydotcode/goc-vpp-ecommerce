package com.example.learnspring1.controller;

import com.example.learnspring1.domain.Order;
import com.example.learnspring1.service.OrderService;
import com.example.learnspring1.utils.SecurityUtil;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/orders")
public class OrderController {

    private final OrderService orderService;

    public OrderController(OrderService orderService) {
        this.orderService = orderService;
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
                    request.getCustomerPhone()
            );

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
    public ResponseEntity<Map<String, Object>> getOrderByCode(@PathVariable String orderCode) {
        Optional<Order> orderOpt = orderService.getOrderByCode(orderCode);
        
        if (orderOpt.isPresent()) {
            Order order = orderOpt.get();
            Map<String, Object> response = new HashMap<>();
            response.put("orderCode", order.getOrderCode());
            response.put("status", order.getStatus().name());
            response.put("paymentMethod", order.getPaymentMethod().name());
            response.put("totalAmount", order.getTotalAmount());
            response.put("customerName", order.getCustomerName());
            response.put("customerEmail", order.getCustomerEmail());
            response.put("customerPhone", order.getCustomerPhone());
            response.put("description", order.getDescription());
            response.put("createdAt", order.getCreatedAt());
            
            return ResponseEntity.ok(response);
        } else {
            Map<String, Object> error = new HashMap<>();
            error.put("error", "Order not found");
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
        }
    }

    @PutMapping("/{orderCode}/status")
    public ResponseEntity<Map<String, Object>> updateOrderStatus(
            @PathVariable String orderCode,
            @RequestParam String status
    ) {
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

