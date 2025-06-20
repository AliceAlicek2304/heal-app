package com.healapp.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class QuestionRequest {

    @NotBlank(message = "Question content is required")
    private String content;

    @NotNull(message = "Category is required")
    private Long categoryQuestionId;
}