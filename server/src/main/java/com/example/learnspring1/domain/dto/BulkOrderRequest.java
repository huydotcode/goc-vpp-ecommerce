package com.example.learnspring1.domain.dto;

import lombok.Data;

import java.util.List;

@Data
public class BulkOrderRequest {
    private List<Long> orderIds;
    private String action; // UPDATE_STATUS, EXPORT
    private BulkActionParams params;

    @Data
    public static class BulkActionParams {
        private String status;
    }
}
