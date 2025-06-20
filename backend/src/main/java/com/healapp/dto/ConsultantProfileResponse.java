package com.healapp.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class ConsultantProfileResponse {
    private Long profileId;
    private Long userId;
    private String fullName;
    private String email;
    private String phone;
    private String avatar;
    private String qualifications;
    private String experience;
    private String bio;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private String gender;
}