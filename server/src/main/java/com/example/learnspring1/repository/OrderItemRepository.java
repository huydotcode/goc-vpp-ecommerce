package com.example.learnspring1.repository;

import com.example.learnspring1.domain.Order;
import com.example.learnspring1.domain.OrderItem;
import com.example.learnspring1.domain.Product;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;

@Repository
public interface OrderItemRepository extends JpaRepository<OrderItem, Long> {

    /**
     * Tìm sản phẩm bán chạy nhất dựa trên số lượng đã bán trong khoảng thời gian,
     * chỉ tính các đơn hàng có trạng thái COMPLETED.
     */
    @Query("SELECT oi.product FROM OrderItem oi " +
            "JOIN oi.order o " +
            "WHERE o.status = :status " +
            "AND o.createdAt >= :fromDate " +
            "GROUP BY oi.product " +
            "ORDER BY SUM(oi.quantity) DESC")
    Page<Product> findBestSellers(@Param("status") Order.OrderStatus status,
            @Param("fromDate") Instant fromDate,
            Pageable pageable);
}
