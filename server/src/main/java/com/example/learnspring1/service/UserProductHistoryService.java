package com.example.learnspring1.service;

import com.example.learnspring1.domain.Product;
import com.example.learnspring1.domain.UserProductHistory;
import com.example.learnspring1.repository.ProductRepository;
import com.example.learnspring1.repository.UserProductHistoryRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Service để lưu trữ lịch sử click/view sản phẩm của người dùng.
 * Lưu vào database để persist qua các lần restart server.
 */
@Service
public class UserProductHistoryService {

    private final UserProductHistoryRepository historyRepository;
    private final ProductRepository productRepository;
    private static final int MAX_HISTORY_PER_USER = 50; // Giới hạn 50 sản phẩm gần nhất

    public UserProductHistoryService(
            UserProductHistoryRepository historyRepository,
            ProductRepository productRepository) {
        this.historyRepository = historyRepository;
        this.productRepository = productRepository;
    }

    /**
     * Thêm sản phẩm vào lịch sử của người dùng
     * Nếu đã tồn tại thì cập nhật viewedAt
     */
    @Transactional
    public void addProductView(String userId, Long productId) {
        if (userId == null || productId == null) {
            return;
        }

        // Kiểm tra product có tồn tại không
        Product product = productRepository.findById(productId).orElse(null);
        if (product == null) {
            return;
        }

        // Tìm xem đã có history chưa
        UserProductHistory existing = historyRepository.findByUserIdAndProductId(userId, productId);
        
        if (existing != null) {
            // Nếu đã có thì chỉ cập nhật viewedAt
            existing.setViewedAt(Instant.now());
            existing.setUpdatedAt(Instant.now());
            historyRepository.save(existing);
        } else {
            // Nếu chưa có thì tạo mới
            UserProductHistory history = UserProductHistory.builder()
                    .userId(userId)
                    .product(product)
                    .viewedAt(Instant.now())
                    .build();
            historyRepository.save(history);
            
            // Giữ số lượng history không quá MAX_HISTORY_PER_USER
            long count = historyRepository.countByUserId(userId);
            if (count > MAX_HISTORY_PER_USER) {
                // Lấy danh sách tất cả history, sắp xếp theo viewedAt
                List<UserProductHistory> allHistory = historyRepository.findByUserIdOrderByViewedAtDesc(userId);
                // Xóa các history cũ nhất
                List<UserProductHistory> toDelete = allHistory.subList(MAX_HISTORY_PER_USER, allHistory.size());
                historyRepository.deleteAll(toDelete);
            }
        }
    }

    /**
     * Lấy lịch sử sản phẩm của người dùng (danh sách product IDs)
     */
    public List<Long> getUserHistory(String userId) {
        if (userId == null) {
            return Collections.emptyList();
        }
        
        List<UserProductHistory> histories = historyRepository.findByUserIdOrderByViewedAtDesc(userId);
        return histories.stream()
                .map(h -> h.getProduct().getId())
                .collect(Collectors.toList());
    }

    /**
     * Lấy lịch sử với giới hạn số lượng
     */
    public List<Long> getUserHistory(String userId, int limit) {
        if (userId == null) {
            return Collections.emptyList();
        }
        
        Pageable pageable = PageRequest.of(0, limit);
        List<UserProductHistory> histories = historyRepository.findByUserIdOrderByViewedAtDesc(userId, pageable);
        return histories.stream()
                .map(h -> h.getProduct().getId())
                .collect(Collectors.toList());
    }

    /**
     * Xóa lịch sử của người dùng
     */
    @Transactional
    public void clearUserHistory(String userId) {
        if (userId != null) {
            List<UserProductHistory> histories = historyRepository.findByUserIdOrderByViewedAtDesc(userId);
            historyRepository.deleteAll(histories);
        }
    }
}

