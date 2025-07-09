package com.healapp.dto;

import java.time.LocalDateTime;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class STITestRequest {

    // Có thể là serviceId HOẶC packageId (không thể cả hai)
    private Long serviceId;

    private Long packageId; // Thêm để hỗ trợ booking package

    @NotNull(message = "Appointment date is required")
    @Future(message = "Appointment date must be in the future")
    private LocalDateTime appointmentDate;

    @NotBlank(message = "Payment method is required")
    @Pattern(regexp = "COD|VISA|QR_CODE", message = "Payment method must be COD, VISA, or QR_CODE")
    private String paymentMethod;

    @Size(max = 500, message = "Customer notes must not exceed 500 characters")
    private String customerNotes;

    // VISA (optional)
    @Size(min = 16, max = 16, message = "Card number must be 16 digits")
    @Pattern(regexp = "\\d{16}", message = "Card number must contain only digits")
    private String cardNumber;

    @Pattern(regexp = "(0[1-9]|1[0-2])", message = "Expiry month must be 01-12")
    private String expiryMonth;

    @Pattern(regexp = "\\d{4}", message = "Expiry year must be 4 digits")
    private String expiryYear;

    @Pattern(regexp = "\\d{3,4}", message = "CVC must be 3-4 digits")
    private String cvc;

    @Size(max = 100, message = "Card holder name cannot exceed 100 characters")
    private String cardHolderName;

    // QR code
    @Size(max = 50, message = "QR payment reference cannot exceed 50 characters")
    private String qrPaymentReference;

    // Saved payment info (optional - for using saved cards)
    private Long paymentInfoId;

    // Validation methods
    public boolean isValid() {
        // Phải có serviceId HOẶC packageId, không được cả hai hoặc không có gì
        return (serviceId != null && packageId == null) || (serviceId == null && packageId != null);
    }

    public boolean isServiceBooking() {
        return serviceId != null && packageId == null;
    }

    public boolean isPackageBooking() {
        return packageId != null && serviceId == null;
    }

    public boolean isValidForPaymentMethod() {
        if (paymentMethod == null) {
            return false;
        }

        switch (paymentMethod.toUpperCase()) {
            case "VISA":
                return cardNumber != null && expiryMonth != null &&
                        expiryYear != null && cvc != null && cardHolderName != null;
            case "QR_CODE":
                return true;
            case "COD":
                return true;
            default:
                return false;
        }
    }

    public boolean isQrPaymentConfirmation() {
        return "QR_CODE".equalsIgnoreCase(paymentMethod) &&
                qrPaymentReference != null && !qrPaymentReference.trim().isEmpty();
    }

    public boolean isQrPaymentGeneration() {
        return "QR_CODE".equalsIgnoreCase(paymentMethod) &&
                (qrPaymentReference == null || qrPaymentReference.trim().isEmpty());
    }
}