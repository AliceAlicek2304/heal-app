package com.healapp.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.healapp.dto.ApiResponse;
import com.healapp.dto.PaymentInfoRequest;
import com.healapp.dto.PaymentInfoResponse;
import com.healapp.service.PaymentInfoService;
import com.healapp.service.UserService;

import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("/payment-info")
@Slf4j
public class PaymentInfoController {

    @Autowired
    private PaymentInfoService paymentInfoService;

    @Autowired
    private UserService userService;

    // Get all payment methods for current user
    @GetMapping("/my-cards")
    public ResponseEntity<ApiResponse<List<PaymentInfoResponse>>> getMyPaymentInfo() {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            String username = auth.getName();
            
            Long userId = userService.getUserIdByUsername(username);
            if (userId == null) {
                return ResponseEntity.badRequest().body(ApiResponse.error("User not found"));
            }

            log.info("User {} requesting payment info", username);
            ApiResponse<List<PaymentInfoResponse>> response = paymentInfoService.getUserPaymentInfo(userId);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error getting payment info: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(ApiResponse.error("Failed to get payment info: " + e.getMessage()));
        }
    }

    // Get default payment method for current user
    @GetMapping("/default")
    public ResponseEntity<ApiResponse<PaymentInfoResponse>> getDefaultPaymentInfo() {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            String username = auth.getName();
            
            Long userId = userService.getUserIdByUsername(username);
            if (userId == null) {
                return ResponseEntity.badRequest().body(ApiResponse.error("User not found"));
            }

            log.info("User {} requesting default payment info", username);
            ApiResponse<PaymentInfoResponse> response = paymentInfoService.getDefaultPaymentInfo(userId);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error getting default payment info: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(ApiResponse.error("Failed to get default payment info: " + e.getMessage()));
        }
    }

    // Add new payment method
    @PostMapping("/add")
    public ResponseEntity<ApiResponse<PaymentInfoResponse>> addPaymentInfo(@RequestBody PaymentInfoRequest request) {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            String username = auth.getName();
            
            Long userId = userService.getUserIdByUsername(username);
            if (userId == null) {
                return ResponseEntity.badRequest().body(ApiResponse.error("User not found"));
            }

            log.info("User {} adding new payment method", username);
            ApiResponse<PaymentInfoResponse> response = paymentInfoService.addPaymentInfo(userId, request);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error adding payment info: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(ApiResponse.error("Failed to add payment method: " + e.getMessage()));
        }
    }

    // Update payment method
    @PutMapping("/{paymentInfoId}")
    public ResponseEntity<ApiResponse<PaymentInfoResponse>> updatePaymentInfo(
            @PathVariable Long paymentInfoId,
            @RequestBody PaymentInfoRequest request) {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            String username = auth.getName();
            
            Long userId = userService.getUserIdByUsername(username);
            if (userId == null) {
                return ResponseEntity.badRequest().body(ApiResponse.error("User not found"));
            }

            log.info("User {} updating payment method {}", username, paymentInfoId);
            ApiResponse<PaymentInfoResponse> response = paymentInfoService.updatePaymentInfo(userId, paymentInfoId, request);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error updating payment info: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(ApiResponse.error("Failed to update payment method: " + e.getMessage()));
        }
    }

    // Delete payment method
    @DeleteMapping("/{paymentInfoId}")
    public ResponseEntity<ApiResponse<String>> deletePaymentInfo(@PathVariable Long paymentInfoId) {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            String username = auth.getName();
            
            Long userId = userService.getUserIdByUsername(username);
            if (userId == null) {
                return ResponseEntity.badRequest().body(ApiResponse.error("User not found"));
            }

            log.info("User {} deleting payment method {}", username, paymentInfoId);
            ApiResponse<String> response = paymentInfoService.deletePaymentInfo(userId, paymentInfoId);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error deleting payment info: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(ApiResponse.error("Failed to delete payment method: " + e.getMessage()));
        }
    }

    // Set default payment method
    @PutMapping("/{paymentInfoId}/set-default")
    public ResponseEntity<ApiResponse<PaymentInfoResponse>> setDefaultPaymentInfo(@PathVariable Long paymentInfoId) {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            String username = auth.getName();
            
            Long userId = userService.getUserIdByUsername(username);
            if (userId == null) {
                return ResponseEntity.badRequest().body(ApiResponse.error("User not found"));
            }

            log.info("User {} setting payment method {} as default", username, paymentInfoId);
            ApiResponse<PaymentInfoResponse> response = paymentInfoService.setDefaultPaymentInfo(userId, paymentInfoId);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error setting default payment info: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(ApiResponse.error("Failed to set default payment method: " + e.getMessage()));
        }
    }
} 