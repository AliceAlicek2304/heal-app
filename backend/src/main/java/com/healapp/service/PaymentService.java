package com.healapp.service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.healapp.dto.ApiResponse;
import com.healapp.dto.BankTransactionResponse;
import com.healapp.model.Payment;
import com.healapp.model.PaymentMethod;
import com.healapp.model.PaymentStatus;
import com.healapp.model.STITest;
import com.healapp.model.UserDtls;
import com.healapp.repository.PaymentRepository;

import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
@Transactional
public class PaymentService {

    @Autowired
    private UserService userService;

    @Autowired
    private PaymentRepository paymentRepository;

    @Autowired
    private StripeService stripeService;

    @Autowired
    private com.healapp.repository.UserRepository userRepository;
    @Autowired
    private com.healapp.repository.STIServiceRepository stiServiceRepository;

    @Autowired
    private com.healapp.repository.STITestRepository stiTestRepository;

    @Autowired
    private BankingService bankingService;

    public Payment createPayment(Long userId, String serviceType, Long serviceId,
            PaymentMethod paymentMethod, BigDecimal amount, String description) {

        Payment payment = Payment.builder()
                .userId(userId)
                .serviceType(serviceType)
                .serviceId(serviceId)
                .paymentMethod(paymentMethod)
                .paymentStatus(PaymentStatus.PENDING)
                .amount(amount)
                .currency("VND")
                .description(description)
                .build();

        // Set expiration for QR codes
        if (paymentMethod == PaymentMethod.QR_CODE) {
            payment.setExpiresAt(LocalDateTime.now().plusMinutes(30));
        }

        return paymentRepository.save(payment);
    }

    public ApiResponse<Payment> processCODPayment(Long userId, String serviceType, Long serviceId,
            BigDecimal amount, String description) {
        try {
            Payment payment = createPayment(userId, serviceType, serviceId, PaymentMethod.COD, amount, description);
            payment.setPaymentStatus(PaymentStatus.COMPLETED); // COD is considered "completed" when booked
            payment.setPaidAt(LocalDateTime.now());

            Payment savedPayment = paymentRepository.save(payment);
            log.info("COD payment created - Payment ID: {}", savedPayment.getPaymentId());

            return ApiResponse.success("COD payment processed successfully", savedPayment);

        } catch (Exception e) {
            log.error("Error processing COD payment: {}", e.getMessage(), e);
            return ApiResponse.error("Failed to process COD payment: " + e.getMessage());
        }
    }

    public ApiResponse<Payment> processStripePayment(Long userId, String serviceType, Long serviceId,
            BigDecimal amount, String description,
            String cardNumber, String expMonth, String expYear,
            String cvc, String cardHolderName) {
        try {
            // Create payment record
            Payment payment = createPayment(userId, serviceType, serviceId, PaymentMethod.VISA, amount, description);
            payment.setPaymentStatus(PaymentStatus.PROCESSING);
            Payment processingPayment = paymentRepository.save(payment);

            // Create temporary STITest object for Stripe processing
            STITest tempSTITest = createTempSTITestForPayment(processingPayment, serviceType, serviceId);

            // Process with Stripe
            ApiResponse<String> stripeResponse = stripeService.processPaymentForSTITest(
                    tempSTITest, cardNumber, expMonth, expYear, cvc, cardHolderName);

            if (stripeResponse.isSuccess()) {
                // Payment successful
                processingPayment.setPaymentStatus(PaymentStatus.COMPLETED);
                processingPayment.setStripePaymentIntentId(stripeResponse.getData());
                processingPayment.setTransactionId(stripeResponse.getData());
                processingPayment.setPaidAt(LocalDateTime.now());

                Payment completedPayment = paymentRepository.save(processingPayment);
                log.info("Stripe payment completed - Payment ID: {}, Stripe ID: {}",
                        completedPayment.getPaymentId(), stripeResponse.getData());

                return ApiResponse.success("Payment processed successfully", completedPayment);

            } else {
                // Payment failed
                processingPayment.setPaymentStatus(PaymentStatus.FAILED);
                processingPayment.setNotes("Stripe error: " + stripeResponse.getMessage());
                paymentRepository.save(processingPayment);

                log.warn("Stripe payment failed - Payment ID: {}, Error: {}",
                        processingPayment.getPaymentId(), stripeResponse.getMessage());

                return ApiResponse.error("Payment failed: " + stripeResponse.getMessage());
            }

        } catch (Exception e) {
            log.error("Error processing Stripe payment: {}", e.getMessage(), e);
            return ApiResponse.error("Failed to process payment: " + e.getMessage());
        }
    }

