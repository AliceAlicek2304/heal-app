package com.healapp.exception;

public class PaymentException extends RuntimeException {
    public PaymentException(String message) {
        super(message);
    }

    public PaymentException(String message, Throwable cause) {
        super(message, cause);
    }

    public PaymentException(String paymentMethod, String errorDetail) {
        super(String.format("Payment failed [%s]: %s", paymentMethod, errorDetail));
    }
}