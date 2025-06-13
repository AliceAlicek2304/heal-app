package com.healapp.repository;

import com.healapp.model.STIService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface STIServiceRepository extends JpaRepository<STIService, Long> {

    // Tìm tất cả dịch vụ đang hoạt động
    List<STIService> findByIsActiveTrue();
    
    Page<STIService> findByIsActiveTrue(Pageable pageable);

    // Tìm dịch vụ theo tên
    Optional<STIService> findByNameIgnoreCase(String name);

    // Kiểm tra tên dịch vụ đã tồn tại
    boolean existsByNameIgnoreCase(String name);

    // Tìm kiếm dịch vụ theo từ khóa
    @Query("SELECT s FROM STIService s WHERE s.isActive = true AND " +
           "(LOWER(s.name) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(s.description) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    List<STIService> searchActiveServices(@Param("keyword") String keyword);

    @Query("SELECT s FROM STIService s WHERE s.isActive = true AND " +
           "(LOWER(s.name) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(s.description) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    Page<STIService> searchActiveServices(@Param("keyword") String keyword, Pageable pageable);

    // Tìm dịch vụ trong khoảng giá
    @Query("SELECT s FROM STIService s WHERE s.isActive = true AND s.price BETWEEN :minPrice AND :maxPrice")
    List<STIService> findByPriceRange(@Param("minPrice") Double minPrice, @Param("maxPrice") Double maxPrice);

    // Đếm số dịch vụ đang hoạt động
    long countByIsActiveTrue();    // Tìm dịch vụ kèm theo thành phần xét nghiệm
    @Query("SELECT DISTINCT s FROM STIService s LEFT JOIN FETCH s.testComponents WHERE s.serviceId = :serviceId")
    Optional<STIService> findByIdWithComponents(@Param("serviceId") Long serviceId);

    // Tìm tất cả dịch vụ (bao gồm cả không hoạt động) sắp xếp theo ngày tạo giảm dần
    List<STIService> findAllByOrderByCreatedAtDesc();
}