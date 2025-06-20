package com.healapp.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;

import com.twilio.Twilio;
import com.twilio.rest.api.v2010.account.Message;
import com.twilio.type.PhoneNumber;

import java.util.concurrent.CompletableFuture;

@Slf4j
@Service
public class FirebaseSMSService {
    @Autowired
    private RestTemplate restTemplate;

    @Value("${sms.provider:twilio}")
    private String smsProvider;

    @Value("${sms.api.key:}")
    private String apiKey;

    @Value("${sms.enabled:false}")
    private boolean smsEnabled;

    @Value("${sms.development.mode:false}")
    private boolean developmentMode;

    // Twilio configuration
    @Value("${twilio.account.sid:}")
    private String twilioAccountSid;

    @Value("${twilio.auth.token:}")
    private String twilioAuthToken;

    @Value("${twilio.phone.number:}")
    private String twilioPhoneNumber;

    // TextBelt free API endpoint (fallback)
    private static final String TEXTBELT_URL = "https://textbelt.com/text";

    @Async
    public CompletableFuture<Boolean> sendVerificationCodeAsync(String phoneNumber, String verificationCode) {
        try {
            log.info("Sending SMS async to phone: {} with code: {}", phoneNumber, verificationCode);

            if (!smsEnabled) {
                log.info("SMS service is disabled, simulating success for: {}", phoneNumber);
                return CompletableFuture.completedFuture(true);
            }

            boolean result = sendSMSViaProvider(phoneNumber, verificationCode);

            if (result) {
                log.info("SMS sent successfully (async) to: {}", phoneNumber);
            } else {
                log.error("Failed to send SMS (async) to: {}", phoneNumber);
            }

            return CompletableFuture.completedFuture(result);

        } catch (Exception e) {
            log.error("Failed to send SMS async to {}: {}", phoneNumber, e.getMessage(), e);
            return CompletableFuture.completedFuture(false);
        }
    }

    public boolean sendVerificationCode(String phoneNumber, String verificationCode) {
        try {
            log.info("Sending SMS synchronously to phone: {} with code: {}", phoneNumber, verificationCode);

            if (!smsEnabled) {
                log.info("SMS service is disabled, simulating success for: {}", phoneNumber);
                return true;
            }

            if (developmentMode) {
                log.info("🔧 Development Mode: Simulating SMS success for: {}", phoneNumber);
                log.info("🔧 Verification code would be: {}", verificationCode);
                log.info("🔧 In production, enable SMS verification by setting sms.development.mode=false");
                return true;
            }

            boolean result = sendSMSViaProvider(phoneNumber, verificationCode);

            if (result) {
                log.info("SMS sent successfully to: {}", phoneNumber);
            } else {
                log.error("Failed to send SMS to: {}", phoneNumber);

                if (developmentMode) {
                    log.info("🔧 Development Mode: Treating SMS failure as success");
                    return true;
                }
            }

            return result;

        } catch (Exception e) {
            log.error("Failed to send SMS to {}: {}", phoneNumber, e.getMessage(), e);
            return false;
        }
    }

    private boolean sendSMSViaProvider(String phoneNumber, String verificationCode) {
        try {
            String message = "Mã xác thực HealApp của bạn là: " + verificationCode + ". Mã có hiệu lực trong 10 phút.";
            String formattedPhone = formatPhoneNumber(phoneNumber);

            log.info("Original phone: {}, Formatted phone: {}", phoneNumber, formattedPhone);
            switch (smsProvider.toLowerCase()) {
                case "twilio":
                    return sendViaTwilio(formattedPhone, message);
                case "textbelt":
                    return sendViaTextBelt(formattedPhone, message);
                default:
                    log.error("Unknown SMS provider: {}", smsProvider);
                    return false;
            }
        } catch (Exception e) {
            log.error("Error sending SMS via provider {}: {}", smsProvider, e.getMessage(), e);
            return false;
        }
    }

