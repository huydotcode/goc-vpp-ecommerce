package com.example.learnspring1.repository;

import com.example.learnspring1.domain.ProductVariant;
import com.example.learnspring1.domain.VariantType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProductVariantRepository extends JpaRepository<ProductVariant, Long> {

    List<ProductVariant> findByProductId(Long productId);

    List<ProductVariant> findByProductIdAndIsActiveTrue(Long productId);

    List<ProductVariant> findByProductIdAndVariantType(Long productId, VariantType variantType);

    Optional<ProductVariant> findBySku(String sku);

    boolean existsBySku(String sku);

    @Query("SELECT v FROM ProductVariant v WHERE " +
           "(:productId IS NULL OR v.product.id = :productId) AND " +
           "(:variantType IS NULL OR v.variantType = :variantType) AND " +
           "(:isActive IS NULL OR v.isActive = :isActive) AND " +
           "(v.deletedBy IS NULL)")
    Page<ProductVariant> findVariantsWithFilters(
        @Param("productId") Long productId,
        @Param("variantType") VariantType variantType,
        @Param("isActive") Boolean isActive,
        Pageable pageable
    );
}

