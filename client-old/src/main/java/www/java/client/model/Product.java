package www.java.client.model;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

import lombok.Data;

@Data
public class Product {
    private Long id;
    private String name;
    private String description;
    private BigDecimal price;
    private BigDecimal discountPrice;
    private Integer stockQuantity;
    private String sku;
    private String brand;
    private String color;
    private String size;
    private String weight;
    private String dimensions;
    private String specifications;
    private String thumbnailUrl;
    private List<Category> categories;
    private Boolean isActive;
    private Boolean isFeatured;
    private Instant createdAt;
    private Instant updatedAt;
    private String createdBy;
    private String updatedBy;
    private String deletedBy;
}


