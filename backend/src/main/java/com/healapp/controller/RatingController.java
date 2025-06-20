package com.healapp.controller;

import com.healapp.dto.*;
import com.healapp.model.Rating;
import com.healapp.service.RatingService;
import com.healapp.service.UserService;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/ratings")
public class RatingController {

    @Autowired
    private RatingService ratingService;

    @Autowired
    private UserService userService;

    // ===================== CUSTOMER ENDPOINTS =====================

    /**
     * Đánh giá consultant
     */
    @PostMapping("/consultant/{consultantId}")
    @PreAuthorize("hasRole('ROLE_CUSTOMER')")
    public ResponseEntity<ApiResponse<RatingResponse>> rateConsultant(
            @PathVariable Long consultantId,
            @Valid @RequestBody CreateRatingRequest request) {

        try {
            String username = SecurityContextHolder.getContext().getAuthentication().getName();
            Long userId = userService.getUserIdByUsername(username);

            if (userId == null) {
                return ResponseEntity.badRequest()
                        .body(ApiResponse.error("User not found"));
            }

            ApiResponse<RatingResponse> response = ratingService.createRating(
                    userId, Rating.RatingTargetType.CONSULTANT, consultantId, request);

            if (response.isSuccess()) {
                return ResponseEntity.ok(response);
            } else {
                return ResponseEntity.badRequest().body(response);
            }

        } catch (Exception e) {
            log.error("Error rating consultant: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.error("Internal server error"));
        }
    }

    /**
     * Đánh giá STI service
     */
    @PostMapping("/sti-service/{serviceId}")
    @PreAuthorize("hasRole('ROLE_CUSTOMER')")
    public ResponseEntity<ApiResponse<RatingResponse>> rateSTIService(
            @PathVariable Long serviceId,
            @Valid @RequestBody CreateRatingRequest request) {

        try {
            String username = SecurityContextHolder.getContext().getAuthentication().getName();
            Long userId = userService.getUserIdByUsername(username);

            if (userId == null) {
                return ResponseEntity.badRequest()
                        .body(ApiResponse.error("User not found"));
            }

            ApiResponse<RatingResponse> response = ratingService.createRating(
                    userId, Rating.RatingTargetType.STI_SERVICE, serviceId, request);

            if (response.isSuccess()) {
                return ResponseEntity.ok(response);
            } else {
                return ResponseEntity.badRequest().body(response);
            }

        } catch (Exception e) {
            log.error("Error rating STI service: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.error("Internal server error"));
        }
    }

    /**
     * Đánh giá STI package
     */
    @PostMapping("/sti-package/{packageId}")
    @PreAuthorize("hasRole('ROLE_CUSTOMER')")
    public ResponseEntity<ApiResponse<RatingResponse>> rateSTIPackage(
            @PathVariable Long packageId,
            @Valid @RequestBody CreateRatingRequest request) {

        try {
            String username = SecurityContextHolder.getContext().getAuthentication().getName();
            Long userId = userService.getUserIdByUsername(username);

            if (userId == null) {
                return ResponseEntity.badRequest()
                        .body(ApiResponse.error("User not found"));
            }

            ApiResponse<RatingResponse> response = ratingService.createRating(
                    userId, Rating.RatingTargetType.STI_PACKAGE, packageId, request);

            if (response.isSuccess()) {
                return ResponseEntity.ok(response);
            } else {
                return ResponseEntity.badRequest().body(response);
            }

        } catch (Exception e) {
            log.error("Error rating STI package: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.error("Internal server error"));
        }
    }

    /**
     * Cập nhật rating
     */
    @PutMapping("/{ratingId}")
    @PreAuthorize("hasAnyRole('ROLE_CUSTOMER', 'ROLE_CONSULTANT', 'ROLE_STAFF', 'ROLE_ADMIN')")
    public ResponseEntity<ApiResponse<RatingResponse>> updateRating(
            @PathVariable Long ratingId,
            @Valid @RequestBody UpdateRatingRequest request) {

        try {
            String username = SecurityContextHolder.getContext().getAuthentication().getName();
            Long userId = userService.getUserIdByUsername(username);

            if (userId == null) {
                return ResponseEntity.badRequest()
                        .body(ApiResponse.error("User not found"));
            }

            ApiResponse<RatingResponse> response = ratingService.updateRating(userId, ratingId, request);

            if (response.isSuccess()) {
                return ResponseEntity.ok(response);
            } else {
                return ResponseEntity.badRequest().body(response);
            }

        } catch (Exception e) {
            log.error("Error updating rating: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.error("Internal server error"));
        }
    }

    /**
     * Xóa rating
     */
    @DeleteMapping("/{ratingId}")
    @PreAuthorize("hasAnyRole('ROLE_CUSTOMER', 'ROLE_CONSULTANT', 'ROLE_STAFF', 'ROLE_ADMIN')")
    public ResponseEntity<ApiResponse<String>> deleteRating(@PathVariable Long ratingId) {

        try {
            String username = SecurityContextHolder.getContext().getAuthentication().getName();
            Long userId = userService.getUserIdByUsername(username);

            if (userId == null) {
                return ResponseEntity.badRequest()
                        .body(ApiResponse.error("User not found"));
            }

            ApiResponse<String> response = ratingService.deleteRating(userId, ratingId);

            if (response.isSuccess()) {
                return ResponseEntity.ok(response);
            } else {
                return ResponseEntity.badRequest().body(response);
            }

        } catch (Exception e) {
            log.error("Error deleting rating: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.error("Internal server error"));
        }
    }

    /**
     * Lấy ratings của user hiện tại
     */
    @GetMapping("/my-ratings")
    @PreAuthorize("hasAnyRole('ROLE_CUSTOMER', 'ROLE_CONSULTANT', 'ROLE_STAFF', 'ROLE_ADMIN')")
    public ResponseEntity<ApiResponse<Page<RatingResponse>>> getMyRatings(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        try {
            String username = SecurityContextHolder.getContext().getAuthentication().getName();
            Long userId = userService.getUserIdByUsername(username);

            if (userId == null) {
                return ResponseEntity.badRequest()
                        .body(ApiResponse.error("User not found"));
            }

            ApiResponse<Page<RatingResponse>> response = ratingService.getUserRatings(userId, page, size);

            if (response.isSuccess()) {
                return ResponseEntity.ok(response);
            } else {
                return ResponseEntity.badRequest().body(response);
            }

        } catch (Exception e) {
            log.error("Error getting user ratings: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.error("Internal server error"));
        }
    }

    /**
     * Kiểm tra có thể đánh giá không
     */
    @GetMapping("/can-rate/{targetType}/{targetId}")
    @PreAuthorize("hasRole('ROLE_CUSTOMER')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> canRate(
            @PathVariable String targetType,
            @PathVariable Long targetId) {

        try {
            String username = SecurityContextHolder.getContext().getAuthentication().getName();
            Long userId = userService.getUserIdByUsername(username);

            if (userId == null) {
                return ResponseEntity.badRequest()
                        .body(ApiResponse.error("User not found"));
            }

            Rating.RatingTargetType type = Rating.RatingTargetType.valueOf(targetType.toUpperCase());
            ApiResponse<Map<String, Object>> response = ratingService.checkRatingEligibility(userId, type, targetId);

            if (response.isSuccess()) {
                return ResponseEntity.ok(response);
            } else {
                return ResponseEntity.badRequest().body(response);
            }

        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Invalid target type"));
        } catch (Exception e) {
            log.error("Error checking rating eligibility: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.error("Internal server error"));
        }
    }

    // ===================== PUBLIC ENDPOINTS =====================

    /**
     * Lấy ratings của consultant
     */
    @GetMapping("/consultant/{consultantId}")
    public ResponseEntity<ApiResponse<Page<RatingResponse>>> getConsultantRatings(
            @PathVariable Long consultantId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "newest") String sort,
            @RequestParam(required = false) Integer filterRating,
            @RequestParam(required = false) String keyword) {

        try {
            ApiResponse<Page<RatingResponse>> response = ratingService.getRatings(
                    Rating.RatingTargetType.CONSULTANT, consultantId, page, size, sort, filterRating, keyword);

            if (response.isSuccess()) {
                return ResponseEntity.ok(response);
            } else {
                return ResponseEntity.badRequest().body(response);
            }

        } catch (Exception e) {
            log.error("Error getting consultant ratings: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.error("Internal server error"));
        }
    }

    /**
     * Lấy ratings của STI service
     */
    @GetMapping("/sti-service/{serviceId}")
    public ResponseEntity<ApiResponse<Page<RatingResponse>>> getSTIServiceRatings(
            @PathVariable Long serviceId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "newest") String sort,
            @RequestParam(required = false) Integer filterRating,
            @RequestParam(required = false) String keyword) {

        try {
            ApiResponse<Page<RatingResponse>> response = ratingService.getRatings(
                    Rating.RatingTargetType.STI_SERVICE, serviceId, page, size, sort, filterRating, keyword);

            if (response.isSuccess()) {
                return ResponseEntity.ok(response);
            } else {
                return ResponseEntity.badRequest().body(response);
            }

        } catch (Exception e) {
            log.error("Error getting STI service ratings: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.error("Internal server error"));
        }
    }

    /**
     * Lấy ratings của STI package
     */
    @GetMapping("/sti-package/{packageId}")
    public ResponseEntity<ApiResponse<Page<RatingResponse>>> getSTIPackageRatings(
            @PathVariable Long packageId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "newest") String sort,
            @RequestParam(required = false) Integer filterRating,
            @RequestParam(required = false) String keyword) {

        try {
            ApiResponse<Page<RatingResponse>> response = ratingService.getRatings(
                    Rating.RatingTargetType.STI_PACKAGE, packageId, page, size, sort, filterRating, keyword);

            if (response.isSuccess()) {
                return ResponseEntity.ok(response);
            } else {
                return ResponseEntity.badRequest().body(response);
            }

        } catch (Exception e) {
            log.error("Error getting STI package ratings: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.error("Internal server error"));
        }
    }

    /**
     * Lấy rating summary của consultant
     */
    @GetMapping("/summary/consultant/{consultantId}")
    public ResponseEntity<ApiResponse<RatingSummaryResponse>> getConsultantRatingSummary(
            @PathVariable Long consultantId,
            @RequestParam(defaultValue = "false") boolean includeRecentReviews) {

        try {
            ApiResponse<RatingSummaryResponse> response = ratingService.getRatingSummary(
                    Rating.RatingTargetType.CONSULTANT, consultantId, includeRecentReviews);

            if (response.isSuccess()) {
                return ResponseEntity.ok(response);
            } else {
                return ResponseEntity.badRequest().body(response);
            }

        } catch (Exception e) {
            log.error("Error getting consultant rating summary: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.error("Internal server error"));
        }
    }

    /**
     * Lấy rating summary của STI service
     */
    @GetMapping("/summary/sti-service/{serviceId}")
    public ResponseEntity<ApiResponse<RatingSummaryResponse>> getSTIServiceRatingSummary(
            @PathVariable Long serviceId,
            @RequestParam(defaultValue = "false") boolean includeRecentReviews) {

        try {
            ApiResponse<RatingSummaryResponse> response = ratingService.getRatingSummary(
                    Rating.RatingTargetType.STI_SERVICE, serviceId, includeRecentReviews);

            if (response.isSuccess()) {
                return ResponseEntity.ok(response);
            } else {
                return ResponseEntity.badRequest().body(response);
            }

        } catch (Exception e) {
            log.error("Error getting STI service rating summary: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.error("Internal server error"));
        }
    }

    /**
     * Lấy rating summary của STI package
     */
    @GetMapping("/summary/sti-package/{packageId}")
    public ResponseEntity<ApiResponse<RatingSummaryResponse>> getSTIPackageRatingSummary(
            @PathVariable Long packageId,
            @RequestParam(defaultValue = "false") boolean includeRecentReviews) {

        try {
            ApiResponse<RatingSummaryResponse> response = ratingService.getRatingSummary(
                    Rating.RatingTargetType.STI_PACKAGE, packageId, includeRecentReviews);

            if (response.isSuccess()) {
                return ResponseEntity.ok(response);
            } else {
                return ResponseEntity.badRequest().body(response);
            }

        } catch (Exception e) {
            log.error("Error getting STI package rating summary: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.error("Internal server error"));
        }
    }

    // ===================== STAFF MANAGEMENT ENDPOINTS =====================

    /**
     * Staff - Lấy tất cả ratings (cho quản lý)
     */
    @GetMapping("/staff/all")
    @PreAuthorize("hasAnyRole('ROLE_STAFF', 'ROLE_ADMIN')")
    public ResponseEntity<ApiResponse<Page<RatingResponse>>> getAllRatings(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "newest") String sort,
            @RequestParam(required = false) Integer filterRating,
            @RequestParam(required = false) String keyword) {

        try {
            ApiResponse<Page<RatingResponse>> response = ratingService.getAllRatings(
                    page, size, sort, filterRating, keyword);

            if (response.isSuccess()) {
                return ResponseEntity.ok(response);
            } else {
                return ResponseEntity.badRequest().body(response);
            }

        } catch (Exception e) {
            log.error("Error getting all ratings: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.error("Internal server error"));
        }
    }

    /**
     * Staff - Lấy tất cả consultation ratings
     */
    @GetMapping("/staff/consultation")
    @PreAuthorize("hasAnyRole('ROLE_STAFF', 'ROLE_ADMIN')")
    public ResponseEntity<ApiResponse<Page<RatingResponse>>> getConsultationRatings(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "newest") String sort,
            @RequestParam(required = false) Integer filterRating,
            @RequestParam(required = false) String keyword) {

        try {
            ApiResponse<Page<RatingResponse>> response = ratingService.getConsultationRatings(
                    page, size, sort, filterRating, keyword);

            if (response.isSuccess()) {
                return ResponseEntity.ok(response);
            } else {
                return ResponseEntity.badRequest().body(response);
            }

        } catch (Exception e) {
            log.error("Error getting consultation ratings: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.error("Internal server error"));
        }
    }

    /**
     * Staff - Lấy tất cả STI service ratings
     */
    @GetMapping("/staff/sti-service")
    @PreAuthorize("hasAnyRole('ROLE_STAFF', 'ROLE_ADMIN')")
    public ResponseEntity<ApiResponse<Page<RatingResponse>>> getSTIServiceRatings(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "newest") String sort,
            @RequestParam(required = false) Integer filterRating,
            @RequestParam(required = false) String keyword) {

        try {
            ApiResponse<Page<RatingResponse>> response = ratingService.getSTIServiceRatings(
                    page, size, sort, filterRating, keyword);

            if (response.isSuccess()) {
                return ResponseEntity.ok(response);
            } else {
                return ResponseEntity.badRequest().body(response);
            }

        } catch (Exception e) {
            log.error("Error getting STI service ratings: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.error("Internal server error"));
        }
    }

    /**
     * Staff - Lấy danh sách ratings của STI package (cho quản lý)
     */
    @GetMapping("/staff/sti-package")
    @PreAuthorize("hasAnyRole('ROLE_STAFF', 'ROLE_ADMIN')")
    public ResponseEntity<ApiResponse<Page<RatingResponse>>> getSTIPackageRatings(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "newest") String sort,
            @RequestParam(required = false) Integer filterRating,
            @RequestParam(required = false) String keyword) {

        try {
            ApiResponse<Page<RatingResponse>> response = ratingService.getSTIPackageRatings(
                    page, size, sort, filterRating, keyword);

            if (response.isSuccess()) {
                return ResponseEntity.ok(response);
            } else {
                return ResponseEntity.badRequest().body(response);
            }

        } catch (Exception e) {
            log.error("Error getting STI package ratings: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.error("Internal server error"));
        }
    }

    /**
     * Staff - Lấy tổng hợp tất cả ratings
     */
    @GetMapping("/staff/summary/all")
    @PreAuthorize("hasAnyRole('ROLE_STAFF', 'ROLE_ADMIN')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getAllRatingSummary() {
        try {
            ApiResponse<Map<String, Object>> response = ratingService.getAllRatingSummary();

            if (response.isSuccess()) {
                return ResponseEntity.ok(response);
            } else {
                return ResponseEntity.badRequest().body(response);
            }

        } catch (Exception e) {
            log.error("Error getting all ratings summary: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.error("Internal server error"));
        }
    }

    /**
     * Staff - Lấy tổng hợp consultation ratings
     */
    @GetMapping("/staff/summary/consultation")
    @PreAuthorize("hasAnyRole('ROLE_STAFF', 'ROLE_ADMIN')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getConsultationRatingSummary() {
        try {
            ApiResponse<Map<String, Object>> response = ratingService.getConsultationRatingSummary();

            if (response.isSuccess()) {
                return ResponseEntity.ok(response);
            } else {
                return ResponseEntity.badRequest().body(response);
            }

        } catch (Exception e) {
            log.error("Error getting consultation ratings summary: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.error("Internal server error"));
        }
    }

    /**
     * Staff - Lấy tổng hợp STI service ratings
     */
    @GetMapping("/staff/summary/sti-service")
    @PreAuthorize("hasAnyRole('ROLE_STAFF', 'ROLE_ADMIN')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getSTIServiceRatingSummary() {
        try {
            ApiResponse<Map<String, Object>> response = ratingService.getSTIServiceRatingSummary();

            if (response.isSuccess()) {
                return ResponseEntity.ok(response);
            } else {
                return ResponseEntity.badRequest().body(response);
            }

        } catch (Exception e) {
            log.error("Error getting STI service ratings summary: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.error("Internal server error"));
        }
    }

    /**
     * Staff - Lấy tổng hợp STI package ratings
     */
    @GetMapping("/staff/summary/sti-package")
    @PreAuthorize("hasAnyRole('ROLE_STAFF', 'ROLE_ADMIN')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getSTIPackageRatingSummary() {
        try {
            ApiResponse<Map<String, Object>> response = ratingService.getSTIPackageRatingSummary();

            if (response.isSuccess()) {
                return ResponseEntity.ok(response);
            } else {
                return ResponseEntity.badRequest().body(response);
            }

        } catch (Exception e) {
            log.error("Error getting STI package ratings summary: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.error("Internal server error"));
        }
    }

    /**
     * Staff - Reply to rating
     */
    @PostMapping("/staff/reply/{ratingId}")
    @PreAuthorize("hasAnyRole('ROLE_STAFF', 'ROLE_ADMIN')")
    public ResponseEntity<ApiResponse<RatingResponse>> replyToRating(
            @PathVariable Long ratingId,
            @Valid @RequestBody StaffReplyRequest request) {

        try {
            String username = SecurityContextHolder.getContext().getAuthentication().getName();
            Long staffId = userService.getUserIdByUsername(username);

            if (staffId == null) {
                return ResponseEntity.badRequest()
                        .body(ApiResponse.error("Staff not found"));
            }

            ApiResponse<RatingResponse> response = ratingService.replyToRating(staffId, ratingId, request);

            if (response.isSuccess()) {
                return ResponseEntity.ok(response);
            } else {
                return ResponseEntity.badRequest().body(response);
            }

        } catch (Exception e) {
            log.error("Error replying to rating: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.error("Internal server error"));
        }
    }

    /**
     * Staff - Update reply
     */
    @PutMapping("/staff/reply/{ratingId}")
    @PreAuthorize("hasAnyRole('ROLE_STAFF', 'ROLE_ADMIN')")
    public ResponseEntity<ApiResponse<RatingResponse>> updateStaffReply(
            @PathVariable Long ratingId,
            @Valid @RequestBody StaffReplyRequest request) {

        try {
            String username = SecurityContextHolder.getContext().getAuthentication().getName();
            Long staffId = userService.getUserIdByUsername(username);

            if (staffId == null) {
                return ResponseEntity.badRequest()
                        .body(ApiResponse.error("Staff not found"));
            }

            ApiResponse<RatingResponse> response = ratingService.updateStaffReply(staffId, ratingId, request);

            if (response.isSuccess()) {
                return ResponseEntity.ok(response);
            } else {
                return ResponseEntity.badRequest().body(response);
            }

        } catch (Exception e) {
            log.error("Error updating staff reply: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.error("Internal server error"));
        }
    }

    /**
     * Staff - Delete reply
     */
    @DeleteMapping("/staff/reply/{ratingId}")
    @PreAuthorize("hasAnyRole('ROLE_STAFF', 'ROLE_ADMIN')")
    public ResponseEntity<ApiResponse<String>> deleteStaffReply(@PathVariable Long ratingId) {
        try {
            String username = SecurityContextHolder.getContext().getAuthentication().getName();
            Long staffId = userService.getUserIdByUsername(username);

            if (staffId == null) {
                return ResponseEntity.badRequest()
                        .body(ApiResponse.error("Staff not found"));
            }

            ApiResponse<String> response = ratingService.deleteStaffReply(staffId, ratingId);

            if (response.isSuccess()) {
                return ResponseEntity.ok(response);
            } else {
                return ResponseEntity.badRequest().body(response);
            }

        } catch (Exception e) {
            log.error("Error deleting staff reply: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.error("Internal server error"));
        }
    }
}
