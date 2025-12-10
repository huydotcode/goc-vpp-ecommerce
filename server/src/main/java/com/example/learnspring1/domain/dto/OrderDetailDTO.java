package com.example.learnspring1.domain.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

import com.example.learnspring1.domain.Order;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class OrderDetailDTO {
    private Long id;
    private String orderCode;
    private BigDecimal totalAmount;
    private Order.OrderStatus status;
    private Order.PaymentMethod paymentMethod;
    private Instant createdAt;
    private String customerName;
    private String customerEmail;
    private String customerPhone;
    private String customerAddress;
    private String description;
    private BigDecimal discountAmount;
    private BigDecimal finalAmount;
    private String appliedPromotions;
    private List<OrderItemSummaryDTO> items;
}
