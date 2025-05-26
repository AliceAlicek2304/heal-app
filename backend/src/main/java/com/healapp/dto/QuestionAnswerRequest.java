package com.healapp.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class QuestionAnswerRequest {
    @NotBlank(message = "Answer is required")
    private String answer;
}