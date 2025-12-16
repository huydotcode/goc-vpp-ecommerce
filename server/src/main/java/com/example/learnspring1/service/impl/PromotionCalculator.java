package com.example.learnspring1.service.impl;

import com.example.learnspring1.domain.*;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Component
public class PromotionCalculator {

    public CalculationResult calculate(BigDecimal cartTotal, List<CartItem> cartItems,
            List<Promotion> activePromotions) {
        CalculationResult result = new CalculationResult();
        result.setOriginalTotal(cartTotal);

        List<Promotion> applicablePromotions = new ArrayList<>();

        // 1. Filter applicable promotions
        for (Promotion promotion : activePromotions) {
            if (isPromotionApplicable(promotion, cartTotal, cartItems)) {
                applicablePromotions.add(promotion);
            }
        }

        // 2. Separate Gifts and Discounts
        List<Promotion> giftPromotions = applicablePromotions.stream()
                .filter(p -> p.getDiscountType() == PromotionDiscountType.GIFT)
                .collect(Collectors.toList());

        List<Promotion> discountPromotions = applicablePromotions.stream()
                .filter(p -> p.getDiscountType() == PromotionDiscountType.DISCOUNT_AMOUNT)
                .collect(Collectors.toList());

        // 3. Apply ALL Gift Promotions (Stackable)
        for (Promotion p : giftPromotions) {
            result.getAppliedPromotions().add(p);
            for (PromotionGiftItem gift : p.getGiftItems()) {
                result.getGiftItems().add(gift);
            }
        }

        // 4. Apply Discount Promotions
        // Logic: Nếu các promotion có sản phẩm khác nhau (không overlap), áp dụng tất
        // cả
        // Nếu overlap, chỉ chọn 1 cái tốt nhất
        List<Promotion> appliedDiscountPromotions = selectDiscountPromotions(discountPromotions, cartItems);

        BigDecimal totalDiscountAmount = BigDecimal.ZERO;
        for (Promotion p : appliedDiscountPromotions) {
            result.getAppliedPromotions().add(p);
            if (p.getDiscountAmount() != null) {
                totalDiscountAmount = totalDiscountAmount.add(p.getDiscountAmount());
            }
        }
        result.setDiscountAmount(totalDiscountAmount);

        // 5. Final Calculation
        BigDecimal finalTotal = cartTotal.subtract(result.getDiscountAmount());
        if (finalTotal.compareTo(BigDecimal.ZERO) < 0) {
            finalTotal = BigDecimal.ZERO;
        }
        result.setFinalTotal(finalTotal);

        return result;
    }

    private boolean isPromotionApplicable(Promotion promotion, BigDecimal cartTotal, List<CartItem> cartItems) {
        // Empty conditions means valid for all? Or invalid? Assuming valid if active.
        if (promotion.getConditions() == null || promotion.getConditions().isEmpty()) {
            return true;
        }

        // Check all conditions (AND relationship between groups if any, or internal
        // logic)
        // Entity structure: Promotion -> Conditions (List) -> Details (List)
        // Let's assume strict AND for all conditions for now based on typical
        // requirements

        for (PromotionCondition condition : promotion.getConditions()) {
            if (!checkCondition(condition, cartTotal, cartItems)) {
                return false;
            }
        }

        return true;
    }

    private boolean checkCondition(PromotionCondition condition, BigDecimal cartTotal, List<CartItem> cartItems) {
        // Logic depends on Condition Operator (AND/OR) inside a condition group?
        // Reading Entity: PromotionCondition has 'operator' (ALL, ANY) and list of
        // 'details'
        // PromotionConditionDetail has 'product' and 'requiredQuantity'

        // Operator ALL: User must buy ALL products in the list with required quantity
        // Operator ANY: User must buy ANY product in the list with required quantity

        if (condition.getDetails() == null || condition.getDetails().isEmpty()) {
            return true;
        }

        if (condition.getOperator() == PromotionConditionOperator.ALL) {
            for (PromotionConditionDetail detail : condition.getDetails()) {
                if (!cartContainsProduct(cartItems, detail.getProduct().getId(), detail.getRequiredQuantity())) {
                    return false;
                }
            }
            return true;
        } else { // ANY
            for (PromotionConditionDetail detail : condition.getDetails()) {
                if (cartContainsProduct(cartItems, detail.getProduct().getId(), detail.getRequiredQuantity())) {
                    return true;
                }
            }
            return false;
        }
    }

