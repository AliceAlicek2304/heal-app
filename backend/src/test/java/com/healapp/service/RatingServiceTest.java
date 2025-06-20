package com.healapp.service;

import com.healapp.dto.*;
import com.healapp.model.*;
import com.healapp.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("Rating Service Test")
public class RatingServiceTest {

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

    private UserDtls customer;
    private UserDtls staff;
    private UserDtls admin;
    private Rating consultantRating;
    private Rating stiServiceRating;
    private Consultation consultation;
    private STITest stiTest;
    private CreateRatingRequest validRequest;
    private UpdateRatingRequest updateRequest;
    private StaffReplyRequest staffReplyRequest;
    private RatingSummary ratingSummary;
    private Role customerRole;
    private Role staffRole;
    private Role adminRole;

    @BeforeEach
    void setUp() {
        // Initialize roles
        customerRole = new Role();
        customerRole.setRoleId(1L);
        customerRole.setRoleName("USER");

        staffRole = new Role();
        staffRole.setRoleId(2L);
        staffRole.setRoleName("STAFF");

        adminRole = new Role();
        adminRole.setRoleId(3L);
        adminRole.setRoleName("ADMIN");

        // Initialize users
        customer = new UserDtls();
        customer.setId(1L);
        customer.setUsername("customer");
        customer.setFullName("Test Customer");
        customer.setEmail("customer@test.com");
        customer.setAvatar("/avatar/customer.jpg");
        customer.setRole(customerRole);

        staff = new UserDtls();
        staff.setId(2L);
        staff.setUsername("staff");
        staff.setFullName("Test Staff");
        staff.setEmail("staff@test.com");
        staff.setAvatar("/avatar/staff.jpg");
        staff.setRole(staffRole);

        admin = new UserDtls();
        admin.setId(3L);
        admin.setUsername("admin");
        admin.setFullName("Test Admin");
        admin.setEmail("admin@test.com");
        admin.setAvatar("/avatar/admin.jpg");
        admin.setRole(adminRole);

        // Initialize consultation
        consultation = new Consultation();
        consultation.setConsultationId(10L);
        consultation.setCustomer(customer);
        consultation.setStatus(ConsultationStatus.COMPLETED);

        // Initialize STI test
        stiTest = new STITest();
        stiTest.setTestId(20L);
        stiTest.setCustomer(customer);
        stiTest.setStatus(TestStatus.COMPLETED);

        // Initialize ratings
        consultantRating = new Rating();
        consultantRating.setRatingId(1L);
        consultantRating.setUser(customer);
        consultantRating.setTargetType(Rating.RatingTargetType.CONSULTANT);
        consultantRating.setTargetId(5L);
        consultantRating.setRating(5);
        consultantRating.setComment("Great consultant!");
        consultantRating.setConsultationId(10L);
        consultantRating.setIsActive(true);
        consultantRating.setCreatedAt(LocalDateTime.now());
        consultantRating.setUpdatedAt(LocalDateTime.now());

        stiServiceRating = new Rating();
        stiServiceRating.setRatingId(2L);
        stiServiceRating.setUser(customer);
        stiServiceRating.setTargetType(Rating.RatingTargetType.STI_SERVICE);
        stiServiceRating.setTargetId(15L);
        stiServiceRating.setRating(4);
        stiServiceRating.setComment("Good service");
        stiServiceRating.setStiTestId(20L);
        stiServiceRating.setIsActive(true);
        stiServiceRating.setCreatedAt(LocalDateTime.now());
        stiServiceRating.setUpdatedAt(LocalDateTime.now());

        // Initialize rating summary
        ratingSummary = new RatingSummary();
        ratingSummary.setTargetType(Rating.RatingTargetType.CONSULTANT);
        ratingSummary.setTargetId(5L);
        ratingSummary.setTotalRatings(10);
        ratingSummary.setAverageRating(BigDecimal.valueOf(4.5));
        ratingSummary.setFiveStarCount(6);
        ratingSummary.setFourStarCount(3);
        ratingSummary.setThreeStarCount(1);
        ratingSummary.setTwoStarCount(0);
        ratingSummary.setOneStarCount(0);

        // Initialize requests
        validRequest = new CreateRatingRequest();
        validRequest.setRating(5);
        validRequest.setComment("Great service!");
        validRequest.setConsultationId(10L);

        updateRequest = new UpdateRatingRequest();
        updateRequest.setRating(4);
        updateRequest.setComment("Updated comment");

        staffReplyRequest = new StaffReplyRequest();
        staffReplyRequest.setStaffReply("Thank you for your feedback!");
    }

