package com.healapp.service;

import java.util.HashMap;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.healapp.dto.ApiResponse;
import com.healapp.model.STITest;
import com.stripe.Stripe;
import com.stripe.exception.StripeException;
import com.stripe.model.Charge;
import com.stripe.model.PaymentIntent;
import com.stripe.model.Refund;
import com.stripe.param.PaymentIntentCreateParams;
import com.stripe.param.RefundCreateParams;

import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
public class StripeService {

    @Value("${stripe.api.key}")
    private String stripeApiKey;

    @PostConstruct
    public void init() {
        Stripe.apiKey = stripeApiKey;
        log.info("Stripe initialized with API key");
    }


    // HYBRID - Xử lý thanh toán STI Test (Test cards + Real cards)
    public ApiResponse<Map<String, String>> processPaymentForSTITest(STITest stiTest, String cardNumber,
            String expMonth, String expYear, String cvc, String cardholderName) {

        // Kiểm tra xem có phải test card không
        String testPaymentMethodId = getTestPaymentMethodId(cardNumber);

        if (testPaymentMethodId != null) {
            // Sử dụng test payment method
            return processPaymentWithTestCard(stiTest, testPaymentMethodId);
        } else {
            // Sử dụng real card data
            return processPaymentWithRealCard(stiTest, cardNumber, expMonth, expYear, cvc, cardholderName);
        }
    }

    // Xử lý thanh toán với Test Cards (sử dụng predefined payment methods)
    private ApiResponse<Map<String, String>> processPaymentWithTestCard(STITest stiTest, String paymentMethodId) {
        try {
            PaymentIntentCreateParams params = PaymentIntentCreateParams.builder()
                    .setCurrency("vnd")
                    .setAmount(stiTest.getTotalPrice().longValue())
                    .setDescription("TEST - STI Test #" + stiTest.getTestId())
                    .setReceiptEmail(stiTest.getCustomer().getEmail())
                    .setPaymentMethod(paymentMethodId)
                    .setConfirm(true)
                    .setReturnUrl("https://healapp.com/payment/return")
                    .putMetadata("testId", stiTest.getTestId().toString())
                    .putMetadata("customerId", stiTest.getCustomer().getId().toString())
                    .putMetadata("type", "test_sti")
                    .build();

            PaymentIntent paymentIntent = PaymentIntent.create(params);

            if ("succeeded".equals(paymentIntent.getStatus())) {
                log.info("Test payment successful - PaymentIntent: {}", paymentIntent.getId());
                String receiptUrl = null;
                if (paymentIntent.getLatestCharge() != null) {
                    Charge charge = Charge.retrieve(paymentIntent.getLatestCharge());
                    receiptUrl = charge.getReceiptUrl();
                }
                Map<String, String> data = new HashMap<>();
                data.put("paymentIntentId", paymentIntent.getId());
                data.put("receiptUrl", receiptUrl);
                return ApiResponse.success("Test payment processed successfully", data);
            } else if ("requires_action".equals(paymentIntent.getStatus())) {
                return ApiResponse.error("Payment requires additional authentication");
            } else {
                return ApiResponse.error("Payment failed with status: " + paymentIntent.getStatus());
            }

        } catch (StripeException e) {
            log.error("Test payment error: {}", e.getMessage(), e);
            return ApiResponse.error("Test payment processing error: " + e.getUserMessage());
        } catch (Exception e) {
            log.error("Unexpected test payment error: {}", e.getMessage(), e);
            return ApiResponse.error("Test payment processing failed: " + e.getMessage());
        }
    }

