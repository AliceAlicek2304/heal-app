package com.healapp.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.concurrent.CompletableFuture;

@Slf4j
@Service
public class FirebaseSMSService {

    // Trong môi trường thực tế, bạn sẽ tích hợp với Firebase Cloud Messaging
    // hoặc các dịch vụ SMS khác như Twilio, AWS SNS, etc.
    
    @Async
    public CompletableFuture<Boolean> sendVerificationCodeAsync(String phoneNumber, String verificationCode) {
        try {
            // Mô phỏng gửi SMS
            log.info("Sending SMS to phone: {} with code: {}", phoneNumber, verificationCode);
            
            // TODO: Tích hợp với Firebase Cloud Messaging hoặc dịch vụ SMS thực tế
            // Ví dụ với Twilio:
            // twilioClient.messages.create(
            //     Message.creator(
            //         new PhoneNumber(phoneNumber),
            //         new PhoneNumber(twilioPhoneNumber),
            //         "Mã xác thực HealApp của bạn là: " + verificationCode + ". Mã có hiệu lực trong 10 phút."
            //     )
            // );
            
            // Mô phỏng delay gửi SMS
            Thread.sleep(1000);
            
            log.info("SMS sent successfully to: {}", phoneNumber);
            return CompletableFuture.completedFuture(true);
            
        } catch (Exception e) {
            log.error("Failed to send SMS to {}: {}", phoneNumber, e.getMessage(), e);
            return CompletableFuture.completedFuture(false);
        }
    }
    
    public boolean sendVerificationCode(String phoneNumber, String verificationCode) {
        try {
            // Phiên bản đồng bộ
            log.info("Sending SMS synchronously to phone: {} with code: {}", phoneNumber, verificationCode);
            
            // TODO: Tích hợp với dịch vụ SMS thực tế
            Thread.sleep(500); // Mô phỏng
            
            log.info("SMS sent successfully to: {}", phoneNumber);
            return true;
            
        } catch (Exception e) {
            log.error("Failed to send SMS to {}: {}", phoneNumber, e.getMessage(), e);
            return false;
        }
    }
}
