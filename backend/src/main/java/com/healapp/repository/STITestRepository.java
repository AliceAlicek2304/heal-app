package com.healapp.repository;

import com.healapp.model.STITest;
import com.healapp.model.TestStatus;
import com.healapp.model.UserDtls;
import com.healapp.model.STIService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface STITestRepository extends JpaRepository<STITest, Long> {

        // Tìm theo khách hàng
        List<STITest> findByCustomer(UserDtls customer);

        List<STITest> findByCustomerIdOrderByCreatedAtDesc(Long customerId);

        Page<STITest> findByCustomerId(Long customerId, Pageable pageable);

        // Tìm theo trạng thái
        List<STITest> findByStatus(TestStatus status);

        Page<STITest> findByStatus(TestStatus status, Pageable pageable);

        // Tìm theo nhân viên xử lý
        List<STITest> findByStaff(UserDtls staff);

        List<STITest> findByStaffId(Long staffId);

        // Tìm theo consultant
        List<STITest> findByConsultant(UserDtls consultant);

        List<STITest> findByConsultantId(Long consultantId);

        // Tìm theo dịch vụ
        List<STITest> findByStiService(STIService stiService);

        List<STITest> findByStiServiceServiceId(Long serviceId);

        // Tìm theo khách hàng và trạng thái
        List<STITest> findByCustomerAndStatus(UserDtls customer, TestStatus status);

        List<STITest> findByCustomerIdAndStatus(Long customerId, TestStatus status);

        // Tìm theo ngày hẹn
        @Query("SELECT t FROM STITest t WHERE DATE(t.appointmentDate) = DATE(:date)")
        List<STITest> findByAppointmentDate(@Param("date") LocalDateTime date);

        // Tìm theo khoảng thời gian hẹn
        @Query("SELECT t FROM STITest t WHERE t.appointmentDate BETWEEN :startDate AND :endDate")
        List<STITest> findByAppointmentDateRange(@Param("startDate") LocalDateTime startDate,
                        @Param("endDate") LocalDateTime endDate);

        // Tìm test đang chờ xử lý (PENDING, PAYMENT_PENDING)
        @Query("SELECT t FROM STITest t WHERE t.status IN ('PENDING', 'PAYMENT_PENDING') ORDER BY t.createdAt ASC")
        List<STITest> findPendingTests();

        // Tìm test đã lấy mẫu nhưng chưa có kết quả
        @Query("SELECT t FROM STITest t WHERE t.status = 'SAMPLED' ORDER BY t.appointmentDate ASC")
        List<STITest> findSampledTests();

        // Tìm test có kết quả nhưng chưa tư vấn
        @Query("SELECT t FROM STITest t WHERE t.status = 'RESULTED' ORDER BY t.resultDate ASC")
        List<STITest> findResultedTests();

        // Đếm test theo trạng thái
        long countByStatus(TestStatus status);

        // Đếm test của khách hàng theo trạng thái
        long countByCustomerAndStatus(UserDtls customer, TestStatus status);

        long countByCustomerIdAndStatus(Long customerId, TestStatus status);

        // Tìm test với đầy đủ thông tin
        @Query("SELECT t FROM STITest t " +
                        "LEFT JOIN FETCH t.customer " +
                        "LEFT JOIN FETCH t.stiService " +
                        "LEFT JOIN FETCH t.staff " +
                        "LEFT JOIN FETCH t.consultant " +
                        "WHERE t.testId = :testId")
        Optional<STITest> findByIdWithDetails(@Param("testId") Long testId);

        // Thống kê theo tháng
        @Query("SELECT MONTH(t.createdAt) as month, COUNT(t) as count " +
                        "FROM STITest t WHERE YEAR(t.createdAt) = :year " +
                        "GROUP BY MONTH(t.createdAt) ORDER BY MONTH(t.createdAt)")
        List<Object[]> getMonthlyStatistics(@Param("year") int year);

        // ========== CONSULTANT QUERIES ==========

        // Tìm các test chưa có ghi chú từ consultant
        @Query("SELECT t FROM STITest t " +
                        "LEFT JOIN FETCH t.customer " +
                        "LEFT JOIN FETCH t.stiService " +
                        "LEFT JOIN FETCH t.staff " +
                        "LEFT JOIN FETCH t.consultant " +
                        "WHERE t.status IN ('SAMPLED', 'RESULTED', 'COMPLETED') " +
                        "AND (t.consultantNotes IS NULL OR t.consultantNotes = '') " +
                        "ORDER BY t.updatedAt DESC")
        List<STITest> findTestsPendingConsultantNotes();

        // Tìm tất cả tests mà consultant có thể truy cập
        @Query("SELECT t FROM STITest t " +
                        "LEFT JOIN FETCH t.customer " +
                        "LEFT JOIN FETCH t.stiService " +
                        "LEFT JOIN FETCH t.staff " +
                        "LEFT JOIN FETCH t.consultant " +
                        "WHERE t.status IN ('SAMPLED', 'RESULTED', 'COMPLETED') " +
                        "ORDER BY t.updatedAt DESC")
        List<STITest> findAllConsultantAccessibleTests();

        // Method for rating eligibility check
        @Query("SELECT t FROM STITest t WHERE t.customer.id = :customerId " +
                        "AND t.stiService.serviceId = :serviceId AND t.status = :status")
        List<STITest> findByCustomerIdAndStiServiceServiceIdAndStatus(
                        @Param("customerId") Long customerId,
                        @Param("serviceId") Long serviceId,
                        @Param("status") TestStatus status);

        // Method for package rating eligibility check
        @Query("SELECT t FROM STITest t WHERE t.customer.id = :customerId " +
                        "AND t.stiPackage.packageId = :packageId AND t.status = :status")
        List<STITest> findByCustomerIdAndPackageIdAndStatus(
                        @Param("customerId") Long customerId,
                        @Param("packageId") Long packageId,
                        @Param("status") TestStatus status);

        // Admin methods
        List<STITest> findAllByOrderByCreatedAtDesc();
}