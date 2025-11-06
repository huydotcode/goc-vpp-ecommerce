package com.example.learnspring1.service.impl;

import com.example.learnspring1.domain.ProductImage;
import com.example.learnspring1.repository.ProductImageRepository;
import com.example.learnspring1.service.ProductImageService;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class ProductImageServiceImpl implements ProductImageService {

    private final ProductImageRepository productImageRepository;

    public ProductImageServiceImpl(ProductImageRepository productImageRepository) {
        this.productImageRepository = productImageRepository;
    }

    @Override
    public ProductImage create(ProductImage image) {
        return productImageRepository.save(image);
    }

    @Override
    public Optional<ProductImage> getById(Long id) {
        return productImageRepository.findById(id);
    }

    @Override
    public ProductImage update(Long id, ProductImage image) {
        return productImageRepository.findById(id).map(existing -> {
            existing.setImageUrl(image.getImageUrl());
            existing.setSortOrder(image.getSortOrder());
            existing.setIsPrimary(image.getIsPrimary() != null ? image.getIsPrimary() : existing.getIsPrimary());
            if (image.getProduct() != null) {
                existing.setProduct(image.getProduct());
            }
            return productImageRepository.save(existing);
        }).orElseThrow(() -> new RuntimeException("ProductImage not found with id " + id));
    }

    @Override
    public void delete(Long id) {
        ProductImage image = productImageRepository.findById(id)
            .orElseThrow(() -> new java.util.NoSuchElementException("ProductImage not found with id " + id));
        image.softDelete();
        productImageRepository.save(image);
    }

    @Override
    public java.util.List<ProductImage> getByProductId(Long productId) {
        return productImageRepository.findByProduct_IdAndDeletedByIsNullOrderBySortOrderAsc(productId);
    }
}


