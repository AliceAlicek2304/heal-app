package com.healapp.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class AdminResetPasswordRequest {
    @NotBlank(message = "New password is required")
    @Size(min = 6, max = 100, message = "Password must be between 6 and 100 characters")
    private String newPassword;

    private String reason; // Optional reason for password reset
}
