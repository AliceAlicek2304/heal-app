package com.healapp.dto;

import lombok.Data;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

@Data
public class PhoneVerificationRequest {
    
    @NotBlank(message = "Phone number is required")
    @Pattern(regexp = "^[+]?[0-9\\s\\-\\.]{10,15}$", message = "Invalid phone number format")
    private String phone;
}
