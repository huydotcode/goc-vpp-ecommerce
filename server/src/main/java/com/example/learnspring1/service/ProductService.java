package com.example.learnspring1.service;

import com.example.learnspring1.domain.Product;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;

import java.util.List;
import java.util.Optional;

public interface ProductService {
    Product createProduct(Product product);

    Page<Product> getProductsPage(Pageable pageable, Specification<Product> spec);

    Page<Product> getProductsPage(Pageable pageable);

    Page<Product> getProductsPageWithFilters(Pageable pageable,
            Long id,
            String name,
            String sku,
            String brand,
            Long categoryId,
            Boolean isFeatured,
            Boolean isActive,
            String search);

    List<Product> getProductsWithFilters(String name, String sku, String brand, Long categoryId, Boolean isFeatured,
            Boolean isActive);

    Optional<Product> getProductById(Long id);

    Optional<Product> getProductByIdWithImages(Long id);

    Optional<Product> getProductBySku(String sku);

    Product updateProduct(Long id, Product product);

    void deleteProduct(Long id);

    /**
     * Lấy danh sách sản phẩm bán chạy / nổi bật dựa trên tổng số lượng OrderItem
     * trong 90 ngày gần nhất với trạng thái đơn hàng COMPLETED.
     */
    Page<Product> getBestSellers(Pageable pageable);
}
