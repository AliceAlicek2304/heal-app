package com.healapp.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "sti_tests")
public class STITest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "test_id")
    private Long testId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", nullable = false)
    private UserDtls customer;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "service_id") // Nullable khi có package
    private STIService stiService;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "package_id") // Nullable - chỉ có khi book package
    private STIPackage stiPackage;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "staff_id")
    private UserDtls staff;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "consultant_id")
    private UserDtls consultant;

    @Column(name = "appointment_date")
    private LocalDateTime appointmentDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private TestStatus status = TestStatus.PENDING;

    @Column(name = "total_price", nullable = false, precision = 10, scale = 2)
    private BigDecimal totalPrice;

    @Column(name = "customer_notes", columnDefinition = "NVARCHAR(MAX)")
    private String customerNotes;

    @Column(name = "consultant_notes", columnDefinition = "NVARCHAR(MAX)")
    private String consultantNotes;

    @Column(name = "result_date")
    private LocalDateTime resultDate;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @OneToMany(cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JoinColumn(name = "service_id")
    private List<Payment> payments;

    @OneToMany(mappedBy = "stiTest", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<TestResult> testResults;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
        if (this.status == null) {
            this.status = TestStatus.PENDING;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    public Payment getLatestPayment() {
        if (payments == null || payments.isEmpty()) {
            return null;
        }
        return payments.stream()
                .max((p1, p2) -> p1.getCreatedAt().compareTo(p2.getCreatedAt()))
                .orElse(null);
    }

    public Payment getCompletedPayment() {
        if (payments == null || payments.isEmpty()) {
            return null;
        }
        return payments.stream()
                .filter(p -> p.getPaymentStatus() == PaymentStatus.COMPLETED)
                .findFirst()
                .orElse(null);
    }

    public boolean isPaymentCompleted() {
        return getCompletedPayment() != null;
    }

    public boolean canBeConfirmed() {
        Payment completedPayment = getCompletedPayment();
        if (completedPayment == null) {
            return false;
        }

        // COD can be confirmed without actual payment
        if (completedPayment.getPaymentMethod() == PaymentMethod.COD) {
            return true;
        }

        return completedPayment.isCompleted();
    }

    public PaymentMethod getPaymentMethod() {
        Payment latestPayment = getLatestPayment();
        return latestPayment != null ? latestPayment.getPaymentMethod() : null;
    }

    public PaymentStatus getPaymentStatus() {
        Payment latestPayment = getLatestPayment();
        return latestPayment != null ? latestPayment.getPaymentStatus() : PaymentStatus.PENDING;
    }
}