    @Test
    @DisplayName("Create Rating - Success")
    void createRating_Success() {
        // Arrange
        when(userRepository.findById(customer.getId())).thenReturn(Optional.of(customer));
        when(ratingRepository.existsByUserIdAndConsultationIdAndIsActiveTrue(anyLong(), anyLong())).thenReturn(false);
        // Mock the specific consultation check to ensure eligibility passes
        when(consultationRepository.findById(validRequest.getConsultationId())).thenReturn(Optional.of(consultation));
        when(ratingRepository.save(any(Rating.class))).thenReturn(consultantRating);

        // Act
        ApiResponse<RatingResponse> response = ratingService.createRating(
                customer.getId(),
                Rating.RatingTargetType.CONSULTANT,
                5L,
                validRequest);

        // Assert
        assertTrue(response.isSuccess());
        assertEquals("Rating created successfully", response.getMessage());
        assertNotNull(response.getData());
        assertEquals(consultantRating.getRatingId(), response.getData().getRatingId());
        assertEquals(5, response.getData().getRating());

        // Verify
        verify(ratingRepository).save(any(Rating.class));
    }

    @Test
    @DisplayName("Create Rating - User Not Found")
    void createRating_UserNotFound() {
        // Arrange
        when(userRepository.findById(999L)).thenReturn(Optional.empty());

        // Act
        ApiResponse<RatingResponse> response = ratingService.createRating(
                999L,
                Rating.RatingTargetType.CONSULTANT,
                5L,
                validRequest);

        // Assert
        assertFalse(response.isSuccess());
        assertEquals("User not found", response.getMessage());
        assertNull(response.getData());

        // Verify
        verify(ratingRepository, never()).save(any(Rating.class));
    }

    @Test
    @DisplayName("Create Rating - Already Rated")
    void createRating_AlreadyRated() {
        // Arrange
        when(userRepository.findById(customer.getId())).thenReturn(Optional.of(customer));
        when(ratingRepository.existsByUserIdAndConsultationIdAndIsActiveTrue(anyLong(), anyLong())).thenReturn(true);

        // Act
        ApiResponse<RatingResponse> response = ratingService.createRating(
                customer.getId(),
                Rating.RatingTargetType.CONSULTANT,
                5L,
                validRequest);

        // Assert
        assertFalse(response.isSuccess());
        assertEquals("You have already rated this consultant", response.getMessage());
        assertNull(response.getData());

        // Verify
        verify(ratingRepository, never()).save(any(Rating.class));
    }

    @Test
    @DisplayName("Create Rating - Not Eligible")
    void createRating_NotEligible() {
        // Arrange
        when(userRepository.findById(customer.getId())).thenReturn(Optional.of(customer));
        when(consultationRepository.findById(validRequest.getConsultationId())).thenReturn(Optional.empty());

        // Act
        ApiResponse<RatingResponse> response = ratingService.createRating(
                customer.getId(),
                Rating.RatingTargetType.CONSULTANT,
                5L,
                validRequest);

        // Assert
        assertFalse(response.isSuccess());
        assertEquals("You are not eligible to rate this consultant", response.getMessage());
        assertNull(response.getData());

        // Verify
        verify(ratingRepository, never()).save(any(Rating.class));
    }

    @Test
    @DisplayName("Update Rating - Success")
    void updateRating_Success() {
        // Arrange
        when(ratingRepository.findById(consultantRating.getRatingId())).thenReturn(Optional.of(consultantRating));
        when(ratingRepository.save(any(Rating.class))).thenReturn(consultantRating);

        // Act
        ApiResponse<RatingResponse> response = ratingService.updateRating(
                customer.getId(),
                consultantRating.getRatingId(),
                updateRequest);

        // Assert
        assertTrue(response.isSuccess());
        assertEquals("Rating updated successfully", response.getMessage());
        assertNotNull(response.getData());
        assertEquals(consultantRating.getRatingId(), response.getData().getRatingId());

        // Verify
        verify(ratingRepository).save(any(Rating.class));
    }

    @Test
    @DisplayName("Update Rating - Not Found")
    void updateRating_NotFound() {
        // Arrange
        when(ratingRepository.findById(999L)).thenReturn(Optional.empty());

        // Act
        ApiResponse<RatingResponse> response = ratingService.updateRating(
                customer.getId(),
                999L,
                updateRequest);

        // Assert
        assertFalse(response.isSuccess());
        assertEquals("Rating not found", response.getMessage());
        assertNull(response.getData());

        // Verify
        verify(ratingRepository, never()).save(any(Rating.class));
    }

    @Test
    @DisplayName("Update Rating - Not Owner")
    void updateRating_NotOwner() {
        // Arrange
        when(ratingRepository.findById(consultantRating.getRatingId())).thenReturn(Optional.of(consultantRating));

        // Act
        ApiResponse<RatingResponse> response = ratingService.updateRating(
                999L, // Different user ID
                consultantRating.getRatingId(),
                updateRequest);

        // Assert
        assertFalse(response.isSuccess());
        assertEquals("You can only update your own ratings", response.getMessage());
        assertNull(response.getData());

        // Verify
        verify(ratingRepository, never()).save(any(Rating.class));
    }

