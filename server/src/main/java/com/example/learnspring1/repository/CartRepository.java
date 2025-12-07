package com.example.learnspring1.repository;

import com.example.learnspring1.domain.Cart;
import com.example.learnspring1.domain.User;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface CartRepository extends JpaRepository<Cart, Long> {
    Optional<Cart> findByUser(User user);

    Optional<Cart> findByUserId(Long userId);

    void deleteByUser(User user);

    // Fetch Cart với items và products để tránh lazy loading issues
    @EntityGraph(attributePaths = { "items", "items.product" })
    @Query("SELECT c FROM Cart c WHERE c.id = :id")
    Optional<Cart> findByIdWithItems(@Param("id") Long id);
}
