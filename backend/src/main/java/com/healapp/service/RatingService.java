package com.healapp.service;

import com.healapp.dto.*;
import com.healapp.model.Rating;
import com.healapp.model.RatingSummary;
import com.healapp.model.UserDtls;
import com.healapp.repository.RatingRepository;
import com.healapp.repository.RatingSummaryRepository;
import com.healapp.repository.UserRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
public class RatingService {

    @Autowired
    private RatingRepository ratingRepository;

    @Autowired
    private RatingSummaryRepository ratingSummaryRepository;

    @Autowired
    private UserRepository userRepository;

    // ===================== CUSTOMER METHODS =====================

    /**
     * Tạo rating mới
     */
    @Transactional
    public ApiResponse<RatingResponse> createRating(Long userId, Rating.RatingTargetType targetType,
            Long targetId, CreateRatingRequest request) {
        try {
            // Kiểm tra user tồn tại
            Optional<UserDtls> userOpt = userRepository.findById(userId);
            if (userOpt.isEmpty()) {
                return ApiResponse.error("User not found");
            }

            UserDtls user = userOpt.get();

            // Kiểm tra đã đánh giá chưa
            if (ratingRepository.existsByUserIdAndTargetTypeAndTargetId(userId, targetType, targetId)) {
                return ApiResponse.error("You have already rated this " + targetType.name().toLowerCase());
            } // Kiểm tra điều kiện được phép đánh giá
            if (!isEligibleToRate(userId, targetType, targetId)) {
                return ApiResponse.error("You are not eligible to rate this " + targetType.name().toLowerCase());
            }

            // Tạo rating mới
            Rating rating = new Rating(user, targetType, targetId, request.getRating(), request.getComment());
            Rating savedRating = ratingRepository.save(rating);

            // Cập nhật rating summary (async)
            updateRatingSummaryAsync(targetType, targetId);

            RatingResponse response = mapRatingToResponse(savedRating);
            return ApiResponse.success("Rating created successfully", response);

        } catch (Exception e) {
            log.error("Error creating rating: {}", e.getMessage(), e);
            return ApiResponse.error("Unable to create rating: " + e.getMessage());
        }
    }

    /**
     * Cập nhật rating (trong 24h)
     */
    @Transactional
    public ApiResponse<RatingResponse> updateRating(Long userId, Long ratingId, UpdateRatingRequest request) {
        try {
            Optional<Rating> ratingOpt = ratingRepository.findById(ratingId);
            if (ratingOpt.isEmpty()) {
                return ApiResponse.error("Rating not found");
            }

            Rating rating = ratingOpt.get();

            // Kiểm tra quyền sở hữu
            if (!rating.getUser().getId().equals(userId)) {
                return ApiResponse.error("You can only update your own ratings");
            }

            // Kiểm tra thời gian (24h)
            if (rating.getCreatedAt().isBefore(LocalDateTime.now().minusHours(24))) {
                return ApiResponse.error("You can only update ratings within 24 hours of creation");
            }

            // Cập nhật
            rating.setRating(request.getRating());
            rating.setComment(request.getComment());
            rating.setUpdatedAt(LocalDateTime.now());

            Rating savedRating = ratingRepository.save(rating);

            // Cập nhật summary
            updateRatingSummaryAsync(rating.getTargetType(), rating.getTargetId());

            RatingResponse response = mapRatingToResponse(savedRating);
            return ApiResponse.success("Rating updated successfully", response);

        } catch (Exception e) {
            log.error("Error updating rating: {}", e.getMessage(), e);
            return ApiResponse.error("Unable to update rating: " + e.getMessage());
        }
    }

