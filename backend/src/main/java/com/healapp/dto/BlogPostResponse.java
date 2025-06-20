package com.healapp.dto;

import com.healapp.model.BlogPostStatus;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
public class BlogPostResponse {
    private Long id;
    private String title;
    private String content;
    private String thumbnailImage;
    private Long categoryId;
    private String categoryName;
    private Long authorId;
    private String authorName;
    private String authorAvatar;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private BlogPostStatus status;    private Long reviewerId;
    private String reviewerName;
    private LocalDateTime reviewedAt;
    private String rejectionReason;
    private List<BlogSectionResponse> sections = new ArrayList<>();
}