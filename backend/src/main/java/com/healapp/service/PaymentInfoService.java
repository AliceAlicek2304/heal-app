package com.healapp.service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import javax.crypto.Cipher;
import javax.crypto.spec.SecretKeySpec;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.healapp.dto.ApiResponse;
import com.healapp.dto.PaymentInfoRequest;
import com.healapp.dto.PaymentInfoResponse;
import com.healapp.model.PaymentInfo;
import com.healapp.model.UserDtls;
import com.healapp.repository.PaymentInfoRepository;
import com.healapp.repository.UserRepository;

import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
@Transactional
public class PaymentInfoService {

    @Autowired
    private PaymentInfoRepository paymentInfoRepository;

    @Autowired
    private UserRepository userRepository;

    private static final String ENCRYPTION_KEY = "HealAppPayment2024"; // In production, use environment variable
    private static final String ALGORITHM = "AES";

    // Get all payment info for a user
    public ApiResponse<List<PaymentInfoResponse>> getUserPaymentInfo(Long userId) {
        try {
            Optional<UserDtls> userOpt = userRepository.findById(userId);
            if (userOpt.isEmpty()) {
                return ApiResponse.error("User not found");
            }

            List<PaymentInfo> paymentInfos = paymentInfoRepository.findByUserIdAndIsActiveTrueOrderByIsDefaultDescCreatedAtDesc(userId);
            List<PaymentInfoResponse> responses = paymentInfos.stream()
                    .map(this::convertToResponse)
                    .collect(Collectors.toList());

            return ApiResponse.success("Payment info retrieved successfully", responses);
        } catch (Exception e) {
            log.error("Error retrieving payment info for user {}: {}", userId, e.getMessage(), e);
            return ApiResponse.error("Failed to retrieve payment info: " + e.getMessage());
        }
    }

    // Get default payment info for a user
    public ApiResponse<PaymentInfoResponse> getDefaultPaymentInfo(Long userId) {
        try {
            Optional<PaymentInfo> defaultPaymentInfo = paymentInfoRepository.findByUserIdAndIsDefaultTrueAndIsActiveTrue(userId);
            
            if (defaultPaymentInfo.isEmpty()) {
                return ApiResponse.error("No default payment method found");
            }

            PaymentInfoResponse response = convertToResponse(defaultPaymentInfo.get());
            return ApiResponse.success("Default payment info retrieved successfully", response);
        } catch (Exception e) {
            log.error("Error retrieving default payment info for user {}: {}", userId, e.getMessage(), e);
            return ApiResponse.error("Failed to retrieve default payment info: " + e.getMessage());
        }
    }

    // Add new payment info
    public ApiResponse<PaymentInfoResponse> addPaymentInfo(Long userId, PaymentInfoRequest request) {
        try {
            Optional<UserDtls> userOpt = userRepository.findById(userId);
            if (userOpt.isEmpty()) {
                return ApiResponse.error("User not found");
            }

            UserDtls user = userOpt.get();

            // Validate card expiry
            if (isCardExpired(request.getExpiryMonth(), request.getExpiryYear())) {
                return ApiResponse.error("Card has expired");
            }

            // Check if card already exists
            String maskedCardNumber = maskCardNumber(request.getCardNumber());
            if (paymentInfoRepository.existsByUserIdAndCardNumberAndIsActiveTrue(userId, maskedCardNumber)) {
                return ApiResponse.error("This card is already saved");
            }

            // Encrypt card number
            String encryptedCardNumber = encryptCardNumber(request.getCardNumber());

            // Determine card type
            String cardType = determineCardType(request.getCardNumber());

            PaymentInfo paymentInfo = PaymentInfo.builder()
                    .user(user)
                    .cardHolderName(request.getCardHolderName())
                    .cardNumber(maskedCardNumber)
                    .cardNumberEncrypted(encryptedCardNumber)
                    .expiryMonth(request.getExpiryMonth())
                    .expiryYear(request.getExpiryYear())
                    .cardType(cardType)
                    .nickname(request.getNickname())
                    .isDefault(request.getIsDefault() != null ? request.getIsDefault() : false)
                    .isActive(true)
                    .build();

            // If this is set as default, clear other defaults
            if (paymentInfo.getIsDefault()) {
                paymentInfoRepository.clearDefaultForUser(userId, 0L); // 0L since this is a new record
            }

            PaymentInfo savedPaymentInfo = paymentInfoRepository.save(paymentInfo);
            PaymentInfoResponse response = convertToResponse(savedPaymentInfo);

            log.info("Payment info added for user {}: {}", userId, response.getPaymentInfoId());
            return ApiResponse.success("Payment method saved successfully", response);

        } catch (Exception e) {
            log.error("Error adding payment info for user {}: {}", userId, e.getMessage(), e);
            return ApiResponse.error("Failed to save payment method: " + e.getMessage());
        }
    }

