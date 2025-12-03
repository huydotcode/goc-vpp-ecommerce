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

    @Data
    public static class CartItemDTO {
        private Long id;
        private Long productId;
        private String productName;
        private String productImageUrl;
        private BigDecimal unitPrice;
        private Integer quantity;
        private BigDecimal subtotal;
    }
}
