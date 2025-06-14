package com.healapp.service;

import com.healapp.dto.*;
import com.healapp.model.Rating;
import com.healapp.model.RatingSummary;
import com.healapp.model.UserDtls;
import com.healapp.model.Role;
import com.healapp.repository.RatingRepository;
import com.healapp.repository.RatingSummaryRepository;
import com.healapp.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RatingServiceTest {

    @Mock
    private RatingRepository ratingRepository;

    @Mock
    private RatingSummaryRepository ratingSummaryRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private RatingService ratingService;
    private UserDtls testUser;
    private UserDtls testStaff;
    private Role userRole;
    private Role staffRole;
    private Rating testRating;
    private RatingSummary testSummary;
    private CreateRatingRequest createRatingRequest;
    private UpdateRatingRequest updateRatingRequest;
    private StaffReplyRequest staffReplyRequest;

    @BeforeEach
    void setUp() {
        // Test roles
        userRole = new Role();
        userRole.setRoleId(1L);
        userRole.setRoleName("USER");

        staffRole = new Role();
        staffRole.setRoleId(2L);
        staffRole.setRoleName("STAFF");

        // Test user (customer)
        testUser = new UserDtls();
        testUser.setId(1L);
        testUser.setFullName("Test User");
        testUser.setEmail("test@example.com");
        testUser.setRole(userRole);
        testUser.setAvatar("avatar.jpg");

        // Test staff
        testStaff = new UserDtls();
        testStaff.setId(2L);
        testStaff.setFullName("Test Staff");
        testStaff.setEmail("staff@example.com");
        testStaff.setRole(staffRole);

        // Test rating
        testRating = new Rating();
        testRating.setRatingId(1L);
        testRating.setUser(testUser);
        testRating.setTargetType(Rating.RatingTargetType.CONSULTANT);
        testRating.setTargetId(100L);
        testRating.setRating(5);
        testRating.setComment("Excellent service!");
        testRating.setIsActive(true);
        testRating.setCreatedAt(LocalDateTime.now());
        testRating.setUpdatedAt(LocalDateTime.now());

        // Test summary
        testSummary = new RatingSummary();
        testSummary.setTargetType(Rating.RatingTargetType.CONSULTANT);
        testSummary.setTargetId(100L);
        testSummary.setTotalRatings(10);
        testSummary.setAverageRating(BigDecimal.valueOf(4.5));
        testSummary.setFiveStarCount(5);
        testSummary.setFourStarCount(3);
        testSummary.setThreeStarCount(2);
        testSummary.setTwoStarCount(0);
        testSummary.setOneStarCount(0);

        // Test DTOs
        createRatingRequest = new CreateRatingRequest();
        createRatingRequest.setRating(5);
        createRatingRequest.setComment("Excellent service!");

        updateRatingRequest = new UpdateRatingRequest();
        updateRatingRequest.setRating(4);
        updateRatingRequest.setComment("Updated comment");

        staffReplyRequest = new StaffReplyRequest();
        staffReplyRequest.setStaffReply("Thank you for your feedback!");
    }

    // ===================== CREATE RATING TESTS =====================

    @Test
    void createRating_Success() {
        // Arrange
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(ratingRepository.existsByUserIdAndTargetTypeAndTargetId(1L, Rating.RatingTargetType.CONSULTANT, 100L))
                .thenReturn(false);
        when(ratingRepository.save(any(Rating.class))).thenReturn(testRating);

        // Act
        ApiResponse<RatingResponse> result = ratingService.createRating(
                1L, Rating.RatingTargetType.CONSULTANT, 100L, createRatingRequest);

        // Assert
        assertTrue(result.isSuccess());
        assertEquals("Rating created successfully", result.getMessage());
        assertNotNull(result.getData());
        assertEquals(5, result.getData().getRating());
        assertEquals("Excellent service!", result.getData().getComment());

        verify(ratingRepository).save(any(Rating.class));
        verify(ratingRepository).existsByUserIdAndTargetTypeAndTargetId(1L, Rating.RatingTargetType.CONSULTANT, 100L);
    }

    @Test
    void createRating_UserNotFound() {
        // Arrange
        when(userRepository.findById(1L)).thenReturn(Optional.empty());

        // Act
        ApiResponse<RatingResponse> result = ratingService.createRating(
                1L, Rating.RatingTargetType.CONSULTANT, 100L, createRatingRequest);

        // Assert
        assertFalse(result.isSuccess());
        assertEquals("User not found", result.getMessage());
        assertNull(result.getData());

        verify(ratingRepository, never()).save(any(Rating.class));
    }

    @Test
    void createRating_AlreadyRated() {
        // Arrange
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(ratingRepository.existsByUserIdAndTargetTypeAndTargetId(1L, Rating.RatingTargetType.CONSULTANT, 100L))
                .thenReturn(true);

        // Act
        ApiResponse<RatingResponse> result = ratingService.createRating(
                1L, Rating.RatingTargetType.CONSULTANT, 100L, createRatingRequest);

        // Assert
        assertFalse(result.isSuccess());
        assertEquals("You have already rated this consultant", result.getMessage());
        assertNull(result.getData());

        verify(ratingRepository, never()).save(any(Rating.class));
    }

    // ===================== UPDATE RATING TESTS =====================

    @Test
    void updateRating_Success() {
        // Arrange
        when(ratingRepository.findById(1L)).thenReturn(Optional.of(testRating));
        when(ratingRepository.save(any(Rating.class))).thenReturn(testRating);

        // Act
        ApiResponse<RatingResponse> result = ratingService.updateRating(1L, 1L, updateRatingRequest);

        // Assert
        assertTrue(result.isSuccess());
        assertEquals("Rating updated successfully", result.getMessage());
        assertNotNull(result.getData());

        verify(ratingRepository).save(any(Rating.class));
    }

    @Test
    void updateRating_NotFound() {
        // Arrange
        when(ratingRepository.findById(1L)).thenReturn(Optional.empty());

        // Act
        ApiResponse<RatingResponse> result = ratingService.updateRating(1L, 1L, updateRatingRequest);

        // Assert
        assertFalse(result.isSuccess());
        assertEquals("Rating not found", result.getMessage());
        assertNull(result.getData());

        verify(ratingRepository, never()).save(any(Rating.class));
    }

    @Test
    void updateRating_NotOwner() {
        // Arrange
        when(ratingRepository.findById(1L)).thenReturn(Optional.of(testRating));

        // Act
        ApiResponse<RatingResponse> result = ratingService.updateRating(999L, 1L, updateRatingRequest);

        // Assert
        assertFalse(result.isSuccess());
        assertEquals("You can only update your own ratings", result.getMessage());
        assertNull(result.getData());

        verify(ratingRepository, never()).save(any(Rating.class));
    }

    @Test
    void updateRating_TooOld() {
        // Arrange
        Rating oldRating = new Rating();
        oldRating.setRatingId(1L);
        oldRating.setUser(testUser);
        oldRating.setCreatedAt(LocalDateTime.now().minusHours(25)); // Older than 24 hours

        when(ratingRepository.findById(1L)).thenReturn(Optional.of(oldRating));

        // Act
        ApiResponse<RatingResponse> result = ratingService.updateRating(1L, 1L, updateRatingRequest);

        // Assert
        assertFalse(result.isSuccess());
        assertEquals("You can only update ratings within 24 hours of creation", result.getMessage());
        assertNull(result.getData());

        verify(ratingRepository, never()).save(any(Rating.class));
    }

    // ===================== DELETE RATING TESTS =====================

    @Test
    void deleteRating_Success() {
        // Arrange
        when(ratingRepository.findById(1L)).thenReturn(Optional.of(testRating));
        when(ratingRepository.save(any(Rating.class))).thenReturn(testRating);

        // Act
        ApiResponse<String> result = ratingService.deleteRating(1L, 1L);

        // Assert
        assertTrue(result.isSuccess());
        assertEquals("Rating deleted successfully", result.getMessage());

        verify(ratingRepository).save(any(Rating.class));
    }

    @Test
    void deleteRating_NotFound() {
        // Arrange
        when(ratingRepository.findById(1L)).thenReturn(Optional.empty());

        // Act
        ApiResponse<String> result = ratingService.deleteRating(1L, 1L);

        // Assert
        assertFalse(result.isSuccess());
        assertEquals("Rating not found", result.getMessage());

        verify(ratingRepository, never()).save(any(Rating.class));
    }

    @Test
    void deleteRating_NotOwner() {
        // Arrange
        when(ratingRepository.findById(1L)).thenReturn(Optional.of(testRating));

        // Act
        ApiResponse<String> result = ratingService.deleteRating(999L, 1L);

        // Assert
        assertFalse(result.isSuccess());
        assertEquals("You can only delete your own ratings", result.getMessage());

        verify(ratingRepository, never()).save(any(Rating.class));
    }

    @Test
    void deleteRating_TooOld() {
        // Arrange
        Rating oldRating = new Rating();
        oldRating.setRatingId(1L);
        oldRating.setUser(testUser);
        oldRating.setCreatedAt(LocalDateTime.now().minusHours(25)); // Older than 24 hours

        when(ratingRepository.findById(1L)).thenReturn(Optional.of(oldRating));

        // Act
        ApiResponse<String> result = ratingService.deleteRating(1L, 1L);

        // Assert
        assertFalse(result.isSuccess());
        assertEquals("You can only delete ratings within 24 hours of creation", result.getMessage());

        verify(ratingRepository, never()).save(any(Rating.class));
    }

    // ===================== GET USER RATINGS TESTS =====================

    @Test
    void getUserRatings_Success() {
        // Arrange
        List<Rating> ratings = Arrays.asList(testRating);
        Page<Rating> ratingsPage = new PageImpl<>(ratings);
        Pageable pageable = PageRequest.of(0, 10);

        when(ratingRepository.findByUserIdAndIsActiveTrueOrderByCreatedAtDesc(1L, pageable))
                .thenReturn(ratingsPage);

        // Act
        ApiResponse<Page<RatingResponse>> result = ratingService.getUserRatings(1L, 0, 10);

        // Assert
        assertTrue(result.isSuccess());
        assertEquals("User ratings retrieved successfully", result.getMessage());
        assertNotNull(result.getData());
        assertEquals(1, result.getData().getContent().size());

        verify(ratingRepository).findByUserIdAndIsActiveTrueOrderByCreatedAtDesc(1L, pageable);
    }

    // ===================== GET RATINGS WITH FILTERS TESTS =====================
    // @Test
    void getRatings_Success_NoFilters() {
        // Arrange
        List<Rating> ratings = Arrays.asList(testRating);
        Page<Rating> ratingsPage = new PageImpl<>(ratings);
        Pageable pageable = PageRequest.of(0, 10, Sort.by(Sort.Direction.DESC, "createdAt"));

        when(ratingRepository.findByTargetTypeAndTargetIdAndIsActiveTrue(
                Rating.RatingTargetType.CONSULTANT, 100L, pageable))
                .thenReturn(ratingsPage);

        // Act
        ApiResponse<Page<RatingResponse>> result = ratingService.getRatings(
                Rating.RatingTargetType.CONSULTANT, 100L, 0, 10, "newest", null, null);

        // Assert
        assertTrue(result.isSuccess());
        assertEquals("Ratings retrieved successfully", result.getMessage());
        assertNotNull(result.getData());
        assertEquals(1, result.getData().getContent().size());
    }

    @Test
    void getRatings_Success_WithRatingFilter() {
        // Arrange
        List<Rating> ratings = Arrays.asList(testRating);
        Page<Rating> ratingsPage = new PageImpl<>(ratings);
        Pageable pageable = PageRequest.of(0, 10, Sort.by(Sort.Direction.DESC, "createdAt"));

        when(ratingRepository.findByTargetTypeAndTargetIdAndRatingAndIsActiveTrue(
                Rating.RatingTargetType.CONSULTANT, 100L, 5, pageable))
                .thenReturn(ratingsPage);

        // Act
        ApiResponse<Page<RatingResponse>> result = ratingService.getRatings(
                Rating.RatingTargetType.CONSULTANT, 100L, 0, 10, "newest", 5, null);

        // Assert
        assertTrue(result.isSuccess());
        assertEquals("Ratings retrieved successfully", result.getMessage());
        assertNotNull(result.getData());
        assertEquals(1, result.getData().getContent().size());
    }

    @Test
    void getRatings_Success_WithKeywordSearch() {
        // Arrange
        List<Rating> ratings = Arrays.asList(testRating);
        Page<Rating> ratingsPage = new PageImpl<>(ratings);
        Pageable pageable = PageRequest.of(0, 10, Sort.by(Sort.Direction.DESC, "createdAt"));

        when(ratingRepository.searchInComments(
                Rating.RatingTargetType.CONSULTANT, 100L, "excellent", pageable))
                .thenReturn(ratingsPage);

        // Act
        ApiResponse<Page<RatingResponse>> result = ratingService.getRatings(
                Rating.RatingTargetType.CONSULTANT, 100L, 0, 10, "newest", null, "excellent");

        // Assert
        assertTrue(result.isSuccess());
        assertEquals("Ratings retrieved successfully", result.getMessage());
        assertNotNull(result.getData());
        assertEquals(1, result.getData().getContent().size());
    }

    // ===================== GET RATING SUMMARY TESTS =====================

    @Test
    void getRatingSummary_Success_WithExistingSummary() {
        // Arrange
        when(ratingSummaryRepository.findByTargetTypeAndTargetId(Rating.RatingTargetType.CONSULTANT, 100L))
                .thenReturn(Optional.of(testSummary));

        // Act
        ApiResponse<RatingSummaryResponse> result = ratingService.getRatingSummary(
                Rating.RatingTargetType.CONSULTANT, 100L, false);

        // Assert
        assertTrue(result.isSuccess());
        assertEquals("Rating summary retrieved successfully", result.getMessage());
        assertNotNull(result.getData());
        assertEquals(10, result.getData().getTotalRatings());
        assertEquals(BigDecimal.valueOf(4.5), result.getData().getAverageRating());
    }

    @Test
    void getRatingSummary_Success_NoExistingSummary() {
        // Arrange
        when(ratingSummaryRepository.findByTargetTypeAndTargetId(Rating.RatingTargetType.CONSULTANT, 100L))
                .thenReturn(Optional.empty());

        // Act
        ApiResponse<RatingSummaryResponse> result = ratingService.getRatingSummary(
                Rating.RatingTargetType.CONSULTANT, 100L, false);

        // Assert
        assertTrue(result.isSuccess());
        assertEquals("Rating summary retrieved successfully", result.getMessage());
        assertNotNull(result.getData());
        assertEquals(0, result.getData().getTotalRatings());
        assertEquals(BigDecimal.ZERO, result.getData().getAverageRating());
    }

    @Test
    void getRatingSummary_Success_WithRecentReviews() {
        // Arrange
        when(ratingSummaryRepository.findByTargetTypeAndTargetId(Rating.RatingTargetType.CONSULTANT, 100L))
                .thenReturn(Optional.of(testSummary));
        when(ratingRepository.findTopRatingsWithComments(
                Rating.RatingTargetType.CONSULTANT, 100L, PageRequest.of(0, 5)))
                .thenReturn(Arrays.asList(testRating));

        // Act
        ApiResponse<RatingSummaryResponse> result = ratingService.getRatingSummary(
                Rating.RatingTargetType.CONSULTANT, 100L, true);

        // Assert
        assertTrue(result.isSuccess());
        assertEquals("Rating summary retrieved successfully", result.getMessage());
        assertNotNull(result.getData());
        assertNotNull(result.getData().getRecentRatings());
        assertEquals(1, result.getData().getRecentRatings().size());
    }

    // ===================== CHECK RATING ELIGIBILITY TESTS =====================

    @Test
    void checkRatingEligibility_Success_CanRate() {
        // Arrange
        when(ratingRepository.existsByUserIdAndTargetTypeAndTargetId(1L, Rating.RatingTargetType.CONSULTANT, 100L))
                .thenReturn(false);

        // Act
        ApiResponse<Map<String, Object>> result = ratingService.checkRatingEligibility(
                1L, Rating.RatingTargetType.CONSULTANT, 100L);

        // Assert
        assertTrue(result.isSuccess());
        assertEquals("Check completed", result.getMessage());
        assertNotNull(result.getData());
        assertTrue((Boolean) result.getData().get("canRate"));
        assertFalse((Boolean) result.getData().get("hasRated"));
    }

    @Test
    void checkRatingEligibility_Success_AlreadyRated() {
        // Arrange
        when(ratingRepository.existsByUserIdAndTargetTypeAndTargetId(1L, Rating.RatingTargetType.CONSULTANT, 100L))
                .thenReturn(true);

        // Act
        ApiResponse<Map<String, Object>> result = ratingService.checkRatingEligibility(
                1L, Rating.RatingTargetType.CONSULTANT, 100L);

        // Assert
        assertTrue(result.isSuccess());
        assertEquals("Check completed", result.getMessage());
        assertNotNull(result.getData());
        assertFalse((Boolean) result.getData().get("canRate"));
        assertTrue((Boolean) result.getData().get("hasRated"));
    }

    // ===================== STAFF REPLY TESTS =====================

    @Test
    void replyToRating_Success() {
        // Arrange
        when(userRepository.findById(2L)).thenReturn(Optional.of(testStaff));
        when(ratingRepository.findById(1L)).thenReturn(Optional.of(testRating));
        when(ratingRepository.save(any(Rating.class))).thenReturn(testRating);

        // Act
        ApiResponse<RatingResponse> result = ratingService.replyToRating(2L, 1L, staffReplyRequest);

        // Assert
        assertTrue(result.isSuccess());
        assertEquals("Staff reply added successfully", result.getMessage());
        assertNotNull(result.getData());

        verify(ratingRepository).save(any(Rating.class));
    }

    @Test
    void replyToRating_StaffNotFound() {
        // Arrange
        when(userRepository.findById(2L)).thenReturn(Optional.empty());

        // Act
        ApiResponse<RatingResponse> result = ratingService.replyToRating(2L, 1L, staffReplyRequest);

        // Assert
        assertFalse(result.isSuccess());
        assertEquals("Staff not found", result.getMessage());
        assertNull(result.getData());

        verify(ratingRepository, never()).save(any(Rating.class));
    }

    @Test
    void replyToRating_NotStaff() {
        // Arrange
        Role regularRole = new Role();
        regularRole.setRoleId(3L);
        regularRole.setRoleName("USER");

        UserDtls regularUser = new UserDtls();
        regularUser.setId(2L);
        regularUser.setRole(regularRole);

        when(userRepository.findById(2L)).thenReturn(Optional.of(regularUser));

        // Act
        ApiResponse<RatingResponse> result = ratingService.replyToRating(2L, 1L, staffReplyRequest);

        // Assert
        assertFalse(result.isSuccess());
        assertEquals("Only staff members can reply to ratings", result.getMessage());
        assertNull(result.getData());

        verify(ratingRepository, never()).save(any(Rating.class));
    }

    @Test
    void replyToRating_RatingNotFound() {
        // Arrange
        when(userRepository.findById(2L)).thenReturn(Optional.of(testStaff));
        when(ratingRepository.findById(1L)).thenReturn(Optional.empty());

        // Act
        ApiResponse<RatingResponse> result = ratingService.replyToRating(2L, 1L, staffReplyRequest);

        // Assert
        assertFalse(result.isSuccess());
        assertEquals("Rating not found", result.getMessage());
        assertNull(result.getData());

        verify(ratingRepository, never()).save(any(Rating.class));
    }

    @Test
    void replyToRating_AdminCanReply() {
        // Arrange
        Role adminRole = new Role();
        adminRole.setRoleId(4L);
        adminRole.setRoleName("ADMIN");

        UserDtls admin = new UserDtls();
        admin.setId(3L);
        admin.setRole(adminRole);

        when(userRepository.findById(3L)).thenReturn(Optional.of(admin));
        when(ratingRepository.findById(1L)).thenReturn(Optional.of(testRating));
        when(ratingRepository.save(any(Rating.class))).thenReturn(testRating);

        // Act
        ApiResponse<RatingResponse> result = ratingService.replyToRating(3L, 1L, staffReplyRequest);

        // Assert
        assertTrue(result.isSuccess());
        assertEquals("Staff reply added successfully", result.getMessage());
        assertNotNull(result.getData());

        verify(ratingRepository).save(any(Rating.class));
    }

    // ===================== UPDATE STAFF REPLY TESTS =====================

    @Test
    void updateStaffReply_Success() {
        // Arrange
        testRating.setStaffReply("Previous reply");
        testRating.setRepliedBy(testStaff);
        testRating.setRepliedAt(LocalDateTime.now().minusHours(1));

        when(userRepository.findById(2L)).thenReturn(Optional.of(testStaff));
        when(ratingRepository.findById(1L)).thenReturn(Optional.of(testRating));
        when(ratingRepository.save(any(Rating.class))).thenReturn(testRating);

        // Act
        ApiResponse<RatingResponse> result = ratingService.updateStaffReply(2L, 1L, staffReplyRequest);

        // Assert
        assertTrue(result.isSuccess());
        assertEquals("Staff reply updated successfully", result.getMessage());
        assertNotNull(result.getData());

        verify(ratingRepository).save(any(Rating.class));
    }

    @Test
    void updateStaffReply_NoExistingReply() {
        // Arrange
        testRating.setStaffReply(null); // No existing reply

        when(userRepository.findById(2L)).thenReturn(Optional.of(testStaff));
        when(ratingRepository.findById(1L)).thenReturn(Optional.of(testRating));

        // Act
        ApiResponse<RatingResponse> result = ratingService.updateStaffReply(2L, 1L, staffReplyRequest);

        // Assert
        assertFalse(result.isSuccess());
        assertEquals("No existing reply to update", result.getMessage());
        assertNull(result.getData());

        verify(ratingRepository, never()).save(any(Rating.class));
    }

    // ===================== DELETE STAFF REPLY TESTS =====================

    @Test
    void deleteStaffReply_Success() {
        // Arrange
        testRating.setStaffReply("Existing reply");
        testRating.setRepliedBy(testStaff);
        testRating.setRepliedAt(LocalDateTime.now().minusHours(1));

        when(userRepository.findById(2L)).thenReturn(Optional.of(testStaff));
        when(ratingRepository.findById(1L)).thenReturn(Optional.of(testRating));

        // Act
        ApiResponse<String> result = ratingService.deleteStaffReply(2L, 1L);

        // Assert
        assertTrue(result.isSuccess());
        assertEquals("Staff reply deleted successfully", result.getMessage());

        verify(ratingRepository).save(any(Rating.class));
    }

    @Test
    void deleteStaffReply_NoExistingReply() {
        // Arrange
        testRating.setStaffReply(null); // No existing reply

        when(userRepository.findById(2L)).thenReturn(Optional.of(testStaff));
        when(ratingRepository.findById(1L)).thenReturn(Optional.of(testRating));

        // Act
        ApiResponse<String> result = ratingService.deleteStaffReply(2L, 1L);

        // Assert
        assertFalse(result.isSuccess());
        assertEquals("No existing reply to delete", result.getMessage());

        verify(ratingRepository, never()).save(any(Rating.class));
    }

    // ===================== GET PENDING REPLY RATINGS TESTS =====================

    @Test
    void getPendingReplyRatings_Success() {
        // Arrange
        List<Rating> pendingRatings = Arrays.asList(testRating);

        when(ratingRepository.findPendingReplyRatings(Rating.RatingTargetType.CONSULTANT, 100L))
                .thenReturn(pendingRatings);

        // Act
        ApiResponse<Page<RatingResponse>> result = ratingService.getPendingReplyRatings(
                Rating.RatingTargetType.CONSULTANT, 100L, 0, 10);

        // Assert
        assertTrue(result.isSuccess());
        assertEquals("Pending reply ratings retrieved successfully", result.getMessage());
        assertNotNull(result.getData());
        assertEquals(1, result.getData().getContent().size());
    }

    @Test
    void getPendingReplyRatings_EmptyList() {
        // Arrange
        when(ratingRepository.findPendingReplyRatings(Rating.RatingTargetType.CONSULTANT, 100L))
                .thenReturn(Collections.emptyList());

        // Act
        ApiResponse<Page<RatingResponse>> result = ratingService.getPendingReplyRatings(
                Rating.RatingTargetType.CONSULTANT, 100L, 0, 10);

        // Assert
        assertTrue(result.isSuccess());
        assertEquals("Pending reply ratings retrieved successfully", result.getMessage());
        assertNotNull(result.getData());
        assertEquals(0, result.getData().getContent().size());
    }

    // ===================== UPDATE RATING SUMMARY TESTS =====================

    @Test
    void updateRatingSummary_Success_NewSummary() {
        // Arrange
        List<Rating> ratings = Arrays.asList(testRating);

        when(ratingRepository.findByTargetTypeAndTargetIdAndIsActiveTrueOrderByCreatedAtDesc(
                Rating.RatingTargetType.CONSULTANT, 100L))
                .thenReturn(ratings);
        when(ratingSummaryRepository.findByTargetTypeAndTargetId(Rating.RatingTargetType.CONSULTANT, 100L))
                .thenReturn(Optional.empty());
        when(ratingSummaryRepository.save(any(RatingSummary.class))).thenReturn(testSummary);

        // Act
        ratingService.updateRatingSummary(Rating.RatingTargetType.CONSULTANT, 100L);

        // Assert
        verify(ratingSummaryRepository).save(any(RatingSummary.class));
    }

    @Test
    void updateRatingSummary_Success_ExistingSummary() {
        // Arrange
        List<Rating> ratings = Arrays.asList(testRating);

        when(ratingRepository.findByTargetTypeAndTargetIdAndIsActiveTrueOrderByCreatedAtDesc(
                Rating.RatingTargetType.CONSULTANT, 100L))
                .thenReturn(ratings);
        when(ratingSummaryRepository.findByTargetTypeAndTargetId(Rating.RatingTargetType.CONSULTANT, 100L))
                .thenReturn(Optional.of(testSummary));
        when(ratingSummaryRepository.save(any(RatingSummary.class))).thenReturn(testSummary);

        // Act
        ratingService.updateRatingSummary(Rating.RatingTargetType.CONSULTANT, 100L);

        // Assert
        verify(ratingSummaryRepository).save(any(RatingSummary.class));
    }

    @Test
    void updateRatingSummary_Success_NoRatings() {
        // Arrange
        when(ratingRepository.findByTargetTypeAndTargetIdAndIsActiveTrueOrderByCreatedAtDesc(
                Rating.RatingTargetType.CONSULTANT, 100L))
                .thenReturn(Collections.emptyList());
        when(ratingSummaryRepository.findByTargetTypeAndTargetId(Rating.RatingTargetType.CONSULTANT, 100L))
                .thenReturn(Optional.of(testSummary));
        when(ratingSummaryRepository.save(any(RatingSummary.class))).thenReturn(testSummary);

        // Act
        ratingService.updateRatingSummary(Rating.RatingTargetType.CONSULTANT, 100L);

        // Assert
        verify(ratingSummaryRepository).save(any(RatingSummary.class));
    }

    // ===================== PRIVATE METHOD TESTS =====================

    @Test
    void mapRatingToResponse_Success() {
        // Test the mapping functionality through a public method that uses it
        when(ratingRepository.findById(1L)).thenReturn(Optional.of(testRating));
        when(ratingRepository.save(any(Rating.class))).thenReturn(testRating);

        ApiResponse<RatingResponse> result = ratingService.updateRating(1L, 1L, updateRatingRequest);

        assertTrue(result.isSuccess());
        RatingResponse response = result.getData();
        assertNotNull(response);
        assertEquals(testRating.getRatingId(), response.getRatingId());
        assertEquals(testRating.getUser().getId(), response.getUserId());
        assertEquals(testRating.getUser().getFullName(), response.getUserFullName());
        assertEquals(testRating.getTargetType(), response.getTargetType());
        assertEquals(testRating.getTargetId(), response.getTargetId());
        assertEquals(testRating.getRating(), response.getRating());
        assertTrue(response.getCanEdit()); // Should be true for recent ratings
    }

    @Test
    void mapRatingToResponse_WithStaffReply() {
        // Arrange
        testRating.setStaffReply("Staff reply here");
        testRating.setRepliedBy(testStaff);
        testRating.setRepliedAt(LocalDateTime.now());

        when(ratingRepository.findById(1L)).thenReturn(Optional.of(testRating));
        when(ratingRepository.save(any(Rating.class))).thenReturn(testRating);

        // Act
        ApiResponse<RatingResponse> result = ratingService.updateRating(1L, 1L, updateRatingRequest);

        // Assert
        assertTrue(result.isSuccess());
        RatingResponse response = result.getData();
        assertNotNull(response);
        assertEquals("Staff reply here", response.getStaffReply());
        assertEquals(testStaff.getId(), response.getRepliedById());
        assertEquals(testStaff.getFullName(), response.getRepliedByName());
        assertNotNull(response.getRepliedAt());
    }

    @Test
    void mapRatingToResponse_OldRating_CannotEdit() {
        // Arrange
        Rating oldRating = new Rating();
        oldRating.setRatingId(1L);
        oldRating.setUser(testUser);
        oldRating.setTargetType(Rating.RatingTargetType.CONSULTANT);
        oldRating.setTargetId(100L);
        oldRating.setRating(5);
        oldRating.setComment("Old comment");
        oldRating.setIsActive(true);
        oldRating.setCreatedAt(LocalDateTime.now().minusHours(25)); // Old rating
        oldRating.setUpdatedAt(LocalDateTime.now().minusHours(25));

        when(ratingRepository.findById(1L)).thenReturn(Optional.of(oldRating));

        // Act - This should fail because rating is too old
        ApiResponse<RatingResponse> result = ratingService.updateRating(1L, 1L, updateRatingRequest);

        // Assert
        assertFalse(result.isSuccess());
        assertEquals("You can only update ratings within 24 hours of creation", result.getMessage());
    }

    // ===================== ERROR HANDLING TESTS =====================

    @Test
    void createRating_Exception() {
        // Arrange
        when(userRepository.findById(1L)).thenThrow(new RuntimeException("Database error"));

        // Act
        ApiResponse<RatingResponse> result = ratingService.createRating(
                1L, Rating.RatingTargetType.CONSULTANT, 100L, createRatingRequest);

        // Assert
        assertFalse(result.isSuccess());
        assertTrue(result.getMessage().contains("Unable to create rating"));
    }

    @Test
    void getRatings_Exception() {
        // Arrange
        when(ratingRepository.findByTargetTypeAndTargetIdAndIsActiveTrue(
                any(), any(), any(Pageable.class)))
                .thenThrow(new RuntimeException("Database error"));

        // Act
        ApiResponse<Page<RatingResponse>> result = ratingService.getRatings(
                Rating.RatingTargetType.CONSULTANT, 100L, 0, 10, "newest", null, null);

        // Assert
        assertFalse(result.isSuccess());
        assertTrue(result.getMessage().contains("Unable to get ratings"));
    }

    @Test
    void getRatingSummary_Exception() {
        // Arrange
        when(ratingSummaryRepository.findByTargetTypeAndTargetId(any(), any()))
                .thenThrow(new RuntimeException("Database error"));

        // Act
        ApiResponse<RatingSummaryResponse> result = ratingService.getRatingSummary(
                Rating.RatingTargetType.CONSULTANT, 100L, false);

        // Assert
        assertFalse(result.isSuccess());
        assertTrue(result.getMessage().contains("Unable to get rating summary"));
    }
}
