package com.healapp.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.healapp.model.PaymentInfo;

@Repository
public interface PaymentInfoRepository extends JpaRepository<PaymentInfo, Long> {

    List<PaymentInfo> findByUserIdAndIsActiveTrueOrderByIsDefaultDescCreatedAtDesc(Long userId);

    Optional<PaymentInfo> findByUserIdAndIsDefaultTrueAndIsActiveTrue(Long userId);

    @Query("SELECT p FROM PaymentInfo p WHERE p.user.id = :userId AND p.isActive = true AND p.paymentInfoId = :paymentInfoId")
    Optional<PaymentInfo> findByUserIdAndPaymentInfoIdAndIsActiveTrue(@Param("userId") Long userId, @Param("paymentInfoId") Long paymentInfoId);

    @Modifying
    @Query("UPDATE PaymentInfo p SET p.isDefault = false WHERE p.user.id = :userId AND p.paymentInfoId != :excludeId")
    void clearDefaultForUser(@Param("userId") Long userId, @Param("excludeId") Long excludeId);

    @Query("SELECT COUNT(p) FROM PaymentInfo p WHERE p.user.id = :userId AND p.isActive = true")
    long countActiveCardsByUserId(@Param("userId") Long userId);

    boolean existsByUserIdAndCardNumberAndIsActiveTrue(Long userId, String cardNumber);
} 