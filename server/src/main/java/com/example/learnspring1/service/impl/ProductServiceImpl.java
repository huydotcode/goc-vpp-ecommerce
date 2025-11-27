package com.example.learnspring1.service.impl;

import com.example.learnspring1.domain.Product;
import com.example.learnspring1.repository.ProductRepository;
import com.example.learnspring1.service.ProductService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class ProductServiceImpl implements ProductService {

    private final ProductRepository productRepository;

    public ProductServiceImpl(ProductRepository productRepository) {
        this.productRepository = productRepository;
    }

    @Override
    public Product createProduct(Product product) {
        if (product.getSku() != null && productRepository.existsBySku(product.getSku())) {
            throw new IllegalArgumentException("SKU đã tồn tại");
        }
        return productRepository.save(product);
    }

    @Override
    public Page<Product> getProductsPage(Pageable pageable, Specification<Product> spec) {
        return productRepository.findAll(spec, pageable);
    }

    @Override
    public Page<Product> getProductsPage(Pageable pageable) {
        return productRepository.findByIsActiveTrue(pageable);
    }

    @Override
    public Page<Product> getProductsPageWithFilters(Pageable pageable,
                                                    Long id,
                                                    String name,
                                                    String sku,
                                                    String brand,
                                                    Long categoryId,
                                                    Boolean isFeatured,
                                                    Boolean isActive,
                                                    String search) {
        if (id != null) {
            return productRepository.findProductsByIdOnly(String.valueOf(id), pageable);
        }
        return productRepository.findProductsWithFiltersPaged(name, sku, brand, categoryId, isFeatured, isActive, search, pageable);
    }

    @Override
    public List<Product> getProductsWithFilters(String name, String sku, String brand, Long categoryId, Boolean isFeatured, Boolean isActive) {
        return productRepository.findProductsWithFilters(name, sku, brand, categoryId, isFeatured, isActive);
    }

    @Override
    public Optional<Product> getProductById(Long id) {
        return productRepository.findById(id);
    }

    @Override
    public Optional<Product> getProductByIdWithImages(Long id) {
        return productRepository.findByIdWithImages(id);
    }

    @Override
    public Optional<Product> getProductBySku(String sku) {
        return productRepository.findBySku(sku);
    }

    @Override
    public Product updateProduct(Long id, Product product) {
        return productRepository.findById(id).map(existing -> {
            existing.setName(product.getName());
            existing.setDescription(product.getDescription());
            existing.setPrice(product.getPrice());
            existing.setDiscountPrice(product.getDiscountPrice());
            existing.setStockQuantity(product.getStockQuantity());
            existing.setSku(product.getSku());
            existing.setBrand(product.getBrand());
            existing.setColor(product.getColor());
            existing.setSize(product.getSize());
            existing.setWeight(product.getWeight());
            existing.setDimensions(product.getDimensions());
            existing.setSpecifications(product.getSpecifications());
            existing.setThumbnailUrl(product.getThumbnailUrl());
            if (product.getCategories() != null) {
                existing.setCategories(product.getCategories());
            }
            existing.setIsActive(product.getIsActive());
            existing.setIsFeatured(product.getIsFeatured());
            return productRepository.save(existing);
        }).orElseThrow(() -> new RuntimeException("Product not found with id " + id));
    }

    @Override
    public void deleteProduct(Long id) {
        Product product = productRepository.findById(id)
            .orElseThrow(() -> new java.util.NoSuchElementException("Product not found with id " + id));
        product.softDelete();
        productRepository.save(product);
    }
}


