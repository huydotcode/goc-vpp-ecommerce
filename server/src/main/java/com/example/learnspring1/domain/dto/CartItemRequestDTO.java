package com.example.learnspring1.domain.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class CartItemRequestDTO {
    @NotNull(message = "Product ID is required")
    private Long productId;

    // Nullable nếu product không có biến thể; bắt buộc nếu product có biến thể
    private Long variantId;

    @NotNull(message = "Quantity is required")
    @Min(value = 1, message = "Quantity must be at least 1")
    private Integer quantity;
}