    /**
     * Chọn các discount promotions để áp dụng
     * Logic: Nếu các promotion có sản phẩm khác nhau (không overlap), áp dụng tất
     * cả
     * Nếu overlap, chỉ chọn 1 cái tốt nhất
     */
    private List<Promotion> selectDiscountPromotions(List<Promotion> discountPromotions, List<CartItem> cartItems) {
        if (discountPromotions.isEmpty()) {
            return new ArrayList<>();
        }

        // Nếu chỉ có 1 promotion, áp dụng luôn
        if (discountPromotions.size() == 1) {
            return discountPromotions;
        }

        // Lấy danh sách sản phẩm yêu cầu của mỗi promotion
        List<PromotionWithProducts> promotionsWithProducts = new ArrayList<>();
        for (Promotion p : discountPromotions) {
            Set<Long> productIds = getRequiredProductIds(p);
            promotionsWithProducts.add(new PromotionWithProducts(p, productIds));
        }

        // Kiểm tra xem các promotion có overlap sản phẩm không
        List<Promotion> applied = new ArrayList<>();
        List<Set<Long>> appliedProductSets = new ArrayList<>();

        // Sắp xếp theo discountAmount giảm dần để ưu tiên promotion tốt hơn
        promotionsWithProducts.sort((a, b) -> {
            BigDecimal discountA = a.promotion.getDiscountAmount() != null ? a.promotion.getDiscountAmount()
                    : BigDecimal.ZERO;
            BigDecimal discountB = b.promotion.getDiscountAmount() != null ? b.promotion.getDiscountAmount()
                    : BigDecimal.ZERO;
            return discountB.compareTo(discountA);
        });

        for (PromotionWithProducts pwp : promotionsWithProducts) {
            // Kiểm tra xem có overlap với các promotion đã áp dụng không
            boolean hasOverlap = false;
            for (Set<Long> appliedSet : appliedProductSets) {
                if (hasProductOverlap(pwp.productIds, appliedSet)) {
                    hasOverlap = true;
                    break;
                }
            }

            // Nếu không overlap, có thể áp dụng cùng lúc
            if (!hasOverlap) {
                applied.add(pwp.promotion);
                appliedProductSets.add(pwp.productIds);
            }
        }

        return applied;
    }

    /**
     * Lấy danh sách product IDs yêu cầu của promotion
     */
    private Set<Long> getRequiredProductIds(Promotion promotion) {
        Set<Long> productIds = new HashSet<>();
        if (promotion.getConditions() == null || promotion.getConditions().isEmpty()) {
            // Nếu không có điều kiện, promotion áp dụng cho tất cả sản phẩm
            // Trả về empty set để đánh dấu là "áp dụng cho tất cả"
            return productIds;
        }

        for (PromotionCondition condition : promotion.getConditions()) {
            if (condition.getDetails() != null) {
                for (PromotionConditionDetail detail : condition.getDetails()) {
                    if (detail.getProduct() != null) {
                        productIds.add(detail.getProduct().getId());
                    }
                }
            }
        }
        return productIds;
    }

    /**
     * Kiểm tra xem 2 set product IDs có overlap không
     */
    private boolean hasProductOverlap(Set<Long> set1, Set<Long> set2) {
        // Nếu một trong hai set rỗng (promotion không có điều kiện sản phẩm cụ thể),
        // thì coi như overlap vì nó áp dụng cho tất cả
        if (set1.isEmpty() || set2.isEmpty()) {
            return true;
        }

        // Kiểm tra xem có sản phẩm chung không
        for (Long productId : set1) {
            if (set2.contains(productId)) {
                return true;
            }
        }
        return false;
    }

    private static class PromotionWithProducts {
        Promotion promotion;
        Set<Long> productIds;

        PromotionWithProducts(Promotion promotion, Set<Long> productIds) {
            this.promotion = promotion;
            this.productIds = productIds;
        }
    }

    private boolean cartContainsProduct(List<CartItem> cartItems, Long productId, Integer requiredQuantity) {
        int count = 0;
        for (CartItem item : cartItems) {
            if (item.getProduct().getId().equals(productId)) {
                count += item.getQuantity();
            }
        }
        return count >= requiredQuantity;
    }

    @lombok.Data
    public static class CalculationResult {
        private BigDecimal originalTotal = BigDecimal.ZERO;
        private BigDecimal discountAmount = BigDecimal.ZERO;
        private BigDecimal finalTotal = BigDecimal.ZERO;
        private List<Promotion> appliedPromotions = new ArrayList<>();
        private List<PromotionGiftItem> giftItems = new ArrayList<>();
    }
}
