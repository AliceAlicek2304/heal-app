package com.healapp.service;

import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.Random;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class EmailVerificationService {

    // Cache lưu mã
    private final Map<String, VerificationData> verificationCodes = new ConcurrentHashMap<>();

    private static final int COOLDOWN_SECONDS = 60;

    private static final int EXPIRY_MINUTES = 10;

    public String generateVerificationCode(String email) throws RateLimitException {
        String key = getKey(email);
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

        return code;
    }

    public boolean verifyCode(String email, String code) {
        String key = getKey(email);
        VerificationData data = verificationCodes.get(key);

        if (data == null) {
            return false;
        }

        // Kiểm tra mã có còn hiệu lực không
        LocalDateTime now = LocalDateTime.now();
        if (now.isAfter(data.getCreatedAt().plusMinutes(EXPIRY_MINUTES))) {
            verificationCodes.remove(key);
            return false;
        }

        boolean isValid = data.getCode().equals(code);

        if (isValid) {
            verificationCodes.remove(key);
        }

        return isValid;
    }

    public void removeCode(String email) {
        verificationCodes.remove(getKey(email));
    }

    private String getKey(String email) {
        return email.toLowerCase() + "_verification";
    }

    private String generateSixDigitCode() {
        Random random = new Random();
        int code = 100000 + random.nextInt(900000); // 100000-999999
        return String.valueOf(code);
    }

    private static class VerificationData {
        private final String code;
        private final LocalDateTime createdAt;

        public VerificationData(String code, LocalDateTime createdAt) {
            this.code = code;
            this.createdAt = createdAt;
        }

        public String getCode() {
            return code;
        }

        public LocalDateTime getCreatedAt() {
            return createdAt;
        }
    }

    public static class RateLimitException extends Exception {
        private static final long serialVersionUID = 1L;

        public RateLimitException(String message) {
            super(message);
        }
    }
}