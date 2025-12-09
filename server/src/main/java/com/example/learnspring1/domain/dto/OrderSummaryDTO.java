package com.example.learnspring1.domain.dto;

import java.math.BigDecimal;
import java.time.Instant;

import com.example.learnspring1.domain.Order;
import java.util.List;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class OrderSummaryDTO {
    private Long id;
    private String orderCode;
    private BigDecimal totalAmount;
    private Order.OrderStatus status;
    private Order.PaymentMethod paymentMethod;
    private Instant createdAt;
    private List<OrderItemSummaryDTO> items;
}
