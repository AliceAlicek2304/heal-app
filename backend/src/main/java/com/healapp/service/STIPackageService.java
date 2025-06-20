package com.healapp.service;

import com.healapp.dto.ApiResponse;
import com.healapp.dto.STIPackageRequest;
import com.healapp.dto.STIPackageResponse;
import com.healapp.dto.STIServiceResponse;
import com.healapp.model.STIPackage;
import com.healapp.model.STIService;
import com.healapp.model.PackageService;
import com.healapp.model.UserDtls;
import com.healapp.repository.STIPackageRepository;
import com.healapp.repository.STIServiceRepository;
import com.healapp.repository.PackageServiceRepository;
import com.healapp.repository.UserRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;
import java.util.stream.Collectors;

@Slf4j
@Service
public class STIPackageService {

    @Autowired
    private STIPackageRepository stiPackageRepository;
    @Autowired
    private STIServiceRepository stiServiceRepository;

    @Autowired
    private PackageServiceRepository packageServiceRepository;

    @Autowired
    private UserRepository userRepository;

    /**
     * Tạo package mới (Admin/Staff only)
     */
    @Transactional
    public ApiResponse<STIPackageResponse> createPackage(STIPackageRequest request, Long userId) {
        try {
            // Kiểm tra quyền
            Optional<UserDtls> userOpt = userRepository.findById(userId);
            if (userOpt.isEmpty()) {
                return ApiResponse.error("User not found");
            }

            UserDtls user = userOpt.get();
            if (!isAdminOrStaff(user)) {
                return ApiResponse.error("Access denied. Admin or Staff role required");
            }

            // Kiểm tra tên package đã tồn tại
            if (stiPackageRepository.existsByPackageNameIgnoreCase(request.getPackageName())) {
                return ApiResponse.error("Package name already exists");
            }

            // Validate services
            List<STIService> services = stiServiceRepository.findAllById(request.getServiceIds());
            if (services.size() != request.getServiceIds().size()) {
                return ApiResponse.error("Some services not found or inactive");
            }

            // Kiểm tra tất cả services đều active
            boolean allActive = services.stream().allMatch(STIService::getIsActive);
            if (!allActive) {
                return ApiResponse.error("All services must be active");
            } // Tạo package
            STIPackage stiPackage = new STIPackage();
            stiPackage.setPackageName(request.getPackageName());
            stiPackage.setDescription(request.getDescription());
            stiPackage.setPackagePrice(request.getPackagePrice());
            stiPackage.setIsActive(request.getIsActive());

            // Lưu package trước
            STIPackage savedPackage = stiPackageRepository.save(stiPackage);

            // Tạo các PackageService entities
            List<PackageService> packageServices = services.stream()
                    .map(service -> {
                        PackageService ps = new PackageService();
                        ps.setStiPackage(savedPackage);
                        ps.setStiService(service);
                        return ps;
                    })
                    .collect(Collectors.toList());

            // Lưu package services
            packageServiceRepository.saveAll(packageServices);

            // Load lại với services để response
            STIPackage packageWithServices = stiPackageRepository
                    .findByIdWithServicesAndComponents(savedPackage.getPackageId())
                    .orElse(savedPackage);

            STIPackageResponse response = convertToResponse(packageWithServices);
            log.info("STI Package created successfully by user: {} - Package ID: {}", user.getUsername(),
                    savedPackage.getPackageId());

            return ApiResponse.success("STI package created successfully", response);

        } catch (Exception e) {
            log.error("Error creating STI package: {}", e.getMessage(), e);
            return ApiResponse.error("Failed to create STI package: " + e.getMessage());
        }
    }

