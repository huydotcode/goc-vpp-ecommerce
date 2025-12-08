package com.example.learnspring1.domain.dto;

import java.math.BigDecimal;
import java.time.Instant;
import com.example.learnspring1.domain.VariantType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductVariantDTO {
    private Long id;
    private Long productId;
    private String productName;
    private VariantType variantType;
    private String variantValue;
    private String colorCode;
    private String imageUrl;
    private BigDecimal price;
    private Integer stockQuantity;
    private String sku;
    private Integer sortOrder;
    private Boolean isDefault;
    private Boolean isActive;
    private Instant createdAt;
    private Instant updatedAt;
    private String createdBy;
    private String updatedBy;
    private String deletedBy;
}
