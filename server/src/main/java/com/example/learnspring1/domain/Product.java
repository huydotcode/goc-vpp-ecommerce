package com.example.learnspring1.domain;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import com.fasterxml.jackson.annotation.JsonProperty;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Entity
@Table(name = "products")
@EntityListeners(org.springframework.data.jpa.domain.support.AuditingEntityListener.class)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Product {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "name is required")
    @Column(nullable = false, length = 200)
    private String name;

    @Column(columnDefinition = "MEDIUMTEXT")
    private String description;

    @Column(precision = 19, scale = 4)
    private BigDecimal price;

    @Column(precision = 19, scale = 4)
    private BigDecimal discountPrice;

    @Column(length = 100, unique = true)
    private String sku;

    @Column(length = 150)
    private String brand;

    @Column(length = 100)
    private String color;

    @Column(length = 50)
    private String size;

    @Column(length = 50)
    private String weight;

    @Column(length = 100)
    private String dimensions;

    @Column(columnDefinition = "MEDIUMTEXT")
    private String specifications;

    private String thumbnailUrl;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(name = "product_categories", joinColumns = @JoinColumn(name = "product_id"), inverseJoinColumns = @JoinColumn(name = "category_id"))
    @JsonIgnoreProperties(value = { "parent", "children", "hibernateLazyInitializer", "handler" })
    @Builder.Default
    private List<Category> categories = new ArrayList<>();

    @Transient
    @JsonProperty("categoryIds")
    private List<Long> categoryIds;

    @Builder.Default
    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    @Builder.Default
    @Column(name = "is_featured", nullable = false)
    private Boolean isFeatured = false;

    @Builder.Default
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @Builder.Default
    @Column(name = "updated_at")
    private Instant updatedAt = Instant.now();

    @Column(name = "created_by", length = 100, updatable = false)
    private String createdBy;

    @Column(name = "updated_by", length = 100)
    private String updatedBy;

    @Column(name = "deleted_by", length = 100)
    private String deletedBy;

    @OneToMany(mappedBy = "product", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonManagedReference
    @Builder.Default
    private List<ProductImage> images = new ArrayList<>();

    @OneToMany(mappedBy = "product", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonManagedReference
    @Builder.Default
    private List<ProductVariant> variants = new ArrayList<>();

    @PrePersist
    public void prePersist() {
        String user = com.example.learnspring1.utils.SecurityUtil.getCurrentUserLogin().orElse("system");
        this.createdBy = user;
        this.createdAt = Instant.now();
        this.updatedAt = Instant.now();
    }

    @PreUpdate
    public void preUpdate() {
        String user = com.example.learnspring1.utils.SecurityUtil.getCurrentUserLogin().orElse("system");
        this.updatedBy = user;
        this.updatedAt = Instant.now();
    }

    public void softDelete() {
        String user = com.example.learnspring1.utils.SecurityUtil.getCurrentUserLogin().orElse("system");
        this.deletedBy = user;
        this.isActive = false;
    }

    /**
     * Tính tổng stock từ tất cả variants active của sản phẩm
     */
    @Transient
    @JsonProperty("totalStockQuantity")
    public Integer getTotalStockQuantity() {
        if (variants == null || variants.isEmpty()) {
            return 0;
        }
        return variants.stream()
                .filter(v -> Boolean.TRUE.equals(v.getIsActive()) && v.getDeletedBy() == null)
                .mapToInt(v -> v.getStockQuantity() != null ? v.getStockQuantity() : 0)
                .sum();
    }

    /**
     * Kiểm tra sản phẩm có còn hàng không (có ít nhất 1 variant có stock > 0)
     */
    @Transient
    @JsonProperty("hasStock")
    public Boolean getHasStock() {
        if (variants == null || variants.isEmpty()) {
            return false;
        }
        return variants.stream()
                .filter(v -> Boolean.TRUE.equals(v.getIsActive()) && v.getDeletedBy() == null)
                .anyMatch(v -> v.getStockQuantity() != null && v.getStockQuantity() > 0);
    }
}
