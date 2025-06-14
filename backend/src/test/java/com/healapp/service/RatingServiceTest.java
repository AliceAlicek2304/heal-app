package com.healapp.service;

import com.healapp.dto.*;
import com.healapp.model.*;
import com.healapp.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;

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

    @Mock
    private ConsultationRepository consultationRepository;

    @Mock
    private STITestRepository stiTestRepository;

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
    private Consultation testConsultation;
    private STITest testStiTest;

    @BeforeEach
    void setUp() {
        // Setup roles
        userRole = new Role();
        userRole.setRoleId(1L);
        userRole.setRoleName("USER");

        staffRole = new Role();
        staffRole.setRoleId(2L);
        staffRole.setRoleName("STAFF");

        // Setup test user
        testUser = new UserDtls();
        testUser.setId(1L);
        testUser.setFullName("Test User");
        testUser.setEmail("test@example.com");
        testUser.setRole(userRole);
        testUser.setAvatar("avatar.jpg");

        // Setup test staff
        testStaff = new UserDtls();
        testStaff.setId(2L);
        testStaff.setFullName("Test Staff");
        testStaff.setEmail("staff@example.com");
        testStaff.setRole(staffRole);

        // Setup test rating
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

        // Setup test summary
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

        // Setup DTOs
        createRatingRequest = new CreateRatingRequest();
        createRatingRequest.setRating(5);
        createRatingRequest.setComment("Excellent service!");

        updateRatingRequest = new UpdateRatingRequest();
        updateRatingRequest.setRating(4);
        updateRatingRequest.setComment("Updated comment");

        staffReplyRequest = new StaffReplyRequest();
        staffReplyRequest.setStaffReply("Thank you for your feedback!"); // Setup consultation
        testConsultation = new Consultation();
        testConsultation.setConsultationId(1L);
        testConsultation.setCustomer(testUser);
        testConsultation.setConsultant(testStaff); // Using testStaff as consultant
        testConsultation.setStatus(ConsultationStatus.COMPLETED);

        // Setup STI test
        testStiTest = new STITest();
        testStiTest.setTestId(1L);
        testStiTest.setCustomer(testUser);
        testStiTest.setStatus(TestStatus.COMPLETED);
    }

    // ===================== CREATE RATING TESTS =====================

    @Test
    void createRating_Success() {
        // Arrange
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(ratingRepository.existsByUserIdAndTargetTypeAndTargetId(1L, Rating.RatingTargetType.CONSULTANT, 100L))
                .thenReturn(false);
        when(consultationRepository.findByCustomerIdAndConsultantIdAndStatus(1L, 100L, ConsultationStatus.COMPLETED))
                .thenReturn(Arrays.asList(testConsultation));
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
        verify(consultationRepository).findByCustomerIdAndConsultantIdAndStatus(1L, 100L, ConsultationStatus.COMPLETED);
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
        verify(ratingRepository, never()).save(any(Rating.class));
    }

    @Test
    void createRating_NotEligible() {
        // Arrange
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(ratingRepository.existsByUserIdAndTargetTypeAndTargetId(1L, Rating.RatingTargetType.CONSULTANT, 100L))
                .thenReturn(false);
        when(consultationRepository.findByCustomerIdAndConsultantIdAndStatus(1L, 100L, ConsultationStatus.COMPLETED))
                .thenReturn(Arrays.asList()); // Empty list = not eligible

        // Act
        ApiResponse<RatingResponse> result = ratingService.createRating(
                1L, Rating.RatingTargetType.CONSULTANT, 100L, createRatingRequest);

        // Assert
        assertFalse(result.isSuccess());
        assertEquals("You are not eligible to rate this consultant", result.getMessage());
        verify(ratingRepository, never()).save(any(Rating.class));
    }

    @Test
    void createRating_STIService_Success() {
        // Arrange
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(ratingRepository.existsByUserIdAndTargetTypeAndTargetId(1L, Rating.RatingTargetType.STI_SERVICE, 100L))
                .thenReturn(false);
        when(stiTestRepository.findByCustomerIdAndStiServiceServiceIdAndStatus(1L, 100L, TestStatus.COMPLETED))
                .thenReturn(Arrays.asList(testStiTest));
        when(ratingRepository.save(any(Rating.class))).thenReturn(testRating);

        // Act
        ApiResponse<RatingResponse> result = ratingService.createRating(
                1L, Rating.RatingTargetType.STI_SERVICE, 100L, createRatingRequest);

        // Assert
        assertTrue(result.isSuccess());
        assertEquals("Rating created successfully", result.getMessage());
        verify(stiTestRepository).findByCustomerIdAndStiServiceServiceIdAndStatus(1L, 100L, TestStatus.COMPLETED);
    }

    // ===================== UPDATE RATING TESTS =====================

    @Test
    void updateRating_Success() {
        // Arrange
        testRating.setCreatedAt(LocalDateTime.now().minusHours(12)); // Within 24h
        when(ratingRepository.findById(1L)).thenReturn(Optional.of(testRating));
        when(ratingRepository.save(any(Rating.class))).thenReturn(testRating);

        // Act
        ApiResponse<RatingResponse> result = ratingService.updateRating(1L, 1L, updateRatingRequest);

        // Assert
        assertTrue(result.isSuccess());
        assertEquals("Rating updated successfully", result.getMessage());
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
    }

    @Test
    void updateRating_TooLate() {
        // Arrange
        testRating.setCreatedAt(LocalDateTime.now().minusHours(25)); // Over 24h
        when(ratingRepository.findById(1L)).thenReturn(Optional.of(testRating));

        // Act
        ApiResponse<RatingResponse> result = ratingService.updateRating(1L, 1L, updateRatingRequest);

        // Assert
        assertFalse(result.isSuccess());
        assertEquals("You can only update ratings within 24 hours of creation", result.getMessage());
    }

    // ===================== DELETE RATING TESTS =====================

    @Test
    void deleteRating_Success() {
        // Arrange
        testRating.setCreatedAt(LocalDateTime.now().minusHours(12)); // Within 24h
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
    }

    @Test
    void deleteRating_TooLate() {
        // Arrange
        testRating.setCreatedAt(LocalDateTime.now().minusHours(25)); // Over 24h
        when(ratingRepository.findById(1L)).thenReturn(Optional.of(testRating));

        // Act
        ApiResponse<String> result = ratingService.deleteRating(1L, 1L);

        // Assert
        assertFalse(result.isSuccess());
        assertEquals("You can only delete ratings within 24 hours of creation", result.getMessage());
    }

    // ===================== GET RATINGS TESTS =====================

    @Test
    void getRatings_Success() {
        // Arrange
        List<Rating> ratings = Arrays.asList(testRating);
        Page<Rating> ratingsPage = new PageImpl<>(ratings);
        when(ratingRepository.findByTargetTypeAndTargetIdAndIsActiveTrue(
                any(), any(), any(Pageable.class))).thenReturn(ratingsPage);

        // Act
        ApiResponse<Page<RatingResponse>> result = ratingService.getRatings(
                Rating.RatingTargetType.CONSULTANT, 100L, 0, 10, "newest", null, null);

        // Assert
        assertTrue(result.isSuccess());
        assertEquals("Ratings retrieved successfully", result.getMessage());
        assertEquals(1, result.getData().getTotalElements());
    }

    @Test
    void getRatings_WithFilter() {
        // Arrange
        List<Rating> ratings = Arrays.asList(testRating);
        Page<Rating> ratingsPage = new PageImpl<>(ratings);
        when(ratingRepository.findByTargetTypeAndTargetIdAndRatingAndIsActiveTrue(
                any(), any(), eq(5), any(Pageable.class))).thenReturn(ratingsPage);

        // Act
        ApiResponse<Page<RatingResponse>> result = ratingService.getRatings(
                Rating.RatingTargetType.CONSULTANT, 100L, 0, 10, "newest", 5, null);

        // Assert
        assertTrue(result.isSuccess());
        assertEquals("Ratings retrieved successfully", result.getMessage());
        verify(ratingRepository).findByTargetTypeAndTargetIdAndRatingAndIsActiveTrue(
                any(), any(), eq(5), any(Pageable.class));
    }

    @Test
    void getRatings_WithKeyword() {
        // Arrange
        List<Rating> ratings = Arrays.asList(testRating);
        Page<Rating> ratingsPage = new PageImpl<>(ratings);
        when(ratingRepository.searchInComments(any(), any(), eq("excellent"), any(Pageable.class)))
                .thenReturn(ratingsPage);

        // Act
        ApiResponse<Page<RatingResponse>> result = ratingService.getRatings(
                Rating.RatingTargetType.CONSULTANT, 100L, 0, 10, "newest", null, "excellent");

        // Assert
        assertTrue(result.isSuccess());
        assertEquals("Ratings retrieved successfully", result.getMessage());
        verify(ratingRepository).searchInComments(any(), any(), eq("excellent"), any(Pageable.class));
    }

    // ===================== GET RATING SUMMARY TESTS =====================

    @Test
    void getRatingSummary_ExistingSummary() {
        // Arrange
        when(ratingSummaryRepository.findByTargetTypeAndTargetId(
                Rating.RatingTargetType.CONSULTANT, 100L)).thenReturn(Optional.of(testSummary));

        // Act
        ApiResponse<RatingSummaryResponse> result = ratingService.getRatingSummary(
                Rating.RatingTargetType.CONSULTANT, 100L, false);

        // Assert
        assertTrue(result.isSuccess());
        assertEquals("Rating summary retrieved successfully", result.getMessage());
        assertEquals(10, result.getData().getTotalRatings());
        assertEquals(BigDecimal.valueOf(4.5), result.getData().getAverageRating());
    }

    @Test
    void getRatingSummary_NoSummary() {
        // Arrange
        when(ratingSummaryRepository.findByTargetTypeAndTargetId(
                Rating.RatingTargetType.CONSULTANT, 100L)).thenReturn(Optional.empty());

        // Act
        ApiResponse<RatingSummaryResponse> result = ratingService.getRatingSummary(
                Rating.RatingTargetType.CONSULTANT, 100L, false);

        // Assert
        assertTrue(result.isSuccess());
        assertEquals("Rating summary retrieved successfully", result.getMessage());
        assertEquals(0, result.getData().getTotalRatings());
        assertEquals(BigDecimal.ZERO, result.getData().getAverageRating());
    }

    @Test
    void getRatingSummary_WithRecentReviews() {
        // Arrange
        when(ratingSummaryRepository.findByTargetTypeAndTargetId(
                Rating.RatingTargetType.CONSULTANT, 100L)).thenReturn(Optional.of(testSummary));
        when(ratingRepository.findTopRatingsWithComments(any(), any(), any(Pageable.class)))
                .thenReturn(Arrays.asList(testRating));

        // Act
        ApiResponse<RatingSummaryResponse> result = ratingService.getRatingSummary(
                Rating.RatingTargetType.CONSULTANT, 100L, true);

        // Assert
        assertTrue(result.isSuccess());
        assertEquals("Rating summary retrieved successfully", result.getMessage());
        assertNotNull(result.getData().getRecentRatings());
        assertEquals(1, result.getData().getRecentRatings().size());
    }

    // ===================== CHECK RATING ELIGIBILITY TESTS =====================

    @Test
    void checkRatingEligibility_CanRate() {
        // Arrange
        when(consultationRepository.findByCustomerIdAndConsultantIdAndStatus(1L, 100L, ConsultationStatus.COMPLETED))
                .thenReturn(Arrays.asList(testConsultation));
        when(ratingRepository.existsByUserIdAndTargetTypeAndTargetId(1L, Rating.RatingTargetType.CONSULTANT, 100L))
                .thenReturn(false);

        // Act
        ApiResponse<Map<String, Object>> result = ratingService.checkRatingEligibility(
                1L, Rating.RatingTargetType.CONSULTANT, 100L);

        // Assert
        assertTrue(result.isSuccess());
        assertEquals("Check completed", result.getMessage());
        assertTrue((Boolean) result.getData().get("canRate"));
        assertFalse((Boolean) result.getData().get("hasRated"));
    }

    @Test
    void checkRatingEligibility_AlreadyRated() {
        // Arrange
        when(consultationRepository.findByCustomerIdAndConsultantIdAndStatus(1L, 100L, ConsultationStatus.COMPLETED))
                .thenReturn(Arrays.asList(testConsultation));
        when(ratingRepository.existsByUserIdAndTargetTypeAndTargetId(1L, Rating.RatingTargetType.CONSULTANT, 100L))
                .thenReturn(true);

        // Act
        ApiResponse<Map<String, Object>> result = ratingService.checkRatingEligibility(
                1L, Rating.RatingTargetType.CONSULTANT, 100L);

        // Assert
        assertTrue(result.isSuccess());
        assertEquals("Check completed", result.getMessage());
        assertFalse((Boolean) result.getData().get("canRate"));
        assertTrue((Boolean) result.getData().get("hasRated"));
    }

    @Test
    void checkRatingEligibility_NotEligible() {
        // Arrange
        when(consultationRepository.findByCustomerIdAndConsultantIdAndStatus(1L, 100L, ConsultationStatus.COMPLETED))
                .thenReturn(Arrays.asList()); // Empty list
        when(ratingRepository.existsByUserIdAndTargetTypeAndTargetId(1L, Rating.RatingTargetType.CONSULTANT, 100L))
                .thenReturn(false);

        // Act
        ApiResponse<Map<String, Object>> result = ratingService.checkRatingEligibility(
                1L, Rating.RatingTargetType.CONSULTANT, 100L);

        // Assert
        assertTrue(result.isSuccess());
        assertEquals("Check completed", result.getMessage());
        assertFalse((Boolean) result.getData().get("canRate"));
        assertFalse((Boolean) result.getData().get("hasRated"));
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
    }

    @Test
    void replyToRating_NotStaff() {
        // Arrange
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser)); // Regular user, not staff

        // Act
        ApiResponse<RatingResponse> result = ratingService.replyToRating(1L, 1L, staffReplyRequest);

        // Assert
        assertFalse(result.isSuccess());
        assertEquals("Only staff members can reply to ratings", result.getMessage());
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
    }

    // ===================== UPDATE STAFF REPLY TESTS =====================

    @Test
    void updateStaffReply_Success() {
        // Arrange
        testRating.setStaffReply("Old reply");
        when(userRepository.findById(2L)).thenReturn(Optional.of(testStaff));
        when(ratingRepository.findById(1L)).thenReturn(Optional.of(testRating));
        when(ratingRepository.save(any(Rating.class))).thenReturn(testRating);

        // Act
        ApiResponse<RatingResponse> result = ratingService.updateStaffReply(2L, 1L, staffReplyRequest);

        // Assert
        assertTrue(result.isSuccess());
        assertEquals("Staff reply updated successfully", result.getMessage());
        verify(ratingRepository).save(any(Rating.class));
    }

    @Test
    void updateStaffReply_NoExistingReply() {
        // Arrange
        testRating.setStaffReply(null);
        when(userRepository.findById(2L)).thenReturn(Optional.of(testStaff));
        when(ratingRepository.findById(1L)).thenReturn(Optional.of(testRating));

        // Act
        ApiResponse<RatingResponse> result = ratingService.updateStaffReply(2L, 1L, staffReplyRequest);

        // Assert
        assertFalse(result.isSuccess());
        assertEquals("No existing reply to update", result.getMessage());
    }

    // ===================== DELETE STAFF REPLY TESTS =====================

    @Test
    void deleteStaffReply_Success() {
        // Arrange
        testRating.setStaffReply("Existing reply");
        when(userRepository.findById(2L)).thenReturn(Optional.of(testStaff));
        when(ratingRepository.findById(1L)).thenReturn(Optional.of(testRating));
        when(ratingRepository.save(any(Rating.class))).thenReturn(testRating);

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
        testRating.setStaffReply(null);
        when(userRepository.findById(2L)).thenReturn(Optional.of(testStaff));
        when(ratingRepository.findById(1L)).thenReturn(Optional.of(testRating));

        // Act
        ApiResponse<String> result = ratingService.deleteStaffReply(2L, 1L);

        // Assert
        assertFalse(result.isSuccess());
        assertEquals("No existing reply to delete", result.getMessage());
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
        assertEquals(1, result.getData().getTotalElements());
    }

    // ===================== GET USER RATINGS TESTS =====================

    @Test
    void getUserRatings_Success() {
        // Arrange
        List<Rating> userRatings = Arrays.asList(testRating);
        Page<Rating> userRatingsPage = new PageImpl<>(userRatings);
        when(ratingRepository.findByUserIdAndIsActiveTrueOrderByCreatedAtDesc(eq(1L), any(Pageable.class)))
                .thenReturn(userRatingsPage);

        // Act
        ApiResponse<Page<RatingResponse>> result = ratingService.getUserRatings(1L, 0, 10);

        // Assert
        assertTrue(result.isSuccess());
        assertEquals("User ratings retrieved successfully", result.getMessage());
        assertEquals(1, result.getData().getTotalElements());
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
        when(ratingRepository.findByTargetTypeAndTargetIdAndIsActiveTrue(any(), any(), any(Pageable.class)))
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

    @Test
    void replyToRating_Exception() {
        // Arrange
        when(userRepository.findById(2L)).thenThrow(new RuntimeException("Database error"));

        // Act
        ApiResponse<RatingResponse> result = ratingService.replyToRating(2L, 1L, staffReplyRequest);

        // Assert
        assertFalse(result.isSuccess());
        assertTrue(result.getMessage().contains("Unable to add staff reply"));
    }

    @Test
    void checkRatingEligibility_Exception() {
        // Arrange
        when(consultationRepository.findByCustomerIdAndConsultantIdAndStatus(any(), any(), any()))
                .thenThrow(new RuntimeException("Database error"));

        // Act
        ApiResponse<Map<String, Object>> result = ratingService.checkRatingEligibility(
                1L, Rating.RatingTargetType.CONSULTANT, 100L);

        // Assert
        assertFalse(result.isSuccess());
        assertTrue(result.getMessage().contains("Unable to check rating eligibility"));
    }
}
