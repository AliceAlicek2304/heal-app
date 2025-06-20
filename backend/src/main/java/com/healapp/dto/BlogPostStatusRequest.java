package com.healapp.dto;

import com.healapp.model.BlogPostStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class BlogPostStatusRequest {
    @NotNull(message = "Status is required")
    private BlogPostStatus status;
    
    // Lý do từ chối, status = CANCELED
    private String rejectionReason;
}