package com.example.learnspring1.domain.dto;

import com.example.learnspring1.domain.Category;
import com.example.learnspring1.domain.Product;
import com.example.learnspring1.domain.ProductImage;
import com.example.learnspring1.domain.ProductVariant;
import java.math.BigDecimal;
import java.util.List;

public record ProductResponseDTO(
        Long id,
        String name,
        String description,
        BigDecimal price,
        BigDecimal discountPrice,
        String sku,
        String brand,
        String color,
        String size,
        String weight,
        String dimensions,
        String specifications,
        String thumbnailUrl,
        List<ProductImage> images,
        List<ProductVariant> variants,
        List<Category> categories,
        Boolean isActive,
        Boolean isFeatured,
        Integer totalStockQuantity,
        Boolean hasStock,
        long soldCount) {
    public ProductResponseDTO(Product product, long soldCount) {
        this(
                product.getId(),
                product.getName(),
                product.getDescription(),
                product.getPrice(),
                product.getDiscountPrice(),
                product.getSku(),
                product.getBrand(),
                product.getColor(),
                product.getSize(),
                product.getWeight(),
                product.getDimensions(),
                product.getSpecifications(),
                product.getThumbnailUrl(),
                product.getImages(),
                product.getVariants(),
                product.getCategories(),
                product.getIsActive(),
                product.getIsFeatured(),
                product.getTotalStockQuantity(),
                product.getHasStock(),
                soldCount);
    }
}