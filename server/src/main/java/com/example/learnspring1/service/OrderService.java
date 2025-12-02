package com.example.learnspring1.service;

import com.example.learnspring1.domain.Order;
import com.example.learnspring1.domain.User;
import com.example.learnspring1.repository.OrderRepository;
import com.example.learnspring1.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Optional;

@Service
public class OrderService {

    private final OrderRepository orderRepository;
    private final UserRepository userRepository;

    public OrderService(OrderRepository orderRepository, UserRepository userRepository) {
        this.orderRepository = orderRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public Order createOrder(
            String orderCode,
            String userEmail,
            BigDecimal totalAmount,
            Order.PaymentMethod paymentMethod,
            String paymentLinkId,
            String description,
            String customerName,
            String customerEmail,
            String customerPhone
    ) {
        User user = null;
        if (userEmail != null) {
            user = userRepository.findByEmail(userEmail).orElse(null);
        }

        // Xác định status ban đầu dựa trên payment method
        Order.OrderStatus initialStatus;
        if (paymentMethod == Order.PaymentMethod.COD) {
            initialStatus = Order.OrderStatus.CONFIRMED; // COD: đã xác nhận, chờ giao hàng
        } else {
            initialStatus = Order.OrderStatus.PENDING; // PayOS: chờ thanh toán
        }

        Order order = Order.builder()
                .orderCode(orderCode)
                .user(user)
                .totalAmount(totalAmount)
                .paymentMethod(paymentMethod)
                .paymentLinkId(paymentLinkId)
                .status(initialStatus)
                .description(description)
                .customerName(customerName)
                .customerEmail(customerEmail)
                .customerPhone(customerPhone)
                .build();

        return orderRepository.save(order);
    }

    @Transactional
    public Order updateOrderStatus(String orderCode, Order.OrderStatus status) {
        Optional<Order> orderOpt = orderRepository.findByOrderCode(orderCode);
        if (orderOpt.isPresent()) {
            Order order = orderOpt.get();
            order.setStatus(status);
            Order savedOrder = orderRepository.save(order);
            return savedOrder;
        }
        throw new RuntimeException("Order not found with code: " + orderCode);
    }

    public Optional<Order> getOrderByCode(String orderCode) {
        return orderRepository.findByOrderCode(orderCode);
    }
}