    /**
     * Xóa rating (trong 24h)
     */
    @Transactional
    public ApiResponse<String> deleteRating(Long userId, Long ratingId) {
        try {
            Optional<Rating> ratingOpt = ratingRepository.findById(ratingId);
            if (ratingOpt.isEmpty()) {
                return ApiResponse.error("Rating not found");
            }

            Rating rating = ratingOpt.get();

            // Kiểm tra quyền sở hữu
            if (!rating.getUser().getId().equals(userId)) {
                return ApiResponse.error("You can only delete your own ratings");
            }

            // Kiểm tra thời gian (24h)
            if (rating.getCreatedAt().isBefore(LocalDateTime.now().minusHours(24))) {
                return ApiResponse.error("You can only delete ratings within 24 hours of creation");
            }

            // Soft delete
            rating.setIsActive(false);
            rating.setUpdatedAt(LocalDateTime.now());
            ratingRepository.save(rating);

            // Cập nhật summary
            updateRatingSummaryAsync(rating.getTargetType(), rating.getTargetId());

            return ApiResponse.success("Rating deleted successfully", null);

        } catch (Exception e) {
            log.error("Error deleting rating: {}", e.getMessage(), e);
            return ApiResponse.error("Unable to delete rating: " + e.getMessage());
        }
    }

    /**
     * Lấy ratings của user
     */
    public ApiResponse<Page<RatingResponse>> getUserRatings(Long userId, int page, int size) {
        try {
            Pageable pageable = PageRequest.of(page, size);
            Page<Rating> ratings = ratingRepository.findByUserIdAndIsActiveTrueOrderByCreatedAtDesc(userId, pageable);

            Page<RatingResponse> response = ratings.map(this::mapRatingToResponse);
            return ApiResponse.success("User ratings retrieved successfully", response);

        } catch (Exception e) {
            log.error("Error getting user ratings: {}", e.getMessage(), e);
            return ApiResponse.error("Unable to get user ratings: " + e.getMessage());
        }
    }

    // ===================== PUBLIC METHODS =====================

    /**
     * Lấy ratings của target với filter và sort
     */
    public ApiResponse<Page<RatingResponse>> getRatings(Rating.RatingTargetType targetType, Long targetId,
            int page, int size, String sort, Integer filterRating,
            String keyword) {
        try {
            // Tạo sort
            Sort sortOrder = createSort(sort);
            Pageable pageable = PageRequest.of(page, size, sortOrder);

            Page<Rating> ratings;

            if (keyword != null && !keyword.trim().isEmpty()) {
                // Tìm kiếm trong comment
                ratings = ratingRepository.searchInComments(targetType, targetId, keyword.trim(), pageable);
            } else if (filterRating != null && filterRating >= 1 && filterRating <= 5) {
                // Filter theo rating
                ratings = ratingRepository.findByTargetTypeAndTargetIdAndRatingAndIsActiveTrue(
                        targetType, targetId, filterRating, pageable);
            } else {
                // Lấy tất cả
                ratings = ratingRepository.findByTargetTypeAndTargetIdAndIsActiveTrue(targetType, targetId, pageable);
            }

            Page<RatingResponse> response = ratings.map(this::mapRatingToResponse);
            return ApiResponse.success("Ratings retrieved successfully", response);

        } catch (Exception e) {
            log.error("Error getting ratings: {}", e.getMessage(), e);
            return ApiResponse.error("Unable to get ratings: " + e.getMessage());
        }
    }

    /**
     * Lấy rating summary
     */
    public ApiResponse<RatingSummaryResponse> getRatingSummary(Rating.RatingTargetType targetType, Long targetId,
            boolean includeRecentReviews) {
        try {
            Optional<RatingSummary> summaryOpt = ratingSummaryRepository.findByTargetTypeAndTargetId(targetType,
                    targetId);

            RatingSummaryResponse response;
            if (summaryOpt.isPresent()) {
                RatingSummary summary = summaryOpt.get();
                response = new RatingSummaryResponse(
                        summary.getTargetType(),
                        summary.getTargetId(),
                        summary.getTotalRatings(),
                        summary.getAverageRating());
                response.setStarCounts(
                        summary.getFiveStarCount(),
                        summary.getFourStarCount(),
                        summary.getThreeStarCount(),
                        summary.getTwoStarCount(),
                        summary.getOneStarCount());
            } else {
                // Chưa có rating nào
                response = new RatingSummaryResponse(targetType, targetId, 0, BigDecimal.ZERO);
                response.setStarCounts(0, 0, 0, 0, 0);
            }

            // Thêm recent reviews nếu cần
            if (includeRecentReviews) {
                List<Rating> recentRatings = ratingRepository.findTopRatingsWithComments(
                        targetType, targetId, PageRequest.of(0, 5));
                List<RatingResponse> recentResponses = recentRatings.stream()
                        .map(this::mapRatingToResponse)
                        .collect(Collectors.toList());
                response.setRecentRatings(recentResponses);
            }

            return ApiResponse.success("Rating summary retrieved successfully", response);

        } catch (Exception e) {
            log.error("Error getting rating summary: {}", e.getMessage(), e);
            return ApiResponse.error("Unable to get rating summary: " + e.getMessage());
        }
    }

