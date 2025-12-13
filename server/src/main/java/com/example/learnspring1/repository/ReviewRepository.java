package com.example.learnspring1.repository;

import com.example.learnspring1.domain.ProductReview;
import com.example.learnspring1.domain.dto.ReviewStatsDTO;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ReviewRepository extends JpaRepository<ProductReview, Long> {

       @Query("SELECT r FROM ProductReview r WHERE " +
                     "r.product.id = :productId AND " +
                     "r.isActive = true AND " +
                     "r.deletedBy IS NULL")
       Page<ProductReview> findByProductIdActive(@Param("productId") Long productId, Pageable pageable);

       @Query("SELECT new com.example.learnspring1.domain.dto.ReviewStatsDTO(AVG(r.rating), COUNT(r)) " +
                     "FROM ProductReview r WHERE r.product.id = :productId AND r.isActive = true AND r.deletedBy IS NULL")
       ReviewStatsDTO getStatsByProductId(@Param("productId") Long productId);

       @Query("SELECT r FROM ProductReview r WHERE " +
                     "r.product.id = :productId AND " +
                     "r.userEmail = :userEmail AND " +
                     "r.isActive = true AND " +
                     "r.deletedBy IS NULL")
       Optional<ProductReview> findByProductIdAndUserEmail(
                     @Param("productId") Long productId,
                     @Param("userEmail") String userEmail);
}
