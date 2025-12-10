package com.example.learnspring1.domain.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.time.Instant;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrderAuditLogDTO {
    private Long id;
    private String changeType;
    private String changeTypeLabel;
    private String oldValue;
    private String newValue;
    private String note;
    private String ipAddress;
    private Instant createdAt;
    
    // User who made the change
    private Long changedByUserId;
    private String changedByName;
    private String changedByUsername;
}

