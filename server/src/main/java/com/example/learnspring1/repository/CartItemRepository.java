package com.example.learnspring1.repository;

import com.example.learnspring1.domain.CartItem;
import com.example.learnspring1.domain.Cart;
import com.example.learnspring1.domain.Product;
import com.example.learnspring1.domain.ProductVariant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface CartItemRepository extends JpaRepository<CartItem, Long> {
    Optional<CartItem> findByCartAndProductAndVariant(Cart cart, Product product, ProductVariant variant);

    void deleteByCart(Cart cart);
}