    private STITest createTempSTITestForPayment(Payment payment, String serviceType, Long serviceId) {
        // Get user info from repositories
        Optional<UserDtls> userOpt = userRepository.findById(payment.getUserId());
        if (userOpt.isEmpty()) {
            throw new RuntimeException("User not found for payment");
        }

        if ("STI".equals(serviceType)) {
            // For STI payments, serviceId is actually the testId of existing STITest
            Optional<STITest> existingTestOpt = stiTestRepository.findById(serviceId);
            if (existingTestOpt.isEmpty()) {
                throw new RuntimeException("STI Test not found for payment - Test ID: " + serviceId);
            }

            STITest existingTest = existingTestOpt.get();

            // Create temporary STITest object with existing test data
            STITest tempTest = STITest.builder()
                    .testId(existingTest.getTestId())
                    .customer(userOpt.get())
                    .stiService(existingTest.getStiService()) // Get service from existing test
                    .totalPrice(payment.getAmount())
                    .build();

            return tempTest;
        }

        throw new RuntimeException("Unsupported service type for Stripe payment: " + serviceType);
    }

    public ApiResponse<Payment> generateQRPayment(Long userId, String serviceType, Long serviceId,
            BigDecimal amount, String description) {
        try {
            // Create payment record với QR reference
            Payment payment = createPayment(userId, serviceType, serviceId, PaymentMethod.QR_CODE, amount, description);

            // Generate unique QR reference with timestamp
            String qrReference = generateQRReference(serviceType, serviceId, userId);
            payment.setQrPaymentReference(qrReference);
            payment.setExpiresAt(LocalDateTime.now().plusHours(24)); // QR có hiệu lực 24h
            payment.setPaymentStatus(PaymentStatus.PENDING);

            // Generate MB Bank QR URL
            String qrCodeUrl = bankingService.generateMBBankQRUrl(qrReference, amount);
            payment.setQrCodeUrl(qrCodeUrl);

            Payment savedPayment = paymentRepository.save(payment);
            log.info(" QR payment generated - Payment ID: {}, QR Reference: {}, Test ID: {}, QR URL: {}",
                    savedPayment.getPaymentId(), qrReference, serviceId, qrCodeUrl);

            return ApiResponse.success("QR payment generated successfully", savedPayment);

        } catch (Exception e) {
            log.error("Error generating QR payment: {}", e.getMessage(), e);
            return ApiResponse.error("Failed to generate QR payment: " + e.getMessage());
        }
    }