    // Update payment info
    public ApiResponse<PaymentInfoResponse> updatePaymentInfo(Long userId, Long paymentInfoId, PaymentInfoRequest request) {
        try {
            Optional<PaymentInfo> paymentInfoOpt = paymentInfoRepository.findByUserIdAndPaymentInfoIdAndIsActiveTrue(userId, paymentInfoId);
            if (paymentInfoOpt.isEmpty()) {
                return ApiResponse.error("Payment method not found");
            }

            PaymentInfo paymentInfo = paymentInfoOpt.get();

            // Validate card expiry
            if (isCardExpired(request.getExpiryMonth(), request.getExpiryYear())) {
                return ApiResponse.error("Card has expired");
            }

            // Update fields
            paymentInfo.setCardHolderName(request.getCardHolderName());
            paymentInfo.setExpiryMonth(request.getExpiryMonth());
            paymentInfo.setExpiryYear(request.getExpiryYear());
            paymentInfo.setNickname(request.getNickname());

            // Update card number if changed
            String maskedCardNumber = maskCardNumber(request.getCardNumber());
            if (!paymentInfo.getCardNumber().equals(maskedCardNumber)) {
                // Check if new card number already exists
                if (paymentInfoRepository.existsByUserIdAndCardNumberAndIsActiveTrue(userId, maskedCardNumber)) {
                    return ApiResponse.error("This card is already saved");
                }
                paymentInfo.setCardNumber(maskedCardNumber);
                paymentInfo.setCardNumberEncrypted(encryptCardNumber(request.getCardNumber()));
                paymentInfo.setCardType(determineCardType(request.getCardNumber()));
            }

            // Handle default status
            if (request.getIsDefault() != null && request.getIsDefault() && !paymentInfo.getIsDefault()) {
                paymentInfoRepository.clearDefaultForUser(userId, paymentInfoId);
                paymentInfo.setIsDefault(true);
            } else if (request.getIsDefault() != null && !request.getIsDefault() && paymentInfo.getIsDefault()) {
                paymentInfo.setIsDefault(false);
            }

            PaymentInfo updatedPaymentInfo = paymentInfoRepository.save(paymentInfo);
            PaymentInfoResponse response = convertToResponse(updatedPaymentInfo);

            log.info("Payment info updated for user {}: {}", userId, paymentInfoId);
            return ApiResponse.success("Payment method updated successfully", response);

        } catch (Exception e) {
            log.error("Error updating payment info for user {}: {}", userId, e.getMessage(), e);
            return ApiResponse.error("Failed to update payment method: " + e.getMessage());
        }
    }

    // Delete payment info (soft delete)
    public ApiResponse<String> deletePaymentInfo(Long userId, Long paymentInfoId) {
        try {
            Optional<PaymentInfo> paymentInfoOpt = paymentInfoRepository.findByUserIdAndPaymentInfoIdAndIsActiveTrue(userId, paymentInfoId);
            if (paymentInfoOpt.isEmpty()) {
                return ApiResponse.error("Payment method not found");
            }

            PaymentInfo paymentInfo = paymentInfoOpt.get();
            paymentInfo.setIsActive(false);

            // If this was the default card, set another card as default
            if (paymentInfo.getIsDefault()) {
                List<PaymentInfo> otherCards = paymentInfoRepository.findByUserIdAndIsActiveTrueOrderByIsDefaultDescCreatedAtDesc(userId);
                otherCards.removeIf(card -> card.getPaymentInfoId().equals(paymentInfoId));
                
                if (!otherCards.isEmpty()) {
                    PaymentInfo newDefault = otherCards.get(0);
                    newDefault.setIsDefault(true);
                    paymentInfoRepository.save(newDefault);
                }
            }

            paymentInfoRepository.save(paymentInfo);

            log.info("Payment info deleted for user {}: {}", userId, paymentInfoId);
            return ApiResponse.success("Payment method deleted successfully");

        } catch (Exception e) {
            log.error("Error deleting payment info for user {}: {}", userId, e.getMessage(), e);
            return ApiResponse.error("Failed to delete payment method: " + e.getMessage());
        }
    }

    // Set default payment info
    public ApiResponse<PaymentInfoResponse> setDefaultPaymentInfo(Long userId, Long paymentInfoId) {
        try {
            Optional<PaymentInfo> paymentInfoOpt = paymentInfoRepository.findByUserIdAndPaymentInfoIdAndIsActiveTrue(userId, paymentInfoId);
            if (paymentInfoOpt.isEmpty()) {
                return ApiResponse.error("Payment method not found");
            }

            PaymentInfo paymentInfo = paymentInfoOpt.get();
            
            // Clear other defaults
            paymentInfoRepository.clearDefaultForUser(userId, paymentInfoId);
            
            // Set this as default
            paymentInfo.setIsDefault(true);
            PaymentInfo updatedPaymentInfo = paymentInfoRepository.save(paymentInfo);
            
            PaymentInfoResponse response = convertToResponse(updatedPaymentInfo);
            return ApiResponse.success("Default payment method updated successfully", response);

        } catch (Exception e) {
            log.error("Error setting default payment info for user {}: {}", userId, e.getMessage(), e);
            return ApiResponse.error("Failed to set default payment method: " + e.getMessage());
        }
    }

