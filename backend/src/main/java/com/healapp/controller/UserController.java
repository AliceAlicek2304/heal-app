package com.healapp.controller;

import com.healapp.dto.ApiResponse;
import com.healapp.dto.ChangePasswordRequest;
import com.healapp.dto.RegisterRequest;
import com.healapp.service.EmailService;
import com.healapp.service.EmailVerificationService;
import com.healapp.service.UserService;
import com.healapp.dto.ForgotPasswordRequest;
import com.healapp.dto.ResetPasswordRequest;
import com.healapp.dto.UpdateEmailRequest;
import com.healapp.dto.UpdateProfileRequest;
import com.healapp.dto.UserResponse;
import com.healapp.dto.VerificationCodeRequest;
import com.healapp.dto.PhoneVerificationRequest;
import com.healapp.dto.VerifyPhoneRequest;

import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/users")
public class UserController {

    @Autowired
    private UserService userService;

    @Autowired
    private EmailService emailService;

    @Autowired
    private EmailVerificationService emailVerificationService;

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<UserResponse>> registerUser(@Valid @RequestBody RegisterRequest request) {
        try {
            ApiResponse<UserResponse> response = userService.registerUser(request, null);

            if (response.isSuccess()) {
                return ResponseEntity.ok()
                        .contentType(MediaType.APPLICATION_JSON)
                        .body(response);
            } else {
                return ResponseEntity.badRequest()
                        .contentType(MediaType.APPLICATION_JSON)
                        .body(response);
            }
        } catch (Exception e) {
            e.printStackTrace();

            ApiResponse<UserResponse> errorResponse = ApiResponse.error("Lỗi server: " + e.getMessage());

            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(errorResponse);
        }
    }

    @PostMapping("/send-verification")
    public ResponseEntity<ApiResponse<String>> sendVerificationCode(
            @Valid @RequestBody VerificationCodeRequest request) {

        ApiResponse<String> response = userService.sendEmailVerificationCode(request);

        if (response.isSuccess()) {
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.badRequest().body(response);
        }
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<ApiResponse<String>> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        ApiResponse<String> response = userService.sendPasswordResetCodeAsync(request);

        if (response.isSuccess()) {
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.badRequest().body(response);
        }
    }

    @PostMapping("/reset-password")
    public ResponseEntity<ApiResponse<String>> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        ApiResponse<String> response = userService.resetPassword(request);

