package com.example.learnspring1.controller;

import com.example.learnspring1.domain.APIResponse;
import com.example.learnspring1.domain.ProductReview;
import com.example.learnspring1.domain.dto.CreateReviewRequestDTO;
import com.example.learnspring1.domain.dto.MetadataDTO;
import com.example.learnspring1.domain.dto.PaginatedResponseDTO;
import com.example.learnspring1.domain.dto.ReviewDTO;
import com.example.learnspring1.domain.dto.ReviewStatsDTO;
import com.example.learnspring1.service.ReviewService;
import com.example.learnspring1.utils.SecurityUtil;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/reviews")
@Tag(name = "Review", description = "Quản lý đánh giá sản phẩm")
@RequiredArgsConstructor
public class ReviewController {

    private final ReviewService reviewService;

    @PostMapping
    @Operation(summary = "Tạo đánh giá mới")
    public APIResponse<ReviewDTO> createReview(@Valid @RequestBody CreateReviewRequestDTO request) {
        ProductReview review = reviewService.createReview(request);

        APIResponse<ReviewDTO> response = new APIResponse<>();
        response.setStatus("success");
        response.setMessage("Đánh giá thành công");
        response.setData(toDTO(review));
        response.setTimestamp(LocalDateTime.now());

        return response;
    }

    @GetMapping("/stats/{productId}")
    @Operation(summary = "Lấy thống kê sao trung bình")
    public APIResponse<ReviewStatsDTO> getStats(@PathVariable Long productId) {
        APIResponse<ReviewStatsDTO> response = new APIResponse<>();
        response.setStatus("success");
        response.setMessage("Lấy thống kê thành công");
        response.setData(reviewService.getReviewStats(productId));
        response.setTimestamp(LocalDateTime.now());

        return response;
    }

    @GetMapping("/product/{productId}")
    @Operation(summary = "Lấy danh sách đánh giá theo sản phẩm (có phân trang)")
    public PaginatedResponseDTO<ReviewDTO> getProductReviews(
            @PathVariable Long productId,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "5") int size,
            @RequestParam(defaultValue = "createdAt") String sort,
            @RequestParam(defaultValue = "desc") String direction) {
        page = Math.max(1, page);
        size = Math.min(Math.max(1, size), 100);

        Sort.Direction sortDirection = direction.equalsIgnoreCase("asc") ? Sort.Direction.ASC : Sort.Direction.DESC;
        Pageable pageable = PageRequest.of(page - 1, size, Sort.by(sortDirection, sort));

        Page<ProductReview> pageResult = reviewService.getReviewsByProduct(productId, pageable);
        List<ReviewDTO> dtoList = pageResult.getContent().stream().map(this::toDTO).collect(Collectors.toList());

        MetadataDTO metadata = MetadataDTO.builder()
                .page(page)
                .size(size)
                .totalElements(pageResult.getTotalElements())
                .totalPages(pageResult.getTotalPages())
                .first(pageResult.isFirst())
                .last(pageResult.isLast())
                .empty(pageResult.isEmpty())
                .sortField(sort)
                .sortDirection(direction)
                .numberOfElements(pageResult.getNumberOfElements())
                .build();

        return PaginatedResponseDTO.<ReviewDTO>builder()
                .metadata(metadata)
                .result(dtoList)
                .build();
    }

    @GetMapping("/check/{productId}")
    @Operation(summary = "Kiểm tra user đã đánh giá sản phẩm chưa")
    public APIResponse<Boolean> checkUserReviewed(@PathVariable Long productId) {
        String userEmail = SecurityUtil.getCurrentUserLogin()
                .orElseThrow(() -> new RuntimeException("Unauthorized"));

        boolean hasReviewed = reviewService.hasUserReviewedProduct(productId, userEmail);

        APIResponse<Boolean> response = new APIResponse<>();
        response.setStatus("success");
        response.setData(hasReviewed);
        response.setTimestamp(LocalDateTime.now());
        return response;
    }

    private ReviewDTO toDTO(ProductReview entity) {
        if (entity == null)
            return null;
        return ReviewDTO.builder()
                .id(entity.getId())
                .productId(entity.getProduct().getId())
                .userFullName(entity.getUserFullName())
                .rating(entity.getRating())
                .content(entity.getContent())
                .createdAt(entity.getCreatedAt())
                .build();
    }
}