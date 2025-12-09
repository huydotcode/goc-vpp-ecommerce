package com.example.learnspring1.service.impl;

import com.example.learnspring1.domain.Product;
import com.example.learnspring1.domain.ProductReview;
import com.example.learnspring1.domain.dto.CreateReviewRequestDTO; // Import đúng DTO
import com.example.learnspring1.domain.dto.ReviewStatsDTO;
import com.example.learnspring1.repository.ProductRepository;
import com.example.learnspring1.repository.ReviewRepository;
import com.example.learnspring1.service.ReviewService;
import com.example.learnspring1.utils.SecurityUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.NoSuchElementException;

@Service
@RequiredArgsConstructor
public class ReviewServiceImpl implements ReviewService {

    private final ReviewRepository reviewRepository;
    private final ProductRepository productRepository;

    @Override
    @Transactional
    // SỬA: Dùng đúng tên class CreateReviewRequestDTO
    public ProductReview createReview(CreateReviewRequestDTO request) {
        // 1. Validate Product
        Product product = productRepository.findById(request.getProductId())
                .orElseThrow(() -> new NoSuchElementException("Product not found"));

        // 2. Get Current User
        String currentUser = SecurityUtil.getCurrentUserLogin()
                .orElseThrow(() -> new RuntimeException("Unauthorized"));

        // 3. Create Entity
        ProductReview review = ProductReview.builder()
                .product(product)
                .rating(request.getRating())
                .content(request.getContent())
                // Logic lấy tên: Nếu request có gửi tên thì lấy, ko thì lấy username
                .userFullName(request.getUserFullName() != null ? request.getUserFullName() : currentUser)
                .build();

        return reviewRepository.save(review);
    }

    // ĐÃ XÓA hàm createReview thừa trả về null ở đây

    @Override
    public Page<ProductReview> getReviewsByProduct(Long productId, Pageable pageable) {
        return reviewRepository.findByProductIdActive(productId, pageable);
    }

    @Override
    public ReviewStatsDTO getReviewStats(Long productId) {
        ReviewStatsDTO stats = reviewRepository.getStatsByProductId(productId);

        // SỬA: Thêm check null cho biến stats để tránh lỗi NullPointerException
        if (stats == null || stats.getTotalReviews() == 0) {
            return new ReviewStatsDTO(0.0, 0L);
        }

        // Làm tròn 1 chữ số thập phân
        double roundedAvg = Math.round(stats.getAverageRating() * 10.0) / 10.0;
        stats.setAverageRating(roundedAvg);
        return stats;
    }

    @Override
    public void deleteReview(Long id) {
         ProductReview review = reviewRepository.findById(id)
            .orElseThrow(() -> new NoSuchElementException("Review not found"));
         review.softDelete();
         reviewRepository.save(review);
    }
}