    /**
     * Kiểm tra user có thể đánh giá không
     */
    public ApiResponse<Map<String, Object>> checkRatingEligibility(Long userId, Rating.RatingTargetType targetType,
            Long targetId) {
        try {
            Map<String, Object> result = new HashMap<>();

            boolean canRate = isEligibleToRate(userId, targetType, targetId);
            boolean hasRated = ratingRepository.existsByUserIdAndTargetTypeAndTargetId(userId, targetType, targetId);

            result.put("canRate", canRate && !hasRated);
            result.put("hasRated", hasRated);
            result.put("reason", canRate ? "Eligible to rate" : "Not eligible to rate");

            return ApiResponse.success("Check completed", result);

        } catch (Exception e) {
            log.error("Error checking rating eligibility: {}", e.getMessage(), e);
            return ApiResponse.error("Unable to check rating eligibility: " + e.getMessage());
        }
    }

    // ===================== STAFF METHODS =====================

    /**
     * Staff reply to rating
     */
    @Transactional
    public ApiResponse<RatingResponse> replyToRating(Long staffId, Long ratingId, StaffReplyRequest request) {
        try {
            // Kiểm tra staff tồn tại và có role STAFF
            Optional<UserDtls> staffOpt = userRepository.findById(staffId);
            if (staffOpt.isEmpty()) {
                return ApiResponse.error("Staff not found");
            }

            UserDtls staff = staffOpt.get();
            if (!"STAFF".equals(staff.getRoleName()) && !"ADMIN".equals(staff.getRoleName())) {
                return ApiResponse.error("Only staff members can reply to ratings");
            }

            // Kiểm tra rating tồn tại
            Optional<Rating> ratingOpt = ratingRepository.findById(ratingId);
            if (ratingOpt.isEmpty()) {
                return ApiResponse.error("Rating not found");
            }

            Rating rating = ratingOpt.get();

            // Cập nhật staff reply
            rating.setStaffReply(request.getStaffReply());
            rating.setRepliedBy(staff);
            rating.setRepliedAt(LocalDateTime.now());
            rating.setUpdatedAt(LocalDateTime.now());

            Rating savedRating = ratingRepository.save(rating);
            RatingResponse response = mapRatingToResponse(savedRating);

            return ApiResponse.success("Staff reply added successfully", response);

        } catch (Exception e) {
            log.error("Error adding staff reply: {}", e.getMessage(), e);
            return ApiResponse.error("Unable to add staff reply: " + e.getMessage());
        }
    }

    /**
     * Cập nhật staff reply
     */
    @Transactional
    public ApiResponse<RatingResponse> updateStaffReply(Long staffId, Long ratingId, StaffReplyRequest request) {
        try {
            // Kiểm tra staff tồn tại và có role STAFF
            Optional<UserDtls> staffOpt = userRepository.findById(staffId);
            if (staffOpt.isEmpty()) {
                return ApiResponse.error("Staff not found");
            }

            UserDtls staff = staffOpt.get();
            if (!"STAFF".equals(staff.getRoleName()) && !"ADMIN".equals(staff.getRoleName())) {
                return ApiResponse.error("Only staff members can update replies");
            }

            // Kiểm tra rating tồn tại
            Optional<Rating> ratingOpt = ratingRepository.findById(ratingId);
            if (ratingOpt.isEmpty()) {
                return ApiResponse.error("Rating not found");
            }

            Rating rating = ratingOpt.get();

            // Kiểm tra đã có reply chưa
            if (rating.getStaffReply() == null) {
                return ApiResponse.error("No existing reply to update");
            }

            // Cập nhật reply
            rating.setStaffReply(request.getStaffReply());
            rating.setRepliedBy(staff);
            rating.setRepliedAt(LocalDateTime.now());
            rating.setUpdatedAt(LocalDateTime.now());

            Rating savedRating = ratingRepository.save(rating);
            RatingResponse response = mapRatingToResponse(savedRating);

            return ApiResponse.success("Staff reply updated successfully", response);

        } catch (Exception e) {
            log.error("Error updating staff reply: {}", e.getMessage(), e);
            return ApiResponse.error("Unable to update staff reply: " + e.getMessage());
        }
    }

