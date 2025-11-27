package com.example.learnspring1.service;

import com.example.learnspring1.domain.ProductImage;

import java.util.Optional;

public interface ProductImageService {
    ProductImage create(ProductImage image);

    Optional<ProductImage> getById(Long id);

    ProductImage update(Long id, ProductImage image);

    void delete(Long id);

    java.util.List<ProductImage> getByProductId(Long productId);
}


