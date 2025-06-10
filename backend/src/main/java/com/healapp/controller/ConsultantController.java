package com.healapp.controller;

import com.healapp.dto.ApiResponse;
import com.healapp.dto.ConsultantProfileRequest;
import com.healapp.dto.ConsultantProfileResponse;
import com.healapp.service.ConsultantService;
import com.healapp.service.UserService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/consultants")
public class ConsultantController {

    @Autowired
    private ConsultantService consultantService;

    @Autowired
    private UserService userService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<ConsultantProfileResponse>>> getAllConsultantProfiles() {
        ApiResponse<List<ConsultantProfileResponse>> response = consultantService.getAllConsultantProfiles();
        return getResponseEntity(response);
    }

    @GetMapping("/{userId}")
    public ResponseEntity<ApiResponse<ConsultantProfileResponse>> getConsultantProfileById(@PathVariable Long userId) {
        ApiResponse<ConsultantProfileResponse> response = consultantService.getConsultantProfileById(userId);
        return getResponseEntity(response);
    }

    // admin update profile
    @PostMapping("/{userId}")
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    public ResponseEntity<ApiResponse<ConsultantProfileResponse>> createOrUpdateConsultantProfile(
            @PathVariable Long userId,
            @Valid @RequestBody ConsultantProfileRequest request) {

        ApiResponse<ConsultantProfileResponse> response = consultantService.createOrUpdateConsultantProfile(userId,
                request);
        return getResponseEntity(response);
    }    // consultant tự update profile
    @PutMapping("/profile")
    @PreAuthorize("hasRole('ROLE_CONSULTANT')")
    public ResponseEntity<ApiResponse<ConsultantProfileResponse>> updateOwnProfile(
            @Valid @RequestBody ConsultantProfileRequest request) {

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication.getName();
        Long userId = userService.getUserIdFromUsername(username);

        ApiResponse<ConsultantProfileResponse> response = consultantService.createOrUpdateConsultantProfile(userId,
                request);
        return getResponseEntity(response);
    }

    // consultant lấy profile của chính mình
    @GetMapping("/profile")
    @PreAuthorize("hasRole('ROLE_CONSULTANT')")
    public ResponseEntity<ApiResponse<ConsultantProfileResponse>> getOwnProfile() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication.getName();
        Long userId = userService.getUserIdFromUsername(username);

        ApiResponse<ConsultantProfileResponse> response = consultantService.getConsultantProfileById(userId);
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