    @Test
    @DisplayName("Update Rating - Expired Time Window")
    void updateRating_ExpiredTimeWindow() {
        // Arrange
        Rating oldRating = new Rating();
        oldRating.setRatingId(3L);
        oldRating.setUser(customer);
        oldRating.setCreatedAt(LocalDateTime.now().minusDays(2)); // 48 hours old (outside 24h window)

        when(ratingRepository.findById(oldRating.getRatingId())).thenReturn(Optional.of(oldRating));

        // Act
        ApiResponse<RatingResponse> response = ratingService.updateRating(
                customer.getId(),
                oldRating.getRatingId(),
                updateRequest);

        // Assert
        assertFalse(response.isSuccess());
        assertEquals("You can only update ratings within 24 hours of creation", response.getMessage());
        assertNull(response.getData());

        // Verify
        verify(ratingRepository, never()).save(any(Rating.class));
    }

    @Test
    @DisplayName("Delete Rating - Success (Customer)")
    void deleteRating_SuccessCustomer() {
        // Arrange
        when(ratingRepository.findById(consultantRating.getRatingId())).thenReturn(Optional.of(consultantRating));
        when(userRepository.findById(customer.getId())).thenReturn(Optional.of(customer));

        // Act
        ApiResponse<String> response = ratingService.deleteRating(
                customer.getId(),
                consultantRating.getRatingId());

        // Assert
        assertTrue(response.isSuccess());
        assertEquals("Rating deleted successfully", response.getMessage());

        // Verify
        verify(ratingRepository).save(any(Rating.class));
    }

    @Test
    @DisplayName("Delete Rating - Success (Staff)")
    void deleteRating_SuccessStaff() {
        // Arrange
        when(ratingRepository.findById(consultantRating.getRatingId())).thenReturn(Optional.of(consultantRating));
        when(userRepository.findById(staff.getId())).thenReturn(Optional.of(staff));

        // Act
        ApiResponse<String> response = ratingService.deleteRating(
                staff.getId(),
                consultantRating.getRatingId());

        // Assert
        assertTrue(response.isSuccess());
        assertEquals("Rating deleted successfully", response.getMessage());

        // Verify
        verify(ratingRepository).save(any(Rating.class));
    }

    @Test
    @DisplayName("Delete Rating - Not Found")
    void deleteRating_NotFound() {
        // Arrange
        when(ratingRepository.findById(999L)).thenReturn(Optional.empty());

        // Act
        ApiResponse<String> response = ratingService.deleteRating(
                customer.getId(),
                999L);

        // Assert
        assertFalse(response.isSuccess());
        assertEquals("Rating not found", response.getMessage());

        // Verify
        verify(ratingRepository, never()).save(any(Rating.class));
    }

    @Test
    @DisplayName("Delete Rating - Not Authorized")
    void deleteRating_NotAuthorized() {
        // Arrange
        UserDtls otherUser = new UserDtls();
        otherUser.setId(4L);
        otherUser.setRole(customerRole);

        when(ratingRepository.findById(consultantRating.getRatingId())).thenReturn(Optional.of(consultantRating));
        when(userRepository.findById(otherUser.getId())).thenReturn(Optional.of(otherUser));

        // Act
        ApiResponse<String> response = ratingService.deleteRating(
                otherUser.getId(),
                consultantRating.getRatingId());

        // Assert
        assertFalse(response.isSuccess());
        assertEquals("You can only delete your own ratings", response.getMessage());

        // Verify
        verify(ratingRepository, never()).save(any(Rating.class));
    }

    @Test
    @DisplayName("Delete Rating - Customer Expired Time Window")
    void deleteRating_CustomerExpiredTimeWindow() {
        // Arrange
        Rating oldRating = new Rating();
        oldRating.setRatingId(3L);
        oldRating.setUser(customer);
        oldRating.setCreatedAt(LocalDateTime.now().minusDays(2)); // 48 hours old (outside 24h window)

        when(ratingRepository.findById(oldRating.getRatingId())).thenReturn(Optional.of(oldRating));
        when(userRepository.findById(customer.getId())).thenReturn(Optional.of(customer));

        // Act
        ApiResponse<String> response = ratingService.deleteRating(
                customer.getId(),
                oldRating.getRatingId());

        // Assert
        assertFalse(response.isSuccess());
        assertEquals("You can only delete ratings within 24 hours of creation", response.getMessage());

        // Verify
        verify(ratingRepository, never()).save(any(Rating.class));
    }

