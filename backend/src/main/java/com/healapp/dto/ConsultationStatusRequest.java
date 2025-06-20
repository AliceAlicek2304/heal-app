package com.healapp.dto;

import com.healapp.model.ConsultationStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ConsultationStatusRequest {
    @NotNull(message = "Status is required")
    private ConsultationStatus status;
    
}