    private String formatPhoneNumber(String phoneNumber) {
        if (phoneNumber == null || phoneNumber.isEmpty()) {
            return phoneNumber;
        }

        // Remove all non-digit characters
        String cleaned = phoneNumber.replaceAll("[^0-9]", "");

        // Handle Vietnamese phone numbers
        if (cleaned.startsWith("84")) {
            // Already has country code
            return "+" + cleaned;
        } else if (cleaned.startsWith("0")) {
            // Remove leading 0 and add Vietnam country code
            return "+84" + cleaned.substring(1);
        } else if (cleaned.length() == 9) {
            // Assume it's Vietnamese number without leading 0
            return "+84" + cleaned;
        }

        // For other countries or unknown formats, return as is
        return "+" + cleaned;
    }

    private boolean sendViaTextBelt(String phoneNumber, String message) {
        try {
            log.info("=== TextBelt API Call Debug ===");
            log.info("URL: {}", TEXTBELT_URL);
            log.info("Phone: {}", phoneNumber);
            log.info("Message: {}", message);
            log.info("API Key: {}", apiKey);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

            MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
            params.add("phone", phoneNumber);
            params.add("message", message);
            params.add("key", apiKey.equals("textbelt") ? "textbelt" : apiKey);

            HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(params, headers);

            log.info("Request headers: {}", headers);
            log.info("Request params: {}", params);

            String response = restTemplate.postForObject(TEXTBELT_URL, request, String.class);

            log.info("TextBelt raw response: {}", response);

            if (response == null) {
                log.error("TextBelt returned null response");
                return false;
            }

            boolean success = response.contains("\"success\":true");

            if (success) {
                log.info(" TextBelt SMS sent successfully!");
            } else {
                log.error(" TextBelt SMS failed!");
                log.error("Error response: {}", response);
            }

            log.info("=== End TextBelt Debug ===");
            return success;

        } catch (Exception e) {
            log.error(" Exception calling TextBelt API for phone {}: {}", phoneNumber, e.getMessage(), e);
            return false;
        }
    }

    private boolean sendViaTwilio(String phoneNumber, String message) {
        try {
            log.info("=== Twilio API Call Debug ===");
            log.info("Account SID: {}", twilioAccountSid);
            log.info("Auth Token: {}****", twilioAuthToken.substring(0, Math.min(4, twilioAuthToken.length())));
            log.info("Phone: {}", phoneNumber);
            log.info("From: {}", twilioPhoneNumber);
            log.info("Message: {}", message);

            if (twilioAccountSid.isEmpty() || twilioAuthToken.isEmpty() || twilioPhoneNumber.isEmpty()) {
                log.error("Twilio credentials not configured properly");
                log.error("SID empty: {}, Token empty: {}, Phone empty: {}",
                        twilioAccountSid.isEmpty(), twilioAuthToken.isEmpty(), twilioPhoneNumber.isEmpty());
                return false;
            }

            // Initialize Twilio
            log.info("Initializing Twilio with credentials...");
            Twilio.init(twilioAccountSid, twilioAuthToken);

            log.info("Creating message...");
            Message twilioMessage = Message.creator(
                    new PhoneNumber(phoneNumber), // To
                    new PhoneNumber(twilioPhoneNumber), // From
                    message // Body
            ).create();

            log.info(" Twilio SMS sent successfully! Message SID: {}", twilioMessage.getSid());
            log.info("Status: {}", twilioMessage.getStatus());
            log.info("=== End Twilio Debug ===");

            return true;
        } catch (com.twilio.exception.ApiException e) {
            log.error(" Twilio API Exception for phone {}: {}", phoneNumber, e.getMessage());

            // Handle specific Twilio errors
            if (e.getMessage().contains("unverified")) {
                log.error("🔍 SOLUTION: This is a Twilio trial account limitation.");
                log.error("🔍 To fix this:");
                log.error("🔍 1. Go to https://console.twilio.com/");
                log.error("🔍 2. Navigate to Phone Numbers > Manage > Verified Caller IDs");
                log.error("🔍 3. Add and verify the phone number: {}", phoneNumber);
                log.error("🔍 4. Or upgrade to a paid Twilio account");
            }

            return false;
        } catch (Exception e) {
            log.error(" Exception calling Twilio API for phone {}: {}", phoneNumber, e.getMessage(), e);
            return false;
        }
    }
}
