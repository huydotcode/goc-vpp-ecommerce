package com.example.learnspring1.domain;

import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;

@Entity
@Table(name = "order_audit_log", indexes = {
        @Index(name = "idx_order_audit_log_order_id", columnList = "order_id"),
        @Index(name = "idx_order_audit_log_created_at", columnList = "created_at")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrderAuditLog {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "changed_by_user_id")
    private User changedBy;

    @Enumerated(EnumType.STRING)
    @Column(name = "change_type", nullable = false, length = 50)
    private ChangeType changeType;

    @Column(name = "old_value", columnDefinition = "TEXT")
    private String oldValue;

    @Column(name = "new_value", columnDefinition = "TEXT")
    private String newValue;

    @Column(columnDefinition = "TEXT")
    private String note;

    @Column(name = "ip_address", length = 45)
    private String ipAddress;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = Instant.now();
    }

    public enum ChangeType {
        ORDER_CREATED, // Đơn hàng được tạo
        STATUS_CHANGE, // Thay đổi trạng thái
        SHIPPING_UPDATE, // Cập nhật thông tin giao hàng
        PAYMENT_UPDATE, // Cập nhật thanh toán
        NOTE_ADDED, // Thêm ghi chú
        CANCELLED, // Hủy đơn
        REFUNDED // Hoàn tiền
    }
}
