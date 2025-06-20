package com.healapp.controller;

import com.healapp.dto.AdminResetPasswordRequest;
import com.healapp.dto.ApiResponse;
import com.healapp.dto.ConfigStatusRequest;
import com.healapp.dto.ConsultantProfileRequest;
import com.healapp.dto.ConsultantProfileResponse;
import com.healapp.dto.CreateConsultantAccountRequest;
import com.healapp.dto.CreateUserRequest;
import com.healapp.dto.STIServiceResponse;
import com.healapp.dto.STIPackageResponse;
import com.healapp.dto.STITestResponse;
import com.healapp.dto.UserResponse;
import com.healapp.dto.UserUpdateRequest;
import com.healapp.model.Payment;
import com.healapp.service.AdminStatsService;
import com.healapp.service.AppConfigService;
import com.healapp.service.ConsultantService;
import com.healapp.service.PaymentService;
import com.healapp.service.STIServiceService;
import com.healapp.service.STIPackageService;
import com.healapp.service.STITestService;
import com.healapp.service.UserService;

import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.time.LocalDateTime;

@RestController
@RequestMapping("/admin")
@PreAuthorize("hasRole('ROLE_ADMIN')")
public class AdminController {
    @Autowired
    private ConsultantService consultantService;

    @Autowired
    private UserService userService;

    @Autowired
    private AppConfigService appConfigService;

    @Autowired
    private PaymentService paymentService;

    // STI MANAGEMENT
    @Autowired
    private STIServiceService stiServiceService;

    @Autowired
    private STITestService stiTestService;

    @Autowired
    private STIPackageService stiPackageService;

    @Autowired
    private AdminStatsService adminStatsService;

    // CONSULTANT MANAGEMENT
    @GetMapping("/consultants")
    public ResponseEntity<ApiResponse<List<ConsultantProfileResponse>>> getAllConsultantProfiles() {
        ApiResponse<List<ConsultantProfileResponse>> response = consultantService.getAllConsultantProfiles();
        return getResponseEntity(response);
    }

    @GetMapping("/consultants/active")
    public ResponseEntity<ApiResponse<List<ConsultantProfileResponse>>> getActiveConsultantProfiles() {
        ApiResponse<List<ConsultantProfileResponse>> response = consultantService.getActiveConsultantProfiles();
        return getResponseEntity(response);
    }

    @GetMapping("/consultants/{userId}")
    public ResponseEntity<ApiResponse<ConsultantProfileResponse>> getConsultantProfileById(@PathVariable Long userId) {
        ApiResponse<ConsultantProfileResponse> response = consultantService.getConsultantProfileById(userId);
        return getResponseEntity(response);
    }

    @PutMapping("/consultants/{userId}/profile")
    public ResponseEntity<ApiResponse<ConsultantProfileResponse>> updateConsultantProfile(
            @PathVariable Long userId,
            @Valid @RequestBody ConsultantProfileRequest request) {

        ApiResponse<ConsultantProfileResponse> response = consultantService.createOrUpdateConsultantProfile(userId,
                request);
        return getResponseEntity(response);
    }

    @PostMapping("/consultants")
    public ResponseEntity<ApiResponse<ConsultantProfileResponse>> createConsultantAccount(
            @Valid @RequestBody CreateConsultantAccountRequest request) {
        ApiResponse<ConsultantProfileResponse> response = consultantService.createConsultantAccount(request);
        return getResponseEntity(response);
    }

    @PutMapping("/consultants/{userId}/activate")
    public ResponseEntity<ApiResponse<ConsultantProfileResponse>> activateConsultant(@PathVariable Long userId) {
        ApiResponse<ConsultantProfileResponse> response = consultantService.activateConsultant(userId);
        return getResponseEntity(response);
    }

    @PutMapping("/consultants/{userId}/deactivate")
    public ResponseEntity<ApiResponse<String>> deactivateConsultant(@PathVariable Long userId) {
        ApiResponse<String> response = consultantService.deactivateConsultant(userId);
        return getResponseEntity(response);
    }

    // USER MANAGEMENT
    @GetMapping("/users")
    public ResponseEntity<ApiResponse<List<UserResponse>>> getAllUsers(
            @RequestParam(value = "role", required = false) String role) {
        ApiResponse<List<UserResponse>> response;

        if (role != null && !role.trim().isEmpty()) {
            response = userService.getUsersByRole(role.trim().toUpperCase());
        } else {
            response = userService.getAllUsers();
        }

        return getResponseEntity(response);
    }