    // Xử lý thanh toán với Real Cards (tạo payment method từ card data)
    private ApiResponse<Map<String, String>> processPaymentWithRealCard(STITest stiTest, String cardNumber,
            String expMonth, String expYear, String cvc, String cardholderName) {
        try {
            // Chỉ hoạt động khi Stripe account được enable raw card data
            String paymentMethodId = createPaymentMethod(cardNumber, expMonth, expYear, cvc, cardholderName);

            PaymentIntentCreateParams params = PaymentIntentCreateParams.builder()
                    .setCurrency("vnd")
                    .setAmount(stiTest.getTotalPrice().longValue())
                    .setDescription("💳 REAL - STI Test #" + stiTest.getTestId())
                    .setReceiptEmail(stiTest.getCustomer().getEmail())
                    .setPaymentMethod(paymentMethodId)
                    .setConfirm(true)
                    .setReturnUrl("https://healapp.com/payment/return")
                    .putMetadata("testId", stiTest.getTestId().toString())
                    .putMetadata("customerId", stiTest.getCustomer().getId().toString())
                    .putMetadata("type", "real_sti")
                    .build();

            PaymentIntent paymentIntent = PaymentIntent.create(params);

            if ("succeeded".equals(paymentIntent.getStatus())) {
                log.info("💳 Real payment successful - PaymentIntent: {}", paymentIntent.getId());
                String receiptUrl = null;
                if (paymentIntent.getLatestCharge() != null) {
                    Charge charge = Charge.retrieve(paymentIntent.getLatestCharge());
                    receiptUrl = charge.getReceiptUrl();
                }
                Map<String, String> data = new HashMap<>();
                data.put("paymentIntentId", paymentIntent.getId());
                data.put("receiptUrl", receiptUrl);
                return ApiResponse.success("Real payment processed successfully", data);
            } else if ("requires_action".equals(paymentIntent.getStatus())) {
                return ApiResponse.error("Payment requires additional authentication");
            } else {
                return ApiResponse.error("Payment failed with status: " + paymentIntent.getStatus());
            }

        } catch (StripeException e) {
            log.error("💳 Real payment error: {}", e.getMessage(), e);
            return ApiResponse.error("Real payment processing error: " + e.getUserMessage());
        } catch (Exception e) {
            log.error("💳 Unexpected real payment error: {}", e.getMessage(), e);
            return ApiResponse.error("Real payment processing failed: " + e.getMessage());
        }
    }

    // Map test card numbers thành Stripe test payment method IDs
    private String getTestPaymentMethodId(String cardNumber) {
        switch (cardNumber) {
            // Success Test Cards
            case "4242424242424242":
                return "pm_card_visa"; // Visa success
            case "4000056655665556":
                return "pm_card_visa_debit"; // Visa debit success
            case "5555555555554444":
                return "pm_card_mastercard"; // Mastercard success
            case "3782822463100055":
                return "pm_card_amex"; // Amex success

            // Decline Test Cards
            case "4000000000000002":
                return "pm_card_visa_chargeDeclined"; // Generic decline
            case "4000000000009995":
                return "pm_card_visa_chargeDeclinedInsufficientFunds"; // Insufficient funds
            case "4000000000009987":
                return "pm_card_visa_chargeDeclinedLostCard"; // Lost card
            case "4000000000000069":
                return "pm_card_visa_chargeDeclinedExpiredCard"; // Expired card
            case "4000000000000127":
                return "pm_card_visa_chargeDeclinedIncorrectCvc"; // Incorrect CVC
            case "4000000000000119":
                return "pm_card_visa_chargeDeclinedProcessingError"; // Processing error

            // Special Test Cases
            case "4000000000000341":
                return "pm_card_visa_chargeDeclinedPickupCard"; // Pickup card
            case "4000000000000259":
                return "pm_card_visa_chargeDeclinedRestricted"; // Restricted card
            case "4000000000009979":
                return "pm_card_visa_chargeDeclinedStolenCard"; // Stolen card

            default:
                // Không phải test card - return null để sử dụng real card flow
                return null;
        }
    }

    // Tạo payment method từ real card data
    private String createPaymentMethod(String cardNumber, String expMonth,
            String expYear, String cvc, String cardholderName) throws StripeException {

        Map<String, Object> card = new HashMap<>();
        card.put("number", cardNumber);
        card.put("exp_month", Integer.parseInt(expMonth));
        card.put("exp_year", Integer.parseInt(expYear));
        card.put("cvc", cvc);

        Map<String, Object> billingDetails = new HashMap<>();
        billingDetails.put("name", cardholderName);

        Map<String, Object> params = new HashMap<>();
        params.put("type", "card");
        params.put("card", card);
        params.put("billing_details", billingDetails);

        com.stripe.model.PaymentMethod paymentMethod = com.stripe.model.PaymentMethod.create(params);
        return paymentMethod.getId();
    }

    // Hoàn tiền cho cả test và real payments
    public ApiResponse<String> processRefund(String paymentIntentId) {
        try {
            RefundCreateParams params = RefundCreateParams.builder()
                    .setPaymentIntent(paymentIntentId)
                    .build();

            Refund refund = Refund.create(params);

            if ("succeeded".equals(refund.getStatus())) {
                log.info("Refund successful - Refund ID: {}", refund.getId());
                return ApiResponse.success("Refund processed successfully", refund.getId());
            } else {
                log.warn("Refund failed - Status: {}", refund.getStatus());
                return ApiResponse.error("Refund failed: " + refund.getStatus());
            }
        } catch (StripeException e) {
            log.error("Stripe refund error: {}", e.getMessage(), e);
            return ApiResponse.error("Refund processing error: " + e.getUserMessage());
        } catch (Exception e) {
            log.error("Unexpected refund error: {}", e.getMessage(), e);
            return ApiResponse.error("Refund processing failed: " + e.getMessage());
        }
    }
}