    @Test
    @DisplayName("Get User Ratings - Success")
    void getUserRatings_Success() {
        // Arrange
        List<Rating> ratings = Arrays.asList(consultantRating, stiServiceRating);
        Page<Rating> ratingsPage = new PageImpl<>(ratings);

        when(ratingRepository.findByUserIdAndIsActiveTrueOrderByCreatedAtDesc(
                eq(customer.getId()), any(Pageable.class))).thenReturn(ratingsPage);

        // Act
        ApiResponse<Page<RatingResponse>> response = ratingService.getUserRatings(
                customer.getId(),
                0,
                10);

        // Assert
        assertTrue(response.isSuccess());
        assertEquals("User ratings retrieved successfully", response.getMessage());
        assertNotNull(response.getData());
        assertEquals(2, response.getData().getTotalElements());

        // Verify
        verify(ratingRepository).findByUserIdAndIsActiveTrueOrderByCreatedAtDesc(
                eq(customer.getId()), any(Pageable.class));
    }

    @Test
    @DisplayName("Get Ratings - Success")
    void getRatings_Success() {
        // Arrange
        List<Rating> ratings = Arrays.asList(consultantRating);
        Page<Rating> ratingsPage = new PageImpl<>(ratings);

        when(ratingRepository.findByTargetTypeAndTargetIdAndIsActiveTrue(
                eq(Rating.RatingTargetType.CONSULTANT),
                eq(5L),
                any(Pageable.class))).thenReturn(ratingsPage);

        // Act
        ApiResponse<Page<RatingResponse>> response = ratingService.getRatings(
                Rating.RatingTargetType.CONSULTANT,
                5L,
                0,
                10,
                "newest",
                null,
                null);

        // Assert
        assertTrue(response.isSuccess());
        assertEquals("Ratings retrieved successfully", response.getMessage());
        assertNotNull(response.getData());
        assertEquals(1, response.getData().getTotalElements());

        // Verify
        verify(ratingRepository).findByTargetTypeAndTargetIdAndIsActiveTrue(
                eq(Rating.RatingTargetType.CONSULTANT),
                eq(5L),
                any(Pageable.class));
    }

    @Test
    @DisplayName("Get Ratings - With Filtering")
    void getRatings_WithFiltering() {
        // Arrange
        List<Rating> ratings = Arrays.asList(consultantRating);
        Page<Rating> ratingsPage = new PageImpl<>(ratings);

        when(ratingRepository.findByTargetTypeAndTargetIdAndRatingAndIsActiveTrue(
                eq(Rating.RatingTargetType.CONSULTANT),
                eq(5L),
                eq(5),
                any(Pageable.class))).thenReturn(ratingsPage);

        // Act
        ApiResponse<Page<RatingResponse>> response = ratingService.getRatings(
                Rating.RatingTargetType.CONSULTANT,
                5L,
                0,
                10,
                "newest",
                5, // Filter for 5-star ratings
                null);

        // Assert
        assertTrue(response.isSuccess());
        assertEquals("Ratings retrieved successfully", response.getMessage());
        assertNotNull(response.getData());
        assertEquals(1, response.getData().getTotalElements());

        // Verify
        verify(ratingRepository).findByTargetTypeAndTargetIdAndRatingAndIsActiveTrue(
                eq(Rating.RatingTargetType.CONSULTANT),
                eq(5L),
                eq(5),
                any(Pageable.class));
    }

    @Test
    @DisplayName("Get Ratings - With Keyword Search")
    void getRatings_WithKeywordSearch() {
        // Arrange
        List<Rating> ratings = Arrays.asList(consultantRating);
        Page<Rating> ratingsPage = new PageImpl<>(ratings);

        when(ratingRepository.searchInComments(
                eq(Rating.RatingTargetType.CONSULTANT),
                eq(5L),
                eq("great"),
                any(Pageable.class))).thenReturn(ratingsPage);

        // Act
        ApiResponse<Page<RatingResponse>> response = ratingService.getRatings(
                Rating.RatingTargetType.CONSULTANT,
                5L,
                0,
                10,
                "newest",
                null,
                "great"); // Search for "great" in comments

        // Assert
        assertTrue(response.isSuccess());
        assertEquals("Ratings retrieved successfully", response.getMessage());
        assertNotNull(response.getData());
        assertEquals(1, response.getData().getTotalElements());

        // Verify
        verify(ratingRepository).searchInComments(
                eq(Rating.RatingTargetType.CONSULTANT),
                eq(5L),
                eq("great"),
                any(Pageable.class));
    }

