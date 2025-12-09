package com.example.learnspring1.domain.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ReviewStatsDTO {
    private Double averageRating;
    private Long totalReviews;
}