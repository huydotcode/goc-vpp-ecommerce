package com.example.learnspring1.repository;

import com.example.learnspring1.domain.OrderAuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OrderAuditLogRepository extends JpaRepository<OrderAuditLog, Long> {

    List<OrderAuditLog> findByOrderIdOrderByCreatedAtDesc(Long orderId);

    List<OrderAuditLog> findByOrderOrderCodeOrderByCreatedAtDesc(String orderCode);

    @Query("SELECT h FROM OrderAuditLog h " +
            "LEFT JOIN FETCH h.changedBy " +
            "WHERE h.order.id = :orderId " +
            "ORDER BY h.createdAt DESC")
    List<OrderAuditLog> findByOrderIdWithUser(@Param("orderId") Long orderId);

    @Query("SELECT h FROM OrderAuditLog h " +
            "LEFT JOIN FETCH h.changedBy " +
            "WHERE h.order.orderCode = :orderCode " +
            "ORDER BY h.createdAt DESC")
    List<OrderAuditLog> findByOrderCodeWithUser(@Param("orderCode") String orderCode);
}
