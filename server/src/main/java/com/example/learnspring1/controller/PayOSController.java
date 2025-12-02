package com.example.learnspring1.controller;

import com.example.learnspring1.domain.Order;
import com.example.learnspring1.service.OrderService;
import com.example.learnspring1.service.PayOSService;
import com.example.learnspring1.utils.SecurityUtil;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.net.URI;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/payment")
public class PayOSController {

    private final PayOSService payOSService;
    private final OrderService orderService;

    @Value("${payos.frontend-return-url:http://localhost:5173/payos-result}")
    private String frontendReturnUrl;

    @Value("${payos.frontend-cancel-url:http://localhost:5173/cart-vnpay}")
    private String frontendCancelUrl;

    public PayOSController(PayOSService payOSService, OrderService orderService) {
        this.payOSService = payOSService;
        this.orderService = orderService;
    }

    public static class CreatePaymentRequest {
        private Long amount;
        private String description;
        private String orderCode;
        private String customerName;
        private String customerEmail;
        private String customerPhone;

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

        public String getOrderCode() {
            return orderCode;
        }

        public void setOrderCode(String orderCode) {
            this.orderCode = orderCode;
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
    }

    @PostMapping("/payos/create")
    public Map<String, Object> createPayment(@RequestBody CreatePaymentRequest request) {
        Map<String, Object> errorResponse = new HashMap<>();
        
        try {
            long amount = request.getAmount() != null ? request.getAmount() : 10000L;
            String description = request.getDescription() != null
                    ? request.getDescription()
                    : "Thanh toan don hang";
            
            // PayOS yêu cầu description tối đa 25 ký tự
            if (description.length() > 25) {
                description = description.substring(0, 25);
            }
            
            String orderCode = request.getOrderCode() != null
                    ? request.getOrderCode()
                    : String.valueOf(System.currentTimeMillis());

            String returnUrl = "http://localhost:8080/api/v1/payment/payos/return";
            String cancelUrl = "http://localhost:8080/api/v1/payment/payos/cancel?orderCode=" + orderCode;

            // Tạo payment link với PayOS
            Map<String, Object> result = payOSService.createPaymentLink(
                    amount,
                    description,
                    orderCode,
                    returnUrl,
                    cancelUrl
            );

            // Kiểm tra nếu PayOS trả về lỗi
            if (result != null && result.containsKey("code")) {
                String code = String.valueOf(result.get("code"));
                if (!"00".equals(code)) {
                    String desc = result.containsKey("desc") ? String.valueOf(result.get("desc")) : "Unknown error";
                    errorResponse.put("code", code);
                    errorResponse.put("desc", desc);
                    errorResponse.put("error", "PayOS returned error: " + desc);
                    System.err.println("PayOS error when creating payment link: code=" + code + ", desc=" + desc);
                    return errorResponse;
                }
            }

            // Lấy paymentLinkId từ response
            String paymentLinkId = null;
            if (result != null && result.containsKey("data")) {
                Object dataObj = result.get("data");
                if (dataObj instanceof Map) {
                    @SuppressWarnings("unchecked")
                    Map<String, Object> dataMap = (Map<String, Object>) dataObj;
                    if (dataMap.containsKey("data")) {
                        Object nestedData = dataMap.get("data");
                        if (nestedData instanceof Map) {
                            @SuppressWarnings("unchecked")
                            Map<String, Object> nestedMap = (Map<String, Object>) nestedData;
                            paymentLinkId = (String) nestedMap.get("paymentLinkId");
                        }
                    }
                }
            }

            // Lấy user email từ SecurityContext
            String userEmail = SecurityUtil.getCurrentUserLogin().orElse(null);

            // Lưu order vào DB với status PENDING (chờ thanh toán)
            try {
                Order order = orderService.createOrder(
                        orderCode,
                        userEmail,
                        BigDecimal.valueOf(amount),
                        Order.PaymentMethod.PAYOS,
                        paymentLinkId,
                        description,
                        request.getCustomerName(),
                        request.getCustomerEmail(),
                        request.getCustomerPhone()
                );
                System.out.println("PayOS Order created: " + order.getOrderCode() + " with status: " + order.getStatus());
            } catch (Exception e) {
                System.err.println("Error creating order: " + e.getMessage());
                e.printStackTrace();
                // Không throw exception để không ảnh hưởng đến payment flow
                // Nhưng log lại để debug
            }

            return result;
        } catch (Exception e) {
            System.err.println("Error in createPayment: " + e.getMessage());
            e.printStackTrace();
            errorResponse.put("code", "-1");
            errorResponse.put("desc", "Internal server error: " + e.getMessage());
            errorResponse.put("error", "Failed to create payment link");
            return errorResponse;
        }
    }

