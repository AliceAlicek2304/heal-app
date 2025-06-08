package com.healapp.controller;

import com.healapp.dto.ApiResponse;
import com.healapp.model.Payment;
import com.healapp.service.PaymentService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import org.springframework.security.access.prepost.PreAuthorize;

import java.util.List;

@RestController
@RequestMapping("/payments")
@Slf4j
public class PaymentController {

    @Autowired
    private PaymentService paymentService;

    @GetMapping("/my-payments")
    public ResponseEntity<ApiResponse<List<Payment>>> getMyPayments() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String username = auth.getName();

        log.info("User {} requesting payment history", username);

        ApiResponse<List<Payment>> response = paymentService.getPaymentsByUser(username);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{paymentId}")
    public ResponseEntity<ApiResponse<Payment>> getPaymentDetails(@PathVariable Long paymentId) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String username = auth.getName();

        log.info("User {} requesting payment details: {}", username, paymentId);

        ApiResponse<Payment> response = paymentService.getPaymentByIdForUser(paymentId, username);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/qr/{qrReference}")
    public ResponseEntity<ApiResponse<Payment>> getQRPaymentInfo(@PathVariable String qrReference) {
        log.info("Getting QR payment info for reference: {}", qrReference);

        // Auto-check payment status trước khi trả về
        paymentService.autoCheckQRPayment(qrReference);

        ApiResponse<Payment> response = paymentService.getQRPaymentByReference(qrReference);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/qr/{qrReference}/check")
    public ResponseEntity<ApiResponse<Payment>> checkQRPayment(@PathVariable String qrReference) {
        log.info("Manual check QR payment: {}", qrReference);

        ApiResponse<Payment> response = paymentService.autoCheckQRPayment(qrReference);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{paymentId}/regenerate-qr")
    public ResponseEntity<ApiResponse<Payment>> regenerateQRCode(@PathVariable Long paymentId) {
        log.info("User requesting QR regeneration for payment: {}", paymentId);

        ApiResponse<Payment> response = paymentService.regenerateQRCode(paymentId);
        return ResponseEntity.ok(response);
    }

    // Simulate successful QR payment
    @PostMapping("/qr/{qrReference}/simulate-success")
    @PreAuthorize("hasRole('ROLE_ADMIN') or hasRole('ROLE_STAFF')")
    public ResponseEntity<ApiResponse<String>> simulateQRPaymentSuccess(
            @PathVariable String qrReference,
            @RequestBody(required = false) Map<String, String> body) {

        try {
            String transactionId = body != null && body.get("transactionId") != null
                    ? body.get("transactionId")
                    : "SIM" + System.currentTimeMillis();

            String notes = body != null && body.get("notes") != null
                    ? body.get("notes")
                    : "Simulated payment success";

            log.info("🎭 Simulating QR payment success for reference: {}", qrReference);

            ApiResponse<String> response = paymentService.simulateQRPaymentSuccess(
                    qrReference, transactionId, notes);

            return getResponseEntity(response);

        } catch (Exception e) {
            log.error(" Error simulating payment: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(
                    ApiResponse.error("Failed to simulate payment: " + e.getMessage()));
        }
    }

    @GetMapping("/qr/{qrReference}/status")
    @PreAuthorize("hasRole('ROLE_CUSTOMER') or hasRole('ROLE_ADMIN') or hasRole('ROLE_STAFF')")
    public ResponseEntity<ApiResponse<String>> checkQRPaymentStatus(@PathVariable String qrReference) {
        try {
            log.info("📊 Checking QR payment status for reference: {}", qrReference);

            ApiResponse<String> response = paymentService.getQRPaymentStatus(qrReference);
            return getResponseEntity(response);

        } catch (Exception e) {
            log.error(" Error checking payment status: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(
                    ApiResponse.error("Failed to check payment status: " + e.getMessage()));
        }
    }

    private <T> ResponseEntity<ApiResponse<T>> getResponseEntity(ApiResponse<T> response) {
        if (response.isSuccess()) {
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.badRequest().body(response);
        }
    }
}