    @Test
    @DisplayName("Get Rating Summary - Success")
    void getRatingSummary_Success() {
        // Arrange
        when(ratingSummaryRepository.findByTargetTypeAndTargetId(
                Rating.RatingTargetType.CONSULTANT, 5L)).thenReturn(Optional.of(ratingSummary));

        // Act
        ApiResponse<RatingSummaryResponse> response = ratingService.getRatingSummary(
                Rating.RatingTargetType.CONSULTANT,
                5L,
                false);

        // Assert
        assertTrue(response.isSuccess());
        assertEquals("Rating summary retrieved successfully", response.getMessage());
        assertNotNull(response.getData());
        assertEquals(10, response.getData().getTotalRatings());
        assertEquals(BigDecimal.valueOf(4.5), response.getData().getAverageRating());
        assertEquals(6, response.getData().getStarDistribution().get(5));
        assertEquals(3, response.getData().getStarDistribution().get(4));

        // Verify
        verify(ratingSummaryRepository).findByTargetTypeAndTargetId(
                Rating.RatingTargetType.CONSULTANT, 5L);
    }

    @Test
    @DisplayName("Get Rating Summary - With Recent Reviews")
    void getRatingSummary_WithRecentReviews() {
        // Arrange
        when(ratingSummaryRepository.findByTargetTypeAndTargetId(
                Rating.RatingTargetType.CONSULTANT, 5L)).thenReturn(Optional.of(ratingSummary));

        List<Rating> recentRatings = Arrays.asList(consultantRating);
        when(ratingRepository.findTopRatingsWithComments(
                eq(Rating.RatingTargetType.CONSULTANT),
                eq(5L),
                any(Pageable.class))).thenReturn(recentRatings);

        // Act
        ApiResponse<RatingSummaryResponse> response = ratingService.getRatingSummary(
                Rating.RatingTargetType.CONSULTANT,
                5L,
                true); // Include recent reviews

        // Assert
        assertTrue(response.isSuccess());
        assertEquals("Rating summary retrieved successfully", response.getMessage());
        assertNotNull(response.getData());
        assertNotNull(response.getData().getRecentRatings());
        assertEquals(1, response.getData().getRecentRatings().size());

        // Verify
        verify(ratingSummaryRepository).findByTargetTypeAndTargetId(
                Rating.RatingTargetType.CONSULTANT, 5L);
        verify(ratingRepository).findTopRatingsWithComments(
                eq(Rating.RatingTargetType.CONSULTANT),
                eq(5L),
                any(Pageable.class));
    }

    @Test
    @DisplayName("Get Rating Summary - No Ratings")
    void getRatingSummary_NoRatings() {
        // Arrange
        when(ratingSummaryRepository.findByTargetTypeAndTargetId(
                Rating.RatingTargetType.CONSULTANT, 5L)).thenReturn(Optional.empty());

        // Act
        ApiResponse<RatingSummaryResponse> response = ratingService.getRatingSummary(
                Rating.RatingTargetType.CONSULTANT,
                5L,
                false);

        // Assert
        assertTrue(response.isSuccess());
        assertEquals("Rating summary retrieved successfully", response.getMessage());
        assertNotNull(response.getData());
        assertEquals(0, response.getData().getTotalRatings());
        assertEquals(BigDecimal.ZERO, response.getData().getAverageRating());

        // Verify
        verify(ratingSummaryRepository).findByTargetTypeAndTargetId(
                Rating.RatingTargetType.CONSULTANT, 5L);
    }

    @Test
    @DisplayName("Check Rating Eligibility - Can Rate")
    void checkRatingEligibility_CanRate() {
        // Arrange
        when(consultationRepository.findByCustomerIdAndConsultantIdAndStatus(
                eq(customer.getId()),
                eq(5L),
                eq(ConsultationStatus.COMPLETED))).thenReturn(List.of(consultation));

        when(ratingRepository.existsByUserIdAndTargetTypeAndTargetIdAndIsActiveTrue(
                customer.getId(),
                Rating.RatingTargetType.CONSULTANT,
                5L)).thenReturn(false);

        // Act
        ApiResponse<Map<String, Object>> response = ratingService.checkRatingEligibility(
                customer.getId(),
                Rating.RatingTargetType.CONSULTANT,
                5L);

        // Assert
        assertTrue(response.isSuccess());
        assertEquals("Check completed", response.getMessage());
        assertNotNull(response.getData());
        assertTrue((Boolean) response.getData().get("canRate"));
        assertFalse((Boolean) response.getData().get("hasRated"));

        // Verify
        verify(consultationRepository).findByCustomerIdAndConsultantIdAndStatus(
                eq(customer.getId()),
                eq(5L),
                eq(ConsultationStatus.COMPLETED));
        verify(ratingRepository).existsByUserIdAndTargetTypeAndTargetIdAndIsActiveTrue(
                customer.getId(),
                Rating.RatingTargetType.CONSULTANT,
                5L);
    }

