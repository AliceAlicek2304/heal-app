package com.healapp.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "payments")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Payment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "payment_id")
    private Long paymentId;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "service_type", nullable = false, length = 20)
    private String serviceType;

    @Column(name = "service_id", nullable = false)
    private Long serviceId;

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_method", nullable = false, length = 20)
    private PaymentMethod paymentMethod;

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_status", nullable = false, length = 20)
    private PaymentStatus paymentStatus = PaymentStatus.PENDING;

    @Column(name = "amount", nullable = false, precision = 10, scale = 2)
    private BigDecimal amount;

    @Column(name = "currency", nullable = false, length = 3)
    private String currency = "VND";

    // Payment provider specific fields
    @Column(name = "stripe_payment_intent_id", length = 100)
    private String stripePaymentIntentId;

    @Column(name = "qr_payment_reference", length = 50)
    private String qrPaymentReference;

    @Column(name = "qr_code_url", length = 500)
    private String qrCodeUrl;

    @Column(name = "transaction_id", length = 100)
    private String transactionId; // Universal transaction ID

    // Timestamps
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "paid_at")
    private LocalDateTime paidAt;

    @Column(name = "expires_at")
    private LocalDateTime expiresAt; // For QR codes

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    // Refund information
    @Column(name = "refund_id", length = 100)
    private String refundId;

    @Column(name = "refunded_at")
    private LocalDateTime refundedAt;

    @Column(name = "refund_amount", precision = 10, scale = 2)
    private BigDecimal refundAmount;

    // Additional info
    @Column(name = "description", length = 500)
    private String description;

    @Column(name = "notes", columnDefinition = "NVARCHAR(MAX)")
    private String notes;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
        if (this.paymentStatus == null) {
            this.paymentStatus = PaymentStatus.PENDING;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    public boolean isCompleted() {
        return this.paymentStatus == PaymentStatus.COMPLETED;
    }

    public boolean canBeRefunded() {
        return this.paymentStatus == PaymentStatus.COMPLETED &&
                this.refundId == null &&
                this.paymentMethod != PaymentMethod.COD;
    }

    public boolean isExpired() {
        return this.expiresAt != null &&
                this.expiresAt.isBefore(LocalDateTime.now()) &&
                this.paymentStatus == PaymentStatus.PENDING;
    }

    public String getPaymentDisplayInfo() {
        switch (this.paymentMethod) {
            case COD:
                return "Cash on Delivery";
            case VISA:
                return "Credit Card"
                        + (this.stripePaymentIntentId != null ? " (" + this.stripePaymentIntentId + ")" : "");
            case QR_CODE:
                return "QR Code" + (this.qrPaymentReference != null ? " (" + this.qrPaymentReference + ")" : "");
            default:
                return this.paymentMethod.name();
        }
    }
}