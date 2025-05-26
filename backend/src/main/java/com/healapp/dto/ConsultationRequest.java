package com.healapp.dto;

import com.healapp.model.PaymentMethod;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ConsultationRequest {
    @NotNull(message = "Consultant ID is required")
    private Long consultantId;

    @NotNull(message = "Date is required")
    private LocalDate date;

    @NotEmpty(message = "Time slot is required")
    private String timeSlot;

    @NotNull(message = "Payment method is required")
    private PaymentMethod paymentMethod;

    // Visa
    private String cardNumber;
    private String expiryMonth;
    private String expiryYear;
    private String cvc;
    private String cardHolderName;
}