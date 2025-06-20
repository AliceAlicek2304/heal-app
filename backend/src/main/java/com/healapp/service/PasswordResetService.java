package com.healapp.service;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.Random;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.stereotype.Service;

@Service
public class PasswordResetService {

    // cache lưu mã xác thực
    private final Map<String, VerificationData> verificationCodes = new ConcurrentHashMap<>();

    private static final int COOLDOWN_SECONDS = 60;

    // time hiệu lực
    private static final int EXPIRY_MINUTES = 15;

    public String generateVerificationCode(String email) throws RateLimitException {
        String key = getKey(email);
        VerificationData existingData = verificationCodes.get(key);

        // check cooldown
        if (existingData != null) {
            LocalDateTime now = LocalDateTime.now();
            LocalDateTime lastSent = existingData.getCreatedAt();

            long secondsElapsed = java.time.Duration.between(lastSent, now).getSeconds();
            if (secondsElapsed < COOLDOWN_SECONDS) {
                throw new RateLimitException("Please wait " + (COOLDOWN_SECONDS - secondsElapsed) +
                        " seconds before requesting another code");
            }
        }

        // Generate new code
        String code = generateSixDigitCode();

        // Store code with metadata
        verificationCodes.put(key, new VerificationData(code, LocalDateTime.now()));

        return code;
    }

    public boolean verifyCode(String email, String code) {
        String key = getKey(email);
        VerificationData data = verificationCodes.get(key);

        if (data == null) {
            return false;
        }

        // Check if code has expired
        LocalDateTime now = LocalDateTime.now();
        if (now.isAfter(data.getCreatedAt().plusMinutes(EXPIRY_MINUTES))) {
            verificationCodes.remove(key);
            return false;
        }

        // Check if code matches
        return data.getCode().equals(code);
    }

    public void removeCode(String email) {
        verificationCodes.remove(getKey(email));
    }

    private String getKey(String email) {
        return email.toLowerCase() + "_forgot";
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