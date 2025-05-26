package com.healapp.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ConsultantProfileRequest {
    @NotBlank(message = "Qualifications is required")
    private String qualifications;
    
    @NotBlank(message = "Experience is required")
    private String experience;
    
    @NotBlank(message = "Bio is required")
    private String bio;
}