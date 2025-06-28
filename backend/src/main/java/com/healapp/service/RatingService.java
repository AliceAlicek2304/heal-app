package com.healapp.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.healapp.dto.ApiResponse;
import com.healapp.dto.CreateRatingRequest;
import com.healapp.dto.RatingResponse;
import com.healapp.dto.RatingSummaryResponse;
import com.healapp.dto.StaffReplyRequest;
import com.healapp.dto.UpdateRatingRequest;
import com.healapp.model.Consultation;
import com.healapp.model.ConsultationStatus;
import com.healapp.model.Rating;
import com.healapp.model.RatingSummary;
import com.healapp.model.STIPackage;
import com.healapp.model.STIService;
import com.healapp.model.STITest;
import com.healapp.model.TestStatus;
import com.healapp.model.UserDtls;
import com.healapp.repository.ConsultationRepository;
import com.healapp.repository.RatingRepository;
import com.healapp.repository.RatingSummaryRepository;
import com.healapp.repository.STIPackageRepository;
import com.healapp.repository.STIServiceRepository;
import com.healapp.repository.STITestRepository;
import com.healapp.repository.UserRepository;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
public class RatingService {
    @Autowired
    private RatingRepository ratingRepository;
    @Autowired
    private RatingSummaryRepository ratingSummaryRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ConsultationRepository consultationRepository;

    @Autowired
    private STITestRepository stiTestRepository;

    @Autowired
    private STIServiceRepository stiServiceRepository;

    @Autowired
    private STIPackageRepository stiPackageRepository;// ===================== CUSTOMER METHODS =====================

