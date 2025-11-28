
package com.example.learnspring1.domain;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import jakarta.persistence.EntityListeners;
import jakarta.persistence.Enumerated;
import jakarta.persistence.EnumType;


@Entity
@Table(name = "users")
@EntityListeners(org.springframework.data.jpa.domain.support.AuditingEntityListener.class)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "username is required")
    @Column(nullable = false, length = 50, unique = true)
    private String username;

    @NotBlank(message = "email is required")
    @Column(nullable = false, length = 120, unique = true)
    @Email(message = "email should be valid")
    private String email;

    @NotBlank(message = "password is required", groups = {CreateValidation.class})
    @Column(nullable = true)  // Nullable for OAuth2 users
    private String password;

    @Column(nullable = true)
    private String avatarUrl;

    // OAuth2 fields
    @Column(name = "provider", length = 50)
    private String provider;  // "LOCAL", "GOOGLE", etc.

    @Column(name = "provider_id", length = 255)
    private String providerId;  // ID from OAuth2 provider

    @Builder.Default
    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    @Enumerated(EnumType.STRING)
    @Column(name = "role", nullable = false)
    @Builder.Default
    private Role role = Role.USER;

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