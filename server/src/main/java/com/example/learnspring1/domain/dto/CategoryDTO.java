package com.example.learnspring1.domain.dto;

import java.time.Instant;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CategoryDTO {
    private Long id;
    private String name;
    private String thumbnailUrl;
    private String description;
    private Boolean isActive;

    // Parent info
    private Long parentId;
    private String parentName;

    // Children (optional, only when fetching nested structure)
    private List<CategoryDTO> children;

    // Sort order
    private Integer sortOrder;

    private Instant createdAt;
    private Instant updatedAt;
    private String createdBy;
    private String updatedBy;
    private String deletedBy;
}