    /**
     * Xóa staff reply
     */
    @Transactional
    public ApiResponse<String> deleteStaffReply(Long staffId, Long ratingId) {
        try {
            // Kiểm tra staff tồn tại và có role STAFF
            Optional<UserDtls> staffOpt = userRepository.findById(staffId);
            if (staffOpt.isEmpty()) {
                return ApiResponse.error("Staff not found");
            }

            UserDtls staff = staffOpt.get();
            if (!"STAFF".equals(staff.getRoleName()) && !"ADMIN".equals(staff.getRoleName())) {
                return ApiResponse.error("Only staff members can delete replies");
            }

            // Kiểm tra rating tồn tại
            Optional<Rating> ratingOpt = ratingRepository.findById(ratingId);
            if (ratingOpt.isEmpty()) {
                return ApiResponse.error("Rating not found");
            }

            Rating rating = ratingOpt.get();

            // Kiểm tra đã có reply chưa
            if (rating.getStaffReply() == null) {
                return ApiResponse.error("No existing reply to delete");
            }

            // Xóa reply
            rating.setStaffReply(null);
            rating.setRepliedBy(null);
            rating.setRepliedAt(null);
            rating.setUpdatedAt(LocalDateTime.now());

            ratingRepository.save(rating);

            return ApiResponse.success("Staff reply deleted successfully", null);

        } catch (Exception e) {
            log.error("Error deleting staff reply: {}", e.getMessage(), e);
            return ApiResponse.error("Unable to delete staff reply: " + e.getMessage());
        }
    }

    /**
     * Lấy danh sách ratings chưa có reply
     */
    public ApiResponse<Page<RatingResponse>> getPendingReplyRatings(Rating.RatingTargetType targetType,
            Long targetId, int page, int size) {
        try {
            Pageable pageable = PageRequest.of(page, size);

            // Get all pending reply ratings for the target
            List<Rating> pendingRatings = ratingRepository.findPendingReplyRatings(targetType, targetId);

            // Convert to Page manually (simple implementation)
            int start = (int) pageable.getOffset();
            int end = Math.min((start + pageable.getPageSize()), pendingRatings.size());

            List<Rating> pageContent = pendingRatings.subList(start, end);
            List<RatingResponse> responses = pageContent.stream()
                    .map(this::mapRatingToResponse)
                    .toList();

            // Create a simple page response wrapper
            return ApiResponse.success("Pending reply ratings retrieved successfully",
                    new org.springframework.data.domain.PageImpl<>(responses, pageable, pendingRatings.size()));

        } catch (Exception e) {
            log.error("Error getting pending reply ratings: {}", e.getMessage(), e);
            return ApiResponse.error("Unable to get pending reply ratings: " + e.getMessage());
        }
    }

    // ===================== PRIVATE HELPER METHODS =====================

    private boolean isEligibleToRate(Long userId, Rating.RatingTargetType targetType, Long targetId) {
        // TODO: Implement business logic based on target type
        if (targetType == Rating.RatingTargetType.CONSULTANT) {
            // Kiểm tra có consultation hoàn thành với consultant không
            return hasCompletedConsultation(userId, targetId);
        } else if (targetType == Rating.RatingTargetType.STI_SERVICE) {
            // Kiểm tra có order STI service hoàn thành không
            return hasCompletedSTIOrder(userId, targetId);
        }
        return false;
    }

    private boolean hasCompletedConsultation(Long userId, Long consultantId) {
        // TODO: Implement - check consultation repository
        // For now, return true for demo
        return true;
    }

    private boolean hasCompletedSTIOrder(Long userId, Long serviceId) {
        // TODO: Implement - check STI order repository
        // For now, return true for demo
        return true;
    }

