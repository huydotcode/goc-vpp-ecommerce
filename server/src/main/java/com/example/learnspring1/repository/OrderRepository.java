package com.example.learnspring1.repository;

import com.example.learnspring1.domain.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Optional;
import java.util.List;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {
    Optional<Order> findByOrderCode(String orderCode);

    List<Order> findByUserIdOrderByCreatedAtDesc(Long userId);

    @EntityGraph(attributePaths = { "items", "items.product", "items.variant" })
    List<Order> findWithItemsByUserIdOrderByCreatedAtDesc(Long userId);

    @EntityGraph(attributePaths = { "items", "items.product", "items.variant" })
    Optional<Order> findWithItemsByOrderCode(String orderCode);

    // Statistics queries
    @Query("SELECT COUNT(o) FROM Order o WHERE o.createdAt >= :startDate AND o.createdAt < :endDate")
    Long countOrdersByDateRange(@Param("startDate") Instant startDate, @Param("endDate") Instant endDate);

    @Query("SELECT COALESCE(SUM(o.totalAmount), 0) FROM Order o WHERE o.createdAt >= :startDate AND o.createdAt < :endDate")
    BigDecimal sumRevenueByDateRange(@Param("startDate") Instant startDate, @Param("endDate") Instant endDate);

    @Query("SELECT COUNT(DISTINCT o.user.id) FROM Order o WHERE o.user IS NOT NULL")
    Long countUniqueCustomers();

    @Query("SELECT COUNT(o) FROM Order o")
    Long countTotalOrders();

    @Query("SELECT COALESCE(SUM(o.totalAmount), 0) FROM Order o")
    BigDecimal sumTotalRevenue();

    // Daily sales for the last N days
    List<Order> findByCreatedAtBetweenOrderByCreatedAtDesc(Instant startDate, Instant endDate);
}
