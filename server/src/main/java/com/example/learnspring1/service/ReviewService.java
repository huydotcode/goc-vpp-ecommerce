package com.example.learnspring1.service;

import com.example.learnspring1.domain.ProductReview;
import com.example.learnspring1.domain.dto.CreateReviewRequestDTO;
import com.example.learnspring1.domain.dto.ReviewStatsDTO;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface ReviewService {
    ProductReview createReview(CreateReviewRequestDTO request);
    Page<ProductReview> getReviewsByProduct(Long productId, Pageable pageable);
    ReviewStatsDTO getReviewStats(Long productId);
    void deleteReview(Long id);
}