    // Get decrypted card number for payment processing
    public String getDecryptedCardNumber(Long userId, Long paymentInfoId) {
        try {
            Optional<PaymentInfo> paymentInfoOpt = paymentInfoRepository.findByUserIdAndPaymentInfoIdAndIsActiveTrue(userId, paymentInfoId);
            if (paymentInfoOpt.isEmpty()) {
                return null;
            }

            PaymentInfo paymentInfo = paymentInfoOpt.get();
            return decryptCardNumber(paymentInfo.getCardNumberEncrypted());
        } catch (Exception e) {
            log.error("Error decrypting card number: {}", e.getMessage(), e);
            return null;
        }
    }

    // Helper methods
    private PaymentInfoResponse convertToResponse(PaymentInfo paymentInfo) {
        PaymentInfoResponse response = new PaymentInfoResponse();
        response.setPaymentInfoId(paymentInfo.getPaymentInfoId());
        response.setUserId(paymentInfo.getUser().getId());
        response.setCardHolderName(paymentInfo.getCardHolderName());
        response.setCardNumber(paymentInfo.getCardNumber());
        response.setExpiryMonth(paymentInfo.getExpiryMonth());
        response.setExpiryYear(paymentInfo.getExpiryYear());
        response.setCardType(paymentInfo.getCardType());
        response.setIsDefault(paymentInfo.getIsDefault());
        response.setIsActive(paymentInfo.getIsActive());
        response.setNickname(paymentInfo.getNickname());
        response.setDisplayName(paymentInfo.getDisplayName());
        response.setIsExpired(paymentInfo.isExpired());
        response.setCreatedAt(paymentInfo.getCreatedAt());
        response.setUpdatedAt(paymentInfo.getUpdatedAt());
        return response;
    }

    private String maskCardNumber(String cardNumber) {
        if (cardNumber == null || cardNumber.length() < 4) {
            return "**** **** **** ****";
        }
        return "**** **** **** " + cardNumber.substring(cardNumber.length() - 4);
    }

    private String determineCardType(String cardNumber) {
        if (cardNumber == null || cardNumber.length() < 4) {
            return "UNKNOWN";
        }
        
        String firstDigit = cardNumber.substring(0, 1);
        String firstTwoDigits = cardNumber.substring(0, 2);
        String firstFourDigits = cardNumber.substring(0, 4);
        
        if (firstDigit.equals("4")) {
            return "VISA";
        } else if (firstTwoDigits.matches("5[1-5]") || firstFourDigits.matches("222[1-9]")) {
            return "MASTERCARD";
        } else if (firstTwoDigits.equals("34") || firstTwoDigits.equals("37")) {
            return "AMEX";
        } else if (firstFourDigits.equals("6011") || firstTwoDigits.matches("6[4-9]")) {
            return "DISCOVER";
        } else {
            return "UNKNOWN";
        }
    }

    private boolean isCardExpired(String expiryMonth, String expiryYear) {
        try {
            int month = Integer.parseInt(expiryMonth);
            int year = Integer.parseInt(expiryYear);
            int currentYear = LocalDateTime.now().getYear();
            int currentMonth = LocalDateTime.now().getMonthValue();
            
            return year < currentYear || (year == currentYear && month < currentMonth);
        } catch (NumberFormatException e) {
            return true;
        }
    }

    private String encryptCardNumber(String cardNumber) {
        try {
            SecretKeySpec secretKey = generateKey();
            Cipher cipher = Cipher.getInstance(ALGORITHM);
            cipher.init(Cipher.ENCRYPT_MODE, secretKey);
            byte[] encryptedBytes = cipher.doFinal(cardNumber.getBytes(StandardCharsets.UTF_8));
            return Base64.getEncoder().encodeToString(encryptedBytes);
        } catch (Exception e) {
            log.error("Error encrypting card number: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to encrypt card number", e);
        }
    }

    private String decryptCardNumber(String encryptedCardNumber) {
        try {
            SecretKeySpec secretKey = generateKey();
            Cipher cipher = Cipher.getInstance(ALGORITHM);
            cipher.init(Cipher.DECRYPT_MODE, secretKey);
            byte[] decryptedBytes = cipher.doFinal(Base64.getDecoder().decode(encryptedCardNumber));
            return new String(decryptedBytes, StandardCharsets.UTF_8);
        } catch (Exception e) {
            log.error("Error decrypting card number: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to decrypt card number", e);
        }
    }

    private SecretKeySpec generateKey() throws Exception {
        MessageDigest digest = MessageDigest.getInstance("SHA-256");
        byte[] hash = digest.digest(ENCRYPTION_KEY.getBytes(StandardCharsets.UTF_8));
        return new SecretKeySpec(hash, ALGORITHM);
    }
} 