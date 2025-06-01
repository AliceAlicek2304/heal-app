package com.healapp.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;

import com.healapp.model.Role;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class LoginResponse {
    private Long userId;
    private String username;
    private String fullName;
    private String email;
    private String avatar;
    private String role;
    private LocalDate birthDay;
    private String phone;
}