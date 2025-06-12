package com.healapp.service;

import com.healapp.dto.ApiResponse;
import com.healapp.dto.BankTransactionResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.Map;

@Service
@Slf4j
public class BankingService {

    // MB Bank Configuration
    @Value("${banking.mb.api.url:https://api.mbbank.com.vn}")
    private String mbBankApiUrl;

    @Value("${banking.mb.api.key:your-mb-api-key}")
    private String mbApiKey;

    @Value("${banking.mb.account.number:0349079940}")
    private String mbAccountNumber;

    @Value("${banking.mb.account.name:NGUYEN VAN CUONG}")
    private String mbAccountName;

    @Value("${banking.mb.device.id:healapp-device-001}")
    private String mbDeviceId;

    @Value("${banking.simulation.enabled:false}")
    private boolean simulationEnabled;

    private final RestTemplate restTemplate = new RestTemplate();

    /**
     * Check if QR payment has been received in MB Bank account
     */
    public ApiResponse<BankTransactionResponse> checkTransaction(String qrReference, BigDecimal expectedAmount) {
        try {
            log.info("Checking MB Bank transaction for QR reference: {} - Expected amount: {} - Simulation enabled: {}",
                    qrReference, expectedAmount, simulationEnabled);

            // Prepare request headers for MB Bank API
            HttpHeaders headers = new HttpHeaders();
            headers.set("Authorization", "Bearer " + mbApiKey);
            headers.set("Content-Type", "application/json");
            headers.set("X-Device-ID", mbDeviceId);
            headers.set("X-Account-Number", mbAccountNumber);

            // Prepare request body for MB Bank transaction check
            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("accountNumber", mbAccountNumber);
            requestBody.put("fromDate",
                    LocalDateTime.now().minusHours(24).format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));
            requestBody.put("toDate", LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));
            requestBody.put("reference", qrReference);
            requestBody.put("amount", expectedAmount);
            requestBody.put("transactionType", "CREDIT"); // Incoming money

            HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);

            // Call MB Bank API
            String endpoint = mbBankApiUrl + "/api/transaction-history/check";

            try {
                ResponseEntity<BankTransactionResponse> response = restTemplate.exchange(
                        endpoint, HttpMethod.POST, request, BankTransactionResponse.class);

                BankTransactionResponse bankResponse = response.getBody();

                if (bankResponse != null && bankResponse.isTransactionFound()) {
                    log.info("💰 MB Bank transaction found - QR: {} - Amount: {} - TX ID: {}",
                            qrReference, bankResponse.getAmount(), bankResponse.getTransactionId());
                    return ApiResponse.success("Transaction found", bankResponse);
                } else {
                    log.debug("🔍 No MB Bank transaction found for QR reference: {}", qrReference);
                    return ApiResponse.error("Transaction not found");
                }

            } catch (Exception apiException) {
                log.warn("⚠️ MB Bank API call failed: {}", apiException.getMessage());

                // CHỈ SIMULATE KHI ĐƯỢC BẬT
                if (simulationEnabled) {
                    log.info("🎭 Simulation ENABLED - Using fallback simulation");
                    return simulateTransactionCheck(qrReference, expectedAmount);
                } else {
                    log.info(" Simulation DISABLED - Returning transaction not found");
                    return ApiResponse.error("MB Bank API unavailable - Transaction not found");
                }
            }

        } catch (Exception e) {
            log.error(" Error checking MB Bank transaction for QR {}: {}", qrReference, e.getMessage(), e);

            // CHỈ SIMULATE KHI ĐƯỢC BẬT
            if (simulationEnabled) {
                log.info("🎭 Simulation ENABLED - Using fallback for error");
                return simulateTransactionCheck(qrReference, expectedAmount);
            } else {
                return ApiResponse.error("Banking API error: " + e.getMessage());
            }
        }
    }

    /**
     * Simulate transaction check for development/testing
     */
    private ApiResponse<BankTransactionResponse> simulateTransactionCheck(String qrReference,
            BigDecimal expectedAmount) {
        log.info("🔄 Simulating MB Bank transaction check for QR: {}", qrReference);

        // Simulate 70% success rate for testing
        boolean transactionFound = Math.random() > 0.3;

        BankTransactionResponse response = new BankTransactionResponse();
        response.setAccountNumber(mbAccountNumber);
        response.setReference(qrReference);
        response.setAmount(expectedAmount);
        response.setTransactionDate(LocalDateTime.now().minusMinutes((int) (Math.random() * 60)));

        if (transactionFound) {
            response.setTransactionId("MB" + System.currentTimeMillis());
            response.setDescription("Chuyen tien QR - " + qrReference);
            response.setStatus("SUCCESS");
            response.setTransactionFound(true);

            log.info(" Simulated transaction found - QR: {} - TX: {}", qrReference, response.getTransactionId());
            return ApiResponse.success("Simulated transaction found", response);
        } else {
            response.setTransactionFound(false);
            log.debug(" Simulated transaction not found for QR: {}", qrReference);
            return ApiResponse.error("Simulated transaction not found");
        }
    }

    /**
     * Get recent transactions from MB Bank account
     */
    public ApiResponse<BankTransactionResponse[]> getRecentTransactions() {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.set("Authorization", "Bearer " + mbApiKey);
            headers.set("X-Device-ID", mbDeviceId);
            headers.set("X-Account-Number", mbAccountNumber);

            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("accountNumber", mbAccountNumber);
            requestBody.put("fromDate", LocalDateTime.now().minusDays(1).format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));
            requestBody.put("toDate", LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));
            requestBody.put("limit", 50);

            HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);

            String endpoint = mbBankApiUrl + "/api/transaction-history";
            ResponseEntity<BankTransactionResponse[]> response = restTemplate.exchange(
                    endpoint, HttpMethod.POST, request, BankTransactionResponse[].class);

            return ApiResponse.success("Recent transactions retrieved", response.getBody());

        } catch (Exception e) {
            log.error("Error getting recent MB Bank transactions: {}", e.getMessage(), e);
            return ApiResponse.error("Failed to get transactions: " + e.getMessage());
        }
    }

    /**
     * Generate QR Code URL for MB Bank
     */
    public String generateMBBankQRUrl(String qrReference, BigDecimal amount) {
        try {
            // Use VietQR format that matches STITestService (working format)
            String baseUrl = "https://img.vietqr.io/image";
            String bankCode = "970422"; // MB Bank code

            // Format:
            // https://img.vietqr.io/image/970422-0349079940-compact.png?amount=500000&addInfo=HEALSTI...
            String qrUrl = String.format("%s/%s-%s-compact.png?amount=%s&addInfo=%s&accountName=%s",
                    baseUrl,
                    bankCode,
                    mbAccountNumber,
                    amount.toString(),
                    java.net.URLEncoder.encode(qrReference, java.nio.charset.StandardCharsets.UTF_8),
                    java.net.URLEncoder.encode(mbAccountName, java.nio.charset.StandardCharsets.UTF_8));

            log.info("Generated MB Bank QR URL for reference: {} - Amount: {}", qrReference, amount);
            return qrUrl;

        } catch (Exception e) {
            log.error("Error generating MB Bank QR URL: {}", e.getMessage());
            return null;
        }
    }

    /**
     * Validate MB Bank account
     */
    public ApiResponse<String> validateAccount() {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.set("Authorization", "Bearer " + mbApiKey);
            headers.set("X-Device-ID", mbDeviceId);

            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("accountNumber", mbAccountNumber);

            HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);

            String endpoint = mbBankApiUrl + "/api/account/validate";
            ResponseEntity<Map> response = restTemplate.exchange(
                    endpoint, HttpMethod.POST, request, Map.class);

            Map<String, Object> result = response.getBody();
            if (result != null && "SUCCESS".equals(result.get("status"))) {
                return ApiResponse.success("MB Bank account validated", (String) result.get("accountName"));
            } else {
                return ApiResponse.error("Failed to validate MB Bank account");
            }

        } catch (Exception e) {
            log.error("Error validating MB Bank account: {}", e.getMessage(), e);
            return ApiResponse.error("Account validation failed: " + e.getMessage());
        }
    }
}