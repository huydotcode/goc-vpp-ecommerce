package com.example.learnspring1.service;

import com.example.learnspring1.domain.Promotion;
import com.example.learnspring1.domain.dto.PromotionRequestDTO;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface PromotionService {

    Promotion createPromotion(PromotionRequestDTO request);

    Promotion updatePromotion(Long id, PromotionRequestDTO request);

    Promotion getPromotion(Long id);

    java.util.List<Promotion> getActivePromotions();

    Page<Promotion> getPromotionsPageWithFilters(Pageable pageable, Long id, String name, Boolean isActive, String search);

    void deletePromotion(Long id);
}

