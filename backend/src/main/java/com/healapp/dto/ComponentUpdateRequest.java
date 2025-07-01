package com.healapp.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ComponentUpdateRequest {
    
    @NotBlank(message = "Test name is required")
    private String testName;
    
    @NotBlank(message = "Reference range is required")
    private String referenceRange;
    
    private String unit;
    
    @NotNull(message = "Status is required")
    private Boolean status = true;
} 