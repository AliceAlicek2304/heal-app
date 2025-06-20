package com.healapp.repository;

import com.healapp.model.STIPackage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface STIPackageRepository extends JpaRepository<STIPackage, Long> {

        // Tìm package đang hoạt động
        List<STIPackage> findByIsActiveTrueOrderByPackageNameAsc();

        // Tìm package theo tên (ignore case)
        Optional<STIPackage> findByPackageNameIgnoreCase(String packageName);

        // Kiểm tra tên package đã tồn tại
        boolean existsByPackageNameIgnoreCase(String packageName);

        // Tìm package với services (eager loading)
        @Query("SELECT p FROM STIPackage p LEFT JOIN FETCH p.services WHERE p.packageId = :packageId")
        Optional<STIPackage> findByIdWithServices(@Param("packageId") Long packageId); // Tìm package với services và
                                                                                       // components (chia thành 2 query
                                                                                       // để tránh
                                                                                       // MultipleBagFetchException)

        @Query("SELECT DISTINCT p FROM STIPackage p " +
                        "LEFT JOIN FETCH p.services " +
                        "WHERE p.packageId = :packageId")
        Optional<STIPackage> findByIdWithServicesAndComponents(@Param("packageId") Long packageId);

        // Tìm package đang hoạt động với services
        @Query("SELECT DISTINCT p FROM STIPackage p " +
                        "LEFT JOIN FETCH p.services " +
                        "WHERE p.isActive = true " +
                        "ORDER BY p.packageName")       
        List<STIPackage> findActivePackagesWithServices();

        // Tìm package theo khoảng giá
        @Query("SELECT p FROM STIPackage p WHERE p.isActive = true AND p.packagePrice BETWEEN :minPrice AND :maxPrice")
        List<STIPackage> findByPriceRange(@Param("minPrice") BigDecimal minPrice,
                        @Param("maxPrice") BigDecimal maxPrice);

        // Tìm package chứa service cụ thể
        @Query("SELECT DISTINCT p FROM STIPackage p JOIN p.services s WHERE s.serviceId = :serviceId AND p.isActive = true")
        List<STIPackage> findByServiceId(@Param("serviceId") Long serviceId); // Tìm package có chứa tất cả services
                                                                              // được chỉ định

        @Query("SELECT DISTINCT p FROM STIPackage p " +
                        "JOIN p.services s " +
                        "WHERE p.isActive = true AND s.serviceId IN :serviceIds " +
                        "GROUP BY p " +
                        "HAVING COUNT(DISTINCT s.serviceId) = :serviceCount")
        List<STIPackage> findByContainingAllServices(@Param("serviceIds") List<Long> serviceIds,
                        @Param("serviceCount") Long serviceCount);

        // Tìm package theo từ khóa
        @Query("SELECT DISTINCT p FROM STIPackage p " +
                        "LEFT JOIN p.services s " +
                        "WHERE p.isActive = true AND " +
                        "(LOWER(p.packageName) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
                        "LOWER(p.description) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
                        "LOWER(s.name) LIKE LOWER(CONCAT('%', :keyword, '%')))")
        List<STIPackage> findByKeyword(@Param("keyword") String keyword);

        // Tìm tất cả packages với services (cho admin/staff)
        @Query("SELECT DISTINCT p FROM STIPackage p " +
                        "LEFT JOIN FETCH p.services " +
                        "ORDER BY p.packageName")
        List<STIPackage> findAllWithServices();
}
