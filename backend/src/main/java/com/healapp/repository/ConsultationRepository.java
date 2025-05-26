package com.healapp.repository;

import com.healapp.model.Consultation;
import com.healapp.model.ConsultationStatus;
import com.healapp.model.UserDtls;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ConsultationRepository extends JpaRepository<Consultation, Long> {

        List<Consultation> findByCustomer(UserDtls customer);

        List<Consultation> findByConsultant(UserDtls consultant);

        List<Consultation> findByStatus(ConsultationStatus status);

        List<Consultation> findByCustomerAndStatus(UserDtls customer, ConsultationStatus status);

        List<Consultation> findByConsultantAndStatus(UserDtls consultant, ConsultationStatus status);

        @Query("SELECT c FROM Consultation c WHERE c.consultant.id = :consultantId " +
                        "AND c.startTime >= :startDate AND c.startTime <= :endDate")
        List<Consultation> findByConsultantAndTimeRange(Long consultantId,
                        LocalDateTime startDate,
                        LocalDateTime endDate);

        @Query("SELECT c FROM Consultation c WHERE c.customer.id = :userId OR c.consultant.id = :userId")
        List<Consultation> findByUserInvolved(Long userId);
}