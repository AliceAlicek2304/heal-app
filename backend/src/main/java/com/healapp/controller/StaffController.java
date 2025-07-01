package com.healapp.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.healapp.dto.ApiResponse;
import com.healapp.dto.ComponentUpdateRequest;
import com.healapp.dto.STIServiceRequest;
import com.healapp.dto.STIServiceResponse;
import com.healapp.service.RatingService;
import com.healapp.service.STIServiceService;
import com.healapp.service.UserService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/staff")
@PreAuthorize("hasRole('ROLE_STAFF')")
public class StaffController {

    @Autowired
    private STIServiceService stiServiceService;

    @Autowired
    private UserService userService;
    @Autowired
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
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication.getName();
        Long staffUserId = userService.getUserIdFromUsername(username);
        
        ApiResponse<STIServiceResponse> response = stiServiceService.getServiceWithAllComponents(serviceId, staffUserId);
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

    // ========= INDIVIDUAL COMPONENT MANAGEMENT =========

    @PutMapping("/components/{componentId}")
    public ResponseEntity<ApiResponse<STIServiceResponse.TestComponentResponse>> updateComponent(
            @PathVariable Long componentId,
            @Valid @RequestBody ComponentUpdateRequest request) {

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication.getName();
        Long staffUserId = userService.getUserIdFromUsername(username);

        ApiResponse<STIServiceResponse.TestComponentResponse> response = stiServiceService.updateComponent(
                componentId, request, staffUserId);
        return getResponseEntity(response);
    }

    @PatchMapping("/components/{componentId}/toggle-status")
    public ResponseEntity<ApiResponse<STIServiceResponse.TestComponentResponse>> toggleComponentStatus(
            @PathVariable Long componentId) {

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication.getName();
        Long staffUserId = userService.getUserIdFromUsername(username);

        ApiResponse<STIServiceResponse.TestComponentResponse> response = stiServiceService.toggleComponentStatus(
                componentId, staffUserId);
        return getResponseEntity(response);
    }

    @DeleteMapping("/components/{componentId}")
    public ResponseEntity<ApiResponse<String>> deleteComponent(@PathVariable Long componentId) {

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication.getName();
        Long staffUserId = userService.getUserIdFromUsername(username);

        ApiResponse<String> response = stiServiceService.deleteComponent(componentId, staffUserId);
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
