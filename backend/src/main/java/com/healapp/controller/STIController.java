package com.healapp.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.healapp.dto.ApiResponse;
import com.healapp.dto.ConsultantNotesUpdateRequest;
import com.healapp.dto.STIServiceResponse;
import com.healapp.dto.STITestRequest;
import com.healapp.dto.STITestResponse;
import com.healapp.dto.STITestStatusUpdateRequest;
import com.healapp.dto.TestResultResponse;
import com.healapp.service.STIServiceService;
import com.healapp.service.STITestService;
import com.healapp.service.UserService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/sti-services")
public class STIController {

    @Autowired
    private STIServiceService stiServiceService;

    @Autowired
    private STITestService stiTestService;

    @Autowired
    private UserService userService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<STIServiceResponse>>> getActiveSTIServices() {
        ApiResponse<List<STIServiceResponse>> response = stiServiceService.getActiveServices();
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{serviceId}")
    public ResponseEntity<ApiResponse<STIServiceResponse>> getSTIServiceDetails(@PathVariable Long serviceId) {
        ApiResponse<STIServiceResponse> response = stiServiceService.getServiceWithComponents(serviceId);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{serviceId}/admin")
    @PreAuthorize("hasRole('ADMIN') or hasRole('STAFF')")
    public ResponseEntity<ApiResponse<STIServiceResponse>> getSTIServiceDetailsForAdmin(@PathVariable Long serviceId) {
        Long userId = getCurrentUserId();

        ApiResponse<STIServiceResponse> response = stiServiceService.getServiceWithAllComponents(serviceId, userId);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/search")
    public ResponseEntity<ApiResponse<List<STIServiceResponse>>> searchSTIServices(
            @RequestParam String keyword) {
        ApiResponse<List<STIServiceResponse>> response = stiServiceService.searchActiveServices(keyword);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/book-test")
    @PreAuthorize("hasRole('ROLE_CUSTOMER') or hasRole('ROLE_CONSULTANT') or hasRole('ROLE_STAFF') or hasRole('ROLE_ADMIN')")
    public ResponseEntity<ApiResponse<STITestResponse>> bookSTITest(
            @Valid @RequestBody STITestRequest request) {

        Long customerId = getCurrentUserId();
        ApiResponse<STITestResponse> response = stiTestService.bookTest(request, customerId);
        return getResponseEntity(response);
    }

    @GetMapping("/my-tests")
    @PreAuthorize("hasRole('ROLE_CUSTOMER') or hasRole('ROLE_CONSULTANT') or hasRole('ROLE_STAFF') or hasRole('ROLE_ADMIN')")
    public ResponseEntity<ApiResponse<List<STITestResponse>>> getMySTITests() {

        Long customerId = getCurrentUserId();
        ApiResponse<List<STITestResponse>> response = stiTestService.getMyTests(customerId);
        return getResponseEntity(response);
    }

    @GetMapping("/tests/{testId}")
    @PreAuthorize("hasRole('ROLE_CUSTOMER') or hasRole('ROLE_CONSULTANT') or hasRole('ROLE_STAFF') or hasRole('ROLE_ADMIN')")
    public ResponseEntity<ApiResponse<STITestResponse>> getSTITestDetails(@PathVariable Long testId) {

        Long userId = getCurrentUserId();
        ApiResponse<STITestResponse> response = stiTestService.getTestDetails(testId, userId);
        return getResponseEntity(response);
    }

    @PutMapping("/tests/{testId}/cancel")
    @PreAuthorize("hasRole('ROLE_CUSTOMER') or hasRole('ROLE_CONSULTANT') or hasRole('ROLE_STAFF') or hasRole('ROLE_ADMIN')")
    public ResponseEntity<ApiResponse<STITestResponse>> cancelSTITest(@PathVariable Long testId) {

        Long userId = getCurrentUserId();
        ApiResponse<STITestResponse> response = stiTestService.cancelTest(testId, userId);
        return getResponseEntity(response);
    }

    @GetMapping("/staff/pending-tests")
    @PreAuthorize("hasRole('ROLE_STAFF') or hasRole('ROLE_ADMIN')")
    public ResponseEntity<ApiResponse<List<STITestResponse>>> getPendingTests() {
        ApiResponse<List<STITestResponse>> response = stiTestService.getPendingTests();
        return getResponseEntity(response);
    }

    @PutMapping("/staff/tests/{testId}/confirm")
    @PreAuthorize("hasRole('ROLE_STAFF') or hasRole('ROLE_ADMIN')")
    public ResponseEntity<ApiResponse<STITestResponse>> confirmTest(@PathVariable Long testId) {
        Long staffId = getCurrentUserId();

        STITestStatusUpdateRequest request = new STITestStatusUpdateRequest();
        request.setStatus(com.healapp.model.TestStatus.CONFIRMED);

        ApiResponse<STITestResponse> response = stiTestService.updateTestStatus(testId, request, staffId);
        return getResponseEntity(response);
    }

    @GetMapping("/staff/confirmed-tests")
    @PreAuthorize("hasRole('ROLE_STAFF')")
    public ResponseEntity<ApiResponse<List<STITestResponse>>> getConfirmedTests() {
        ApiResponse<List<STITestResponse>> response = stiTestService.getConfirmedTests();
        return getResponseEntity(response);
    }

    @PutMapping("/staff/tests/{testId}/sample")
    @PreAuthorize("hasRole('ROLE_STAFF')")
    public ResponseEntity<ApiResponse<STITestResponse>> sampleTest(@PathVariable Long testId) {
        Long staffId = getCurrentUserId();

        STITestStatusUpdateRequest request = new STITestStatusUpdateRequest();
        request.setStatus(com.healapp.model.TestStatus.SAMPLED);

        ApiResponse<STITestResponse> response = stiTestService.updateTestStatus(testId, request, staffId);
        return getResponseEntity(response);
    }

    @GetMapping("/staff/my-tests")
    @PreAuthorize("hasRole('ROLE_STAFF')")
    public ResponseEntity<ApiResponse<List<STITestResponse>>> getStaffTests() {
        Long staffId = getCurrentUserId();
        ApiResponse<List<STITestResponse>> response = stiTestService.getStaffTests(staffId);
        return getResponseEntity(response);
    }

    @PutMapping("/staff/tests/{testId}/result")
    @PreAuthorize("hasRole('ROLE_STAFF')")
    public ResponseEntity<ApiResponse<STITestResponse>> addTestResults(
            @PathVariable Long testId,
            @Valid @RequestBody STITestStatusUpdateRequest request) {

        Long staffId = getCurrentUserId();

        // Đảm bảo status là RESULTED
        request.setStatus(com.healapp.model.TestStatus.RESULTED);

        ApiResponse<STITestResponse> response = stiTestService.updateTestStatus(testId, request, staffId);
        return getResponseEntity(response);
    }

    @PutMapping("/staff/tests/{testId}/complete")
    @PreAuthorize("hasRole('ROLE_STAFF')")
    public ResponseEntity<ApiResponse<STITestResponse>> completeTest(
            @PathVariable Long testId) {

        Long staffId = getCurrentUserId();

        STITestStatusUpdateRequest request = new STITestStatusUpdateRequest();
        request.setStatus(com.healapp.model.TestStatus.COMPLETED);

        ApiResponse<STITestResponse> response = stiTestService.updateTestStatus(testId, request, staffId);
        return getResponseEntity(response);
    }

    @GetMapping("/tests/{testId}/results")
    @PreAuthorize("hasRole('ROLE_CUSTOMER') or hasRole('ROLE_CONSULTANT') or hasRole('ROLE_STAFF') or hasRole('ROLE_ADMIN')")
    public ResponseEntity<ApiResponse<List<TestResultResponse>>> getTestResults(@PathVariable Long testId) {
        Long userId = getCurrentUserId();
        ApiResponse<List<TestResultResponse>> response = stiTestService.getTestResults(testId, userId);
        return getResponseEntity(response);
    }

    @PutMapping("/consultant/tests/{testId}/notes")
    @PreAuthorize("hasRole('ROLE_CONSULTANT')")
    public ResponseEntity<ApiResponse<STITestResponse>> updateConsultantNotes(
            @PathVariable Long testId,
            @Valid @RequestBody ConsultantNotesUpdateRequest request) {

        Long consultantId = getCurrentUserId();

        ApiResponse<STITestResponse> response = stiTestService.updateConsultantNotes(
                testId, request.getConsultantNotes(), consultantId);

        return getResponseEntity(response);
    }

    // ========== CONSULTANT ENDPOINTS ==========
    @GetMapping("/consultant/pending-notes-tests")
    @PreAuthorize("hasRole('ROLE_CONSULTANT')")
    public ResponseEntity<ApiResponse<List<STITestResponse>>> getTestsPendingNotes() {
        Long consultantId = getCurrentUserId();
        ApiResponse<List<STITestResponse>> response = stiTestService.getTestsPendingConsultantNotes();
        return getResponseEntity(response);
    }

    @GetMapping("/consultant/all-tests")
    @PreAuthorize("hasRole('ROLE_CONSULTANT')")
    public ResponseEntity<ApiResponse<List<STITestResponse>>> getAllConsultantTests() {
        Long consultantId = getCurrentUserId();
        ApiResponse<List<STITestResponse>> response = stiTestService.getAllConsultantTests();
        return getResponseEntity(response);
    }

    private Long getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication.getName();
        return userService.getUserIdFromUsername(username);
    }

    private <T> ResponseEntity<ApiResponse<T>> getResponseEntity(ApiResponse<T> response) {
        if (response.isSuccess()) {
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.badRequest().body(response);
        }
    }
}
