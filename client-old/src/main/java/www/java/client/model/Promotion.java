package www.java.client.model;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

import lombok.Data;

@Data
public class Promotion {
    private Long id;
    private String name;
    private String thumbnailUrl;
    private String description;
    private String discountType; // DISCOUNT_AMOUNT, GIFT
    private BigDecimal discountAmount;
    private Boolean isActive;
    private Instant createdAt;
    private Instant updatedAt;
    private String createdBy;
    private String updatedBy;
    private String deletedBy;
    private List<ConditionDTO> conditions;
    private List<GiftItemDTO> giftItems;

    @Data
    public static class ConditionDTO {
        private Long id;
        private String operator; // ALL, ANY
        private List<ConditionDetailDTO> details;
    }

    @Data
    public static class ConditionDetailDTO {
        private Long id;
        private Long productId;
        private String productName;
        private BigDecimal productPrice;
        private Integer requiredQuantity;
    }

    @Data
    public static class GiftItemDTO {
        private Long id;
        private Long productId;
        private String productName;
        private Integer quantity;
    }
}

