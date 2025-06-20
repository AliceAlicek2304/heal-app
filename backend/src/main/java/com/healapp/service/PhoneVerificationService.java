package com.healapp.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Service
public class PhoneVerificationService {

    // Cache lưu mã xác thực
    private final Map<String, VerificationData> verificationCodes = new ConcurrentHashMap<>();
    
    private static final int COOLDOWN_SECONDS = 60;
    private static final int EXPIRY_MINUTES = 10;
    private static final String VERIFIED_SUFFIX = "_V"; // Đánh dấu đã xác thực

    public String generateVerificationCode(String phone) throws RateLimitException {
        String normalizedPhone = normalizePhone(phone);
        String key = getKey(normalizedPhone);
        VerificationData existingData = verificationCodes.get(key);

        // Kiểm tra thời gian chờ giữa các lần gửi mã
        if (existingData != null) {
            LocalDateTime now = LocalDateTime.now();
            LocalDateTime lastSent = existingData.getCreatedAt();

            long secondsElapsed = java.time.Duration.between(lastSent, now).getSeconds();
            if (secondsElapsed < COOLDOWN_SECONDS) {
                throw new RateLimitException("Vui lòng đợi " + (COOLDOWN_SECONDS - secondsElapsed) +
                        " giây trước khi yêu cầu gửi mã mới");
            }
        }

        // Tạo mã mới
        String code = generateSixDigitCode();
        verificationCodes.put(key, new VerificationData(code, LocalDateTime.now()));
        
        log.info("Generated verification code for phone: {}", normalizedPhone);
        return code;
    }

    public boolean verifyCode(String phone, String code) {
        String normalizedPhone = normalizePhone(phone);
        String key = getKey(normalizedPhone);
        VerificationData data = verificationCodes.get(key);

        if (data == null) {
            log.warn("No verification data found for phone: {}", normalizedPhone);
            return false;
        }

        // Kiểm tra mã có còn hiệu lực không
        LocalDateTime now = LocalDateTime.now();
        if (now.isAfter(data.getCreatedAt().plusMinutes(EXPIRY_MINUTES))) {
            verificationCodes.remove(key);
            log.warn("Verification code expired for phone: {}", normalizedPhone);
            return false;
        }

        boolean isValid = data.getCode().equals(code);

        if (isValid) {
            verificationCodes.remove(key);
            log.info("Phone verification successful for: {}", normalizedPhone);
        } else {
            log.warn("Invalid verification code for phone: {}", normalizedPhone);
        }

        return isValid;
    }

    // Đánh dấu số điện thoại đã xác thực
    public String markPhoneAsVerified(String phone) {
        if (isPhoneVerified(phone)) {
            return phone; // Đã xác thực rồi
        }
        return phone + VERIFIED_SUFFIX;
    }

    // Kiểm tra số điện thoại đã xác thực
    public boolean isPhoneVerified(String phone) {
        return phone != null && phone.endsWith(VERIFIED_SUFFIX);
    }

    // Lấy số điện thoại gốc (bỏ suffix)
    public String getOriginalPhone(String phone) {
        if (phone != null && phone.endsWith(VERIFIED_SUFFIX)) {
            return phone.substring(0, phone.length() - VERIFIED_SUFFIX.length());
        }
        return phone;
    }

    // Chuẩn hóa số điện thoại (loại bỏ khoảng trắng, dấu gạch ngang)
    public String normalizePhone(String phone) {
        if (phone == null) return null;
        
        String originalPhone = getOriginalPhone(phone);
        
        // Loại bỏ khoảng trắng, dấu gạch ngang, dấu chấm
        originalPhone = originalPhone.replaceAll("[\\s\\-\\.]", "");
        
        // Nếu có suffix thì thêm lại
        if (isPhoneVerified(phone)) {
            return originalPhone + VERIFIED_SUFFIX;
        }
        
        return originalPhone;
    }

    // Kiểm tra 2 số điện thoại có giống nhau không (bỏ qua trạng thái xác thực)
    public boolean isSamePhone(String phone1, String phone2) {
        if (phone1 == null || phone2 == null) return false;
        
        String original1 = normalizePhone(getOriginalPhone(phone1));
        String original2 = normalizePhone(getOriginalPhone(phone2));
        
        return original1.equals(original2);
    }

    // Utility methods
    private String getKey(String phone) {
        return getOriginalPhone(phone).toLowerCase() + "_phone_verification";
    }

    private String generateSixDigitCode() {
        return String.format("%06d", (int) (Math.random() * 1000000));
    }

    public void removeCode(String phone) {
        verificationCodes.remove(getKey(normalizePhone(phone)));
    }

    private static class VerificationData {
        private final String code;
        private final LocalDateTime createdAt;

        public VerificationData(String code, LocalDateTime createdAt) {
            this.code = code;
            this.createdAt = createdAt;
        }

        public String getCode() { return code; }
        public LocalDateTime getCreatedAt() { return createdAt; }
    }

    public static class RateLimitException extends Exception {
        public RateLimitException(String message) {
            super(message);
        }
    }
}