    public ApiResponse<Payment> regenerateQRCode(Long paymentId) {
        try {
            Optional<Payment> paymentOpt = paymentRepository.findById(paymentId);
            if (paymentOpt.isEmpty()) {
                return ApiResponse.error("Không tìm thấy thông tin thanh toán");
            }
            Payment payment = paymentOpt.get();

            // Kiểm tra trạng thái payment - CHO PHÉP EXPIRED để có thể regenerate
            if (payment.getPaymentStatus() == PaymentStatus.COMPLETED ||
                    payment.getPaymentStatus() == PaymentStatus.FAILED ||
                    payment.getPaymentStatus() == PaymentStatus.REFUNDED) {
                return ApiResponse.error("Không thể tạo lại QR cho thanh toán đã hoàn thành");
            }

            // Kiểm tra phương thức thanh toán
            if (payment.getPaymentMethod() != PaymentMethod.QR_CODE) {
                return ApiResponse.error("Chỉ có thể tạo lại QR cho phương thức thanh toán QR Code");
            }

            // Kiểm tra trạng thái STI Test nếu là STI payment
            if ("STI_TEST".equals(payment.getServiceType()) && payment.getServiceId() != null) {
                Optional<com.healapp.model.STITest> stiTestOpt = stiTestRepository.findById(payment.getServiceId());
                if (stiTestOpt.isPresent()) {
                    com.healapp.model.STITest stiTest = stiTestOpt.get();

                    // Không cho phép tạo lại QR nếu test đã bị huỷ hoặc hoàn thành
                    if (stiTest.getStatus() == com.healapp.model.TestStatus.CANCELED) {
                        return ApiResponse.error("Không thể tạo lại QR cho xét nghiệm đã bị hủy");
                    }

                    if (stiTest.getStatus() == com.healapp.model.TestStatus.COMPLETED) {
                        return ApiResponse.error("Không thể tạo lại QR cho xét nghiệm đã hoàn thành");
                    }
                }
            } // Generate new QR reference với timestamp mới
            String newQrReference = generateQRReference(
                    payment.getServiceType(),
                    payment.getServiceId(),
                    payment.getUserId());

            // Update payment với QR mới và reset status về PENDING
            payment.setQrPaymentReference(newQrReference);
            payment.setExpiresAt(LocalDateTime.now().plusHours(24)); // Extend thêm 24h
            payment.setUpdatedAt(LocalDateTime.now());

            // IMPORTANT: Reset payment status về PENDING khi tạo lại QR
            payment.setPaymentStatus(PaymentStatus.PENDING);

            // Generate new QR URL
            String newQrCodeUrl = bankingService.generateMBBankQRUrl(newQrReference, payment.getAmount());
            payment.setQrCodeUrl(newQrCodeUrl);

            Payment savedPayment = paymentRepository.save(payment);

            log.info("QR Code regenerated for payment ID: {}, new reference: {}",
                    paymentId, newQrReference);

            // FIX: Đúng thứ tự parameters (message, data)
            return ApiResponse.success("Đã tạo lại mã QR thành công", savedPayment);

        } catch (Exception e) {
            log.error("Error regenerating QR code for payment {}: {}", paymentId, e.getMessage());
            return ApiResponse.error("Có lỗi xảy ra khi tạo lại mã QR: " + e.getMessage());
        }
    }

    public boolean isQRCodeExpired(Payment payment) {
        if (payment.getExpiresAt() == null) {
            return false;
        }
        return LocalDateTime.now().isAfter(payment.getExpiresAt());
    }

    public ApiResponse<Payment> autoCheckQRPayment(String qrReference) {
        try {
            Optional<Payment> paymentOpt = paymentRepository.findByQrPaymentReference(qrReference);

            if (paymentOpt.isEmpty()) {
                return ApiResponse.error("QR payment not found");
            }

            Payment payment = paymentOpt.get();

            // Only check PENDING payments
            if (payment.getPaymentStatus() != PaymentStatus.PENDING) {
                return ApiResponse.success("Payment already processed", payment);
            }

            // Check if expired
            if (payment.isExpired()) {
                payment.setPaymentStatus(PaymentStatus.EXPIRED);
                paymentRepository.save(payment);
                return ApiResponse.error("QR payment has expired");
            }

            // Call MB Bank API to check transaction
            ApiResponse<BankTransactionResponse> bankResult = bankingService.checkTransaction(
                    qrReference, payment.getAmount());

            if (bankResult.isSuccess()) {
                BankTransactionResponse transaction = bankResult.getData();

                // Validate transaction details
                if (transaction.amountMatches(payment.getAmount()) &&
                        transaction.referenceMatches(qrReference)) {

                    // Mark payment as completed
                    payment.setPaymentStatus(PaymentStatus.COMPLETED);
                    payment.setPaidAt(LocalDateTime.now());
                    payment.setTransactionId(transaction.getTransactionId());
                    payment.setNotes((payment.getNotes() != null ? payment.getNotes() + "; " : "") +
                            "Auto-confirmed via MB Bank API - TX: " + transaction.getTransactionId() +
                            " - Time: " + transaction.getTransactionDate());

                    Payment confirmedPayment = paymentRepository.save(payment);

                    log.info(" QR payment auto-confirmed - Payment ID: {}, MB Bank TX: {}, Amount: {}",
                            confirmedPayment.getPaymentId(), transaction.getTransactionId(), transaction.getAmount());

                    return ApiResponse.success("Payment confirmed automatically", confirmedPayment);
                } else {
                    log.warn(" Transaction found but details don't match - QR: {}, Expected: {}, Found: {}",
                            qrReference, payment.getAmount(), transaction.getAmount());
                    return ApiResponse.error("Transaction details don't match");
                }
            } else {
                log.debug(" Transaction not yet found for QR reference: {}", qrReference);
                return ApiResponse.error("Payment not yet received");
            }

        } catch (Exception e) {
            log.error("Error auto-checking QR payment: {}", e.getMessage(), e);
            return ApiResponse.error("Failed to check payment status: " + e.getMessage());
        }
    }

