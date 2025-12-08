package com.example.learnspring1.service.impl;

import com.example.learnspring1.domain.Category;
import com.example.learnspring1.domain.Order;
import com.example.learnspring1.domain.Product;
import com.example.learnspring1.domain.ProductVariant;
import com.example.learnspring1.domain.VariantType;
import com.example.learnspring1.repository.CategoryRepository;
import com.example.learnspring1.repository.OrderItemRepository;
import com.example.learnspring1.repository.ProductRepository;
import com.example.learnspring1.repository.ProductVariantRepository;
import com.example.learnspring1.service.CategoryService;
import com.example.learnspring1.service.ProductService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
public class ProductServiceImpl implements ProductService {

    private final ProductRepository productRepository;
    private final OrderItemRepository orderItemRepository;
    private final CategoryService categoryService;
    private final CategoryRepository categoryRepository;
    private final ProductVariantRepository productVariantRepository;

    public ProductServiceImpl(ProductRepository productRepository,
            OrderItemRepository orderItemRepository,
            CategoryService categoryService,
            CategoryRepository categoryRepository,
            ProductVariantRepository productVariantRepository) {
        this.productRepository = productRepository;
        this.orderItemRepository = orderItemRepository;
        this.categoryService = categoryService;
        this.categoryRepository = categoryRepository;
        this.productVariantRepository = productVariantRepository;
    }

    private void ensureDefaultVariant(Product product) {
        List<ProductVariant> variants = productVariantRepository.findByProductId(product.getId());
        if (variants != null && !variants.isEmpty()) {
            return;
        }

        ProductVariant defaultVariant = ProductVariant.builder()
                .product(product)
                .variantType(VariantType.OTHER)
                .variantValue("Default")
                .colorCode(null)
                .imageUrl(product.getThumbnailUrl())
                .price(product.getDiscountPrice() != null ? product.getDiscountPrice() : product.getPrice())
                .stockQuantity(product.getStockQuantity() != null ? product.getStockQuantity() : 0)
                .sku(product.getSku() != null ? product.getSku() : ("SKU-" + product.getId()))
                .sortOrder(0)
                .isActive(true)
                .isDefault(true)
                .build();

        productVariantRepository.save(defaultVariant);
    }

    private void syncDefaultVariant(Product product) {
        List<ProductVariant> variants = productVariantRepository.findByProductId(product.getId());
        if (variants == null || variants.isEmpty()) {
            ensureDefaultVariant(product);
            return;
        }

        // Nếu chỉ có default variant hoặc tất cả là default, sync giá/tồn cho default
        variants.stream()
                .filter(v -> Boolean.TRUE.equals(v.getIsDefault()))
                .findFirst()
                .ifPresent(v -> {
                    v.setPrice(product.getDiscountPrice() != null ? product.getDiscountPrice() : product.getPrice());
                    v.setStockQuantity(
                            product.getStockQuantity() != null ? product.getStockQuantity() : v.getStockQuantity());
                    if (product.getThumbnailUrl() != null) {
                        v.setImageUrl(product.getThumbnailUrl());
                    }
                    if (product.getSku() != null) {
                        v.setSku(product.getSku());
                    }
                    productVariantRepository.save(v);
                });
    }

    @Override
    public Product createProduct(Product product) {
        if (product.getSku() != null && productRepository.existsBySku(product.getSku())) {
            throw new IllegalArgumentException("SKU đã tồn tại");
        }

        // Xử lý categories từ categoryIds hoặc categories
        if (product.getCategoryIds() != null && !product.getCategoryIds().isEmpty()) {
            // Load categories từ categoryIds
            List<Category> categories = categoryRepository.findAllById(product.getCategoryIds());
            product.setCategories(categories);
        }

        Product saved = productRepository.save(product);

        // Tạo default variant nếu sản phẩm chưa có biến thể
        ensureDefaultVariant(saved);

        return saved;
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

        // Get all descendant category IDs if categoryId is provided
        List<Long> categoryIds = new ArrayList<>();
        if (categoryId != null) {
            categoryIds = categoryService.getAllDescendantIds(categoryId);
        }

        return productRepository.findProductsWithFiltersPaged(
                name, sku, brand, categoryId, categoryIds, isFeatured, isActive, search, pageable);
    }

    @Override
    public List<Product> getProductsWithFilters(String name, String sku, String brand, Long categoryId,
            Boolean isFeatured, Boolean isActive) {
        // Get all descendant category IDs if categoryId is provided
        List<Long> categoryIds = new ArrayList<>();
        if (categoryId != null) {
            categoryIds = categoryService.getAllDescendantIds(categoryId);
        }

        return productRepository.findProductsWithFilters(
                name, sku, brand, categoryId, categoryIds, isFeatured, isActive);
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
            existing.setSku(product.getSku());
            existing.setBrand(product.getBrand());
            existing.setColor(product.getColor());
            existing.setSize(product.getSize());
            existing.setWeight(product.getWeight());
            existing.setDimensions(product.getDimensions());
            existing.setSpecifications(product.getSpecifications());
            existing.setThumbnailUrl(product.getThumbnailUrl());

            // Xử lý categories từ categoryIds hoặc categories
            if (product.getCategoryIds() != null && !product.getCategoryIds().isEmpty()) {
                // Load categories từ categoryIds
                List<Category> categories = categoryRepository.findAllById(product.getCategoryIds());
                existing.setCategories(categories);
            } else if (product.getCategories() != null) {
                // Nếu có categories trực tiếp thì dùng
                existing.setCategories(product.getCategories());
            }

            existing.setIsActive(product.getIsActive());
            existing.setIsFeatured(product.getIsFeatured());
            Product updated = productRepository.save(existing);

            // Đồng bộ default variant khi sản phẩm không có biến thể tùy chọn
            syncDefaultVariant(updated);

            return updated;
        }).orElseThrow(() -> new RuntimeException("Product not found with id " + id));
    }

    @Override
    public void deleteProduct(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new java.util.NoSuchElementException("Product not found with id " + id));
        product.softDelete();
        productRepository.save(product);
    }

    @Override
    public Page<Product> getBestSellers(Pageable pageable) {
        // Best seller: dựa trên tổng quantity của OrderItem trong 90 ngày gần nhất
        // và chỉ tính các đơn hàng COMPLETED.
        Instant fromDate = Instant.now().minus(90, ChronoUnit.DAYS);
        return orderItemRepository.findBestSellers(Order.OrderStatus.COMPLETED, fromDate, pageable);
    }
}