    @Test
    @DisplayName("Check Rating Eligibility - Already Rated")
    void checkRatingEligibility_AlreadyRated() {
        // Arrange
        when(consultationRepository.findByCustomerIdAndConsultantIdAndStatus(
                eq(customer.getId()),
                eq(5L),
                eq(ConsultationStatus.COMPLETED))).thenReturn(List.of(consultation));

        when(ratingRepository.existsByUserIdAndTargetTypeAndTargetIdAndIsActiveTrue(
                customer.getId(),
                Rating.RatingTargetType.CONSULTANT,
                5L)).thenReturn(true);

        // Act
        ApiResponse<Map<String, Object>> response = ratingService.checkRatingEligibility(
                customer.getId(),
                Rating.RatingTargetType.CONSULTANT,
                5L);

        // Assert
        assertTrue(response.isSuccess());
        assertEquals("Check completed", response.getMessage());
        assertNotNull(response.getData());
        assertFalse((Boolean) response.getData().get("canRate"));
        assertTrue((Boolean) response.getData().get("hasRated"));

        // Verify
        verify(consultationRepository).findByCustomerIdAndConsultantIdAndStatus(
                eq(customer.getId()),
                eq(5L),
                eq(ConsultationStatus.COMPLETED));
        verify(ratingRepository).existsByUserIdAndTargetTypeAndTargetIdAndIsActiveTrue(
                customer.getId(),
                Rating.RatingTargetType.CONSULTANT,
                5L);
    }

    @Test
    @DisplayName("Check Rating Eligibility - Not Eligible")
    void checkRatingEligibility_NotEligible() {
        // Arrange
        when(consultationRepository.findByCustomerIdAndConsultantIdAndStatus(
                eq(customer.getId()),
                eq(5L),
                eq(ConsultationStatus.COMPLETED))).thenReturn(Collections.emptyList());

        when(ratingRepository.existsByUserIdAndTargetTypeAndTargetIdAndIsActiveTrue(
                customer.getId(),
                Rating.RatingTargetType.CONSULTANT,
                5L)).thenReturn(false);

        // Act
        ApiResponse<Map<String, Object>> response = ratingService.checkRatingEligibility(
                customer.getId(),
                Rating.RatingTargetType.CONSULTANT,
                5L);

        // Assert
        assertTrue(response.isSuccess());
        assertEquals("Check completed", response.getMessage());
        assertNotNull(response.getData());
        assertFalse((Boolean) response.getData().get("canRate"));
        assertFalse((Boolean) response.getData().get("hasRated"));

        // Verify
        verify(consultationRepository).findByCustomerIdAndConsultantIdAndStatus(
                eq(customer.getId()),
                eq(5L),
                eq(ConsultationStatus.COMPLETED));
        verify(ratingRepository).existsByUserIdAndTargetTypeAndTargetIdAndIsActiveTrue(
                customer.getId(),
                Rating.RatingTargetType.CONSULTANT,
                5L);
    }

    @Test
    @DisplayName("Reply To Rating - Success")
    void replyToRating_Success() {
        // Arrange
        when(userRepository.findById(staff.getId())).thenReturn(Optional.of(staff));
        when(ratingRepository.findById(consultantRating.getRatingId())).thenReturn(Optional.of(consultantRating));
        when(ratingRepository.save(any(Rating.class))).thenReturn(consultantRating);

        // Act
        ApiResponse<RatingResponse> response = ratingService.replyToRating(
                staff.getId(),
                consultantRating.getRatingId(),
                staffReplyRequest);

        // Assert
        assertTrue(response.isSuccess());
        assertEquals("Staff reply added successfully", response.getMessage());
        assertNotNull(response.getData());

        // Verify
        verify(userRepository).findById(staff.getId());
        verify(ratingRepository).findById(consultantRating.getRatingId());
        verify(ratingRepository).save(any(Rating.class));
    }

    @Test
    @DisplayName("Reply To Rating - Staff Not Found")
    void replyToRating_StaffNotFound() {
        // Arrange
        when(userRepository.findById(999L)).thenReturn(Optional.empty());

        // Act
        ApiResponse<RatingResponse> response = ratingService.replyToRating(
                999L,
                consultantRating.getRatingId(),
                staffReplyRequest);

        // Assert
        assertFalse(response.isSuccess());
        assertEquals("Staff not found", response.getMessage());
        assertNull(response.getData());

        // Verify
        verify(ratingRepository, never()).save(any(Rating.class));
    }

