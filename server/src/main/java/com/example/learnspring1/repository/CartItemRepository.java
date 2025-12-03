package com.example.learnspring1.repository;

import com.example.learnspring1.domain.CartItem;
import com.example.learnspring1.domain.Cart;
import com.example.learnspring1.domain.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface CartItemRepository extends JpaRepository<CartItem, Long> {
    Optional<CartItem> findByCartAndProduct(Cart cart, Product product);

    void deleteByCart(Cart cart);
}
