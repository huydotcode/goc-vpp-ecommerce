package com.example.learnspring1.service.impl;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.Objects;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.learnspring1.domain.Product;
import com.example.learnspring1.domain.Promotion;
import com.example.learnspring1.domain.PromotionCondition;
import com.example.learnspring1.domain.PromotionConditionDetail;
import com.example.learnspring1.domain.PromotionConditionOperator;
import com.example.learnspring1.domain.PromotionDiscountType;
import com.example.learnspring1.domain.PromotionGiftItem;
import com.example.learnspring1.domain.dto.PromotionRequestDTO;
import com.example.learnspring1.repository.ProductRepository;
import com.example.learnspring1.repository.PromotionRepository;
import com.example.learnspring1.service.PromotionService;

@Service
public class PromotionServiceImpl implements PromotionService {

    private final PromotionRepository promotionRepository;
    private final ProductRepository productRepository;

    public PromotionServiceImpl(PromotionRepository promotionRepository, ProductRepository productRepository) {
        this.promotionRepository = promotionRepository;
        this.productRepository = productRepository;
    }

    @Override
    @Transactional
    public Promotion createPromotion(PromotionRequestDTO request) {
        PromotionRequestDTO safeRequest = Objects.requireNonNull(request, "promotion payload is required");

        Promotion promotion = Promotion.builder()
                .name(safeRequest.getName())
                .thumbnailUrl(safeRequest.getThumbnailUrl())
                .description(safeRequest.getDescription())
                .discountType(safeRequest.getDiscountType())
                .discountAmount(resolveDiscountAmount(safeRequest))
                .build();

        buildConditions(promotion, safeRequest.getConditions());
        buildGiftItems(promotion, safeRequest);

        return promotionRepository.save(promotion);
    }

    @Override
    @Transactional(readOnly = true)
    public Promotion getPromotion(Long id) {
        if (id == null) {
            throw new IllegalArgumentException("promotion id is required");
        }
        Promotion promotion = promotionRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Promotion not found with id " + id));
        initializePromotion(promotion);
        return promotion;
    }

    @Override
    @Transactional
    public Promotion updatePromotion(Long id, PromotionRequestDTO request) {
        if (id == null) {
            throw new IllegalArgumentException("promotion id is required");
        }
        PromotionRequestDTO safeRequest = Objects.requireNonNull(request, "promotion payload is required");
        
        Promotion existing = promotionRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Promotion not found with id " + id));
        
        existing.setName(safeRequest.getName());
        existing.setThumbnailUrl(safeRequest.getThumbnailUrl());
        existing.setDescription(safeRequest.getDescription());
        existing.setDiscountType(safeRequest.getDiscountType());
        existing.setDiscountAmount(resolveDiscountAmount(safeRequest));
        existing.setIsActive(safeRequest.getIsActive());
        
        existing.getConditions().clear();
        existing.getGiftItems().clear();
        
        buildConditions(existing, safeRequest.getConditions());
        buildGiftItems(existing, safeRequest);
        
        return promotionRepository.save(existing);
    }

    @Override
    @Transactional(readOnly = true)
    public java.util.List<Promotion> getActivePromotions() {
        List<Promotion> actives = promotionRepository.findByIsActiveTrue();
        if (actives == null || actives.isEmpty()) {
            return Collections.emptyList();
        }

        List<Promotion> initialized = new ArrayList<>(actives.size());
        for (Promotion promotion : actives) {
            Promotion full = promotionRepository.findById(promotion.getId())
                    .orElse(promotion);
            initializePromotion(full);
            initialized.add(full);
        }
        return initialized;
    }

    @Override
    @Transactional(readOnly = true)
    public Page<Promotion> getPromotionsPageWithFilters(Pageable pageable, Long id, String name, Boolean isActive, String search) {
        return promotionRepository.findPromotionsWithFilters(id, name, isActive, search, pageable);
    }

    @Override
    @Transactional
    public void deletePromotion(Long id) {
        Promotion promotion = promotionRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Promotion not found with id " + id));
        promotion.softDelete();
        promotionRepository.save(promotion);
    }

    private void initializePromotion(Promotion promotion) {
        if (promotion == null) {
            return;
        }

        promotion.getGiftItems().size();
        promotion.getConditions().forEach(condition -> {
            if (condition != null) {
                condition.getDetails().size();
            }
        });
    }

    private BigDecimal resolveDiscountAmount(PromotionRequestDTO request) {
        if (request.getDiscountType() == PromotionDiscountType.DISCOUNT_AMOUNT) {
            BigDecimal amount = request.getDiscountAmount();
            if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
                throw new IllegalArgumentException("discountAmount must be greater than zero for DISCOUNT_AMOUNT promotions");
            }
            return amount;
        }
        return null;
    }

    private void buildConditions(Promotion promotion, List<PromotionRequestDTO.ConditionGroupDTO> conditionGroups) {
        if (conditionGroups == null || conditionGroups.isEmpty()) {
            throw new IllegalArgumentException("At least one condition group is required");
        }

        for (PromotionRequestDTO.ConditionGroupDTO groupDTO : conditionGroups) {
            PromotionCondition condition = PromotionCondition.builder()
                    .operator(groupDTO.getOperator() != null ? groupDTO.getOperator() : PromotionConditionOperator.ALL)
                    .build();
            promotion.addCondition(condition);

            if (groupDTO.getDetails() == null || groupDTO.getDetails().isEmpty()) {
                throw new IllegalArgumentException("Condition group must contain at least one detail");
            }

            for (PromotionRequestDTO.ConditionDetailDTO detailDTO : groupDTO.getDetails()) {
                Product product = productRepository.findById(detailDTO.getProductId())
                        .orElseThrow(() -> new NoSuchElementException("Product not found with id " + detailDTO.getProductId()));

                PromotionConditionDetail detail = PromotionConditionDetail.builder()
                        .product(product)
                        .requiredQuantity(detailDTO.getRequiredQuantity())
                        .build();
                condition.addDetail(detail);
            }
        }
    }

    private void buildGiftItems(Promotion promotion, PromotionRequestDTO request) {
        if (request.getDiscountType() != PromotionDiscountType.GIFT) {
            promotion.getGiftItems().clear();
            return;
        }

        if (request.getGiftItems() == null || request.getGiftItems().isEmpty()) {
            throw new IllegalArgumentException("giftItems must not be empty for GIFT promotions");
        }

        for (PromotionRequestDTO.GiftItemDTO giftDTO : request.getGiftItems()) {
            Product product = productRepository.findById(giftDTO.getProductId())
                    .orElseThrow(() -> new NoSuchElementException("Product not found with id " + giftDTO.getProductId()));

            PromotionGiftItem giftItem = PromotionGiftItem.builder()
                    .product(product)
                    .quantity(giftDTO.getQuantity())
                    .build();
            promotion.addGiftItem(giftItem);
        }
    }
}