    @Test
    @DisplayName("Reply To Rating - Not Staff")
    void replyToRating_NotStaff() {
        // Arrange
        when(userRepository.findById(customer.getId())).thenReturn(Optional.of(customer));

        // Act
        ApiResponse<RatingResponse> response = ratingService.replyToRating(
                customer.getId(),
                consultantRating.getRatingId(),
                staffReplyRequest);

        // Assert
        assertFalse(response.isSuccess());
        assertEquals("Only staff members can reply to ratings", response.getMessage());
        assertNull(response.getData());

        // Verify
        verify(ratingRepository, never()).save(any(Rating.class));
    }

    @Test
    @DisplayName("Reply To Rating - Rating Not Found")
    void replyToRating_RatingNotFound() {
        // Arrange
        when(userRepository.findById(staff.getId())).thenReturn(Optional.of(staff));
        when(ratingRepository.findById(999L)).thenReturn(Optional.empty());

        // Act
        ApiResponse<RatingResponse> response = ratingService.replyToRating(
                staff.getId(),
                999L,
                staffReplyRequest);

        // Assert
        assertFalse(response.isSuccess());
        assertEquals("Rating not found", response.getMessage());
        assertNull(response.getData());

        // Verify
        verify(ratingRepository, never()).save(any(Rating.class));
    }

    @Test
    @DisplayName("Update Staff Reply - Success")
    void updateStaffReply_Success() {
        // Arrange
        Rating ratingWithReply = new Rating();
        ratingWithReply.setRatingId(1L);
        ratingWithReply.setUser(customer);
        ratingWithReply.setStaffReply("Previous reply");
        ratingWithReply.setRepliedBy(staff);
        ratingWithReply.setRepliedAt(LocalDateTime.now().minusDays(1));

        when(userRepository.findById(staff.getId())).thenReturn(Optional.of(staff));
        when(ratingRepository.findById(ratingWithReply.getRatingId())).thenReturn(Optional.of(ratingWithReply));
        when(ratingRepository.save(any(Rating.class))).thenReturn(ratingWithReply);

        // Act
        ApiResponse<RatingResponse> response = ratingService.updateStaffReply(
                staff.getId(),
                ratingWithReply.getRatingId(),
                staffReplyRequest);

        // Assert
        assertTrue(response.isSuccess());
        assertEquals("Staff reply updated successfully", response.getMessage());
        assertNotNull(response.getData());

        // Verify
        verify(userRepository).findById(staff.getId());
        verify(ratingRepository).findById(ratingWithReply.getRatingId());
        verify(ratingRepository).save(any(Rating.class));
    }

    @Test
    @DisplayName("Update Staff Reply - No Existing Reply")
    void updateStaffReply_NoExistingReply() {
        // Arrange
        when(userRepository.findById(staff.getId())).thenReturn(Optional.of(staff));
        when(ratingRepository.findById(consultantRating.getRatingId())).thenReturn(Optional.of(consultantRating));

        // Act
        ApiResponse<RatingResponse> response = ratingService.updateStaffReply(
                staff.getId(),
                consultantRating.getRatingId(),
                staffReplyRequest);

        // Assert
        assertFalse(response.isSuccess());
        assertEquals("No existing reply to update", response.getMessage());
        assertNull(response.getData());

        // Verify
        verify(ratingRepository, never()).save(any(Rating.class));
    }

    @Test
    @DisplayName("Delete Staff Reply - Success")
    void deleteStaffReply_Success() {
        // Arrange
        Rating ratingWithReply = new Rating();
        ratingWithReply.setRatingId(1L);
        ratingWithReply.setUser(customer);
        ratingWithReply.setStaffReply("Previous reply");
        ratingWithReply.setRepliedBy(staff);
        ratingWithReply.setRepliedAt(LocalDateTime.now().minusDays(1));

        when(userRepository.findById(staff.getId())).thenReturn(Optional.of(staff));
        when(ratingRepository.findById(ratingWithReply.getRatingId())).thenReturn(Optional.of(ratingWithReply));
        when(ratingRepository.save(any(Rating.class))).thenReturn(ratingWithReply);

        // Act
        ApiResponse<String> response = ratingService.deleteStaffReply(
                staff.getId(),
                ratingWithReply.getRatingId());

        // Assert
        assertTrue(response.isSuccess());
        assertEquals("Staff reply deleted successfully", response.getMessage());

        // Verify
        verify(userRepository).findById(staff.getId());
        verify(ratingRepository).findById(ratingWithReply.getRatingId());
        verify(ratingRepository).save(any(Rating.class));
    }

    @Test
    @DisplayName("Delete Staff Reply - No Existing Reply")
    void deleteStaffReply_NoExistingReply() {
        // Arrange
        when(userRepository.findById(staff.getId())).thenReturn(Optional.of(staff));
        when(ratingRepository.findById(consultantRating.getRatingId())).thenReturn(Optional.of(consultantRating));

        // Act
        ApiResponse<String> response = ratingService.deleteStaffReply(
                staff.getId(),
                consultantRating.getRatingId());

        // Assert
        assertFalse(response.isSuccess());
        assertEquals("No existing reply to delete", response.getMessage());

        // Verify
        verify(ratingRepository, never()).save(any(Rating.class));
    }

