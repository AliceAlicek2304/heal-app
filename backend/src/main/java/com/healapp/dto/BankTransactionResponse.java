package com.healapp.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BankTransactionResponse {

    private String transactionId;
    private String accountNumber;
    private BigDecimal amount;
    private String reference;
    private String description;
    private LocalDateTime transactionDate;
    private String status;
    private boolean transactionFound;
    private String bankCode;
    private String accountName;

    // Helper method để check transaction validity
    public boolean isTransactionFound() {
        return transactionFound && "SUCCESS".equals(status) && amount != null && amount.compareTo(BigDecimal.ZERO) > 0;
    }

    // Helper method để check amount match
    public boolean amountMatches(BigDecimal expectedAmount) {
        return amount != null && amount.compareTo(expectedAmount) == 0;
    }

    // Helper method để check reference match
    public boolean referenceMatches(String expectedReference) {
        return reference != null && reference.trim().equalsIgnoreCase(expectedReference.trim());
    }
}