    @Scheduled(fixedRate = 120000) // Every 2 minutes
    public void autoCheckPendingQRPayments() {
        try {
            // Get all PENDING QR payments that are not expired
            List<Payment> pendingQRPayments = paymentRepository
                    .findByPaymentMethodAndPaymentStatusAndExpiresAtAfter(
                            PaymentMethod.QR_CODE, PaymentStatus.PENDING, LocalDateTime.now());

            log.debug("🔄 Checking {} pending QR payments via MB Bank API", pendingQRPayments.size());

            int confirmedCount = 0;
            for (Payment payment : pendingQRPayments) {
                try {
                    ApiResponse<Payment> result = autoCheckQRPayment(payment.getQrPaymentReference());
                    if (result.isSuccess() && result.getData().getPaymentStatus() == PaymentStatus.COMPLETED) {
                        confirmedCount++;
                        log.info(" Payment auto-confirmed for user {} - Amount: {}",
                                payment.getUserId(), payment.getAmount());
                    }
                } catch (Exception e) {
                    log.error("Error checking individual payment {}: {}", payment.getPaymentId(), e.getMessage());
                }
            }

            if (confirmedCount > 0) {
                log.info("🎉 Auto-confirmed {} QR payments via MB Bank", confirmedCount);
            }

        } catch (Exception e) {
            log.error("Error in scheduled QR payment check: {}", e.getMessage(), e);
        }
    }

    public ApiResponse<Payment> manualConfirmQRPayment(String qrReference, String transactionId, String notes) {
        try {
            Optional<Payment> paymentOpt = paymentRepository.findByQrPaymentReference(qrReference);

            if (paymentOpt.isEmpty()) {
                return ApiResponse.error("QR payment not found");
            }

            Payment payment = paymentOpt.get();

            if (payment.getPaymentStatus() == PaymentStatus.COMPLETED) {
                return ApiResponse.success("Payment already confirmed", payment);
            }

            if (payment.isExpired()) {
                return ApiResponse.error("QR payment has expired");
            }

            // Manual confirmation
            payment.setPaymentStatus(PaymentStatus.COMPLETED);
            payment.setPaidAt(LocalDateTime.now());
            payment.setTransactionId(transactionId);
            payment.setNotes((payment.getNotes() != null ? payment.getNotes() + "; " : "") +
                    "Manual confirmation - TX: " + transactionId + " - Notes: " + notes);

            Payment confirmedPayment = paymentRepository.save(payment);

            log.info(" QR payment manually confirmed - Payment ID: {}, TX: {}",
                    confirmedPayment.getPaymentId(), transactionId);

            return ApiResponse.success("Payment manually confirmed", confirmedPayment);

        } catch (Exception e) {
            log.error("Error manually confirming QR payment: {}", e.getMessage(), e);
            return ApiResponse.error("Failed to confirm payment: " + e.getMessage());
        }
    }

    public ApiResponse<Payment> processRefund(Long paymentId, String reason) {
        try {
            Optional<Payment> paymentOpt = paymentRepository.findById(paymentId);

            if (paymentOpt.isEmpty()) {
                return ApiResponse.error("Payment not found");
            }

            Payment payment = paymentOpt.get();

            if (!payment.canBeRefunded()) {
                return ApiResponse.error("Payment cannot be refunded");
            }

            // Process refund based on payment method
            switch (payment.getPaymentMethod()) {
                case VISA:
                    return processStripeRefund(payment, reason);
                case QR_CODE:
                    return processQRRefund(payment, reason);
                case COD:
                    return ApiResponse.error("COD payments cannot be refunded automatically");
                default:
                    return ApiResponse.error("Unsupported payment method for refund");
            }

        } catch (Exception e) {
            log.error("Error processing refund: {}", e.getMessage(), e);
            return ApiResponse.error("Failed to process refund: " + e.getMessage());
        }
    }

