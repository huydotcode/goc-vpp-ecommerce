package com.example.learnspring1.domain;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Entity
@Table(name = "categories")
@EntityListeners(org.springframework.data.jpa.domain.support.AuditingEntityListener.class)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Category {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "name is required")
    @Column(nullable = false, length = 100)
    private String name;

    @Column(nullable = true)
    private String thumbnailUrl;

    @Column(columnDefinition = "MEDIUMTEXT")
    private String description;

    @Builder.Default
    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    // Parent relationship
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_id", nullable = true)
    private Category parent;

    // Children relationship
    @OneToMany(mappedBy = "parent", cascade = CascadeType.ALL, orphanRemoval = false)
    @Builder.Default
    private List<Category> children = new ArrayList<>();

    // Sort order for children
    @Column(name = "sort_order", nullable = true)
    private Integer sortOrder;

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
}
