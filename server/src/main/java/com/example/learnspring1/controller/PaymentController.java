package com.example.learnspring1.controller;

import com.example.learnspring1.service.VnPayService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/payment")
public class PaymentController {

    private final VnPayService vnPayService;

    @Value("${vnpay.frontend-return-url:http://localhost:5173/home/vnpay-result}")
    private String frontendReturnUrl;

    public PaymentController(VnPayService vnPayService) {
        this.vnPayService = vnPayService;
    }

    public static class CreatePaymentRequest {
        private Long productId;
        private Integer quantity;
        private Long amount;
        private String orderInfo;
        private String bankCode;
        private String locale;

        public Long getProductId() {
            return productId;
        }

        public void setProductId(Long productId) {
            this.productId = productId;
        }

        public Integer getQuantity() {
            return quantity;
        }

        public void setQuantity(Integer quantity) {
            this.quantity = quantity;
        }

        public Long getAmount() {
            return amount;
        }

        public void setAmount(Long amount) {
            this.amount = amount;
        }

        public String getOrderInfo() {
            return orderInfo;
        }

        public void setOrderInfo(String orderInfo) {
            this.orderInfo = orderInfo;
        }

        public String getBankCode() {
            return bankCode;
        }

        public void setBankCode(String bankCode) {
            this.bankCode = bankCode;
        }

        public String getLocale() {
            return locale;
        }

        public void setLocale(String locale) {
            this.locale = locale;
        }
    }

    @PostMapping("/vnpay/create")
    public Map<String, String> createPayment(
            @RequestBody CreatePaymentRequest request,
            HttpServletRequest httpRequest
    ) {
        long amount = request.getAmount() != null ? request.getAmount() : 10000L;
        String orderInfo = request.getOrderInfo() != null
                ? request.getOrderInfo()
                : "Thanh toan don hang demo VNPAY";

        String paymentUrl = vnPayService.createPaymentUrl(
                amount,
                orderInfo,
                "other",
                request.getBankCode(),
                request.getLocale(),
                httpRequest
        );

        Map<String, String> result = new HashMap<>();
        result.put("paymentUrl", paymentUrl);
        return result;
    }

    @GetMapping("/vnpay/ipn")
    public Map<String, String> handleIpn(@RequestParam Map<String, String> allParams) {
        Map<String, String> vnpParams = new HashMap<>();
        for (Map.Entry<String, String> entry : allParams.entrySet()) {
            if (entry.getKey().startsWith("vnp_")) {
                vnpParams.put(entry.getKey(), entry.getValue());
            }
        }

        Map<String, String> response = new HashMap<>();

        try {
            boolean validSignature = vnPayService.validateSignature(vnpParams);
            if (!validSignature) {
                response.put("RspCode", "97");
                response.put("Message", "Invalid signature");
                return response;
            }

            String vnp_ResponseCode = vnpParams.getOrDefault("vnp_ResponseCode", "");
            String vnp_TransactionStatus = vnpParams.getOrDefault("vnp_TransactionStatus", "");

            if ("00".equals(vnp_ResponseCode) && "00".equals(vnp_TransactionStatus)) {
                response.put("RspCode", "00");
                response.put("Message", "Confirm Success");
            } else {
                response.put("RspCode", "02");
                response.put("Message", "Order already confirmed or failed");
            }
        } catch (Exception e) {
            response.put("RspCode", "99");
            response.put("Message", "Unknown error");
        }

        return response;
    }

    @GetMapping("/vnpay/return")
    public ResponseEntity<Void> handleReturn(@RequestParam Map<String, String> allParams) {
        Map<String, String> vnpParams = new HashMap<>();
        for (Map.Entry<String, String> entry : allParams.entrySet()) {
            if (entry.getKey().startsWith("vnp_")) {
                vnpParams.put(entry.getKey(), entry.getValue());
            }
        }

        boolean validSignature = vnPayService.validateSignature(vnpParams);
        String vnp_ResponseCode = vnpParams.getOrDefault("vnp_ResponseCode", "");
        String vnp_TxnRef = vnpParams.getOrDefault("vnp_TxnRef", "");

        String status = "failed";
        String message = "Giao dich khong thanh cong";
        if (validSignature && "00".equals(vnp_ResponseCode)) {
            status = "success";
            message = "Giao dich thanh cong";
        } else if (!validSignature) {
            status = "invalid";
            message = "Chu ky khong hop le";
        }

        String redirectUrl = frontendReturnUrl
                + "?status=" + urlEncode(status)
                + "&message=" + urlEncode(message)
                + "&orderId=" + urlEncode(vnp_TxnRef)
                + "&code=" + urlEncode(vnp_ResponseCode);

        return ResponseEntity.status(HttpStatus.FOUND)
                .location(URI.create(redirectUrl))
                .build();
    }

    private String urlEncode(String value) {
        return URLEncoder.encode(value != null ? value : "", StandardCharsets.UTF_8);
    }
}


