package com.example.learnspring1.domain;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonManagedReference;

import lombok.*;

@Entity
@Table(name = "orders")
@EntityListeners(org.springframework.data.jpa.domain.support.AuditingEntityListener.class)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Order {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 50)
    private String orderCode;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = true)
    private User user;

    @Column(nullable = false, precision = 19, scale = 4)
    private BigDecimal totalAmount;

    @Column(name = "discount_amount", precision = 19, scale = 4)
    private BigDecimal discountAmount;

    @Column(name = "final_amount", precision = 19, scale = 4)
    private BigDecimal finalAmount;

    @Builder.Default
    @Column(name = "shipping_fee", precision = 19, scale = 4)
    private BigDecimal shippingFee = BigDecimal.ZERO;

    @Column(name = "applied_promotions", columnDefinition = "TEXT")
    private String appliedPromotions; // JSON string storing list of applied promotions

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private PaymentMethod paymentMethod;

    @Column(length = 100)
    private String paymentLinkId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private OrderStatus status;

    @Column(length = 500)
    private String description;

    @Column(length = 200)
    private String customerName;

    @Column(length = 100)
    private String customerEmail;

    @Column(length = 20)
    private String customerPhone;

    @Column(name = "customer_address", length = 500)
    private String customerAddress;

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonManagedReference
    @Builder.Default
    private List<OrderItem> items = new ArrayList<>();

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    private Instant updatedAt;

    @Column(length = 100)
    private String createdBy;

    @Column(length = 100)
    private String updatedBy;

    @PrePersist
    protected void onCreate() {
        createdAt = Instant.now();
        updatedAt = Instant.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = Instant.now();
    }

    public enum OrderStatus {
        PENDING,
        PAID,
        CANCELLED,
        REFUNDED,
        CONFIRMED, // Đã xác nhận (cho COD)
        SHIPPING, // Đang giao hàng
        DELIVERED, // Đã giao hàng
        COMPLETED // Hoàn thành (đã nhận hàng và thanh toán cho COD)
    }

    public enum PaymentMethod {
        PAYOS, // Thanh toán qua PayOS
        COD // Trả tiền khi nhận hàng (Cash on Delivery)
    }
}
