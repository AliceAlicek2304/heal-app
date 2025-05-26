package com.healapp.dto;

import com.healapp.model.ConsultationStatus;
import com.healapp.model.PaymentMethod;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ConsultationResponse {
    private Long consultationId;

    private Long customerId;
    private String customerName;

    private Long consultantId;
    private String consultantName;
    private String consultantQualifications;
    private String consultantExperience;

    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private ConsultationStatus status;    private String meetUrl;

    // Thông tin thanh toán
    private Float price;
    private PaymentMethod paymentMethod;
    private LocalDateTime paymentDate;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}