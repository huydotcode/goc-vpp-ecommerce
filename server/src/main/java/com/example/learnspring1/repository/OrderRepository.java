package com.example.learnspring1.repository;

import com.example.learnspring1.domain.Order;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Optional;
import java.util.List;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long>, JpaSpecificationExecutor<Order> {
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

    // Admin: Get all orders with pagination
    @EntityGraph(attributePaths = { "user", "items" })
    Page<Order> findAllBy(Pageable pageable);

    // Admin: Search by order code
    @EntityGraph(attributePaths = { "user", "items" })
    Page<Order> findByOrderCodeContainingIgnoreCase(String orderCode, Pageable pageable);

    // Admin: Filter by status
    @EntityGraph(attributePaths = { "user", "items" })
    Page<Order> findByStatus(Order.OrderStatus status, Pageable pageable);

    // Admin: Search by customer name
    @EntityGraph(attributePaths = { "user", "items" })
    Page<Order> findByCustomerNameContainingIgnoreCase(String customerName, Pageable pageable);

    // Admin: Search by customer email
    @EntityGraph(attributePaths = { "user", "items" })
    Page<Order> findByCustomerEmailContainingIgnoreCase(String customerEmail, Pageable pageable);

    // Admin: Search by customer phone
    @EntityGraph(attributePaths = { "user", "items" })
    Page<Order> findByCustomerPhoneContainingIgnoreCase(String customerPhone, Pageable pageable);

    // Admin: Count orders by status
    long countByStatus(Order.OrderStatus status);

    // Admin: Get orders in date range
    @Query("SELECT o FROM Order o WHERE o.createdAt BETWEEN :startDate AND :endDate")
    List<Order> findOrdersByDateRange(@Param("startDate") Instant startDate, @Param("endDate") Instant endDate);
}
