package com.example.learnspring1.service.impl;

import com.example.learnspring1.domain.*;
import com.example.learnspring1.domain.dto.CartResponseDTO;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@Component
public class PromotionCalculator {

    public CalculationResult calculate(BigDecimal cartTotal, List<CartItem> cartItems, List<Promotion> activePromotions) {
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

        // 4. Apply BEST Discount Promotion (Exclusive)
        Promotion bestDiscount = null;
        BigDecimal maxDiscountAmount = BigDecimal.ZERO;

        for (Promotion p : discountPromotions) {
            BigDecimal discountAmount = BigDecimal.ZERO;
            if (p.getDiscountType() == PromotionDiscountType.DISCOUNT_AMOUNT) {
                discountAmount = p.getDiscountAmount();
            }

            if (discountAmount.compareTo(maxDiscountAmount) > 0) {
                maxDiscountAmount = discountAmount;
                bestDiscount = p;
            }
        }

        if (bestDiscount != null) {
            result.getAppliedPromotions().add(bestDiscount);
            result.setDiscountAmount(maxDiscountAmount);
        }

        // 5. Final Calculation
        BigDecimal finalTotal = cartTotal.subtract(result.getDiscountAmount());
        if (finalTotal.compareTo(BigDecimal.ZERO) < 0) {
            finalTotal = BigDecimal.ZERO;
        }
        result.setFinalTotal(finalTotal);

        return result;
    }

    private boolean isPromotionApplicable(Promotion promotion, BigDecimal cartTotal, List<CartItem> cartItems) {
        // Check time validity first
        Instant now = Instant.now();
        if (promotion.getStartDate() != null && now.isBefore(promotion.getStartDate())) {
            return false; // Promotion hasn't started yet
        }
        if (promotion.getEndDate() != null && now.isAfter(promotion.getEndDate())) {
            return false; // Promotion has expired
        }

        // Empty conditions means valid for all? Or invalid? Assuming valid if active.
        if (promotion.getConditions() == null || promotion.getConditions().isEmpty()) {
            return true;
        }
        
        // Check all conditions (AND relationship between groups if any, or internal logic)
        // Entity structure: Promotion -> Conditions (List) -> Details (List)
        // Let's assume strict AND for all conditions for now based on typical requirements
        
        for (PromotionCondition condition : promotion.getConditions()) {
             if (!checkCondition(condition, cartTotal, cartItems)) {
                 return false;
             }
        }
        
        return true;
    }

    private boolean checkCondition(PromotionCondition condition, BigDecimal cartTotal, List<CartItem> cartItems) {
        // Logic depends on Condition Operator (AND/OR) inside a condition group?
        // Reading Entity: PromotionCondition has 'operator' (ALL, ANY) and list of 'details'
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
