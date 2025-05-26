package com.healapp.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class AIAssistantRequest {
    
    @NotBlank(message = "Question cannot be blank")
    @Size(min = 3, max = 1000, message = "Question must be between 3 and 1000 characters")
    private String userQuestion;
}