    /**
     * Create new rating (one rating per user per target)
     */
    @Transactional
    public ApiResponse<RatingResponse> createRating(Long userId, Rating.RatingTargetType targetType,
            Long targetId, CreateRatingRequest request) {
        try {
            // Check if user exists
            Optional<UserDtls> userOpt = userRepository.findById(userId);
            if (userOpt.isEmpty()) {
                return ApiResponse.error("User not found");
            }
            UserDtls user = userOpt.get(); // Check if user has already rated this specific consultation/sti_test (only
                                           // active ratings)
            boolean hasRated = false;
            if (targetType == Rating.RatingTargetType.CONSULTANT && request.getConsultationId() != null) {
                hasRated = ratingRepository.existsByUserIdAndConsultationIdAndIsActiveTrue(userId,
                        request.getConsultationId());
            } else if (targetType == Rating.RatingTargetType.STI_SERVICE && request.getStiTestId() != null) {
                hasRated = ratingRepository.existsByUserIdAndStiTestIdAndIsActiveTrue(userId, request.getStiTestId());
            }

            if (hasRated) {
                return ApiResponse.error("You have already rated this " + targetType.name().toLowerCase());
            }

            // Check if user is eligible to rate
            if (!isEligibleToRate(userId, targetType, targetId, request.getConsultationId(), request.getStiTestId())) {
                return ApiResponse.error("You are not eligible to rate this " + targetType.name().toLowerCase());
            }

            // Create new rating with reference IDs
            Rating rating = new Rating(user, targetType, targetId, request.getRating(), request.getComment(),
                    request.getConsultationId(), request.getStiTestId());
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
     * Xóa rating (user trong 24h hoặc staff/admin bất kỳ lúc nào)
     */
    @Transactional
    public ApiResponse<String> deleteRating(Long userId, Long ratingId) {
        try {
            Optional<Rating> ratingOpt = ratingRepository.findById(ratingId);
            if (ratingOpt.isEmpty()) {
                return ApiResponse.error("Rating not found");
            }

            Rating rating = ratingOpt.get();

            // Lấy thông tin user thực hiện hành động xóa
            Optional<UserDtls> userOpt = userRepository.findById(userId);
            if (userOpt.isEmpty()) {
                return ApiResponse.error("User not found");
            }

            UserDtls user = userOpt.get();
            String userRole = user.getRoleName();

            // Kiểm tra quyền xóa
            boolean isOwner = rating.getUser().getId().equals(userId);
            boolean isStaffOrAdmin = "STAFF".equals(userRole) || "ADMIN".equals(userRole);

            if (!isOwner && !isStaffOrAdmin) {
                return ApiResponse.error("You can only delete your own ratings");
            }

            // Nếu là owner, kiểm tra thời gian (24h)
            if (isOwner && !isStaffOrAdmin) {
                if (rating.getCreatedAt().isBefore(LocalDateTime.now().minusHours(24))) {
                    return ApiResponse.error("You can only delete ratings within 24 hours of creation");
                }
            }
            // Staff và Admin có thể xóa bất kỳ lúc nào

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
     * Check if user can rate (one rating per user per target)
     */
    public ApiResponse<Map<String, Object>> checkRatingEligibility(Long userId, Rating.RatingTargetType targetType,
            Long targetId) {
        try {
            Map<String, Object> result = new HashMap<>();
            boolean canRate = isEligibleToRate(userId, targetType, targetId);
            boolean hasRated = ratingRepository.existsByUserIdAndTargetTypeAndTargetIdAndIsActiveTrue(userId,
                    targetType, targetId);

            result.put("canRate", canRate && !hasRated);
            result.put("hasRated", hasRated);
            result.put("reason", canRate ? (hasRated ? "Already rated" : "Eligible to rate") : "Not eligible to rate");

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

    /**
     * Staff - Lấy tất cả ratings (cho quản lý)
     */
    public ApiResponse<Page<RatingResponse>> getAllRatings(int page, int size, String sort, Integer filterRating,
            String keyword) {
        try {
            // Tạo sort
            Sort sortOrder = createSort(sort);
            Pageable pageable = PageRequest.of(page, size, sortOrder);

            Page<Rating> ratings;

            if (keyword != null && !keyword.trim().isEmpty()) {
                // Tìm kiếm trong comment
                if (filterRating != null && filterRating >= 1 && filterRating <= 5) {
                    ratings = ratingRepository.searchAllWithRatingFilter(keyword.trim(), filterRating, pageable);
                } else {
                    ratings = ratingRepository.searchAllInComments(keyword.trim(), pageable);
                }
            } else if (filterRating != null && filterRating >= 1 && filterRating <= 5) {
                // Filter theo rating
                ratings = ratingRepository.findByRatingAndIsActiveTrue(filterRating, pageable);
            } else {
                // Lấy tất cả
                ratings = ratingRepository.findByIsActiveTrue(pageable);
            }

            Page<RatingResponse> response = ratings.map(this::mapRatingToResponse);
            return ApiResponse.success("All ratings retrieved successfully", response);

        } catch (Exception e) {
            log.error("Error getting all ratings: {}", e.getMessage(), e);
            return ApiResponse.error("Unable to get all ratings: " + e.getMessage());
        }
    }

    /**
     * Staff - Lấy tất cả ratings của consultation
     */
    public ApiResponse<Page<RatingResponse>> getConsultationRatings(int page, int size, String sort,
            Integer filterRating, String keyword) {
        try {
            // Tạo sort
            Sort sortOrder = createSort(sort);
            Pageable pageable = PageRequest.of(page, size, sortOrder);

            Page<Rating> ratings;

            if (keyword != null && !keyword.trim().isEmpty()) {
                // Tìm kiếm trong comment
                if (filterRating != null && filterRating >= 1 && filterRating <= 5) {
                    ratings = ratingRepository.searchConsultationWithRatingFilter(keyword.trim(), filterRating,
                            pageable);
                } else {
                    ratings = ratingRepository.searchConsultationInComments(keyword.trim(), pageable);
                }
            } else if (filterRating != null && filterRating >= 1 && filterRating <= 5) { // Filter theo rating
                ratings = ratingRepository.findByTargetTypeAndRatingAndIsActiveTrue(
                        Rating.RatingTargetType.CONSULTANT, filterRating, pageable);
            } else { // Lấy tất cả consultation ratings
                ratings = ratingRepository.findByTargetTypeAndIsActiveTrue(
                        Rating.RatingTargetType.CONSULTANT, pageable);
            }

            Page<RatingResponse> response = ratings.map(this::mapRatingToResponse);
            return ApiResponse.success("Consultation ratings retrieved successfully", response);

        } catch (Exception e) {
            log.error("Error getting consultation ratings: {}", e.getMessage(), e);
            return ApiResponse.error("Unable to get consultation ratings: " + e.getMessage());
        }
    }

    /**
     * Staff - Lấy tất cả ratings của STI service
     */
    public ApiResponse<Page<RatingResponse>> getSTIServiceRatings(int page, int size, String sort, Integer filterRating,
            String keyword) {
        try {
            // Tạo sort
            Sort sortOrder = createSort(sort);
            Pageable pageable = PageRequest.of(page, size, sortOrder);

            Page<Rating> ratings;

            if (keyword != null && !keyword.trim().isEmpty()) {
                // Tìm kiếm trong comment
                if (filterRating != null && filterRating >= 1 && filterRating <= 5) {
                    ratings = ratingRepository.searchSTIServiceWithRatingFilter(keyword.trim(), filterRating, pageable);
                } else {
                    ratings = ratingRepository.searchSTIServiceInComments(keyword.trim(), pageable);
                }
            } else if (filterRating != null && filterRating >= 1 && filterRating <= 5) { // Filter theo rating
                ratings = ratingRepository.findByTargetTypeAndRatingAndIsActiveTrue(
                        Rating.RatingTargetType.STI_SERVICE, filterRating, pageable);
            } else { // Lấy tất cả STI service ratings
                ratings = ratingRepository.findByTargetTypeAndIsActiveTrue(
                        Rating.RatingTargetType.STI_SERVICE, pageable);
            }

            Page<RatingResponse> response = ratings.map(this::mapRatingToResponse);
            return ApiResponse.success("STI service ratings retrieved successfully", response);

        } catch (Exception e) {
            log.error("Error getting STI service ratings: {}", e.getMessage(), e);
            return ApiResponse.error("Unable to get STI service ratings: " + e.getMessage());
        }
    }

    /**
     * Staff - Lấy tất cả ratings của STI package
     */
    public ApiResponse<Page<RatingResponse>> getSTIPackageRatings(int page, int size, String sort, Integer filterRating,
            String keyword) {
        try {
            // Tạo sort
            Sort sortOrder = createSort(sort);
            Pageable pageable = PageRequest.of(page, size, sortOrder);

            Page<Rating> ratings;

            if (keyword != null && !keyword.trim().isEmpty()) {
                // Tìm kiếm trong comment
                if (filterRating != null && filterRating >= 1 && filterRating <= 5) {
                    ratings = ratingRepository.searchSTIPackageWithRatingFilter(keyword.trim(), filterRating, pageable);
                } else {
                    ratings = ratingRepository.searchSTIPackageInComments(keyword.trim(), pageable);
                }
            } else if (filterRating != null && filterRating >= 1 && filterRating <= 5) { // Filter theo rating
                ratings = ratingRepository.findByTargetTypeAndRatingAndIsActiveTrue(
                        Rating.RatingTargetType.STI_PACKAGE, filterRating, pageable);
            } else { // Lấy tất cả STI package ratings
                ratings = ratingRepository.findByTargetTypeAndIsActiveTrue(
                        Rating.RatingTargetType.STI_PACKAGE, pageable);
            }

            Page<RatingResponse> response = ratings.map(this::mapRatingToResponse);
            return ApiResponse.success("STI package ratings retrieved successfully", response);

        } catch (Exception e) {
            log.error("Error getting STI package ratings: {}", e.getMessage(), e);
            return ApiResponse.error("Unable to get STI package ratings: " + e.getMessage());
        }
    }

    /**
     * Staff - Lấy tổng hợp tất cả ratings
     */
    public ApiResponse<Map<String, Object>> getAllRatingSummary() {
        try {
            // Lấy tất cả ratings active
            List<Rating> allRatings = ratingRepository.findByIsActiveTrueOrderByCreatedAtDesc();

            Map<String, Object> summary = new HashMap<>();

            if (allRatings.isEmpty()) {
                summary.put("totalRatings", 0);
                summary.put("averageRating", BigDecimal.ZERO);
                summary.put("fiveStarCount", 0);
                summary.put("fourStarCount", 0);
                summary.put("threeStarCount", 0);
                summary.put("twoStarCount", 0);
                summary.put("oneStarCount", 0);
            } else {
                // Tính điểm trung bình
                double average = allRatings.stream()
                        .mapToInt(Rating::getRating)
                        .average()
                        .orElse(0.0);

                // Đếm phân bố sao
                Map<Integer, Long> distribution = allRatings.stream()
                        .collect(Collectors.groupingBy(Rating::getRating, Collectors.counting()));

                summary.put("totalRatings", allRatings.size());
                summary.put("averageRating", BigDecimal.valueOf(average).setScale(1, RoundingMode.HALF_UP));
                summary.put("fiveStarCount", distribution.getOrDefault(5, 0L).intValue());
                summary.put("fourStarCount", distribution.getOrDefault(4, 0L).intValue());
                summary.put("threeStarCount", distribution.getOrDefault(3, 0L).intValue());
                summary.put("twoStarCount", distribution.getOrDefault(2, 0L).intValue());
                summary.put("oneStarCount", distribution.getOrDefault(1, 0L).intValue());
            }

            // Thêm thống kê theo loại
            long consultationCount = allRatings.stream()
                    .filter(r -> r.getTargetType() == Rating.RatingTargetType.CONSULTANT)
                    .count();
            long stiServiceCount = allRatings.stream()
                    .filter(r -> r.getTargetType() == Rating.RatingTargetType.STI_SERVICE)
                    .count();

            summary.put("consultationRatingCount", consultationCount);
            summary.put("stiServiceRatingCount", stiServiceCount);

            return ApiResponse.success("All ratings summary retrieved successfully", summary);

        } catch (Exception e) {
            log.error("Error getting all ratings summary: {}", e.getMessage(), e);
            return ApiResponse.error("Unable to get all ratings summary: " + e.getMessage());
        }
    }

    /**
     * Staff - Lấy tổng hợp ratings của consultation
     */
    public ApiResponse<Map<String, Object>> getConsultationRatingSummary() {
        try {
            // Lấy tất cả consultation ratings active
            List<Rating> consultationRatings = ratingRepository.findByTargetTypeAndIsActiveTrueOrderByCreatedAtDesc(
                    Rating.RatingTargetType.CONSULTANT);

            Map<String, Object> summary = new HashMap<>();

            if (consultationRatings.isEmpty()) {
                summary.put("totalRatings", 0);
                summary.put("averageRating", BigDecimal.ZERO);
                summary.put("fiveStarCount", 0);
                summary.put("fourStarCount", 0);
                summary.put("threeStarCount", 0);
                summary.put("twoStarCount", 0);
                summary.put("oneStarCount", 0);
            } else {
                // Tính điểm trung bình
                double average = consultationRatings.stream()
                        .mapToInt(Rating::getRating)
                        .average()
                        .orElse(0.0);

                // Đếm phân bố sao
                Map<Integer, Long> distribution = consultationRatings.stream()
                        .collect(Collectors.groupingBy(Rating::getRating, Collectors.counting()));

                summary.put("totalRatings", consultationRatings.size());
                summary.put("averageRating", BigDecimal.valueOf(average).setScale(1, RoundingMode.HALF_UP));
                summary.put("fiveStarCount", distribution.getOrDefault(5, 0L).intValue());
                summary.put("fourStarCount", distribution.getOrDefault(4, 0L).intValue());
                summary.put("threeStarCount", distribution.getOrDefault(3, 0L).intValue());
                summary.put("twoStarCount", distribution.getOrDefault(2, 0L).intValue());
                summary.put("oneStarCount", distribution.getOrDefault(1, 0L).intValue());
            }

            summary.put("targetType", "CONSULTANT");

            return ApiResponse.success("Consultation ratings summary retrieved successfully", summary);

        } catch (Exception e) {
            log.error("Error getting consultation ratings summary: {}", e.getMessage(), e);
            return ApiResponse.error("Unable to get consultation ratings summary: " + e.getMessage());
        }
    }

    /**
     * Staff - Lấy tổng hợp ratings của STI service
     */
    public ApiResponse<Map<String, Object>> getSTIServiceRatingSummary() {
        try {
            // Lấy tất cả STI service ratings active
            List<Rating> stiServiceRatings = ratingRepository.findByTargetTypeAndIsActiveTrueOrderByCreatedAtDesc(
                    Rating.RatingTargetType.STI_SERVICE);

            Map<String, Object> summary = new HashMap<>();

            if (stiServiceRatings.isEmpty()) {
                summary.put("totalRatings", 0);
                summary.put("averageRating", BigDecimal.ZERO);
                summary.put("fiveStarCount", 0);
                summary.put("fourStarCount", 0);
                summary.put("threeStarCount", 0);
                summary.put("twoStarCount", 0);
                summary.put("oneStarCount", 0);
            } else {
                // Tính điểm trung bình
                double average = stiServiceRatings.stream()
                        .mapToInt(Rating::getRating)
                        .average()
                        .orElse(0.0);

                // Đếm phân bố sao
                Map<Integer, Long> distribution = stiServiceRatings.stream()
                        .collect(Collectors.groupingBy(Rating::getRating, Collectors.counting()));

                summary.put("totalRatings", stiServiceRatings.size());
                summary.put("averageRating", BigDecimal.valueOf(average).setScale(1, RoundingMode.HALF_UP));
                summary.put("fiveStarCount", distribution.getOrDefault(5, 0L).intValue());
                summary.put("fourStarCount", distribution.getOrDefault(4, 0L).intValue());
                summary.put("threeStarCount", distribution.getOrDefault(3, 0L).intValue());
                summary.put("twoStarCount", distribution.getOrDefault(2, 0L).intValue());
                summary.put("oneStarCount", distribution.getOrDefault(1, 0L).intValue());
            }

            summary.put("targetType", "STI_SERVICE");

            return ApiResponse.success("STI service ratings summary retrieved successfully", summary);

        } catch (Exception e) {
            log.error("Error getting STI service ratings summary: {}", e.getMessage(), e);
            return ApiResponse.error("Unable to get STI service ratings summary: " + e.getMessage());
        }
    }

    /**
     * Staff - Lấy tổng hợp ratings của STI package
     */
    public ApiResponse<Map<String, Object>> getSTIPackageRatingSummary() {
        try {
            // Lấy tất cả STI package ratings active
            List<Rating> stiPackageRatings = ratingRepository.findByTargetTypeAndIsActiveTrueOrderByCreatedAtDesc(
                    Rating.RatingTargetType.STI_PACKAGE);

            Map<String, Object> summary = new HashMap<>();

            if (stiPackageRatings.isEmpty()) {
                summary.put("totalRatings", 0);
                summary.put("averageRating", 0);
                summary.put("fiveStarCount", 0);
                summary.put("fourStarCount", 0);
                summary.put("threeStarCount", 0);
                summary.put("twoStarCount", 0);
                summary.put("oneStarCount", 0);
            } else {
                // Tính điểm trung bình
                double average = stiPackageRatings.stream()
                        .mapToInt(Rating::getRating)
                        .average()
                        .orElse(0.0);

                // Đếm phân bố sao
                Map<Integer, Long> distribution = stiPackageRatings.stream()
                        .collect(Collectors.groupingBy(Rating::getRating, Collectors.counting()));

                summary.put("totalRatings", stiPackageRatings.size());
                summary.put("averageRating", BigDecimal.valueOf(average).setScale(1, RoundingMode.HALF_UP));
                summary.put("fiveStarCount", distribution.getOrDefault(5, 0L).intValue());
                summary.put("fourStarCount", distribution.getOrDefault(4, 0L).intValue());
                summary.put("threeStarCount", distribution.getOrDefault(3, 0L).intValue());
                summary.put("twoStarCount", distribution.getOrDefault(2, 0L).intValue());
                summary.put("oneStarCount", distribution.getOrDefault(1, 0L).intValue());
            }

            summary.put("targetType", "STI_PACKAGE");

            return ApiResponse.success("STI package ratings summary retrieved successfully", summary);

        } catch (Exception e) {
            log.error("Error getting STI package ratings summary: {}", e.getMessage(), e);
            return ApiResponse.error("Unable to get STI package ratings summary: " + e.getMessage());
        }
    }

    // ===================== PRIVATE HELPER METHODS =====================

    // Overloaded method for backward compatibility
    private boolean isEligibleToRate(Long userId, Rating.RatingTargetType targetType, Long targetId) {
        if (targetType == Rating.RatingTargetType.CONSULTANT) {
            return hasCompletedConsultation(userId, targetId);
        } else if (targetType == Rating.RatingTargetType.STI_SERVICE) {
            return hasCompletedSTIOrder(userId, targetId);
        } else if (targetType == Rating.RatingTargetType.STI_PACKAGE) {
            return hasCompletedSTIPackage(userId, targetId);
        }
        return false;
    }

    private boolean isEligibleToRate(Long userId, Rating.RatingTargetType targetType, Long targetId,
            Long consultationId, Long stiTestId) {
        if (targetType == Rating.RatingTargetType.CONSULTANT && consultationId != null) {
            // Check if specific consultation is completed
            return hasCompletedSpecificConsultation(userId, consultationId);
        } else if ((targetType == Rating.RatingTargetType.STI_SERVICE
                || targetType == Rating.RatingTargetType.STI_PACKAGE) && stiTestId != null) {
            // Check if specific STI test is completed (works for both service and package)
            return hasCompletedSTITest(userId, stiTestId);
        }
        return false;
    }

    private boolean hasCompletedSpecificConsultation(Long userId, Long consultationId) {
        // Check if specific consultation is completed
        Optional<Consultation> consultation = consultationRepository.findById(consultationId);
        return consultation.isPresent() &&
                consultation.get().getCustomer().getId().equals(userId) &&
                consultation.get().getStatus() == ConsultationStatus.COMPLETED;
    }

    private boolean hasCompletedSTITest(Long userId, Long stiTestId) {
        // Check if specific STI test is completed
        Optional<STITest> stiTest = stiTestRepository.findById(stiTestId);
        return stiTest.isPresent() &&
                stiTest.get().getCustomer().getId().equals(userId) &&
                stiTest.get().getStatus() == TestStatus.COMPLETED;
    }

    // Keep old methods for backward compatibility
    private boolean hasCompletedConsultation(Long userId, Long consultantId) {
        // Kiểm tra xem user có consultation nào COMPLETED với consultant này không
        List<Consultation> consultations = consultationRepository.findByCustomerIdAndConsultantIdAndStatus(
                userId, consultantId, ConsultationStatus.COMPLETED);
        return !consultations.isEmpty();
    }

    private boolean hasCompletedSTIOrder(Long userId, Long serviceId) {
        // Kiểm tra xem user có STI test nào COMPLETED với service này không
        List<STITest> stiTests = stiTestRepository.findByCustomerIdAndStiServiceServiceIdAndStatus(
                userId, serviceId, TestStatus.COMPLETED);
        return !stiTests.isEmpty();
    }

    private boolean hasCompletedSTIPackage(Long userId, Long packageId) {
        // Kiểm tra xem user có STI test nào COMPLETED với package này không
        List<STITest> stiTests = stiTestRepository.findByCustomerIdAndPackageIdAndStatus(
                userId, packageId, TestStatus.COMPLETED);
        return !stiTests.isEmpty();
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

    // Lấy testimonials cho homepage
    public ApiResponse<List<RatingResponse>> getTestimonials(int limit) {
        try {
            // Lấy top testimonials từ tất cả các loại dịch vụ
            List<Rating> testimonials = ratingRepository.findTopTestimonials(
                PageRequest.of(0, limit)
            );
            
            List<RatingResponse> responses = testimonials.stream()
                .map(this::mapRatingToResponse)
                .collect(Collectors.toList());
            
            return ApiResponse.success("Testimonials retrieved successfully", responses);
        } catch (Exception e) {
            log.error("Error retrieving testimonials: {}", e.getMessage(), e);
            return ApiResponse.error("Unable to retrieve testimonials: " + e.getMessage());
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

        // Lấy tên thực của đối tượng được đánh giá
        response.setTargetName(getTargetName(rating.getTargetType(), rating.getTargetId()));

        response.setRating(rating.getRating());
        response.setComment(rating.getComment());

        // Staff reply info
        response.setStaffReply(rating.getStaffReply());
        if (rating.getRepliedBy() != null) {
            response.setRepliedById(rating.getRepliedBy().getId());
            response.setRepliedByName(rating.getRepliedBy().getFullName());
        }
        response.setRepliedAt(rating.getRepliedAt());

        // Reference fields
        response.setConsultationId(rating.getConsultationId());
        response.setStiTestId(rating.getStiTestId());

        response.setCreatedAt(rating.getCreatedAt());
        response.setUpdatedAt(rating.getUpdatedAt());

        // Kiểm tra có thể edit không (trong 24h)
        boolean canEdit = rating.getCreatedAt().isAfter(LocalDateTime.now().minusHours(24));
        response.setCanEdit(canEdit);

        return response;
    }

    /**
     * Lấy tên thực của đối tượng được đánh giá
     */
    private String getTargetName(Rating.RatingTargetType targetType, Long targetId) {
        try {
            switch (targetType) {
                case CONSULTANT:
                    // Lấy tên tư vấn viên
                    Optional<UserDtls> consultant = userRepository.findById(targetId);
                    return consultant.map(UserDtls::getFullName).orElse("Tư vấn viên #" + targetId);

                case STI_SERVICE:
                    // Lấy tên dịch vụ STI
                    Optional<STIService> stiService = stiServiceRepository.findById(targetId);
                    return stiService.map(STIService::getName).orElse("Dịch vụ STI #" + targetId);

                case STI_PACKAGE:
                    // Lấy tên gói STI
                    Optional<STIPackage> stiPackage = stiPackageRepository.findById(targetId);
                    return stiPackage.map(STIPackage::getPackageName).orElse("Gói STI #" + targetId);

                default:
                    return targetType.name() + " #" + targetId;
            }
        } catch (Exception e) {
            log.warn("Error getting target name for {} #{}: {}", targetType, targetId, e.getMessage());
            return targetType.name() + " #" + targetId;
        }
    }
}
