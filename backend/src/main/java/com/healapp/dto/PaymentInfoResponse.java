package com.healapp.dto;

import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PaymentInfoResponse {

    private Long paymentInfoId;
    private Long userId;
    private String cardHolderName;
    private String cardNumber; // Masked card number
    private String expiryMonth;
    private String expiryYear;
    private String cardType;
    private Boolean isDefault;
    private Boolean isActive;
    private String nickname;
    private String displayName;
    private Boolean isExpired;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
} 