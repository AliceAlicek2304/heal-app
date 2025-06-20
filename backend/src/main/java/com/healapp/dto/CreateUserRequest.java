package com.healapp.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

import java.time.LocalDate;

@Data
public class CreateUserRequest {
    @NotBlank(message = "Username is required")
    @Size(min = 4, max = 50, message = "Username must be between 4 and 50 characters")
    private String username;

    @NotBlank(message = "Password is required")
    @Size(min = 6, max = 100, message = "Password must be between 6 and 100 characters")
    private String password;

    @NotBlank(message = "Full name is required")
    @Size(max = 100, message = "Full name must not exceed 100 characters")
    private String fullName;

    @NotBlank(message = "Email is required")
    @Email(message = "Email is invalid")
    private String email;

    private String phone;

    private LocalDate birthDay;

    @NotBlank(message = "Gender is required")
    @Pattern(regexp = "^(Nam|Nữ|Khác)$", message = "Gender must be: Nam, Nữ, or Khác")
    private String gender;

    @NotBlank(message = "Role is required")
    private String role; // USER, CONSULTANT, ADMIN
}