    @GetMapping("/users/roles")
    public ResponseEntity<ApiResponse<List<String>>> getAvailableRoles() {
        ApiResponse<List<String>> response = userService.getAvailableRoles();
        return getResponseEntity(response);
    }

    @GetMapping("/users/count")
    public ResponseEntity<ApiResponse<Map<String, Long>>> getUserCountByRole() {
        ApiResponse<Map<String, Long>> response = userService.getUserCountByRole();
        return getResponseEntity(response);
    }

    @GetMapping("/users/{userId}")
    public ResponseEntity<ApiResponse<UserResponse>> getUserById(@PathVariable Long userId) {
        ApiResponse<UserResponse> response = userService.getUserById(userId);
        return getResponseEntity(response);
    }

    @PutMapping("/users/{userId}")
    public ResponseEntity<ApiResponse<UserResponse>> updateUserRoleAndStatus(
            @PathVariable Long userId,
            @Valid @RequestBody UserUpdateRequest request) {
        ApiResponse<UserResponse> response = userService.updateUserRoleAndStatus(userId, request);
        return getResponseEntity(response);
    }

    @PostMapping("/users")
    public ResponseEntity<ApiResponse<UserResponse>> createUser(
            @Valid @RequestBody CreateUserRequest request) {
        ApiResponse<UserResponse> response = userService.createUserByAdmin(request);
        return getResponseEntity(response);
    }

    @PutMapping("/users/{userId}/reset-password")
    public ResponseEntity<ApiResponse<String>> resetUserPassword(
            @PathVariable Long userId,
            @Valid @RequestBody AdminResetPasswordRequest request) {
        ApiResponse<String> response = userService.resetPasswordByAdmin(userId, request);
        return getResponseEntity(response);
    }

    // ========== PAYMENT MANAGEMENT ==========

