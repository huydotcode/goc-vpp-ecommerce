package com.example.learnspring1.repository;

import com.example.learnspring1.domain.Product;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long>, JpaSpecificationExecutor<Product> {

       Optional<Product> findBySku(String sku);

       boolean existsBySku(String sku);

       List<Product> findByIsActiveTrue();

       Page<Product> findByIsActiveTrue(Pageable pageable);

       @Query("SELECT DISTINCT p FROM Product p LEFT JOIN p.categories c WHERE " +
                     "(:name IS NULL OR p.name LIKE %:name%) AND " +
                     "(:sku IS NULL OR p.sku LIKE %:sku%) AND " +
                     "(:brand IS NULL OR p.brand LIKE %:brand%) AND " +
                     "(:categoryId IS NULL OR c.id IN :categoryIds) AND " +
                     "(:isFeatured IS NULL OR p.isFeatured = :isFeatured) AND " +
                     "(:isActive IS NULL OR p.isActive = :isActive) AND " +
                     "(p.deletedBy IS NULL)")
       List<Product> findProductsWithFilters(@Param("name") String name,
                     @Param("sku") String sku,
                     @Param("brand") String brand,
                     @Param("categoryId") Long categoryId,
                     @Param("categoryIds") List<Long> categoryIds,
                     @Param("isFeatured") Boolean isFeatured,
                     @Param("isActive") Boolean isActive);

       @Query("SELECT DISTINCT p FROM Product p LEFT JOIN p.categories c WHERE " +
                     "(:name IS NULL OR p.name LIKE %:name%) AND " +
                     "(:sku IS NULL OR p.sku LIKE %:sku%) AND " +
                     "(:brand IS NULL OR p.brand LIKE %:brand%) AND " +
                     "(:categoryId IS NULL OR c.id IN :categoryIds) AND " +
                     "(:isFeatured IS NULL OR p.isFeatured = :isFeatured) AND " +
                     "(:isActive IS NULL OR p.isActive = :isActive) AND " +
                     "(:minPrice IS NULL OR p.price >= :minPrice) AND " +
                     "(:maxPrice IS NULL OR p.price <= :maxPrice) AND " +
                     "(:search IS NULL OR p.name LIKE %:search% OR p.sku LIKE %:search% OR p.brand LIKE %:search% OR CAST(p.id AS string) LIKE %:search%) AND "
                     +
                     "(p.deletedBy IS NULL)")
       Page<Product> findProductsWithFiltersPaged(@Param("name") String name,
                     @Param("sku") String sku,
                     @Param("brand") String brand,
                     @Param("categoryId") Long categoryId,
                     @Param("categoryIds") List<Long> categoryIds,
                     @Param("isFeatured") Boolean isFeatured,
                     @Param("isActive") Boolean isActive,
                     @Param("minPrice") BigDecimal minPrice,
                     @Param("maxPrice") BigDecimal maxPrice,
                     @Param("search") String search,
                     Pageable pageable);

       @Query("SELECT p FROM Product p WHERE " +
                     "CAST(p.id AS string) LIKE %:id% AND " +
                     "(p.deletedBy IS NULL)")
       Page<Product> findProductsByIdOnly(@Param("id") String id, Pageable pageable);

       @Query("SELECT p FROM Product p LEFT JOIN FETCH p.images WHERE p.id = :id")
       Optional<Product> findByIdWithImages(@Param("id") Long id);
}
