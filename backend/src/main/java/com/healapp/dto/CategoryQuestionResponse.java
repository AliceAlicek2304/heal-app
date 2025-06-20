package com.healapp.dto;

import lombok.Data;

@Data
public class CategoryQuestionResponse {
    private Long categoryQuestionId;
    private String name;
    private String description;
}