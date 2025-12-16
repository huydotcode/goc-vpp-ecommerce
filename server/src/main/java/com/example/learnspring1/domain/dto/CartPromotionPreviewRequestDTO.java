package com.example.learnspring1.domain.dto;

import lombok.Data;

import java.util.List;

@Data
public class CartPromotionPreviewRequestDTO {
    private List<Long> cartItemIds;
}