    @PostMapping("/payos/webhook")
    public Map<String, String> handleWebhook(@RequestBody Map<String, Object> webhookData) {
        Map<String, String> response = new HashMap<>();

        try {
            // Kiểm tra signature
            boolean isValid = payOSService.verifyWebhook(webhookData);
            if (!isValid) {
                System.err.println("Invalid webhook signature");
                response.put("error", "-1");
                response.put("message", "Invalid signature");
                return response;
            }

            @SuppressWarnings("unchecked")
            Map<String, Object> data = (Map<String, Object>) webhookData.get("data");
            String code = webhookData.get("code") != null ? String.valueOf(webhookData.get("code")) : "";
            String desc = webhookData.get("desc") != null ? String.valueOf(webhookData.get("desc")) : "";

            // Lấy orderCode từ webhook data
            String orderCode = null;
            if (data != null && data.containsKey("orderCode")) {
                orderCode = String.valueOf(data.get("orderCode"));
            }

            // Kiểm tra orderCode có tồn tại không
            if (orderCode == null || orderCode.isEmpty()) {
                System.err.println("Webhook missing orderCode");
                response.put("error", "-1");
                response.put("message", "Missing orderCode");
                return response;
            }

            // Kiểm tra order có tồn tại trong DB không
            Optional<Order> orderOpt = orderService.getOrderByCode(orderCode);
            if (!orderOpt.isPresent()) {
                System.err.println("Order not found: " + orderCode);
                response.put("error", "-1");
                response.put("message", "Order not found: " + orderCode);
                return response;
            }

            Order order = orderOpt.get();
            Order.OrderStatus currentStatus = order.getStatus();

            if ("00".equals(code)) {
                // Thanh toán thành công - chỉ cập nhật nếu chưa PAID
                if (currentStatus != Order.OrderStatus.PAID) {
                    try {
                        orderService.updateOrderStatus(orderCode, Order.OrderStatus.PAID);
                        System.out.println("Order " + orderCode + " updated from " + currentStatus + " to PAID via webhook");
                    } catch (Exception e) {
                        System.err.println("Error updating order status to PAID: " + e.getMessage());
                        e.printStackTrace();
                        response.put("error", "-1");
                        response.put("message", "Failed to update order status: " + e.getMessage());
                        return response;
                    }
                } else {
                    System.out.println("Order " + orderCode + " already PAID, skipping update");
                }
                response.put("error", "0");
                response.put("message", "Success");
            } else {
                // Thanh toán thất bại - chỉ cập nhật nếu đang PENDING
                if (currentStatus == Order.OrderStatus.PENDING) {
                    try {
                        orderService.updateOrderStatus(orderCode, Order.OrderStatus.CANCELLED);
                        System.out.println("Order " + orderCode + " updated from PENDING to CANCELLED via webhook (code: " + code + ")");
                    } catch (Exception e) {
                        System.err.println("Error updating order status to CANCELLED: " + e.getMessage());
                        e.printStackTrace();
                    }
                } else {
                    System.out.println("Order " + orderCode + " status is " + currentStatus + ", not updating to CANCELLED");
                }
                response.put("error", code);
                response.put("message", desc != null && !desc.isEmpty() ? desc : "Payment failed");
            }
        } catch (Exception e) {
            System.err.println("Error in handleWebhook: " + e.getMessage());
            e.printStackTrace();
            response.put("error", "-1");
            response.put("message", "Unknown error: " + e.getMessage());
        }

        return response;
    }