    private ApiResponse<Payment> processStripeRefund(Payment payment, String reason) {
        try {
            ApiResponse<String> refundResponse = stripeService.processRefund(payment.getStripePaymentIntentId());

            if (refundResponse.isSuccess()) {
                payment.setPaymentStatus(PaymentStatus.REFUNDED);
                payment.setRefundId(refundResponse.getData());
                payment.setRefundAmount(payment.getAmount());
                payment.setRefundedAt(LocalDateTime.now());
                payment.setNotes((payment.getNotes() != null ? payment.getNotes() + "; " : "") +
                        "Refund reason: " + reason);

                Payment refundedPayment = paymentRepository.save(payment);
                log.info("Stripe refund processed - Payment ID: {}, Refund ID: {}",
                        payment.getPaymentId(), refundResponse.getData());

                return ApiResponse.success("Refund processed successfully", refundedPayment);
            } else {
                return ApiResponse.error("Refund failed: " + refundResponse.getMessage());
            }

        } catch (Exception e) {
            log.error("Error processing Stripe refund: {}", e.getMessage(), e);
            return ApiResponse.error("Failed to process Stripe refund: " + e.getMessage());
        }
    }

    private ApiResponse<Payment> processQRRefund(Payment payment, String reason) {
        try {
            // QR Code refund logic - Mark for manual processing
            payment.setPaymentStatus(PaymentStatus.REFUNDED);
            payment.setRefundAmount(payment.getAmount());
            payment.setRefundedAt(LocalDateTime.now());

            // Enhanced notes with QR details
            String refundNotes = String.format(
                    "QR Code Refund - Reason: %s | Original QR: %s | Amount: %s VND | Bank TX: %s | Refund requires manual bank transfer",
                    reason,
                    payment.getQrPaymentReference() != null ? payment.getQrPaymentReference() : "N/A",
                    payment.getAmount(),
                    payment.getTransactionId() != null ? payment.getTransactionId() : "N/A");

            payment.setNotes((payment.getNotes() != null ? payment.getNotes() + "; " : "") + refundNotes);

            Payment refundedPayment = paymentRepository.save(payment);

            log.info("📱 QR Code refund marked - Payment ID: {}, QR Ref: {}, Amount: {}, Bank TX: {}",
                    payment.getPaymentId(),
                    payment.getQrPaymentReference(),
                    payment.getAmount(),
                    payment.getTransactionId());

            return ApiResponse.success("QR Code refund marked - Manual bank transfer required", refundedPayment);

        } catch (Exception e) {
            log.error(" Error processing QR refund for Payment ID {}: {}", payment.getPaymentId(), e.getMessage());
            return ApiResponse.error("Failed to process QR refund: " + e.getMessage());
        }
    }

    public Optional<Payment> getPaymentByService(String serviceType, Long serviceId) {
        return paymentRepository.findByServiceTypeAndServiceId(serviceType, serviceId);
    }

    public Optional<Payment> getCompletedPaymentByService(String serviceType, Long serviceId) {
        List<Payment> payments = paymentRepository.findByServiceTypeAndServiceIdOrderByCreatedAtDesc(serviceType,
                serviceId);
        return payments.stream()
                .filter(p -> p.getPaymentStatus() == PaymentStatus.COMPLETED)
                .findFirst();
    }

    private String generateQRReference(String serviceType, Long serviceId, Long userId) {
        String timestamp = String.valueOf(System.currentTimeMillis()).substring(8);
        String randomSuffix = String.valueOf((int) (Math.random() * 1000));

        return String.format("HEAL%s%d%d%s%s",
                serviceType.substring(0, Math.min(3, serviceType.length())),
                serviceId, userId, timestamp, randomSuffix);
    }