    @Test
    @DisplayName("Get Pending Reply Ratings - Success")
    void getPendingReplyRatings_Success() {
        // Arrange
        List<Rating> pendingRatings = Arrays.asList(consultantRating);
        when(ratingRepository.findPendingReplyRatings(
                Rating.RatingTargetType.CONSULTANT,
                5L)).thenReturn(pendingRatings);

        // Act
        ApiResponse<Page<RatingResponse>> response = ratingService.getPendingReplyRatings(
                Rating.RatingTargetType.CONSULTANT,
                5L,
                0,
                10);

        // Assert
        assertTrue(response.isSuccess());
        assertEquals("Pending reply ratings retrieved successfully", response.getMessage());
        assertNotNull(response.getData());
        assertEquals(1, response.getData().getTotalElements());

        // Verify
        verify(ratingRepository).findPendingReplyRatings(
                Rating.RatingTargetType.CONSULTANT,
                5L);
    }

    @Test
    @DisplayName("Get All Ratings - Success")
    void getAllRatings_Success() {
        // Arrange
        List<Rating> ratings = Arrays.asList(consultantRating, stiServiceRating);
        Page<Rating> ratingsPage = new PageImpl<>(ratings);

        when(ratingRepository.findByIsActiveTrue(any(Pageable.class))).thenReturn(ratingsPage);

        // Act
        ApiResponse<Page<RatingResponse>> response = ratingService.getAllRatings(
                0,
                10,
                "newest",
                null,
                null);

        // Assert
        assertTrue(response.isSuccess());
        assertEquals("All ratings retrieved successfully", response.getMessage());
        assertNotNull(response.getData());
        assertEquals(2, response.getData().getTotalElements());

        // Verify
        verify(ratingRepository).findByIsActiveTrue(any(Pageable.class));
    }

    @Test
    @DisplayName("Update Rating Summary - Success")
    void updateRatingSummary_Success() {
        // Arrange
        List<Rating> ratings = Arrays.asList(
                consultantRating,
                consultantRating // Not using clone() as it may not be implemented
        );

        when(ratingRepository.findByTargetTypeAndTargetIdAndIsActiveTrueOrderByCreatedAtDesc(
                eq(Rating.RatingTargetType.CONSULTANT),
                eq(5L))).thenReturn(ratings);

        when(ratingSummaryRepository.findByTargetTypeAndTargetId(
                eq(Rating.RatingTargetType.CONSULTANT),
                eq(5L))).thenReturn(Optional.of(ratingSummary));

        when(ratingSummaryRepository.save(any(RatingSummary.class))).thenReturn(ratingSummary);

        // Act
        ratingService.updateRatingSummary(Rating.RatingTargetType.CONSULTANT, 5L);

        // Assert
        verify(ratingRepository).findByTargetTypeAndTargetIdAndIsActiveTrueOrderByCreatedAtDesc(
                eq(Rating.RatingTargetType.CONSULTANT),
                eq(5L));
        verify(ratingSummaryRepository).findByTargetTypeAndTargetId(
                eq(Rating.RatingTargetType.CONSULTANT),
                eq(5L));
        verify(ratingSummaryRepository).save(any(RatingSummary.class));
    }

    @Test
    @DisplayName("Update Rating Summary - No Ratings")
    void updateRatingSummary_NoRatings() {
        // Arrange
        when(ratingRepository.findByTargetTypeAndTargetIdAndIsActiveTrueOrderByCreatedAtDesc(
                Rating.RatingTargetType.CONSULTANT,
                5L)).thenReturn(Collections.emptyList());

        when(ratingSummaryRepository.findByTargetTypeAndTargetId(
                Rating.RatingTargetType.CONSULTANT,
                5L)).thenReturn(Optional.of(ratingSummary));

        when(ratingSummaryRepository.save(any(RatingSummary.class))).thenReturn(ratingSummary);

        // Act
        ratingService.updateRatingSummary(Rating.RatingTargetType.CONSULTANT, 5L);

        // Assert
        verify(ratingRepository).findByTargetTypeAndTargetIdAndIsActiveTrueOrderByCreatedAtDesc(
                Rating.RatingTargetType.CONSULTANT,
                5L);
        verify(ratingSummaryRepository).findByTargetTypeAndTargetId(
                Rating.RatingTargetType.CONSULTANT,
                5L);
        verify(ratingSummaryRepository).save(any(RatingSummary.class));
    }
}