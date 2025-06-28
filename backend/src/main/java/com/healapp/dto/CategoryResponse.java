package com.healapp.dto;

import com.healapp.model.BlogPostStatus;
import com.healapp.model.Category;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CategoryResponse {
    private Long categoryId;
    private String name;
    private String description;
    private Long postCount;

    // Constructor từ Category entity
    public CategoryResponse(Category category) {
        this.categoryId = category.getCategoryId();
        this.name = category.getName();
        this.description = category.getDescription();
        
        // Chỉ đếm bài viết có trạng thái CONFIRMED
        if (category.getPosts() != null) {
            this.postCount = category.getPosts().stream()
                    .filter(post -> BlogPostStatus.CONFIRMED.equals(post.getStatus()))
                    .count();
        } else {
            this.postCount = 0L;
        }
    }
}