    @Scheduled(fixedRate = 300000) // Every 5 minutes
    public void cleanupExpiredPayments() {
        try {
            LocalDateTime now = LocalDateTime.now();
            List<Payment> expiredPayments = paymentRepository
                    .findByPaymentStatusAndExpiresAtBefore(PaymentStatus.PENDING, now);

            for (Payment payment : expiredPayments) {
                if (payment.getPaymentMethod() == PaymentMethod.QR_CODE) {
                    payment.setPaymentStatus(PaymentStatus.EXPIRED);
                    paymentRepository.save(payment);
                }
            }

            if (!expiredPayments.isEmpty()) {
                log.info("Marked {} QR payments as expired", expiredPayments.size());
            }

        } catch (Exception e) {
            log.error("Error cleaning up expired payments: {}", e.getMessage(), e);
        }
    }

    public ApiResponse<List<Payment>> getPaymentsByUser(String username) {
        try {
            Long userId = userService.getUserIdFromUsername(username);
            List<Payment> payments = paymentRepository.findByUserIdOrderByCreatedAtDesc(userId);

            log.info("Retrieved {} payments for user: {}", payments.size(), username);
            return ApiResponse.success("User payments retrieved", payments);

        } catch (Exception e) {
            log.error("Error getting payments for user {}: {}", username, e.getMessage());
            return ApiResponse.error("Failed to get payments: " + e.getMessage());
        }
    }

    public ApiResponse<Payment> getPaymentByIdForUser(Long paymentId, String username) {
        try {
            Long userId = userService.getUserIdFromUsername(username);

            Optional<Payment> paymentOpt = paymentRepository.findById(paymentId);

            if (paymentOpt.isEmpty()) {
                return ApiResponse.error("Payment not found");
            }

            Payment payment = paymentOpt.get();

            // Check ownership
            if (!payment.getUserId().equals(userId)) {
                return ApiResponse.error("Unauthorized to view this payment");
            }

            // Auto-check QR payment nếu cần
            if (payment.getPaymentMethod() == PaymentMethod.QR_CODE &&
                    payment.getPaymentStatus() == PaymentStatus.PENDING) {
                autoCheckQRPayment(payment.getQrPaymentReference());
                // Refresh data
                payment = paymentRepository.findById(paymentId).orElse(payment);
            }

            return ApiResponse.success("Payment details retrieved", payment);

        } catch (Exception e) {
            log.error("Error getting payment by ID: {}", e.getMessage());
            return ApiResponse.error("Failed to get payment: " + e.getMessage());
        }
    }

    public ApiResponse<Payment> getQRPaymentByReference(String qrReference) {
        try {
            Optional<Payment> paymentOpt = paymentRepository.findByQrPaymentReference(qrReference);

            if (paymentOpt.isEmpty()) {
                return ApiResponse.error("QR payment not found");
            }

            Payment payment = paymentOpt.get();

            // Check nếu expired
            if (payment.isExpired()) {
                payment.setPaymentStatus(PaymentStatus.EXPIRED);
                paymentRepository.save(payment);
            }

            return ApiResponse.success("QR payment details retrieved", payment);

        } catch (Exception e) {
            log.error("Error getting QR payment by reference: {}", e.getMessage());
            return ApiResponse.error("Failed to get QR payment: " + e.getMessage());
        }
    }

    public ApiResponse<List<Payment>> getAllPayments(int page, int size) {
        try {
            Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
            Page<Payment> paymentPage = paymentRepository.findAll(pageable);

            log.info("Admin retrieved {} payments (page {}/{})",
                    paymentPage.getContent().size(), page + 1, paymentPage.getTotalPages());

            return ApiResponse.success("All payments retrieved", paymentPage.getContent());

        } catch (Exception e) {
            log.error("Error getting all payments: {}", e.getMessage());
            return ApiResponse.error("Failed to get payments: " + e.getMessage());
        }
    }

    public ApiResponse<Payment> getPaymentByIdAdmin(Long paymentId) {
        try {
            Optional<Payment> paymentOpt = paymentRepository.findById(paymentId);

            if (paymentOpt.isEmpty()) {
                return ApiResponse.error("Payment not found");
            }

            Payment payment = paymentOpt.get();

            // Auto-check QR payment nếu cần
            if (payment.getPaymentMethod() == PaymentMethod.QR_CODE &&
                    payment.getPaymentStatus() == PaymentStatus.PENDING) {
                autoCheckQRPayment(payment.getQrPaymentReference());
                // Refresh data
                payment = paymentRepository.findById(paymentId).orElse(payment);
            }

            return ApiResponse.success("Payment details retrieved", payment);

        } catch (Exception e) {
            log.error("Error getting payment by ID (admin): {}", e.getMessage());
            return ApiResponse.error("Failed to get payment: " + e.getMessage());
        }
    }