    /**
     * Cập nhật package (Admin/Staff only)
     */
    @Transactional
    public ApiResponse<STIPackageResponse> updatePackage(Long packageId, STIPackageRequest request, Long userId) {
        try {
            // Kiểm tra quyền
            Optional<UserDtls> userOpt = userRepository.findById(userId);
            if (userOpt.isEmpty()) {
                return ApiResponse.error("User not found");
            }

            UserDtls user = userOpt.get();
            if (!isAdminOrStaff(user)) {
                return ApiResponse.error("Access denied. Admin or Staff role required");
            }

            // Tìm package
            Optional<STIPackage> packageOpt = stiPackageRepository.findByIdWithServices(packageId);
            if (packageOpt.isEmpty()) {
                return ApiResponse.error("Package not found");
            }

            STIPackage stiPackage = packageOpt.get();

            // Kiểm tra tên package đã tồn tại (trừ chính nó)
            Optional<STIPackage> existingPackage = stiPackageRepository
                    .findByPackageNameIgnoreCase(request.getPackageName());
            if (existingPackage.isPresent() && !existingPackage.get().getPackageId().equals(packageId)) {
                return ApiResponse.error("Package name already exists");
            }

            // Validate services
            List<STIService> services = stiServiceRepository.findAllById(request.getServiceIds());
            if (services.size() != request.getServiceIds().size()) {
                return ApiResponse.error("Some services not found or inactive");
            } // Cập nhật package
            stiPackage.setPackageName(request.getPackageName());
            stiPackage.setDescription(request.getDescription());
            stiPackage.setPackagePrice(request.getPackagePrice());
            stiPackage.setIsActive(request.getIsActive());

            // Xóa services cũ và tạo mới
            packageServiceRepository.deleteByPackageId(stiPackage.getPackageId());

            // Tạo PackageService entities mới
            List<PackageService> packageServices = new ArrayList<>();
            for (STIService service : services) {
                PackageService packageService = new PackageService();
                packageService.setStiPackage(stiPackage);
                packageService.setStiService(service);
                packageServices.add(packageService);
            }
            packageServiceRepository.saveAll(packageServices);

            STIPackage updatedPackage = stiPackageRepository.save(stiPackage);

            // Load lại với services
            STIPackage packageWithServices = stiPackageRepository.findByIdWithServicesAndComponents(packageId)
                    .orElse(updatedPackage);

            STIPackageResponse response = convertToResponse(packageWithServices);
            log.info("STI Package updated successfully by user: {} - Package ID: {}", user.getUsername(), packageId);

            return ApiResponse.success("STI package updated successfully", response);

        } catch (Exception e) {
            log.error("Error updating STI package: {}", e.getMessage(), e);
            return ApiResponse.error("Failed to update STI package: " + e.getMessage());
        }
    }

    /**
     * Lấy danh sách packages đang hoạt động (cho user)
     */
    public ApiResponse<List<STIPackageResponse>> getActivePackages() {
        try {
            List<STIPackage> activePackages = stiPackageRepository.findActivePackagesWithServices();
            List<STIPackageResponse> responses = activePackages.stream()
                    .map(this::convertToResponse)
                    .collect(Collectors.toList());

            return ApiResponse.success("Active STI packages retrieved successfully", responses);

        } catch (Exception e) {
            log.error("Error retrieving active STI packages: {}", e.getMessage(), e);
            return ApiResponse.error("Failed to retrieve active STI packages: " + e.getMessage());
        }
    }

    /**
     * Lấy tất cả packages (bao gồm cả inactive) cho admin/staff
     */
    public ApiResponse<List<STIPackageResponse>> getAllPackages() {
        try {
            List<STIPackage> allPackages = stiPackageRepository.findAllWithServices();
            List<STIPackageResponse> responses = allPackages.stream()
                    .map(this::convertToResponse)
                    .collect(Collectors.toList());

            return ApiResponse.success("All STI packages retrieved successfully", responses);

        } catch (Exception e) {
            log.error("Error retrieving all STI packages: {}", e.getMessage(), e);
            return ApiResponse.error("Failed to retrieve all STI packages: " + e.getMessage());
        }
    }

    /**
     * Lấy chi tiết package theo ID
     */
    public ApiResponse<STIPackageResponse> getPackageById(Long packageId) {
        try {
            Optional<STIPackage> packageOpt = stiPackageRepository.findByIdWithServicesAndComponents(packageId);
            if (packageOpt.isEmpty()) {
                return ApiResponse.error("Package not found");
            }

            STIPackageResponse response = convertToResponse(packageOpt.get());
            return ApiResponse.success("STI package retrieved successfully", response);

        } catch (Exception e) {
            log.error("Error retrieving STI package: {}", e.getMessage(), e);
            return ApiResponse.error("Failed to retrieve STI package: " + e.getMessage());
        }
    }

