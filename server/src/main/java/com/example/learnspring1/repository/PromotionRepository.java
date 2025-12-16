package com.example.learnspring1.repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.example.learnspring1.domain.Promotion;

public interface PromotionRepository extends JpaRepository<Promotion, Long>, JpaSpecificationExecutor<Promotion> {
    List<Promotion> findByIsActiveTrue();
    
    Optional<Promotion> findBySlug(String slug);

    @Query("SELECT p FROM Promotion p WHERE p.isActive = true " +
           "AND (p.startDate IS NULL OR p.startDate <= :now) " +
           "AND (p.endDate IS NULL OR p.endDate >= :now)")
    List<Promotion> findActiveAndValidPromotions(@Param("now") Instant now);

    @Query("SELECT p FROM Promotion p WHERE " +
           "(:id IS NULL OR p.id = :id) AND " +
           "(:name IS NULL OR p.name LIKE %:name%) AND " +
           "(:isActive IS NULL OR p.isActive = :isActive) AND " +
           "(:search IS NULL OR p.name LIKE %:search% OR p.description LIKE %:search% OR CAST(p.id AS string) LIKE %:search%) AND " +
           "(p.deletedBy IS NULL)")
    Page<Promotion> findPromotionsWithFilters(@Param("id") Long id,
                                              @Param("name") String name,
                                              @Param("isActive") Boolean isActive,
                                              @Param("search") String search,
                                              Pageable pageable);
}