    @Async
    public void updateRatingSummaryAsync(Rating.RatingTargetType targetType, Long targetId) {
        updateRatingSummary(targetType, targetId);
    }

    @Transactional
    public void updateRatingSummary(Rating.RatingTargetType targetType, Long targetId) {
        try {
            List<Rating> ratings = ratingRepository.findByTargetTypeAndTargetIdAndIsActiveTrueOrderByCreatedAtDesc(
                    targetType, targetId);

            int totalRatings = ratings.size();

            RatingSummary summary = ratingSummaryRepository.findByTargetTypeAndTargetId(targetType, targetId)
                    .orElse(new RatingSummary(targetType, targetId));

            if (totalRatings == 0) {
                // Reset summary
                summary.setTotalRatings(0);
                summary.setAverageRating(BigDecimal.ZERO);
                summary.setFiveStarCount(0);
                summary.setFourStarCount(0);
                summary.setThreeStarCount(0);
                summary.setTwoStarCount(0);
                summary.setOneStarCount(0);
            } else {
                // Tính điểm trung bình
                double average = ratings.stream()
                        .mapToInt(Rating::getRating)
                        .average()
                        .orElse(0.0);

                // Đếm phân bố sao
                Map<Integer, Long> distribution = ratings.stream()
                        .collect(Collectors.groupingBy(Rating::getRating, Collectors.counting()));

                summary.setTotalRatings(totalRatings);
                summary.setAverageRating(BigDecimal.valueOf(average).setScale(1, RoundingMode.HALF_UP));
                summary.setFiveStarCount(distribution.getOrDefault(5, 0L).intValue());
                summary.setFourStarCount(distribution.getOrDefault(4, 0L).intValue());
                summary.setThreeStarCount(distribution.getOrDefault(3, 0L).intValue());
                summary.setTwoStarCount(distribution.getOrDefault(2, 0L).intValue());
                summary.setOneStarCount(distribution.getOrDefault(1, 0L).intValue());
            }

            summary.setLastUpdated(LocalDateTime.now());
            ratingSummaryRepository.save(summary);

            log.info("Updated rating summary for {} {}: {} ratings, avg {}",
                    targetType, targetId, totalRatings, summary.getAverageRating());

        } catch (Exception e) {
            log.error("Error updating rating summary for {} {}: {}", targetType, targetId, e.getMessage(), e);
        }
    }

    private Sort createSort(String sort) {
        if (sort == null)
            sort = "newest";

        return switch (sort.toLowerCase()) {
            case "oldest" -> Sort.by(Sort.Direction.ASC, "createdAt");
            case "highest" -> Sort.by(Sort.Direction.DESC, "rating").and(Sort.by(Sort.Direction.DESC, "createdAt"));
            case "lowest" -> Sort.by(Sort.Direction.ASC, "rating").and(Sort.by(Sort.Direction.DESC, "createdAt"));
            default -> Sort.by(Sort.Direction.DESC, "createdAt"); // newest
        };
    }

    private RatingResponse mapRatingToResponse(Rating rating) {
        RatingResponse response = new RatingResponse();
        response.setRatingId(rating.getRatingId());
        response.setUserId(rating.getUser().getId());
        response.setUserFullName(rating.getUser().getFullName());
        response.setUserAvatar(rating.getUser().getAvatar());
        response.setTargetType(rating.getTargetType());
        response.setTargetId(rating.getTargetId());
        response.setRating(rating.getRating());
        response.setComment(rating.getComment());

        // Staff reply info
        response.setStaffReply(rating.getStaffReply());
        if (rating.getRepliedBy() != null) {
            response.setRepliedById(rating.getRepliedBy().getId());
            response.setRepliedByName(rating.getRepliedBy().getFullName());
        }
        response.setRepliedAt(rating.getRepliedAt());

        response.setCreatedAt(rating.getCreatedAt());
        response.setUpdatedAt(rating.getUpdatedAt());

        // Kiểm tra có thể edit không (trong 24h)
        boolean canEdit = rating.getCreatedAt().isAfter(LocalDateTime.now().minusHours(24));
        response.setCanEdit(canEdit);

        return response;
    }
}
