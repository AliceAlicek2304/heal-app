package com.healapp.dto;

import jakarta.validation.constraints.*;
import lombok.Data;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;

@Data
public class RegisterRequest {
    @NotBlank(message = "Username is required")
    @Size(min = 4, max = 50, message = "Username must be between 4 and 50 characters")
    private String username;

    @NotBlank(message = "Password is required")
    @Size(min = 6, max = 100, message = "Password must be between 6 and 100 characters")
    @Pattern(regexp = "^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[@#$%^&+=]).*$", message = "Password must contain at least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character")
    private String password;

    @NotBlank(message = "Full name is required")
    @Size(max = 100, message = "Full name must not exceed 100 characters")
    private String fullName;

    @NotBlank(message = "Email is required")
    @Email(message = "Email is invalid")
    private String email;

    private String phone;

    private LocalDate birthDay;

    @NotBlank(message = "Giới tính không được để trống")
    @Pattern(regexp = "^(Nam|Nữ|Khác)$", message = "Giới tính phải là: Nam, Nữ, hoặc Khác")
    private String gender;

    private MultipartFile avatar;

    @NotBlank(message = "Verification code is required")
    private String verificationCode;
}