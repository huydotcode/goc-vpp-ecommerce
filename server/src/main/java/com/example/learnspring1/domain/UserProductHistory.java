package com.example.learnspring1.domain;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(name = "user_product_history", 
       uniqueConstraints = @UniqueConstraint(columnNames = { "user_id", "product_id" }),
       indexes = {
           @Index(name = "idx_user_product_history_user_id", columnList = "user_id"),
           @Index(name = "idx_user_product_history_product_id", columnList = "product_id"),
           @Index(name = "idx_user_product_history_viewed_at", columnList = "viewed_at")
       })
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserProductHistory {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false, length = 100)
    private String userId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Column(name = "viewed_at", nullable = false)
    private Instant viewedAt;

    @Builder.Default
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @Builder.Default
    @Column(name = "updated_at")
    private Instant updatedAt = Instant.now();

    @PrePersist
    public void prePersist() {
        this.viewedAt = Instant.now();
        this.createdAt = Instant.now();
        this.updatedAt = Instant.now();
    }

    @PreUpdate
    public void preUpdate() {
        this.viewedAt = Instant.now();
        this.updatedAt = Instant.now();
    }
}

