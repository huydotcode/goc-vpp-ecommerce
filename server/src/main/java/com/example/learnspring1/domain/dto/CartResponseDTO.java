package com.example.learnspring1.domain.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.util.List;

@Data
public class CartResponseDTO {
    private Long cartId;
    private List<CartItemDTO> items;
    private BigDecimal totalAmount;
    private Integer totalItems;

    private BigDecimal discountAmount;
    private BigDecimal finalAmount;
    private List<PromotionSummaryDTO> appliedPromotions;
    private List<GiftItemDTO> giftItems;

    @Data
    public static class CartItemDTO {
        private Long id;
        private Long productId;
        private Long variantId;
        private String productName;
        private String variantName;
        private String sku;
        private String productImageUrl;
        private BigDecimal unitPrice;
        private Integer quantity;
        private BigDecimal subtotal;
    }

    @Data
    public static class PromotionSummaryDTO {
        private Long id;
        private String name;
        private String description;
        private String discountType;
        private BigDecimal value;
    }

    @Data
    public static class GiftItemDTO {
        private Long productId;
        private String productName;
        private String productImageUrl;
        private Integer quantity;
    }
}
