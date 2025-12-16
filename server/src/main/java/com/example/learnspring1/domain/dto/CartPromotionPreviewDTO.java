package com.example.learnspring1.domain.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
public class CartPromotionPreviewDTO {
    private BigDecimal subtotal;
    private BigDecimal discountAmount;
    private BigDecimal finalAmount;
    private List<CartResponseDTO.PromotionSummaryDTO> appliedPromotions;
    private List<CartResponseDTO.GiftItemDTO> giftItems;
}

