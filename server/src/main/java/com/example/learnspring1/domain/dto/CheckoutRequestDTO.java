package com.example.learnspring1.domain.dto;

import com.example.learnspring1.domain.Order;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;

@Data
public class CheckoutRequestDTO {
    @NotNull(message = "Payment method is required")
    private Order.PaymentMethod paymentMethod;

    @NotBlank(message = "Customer name is required")
    private String customerName;

    @NotBlank(message = "Customer email is required")
    private String customerEmail;

    @NotBlank(message = "Customer phone is required")
    private String customerPhone;

    @NotBlank(message = "Address is required")
    private String address;

    private String description; // Optional notes

    private List<Long> cartItemIds; // Optional: nếu null hoặc empty thì checkout tất cả items trong cart
}
