package com.healapp.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ConsultantProfileRequest {
    @NotBlank(message = "Qualifications is required")
    @Size(max = 1000, message = "Qualifications must not exceed 1000 characters")
    private String qualifications;
    
    @NotBlank(message = "Experience is required")
    @Size(max = 1000, message = "Experience must not exceed 1000 characters")
    private String experience;
    
    @NotBlank(message = "Bio is required")
    @Size(max = 2000, message = "Bio must not exceed 2000 characters")
    private String bio;
}