    /**
     * Tìm package theo từ khóa
     */
    public ApiResponse<List<STIPackageResponse>> searchPackages(String keyword) {
        try {
            List<STIPackage> packages = stiPackageRepository.findByKeyword(keyword);
            List<STIPackageResponse> responses = packages.stream()
                    .map(this::convertToResponse)
                    .collect(Collectors.toList());

            return ApiResponse.success("Search completed successfully", responses);

        } catch (Exception e) {
            log.error("Error searching STI packages: {}", e.getMessage(), e);
            return ApiResponse.error("Failed to search STI packages: " + e.getMessage());
        }
    }

    /**
     * Xóa package (Admin only)
     */
    @Transactional
    public ApiResponse<String> deletePackage(Long packageId, Long userId) {
        try {
            // Kiểm tra quyền Admin
            Optional<UserDtls> userOpt = userRepository.findById(userId);
            if (userOpt.isEmpty()) {
                return ApiResponse.error("User not found");
            }

            UserDtls user = userOpt.get();
            if (!isAdmin(user)) {
                return ApiResponse.error("Access denied. Admin role required");
            }

            // Kiểm tra package tồn tại
            Optional<STIPackage> packageOpt = stiPackageRepository.findById(packageId);
            if (packageOpt.isEmpty()) {
                return ApiResponse.error("Package not found");
            }

            // Soft delete - chỉ set isActive = false
            STIPackage stiPackage = packageOpt.get();
            stiPackage.setIsActive(false);
            stiPackageRepository.save(stiPackage);

            log.info("STI Package deactivated by admin: {} - Package ID: {}", user.getUsername(), packageId);
            return ApiResponse.success("STI package deactivated successfully", null);

        } catch (Exception e) {
            log.error("Error deleting STI package: {}", e.getMessage(), e);
            return ApiResponse.error("Failed to delete STI package: " + e.getMessage());
        }
    }

    /**
     * Convert STIPackage to Response
     */
    private STIPackageResponse convertToResponse(STIPackage stiPackage) {
        STIPackageResponse response = new STIPackageResponse();
        response.setPackageId(stiPackage.getPackageId());
        response.setPackageName(stiPackage.getPackageName());
        response.setDescription(stiPackage.getDescription());
        response.setPackagePrice(stiPackage.getPackagePrice());
        response.setIsActive(stiPackage.getIsActive());
        response.setCreatedAt(stiPackage.getCreatedAt());
        response.setUpdatedAt(stiPackage.getUpdatedAt());

        // Thông tin services
        if (stiPackage.getServices() != null) {
            response.setServiceCount(stiPackage.getServices().size());
            response.setTotalComponentCount(stiPackage.getTotalComponentCount());

            // Convert services
            List<STIServiceResponse> serviceResponses = stiPackage.getServices().stream()
                    .map(this::convertServiceToResponse)
                    .collect(Collectors.toList());
            response.setServices(serviceResponses);

            // Thông tin giá
            response.setTotalIndividualPrice(stiPackage.getTotalIndividualPrice());
            response.setSavingsAmount(stiPackage.getSavingsAmount());
            response.setDiscountPercentage(stiPackage.getDiscountPercentage());
        }

        return response;
    }

    /**
     * Convert STIService to Response (simplified for package)
     */
    private STIServiceResponse convertServiceToResponse(STIService service) {
        STIServiceResponse response = new STIServiceResponse();
        response.setServiceId(service.getServiceId());
        response.setName(service.getName());
        response.setDescription(service.getDescription());
        response.setPrice(service.getPrice());
        response.setIsActive(service.getIsActive());
        response.setCreatedAt(service.getCreatedAt());
        response.setUpdatedAt(service.getUpdatedAt());

        if (service.getTestComponents() != null) {
            response.setComponentCount(service.getTestComponents().size());
        }

        return response;
    }

    private boolean isAdmin(UserDtls user) {
        if (user.getRole() == null)
            return false;
        String role = user.getRole().getRoleName();
        log.info("Checking isAdmin for role: {}", role);
        return "ROLE_ADMIN".equals(role) || "ADMIN".equals(role);
    }

    private boolean isAdminOrStaff(UserDtls user) {
        if (user.getRole() == null)
            return false;
        String role = user.getRole().getRoleName();
        log.info("Checking isAdminOrStaff for role: {}", role);
        return "ROLE_ADMIN".equals(role) || "ROLE_STAFF".equals(role) || "ADMIN".equals(role) || "STAFF".equals(role);
    }
}
