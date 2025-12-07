package com.example.learnspring1.service;

import com.example.learnspring1.domain.ProductVariant;
import com.example.learnspring1.domain.VariantType;
import com.example.learnspring1.domain.dto.ProductVariantDTO;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Optional;

public interface ProductVariantService {
    ProductVariant createVariant(ProductVariant variant);

    ProductVariantDTO createVariantDTO(ProductVariantDTO variantDTO);

    Page<ProductVariant> getVariantsPage(Pageable pageable, Long productId, VariantType variantType, Boolean isActive);

    List<ProductVariant> getVariantsByProductId(Long productId);

    List<ProductVariant> getActiveVariantsByProductId(Long productId);

    List<ProductVariant> getVariantsByProductIdAndType(Long productId, VariantType variantType);

    Optional<ProductVariant> getVariantById(Long id);

    Optional<ProductVariant> getVariantBySku(String sku);

    ProductVariant updateVariant(Long id, ProductVariant variant);

    ProductVariantDTO updateVariantDTO(Long id, ProductVariantDTO variantDTO);

    void deleteVariant(Long id);

    ProductVariantDTO convertToDTO(ProductVariant variant);

    ProductVariant convertToEntity(ProductVariantDTO dto);
}

