package com.example.learnspring1.domain.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

import com.example.learnspring1.domain.PromotionConditionOperator;
import com.example.learnspring1.domain.PromotionDiscountType;
import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PromotionRequestDTO {

    @NotBlank(message = "name is required")
    private String name;

    private String slug;

    private String thumbnailUrl;

    private String description;

    @NotNull(message = "discountType is required")
    private PromotionDiscountType discountType;

    @DecimalMin(value = "0.0", inclusive = false, message = "discountAmount must be greater than zero")
    private BigDecimal discountAmount;

    private Boolean isActive;

    private Instant startDate;

    private Instant endDate;

    @Builder.Default
    @Valid
    private List<ConditionGroupDTO> conditions = new ArrayList<>();

    @Builder.Default
    @Valid
    private List<GiftItemDTO> giftItems = new ArrayList<>();

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ConditionGroupDTO {

        @Builder.Default
        @NotNull(message = "operator is required")
        private PromotionConditionOperator operator = PromotionConditionOperator.ALL;

        @Builder.Default
        @Valid
        @NotEmpty(message = "condition details must not be empty")
        private List<ConditionDetailDTO> details = new ArrayList<>();
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ConditionDetailDTO {

        @NotNull(message = "productId is required")
        private Long productId;

        @NotNull(message = "requiredQuantity is required")
        @Min(value = 1, message = "requiredQuantity must be greater than zero")
        private Integer requiredQuantity;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class GiftItemDTO {

        @NotNull(message = "productId is required")
        private Long productId;

        @NotNull(message = "quantity is required")
        @Min(value = 1, message = "quantity must be greater than zero")
        private Integer quantity;
    }
}