    @GetMapping("/payments")
    public ResponseEntity<ApiResponse<List<Payment>>> getAllPayments(
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "50") int size) {

        ApiResponse<List<Payment>> response = paymentService.getAllPayments(page, size);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/payments/{paymentId}")
    public ResponseEntity<ApiResponse<Payment>> getPaymentDetails(@PathVariable Long paymentId) {

        ApiResponse<Payment> response = paymentService.getPaymentByIdAdmin(paymentId);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/payments/by-service")
    public ResponseEntity<ApiResponse<List<Payment>>> getPaymentsByService(
            @RequestParam("serviceType") String serviceType,
            @RequestParam("serviceId") Long serviceId) {

        ApiResponse<List<Payment>> response = paymentService.getPaymentsByService(serviceType, serviceId);
        return ResponseEntity.ok(response);
    }

    // ========= APP CONFIG MANAGEMENT =========

    @GetMapping("/config")
    public ResponseEntity<ApiResponse<Map<String, String>>> getAllConfigs() {
        ApiResponse<Map<String, String>> response = appConfigService.getCurrentConfig();
        return getResponseEntity(response);
    }

    @PutMapping("/config/{key}")
    public ResponseEntity<ApiResponse<String>> updateSingleConfig(
            @PathVariable String key,
            @RequestBody Map<String, String> request) {

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication.getName();
        Long adminUserId = userService.getUserIdFromUsername(username);

        String value = request.get("value");

        if (value == null) {
            return ResponseEntity.badRequest().body(
                    ApiResponse.error("Value cannot be null"));
        }

        ApiResponse<String> response = appConfigService.updateSingleConfig(key, value.trim(), adminUserId);
        return getResponseEntity(response);
    }

    @PutMapping("/config/{key}/status")
    public ResponseEntity<ApiResponse<String>> updateConfigStatus(
            @PathVariable String key,
            @Valid @RequestBody ConfigStatusRequest request) {

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication.getName();
        Long adminUserId = userService.getUserIdFromUsername(username);

        ApiResponse<String> response = appConfigService.toggleConfigStatus(key, request.getActive(), adminUserId);
        return getResponseEntity(response);
    }

    @PutMapping("/config")
    public ResponseEntity<ApiResponse<Map<String, String>>> updateAllConfigs(
            @RequestBody Map<String, String> configData) {

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication.getName();
        Long adminUserId = userService.getUserIdFromUsername(username);

        // Validate dữ liệu đầu vào
        if (configData == null || configData.isEmpty()) {
            return ResponseEntity.badRequest().body(
                    ApiResponse.error("Config data cannot be empty"));
        }

        ApiResponse<Map<String, String>> response = appConfigService.updateMultipleConfigs(configData, adminUserId);
        return getResponseEntity(response);
    }

    @PostMapping("/config")
    public ResponseEntity<ApiResponse<String>> addNewConfig(
            @RequestBody Map<String, String> request) {

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication.getName();
        Long adminUserId = userService.getUserIdFromUsername(username);

        String key = request.get("key");
        String value = request.get("value");

        // Validation
        if (key == null || key.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(
                    ApiResponse.error("Config key cannot be empty"));
        }

        if (value == null || value.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(
                    ApiResponse.error("Config value cannot be empty"));
        }

        ApiResponse<String> response = appConfigService.addNewConfig(key.trim(), value.trim(), adminUserId);
        return getResponseEntity(response);
    }

    @DeleteMapping("/config/{key}")
    public ResponseEntity<ApiResponse<String>> deleteConfig(@PathVariable String key) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication.getName();
        Long adminUserId = userService.getUserIdFromUsername(username);

        ApiResponse<String> response = appConfigService.deleteConfig(key, adminUserId);
        return getResponseEntity(response);
    }

    @PostMapping("/config/{key}/upload")
    public ResponseEntity<ApiResponse<String>> uploadConfigFile(
            @PathVariable String key,
            @RequestParam("file") MultipartFile file) {

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication.getName();
        Long adminUserId = userService.getUserIdFromUsername(username);

        ApiResponse<String> response = appConfigService.uploadConfigFile(key, file, adminUserId);
        return getResponseEntity(response);
    }

    // STI SERVICES MANAGEMENT
    @GetMapping("/sti-services")
    public ResponseEntity<ApiResponse<List<STIServiceResponse>>> getAllSTIServices() {
        ApiResponse<List<STIServiceResponse>> response = stiServiceService.getAllServices();
        return getResponseEntity(response);
    }

    @GetMapping("/sti-services/{serviceId}")
    public ResponseEntity<ApiResponse<STIServiceResponse>> getSTIServiceById(@PathVariable Long serviceId) {
        ApiResponse<STIServiceResponse> response = stiServiceService.getServiceWithComponents(serviceId);
        return getResponseEntity(response);
    }

    // STI PACKAGES MANAGEMENT
    @GetMapping("/sti-packages")
    public ResponseEntity<ApiResponse<List<STIPackageResponse>>> getAllSTIPackages() {
        ApiResponse<List<STIPackageResponse>> response = stiPackageService.getAllPackages();
        return getResponseEntity(response);
    }

    @GetMapping("/sti-packages/{packageId}")
    public ResponseEntity<ApiResponse<STIPackageResponse>> getSTIPackageById(@PathVariable Long packageId) {
        ApiResponse<STIPackageResponse> response = stiPackageService.getPackageById(packageId);
        return getResponseEntity(response);
    }

    // STI TESTS MANAGEMENT
    @GetMapping("/sti-tests")
    public ResponseEntity<ApiResponse<List<STITestResponse>>> getAllSTITests() {
        ApiResponse<List<STITestResponse>> response = stiTestService.getAllTestsForAdmin();
        return getResponseEntity(response);
    }

    @GetMapping("/sti-tests/{testId}")
    public ResponseEntity<ApiResponse<STITestResponse>> getSTITestById(@PathVariable Long testId) {
        ApiResponse<STITestResponse> response = stiTestService.getTestByIdForAdmin(testId);
        return getResponseEntity(response);
    } // ========= STATISTICS APIs =========

    @GetMapping("/stats/overview")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getStatisticsOverview() {
        try {
            Map<String, Object> stats = adminStatsService.getOverviewStats();
            ApiResponse<Map<String, Object>> response = ApiResponse.success("Statistics retrieved successfully", stats);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            ApiResponse<Map<String, Object>> response = ApiResponse
                    .error("Failed to retrieve statistics: " + e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    @GetMapping("/stats/revenue")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getRevenueStatistics(
            @RequestParam(value = "period", defaultValue = "monthly") String period,
            @RequestParam(value = "year", required = false) Integer year,
            @RequestParam(value = "month", required = false) Integer month) {

        try {
            Map<String, Object> revenueStats = adminStatsService.getRevenueStats(period, year, month);
            ApiResponse<Map<String, Object>> response = ApiResponse.success("Revenue statistics retrieved successfully",
                    revenueStats);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            ApiResponse<Map<String, Object>> response = ApiResponse
                    .error("Failed to retrieve revenue statistics: " + e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    @GetMapping("/stats/revenue/compare")
    public ResponseEntity<ApiResponse<Map<String, Object>>> compareRevenueStatistics(
            @RequestParam(value = "period", defaultValue = "monthly") String period,
            @RequestParam(value = "currentYear") Integer currentYear,
            @RequestParam(value = "currentMonth", required = false) Integer currentMonth,
            @RequestParam(value = "compareYear") Integer compareYear,
            @RequestParam(value = "compareMonth", required = false) Integer compareMonth) {

        try {
            Map<String, Object> compareStats = adminStatsService.compareRevenue(
                    period, currentYear, currentMonth, compareYear, compareMonth);
            ApiResponse<Map<String, Object>> response = ApiResponse.success("Revenue comparison retrieved successfully",
                    compareStats);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            ApiResponse<Map<String, Object>> response = ApiResponse
                    .error("Failed to compare revenue statistics: " + e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    @GetMapping("/stats/activities")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getRecentActivities(
            @RequestParam(value = "limit", defaultValue = "10") int limit) {

        try {
            List<Map<String, Object>> activities = adminStatsService.getRecentActivities(limit);
            ApiResponse<List<Map<String, Object>>> response = ApiResponse
                    .success("Recent activities retrieved successfully", activities);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            ApiResponse<List<Map<String, Object>>> response = ApiResponse
                    .error("Failed to retrieve recent activities: " + e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    @GetMapping("/stats/top-consultants")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getTopConsultants(
            @RequestParam(value = "limit", defaultValue = "10") int limit,
            @RequestParam(value = "startDate", required = false) String startDateStr,
            @RequestParam(value = "endDate", required = false) String endDateStr) {

        try {
            LocalDateTime startDate = null;
            LocalDateTime endDate = null;

            if (startDateStr != null && endDateStr != null) {
                startDate = LocalDateTime.parse(startDateStr + "T00:00:00");
                endDate = LocalDateTime.parse(endDateStr + "T23:59:59");
            }

            List<Map<String, Object>> consultants = adminStatsService.getTopConsultants(limit, startDate, endDate);
            ApiResponse<List<Map<String, Object>>> response = ApiResponse
                    .success("Top consultants retrieved successfully", consultants);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            ApiResponse<List<Map<String, Object>>> response = ApiResponse
                    .error("Failed to retrieve top consultants: " + e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    @GetMapping("/stats/top-sti-services")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getTopSTIServices(
            @RequestParam(value = "limit", defaultValue = "10") int limit,
            @RequestParam(value = "startDate", required = false) String startDateStr,
            @RequestParam(value = "endDate", required = false) String endDateStr) {

        try {
            LocalDateTime startDate = null;
            LocalDateTime endDate = null;

            if (startDateStr != null && endDateStr != null) {
                startDate = LocalDateTime.parse(startDateStr + "T00:00:00");
                endDate = LocalDateTime.parse(endDateStr + "T23:59:59");
            }

            List<Map<String, Object>> services = adminStatsService.getTopSTIServices(limit, startDate, endDate);
            ApiResponse<List<Map<String, Object>>> response = ApiResponse
                    .success("Top STI services retrieved successfully", services);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            ApiResponse<List<Map<String, Object>>> response = ApiResponse
                    .error("Failed to retrieve top STI services: " + e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    @GetMapping("/stats/top-sti-packages")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getTopSTIPackages(
            @RequestParam(value = "limit", defaultValue = "10") int limit,
            @RequestParam(value = "startDate", required = false) String startDateStr,
            @RequestParam(value = "endDate", required = false) String endDateStr) {

        try {
            LocalDateTime startDate = null;
            LocalDateTime endDate = null;

            if (startDateStr != null && endDateStr != null) {
                startDate = LocalDateTime.parse(startDateStr + "T00:00:00");
                endDate = LocalDateTime.parse(endDateStr + "T23:59:59");
            }

            List<Map<String, Object>> packages = adminStatsService.getTopSTIPackages(limit, startDate, endDate);
            ApiResponse<List<Map<String, Object>>> response = ApiResponse
                    .success("Top STI packages retrieved successfully", packages);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            ApiResponse<List<Map<String, Object>>> response = ApiResponse
                    .error("Failed to retrieve top STI packages: " + e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    @GetMapping("/stats/revenue-distribution")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getRevenueDistribution() {

        try {
            List<Map<String, Object>> distribution = adminStatsService.getRevenueDistribution();
            ApiResponse<List<Map<String, Object>>> response = ApiResponse
                    .success("Revenue distribution retrieved successfully", distribution);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            ApiResponse<List<Map<String, Object>>> response = ApiResponse
                    .error("Failed to retrieve revenue distribution: " + e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    private <T> ResponseEntity<ApiResponse<T>> getResponseEntity(ApiResponse<T> response) {
        if (response.isSuccess()) {
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.badRequest().body(response);
        }
    }
}