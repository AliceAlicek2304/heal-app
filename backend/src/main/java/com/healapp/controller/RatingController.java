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
}
