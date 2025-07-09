package com.healapp.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PaymentInfoRequest {

    @NotBlank(message = "Card holder name is required")
    @Size(max = 100, message = "Card holder name cannot exceed 100 characters")
    private String cardHolderName;

    @NotBlank(message = "Card number is required")
    @Pattern(regexp = "\\d{16}", message = "Card number must be 16 digits")
    private String cardNumber;

    @NotBlank(message = "Expiry month is required")
    @Pattern(regexp = "(0[1-9]|1[0-2])", message = "Expiry month must be 01-12")
    private String expiryMonth;

    @NotBlank(message = "Expiry year is required")
    @Pattern(regexp = "\\d{4}", message = "Expiry year must be 4 digits")
    private String expiryYear;

    @NotBlank(message = "CVC is required")
    @Pattern(regexp = "\\d{3,4}", message = "CVC must be 3-4 digits")
    private String cvc;

    @Size(max = 50, message = "Nickname cannot exceed 50 characters")
    private String nickname;

    private Boolean isDefault = false;
} 