    // Simulation for testing
    @Transactional
    public ApiResponse<String> simulateQRPaymentSuccess(String qrReference, String transactionId, String notes) {
        try {
            log.info(" Simulating QR payment success for reference: {}", qrReference);

            Optional<Payment> paymentOpt = paymentRepository.findByQrPaymentReference(qrReference);
            if (paymentOpt.isEmpty()) {
                return ApiResponse.error("QR payment not found: " + qrReference);
            }

            Payment payment = paymentOpt.get();

            if (payment.getPaymentStatus() != PaymentStatus.PENDING) {
                return ApiResponse.error("Payment is not pending. Current status: " + payment.getPaymentStatus());
            }

            if (payment.isExpired()) {
                return ApiResponse.error("QR payment has expired");
            }

            // Update payment status
            payment.setPaymentStatus(PaymentStatus.COMPLETED);
            payment.setTransactionId(transactionId);
            payment.setPaidAt(LocalDateTime.now());
            payment.setUpdatedAt(LocalDateTime.now());

            if (notes != null && !notes.trim().isEmpty()) {
                String currentNotes = payment.getNotes() != null ? payment.getNotes() : "";
                payment.setNotes(currentNotes + " | " + notes);
            }

            paymentRepository.save(payment);

            log.info(" QR payment simulation successful - Payment ID: {}, Transaction ID: {}",
                    payment.getPaymentId(), transactionId);

            return ApiResponse.success("QR payment simulation successful",
                    "Payment ID: " + payment.getPaymentId() + ", Transaction: " + transactionId);

        } catch (Exception e) {
            log.error(" Failed to simulate QR payment: {}", e.getMessage(), e);
            return ApiResponse.error("Failed to simulate payment: " + e.getMessage());
        }
    }

    public ApiResponse<String> getQRPaymentStatus(String qrReference) {
        try {
            Optional<Payment> paymentOpt = paymentRepository.findByQrPaymentReference(qrReference);
            if (paymentOpt.isEmpty()) {
                return ApiResponse.error("QR payment not found: " + qrReference);
            }

            Payment payment = paymentOpt.get();

            // Auto-check trước khi return status
            if (payment.getPaymentStatus() == PaymentStatus.PENDING && !payment.isExpired()) {
                autoCheckQRPayment(qrReference);
                // Refresh payment data
                payment = paymentRepository.findByQrPaymentReference(qrReference).orElse(payment);
            }

            String statusInfo = String.format(
                    "Payment ID: %d, Status: %s, Amount: %.0f VND, Created: %s",
                    payment.getPaymentId(),
                    payment.getPaymentStatus(),
                    payment.getAmount(),
                    payment.getCreatedAt());

            if (payment.getPaymentStatus() == PaymentStatus.COMPLETED) {
                statusInfo += String.format(", Paid At: %s, Transaction: %s",
                        payment.getPaidAt(), payment.getTransactionId());
            }

            if (payment.isExpired()) {
                statusInfo += ", Status: EXPIRED";
            }

            return ApiResponse.success("Payment status retrieved", statusInfo);

        } catch (Exception e) {
            log.error(" Failed to get QR payment status: {}", e.getMessage(), e);
            return ApiResponse.error("Failed to get payment status: " + e.getMessage());
        }
    }

    // Get payments by service - for admin use
    public ApiResponse<List<Payment>> getPaymentsByService(String serviceType, Long serviceId) {
        try {
            List<Payment> payments = paymentRepository.findByServiceTypeAndServiceIdOrderByCreatedAtDesc(serviceType,
                    serviceId);
            return ApiResponse.success("Payments retrieved successfully", payments);
        } catch (Exception e) {
            log.error("Error getting payments by service: {}", e.getMessage(), e);
            return ApiResponse.error("Failed to get payments: " + e.getMessage());
        }
    }

