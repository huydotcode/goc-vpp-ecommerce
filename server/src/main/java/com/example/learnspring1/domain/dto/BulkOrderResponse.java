package com.example.learnspring1.domain.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BulkOrderResponse {
    private int totalRequested;
    private int successCount;
    private int failedCount;
    private List<BulkOrderResult> results;
    private String message;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BulkOrderResult {
        private Long orderId;
        private String orderCode;
        private boolean success;
        private String message;
    }
}
