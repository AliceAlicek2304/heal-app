package com.healapp.dto;

import java.util.ArrayList;
import java.util.List;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

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

    private String existingThumbnail;

    public String getExistingThumbnail() {
        return existingThumbnail;
    }
    public void setExistingThumbnail(String existingThumbnail) {
        this.existingThumbnail = existingThumbnail;
    }
}