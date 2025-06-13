package com.healapp.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserResponse {
    private Long id;
    private String fullName;
    private LocalDate birthDay;
    private String gender;
    private String phone;
    private Boolean isPhoneVerified; // Thêm trường này để hiển thị trạng thái xác thực
    private String email;
    private String username;
    private String avatar;
    private Boolean isActive;
    private String role;
    private LocalDateTime createdDate;
}