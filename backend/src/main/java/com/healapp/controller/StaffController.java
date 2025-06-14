package com.healapp.controller;

import com.healapp.dto.ApiResponse;
import com.healapp.dto.STIServiceRequest;
import com.healapp.dto.STIServiceResponse;
import com.healapp.dto.StaffReplyRequest;
import com.healapp.dto.RatingResponse;
import com.healapp.model.Rating;
import com.healapp.service.STIServiceService;
import com.healapp.service.UserService;
import com.healapp.service.RatingService;

import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/staff")
@PreAuthorize("hasRole('ROLE_STAFF')")
public class StaffController {

    @Autowired
    private STIServiceService stiServiceService;

    @Autowired
    private UserService userService;    @Autowired
    private RatingService ratingService;

    // ========= STI SERVICES WITH COMPONENTS MANAGEMENT =========

    @PostMapping("/sti-services")
    public ResponseEntity<ApiResponse<STIServiceResponse>> createSTIServiceWithComponents(
            @Valid @RequestBody STIServiceRequest request) {

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication.getName();
        Long staffUserId = userService.getUserIdFromUsername(username);

        ApiResponse<STIServiceResponse> response = stiServiceService.createServiceWithComponents(request, staffUserId);
        return getResponseEntity(response);
    }

    @PutMapping("/sti-services/{serviceId}")
    public ResponseEntity<ApiResponse<STIServiceResponse>> updateSTIServiceWithComponents(
            @PathVariable Long serviceId,
            @Valid @RequestBody STIServiceRequest request) {

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication.getName();
        Long staffUserId = userService.getUserIdFromUsername(username);

        ApiResponse<STIServiceResponse> response = stiServiceService.updateServiceWithComponents(serviceId, request,
                staffUserId);
        return getResponseEntity(response);
    }

    @GetMapping("/sti-services/{serviceId}")
    public ResponseEntity<ApiResponse<STIServiceResponse>> getSTIServiceWithComponents(@PathVariable Long serviceId) {
        ApiResponse<STIServiceResponse> response = stiServiceService.getServiceWithComponents(serviceId);
        return getResponseEntity(response);
    }

    @GetMapping("/sti-services")
    public ResponseEntity<ApiResponse<List<STIServiceResponse>>> getAllSTIServices() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication.getName();
        Long staffUserId = userService.getUserIdFromUsername(username);

        ApiResponse<List<STIServiceResponse>> response = stiServiceService.getAllServicesForManagement(staffUserId);
        return getResponseEntity(response);
    }

    @PatchMapping("/sti-services/{serviceId}/toggle-status")
    public ResponseEntity<ApiResponse<STIServiceResponse>> toggleSTIServiceStatus(@PathVariable Long serviceId) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication.getName();
        Long staffUserId = userService.getUserIdFromUsername(username);

        ApiResponse<STIServiceResponse> response = stiServiceService.toggleServiceStatus(serviceId, staffUserId);
        return getResponseEntity(response);
    }

    // ========= RATING MANAGEMENT =========

    /**
     * Staff reply to a rating
     */
    @PostMapping("/ratings/{ratingId}/reply")
    public ResponseEntity<ApiResponse<RatingResponse>> replyToRating(
            @PathVariable Long ratingId,
            @Valid @RequestBody StaffReplyRequest request) {

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication.getName();
        Long staffUserId = userService.getUserIdFromUsername(username);

        ApiResponse<RatingResponse> response = ratingService.replyToRating(staffUserId, ratingId, request);
        return getResponseEntity(response);
    }

    /**
     * Update staff reply
     */
    @PutMapping("/ratings/{ratingId}/reply")
    public ResponseEntity<ApiResponse<RatingResponse>> updateReply(
            @PathVariable Long ratingId,
            @Valid @RequestBody StaffReplyRequest request) {

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication.getName();
        Long staffUserId = userService.getUserIdFromUsername(username);

        ApiResponse<RatingResponse> response = ratingService.updateStaffReply(staffUserId, ratingId, request);
        return getResponseEntity(response);
    }

    /**
     * Delete staff reply
     */
    @DeleteMapping("/ratings/{ratingId}/reply")
    public ResponseEntity<ApiResponse<String>> deleteReply(@PathVariable Long ratingId) {

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication.getName();
        Long staffUserId = userService.getUserIdFromUsername(username);

        ApiResponse<String> response = ratingService.deleteStaffReply(staffUserId, ratingId);
        return getResponseEntity(response);
    }

    /**
     * Get ratings pending reply (for consultants)
     */
    @GetMapping("/ratings/consultant/{consultantId}/pending-reply")
    public ResponseEntity<ApiResponse<Page<RatingResponse>>> getPendingReplyRatingsForConsultant(
            @PathVariable Long consultantId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {        ApiResponse<Page<RatingResponse>> response = ratingService.getPendingReplyRatings(
                Rating.RatingTargetType.CONSULTANT, consultantId, page, size);
        return getResponseEntity(response);
    }

    /**
     * Get ratings pending reply (for STI services)
     */
    @GetMapping("/ratings/sti-service/{serviceId}/pending-reply")
    public ResponseEntity<ApiResponse<Page<RatingResponse>>> getPendingReplyRatingsForSTIService(
            @PathVariable Long serviceId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {        ApiResponse<Page<RatingResponse>> response = ratingService.getPendingReplyRatings(
                Rating.RatingTargetType.STI_SERVICE, serviceId, page, size);
        return getResponseEntity(response);
    }

    private <T> ResponseEntity<ApiResponse<T>> getResponseEntity(ApiResponse<T> response) {
        if (response.isSuccess()) {
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.badRequest().body(response);
        }
    }
}
