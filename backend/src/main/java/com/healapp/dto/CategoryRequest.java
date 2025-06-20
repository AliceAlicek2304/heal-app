package com.healapp.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class CategoryRequest {

    @NotBlank(message = "Category name is requiredg")
    @Size(min = 3, max = 100, message = "Tên danh mục phải từ 3-100 ký tự")
    private String name;

    @Size(max = 500, message = "Description must not exceed 500 characters")
    private String description;
}