package com.healapp.model;

public enum ConsultationStatus {
    PENDING,
    CONFIRMED,
    CANCELED,
    COMPLETED,
    PAYMENT_PENDING, // Đang chờ thanh toán
    PAYMENT_FAILED // Thanh toán thất bại
}