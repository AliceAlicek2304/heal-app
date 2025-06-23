package com.healapp.dto;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import com.healapp.model.BlogPostStatus;

import lombok.Data;

@Data
public class BlogPostResponse {
    private Long id;
    private String title;
    private String content;
    private String thumbnailImage;
    private String existingThumbnail;
    private Long categoryId;
    private String categoryName;
    private Long authorId;
    private String authorName;
    private String authorAvatar;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private BlogPostStatus status;
    private Long reviewerId;
    private String reviewerName;
    private LocalDateTime reviewedAt;
    private String rejectionReason;
    private List<BlogSectionResponse> sections = new ArrayList<>();

    public String getExistingThumbnail() {
        return existingThumbnail;
    }

    public void setExistingThumbnail(String existingThumbnail) {
        this.existingThumbnail = existingThumbnail;
    }

    // Đảm bảo luôn trả về existingThumbnail nếu thumbnailImage null (giúp frontend hiển thị đúng ảnh cũ)
    public String getDisplayThumbnail() {
        return thumbnailImage != null ? thumbnailImage : existingThumbnail;
    }
}