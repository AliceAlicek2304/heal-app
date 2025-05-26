package com.healapp.dto;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class STITestRequest {

    @NotNull(message = "Service ID is required")
    private Long serviceId;

    @NotNull(message = "Appointment date is required")
    @Future(message = "Appointment date must be in the future")
    private LocalDateTime appointmentDate;

    @NotBlank(message = "Payment method is required")
    @Pattern(regexp = "COD|VISA", message = "Payment method must be COD or VISA")
    private String paymentMethod;

    @Size(max = 500, message = "Customer notes must not exceed 500 characters")
    private String customerNotes;

    // VISA (optional)
    private String cardNumber;
    private String expiryMonth;
    private String expiryYear;
    private String cvc;
    private String cardHolderName;
}