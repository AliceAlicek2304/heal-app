package com.healapp.dto;

import java.time.LocalDateTime;

import com.healapp.model.ConsultationStatus;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ConsultationResponse {
    private Long consultationId;
    private Long customerId;
    private String customerName;
    private String customerEmail;
    private String customerPhone;

    private Long consultantId;
    private String consultantName;
    private String consultantQualifications;
    private String consultantExperience;

    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private ConsultationStatus status;
    private String meetUrl;
    private String note;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}