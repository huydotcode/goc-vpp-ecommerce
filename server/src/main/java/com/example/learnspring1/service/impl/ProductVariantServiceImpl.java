package com.example.learnspring1.service.impl;

import com.example.learnspring1.domain.Product;
import com.example.learnspring1.domain.ProductVariant;
import com.example.learnspring1.domain.VariantType;
import com.example.learnspring1.domain.dto.ProductVariantDTO;
import com.example.learnspring1.repository.ProductRepository;
import com.example.learnspring1.repository.ProductVariantRepository;
import com.example.learnspring1.service.ProductVariantService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class ProductVariantServiceImpl implements ProductVariantService {

    private final ProductVariantRepository variantRepository;
    private final ProductRepository productRepository;

    public ProductVariantServiceImpl(ProductVariantRepository variantRepository,
                                     ProductRepository productRepository) {
        this.variantRepository = variantRepository;
        this.productRepository = productRepository;
    }

    @Override
    @Transactional
    public ProductVariant createVariant(ProductVariant variant) {
        if (variant.getSku() != null && variantRepository.existsBySku(variant.getSku())) {
            throw new IllegalArgumentException("SKU variant đã tồn tại");
        }
        return variantRepository.save(variant);
    }

    @Override
    @Transactional
    public ProductVariantDTO createVariantDTO(ProductVariantDTO variantDTO) {
        Product product = productRepository.findById(variantDTO.getProductId())
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy sản phẩm với ID: " + variantDTO.getProductId()));

        ProductVariant variant = convertToEntity(variantDTO);
        variant.setProduct(product);

        ProductVariant saved = createVariant(variant);
        return convertToDTO(saved);
    }

    @Override
    public Page<ProductVariant> getVariantsPage(Pageable pageable, Long productId, VariantType variantType, Boolean isActive) {
        return variantRepository.findVariantsWithFilters(productId, variantType, isActive, pageable);
    }

    @Override
    public List<ProductVariant> getVariantsByProductId(Long productId) {
        return variantRepository.findByProductId(productId);
    }

    @Override
    public List<ProductVariant> getActiveVariantsByProductId(Long productId) {
        return variantRepository.findByProductIdAndIsActiveTrue(productId);
    }

    @Override
    public List<ProductVariant> getVariantsByProductIdAndType(Long productId, VariantType variantType) {
        return variantRepository.findByProductIdAndVariantType(productId, variantType);
    }

    @Override
    public Optional<ProductVariant> getVariantById(Long id) {
        return variantRepository.findById(id);
    }

    @Override
    public Optional<ProductVariant> getVariantBySku(String sku) {
        return variantRepository.findBySku(sku);
    }

    @Override
    @Transactional
    public ProductVariant updateVariant(Long id, ProductVariant variant) {
        ProductVariant existing = variantRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy variant với ID: " + id));

        if (variant.getSku() != null && !variant.getSku().equals(existing.getSku()) 
            && variantRepository.existsBySku(variant.getSku())) {
            throw new IllegalArgumentException("SKU variant đã tồn tại");
        }

        existing.setVariantType(variant.getVariantType());
        existing.setVariantValue(variant.getVariantValue());
        existing.setColorCode(variant.getColorCode());
        existing.setImageUrl(variant.getImageUrl());
        existing.setPrice(variant.getPrice());
        existing.setStockQuantity(variant.getStockQuantity());
        existing.setSku(variant.getSku());
        existing.setSortOrder(variant.getSortOrder());
        existing.setIsActive(variant.getIsActive());

        return variantRepository.save(existing);
    }

    @Override
    @Transactional
    public ProductVariantDTO updateVariantDTO(Long id, ProductVariantDTO variantDTO) {
        ProductVariant existing = variantRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy variant với ID: " + id));

        if (variantDTO.getProductId() != null && !variantDTO.getProductId().equals(existing.getProduct().getId())) {
            Product product = productRepository.findById(variantDTO.getProductId())
                    .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy sản phẩm với ID: " + variantDTO.getProductId()));
            existing.setProduct(product);
        }

        existing.setVariantType(variantDTO.getVariantType());
        existing.setVariantValue(variantDTO.getVariantValue());
        existing.setColorCode(variantDTO.getColorCode());
        existing.setImageUrl(variantDTO.getImageUrl());
        existing.setPrice(variantDTO.getPrice());
        existing.setStockQuantity(variantDTO.getStockQuantity());
        existing.setSku(variantDTO.getSku());
        existing.setSortOrder(variantDTO.getSortOrder());
        existing.setIsActive(variantDTO.getIsActive());

        ProductVariant saved = variantRepository.save(existing);
        return convertToDTO(saved);
    }

    @Override
    @Transactional
    public void deleteVariant(Long id) {
        ProductVariant variant = variantRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy variant với ID: " + id));
        variant.softDelete();
        variantRepository.save(variant);
    }

    @Override
    public ProductVariantDTO convertToDTO(ProductVariant variant) {
        return ProductVariantDTO.builder()
                .id(variant.getId())
                .productId(variant.getProduct() != null ? variant.getProduct().getId() : null)
                .productName(variant.getProduct() != null ? variant.getProduct().getName() : null)
                .variantType(variant.getVariantType())
                .variantValue(variant.getVariantValue())
                .colorCode(variant.getColorCode())
                .imageUrl(variant.getImageUrl())
                .price(variant.getPrice())
                .stockQuantity(variant.getStockQuantity())
                .sku(variant.getSku())
                .sortOrder(variant.getSortOrder())
                .isActive(variant.getIsActive())
                .createdAt(variant.getCreatedAt())
                .updatedAt(variant.getUpdatedAt())
                .createdBy(variant.getCreatedBy())
                .updatedBy(variant.getUpdatedBy())
                .deletedBy(variant.getDeletedBy())
                .build();
    }

    @Override
    public ProductVariant convertToEntity(ProductVariantDTO dto) {
        return ProductVariant.builder()
                .id(dto.getId())
                .variantType(dto.getVariantType())
                .variantValue(dto.getVariantValue())
                .colorCode(dto.getColorCode())
                .imageUrl(dto.getImageUrl())
                .price(dto.getPrice())
                .stockQuantity(dto.getStockQuantity())
                .sku(dto.getSku())
                .sortOrder(dto.getSortOrder())
                .isActive(dto.getIsActive() != null ? dto.getIsActive() : true)
                .build();
    }
}