        if (response.isSuccess()) {
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.badRequest().body(response);
        }
    }

    @GetMapping("/profile")
    public ResponseEntity<ApiResponse<UserResponse>> getCurrentUserProfile() {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication == null || !authentication.isAuthenticated()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(ApiResponse.error("User not authenticated"));
            }

            String username = authentication.getName();
            Long userId = userService.getUserIdFromUsername(username);

            if (userId == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(ApiResponse.error("User not found"));
            }

            ApiResponse<UserResponse> response = userService.getUserById(userId);

            if (response.isSuccess()) {
                return ResponseEntity.ok(response);
            } else {
                return ResponseEntity.badRequest().body(response);
            }

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Error retrieving profile: " + e.getMessage()));
        }
    }

    @PutMapping("/profile/basic")
    public ResponseEntity<ApiResponse<UserResponse>> updateBasicProfile(
            @Valid @RequestBody UpdateProfileRequest request) {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication == null || !authentication.isAuthenticated()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(ApiResponse.error("User not authenticated"));
            }

            String username = authentication.getName();
            Long userId = userService.getUserIdFromUsername(username);

            if (userId == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(ApiResponse.error("User not found"));
            }

            ApiResponse<UserResponse> response = userService.updateBasicProfile(userId, request);

            if (response.isSuccess()) {
                return ResponseEntity.ok(response);
            } else {
                return ResponseEntity.badRequest().body(response);
            }

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Error updating basic profile: " + e.getMessage()));
        }
    }

    @PostMapping("/profile/email/send-verification")
    public ResponseEntity<ApiResponse<String>> sendEmailVerificationForUpdate(
            @Valid @RequestBody VerificationCodeRequest request) {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication == null || !authentication.isAuthenticated()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(ApiResponse.error("User not authenticated"));
            }

            String username = authentication.getName();
            Long userId = userService.getUserIdFromUsername(username);

            if (userId == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(ApiResponse.error("User not found"));
            }

            ApiResponse<String> response = userService.sendEmailVerificationForUpdate(userId, request);

            if (response.isSuccess()) {
                return ResponseEntity.ok(response);
            } else {
                return ResponseEntity.badRequest().body(response);
            }

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Error sending verification code: " + e.getMessage()));
        }
    }

    @PutMapping("/profile/email")
    public ResponseEntity<ApiResponse<UserResponse>> updateEmail(
            @Valid @RequestBody UpdateEmailRequest request) {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication == null || !authentication.isAuthenticated()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(ApiResponse.error("User not authenticated"));
            }

            String username = authentication.getName();
            Long userId = userService.getUserIdFromUsername(username);

            if (userId == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(ApiResponse.error("User not found"));
            }

            ApiResponse<UserResponse> response = userService.updateEmail(userId, request);

            if (response.isSuccess()) {
                return ResponseEntity.ok(response);
            } else {
                return ResponseEntity.badRequest().body(response);
            }

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Error updating email: " + e.getMessage()));
        }
    }

    @PutMapping("/profile/password")
    public ResponseEntity<ApiResponse<String>> changePassword(
            @Valid @RequestBody ChangePasswordRequest request) {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication == null || !authentication.isAuthenticated()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(ApiResponse.error("User not authenticated"));
            }

            String username = authentication.getName();
            Long userId = userService.getUserIdFromUsername(username);

            if (userId == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(ApiResponse.error("User not found"));
            }

            ApiResponse<String> response = userService.changePassword(userId, request);

            if (response.isSuccess()) {
                return ResponseEntity.ok(response);
            } else {
                return ResponseEntity.badRequest().body(response);
            }

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Error changing password: " + e.getMessage()));
        }
    }

    @PostMapping(value = "/profile/avatar", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<String>> updateAvatar(
            @RequestParam("file") MultipartFile file) {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication == null || !authentication.isAuthenticated()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(ApiResponse.error("User not authenticated"));
            }

            String username = authentication.getName();
            Long userId = userService.getUserIdFromUsername(username);

            if (userId == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(ApiResponse.error("User not found"));
            }

            ApiResponse<String> response = userService.updateUserAvatar(userId, file);

            if (response.isSuccess()) {
                return ResponseEntity.ok(response);
            } else {
                return ResponseEntity.badRequest().body(response);
            }

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Error updating avatar: " + e.getMessage()));
        }
    }

    @PostMapping("/profile/phone/send-verification")
    public ResponseEntity<ApiResponse<String>> sendPhoneVerification(
            @Valid @RequestBody PhoneVerificationRequest request) {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication == null || !authentication.isAuthenticated()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(ApiResponse.error("User not authenticated"));
            }

            String username = authentication.getName();
            Long userId = userService.getUserIdFromUsername(username);

            if (userId == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(ApiResponse.error("User not found"));
            }

            ApiResponse<String> response = userService.sendPhoneVerificationCode(userId, request);

            if (response.isSuccess()) {
                return ResponseEntity.ok(response);
            } else {
                return ResponseEntity.badRequest().body(response);
            }

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Error sending phone verification: " + e.getMessage()));
        }
    }

    @PostMapping("/profile/phone/verify")
    public ResponseEntity<ApiResponse<UserResponse>> verifyPhone(
            @Valid @RequestBody VerifyPhoneRequest request) {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication == null || !authentication.isAuthenticated()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(ApiResponse.error("User not authenticated"));
            }

            String username = authentication.getName();
            Long userId = userService.getUserIdFromUsername(username);

            if (userId == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(ApiResponse.error("User not found"));
            }

            ApiResponse<UserResponse> response = userService.verifyAndUpdatePhone(userId, request);

            if (response.isSuccess()) {
                return ResponseEntity.ok(response);
            } else {
                return ResponseEntity.badRequest().body(response);
            }

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Error verifying phone: " + e.getMessage()));
        }
    }

    @GetMapping("/profile/phone/status")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getPhoneVerificationStatus() {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication == null || !authentication.isAuthenticated()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(ApiResponse.error("User not authenticated"));
            }

            String username = authentication.getName();
            Long userId = userService.getUserIdFromUsername(username);

            if (userId == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(ApiResponse.error("User not found"));
            }

            ApiResponse<Map<String, Object>> response = userService.getPhoneVerificationStatus(userId);

            if (response.isSuccess()) {
                return ResponseEntity.ok(response);
            } else {
                return ResponseEntity.badRequest().body(response);
            }

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Error getting phone status: " + e.getMessage()));
        }
    }
}