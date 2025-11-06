package www.java.client.model;

import java.time.Instant;

import lombok.Data;

@Data
public class ProductImage {
    private Long id;
    private String imageUrl;
    private Integer sortOrder;
    private Boolean isPrimary;
    private Product product;
    private Instant createdAt;
    private Instant updatedAt;
    private String createdBy;
    private String updatedBy;
    private String deletedBy;
}


