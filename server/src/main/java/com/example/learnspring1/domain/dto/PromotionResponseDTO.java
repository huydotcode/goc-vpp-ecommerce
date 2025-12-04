package com.example.learnspring1.domain.dto;

import java.math.BigDecimal;
import java.util.List;

import com.example.learnspring1.domain.Promotion;
import com.example.learnspring1.domain.PromotionCondition;
import com.example.learnspring1.domain.PromotionConditionDetail;
import com.example.learnspring1.domain.PromotionDiscountType;
import com.example.learnspring1.domain.PromotionGiftItem;

public class PromotionResponseDTO {

    private Long id;
    private String name;
    private String thumbnailUrl;
    private String description;
    private PromotionDiscountType discountType;
    private BigDecimal discountAmount;
    private Boolean isActive;
    private List<ConditionDTO> conditions;
    private List<GiftItemDTO> giftItems;

    public PromotionResponseDTO() {
    }

    public PromotionResponseDTO(Long id,
            String name,
            String thumbnailUrl,
            String description,
            PromotionDiscountType discountType,
            BigDecimal discountAmount,
            Boolean isActive,
            List<ConditionDTO> conditions,
            List<GiftItemDTO> giftItems) {
        this.id = id;
        this.name = name;
        this.thumbnailUrl = thumbnailUrl;
        this.description = description;
        this.discountType = discountType;
        this.discountAmount = discountAmount;
        this.isActive = isActive;
        this.conditions = conditions;
        this.giftItems = giftItems;
    }

    public static PromotionResponseDTO fromEntity(Promotion promotion) {
        if (promotion == null) {
            return null;
        }

        List<ConditionDTO> conditionDTOs = promotion.getConditions().stream()
                .map(ConditionDTO::fromEntity)
                .toList();

        List<GiftItemDTO> giftDTOs = promotion.getGiftItems().stream()
                .map(GiftItemDTO::fromEntity)
                .toList();

        return new PromotionResponseDTO(
                promotion.getId(),
                promotion.getName(),
                promotion.getThumbnailUrl(),
                promotion.getDescription(),
                promotion.getDiscountType(),
                promotion.getDiscountAmount(),
                promotion.getIsActive(),
                conditionDTOs,
                giftDTOs);
    }

    public Long getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public String getThumbnailUrl() {
        return thumbnailUrl;
    }

    public String getDescription() {
        return description;
    }

    public PromotionDiscountType getDiscountType() {
        return discountType;
    }

    public BigDecimal getDiscountAmount() {
        return discountAmount;
    }

    public Boolean getIsActive() {
        return isActive;
    }

    public List<ConditionDTO> getConditions() {
        return conditions;
    }

    public List<GiftItemDTO> getGiftItems() {
        return giftItems;
    }

    public static class ConditionDTO {
        private Long id;
        private String operator;
        private List<ConditionDetailDTO> details;

        public ConditionDTO() {
        }

        public ConditionDTO(Long id, String operator, List<ConditionDetailDTO> details) {
            this.id = id;
            this.operator = operator;
            this.details = details;
        }

        public static ConditionDTO fromEntity(PromotionCondition condition) {
            if (condition == null) {
                return null;
            }

            List<ConditionDetailDTO> detailDTOs = condition.getDetails().stream()
                    .map(ConditionDetailDTO::fromEntity)
                    .toList();

            return new ConditionDTO(
                    condition.getId(),
                    condition.getOperator() != null ? condition.getOperator().name() : null,
                    detailDTOs);
        }

        public Long getId() {
            return id;
        }

        public String getOperator() {
            return operator;
        }

        public List<ConditionDetailDTO> getDetails() {
            return details;
        }
    }

    public static class ConditionDetailDTO {
        private Long id;
        private Long productId;
        private String productName;
        private BigDecimal productPrice;
        private String productThumbnailUrl;
        private Integer requiredQuantity;

        public ConditionDetailDTO() {
        }

        public ConditionDetailDTO(Long id,
                Long productId,
                String productName,
                BigDecimal productPrice,
                String productThumbnailUrl,
                Integer requiredQuantity) {
            this.id = id;
            this.productId = productId;
            this.productName = productName;
            this.productPrice = productPrice;
            this.productThumbnailUrl = productThumbnailUrl;
            this.requiredQuantity = requiredQuantity;
        }

        public static ConditionDetailDTO fromEntity(PromotionConditionDetail detail) {
            if (detail == null) {
                return null;
            }

            return new ConditionDetailDTO(
                    detail.getId(),
                    detail.getProduct() != null ? detail.getProduct().getId() : null,
                    detail.getProduct() != null ? detail.getProduct().getName() : null,
                    detail.getProduct() != null ? detail.getProduct().getPrice() : null,
                    detail.getProduct() != null ? detail.getProduct().getThumbnailUrl() : null,
                    detail.getRequiredQuantity());
        }

        public Long getId() {
            return id;
        }

        public Long getProductId() {
            return productId;
        }

        public String getProductName() {
            return productName;
        }

        public BigDecimal getProductPrice() {
            return productPrice;
        }

        public String getProductThumbnailUrl() {
            return productThumbnailUrl;
        }

        public Integer getRequiredQuantity() {
            return requiredQuantity;
        }
    }

    public static class GiftItemDTO {
        private Long id;
        private Long productId;
        private String productName;
        private String productThumbnailUrl;
        private Integer quantity;

        public GiftItemDTO() {
        }

        public GiftItemDTO(Long id, Long productId, String productName, String productThumbnailUrl, Integer quantity) {
            this.id = id;
            this.productId = productId;
            this.productName = productName;
            this.productThumbnailUrl = productThumbnailUrl;
            this.quantity = quantity;
        }

        public static GiftItemDTO fromEntity(PromotionGiftItem giftItem) {
            if (giftItem == null) {
                return null;
            }

            return new GiftItemDTO(
                    giftItem.getId(),
                    giftItem.getProduct() != null ? giftItem.getProduct().getId() : null,
                    giftItem.getProduct() != null ? giftItem.getProduct().getName() : null,
                    giftItem.getProduct() != null ? giftItem.getProduct().getThumbnailUrl() : null,
                    giftItem.getQuantity());
        }

        public Long getId() {
            return id;
        }

        public Long getProductId() {
            return productId;
        }

        public String getProductName() {
            return productName;
        }

        public String getProductThumbnailUrl() {
            return productThumbnailUrl;
        }

        public Integer getQuantity() {
            return quantity;
        }
    }
}
