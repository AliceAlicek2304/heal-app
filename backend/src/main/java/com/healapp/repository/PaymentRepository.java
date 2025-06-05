package com.healapp.repository;

import com.healapp.model.Payment;
import com.healapp.model.PaymentMethod;
import com.healapp.model.PaymentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {

    // Find by service
    Optional<Payment> findByServiceTypeAndServiceId(String serviceType, Long serviceId);

    List<Payment> findByServiceTypeAndServiceIdOrderByCreatedAtDesc(String serviceType, Long serviceId);

    // Find by user
    List<Payment> findByUserIdOrderByCreatedAtDesc(Long userId);

    List<Payment> findByUserIdAndPaymentStatusOrderByCreatedAtDesc(Long userId, PaymentStatus status);

    // Find by payment method
    List<Payment> findByPaymentMethodAndPaymentStatus(PaymentMethod paymentMethod, PaymentStatus status);

    // Find by status
    List<Payment> findByPaymentStatus(PaymentStatus status);

    List<Payment> findByPaymentStatusAndExpiresAtBefore(PaymentStatus status, LocalDateTime expireTime);

    // Find by external IDs
    Optional<Payment> findByStripePaymentIntentId(String stripePaymentIntentId);

    Optional<Payment> findByQrPaymentReference(String qrPaymentReference);

    Optional<Payment> findByTransactionId(String transactionId);

    List<Payment> findByPaymentMethodAndPaymentStatusAndExpiresAtAfter(
        PaymentMethod paymentMethod, PaymentStatus paymentStatus, LocalDateTime dateTime);

    // Statistics queries
    @Query("SELECT COUNT(p) FROM Payment p WHERE p.paymentStatus = :status AND p.createdAt >= :fromDate")
    Long countByStatusAndCreatedAtAfter(@Param("status") PaymentStatus status,
            @Param("fromDate") LocalDateTime fromDate);

    @Query("SELECT SUM(p.amount) FROM Payment p WHERE p.paymentStatus = :status AND p.createdAt >= :fromDate")
    java.math.BigDecimal sumAmountByStatusAndCreatedAtAfter(@Param("status") PaymentStatus status,
            @Param("fromDate") LocalDateTime fromDate);

    // Find pending payments for specific user and service
    @Query("SELECT p FROM Payment p WHERE p.userId = :userId AND p.serviceType = :serviceType AND p.serviceId = :serviceId AND p.paymentStatus = 'PENDING'")
    List<Payment> findPendingPaymentsByUserAndService(@Param("userId") Long userId,
            @Param("serviceType") String serviceType,
            @Param("serviceId") Long serviceId);
}