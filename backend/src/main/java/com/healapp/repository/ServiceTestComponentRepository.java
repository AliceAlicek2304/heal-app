package com.healapp.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.healapp.model.STIService;
import com.healapp.model.ServiceTestComponent;

@Repository
public interface ServiceTestComponentRepository extends JpaRepository<ServiceTestComponent, Long> {

    // Tìm tất cả thành phần của một dịch vụ
    List<ServiceTestComponent> findByStiService(STIService stiService);

    List<ServiceTestComponent> findByStiServiceServiceId(Long serviceId);

    // Tìm các thành phần active của một dịch vụ
    List<ServiceTestComponent> findByStiServiceAndStatusTrue(STIService stiService);

    List<ServiceTestComponent> findByStiServiceServiceIdAndStatusTrue(Long serviceId);

    // Tìm tất cả thành phần của một dịch vụ (bao gồm cả inactive) - cho admin/staff
    List<ServiceTestComponent> findByStiServiceServiceIdOrderByStatusDescCreatedAtDesc(Long serviceId);

    // Tìm thành phần theo tên trong một dịch vụ
    Optional<ServiceTestComponent> findByStiServiceAndTestNameIgnoreCase(STIService stiService, String testName);

    // Kiểm tra tên thành phần đã tồn tại trong dịch vụ
    boolean existsByStiServiceAndTestNameIgnoreCase(STIService stiService, String testName);

    // Đếm số thành phần của một dịch vụ
    long countByStiService(STIService stiService);

    long countByStiServiceServiceId(Long serviceId);

    // Tìm kiếm thành phần theo từ khóa trong một dịch vụ
    @Query("SELECT c FROM ServiceTestComponent c WHERE c.stiService.serviceId = :serviceId AND "
            + "LOWER(c.testName) LIKE LOWER(CONCAT('%', :keyword, '%'))")
    List<ServiceTestComponent> searchComponentsInService(@Param("serviceId") Long serviceId,
            @Param("keyword") String keyword);

    // Xóa tất cả thành phần của một dịch vụ
    void deleteByStiService(STIService stiService);

    void deleteByStiServiceServiceId(Long serviceId);
}
