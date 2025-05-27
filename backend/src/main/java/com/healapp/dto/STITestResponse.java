package com.healapp.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

import com.healapp.model.PaymentMethod;
import com.healapp.model.TestStatus;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class STITestResponse {

    private Long testId;
    private Long customerId;
    private String customerName;
    private String customerEmail;
    private String customerPhone;

    private Long serviceId;
    private String serviceName;
    private String serviceDescription;
    private Double totalPrice;

    private Long staffId;
    private String staffName;

    private LocalDateTime appointmentDate;
    private String paymentMethod;
    private LocalDateTime paymentDate;
    private String stripePaymentId;

    private String customerNotes;
    private String consultantNotes;
    private String status; // PENDING, CONFIRMED, SAMPLE_COLLECTED, PROCESSING, COMPLETED, CANCELED

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}