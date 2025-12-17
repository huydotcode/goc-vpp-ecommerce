package com.example.learnspring1.service;

import com.example.learnspring1.domain.Product;
import com.example.learnspring1.domain.dto.ProductResponseDTO;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;

import java.math.BigDecimal;
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
                        BigDecimal minPrice,
                        BigDecimal maxPrice,
                        String search);

        List<Product> getProductsWithFilters(String name, String sku, String brand, Long categoryId, Boolean isFeatured,
                        Boolean isActive);

        Optional<Product> getProductById(Long id);

        Optional<ProductResponseDTO> getProductByIdWithImagesAndSoldCount(Long id);

        Optional<Product> getProductBySku(String sku);

        Product updateProduct(Long id, Product product);

        void deleteProduct(Long id);

        /**
         * Lấy danh sách sản phẩm bán chạy / nổi bật dựa trên tổng số lượng OrderItem
         * trong 90 ngày gần nhất với trạng thái đơn hàng COMPLETED.
         */
        Page<Product> getBestSellers(Pageable pageable);

        /**
         * Gợi ý sản phẩm cho người dùng (ưu tiên nổi bật + phù hợp truy vấn).
         */
        List<Product> suggestProducts(String query, Long categoryId, int limit);

        /**
         * Gợi ý sản phẩm bằng vector search (Gemini embedding + ChromaDB).
         */
        List<Product> suggestProductsByVector(String query, Long categoryId, int limit);

        /**
         * Gợi ý sản phẩm dựa trên lịch sử click/view của người dùng.
         * Tính vector trung bình từ các sản phẩm đã xem và query ChromaDB.
         */
        List<Product> suggestProductsByUserHistory(List<Long> viewedProductIds, Long categoryId, int limit);
}
