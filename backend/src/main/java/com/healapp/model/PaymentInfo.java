package com.healapp.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "payment_info")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentInfo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "payment_info_id")
    private Long paymentInfoId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private UserDtls user;

    @Column(name = "card_holder_name", nullable = false, length = 100)
    private String cardHolderName;

    @Column(name = "card_number", nullable = false, length = 19)
    private String cardNumber; // Masked card number (e.g., "**** **** **** 1234")

    @Column(name = "card_number_encrypted", nullable = false, columnDefinition = "NVARCHAR(MAX)")
    private String cardNumberEncrypted; // Encrypted full card number

    @Column(name = "expiry_month", nullable = false, length = 2)
    private String expiryMonth;

    @Column(name = "expiry_year", nullable = false, length = 4)
    private String expiryYear;

    @Column(name = "card_type", length = 20)
    private String cardType; // VISA, MASTERCARD, etc.

    @Column(name = "is_default", nullable = false)
    private Boolean isDefault = false;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    @Column(name = "nickname", length = 50)
    private String nickname; // User-defined nickname for the card

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    public String getMaskedCardNumber() {
        if (cardNumber == null || cardNumber.length() < 4) {
            return "**** **** **** ****";
        }
        return cardNumber;
    }

    public String getDisplayName() {
        if (nickname != null && !nickname.trim().isEmpty()) {
            return nickname;
        }
        return cardHolderName + " - " + getMaskedCardNumber();
    }

    public boolean isExpired() {
        try {
            int month = Integer.parseInt(expiryMonth);
            int year = Integer.parseInt(expiryYear);
            int currentYear = LocalDateTime.now().getYear();
            int currentMonth = LocalDateTime.now().getMonthValue();
            
            return year < currentYear || (year == currentYear && month < currentMonth);
        } catch (NumberFormatException e) {
            return true;
        }
    }
} 