    @GetMapping("/payos/cancel")
    public ResponseEntity<Void> handleCancel(@RequestParam(required = false) String orderCode) {
        // Cập nhật order status thành CANCELLED khi user hủy thanh toán
        if (orderCode != null && !orderCode.isEmpty()) {
            try {
                // Kiểm tra order có tồn tại không
                Optional<Order> orderOpt = orderService.getOrderByCode(orderCode);
                if (orderOpt.isPresent()) {
                    Order order = orderOpt.get();
                    // Chỉ cập nhật nếu đang PENDING
                    if (order.getStatus() == Order.OrderStatus.PENDING) {
                        orderService.updateOrderStatus(orderCode, Order.OrderStatus.CANCELLED);
                        System.out.println("Order " + orderCode + " cancelled by user");
                    } else {
                        System.out.println("Order " + orderCode + " status is " + order.getStatus() + ", not updating to CANCELLED");
                    }
                } else {
                    System.err.println("Order not found for cancellation: " + orderCode);
                }
            } catch (Exception e) {
                System.err.println("Error cancelling order: " + e.getMessage());
                e.printStackTrace();
            }
        } else {
            System.err.println("Cancel URL called without orderCode");
        }

        // Redirect về frontend
        String redirectUrl = frontendCancelUrl + "?cancelled=true" 
                + (orderCode != null ? "&orderCode=" + urlEncode(orderCode) : "");
        @SuppressWarnings("null")
        URI redirectUri = URI.create(redirectUrl);
        return ResponseEntity.status(HttpStatus.FOUND)
                .location(redirectUri)
                .build();
    }

    @GetMapping("/payos/return")
    public ResponseEntity<Void> handleReturn(@RequestParam Map<String, String> params) {
        String code = params.getOrDefault("code", "");
        String id = params.getOrDefault("id", "");
        String orderCode = params.getOrDefault("orderCode", "");
        String desc = params.getOrDefault("desc", "");

        String status = "failed";
        String message = "Giao dich khong thanh cong";

        // Kiểm tra orderCode có tồn tại không
        if (orderCode == null || orderCode.isEmpty()) {
            System.err.println("Return URL called without orderCode");
            message = "Thieu ma don hang";
        } else {
            try {
                // Kiểm tra order có tồn tại trong DB không
                Optional<Order> orderOpt = orderService.getOrderByCode(orderCode);
                if (!orderOpt.isPresent()) {
                    System.err.println("Order not found in return handler: " + orderCode);
                    message = "Khong tim thay don hang: " + orderCode;
                } else {
                    Order order = orderOpt.get();
                    Order.OrderStatus currentStatus = order.getStatus();

                    if ("00".equals(code)) {
                        // Thanh toán thành công
                        // Webhook có thể đã xử lý, nhưng đảm bảo status đúng
                        // Chỉ cập nhật nếu chưa PAID để tránh race condition
                        if (currentStatus != Order.OrderStatus.PAID) {
                            try {
                                orderService.updateOrderStatus(orderCode, Order.OrderStatus.PAID);
                                System.out.println("Order " + orderCode + " updated from " + currentStatus + " to PAID via return URL");
                            } catch (Exception e) {
                                System.err.println("Error updating order status to PAID in return: " + e.getMessage());
                                e.printStackTrace();
                            }
                        } else {
                            System.out.println("Order " + orderCode + " already PAID, skipping update in return URL");
                        }
                        status = "success";
                        message = "Giao dich thanh cong";
                    } else {
                        // Thanh toán thất bại hoặc hủy
                        // Chỉ cập nhật nếu đang PENDING để tránh ghi đè status đã được webhook xử lý
                        if (currentStatus == Order.OrderStatus.PENDING) {
                            try {
                                orderService.updateOrderStatus(orderCode, Order.OrderStatus.CANCELLED);
                                System.out.println("Order " + orderCode + " updated from PENDING to CANCELLED via return URL (code: " + code + ")");
                            } catch (Exception e) {
                                System.err.println("Error updating order status to CANCELLED in return: " + e.getMessage());
                                e.printStackTrace();
                            }
                        } else {
                            System.out.println("Order " + orderCode + " status is " + currentStatus + ", not updating to CANCELLED in return URL");
                        }
                        
                        if (!desc.isEmpty()) {
                            message = desc;
                        } else {
                            message = "Giao dich da bi huy hoac that bai";
                        }
                    }
                }
            } catch (Exception e) {
                System.err.println("Error in handleReturn: " + e.getMessage());
                e.printStackTrace();
                message = "Loi khi xu ly ket qua thanh toan: " + e.getMessage();
            }
        }

        String redirectUrl = frontendReturnUrl
                + "?status=" + urlEncode(status)
                + "&message=" + urlEncode(message)
                + "&orderCode=" + urlEncode(orderCode)
                + "&code=" + urlEncode(code)
                + "&id=" + urlEncode(id);

        @SuppressWarnings("null")
        URI redirectUri = URI.create(redirectUrl);
        return ResponseEntity.status(HttpStatus.FOUND)
                .location(redirectUri)
                .build();
    }

    private String urlEncode(String value) {
        return URLEncoder.encode(value != null ? value : "", StandardCharsets.UTF_8);
    }
}