    public ApiResponse<Payment> retryStripePayment(Long testId, String cardNumber, String expMonth, String expYear, String cvc, String cardHolderName) {
        try {
            // Kiểm tra hợp lệ các trường thông tin thẻ
            if (cardNumber == null || cardNumber.trim().isEmpty() ||
                expMonth == null || expMonth.trim().isEmpty() ||
                expYear == null || expYear.trim().isEmpty() ||
                cvc == null || cvc.trim().isEmpty() ||
                cardHolderName == null || cardHolderName.trim().isEmpty()) {
                return ApiResponse.error("Thiếu thông tin thẻ thanh toán. Vui lòng nhập đầy đủ số thẻ, tháng/năm hết hạn, CVC và tên chủ thẻ.");
            }

            // Tìm payment PENDING/FAILED gần nhất cho booking này
            List<Payment> payments = paymentRepository.findByServiceTypeAndServiceIdOrderByCreatedAtDesc("STI", testId);
            Optional<Payment> paymentOpt = payments.stream()
                .filter(p -> p.getPaymentMethod() == PaymentMethod.VISA &&
                             (p.getPaymentStatus() == PaymentStatus.PENDING || p.getPaymentStatus() == PaymentStatus.FAILED))
                .findFirst();
            if (paymentOpt.isEmpty()) {
                return ApiResponse.error("Không tìm thấy payment VISA nào ở trạng thái PENDING/FAILED cho booking này");
            }
            Payment payment = paymentOpt.get();
            // Reset trạng thái
            payment.setPaymentStatus(PaymentStatus.PROCESSING);
            payment.setNotes(null);
            payment.setStripePaymentIntentId(null);
            payment.setTransactionId(null);
            payment.setPaidAt(null);
            paymentRepository.save(payment);
            // Tạo lại PaymentIntent mới
            STITest tempSTITest = createTempSTITestForPayment(payment, "STI", testId);
            ApiResponse<String> stripeResponse = stripeService.processPaymentForSTITest(
                tempSTITest, cardNumber, expMonth, expYear, cvc, cardHolderName);
            if (stripeResponse.isSuccess()) {
                payment.setPaymentStatus(PaymentStatus.COMPLETED);
                payment.setStripePaymentIntentId(stripeResponse.getData());
                payment.setTransactionId(stripeResponse.getData());
                payment.setPaidAt(LocalDateTime.now());
                paymentRepository.save(payment);
                return ApiResponse.success("Thanh toán lại thành công", payment);
            } else {
                payment.setPaymentStatus(PaymentStatus.FAILED);
                payment.setNotes("Stripe error: " + stripeResponse.getMessage());
                paymentRepository.save(payment);
                return ApiResponse.error("Thanh toán lại thất bại: " + stripeResponse.getMessage());
            }
        } catch (Exception e) {
            log.error("Error retrying Stripe payment: {}", e.getMessage(), e);
            return ApiResponse.error("Lỗi khi thanh toán lại: " + e.getMessage());
        }
    }

    /**
     * Tạo bản ghi payment FAILED khi thanh toán thất bại (Stripe, QR, ...)
     */
    public ApiResponse<Payment> createFailedPayment(Long userId, String serviceType, Long serviceId, BigDecimal amount, PaymentMethod paymentMethod, String errorMessage) {
        try {
            Payment payment = Payment.builder()
                    .userId(userId)
                    .serviceType(serviceType)
                    .serviceId(serviceId)
                    .paymentMethod(paymentMethod)
                    .paymentStatus(PaymentStatus.FAILED)
                    .amount(amount)
                    .currency("VND")
                    .description("Thanh toán thất bại: " + (errorMessage != null ? errorMessage : "Unknown error"))
                    .notes(errorMessage)
                    .build();
            Payment saved = paymentRepository.save(payment);
            log.warn("Created FAILED payment record for user {} - service {} - id {}: {}", userId, serviceType, serviceId, errorMessage);
            return ApiResponse.error("Payment failed: " + (errorMessage != null ? errorMessage : "Unknown error"), saved);
        } catch (Exception e) {
            log.error("Error creating FAILED payment record: {}", e.getMessage(), e);
            return ApiResponse.error("Failed to create FAILED payment record: " + e.getMessage());
        }
    }
}