package com.healapp.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.ArrayList;
import java.util.List;

@Data
public class BlogPostRequest {

    @NotBlank(message = "Title is required")
    private String title;

    @NotBlank(message = "Content is required")
    private String content;
    
    private String thumbnailImage;

    @NotNull(message = "Category ID is required")
    private Long categoryId;
    
    private List<BlogSectionRequest> sections = new ArrayList<>();
}