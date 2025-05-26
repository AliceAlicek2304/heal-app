package com.healapp.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CategoryQuestionRequest {
    @NotBlank(message = "Category name is required")
    private String name;

    private String description;
}