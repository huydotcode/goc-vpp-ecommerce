package com.example.learnspring1.repository;

import com.example.learnspring1.domain.UserProductHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;

@Repository
public interface UserProductHistoryRepository extends JpaRepository<UserProductHistory, Long> {
    
    /**
     * Tìm history theo userId và productId
     */
    UserProductHistory findByUserIdAndProductId(String userId, Long productId);
    
    /**
     * Lấy lịch sử của user, sắp xếp theo viewedAt giảm dần (mới nhất trước)
     */
    @Query("SELECT h FROM UserProductHistory h WHERE h.userId = :userId ORDER BY h.viewedAt DESC")
    List<UserProductHistory> findByUserIdOrderByViewedAtDesc(@Param("userId") String userId);
    
    /**
     * Lấy lịch sử của user với giới hạn số lượng
     */
    @Query("SELECT h FROM UserProductHistory h WHERE h.userId = :userId ORDER BY h.viewedAt DESC")
    List<UserProductHistory> findByUserIdOrderByViewedAtDesc(@Param("userId") String userId, org.springframework.data.domain.Pageable pageable);
    
    /**
     * Xóa các history cũ hơn một thời điểm nhất định (để giữ số lượng hợp lý)
     */
    @Modifying
    @Query("DELETE FROM UserProductHistory h WHERE h.userId = :userId AND h.viewedAt < :beforeDate")
    void deleteOldHistory(@Param("userId") String userId, @Param("beforeDate") Instant beforeDate);
    
    /**
     * Đếm số lượng history của user
     */
    long countByUserId(String userId);
}

