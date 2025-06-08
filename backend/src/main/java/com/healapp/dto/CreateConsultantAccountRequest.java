package com.healapp.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class CreateConsultantAccountRequest {

    @NotBlank(message = "Full name is required")
    @Size(max = 100, message = "Full name must not exceed 100 characters")
    private String fullName;

    @NotBlank(message = "Email is required")
    @Email(message = "Email should be valid")
    private String email;

    @NotBlank(message = "Username is required")
    @Size(min = 3, max = 20, message = "Username must be between 3 and 20 characters")
    private String username;

    @Size(max = 15, message = "Phone must not exceed 15 characters")
    private String phone;

    private LocalDate birthDay;

    @Pattern(regexp = "^(Nam|Nữ|Khác)$", message = "Giới tính phải là: Nam, Nữ, hoặc Khác")
    private String gender;

    @Size(max = 500, message = "Qualifications must not exceed 500 characters")
    private String qualifications;

    @Size(max = 200, message = "Experience must not exceed 200 characters")
    private String experience;

    @Size(max = 1000, message = "Bio must not exceed 1000 characters")
    private String bio;
}