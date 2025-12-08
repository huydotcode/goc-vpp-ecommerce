package com.example.learnspring1.domain;

import java.time.Instant;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "user_addresses")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserAddress {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "is_default", nullable = false)
    @Builder.Default
    private Boolean isDefault = false;

    @Column(name = "phone", length = 20)
    private String phone;

    @Column(name = "province_code", length = 10)
    private String provinceCode;

    @Column(name = "province_name", length = 100)
    private String provinceName;

    @Column(name = "district_code", length = 10)
    private String districtCode;

    @Column(name = "district_name", length = 100)
    private String districtName;

    @Column(name = "ward_code", length = 10)
    private String wardCode;

    @Column(name = "ward_name", length = 100)
    private String wardName;

    @Column(name = "street", length = 255)
    private String street;

    @Column(name = "full_address", length = 500)
    private String fullAddress;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at")
    @Builder.Default
    private Instant updatedAt = Instant.now();

    @PrePersist
    protected void onCreate() {
        createdAt = Instant.now();
        updatedAt = Instant.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = Instant.now();
    }
}
